
import React, { useState } from 'react';
import { Patient, PatientStatus, Theme } from '../types';
import { mockFirestore } from '../services/mockFirestore';
import { TREATMENT_TYPES } from '../constants';
import PatientContactModal from '../components/PatientContactModal';

interface StaffTreatmentProps {
  patients: Patient[];
  theme: Theme;
  isAdmin?: boolean;
  onEditPatient?: (p: Patient) => void;
  onDeletePatient?: (p: Patient) => void;
}

const StaffTreatment: React.FC<StaffTreatmentProps> = ({ patients, theme, isAdmin, onEditPatient, onDeletePatient }) => {
  const [message, setMessage] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);
  const [treatmentResults, setTreatmentResults] = useState('');
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [selectedStation, setSelectedStation] = useState<string>('All');

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

  const allowedStatusesForStation = () => {
    return [PatientStatus.TREATMENT];
  };

  const currentPatient = patients.find(p => {
    if (!allowedStatusesForStation().includes(p.status)) return false;
    if (selectedStation === 'All') return p.status === PatientStatus.TREATMENT;
    return p.status === PatientStatus.TREATMENT && p.assignedTreatmentType === selectedStation;
  });
  
  const queue = patients.filter(p => {
    if (p.isAbsent) return false;
    if (selectedStation === 'All') return p.status === PatientStatus.TREATMENT;
    return p.status === PatientStatus.TREATMENT && p.assignedTreatmentType === selectedStation;
  });
  
  const absentList = patients.filter(p => {
    if (!p.isAbsent) return false;
    if (selectedStation === 'All') return p.status === PatientStatus.TREATMENT;
    return p.status === PatientStatus.TREATMENT && p.assignedTreatmentType === selectedStation;
  });
  
  const isLabMode = true;

  const handleCallNext = async () => {
    let next: Patient | undefined;
    
    if (selectedStation === 'All') {
      next = mockFirestore.getNextInQueue(patients, PatientStatus.TREATMENT);
    } else {
      next = patients.find(p => p.status === PatientStatus.TREATMENT && !p.isAbsent && p.assignedTreatmentType === selectedStation);
    }

    if (next) {
      await mockFirestore.callPatient(next.id, PatientStatus.TREATMENT, patients);
      setMessage(`Calling ${next.name}`);
    } else {
      setMessage("No pending cases");
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDispense = async () => {
    if (!currentPatient) return;
    setIsArchiving(true);
    setMessage('Recording fulfillment...');
    
    await mockFirestore.updatePatientAudited(currentPatient.id, {
      status: PatientStatus.DOCTOR_RECONSULT,
      treatmentResults,
      isPriorityReconsult: true,
      history: [
        ...currentPatient.history,
        {
          stage: PatientStatus.TREATMENT,
          entryTime: Date.now() - 300000,
          procedureStartTime: Date.now() - 240000,
          procedureExitTime: Date.now() - 60000,
          resultGenTime: Date.now() - 30000,
          handoverTime: Date.now(),
          exitTime: Date.now(),
          authorId: 'LAB_TECH_ID_4',
          slaBreach: false
        }
      ]
    }, 'Laboratory Investigation Completed', 'LAB_TECH_ID_4');
    
    setTimeout(() => {
      setIsArchiving(false);
      setMessage('Treatment Results Sent');
      setTreatmentResults('');
      setTimeout(handleCallNext, 1000);
    }, 2000);
  };

  if (selectedStation === 'All' && !currentPatient && queue.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12 sm:py-24 px-6 sm:px-10">
        <div className="text-center mb-12 sm:mb-20">
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#0071e3]/10 flex items-center justify-center mx-auto mb-8 shadow-inner">
            <span className="text-4xl sm:text-6xl">🏥</span>
          </div>
          <h2 className={`text-4xl sm:text-6xl font-black mb-4 uppercase tracking-tighter leading-none ${s.header}`}>Medical Station</h2>
          <p className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] opacity-40 ${s.sub}`}>Select your designated station</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {TREATMENT_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setSelectedStation(t)}
              className={`w-full py-6 sm:py-8 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-2 group ${s.card} hover:scale-[1.03] active:scale-95 shadow-lg hover:shadow-xl`}
            >
              <div className={`text-3xl sm:text-4xl mb-2`}>🔬</div>
              <div className={`text-sm sm:text-lg font-black text-cyan-600 transition-colors tracking-tight`}>{t}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
      <PatientContactModal 
        patient={viewingPatient} 
        onClose={() => setViewingPatient(null)} 
        isAdmin={isAdmin}
        onEdit={onEditPatient}
        onDelete={onDeletePatient}
      />
      <div className="lg:col-span-3 space-y-6">
        <section className={`p-6 sm:p-8 rounded-[2rem] border shadow-xl relative overflow-hidden ${s.card}`}>
          <div className={`absolute top-0 right-0 px-6 py-2 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl shadow-lg bg-cyan-600`}>
            Clinical Lab / Investigation
          </div>
          
          {currentPatient ? (
            <div className="flex flex-col sm:flex-row gap-8 items-center animate-in slide-in-from-bottom-4">
              <div 
                onClick={() => setViewingPatient(currentPatient)}
                className={`w-32 h-32 sm:w-48 sm:h-48 rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden border-4 shadow-lg shrink-0 transition-transform cursor-pointer hover:scale-105 active:scale-95 ${theme === 'light' ? 'border-white' : 'border-[#333]'}`}
              >
                {currentPatient.photo ? (
                  <img src={currentPatient.photo} alt={currentPatient.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-5xl sm:text-7xl ${s.btn}`}>👤</div>
                )}
              </div>
              <div className="flex-1 w-full space-y-4">
                <div>
                  <h3 
                    onClick={() => setViewingPatient(currentPatient)}
                    className={`text-3xl sm:text-4xl font-black tracking-tight leading-tight cursor-pointer hover:text-blue-500 transition-colors ${s.header}`}
                  >
                    {currentPatient.name}
                  </h3>
                  <p className={`text-[8px] font-black uppercase tracking-widest mt-2 ${s.sub}`}>ID: {currentPatient.id} • {isLabMode ? 'STG 5: INVESTIGATION' : 'STG 8: PHARMACY'}</p>
                </div>
                
                <div className={`p-6 rounded-2xl border-2 shadow-inner group transition-all ${s.btn}`}>
                  <h4 className={`text-[8px] font-black uppercase tracking-widest mb-2 opacity-40 ${s.sub}`}>Doctor's Directive</h4>
                  <p className={`text-lg sm:text-xl font-black tracking-tight leading-tight ${s.header}`}>"{currentPatient.directive}"</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Treatment Results / Notes</label>
                    <textarea 
                      value={treatmentResults}
                      onChange={(e) => setTreatmentResults(e.target.value)}
                      placeholder="Enter results, findings, or metrics..."
                      className={`w-full rounded-xl px-4 py-3 font-black text-sm border-2 outline-none transition-all resize-none h-24 ${s.input}`}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={handleDispense}
                    disabled={isArchiving}
                    className={`flex-1 py-4 rounded-2xl font-black transition-all uppercase tracking-[0.3em] text-[10px] shadow-xl disabled:opacity-50 active:scale-95 bg-cyan-600 text-white`}
                  >
                    {isArchiving ? 'RECORDING...' : 'SUBMIT RESULTS'}
                  </button>
                  <button 
                    onClick={handleCallNext}
                    className={`px-8 py-4 rounded-2xl font-black transition-all uppercase tracking-[0.3em] text-[10px] border-2 shadow-lg active:scale-95 ${s.btn}`}
                  >
                    SKIP
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 sm:py-24 text-center space-y-8">
              <div className="text-6xl sm:text-8xl opacity-10 animate-pulse">🧬</div>
              <div>
                <h4 className={`text-xl sm:text-2xl font-black uppercase tracking-tight mb-4 ${s.header}`}>Fulfillment</h4>
                <button 
                  onClick={handleCallNext}
                  className={`px-12 py-5 rounded-2xl font-black transition-all uppercase tracking-[0.3em] text-[10px] shadow-xl active:scale-95 ${theme === 'light' ? 'bg-[#0071e3] text-white' : 'bg-[#0A84FF] text-white'}`}
                >
                  CALL NEXT
                </button>
              </div>
            </div>
          )}
        </section>

        <section className={`p-6 rounded-[2rem] border shadow-lg ${s.card}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-xs font-black uppercase tracking-tight ${s.header}`}>
              Supply Queue ({queue.length})
            </h3>
            {selectedStation !== 'All' && (
              <button 
                onClick={() => setSelectedStation('All')} 
                className={`text-[8px] font-black uppercase tracking-[0.2em] transition-all px-4 py-1.5 rounded-full border ${s.sub} hover:text-red-500 hover:border-red-500/30 active:scale-95`}
              >
                EXIT STATION
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {queue.slice(0, 8).map((p, idx) => (
              <div 
                key={p.id} 
                onClick={() => setViewingPatient(p)}
                className={`p-4 rounded-xl border flex items-center gap-3 group transition-all shadow-sm active:scale-95 cursor-pointer hover:shadow-md ${s.btn} hover:scale-[1.02]`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border shrink-0 ${s.card}`}>{idx + 1}</div>
                <div className="truncate">
                  <div className={`text-[10px] font-black truncate ${s.header}`}>{p.name}</div>
                  <div className={`text-[8px] font-black uppercase opacity-40 ${s.sub}`}>{p.id}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Processed Registry */}
        <section className="space-y-4 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-black uppercase tracking-widest ${s.sub}`}>Processed Registry (Treatments Done)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 opacity-60 hover:opacity-100 transition-opacity">
            {patients.filter(p => p.status === PatientStatus.DOCTOR_RECONSULT)
              .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
              .slice(0, 8)
              .map((p) => (
                <div key={p.id} className={`p-3 rounded-xl border flex items-center gap-3 ${s.card} border-emerald-500/20 bg-emerald-500/5`}>
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">✓</div>
                   <div className="min-w-0">
                      <div className={`text-[10px] font-black uppercase truncate ${s.header}`}>{p.name}</div>
                      <div className={`text-[7px] font-bold uppercase tracking-tighter opacity-50 ${s.sub}`}>Lab Done</div>
                   </div>
                </div>
              ))
            }
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className={`p-6 rounded-[2rem] border shadow-lg ${s.card}`}>
          <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 text-red-500`}>MISSING</h3>
          <div className="space-y-2">
            {absentList.length > 0 ? absentList.slice(0, 4).map(p => (
              <div key={p.id} className={`p-3 rounded-xl border flex justify-between items-center shadow-sm ${s.btn}`}>
                <div className="truncate pr-2">
                   <span className={`text-[10px] font-black truncate block ${s.header}`}>{p.name}</span>
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
              <p className={`text-[8px] font-black uppercase tracking-widest opacity-20 text-center py-4 ${s.sub}`}>No pending recoveries</p>
            )}
          </div>
        </section>

        {message && <div className={`p-4 rounded-2xl text-center text-[10px] font-black border shadow-lg ${s.success}`}>{message}</div>}
      </div>
    </div>
  );
};

export default StaffTreatment;

