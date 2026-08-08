import React from 'react';
import { useIntercom } from '../src/contexts/IntercomContext';
import { AlertTriangle, Info, BellRing, XCircle } from 'lucide-react';

export const IntercomOverlay: React.FC = () => {
  const { alerts, dismissAlert } = useIntercom();

  if (alerts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col items-center justify-start pt-20 px-4 space-y-4">
      {alerts.map(alert => {
        
        let bgStyle = '';
        let icon = null;
        let borderStyle = '';
        
        switch (alert.severity) {
          case 'critical':
            bgStyle = 'bg-red-600/90 text-white backdrop-blur-xl shadow-[0_0_50px_rgba(220,38,38,0.5)]';
            borderStyle = 'border border-red-400';
            icon = <AlertTriangle className="w-10 h-10 animate-pulse" />;
            break;
          case 'warning':
            bgStyle = 'bg-amber-500/90 text-white backdrop-blur-xl shadow-[0_0_50px_rgba(245,158,11,0.5)]';
            borderStyle = 'border border-amber-300';
            icon = <BellRing className="w-10 h-10 animate-bounce" />;
            break;
          case 'info':
          default:
            bgStyle = 'bg-[#0A84FF]/90 text-white backdrop-blur-xl shadow-[0_0_50px_rgba(10,132,255,0.5)]';
            borderStyle = 'border border-blue-400';
            icon = <Info className="w-10 h-10" />;
            break;
        }

        return (
          <div 
            key={alert.id}
            className={`w-full max-w-2xl rounded-3xl p-6 flex items-start gap-6 pointer-events-auto animate-in slide-in-from-top-10 fade-in duration-500 ${bgStyle} ${borderStyle}`}
          >
            <div className="shrink-0 mt-1">
              {icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">
                Incoming Intercom from {alert.sender}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {alert.message}
              </h2>
              
              <div className="mt-6 flex gap-4">
                <button 
                  onClick={() => dismissAlert(alert.id)}
                  className="px-8 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Acknowledge & Dismiss
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
