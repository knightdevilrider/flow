
import React, { useState } from 'react';
import { Patient, PatientStatus, Theme } from '../types';
import { mockFirestore } from '../services/mockFirestore';
import PatientContactModal from '../components/PatientContactModal';

interface StaffMedicalProps {
  patients: Patient[];
  theme: Theme;
  isAdmin?: boolean;
  onEditPatient?: (p: Patient) => void;
  onDeletePatient?: (p: Patient) => void;
}

const StaffMedical: React.FC<StaffMedicalProps> = ({ patients, theme, isAdmin, onEditPatient, onDeletePatient }) => {
  const [message, setMessage] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);
  const [prescribedCount, setPrescribedCount] = useState(0);
  const [dispensedCount, setDispensedCount] = useState(0);
  const [isSubstitution, setIsSubstitution] = useState(false);
  const [isStockOut, setIsStockOut] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);

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

  const currentPatient = patients.find(p => [PatientStatus.TREATMENT, PatientStatus.MEDICINE_WAITING].includes(p.status));
  const queue = patients.filter(p => [PatientStatus.CONSULTATION_DONE, PatientStatus.TREATMENT].includes(p.status) && !p.isAbsent);
  const absentList = patients.filter(p => p.status === PatientStatus.CONSULTATION_DONE && p.isAbsent);
  
  const isLabMode = currentPatient?.status === PatientStatus.TREATMENT;

  const handleCallNext = async () => {
    // Priority 1: Call for Pharmacy if any
    let next = mockFirestore.getNextInQueue(patients, PatientStatus.CONSULTATION_DONE);
    // Priority 2: Call for Lab if any
    if (!next) next = patients.find(p => p.status === PatientStatus.TREATMENT && !p.isAbsent);

    if (next) {
      const targetStatus = next.status === PatientStatus.TREATMENT ? PatientStatus.TREATMENT : PatientStatus.MEDICINE_WAITING;
      await mockFirestore.callPatient(next.id, targetStatus, patients);
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
    
    if (isLabMode) {
      await mockFirestore.updatePatientAudited(currentPatient.id, {
        status: PatientStatus.DOCTOR_RECONSULT,
        // Mocking some lab metrics for the audit trail
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
    } else {
      await mockFirestore.updatePatientAudited(currentPatient.id, { 
        status: PatientStatus.COMPLETED,
        prescribedItemsCount: prescribedCount,
        dispensedItemsCount: dispensedCount,
        prescriptionSubstitutionFlag: isSubstitution
      }, 'Pharmacy Dispensing Completed', 'PHARMACIST_ID_7');
    }
    
    setTimeout(() => {
      setIsArchiving(false);
      setMessage(isLabMode ? 'Lab Results Sent' : 'Completed & Synced');
      setTimeout(handleCallNext, 1000);
    }, 2000);
  };

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
          <div className={`absolute top-0 right-0 px-6 py-2 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl shadow-lg ${isLabMode ? 'bg-cyan-600' : 'bg-pink-600'}`}>
            {isLabMode ? 'Clinical Lab / Investigation' : 'Pharmacy Fulfillment'}
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
                  <h4 className={`text-[8px] font-black uppercase tracking-widest mb-2 opacity-40 ${s.sub}`}>Medical Directives</h4>
                  <p className={`text-lg sm:text-xl font-black tracking-tight leading-tight ${s.header}`}>"{currentPatient.directive || currentPatient.prescription}"</p>
                </div>

                {!isLabMode && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Items Prescribed</label>
                        <input 
                          type="number"
                          value={prescribedCount}
                          onChange={(e) => setPrescribedCount(+e.target.value)}
                          className={`w-full rounded-xl px-4 py-3 font-black text-xs border-2 outline-none transition-all ${s.input}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Items Dispensed</label>
                        <input 
                          type="number"
                          value={dispensedCount}
                          onChange={(e) => setDispensedCount(+e.target.value)}
                          className={`w-full rounded-xl px-4 py-3 font-black text-xs border-2 outline-none transition-all ${s.input} ${prescribedCount !== dispensedCount ? 'border-red-500/30' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => setIsSubstitution(!isSubstitution)}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] border-2 transition-all ${isSubstitution ? 'bg-amber-500 text-white border-amber-500' : s.btn}`}
                      >
                        SUBSTITUTION {isSubstitution ? 'YES' : 'NO'}
                      </button>
                      <button 
                        onClick={() => setIsStockOut(!isStockOut)}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] border-2 transition-all ${isStockOut ? 'bg-red-500 text-white border-red-500' : s.btn}`}
                      >
                        STOCK OUT {isStockOut ? 'YES' : 'NO'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={handleDispense}
                    disabled={isArchiving}
                    className={`flex-1 py-4 rounded-2xl font-black transition-all uppercase tracking-[0.3em] text-[10px] shadow-xl disabled:opacity-50 active:scale-95 ${isLabMode ? 'bg-cyan-600' : 'bg-emerald-600'} text-white`}
                  >
                    {isArchiving ? 'RECORDING...' : isLabMode ? 'SUBMIT RESULTS' : 'FINALIZE DISCHARGE'}
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
          <h3 className={`text-xs font-black uppercase tracking-tight mb-4 ${s.header}`}>Supply Queue ({queue.length})</h3>
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
            <h3 className={`text-sm font-black uppercase tracking-widest ${s.sub}`}>Processed Registry (Fulfillment Done)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 opacity-60 hover:opacity-100 transition-opacity">
            {patients.filter(p => p.status === PatientStatus.COMPLETED || p.status === PatientStatus.DOCTOR_RECONSULT)
              .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
              .slice(0, 8)
              .map((p) => (
                <div key={p.id} className={`p-3 rounded-xl border flex items-center gap-3 ${s.card} border-emerald-500/20 bg-emerald-500/5`}>
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">✓</div>
                   <div className="min-w-0">
                      <div className={`text-[10px] font-black uppercase truncate ${s.header}`}>{p.name}</div>
                      <div className={`text-[7px] font-bold uppercase tracking-tighter opacity-50 ${s.sub}`}>{p.status === PatientStatus.COMPLETED ? 'Meds Dispensed' : 'Lab Done'}</div>
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

export default StaffMedical;

