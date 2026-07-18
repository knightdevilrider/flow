
import React, { useState } from 'react';
import { Patient, PatientStatus, PatientCategory } from '../types';
import { mockFirestore } from '../services/mockFirestore';

interface StaffVisitorMgmtProps {
  patients: Patient[];
}

const StaffVisitorMgmt: React.FC<StaffVisitorMgmtProps> = ({ patients }) => {
  const [selectedVisitor, setSelectedVisitor] = useState<Patient | null>(null);

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
      alert('🔴 ACCESS DENIED: 1-In / 1-Out Protocol Violation. Relative A is still inside.');
    } else {
      alert('🟢 ACCESS GRANTED: Ward Entry Authorized.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Visitor Control & Turnstiles</h2>
          <p className="text-slate-500 text-xs font-bold tracking-widest mt-1">1-In / 1-Out Protocol Enforced • Active: {activeVisitors.length}</p>
        </div>
        <div className="flex gap-4">
          <div className="glass px-6 py-4 rounded-2xl border border-red-500/20 text-center animate-pulse">
            <span className="block text-2xl font-black text-red-400">TURNSTILE LIVE</span>
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Glass Door Sensors</span>
          </div>
        </div>
      </div>

      <div className="mb-10 p-8 glass rounded-[2.5rem] border border-blue-500/10">
        <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-6">Simulation: Scan Relative QR at Door</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {patients.filter(p => [PatientStatus.WARD_ADMITTED, PatientStatus.ICU_ADMITTED].includes(p.status)).map(p => (
            <button 
              key={p.id}
              onClick={() => handleScanTurnstile(p.id)}
              className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-all text-left"
            >
              <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Patient: {p.name}</p>
              <p className="text-xs font-bold text-slate-300">Scan Relative QR</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
          {activeVisitors.map((visitor) => {
            const target = getTargetPatient(visitor.targetPatientId);
            return (
              <div 
                key={visitor.id}
                onClick={() => setSelectedVisitor(visitor)}
                className={`glass p-6 rounded-[2rem] border transition-all cursor-pointer group flex items-center justify-between ${selectedVisitor?.id === visitor.id ? 'border-indigo-500 shadow-xl shadow-indigo-500/10' : 'border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-lg">
                    {visitor.photo ? (
                      <img src={visitor.photo} alt={visitor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700 text-2xl">👤</div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors">{visitor.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meeting:</span>
                      <span className="text-xs font-bold text-indigo-300">{target?.name || 'Unknown'} (ID: {visitor.targetPatientId?.slice(0,6)})</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {visitor.relationship || 'Relative'}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                        In Ward
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Pass Expiry</div>
                  <div className="text-sm font-black text-slate-300">
                    {visitor.expiryTimestamp ? new Date(visitor.expiryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '1 hr remain'}
                  </div>
                </div>
              </div>
            );
          })}

          {activeVisitors.length === 0 && (
            <div className="text-center py-24 glass rounded-[3rem] border border-slate-800">
              <span className="text-4xl opacity-20">📇</span>
              <p className="text-slate-600 font-bold uppercase tracking-widest mt-4">No active visitors found</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {selectedVisitor ? (
            <div className="glass p-8 rounded-[2.5rem] border border-indigo-500/30 sticky top-24 animate-in fade-in slide-in-from-right-4 shadow-2xl">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-xl font-black text-white tracking-tight">Active Session</h3>
                <button onClick={() => setSelectedVisitor(null)} className="text-slate-500 hover:text-white transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="w-full aspect-square rounded-[2rem] overflow-hidden border border-slate-700 mb-6 bg-slate-900 shadow-2xl relative">
                {selectedVisitor.photo ? (
                  <img src={selectedVisitor.photo} alt={selectedVisitor.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-800 text-6xl">👤</div>
                )}
                <div className="absolute top-4 right-4 px-3 py-1 bg-indigo-500 text-slate-950 text-[10px] font-black rounded-full shadow-lg">
                  VERIFIED
                </div>
              </div>

              <div className="space-y-3 mb-10">
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
                  <span className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Visitor Details</span>
                  <span className="text-sm font-bold text-slate-300">{selectedVisitor.idType}: {selectedVisitor.idNumber}</span>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
                  <span className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Patient Being Visited</span>
                  <span className="text-sm font-bold text-indigo-400">{getTargetPatient(selectedVisitor.targetPatientId)?.name || 'Unknown'}</span>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
                  <span className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Meetup Protocol</span>
                  <span className="text-xs font-bold text-slate-400 italic">One visitor per patient limit enforced.</span>
                </div>
              </div>

              <button 
                onClick={() => handleDeactivatePass(selectedVisitor.id)}
                className="w-full py-5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 font-black rounded-2xl transition-all uppercase tracking-[0.2em] text-xs shadow-lg active:scale-95"
              >
                End Visit & Clear Room
              </button>
            </div>
          ) : (
            <div className="glass p-10 rounded-[2.5rem] border border-slate-800 h-96 flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">👥</span>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                Select a visitor entry to view detailed profile and meeting history.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffVisitorMgmt;
