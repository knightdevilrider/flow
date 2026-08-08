
import React from 'react';
import { Patient, PatientStatus } from '../types';
import { STATUS_LABELS } from '../constants';

interface PatientContactModalProps {
  patient: Patient | null;
  onClose: () => void;
  isAdmin?: boolean;
  onEdit?: (patient: Patient) => void;
  onDelete?: (patient: Patient) => void;
}

const PatientContactModal: React.FC<PatientContactModalProps> = ({ patient, onClose, isAdmin, onEdit, onDelete }) => {
  if (!patient) return null;

  const formatDate = (ts?: number) => {
    if (!ts) return '--:--';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (entry?: number, exit?: number) => {
    if (!entry) return '--';
    if (!exit) return 'In Progress...';
    const diff = exit - entry;
    if (isNaN(diff)) return '--';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const calculateTotalTime = () => {
    const history = patient.history || [];
    if (history.length === 0) return '0m';
    const start = history[0].entryTime;
    if (!start) return '--';
    const lastLog = history[history.length - 1];
    const end = lastLog.exitTime || Date.now();
    const diff = end - start;
    if (isNaN(diff)) return '--';
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="glass w-full max-w-xl rounded-[3rem] border border-slate-700 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 bg-[#0f172a]">
        
        {/* Decorative background pulse */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
        
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors z-10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div className="p-10 relative">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-36 h-36 rounded-[2.5rem] border-4 border-indigo-500/30 overflow-hidden mb-6 bg-slate-900 shadow-2xl">
              {patient.photo ? (
                <img src={patient.photo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">👤</div>
              )}
            </div>
            <h3 className="text-4xl font-black text-white tracking-tight">{patient.name}</h3>
            <div className="flex items-center gap-3 mt-2">
               <span className="text-indigo-400 font-black tracking-widest text-[10px] uppercase">Patient ID: {patient.id}</span>
               <span className="w-1 h-1 rounded-full bg-slate-700"></span>
               <span className="text-emerald-400 font-black tracking-widest text-[10px] uppercase">Active</span>
            </div>
            
            <div className="mt-6 px-8 py-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
              <div className="flex flex-col items-start border-r border-slate-800 pr-6">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Mobile</span>
                 <span className="text-sm font-bold text-white">{patient.contactNumber}</span>
              </div>
              <div className="flex flex-col items-start">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Insurance</span>
                 <span className="text-sm font-bold text-white">{patient.insuranceType || 'Self-Pay'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Individual Process Tracking</h4>
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-md">
                 Total Time: {calculateTotalTime()}
               </span>
            </div>
            
            <div className="space-y-0 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
              {(!patient.history || patient.history.length === 0) ? (
                <p className="text-slate-600 text-center py-10 font-bold uppercase tracking-widest text-xs italic">No logs available</p>
              ) : (
                (patient.history || []).map((log, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-2 border-slate-900 z-10 ${idx === (patient.history || []).length - 1 ? 'bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'bg-slate-700'}`}></div>
                      {idx < (patient.history || []).length - 1 && <div className="w-[2px] h-full bg-slate-800 -my-1"></div>}
                    </div>
                    <div className="flex-1 pb-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-slate-200 uppercase tracking-wider mb-1">{STATUS_LABELS[log.stage]}</p>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                             <span>{formatDate(log.entryTime)}</span>
                             {log.exitTime && <span>→</span>}
                             {log.exitTime && <span>{formatDate(log.exitTime)}</span>}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${!log.exitTime ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800/50 text-slate-500 border border-slate-700/30'}`}>
                          {calculateDuration(log.entryTime, log.exitTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800/50 flex flex-col gap-4">
               <div className="flex gap-4">
                 <button 
                   onClick={() => onEdit?.(patient)}
                   className="flex-1 py-4 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                 >
                   {isAdmin ? 'Edit Master Record' : 'Edit Record'}
                 </button>
                 <button 
                   onClick={() => onDelete?.(patient)}
                   className="flex-1 py-4 rounded-2xl bg-red-600/10 text-red-400 border border-red-500/20 font-black uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                 >
                   {isAdmin ? 'Archive Record' : 'Request Deletion'}
                 </button>
               </div>
             <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.6em]">System Audit • Real-Time Log Verified</p>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default PatientContactModal;
