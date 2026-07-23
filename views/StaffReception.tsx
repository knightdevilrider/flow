
import React, { useState } from 'react';
import { Patient, PatientStatus, Theme, Doctor } from '../types';
import { mockFirestore } from '../services/mockFirestore';
import { DOCTORS } from '../constants';
import PatientContactModal from '../components/PatientContactModal';

interface StaffReceptionProps {
  patients: Patient[];
  theme: Theme;
  doctors: Doctor[];
  isAdmin?: boolean;
  onEditPatient?: (p: Patient) => void;
  onDeletePatient?: (p: Patient) => void;
}

const StaffReception: React.FC<StaffReceptionProps> = ({ patients, theme, doctors, isAdmin, onEditPatient, onDeletePatient }) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [message, setMessage] = useState('');
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

  const currentPatient = patients.find(p => p.status === PatientStatus.RECEPTION_WAITING);
  const queue = patients.filter(p => p.status === PatientStatus.GATE_REGISTERED && !p.isAbsent);

  const handleCallNext = async () => {
    const next = mockFirestore.getNextInQueue(patients, PatientStatus.GATE_REGISTERED);
    if (next) {
      await mockFirestore.callPatient(next.id, PatientStatus.RECEPTION_WAITING, patients);
      setMessage(`Calling ${next.name}`);
    } else {
      setMessage("Queue empty");
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleProcessPayment = async () => {
    if (!currentPatient || !selectedDoctorId) return;
    await mockFirestore.callPatient(currentPatient.id, PatientStatus.PAYMENT_DONE, patients);
    await mockFirestore.updatePatient(currentPatient.id, { assignedDoctorId: selectedDoctorId });
    setMessage(`Payment success for ${currentPatient.name}`);
    setSelectedDoctorId('');
    setTimeout(handleCallNext, 500); 
  };

  const admissionQueue = patients.filter(p => p.status === PatientStatus.ADMISSION_DESK);

  const handleIpAdmission = async (p: Patient) => {
    const rfid = `RFID_${Math.random().toString(36).substring(7).toUpperCase()}`;
    const qr = `QR_${Math.random().toString(36).substring(7).toUpperCase()}`;
    
    await mockFirestore.updatePatientAudited(p.id, {
      status: PatientStatus.WARD_ADMITTED,
      rfidTag: rfid,
      familyQrCode: qr,
      admissionTime: Date.now()
    }, 'Admission Desk: RFID Attached & Family QR Issued.', 'RECEPTION_STAFF');
    
    setMessage(`Admitted ${p.name}`);
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
        {/* IPD ADMISSION DESK - More compact */}
        {admissionQueue.length > 0 && (
          <section className={`p-6 rounded-[2rem] border shadow-lg ${s.card}`}>
            <h3 className={`text-sm font-black uppercase tracking-tight mb-4 ${s.accent}`}>IPD Admission Desk ({admissionQueue.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {admissionQueue.map(p => (
                <div key={p.id} className={`p-4 rounded-2xl border flex justify-between items-center gap-4 ${s.btn} shadow-sm hover:shadow-md transition-all`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border shadow-inner ${s.btn}`}>🏷️</div>
                    <div>
                      <h4 className={`font-black text-sm ${s.header}`}>{p.name}</h4>
                      <p className={`text-[8px] uppercase font-black tracking-widest ${s.sub}`}>ID: {p.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleIpAdmission(p)}
                    className={`px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all shadow-md active:scale-95 ${theme === 'light' ? 'bg-[#0071e3] text-white' : 'bg-[#0A84FF] text-white'}`}
                  >
                    Admit
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className={`p-6 sm:p-8 rounded-[2.5rem] border shadow-xl relative overflow-hidden ${s.card}`}>
          <div className={`absolute top-0 right-0 px-6 py-2 text-[8px] font-black uppercase tracking-widest rounded-bl-2xl shadow-inner ${theme === 'light' ? 'bg-[#F5F5F7] text-[#86868b]' : 'bg-[#2D2D2D] text-[#86868b]'}`}>Console Active</div>
          
          {currentPatient ? (
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-center">
              <div 
                onClick={() => setViewingPatient(currentPatient)}
                className={`w-32 h-32 sm:w-48 sm:h-48 rounded-[2rem] sm:rounded-[3rem] overflow-hidden border-4 shadow-xl shrink-0 cursor-pointer hover:scale-105 transition-transform ${theme === 'light' ? 'border-white' : 'border-[#333]'}`}
              >
                {currentPatient.photo ? <img src={currentPatient.photo} className="w-full h-full object-cover" /> : <div className={`w-full h-full flex items-center justify-center text-5xl sm:text-7xl ${s.btn}`}>👤</div>}
              </div>
              <div className="flex-1 w-full space-y-4">
                <div onClick={() => setViewingPatient(currentPatient)} className="cursor-pointer group">
                  <h3 className={`text-3xl sm:text-4xl font-black tracking-tight leading-tight ${s.header} group-hover:${s.accent} transition-colors`}>{currentPatient.name}</h3>
                  <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${s.sub}`}>ID: {currentPatient.id} • {currentPatient.age}Y • {currentPatient.gender}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`block text-[9px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Area / Pincode</label>
                      <div className="flex gap-2">
                        <input 
                          value={currentPatient.area || ''} 
                          onChange={(e) => mockFirestore.updatePatient(currentPatient.id, { area: e.target.value })}
                          placeholder="Area"
                          className={`flex-1 rounded-xl px-4 py-3 font-black outline-none border-2 transition-all text-[10px] ${s.input}`}
                        />
                        <input 
                          value={currentPatient.pincode || ''} 
                          onChange={(e) => mockFirestore.updatePatient(currentPatient.id, { pincode: e.target.value })}
                          placeholder="Pincode"
                          className={`w-24 rounded-xl px-4 py-3 font-black outline-none border-2 transition-all text-[10px] ${s.input}`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-[9px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Geographic Zone</label>
                      <select 
                        value={currentPatient.geographicZone || 'Urban-Ahmednagar'} 
                        onChange={(e) => mockFirestore.updatePatient(currentPatient.id, { geographicZone: e.target.value as any })}
                        className={`w-full rounded-xl px-4 py-3 font-black outline-none border-2 transition-all text-[10px] ${s.input}`}
                      >
                        <option value="Urban-Ahmednagar">Urban-Ahmednagar</option>
                        <option value="Rural-Taluka">Rural-Taluka</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`block text-[9px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Payer Type</label>
                      <select 
                        value={currentPatient.payerType || 'Cash'} 
                        onChange={(e) => mockFirestore.updatePatient(currentPatient.id, { payerType: e.target.value as any })}
                        className={`w-full rounded-xl px-4 py-3 font-black outline-none border-2 transition-all text-[10px] ${s.input}`}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Insurance_TPA">Insurance_TPA</option>
                        <option value="Corporate">Corporate</option>
                        <option value="Govt_Scheme">Govt_Scheme (ABDM)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-[9px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>ABHA Status</label>
                      <div className="flex gap-2">
                        <select 
                          value={currentPatient.abhaStatus || 'Linked'} 
                          onChange={(e) => mockFirestore.updatePatient(currentPatient.id, { abhaStatus: e.target.value as any })}
                          className={`flex-1 rounded-xl px-4 py-3 font-black outline-none border-2 transition-all text-[10px] ${s.input}`}
                        >
                          <option value="Linked">Linked</option>
                          <option value="Failed">Failed</option>
                          <option value="Skipped">Skipped</option>
                        </select>
                        <input 
                          type="number"
                          value={currentPatient.abhaConsentFetchTimeSec || 0} 
                          onChange={(e) => mockFirestore.updatePatient(currentPatient.id, { abhaConsentFetchTimeSec: +e.target.value })}
                          placeholder="Sec"
                          className={`w-20 rounded-xl px-4 py-3 font-black outline-none border-2 transition-all text-[10px] ${s.input}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`block text-[9px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Assign Consultant</label>
                    <div className="relative">
                      <select 
                        value={selectedDoctorId} 
                        onChange={(e) => setSelectedDoctorId(e.target.value)} 
                        className={`w-full rounded-xl sm:rounded-2xl px-4 py-3 sm:py-4 font-black outline-none border-2 transition-all text-sm sm:text-lg appearance-none ${s.input} focus:ring-4 focus:ring-[#0071e3]/20 shadow-sm`}
                      >
                        <option value="">Select Doctor from Duty Roster...</option>
                        {doctors.map(d => <option key={d.id} value={d.id}>{d.name} (Sec {d.section})</option>)}
                      </select>
                    </div>
                  </div>
                  <button 
                    onClick={handleProcessPayment} 
                    disabled={!selectedDoctorId} 
                    className={`w-full py-4 sm:py-5 rounded-2xl font-black transition-all uppercase tracking-[0.3em] text-[10px] sm:text-xs shadow-xl disabled:opacity-50 active:scale-95 ${theme === 'light' ? 'bg-[#0071e3] text-white hover:bg-[#0077ed]' : 'bg-[#0A84FF] text-white hover:bg-[#409fff]'}`}
                  >
                    COMPLETE & CALL NEXT
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 sm:py-20 text-center">
              <button 
                onClick={handleCallNext} 
                className={`px-10 sm:px-16 py-4 sm:py-6 rounded-2xl sm:rounded-3xl font-black transition-all uppercase tracking-[0.3em] text-[10px] sm:text-xs shadow-xl active:scale-95 ${theme === 'light' ? 'bg-[#0071e3] text-white hover:bg-[#0077ed]' : 'bg-[#0A84FF] text-white hover:bg-[#409fff]'}`}
              >
                CALL NEXT PATIENT
              </button>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-black uppercase tracking-tight ${s.header}`}>Queue ({queue.length})</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {queue.slice(0, 6).map((p, idx) => (
              <div 
                key={p.id} 
                className={`p-4 rounded-2xl border flex items-center justify-between group cursor-pointer transition-all ${s.card} hover:scale-[1.02] active:scale-95 shadow-md`} 
                onClick={() => setViewingPatient(p)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border shadow-inner ${s.btn}`}>{idx + 1}</div>
                  <div>
                    <div className={`text-sm font-black transition-colors group-hover:${s.accent} ${s.header}`}>{p.name}</div>
                    <div className={`text-[8px] font-black tracking-widest uppercase opacity-40 ${s.sub}`}>{p.id}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Processed Registry */}
        <section className="space-y-4 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-black uppercase tracking-widest ${s.sub}`}>Processed Registry (Settled)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 opacity-60 hover:opacity-100 transition-opacity">
            {patients.filter(p => p.status === PatientStatus.PAYMENT_DONE)
              .sort((a, b) => (b.lastCalledTimestamp || 0) - (a.lastCalledTimestamp || 0))
              .slice(0, 8)
              .map((p) => (
                <div key={p.id} className={`p-3 rounded-xl border flex items-center gap-3 ${s.card} border-emerald-500/20 bg-emerald-500/5`}>
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">✓</div>
                   <div className="min-w-0">
                      <div className={`text-[10px] font-black uppercase truncate ${s.header}`}>{p.name}</div>
                      <div className={`text-[7px] font-bold uppercase tracking-tighter opacity-50 ${s.sub}`}>{p.assignedDoctorId ? 'Doctor Assigned' : 'Fee Paid'}</div>
                   </div>
                </div>
              ))
            }
          </div>
        </section>
      </div>

      <div className="space-y-6">
        {message && <div className={`p-4 rounded-2xl text-center text-[10px] font-black border-2 shadow-lg ${s.success}`}>{message}</div>}
        <section className={`p-6 rounded-[2rem] border shadow-xl ${s.card}`}>
           <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 opacity-40 ${s.sub}`}>Stats</h3>
           <div className="space-y-3">
              <div className={`p-4 rounded-2xl text-center border shadow-inner ${s.btn}`}>
                 <span className={`block text-2xl font-black tracking-tighter ${s.header}`}>{patients.filter(p => p.status === PatientStatus.PAYMENT_DONE).length}</span>
                 <span className={`text-[8px] font-black uppercase tracking-widest ${s.sub}`}>Settled</span>
              </div>
              <div className={`p-4 rounded-2xl text-center border shadow-inner ${s.btn}`}>
                 <span className={`block text-2xl font-black tracking-tighter ${s.accent}`}>{queue.length}</span>
                 <span className={`text-[8px] font-black uppercase tracking-widest ${s.sub}`}>Awaiting</span>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default StaffReception;

