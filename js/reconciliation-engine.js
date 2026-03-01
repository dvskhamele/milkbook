/**
 * MilkRecord POS - Shift Management & Reconciliation Engine
 * Anti-theft, minimal entry, maximum insight
 */

(function() {
  'use strict';

  // ============================================
  // SHIFT MANAGEMENT
  // ============================================

  class ShiftManager {
    constructor() {
      this.currentShift = null;
      this.varianceThresholds = {
        milk: 2.0, // 2%
        cash: 1.0, // 1%
        product: 3.0 // 3%
      };
    }

    // Start new shift
    async startShift(shopId, shiftData) {
      try {
        const response = await fetch('/api/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shop_id: shopId,
            shift_name: shiftData.shiftName,
            shift_date: shiftData.shiftDate,
            opening_milk_cow: shiftData.openingMilkCow || 0,
            opening_milk_buff: shiftData.openingMilkBuff || 0,
            opening_cash: shiftData.openingCash || 0
          })
        });

        const result = await response.json();
        
        if (result.success) {
          this.currentShift = result.shift;
          localStorage.setItem('currentShift', JSON.stringify(result.shift));
          console.log('✅ Shift started:', result.shift.id);
          return { success: true, shift: result.shift };
        } else {
          console.error('❌ Failed to start shift:', result.error);
          return { success: false, error: result.error };
        }
      } catch (error) {
        console.error('❌ Shift start error:', error);
        return { success: false, error: error.message };
      }
    }

    // End shift with reconciliation
    async endShift(shiftId, reconciliationData) {
      try {
        const response = await fetch(`/api/shifts/${shiftId}/close`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reconciliationData)
        });

        const result = await response.json();
        
        if (result.success) {
          this.currentShift = null;
          localStorage.removeItem('currentShift');
          console.log('✅ Shift ended:', shiftId);
          return { success: true, reconciliation: result.reconciliation };
        } else {
          console.error('❌ Failed to end shift:', result.error);
          return { success: false, error: result.error };
        }
      } catch (error) {
        console.error('❌ Shift end error:', error);
        return { success: false, error: error.message };
      }
    }

    // Get current shift
    getCurrentShift() {
      const stored = localStorage.getItem('currentShift');
      if (stored) {
        this.currentShift = JSON.parse(stored);
      }
      return this.currentShift;
    }

    // Calculate variance
    calculateVariance(expected, actual) {
      const variance = actual - expected;
      const variancePercent = expected > 0 ? (variance / expected) * 100 : 0;
      return {
        variance: parseFloat(variance.toFixed(2)),
        variancePercent: parseFloat(variancePercent.toFixed(2)),
        isWithinThreshold: Math.abs(variancePercent) <= this.varianceThresholds.milk
      };
    }

    // Check if shift can close
    canCloseShift(reconciliation) {
      const milkVariance = this.calculateVariance(
        reconciliation.expectedMilkClosing,
        reconciliation.actualMilkClosing
      );

      const cashVariance = this.calculateVariance(
        reconciliation.expectedClosingCash,
        reconciliation.actualClosingCash
      );

      const issues = [];

      if (!milkVariance.isWithinThreshold) {
        issues.push(`Milk variance: ${milkVariance.variancePercent}% (limit: ${this.varianceThresholds.milk}%)`);
      }

      if (!cashVariance.isWithinThreshold) {
        issues.push(`Cash variance: ${cashVariance.variancePercent}% (limit: ${this.varianceThresholds.cash}%)`);
      }

      return {
        canClose: issues.length === 0,
        issues: issues,
        milkVariance: milkVariance,
        cashVariance: cashVariance
      };
    }
  }

  // ============================================
  // CONVERSION BATCH MANAGER
  // ============================================

  class ConversionManager {
    constructor() {
      this.standardRatios = {
        paneer: 5.0, // 5L milk → 1kg paneer
        ghee: 25.0,  // 25L milk → 1kg ghee
        curd: 1.0,   // 1L milk → 1kg curd
        sweets: 8.0  // 8L milk → 1kg sweets
      };
    }

    // Create conversion batch
    async createBatch(conversionData) {
      try {
        const response = await fetch('/api/conversion-batches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conversionData)
        });

        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Conversion batch created:', result.batch.id);
          return { success: true, batch: result.batch };
        } else {
          console.error('❌ Failed to create batch:', result.error);
          return { success: false, error: result.error };
        }
      } catch (error) {
        console.error('❌ Conversion error:', error);
        return { success: false, error: error.message };
      }
    }

    // Calculate expected ratio
    getExpectedRatio(productType) {
      return this.standardRatios[productType.toLowerCase()] || 5.0;
    }

    // Calculate variance from expected
    calculateVariance(actualRatio, productType) {
      const expected = this.getExpectedRatio(productType);
      const variance = ((actualRatio - expected) / expected) * 100;
      return {
        expected: expected,
        actual: actualRatio,
        variancePercent: parseFloat(variance.toFixed(2))
      };
    }
  }

  // ============================================
  // ANALYTICS ENGINE
  // ============================================

  class AnalyticsEngine {
    constructor() {
      this.farmerYields = new Map();
    }

    // Track farmer milk quality
    trackFarmerMilk(farmerId, farmerName, quantity, fat, snf) {
      if (!this.farmerYields.has(farmerId)) {
        this.farmerYields.set(farmerId, {
          farmerId: farmerId,
          farmerName: farmerName,
          totalQuantity: 0,
          totalFat: 0,
          totalSnf: 0,
          count: 0
        });
      }

      const data = this.farmerYields.get(farmerId);
      data.totalQuantity += quantity;
      data.totalFat += fat;
      data.totalSnf += snf;
      data.count++;
    }

    // Get farmer quality score
    getFarmerQualityScore(farmerId) {
      const data = this.farmerYields.get(farmerId);
      if (!data || data.count === 0) return 0;

      const avgFat = data.totalFat / data.count;
      const avgSnf = data.totalSnf / data.count;

      // Quality score: FAT weight 60%, SNF weight 40%
      // Assuming ideal: FAT 6.0%, SNF 9.0%
      const fatScore = Math.min(100, (avgFat / 6.0) * 60);
      const snfScore = Math.min(100, (avgSnf / 9.0) * 40);

      return parseFloat((fatScore + snfScore).toFixed(2));
    }

    // Get farmer yield ranking
    getFarmerRankings() {
      const rankings = [];
      
      this.farmerYields.forEach((data, farmerId) => {
        rankings.push({
          farmerId: farmerId,
          farmerName: data.farmerName,
          avgFat: parseFloat((data.totalFat / data.count).toFixed(2)),
          avgSnf: parseFloat((data.totalSnf / data.count).toFixed(2)),
          qualityScore: this.getFarmerQualityScore(farmerId),
          totalMilk: parseFloat(data.totalQuantity.toFixed(2))
        });
      });

      return rankings.sort((a, b) => b.qualityScore - a.qualityScore);
    }

    // Calculate conversion efficiency
    calculateConversionEfficiency(milkUsed, productProduced, productType) {
      const actualRatio = milkUsed / productProduced;
      const expectedRatio = new ConversionManager().getExpectedRatio(productType);
      const efficiency = (expectedRatio / actualRatio) * 100;

      return {
        milkUsed: milkUsed,
        productProduced: productProduced,
        actualRatio: parseFloat(actualRatio.toFixed(2)),
        expectedRatio: expectedRatio,
        efficiency: parseFloat(efficiency.toFixed(2)),
        isEfficient: efficiency >= 95
      };
    }

    // Calculate product profitability
    calculateProductProfitability(productType, milkUsed, productQuantity, sellingPrice) {
      // Calculate milk cost (average purchase rate)
      const avgMilkRate = 64; // ₹/L (should come from database)
      const milkCost = milkUsed * avgMilkRate;
      const costPerUnit = milkCost / productQuantity;
      const revenue = productQuantity * sellingPrice;
      const profit = revenue - milkCost;
      const profitMargin = (profit / revenue) * 100;

      return {
        productType: productType,
        milkCost: parseFloat(milkCost.toFixed(2)),
        costPerUnit: parseFloat(costPerUnit.toFixed(2)),
        sellingPrice: sellingPrice,
        revenue: parseFloat(revenue.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(2))
      };
    }
  }

  // ============================================
  // DASHBOARD WIDGETS
  // ============================================

  class DashboardWidgets {
    // Show daily summary
    static showDailySummary(summary) {
      console.log('📊 Daily Summary:', summary);
      
      // Update dashboard DOM if exists
      const dashboardEl = document.getElementById('dailyDashboard');
      if (dashboardEl) {
        dashboardEl.innerHTML = `
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; padding:16px;">
            <div style="background:#f0fdf4; padding:16px; border-radius:12px; border:2px solid #16a34a;">
              <div style="font-size:12px; color:#166534; font-weight:700; margin-bottom:8px;">🥛 Milk</div>
              <div style="font-size:24px; font-weight:900; color:#15803d;">${summary.milkIn}L</div>
              <div style="font-size:11px; color:#166534; margin-top:4px;">
                Converted: ${summary.milkConverted}L | Left: ${summary.milkLeft}L
              </div>
            </div>
            
            <div style="background:#fef3c7; padding:16px; border-radius:12px; border:2px solid #f59e0b;">
              <div style="font-size:12px; color:#92400e; font-weight:700; margin-bottom:8px;">🧀 Products</div>
              <div style="font-size:24px; font-weight:900; color:#78350f;">${summary.productsProduced}kg</div>
              <div style="font-size:11px; color:#92400e; margin-top:4px;">
                Sold: ${summary.productsSold}kg | Left: ${summary.productsLeft}kg
              </div>
            </div>
            
            <div style="background:#eff6ff; padding:16px; border-radius:12px; border:2px solid #2563eb;">
              <div style="font-size:12px; color:#1e40af; font-weight:700; margin-bottom:8px;">💰 Revenue</div>
              <div style="font-size:24px; font-weight:900; color:#1e3a8a;">₹${summary.revenue}</div>
              <div style="font-size:11px; color:#1e40af; margin-top:4px;">
                Cost: ₹${summary.cost} | Margin: ₹${summary.margin}
              </div>
            </div>
          </div>
        `;
      }
    }

    // Show variance alert
    static showVarianceAlert(type, variance, threshold) {
      const alertEl = document.getElementById('varianceAlert');
      if (alertEl) {
        alertEl.innerHTML = `
          <div style="background:#fef2f2; padding:12px; border-radius:8px; border:2px solid #dc2626; margin:16px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:20px;">⚠️</span>
              <div>
                <div style="font-weight:700; color:#991b1b;">${type} Variance Detected</div>
                <div style="font-size:12px; color:#991b1b;">
                  Actual: ${variance}% | Threshold: ${threshold}%
                </div>
              </div>
            </div>
          </div>
        `;
        alertEl.style.display = 'block';
      }
    }
  }

  // ============================================
  // INITIALIZE
  // ============================================

  // Create global instances
  window.shiftManager = new ShiftManager();
  window.conversionManager = new ConversionManager();
  window.analyticsEngine = new AnalyticsEngine();
  window.DashboardWidgets = DashboardWidgets;

  console.log('✅ Reconciliation Engine loaded');
  console.log('📊 Shift Manager: Ready');
  console.log('🔄 Conversion Manager: Ready');
  console.log('📈 Analytics Engine: Ready');

})();
