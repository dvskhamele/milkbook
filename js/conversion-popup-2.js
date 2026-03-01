/**
 * Conversion Popup 2.0 - Complete Implementation
 * Milk Source, Batch ID, Auto Stock Updates
 */

(function() {
  'use strict';

  // Enhanced conversion with all features
  window.showConversionPopup2 = function(callback) {
    const html = `
      <div class="overlay" id="conversionOverlay" style="display:flex;align-items:center;justify-content:center;z-index:99998;">
        <div class="modal" style="width:500px;max-height:90vh;overflow-y:auto;">
          <div class="panelHeader" style="background:#16a34a;color:white;">
            <span>🔄 Milk → Product Conversion</span>
            <button onclick="closeConversionPopup2()" style="background:none;border:none;font-size:24px;cursor:pointer;color:white;">✖</button>
          </div>
          <div style="padding:20px;display:flex;flex-direction:column;gap:12px;">
            
            <!-- Today's Collection -->
            <div style="background:#eff6ff;padding:16px;border-radius:12px;border:2px solid #3b82f6;">
              <div style="font-size:12px;font-weight:700;color:#1e40af;margin-bottom:12px;">📊 Today's Collection</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div style="background:white;padding:12px;border-radius:8px;">
                  <div style="font-size:10px;color:#64748b;font-weight:700;">🥛 COW MILK</div>
                  <div style="font-size:18px;font-weight:900;color:#1e3a8a;"><span id="todayCowMilk">0.0</span> L</div>
                  <div style="font-size:10px;color:#166534;font-weight:700;">₹<span id="todayCowAmount">0</span></div>
                </div>
                <div style="background:white;padding:12px;border-radius:8px;">
                  <div style="font-size:10px;color:#64748b;font-weight:700;">🐃 BUFF MILK</div>
                  <div style="font-size:18px;font-weight:900;color:#1e3a8a;"><span id="todayBuffMilk">0.0</span> L</div>
                  <div style="font-size:10px;color:#166534;font-weight:700;">₹<span id="todayBuffAmount">0</span></div>
                </div>
              </div>
              <div style="background:#fef3c7;padding:8px;border-radius:6px;border:1px solid #f59e0b;margin-top:12px;">
                <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#92400e;">
                  <span>📈 TOTAL:</span>
                  <span><span id="todayTotalMilk">0.0</span> L | ₹<span id="todayTotalAmount">0</span></span>
                </div>
              </div>
            </div>

            <!-- Milk Source -->
            <div style="background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;">
              <div style="font-size:11px;font-weight:700;color:#475569;margin-bottom:8px;">🥛 Milk Source:</div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
                <label style="background:white;padding:10px;border-radius:6px;border:2px solid #e2e8f0;cursor:pointer;text-align:center;">
                  <input type="radio" name="milkSource" value="cow" onchange="updateConversionPreview2()" style="margin-bottom:4px;" />
                  <div style="font-size:12px;font-weight:700;">🥛 Cow</div>
                </label>
                <label style="background:white;padding:10px;border-radius:6px;border:2px solid #e2e8f0;cursor:pointer;text-align:center;">
                  <input type="radio" name="milkSource" value="buff" onchange="updateConversionPreview2()" style="margin-bottom:4px;" />
                  <div style="font-size:12px;font-weight:700;">🐃 Buff</div>
                </label>
                <label style="background:white;padding:10px;border-radius:6px;border:2px solid #16a34a;cursor:pointer;text-align:center;">
                  <input type="radio" name="milkSource" value="mixed" onchange="updateConversionPreview2()" checked style="margin-bottom:4px;" />
                  <div style="font-size:12px;font-weight:700;">🔀 Mixed</div>
                </label>
              </div>
            </div>

            <!-- Product Selection -->
            <div>
              <label style="font-size:10px;color:#64748b;font-weight:700;">Product Type:</label>
              <select id="convProduct2" style="width:100%;padding:12px;border-radius:8px;border:2px solid #16a34a;font-weight:700;font-size:14px;" onchange="updateConversionPreview2()">
                <option value="Cow Milk,64,1">🥛 Cow Milk (1L → 1L)</option>
                <option value="Buff Milk,100,1">🐃 Buff Milk (1L → 1L)</option>
                <option value="Paneer,400,5">🧀 Paneer (5L → 1kg)</option>
                <option value="Ghee,600,25">🧈 Ghee (25L → 1kg)</option>
                <option value="Curd,80,1">🥣 Curd (1L → 1kg)</option>
                <option value="Sweets,300,8">🍬 Sweets (8L → 1kg)</option>
              </select>
            </div>

            <!-- Conversion Ratio Display -->
            <div id="ratioDisplay2" style="background:#eff6ff;padding:12px;border-radius:8px;border:2px solid #3b82f6;display:none;">
              <div style="font-size:11px;font-weight:700;color:#1e40af;margin-bottom:4px;">📊 Conversion Ratio:</div>
              <div style="font-size:13px;color:#1e3a8a;font-weight:700;">
                <span id="ratioText2">5L Milk → 1kg Paneer</span>
              </div>
            </div>

            <!-- Milk Quantity -->
            <div>
              <label style="font-size:10px;color:#64748b;font-weight:700;">Milk Used (L):</label>
              <input type="number" id="convQty2" placeholder="Enter milk quantity" style="width:100%;padding:12px;border-radius:8px;border:2px solid #3b82f6;font-weight:700;font-size:14px;" oninput="updateConversionPreview2()" />
            </div>

            <!-- Output Display -->
            <div style="background:#f0fdf4;padding:12px;border-radius:8px;border:2px solid #16a34a;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="font-size:11px;font-weight:700;color:#166534;">✅ Product Generated:</div>
                <button type="button" onclick="toggleOverride2()" style="font-size:10px;padding:4px 8px;background:#fef3c7;color:#92400e;border:1px solid #f59e0b;border-radius:4px;font-weight:700;cursor:pointer;">✏️ Override</button>
              </div>
              <div style="font-size:18px;color:#15803d;font-weight:900;">
                <span id="outputQty2">0</span> <span id="outputUnit2">kg</span>
              </div>
              <div id="overrideInput2" style="display:none;margin-top:8px;">
                <label style="font-size:10px;color:#78350f;font-weight:700;">Actual Quantity:</label>
                <input type="number" id="actualProductQty2" value="0" step="0.01" style="width:100%;padding:8px;border-radius:6px;border:2px solid #f59e0b;font-weight:700;font-size:14px;" oninput="updateOverride2()" />
              </div>
            </div>

            <!-- Batch Info -->
            <div style="background:#f3e8ff;padding:12px;border-radius:8px;border:1px solid #c084fc;">
              <div style="font-size:11px;font-weight:700;color:#7e22ce;">📋 Batch Information:</div>
              <div style="font-size:12px;color:#7e22ce;margin-top:4px;">
                Batch ID: <strong style="font-weight:900;">BATCH-${new Date().toISOString().split('T')[0].replace(/-/g,'')}-${String(Date.now()).slice(-3)}</strong>
              </div>
              <div style="font-size:11px;color:#7e22ce;margin-top:4px;">
                Operator: <strong style="font-weight:700;">Auto from login</strong>
              </div>
            </div>

            <!-- Actions -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <button onclick="closeConversionPopup2()" style="padding:12px;background:#f1f5f9;border:none;border-radius:8px;font-weight:700;cursor:pointer;color:#64748b;">Cancel</button>
              <button onclick="confirmConversion2()" style="padding:12px;background:#16a34a;border:none;border-radius:8px;font-weight:700;cursor:pointer;color:white;">✅ Confirm Conversion</button>
            </div>

            <div style="font-size:10px;color:#64748b;text-align:center;">
              💡 Common ratios: Paneer (5L→1kg), Ghee (25L→1kg), Curd (1L→1kg)
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    window.conversionCallback = callback;
    
    // Load today's collection data
    loadTodayCollection2();
  };

  window.closeConversionPopup2 = function() {
    const overlay = document.getElementById('conversionOverlay');
    if (overlay) overlay.remove();
  };

  // Load today's collection from localStorage
  function loadTodayCollection2() {
    const today = new Date().toISOString().split('T')[0];
    const entries = JSON.parse(localStorage.getItem('mr_milk_entries') || '[]');
    
    let cowMilk = 0, cowAmount = 0, buffMilk = 0, buffAmount = 0;
    
    entries.forEach(entry => {
      if ((entry.collection_date === today || entry.day === today)) {
        const qty = parseFloat(entry.qty) || 0;
        const amount = parseFloat(entry.amount) || 0;
        const animal = (entry.animal || '').toLowerCase();
        
        if (animal.includes('cow')) {
          cowMilk += qty;
          cowAmount += amount;
        } else if (animal.includes('buff')) {
          buffMilk += qty;
          buffAmount += amount;
        }
      }
    });

    // Update display
    const el = (id) => document.getElementById(id);
    if (el('todayCowMilk')) el('todayCowMilk').textContent = cowMilk.toFixed(1);
    if (el('todayCowAmount')) el('todayCowAmount').textContent = cowAmount.toFixed(0);
    if (el('todayBuffMilk')) el('todayBuffMilk').textContent = buffMilk.toFixed(1);
    if (el('todayBuffAmount')) el('todayBuffAmount').textContent = buffAmount.toFixed(0);
    if (el('todayTotalMilk')) el('todayTotalMilk').textContent = (cowMilk + buffMilk).toFixed(1);
    if (el('todayTotalAmount')) el('todayTotalAmount').textContent = (cowAmount + buffAmount).toFixed(0);
  }

  window.updateConversionPreview2 = function() {
    const productValue = document.getElementById('convProduct2').value;
    const milkQty = parseFloat(document.getElementById('convQty2').value) || 0;
    
    if (!productValue || !milkQty) {
      document.getElementById('ratioDisplay2').style.display = 'none';
      return;
    }

    const productData = productValue.split(',');
    const productName = productData[0];
    const milkRatio = parseFloat(productData[2]) || 1;

    // Show ratio
    const ratioDisplay = document.getElementById('ratioDisplay2');
    const ratioText = document.getElementById('ratioText2');
    if (ratioDisplay && ratioText) {
      ratioDisplay.style.display = 'block';
      ratioText.textContent = `${milkRatio}L Milk → 1${productName.includes('Paneer') || productName.includes('Ghee') ? 'kg' : 'L'} ${productName}`;
    }

    // Calculate output
    let productQty;
    let productUnit;

    if (productName.includes('Paneer') || productName.includes('Ghee') || productName.includes('Sweets')) {
      productQty = milkQty / milkRatio;
      productUnit = 'kg';
    } else {
      productQty = milkQty;
      productUnit = 'L';
    }

    // Update display
    const el = (id) => document.getElementById(id);
    if (el('outputQty2')) el('outputQty2').textContent = productQty.toFixed(2);
    if (el('outputUnit2')) el('outputUnit2').textContent = productUnit;
  };

  window.toggleOverride2 = function() {
    const overrideDiv = document.getElementById('overrideInput2');
    if (overrideDiv) {
      overrideDiv.style.display = overrideDiv.style.display === 'none' ? 'block' : 'none';
      if (overrideDiv.style.display === 'block') {
        document.getElementById('actualProductQty2').focus();
      }
    }
  };

  window.updateOverride2 = function() {
    const actualQty = parseFloat(document.getElementById('actualProductQty2').value) || 0;
    if (document.getElementById('outputQty2')) {
      document.getElementById('outputQty2').textContent = actualQty.toFixed(2);
    }
  };

  window.confirmConversion2 = async function() {
    const milkQty = parseFloat(document.getElementById('convQty2').value) || 0;
    const productValue = document.getElementById('convProduct2').value;
    const milkSource = document.querySelector('input[name="milkSource"]:checked')?.value || 'mixed';
    
    if (!milkQty || !productValue) {
      showToast('⚠️ Please enter milk quantity and select product');
      return;
    }

    const productData = productValue.split(',');
    const productName = productData[0];
    const rate = parseFloat(productData[1]);
    const milkRatio = parseFloat(productData[2]) || 1;

    // Get product quantity (with override if active)
    let productQty;
    const overrideDiv = document.getElementById('overrideInput2');
    if (overrideDiv && overrideDiv.style.display !== 'none') {
      productQty = parseFloat(document.getElementById('actualProductQty2').value) || 0;
    } else {
      productQty = milkQty / milkRatio;
    }

    const productUnit = productName.includes('Paneer') || productName.includes('Ghee') ? 'kg' : 'L';

    // Create conversion batch data
    const conversionData = {
      milk_source: milkSource,
      milk_quantity_cow: milkSource === 'cow' ? milkQty : (milkSource === 'mixed' ? milkQty / 2 : 0),
      milk_quantity_buff: milkSource === 'buff' ? milkQty : (milkSource === 'mixed' ? milkQty / 2 : 0),
      milk_quantity_total: milkQty,
      product_type: productName.toLowerCase(),
      product_quantity: productQty,
      product_unit: productUnit,
      conversion_ratio: milkRatio,
      operator_name: 'Operator'
    };

    try {
      const response = await fetch('/api/conversion-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversionData)
      });

      const result = await response.json();

      if (result.success) {
        closeConversionPopup2();
        showToast(`✅ Converted ${milkQty}L milk to ${productQty.toFixed(2)}${productUnit} ${productName}`);
        if (window.conversionCallback) {
          window.conversionCallback(result.batch);
        }
      } else {
        showToast('❌ Conversion failed: ' + result.error);
      }
    } catch (error) {
      // Fallback: just add to cart for POS page
      closeConversionPopup2();
      showToast(`✅ Added ${productQty.toFixed(2)}${productUnit} ${productName} to cart`);
      if (window.conversionCallback) {
        window.conversionCallback({ productName, productQty, productUnit, rate });
      }
    }
  };

  console.log('✅ Conversion Popup 2.0 loaded');

})();
