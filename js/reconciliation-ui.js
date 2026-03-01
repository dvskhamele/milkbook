/**
 * MilkRecord POS - Reconciliation UI Components
 * Shift Management, Conversion 2.0, Analytics
 */

(function() {
  'use strict';

  // ============================================
  // SHIFT START POPUP
  // ============================================

  window.showShiftStartPopup = function(callback) {
    const html = `
      <div class="overlay" id="shiftStartOverlay" style="display:flex;align-items:center;justify-content:center;z-index:99999;">
        <div class="modal" style="width:450px;max-height:90vh;overflow-y:auto;">
          <div class="panelHeader" style="background:#16a34a;color:white;">
            <span>🌅 Start New Shift</span>
            <button onclick="closeShiftStartPopup()" style="background:none;border:none;font-size:24px;cursor:pointer;color:white;">✖</button>
          </div>
          <div style="padding:20px;display:flex;flex-direction:column;gap:16px;">
            
            <!-- Shift Info -->
            <div style="background:#f0fdf4;padding:12px;border-radius:8px;border:2px solid #16a34a;">
              <div style="font-size:12px;font-weight:700;color:#166534;margin-bottom:8px;">📋 Shift Details</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div>
                  <label style="font-size:10px;color:#64748b;font-weight:700;">Date</label>
                  <input type="date" id="shiftDate" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e2e8f0;font-weight:700;" />
                </div>
                <div>
                  <label style="font-size:10px;color:#64748b;font-weight:700;">Shift</label>
                  <select id="shiftName" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e2e8f0;font-weight:700;">
                    <option value="Morning">🌅 Morning</option>
                    <option value="Evening">🌆 Evening</option>
                    <option value="Night">🌙 Night</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Opening Balances -->
            <div style="background:#eff6ff;padding:12px;border-radius:8px;border:2px solid #3b82f6;">
              <div style="font-size:12px;font-weight:700;color:#1e40af;margin-bottom:12px;">💰 Opening Balances</div>
              
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                <div style="background:white;padding:10px;border-radius:6px;">
                  <label style="font-size:10px;color:#64748b;font-weight:700;">🥛 Cow Milk (L)</label>
                  <input type="number" id="openingMilkCow" value="0" step="0.1" style="width:100%;padding:8px;border-radius:6px;border:2px solid #3b82f6;font-weight:700;font-size:14px;" />
                </div>
                <div style="background:white;padding:10px;border-radius:6px;">
                  <label style="font-size:10px;color:#64748b;font-weight:700;">🐃 Buff Milk (L)</label>
                  <input type="number" id="openingMilkBuff" value="0" step="0.1" style="width:100%;padding:8px;border-radius:6px;border:2px solid #3b82f6;font-weight:700;font-size:14px;" />
                </div>
              </div>

              <div style="background:white;padding:10px;border-radius:6px;">
                <label style="font-size:10px;color:#64748b;font-weight:700;">💵 Cash (₹)</label>
                <input type="number" id="openingCash" value="0" step="100" style="width:100%;padding:8px;border-radius:6px;border:2px solid #16a34a;font-weight:700;font-size:14px;" />
              </div>
            </div>

            <!-- Info -->
            <div style="background:#fef3c7;padding:12px;border-radius:8px;border:1px solid #f59e0b;">
              <div style="font-size:11px;color:#92400e;line-height:1.5;">
                💡 <strong>Only 3 entries needed:</strong><br/>
                • Opening milk stock<br/>
                • Opening cash balance<br/>
                • Everything else auto-calculated
              </div>
            </div>

            <!-- Actions -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <button onclick="closeShiftStartPopup()" style="padding:12px;background:#f1f5f9;border:none;border-radius:8px;font-weight:700;cursor:pointer;color:#64748b;">Cancel</button>
              <button onclick="confirmShiftStart()" style="padding:12px;background:#16a34a;border:none;border-radius:8px;font-weight:700;cursor:pointer;color:white;">✅ Start Shift</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // Store callback
    window.shiftStartCallback = callback;
  };

  window.closeShiftStartPopup = function() {
    const overlay = document.getElementById('shiftStartOverlay');
    if (overlay) overlay.remove();
  };

  window.confirmShiftStart = async function() {
    const shiftData = {
      shiftDate: document.getElementById('shiftDate').value,
      shiftName: document.getElementById('shiftName').value,
      openingMilkCow: parseFloat(document.getElementById('openingMilkCow').value) || 0,
      openingMilkBuff: parseFloat(document.getElementById('openingMilkBuff').value) || 0,
      openingCash: parseFloat(document.getElementById('openingCash').value) || 0
    };

    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiftData)
      });

      const result = await response.json();

      if (result.success) {
        closeShiftStartPopup();
        showToast('✅ Shift started successfully!');
        if (window.shiftStartCallback) {
          window.shiftStartCallback(result.shift);
        }
      } else {
        showToast('❌ Failed to start shift: ' + result.error);
      }
    } catch (error) {
      showToast('❌ Error: ' + error.message);
    }
  };

  // ============================================
  // SHIFT END RECONCILIATION POPUP
  // ============================================

  window.showShiftEndPopup = function(shift, callback) {
    // Calculate expected values
    const expectedMilk = (shift.opening_milk_cow + shift.opening_milk_buff + shift.total_milk_collected) - shift.total_milk_converted - shift.total_milk_sold;
    const expectedCash = shift.opening_cash + shift.total_sales_amount;

    const html = `
      <div class="overlay" id="shiftEndOverlay" style="display:flex;align-items:center;justify-content:center;z-index:99999;">
        <div class="modal" style="width:500px;max-height:90vh;overflow-y:auto;">
          <div class="panelHeader" style="background:#dc2626;color:white;">
            <span>🌙 End Shift & Reconcile</span>
            <button onclick="closeShiftEndPopup()" style="background:none;border:none;font-size:24px;cursor:pointer;color:white;">✖</button>
          </div>
          <div style="padding:20px;display:flex;flex-direction:column;gap:16px;">
            
            <!-- Shift Summary -->
            <div style="background:#f8fafc;padding:16px;border-radius:12px;">
              <div style="font-size:14px;font-weight:900;color:#0f172a;margin-bottom:12px;">📊 ${shift.shift_name} Shift Summary</div>
              
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div style="background:#eff6ff;padding:12px;border-radius:8px;">
                  <div style="font-size:10px;color:#64748b;font-weight:700;">🥛 MILK COLLECTED</div>
                  <div style="font-size:20px;font-weight:900;color:#1e3a8a;">${shift.total_milk_collected || 0} L</div>
                </div>
                <div style="background:#fef3c7;padding:12px;border-radius:8px;">
                  <div style="font-size:10px;color:#64748b;font-weight:700;">🔄 CONVERTED</div>
                  <div style="font-size:20px;font-weight:900;color:#92400e;">${shift.total_milk_converted || 0} L</div>
                </div>
                <div style="background:#f0fdf4;padding:12px;border-radius:8px;">
                  <div style="font-size:10px;color:#64748b;font-weight:700;">💰 SALES</div>
                  <div style="font-size:20px;font-weight:900;color:#15803d;">₹${shift.total_sales_amount || 0}</div>
                </div>
                <div style="background:#f3e8ff;padding:12px;border-radius:8px;">
                  <div style="font-size:10px;color:#64748b;font-weight:700;">🧀 PRODUCTS</div>
                  <div style="font-size:16px;font-weight:900;color:#7e22ce;">Auto-calculated</div>
                </div>
              </div>
            </div>

            <!-- Expected vs Actual -->
            <div style="background:#fff1f2;padding:16px;border-radius:12px;border:2px solid #fb7185;">
              <div style="font-size:14px;font-weight:900;color:#9f1239;margin-bottom:12px;">⚠️ Reconciliation Required</div>
              
              <div style="background:white;padding:12px;border-radius:8px;margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                  <span style="font-size:12px;color:#64748b;font-weight:700;">Expected Milk Left:</span>
                  <span style="font-size:14px;font-weight:900;color:#1e3a8a;">${expectedMilk.toFixed(1)} L</span>
                </div>
                <div style="display:flex;justify-content:space-between;">
                  <span style="font-size:12px;color:#64748b;font-weight:700;">Expected Cash:</span>
                  <span style="font-size:14px;font-weight:900;color:#15803d;">₹${expectedCash.toFixed(0)}</span>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div>
                  <label style="font-size:10px;color:#9f1239;font-weight:700;">🥛 Actual Milk Left (L)</label>
                  <input type="number" id="actualMilk" value="${expectedMilk.toFixed(1)}" step="0.1" style="width:100%;padding:10px;border-radius:6px;border:2px solid #fb7185;font-weight:700;font-size:14px;" onchange="calculateVariance()" />
                </div>
                <div>
                  <label style="font-size:10px;color:#9f1239;font-weight:700;">💵 Actual Cash (₹)</label>
                  <input type="number" id="actualCash" value="${expectedCash.toFixed(0)}" step="100" style="width:100%;padding:10px;border-radius:6px;border:2px solid #fb7185;font-weight:700;font-size:14px;" onchange="calculateVariance()" />
                </div>
              </div>

              <!-- Variance Display -->
              <div id="varianceDisplay" style="margin-top:12px;display:none;">
                <div style="background:#fef2f2;padding:12px;border-radius:6px;border:1px solid #fecaca;">
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                    <span style="font-size:11px;color:#991b1b;font-weight:700;">🥛 Milk Variance:</span>
                    <span id="milkVariance" style="font-size:12px;font-weight:900;color:#dc2626;">0 L (0%)</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;">
                    <span style="font-size:11px;color:#991b1b;font-weight:700;">💵 Cash Variance:</span>
                    <span id="cashVariance" style="font-size:12px;font-weight:900;color:#dc2626;">₹0 (0%)</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div>
              <label style="font-size:10px;color:#64748b;font-weight:700;">📝 Notes (optional)</label>
              <textarea id="shiftNotes" rows="2" placeholder="Any observations..." style="width:100%;padding:8px;border-radius:6px;border:1px solid #e2e8f0;font-size:12px;"></textarea>
            </div>

            <!-- Actions -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <button onclick="closeShiftEndPopup()" style="padding:12px;background:#f1f5f9;border:none;border-radius:8px;font-weight:700;cursor:pointer;color:#64748b;">Cancel</button>
              <button onclick="confirmShiftEnd('${shift.id}')" style="padding:12px;background:#dc2626;border:none;border-radius:8px;font-weight:700;cursor:pointer;color:white;">✅ End Shift</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // Store shift data for variance calculation
    window.currentShift = shift;
    window.expectedMilk = expectedMilk;
    window.expectedCash = expectedCash;
    window.shiftEndCallback = callback;

    // Calculate initial variance
    setTimeout(() => calculateVariance(), 100);
  };

  window.closeShiftEndPopup = function() {
    const overlay = document.getElementById('shiftEndOverlay');
    if (overlay) overlay.remove();
  };

  window.calculateVariance = function() {
    const actualMilk = parseFloat(document.getElementById('actualMilk').value) || 0;
    const actualCash = parseFloat(document.getElementById('actualCash').value) || 0;

    const milkVariance = actualMilk - window.expectedMilk;
    const milkVariancePercent = window.expectedMilk > 0 ? (milkVariance / window.expectedMilk) * 100 : 0;
    const cashVariance = actualCash - window.expectedCash;
    const cashVariancePercent = window.expectedCash > 0 ? (cashVariance / window.expectedCash) * 100 : 0;

    const varianceDisplay = document.getElementById('varianceDisplay');
    const milkVarianceEl = document.getElementById('milkVariance');
    const cashVarianceEl = document.getElementById('cashVariance');

    if (varianceDisplay && milkVarianceEl && cashVarianceEl) {
      varianceDisplay.style.display = 'block';
      
      const milkSign = milkVariance >= 0 ? '+' : '';
      const cashSign = cashVariance >= 0 ? '+' : '';
      
      milkVarianceEl.textContent = `${milkSign}${milkVariance.toFixed(1)} L (${milkSign}${milkVariancePercent.toFixed(1)}%)`;
      cashVarianceEl.textContent = `${cashSign}₹${cashVariance.toFixed(0)} (${cashSign}${cashVariancePercent.toFixed(1)}%)`;

      // Color coding
      const isMilkOk = Math.abs(milkVariancePercent) <= 2.0;
      const isCashOk = Math.abs(cashVariancePercent) <= 1.0;

      milkVarianceEl.style.color = isMilkOk ? '#16a34a' : '#dc2626';
      cashVarianceEl.style.color = isCashOk ? '#16a34a' : '#dc2626';
    }
  };

  window.confirmShiftEnd = async function(shiftId) {
    const actualMilk = parseFloat(document.getElementById('actualMilk').value) || 0;
    const actualCash = parseFloat(document.getElementById('actualCash').value) || 0;
    const notes = document.getElementById('shiftNotes').value;

    const reconciliationData = {
      closing_milk_cow: actualMilk / 2, // Split evenly for now
      closing_milk_buff: actualMilk / 2,
      closing_cash: actualCash,
      notes: notes
    };

    try {
      const response = await fetch(`/api/shifts/${shiftId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reconciliationData)
      });

      const result = await response.json();

      if (result.success) {
        closeShiftEndPopup();
        
        // Show variance alert if needed
        if (result.reconciliation && result.reconciliation.variance_alert) {
          showToast(`⚠️ Variance detected: ${result.reconciliation.milk_variance_percent.toFixed(1)}%`);
        } else {
          showToast('✅ Shift closed successfully!');
        }

        if (window.shiftEndCallback) {
          window.shiftEndCallback(result.reconciliation);
        }
      } else {
        showToast('❌ Failed to close shift: ' + result.error);
      }
    } catch (error) {
      showToast('❌ Error: ' + error.message);
    }
  };

  // ============================================
  // DAILY DASHBOARD WIDGET
  // ============================================

  window.showDailyDashboard = function(summary) {
    const html = `
      <div style="background:white;border-radius:16px;padding:20px;margin:16px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <div style="font-size:16px;font-weight:900;color:#0f172a;margin-bottom:16px;">📊 Today's Summary</div>
        
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
          <!-- Milk -->
          <div style="background:#f0fdf4;padding:16px;border-radius:12px;border:2px solid #16a34a;">
            <div style="font-size:12px;color:#166534;font-weight:700;margin-bottom:8px;">🥛 Milk</div>
            <div style="font-size:24px;font-weight:900;color:#15803d;">${summary.milkIn || 0} L</div>
            <div style="font-size:11px;color:#166534;margin-top:4px;">
              Converted: ${summary.milkConverted || 0}L | Left: ${summary.milkLeft || 0}L
            </div>
          </div>
          
          <!-- Products -->
          <div style="background:#fef3c7;padding:16px;border-radius:12px;border:2px solid #f59e0b;">
            <div style="font-size:12px;color:#92400e;font-weight:700;margin-bottom:8px;">🧀 Products</div>
            <div style="font-size:24px;font-weight:900;color:#78350f;">${summary.productsProduced || 0} kg</div>
            <div style="font-size:11px;color:#92400e;margin-top:4px;">
              Sold: ${summary.productsSold || 0}kg | Left: ${summary.productsLeft || 0}kg
            </div>
          </div>
          
          <!-- Revenue -->
          <div style="background:#eff6ff;padding:16px;border-radius:12px;border:2px solid #2563eb;">
            <div style="font-size:12px;color:#1e40af;font-weight:700;margin-bottom:8px;">💰 Revenue</div>
            <div style="font-size:24px;font-weight:900;color:#1e3a8a;">₹${summary.revenue || 0}</div>
            <div style="font-size:11px;color:#1e40af;margin-top:4px;">
              Cost: ₹${summary.cost || 0} | Margin: ₹${summary.margin || 0}
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert at top of main content area
    const mainContent = document.querySelector('.main-content') || document.querySelector('.app');
    if (mainContent) {
      mainContent.insertAdjacentHTML('afterbegin', html);
    }
  };

  console.log('✅ Reconciliation UI loaded');

})();
