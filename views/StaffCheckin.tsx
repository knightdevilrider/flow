
import React, { useState, useEffect, useRef } from 'react';
import { Patient, PatientStatus, Section, Theme } from '../types';
import { mockFirestore } from '../services/mockFirestore';
import { DOCTORS } from '../constants';

interface StaffCheckinProps {
  patients: Patient[];
  theme: Theme;
  isAdmin?: boolean;
  onEditPatient?: (p: Patient) => void;
  onDeletePatient?: (p: Patient) => void;
}

const StaffCheckin: React.FC<StaffCheckinProps> = ({ patients, theme, isAdmin, onEditPatient, onDeletePatient }) => {
  const [selectedSection, setSelectedSection] = useState<Section | ''>('');
  const [message, setMessage] = useState('');
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

  // Pool of people who have paid but aren't checked in yet
  const availableToCall = patients.filter(p => p.status === PatientStatus.PAYMENT_DONE && !p.isAbsent);
  
  // People currently at the Check In station waiting for hall assignment
  const currentAtStation = patients.filter(p => p.status === PatientStatus.CHECKIN_WAITING && !p.checkinSection);
  
  // The first person actually at the desk
  const currentPatient = currentAtStation[0];
  
  const absentList = patients.filter(p => p.status === PatientStatus.PAYMENT_DONE && p.isAbsent);

  // AUTO-FLOW: If the desk is empty, automatically call the next person who paid
  useEffect(() => {
    if (currentAtStation.length === 0 && availableToCall.length > 0 && !isProcessingAutoCall.current) {
      const autoIntake = async () => {
        isProcessingAutoCall.current = true;
        const next = availableToCall[0];
        try {
          setMessage(`Auto-Calling: ${next.name}`);
          await mockFirestore.callPatient(next.id, PatientStatus.CHECKIN_WAITING, patients);
          setTimeout(() => {
            isProcessingAutoCall.current = false;
            setMessage('');
          }, 1500);
        } catch (err) {
          isProcessingAutoCall.current = false;
        }
      };
      autoIntake();
    }
  }, [patients, currentAtStation.length, availableToCall]);

  const handleSkip = async () => {
    if (currentPatient) {
      await mockFirestore.skipPatient(currentPatient.id);
      await mockFirestore.updatePatient(currentPatient.id, { status: PatientStatus.PAYMENT_DONE });
    }
  };

  const handleCheckinComplete = async () => {
    if (!currentPatient || !selectedSection) return;
    await mockFirestore.updatePatient(currentPatient.id, {
      checkinSection: selectedSection as Section,
      status: PatientStatus.CHECKIN_WAITING
    });
    setMessage(`Check In complete for ${currentPatient.name}`);
    setSelectedSection('');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
      <div className="lg:col-span-2 space-y-6 sm:space-y-10">
        <section className={`p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border shadow-2xl relative overflow-hidden ${s.card}`}>
          <div className={`absolute top-0 right-0 px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-bl-[2rem] shadow-inner ${theme === 'light' ? 'bg-[#F5F5F7] text-[#86868b]' : 'bg-[#2D2D2D] text-[#86868b]'}`}>Check In Control</div>
          
          {currentPatient ? (
            <div className="flex flex-col sm:flex-row gap-10 sm:gap-16 items-center animate-in slide-in-from-bottom-4 duration-500">
              <div className={`w-40 h-40 sm:w-64 sm:h-64 rounded-[3rem] sm:rounded-[4rem] overflow-hidden border-8 shadow-2xl shrink-0 transition-transform ${theme === 'light' ? 'border-white' : 'border-[#333]'}`}>
                {currentPatient.photo ? (
                  <img src={currentPatient.photo} alt={currentPatient.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-7xl sm:text-9xl ${s.btn}`}>👤</div>
                )}
              </div>
              <div className="flex-1 w-full space-y-8">
                <div>
                  <h3 className={`text-4xl sm:text-6xl font-black tracking-tight leading-none ${s.header}`}>{currentPatient.name}</h3>
                  <p className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mt-3 sm:mt-5 ${s.sub}`}>Patient Profile: {currentPatient.id}</p>
                </div>
                <div className={`px-6 py-3 rounded-2xl sm:rounded-3xl border-2 inline-flex items-center gap-3 shadow-inner ${s.btn}`}>
                  <span className="w-2 h-2 rounded-full bg-[#0A84FF] animate-pulse"></span>
                  <p className="text-xs sm:text-sm font-black tracking-tight">
                    Consultant: Dr. {DOCTORS.find(d => d.id === currentPatient.assignedDoctorId)?.name}
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`block text-[10px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Triage Urgency</label>
                      <select 
                        value={currentPatient.triageUrgency || 'Green_Routine'} 
                        onChange={(e) => mockFirestore.updatePatient(currentPatient.id, { triageUrgency: e.target.value as any })}
                        className={`w-full rounded-xl px-4 py-3 font-black border-2 outline-none transition-all text-xs ${s.input}`}
                      >
                        <option value="Red_Critical">Red_Critical</option>
                        <option value="Yellow_Urgent">Yellow_Urgent</option>
                        <option value="Green_Routine">Green_Routine</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-[10px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>NABH Compliance</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => mockFirestore.updatePatient(currentPatient.id, { nabhPainAssessmentDone: !currentPatient.nabhPainAssessmentDone })}
                          className={`py-3 rounded-xl font-black text-[9px] border-2 transition-all ${currentPatient.nabhPainAssessmentDone ? 'bg-emerald-500 text-white border-emerald-500' : s.btn}`}
                        >
                          PAIN ASMT
                        </button>
                        <button 
                          onClick={() => mockFirestore.updatePatient(currentPatient.id, { triageHighRiskAlert: !currentPatient.triageHighRiskAlert })}
                          className={`py-3 rounded-xl font-black text-[9px] border-2 transition-all ${currentPatient.triageHighRiskAlert ? 'bg-red-500 text-white border-red-500' : s.btn}`}
                        >
                          HIGH RISK
                        </button>
                      </div>
                      <div className="mt-2">
                        <label className={`block text-[8px] font-black uppercase tracking-widest opacity-40 mb-1`}>Initial Asmt (Min)</label>
                        <input 
                          type="number"
                          value={currentPatient.nabhInitialAssessmentTimeMins || 0}
                          onChange={(e) => mockFirestore.updatePatient(currentPatient.id, { nabhInitialAssessmentTimeMins: +e.target.value })}
                          className={`w-full rounded-xl px-4 py-2 font-black border-2 outline-none transition-all text-xs ${s.input}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className={`block text-[10px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Assign Clinical Section</label>
                    <div className="grid grid-cols-3 gap-3 sm:gap-6">
                      {(['A', 'B', 'C'] as Section[]).map(se => (
                        <button
                          key={se}
                          onClick={() => setSelectedSection(se)}
                          className={`py-4 sm:py-6 rounded-2xl sm:rounded-3xl font-black border-2 transition-all text-sm sm:text-xl shadow-sm active:scale-95 ${selectedSection === se ? (theme === 'light' ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-[#0071e3]/30' : 'bg-[#0A84FF] text-white border-[#0A84FF] shadow-[#0A84FF]/30') : s.btn}`}
                        >
                          {se}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <button 
                      onClick={handleCheckinComplete}
                      disabled={!selectedSection}
                      className={`flex-1 py-6 sm:py-8 rounded-[2rem] sm:rounded-[2.5rem] font-black transition-all uppercase tracking-[0.4em] text-xs sm:text-sm shadow-2xl disabled:opacity-50 active:scale-95 ${theme === 'light' ? 'bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-[#0071e3]/30' : 'bg-[#0A84FF] text-white hover:bg-[#409fff] shadow-[#0A84FF]/30'}`}
                    >
                      CONFIRM ENTRY
                    </button>
                    <button 
                      onClick={handleSkip}
                      className={`px-8 sm:px-12 py-6 sm:py-8 rounded-[2rem] sm:rounded-[2.5rem] font-black transition-all uppercase tracking-[0.4em] text-xs sm:text-sm border-2 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white shadow-xl active:scale-95 transition-all`}
                    >
                      ABSENT
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 sm:py-32 text-center space-y-8">
              <div className="text-7xl sm:text-9xl mb-6 opacity-10 animate-pulse">⏳</div>
              <div>
                <h4 className={`text-2xl sm:text-4xl font-black uppercase tracking-tight mb-4 ${s.header}`}>System Standby</h4>
                <p className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] max-w-xs mx-auto opacity-40 leading-relaxed ${s.sub}`}>
                  The intake bridge is waiting for verified payments to proceed.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-8">
          <h3 className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${s.header}`}>Registry Pipeline ({availableToCall.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {availableToCall.slice(0, 4).map((p, idx) => (
              <div key={p.id} className={`p-6 sm:p-8 rounded-[2rem] border-2 flex items-center justify-between opacity-50 shadow-sm transition-all ${s.card}`}>
                <div className="flex items-center gap-5">
                  <span className={`text-xs sm:text-xl font-black opacity-30 ${s.sub}`}>{String(idx + 1).padStart(2, '0')}</span>
                  <div>
                    <div className={`text-base sm:text-xl font-black ${s.header}`}>{p.name}</div>
                    <div className={`text-[9px] sm:text-xs font-black uppercase tracking-widest ${s.sub}`}>{p.id}</div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-white/5 bg-black/5 flex items-center justify-center text-[10px]">🔒</div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Processed Registry */}
        <section className="space-y-4 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-black uppercase tracking-widest ${s.sub}`}>Processed Registry (Check In Done)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 opacity-60 hover:opacity-100 transition-opacity">
            {patients.filter(p => p.status === PatientStatus.CHECKIN_WAITING && p.checkinSection)
              .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
              .slice(0, 8)
              .map((p) => (
                <div key={p.id} className={`p-3 rounded-xl border flex items-center gap-3 ${s.card} border-emerald-500/20 bg-emerald-500/5`}>
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">✓</div>
                   <div className="min-w-0">
                      <div className={`text-[10px] font-black uppercase truncate ${s.header}`}>{p.name}</div>
                      <div className={`text-[7px] font-bold uppercase tracking-tighter opacity-50 ${s.sub}`}>Section {p.checkinSection} Assigned</div>
                   </div>
                </div>
              ))
            }
          </div>
        </section>
      </div>

      <div className="space-y-6 sm:space-y-10">
        <section className={`p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border shadow-2xl ${s.card}`}>
          <h3 className={`text-[10px] sm:text-[12px] font-black uppercase tracking-widest mb-8 text-red-500`}>ABSENT RECOVERY</h3>
          <div className="space-y-4">
            {absentList.length > 0 ? absentList.map(p => (
              <div key={p.id} className={`p-6 rounded-[2rem] border-2 flex justify-between items-center ${s.btn} shadow-sm hover:shadow-md transition-all`}>
                <div className="flex flex-col">
                   <span className={`text-base font-black tracking-tight ${s.header}`}>{p.name}</span>
                   <span className={`text-[10px] font-black uppercase opacity-40 ${s.sub}`}>{p.id}</span>
                </div>
                <button 
                   onClick={() => mockFirestore.prioritizePatient(p.id)}
                   className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90 ${s.badge}`}
                >
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            )) : (
              <p className="text-[10px] font-black uppercase tracking-widest opacity-20 text-center py-10">No recent misses</p>
            )}
          </div>
        </section>
        {message && <div className={`p-8 rounded-[2rem] text-center text-xs sm:text-sm font-black animate-pulse border-2 shadow-xl ${s.success}`}>{message}</div>}
      </div>
    </div>
  );
};

export default StaffCheckin;

