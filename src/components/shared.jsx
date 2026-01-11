// src/components/shared.jsx
import React, { useEffect } from 'react';

// Icon component
export const Icon = ({ name, size = 20, className = "" }) => {
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  return React.createElement('i', { 
    'data-lucide': name, 
    style: { width: size, height: size }, 
    className: className
  });
};

// Card component
export const Card = ({ title, children, extra, noPadding = false }) => (
  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
    {(title || extra) && (
      <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/30">
        {title && <h2 className="text-lg font-bold text-slate-800">{title}</h2>}
        {extra && <div>{extra}</div>}
      </div>
    )}
    <div className={noPadding ? '' : 'p-6'}>{children}</div>
  </div>
);

// Stat Card component
export const StatCard = ({ label, value, iconName, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
      <div className={`p-4 rounded-xl ${colors[color] || colors.blue}`}>
        <Icon name={iconName} size={24} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
};