// Main Work Functions - Missing Functions Implementation

// Initialize state if not already defined
let state;
const STORAGE_KEY = 'milkbook_data';
const INITIAL_STATE = {
    auth: {
        isAuthenticated: true,
        user: { name: 'Ramesh Kumar', mobile: '9876543210', role: 'owner' },
        role: 'owner'
    },
    currentScreen: 'collection',
    dairyInfo: {
        name: 'Gopal Dairy Shop',
        owner: 'Ramesh Kumar',
        mobile: '9876543210',
        address: '',
        rateType: 'Fat_SNF',
        language: 'EN'
    },
    farmers: [],
    milkEntries: [],
    rates: {
        cow: { base: 40, fatRef: 3.5, snfRef: 8.5 },
        buffalo: { base: 60, fatRef: 6.0, snfRef: 9.0 }
    },
    payments: [],
    sales: [],
    inventory: [],
    evidenceRecords: [], // For MilkLedger Transparent functionality
    settings: {
        backupEnabled: true,
        lastBackup: null,
        printerName: 'Default',
        syncState: 'QUARANTINED', // 'QUARANTINED' | 'SYNCED'
        lastServerSync: null,
        pendingRecords: 0,
        lastSyncTime: null,
        localRecordsToday: 0
    }
};

// Load state from localStorage
state = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(INITIAL_STATE));

// Ensure state structure is correct
if (!state.farmers) state.farmers = [];
if (!state.milkEntries) state.milkEntries = [];
if (!state.payments) state.payments = [];
if (!state.sales) state.sales = [];
if (!state.inventory) state.inventory = [];
if (!state.evidenceRecords) state.evidenceRecords = [];
if (!state.settings) state.settings = INITIAL_STATE.settings;

// Function to adjust quantity
function adjustQuantity(change) {
    const qtyInput = document.getElementById('quantityInput');
    if (!qtyInput) {
        console.error('quantityInput element not found');
        return;
    }
    let currentValue = parseFloat(qtyInput.value) || 0;
    currentValue = Math.max(0, currentValue + change); // Prevent negative values
    qtyInput.value = currentValue.toFixed(2);
    updateCalculatedAmount();
}

// Function to adjust fat percentage
function adjustFat(change) {
    const fatInput = document.getElementById('fatInput');
    if (!fatInput) {
        console.error('fatInput element not found');
        return;
    }
    let currentValue = parseFloat(fatInput.value) || 0;
    currentValue = Math.max(0, currentValue + change); // Prevent negative values
    fatInput.value = currentValue.toFixed(2);
    updateCalculatedAmount();
}

// Function to adjust SNF
function adjustSNF(change) {
    const snfInput = document.getElementById('snfInput');
    if (!snfInput) {
        console.error('snfInput element not found');
        return;
    }
    let currentValue = parseFloat(snfInput.value) || 0;
    currentValue = Math.max(0, currentValue + change); // Prevent negative values
    snfInput.value = currentValue.toFixed(2);
    updateCalculatedAmount();
}

// Function to adjust rate
function adjustRate(change) {
    const rateInput = document.getElementById('manualRateInput');
    if (!rateInput) {
        console.error('manualRateInput element not found');
        return;
    }
    let currentValue = parseFloat(rateInput.value) || 0;
    currentValue = Math.max(0, currentValue + change); // Prevent negative values
    rateInput.value = currentValue.toFixed(2);
    updateCalculatedAmount();
}

// Function to switch animal type
function switchAnimalType(direction) {
    const animalSelect = document.getElementById('animalTypeSelect');
    if (!animalSelect) {
        console.error('animalTypeSelect element not found');
        return;
    }
    const options = animalSelect.options;
    let currentIndex = animalSelect.selectedIndex;
    
    if (direction === 'next') {
        currentIndex = (currentIndex + 1) % options.length;
    } else if (direction === 'prev') {
        currentIndex = (currentIndex - 1 + options.length) % options.length;
    }
    
    animalSelect.selectedIndex = currentIndex;
    focusNextField('animalTypeSelect', 'manualRateInput');
}

// Focus next field function
function focusNextField(currentFieldId, nextFieldId) {
    const currentField = typeof currentFieldId === 'string' ? document.getElementById(currentFieldId) : currentFieldId;
    const nextField = document.getElementById(nextFieldId);
    
    if (nextField) {
        nextField.focus();
        nextField.select && nextField.select();
    }
}

// Focus next field on complete function
function focusNextFieldOnComplete(input, nextFieldId, minLength) {
    if (input.value.length >= minLength) {
        setTimeout(() => {
            const nextField = document.getElementById(nextFieldId);
            if (nextField) {
                nextField.focus();
                nextField.select && nextField.select();
            }
        }, 100);
    }
}

// Handle input keypress function
function handleInputKeypress(event, nextFieldId) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const nextField = document.getElementById(nextFieldId);
        if (nextField) {
            nextField.focus();
            nextField.select && nextField.select();
        }
    }
}

// Update calculated amount function
function updateCalculatedAmount() {
    const qtyInput = document.getElementById('quantityInput');
    const fatInput = document.getElementById('fatInput');
    const snfInput = document.getElementById('snfInput');
    const manualRateInput = document.getElementById('manualRateInput');
    const farmerSelect = document.getElementById('farmerSelect');
    const calculatedAmountDisplay = document.getElementById('calculatedAmountDisplay');
    const calculationTrail = document.getElementById('calculationTrail');
    const rateMethod = document.getElementById('rateMethod');
    const balanceBefore = document.getElementById('balanceBefore');
    const balanceAfter = document.getElementById('balanceAfter');

    if (!qtyInput || !fatInput || !farmerSelect || !calculatedAmountDisplay) {
        console.error('Required elements not found for calculation');
        return;
    }

    const qty = parseFloat(qtyInput.value) || 0;
    const fat = parseFloat(fatInput.value) || 0;
    const snf = parseFloat(snfInput?.value || 0);
    const manualRate = parseFloat(manualRateInput?.value || null);
    const farmerId = farmerSelect.value;

    if (qty > 0 && fat > 0 && farmerId) {
        let calculatedRate, amount;

        if (manualRate) {
            // Use manual rate override
            calculatedRate = manualRate;
            amount = (qty * manualRate).toFixed(2);
        } else {
            // Calculate automatically based on fat/SNF
            const farmer = state.farmers.find(f => f.id === farmerId);
            const type = farmer?.type || 'Cow'; // Default to Cow if not specified

            const calc = calculateMilkAmount(
                qty,
                fat,
                snf,
                state.dairyInfo.rateType,
                state.rates,
                type
            );
            calculatedRate = calc.rate;
            amount = calc.amount;
        }

        // Update display
        calculatedAmountDisplay.textContent = amount;

        // Update calculation trail
        const rateType = manualRate ? 'Manual Rate' : 'Auto-Calculated';
        calculationTrail.textContent = `${qty.toFixed(1)} L × ${fat.toFixed(1)}% → ₹${calculatedRate}/L = ₹${amount}`;
        rateMethod.textContent = `Rate: ${rateType}`;

        // Update farmer balance display
        updateFarmerBalance(farmerId, amount);
    } else {
        calculatedAmountDisplay.textContent = '0.00';
        calculationTrail.textContent = '0.0 L × 0.0% → ₹0.00/L = ₹0.00';
        rateMethod.textContent = 'Rate: Base + Fat adjustment';
        if (balanceBefore) balanceBefore.textContent = '₹0.00';
        if (balanceAfter) balanceAfter.textContent = '₹0.00';
    }
}

// Calculate milk amount function
function calculateMilkAmount(qty, fat, snf, rateType, rates, type) {
    const baseRate = type === 'Cow' ? rates.cow.base : rates.buffalo.base;
    const fatRef = type === 'Cow' ? rates.cow.fatRef : rates.buffalo.fatRef;
    const snfRef = type === 'Cow' ? rates.cow.snfRef : rates.buffalo.snfRef;

    let calculatedRate = Number(baseRate);
    if (rateType === 'Fat_SNF') {
        const fatDiff = (fat - fatRef) * 2;
        const snfDiff = (snf - snfRef) * 1.5;
        calculatedRate = Number(baseRate) + fatDiff + snfDiff;
    } else if (rateType === 'Fat') {
        calculatedRate = (baseRate / fatRef) * fat;
    }

    return {
        rate: Math.max(calculatedRate, 10).toFixed(2),
        amount: (qty * Math.max(calculatedRate, 10)).toFixed(2)
    };
}

// Update farmer balance function
function updateFarmerBalance(farmerId, amount) {
    const farmer = state.farmers.find(f => f.id === farmerId);
    if (farmer) {
        // Calculate current balance based on previous entries
        const previousEntries = state.milkEntries.filter(e => e.farmerId === farmerId);
        const previousAmount = previousEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);

        const payments = state.payments.filter(p => p.farmerId === farmerId && p.type === 'Payment');
        const paidAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

        const currentBalance = previousAmount - paidAmount;
        const newBalance = parseFloat(currentBalance) + parseFloat(amount || 0);

        document.getElementById('balanceBefore').textContent = `₹${currentBalance.toFixed(2)}`;
        document.getElementById('balanceAfter').textContent = `₹${newBalance.toFixed(2)}`;
    }
}

// Record collection function
function recordCollection() {
    // Auto-detect shift based on time of day
    const currentHour = new Date().getHours();
    let detectedShift = 'Morning';
    if (currentHour >= 17 && currentHour <= 22) {
        detectedShift = 'Evening';
    } else if (currentHour >= 5 && currentHour <= 11) {
        detectedShift = 'Morning';
    }

    const form = {
        farmerId: document.getElementById('farmerSelect').value,
        date: new Date().toISOString().split('T')[0],
        shift: detectedShift, // Auto-detected from time
        type: document.getElementById('animalTypeSelect').value,
        qty: parseFloat(document.getElementById('quantityInput').value) || 0,
        fat: parseFloat(document.getElementById('fatInput').value) || 0,
        snf: parseFloat(document.getElementById('snfInput').value) || 0,
        manualRate: parseFloat(document.getElementById('manualRateInput').value) || null,
        syncState: 'QUARANTINED', // Mark as quarantined until synced to server
        createdAtLocal: new Date().toISOString(),
        syncedAtServer: null,
        isManual: true,
        inputSource: 'keyboard',
        deviceId: navigator.userAgent,
        operatorId: state.auth.user?.id || 'current_user',
        id: Date.now().toString()
    };

    // Validate required fields
    if (!form.farmerId || form.qty <= 0 || form.fat <= 0) {
        alert('Please fill all required fields');
        return;
    }

    // Calculate amount based on either manual rate or automatic calculation
    let calculatedRate, amount;
    if (form.manualRate) {
        // Use manual rate override
        calculatedRate = form.manualRate;
        amount = (form.qty * form.manualRate).toFixed(2);
    } else {
        // Calculate automatically based on fat/SNF
        const farmer = state.farmers.find(f => f.id === form.farmerId);
        const type = farmer?.type || 'Cow'; // Default to Cow if not specified

        const calc = calculateMilkAmount(
            form.qty,
            form.fat,
            form.snf,
            state.dairyInfo.rateType,
            state.rates,
            type
        );
        calculatedRate = calc.rate;
        amount = calc.amount;
    }

    const newEntry = {
        ...form,
        rate: calculatedRate,
        amount: amount
    };

    // Add to state
    state.milkEntries.push(newEntry);
    localStorage.setItem('milkbook_data', JSON.stringify(state));

    // Update pending records count
    state.settings.pendingRecords = (state.settings.pendingRecords || 0) + 1;
    localStorage.setItem('milkbook_data', JSON.stringify(state));

    // Update pending count display
    document.getElementById('pendingCount').textContent = state.settings.pendingRecords;

    // Show notification
    const farmer = state.farmers.find(f => f.id === form.farmerId);
    const rateType = form.manualRate ? '(Manual Rate)' : '(Auto-Calculated)';
    alert(`✓ Collection recorded for ${farmer?.name || 'Farmer'} - ${form.qty}L at ${form.fat}% fat. Rate: ₹${calculatedRate}/L ${rateType}. Amount: ₹${amount}`);

    // Reset form
    document.getElementById('quantityInput').value = '';
    document.getElementById('fatInput').value = '';
    document.getElementById('snfInput').value = '';
    document.getElementById('manualRateInput').value = '';

    // Update calculated amount display
    document.getElementById('calculatedAmountDisplay').textContent = '0.00';
    document.getElementById('calculationTrail').textContent = '0.0 L × 0.0% → ₹0.00/L = ₹0.00';
    document.getElementById('rateMethod').textContent = 'Rate: Base + Fat adjustment';
    document.getElementById('balanceBefore').textContent = '₹0.00';
    document.getElementById('balanceAfter').textContent = '₹0.00';

    // Update all farmer dropdowns across the application
    updateFarmerDropdowns(state);

    // Update recent collections display
    updateRecentCollections();
}

// Undo last entry function
function undoLastEntry() {
    if (state.milkEntries.length > 0) {
        const lastEntry = state.milkEntries.pop();
        localStorage.setItem('milkbook_data', JSON.stringify(state));

        // Update pending records count
        state.settings.pendingRecords = Math.max((state.settings.pendingRecords || 0) - 1, 0);
        localStorage.setItem('milkbook_data', JSON.stringify(state));

        // Update pending count display
        document.getElementById('pendingCount').textContent = state.settings.pendingRecords;

        const farmer = state.farmers.find(f => f.id === lastEntry?.farmerId);
        alert(`Last entry for ${farmer?.name || 'Farmer'} removed`);

        // Update recent collections display
        updateRecentCollections();
    } else {
        alert('No entries to undo');
    }
}

// Hold current entry function
function holdCurrentEntry() {
    alert('Entry held temporarily. Will be saved when ready.');
}

// Update recent collections display
function updateRecentCollections() {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = state.milkEntries.filter(e => e.date === today);

    const recentCollections = document.getElementById('recentCollections');
    if (recentCollections) {
        recentCollections.innerHTML = '';

        if (todayEntries.length > 0) {
            todayEntries.slice(0, 10).forEach(entry => {
                const farmer = state.farmers.find(f => f.id === entry.farmerId);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 font-bold text-slate-500">${entry.date}</td>
                    <td class="px-6 py-4 font-black">${farmer?.name || 'Unknown'}</td>
                    <td class="px-6 py-4 font-bold text-slate-500">${entry.shift}</td>
                    <td class="px-6 py-4 font-black">${entry.type}</td>
                    <td class="px-6 py-4 font-bold text-slate-500">${entry.qty} L</td>
                    <td class="px-6 py-4 font-bold text-amber-600">${entry.fat}%</td>
                    <td class="px-6 py-4 text-right font-bold text-blue-600">₹${entry.amount}</td>
                `;
                recentCollections.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colSpan="7" className="py-8 text-center text-slate-500">No collections recorded today</td>';
            recentCollections.appendChild(row);
        }
    }
}

// Update farmer dropdowns function
function updateFarmerDropdowns(newState) {
    // Update dropdowns on current page if they exist
    const farmerDropdowns = document.querySelectorAll('select[id*="farmer"], select[id*="Farmer"], select[name*="farmer"], select[name*="Farmer"]');

    farmerDropdowns.forEach(dropdown => {
        // Save current selection if possible
        const currentSelection = dropdown.value;

        // Clear existing options except the first placeholder
        dropdown.innerHTML = '<option value="">Select Farmer</option>';

        // Add all active farmers
        (newState?.farmers || []).filter(f => f.active !== false).forEach(farmer => {
            const option = document.createElement('option');
            option.value = farmer.id;
            option.textContent = farmer.name;
            dropdown.appendChild(option);
        });

        // Restore previous selection if it still exists
        if (currentSelection) {
            dropdown.value = currentSelection;
        }
    });

    // Also update farmer dropdowns in other open tabs/windows using storage event
    localStorage.setItem('milkbook_data', JSON.stringify(newState));
}

// Open add farmer modal
function openAddFarmerModal() {
    document.getElementById('addFarmerModal').classList.remove('hidden');
}

// Close add farmer modal
function closeAddFarmerModal() {
    document.getElementById('addFarmerModal').classList.add('hidden');
}

// Add new farmer function
function addNewFarmer() {
    const form = {
        name: document.getElementById('newFarmerName').value,
        mobile: document.getElementById('newFarmerMobile').value,
        type: document.getElementById('newFarmerType').value,
        address: document.getElementById('newFarmerAddress').value,
        active: true,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        syncState: 'QUARANTINED', // Mark as quarantined until synced to server
        syncedAtServer: null,
        inputSource: 'keyboard',
        deviceId: navigator.userAgent,
        operatorId: state.auth.user?.id || 'current_user'
    };

    // Validate required fields
    if (!form.name || !form.mobile) {
        alert('Please enter farmer name and mobile number');
        return;
    }

    // Add to state
    state.farmers.push(form);
    localStorage.setItem('milkbook_data', JSON.stringify(state));

    // Update pending records count
    state.settings.pendingRecords = (state.settings.pendingRecords || 0) + 1;
    localStorage.setItem('milkbook_data', JSON.stringify(state));

    // Update pending count display
    document.getElementById('pendingCount').textContent = state.settings.pendingRecords;

    // Add to farmer dropdown
    const farmerSelect = document.getElementById('farmerSelect');
    if (farmerSelect) {
        const option = document.createElement('option');
        option.value = form.id;
        option.textContent = form.name;
        farmerSelect.appendChild(option);

        // Select the newly added farmer
        farmerSelect.value = form.id;
    }

    // Show notification
    alert(`✓ Farmer ${form.name} added successfully with ID: #${form.id.substring(0, 4)}`);

    // Clear form
    document.getElementById('newFarmerName').value = '';
    document.getElementById('newFarmerMobile').value = '';
    document.getElementById('newFarmerAddress').value = '';

    // Close modal
    closeAddFarmerModal();

    // Update all farmer dropdowns across the application
    updateFarmerDropdowns(state);
}