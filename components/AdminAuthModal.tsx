import React, { useState } from 'react';
import { Theme } from '../types';

interface AdminAuthModalProps {
  theme: Theme;
  onSuccess: () => void;
  onClose: () => void;
}

const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ theme, onSuccess, onClose }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') { // Default Demo PIN
      onSuccess();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1000);
    }
  };

  const themeStyles = {
    light: {
      bg: 'bg-white/80',
      card: 'bg-white border-[#D2D2D7]',
      text: 'text-[#1D1D1F]',
      sub: 'text-[#86868b]',
      input: 'bg-[#F5F5F7] border-[#D2D2D7]',
      btn: 'bg-[#0071e3] text-white'
    },
    dark: {
      bg: 'bg-black/80',
      card: 'bg-[#1D1D1F] border-[#2D2D2D]',
      text: 'text-white',
      sub: 'text-[#86868b]',
      input: 'bg-black border-[#2D2D2D]',
      btn: 'bg-[#0A84FF] text-white'
    },
    titanium: {
      bg: 'bg-black/80',
      card: 'bg-[#4D4D4D] border-[#5D5D5D]',
      text: 'text-[#E8E8ED]',
      sub: 'text-[#A1A1A6]',
      input: 'bg-[#3D3D3D] border-[#5D5D5D]',
      btn: 'bg-[#0A84FF] text-white'
    }
  };

  const s = themeStyles[theme];

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl ${s.bg}`}>
      <div className={`w-full max-w-sm rounded-[2.5rem] border p-5 sm:p-8 shadow-2xl transition-all ${s.card} ${error ? 'animate-shake' : ''}`}>
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#0A84FF]/10 flex items-center justify-center text-3xl mb-4">🔐</div>
          <h2 className={`text-2xl font-black tracking-tight ${s.text}`}>Admin Access</h2>
          <p className={`text-sm font-medium mt-1 ${s.sub}`}>Enter Master PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="password"
            maxLength={4}
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className={`w-full text-center text-4xl tracking-[1em] font-black py-4 rounded-2xl border outline-none transition-all ${s.input} focus:border-[#0A84FF]`}
            placeholder="••••"
          />
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-4 rounded-2xl font-bold transition-all border ${s.text} border-current opacity-50 hover:opacity-100`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 py-4 rounded-2xl font-bold transition-all shadow-lg ${s.btn}`}
            >
              Authorize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAuthModal;
