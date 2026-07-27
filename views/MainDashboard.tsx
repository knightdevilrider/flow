
import React, { useState } from 'react';
import { UserRole, Patient, PatientStatus, Theme } from '../types';
import { mockFirestore } from '../services/mockFirestore';
import { motion, AnimatePresence } from 'motion/react';

interface MainDashboardProps {
  onRoleSelect: (role: UserRole, subView?: string) => void;
  patients: Patient[];
  theme: Theme;
  onThemeToggle: () => void;
  onSettings: () => void;
  isAdmin?: boolean;
}

const MainDashboard: React.FC<MainDashboardProps> = ({ onRoleSelect, patients, theme, onThemeToggle, onSettings, isAdmin }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const getCount = (status: PatientStatus | PatientStatus[]) => {
    if (Array.isArray(status)) {
      return patients.filter(p => status.includes(p.status)).length;
    }
    return patients.filter(p => p.status === status).length;
  };

  const FLOW_STAGES = [
    { label: 'Gate Entry', status: [PatientStatus.GATE_REGISTERED], dotColor: 'bg-blue-400', subView: 'reception' },
    { label: 'Reception', status: [PatientStatus.RECEPTION_WAITING, PatientStatus.PAYMENT_DONE], dotColor: 'bg-indigo-400', subView: 'reception' },
    { label: 'Check In', status: [PatientStatus.CHECKIN_WAITING], dotColor: 'bg-pink-400', subView: 'checkin' },
    { label: 'Doctor', status: [PatientStatus.DOCTOR_WAITING, PatientStatus.CONSULTATION_DONE], dotColor: 'bg-red-400', subView: 'doctor' },
    { label: 'Treatment', status: [PatientStatus.TREATMENT], dotColor: 'bg-yellow-400', subView: 'treatment' },
    { label: 'Pharmacy', status: [PatientStatus.MEDICINE_WAITING], dotColor: 'bg-orange-400', subView: 'medical' },
    { label: 'Ward', status: [PatientStatus.ADMISSION_DESK, PatientStatus.WARD_ADMITTED, PatientStatus.ICU_ADMITTED], dotColor: 'bg-purple-400', subView: 'ward' },
    { label: 'Complete', status: [PatientStatus.COMPLETED, PatientStatus.DISCHARGED], dotColor: 'bg-emerald-400', subView: 'ward' },
  ];

  const themeStyles = {
    light: {
      card: 'bg-white border-[#D2D2D7] shadow-sm',
      btn: 'bg-[#F5F5F7] hover:bg-[#E8E8ED] border-[#D2D2D7] text-[#1D1D1F]',
      accent: 'text-[#0071e3]',
      sub: 'text-[#86868b]',
      header: 'text-[#1D1D1F]',
      drawer: 'bg-white/95 backdrop-blur-xl border-r border-[#D2D2D7]',
      mobileBar: 'bg-white/80 border-b border-[#D2D2D7]'
    },
    dark: {
      card: 'bg-[#1D1D1F] border-[#333] shadow-2xl',
      btn: 'bg-[#2D2D2D] hover:bg-[#3D3D3D] border-[#444] text-white',
      accent: 'text-[#0A84FF]',
      sub: 'text-[#86868b]',
      header: 'text-white',
      drawer: 'bg-[#1D1D1F]/95 backdrop-blur-xl border-r border-[#333]',
      mobileBar: 'bg-black/80 border-b border-[#333]'
    },
    titanium: {
      card: 'bg-[#4D4D4D] border-[#5D5D5D] shadow-2xl',
      btn: 'bg-[#5D5D5D] hover:bg-[#6D6D6D] border-[#7D7D7D] text-[#E8E8ED]',
      accent: 'text-[#0A84FF]',
      sub: 'text-[#A1A1A6]',
      header: 'text-[#E8E8ED]',
      drawer: 'bg-[#4D4D4D]/95 backdrop-blur-xl border-r border-[#5D5D5D]',
      mobileBar: 'bg-[#3D3D3D]/80 border-b border-[#4D4D4D]'
    }
  };

  const s = themeStyles[theme];

  const FlowStage = ({ stage, idx, isVertical = false }: { stage: typeof FLOW_STAGES[0], idx: number, isVertical?: boolean }) => {
    const isComplete = stage.label === 'Complete';
    
    return (
      <button 
        onClick={() => !isComplete && onRoleSelect(UserRole.PUBLIC, stage.subView)}
        disabled={isComplete}
        className={`flex ${isVertical ? 'flex-row items-center w-full gap-4 p-4' : 'flex-col items-center gap-4'} group min-w-0 transition-all ${isComplete ? 'cursor-default opacity-80' : 'active:scale-95'}`}
      >
        <div className={`
          ${isVertical ? 'w-16 h-16 rounded-2xl' : 'w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-[2rem] lg:rounded-[2.5rem]'} 
          flex flex-col items-center justify-center transition-all duration-300 bg-[#1A1A1A] border border-white/10 ${!isComplete && 'group-hover:border-white/30 group-hover:bg-[#252525]'} relative shadow-2xl shrink min-w-0
        `}>
          <span className={`
            ${isVertical ? 'text-lg' : 'text-2xl md:text-3xl lg:text-5xl'} 
            font-black text-white transition-all duration-300 ${!isComplete && 'group-hover:scale-110'}
          `}>{getCount(stage.status)}</span>
        </div>
        
        {!isVertical && (
          <div className="flex flex-col items-center gap-2">
            <span className={`text-[8px] lg:text-[10px] font-black uppercase tracking-[0.1em] text-white/40 ${!isComplete && 'group-hover:text-white/80'} transition-colors text-center leading-tight whitespace-nowrap`}>
              {stage.label}
            </span>
            <div className={`w-1.5 h-1.5 rounded-full ${stage.dotColor} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}></div>
          </div>
        )}

        {isVertical && (
          <div className="flex-1 flex flex-col min-w-0 text-left">
            <span className={`text-[10px] font-black uppercase tracking-widest text-white/80`}>{stage.label}</span>
            <div className="flex items-center gap-2 mt-1">
               <div className={`w-2 h-2 rounded-full ${stage.dotColor}`}></div>
               <span className={`text-[8px] font-bold uppercase tracking-widest text-white/40`}>Live Data</span>
            </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-20 pt-2 flex flex-col items-center relative">
      {/* Mobile Top Bar */}
      <div className={`sm:hidden absolute top-0 left-0 right-0 z-[60] h-16 flex items-center justify-between px-6 backdrop-blur-md shadow-lg ${s.mobileBar}`}>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 border ${s.btn}`}
        >
          <div className="flex flex-col gap-1">
            <div className={`w-4 h-0.5 rounded-full ${theme === 'light' ? 'bg-black' : 'bg-white'}`}></div>
            <div className={`w-5 h-0.5 rounded-full ${theme === 'light' ? 'bg-black' : 'bg-white'}`}></div>
            <div className={`w-3 h-0.5 rounded-full ${theme === 'light' ? 'bg-black' : 'bg-white'}`}></div>
          </div>
        </button>
        
      </div>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] sm:hidden"
            />
            <motion.div 
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.05}
              onDragEnd={(_, info) => {
                if (info.offset.x < -50 || info.velocity.x < -500) {
                  setIsDrawerOpen(false);
                }
              }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 left-0 bottom-0 w-[280px] z-[80] sm:hidden shadow-2xl flex flex-col cursor-grab active:cursor-grabbing ${s.drawer}`}
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between gap-4">
                <div>
                  <h3 className={`text-xl font-black tracking-tighter uppercase ${s.accent}`}>Live Status</h3>
                  <p className={`text-[9px] font-black uppercase tracking-widest mt-1 opacity-50 ${s.sub}`}>Operational Telemetry</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => { onThemeToggle(); setIsDrawerOpen(false); }}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all active:scale-95 shadow-md ${s.btn}`}
                  >
                    {theme === 'light' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M17.66 6.34l1.42-1.42"/></svg>
                    )}
                  </button>
                  <button 
                    onClick={() => { onSettings(); setIsDrawerOpen(false); }}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all active:scale-95 shadow-md ${s.btn}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.72V20a2 2 0 002 2h.44a2 2 0 002-2v-.17a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 apple-scroll">
                {FLOW_STAGES.map((stage, idx) => (
                  <div key={`vertical-${stage.status}-${idx}`}>
                    <FlowStage stage={stage} idx={idx} isVertical />
                  </div>
                ))}
              </div>
              <div className="p-8 border-t border-white/5">
                <p className={`text-[8px] font-black uppercase tracking-[0.3em] opacity-30 ${s.sub}`}>
                  Authorized Access Only
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dashboard Controls */}
      <div className={`absolute top-4 left-0 right-0 px-4 sm:px-6 md:px-8 hidden sm:flex justify-between items-center z-50 pointer-events-none ${isDrawerOpen ? 'hidden' : ''}`}>
        <button 
          onClick={onSettings}
          className={`p-2.5 sm:p-3 rounded-full transition-all pointer-events-auto shadow-lg backdrop-blur-md mt-14 sm:mt-0 ${s.btn}`}
          title="System Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
            <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.72V20a2 2 0 002 2h.44a2 2 0 002-2v-.17a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>

        <button 
          onClick={onThemeToggle}
          className={`p-2.5 sm:p-3 rounded-full transition-all pointer-events-auto shadow-lg backdrop-blur-md mt-14 sm:mt-0 ${s.btn}`}
          title="Change Appearance"
        >
          {theme === 'light' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 sm:w-6 sm:h-6"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 sm:w-6 sm:h-6"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M17.66 6.34l1.42-1.42"/></svg>
          )}
        </button>
      </div>

      <header className="text-center mb-10 mt-20 sm:mt-24 w-full max-w-4xl flex-shrink-0 px-4">
        <h1 className={`text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-2 transition-all ${s.header}`}>
          Clinic Flow <span className={s.accent}>Pro</span>
        </h1>
        <p className={`hidden sm:block text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] sm:tracking-[0.6em] transition-all ${s.sub}`}>
          Intelligent EMR Logistics & Throughput Engine
        </p>
      </header>

      {/* Visual Flow Diagram - HERO Pipeline Refactored for Absolute Fit */}
      <div className="hidden sm:block w-full mb-10 py-10 bg-[#000]/60 rounded-[4rem] border border-white/5 shadow-2xl shrink-0 overflow-x-hidden max-w-[100vw]">
        <div className="flex flex-nowrap justify-center items-center gap-x-2 md:gap-x-4 lg:gap-x-6 px-4 md:px-10 relative mx-auto max-w-full">
          {FLOW_STAGES.map((stage, idx) => (
            <React.Fragment key={`${stage.status}-${idx}`}>
              <FlowStage stage={stage} idx={idx} />
              {idx < FLOW_STAGES.length - 1 && (
                <div className="w-4 md:w-8 lg:w-16 h-[2px] rounded-full shrink bg-white/10 mt-[-40px] md:mt-[-55px] lg:mt-[-65px]"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full mb-10 flex-grow px-2">
        <div className={`p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] border transition-all duration-500 flex flex-col shadow-2xl ${s.card}`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <h3 className={`text-lg md:text-xl font-black tracking-tight uppercase ${s.accent}`}>Staff Portals</h3>
              <span className={`text-[10px] font-black uppercase tracking-widest ${s.sub}`}>Internal Operations</span>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${s.btn}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
            </div>
          </div>
          <div className="space-y-3 pr-2 apple-scroll">
            {[
              { role: UserRole.GATE, label: 'Gate Security' },
              { role: UserRole.RECEPTION, label: 'Admission Desk' },
              { role: UserRole.CHECKIN, label: 'Check In' },
              { role: UserRole.DOCTOR, label: 'Doctor Portal' },
              { role: UserRole.MEDICAL, label: 'Treatment Station' },
              { role: UserRole.PHARMACY, label: 'Pharmacy & Billing' },
              { role: UserRole.WARD_CARE, label: 'Ward Management' },
              { role: UserRole.BILLING, label: 'Discharge Desk' },
              { role: UserRole.VISITOR_MGMT, label: 'Visitor Control' },
              ...(isAdmin ? [{ role: UserRole.ADMIN, label: 'Admin Console' }] : []),
            ].map((btn) => (
              <button 
                key={btn.role}
                onClick={() => onRoleSelect(btn.role)} 
                className={`w-full py-4 px-6 rounded-2xl text-left font-black transition-all flex justify-between items-center border shadow-md hover:shadow-lg hover:-translate-y-0.5 ${s.btn}`}
              >
                <span className="text-xs sm:text-sm uppercase tracking-widest">{btn.label}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        </div>

        <div className={`p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] border transition-all duration-500 flex flex-col shadow-2xl ${s.card}`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <h3 className={`text-lg md:text-xl font-black tracking-tight uppercase ${s.accent}`}>Public Boards</h3>
              <span className={`text-[10px] font-black uppercase tracking-widest ${s.sub}`}>Real-time Displays</span>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${s.btn}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
          </div>
          <div className="space-y-3 pr-2 apple-scroll">
            {[
              { id: 'reception', label: 'Reception List' },
              { id: 'checkin', label: 'Check In Status' },
              { id: 'doctor', label: 'Consultations' },
              { id: 'treatment', label: 'Treatment Board' },
              { id: 'medical', label: 'Pharmacy Board' },
              { id: 'ward', label: 'Ward Occupancy' },
            ].map((btn) => (
              <button 
                key={btn.id}
                onClick={() => onRoleSelect(UserRole.PUBLIC, btn.id)} 
                className={`w-full py-4 px-6 rounded-2xl text-left font-black transition-all flex justify-between items-center border shadow-md hover:shadow-lg hover:-translate-y-0.5 ${s.btn}`}
              >
                <span className="text-xs sm:text-sm uppercase tracking-widest">{btn.label}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        </div>

        <div className={`p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] border transition-all duration-500 flex flex-col items-center text-center justify-between shadow-2xl sm:col-span-2 lg:col-span-1 ${s.card}`}>
          <div className="w-full">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border shadow-xl ${s.btn}`}>
               <span className="text-3xl">📊</span>
            </div>
            <h3 className={`text-xl font-black mb-1 uppercase tracking-tighter ${s.accent}`}>Clinical Analytics</h3>
            <p className={`text-[10px] mb-8 font-black tracking-[0.3em] uppercase ${s.sub}`}>Intelligent Throughput</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 w-full px-2">
              <div className={`p-6 rounded-[2rem] border transition-all shadow-lg ${s.btn}`}>
                <div className="text-4xl sm:text-5xl font-black mb-2 tracking-tighter">{patients.length}</div>
                <div className={`text-[10px] uppercase tracking-[0.2em] font-black ${s.sub}`}>Total Patient Flow</div>
              </div>
              <div className={`p-6 rounded-[2rem] border transition-all shadow-lg ${s.btn}`}>
                <div className="text-4xl sm:text-5xl font-black mb-2 tracking-tighter">
                  {patients.filter(p => p.status === PatientStatus.COMPLETED || p.status === PatientStatus.DISCHARGED).length}
                </div>
                <div className={`text-[10px] uppercase tracking-[0.2em] font-black ${s.sub}`}>Total Outflows</div>
              </div>
            </div>
          </div>
          
          <div className={`mt-8 text-[9px] font-black tracking-[0.4em] uppercase ${s.sub} opacity-50`}>
            Verified System Integrity
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
