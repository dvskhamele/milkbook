/**
 * MilkRecord - Shift Reconciliation Engine
 * Auto-calculates expected vs actual, detects variance
 */

(function() {
  'use strict';

  window.ShiftReconciliation = {
    // Calculate shift summary
    calculateShiftSummary: function(shiftDate, shiftName) {
      const today = shiftDate || new Date().toISOString().split('T')[0];
      
      // Get milk collections
      const collections = JSON.parse(localStorage.getItem('milkapp_entries_v2') || '[]');
      const todayCollections = collections.filter(e => e.day === today && e.session?.toLowerCase() === shiftName?.toLowerCase());
      
      const milkCollected = todayCollections.reduce((sum, e) => sum + (parseFloat(e.qty) || 0), 0);
      const cowMilk = todayCollections.filter(e => e.animal === 'cow').reduce((sum, e) => sum + (parseFloat(e.qty) || 0), 0);
      const buffMilk = todayCollections.filter(e => e.animal === 'buffalo').reduce((sum, e) => sum + (parseFloat(e.qty) || 0), 0);
      
      // Get production batches
      const batches = JSON.parse(localStorage.getItem('mr_production_batches') || '[]');
      const todayBatches = batches.filter(b => {
        const batchDate = b.created_at?.split('T')[0];
        return batchDate === today;
      });
      
      const milkConverted = todayBatches.reduce((sum, b) => sum + (parseFloat(b.milk_quantity) || 0), 0);
      const productsProduced = todayBatches.map(b => ({
        type: b.product_type,
        quantity: b.product_quantity,
        milkUsed: b.milk_quantity
      }));
      
      // Get sales
      const sales = JSON.parse(localStorage.getItem('mr_sales_history') || '[]');
      const todaySales = sales.filter(s => {
        const saleDate = s.createdAt?.split('T')[0] || s.date;
        return saleDate === today;
      });
      
      const milkSoldRaw = todaySales.filter(s => s.items?.some(i => i.name?.includes('Milk'))).reduce((sum, s) => {
        const milkItems = s.items.filter(i => i.name?.includes('Milk'));
        return sum + milkItems.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0);
      }, 0);
      
      const productsSold = todaySales.filter(s => !s.items?.some(i => i.name?.includes('Milk'))).reduce((sum, s) => {
        const nonMilkItems = s.items.filter(i => !i.name?.includes('Milk'));
        return sum + nonMilkItems.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0);
      }, 0);
      
      // Calculate expected
      const expectedMilkLeft = milkCollected - milkConverted - milkSoldRaw;
      
      // Calculate expected product yield
      const expectedProducts = todayBatches.map(b => {
        const ratio = parseFloat(b.conversion_ratio) || 5;
        const expected = b.milk_quantity / ratio;
        const actual = b.product_quantity;
        const variance = actual - expected;
        const variancePercent = ((variance / expected) * 100);
        
        return {
          type: b.product_type,
          expected: expected,
          actual: actual,
          variance: variance,
          variancePercent: variancePercent,
          milkUsed: b.milk_quantity
        };
      });
      
      return {
        shiftDate: today,
        shiftName: shiftName || 'All',
        milk: {
          collected: milkCollected,
          cow: cowMilk,
          buff: buffMilk,
          converted: milkConverted,
          soldRaw: milkSoldRaw,
          expectedLeft: expectedMilkLeft
        },
        products: {
          produced: productsProduced,
          sold: productsSold,
          yieldAnalysis: expectedProducts
        },
        financial: {
          totalPayout: todayCollections.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
          totalSales: todaySales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0)
        }
      };
    },
    
    // Show reconciliation popup
    showReconciliation: function(shiftDate, shiftName) {
      const summary = this.calculateShiftSummary(shiftDate, shiftName);
      
      const html = `
        <div class="overlay" id="reconciliationOverlay" style="display:flex;align-items:center;justify-content:center;z-index:99999;">
          <div class="modal" style="width:95vw;max-width:600px;max-height:90vh;overflow-y:auto;">
            <div class="panelHeader" style="background:#dc2626;color:white;">
              <span>🔄 ${summary.shiftName} Shift Reconciliation - ${summary.shiftDate}</span>
              <button onclick="document.getElementById('reconciliationOverlay').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:white;">✖</button>
            </div>
            <div style="padding:20px;">
              
              <!-- Milk Summary -->
              <div style="background:#eff6ff;padding:16px;border-radius:12px;border:2px solid #3b82f6;margin-bottom:16px;">
                <div style="font-size:14px;font-weight:900;color:#1e3a8a;margin-bottom:12px;">🥛 Milk Summary</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                  <div style="background:white;padding:12px;border-radius:8px;">
                    <div style="font-size:11px;color:#64748b;">Collected</div>
                    <div style="font-size:20px;font-weight:900;color:#1e3a8a;">${summary.milk.collected.toFixed(1)} L</div>
                    <div style="font-size:10px;color:#64748b;">🥛 ${summary.milk.cow.toFixed(1)}L | 🐃 ${summary.milk.buff.toFixed(1)}L</div>
                  </div>
                  <div style="background:white;padding:12px;border-radius:8px;">
                    <div style="font-size:11px;color:#64748b;">Converted</div>
                    <div style="font-size:20px;font-weight:900;color:#7c3aed;">${summary.milk.converted.toFixed(1)} L</div>
                  </div>
                  <div style="background:white;padding:12px;border-radius:8px;">
                    <div style="font-size:11px;color:#64748b;">Sold Raw</div>
                    <div style="font-size:20px;font-weight:900;color:#059669;">${summary.milk.soldRaw.toFixed(1)} L</div>
                  </div>
                  <div style="background:white;padding:12px;border-radius:8px;">
                    <div style="font-size:11px;color:#64748b;">Expected Left</div>
                    <div style="font-size:20px;font-weight:900;color:#0284c7;">${summary.milk.expectedLeft.toFixed(1)} L</div>
                  </div>
                </div>
                
                <div style="margin-top:12px;padding:12px;background:#fef2f2;border:2px solid #fca5a5;border-radius:8px;">
                  <div style="font-size:11px;font-weight:700;color:#991b1b;margin-bottom:8px;">📊 Physical Stock Count</div>
                  <div style="display:flex;gap:12px;align-items:center;">
                    <input type="number" id="actualMilkLeft" placeholder="Enter actual milk left" 
                      style="flex:1;padding:10px;border:2px solid #e2e8f0;border-radius:8px;font-weight:700;font-size:14px;" />
                    <button type="button" onclick="calculateMilkVariance()" 
                      style="padding:10px 20px;background:#dc2626;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Calculate</button>
                  </div>
                  <div id="milkVarianceResult" style="margin-top:8px;font-size:12px;font-weight:700;"></div>
                </div>
              </div>
              
              <!-- Product Yield Analysis -->
              <div style="background:#fef3c7;padding:16px;border-radius:12px;border:2px solid #f59e0b;margin-bottom:16px;">
                <div style="font-size:14px;font-weight:900;color:#92400e;margin-bottom:12px;">🧀 Product Yield Analysis</div>
                ${summary.products.yieldAnalysis.map(p => `
                  <div style="background:white;padding:12px;border-radius:8px;margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                      <span style="font-size:13px;font-weight:700;color:#1e293b;text-transform:capitalize;">${p.type}</span>
                      <span style="font-size:11px;color:#64748b;">${p.milkUsed.toFixed(1)}L milk used</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
                      <div>
                        <div style="font-size:10px;color:#64748b;">Expected</div>
                        <div style="font-size:16px;font-weight:900;color:#16a34a;">${p.expected.toFixed(2)} kg</div>
                      </div>
                      <div>
                        <div style="font-size:10px;color:#64748b;">Actual</div>
                        <div style="font-size:16px;font-weight:900;color:#2563eb;">${p.actual.toFixed(2)} kg</div>
                      </div>
                      <div>
                        <div style="font-size:10px;color:#64748b;">Variance</div>
                        <div style="font-size:16px;font-weight:900;color:${p.variance >= 0 ? '#16a34a' : '#dc2626'};">
                          ${p.variance >= 0 ? '+' : ''}${p.variance.toFixed(2)} kg (${p.variancePercent.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                    ${Math.abs(p.variancePercent) > 5 ? `
                      <div style="margin-top:8px;padding:8px;background:#fee2e2;border-radius:6px;font-size:11px;color:#991b1b;font-weight:700;">
                        ⚠️ High variance detected! Possible causes: Temperature loss, Whey loss, Measurement error
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
              
              <!-- Financial Summary -->
              <div style="background:#f0fdf4;padding:16px;border-radius:12px;border:2px solid #16a34a;">
                <div style="font-size:14px;font-weight:900;color:#15803d;margin-bottom:12px;">💰 Financial Summary</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                  <div style="background:white;padding:12px;border-radius:8px;">
                    <div style="font-size:11px;color:#64748b;">Total Payout to Farmers</div>
                    <div style="font-size:20px;font-weight:900;color:#dc2626;">₹${summary.financial.totalPayout.toFixed(0)}</div>
                  </div>
                  <div style="background:white;padding:12px;border-radius:8px;">
                    <div style="font-size:11px;color:#64748b;">Total Sales Revenue</div>
                    <div style="font-size:20px;font-weight:900;color:#16a34a;">₹${summary.financial.totalSales.toFixed(0)}</div>
                  </div>
                </div>
                <div style="margin-top:12px;padding:12px;background:#fef3c7;border-radius:8px;text-align:center;">
                  <div style="font-size:11px;color:#92400e;margin-bottom:4px;">Gross Margin (Today)</div>
                  <div style="font-size:24px;font-weight:900;color:${summary.financial.totalSales - summary.financial.totalPayout >= 0 ? '#16a34a' : '#dc2626'};">
                    ₹${(summary.financial.totalSales - summary.financial.totalPayout).toFixed(0)}
                  </div>
                </div>
              </div>
              
              <!-- Actions -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px;">
                <button type="button" onclick="exportShiftReport()" 
                  style="padding:14px;background:#3b82f6;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;">📊 Export Report</button>
                <button type="button" onclick="document.getElementById('reconciliationOverlay').remove()" 
                  style="padding:14px;background:#f1f5f9;color:#64748b;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;">Close</button>
              </div>
              
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', html);
      
      // Add global functions for the popup
      window.calculateMilkVariance = function() {
        const actual = parseFloat(document.getElementById('actualMilkLeft').value) || 0;
        const expected = summary.milk.expectedLeft;
        const variance = actual - expected;
        const variancePercent = ((variance / expected) * 100);
        
        const resultEl = document.getElementById('milkVarianceResult');
        resultEl.innerHTML = `
          Variance: <span style="color:${variance >= 0 ? '#16a34a' : '#dc2626'};">
            ${variance >= 0 ? '+' : ''}${variance.toFixed(1)} L (${variancePercent.toFixed(1)}%)
          </span>
          ${Math.abs(variancePercent) > 2 ? '<br/>⚠️ High variance - investigate immediately!' : ''}
        `;
      };
      
      window.exportShiftReport = function() {
        const csv = [
          ['Shift Reconciliation Report', summary.shiftName, summary.shiftDate],
          [],
          ['Milk Summary'],
          ['Collected', summary.milk.collected.toFixed(2), 'L'],
          ['Converted', summary.milk.converted.toFixed(2), 'L'],
          ['Sold Raw', summary.milk.soldRaw.toFixed(2), 'L'],
          ['Expected Left', summary.milk.expectedLeft.toFixed(2), 'L'],
          [],
          ['Financial Summary'],
          ['Total Payout', summary.financial.totalPayout.toFixed(2)],
          ['Total Sales', summary.financial.totalSales.toFixed(2)],
          ['Gross Margin', (summary.financial.totalSales - summary.financial.totalPayout).toFixed(2)]
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shift-report-${summary.shiftDate}-${summary.shiftName}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('📊 Report exported!');
      };
    }
  };

  console.log('✅ Shift Reconciliation Engine loaded');

})();
