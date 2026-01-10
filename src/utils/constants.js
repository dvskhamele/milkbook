// Constants and helpers
const STORAGE_KEY = 'dairy_mgmt_state_v1';
const INITIAL_STATE = {
    auth: { isAuthenticated: false, user: null },
    currentScreen: 'login',
    dairyInfo: { name: '', owner: '', mobile: '', address: '', rateType: 'Fat_SNF', language: 'EN' },
    farmers: [],
    milkEntries: [],
    rates: {
        cow: { base: 40, fatRef: 3.5, snfRef: 8.5 },
        buffalo: { base: 60, fatRef: 6.0, snfRef: 9.0 }
    },
    payments: [],
    sales: [],
    inventory: [],
    settings: { backupEnabled: true, lastBackup: null, printerName: 'Default' }
};

// Format currency
const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');

// Calculate milk amount
const calculateMilkAmount = (qty, fat, snf, rateType, rates, type) => {
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
};