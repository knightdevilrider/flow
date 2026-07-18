
import React, { useState, useEffect, useRef } from 'react';
import { Patient, PatientStatus, Section } from '../types';
import { mockFirestore } from '../services/mockFirestore';
import { DOCTORS } from '../constants';

interface StaffCheckinProps {
  patients: Patient[];
}

const StaffCheckin: React.FC<StaffCheckinProps> = ({ patients }) => {
  const [selectedSection, setSelectedSection] = useState<Section | ''>('');
  const [message, setMessage] = useState('');
  const isProcessingAutoCall = useRef(false);

  // Pool of people who have paid but aren't checked in yet
  const availableToCall = patients.filter(p => p.status === PatientStatus.PAYMENT_DONE && !p.isAbsent);
  
  // People currently at the Check-in station waiting for hall assignment
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
          setMessage(`Auto-Calling: ${next.name} (Payment Verified)`);
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
    setMessage(`Check-in complete for ${currentPatient.name}.`);
    setSelectedSection('');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {/* Auto Status Bar */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-500 border border-pink-500/20">🛰️</div>
              <div>
                 <p className="text-xs font-black text-white uppercase tracking-widest">Intake Status</p>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Monitoring Payment Queue</span>
                 </div>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Awaiting Verification</p>
              <p className="text-xl font-black text-white">{availableToCall.length} Pending</p>
           </div>
        </div>

        <section className="glass p-8 rounded-[2.5rem] border-2 border-pink-500/30 relative">
          <div className="absolute top-0 right-0 px-6 py-2 bg-pink-500 text-slate-950 text-[10px] font-black uppercase rounded-bl-2xl">
            Check-in Station
          </div>
          
          {currentPatient ? (
            <div className="flex flex-col md:flex-row gap-8 items-center animate-in slide-in-from-bottom-4 duration-500">
              <div className="w-40 h-40 rounded-3xl overflow-hidden border-4 border-pink-400/50 shadow-2xl flex-shrink-0 bg-slate-900">
                {currentPatient.photo ? (
                  <img src={currentPatient.photo} alt={currentPatient.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">👤</div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-4xl font-black text-white mb-1">{currentPatient.name}</h3>
                <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-4">ID: {currentPatient.id}</p>
                <p className="text-slate-400 font-bold mb-6 italic bg-slate-900/40 p-3 rounded-xl border border-slate-800 inline-block">
                  Assigned Consultant: {DOCTORS.find(d => d.id === currentPatient.assignedDoctorId)?.name}
                </p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Assign to Waiting Hall</label>
                    <div className="flex gap-2">
                      {(['A', 'B', 'C'] as Section[]).map(s => (
                        <button
                          key={s}
                          onClick={() => setSelectedSection(s)}
                          className={`flex-1 py-4 rounded-xl font-black border-2 transition-all ${selectedSection === s ? 'border-pink-500 bg-pink-500/10 text-pink-400' : 'border-slate-800 bg-slate-900 text-slate-500'}`}
                        >
                          Section {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={handleCheckinComplete}
                      disabled={!selectedSection}
                      className="flex-1 py-4 bg-pink-600 hover:bg-pink-500 disabled:opacity-30 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs shadow-xl shadow-pink-500/10"
                    >
                      Confirm Entry
                    </button>
                    <button 
                      onClick={handleSkip}
                      className="px-8 py-4 bg-red-600/10 hover:bg-red-600 text-red-500 border border-red-500/20 font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                    >
                      No Show
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="text-5xl mb-6 opacity-30">⏳</div>
              <h4 className="text-slate-500 font-black uppercase tracking-widest mb-2">Waiting for Patients</h4>
              <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">The system automatically calls patients as they finish payment.</p>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6">Upcoming Check-ins ({availableToCall.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableToCall.slice(0, 4).map((p, idx) => (
              <div key={p.id} className="glass p-4 rounded-2xl border border-slate-800 flex items-center justify-between opacity-50">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-slate-600">{idx + 1}</span>
                  <div>
                    <div className="text-sm font-bold text-white">{p.name}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">ID: {p.id}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="glass p-6 rounded-3xl border border-slate-800">
          <h3 className="text-sm font-black text-red-400 uppercase tracking-widest mb-6">Absent / Skipping</h3>
          <div className="space-y-3">
            {absentList.map(p => (
              <div key={p.id} className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex justify-between items-center">
                <div className="flex flex-col">
                   <span className="text-xs font-bold text-slate-300">{p.name}</span>
                   <span className="text-[8px] font-black text-slate-600">{p.id}</span>
                </div>
                <button 
                  onClick={() => mockFirestore.prioritizePatient(p.id)}
                  className="px-3 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-lg text-[9px] font-black uppercase"
                >
                  Prioritize
                </button>
              </div>
            ))}
          </div>
        </section>
        {message && <div className="p-4 bg-pink-500/10 text-pink-400 rounded-2xl border border-pink-500/20 text-center text-xs font-bold animate-pulse">{message}</div>}
      </div>
    </div>
  );
};

export default StaffCheckin;
