
import React, { useState, useEffect, useRef } from 'react';
import { Patient, PatientStatus, Doctor, Theme, PatientCategory, DoctorRoster } from '../types';
import { mockFirestore } from '../services/mockFirestore';
import { TREATMENT_TYPES } from '../constants';
import PatientContactModal from '../components/PatientContactModal';

interface StaffDoctorProps {
  patients: Patient[];
  theme: Theme;
  doctors: Doctor[];
  roster: DoctorRoster[];
  isAdmin?: boolean;
  onEditPatient?: (p: Patient) => void;
  onDeletePatient?: (p: Patient) => void;
}

const StaffDoctor: React.FC<StaffDoctorProps> = ({ patients, theme, doctors: allDoctors, roster, isAdmin, onEditPatient, onDeletePatient }) => {
  const [activeDoctorId, setActiveDoctorId] = useState<string>('');
  const [prescription, setPrescription] = useState('');
  const [diagnosisICD, setDiagnosisICD] = useState('');
  const [department, setDepartment] = useState('General Medicine');
  const [referralSource, setReferralSource] = useState('Direct');
  const [directive, setDirective] = useState('Discharge');
  const [targetTreatmentType, setTargetTreatmentType] = useState(TREATMENT_TYPES[0]);
  const [message, setMessage] = useState('');
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const isProcessingAutoCall = useRef(false);

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

  // Use allDoctors from props instead of DOCTORS constant
  // Filter only those who are on the roster for today
  const activeRosterDocs = allDoctors.filter(d => roster.some(r => (r as any).staffId === d.id || (r as any).doctorId === d.id));
  const doctor = activeRosterDocs.find(d => d.id === activeDoctorId);
  const currentRosterItem = roster.find(r => (r as any).staffId === activeDoctorId || (r as any).doctorId === activeDoctorId);
  
  // The "Inner Queue" (People currently assigned to this doctor and waiting at their door)
  const innerQueue = patients.filter(p => 
    p.assignedDoctorId === activeDoctorId && 
    (p.status === PatientStatus.DOCTOR_WAITING || p.status === PatientStatus.DOCTOR_RECONSULT) &&
    !p.isAbsent
  ).sort((a, b) => {
    if (a.isPriorityReconsult && !b.isPriorityReconsult) return -1;
    if (!a.isPriorityReconsult && b.isPriorityReconsult) return 1;
    if (a.lastCalledTimestamp && b.lastCalledTimestamp) return a.lastCalledTimestamp - b.lastCalledTimestamp;
    return a.timestamp - b.timestamp;
  });

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
          setMessage(`Auto-Calling: ${next.name}`);
          await mockFirestore.callPatient(next.id, PatientStatus.DOCTOR_WAITING, patients);
          // Small delay to let DB sync and avoid double-calling
          setTimeout(() => {
            isProcessingAutoCall.current = false;
            setMessage('');
          }, 2000);
        } catch (err) {
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
    let finalStatus = PatientStatus.CONSULTATION_DONE;
    let finalTreatmentType = undefined;
    
    if (directive === 'Referred to Treatment') {
      finalStatus = PatientStatus.TREATMENT;
      finalTreatmentType = targetTreatmentType;
    }

    await mockFirestore.updatePatientAudited(currentPatient.id, {
      status: finalStatus,
      prescription,
      diagnosisICD,
      department,
      referralSource,
      directive,
      assignedTreatmentType: finalTreatmentType,
      isPriorityReconsult: false // Reset flag if they are discharged or sent to treatment again
    }, 'Standard Consultation Completed', activeDoctorId);
    setMessage('Consultation completed');
    setPrescription('');
    setDiagnosisICD('');
    setDirective('Discharge');
    setTargetTreatmentType(TREATMENT_TYPES[0]);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAdmit = async () => {
    if (!currentPatient) return;
    await mockFirestore.updatePatientAudited(currentPatient.id, {
      status: PatientStatus.ADMISSION_DESK,
      category: PatientCategory.IPD
    }, 'Clinical Order: IPD Admission Required', activeDoctorId);
    setMessage('Admission order created');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleConsent = async () => {
    if (!currentPatient) return;
    const hash = `CONSENT_${Math.random().toString(36).substring(7).toUpperCase()}`;
    await mockFirestore.recordConsent(currentPatient.id, activeDoctorId, hash);
    setMessage(`Consent Signed: ${hash}`);
  };

  if (!activeDoctorId) {
    return (
      <div className="max-w-xl mx-auto py-12 sm:py-24 px-6 sm:px-10">
        <div className="text-center mb-12 sm:mb-20">
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#0071e3]/10 flex items-center justify-center mx-auto mb-8 shadow-inner">
            <span className="text-4xl sm:text-6xl">🩺</span>
          </div>
          <h2 className={`text-4xl sm:text-6xl font-black mb-4 uppercase tracking-tighter leading-none ${s.header}`}>Clinical Portal</h2>
          <p className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] opacity-40 ${s.sub}`}>Select authorized consultant profile</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {activeRosterDocs.map(d => {
            const rosterItem = roster.find(r => r.doctorId === d.id);
            return (
              <button
                key={d.id}
                onClick={() => setActiveDoctorId(d.id)}
                className={`w-full py-6 sm:py-10 rounded-[2.5rem] sm:rounded-[3.5rem] border-2 transition-all flex items-center justify-between px-8 sm:px-12 group ${s.card} hover:scale-[1.03] active:scale-95 shadow-xl hover:shadow-2xl relative overflow-hidden`}
              >
                {rosterItem?.isOnCall && (
                  <div className="absolute top-0 right-0 px-6 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg">On-Call Emergency</div>
                )}
                <div className="text-left space-y-1 sm:space-y-2">
                  <div className={`text-xl sm:text-3xl font-black group-hover:${s.accent} transition-colors tracking-tight ${s.header}`}>{d.name}</div>
                  <div className={`text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-40 ${s.sub}`}>
                    Room {rosterItem?.roomNumber || 'N/A'} • {rosterItem?.shift} Shift
                  </div>
                </div>
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 transition-all group-hover:bg-[#0A84FF] group-hover:text-white group-hover:border-[#0A84FF] shadow-inner ${s.btn}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </button>
            );
          })}
          {activeRosterDocs.length === 0 && (
            <div className={`text-center py-20 rounded-[3rem] border-4 border-dashed border-opacity-10 space-y-6 ${s.card}`}>
              <span className="text-6xl grayscale opacity-20">📅</span>
              <p className={`text-xs font-black uppercase tracking-widest opacity-40 ${s.sub}`}>No Doctors Allocated Today</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <PatientContactModal 
        patient={viewingPatient} 
        onClose={() => setViewingPatient(null)} 
        isAdmin={isAdmin}
        onEdit={onEditPatient}
        onDelete={onDeletePatient}
      />
      <div className="lg:col-span-3 space-y-6">
        <section className={`p-6 sm:p-8 rounded-[2rem] border shadow-xl relative overflow-hidden ${s.card}`}>
          <div className={`absolute top-0 right-0 px-6 py-2 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl shadow-lg ${theme === 'light' ? 'bg-[#0071e3]' : 'bg-[#0A84FF]'}`}>
            Live Consultation
          </div>
          
          {currentPatient ? (
            <div className="relative">
              {/* FORCED RECONCILIATION LOCK */}
              {currentPatient.specialistNotesPending && (
                <div className="absolute inset-[-1.5rem] sm:inset-[-2rem] z-50 backdrop-blur-xl border-4 border-amber-500/30 rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-center bg-white/40 dark:bg-black/40 animate-in fade-in zoom-in-95">
                  <div className="text-5xl mb-4 animate-bounce">🤝</div>
                  <h3 className="text-2xl font-black text-amber-500 uppercase tracking-tighter mb-4 leading-none">CLINICAL SYNC</h3>
                  <p className={`text-[10px] max-w-xs mb-8 leading-relaxed font-black uppercase tracking-widest opacity-80 ${s.header}`}>
                    Specialist submitted findings. Verify before completion.
                  </p>
                  <div className="flex gap-4 w-full max-w-sm">
                    <button 
                      onClick={() => mockFirestore.updatePatient(currentPatient.id, { specialistNotesPending: false })}
                      className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] hover:bg-emerald-500 transition-all shadow-xl active:scale-95"
                    >
                      ACKNOWLEDGE
                    </button>
                    <button className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] border-2 transition-all active:scale-95 ${s.btn}`}>DETAILS</button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-8 items-start animate-in fade-in">
                <div 
                  onClick={() => setViewingPatient(currentPatient)}
                  className={`w-28 h-28 sm:w-40 sm:h-40 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border-4 shadow-lg shrink-0 transition-transform cursor-pointer hover:scale-105 active:scale-95 ${theme === 'light' ? 'border-white' : 'border-[#333]'}`}
                >
                  {currentPatient.photo ? (
                    <img src={currentPatient.photo} alt={currentPatient.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-5xl sm:text-7xl ${s.btn}`}>👤</div>
                  )}
                </div>
                <div className="flex-1 w-full space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-4">
                      <h3 
                        onClick={() => setViewingPatient(currentPatient)}
                        className={`text-3xl sm:text-4xl font-black tracking-tight leading-tight cursor-pointer hover:text-blue-500 transition-colors ${s.header}`}
                      >
                        {currentPatient.name}
                      </h3>
                      {currentPatient.surgicalConsentDone && (
                        <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border shadow-sm ${s.badge}`}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                          CONSENT
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${s.accent}`}>ID: {currentPatient.id}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${s.sub}`}>{currentPatient.age || 'N/A'}Y • {currentPatient.gender}</span>
                    </div>
                  </div>
                  
                  {currentPatient.treatmentResults && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl mb-4">
                      <div className="text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-1">Treatment Results (Priority)</div>
                      <div className="text-sm font-bold text-emerald-700">{currentPatient.treatmentResults}</div>
                    </div>
                  )}
                  
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Department</label>
                          <select 
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className={`w-full rounded-xl px-4 py-3 font-black text-[10px] border-2 outline-none transition-all ${s.input}`}
                          >
                            <option>General Medicine</option>
                            <option>Pediatrics</option>
                            <option>Orthopedics</option>
                            <option>Gynecology</option>
                            <option>Cardiology</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Clinical Directive</label>
                          <select 
                            value={directive}
                            onChange={(e) => setDirective(e.target.value)}
                            className={`w-full rounded-xl px-4 py-3 font-black text-[10px] border-2 outline-none transition-all ${s.input}`}
                          >
                            <option>Referred to Treatment</option>
                            <option>Referred to Cross-Consult</option>
                            <option>Discharge</option>
                          </select>
                        </div>
                        {directive === 'Referred to Treatment' && (
                          <div className="space-y-2">
                            <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Treatment Station</label>
                            <select 
                              value={targetTreatmentType}
                              onChange={(e) => setTargetTreatmentType(e.target.value)}
                              className={`w-full rounded-xl px-4 py-3 font-black text-[10px] border-2 outline-none transition-all ${s.input}`}
                            >
                              {TREATMENT_TYPES.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="space-y-2">
                          <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>ICD-10 Code</label>
                          <input 
                            type="text"
                            value={diagnosisICD}
                            onChange={(e) => setDiagnosisICD(e.target.value)}
                            placeholder="e.g. K29.5"
                            className={`w-full rounded-xl px-4 py-3 font-black text-[10px] border-2 outline-none transition-all ${s.input}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Findings & Directive</label>
                      <textarea
                        value={prescription}
                        onChange={(e) => setPrescription(e.target.value)}
                        placeholder="Symptoms, diagnosis, medical plan..."
                        rows={4}
                        className={`w-full rounded-2xl px-6 py-4 font-black text-xs sm:text-sm resize-none border-2 outline-none transition-all ${s.input} focus:ring-4 focus:ring-[#0071e3]/20 shadow-inner`}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={handleAdmit}
                        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all active:scale-95 shadow-sm ${s.badge} hover:bg-[#0071e3]/5`}
                      >
                        IPD
                      </button>
                      <button 
                        onClick={handleConsent}
                        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all active:scale-95 shadow-sm ${s.badge} hover:bg-[#0071e3]/5`}
                      >
                        CONSENT
                      </button>
                      <button 
                        onClick={() => mockFirestore.updatePatient(currentPatient.id, { dietPlan: 'Liquid Diet' })}
                        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all active:scale-95 shadow-sm ${s.badge} hover:bg-[#0071e3]/5`}
                      >
                        DIET
                      </button>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={handleComplete}
                        disabled={!prescription}
                        className={`flex-1 py-4 rounded-2xl font-black transition-all uppercase tracking-[0.3em] text-[10px] shadow-xl disabled:opacity-50 active:scale-95 ${theme === 'light' ? 'bg-[#0071e3] text-white hover:bg-[#0077ed]' : 'bg-[#0A84FF] text-white hover:bg-[#409fff]'}`}
                      >
                        FINISH
                      </button>
                      <button 
                        onClick={handleSkip}
                        className={`px-6 py-4 rounded-2xl font-black transition-all uppercase tracking-[0.3em] text-[10px] border-2 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white shadow-lg active:scale-95`}
                      >
                        SKIP
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 sm:py-24 text-center space-y-6">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto text-4xl border-2 animate-bounce shadow-xl ${s.btn}`}>⏳</div>
              <div>
                <h4 className={`text-xl sm:text-2xl font-black uppercase tracking-tight mb-2 ${s.header}`}>Station Idle</h4>
                <p className={`text-[8px] font-black uppercase tracking-widest max-w-xs mx-auto opacity-40 leading-relaxed ${s.sub}`}>
                  Room {currentRosterItem?.roomNumber || doctor?.section} awaiting patient.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className={`p-6 rounded-[2rem] border shadow-lg ${s.card}`}>
          <div className="flex justify-between items-center mb-4">
             <h3 className={`text-sm font-black uppercase tracking-tight ${s.header}`}>Door Queue ({innerQueue.length})</h3>
             <button onClick={() => setActiveDoctorId('')} className={`text-[8px] font-black uppercase tracking-[0.2em] transition-all px-4 py-1.5 rounded-full border ${s.sub} hover:text-red-500 hover:border-red-500/30 active:scale-95`}>EXIT</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {innerQueue.map((p, idx) => (
              <div 
                key={p.id} 
                onClick={() => setViewingPatient(p)}
                className={`p-4 rounded-2xl border flex items-center justify-between group shadow-sm active:scale-95 transition-all cursor-pointer hover:shadow-md ${idx === 0 ? 'border-[#0071e3] bg-[#0071e3]/5' : s.card}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border ${idx === 0 ? 'text-[#0071e3] border-[#0071e3]' : s.btn}`}>{idx === 0 ? 'IN' : idx + 1}</div>
                  <div>
                    <div className={`text-xs font-black truncate max-w-[100px] ${s.header}`}>{p.name}</div>
                    <div className={`text-[8px] font-black uppercase opacity-40 ${s.sub}`}>{p.id}</div>
                  </div>
                </div>
                {p.isPriority && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>}
              </div>
            ))}
          </div>
        </section>
        
        {/* Processed Registry */}
        <section className="space-y-4 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-black uppercase tracking-widest ${s.sub}`}>Processed Registry (Consultations Done)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 opacity-60 hover:opacity-100 transition-opacity">
            {patients.filter(p => p.assignedDoctorId === activeDoctorId && (p.status === PatientStatus.CONSULTATION_DONE || p.status === PatientStatus.ADMISSION_DESK || p.status === PatientStatus.WARD_ADMITTED))
              .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
              .slice(0, 8)
              .map((p) => (
                <div key={p.id} className={`p-3 rounded-xl border flex items-center gap-3 ${s.card} border-emerald-500/20 bg-emerald-500/5`}>
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">✓</div>
                   <div className="min-w-0">
                      <div className={`text-[10px] font-black uppercase truncate ${s.header}`}>{p.name}</div>
                      <div className={`text-[7px] font-bold uppercase tracking-tighter opacity-50 ${s.sub}`}>{p.status === PatientStatus.CONSULTATION_DONE ? 'Consulted' : 'Admitted'}</div>
                   </div>
                </div>
              ))
            }
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className={`p-6 rounded-[2rem] border shadow-lg ${s.card}`}>
          <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 opacity-40 ${s.sub}`}>Pipeline</h3>
          <div className="space-y-2">
             {waitingHall.slice(0, 4).map(p => (
               <div key={p.id} className={`p-3 rounded-xl border flex justify-between items-center opacity-70 ${s.btn}`}>
                  <div className="truncate pr-2">
                    <p className={`text-xs font-black truncate ${s.header}`}>{p.name}</p>
                    <p className={`text-[8px] font-black uppercase opacity-40 ${s.sub}`}>Wait {p.id}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-slate-400/30 border border-slate-400 animate-pulse shrink-0"></div>
               </div>
             ))}
             {waitingHall.length === 0 && (
               <p className={`text-[8px] font-black uppercase tracking-widest text-center py-4 opacity-20 ${s.sub}`}>Hall Empty</p>
             )}
          </div>
        </section>

        {message && <div className={`p-4 rounded-2xl text-center text-[10px] font-black border shadow-lg ${s.success}`}>{message}</div>}

        <section className={`p-6 rounded-[2rem] border shadow-lg ${s.card}`}>
          <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 text-red-500`}>MISSED</h3>
          <div className="space-y-2">
            {absentList.length > 0 ? absentList.slice(0, 3).map(p => (
              <div key={p.id} className={`p-3 rounded-xl border flex justify-between items-center ${s.btn}`}>
                <div className="truncate pr-2">
                   <span className={`text-xs font-black truncate block ${s.header}`}>{p.name}</span>
                   <span className={`text-[8px] font-black uppercase opacity-40 block ${s.sub}`}>{p.id}</span>
                </div>
                <button 
                  onClick={() => mockFirestore.prioritizePatient(p.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${s.badge}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            )) : (
              <p className="text-[8px] font-black uppercase tracking-widest opacity-20 text-center py-4">No Missed</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StaffDoctor;

