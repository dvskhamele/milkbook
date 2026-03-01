/**
 * MilkRecord - Expected Yield Calculator
 * Auto-calculates expected paneer/ghee/curd from milk composition
 */

(function() {
  'use strict';

  window.YieldCalculator = {
    // Standard yield ratios (per 100L milk)
    standards: {
      paneer: {
        buffalo: { fat: 6.0, snf: 9.0, yield: 22.0 },  // 22kg per 100L
        cow: { fat: 4.0, snf: 8.5, yield: 17.0 }        // 17kg per 100L
      },
      ghee: {
        buffalo: { fat: 6.0, yield: 5.4 },               // 5.4kg per 100L
        cow: { fat: 4.0, yield: 3.5 }                    // 3.5kg per 100L
      },
      curd: {
        buffalo: { snf: 9.0, yield: 100.0 },             // 1:1 ratio
        cow: { snf: 8.5, yield: 100.0 }
      }
    },
    
    // Calculate expected paneer yield
    calculatePaneerYield: function(milkType, fat, snf, quantity) {
      const standard = this.standards.paneer[milkType];
      if (!standard) return null;
      
      // Adjust yield based on actual fat/snf
      const fatFactor = fat / standard.fat;
      const snfFactor = snf / standard.snf;
      const adjustmentFactor = (fatFactor + snfFactor) / 2;
      
      const expectedYield = (standard.yield / 100) * quantity * adjustmentFactor;
      
      return {
        expected: expectedYield,
        standard: standard.yield,
        efficiency: adjustmentFactor * 100
      };
    },
    
    // Calculate expected ghee yield
    calculateGheeYield: function(milkType, fat, quantity) {
      const standard = this.standards.ghee[milkType];
      if (!standard) return null;
      
      const fatFactor = fat / standard.fat;
      const expectedYield = (standard.yield / 100) * quantity * fatFactor;
      
      return {
        expected: expectedYield,
        standard: standard.yield,
        efficiency: fatFactor * 100
      };
    },
    
    // Show yield alert if variance is high
    checkYieldVariance: function(productType, milkType, fat, snf, milkQty, actualYield) {
      let expectedData;
      
      if (productType === 'paneer') {
        expectedData = this.calculatePaneerYield(milkType, fat, snf, milkQty);
      } else if (productType === 'ghee') {
        expectedData = this.calculateGheeYield(milkType, fat, milkQty);
      } else {
        return null; // Curd is 1:1, no calculation needed
      }
      
      if (!expectedData) return null;
      
      const variance = actualYield - expectedData.expected;
      const variancePercent = ((variance / expectedData.expected) * 100);
      
      // Show alert if variance > 5%
      if (Math.abs(variancePercent) > 5) {
        return {
          expected: expectedData.expected,
          actual: actualYield,
          variance: variance,
          variancePercent: variancePercent,
          loss: Math.max(0, -variance),
          lossValue: Math.max(0, -variance) * (productType === 'paneer' ? 320 : 600),
          causes: this.getPossibleCauses(variancePercent)
        };
      }
      
      return null; // Variance is acceptable
    },
    
    // Get possible causes for variance
    getPossibleCauses: function(variancePercent) {
      if (variancePercent < -10) {
        return ['High whey loss', 'Temperature variance', 'Possible theft', 'Measurement error'];
      } else if (variancePercent < -5) {
        return ['Temperature variance', 'Whey loss', 'Measurement error'];
      } else if (variancePercent > 10) {
        return ['Measurement error', 'Added solids', 'Data entry error'];
      } else if (variancePercent > 5) {
        return ['Measurement variance', 'Good efficiency'];
      }
      return [];
    },
    
    // Show yield popup
    showYieldAlert: function(alertData, productType) {
      const html = `
        <div class="overlay" id="yieldAlertOverlay" style="display:flex;align-items:center;justify-content:center;z-index:99999;">
          <div class="mobile-modal" style="width:95vw;max-width:400px;">
            <div class="modal-header" style="background:${alertData.variancePercent < 0 ? '#fee2e2' : '#fef3c7'};">
              <div class="modal-title" style="color:${alertData.variancePercent < 0 ? '#991b1b' : '#92400e'};">
                ${alertData.variancePercent < 0 ? '⚠️ Yield Loss Detected' : 'ℹ️ Yield Variance'}
              </div>
              <button class="modal-close" onclick="document.getElementById('yieldAlertOverlay').remove()">✖</button>
            </div>
            <div class="modal-body">
              <div style="text-align:center;margin-bottom:16px;">
                <div style="font-size:32px;margin-bottom:8px;">${alertData.variancePercent < 0 ? '📉' : '📊'}</div>
                <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:4px;">${productType.toUpperCase()}</div>
              </div>
              
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
                <div style="background:#f0fdf4;padding:12px;border-radius:8px;text-align:center;">
                  <div style="font-size:10px;color:#64748b;margin-bottom:4px;">Expected</div>
                  <div style="font-size:18px;font-weight:900;color:#16a34a;">${alertData.expected.toFixed(2)} kg</div>
                </div>
                <div style="background:#fef2f2;padding:12px;border-radius:8px;text-align:center;">
                  <div style="font-size:10px;color:#64748b;margin-bottom:4px;">Actual</div>
                  <div style="font-size:18px;font-weight:900;color:${alertData.variancePercent < 0 ? '#dc2626' : '#16a34a'};">
                    ${alertData.actual.toFixed(2)} kg
                  </div>
                </div>
              </div>
              
              <div style="background:${alertData.variancePercent < 0 ? '#fee2e2' : '#fef3c7'};padding:12px;border-radius:8px;margin-bottom:16px;">
                <div style="font-size:11px;font-weight:700;color:${alertData.variancePercent < 0 ? '#991b1b' : '#92400e'};margin-bottom:8px;">
                  Variance: ${alertData.variancePercent.toFixed(1)}%
                </div>
                ${alertData.lossValue > 0 ? `
                  <div style="font-size:12px;color:#991b1b;font-weight:700;">
                    Loss: ${alertData.loss.toFixed(2)} kg (₹${alertData.lossValue.toFixed(0)})
                  </div>
                ` : ''}
              </div>
              
              ${alertData.causes.length > 0 ? `
                <div style="background:#f8fafc;padding:12px;border-radius:8px;margin-bottom:16px;">
                  <div style="font-size:11px;font-weight:700;color:#475569;margin-bottom:8px;">Possible Causes:</div>
                  <ul style="margin:0;padding-left:16px;font-size:11px;color:#64748b;line-height:1.6;">
                    ${alertData.causes.map(c => `<li>${c}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              
              <button type="button" onclick="document.getElementById('yieldAlertOverlay').remove()" 
                style="width:100%;padding:14px;background:#16a34a;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;">
                OK, I'll Investigate
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', html);
    }
  };

  console.log('✅ Yield Calculator loaded');

})();
