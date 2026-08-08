
import React, { useState } from 'react';

import { Theme } from '../types';

interface LayoutProps {
  title: string;
  subtitle?: string;
  statusNode?: React.ReactNode;
  onBack?: () => void;
  onSettings?: () => void;
  onRefresh?: () => void;
  children: React.ReactNode;
  theme: Theme;
  onThemeToggle: () => void;
  user?: any;
  onLogout?: () => void;
  currentView?: string;
  isAdminMode?: boolean;
  onToggleAdmin?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  title, subtitle, statusNode, onBack, onSettings, onRefresh, children, theme, onThemeToggle, user, onLogout, currentView, isAdminMode, onToggleAdmin 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const themeStyles = {
    light: {
      header: 'bg-white/80 border-[#D2D2D7]',
      btn: 'bg-[#E8E8ED] hover:bg-[#D2D2D7] border-transparent text-[#1D1D1F]',
      text: 'text-[#1D1D1F]',
      sub: 'text-[#86868b]',
      adminActive: 'bg-red-500 text-white hover:bg-red-600',
      adminInactive: 'bg-slate-200 text-slate-500 hover:bg-slate-300'
    },
    dark: {
      header: 'bg-black/80 border-[#1D1D1F]',
      btn: 'bg-[#1D1D1F] hover:bg-[#2D2D2D] border-transparent text-white',
      text: 'text-white',
      sub: 'text-[#86868b]',
      adminActive: 'bg-red-600 text-white hover:bg-red-700',
      adminInactive: 'bg-white/5 text-white/40 hover:bg-white/10'
    },
    titanium: {
      header: 'bg-[#3D3D3D]/80 border-[#4D4D4D]',
      btn: 'bg-[#4D4D4D] hover:bg-[#5D5D5D] border-transparent text-[#E8E8ED]',
      text: 'text-[#E8E8ED]',
      sub: 'text-[#A1A1A6]',
      adminActive: 'bg-red-600 text-white hover:bg-red-700',
      adminInactive: 'bg-white/5 text-white/40 hover:bg-white/10'
    }
  };

  const s = themeStyles[theme];

  return (
    <div className="min-h-screen flex flex-col">
      {currentView !== 'public' && (
        <header className={`apple-glass z-10 px-4 py-2 border-b h-[70px] shrink-0 flex items-center transition-all ${s.header}`}>
          <div className="w-full flex justify-between items-center">
            {/* Left */}
            <div className="flex items-center gap-2 w-[280px]">
              {onSettings && (
                <button 
                  onClick={onSettings}
                  className={`p-2.5 rounded-full transition-all flex items-center justify-center ${s.btn}`}
                  title="System Settings"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.72V20a2 2 0 002 2h.44a2 2 0 002-2v-.17a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              )}
              {onBack && (
                <button 
                  onClick={onBack}
                  className={`px-4 py-2 text-[11px] font-bold rounded-full transition-all flex items-center gap-2 ${s.btn}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  Dashboard
                </button>
              )}
              {onToggleAdmin && (
                <button 
                  onClick={onToggleAdmin}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isAdminMode ? s.adminActive : s.adminInactive}`}
                >
                  {isAdminMode ? '🔓 Admin Mode' : '🔒 Admin Mode'}
                </button>
              )}
            </div>

            {/* Center */}
            <div className="flex flex-col items-center text-center">
              <div className={`hidden sm:block text-[9px] font-black uppercase tracking-[0.3em] mb-0.5 ${s.text}`}>
                <span className="opacity-40">Hospital</span><span className={s.accent}>Flow</span>
              </div>
              <h1 className={`text-lg font-bold tracking-tight transition-all ${s.text}`}>
                {title}
              </h1>
              {subtitle && (
                <p className={`hidden sm:block text-[9px] font-bold uppercase tracking-widest mt-0.5 ${s.sub}`}>
                  {subtitle}
                </p>
              )}
            </div>

            {/* Right */}
            <div className="flex items-center justify-end gap-3 w-[280px]">
              {statusNode}
              {user && (
                <div className="flex items-center gap-3 pr-2 border-r border-white/10 mr-1">
                  <div className="text-right hidden sm:block">
                    <p className={`text-[10px] font-black uppercase tracking-tighter ${s.text}`}>{user.displayName}</p>
                    <button onClick={onLogout} className="text-[8px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors">Sign Out</button>
                  </div>
                  {user.photoURL && (
                    <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-white/10" referrerPolicy="no-referrer" />
                  )}
                </div>
              )}
              <button
                onClick={onThemeToggle}
                className={`p-2.5 rounded-full transition-all ${s.btn}`}
                title="Change Appearance"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 21a9 9 0 100-18 9 9 0 000 18z"/><path d="M12 3a9 9 0 000 18V3z"/>
                </svg>
              </button>
              <button
                onClick={handleRefresh}
                className={`p-2.5 rounded-full transition-all ${s.btn} ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1">
        <div>
          {children}
        </div>
      </main>

      {currentView !== 'public' && (
        <footer className={`h-[40px] shrink-0 flex items-center justify-center text-[9px] font-bold uppercase tracking-[0.2em] border-t transition-all ${theme === 'light' ? 'bg-[#F5F5F7] border-[#D2D2D7] text-[#86868b]' : 'bg-black border-[#1D1D1F] text-[#424245]'}`}>
          &copy; 2024 EMR Legal Governance Engine • Designed for Clinical Precision
        </footer>
      )}
    </div>
  );
};

export default Layout;
