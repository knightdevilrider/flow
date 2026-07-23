
import React, { useState } from 'react';
import { Patient, PatientStatus, PatientCategory, Theme } from '../types';
import { mockFirestore } from '../services/mockFirestore';

interface StaffVisitorMgmtProps {
  patients: Patient[];
  theme: Theme;
  isAdmin?: boolean;
  onEditPatient?: (p: Patient) => void;
  onDeletePatient?: (p: Patient) => void;
}

const StaffVisitorMgmt: React.FC<StaffVisitorMgmtProps> = ({ patients, theme, isAdmin, onEditPatient, onDeletePatient }) => {
  const [selectedVisitor, setSelectedVisitor] = useState<Patient | null>(null);

  const themeStyles = {
    light: {
      card: 'bg-white border-[#D2D2D7] shadow-sm',
      btn: 'bg-[#F5F5F7] hover:bg-[#E8E8ED] border-[#D2D2D7] text-[#1D1D1F]',
      accent: 'text-[#0071e3]',
      sub: 'text-[#86868b]',
      header: 'text-[#1D1D1F]',
      input: 'bg-white border-[#D2D2D7] text-[#1D1D1F]',
      badge: 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20',
      success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    dark: {
      card: 'bg-[#1D1D1F] border-[#333] shadow-2xl',
      btn: 'bg-[#2D2D2D] hover:bg-[#3D3D3D] border-[#444] text-white',
      accent: 'text-[#0A84FF]',
      sub: 'text-[#86868b]',
      header: 'text-white',
      input: 'bg-[#2D2D2D] border-[#444] text-white',
      badge: 'bg-[#0A84FF]/10 text-[#0A84FF] border-[#0A84FF]/20',
      success: 'bg-emerald-900/10 text-emerald-400 border-emerald-900/20',
    },
    titanium: {
      card: 'bg-[#4D4D4D] border-[#5D5D5D] shadow-2xl',
      btn: 'bg-[#5D5D5D] hover:bg-[#6D6D6D] border-[#7D7D7D] text-[#E8E8ED]',
      accent: 'text-[#0A84FF]',
      sub: 'text-[#A1A1A6]',
      header: 'text-[#E8E8ED]',
      input: 'bg-[#5D5D5D] border-[#7D7D7D] text-[#E8E8ED]',
      badge: 'bg-[#0A84FF]/10 text-[#0A84FF] border-[#0A84FF]/20',
      success: 'bg-emerald-900/10 text-emerald-400 border-emerald-900/20',
    }
  };

  const s = themeStyles[theme];

  const activeVisitors = patients.filter(p => 
    p.category === PatientCategory.VISITOR && 
    p.status !== PatientStatus.COMPLETED
  ).sort((a, b) => b.timestamp - a.timestamp);

  const getTargetPatient = (targetId?: string) => {
    return patients.find(p => p.id === targetId);
  };

  const handleDeactivatePass = (id: string) => {
    mockFirestore.updatePatient(id, { status: PatientStatus.COMPLETED });
    setSelectedVisitor(null);
  };

  const handleScanTurnstile = (pId: string) => {
    const activeBesidePatient = activeVisitors.filter(v => v.targetPatientId === pId);
    if (activeBesidePatient.length >= 1) {
      alert('🔴 PROTOCOL VIO: 1-In / 1-Out policy active.');
    } else {
      alert('🟢 ACCESS GRANTED');
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className={`p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border shadow-2xl relative overflow-hidden ${s.card}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div>
            <h3 className={`text-xl sm:text-3xl font-black uppercase tracking-tight ${s.header}`}>PERIMETER GATE SIMULATION</h3>
            <p className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] opacity-40 mt-2 ${s.sub}`}>Direct Hardware level turnstile logic</p>
          </div>
          <div className="flex items-center gap-4 bg-emerald-500/10 px-6 py-3 rounded-full border-2 border-emerald-500/20">
            <span className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></span>
            <span className={`text-[10px] font-black uppercase tracking-widest text-emerald-500`}>Turnstiles Online</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {patients.filter(p => [PatientStatus.WARD_ADMITTED, PatientStatus.ICU_ADMITTED].includes(p.status)).map(p => (
            <button 
              key={p.id}
              onClick={() => handleScanTurnstile(p.id)}
              className={`p-6 rounded-[2rem] border-2 transition-all text-center group active:scale-95 shadow-md hover:shadow-xl ${s.btn}`}
            >
              <p className={`text-[10px] font-black uppercase opacity-40 mb-2 truncate group-hover:opacity-100 transition-opacity ${s.sub}`}>{p.name}</p>
              <p className={`text-xs font-black tracking-tight leading-tight ${s.header}`}>SCAN VISITOR<br/>QR PASS</p>
            </button>
          ))}
          {patients.filter(p => [PatientStatus.WARD_ADMITTED, PatientStatus.ICU_ADMITTED].includes(p.status)).length === 0 && (
            <div className="col-span-full py-16 text-center space-y-4 opacity-20">
              <div className="text-6xl">🚧</div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${s.sub}`}>No clinical subjects available for simulation</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
        <div className="lg:col-span-2 space-y-6 pr-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${s.header}`}>ACTIVE VISITS ({activeVisitors.length})</h3>
            <span className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${s.sub}`}>Authority log</span>
          </div>
          
          {activeVisitors.map((visitor) => {
            const target = getTargetPatient(visitor.targetPatientId);
            return (
              <div 
                key={visitor.id}
                onClick={() => setSelectedVisitor(visitor)}
                className={`p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border-2 transition-all cursor-pointer group flex flex-col sm:flex-row items-center justify-between gap-8 shadow-lg hover:shadow-2xl ${s.card} ${selectedVisitor?.id === visitor.id ? 'ring-4 ring-[#0A84FF] scale-[1.02]' : 'hover:scale-[1.01] active:scale-95'}`}
              >
                <div className="flex items-center gap-8 w-full sm:w-auto">
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border-4 shadow-xl transition-transform group-hover:rotate-3 ${s.btn}`}>
                    {visitor.photo ? (
                      <img src={visitor.photo} alt={visitor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-4xl ${s.sub}`}>👤</div>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-xl sm:text-3xl font-black tracking-tight group-hover:${s.accent} transition-colors leading-none ${s.header}`}>{visitor.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${s.sub}`}>Visiting Authority:</span>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-tight shadow-md border-2 ${s.badge}`}>{target?.name || 'Inmate Unknown'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-center sm:text-right w-full sm:w-auto bg-[#F5F5F7] dark:bg-[#2D2D2D] p-5 sm:p-0 sm:bg-transparent rounded-[2rem]">
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-2 opacity-40 ${s.sub}`}>SESSION EXPIRY</div>
                  <div className={`text-lg sm:text-2xl font-black tracking-tighter ${s.header}`}>
                    {visitor.expiryTimestamp ? new Date(visitor.expiryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '59:59 REMAINING'}
                  </div>
                </div>
              </div>
            );
          })}

          {activeVisitors.length === 0 && (
            <div className={`text-center py-36 rounded-[3rem] border-4 border-dashed border-opacity-10 space-y-8 ${s.card}`}>
              <div className="text-9xl opacity-10 grayscale animate-pulse">📇</div>
              <p className={`font-black uppercase tracking-[0.4em] text-[10px] opacity-40 ${s.sub}`}>NO ACTIVE VISITOR SESSIONS Authority</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {selectedVisitor ? (
            <div className={`p-10 sm:p-12 rounded-[3.5rem] border shadow-2xl animate-in fade-in slide-in-from-right-10 ${s.card}`}>
              <div className="flex justify-between items-start mb-10">
                <h3 className={`text-2xl font-black tracking-tighter uppercase ${s.header}`}>SESSION OVERVIEW</h3>
                <button onClick={() => setSelectedVisitor(null)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-black/5 dark:hover:bg-white/5 ${s.sub}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className={`w-full aspect-square rounded-[3rem] sm:rounded-[4rem] overflow-hidden border-8 mb-10 relative shadow-2xl transition-transform hover:scale-[1.05] ${s.btn}`}>
                {selectedVisitor.photo ? (
                  <img src={selectedVisitor.photo} alt={selectedVisitor.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-[10rem] ${s.sub}`}>👤</div>
                )}
                <div className="absolute top-8 right-8 px-6 py-2 bg-[#0A84FF] text-white text-[10px] font-black rounded-full shadow-2xl shadow-[#0A84FF]/50 uppercase tracking-[0.3em]">
                  BIOMETRIC VERIFIED
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-12">
                <div className={`p-6 rounded-[2rem] border-2 shadow-inner group transition-all ${s.btn}`}>
                  <span className={`block text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-40 ${s.sub}`}>Government Credential</span>
                  <span className={`text-base sm:text-lg font-black tracking-tight ${s.header}`}>{selectedVisitor.idType}: {selectedVisitor.idNumber}</span>
                </div>
                <div className={`p-6 rounded-[2rem] border-2 shadow-inner group transition-all ${s.btn}`}>
                  <span className={`block text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-40 ${s.sub}`}>Clinical Inmate Contact</span>
                  <span className={`text-base sm:text-lg font-black tracking-tight ${s.accent}`}>{getTargetPatient(selectedVisitor.targetPatientId)?.name}</span>
                </div>
              </div>

              <button 
                onClick={() => handleDeactivatePass(selectedVisitor.id)}
                className={`w-full py-6 sm:py-8 rounded-[2rem] sm:rounded-[2.5rem] font-black transition-all uppercase tracking-[0.4em] text-xs sm:text-sm shadow-2xl active:scale-95 ${theme === 'light' ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/30' : 'bg-red-600 text-white hover:bg-red-500 shadow-red-600/30'}`}
              >
                END VISIT & EVACUATE
              </button>
            </div>
          ) : (
            <div className={`p-16 rounded-[4rem] border-4 border-dashed border-opacity-10 h-[32rem] flex flex-col items-center justify-center text-center space-y-10 ${s.card}`}>
              <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-pulse ${s.btn}`}>
                <span className="text-6xl grayscale">👥</span>
              </div>
              <div className="space-y-4 max-w-[15rem]">
                <h4 className={`text-[12px] font-black uppercase tracking-widest leading-relaxed ${s.sub}`}>Awaiting Session Selection</h4>
                <p className={`text-[10px] font-black uppercase tracking-widest leading-relaxed opacity-20 ${s.sub}`}>
                  Select a live visitor log entry to view high-priority session telemetry.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffVisitorMgmt;

