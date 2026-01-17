import React, { useState, useEffect } from 'react';
import './App.css';

// Initial state for the application
const INITIAL_STATE = {
  auth: { 
    isAuthenticated: false, 
    user: null,
    role: 'owner' // 'owner' or 'labour'
  },
  currentScreen: 'login',
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

// Main App Component
function App() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('milkbook_data');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notification, setNotification] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('evidence'); // For MilkLedger Evidence tabs

  // Persistence
  useEffect(() => {
    localStorage.setItem('milkbook_data', JSON.stringify(state));
  }, [state]);

  // Navigation function
  const navigateTo = (screen) => {
    setCurrentScreen(screen);
  };

  // Farmer registration
  const registerFarmer = (farmerData) => {
    const newFarmer = {
      ...farmerData,
      id: Date.now().toString(),
      active: true,
      createdAt: new Date().toISOString(),
      syncState: 'QUARANTINED', // Mark as quarantined until synced to server
      createdAtLocal: new Date().toISOString(),
      syncedAtServer: null,
      isManual: true,
      inputSource: 'keyboard',
      deviceId: navigator.userAgent,
      operatorId: state.auth.user?.id || 'current_user'
    };

    setState(prev => ({
      ...prev,
      farmers: [...prev.farmers, newFarmer],
      settings: {
        ...prev.settings,
        pendingRecords: prev.settings.pendingRecords + 1
      }
    }));

    setNotification({ msg: `Farmer ${farmerData.name} registered successfully`, type: 'success' });
  };

  // Milk collection
  const recordCollection = (collectionData) => {
    const calc = calculateMilkAmount(
      collectionData.qty,
      collectionData.fat,
      collectionData.snf,
      state.dairyInfo.rateType,
      state.rates,
      collectionData.type
    );

    const newEntry = {
      ...collectionData,
      rate: calc.rate,
      amount: calc.amount,
      id: Date.now().toString(),
      syncState: 'QUARANTINED', // Mark as quarantined until synced to server
      createdAtLocal: new Date().toISOString(),
      syncedAtServer: null,
      isManual: true,
      inputSource: 'keyboard', // Could be 'scale' or 'keyboard'
      deviceId: navigator.userAgent,
      operatorId: state.auth.user?.id || 'current_user'
    };

    setState(prev => ({
      ...prev,
      milkEntries: [...prev.milkEntries, newEntry],
      settings: {
        ...prev.settings,
        pendingRecords: prev.settings.pendingRecords + 1
      }
    }));

    setNotification({ msg: `Collection recorded for ${collectionData.farmerId}`, type: 'success' });
  };

  // Payment recording
  const recordPayment = (paymentData) => {
    const newPayment = {
      ...paymentData,
      id: Date.now().toString(),
      syncState: 'QUARANTINED', // Mark as quarantined until synced to server
      createdAtLocal: new Date().toISOString(),
      syncedAtServer: null,
      isManual: true,
      inputSource: 'keyboard',
      deviceId: navigator.userAgent,
      operatorId: state.auth.user?.id || 'current_user'
    };

    setState(prev => ({
      ...prev,
      payments: [...prev.payments, newPayment],
      settings: {
        ...prev.settings,
        pendingRecords: prev.settings.pendingRecords + 1
      }
    }));

    setNotification({ msg: `Payment of ₹${paymentData.amount} recorded`, type: 'success' });
  };

  // Evidence capture for MilkLedger
  const captureEvidence = (evidenceData) => {
    const newEvidence = {
      ...evidenceData,
      id: Date.now().toString(),
      syncState: 'QUARANTINED', // Mark as quarantined until synced to server
      createdAtLocal: new Date().toISOString(),
      syncedAtServer: null,
      isManual: true,
      inputSource: 'camera', // Could be 'scale', 'camera', or 'keyboard'
      deviceId: navigator.userAgent,
      operatorId: state.auth.user?.id || 'current_user'
    };

    setState(prev => ({
      ...prev,
      evidenceRecords: [...prev.evidenceRecords, newEvidence],
      settings: {
        ...prev.settings,
        pendingRecords: prev.settings.pendingRecords + 1
      }
    }));

    // Check for payment discrepancy
    const difference = Math.abs(parseFloat(newEvidence.calculatedAmount) - parseFloat(newEvidence.actualAmount));
    if (difference > 0.01) {
      setNotification({ 
        msg: `⚠️ PAYMENT DISCREPANCY DETECTED! Expected: ₹${newEvidence.calculatedAmount}, Received: ₹${newEvidence.actualAmount}`, 
        type: 'error' 
      });
    } else {
      setNotification({ msg: `Evidence captured successfully`, type: 'success' });
    }
  };

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <Dashboard state={state} />;
      case 'collection':
        return <MilkCollection state={state} onRecordCollection={recordCollection} />;
      case 'farmers':
        return <Farmers state={state} onRegisterFarmer={registerFarmer} />;
      case 'ledger':
        return <Ledger state={state} />;
      case 'payments':
        return <Payments state={state} onRecordPayment={recordPayment} />;
      case 'sales':
        return <MilkSales state={state} />;
      case 'inventory':
        return <Inventory state={state} />;
      case 'reports':
        return <Reports state={state} />;
      case 'backup':
        return <Backup state={state} />;
      case 'settings':
        return <Settings state={state} />;
      case 'milkledger':
        return <MilkLedgerEvidence state={state} onCaptureEvidence={captureEvidence} activeTab={activeTab} setActiveTab={setActiveTab} />;
      default:
        return <Dashboard state={state} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white flex flex-col transition-all duration-300 print:hidden`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg">
            <i data-lucide="droplet" className="text-white" style={{width: 20, height: 20}}></i>
          </div>
          {isSidebarOpen && <span className="font-bold text-xl uppercase tracking-tighter">MilkBook</span>}
        </div>
        <nav className="flex-1 mt-4 px-3 space-y-1">
          <button onClick={() => navigateTo('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentScreen === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <i data-lucide="layout-dashboard" style={{width: 20, height: 20}} className="shrink-0"></i>
            {isSidebarOpen && <span className="font-bold text-sm tracking-tight">Dashboard</span>}
          </button>
          <button onClick={() => navigateTo('collection')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentScreen === 'collection' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <i data-lucide="droplets" style={{width: 20, height: 20}} className="shrink-0"></i>
            {isSidebarOpen && <span className="font-bold text-sm tracking-tight">Milk Collection</span>}
          </button>
          <button onClick={() => navigateTo('farmers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentScreen === 'farmers' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <i data-lucide="users" style={{width: 20, height: 20}} className="shrink-0"></i>
            {isSidebarOpen && <span className="font-bold text-sm tracking-tight">Farmers</span>}
          </button>
          <button onClick={() => navigateTo('ledger')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentScreen === 'ledger' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <i data-lucide="book-open" style={{width: 20, height: 20}} className="shrink-0"></i>
            {isSidebarOpen && <span className="font-bold text-sm tracking-tight">Ledger</span>}
          </button>
          <button onClick={() => navigateTo('payments')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentScreen === 'payments' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <i data-lucide="indian-rupee" style={{width: 20, height: 20}} className="shrink-0"></i>
            {isSidebarOpen && <span className="font-bold text-sm tracking-tight">Payments</span>}
          </button>
          <button onClick={() => navigateTo('sales')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentScreen === 'sales' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <i data-lucide="shopping-bag" style={{width: 20, height: 20}} className="shrink-0"></i>
            {isSidebarOpen && <span className="font-bold text-sm tracking-tight">Milk Sales</span>}
          </button>
          <button onClick={() => navigateTo('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentScreen === 'inventory' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <i data-lucide="warehouse" style={{width: 20, height: 20}} className="shrink-0"></i>
            {isSidebarOpen && <span className="font-bold text-sm tracking-tight">Inventory</span>}
          </button>
          <button onClick={() => navigateTo('reports')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentScreen === 'reports' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <i data-lucide="bar-chart-3" style={{width: 20, height: 20}} className="shrink-0"></i>
            {isSidebarOpen && <span className="font-bold text-sm tracking-tight">Reports</span>}
          </button>
          <button onClick={() => navigateTo('milkledger')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentScreen === 'milkledger' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <i data-lucide="shield-check" style={{width: 20, height: 20}} className="shrink-0"></i>
            {isSidebarOpen && <span className="font-bold text-sm tracking-tight">MilkLedger Evidence</span>}
          </button>
          <div className="pt-6 border-t border-slate-800 mt-6 space-y-1">
            <button onClick={() => navigateTo('backup')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentScreen === 'backup' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <i data-lucide="database" style={{width: 20, height: 20}} className="shrink-0"></i>
              {isSidebarOpen && <span className="font-bold text-sm tracking-tight">Backup</span>}
            </button>
            <button onClick={() => navigateTo('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentScreen === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <i data-lucide="settings" style={{width: 20, height: 20}} className="shrink-0"></i>
              {isSidebarOpen && <span className="font-bold text-sm tracking-tight">Settings</span>}
            </button>
            <button onClick={() => navigateTo('logout')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentScreen === 'logout' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <i data-lucide="log-out" style={{width: 20, height: 20}} className="shrink-0"></i>
              {isSidebarOpen && <span className="font-bold text-sm tracking-tight">Logout</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wide">{state.dairyInfo.name}</h1>
            <span className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold flex items-center gap-1">
              <i data-lucide="clock" style={{width: 14, height: 14}}></i>
              <span>{new Date().toLocaleDateString('en-IN')}</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">System Healthy</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <i data-lucide="alert-circle" className="text-amber-600" style={{width: 14, height: 14}}></i>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Pending: {state.settings.pendingRecords}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-700">{state.auth.user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Administrator</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center font-black text-slate-600 border shadow-inner">
                {(state.auth.user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8">
          {renderScreen()}
        </div>
      </main>
    </div>
  );
}

// Dashboard Component
const Dashboard = ({ state }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = state.milkEntries.filter(e => e.date === today);
  const todayVolume = todayEntries.reduce((sum, e) => sum + parseFloat(e.qty || 0), 0);
  const todayValue = todayEntries.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-black tracking-tighter uppercase">Dashboard</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-slate-900 text-white p-10 rounded-3xl shadow-2xl">
          <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2">Today's Milk</p>
          <p className="text-4xl font-black tracking-tighter">{todayVolume.toFixed(1)} <span className="text-sm font-bold opacity-50">LTRS</span></p>
        </div>
        <div className="bg-blue-600 text-white p-10 rounded-3xl shadow-2xl">
          <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2">Acquisition Cost</p>
          <p className="text-4xl font-black tracking-tighter">{formatCurrency(todayValue)}</p>
        </div>
        <div className="bg-white border border-slate-200 p-10 rounded-3xl shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Efficiency Index</p>
          <p className="text-4xl font-black tracking-tighter text-slate-800">{todayVolume > 0 ? formatCurrency(todayValue/todayVolume) : '₹0.00'}<span className="text-sm">/L</span></p>
        </div>
        <div className="bg-white border border-slate-200 p-10 rounded-3xl shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Farmers</p>
          <p className="text-4xl font-black tracking-tighter text-slate-800">{state.farmers.filter(f => f.active !== false).length}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Collections</h3>
          </div>
          <div className="card-body">
            {todayEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Farmer</th>
                      <th>Shift</th>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>Fat%</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayEntries.slice(0, 5).map(entry => {
                      const farmer = state.farmers.find(f => f.id === entry.farmerId);
                      return (
                        <tr key={entry.id}>
                          <td className="py-4 font-bold text-slate-500">{entry.date}</td>
                          <td className="py-4 font-black">{farmer?.name || 'Unknown'}</td>
                          <td className="py-4 font-bold text-slate-500">{entry.shift}</td>
                          <td className="py-4 font-black">{entry.type}</td>
                          <td className="py-4 font-black text-slate-700">{entry.qty} L</td>
                          <td className="py-4 font-black text-amber-600">{entry.fat}</td>
                          <td className="py-4 text-right font-black text-blue-600">{formatCurrency(entry.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No collections recorded today</p>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Active Farmers</h3>
          </div>
          <div className="card-body">
            {state.farmers.filter(f => f.active !== false).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Address</th>
                      <th>Advance</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.farmers.filter(f => f.active !== false).slice(0, 5).map(farmer => (
                      <tr key={farmer.id}>
                        <td className="py-4 font-black">{farmer.name}</td>
                        <td className="py-4 font-bold text-slate-500">{farmer.mobile}</td>
                        <td className="py-4 font-bold text-slate-500">{farmer.address || 'N/A'}</td>
                        <td className="py-4 font-black text-rose-600">{formatCurrency(farmer.advance)}</td>
                        <td className="py-4 text-right space-x-3">
                          <button className="text-blue-600 font-bold hover:underline text-sm">Edit</button>
                          <button className="text-red-600 font-bold hover:underline text-sm">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No farmers registered yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Milk Collection Component
const MilkCollection = ({ state, onRecordCollection }) => {
  const [formData, setFormData] = useState({
    farmerId: '',
    date: new Date().toISOString().split('T')[0],
    shift: 'Morning',
    type: 'Cow',
    qty: '',
    fat: '',
    snf: '',
    manualRate: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const collectionData = {
      farmerId: formData.farmerId,
      date: formData.date,
      shift: formData.shift,
      type: formData.type,
      qty: parseFloat(formData.qty),
      fat: parseFloat(formData.fat),
      snf: parseFloat(formData.snf) || 0,
      manualRate: parseFloat(formData.manualRate) || null
    };
    
    onRecordCollection(collectionData);
    setFormData({
      farmerId: '',
      date: new Date().toISOString().split('T')[0],
      shift: 'Morning',
      type: 'Cow',
      qty: '',
      fat: '',
      snf: '',
      manualRate: ''
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-black tracking-tighter uppercase">Milk Collection</h2>
        <button 
          onClick={() => alert('Contact support to verify compatibility with your specific analyzer model. Hardware integration success depends on device compatibility, driver support, and browser capabilities.')}
          className="px-6 py-3 bg-green-600 text-white rounded-xl font-black text-sm uppercase tracking-widest flex items-center gap-2"
        >
          <i data-lucide="upload" style={{width: 18, height: 18}}></i>
          Import Readings
        </button>
      </div>
      
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">New Collection</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Farmer</label>
              <select 
                value={formData.farmerId}
                onChange={(e) => setFormData({...formData, farmerId: e.target.value})}
                required 
                className="w-full p-4 bg-slate-50 border rounded-xl font-bold"
              >
                <option value="">Select Farmer</option>
                {state.farmers.filter(f => f.active !== false).map(farmer => (
                  <option key={farmer.id} value={farmer.id}>{farmer.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
              <input 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required 
                className="w-full p-4 bg-slate-50 border rounded-xl font-bold" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Shift</label>
              <select 
                value={formData.shift}
                onChange={(e) => setFormData({...formData, shift: e.target.value})}
                className="w-full p-4 bg-slate-50 border rounded-xl font-bold"
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Milk Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full p-4 bg-slate-50 border rounded-xl font-bold"
              >
                <option value="Cow">Cow</option>
                <option value="Buffalo">Buffalo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Quantity (L)</label>
              <input 
                type="number" 
                step="0.01" 
                value={formData.qty}
                onChange={(e) => setFormData({...formData, qty: e.target.value})}
                required 
                className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-blue-600" 
                placeholder="Liters"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fat %</label>
              <input 
                type="number" 
                step="0.01" 
                value={formData.fat}
                onChange={(e) => setFormData({...formData, fat: e.target.value})}
                required 
                className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-blue-600" 
                placeholder="Fat percentage"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">SNF %</label>
              <input 
                type="number" 
                step="0.01" 
                value={formData.snf}
                onChange={(e) => setFormData({...formData, snf: e.target.value})}
                className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-slate-600" 
                placeholder="Solid Not Fat"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Manual Rate Override (₹/L)</label>
              <input 
                type="number" 
                step="0.01" 
                value={formData.manualRate}
                onChange={(e) => setFormData({...formData, manualRate: e.target.value})}
                className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-amber-600" 
                placeholder="Override auto-rate"
              />
            </div>
            <div className="md:col-span-3 flex justify-end pt-4">
              <button type="submit" className="px-8 py-4 bg-blue-600 text-white rounded-xl font-black text-lg hover:bg-blue-700">Record Collection</button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Collections</h3>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Farmer</th>
                  <th>Shift</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Fat%</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {state.milkEntries.slice(0, 10).map(entry => {
                  const farmer = state.farmers.find(f => f.id === entry.farmerId);
                  return (
                    <tr key={entry.id}>
                      <td className="py-4 font-bold text-slate-500">{entry.date}</td>
                      <td className="py-4 font-black">{farmer?.name || 'Unknown'}</td>
                      <td className="py-4 font-bold text-slate-500">{entry.shift}</td>
                      <td className="py-4 font-black">{entry.type}</td>
                      <td className="py-4 font-black text-slate-700">{entry.qty} L</td>
                      <td className="py-4 font-black text-amber-600">{entry.fat}</td>
                      <td className="py-4 text-right font-black text-blue-600">{formatCurrency(entry.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Farmers Component
const Farmers = ({ state, onRegisterFarmer }) => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    advance: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const farmerData = {
      name: formData.name,
      mobile: formData.mobile,
      address: formData.address,
      advance: parseFloat(formData.advance) || 0
    };
    
    onRegisterFarmer(farmerData);
    setFormData({
      name: '',
      mobile: '',
      address: '',
      advance: ''
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-black tracking-tighter uppercase">Farmer Management</h2>
      </div>
      
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">New Farmer Registration</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
                className="w-full p-4 bg-slate-50 border rounded-xl font-bold" 
                placeholder="Farmer name"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Mobile</label>
              <input 
                type="text" 
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                required 
                className="w-full p-4 bg-slate-50 border rounded-xl font-bold" 
                placeholder="Mobile number"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Address</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full p-4 bg-slate-50 border rounded-xl font-bold" 
                placeholder="Address"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Advance (₹)</label>
              <input 
                type="number" 
                step="0.01" 
                value={formData.advance}
                onChange={(e) => setFormData({...formData, advance: e.target.value})}
                className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-rose-600" 
                placeholder="Advance amount"
              />
            </div>
            <div className="md:col-span-4 flex justify-end pt-4">
              <button type="submit" className="px-8 py-4 bg-blue-600 text-white rounded-xl font-black text-lg hover:bg-blue-700">Add Farmer</button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Active Farmers</h3>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Address</th>
                  <th>Advance</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.farmers.filter(f => f.active !== false).map(farmer => (
                  <tr key={farmer.id}>
                    <td className="py-4 font-black">{farmer.name}</td>
                    <td className="py-4 font-bold text-slate-500">{farmer.mobile}</td>
                    <td className="py-4 font-bold text-slate-500">{farmer.address || 'N/A'}</td>
                    <td className="py-4 font-black text-rose-600">{formatCurrency(farmer.advance)}</td>
                    <td className="py-4 text-right space-x-3">
                      <button className="text-blue-600 font-bold hover:underline text-sm">Edit</button>
                      <button className="text-red-600 font-bold hover:underline text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// MilkLedger Evidence Component
const MilkLedgerEvidence = ({ state, onCaptureEvidence, activeTab, setActiveTab }) => {
  const [evidenceData, setEvidenceData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'Morning',
    qty: '',
    fat: '',
    snf: '',
    rate: '',
    calculatedAmount: '',
    actualAmount: ''
  });

  const handleEvidenceSubmit = (e) => {
    e.preventDefault();
    
    const evidence = {
      date: evidenceData.date,
      shift: evidenceData.shift,
      qty: parseFloat(evidenceData.qty),
      fat: parseFloat(evidenceData.fat),
      snf: parseFloat(evidenceData.snf) || 0,
      rate: parseFloat(evidenceData.rate),
      calculatedAmount: parseFloat(evidenceData.calculatedAmount) || 0,
      actualAmount: parseFloat(evidenceData.actualAmount) || 0
    };
    
    onCaptureEvidence(evidence);
    setEvidenceData({
      date: new Date().toISOString().split('T')[0],
      shift: 'Morning',
      qty: '',
      fat: '',
      snf: '',
      rate: '',
      calculatedAmount: '',
      actualAmount: ''
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-black tracking-tighter uppercase">MilkLedger Evidence</h2>
      </div>
      
      <div className="card mb-6">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            <button 
              onClick={() => setActiveTab('evidence')}
              className={`tab-button ${activeTab === 'evidence' ? 'active font-black text-sm tracking-tight py-4 border-b-2 border-blue-600 text-blue-600' : 'font-black text-sm tracking-tight py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700'}`}
            >Evidence Collection</button>
            <button 
              onClick={() => setActiveTab('verification')}
              className={`tab-button ${activeTab === 'verification' ? 'active font-black text-sm tracking-tight py-4 border-b-2 border-blue-600 text-blue-600' : 'font-black text-sm tracking-tight py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700'}`}
            >Payment Verification</button>
            <button 
              onClick={() => setActiveTab('income')}
              className={`tab-button ${activeTab === 'income' ? 'active font-black text-sm tracking-tight py-4 border-b-2 border-blue-600 text-blue-600' : 'font-black text-sm tracking-tight py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700'}`}
            >Income Proof</button>
          </nav>
        </div>
        <div className="card-body">
          {activeTab === 'evidence' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Upload Milk Slip (Evidence)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="w-full p-4 bg-slate-50 border rounded-xl font-bold"
                  />
                  <p className="text-xs text-slate-500 mt-2">Photograph your thermal slip to create permanent evidence</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
                    <input 
                      type="date" 
                      value={evidenceData.date}
                      onChange={(e) => setEvidenceData({...evidenceData, date: e.target.value})}
                      className="w-full p-4 bg-slate-50 border rounded-xl font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Shift</label>
                    <select 
                      value={evidenceData.shift}
                      onChange={(e) => setEvidenceData({...evidenceData, shift: e.target.value})}
                      className="w-full p-4 bg-slate-50 border rounded-xl font-bold"
                    >
                      <option value="Morning">Morning</option>
                      <option value="Evening">Evening</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Quantity (L)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={evidenceData.qty}
                      onChange={(e) => setEvidenceData({...evidenceData, qty: e.target.value})}
                      className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-blue-600" 
                      placeholder="Liters"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fat %</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={evidenceData.fat}
                      onChange={(e) => setEvidenceData({...evidenceData, fat: e.target.value})}
                      className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-blue-600" 
                      placeholder="Fat %"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">SNF %</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={evidenceData.snf}
                      onChange={(e) => setEvidenceData({...evidenceData, snf: e.target.value})}
                      className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-slate-600" 
                      placeholder="SNF %"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Rate (₹/L)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={evidenceData.rate}
                    onChange={(e) => setEvidenceData({...evidenceData, rate: e.target.value})}
                    className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-blue-600" 
                    placeholder="Rate per liter"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Calculated Amount</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={evidenceData.calculatedAmount}
                    onChange={(e) => setEvidenceData({...evidenceData, calculatedAmount: e.target.value})}
                    readOnly 
                    className="w-full p-4 bg-slate-100 border rounded-xl font-black text-green-600" 
                    placeholder="Auto-calculated"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Actual Amount</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={evidenceData.actualAmount}
                    onChange={(e) => setEvidenceData({...evidenceData, actualAmount: e.target.value})}
                    className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-rose-600" 
                    placeholder="What you received"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={handleEvidenceSubmit}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700"
                  >Capture Evidence</button>
                  <button 
                    onClick={() => {
                      const calc = parseFloat(evidenceData.qty || 0) * parseFloat(evidenceData.rate || 0);
                      const actual = parseFloat(evidenceData.actualAmount || 0);
                      const diff = Math.abs(calc - actual);
                      
                      if (diff > 0.01) {
                        alert(`⚠️ PAYMENT DISCREPANCY DETECTED!\nCalculated: ₹${calc.toFixed(2)}\nActual: ₹${actual.toFixed(2)}\nDifference: ₹${diff.toFixed(2)}`);
                      } else {
                        alert(`✓ Payment verified. Amounts match: ₹${calc.toFixed(2)}`);
                      }
                    }}
                    className="flex-1 py-4 bg-green-600 text-white rounded-xl font-black hover:bg-green-700"
                  >Verify Payment</button>
                </div>
              </div>
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                <p className="font-black text-amber-800 mb-4 flex items-center gap-2">
                  <i data-lucide="shield-alert" style={{width: 18, height: 18}}></i>
                  Evidence-Based Verification
                </p>
                <ul className="space-y-3 text-amber-700 font-medium">
                  <li className="flex items-start gap-3">
                    <i data-lucide="circle-check" style={{width: 16, height: 16}} className="text-green-600 mt-0.5"></i>
                    <div>
                      <p className="font-bold">Digital Evidence Creation</p>
                      <p className="text-sm opacity-80">Create verifiable records of all transactions</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <i data-lucide="circle-check" style={{width: 16, height: 16}} className="text-green-600 mt-0.5"></i>
                    <div>
                      <p className="font-bold">Mathematical Verification</p>
                      <p className="text-sm opacity-80">Detect calculation mismatches automatically</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <i data-lucide="circle-check" style={{width: 16, height: 16}} className="text-green-600 mt-0.5"></i>
                    <div>
                      <p className="font-bold">Independent Record Keeping</p>
                      <p className="text-sm opacity-80">Maintain your own records separate from center</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <i data-lucide="circle-check" style={{width: 16, height: 16}} className="text-green-600 mt-0.5"></i>
                    <div>
                      <p className="font-bold">No Correction Promises</p>
                      <p className="text-sm opacity-80">Provides evidence, not enforcement solutions</p>
                    </div>
                  </li>
                </ul>
                <div className="mt-6 p-4 bg-white rounded-xl border border-amber-100">
                  <p className="font-black text-sm text-amber-800 mb-2">Pramāṇa First, Daṇḍa Later</p>
                  <p className="text-xs text-amber-700">
                    MilkLedger provides verifiable evidence of transactions. 
                    It stops at Pramāṇa (proof/evidence) and does not promise Daṇḍa (enforcement/correction).
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'verification' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Verification Date</label>
                  <input type="date" className="w-full p-4 bg-slate-50 border rounded-xl font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Expected Amount</label>
                  <input type="number" step="0.01" className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-green-600" placeholder="Sum of calculated amounts" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Received Amount</label>
                  <input type="number" step="0.01" className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-rose-600" placeholder="From bank statement" />
                </div>
              </div>
              <button className="w-full py-4 bg-green-600 text-white rounded-xl font-black text-lg">Verify Payment Settlement</button>
              
              <div className="hidden p-6 bg-amber-50 rounded-2xl border border-amber-200">
                <p className="font-black text-amber-800 mb-2">Verification Result</p>
                <p className="text-amber-700">Payment reconciliation successful</p>
              </div>
            </div>
          )}
          
          {activeTab === 'income' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Avg Daily Income</p>
                  <p className="text-2xl font-black text-slate-800">₹0.00</p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Monthly Income</p>
                  <p className="text-2xl font-black text-slate-800">₹0.00</p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Consistency Index</p>
                  <p className="text-2xl font-black text-slate-800">0%</p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Verified Months</p>
                  <p className="text-2xl font-black text-slate-800">0</p>
                </div>
              </div>
              
              <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                <p className="font-black text-green-800 mb-2 flex items-center gap-2">
                  <i data-lucide="file-text" style={{width: 18, height: 18}}></i>
                  Generate Income Certificate
                </p>
                <p className="text-sm text-green-700 mb-4">
                  Create verified income certificates for bank loans and financing
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                    <input type="date" className="w-full p-4 bg-slate-50 border rounded-xl font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">End Date</label>
                    <input type="date" className="w-full p-4 bg-slate-50 border rounded-xl font-bold" />
                  </div>
                </div>
                <button className="w-full py-4 bg-green-600 text-white rounded-xl font-black text-lg">Generate Certificate</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export other components as needed...

export default App;