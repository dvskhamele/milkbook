// src/screens/SettingsScreen.jsx
import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/constants';
import { Icon, Card, StatCard } from '../components/shared';

export const SettingsScreen = ({ state, setState, notify }) => {
  const [rates, setRates] = useState(state.rates);
  const [pricingPlan, setPricingPlan] = useState('annual'); // 'annual' or 'lifetime'

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
                  step="0.01" 
                  className="w-full p-4 border rounded-xl font-black text-blue-600" 
                  value={rates.cow.base} 
                  onChange={e => setRates({...rates, cow: {...rates.cow, base: e.target.value}})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Ref Fat</label>
                <input 
                  type="number" 
                  step="0.01" 
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
                  step="0.01" 
                  className="w-full p-4 border rounded-xl font-black text-blue-600" 
                  value={rates.buffalo.base} 
                  onChange={e => setRates({...rates, buffalo: {...rates.buffalo, base: e.target.value}})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Ref Fat</label>
                <input 
                  type="number" 
                  step="0.01" 
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
      
      <Card title="Hardware Integration">
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
            <p className="font-black text-blue-800 mb-2 flex items-center gap-2">
              <Icon name="cpu" size={18} />
              Machine Data Import
            </p>
            <p className="text-sm text-blue-700 font-medium mb-4">
              Supports data import from compatible analyzers where hardware and drivers permit
            </p>
            <button
              onClick={() => alert("Contact support to verify compatibility with your specific analyzer model. Hardware integration success depends on device compatibility, driver support, and browser capabilities.")}
              className="w-full py-4 bg-slate-200 text-slate-700 rounded-xl font-black flex items-center justify-center gap-2 cursor-default"
            >
              <Icon name="zap" size={20} />
              Check Compatibility
            </button>
            <p className="text-xs text-slate-500 mt-3">
              Supports machine data import where hardware and drivers permit
            </p>
          </div>
          
          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
            <p className="font-black text-amber-800 mb-2 flex items-center gap-2">
              <Icon name="monitor" size={18} />
              PC-First Operation, Mobile-Supportive
            </p>
            <ul className="text-sm space-y-1 text-amber-700 font-medium">
              <li>• Designed for PC operation during collection hours</li>
              <li>• Mobile-friendly for administrative tasks</li>
              <li>• Thermal printer integration for receipts</li>
              <li>• Keyboard-centric workflow for speed</li>
              <li className="font-black text-amber-800">Optimized for village internet conditions</li>
              <li className="font-bold text-amber-900">Reliable performance during rush hours</li>
            </ul>
          </div>
        </div>
      </Card>
      
      <Card title="Subscription Plans">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`bg-white border-2 rounded-2xl p-6 ${pricingPlan === 'lifetime' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'}`}>
            <div className="text-center">
              <p className="font-black text-slate-800 text-xl uppercase tracking-tighter">LIFETIME LICENSE</p>
              <p className="text-3xl font-black text-slate-800 mt-2">₹7,999</p>
              <p className="text-sm text-slate-500 font-medium">One-time payment</p>
              <ul className="mt-6 space-y-3 text-left">
                <li className="flex items-start gap-2">
                  <Icon name="check-circle" size={18} className="text-green-600" />
                  <span>Manual entry, ledger, reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check-circle" size={18} className="text-green-600" />
                  <span>Local backup/export</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check-circle" size={18} className="text-green-600" />
                  <span>Offline forever</span>
                </li>
                <li className="flex items-start gap-2 text-slate-400">
                  <Icon name="x-circle" size={18} />
                  <span>No machine integration</span>
                </li>
                <li className="flex items-start gap-2 text-slate-400">
                  <Icon name="x-circle" size={18} />
                  <span>No cloud backup</span>
                </li>
              </ul>
              <button
                onClick={() => setPricingPlan('lifetime')}
                className="w-full mt-6 py-4 bg-slate-100 text-slate-700 rounded-xl font-black"
              >SELECT PLAN</button>
            </div>
          </div>

          <div className={`bg-white border-2 rounded-2xl p-6 ${pricingPlan === 'annual' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'}`}>
            <div className="text-center">
              <p className="font-black text-slate-800 text-xl uppercase tracking-tighter">ANNUAL PRO</p>
              <p className="text-3xl font-black text-slate-800 mt-2">₹2,499</p>
              <p className="text-sm text-slate-500 font-medium">Per year</p>
              <ul className="mt-6 space-y-3 text-left">
                <li className="flex items-start gap-2">
                  <Icon name="check-circle" size={18} className="text-green-600" />
                  <span>All Lifetime features</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check-circle" size={18} className="text-green-600" />
                  <span>Machine integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check-circle" size={18} className="text-green-600" />
                  <span>WhatsApp receipts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check-circle" size={18} className="text-green-600" />
                  <span>Cloud backup</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check-circle" size={18} className="text-green-600" />
                  <span>Priority support</span>
                </li>
              </ul>
              <button
                onClick={() => setPricingPlan('annual')}
                className="w-full mt-6 py-4 bg-slate-100 text-slate-700 rounded-xl font-black"
              >SELECT PLAN</button>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
            <div className="text-center">
              <p className="font-black text-slate-800 text-xl uppercase tracking-tighter">TECHNICIAN PARTNER</p>
              <p className="text-3xl font-black text-slate-800 mt-2">₹500</p>
              <p className="text-sm text-slate-500 font-medium">Per successful referral</p>
              <ul className="mt-6 space-y-3 text-left">
                <li className="flex items-start gap-2">
                  <Icon name="user-check" size={18} className="text-green-600" />
                  <span>Authorized partner program</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="smartphone" size={18} className="text-green-600" />
                  <span>Install during service visits</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="rupee" size={18} className="text-green-600" />
                  <span>Earn ₹500 per successful conversion</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="shield-check" size={18} className="text-green-600" />
                  <span>Trusted by dairy owners</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="trending-up" size={18} className="text-green-600" />
                  <span>Turn service calls into sales</span>
                </li>
              </ul>
              <button
                onClick={() => {
                  const message = "Become a MilkBook authorized partner and earn ₹500 per successful referral. Contact us for partnership details.";
                  const encodedMessage = encodeURIComponent(message);
                  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
                }}
                className="w-full mt-6 py-4 bg-green-600 text-white rounded-xl font-black"
              >REFER NOW</button>
            </div>
          </div>
        </div>
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