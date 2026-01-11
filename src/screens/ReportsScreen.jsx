// src/screens/ReportsScreen.jsx
import React, { useMemo } from 'react';
import { formatCurrency, formatDate } from '../utils/constants';
import { Icon, Card, StatCard } from '../components/shared';

export const ReportsScreen = ({ state }) => {
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