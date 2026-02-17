// MilkRecord Extension Integration Script
// This script adds the extended functionality to the existing index.html

// Add collection point selector to the existing form
function addCollectionPointSelector() {
  // Find the inputs container
  const inputsContainer = document.querySelector('.inputs');
  if (!inputsContainer) return;
  
  // Create collection point selector element
  const collectionPointDiv = document.createElement('div');
  collectionPointDiv.className = 'collection-point-selector';
  collectionPointDiv.innerHTML = `
    <label>Collection Point:</label>
    <select id="collectionPointSelect">
      <option value="DEFAULT">Default Booth</option>
      <option value="VILLAGE_A">Village A Booth</option>
      <option value="VILLAGE_B">Village B Booth</option>
      <option value="VILLAGE_C">Village C Booth</option>
    </select>
  `;
  
  // Insert after the animal/rate section
  const row3 = document.querySelector('.row3');
  if (row3) {
    row3.parentNode.insertBefore(collectionPointDiv, row3.nextSibling);
  } else {
    inputsContainer.appendChild(collectionPointDiv);
  }
}

// Add slip number input
function addSlipNumberInput() {
  const inputsContainer = document.querySelector('.inputs');
  if (!inputsContainer) return;
  
  const slipNumberDiv = document.createElement('div');
  slipNumberDiv.className = 'slip-number-input';
  slipNumberDiv.innerHTML = `
    <label>Slip Number:</label>
    <input type="text" id="slipNumberInput" placeholder="Enter slip number">
  `;
  
  // Find the manual override section and insert before it
  const manualOverride = document.querySelector('.manualOverride');
  if (manualOverride) {
    manualOverride.parentNode.insertBefore(slipNumberDiv, manualOverride);
  } else {
    inputsContainer.appendChild(slipNumberDiv);
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

// Update the table rows to include collection point
function updateTableRows() {
  const tableRows = document.querySelectorAll('#recentTbody tr');
  tableRows.forEach(row => {
    // Check if the collection point cell already exists
    if (row.children.length < 9) { // Original had 8 columns
      const pointTd = document.createElement('td');
      pointTd.textContent = 'Default'; // This would be replaced with actual point name
      row.appendChild(pointTd);
    }
  });
}

// Add extended functionality to saveEntry function
function extendSaveEntry() {
  // Store the original saveEntry function
  const originalSaveEntry = window.saveEntry;
  
  // Override the saveEntry function to include extended functionality
  window.saveEntry = function() {
    // Call the original function first
    if (originalSaveEntry) {
      // Temporarily remove the override to call the original
      window.saveEntry = originalSaveEntry;
      const result = originalSaveEntry.apply(this, arguments);
      // Restore the extended version
      window.saveEntry = arguments.callee;
      return result;
    }
    
    // If there's no original function, implement the extended version
    if (!canSave()) {
      showToast("Need: Farmer + Qty + Fat");
      return;
    }
    const farmer = getFarmerById(selectedFarmerId);
    if (!farmer) {
      showToast("Select farmer");
      return;
    }

    const before = farmerBalanceBefore(farmer);
    const ratePerL = getRatePerLiter();
    const amount = getAmount();
    const after = round2(before + amount);

    // NEW: Get slip number
    const slipNumber = document.getElementById("slipNumberInput")?.value.trim() || null;
    const collectionPointId = document.getElementById("collectionPointSelect")?.value || "DEFAULT";

    const entry = {
      id: uid("e"),
      farmerId: farmer.id,
      farmerName: farmer.name || "",
      qty: round2(qty),
      fat: round2(fat),
      snf: round2(snf),
      animal,
      rateMode,
      ratePerL: round2(ratePerL),
      amount: round2(amount),
      before,
      after,
      session: autoSessionLabel(),
      createdAt: Date.now(),
      day: fmtDate(new Date()),
      
      // NEW: Extended entry data model
      collectionPointId: collectionPointId,
      collectionPointName: collectionPoints?.find(cp => cp.id === collectionPointId)?.name || "Unknown",
      entrySource: "auto", // default
      deviceId: "WEB-" + navigator.userAgent.substring(0, 10), // simplified device ID
      recordedAt: Date.now(),
      edited: false,
      editedAt: null,
      previousValues: null,
      slipNumber: slipNumber, // NEW: Slip number
      bmcLinked: false,       // default
      bmcBatchId: null,       // default

      images: currentEntryImage ? [currentEntryImage] : [],
      edited: false,
      editedAt: null
    };

    // Update farmer balance
    farmer.balance = after;
    saveFarmers(farmers);

    // Save entry
    entries.push(entry);
    saveEntries(entries);

    // Set undo token (only last entry)
    saveUndoToken({
      entryId: entry.id,
      farmerId: farmer.id,
      prevBalance: before,
    });

    // Clear input quickly
    qty = 0;
    fat = 0;
    snf = 0;
    manualRate = 0;
    manualRateInput.value = "";
    document.getElementById("slipNumberInput").value = ""; // NEW: Clear slip number
    showToast("SAVED ✅");
    currentEntryImage = null;
    const imgInput = document.getElementById("fImageEntry");
    if(imgInput) imgInput.value = "";
    
    autoNextFarmer();
    renderAll();

    // 1. Poori body par flash class lagayein
    document.body.classList.add("flash-success");

    // 2. Animation khatam hone ke baad class hata dein
    setTimeout(() => {
        document.body.classList.remove("flash-success");
    }, 600);
    updateDailySummaryButton(); // Extra safety ke liye
    showToast("Entry Saved Successfully! ✅");
  };
}

// Initialize the extended functionality
function initExtendedFunctionality() {
  // Add collection point selector
  addCollectionPointSelector();
  
  // Add slip number input
  addSlipNumberInput();
  
  // Update table headers
  updateTableHeader();
  
  // Extend saveEntry function
  extendSaveEntry();
  
  // Add CSS for new elements
  addExtendedStyles();
  
  console.log("MilkRecord Extended Functionality Loaded");
}

// Add CSS for new elements
function addExtendedStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Collection Point Selector */
    .collection-point-selector {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
        padding: 10px;
        border: 1px solid var(--line);
        border-radius: 16px;
        background: #fff;
    }

    .collection-point-selector label {
        font-weight: 1000;
        color: var(--muted);
        font-size: 12px;
        letter-spacing: 0.3px;
    }

    .collection-point-selector select {
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
  `;
  document.head.appendChild(style);
}

// Wait for the DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExtendedFunctionality);
} else {
  initExtendedFunctionality();
}