// Login Screen Component
const LoginScreen = ({ state, setState, notify, navigate }) => {
    const [formData, setFormData] = useState({ mobile: '', password: '' });
    
    const handleLogin = (e) => {
        e.preventDefault();
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved?.auth?.user?.mobile === formData.mobile && saved?.auth?.user?.password === formData.password) {
            setState(prev => ({ ...prev, auth: { isAuthenticated: true, user: saved.auth.user }, currentScreen: saved.dairyInfo.name ? 'dashboard' : 'setup' }));
            notify('Logged in');
        } else notify('Invalid credentials', 'error');
    };
    
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-blue-600 p-10 text-white text-center">
                    <Icon name="droplet" size={64} className="mx-auto mb-4 text-white" />
                    <h2 className="text-4xl font-black tracking-tighter">MilkBook</h2>
                    <p className="opacity-70 text-sm font-bold uppercase tracking-widest">Automatic Milk Collection & Dairy Accounting</p>
                </div>
                <form onSubmit={handleLogin} className="p-10 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Mobile Number</label>
                        <input 
                            type="text" 
                            required 
                            className="w-full p-4 bg-slate-50 border rounded-xl font-bold" 
                            value={formData.mobile} 
                            onChange={e => setFormData({...formData, mobile: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
                        <input 
                            type="password" 
                            required 
                            className="w-full p-4 bg-slate-50 border rounded-xl font-bold" 
                            value={formData.password} 
                            onChange={e => setFormData({...formData, password: e.target.value})} 
                        />
                    </div>
                    <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">LOGIN SYSTEM</button>
                    <div className="text-center">
                        <button type="button" onClick={() => navigate('register')} className="text-blue-600 font-black text-sm hover:underline uppercase tracking-tighter">Register New Dairy Center</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Register Screen Component
const RegisterScreen = ({ setState, notify, navigate }) => {
    const [form, setForm] = useState({ dairyName: '', ownerName: '', mobile: '', password: '', confirm: '' });
    
    const handleRegister = (e) => {
        e.preventDefault();
        if (form.password !== form.confirm) return notify("Passwords mismatch", 'error');
        const user = { name: form.ownerName, mobile: form.mobile, password: form.password };
        setState(prev => ({ ...prev, auth: { isAuthenticated: true, user }, dairyInfo: { ...prev.dairyInfo, name: form.dairyName, owner: form.ownerName, mobile: form.mobile }, currentScreen: 'setup' }));
        notify("Registered");
    };
    
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-12">
                <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter uppercase">Register Center</h2>
                <p className="text-slate-500 font-bold mb-8">Setup your digital procurement system.</p>
                <form onSubmit={handleRegister} className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-xs font-black text-slate-500 uppercase mb-1">Dairy Name</label>
                        <input 
                            required 
                            className="w-full p-4 bg-slate-50 border rounded-xl font-bold" 
                            value={form.dairyName} 
                            onChange={e => setForm({...form, dairyName: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-1">Owner Name</label>
                        <input 
                            required 
                            className="w-full p-4 bg-slate-50 border rounded-xl font-bold" 
                            value={form.ownerName} 
                            onChange={e => setForm({...form, ownerName: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-1">Mobile</label>
                        <input 
                            required 
                            className="w-full p-4 bg-slate-50 border rounded-xl font-bold" 
                            value={form.mobile} 
                            onChange={e => setForm({...form, mobile: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-1">Password</label>
                        <input 
                            type="password" 
                            required 
                            className="w-full p-4 bg-slate-50 border rounded-xl" 
                            value={form.password} 
                            onChange={e => setForm({...form, password: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-1">Confirm</label>
                        <input 
                            type="password" 
                            required 
                            className="w-full p-4 bg-slate-50 border rounded-xl" 
                            value={form.confirm} 
                            onChange={e => setForm({...form, confirm: e.target.value})} 
                        />
                    </div>
                    <button type="submit" className="col-span-2 py-5 bg-blue-600 text-white rounded-xl font-black text-xl hover:bg-blue-700">INITIALIZE DAIRY SYSTEM</button>
                </form>
            </div>
        </div>
    );
};

// Dashboard Screen Component
const DashboardScreen = ({ state, navigate }) => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = state.milkEntries.filter(e => e.date === today);
    const totalQty = todayEntries.reduce((acc, curr) => acc + Number(curr.qty), 0);
    const totalAmt = todayEntries.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const avgFat = todayEntries.length > 0 ? (todayEntries.reduce((acc, curr) => acc + Number(curr.fat), 0) / todayEntries.length).toFixed(1) : 0;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Today's Milk" value={`${totalQty.toFixed(1)} L`} iconName="droplets" color="blue" />
                <StatCard label="Today's Value" value={formatCurrency(totalAmt)} iconName="indian-rupee" color="green" />
                <StatCard label="Avg. Fat" value={`${avgFat}%`} iconName="check-circle" color="amber" />
                <StatCard label="Total Farmers" value={state.farmers.filter(f => f.active).length} iconName="users" color="rose" />
            </div>
            
            <Card title="Recent Collections">
                <table className="w-full text-left">
                    <thead className="border-b text-[10px] font-black text-slate-400 uppercase">
                        <tr>
                            <th className="pb-4">Farmer</th>
                            <th className="pb-4">Time</th>
                            <th className="pb-4">Qty</th>
                            <th className="pb-4">Fat%</th>
                            <th className="pb-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {todayEntries.slice(0, 5).map(entry => {
                            const farmer = state.farmers.find(f => f.id === entry.farmerId);
                            return (
                                <tr key={entry.id}>
                                    <td className="py-4 font-black">{farmer?.name || 'Unknown'}</td>
                                    <td className="py-4 font-bold text-slate-500">{entry.time}</td>
                                    <td className="py-4 font-black text-slate-700">{entry.qty} L</td>
                                    <td className="py-4 font-black text-amber-600">{entry.fat}</td>
                                    <td className="py-4 text-right font-black text-blue-600">{formatCurrency(entry.amount)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

// Setup Wizard Component
const SetupWizard = ({ state, setState, notify, navigate }) => {
    const [step, setStep] = useState(1);
    const [dairy, setDairy] = useState(state.dairyInfo);

    const complete = () => {
        setState(prev => ({ ...prev, dairyInfo: dairy, currentScreen: 'dashboard' }));
        notify("Setup Complete");
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border overflow-hidden">
                <div className="flex bg-slate-100 border-b">
                    {[1, 2, 3].map(i => 
                        <div key={i} className={`flex-1 py-4 text-center text-xs font-black uppercase tracking-widest ${
                            step === i ? 'bg-white text-blue-600 border-b-4 border-blue-600' : 'text-slate-400'
                        }`}>Step {i}</div>
                    )}
                </div>
                <div className="p-12 space-y-8 text-center">
                    {step === 1 && (
                        <div>
                            <Icon name="map-pin" size={48} className="mx-auto text-blue-600" />
                            <h3 className="text-3xl font-black tracking-tight uppercase">Location Details</h3>
                            <textarea 
                                className="w-full p-4 border rounded-xl min-h-[120px] font-bold" 
                                value={dairy.address} 
                                onChange={e => setDairy({...dairy, address: e.target.value})} 
                                placeholder="Dairy Address (Village, District...)" 
                            ></textarea>
                            <button onClick={() => setStep(2)} className="w-full py-5 bg-blue-600 text-white rounded-xl font-black text-xl hover:bg-blue-700">Continue Setup</button>
                        </div>
                    )}
                    {step === 2 && (
                        <div>
                            <Icon name="percent" size={48} className="mx-auto text-blue-600" />
                            <h3 className="text-3xl font-black tracking-tight uppercase">Rate Calculation</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { id: 'Fat_SNF', title: 'Fat + SNF Based', desc: 'Standard calculation based on Fat and Solids-Not-Fat' },
                                    { id: 'Fat', title: 'Fat Only', desc: 'Rate calculated purely on Fat percentage' },
                                    { id: 'CLR', title: 'CLR Method', desc: 'Used for traditional quality testing' }
                                ].map(opt => 
                                    <label key={opt.id} className={`p-5 border-2 rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                                        dairy.rateType === opt.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'
                                    }`}>
                                        <div>
                                            <p className="font-bold text-slate-800">{opt.title}</p>
                                            <p className="text-sm text-slate-500 font-medium">{opt.desc}</p>
                                        </div>
                                        <input 
                                            type="radio" 
                                            checked={dairy.rateType === opt.id} 
                                            onChange={() => setDairy({ ...dairy, rateType: opt.id })} 
                                        />
                                    </label>
                                )}
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 font-bold rounded-xl">Back</button>
                                <button onClick={() => setStep(3)} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl">Continue</button>
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                        <div>
                            <Icon name="check-circle" size={48} className="mx-auto text-green-600" />
                            <h3 className="text-3xl font-black tracking-tight uppercase">Ready to Start</h3>
                            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 text-left">
                                <p className="text-amber-800 font-bold mb-2 flex items-center gap-2">
                                    <Icon name="alert-circle" size={18} /> Review Details
                                </p>
                                <ul className="text-sm space-y-1 text-amber-700 font-medium">
                                    <li>Dairy: {dairy.name}</li>
                                    <li>Rate: {dairy.rateType}</li>
                                    <li>Backup: Enabled (Browser Storage)</li>
                                </ul>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setStep(2)} className="flex-1 py-4 bg-slate-100 font-bold rounded-xl">Back</button>
                                <button onClick={complete} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl">Complete Setup</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Milk Entry Screen Component
const MilkEntryScreen = ({ state, setState, notify }) => {
    const [form, setForm] = useState({ 
        farmerId: '', date: new Date().toISOString().split('T')[0], shift: 'Morning', 
        type: 'Cow', qty: '', fat: '', snf: '', rate: '', amount: '' 
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const rates = state.rates;
        const calc = calculateMilkAmount(form.qty, form.fat, form.snf, state.dairyInfo.rateType, rates, form.type);
        
        const newEntry = {
            id: Date.now().toString(),
            ...form,
            rate: calc.rate,
            amount: calc.amount
        };

        setState(prev => ({
            ...prev,
            milkEntries: [...prev.milkEntries, newEntry]
        }));
        
        notify(`Milk entry added for ${state.farmers.find(f => f.id === form.farmerId)?.name || 'Farmer'}`);
        setForm({ 
            farmerId: '', date: new Date().toISOString().split('T')[0], shift: 'Morning', 
            type: 'Cow', qty: '', fat: '', snf: '', rate: '', amount: '' 
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Card title="New Milk Collection">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Farmer</label>
                        <select 
                            required 
                            className="w-full p-4 bg-slate-50 border rounded-xl font-bold" 
                            value={form.farmerId} 
                            onChange={e => setForm({...form, farmerId: e.target.value})} 
                        >
                            <option value="">Select Farmer</option>
                            {state.farmers.filter(f => f.active).map(farmer => 
                                <option key={farmer.id} value={farmer.id}>{farmer.name}</option>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
                        <input 
                            type="date" 
                            required 
                            className="w-full p-4 bg-slate-50 border rounded-xl font-bold" 
                            value={form.date} 
                            onChange={e => setForm({...form, date: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Shift</label>
                        <select 
                            className="w-full p-4 bg-slate-50 border rounded-xl font-bold" 
                            value={form.shift} 
                            onChange={e => setForm({...form, shift: e.target.value})} 
                        >
                            <option value="Morning">Morning</option>
                            <option value="Evening">Evening</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Milk Type</label>
                        <select 
                            className="w-full p-4 bg-slate-50 border rounded-xl font-bold" 
                            value={form.type} 
                            onChange={e => setForm({...form, type: e.target.value})} 
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
                            required 
                            className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-blue-600" 
                            value={form.qty} 
                            onChange={e => setForm({...form, qty: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fat %</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            required 
                            className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-blue-600" 
                            value={form.fat} 
                            onChange={e => setForm({...form, fat: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">SNF %</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-slate-600" 
                            value={form.snf} 
                            onChange={e => setForm({...form, snf: e.target.value})} 
                        />
                    </div>
                    <div className="md:col-span-3 flex justify-end pt-4">
                        <button type="submit" className="px-8 py-4 bg-blue-600 text-white rounded-xl font-black text-lg hover:bg-blue-700">Record Collection</button>
                    </div>
                </form>
            </Card>
            <Card title="Recent Entries">
                <table className="w-full text-left">
                    <thead className="border-b text-[10px] font-black text-slate-400 uppercase">
                        <tr>
                            <th className="pb-4">Farmer</th>
                            <th className="pb-4">Date</th>
                            <th className="pb-4">Shift</th>
                            <th className="pb-4">Type</th>
                            <th className="pb-4">Qty</th>
                            <th className="pb-4">Fat%</th>
                            <th className="pb-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {state.milkEntries.slice(0, 10).map(entry => {
                            const farmer = state.farmers.find(f => f.id === entry.farmerId);
                            return (
                                <tr key={entry.id}>
                                    <td className="py-4 font-black">{farmer?.name || 'Unknown'}</td>
                                    <td className="py-4 font-bold text-slate-500">{entry.date}</td>
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
            </Card>
        </div>
    );
};

// Farmer Management Screen Component
const FarmerManagementScreen = ({ state, setState, notify }) => {
    const [form, setForm] = useState({ name: '', mobile: '', address: '', advance: '' });
    const [editingId, setEditingId] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        const newFarmer = {
            id: editingId || Date.now().toString(),
            ...form,
            active: true
        };

        if (editingId) {
            setState(prev => ({
                ...prev,
                farmers: prev.farmers.map(f => f.id === editingId ? newFarmer : f)
            }));
            notify("Farmer updated");
        } else {
            setState(prev => ({
                ...prev,
                farmers: [...prev.farmers, newFarmer]
            }));
            notify("New farmer added");
        }

        setForm({ name: '', mobile: '', address: '', advance: '' });
        setEditingId(null);
    };

    const handleEdit = (farmer) => {
        setForm({
            name: farmer.name,
            mobile: farmer.mobile,
            address: farmer.address,
            advance: farmer.advance
        });
        setEditingId(farmer.id);
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this farmer?")) {
            setState(prev => ({
                ...prev,
                farmers: prev.farmers.map(f => f.id === id ? { ...f, active: false } : f)
            }));
            notify("Farmer deactivated");
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <Card title="Farmer Registration">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Name</label>
                        <input 
                            type="text" 
                            required 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                            value={form.name} 
                            onChange={e => setForm({...form, name: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Mobile</label>
                        <input 
                            type="text" 
                            required 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                            value={form.mobile} 
                            onChange={e => setForm({...form, mobile: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Address</label>
                        <input 
                            type="text" 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                            value={form.address} 
                            onChange={e => setForm({...form, address: e.target.value})} 
                        />
                    </div>
                    <div className="flex items-end">
                        <button 
                            type="submit" 
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700"
                        >{editingId ? "Update Farmer" : "Add Farmer"}</button>
                    </div>
                </form>
            </Card>
            <Card title="Active Farmers">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b text-[10px] font-black text-slate-400 uppercase">
                            <tr>
                                <th className="pb-4">Name</th>
                                <th className="pb-4">Mobile</th>
                                <th className="pb-4">Address</th>
                                <th className="pb-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {state.farmers.filter(f => f.active).map(farmer => 
                                <tr key={farmer.id}>
                                    <td className="py-4 font-black">{farmer.name}</td>
                                    <td className="py-4 font-bold text-slate-500">{farmer.mobile}</td>
                                    <td className="py-4 font-bold text-slate-500">{farmer.address}</td>
                                    <td className="py-4 text-right space-x-3">
                                        <button 
                                            onClick={() => handleEdit(farmer)}
                                            className="text-blue-600 font-bold hover:underline text-sm"
                                        >Edit</button>
                                        <button 
                                            onClick={() => handleDelete(farmer.id)}
                                            className="text-red-600 font-bold hover:underline text-sm"
                                        >Delete</button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// Ledger Screen Component
const LedgerScreen = ({ state }) => {
    const [selectedFarmer, setSelectedFarmer] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const filteredEntries = state.milkEntries.filter(entry => {
        const matchesFarmer = selectedFarmer ? entry.farmerId === selectedFarmer : true;
        const entryDate = new Date(entry.date);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        
        const matchesDate = (!startDate || entryDate >= startDate) && (!endDate || entryDate <= endDate);
        return matchesFarmer && matchesDate;
    });

    const totalAmount = filteredEntries.reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
    const totalQty = filteredEntries.reduce((sum, entry) => sum + parseFloat(entry.qty), 0);

    return (
        <div className="max-w-6xl mx-auto">
            <Card title="Milk Collection Ledger">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Filter by Farmer</label>
                        <select 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                            value={selectedFarmer} 
                            onChange={e => setSelectedFarmer(e.target.value)} 
                        >
                            <option value="">All Farmers</option>
                            {state.farmers.filter(f => f.active).map(farmer => 
                                <option key={farmer.id} value={farmer.id}>{farmer.name}</option>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                        <input 
                            type="date" 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                            value={dateRange.start} 
                            onChange={e => setDateRange({...dateRange, start: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">End Date</label>
                        <input 
                            type="date" 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                            value={dateRange.end} 
                            onChange={e => setDateRange({...dateRange, end: e.target.value})} 
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-xl">
                    <div className="text-center p-4 bg-white rounded-xl border">
                        <p className="text-sm font-bold text-slate-500 uppercase">Total Quantity</p>
                        <p className="text-2xl font-black text-slate-800">{totalQty.toFixed(2)} L</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl border">
                        <p className="text-sm font-bold text-slate-500 uppercase">Total Amount</p>
                        <p className="text-2xl font-black text-slate-800">{formatCurrency(totalAmount)}</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl border">
                        <p className="text-sm font-bold text-slate-500 uppercase">Total Entries</p>
                        <p className="text-2xl font-black text-slate-800">{filteredEntries.length}</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b text-[10px] font-black text-slate-400 uppercase">
                            <tr>
                                <th className="pb-4">Date</th>
                                <th className="pb-4">Farmer</th>
                                <th className="pb-4">Shift</th>
                                <th className="pb-4">Type</th>
                                <th className="pb-4">Qty</th>
                                <th className="pb-4">Fat%</th>
                                <th className="pb-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredEntries.map(entry => {
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
            </Card>
        </div>
    );
};

// Payments Screen Component
const PaymentsScreen = ({ state, setState, notify }) => {
    const [form, setForm] = useState({ farmerId: '', amount: '', date: new Date().toISOString().split('T')[0], mode: 'Cash', notes: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        const newPayment = {
            id: Date.now().toString(),
            ...form,
            amount: parseFloat(form.amount)
        };

        setState(prev => ({
            ...prev,
            payments: [...prev.payments, newPayment]
        }));

        notify(`Payment of ${formatCurrency(form.amount)} recorded`);
        setForm({ farmerId: '', amount: '', date: new Date().toISOString().split('T')[0], mode: 'Cash', notes: '' });
    };

    const farmerBalances = state.farmers.map(farmer => {
        const totalMilkValue = state.milkEntries
            .filter(entry => entry.farmerId === farmer.id)
            .reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
        
        const totalPayments = state.payments
            .filter(payment => payment.farmerId === farmer.id)
            .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        
        return {
            ...farmer,
            totalMilkValue,
            totalPayments,
            balance: totalMilkValue - totalPayments
        };
    });

    return (
        <div className="max-w-6xl mx-auto">
            <Card title="Record Payment">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Farmer</label>
                        <select 
                            required 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                            value={form.farmerId} 
                            onChange={e => setForm({...form, farmerId: e.target.value})} 
                        >
                            <option value="">Select Farmer</option>
                            {state.farmers.filter(f => f.active).map(farmer => 
                                <option key={farmer.id} value={farmer.id}>{farmer.name}</option>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Amount</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            required 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-blue-600" 
                            value={form.amount} 
                            onChange={e => setForm({...form, amount: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
                        <input 
                            type="date" 
                            required 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                            value={form.date} 
                            onChange={e => setForm({...form, date: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Mode</label>
                        <select 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                            value={form.mode} 
                            onChange={e => setForm({...form, mode: e.target.value})} 
                        >
                            <option value="Cash">Cash</option>
                            <option value="Bank">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button 
                            type="submit" 
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700"
                        >Record Payment</button>
                    </div>
                </form>
            </Card>
            <Card title="Farmer Balances">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b text-[10px] font-black text-slate-400 uppercase">
                            <tr>
                                <th className="pb-4">Farmer</th>
                                <th className="pb-4">Milk Value</th>
                                <th className="pb-4">Payments Made</th>
                                <th className="pb-4 text-right">Balance Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {farmerBalances.filter(fb => fb.active).map(farmer => 
                                <tr key={farmer.id}>
                                    <td className="py-4 font-black">{farmer.name}</td>
                                    <td className="py-4 font-black text-green-600">{formatCurrency(farmer.totalMilkValue)}</td>
                                    <td className="py-4 font-black text-blue-600">{formatCurrency(farmer.totalPayments)}</td>
                                    <td className={`py-4 text-right font-black ${farmer.balance > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                                        {formatCurrency(farmer.balance)}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
            <Card title="Recent Payments">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b text-[10px] font-black text-slate-400 uppercase">
                            <tr>
                                <th className="pb-4">Date</th>
                                <th className="pb-4">Farmer</th>
                                <th className="pb-4">Amount</th>
                                <th className="pb-4">Mode</th>
                                <th className="pb-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {state.payments.slice(0, 10).map(payment => {
                                const farmer = state.farmers.find(f => f.id === payment.farmerId);
                                return (
                                    <tr key={payment.id}>
                                        <td className="py-4 font-bold text-slate-500">{payment.date}</td>
                                        <td className="py-4 font-black">{farmer?.name || 'Unknown'}</td>
                                        <td className="py-4 font-black text-blue-600">{formatCurrency(payment.amount)}</td>
                                        <td className="py-4 font-bold text-slate-500">{payment.mode}</td>
                                        <td className="py-4 text-right font-black text-green-600">Completed</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// Sales Screen Component
const SalesScreen = ({ state, setState, notify }) => {
    const [form, setForm] = useState({ 
        buyer: '', date: new Date().toISOString().split('T')[0], 
        qty: '', rate: '', amount: '', mode: 'Cash' 
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const newSale = {
            id: Date.now().toString(),
            ...form,
            amount: (parseFloat(form.qty) * parseFloat(form.rate)).toFixed(2)
        };

        setState(prev => ({
            ...prev,
            sales: [...prev.sales, newSale]
        }));

        notify(`Sale of ${formatCurrency(newSale.amount)} recorded`);
        setForm({ 
            buyer: '', date: new Date().toISOString().split('T')[0], 
            qty: '', rate: '', amount: '', mode: 'Cash' 
        });
    };

    const totalSales = state.sales.reduce((sum, sale) => sum + parseFloat(sale.amount), 0);
    const totalQtySold = state.sales.reduce((sum, sale) => sum + parseFloat(sale.qty), 0);

    return (
        <div className="max-w-4xl mx-auto">
            <Card title="Record Milk Sale">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Buyer</label>
                        <input 
                            type="text" 
                            required 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                            value={form.buyer} 
                            onChange={e => setForm({...form, buyer: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
                        <input 
                            type="date" 
                            required 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                            value={form.date} 
                            onChange={e => setForm({...form, date: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Quantity (L)</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            required 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-blue-600" 
                            value={form.qty} 
                            onChange={e => setForm({...form, qty: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Rate (Per L)</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            required 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-blue-600" 
                            value={form.rate} 
                            onChange={e => setForm({...form, rate: e.target.value})} 
                        />
                    </div>
                    <div className="flex items-end">
                        <button 
                            type="submit" 
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700"
                        >Record Sale</button>
                    </div>
                </form>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
                    <div className="p-4 rounded-xl bg-blue-50 text-blue-600">
                        <Icon name="shopping-bag" size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Sales</p>
                        <p className="text-2xl font-black text-slate-800">{formatCurrency(totalSales)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
                    <div className="p-4 rounded-xl bg-green-50 text-green-600">
                        <Icon name="droplets" size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Quantity Sold</p>
                        <p className="text-2xl font-black text-slate-800">{totalQtySold.toFixed(2)} L</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
                    <div className="p-4 rounded-xl bg-amber-50 text-amber-600">
                        <Icon name="trending-up" size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Avg. Rate</p>
                        <p className="text-2xl font-black text-slate-800">{formatCurrency(totalSales / totalQtySold || 0)}</p>
                    </div>
                </div>
            </div>
            <Card title="Recent Sales">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b text-[10px] font-black text-slate-400 uppercase">
                            <tr>
                                <th className="pb-4">Date</th>
                                <th className="pb-4">Buyer</th>
                                <th className="pb-4">Qty</th>
                                <th className="pb-4">Rate</th>
                                <th className="pb-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {state.sales.slice(0, 10).map(sale => 
                                <tr key={sale.id}>
                                    <td className="py-4 font-bold text-slate-500">{sale.date}</td>
                                    <td className="py-4 font-black">{sale.buyer}</td>
                                    <td className="py-4 font-black text-slate-700">{sale.qty} L</td>
                                    <td className="py-4 font-black text-blue-600">{formatCurrency(parseFloat(sale.rate))}</td>
                                    <td className="py-4 text-right font-black text-green-600">{formatCurrency(sale.amount)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// Inventory Screen Component
const InventoryScreen = ({ state, setState, notify }) => {
    const [form, setForm] = useState({ item: 'Feed', type: 'Purchase', qty: '', date: new Date().toISOString().split('T')[0] });

    const handleSubmit = (e) => {
        e.preventDefault();
        const newEntry = {
            id: Date.now().toString(),
            ...form,
            qty: parseFloat(form.qty)
        };

        setState(prev => ({
            ...prev,
            inventory: [...prev.inventory, newEntry]
        }));

        notify(`${form.type} of ${form.qty} ${form.item} recorded`);
        setForm({ item: 'Feed', type: 'Purchase', qty: '', date: new Date().toISOString().split('T')[0] });
    };

    const stockLevels = ['Feed', 'Ghee', 'Other'].map(itemType => {
        const purchases = state.inventory
            .filter(inv => inv.item === itemType && inv.type === 'Purchase')
            .reduce((sum, inv) => sum + inv.qty, 0);
        
        const sales = state.inventory
            .filter(inv => inv.item === itemType && inv.type === 'Sale')
            .reduce((sum, inv) => sum + inv.qty, 0);
        
        return {
            item: itemType,
            totalIn: purchases,
            totalOut: sales,
            currentStock: purchases - sales
        };
    });

    return (
        <div className="max-w-4xl mx-auto">
            <Card title="Inventory Management">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Item</label>
                        <select 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                            value={form.item} 
                            onChange={e => setForm({...form, item: e.target.value})} 
                        >
                            <option value="Feed">Feed</option>
                            <option value="Ghee">Ghee</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Action</label>
                        <select 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                            value={form.type} 
                            onChange={e => setForm({...form, type: e.target.value})} 
                        >
                            <option value="Purchase">Purchase</option>
                            <option value="Sale">Sale</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Qty</label>
                        <input 
                            type="number" 
                            required 
                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                            value={form.qty} 
                            onChange={e => setForm({...form, qty: e.target.value})} 
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest"
                    >Update Stock</button>
                </form>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {stockLevels.map(stock => 
                    <div key={stock.item} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
                        <div className={`p-4 rounded-xl ${stock.currentStock > 10 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                            <Icon name={stock.item === 'Feed' ? "box" : stock.item === 'Ghee' ? "archive" : "package"} size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stock.item}</p>
                            <p className="text-2xl font-black text-slate-800">{stock.currentStock} {stock.item === 'Feed' ? 'Bags' : stock.item === 'Ghee' ? 'Kg' : 'Units'}</p>
                        </div>
                    </div>
                )}
            </div>
            <Card title="Inventory Transactions">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b text-[10px] font-black text-slate-400 uppercase">
                            <tr>
                                <th className="pb-4">Date</th>
                                <th className="pb-4">Item</th>
                                <th className="pb-4">Type</th>
                                <th className="pb-4">Qty</th>
                                <th className="pb-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {state.inventory.slice(0, 15).map(transaction => 
                                <tr key={transaction.id}>
                                    <td className="py-4 font-bold text-slate-500">{transaction.date}</td>
                                    <td className="py-4 font-black">{transaction.item}</td>
                                    <td className="py-4 font-bold text-slate-500">{transaction.type}</td>
                                    <td className="py-4 font-black text-slate-700">{transaction.qty} {transaction.item === 'Feed' ? 'Bags' : transaction.item === 'Ghee' ? 'Kg' : 'Units'}</td>
                                    <td className="py-4 text-right font-black text-blue-600">{transaction.type}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// Reports Screen Component
const ReportsScreen = ({ state }) => {
    const stats = useMemo(() => {
        const totalL = state.milkEntries.reduce((a,b) => a + Number(b.qty), 0);
        const totalCost = state.milkEntries.reduce((a,b) => a + Number(b.amount), 0);
        const avgRate = totalL > 0 ? (totalCost / totalL).toFixed(2) : 0;
        
        // Monthly breakdown
        const monthlyData = {};
        state.milkEntries.forEach(entry => {
            const month = entry.date.substring(0, 7); // YYYY-MM
            if (!monthlyData[month]) {
                monthlyData[month] = { qty: 0, amount: 0, count: 0 };
            }
            monthlyData[month].qty += parseFloat(entry.qty);
            monthlyData[month].amount += parseFloat(entry.amount);
            monthlyData[month].count += 1;
        });
        
        return { totalL, totalCost, avgRate, monthlyData: Object.entries(monthlyData).slice(0, 12) };
    }, [state.milkEntries]);

    return (
        <div className="space-y-8 print:p-0">
            <div className="flex justify-between items-center print:hidden">
                <h2 className="text-3xl font-black tracking-tighter uppercase">Audit Reports</h2>
                <button 
                    onClick={() => window.print()} 
                    className="px-6 py-4 bg-white border border-slate-200 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm"
                >Export PDF</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 text-white p-10 rounded-3xl shadow-2xl">
                    <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2">Total Procurement</p>
                    <p className="text-4xl font-black tracking-tighter">{stats.totalL.toFixed(1)} <span className="text-sm font-bold opacity-50">LTRS</span></p>
                </div>
                <div className="bg-blue-600 text-white p-10 rounded-3xl shadow-2xl">
                    <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2">Acquisition Cost</p>
                    <p className="text-4xl font-black tracking-tighter">{formatCurrency(stats.totalCost)}</p>
                </div>
                <div className="bg-white border p-10 rounded-3xl shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Efficiency Index</p>
                    <p className="text-4xl font-black tracking-tighter text-slate-800">₹{stats.avgRate}<span className="text-xs">/L</span></p>
                </div>
            </div>
            <Card title="Monthly Collection Trend">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b text-[10px] font-black text-slate-400 uppercase">
                            <tr>
                                <th className="pb-4">Month</th>
                                <th className="pb-4">Collections</th>
                                <th className="pb-4">Volume</th>
                                <th className="pb-4 text-right">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {stats.monthlyData.map(([month, data]) => 
                                <tr key={month}>
                                    <td className="py-4 font-black">{month}</td>
                                    <td className="py-4 font-bold text-slate-500">{data.count} collections</td>
                                    <td className="py-4 font-black text-slate-700">{data.qty.toFixed(1)} L</td>
                                    <td className="py-4 text-right font-black text-blue-600">{formatCurrency(data.amount)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
            <Card title="Shift-wise Efficiency Analysis">
                <table className="w-full text-left">
                    <thead className="border-b text-[10px] font-black text-slate-400 uppercase">
                        <tr>
                            <th className="pb-4">Shift</th>
                            <th className="pb-4">Collections</th>
                            <th className="pb-4">Volume</th>
                            <th className="pb-4 text-right">Investment</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {['Morning', 'Evening'].map(shift => {
                            const entries = state.milkEntries.filter(e => e.shift === shift);
                            const totalQty = entries.reduce((a,b) => a + Number(b.qty), 0);
                            const totalAmount = entries.reduce((a,b) => a + Number(b.amount), 0);
                            
                            return (
                                <tr key={shift}>
                                    <td className="py-4 font-black">{shift}</td>
                                    <td className="py-4 font-bold text-slate-500">{entries.length} units</td>
                                    <td className="py-4 font-black text-slate-700">{totalQty.toFixed(1)} L</td>
                                    <td className="py-4 text-right font-black text-blue-600">{formatCurrency(totalAmount)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

// Backup Screen Component
const BackupScreen = ({ state, setState, notify }) => {
    const backup = () => { 
        localStorage.setItem('milkbook_backup_v1', JSON.stringify(state)); 
        setState(p => ({...p, settings: {...p.settings, lastBackup: new Date()}})); 
        notify("Backup Secured Locally"); 
    };
    const restore = () => { 
        const data = localStorage.getItem('milkbook_backup_v1'); 
        if (data && confirm("Wipe current data and restore?")) { 
            setState(JSON.parse(data)); 
            notify("Restored"); 
        } 
    };
    
    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <Card title="Disaster Recovery & Sync">
                <div className="space-y-8">
                    <div className="flex items-center gap-6 bg-blue-50/50 p-8 rounded-3xl border-2 border-dashed border-blue-200">
                        <Icon name="database" size={48} className="text-blue-600" />
                        <div>
                            <p className="font-black text-xl uppercase tracking-tighter">Persistence Engine</p>
                            <p className="text-sm font-bold text-slate-400 italic">Latest snapshot: {state.settings.lastBackup ? formatDate(state.settings.lastBackup) : 'No snapshot found'}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <button 
                            onClick={backup} 
                            className="py-6 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700"
                        >Secure Backup</button>
                        <button 
                            onClick={restore} 
                            className="py-6 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800"
                        >Restore Data</button>
                    </div>
                </div>
            </Card>
            <Card title="Export Data">
                <div className="space-y-6">
                    <button 
                        onClick={() => {
                            const dataStr = JSON.stringify(state, null, 2);
                            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                            const exportFileDefaultName = 'milkbook_data_export.json';
                            const linkElement = document.createElement('a');
                            linkElement.setAttribute('href', dataUri);
                            linkElement.setAttribute('download', exportFileDefaultName);
                            linkElement.click();
                        }}
                        className="w-full py-5 bg-green-600 text-white rounded-xl font-black text-lg hover:bg-green-700"
                    >Export All Data (JSON)</button>
                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                        <p className="font-black text-amber-800 mb-2 flex items-center gap-2">
                            <Icon name="alert-circle" size={18} />
                            Important Note
                        </p>
                        <ul className="text-sm space-y-1 text-amber-700 font-medium">
                            <li>Data is stored in your browser. Clearing browser data may cause loss</li>
                            <li>Always maintain external backups of critical data</li>
                            <li>Export data regularly to prevent accidental loss</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// Settings Screen Component
const SettingsScreen = ({ state, setState, notify }) => {
    const [rates, setRates] = useState(state.rates);
    const save = () => { 
        setState(p => ({ ...p, rates })); 
        notify("System Updated"); 
    };
    
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Card title="Pricing Architecture">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Cow Milk Protocol</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Base Rate</label>
                                <input 
                                    type="number" 
                                    className="w-full p-4 border rounded-xl font-black text-blue-600" 
                                    value={rates.cow.base} 
                                    onChange={e => setRates({...rates, cow: {...rates.cow, base: e.target.value}})} 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Ref Fat</label>
                                <input 
                                    type="number" 
                                    className="w-full p-4 border rounded-xl font-black text-slate-600" 
                                    value={rates.cow.fatRef} 
                                    onChange={e => setRates({...rates, cow: {...rates.cow, fatRef: e.target.value}})} 
                                />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Buffalo Milk Protocol</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Base Rate</label>
                                <input 
                                    type="number" 
                                    className="w-full p-4 border rounded-xl font-black text-blue-600" 
                                    value={rates.buffalo.base} 
                                    onChange={e => setRates({...rates, buffalo: {...rates.buffalo, base: e.target.value}})} 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Ref Fat</label>
                                <input 
                                    type="number" 
                                    className="w-full p-4 border rounded-xl font-black text-slate-600" 
                                    value={rates.buffalo.fatRef} 
                                    onChange={e => setRates({...rates, buffalo: {...rates.buffalo, fatRef: e.target.value}})} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={save} 
                    className="w-full mt-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 uppercase tracking-tighter"
                >Recalibrate System Rates</button>
            </Card>
            <div className="flex justify-between items-center p-8 bg-rose-50 border-2 border-rose-100 rounded-3xl">
                <div className="pr-12">
                    <p className="font-black text-rose-800 uppercase tracking-tighter text-xl">Factory Reset</p>
                    <p className="text-sm font-bold text-rose-600 opacity-80 uppercase tracking-widest">Permanent erasure of all centers, farmers, and logs.</p>
                </div>
                <button 
                    onClick={() => { 
                        if(confirm("ABSOLUTE WIPE?")) { 
                            localStorage.clear(); 
                            window.location.reload(); 
                        } 
                    }} 
                    className="px-8 py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-xs tracking-widest"
                >Execute Wipe</button>
            </div>
        </div>
    );
};