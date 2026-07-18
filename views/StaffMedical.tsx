
import React, { useState } from 'react';
import { Patient, PatientStatus } from '../types';
import { mockFirestore } from '../services/mockFirestore';

interface StaffMedicalProps {
  patients: Patient[];
}

const StaffMedical: React.FC<StaffMedicalProps> = ({ patients }) => {
  const [message, setMessage] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);

  const currentPatient = patients.find(p => p.status === PatientStatus.MEDICINE_WAITING);
  const queue = patients.filter(p => p.status === PatientStatus.CONSULTATION_DONE && !p.isAbsent);
  const absentList = patients.filter(p => p.status === PatientStatus.CONSULTATION_DONE && p.isAbsent);

  const handleCallNext = async () => {
    const next = mockFirestore.getNextInQueue(patients, PatientStatus.CONSULTATION_DONE);
    if (next) {
      await mockFirestore.callPatient(next.id, PatientStatus.MEDICINE_WAITING, patients);
      setMessage(`Calling ${next.name} for Pharmacy Collection.`);
    } else {
      setMessage("No pending prescriptions.");
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDispense = async () => {
    if (!currentPatient) return;
    setIsArchiving(true);
    setMessage('ARCHIVE_SYNC_INITIATED...');
    
    await mockFirestore.updatePatient(currentPatient.id, { status: PatientStatus.COMPLETED });
    
    setTimeout(() => {
      setIsArchiving(false);
      setMessage('DISPENSING_CONFIRMED // CLOUD_SYNC_COMPLETE');
      setTimeout(handleCallNext, 1000);
    }, 2000);
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 py-10 px-6 animate-slide-up">
      <div className="lg:col-span-8 space-y-10">
        {/* Pharmacy HUD Header */}
        <div className="glass p-8 rounded-[3rem] flex justify-between items-center border-slate-800">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center text-3xl border-pink-500/30">💊</div>
              <div>
                 <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Pharma_Terminal</h2>
                 <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isArchiving ? 'bg-pink-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></div>
                    <span className="mono text-[9px] font-black text-slate-500 uppercase tracking-widest">
                       {isArchiving ? 'Syncing to Google Matrix...' : 'Supply Stream Active'}
                    </span>
                 </div>
              </div>
           </div>
           <div className="text-right">
              <p className="mono text-[9px] text-slate-600 uppercase tracking-widest mb-1 font-black">Prescription Backlog</p>
              <p className="text-3xl font-black text-white italic">{queue.length} <span className="text-xs text-slate-700 not-italic uppercase tracking-widest ml-2">Units</span></p>
           </div>
        </div>

        {/* Current Dispensing Node */}
        <section className="glass p-12 rounded-[4rem] border-2 border-pink-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-8 py-3 bg-pink-500 text-[#020617] text-[10px] font-black uppercase tracking-widest rounded-bl-3xl italic">PHARMA_DISPENSE</div>
          
          {currentPatient ? (
            <div className="flex flex-col xl:flex-row gap-12 animate-in slide-in-from-bottom-4 duration-500">
              <div className="w-56 h-56 rounded-[3.5rem] overflow-hidden border-4 border-pink-500/30 shadow-2xl flex-shrink-0 bg-slate-900">
                {currentPatient.photo ? (
                  <img src={currentPatient.photo} alt={currentPatient.name} className="w-full h-full object-cover grayscale brightness-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl">👤</div>
                )}
              </div>
              <div className="flex-1 space-y-8">
                <div>
                  <h3 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">{currentPatient.name}</h3>
                  <p className="mono text-[11px] font-black text-pink-400 uppercase tracking-[0.4em] mt-3">Identity_Link: {currentPatient.id}</p>
                </div>
                
                <div className="p-8 glass rounded-[2.5rem] border border-slate-800 shadow-inner">
                  <h4 className="mono text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Clinical Directive</h4>
                  <p className="text-3xl font-black text-pink-400 leading-tight italic">"{currentPatient.prescription}"</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={handleDispense}
                    disabled={isArchiving}
                    className="flex-1 py-8 bg-pink-600 hover:bg-pink-500 disabled:opacity-30 text-white font-black rounded-[2.5rem] transition-all uppercase tracking-[0.3em] italic text-sm shadow-xl shadow-pink-500/10 active:scale-95"
                  >
                    {isArchiving ? 'UPLINKING_TO_ARCHIVES...' : 'EXECUTE_DISPENSE_AND_ARCHIVE'}
                  </button>
                  <button 
                    onClick={handleCallNext}
                    className="px-12 py-8 glass border-slate-800 text-slate-500 hover:text-white transition-all font-black rounded-[2.5rem] uppercase tracking-widest text-xs"
                  >
                    Skip_Node
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="text-7xl mb-10 opacity-20">🧬</div>
              <h4 className="text-slate-500 font-black uppercase tracking-[0.6em] mb-4">Awaiting Clinical Data...</h4>
              <button 
                onClick={handleCallNext}
                className="px-12 py-6 glass border-slate-700 hover:border-pink-500 text-slate-500 hover:text-pink-400 font-black rounded-[2.5rem] transition-all uppercase tracking-widest italic"
              >
                Scan_Next_Prescription
              </button>
            </div>
          )}
        </section>

        {/* Local Pipeline */}
        <section>
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-8 px-6">Supply Pipeline ({queue.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {queue.slice(0, 6).map((p, idx) => (
              <div key={p.id} className="glass p-6 rounded-[2.5rem] border border-slate-800 flex items-center justify-between group hover:border-pink-500/20 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center font-black text-slate-700 italic border border-slate-800 group-hover:text-pink-500 transition-colors">{idx + 1}</div>
                  <div>
                    <div className="text-lg font-black text-white italic group-hover:text-pink-400 transition-colors uppercase">{p.name}</div>
                    <div className="mono text-[9px] font-black text-slate-700 uppercase">NODE_{p.id.slice(-6)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="lg:col-span-4 space-y-10">
        <section className="glass p-8 rounded-[3.5rem] border-slate-800">
          <h3 className="mono text-[10px] font-black text-red-500 uppercase tracking-widest mb-10 border-b border-slate-900 pb-4 italic">Skipped_Reentry_List</h3>
          <div className="space-y-4">
            {absentList.map(p => (
              <div key={p.id} className="p-6 glass-bright rounded-3xl border border-red-500/10 flex justify-between items-center group">
                <div className="flex flex-col">
                   <span className="text-sm font-black text-slate-400 italic uppercase">{p.name}</span>
                   <span className="mono text-[8px] text-slate-700 font-black uppercase mt-1">ID_{p.id.slice(-8)}</span>
                </div>
                <button 
                  onClick={() => mockFirestore.prioritizePatient(p.id)}
                  className="px-4 py-2 bg-pink-500/10 text-pink-500 border border-pink-500/20 rounded-xl mono text-[8px] font-black uppercase hover:bg-pink-500 hover:text-white transition-all"
                >
                  Prioritize
                </button>
              </div>
            ))}
            {absentList.length === 0 && <p className="text-center py-10 mono text-[9px] font-black text-slate-800 uppercase tracking-[0.5em] italic">No_Abstentions</p>}
          </div>
        </section>

        {message && <div className="p-6 bg-[#020617] border border-slate-900 text-slate-500 rounded-3xl text-center text-[10px] font-black animate-pulse uppercase tracking-[0.3em]">{message}</div>}

        <div className="p-8 glass rounded-[3rem] border-slate-800/40 text-center">
           <p className="mono text-[10px] text-slate-600 font-black uppercase tracking-widest mb-4">Grid_Archiver_v1.2</p>
           <div className="flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-slate-800 animate-pulse" style={{ animationDelay: `${i * 200}ms` }}></div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default StaffMedical;
