// Main App Component
function App() {
    const [state, setState] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : INITIAL_STATE;
    });
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [notif, setNotif] = useState(null);

    // Persistence
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const notify = (msg, type = 'success') => {
        setNotif({ msg, type });
        setTimeout(() => setNotif(null), 3000);
    };

    const navigate = (screen) => setState(prev => ({ ...prev, currentScreen: screen }));
    const logout = () => setState(prev => ({ ...prev, auth: { isAuthenticated: false, user: null }, currentScreen: 'login' }));

    // Simple render function
    const renderScreen = () => {
        switch (state.currentScreen) {
            case 'login': 
                return <LoginScreen state={state} setState={setState} notify={notify} navigate={navigate} />;
            case 'register': 
                return <RegisterScreen setState={setState} notify={notify} navigate={navigate} />;
            case 'dashboard': 
                return <DashboardScreen state={state} navigate={navigate} />;
            case 'setup':
                return <SetupWizard state={state} setState={setState} notify={notify} navigate={navigate} />;
            case 'milkEntry': 
                return <MilkEntryScreen state={state} setState={setState} notify={notify} />;
            case 'farmers': 
                return <FarmerManagementScreen state={state} setState={setState} notify={notify} />;
            case 'ledger': 
                return <LedgerScreen state={state} />;
            case 'payments': 
                return <PaymentsScreen state={state} setState={setState} notify={notify} />;
            case 'sales': 
                return <SalesScreen state={state} setState={setState} notify={notify} />;
            case 'inventory': 
                return <InventoryScreen state={state} setState={setState} notify={notify} />;
            case 'reports': 
                return <ReportsScreen state={state} />;
            case 'backup': 
                return <BackupScreen state={state} setState={setState} notify={notify} />;
            case 'settings': 
                return <SettingsScreen state={state} setState={setState} notify={notify} />;
            default:
                return <div className="p-8 text-center">Screen not implemented yet: {state.currentScreen}</div>;
        }
    };

    const needsAuth = !['login', 'register'].includes(state.currentScreen);

    if (needsAuth && !state.auth.isAuthenticated) {
        return <LoginScreen state={state} setState={setState} notify={notify} navigate={navigate} />;
    }

    if (!needsAuth) {
        return renderScreen();
    }

    return (
        <div className="min-h-screen bg-slate-50 flex overflow-hidden">
            {notif && (
                <div className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce border-l-4 bg-white ${
                    notif.type === 'success' ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'
                }`}>
                    <Icon name={notif.type === 'success' ? 'check-circle' : 'alert-circle'} size={20} />
                    <span className="font-bold">{notif.msg}</span>
                </div>
            )}

            <>
                {/* Sidebar */}
                <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white flex flex-col transition-all duration-300 print:hidden shrink-0`}>
                    <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Icon name="droplet" className="text-white" size={20} />
                        </div>
                        {isSidebarOpen && <span className="font-bold text-xl uppercase tracking-tighter">MilkBook</span>}
                    </div>
                    <nav className="flex-1 mt-4 px-3 space-y-1">
                        <button onClick={() => navigate('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            state.currentScreen === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}>
                            <Icon name="layout-dashboard" size={20} className="shrink-0" />
                            {!isSidebarOpen || <span className="font-bold text-sm tracking-tight">Dashboard</span>}
                        </button>
                        <button onClick={() => navigate('milkEntry')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            state.currentScreen === 'milkEntry' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}>
                            <Icon name="droplets" size={20} className="shrink-0" />
                            {!isSidebarOpen || <span className="font-bold text-sm tracking-tight">Milk Collection</span>}
                        </button>
                        <button onClick={() => navigate('farmers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            state.currentScreen === 'farmers' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}>
                            <Icon name="users" size={20} className="shrink-0" />
                            {!isSidebarOpen || <span className="font-bold text-sm tracking-tight">Farmers</span>}
                        </button>
                        <button onClick={() => navigate('ledger')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            state.currentScreen === 'ledger' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}>
                            <Icon name="book-open" size={20} className="shrink-0" />
                            {!isSidebarOpen || <span className="font-bold text-sm tracking-tight">Ledger</span>}
                        </button>
                        <button onClick={() => navigate('payments')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            state.currentScreen === 'payments' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}>
                            <Icon name="indian-rupee" size={20} className="shrink-0" />
                            {!isSidebarOpen || <span className="font-bold text-sm tracking-tight">Payments</span>}
                        </button>
                        <button onClick={() => navigate('sales')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            state.currentScreen === 'sales' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}>
                            <Icon name="shopping-bag" size={20} className="shrink-0" />
                            {!isSidebarOpen || <span className="font-bold text-sm tracking-tight">Milk Sales</span>}
                        </button>
                        <button onClick={() => navigate('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            state.currentScreen === 'inventory' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}>
                            <Icon name="warehouse" size={20} className="shrink-0" />
                            {!isSidebarOpen || <span className="font-bold text-sm tracking-tight">Inventory</span>}
                        </button>
                        <button onClick={() => navigate('reports')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            state.currentScreen === 'reports' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}>
                            <Icon name="bar-chart-3" size={20} className="shrink-0" />
                            {!isSidebarOpen || <span className="font-bold text-sm tracking-tight">Reports</span>}
                        </button>
                        <div className="pt-6 border-t border-slate-800 mt-6 space-y-1">
                            <button onClick={() => navigate('backup')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                state.currentScreen === 'backup' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}>
                                <Icon name="database" size={20} className="shrink-0" />
                                {!isSidebarOpen || <span className="font-bold text-sm tracking-tight">Backup</span>}
                            </button>
                            <button onClick={() => navigate('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                state.currentScreen === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}>
                                <Icon name="settings" size={20} className="shrink-0" />
                                {!isSidebarOpen || <span className="font-bold text-sm tracking-tight">Settings</span>}
                            </button>
                            <button onClick={logout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}>
                                <Icon name="log-out" size={20} className="shrink-0" />
                                {!isSidebarOpen || <span className="font-bold text-sm tracking-tight">Logout</span>}
                            </button>
                        </div>
                    </nav>
                    <button 
                        onClick={() => setSidebarOpen(!isSidebarOpen)} 
                        className="p-4 hover:bg-slate-800 flex items-center justify-center transition-colors"
                    >
                        <Icon name={isSidebarOpen ? "x" : "menu"} size={20} />
                    </button>
                </aside>

                {/* Main */}
                <main className="flex-1 flex flex-col min-w-0">
                    <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0 print:hidden shadow-sm">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wide truncate max-w-[300px]">{state.dairyInfo.name || 'Milk Collection Center'}</h1>
                            <span className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold flex items-center gap-1">
                                <Icon name="clock" size={14} /> {formatDate(new Date())}
                            </span>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${state.settings.backupEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">System Healthy</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-700">{state.auth.user?.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Administrator</p>
                                </div>
                                <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center font-black text-slate-600 border shadow-inner">
                                    {state.auth.user?.name?.charAt(0) || 'U'}
                                </div>
                            </div>
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                        {renderScreen()}
                    </div>
                </main>
            </>

            {/* Footer with designer attribution */}
            <footer className="print:hidden text-center py-4 text-slate-500 text-sm border-t bg-slate-50">
                Designed by <span className="font-bold text-slate-700">signimus</span>
            </footer>
        </div>
    );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));