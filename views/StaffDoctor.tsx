
import React, { useState, useEffect, useRef } from 'react';
import { Patient, PatientStatus, Doctor } from '../types';
import { mockFirestore } from '../services/mockFirestore';
import { DOCTORS } from '../constants';

interface StaffDoctorProps {
  patients: Patient[];
}

const StaffDoctor: React.FC<StaffDoctorProps> = ({ patients }) => {
  const [activeDoctorId, setActiveDoctorId] = useState<string>('');
  const [prescription, setPrescription] = useState('');
  const [message, setMessage] = useState('');
  const isProcessingAutoCall = useRef(false);

  const doctor = DOCTORS.find(d => d.id === activeDoctorId);
  
  // The "Inner Queue" (People currently assigned to this doctor and waiting at their door)
  const innerQueue = patients.filter(p => 
    p.assignedDoctorId === activeDoctorId && 
    p.status === PatientStatus.DOCTOR_WAITING &&
    !p.isAbsent
  );

  // The "Main Hall" (People waiting to be called by this specific doctor)
  const waitingHall = patients.filter(p => 
    p.assignedDoctorId === activeDoctorId && 
    p.status === PatientStatus.CHECKIN_WAITING && 
    !!p.checkinSection && 
    !p.isAbsent
  );

  const currentPatient = innerQueue[0]; // The person currently inside the room
  const absentList = patients.filter(p => 
    p.assignedDoctorId === activeDoctorId && 
    p.status === PatientStatus.CHECKIN_WAITING && 
    p.isAbsent
  );

  // AUTO-INTAKE LOGIC
  useEffect(() => {
    if (!activeDoctorId || !doctor || isProcessingAutoCall.current) return;

    const capacity = doctor.maxCapacity || 5;
    
    // If the room + the chairs outside (inner queue) have space
    if (innerQueue.length < capacity && waitingHall.length > 0) {
      const callNextAutomatically = async () => {
        isProcessingAutoCall.current = true;
        const next = waitingHall[0];
        
        try {
          setMessage(`Auto-Calling: ${next.name}...`);
          await mockFirestore.callPatient(next.id, PatientStatus.DOCTOR_WAITING, patients);
          // Small delay to let DB sync and avoid double-calling
          setTimeout(() => {
            isProcessingAutoCall.current = false;
            setMessage('');
          }, 2000);
        } catch (err) {
          console.error("Auto-call failed", err);
          isProcessingAutoCall.current = false;
        }
      };

      callNextAutomatically();
    }
  }, [patients, activeDoctorId, doctor, innerQueue.length, waitingHall]);

  const handleSkip = async () => {
    if (currentPatient) {
      await mockFirestore.skipPatient(currentPatient.id);
      await mockFirestore.updatePatient(currentPatient.id, { status: PatientStatus.CHECKIN_WAITING });
    }
  };

  const handleComplete = async () => {
    if (!currentPatient || !prescription) return;
    await mockFirestore.updatePatientAudited(currentPatient.id, {
      status: PatientStatus.CONSULTATION_DONE,
      prescription,
    }, 'Standard Consultation Completed', activeDoctorId);
    setMessage('Consultation completed.');
    setPrescription('');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAdmit = async () => {
    if (!currentPatient) return;
    await mockFirestore.updatePatientAudited(currentPatient.id, {
      status: PatientStatus.ADMISSION_DESK,
      category: PatientCategory.IPD
    }, 'Clinical Order: IPD Admission Required', activeDoctorId);
    setMessage('Admission order created.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleConsent = async () => {
    if (!currentPatient) return;
    const hash = `CONSENT_${Math.random().toString(36).substring(7).toUpperCase()}`;
    await mockFirestore.recordConsent(currentPatient.id, activeDoctorId, hash);
    alert(`Digital Certificate Generated: ${hash}`);
  };

  if (!activeDoctorId) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h2 className="text-3xl font-black text-white mb-8 uppercase tracking-tight">Clinical Staff Login</h2>
        <div className="grid grid-cols-1 gap-4">
          {DOCTORS.map(d => (
            <button
              key={d.id}
              onClick={() => setActiveDoctorId(d.id)}
              className="w-full py-6 glass hover:bg-slate-800 border-2 border-slate-800 hover:border-indigo-500/50 rounded-[2rem] text-xl font-black transition-all flex items-center justify-between px-8 group"
            >
              <div className="text-left">
                <div className="text-white group-hover:text-indigo-400 transition-colors">{d.name}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Section {d.section}</div>
              </div>
              <span className="text-2xl">🩺</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {/* Status Header */}
        <div className="flex items-center justify-between bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-2xl border border-indigo-500/20">👨‍⚕️</div>
              <div>
                <h2 className="text-xl font-black text-white">{doctor?.name}</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Auto-Intake Active</span>
                </div>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Room Capacity</p>
              <p className="text-2xl font-black text-white">{innerQueue.length} / {doctor?.maxCapacity}</p>
           </div>
        </div>

        <section className="glass p-8 rounded-[2.5rem] border-2 border-red-500/30 relative">
          <div className="absolute top-0 right-0 px-6 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-bl-2xl">
            Currently Seeing
          </div>
          
          {currentPatient ? (
            <div className="relative">
              {/* FORCED RECONCILIATION LOCK */}
              {currentPatient.specialistNotesPending && (
                <div className="absolute inset-x-[-2rem] inset-y-[-2rem] z-50 glass backdrop-blur-xl border-4 border-amber-500/50 rounded-[3rem] flex flex-col items-center justify-center p-12 text-center">
                  <div className="text-6xl mb-6">🤝</div>
                  <h3 className="text-2xl font-black text-amber-500 uppercase tracking-widest mb-4">Forced Reconciliation</h3>
                  <p className="text-slate-300 text-sm max-w-sm mb-8 leading-relaxed">
                    Primary console locked. Specialist (Cardiology) has submitted notes. 
                    You must <strong>Accept</strong> or <strong>Reject</strong> the reconciliation to continue.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => mockFirestore.updatePatient(currentPatient.id, { specialistNotesPending: false })}
                      className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/40"
                    >
                      Accept Notes
                    </button>
                    <button className="px-8 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase text-xs border border-slate-700">View Details</button>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-8 animate-in fade-in duration-500">
                <div className="w-48 h-48 rounded-[2.5rem] overflow-hidden border-4 border-red-400/50 shadow-2xl flex-shrink-0 bg-slate-900">
                  {currentPatient.photo ? (
                    <img src={currentPatient.photo} alt={currentPatient.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-8xl">👤</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-4xl font-black text-white">{currentPatient.name}</h3>
                    {currentPatient.surgicalConsentDone && (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Consent Verified
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mb-4">
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">ID: {currentPatient.id}</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Age: {currentPatient.age || 'N/A'}</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ref: {currentPatient.rfidTag || 'NO_TAG'}</span>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Prescription & Clinical Findings</label>
                      <textarea
                        value={prescription}
                        onChange={(e) => setPrescription(e.target.value)}
                        placeholder="Symptoms, Diagnosis, Dosage..."
                        rows={5}
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm resize-none"
                      />
                    </div>

                    <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">EMR Governance / IPD Actions</p>
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={handleAdmit}
                          className="px-4 py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          Admit to IPD
                        </button>
                        <button 
                          onClick={handleConsent}
                          className="px-4 py-2 bg-purple-600/10 text-purple-400 border border-purple-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-purple-600 hover:text-white transition-all"
                        >
                          Surgical Consent
                        </button>
                        <button 
                          onClick={() => mockFirestore.updatePatient(currentPatient.id, { dietPlan: 'Low Sodium / Liquid' })}
                          className="px-4 py-2 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all"
                        >
                          Set Diet: Liquid
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={handleComplete}
                        disabled={!prescription}
                        className="flex-1 py-5 bg-red-600 hover:bg-red-500 disabled:opacity-30 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs shadow-xl shadow-red-900/20"
                      >
                        Finish & Clear Room
                      </button>
                      <button 
                        onClick={handleSkip}
                        className="px-8 py-5 bg-red-600/10 hover:bg-red-600 text-red-500 border border-red-500/20 font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce">⏳</div>
              <h4 className="text-slate-400 font-black uppercase tracking-widest mb-2">Waiting for Auto-Intake...</h4>
              <p className="text-slate-600 text-xs font-bold">The system will automatically call the next patient from Hall {doctor?.section} when ready.</p>
            </div>
          )}
        </section>

        <section>
          <div className="flex justify-between items-center mb-6 px-4">
             <h3 className="text-xl font-black text-white uppercase tracking-tight">Inner Queue / Outside Door ({innerQueue.length})</h3>
             <button onClick={() => setActiveDoctorId('')} className="text-[10px] font-black text-slate-600 uppercase hover:text-red-400 transition-colors">Logout / Switch</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {innerQueue.map((p, idx) => (
              <div key={p.id} className={`glass p-5 rounded-2xl border transition-all flex items-center justify-between group ${idx === 0 ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800'}`}>
                <div className="flex items-center gap-5">
                  <div className={`w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-black border border-slate-700 ${idx === 0 ? 'text-red-500' : 'text-slate-500'}`}>{idx === 0 ? 'IN' : idx + 1}</div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">{p.name}</div>
                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{p.id}</div>
                  </div>
                </div>
                {p.isPriority && <span className="text-[8px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded uppercase">Return Case</span>}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="glass p-6 rounded-3xl border border-slate-800">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Main Hall {doctor?.section} Pipeline</h3>
          <div className="space-y-3">
             {waitingHall.slice(0, 5).map(p => (
               <div key={p.id} className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800 flex justify-between items-center opacity-60">
                  <div>
                    <p className="text-xs font-bold text-slate-400">{p.name}</p>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Waiting in Hall</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-slate-700"></div>
               </div>
             ))}
             {waitingHall.length === 0 && <p className="text-center py-6 text-[10px] font-black text-slate-700 uppercase italic">Hall Empty</p>}
          </div>
        </section>

        {message && <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl text-center text-xs font-bold animate-pulse">{message}</div>}

        <section className="glass p-6 rounded-3xl border border-slate-800">
          <h3 className="text-sm font-black text-red-400 uppercase tracking-widest mb-6">Skipped / Waiting Re-entry</h3>
          <div className="space-y-3">
            {absentList.map(p => (
              <div key={p.id} className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex justify-between items-center group">
                <div className="flex flex-col">
                   <span className="text-xs font-bold text-slate-300">{p.name}</span>
                   <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">{p.id}</span>
                </div>
                <button 
                  onClick={() => mockFirestore.prioritizePatient(p.id)}
                  className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all"
                >
                  Prioritize
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StaffDoctor;
