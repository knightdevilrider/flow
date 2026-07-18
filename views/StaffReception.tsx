
import React, { useState } from 'react';
import { Patient, PatientStatus } from '../types';
import { mockFirestore } from '../services/mockFirestore';
import { DOCTORS } from '../constants';
import PatientContactModal from '../components/PatientContactModal';

interface StaffReceptionProps {
  patients: Patient[];
}

const StaffReception: React.FC<StaffReceptionProps> = ({ patients }) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);

  const currentPatient = patients.find(p => p.status === PatientStatus.RECEPTION_WAITING);
  const queue = patients.filter(p => p.status === PatientStatus.GATE_REGISTERED && !p.isAbsent);

  const handleCallNext = async () => {
    const next = mockFirestore.getNextInQueue(patients, PatientStatus.GATE_REGISTERED);
    if (next) {
      await mockFirestore.callPatient(next.id, PatientStatus.RECEPTION_WAITING, patients);
      setMessage(`Calling ${next.name} (ID: ${next.id})`);
    } else {
      setMessage("No patients waiting.");
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleProcessPayment = async () => {
    if (!currentPatient || !selectedDoctorId) return;
    await mockFirestore.callPatient(currentPatient.id, PatientStatus.PAYMENT_DONE, patients);
    await mockFirestore.updatePatient(currentPatient.id, { assignedDoctorId: selectedDoctorId });
    setMessage(`Payment done for ${currentPatient.name}. Auto-calling next...`);
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
    
    setMessage(`Admitted ${p.name}. RFID: ${rfid}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <PatientContactModal patient={viewingPatient} onClose={() => setViewingPatient(null)} />
      
      <div className="lg:col-span-2 space-y-8">
        {/* IPD ADMISSION DESK */}
        {admissionQueue.length > 0 && (
          <section className="glass p-8 rounded-[2.5rem] border-2 border-emerald-500/30">
            <h3 className="text-xl font-black text-emerald-400 uppercase tracking-tight mb-6">IPD ADMISSION DESK (Pending: {admissionQueue.length})</h3>
            <div className="space-y-4">
              {admissionQueue.map(p => (
                <div key={p.id} className="p-6 bg-slate-900/40 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-2xl border border-emerald-500/20">🏷️</div>
                    <div>
                      <h4 className="font-bold text-white text-lg">{p.name}</h4>
                      <p className="text-[10px] uppercase font-black text-slate-500">Ordered by Dr. System</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleIpAdmission(p)}
                    className="w-full md:w-auto px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20"
                  >
                    Attach RFID & Issue QR
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="glass p-8 rounded-[2.5rem] border-2 border-indigo-500/30 relative">
          <div className="absolute top-0 right-0 px-6 py-2 bg-indigo-500 text-slate-950 text-[10px] font-black uppercase rounded-bl-2xl">RECEPTION CONSOLE</div>
          
          {currentPatient ? (
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div 
                onClick={() => setViewingPatient(currentPatient)}
                className="w-40 h-40 rounded-3xl overflow-hidden border-4 border-indigo-400/50 shadow-2xl shrink-0 bg-slate-900 cursor-pointer hover:scale-105 transition-transform"
              >
                {currentPatient.photo ? <img src={currentPatient.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-6xl">👤</div>}
              </div>
              <div className="flex-1">
                <h3 className="text-4xl font-black text-white" onClick={() => setViewingPatient(currentPatient)}>{currentPatient.name}</h3>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">ID: {currentPatient.id}</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Assign Consultant</label>
                    <select value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)} className="w-full bg-[#0b1121] border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select Doctor...</option>
                      {DOCTORS.map(d => <option key={d.id} value={d.id}>{d.name} (Sec {d.section})</option>)}
                    </select>
                  </div>
                  <button onClick={handleProcessPayment} disabled={!selectedDoctorId} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs">Complete & Next</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center">
              <button onClick={handleCallNext} className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all uppercase tracking-widest">Call First Patient</button>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6">Queue Pipeline ({queue.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queue.slice(0, 4).map((p, idx) => (
              <div key={p.id} className="glass p-4 rounded-2xl border border-slate-800 flex items-center justify-between group cursor-pointer" onClick={() => setViewingPatient(p)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center font-black text-indigo-500 border border-slate-700">{idx + 1}</div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{p.name}</div>
                    <div className="text-[9px] text-slate-500 font-black tracking-tight">{p.id}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        {message && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-center text-xs font-bold animate-in zoom-in-95">{message}</div>}
        <section className="glass p-6 rounded-3xl border border-slate-800">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Reception Summary</h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl text-center">
                 <span className="block text-2xl font-black text-white">{patients.filter(p => p.status === PatientStatus.PAYMENT_DONE).length}</span>
                 <span className="text-[8px] font-black text-slate-600 uppercase">Paid Today</span>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl text-center">
                 <span className="block text-2xl font-black text-indigo-400">{queue.length}</span>
                 <span className="text-[8px] font-black text-slate-600 uppercase">Waiting</span>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default StaffReception;
