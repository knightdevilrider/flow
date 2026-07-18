
import React, { useState } from 'react';
import { Patient, PatientStatus, PatientCategory } from '../types';
import { mockFirestore } from '../services/mockFirestore';

interface StaffAttendantMgmtProps {
  patients: Patient[];
}

const StaffAttendantMgmt: React.FC<StaffAttendantMgmtProps> = ({ patients }) => {
  const [selectedAttendant, setSelectedAttendant] = useState<Patient | null>(null);

  const activeAttendants = patients.filter(p => 
    p.category === PatientCategory.ATTENDANT && 
    p.status !== PatientStatus.COMPLETED
  ).sort((a, b) => b.timestamp - a.timestamp);

  const getTargetPatientName = (targetId?: string) => {
    return patients.find(p => p.id === targetId)?.name || 'Unknown Patient';
  };

  const handleTransfer = (id: string) => {
    // Basic termination of rights to allow new registration at gate
    mockFirestore.updatePatient(id, { status: PatientStatus.COMPLETED });
    setSelectedAttendant(null);
  };

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Attendant Directory</h2>
          <p className="text-slate-500 text-xs font-bold tracking-widest mt-1">Active 24/7 IDs • Strictly 1 per patient</p>
        </div>
        <div className="glass px-6 py-4 rounded-2xl border border-pink-500/20 text-center">
          <span className="block text-2xl font-black text-pink-400">{activeAttendants.length}</span>
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Verified Attendants</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {activeAttendants.map((att) => (
            <div 
              key={att.id}
              onClick={() => setSelectedAttendant(att)}
              className={`glass p-6 rounded-[2rem] border transition-all cursor-pointer group flex items-center justify-between ${selectedAttendant?.id === att.id ? 'border-pink-500 shadow-xl shadow-pink-500/10' : 'border-slate-800 hover:border-slate-700'}`}
            >
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-lg">
                  {att.photo ? (
                    <img src={att.photo} alt={att.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700 text-2xl">👤</div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white group-hover:text-pink-400 transition-colors">{att.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assisting IPD:</span>
                    <span className="text-xs font-bold text-pink-300">{getTargetPatientName(att.targetPatientId)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full text-[9px] font-black text-pink-400 uppercase tracking-widest">
                      Full Access Permitted
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Mobile Ref</div>
                <div className="text-sm font-black text-slate-300">{att.contactNumber}</div>
              </div>
            </div>
          ))}

          {activeAttendants.length === 0 && (
            <div className="text-center py-24 glass rounded-[3rem] border border-slate-800">
              <span className="text-4xl opacity-20">🛡️</span>
              <p className="text-slate-600 font-bold uppercase tracking-widest mt-4">No active attendants assigned</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {selectedAttendant ? (
            <div className="glass p-8 rounded-[2.5rem] border border-pink-500/30 sticky top-24 animate-in fade-in slide-in-from-right-4 shadow-2xl">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-xl font-black text-white tracking-tight">Attendant Profile</h3>
                <button onClick={() => setSelectedAttendant(null)} className="text-slate-500 hover:text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="w-full aspect-square rounded-[2rem] overflow-hidden border border-slate-700 mb-8 bg-slate-900 shadow-inner">
                {selectedAttendant.photo ? (
                  <img src={selectedAttendant.photo} alt={selectedAttendant.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-800 text-6xl">👤</div>
                )}
              </div>

              <div className="space-y-4 mb-10">
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                  <span className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Identity Verified</span>
                  <span className="text-sm font-bold text-slate-200">{selectedAttendant.idType}: {selectedAttendant.idNumber}</span>
                </div>
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                  <span className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Relationship</span>
                  <span className="text-sm font-bold text-slate-200">{selectedAttendant.relationship || 'Primary Kin'}</span>
                </div>
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                  <span className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Assisting Patient</span>
                  <span className="text-sm font-bold text-pink-400">{getTargetPatientName(selectedAttendant.targetPatientId)}</span>
                </div>
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                  <span className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Emergency Contact</span>
                  <span className="text-sm font-bold text-emerald-400">{selectedAttendant.emergencyContact || 'Not Specified'}</span>
                </div>
              </div>

              <button 
                onClick={() => handleTransfer(selectedAttendant.id)}
                className="w-full py-5 bg-pink-600 hover:bg-pink-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-pink-900/20 uppercase tracking-[0.2em] text-xs"
              >
                Terminate / Transfer Rights
              </button>
              
              <p className="mt-4 text-[9px] text-slate-500 text-center font-bold uppercase tracking-widest leading-relaxed">
                Termination immediately allows a new attendant to be registered at the gate.
              </p>
            </div>
          ) : (
            <div className="glass p-10 rounded-[2.5rem] border border-slate-800 h-96 flex flex-col items-center justify-center text-center opacity-40">
              <span className="text-5xl mb-6">📂</span>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select an attendant to view details or process transfer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffAttendantMgmt;
