// src/screens/DashboardScreen.jsx
import React from 'react';
import { formatCurrency, formatDate } from '../utils/constants';
import { Icon, Card, StatCard } from '../components/shared';

export const DashboardScreen = ({ state, navigate }) => {
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
              <th className="pb-4">Date</th>
              <th className="pb-4">Shift</th>
              <th className="pb-4">Type</th>
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