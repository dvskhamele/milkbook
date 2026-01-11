// src/screens/PaymentsScreen.jsx
import React, { useState, useMemo } from 'react';
import { formatCurrency, formatDate, calculateFarmerBalances } from '../utils/constants';
import { Icon, Card, StatCard } from '../components/shared';

export const PaymentsScreen = ({ state, setState, notify }) => {
  const [form, setForm] = useState({ 
    farmerId: '', amount: '', date: new Date().toISOString().split('T')[0], 
    mode: 'Cash', type: 'Payment', notes: '', status: 'Completed' 
  });
  const [bonusForm, setBonusForm] = useState({ farmerId: '', amount: '', reason: '', date: new Date().toISOString().split('T')[0] });
  const [deductionForm, setDeductionForm] = useState({ farmerId: '', amount: '', reason: '', date: new Date().toISOString().split('T')[0] });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newPayment = {
      id: Date.now().toString(),
      ...form,
      amount: parseFloat(form.amount),
      timestamp: new Date().toISOString(),
      syncState: 'QUARANTINED' // Mark as quarantined until synced to server
    };

    setState(prev => ({
      ...prev,
      payments: [...prev.payments, newPayment]
    }));

    notify(`Payment of ${formatCurrency(form.amount)} recorded`);
    setForm({
      farmerId: '', amount: '', date: new Date().toISOString().split('T')[0],
      mode: 'Cash', type: 'Payment', notes: '', status: 'Completed'
    });
  };

  const handleBonusSubmit = (e) => {
    e.preventDefault();
    const newBonus = {
      id: Date.now().toString(),
      farmerId: bonusForm.farmerId,
      amount: parseFloat(bonusForm.amount),
      date: bonusForm.date,
      type: 'Bonus',
      reason: bonusForm.reason,
      status: 'Completed',
      timestamp: new Date().toISOString(),
      syncState: 'QUARANTINED'
    };

    setState(prev => ({
      ...prev,
      payments: [...prev.payments, newBonus]
    }));

    notify(`Bonus of ${formatCurrency(bonusForm.amount)} added`);
    setBonusForm({
      farmerId: '', amount: '', reason: '', date: new Date().toISOString().split('T')[0]
    });
  };

  const handleDeductionSubmit = (e) => {
    e.preventDefault();
    const newDeduction = {
      id: Date.now().toString(),
      farmerId: deductionForm.farmerId,
      amount: parseFloat(deductionForm.amount),
      date: deductionForm.date,
      type: 'Deduction',
      reason: deductionForm.reason,
      status: 'Completed',
      timestamp: new Date().toISOString(),
      syncState: 'QUARANTINED'
    };

    setState(prev => ({
      ...prev,
      payments: [...prev.payments, newDeduction]
    }));

    notify(`Deduction of ${formatCurrency(deductionForm.amount)} recorded`);
    setDeductionForm({
      farmerId: '', amount: '', reason: '', date: new Date().toISOString().split('T')[0]
    });
  };

  // Calculate farmer balances considering all transactions
  const farmerBalances = useMemo(() => {
    return state.farmers.map(farmer => {
      const totalMilkValue = state.milkEntries
        .filter(entry => entry.farmerId === farmer.id)
        .reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
      
      const totalPayments = state.payments
        .filter(payment => payment.farmerId === farmer.id && payment.type === 'Payment')
        .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      
      const totalBonuses = state.payments
        .filter(payment => payment.farmerId === farmer.id && payment.type === 'Bonus')
        .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      
      const totalDeductions = state.payments
        .filter(payment => payment.farmerId === farmer.id && payment.type === 'Deduction')
        .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

      return {
        ...farmer,
        totalMilkValue,
        totalPayments,
        totalBonuses,
        totalDeductions,
        balance: totalMilkValue - totalPayments + totalBonuses - totalDeductions
      };
    });
  }, [state.farmers, state.milkEntries, state.payments]);

  const totalPending = farmerBalances.reduce((sum, farmer) => sum + farmer.balance, 0);
  const totalPaid = state.payments
    .filter(p => p.type === 'Payment' && p.status === 'Completed')
    .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="p-4 rounded-xl bg-blue-50 text-blue-600">
            <Icon name="indian-rupee" size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Pending</p>
            <p className="text-2xl font-black text-slate-800">{formatCurrency(totalPending)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="p-4 rounded-xl bg-green-50 text-green-600">
            <Icon name="trending-up" size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Paid</p>
            <p className="text-2xl font-black text-slate-800">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="p-4 rounded-xl bg-amber-50 text-amber-600">
            <Icon name="users" size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Farmers</p>
            <p className="text-2xl font-black text-slate-800">{state.farmers.filter(f => f.active).length}</p>
          </div>
        </div>
      </div>

      <Card title="Record Payment">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Add Bonus">
          <form onSubmit={handleBonusSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Farmer</label>
              <select 
                required 
                className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                value={bonusForm.farmerId} 
                onChange={e => setBonusForm({...bonusForm, farmerId: e.target.value})} 
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
                className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-green-600" 
                value={bonusForm.amount} 
                onChange={e => setBonusForm({...bonusForm, amount: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Reason</label>
              <input 
                type="text" 
                required 
                className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                value={bonusForm.reason} 
                onChange={e => setBonusForm({...bonusForm, reason: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
              <input 
                type="date" 
                required 
                className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                value={bonusForm.date} 
                onChange={e => setBonusForm({...bonusForm, date: e.target.value})} 
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-4 bg-green-600 text-white rounded-xl font-black hover:bg-green-700"
            >Add Bonus</button>
          </form>
        </Card>

        <Card title="Record Deduction">
          <form onSubmit={handleDeductionSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Farmer</label>
              <select 
                required 
                className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                value={deductionForm.farmerId} 
                onChange={e => setDeductionForm({...deductionForm, farmerId: e.target.value})} 
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
                className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-red-600" 
                value={deductionForm.amount} 
                onChange={e => setDeductionForm({...deductionForm, amount: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Reason</label>
              <input 
                type="text" 
                required 
                className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                value={deductionForm.reason} 
                onChange={e => setDeductionForm({...deductionForm, reason: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
              <input 
                type="date" 
                required 
                className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
                value={deductionForm.date} 
                onChange={e => setDeductionForm({...deductionForm, date: e.target.value})} 
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-4 bg-red-600 text-white rounded-xl font-black hover:bg-red-700"
            >Record Deduction</button>
          </form>
        </Card>
      </div>

      <Card title="Farmer Balances">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b text-[10px] font-black text-slate-400 uppercase">
              <tr>
                <th className="pb-4">Farmer</th>
                <th className="pb-4">Milk Value</th>
                <th className="pb-4">Payments</th>
                <th className="pb-4">Bonuses</th>
                <th className="pb-4">Deductions</th>
                <th className="pb-4 text-right">Balance Due</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {farmerBalances.filter(fb => fb.active).map(farmer => {
                // Calculate bonuses and deductions separately
                const bonuses = state.payments
                  .filter(p => p.farmerId === farmer.id && p.type === 'Bonus')
                  .reduce((sum, p) => sum + parseFloat(p.amount), 0);
                const deductions = state.payments
                  .filter(p => p.farmerId === farmer.id && p.type === 'Deduction')
                  .reduce((sum, p) => sum + parseFloat(p.amount), 0);
                
                return (
                  <tr key={farmer.id}>
                    <td className="py-4 font-black">{farmer.name}</td>
                    <td className="py-4 font-black text-green-600">{formatCurrency(farmer.totalMilkValue)}</td>
                    <td className="py-4 font-black text-blue-600">{formatCurrency(farmer.totalPayments)}</td>
                    <td className="py-4 font-black text-green-600">{formatCurrency(bonuses)}</td>
                    <td className="py-4 font-black text-red-600">{formatCurrency(deductions)}</td>
                    <td className={`py-4 text-right font-black ${farmer.balance > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                      {formatCurrency(farmer.balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Recent Transactions">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b text-[10px] font-black text-slate-400 uppercase">
              <tr>
                <th className="pb-4">Date</th>
                <th className="pb-4">Farmer</th>
                <th className="pb-4">Type</th>
                <th className="pb-4">Amount</th>
                <th className="pb-4">Mode</th>
                <th className="pb-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {state.payments.slice(0, 15).map(payment => {
                const farmer = state.farmers.find(f => f.id === payment.farmerId);
                const isDeduction = payment.type === 'Deduction';
                const isBonus = payment.type === 'Bonus';
                
                return (
                  <tr key={payment.id}>
                    <td className="py-4 font-bold text-slate-500">{payment.date}</td>
                    <td className="py-4 font-black">{farmer?.name || 'Unknown'}</td>
                    <td className="py-4 font-bold text-slate-500">{payment.type} {payment.reason && `(${payment.reason})`}</td>
                    <td className={`py-4 font-black ${isDeduction ? 'text-red-600' : isBonus ? 'text-green-600' : 'text-blue-600'}`}>
                      {isDeduction ? '-' : ''}{formatCurrency(payment.amount)}
                    </td>
                    <td className="py-4 font-bold text-slate-500">{payment.mode || 'N/A'}</td>
                    <td className="py-4 text-right font-black text-green-600">{payment.status || 'Completed'}</td>
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