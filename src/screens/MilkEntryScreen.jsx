// src/screens/MilkEntryScreen.jsx
import React, { useState } from 'react';
import { formatCurrency, formatDate, calculateMilkAmount } from '../utils/constants';
import { Icon, Card, StatCard } from '../components/shared';

export const MilkEntryScreen = ({ state, setState, notify }) => {
  const [form, setForm] = useState({ 
    farmerId: '', date: new Date().toISOString().split('T')[0], shift: 'Morning', 
    type: 'Cow', qty: '', fat: '', snf: '', rate: '', amount: '',
    advance: '', feedDeduction: '', otherDeduction: '', netAmount: '' 
  });
  const [entryLocked, setEntryLocked] = useState(false); // For immutable entries during rush hours

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!form.farmerId || !form.qty || !form.fat) {
      notify("Please fill required fields", 'error');
      return;
    }
    
    const rates = state.rates;
    const calc = calculateMilkAmount(form.qty, form.fat, form.snf, state.dairyInfo.rateType, rates, form.type);
    
    // Create new entry with proper metadata
    const newEntry = {
      id: Date.now().toString(),
      ...form,
      rate: calc.rate,
      amount: calc.amount,
      timestamp: new Date().toISOString(), // Add timestamp for audit trail
      syncState: 'QUARANTINED', // Mark as quarantined until synced to server
      created_at_local: new Date().toISOString(),
      synced_at_server: null,
      is_manual: true, // Flag for manual entry
      input_source: 'keyboard', // 'scale' or 'keyboard'
      device_id: navigator.userAgent,
      operator_id: state.auth.user?.id || 'unknown'
    };

    setState(prev => ({
      ...prev,
      milkEntries: [...prev.milkEntries, newEntry]
    }));
    
    // Update farmer's pending payment
    setState(prev => ({
      ...prev,
      payments: [
        ...prev.payments,
        {
          id: Date.now().toString(),
          farmerId: form.farmerId,
          amount: parseFloat(calc.amount),
          date: form.date,
          mode: 'Pending',
          notes: `Milk collection for ${form.qty}L at ${form.fat}% fat`,
          type: 'Milk Payment',
          status: 'Pending',
          timestamp: new Date().toISOString(),
          syncState: 'QUARANTINED'
        }
      ]
    }));

    notify(`Milk entry added for ${state.farmers.find(f => f.id === form.farmerId)?.name || 'Farmer'}. Amount: ₹${calc.amount}`);
    
    // If in rush hour and labour mode, lock the entry and show success message
    if (state.userRole === 'labour' && state.autoLockMode && isRushHour()) {
      setEntryLocked(true);
      setTimeout(() => {
        setForm({ 
          farmerId: '', date: new Date().toISOString().split('T')[0], shift: 'Morning', 
          type: 'Cow', qty: '', fat: '', snf: '', rate: '', amount: '',
          advance: '', feedDeduction: '', otherDeduction: '', netAmount: '' 
        });
        setEntryLocked(false);
      }, 2000); // Auto-clear form after 2 seconds
    } else {
      setForm({ 
        farmerId: '', date: new Date().toISOString().split('T')[0], shift: 'Morning', 
        type: 'Cow', qty: '', fat: '', snf: '', rate: '', amount: '',
        advance: '', feedDeduction: '', otherDeduction: '', netAmount: '' 
      });
    }
  };

  // Determine if we're in rush hours (when auto-lock should be enforced)
  const isRushHour = () => {
    const hour = new Date().getHours();
    return (hour >= 5 && hour <= 10) || (hour >= 17 && hour <= 20); // Morning 5-10AM, Evening 5-8PM
  };

  // Simplified interface for labour mode during rush hours
  if (state.userRole === 'labour' && state.autoLockMode && isRushHour()) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black tracking-tighter uppercase">MILK COLLECTION</h2>
          <p className="text-slate-500 font-bold">Rush Hour Mode - Quick Entry</p>
        </div>
        
        <Card title="New Collection">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Farmer</label>
              <select
                required
                disabled={entryLocked}
                className={`w-full p-4 bg-slate-50 border rounded-xl font-bold ${entryLocked ? 'bg-slate-200' : ''}`}
                value={form.farmerId}
                onChange={e => setForm({...form, farmerId: e.target.value})}
              >
                <option value="">Select Farmer</option>
                {state.farmers.filter(f => f.active).map(farmer =>
                  <option key={farmer.id} value={farmer.id}>{farmer.name}</option>
                )}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Qty (L)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  disabled={entryLocked}
                  className={`w-full p-4 bg-slate-50 border rounded-xl font-bold text-blue-600 ${entryLocked ? 'bg-slate-200' : ''}`}
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
                  disabled={entryLocked}
                  className={`w-full p-4 bg-slate-50 border rounded-xl font-bold text-blue-600 ${entryLocked ? 'bg-slate-200' : ''}`}
                  value={form.fat}
                  onChange={e => setForm({...form, fat: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Shift</label>
                <select
                  disabled={entryLocked}
                  className={`w-full p-4 bg-slate-50 border rounded-xl font-bold ${entryLocked ? 'bg-slate-200' : ''}`}
                  value={form.shift}
                  onChange={e => setForm({...form, shift: e.target.value})}
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>
            </div>
            <div className="flex justify-center pt-4">
              <button 
                type="submit" 
                disabled={entryLocked}
                className={`px-8 py-4 rounded-xl font-black text-lg flex items-center gap-2 ${
                  entryLocked 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100'
                }`}
              >
                {entryLocked ? (
                  <>
                    <Icon name="check-circle" size={20} />
                    Entry Recorded!
                  </>
                ) : (
                  <>
                    <Icon name="droplets" size={20} />
                    Record Collection
                  </>
                )}
              </button>
            </div>
          </form>
        </Card>
        
        {entryLocked && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md">
              <Icon name="check-circle" size={64} className="text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-800 mb-2">Entry Saved!</h3>
              <p className="text-slate-600 mb-4">Entry for {state.farmers.find(f => f.id === form.farmerId)?.name || 'Farmer'} - {form.qty}L at {form.fat}% fat</p>
              <p className="text-sm text-slate-500">Amount: ₹{(parseFloat(form.qty) * parseFloat(calculateMilkAmount(form.qty, form.fat, form.snf, state.dairyInfo.rateType, state.rates, form.type).rate)).toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Regular interface for owner mode
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-black tracking-tighter uppercase">Milk Collection</h2>
        <button 
          onClick={() => alert("Contact support to verify compatibility with your specific analyzer model. Hardware integration success depends on device compatibility, driver support, and browser capabilities.")} 
          className="px-6 py-3 bg-green-600 text-white rounded-xl font-black text-sm uppercase tracking-widest flex items-center gap-2"
        >
          <Icon name="upload" size={18} />
          Import Readings
        </button>
      </div>
      
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
        <div className="overflow-x-auto">
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
                <th className="pb-4 text-center">Status</th>
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
                    <td className="py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        entry.syncState === 'QUARANTINED' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {entry.syncState === 'QUARANTINED' ? 'PENDING' : 'SYNCED'}
                      </span>
                    </td>
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