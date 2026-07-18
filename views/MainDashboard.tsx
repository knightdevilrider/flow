
import React from 'react';
import { UserRole, Patient, PatientStatus } from '../types';
import { FLOW_STAGES } from '../constants';
import { mockFirestore } from '../services/mockFirestore';

interface MainDashboardProps {
  onRoleSelect: (role: UserRole, subView?: string) => void;
  patients: Patient[];
}

const MainDashboard: React.FC<MainDashboardProps> = ({ onRoleSelect, patients }) => {
  const getCount = (status: PatientStatus) => patients.filter(p => p.status === status).length;

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex flex-col items-center overflow-x-hidden">
      <header className="text-center mb-12 mt-8 w-full max-w-4xl relative">
        <button 
          onClick={() => mockFirestore.seedDemoData()}
          className="absolute top-0 right-0 p-2 text-[10px] font-black text-slate-700 uppercase tracking-widest hover:text-blue-500 transition-colors"
        >
          Reset Demo Data
        </button>
        <div className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 p-[1px] rounded-3xl mb-6 shadow-[0_0_30px_rgba(79,70,229,0.15)]">
          <div className="bg-slate-950 rounded-3xl py-8 px-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
              VIRTUAL CLINIC FLOW
            </h1>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4">
          <span className="h-px w-8 md:w-12 bg-slate-800"></span>
          <p className="text-slate-500 font-bold tracking-[0.25em] uppercase text-[10px] md:text-xs">Capacity: 1000+ Records/Day</p>
          <span className="h-px w-8 md:w-12 bg-slate-800"></span>
        </div>
      </header>

      {/* Sync Diagnostic Alert - Only shows if 0 patients found */}
      {patients.length === 0 && (
        <div className="w-full max-w-4xl mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="bg-amber-500/10 border-2 border-amber-500/20 rounded-[2rem] p-8 text-center">
              <div className="text-3xl mb-4">🔐</div>
              <h3 className="text-xl font-black text-amber-500 uppercase tracking-tight mb-2">Connected but No Data Found</h3>
              <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
                If your Supabase dashboard shows patients but they aren't appearing here, you likely have <strong>Row Level Security (RLS)</strong> enabled. 
              </p>
              <div className="mt-6 flex flex-col md:flex-row gap-4 justify-center">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                   <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Step 1</p>
                   <p className="text-xs font-bold text-slate-300">Go to Supabase Dashboard</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                   <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Step 2</p>
                   <p className="text-xs font-bold text-slate-300">Authentication &gt; Policies</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                   <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Step 3</p>
                   <p className="text-xs font-bold text-slate-300">Enable "Read" for public</p>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Visual Flow Diagram */}
      <div className="w-full mb-16 overflow-x-auto scrollbar-hide py-6">
        <div className="flex justify-center items-center gap-3 md:gap-6 min-w-max px-16 md:px-32 relative mx-auto">
          {FLOW_STAGES.map((stage, idx) => (
            <React.Fragment key={stage.status}>
              <div className="flex flex-col items-center gap-4 relative group">
                <div className={`w-24 h-24 md:w-28 md:h-28 rounded-3xl glass border-2 border-${stage.color}-500/40 flex flex-col items-center justify-center shadow-xl shadow-${stage.color}-500/10 group-hover:scale-110 transition-all duration-500 cursor-default relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-${stage.color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  <span className={`text-3xl md:text-4xl font-black text-${stage.color}-400 mb-1 relative z-10`}>{getCount(stage.status)}</span>
                  <span className="text-[8px] md:text-[9px] uppercase tracking-widest font-black text-slate-500 relative z-10 text-center px-2 leading-tight">
                    {stage.label}
                  </span>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full bg-${stage.color}-500 shadow-[0_0_12px_rgba(var(--tw-color-${stage.color}-500))]`}></div>
              </div>
              
              {idx < FLOW_STAGES.length - 1 && (
                <div className="w-6 md:w-10 flex justify-center items-center opacity-40">
                  <div className="relative w-full h-8 flex items-center">
                    <div className="w-full h-[1px] bg-slate-800 relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full w-10 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent animate-[flow_2.5s_linear_infinite]"></div>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Role Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl mb-12">
        <div className="glass p-8 rounded-[2.5rem] border border-blue-500/10 hover:border-blue-500/30 transition-all duration-500 group">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-blue-400 tracking-wider">STAFF PORTALS</h3>
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { role: UserRole.GATE, label: 'Gate & Security Sensors' },
              { role: UserRole.RECEPTION, label: 'Reception & IPD Admission' },
              { role: UserRole.CHECKIN, label: 'Nursing Check-in' },
              { role: UserRole.DOCTOR, label: 'Clinical Governance Console' },
              { role: UserRole.MEDICAL, label: 'Pharmacy & Med Intake' },
              { role: UserRole.WARD_CARE, label: 'Ward & ICU Management' },
              { role: UserRole.BILLING, label: 'Discharge & Final Exit' },
              { role: UserRole.VISITOR_MGMT, label: 'Visitor & Token Control' },
            ].map((btn) => (
              <button 
                key={btn.role}
                onClick={() => onRoleSelect(btn.role)} 
                className="w-full py-4 px-5 bg-slate-900/40 hover:bg-slate-800 rounded-2xl text-left font-bold transition-all flex justify-between items-center border border-slate-800 hover:border-slate-700 group/btn"
              >
                <span className="text-slate-400 group-hover/btn:text-blue-200 transition-colors">{btn.label}</span>
                <span className="text-slate-600 group-hover/btn:text-blue-400 transition-all transform translate-x-[-4px] group-hover/btn:translate-x-0 opacity-0 group-hover/btn:opacity-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] border border-purple-500/10 hover:border-purple-500/30 transition-all duration-500 group">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-purple-400 tracking-wider">PUBLIC BOARDS</h3>
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 border border-purple-500/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { id: 'reception', label: 'Reception Waiting List' },
              { id: 'checkin', label: 'Check-in Dashboard' },
              { id: 'doctor', label: 'Doctor Waiting Board' },
              { id: 'medical', label: 'Pharmacy Supply List' },
            ].map((btn) => (
              <button 
                key={btn.id}
                onClick={() => onRoleSelect(UserRole.PUBLIC, btn.id)} 
                className="w-full py-4 px-5 bg-slate-900/40 hover:bg-slate-800 rounded-2xl text-left font-bold transition-all flex justify-between items-center border border-slate-800 hover:border-slate-700 group/btn"
              >
                <span className="text-slate-400 group-hover/btn:text-purple-200 transition-colors">{btn.label}</span>
                <span className="text-slate-600 group-hover/btn:text-purple-400 transition-all transform translate-x-[-4px] group-hover/btn:translate-x-0 opacity-0 group-hover/btn:opacity-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] border border-emerald-500/10 flex flex-col items-center text-center justify-between">
          <div className="w-full">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
               <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-lg font-black mb-1 text-emerald-400 tracking-wider uppercase">High-Volume Flow</h3>
            <p className="text-slate-500 text-[10px] mb-10 font-bold tracking-[0.2em] uppercase">Daily Performance: OK</p>
            
            <div className="grid grid-cols-1 gap-4 w-full px-2">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/20 transition-all group">
                <div className="text-4xl font-black text-emerald-400 mb-1">{patients.length}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-600 group-hover:text-emerald-500/40 transition-colors">Total Records</div>
              </div>
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/20 transition-all group">
                <div className="text-4xl font-black text-emerald-400 mb-1">
                  {patients.filter(p => p.status === PatientStatus.COMPLETED).length}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-600 group-hover:text-emerald-500/40 transition-colors">Total Discharged</div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-[9px] font-black text-slate-700 tracking-[0.5em] uppercase">
            Optimization: ON
          </div>
        </div>
      </div>

      <style>{`
        @keyframes flow {
          from { transform: translateX(-100%); }
          to { transform: translateX(450%); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MainDashboard;
