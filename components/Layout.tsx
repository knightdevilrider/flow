
import React, { useState } from 'react';

interface LayoutProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onRefresh?: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ title, subtitle, onBack, onRefresh, children }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <header className="glass sticky top-0 z-50 px-6 py-4 border-b border-slate-700/50 h-[100px] flex items-center">
        <div className="w-full grid grid-cols-3 items-center">
          {/* Left: Back Button */}
          <div className="flex items-center">
            {onBack && (
              <button 
                onClick={onBack}
                className="px-4 py-2 text-xs font-bold bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all flex items-center gap-2 text-slate-300"
              >
                <span className="text-base leading-none">←</span> Dashboard
              </button>
            )}
          </div>

          {/* Center: Title & Count Subtitle */}
          <div className="flex flex-col items-center text-center">
            {title && (
              <h1 className="text-xl md:text-3xl font-black text-white tracking-tight uppercase leading-none mb-2">
                {title}
              </h1>
            )}
            {subtitle && (
              <div className="px-6 py-1.5 border-2 border-indigo-500/40 bg-indigo-500/5 rounded-lg">
                <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.25em]">
                  {subtitle}
                </p>
              </div>
            )}
          </div>

          {/* Right: Status & Sync */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleRefresh}
              className={`p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
              title="Manual Sync"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Live Sync</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-hidden">
        {children}
      </main>
      
      <footer className="h-[40px] flex items-center justify-center text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] border-t border-slate-800/50">
        &copy; 2024 Hospital Patient Flow Solutions • Syncing via Supabase
      </footer>
    </div>
  );
};

export default Layout;
