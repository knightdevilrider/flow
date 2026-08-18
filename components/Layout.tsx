
import React, { useState } from 'react';
import { Theme } from '../types';
import { getPremiumStyles } from '../theme/premiumDesign';

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

  const s = getPremiumStyles(theme);

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors ${s.bg}`}>
      {/* Global Ambient Background Orbs */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none ${s.orb1}`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none ${s.orb2}`}></div>

      {currentView !== 'public' && (
        <header className={`z-10 px-2 py-1.5 sm:px-4 sm:py-2 h-[70px] shrink-0 flex items-center transition-all ${s.mobileBar} max-sm:h-[60px] relative`}>
          <div className="w-full flex justify-between items-center px-2">
            {/* Left */}
            <div className="flex items-center gap-2 flex-1 sm:w-[280px] sm:flex-none">
              {onSettings && (
                <button 
                  onClick={onSettings}
                  className={`p-2.5 rounded-full transition-all flex items-center justify-center shadow-lg ${s.btn}`}
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
                  className={`px-3 py-2 sm:px-4 sm:py-2 text-[11px] font-bold rounded-full transition-all flex items-center gap-2 shadow-lg ${s.btn}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  <span className="hidden sm:inline tracking-widest uppercase">Dashboard</span>
                </button>
              )}

            </div>

            {/* Center */}
            <div className="flex flex-col items-center text-center">
              <h1 className={`text-base sm:text-lg font-black tracking-tight uppercase transition-all ${s.header}`}>
                {title}
              </h1>
            </div>

            {/* Right */}
            <div className="flex items-center justify-end gap-2 flex-1 sm:w-[280px] sm:flex-none">
              {statusNode}
              <button
                onClick={onThemeToggle}
                className={`p-2.5 rounded-full transition-all shadow-lg ${s.btn}`}
                title="Change Appearance"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 21a9 9 0 100-18 9 9 0 000 18z"/><path d="M12 3a9 9 0 000 18V3z"/>
                </svg>
              </button>
              <button
                onClick={handleRefresh}
                className={`p-2.5 rounded-full transition-all shadow-lg ${s.btn} ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`flex-1 flex flex-col transition-all duration-300 relative z-10 w-full max-w-[1600px] mx-auto`}>
        <div className={`flex-1 w-full max-w-full p-2 sm:p-4 md:p-8 flex flex-col`}>
          {children}
        </div>
      </main>

      {currentView !== 'public' && (
        <footer className={`hidden sm:flex h-[40px] shrink-0 items-center justify-center text-[9px] font-bold uppercase tracking-[0.2em] transition-all relative z-10 ${s.cardHeader} ${s.sub}`}>
          &copy; 2024 EMR Legal Governance Engine • Designed for Clinical Precision
        </footer>
      )}
    </div>
  );
};

export default Layout;
