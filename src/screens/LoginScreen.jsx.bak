// src/screens/LoginScreen.jsx
import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/constants';
import { Icon, Card, StatCard } from '../components/shared';

export const LoginScreen = ({ state, setState, notify, navigate }) => {
  const [formData, setFormData] = useState({ mobile: '', password: '' });
  
  const handleLogin = (e) => {
    e.preventDefault();
    const saved = JSON.parse(localStorage.getItem('dairy_mgmt_state_v1'));
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