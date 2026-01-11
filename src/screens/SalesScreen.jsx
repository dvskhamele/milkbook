// src/screens/SalesScreen.jsx
import React, { useState } from 'react';
import { formatCurrency, formatDate, calculateMilkAmount } from '../utils/constants';
import { Icon, Card, StatCard } from '../components/shared';

export const SalesScreen = ({ state, setState, notify }) => {
  const [form, setForm] = useState({ 
    buyer: '', date: new Date().toISOString().split('T')[0], 
    productType: 'Milk', qty: '', rate: '', amount: '', mode: 'Cash' 
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

    notify(`Sale of ${formatCurrency(newSale.amount)} recorded for ${form.productType}`);
    setForm({ 
      buyer: '', date: new Date().toISOString().split('T')[0], 
      productType: 'Milk', qty: '', rate: '', amount: '', mode: 'Cash' 
    });
  };

  const totalSales = state.sales.reduce((sum, sale) => sum + parseFloat(sale.amount), 0);
  const totalQtySold = state.sales.reduce((sum, sale) => sum + parseFloat(sale.qty), 0);

  // Group sales by product type
  const salesByProduct = {
    Milk: state.sales.filter(s => s.productType === 'Milk'),
    Feed: state.sales.filter(s => s.productType === 'Feed'),
    Ghee: state.sales.filter(s => s.productType === 'Ghee'),
    Other: state.sales.filter(s => s.productType === 'Other')
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-black tracking-tighter uppercase">Product Sales</h2>
        <button 
          onClick={() => alert("Contact support to verify compatibility with your specific analyzer model. Hardware integration success depends on device compatibility, driver support, and browser capabilities.")} 
          className="px-6 py-3 bg-green-600 text-white rounded-xl font-black text-sm uppercase tracking-widest flex items-center gap-2"
        >
          <Icon name="upload" size={18} />
          Import Sales
        </button>
      </div>
      
      <Card title="Record Product Sale">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
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
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Product</label>
            <select 
              className="w-full p-3 bg-slate-50 border rounded-xl font-bold" 
              value={form.productType} 
              onChange={e => setForm({...form, productType: e.target.value})} 
            >
              <option value="Milk">Milk</option>
              <option value="Feed">Feed</option>
              <option value="Ghee">Ghee</option>
              <option value="Other">Other</option>
            </select>
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
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Quantity</label>
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
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Rate</label>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Milk Volume</p>
            <p className="text-2xl font-black text-slate-800">{salesByProduct.Milk.reduce((sum, s) => sum + parseFloat(s.qty), 0).toFixed(2)} L</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="p-4 rounded-xl bg-amber-50 text-amber-600">
            <Icon name="package" size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Feed Sales</p>
            <p className="text-2xl font-black text-slate-800">{salesByProduct.Feed.reduce((sum, s) => sum + parseFloat(s.qty), 0).toFixed(2)} Bags</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="p-4 rounded-xl bg-rose-50 text-rose-600">
            <Icon name="coffee" size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Ghee Sales</p>
            <p className="text-2xl font-black text-slate-800">{salesByProduct.Ghee.reduce((sum, s) => sum + parseFloat(s.qty), 0).toFixed(2)} Kg</p>
          </div>
        </div>
      </div>
      <div className="space-y-8">
        {Object.entries(salesByProduct).map(([product, sales]) => {
          if (sales.length === 0) return null;
          return (
            <Card key={product} title={`${product} Sales`}>
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
                    {sales.slice(0, 10).map(sale =>
                      <tr key={sale.id}>
                        <td className="py-4 font-bold text-slate-500">{sale.date}</td>
                        <td className="py-4 font-black">{sale.buyer}</td>
                        <td className="py-4 font-black text-slate-700">{sale.qty} {sale.productType === 'Milk' ? 'L' : sale.productType === 'Feed' ? 'Bags' : sale.productType === 'Ghee' ? 'Kg' : 'Units'}</td>
                        <td className="py-4 font-black text-blue-600">{formatCurrency(parseFloat(sale.rate))}</td>
                        <td className="py-4 text-right font-black text-green-600">{formatCurrency(sale.amount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};