// MilkRecord Extension - Multi-Point Collection System
// This script extends the existing MilkRecord application with multi-point collection capabilities

// Add collection point selector to the top header area
function addCollectionPointSelector() {
  // Find the topbar header
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;
  
  // Create collection point selector element
  const collectionPointDiv = document.createElement('div');
  collectionPointDiv.className = 'collection-point-selector';
  collectionPointDiv.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: #fff;
    margin-left: 10px;
    font-size: 14px;
  `;
  collectionPointDiv.innerHTML = `
    <label style="font-weight: 900; color: var(--muted); font-size: 12px; letter-spacing: 0.3px;">Booth:</label>
    <select id="collectionPointSelect" style="height: 36px; border-radius: 8px; border: 1px solid var(--line); background: #fff; font-weight: 1000; font-size: 14px; padding: 0 10px; outline: none; min-width: 140px;">
      <option value="DEFAULT">Default Booth</option>
      <option value="VILLAGE_A">Village A Booth</option>
      <option value="VILLAGE_B">Village B Booth</option>
      <option value="VILLAGE_C">Village C Booth</option>
    </select>
  `;
  
  // Insert after the brand section in the header
  const brandSection = topbar.querySelector('.brand');
  if (brandSection) {
    brandSection.parentNode.insertBefore(collectionPointDiv, brandSection.nextSibling);
  } else {
    // If brand section not found, add at the beginning
    topbar.insertBefore(collectionPointDiv, topbar.firstChild);
  }
}

// Add slip number input (automated)
function addSlipNumberInput() {
  const inputsContainer = document.querySelector('.inputs');
  if (!inputsContainer) return;
  
  const slipNumberDiv = document.createElement('div');
  slipNumberDiv.className = 'slip-number-input';
  slipNumberDiv.innerHTML = `
    <label>Slip Number:</label>
    <input type="text" id="slipNumberInput" placeholder="Auto-generated">
  `;
  
  // Find the manual override section and insert before it
  const manualOverride = document.querySelector('.manualOverride');
  if (manualOverride) {
    manualOverride.parentNode.insertBefore(slipNumberDiv, manualOverride);
  } else {
    inputsContainer.appendChild(slipNumberDiv);
  }
  
  // Automatically generate slip numbers based on date and sequence
  window.generateSlipNumber = function() {
    const today = new Date();
    const dateStr = `${today.getDate()}${(today.getMonth()+1).toString().padStart(2,'0')}${today.getFullYear().toString().substr(-2)}`;
    
    // Get the last slip number from localStorage to increment
    let lastSlipNum = parseInt(localStorage.getItem('lastSlipNumber') || '0');
    lastSlipNum++;
    
    // Format: DDMMYY-NNN (e.g., 140226-001)
    const slipNumber = `${dateStr}-${lastSlipNum.toString().padStart(3,'0')}`;
    
    // Save the incremented number for next use
    localStorage.setItem('lastSlipNumber', lastSlipNum.toString());
    
    return slipNumber;
  };
  
  // Auto-populate slip number when a farmer is selected
  const originalRenderTrust = window.renderTrust;
  window.renderTrust = function() {
    originalRenderTrust.call(this);
    
    // Auto-generate slip number if empty
    const slipInput = document.getElementById('slipNumberInput');
    if (slipInput && !slipInput.value) {
      slipInput.value = window.generateSlipNumber();
    }
    
    // Update the header to show the selected collection point
    updateHeaderWithCollectionPoint();
    
    // Update the balance reason strip
    updateBalanceReasonStrip();
  };
}

// Update the balance reason strip
function updateBalanceReasonStrip() {
  const farmer = window.getFarmerById(window.selectedFarmerId);
  if (!farmer) return;
  
  const amount = window.getAmount();
  const before = window.farmerBalanceBefore(farmer);
  const after = window.round2(before + amount);
  
  // Create the balance reason strip
  let reasonStrip = document.getElementById('balance-reason-strip');
  if (!reasonStrip) {
    reasonStrip = document.createElement('div');
    reasonStrip.id = 'balance-reason-strip';
    reasonStrip.style.cssText = `
      margin-top: 8px;
      padding: 8px 12px;
      background: #f1f5f9;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 900;
      color: var(--muted);
      text-align: center;
    `;
    
    // Add after the new balance element
    const newBalanceElement = document.getElementById('balAfter');
    if (newBalanceElement) {
      newBalanceElement.parentNode.appendChild(reasonStrip);
    }
  }
  
  // Determine the reason text
  let reasonText = '';
  if (amount > 0) {
    reasonText = `+₹${amount.toFixed(2)} (Today Milk)`;
    
    // Check if there are any advances to deduct
    if (farmer.advance && farmer.advance > 0) {
      reasonText += ` – ₹${farmer.advance.toFixed(2)} (Advance Cut)`;
    }
  } else {
    reasonText = 'No transaction today';
  }
  
  reasonStrip.textContent = reasonText;
}

// Update header to show collection point
function updateHeaderWithCollectionPoint() {
  // Create or update a small indicator in the header showing the selected collection point
  let pointIndicator = document.getElementById('collectionPointIndicator');
  if (!pointIndicator) {
    pointIndicator = document.createElement('div');
    pointIndicator.id = 'collectionPointIndicator';
    pointIndicator.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: #e0e7ff;
      color: #3730a3;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 900;
      z-index: 100;
    `;
    
    // Add to the topbar
    const topbar = document.querySelector('.topbar');
    if (topbar) {
      topbar.appendChild(pointIndicator);
    }
  }
  
  // Update the indicator text with the selected collection point
  const collectionPointSelect = document.getElementById('collectionPointSelect');
  if (collectionPointSelect) {
    const selectedOption = collectionPointSelect.options[collectionPointSelect.selectedIndex];
    const pointName = selectedOption.text;
    pointIndicator.textContent = `• ${pointName}`;
  }
}

// Update the table header to include collection point
function updateTableHeader() {
  const tableHeader = document.querySelector('table thead tr');
  if (tableHeader) {
    // Check if the "POINT" column already exists
    const existingTh = Array.from(tableHeader.querySelectorAll('th')).find(th => th.textContent.includes('POINT'));
    if (!existingTh) {
      const pointTh = document.createElement('th');
      pointTh.textContent = 'POINT';
      tableHeader.appendChild(pointTh);
    }
  }
}

// Extend the saveEntry function to include new fields
function extendSaveEntry() {
  // Store the original saveEntry function
  const originalSaveEntry = window.saveEntry;
  
  // Override the saveEntry function to include extended functionality
  window.saveEntry = function() {
    // Get the original values
    if (!window.canSave()) {
      window.showToast("Need: Farmer + Qty + Fat");
      return;
    }
    const farmer = window.getFarmerById(window.selectedFarmerId);
    if (!farmer) {
      window.showToast("Select farmer");
      return;
    }

    const before = window.farmerBalanceBefore(farmer);
    const ratePerL = window.getRatePerLiter();
    const amount = window.getAmount();
    const after = window.round2(before + amount);

    // NEW: Get slip number and collection point
    const slipNumberInput = document.getElementById("slipNumberInput");
    let slipNumber = slipNumberInput?.value.trim() || null;
    
    // If slip number is auto-generated and empty, generate one
    if (!slipNumber) {
      slipNumber = window.generateSlipNumber();
      slipNumberInput.value = slipNumber; // Update the input field
    }
    
    const collectionPointId = document.getElementById("collectionPointSelect")?.value || "DEFAULT";
    const collectionPointName = window.collectionPoints?.find(cp => cp.id === collectionPointId)?.name || "Unknown";
    
    // NEW: Enhanced entry data model with explicit proof fields
    const entry = {
      id: window.uid("e"),
      farmerId: farmer.id,
      farmerName: farmer.name || "",
      qty: window.round2(window.qty),
      fat: window.round2(window.fat),
      snf: window.round2(window.snf),
      animal: window.animal,
      rateMode: window.rateMode,
      ratePerL: window.round2(ratePerL),
      amount: window.round2(amount),
      before,
      after,
      session: window.autoSessionLabel(),
      createdAt: Date.now(),
      day: window.fmtDate(new Date()),
      
      // NEW: Extended entry data model with explicit proof fields
      collectionPointId: collectionPointId,
      collectionPointName: collectionPointName,
      entrySource: "auto", // default, could be "manual" or "external-photo"
      deviceId: "WEB-" + navigator.userAgent.substring(0, 10), // simplified device ID
      recordedAt: Date.now(),
      edited: false,
      editedAt: null,
      previousValues: null,
      slipNumber: slipNumber, // NEW: Slip number
      bmcLinked: false,       // default
      bmcBatchId: null,       // default

      images: window.currentEntryImage ? [window.currentEntryImage] : [],
      edited: false,
      editedAt: null
    };

    // Update farmer balance
    farmer.balance = after;
    window.saveFarmers(window.farmers);

    // Save entry
    window.entries.push(entry);
    window.saveEntries(window.entries);

    // Set undo token (only last entry)
    window.saveUndoToken({
      entryId: entry.id,
      farmerId: farmer.id,
      prevBalance: before,
    });

    // Clear input quickly
    window.qty = 0;
    window.fat = 0;
    window.snf = 0;
    window.manualRate = 0;
    document.getElementById("manualRateInput").value = "";
    document.getElementById("slipNumberInput").value = ""; // NEW: Clear slip number
    window.showToast("SAVED ✅");
    window.currentEntryImage = null;
    const imgInput = document.getElementById("fImageEntry");
    if(imgInput) imgInput.value = "";
    
    window.autoNextFarmer();
    window.renderAll();

    // 1. Poori body par flash class lagayein
    document.body.classList.add("flash-success");

    // 2. Animation khatam hone ke baad class hata dein
    setTimeout(() => {
        document.body.classList.remove("flash-success");
    }, 600);
    window.updateDailySummaryButton(); // Extra safety ke liye
    window.showToast("Entry Saved Successfully! ✅");
  };
}

// Extend the renderRecentToday function to include collection point
function extendRenderRecentToday() {
  // Store the original function
  const originalRenderRecentToday = window.renderRecentToday;
  
  // Override the function
  window.renderRecentToday = function() {
    const today = window.fmtDate(new Date());
    const todays = window.entries
      .filter((e) => e.day === today)
      .sort((a, b) => b.createdAt - a.createdAt);

    window.recentMeta.textContent = `${todays.length} records`;

    if (todays.length === 0) {
      window.recentTbody.innerHTML = `<tr><td colspan="9" style="color:var(--muted);font-weight:1100;">No records recorded today</td></tr>`;
      return;
    }

    const rows = todays
      .slice(0, 25)
      .map((e) => {
        const typeTag =
          e.animal === "buffalo"
            ? `<span class="tag buff"> Buffalo</span>`
            : `<span class="tag cow"> Cow</span>`;
        
        const photoIcon = (e.images && Array.isArray(e.images) && e.images.length > 0)
          ? ` <span onclick="viewProof('${e.images[0]}')" style="cursor:pointer;">📸</span>`
          : '';
        const f = window.getFarmerById(e.farmerId);
        const phone = (f && f.phone) ? f.phone : "";

        const msg = `*Milk Receipt* 🥛\nDate: ${e.day} (${e.session})\nQty: ${e.qty}L | Fat: ${e.fat}\n*Amount: ₹${Number(e.amount).toFixed(2)}*\nGopal Dairy Shop`;
        const wpLink = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

        // NEW: Get collection point name and slip number
        const collectionPoint = e.collectionPointName || "Unknown";
        const slipNumber = e.slipNumber || "N/A";

        // Return the row with collection point and slip number columns
        return `
          <tr onclick="showEntryDetailDrawer('${e.id}')">
            <td>${window.escapeHtml(e.day)}</td>
            <td style="font-weight:1100;">
                ${window.escapeHtml(e.farmerName || "")}
                ${photoIcon} ${e.edited ? `<br><small class="edit-note" style="color:var(--muted); font-weight:normal; font-size:10px;">✏️ Sudhara gaya: ${window.fmtTime(new Date(e.editedAt))}</small>` : ''}
            </td>
            <td><span class="rtag">${window.escapeHtml(e.session || "")}</span></td>
            <td>${typeTag}</td>
            <td style="font-weight:1100;">${Number(e.qty || 0).toFixed(1)} L</td>
            <td>${Number(e.fat || 0).toFixed(1)}%</td>
            <td>${Number(e.snf || 0).toFixed(1)}</td>
            <td style="font-weight:1200; color:#1d4ed8; display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                ₹${Number(e.amount || 0).toFixed(2)}
                <button onclick="editEntry('${e.id}'); event.stopPropagation();" title="Edit" style="border:none; background:transparent; cursor:pointer; font-size:14px;">✏️</button>
                ${phone ? `<a href="${wpLink}" target="_blank" title="Send WhatsApp" style="text-decoration:none; font-size:16px;" onclick="event.stopPropagation();">🟢</a>` : ''}
            </td>
            <td style="font-weight:1000; color: var(--muted);">${collectionPoint}<br><small style="color: #6b7280;">${slipNumber}</small></td>
          </tr>
        `;
      })
      .join("");

    window.recentTbody.innerHTML = rows;
  };
}

// Extend the editEntry function to handle new fields
function extendEditEntry() {
  // Store the original function
  const originalEditEntry = window.editEntry;
  
  // Override the function
  window.editEntry = function(id) {
    const entry = window.entries.find(e => e.id === id);
    if (!entry) return;

    // 1. Confirm karein (Trust Safe)
    if (!confirm("Do you want to edit this entry? It will update farmer balance.")) return;

    // 2. Pehle purani entry ka asar khatam karein (Balance reverse)
    const farmer = window.getFarmerById(entry.farmerId);
    if (farmer) {
        farmer.balance = window.round2(farmer.balance - entry.amount);
    }

    // 3. Data ko wapas form mein load karein
    window.selectedFarmerId = entry.farmerId;
    window.qty = entry.qty;
    window.fat = entry.fat;
    window.snf = entry.snf;
    window.animal = entry.animal;
    window.selectedCollectionPointId = entry.collectionPointId || "DEFAULT"; // NEW: Load collection point
    
    // NEW: Load slip number, if none exists, generate a new one
    const slipNumberInput = document.getElementById("slipNumberInput");
    if (entry.slipNumber) {
      slipNumberInput.value = entry.slipNumber;
    } else {
      // If the entry didn't have a slip number, generate a new one
      slipNumberInput.value = window.generateSlipNumber();
    }

    // 4. Entry ko mark karein taaki save hone par naya record na bane, purana update ho
    // (Simple rasta: purani entry delete karke naya form bhardein)
    window.entries = window.entries.filter(e => e.id !== id);
    window.saveEntries(window.entries);
    window.saveFarmers(window.farmers);

    window.renderAll();
    window.showToast("Editing: " + entry.farmerName + " ✏️");
    document.getElementById("qtyInput").focus();
  };
}

// Add CSS for new elements
function addExtendedStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Booth Selector in Header */
    .collection-point-selector {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: #fff;
        font-size: 14px;
        min-width: 160px;
    }

    .collection-point-selector label {
        font-weight: 900;
        color: var(--muted);
        font-size: 12px;
        letter-spacing: 0.3px;
        white-space: nowrap;
    }

    .collection-point-selector select {
        height: 32px;
        border-radius: 8px;
        border: 1px solid var(--line);
        background: #fff;
        font-weight: 1000;
        font-size: 13px;
        padding: 0 8px;
        outline: none;
        flex: 1;
        min-width: 120px;
    }

    /* Slip Number Input */
    .slip-number-input {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
        padding: 10px;
        border: 1px solid var(--line);
        border-radius: 16px;
        background: #fff;
    }

    .slip-number-input label {
        font-weight: 1000;
        color: var(--muted);
        font-size: 12px;
        letter-spacing: 0.3px;
    }

    .slip-number-input input {
        flex: 1;
        height: 40px;
        border-radius: 12px;
        border: 1px solid var(--line);
        background: #fff;
        font-weight: 1000;
        font-size: 14px;
        padding: 0 12px;
        outline: none;
    }
    
    /* Center Summary Card */
    .center-summary-card {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 20px;
        margin: 20px;
        box-shadow: var(--shadow);
    }

    .center-summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }

    .center-summary-title {
        font-size: 18px;
        font-weight: 1100;
        color: var(--text);
    }

    .center-summary-date {
        font-size: 14px;
        color: var(--muted);
        font-weight: 1000;
    }

    .center-summary-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin-bottom: 20px;
    }

    .center-summary-stat {
        background: var(--soft-blue);
        border-radius: 12px;
        padding: 15px;
        text-align: center;
    }

    .center-summary-stat-label {
        font-size: 12px;
        color: var(--muted);
        font-weight: 1000;
        margin-bottom: 5px;
    }

    .center-summary-stat-value {
        font-size: 20px;
        font-weight: 1200;
        color: var(--blue);
    }

    .dispatch-action {
        margin-top: 20px;
        text-align: center;
    }

    .dispatch-action-btn {
        background: var(--green);
        color: white;
        border: none;
        border-radius: 16px;
        padding: 12px 20px;
        font-weight: 1000;
        cursor: pointer;
        width: 100%;
    }

    .whatsapp-share-btn {
        background: #25d366;
        color: white;
        border: none;
        border-radius: 16px;
        padding: 12px 20px;
        font-weight: 1000;
        cursor: pointer;
        width: 100%;
        margin-top: 10px;
    }
    
    /* Mobile Optimizations */
    @media (max-width: 768px) {
      .collection-point-selector {
        min-width: 140px;
      }
      
      .collection-point-selector select {
        min-width: 100px;
        font-size: 12px;
      }
      
      .center-summary-card {
        margin: 10px;
        padding: 15px;
      }
      
      .center-summary-stats {
        gap: 10px;
      }
      
      .center-summary-stat {
        padding: 12px;
      }
      
      .center-summary-stat-value {
        font-size: 18px;
      }
      
      .dispatch-action-btn, .whatsapp-share-btn {
        padding: 10px 15px;
        font-size: 16px;
      }
    }
  `;
  document.head.appendChild(style);
}

// Add modals for extended functionality
function addModals() {
  // Create overlay container if it doesn't exist
  if (!document.getElementById('overlayCenterSummary')) {
    const modalsContainer = `
      <!-- CENTER SUMMARY MODAL -->
      <div class="overlay" id="overlayCenterSummary">
        <div class="modal">
          <div class="modalHead">
            <div class="left">
              <button class="closeBtn" data-close="overlayCenterSummary">✖</button>
              <div>📊 Center Summary</div>
            </div>
            <div class="muted" id="centerSummaryTitle">—</div>
          </div>

          <div class="modalBody onecol">
            <div class="modalCol">
              <div class="center-summary-card">
                <div class="center-summary-header">
                  <div class="center-summary-title">Collection Summary – 12 Feb</div>
                  <div class="center-summary-date">Center: Village A Booth</div>
                </div>
                
                <div class="center-summary-stats">
                  <div class="center-summary-stat">
                    <div class="center-summary-stat-label">Entries</div>
                    <div class="center-summary-stat-value">42</div>
                  </div>
                  <div class="center-summary-stat">
                    <div class="center-summary-stat-label">Total Milk (L)</div>
                    <div class="center-summary-stat-value">612.5</div>
                  </div>
                  <div class="center-summary-stat">
                    <div class="center-summary-stat-label">Fat Range</div>
                    <div class="center-summary-stat-value">5.9 – 6.4</div>
                  </div>
                  <div class="center-summary-stat">
                    <div class="center-summary-stat-label">Total Amount</div>
                    <div class="center-summary-stat-value">₹28,430</div>
                  </div>
                </div>
                
                <div class="dispatch-action">
                  <button class="dispatch-action-btn" id="btnMarkDispatch">Mark Milk Sent to Dairy</button>
                  <button class="whatsapp-share-btn" id="btnShareCenterSummary">📤 Send Center Summary (WhatsApp)</button>
                </div>
              </div>
            </div>
          </div>

          <div class="modalFoot">
            <button class="footBtn" id="btnCloseCenterSummary">✅ Close</button>
          </div>
        </div>
      </div>

      <!-- DISPATCH MODAL -->
      <div class="overlay" id="overlayDispatch">
        <div class="modal">
          <div class="modalHead">
            <div class="left">
              <button class="closeBtn" data-close="overlayDispatch">✖</button>
              <div>🚛 Mark Milk Dispatch</div>
            </div>
            <div class="muted">Fill Cane Record</div>
          </div>

          <div class="modalBody onecol">
            <div class="modalCol">
              <h3>Dispatch Information</h3>
              <div class="formGrid">
                <div class="field">
                  <label>Total Milk Sent (L)</label>
                  <input id="dispatchMilkQty" inputmode="decimal" placeholder="Enter quantity" />
                </div>
                <div class="field">
                  <label>Destination</label>
                  <select id="dispatchDestination">
                    <option value="dairy">Dairy</option>
                    <option value="bmc">BMC</option>
                  </select>
                </div>
                <div class="field full">
                  <label>Notes</label>
                  <textarea id="dispatchNotes" placeholder="Additional information"></textarea>
                </div>
              </div>
            </div>
          </div>

          <div class="modalFoot">
            <button class="footBtn good" id="btnSaveDispatch">✅ Save Dispatch</button>
            <button class="footBtn" id="btnCancelDispatch">❌ Cancel</button>
          </div>
        </div>
      </div>

      <!-- BMC RECONCILIATION MODAL -->
      <div class="overlay" id="overlayBMCReconcile">
        <div class="modal">
          <div class="modalHead">
            <div class="left">
              <button class="closeBtn" data-close="overlayBMCReconcile">✖</button>
              <div>⚖️ BMC Reconciliation</div>
            </div>
            <div class="muted">Match with BMC Records</div>
          </div>

          <div class="modalBody onecol">
            <div class="modalCol">
              <h3>BMC Batch Information</h3>
              <div class="formGrid">
                <div class="field">
                  <label>BMC Batch ID</label>
                  <input id="bmcBatchId" placeholder="Enter batch ID" />
                </div>
                <div class="field">
                  <label>Total Milk Received</label>
                  <input id="bmcMilkReceived" inputmode="decimal" placeholder="Enter quantity" />
                </div>
                <div class="field">
                  <label>Avg Fat</label>
                  <input id="bmcAvgFat" inputmode="decimal" placeholder="Enter average fat" />
                </div>
                <div class="field">
                  <label>Rate Applied</label>
                  <input id="bmcRateApplied" inputmode="decimal" placeholder="Enter rate" />
                </div>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 12px;">
                <h4 style="margin-top: 0;">Reconciliation Summary</h4>
                <p><strong>Slips Milk:</strong> <span id="reconcileSlipsMilk">2,412.0 L</span></p>
                <p><strong>BMC Received:</strong> <span id="reconcileBmcReceived">2,406.5 L</span></p>
                <p><strong>Difference:</strong> <span id="reconcileDifference">-5.5 L</span></p>
                <p><strong>Avg Fat (BMC):</strong> <span id="reconcileBmcFat">6.2</span></p>
                <p><strong>Rate Applied:</strong> <span id="reconcileBmcRate">₹48.00</span></p>
              </div>
            </div>
          </div>

          <div class="modalFoot">
            <button class="footBtn good" id="btnSaveBMCReconcile">✅ Link to BMC</button>
            <button class="footBtn" id="btnCancelBMCReconcile">❌ Cancel</button>
          </div>
        </div>
      </div>

      <!-- PAYMENT OBLIGATION MODAL -->
      <div class="overlay" id="overlayPaymentObligation">
        <div class="modal">
          <div class="modalHead">
            <div class="left">
              <button class="closeBtn" data-close="overlayPaymentObligation">✖</button>
              <div>💰 Payment Obligation View</div>
            </div>
            <div class="muted" id="paymentObligationTitle">—</div>
          </div>

          <div class="modalBody onecol">
            <div class="modalCol">
              <div class="center-summary-card">
                <div class="center-summary-header">
                  <div class="center-summary-title">12 Feb – Payable Summary</div>
                  <div class="center-summary-date">Daily Overview</div>
                </div>
                
                <div class="center-summary-stats">
                  <div class="center-summary-stat">
                    <div class="center-summary-stat-label">Milk Amount</div>
                    <div class="center-summary-stat-value" id="paymentMilkAmount">₹1,15,200</div>
                  </div>
                  <div class="center-summary-stat">
                    <div class="center-summary-stat-label">Advances Cut</div>
                    <div class="center-summary-stat-value" id="paymentAdvancesCut">₹12,000</div>
                  </div>
                  <div class="center-summary-stat">
                    <div class="center-summary-stat-label">Net Payable</div>
                    <div class="center-summary-stat-value" id="paymentNetPayable">₹1,03,200</div>
                  </div>
                  <div class="center-summary-stat">
                    <div class="center-summary-stat-label">Total Farmers</div>
                    <div class="center-summary-stat-value" id="paymentTotalFarmers">42</div>
                  </div>
                </div>
                
                <div class="dispatch-action">
                  <button class="whatsapp-share-btn" id="btnSharePaymentSummary">📤 Send Payment Summary (WhatsApp)</button>
                </div>
              </div>
            </div>
          </div>

          <div class="modalFoot">
            <button class="footBtn" id="btnClosePaymentObligation">✅ Close</button>
          </div>
        </div>
      </div>
    `;
    
    // Add the modals to the body
    document.body.insertAdjacentHTML('beforeend', modalsContainer);
  }
}

// Add data structures for extended functionality
function addDataStructures() {
  // Add collection points if they don't exist
  if (!window.collectionPoints) {
    window.collectionPoints = [
      { id: "DEFAULT", name: "Default Booth", active: true },
      { id: "VILLAGE_A", name: "Village A Booth", active: true },
      { id: "VILLAGE_B", name: "Village B Booth", active: true },
      { id: "VILLAGE_C", name: "Village C Booth", active: true }
    ];
  }
  
  // Add selected collection point if it doesn't exist
  if (window.selectedCollectionPointId === undefined) {
    window.selectedCollectionPointId = "DEFAULT";
  }
}

// Add event listeners for new functionality
function addEventListeners() {
  // Add event listener for collection point selection
  const collectionPointSelect = document.getElementById("collectionPointSelect");
  if (collectionPointSelect) {
    collectionPointSelect.addEventListener("change", (e) => {
      window.selectedCollectionPointId = e.target.value;
      // Update the header indicator when selection changes
      updateHeaderWithCollectionPoint();
    });
  }
  
  // Add long press event for farmer cards to show daily summary
  addLongPressForFarmerCards();
}

// Update the renderFarmers function to add data attributes
function extendRenderFarmers() {
  const originalRenderFarmers = window.renderFarmers;
  window.renderFarmers = function() {
    originalRenderFarmers.call(this);
    
    // Add data-farmer-id attribute to all farmer cards
    const farmerCards = document.querySelectorAll('.fcard');
    farmerCards.forEach(card => {
      // Get the farmer ID from the card content
      const farmerNameElement = card.querySelector('.fname');
      if (farmerNameElement) {
        const farmerName = farmerNameElement.textContent.trim();
        const farmer = window.farmers.find(f => f.name === farmerName);
        if (farmer) {
          card.setAttribute('data-farmer-id', farmer.id);
        }
      }
    });
  };
}

// Add long press functionality for farmer cards
function addLongPressForFarmerCards() {
  // Add event listener to the farmer grid to handle long press
  const farmerGrid = document.querySelector('.farmerGrid');
  if (farmerGrid) {
    // Use event delegation to handle clicks on farmer cards
    farmerGrid.addEventListener('mousedown', function(e) {
      const card = e.target.closest('.fcard');
      if (card) {
        const farmerId = card.getAttribute('data-farmer-id');
        if (farmerId) {
          // Start timer for long press
          const timer = setTimeout(() => {
            showDailyFarmerSummary(farmerId);
          }, 500); // 500ms for long press
            
          // Clear timer if mouse is released before timeout
          const clearTimer = () => {
            clearTimeout(timer);
          };
          
          document.addEventListener('mouseup', clearTimer, { once: true });
          document.addEventListener('mouseleave', clearTimer, { once: true });
        }
      }
    });
  }
}

// Show daily farmer summary
function showDailyFarmerSummary(farmerId) {
  const farmer = window.getFarmerById(farmerId);
  if (!farmer) return;
  
  const today = window.fmtDate(new Date());
  const todayEntries = window.entries.filter(e => 
    e.day === today && e.farmerId === farmerId
  );
  
  if (todayEntries.length === 0) {
    window.showToast("No entries for this farmer today");
    return;
  }
  
  // Calculate summary
  const totalLiters = todayEntries.reduce((sum, e) => sum + (e.qty || 0), 0);
  const totalAmount = todayEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
  const fatValues = todayEntries.map(e => e.fat);
  const minFat = Math.min(...fatValues);
  const maxFat = Math.max(...fatValues);
  const numEntries = todayEntries.length;
  const balanceAfterToday = farmer.balance || 0;
  
  // Create summary card
  const summaryCard = document.createElement('div');
  summaryCard.className = 'center-summary-card';
  summaryCard.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    width: 90%;
    max-width: 500px;
    background: white;
    border-radius: 18px;
    padding: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  `;
  
  summaryCard.innerHTML = `
    <div class="center-summary-header">
      <div class="center-summary-title">Milk Summary – ${today}</div>
      <div class="center-summary-date">Farmer: ${farmer.name}</div>
    </div>
    
    <div class="center-summary-stats">
      <div class="center-summary-stat">
        <div class="center-summary-stat-label">Entries</div>
        <div class="center-summary-stat-value">${numEntries}</div>
      </div>
      <div class="center-summary-stat">
        <div class="center-summary-stat-label">Total Milk (L)</div>
        <div class="center-summary-stat-value">${totalLiters.toFixed(1)}</div>
      </div>
      <div class="center-summary-stat">
        <div class="center-summary-stat-label">Fat Range</div>
        <div class="center-summary-stat-value">${minFat.toFixed(1)} – ${maxFat.toFixed(1)}</div>
      </div>
      <div class="center-summary-stat">
        <div class="center-summary-stat-label">Total Amount</div>
        <div class="center-summary-stat-value">₹${totalAmount.toFixed(0)}</div>
      </div>
    </div>
    
    <div style="margin-top: 15px; padding: 10px; background: #f8fafc; border-radius: 12px;">
      <div style="font-size: 14px; font-weight: 1000; color: var(--muted);">Balance After Today</div>
      <div style="font-size: 20px; font-weight: 1200; color: var(--text);">₹${balanceAfterToday.toFixed(0)}</div>
    </div>
    
    <div class="dispatch-action" style="margin-top: 20px;">
      <button class="whatsapp-share-btn" id="btnShareDailySummary">📩 Send Today Summary</button>
      <button class="footBtn" id="btnCloseDailySummary" style="margin-top: 10px; width: 100%;">Close</button>
    </div>
  `;
  
  // Add overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 999;
  `;
  
  document.body.appendChild(overlay);
  document.body.appendChild(summaryCard);
  
  // Add event listeners
  document.getElementById('btnShareDailySummary').onclick = () => {
    const summaryText = `*Milk Summary – ${today}*\n\nFarmer: ${farmer.name}\nEntries: ${numEntries}\nTotal Milk: ${totalLiters.toFixed(1)} L\nFat Range: ${minFat.toFixed(1)} – ${maxFat.toFixed(1)}\nTotal Amount: ₹${totalAmount.toFixed(0)}\nBalance After Today: ₹${balanceAfterToday.toFixed(0)}\n\n*MilkRecord System*`;
    
    // Try to open WhatsApp with the message
    window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`, '_blank');
  };
  
  document.getElementById('btnCloseDailySummary').onclick = () => {
    document.body.removeChild(overlay);
    document.body.removeChild(summaryCard);
  };
  
  // Close when clicking on overlay
  overlay.onclick = () => {
    document.body.removeChild(overlay);
    document.body.removeChild(summaryCard);
  };
}
  
  // Add event listeners for modal buttons
  if (document.getElementById('btnCloseCenterSummary')) {
    document.getElementById('btnCloseCenterSummary').onclick = () => closeOverlay("overlayCenterSummary");
  }
  
  // Add advance and deduction functionality
  addAdvanceDeductionFunctionality();

// Add advance and deduction functionality
function addAdvanceDeductionFunctionality() {
  // Add advance/deduction buttons to the farmer detail modal
  const originalOpenFarmerDetail = window.openFarmerDetail;
  window.openFarmerDetail = function(fId) {
    originalOpenFarmerDetail(fId);
    
    // Add advance/deduction buttons if they don't exist
    const advAmountInput = document.getElementById('advAmount');
    if (advAmountInput) {
      // Add a note field for advance adjustments
      let noteField = document.getElementById('advNote');
      if (!noteField) {
        noteField = document.createElement('input');
        noteField.id = 'advNote';
        noteField.type = 'text';
        noteField.placeholder = 'Optional note';
        noteField.style.cssText = `
          width: 100%;
          padding: 10px;
          margin-top: 10px;
          border: 1px solid var(--line);
          border-radius: 8px;
          font-size: 16px;
        `;
        
        // Insert after the amount input
        advAmountInput.parentNode.insertBefore(noteField, advAmountInput.nextSibling);
      }
    }
  };
  
  // Update the advance handling functions
  const originalHandleAdvanceChange = window.handleAdvanceChange;
  window.handleAdvanceChange = function(isAdding) {
    if (originalHandleAdvanceChange) {
      originalHandleAdvanceChange(isAdding);
      return;
    }
    
    const amt = Number(document.getElementById("advAmount").value);
    if (amt <= 0) {
      window.showToast("Enter valid amount");
      return;
    }
    
    const note = document.getElementById("advNote").value || "Adjustment";
    const f = window.getFarmerById(window.selectedFarmerId);
    if (!f) return;

    if (isAdding) {
      f.advance = (f.advance || 0) + amt;
      f.balance = (f.balance || 0) - amt;
      window.showToast(`₹${amt} Advance Added ✅`);
    } else {
      if ((f.advance || 0) < amt) {
        window.showToast("Not enough advance");
        return;
      }
      f.advance = (f.advance || 0) - amt;
      f.balance = (f.balance || 0) + amt;
      window.showToast(`₹${amt} Advance Cut ✂️`);
    }
    
    // Log the adjustment for audit trail
    const adjustmentEntry = {
      id: window.uid("adj"),
      farmerId: f.id,
      farmerName: f.name || "",
      type: isAdding ? "advance_given" : "advance_cut",
      amount: amt,
      note: note,
      date: window.fmtDate(new Date()),
      time: window.fmtTime(new Date()),
      recordedAt: Date.now()
    };
    
    // Save adjustment log (in a real app, you'd have a separate storage for adjustments)
    if (!window.adjustmentLog) {
      window.adjustmentLog = [];
    }
    window.adjustmentLog.push(adjustmentEntry);
    
    window.saveFarmers(window.farmers);
    document.getElementById("advAmount").value = "";
    document.getElementById("advNote").value = "";
    window.closeOverlay("overlayFarmerDetail");
    window.renderAll();
  }

  // Add click handlers for the advance buttons
  const originalOnload = window.onload || function() {};
  window.onload = function() {
    originalOnload();
    
    // Add event listeners to the advance buttons if they exist
    const addAdvBtn = document.getElementById('btnAddAdv');
    const cutAdvBtn = document.getElementById('btnCutAdv');
    
    if (addAdvBtn) {
      addAdvBtn.onclick = () => window.handleAdvanceChange(true);
    }
    
    if (cutAdvBtn) {
      cutAdvBtn.onclick = () => window.handleAdvanceChange(false);
    }
  };
  
  // Add image proof functionality
  addImageProofFunctionality();
  
  // Add entry detail drawer functionality
  addEntryDetailDrawerFunctionality();
  
  // Add hardware acknowledgment indicator
  addHardwareAcknowledgmentIndicator();
  
  // Add sync and safety UX
  addSyncAndSafetyUX();
}

// Add entry detail drawer functionality
function addEntryDetailDrawerFunctionality() {
  // Create the entry detail drawer
  window.showEntryDetailDrawer = function(entryId) {
    const entry = window.entries.find(e => e.id === entryId);
    if (!entry) return;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'entry-detail-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 2000;
      display: flex;
      justify-content: center;
      align-items: flex-end;
    `;
    
    // Create drawer
    const drawer = document.createElement('div');
    drawer.id = 'entry-detail-drawer';
    drawer.style.cssText = `
      width: 100%;
      max-width: 500px;
      background: white;
      border-radius: 18px 18px 0 0;
      padding: 20px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 -10px 30px rgba(0,0,0,0.2);
    `;
    
    // Format the entry details
    const entrySource = entry.entrySource || "auto";
    const editedStatus = entry.edited ? "Yes" : "No";
    const recordedTime = new Date(entry.recordedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const editedTime = entry.editedAt ? new Date(entry.editedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "N/A";
    
    drawer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: var(--text);">Entry Details</h3>
        <button onclick="closeEntryDetailDrawer()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
      </div>
      
      <div style="margin-bottom: 15px; padding: 15px; background: #f8fafc; border-radius: 12px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div><strong>Qty:</strong> ${entry.qty} L</div>
          <div><strong>Fat:</strong> ${entry.fat}%</div>
          <div><strong>SNF:</strong> ${entry.snf}</div>
          <div><strong>Rate:</strong> ₹${entry.ratePerL}/L</div>
        </div>
      </div>
      
      <div style="margin-bottom: 15px; padding: 15px; background: #f8fafc; border-radius: 12px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div><strong>Recorded Time:</strong> ${recordedTime}</div>
          <div><strong>Entry Source:</strong> ${entrySource}</div>
          <div><strong>Device ID:</strong> ${entry.deviceId || "N/A"}</div>
          <div><strong>Edited:</strong> ${editedStatus}</div>
          ${entry.edited ? `<div><strong>Last Edit:</strong> ${editedTime}</div>` : ''}
        </div>
      </div>
      
      ${entry.previousValues ? `
      <div style="margin-bottom: 15px; padding: 15px; background: #fffbeb; border-radius: 12px;">
        <h4 style="margin: 0 0 10px 0; color: var(--text);">Previous Values:</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div><strong>Qty:</strong> ${entry.previousValues.qty || 'N/A'}</div>
          <div><strong>Fat:</strong> ${entry.previousValues.fat || 'N/A'}</div>
          <div><strong>SNF:</strong> ${entry.previousValues.snf || 'N/A'}</div>
          <div><strong>Rate:</strong> ₹${entry.previousValues.rate || 'N/A'}/L</div>
        </div>
      </div>
      ` : ''}
      
      <div style="margin-bottom: 20px; text-align: center;">
        <button class="whatsapp-share-btn" onclick="sendEntryProof('${entryId}')" style="width: 100%;">
          📩 Send Entry Proof
        </button>
      </div>
    `;
    
    overlay.appendChild(drawer);
    document.body.appendChild(overlay);
  };
  
  // Close the entry detail drawer
  window.closeEntryDetailDrawer = function() {
    const overlay = document.getElementById('entry-detail-overlay');
    if (overlay) {
      document.body.removeChild(overlay);
    }
  };
  
  // Send entry proof via WhatsApp
  window.sendEntryProof = function(entryId) {
    const entry = window.entries.find(e => e.id === entryId);
    if (!entry) return;
    
    const entrySource = entry.entrySource || "auto";
    const editedStatus = entry.edited ? "Yes" : "No";
    const recordedTime = new Date(entry.recordedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const proofText = `*Entry Proof*\n\n` +
                     `Date: ${entry.day}\n` +
                     `Farmer: ${entry.farmerName}\n` +
                     `Qty: ${entry.qty} L\n` +
                     `Fat: ${entry.fat}%\n` +
                     `SNF: ${entry.snf}\n` +
                     `Amount: ₹${entry.amount}\n` +
                     `Recorded: ${recordedTime}\n` +
                     `Source: ${entrySource}\n` +
                     `Edited: ${editedStatus}\n\n` +
                     `*MilkRecord System*`;
    
    // Try to open WhatsApp with the message
    window.open(`https://wa.me/?text=${encodeURIComponent(proofText)}`, '_blank');
    closeEntryDetailDrawer();
  };
  
  // Close drawer when clicking on overlay
  document.addEventListener('click', function(e) {
    if (e.target.id === 'entry-detail-overlay') {
      window.closeEntryDetailDrawer();
    }
  });
}

// Add hardware acknowledgment indicator
function addHardwareAcknowledgmentIndicator() {
  // Add a small indicator near the timer
  const timerBox = document.getElementById('timerBox');
  if (timerBox) {
    // Create the indicator
    let hardwareIndicator = document.getElementById('hardware-indicator');
    if (!hardwareIndicator) {
      hardwareIndicator = document.createElement('div');
      hardwareIndicator.id = 'hardware-indicator';
      hardwareIndicator.style.cssText = `
        position: absolute;
        top: 10px;
        right: 60px;
        font-size: 12px;
        font-weight: 900;
        color: #64748b;
        display: flex;
        align-items: center;
        gap: 4px;
      `;
      hardwareIndicator.innerHTML = `<span style="color: #10b981;">●</span> Reading: Manual`;
      
      // Add to the topbar
      const topbar = document.querySelector('.topbar');
      if (topbar) {
        topbar.appendChild(hardwareIndicator);
      }
    }
  }
}

// Add sync and safety UX
function addSyncAndSafetyUX() {
  // Add sync status indicator to settings modal
  const settingsModal = document.querySelector('#overlaySettings .modalBody');
  if (settingsModal) {
    // Create sync status section
    const syncStatusDiv = document.createElement('div');
    syncStatusDiv.id = 'sync-status-section';
    syncStatusDiv.style.cssText = `
      margin-top: 20px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid var(--line);
    `;
    
    syncStatusDiv.innerHTML = `
      <h4 style="margin-top: 0; margin-bottom: 10px;">Data Safety</h4>
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="color: #10b981;">●</span>
        <span style="font-weight: 1000; color: var(--text);">Offline – Data safe on this device</span>
      </div>
      <div style="font-size: 13px; color: var(--muted); margin-top: 10px;">
        Your data is saved on this device.<br>
        Auto-sync happens when internet is available.<br>
        Export weekly for extra safety.
      </div>
    `;
    
    settingsModal.appendChild(syncStatusDiv);
  }
}

// Add image proof functionality
function addImageProofFunctionality() {
  // Add image capture after entry save
  const originalSaveEntry = window.saveEntry;
  window.saveEntry = function() {
    // Store the image before calling original save
    const capturedImage = window.currentEntryImage;
    
    // Call the original save function
    const result = originalSaveEntry.apply(this, arguments);
    
    // Clear the image after saving
    window.currentEntryImage = null;
    
    return result;
  };
  
  // Add image viewing functionality in entry details
  const originalEditEntry = window.editEntry;
  window.editEntry = function(id) {
    originalEditEntry(id);
    
    // Add image preview functionality if images exist
    const entry = window.entries.find(e => e.id === id);
    if (entry && entry.images && entry.images.length > 0) {
      // Create image preview element
      let imagePreview = document.getElementById('entry-image-preview');
      if (!imagePreview) {
        imagePreview = document.createElement('div');
        imagePreview.id = 'entry-image-preview';
        imagePreview.style.cssText = `
          margin-top: 15px;
          padding: 15px;
          background: #f8fafc;
          border-radius: 12px;
        `;
        
        // Add after the slip number input if it exists
        const slipInput = document.getElementById('slipNumberInput');
        if (slipInput) {
          slipInput.parentNode.insertBefore(imagePreview, slipInput.nextSibling);
        } else {
          // Add to the inputs container
          const inputsContainer = document.querySelector('.inputs');
          if (inputsContainer) {
            inputsContainer.appendChild(imagePreview);
          }
        }
      }
      
      // Display the image thumbnail
      imagePreview.innerHTML = `
        <div style="font-weight: 1000; margin-bottom: 10px;">Entry Proof:</div>
        <img src="${entry.images[0]}" style="max-width: 100%; border-radius: 8px; cursor: pointer;" onclick="viewProof('${entry.images[0]}')" title="View full image">
      `;
    }
  };
}
  
  if (document.getElementById('btnMarkDispatch')) {
    document.getElementById('btnMarkDispatch').onclick = () => {
      closeOverlay("overlayCenterSummary");
      openOverlay("overlayDispatch");
    };
  }
  
  if (document.getElementById('btnShareCenterSummary')) {
    document.getElementById('btnShareCenterSummary').onclick = () => {
      // Share center summary via WhatsApp
      const today = window.fmtDate(new Date());
      const summaryText = `*Collection Summary – ${today}*\n\n` +
                         `Center: ${window.collectionPoints.find(cp => cp.id === window.selectedCollectionPointId)?.name || "Unknown"}\n` +
                         `Entries: 42\n` +
                         `Total Milk: 612.5 L\n` +
                         `Fat Range: 5.9 – 6.4\n` +
                         `Total Amount: ₹28,430\n\n` +
                         `*MilkRecord System*`;
                         
      // Try to open WhatsApp with the message
      window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`, '_blank');
    };
  }
  
  if (document.getElementById('btnSaveDispatch')) {
    document.getElementById('btnSaveDispatch').onclick = () => {
      const milkQty = parseFloat(document.getElementById("dispatchMilkQty").value);
      const destination = document.getElementById("dispatchDestination").value;
      const notes = document.getElementById("dispatchNotes").value;
      
      if (!milkQty || milkQty <= 0) {
        window.showToast("Please enter valid milk quantity");
        return;
      }
      
      // Create dispatch record
      const dispatch = {
        dispatchId: window.uid("d"),
        collectionPointId: window.selectedCollectionPointId, // Use currently selected point
        date: window.fmtDate(new Date()),
        shift: window.autoSessionLabel(),
        totalMilkSent: milkQty,
        destination: destination,
        recordedAt: Date.now(),
        deviceId: "WEB-" + navigator.userAgent.substring(0, 10),
        notes: notes
      };
      
      // Add to dispatch records and save
      if (!window.dispatchRecords) {
        window.dispatchRecords = [];
      }
      window.dispatchRecords.push(dispatch);
      saveDispatchRecords(window.dispatchRecords);
      
      window.showToast(`Dispatch record saved: ${milkQty}L sent to ${destination}`);
      closeOverlay("overlayDispatch");
      
      // Refresh the center summary to show updated dispatch info
      if (document.getElementById('overlayCenterSummary').style.display === 'flex') {
        renderCenterSummary();
      }
    };
  }

  if (document.getElementById('btnCancelDispatch')) {
    document.getElementById('btnCancelDispatch').onclick = () => closeOverlay("overlayDispatch");
  }
  
  if (document.getElementById('btnSaveBMCReconcile')) {
    document.getElementById('btnSaveBMCReconcile').onclick = () => {
      const batchId = document.getElementById("bmcBatchId").value;
      const milkReceived = parseFloat(document.getElementById("bmcMilkReceived").value);
      const avgFat = parseFloat(document.getElementById("bmcAvgFat").value);
      const rateApplied = parseFloat(document.getElementById("bmcRateApplied").value);
      
      if (!batchId || !milkReceived || !avgFat || !rateApplied) {
        window.showToast("Please fill all BMC information");
        return;
      }
      
      // Mark entries as linked to this BMC batch
      const today = window.fmtDate(new Date());
      window.entries = window.entries.map(entry => {
        if (entry.day === today) {
          return {...entry, bmcLinked: true, bmcBatchId: batchId};
        }
        return entry;
      });
      
      window.saveEntries(window.entries);
      
      window.showToast(`Entries linked to BMC Batch: ${batchId}`);
      closeOverlay("overlayBMCReconcile");
    };
  }
  
  if (document.getElementById('btnCancelBMCReconcile')) {
    document.getElementById('btnCancelBMCReconcile').onclick = () => closeOverlay("overlayBMCReconcile");
  }
  
  if (document.getElementById('btnClosePaymentObligation')) {
    document.getElementById('btnClosePaymentObligation').onclick = () => closeOverlay("overlayPaymentObligation");
  }
  
  if (document.getElementById('btnSharePaymentSummary')) {
    document.getElementById('btnSharePaymentSummary').onclick = () => {
      const today = window.fmtDate(new Date());
      const milkAmount = document.getElementById("paymentMilkAmount").textContent;
      const advancesCut = document.getElementById("paymentAdvancesCut").textContent;
      const netPayable = document.getElementById("paymentNetPayable").textContent;
      const totalFarmers = document.getElementById("paymentTotalFarmers").textContent;

      const summaryText = `*Payment Obligation Summary – ${today}*\n\n` +
                         `Milk Amount: ${milkAmount}\n` +
                         `Advances Cut: ${advancesCut}\n` +
                         `Net Payable: ${netPayable}\n` +
                         `Total Farmers: ${totalFarmers}\n\n` +
                         `*MilkRecord System*`;

      // Try to open WhatsApp with the message
      window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`, '_blank');
    };
  }
}

// Helper function to close overlay
function closeOverlay(id) {
  document.getElementById(id).style.display = "none";
}

// Helper function to open overlay
function openOverlay(id) {
  document.getElementById(id).style.display = "flex";
  if (id === "overlayCenterSummary") renderCenterSummary();
  if (id === "overlayBMCReconcile") updateBMCReconciliation();
  if (id === "overlayPaymentObligation") updatePaymentObligation();
}

// Render center summary
function renderCenterSummary() {
  // Calculate summary for the selected collection point
  const today = window.fmtDate(new Date());
  const selectedPointId = window.selectedCollectionPointId || "DEFAULT";
  
  // Filter entries for the selected collection point and today's date
  const todayEntries = window.entries.filter(e => 
    e.day === today && 
    e.collectionPointId === selectedPointId
  );
  
  // Calculate summary statistics
  const totalEntries = todayEntries.length;
  const totalMilk = todayEntries.reduce((sum, e) => sum + (e.qty || 0), 0);
  const totalAmount = todayEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
  
  // Calculate fat range
  let minFat = Infinity;
  let maxFat = -Infinity;
  let totalFat = 0;
  todayEntries.forEach(e => {
    if (e.fat < minFat) minFat = e.fat;
    if (e.fat > maxFat) maxFat = e.fat;
    totalFat += e.fat;
  });
  
  const avgFat = totalEntries > 0 ? (totalFat / totalEntries).toFixed(1) : "N/A";
  const fatRange = totalEntries > 0 ? `${minFat.toFixed(1)} – ${maxFat.toFixed(1)}` : "N/A";
  
  // Get the collection point name
  const collectionPoint = window.collectionPoints.find(cp => cp.id === selectedPointId);
  const pointName = collectionPoint ? collectionPoint.name : "Unknown";
  
  // Update the UI elements
  document.querySelector('.center-summary-title').textContent = `Collection Summary – ${today}`;
  document.querySelector('.center-summary-date').textContent = `Center: ${pointName}`;
  
  // Update stats
  document.querySelectorAll('.center-summary-stat-value')[0].textContent = totalEntries;
  document.querySelectorAll('.center-summary-stat-value')[1].textContent = `${totalMilk.toFixed(1)} L`;
  document.querySelectorAll('.center-summary-stat-value')[2].textContent = fatRange;
  document.querySelectorAll('.center-summary-stat-value')[3].textContent = `₹${totalAmount.toFixed(0)}`;
  
  // Also update the dispatch information if needed
  updateDispatchInfoForCenter();
}

// Update dispatch information for the center
function updateDispatchInfoForCenter() {
  // This would normally get dispatch records for the selected center
  // For now, we'll simulate with sample data
  const selectedPointId = window.selectedCollectionPointId || "DEFAULT";
  
  // In a real implementation, you would fetch dispatch records for this center
  // For demo purposes, we'll calculate based on entries
  const today = window.fmtDate(new Date());
  const todayEntries = window.entries.filter(e => 
    e.day === today && 
    e.collectionPointId === selectedPointId
  );
  
  const totalMilk = todayEntries.reduce((sum, e) => sum + (e.qty || 0), 0);
  
  // Simulate dispatch info - in reality this would come from dispatch records
  const dispatchRecord = window.dispatchRecords?.find(d => 
    d.date === today && d.collectionPointId === selectedPointId
  );
  
  if (dispatchRecord) {
    const difference = totalMilk - dispatchRecord.totalMilkSent;
    const status = Math.abs(difference) < 0.1 ? "✅ Match" : `⚠ Difference: ${difference > 0 ? '+' : ''}${difference.toFixed(1)} L`;
    
    // Add status to the summary card if needed
    let statusElement = document.getElementById('dispatch-status');
    if (!statusElement) {
      statusElement = document.createElement('div');
      statusElement.id = 'dispatch-status';
      statusElement.style.cssText = `
        margin-top: 15px;
        padding: 10px;
        border-radius: 8px;
        background: #f8fafc;
        text-align: center;
        font-weight: 1000;
      `;
      
      const summaryCard = document.querySelector('.center-summary-card');
      summaryCard.appendChild(statusElement);
    }
    
    statusElement.textContent = status;
    statusElement.style.color = Math.abs(difference) < 0.1 ? '#16a34a' : '#dc2626';
  }
}

// Update BMC reconciliation to show comparison
function updateBMCReconciliation() {
  const today = window.fmtDate(new Date());
  
  // Calculate total milk from entries for today
  const todayEntries = window.entries.filter(e => e.day === today);
  const totalSlipsMilk = todayEntries.reduce((sum, e) => sum + (e.qty || 0), 0);
  
  // Calculate average fat from entries
  const totalFat = todayEntries.reduce((sum, e) => sum + (e.fat || 0), 0);
  const avgFat = todayEntries.length > 0 ? (totalFat / todayEntries.length).toFixed(2) : "0.00";
  
  // Show in the reconciliation panel
  document.getElementById("reconcileSlipsMilk").textContent = `${totalSlipsMilk.toFixed(1)} L`;
  
  // When BMC values are entered, calculate difference
  const bmcMilkInput = document.getElementById("bmcMilkReceived");
  if (bmcMilkInput) {
    // Clear previous event listeners to prevent duplicates
    const newInput = bmcMilkInput.cloneNode(true);
    bmcMilkInput.parentNode.replaceChild(newInput, bmcMilkInput);
    const updatedBmcMilkInput = document.getElementById("bmcMilkReceived");
    
    updatedBmcMilkInput.addEventListener("input", function() {
      const bmcMilk = parseFloat(this.value) || 0;
      const difference = bmcMilk - totalSlipsMilk;
      const variancePercent = totalSlipsMilk > 0 ? ((difference / totalSlipsMilk) * 100).toFixed(2) : "0.00";
      
      document.getElementById("reconcileDifference").textContent = `${difference.toFixed(1)} L (${variancePercent}%)`;
      
      // Update color based on difference
      const diffElement = document.getElementById("reconcileDifference");
      if (Math.abs(difference) < 0.1) {
        diffElement.style.color = "#16a34a"; // green
      } else if (Math.abs(difference) < 1.0) {
        diffElement.style.color = "#f59e0b"; // orange
      } else {
        diffElement.style.color = "#dc2626"; // red
      }
    });
  }
  
  // Pre-fill the avg fat field with calculated value
  const avgFatField = document.getElementById("bmcAvgFat");
  if (avgFatField && !avgFatField.value) {
    avgFatField.value = avgFat;
  }
  
  // Pre-fill milk received with total slips milk as reference
  const milkReceivedField = document.getElementById("bmcMilkReceived");
  if (milkReceivedField && !milkReceivedField.value) {
    milkReceivedField.value = totalSlipsMilk.toFixed(2);
  }
  
  // Update the reconciliation summary text
  const reconcileSummary = document.querySelector('#overlayBMCReconcile .modalBody div[style*="background"]');
  if (reconcileSummary) {
    reconcileSummary.innerHTML = `
      <h4 style="margin-top: 0;">Reconciliation Summary</h4>
      <p><strong>Slips Milk:</strong> <span id="reconcileSlipsMilk">${totalSlipsMilk.toFixed(1)} L</span></p>
      <p><strong>BMC Received:</strong> <span id="reconcileBmcReceived">0.00 L</span></p>
      <p><strong>Difference:</strong> <span id="reconcileDifference">0.0 L (0.00%)</span></p>
      <p><strong>Avg Fat (BMC):</strong> <span id="reconcileBmcFat">${avgFat}</span></p>
      <p><strong>Rate Applied:</strong> <span id="reconcileBmcRate">₹0.00</span></p>
    `;
  }
}

// Calculate and display payment obligation
function updatePaymentObligation() {
  const today = window.fmtDate(new Date());
  
  // Calculate total milk amount for today
  const todayEntries = window.entries.filter(e => e.day === today);
  const totalMilkAmount = todayEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
  
  // Calculate advances cut for today (this would come from farmer advances)
  // For now, we'll calculate based on farmer balances
  let totalAdvancesCut = 0;
  // In a real implementation, you would track advance cuts separately
  // For demo, we'll use a simple calculation based on farmer balances
  window.farmers.forEach(farmer => {
    if (farmer.advance && farmer.advance > 0) {
      totalAdvancesCut += farmer.advance;
    }
  });
  
  // Calculate net payable
  const netPayable = totalMilkAmount - totalAdvancesCut;
  
  // Count unique farmers for today
  const uniqueFarmers = new Set(todayEntries.map(e => e.farmerId));
  const totalFarmers = uniqueFarmers.size;
  
  // Calculate total milk quantity
  const totalMilkQuantity = todayEntries.reduce((sum, e) => sum + (e.qty || 0), 0);
  
  // Update the UI elements
  document.getElementById("paymentMilkAmount").textContent = `₹${totalMilkAmount.toFixed(0)}`;
  document.getElementById("paymentAdvancesCut").textContent = `₹${totalAdvancesCut.toFixed(0)}`;
  document.getElementById("paymentNetPayable").textContent = `₹${netPayable.toFixed(0)}`;
  document.getElementById("paymentTotalFarmers").textContent = totalFarmers;
  document.getElementById("paymentObligationTitle").textContent = `For ${today}`;
  
  // Add additional information to the summary card
  let additionalInfo = document.getElementById('payment-additional-info');
  if (!additionalInfo) {
    additionalInfo = document.createElement('div');
    additionalInfo.id = 'payment-additional-info';
    additionalInfo.style.cssText = `
      margin-top: 15px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 12px;
    `;
    
    const summaryCard = document.querySelector('.center-summary-card');
    summaryCard.appendChild(additionalInfo);
  }
  
  additionalInfo.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div style="background: #f1f5f9; padding: 10px; border-radius: 8px;">
        <div style="font-size: 12px; color: var(--muted); font-weight: 1000;">Total Milk (L)</div>
        <div style="font-size: 18px; font-weight: 1200; color: var(--text);">${totalMilkQuantity.toFixed(1)}</div>
      </div>
      <div style="background: #f1f5f9; padding: 10px; border-radius: 8px;">
        <div style="font-size: 12px; color: var(--muted); font-weight: 1000;">Avg Rate</div>
        <div style="font-size: 18px; font-weight: 1200; color: var(--text);">₹${(totalMilkAmount/totalMilkQuantity || 0).toFixed(2)}/L</div>
      </div>
    </div>
  `;
}

// Update the renderHistory function to include center summary button
function extendRenderHistory() {
  const originalRenderHistory = window.renderHistory;
  window.renderHistory = function() {
    originalRenderHistory();

    // Add center summary button to history footer
    const centerSummaryBtn = document.createElement('button');
    centerSummaryBtn.className = 'footBtn';
    centerSummaryBtn.id = 'btnCenterSummary';
    centerSummaryBtn.innerHTML = '📍 Center Summary';
    centerSummaryBtn.onclick = () => openOverlay('overlayCenterSummary');

    // Add the button to the history modal footer if it doesn't exist
    const historyFooter = document.querySelector('#overlayHistory .modalFoot');
    if (historyFooter && !document.getElementById('btnCenterSummary')) {
      historyFooter.insertBefore(centerSummaryBtn, historyFooter.firstChild);
    }

    // Add payment obligation button to history footer
    const paymentObligationBtn = document.createElement('button');
    paymentObligationBtn.className = 'footBtn';
    paymentObligationBtn.id = 'btnPaymentObligation';
    paymentObligationBtn.innerHTML = '💰 Payment Obligation';
    paymentObligationBtn.onclick = () => openOverlay('overlayPaymentObligation');

    // Add the button to the history modal footer if it doesn't exist
    if (historyFooter && !document.getElementById('btnPaymentObligation')) {
      historyFooter.appendChild(paymentObligationBtn);
    }
  };
}

// Initialize dispatch records
function initDispatchRecords() {
  if (!window.dispatchRecords) {
    window.dispatchRecords = [];
  }
  
  // Load from localStorage if available
  try {
    const savedRecords = JSON.parse(localStorage.getItem('milkapp_dispatch_records_v1') || "[]") || [];
    window.dispatchRecords = savedRecords;
  } catch (e) {
    window.dispatchRecords = [];
  }
}

// Save dispatch records to localStorage
function saveDispatchRecords(records) {
  localStorage.setItem('milkapp_dispatch_records_v1', JSON.stringify(records));
  window.dispatchRecords = records; // Update global variable
}

// Initialize the extended functionality
function initExtendedFunctionality() {
  // Add data structures
  addDataStructures();
  
  // Add CSS for new elements
  addExtendedStyles();
  
  // Add modals
  addModals();
  
  // Add collection point selector
  addCollectionPointSelector();
  
  // Add slip number input
  addSlipNumberInput();
  
  // Update table headers
  updateTableHeader();
  
  // Initialize dispatch records
  initDispatchRecords();
  
  // Extend functions
  extendSaveEntry();
  extendRenderRecentToday();
  extendEditEntry();
  extendRenderHistory();
  extendRenderFarmers(); // NEW: Extend renderFarmers to add data attributes
  
  // Add event listeners
  addEventListeners();
  
  // Update the header with collection point info
  setTimeout(updateHeaderWithCollectionPoint, 500); // Delay to ensure DOM is ready
  
  console.log("MilkRecord Extended Functionality Loaded");
}

// Wait for the DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExtendedFunctionality);
} else {
  initExtendedFunctionality();
}