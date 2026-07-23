import React, { useState } from 'react';
import { Patient, PatientStatus, Theme } from '../types';
import { mockFirestore } from '../services/mockFirestore';
import PatientContactModal from '../components/PatientContactModal';

interface StaffBillingProps {
  patients: Patient[];
  theme: Theme;
  isAdmin?: boolean;
  onEditPatient?: (p: Patient) => void;
  onDeletePatient?: (p: Patient) => void;
}

const BillingCard: React.FC<{ 
  patient: Patient, 
  onSettle: (p: Patient) => void, 
  onView: (p: Patient) => void,
  theme: Theme,
  s: any
}> = ({ patient, onSettle, onView, theme, s }) => {
  const [billForm, setBillForm] = useState({
    bed: 2500,
    meds: 1200,
    consult: 500,
    proc: 0,
    other: 150,
    discount: 0,
    feedback: 5,
    mode: 'Cash' as any
  });

  const total = billForm.bed + billForm.meds + billForm.consult + billForm.proc + billForm.other - billForm.discount;

  return (
    <div className={`p-6 rounded-[2.5rem] border transition-all shadow-xl space-y-6 ${s.card}`}>
      <div className="flex justify-between items-start">
        <div onClick={() => onView(patient)} className="cursor-pointer hover:text-blue-500 transition-colors">
          <h4 className={`text-xl font-black tracking-tight ${s.header}`}>{patient.name}</h4>
          <p className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ${s.sub}`}>Settlement Required</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${s.badge}`}>
           Lounge
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="space-y-1">
            <label className="text-[8px] font-black uppercase opacity-40">Bed Charges</label>
            <input type="number" value={billForm.bed} onChange={e => setBillForm({...billForm, bed: +e.target.value})} className={`w-full p-2 rounded-xl border text-xs font-black ${s.input}`} />
         </div>
         <div className="space-y-1">
            <label className="text-[8px] font-black uppercase opacity-40">Medication</label>
            <input type="number" value={billForm.meds} onChange={e => setBillForm({...billForm, meds: +e.target.value})} className={`w-full p-2 rounded-xl border text-xs font-black ${s.input}`} />
         </div>
         <div className="space-y-1">
            <label className="text-[8px] font-black uppercase opacity-40">Consultation</label>
            <input type="number" value={billForm.consult} onChange={e => setBillForm({...billForm, consult: +e.target.value})} className={`w-full p-2 rounded-xl border text-xs font-black ${s.input}`} />
         </div>
         <div className="space-y-1">
            <label className="text-[8px] font-black uppercase opacity-40">Procedures</label>
            <input type="number" value={billForm.proc} onChange={e => setBillForm({...billForm, proc: +e.target.value})} className={`w-full p-2 rounded-xl border text-xs font-black ${s.input}`} />
         </div>
      </div>

      <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-dashed border-opacity-20">
         <div className="flex-1">
            <p className="text-[8px] font-black uppercase opacity-40">Total Settlement</p>
            <p className={`text-2xl font-black ${s.accent}`}>₹{total.toLocaleString()}</p>
         </div>
         <select 
            value={billForm.mode}
            onChange={e => setBillForm({...billForm, mode: e.target.value as any})}
            className={`px-4 py-2 rounded-xl border text-[10px] font-black ${s.input}`}
          >
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Insurance">Insurance</option>
          </select>
      </div>

      <button 
        onClick={() => onSettle(patient)}
        className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-xl active:scale-95 bg-emerald-600 text-white hover:bg-emerald-500`}
      >
        CONFIRM SETTLEMENT
      </button>
    </div>
  );
};

const StaffBilling: React.FC<StaffBillingProps> = ({ patients, theme, isAdmin, onEditPatient, onDeletePatient }) => {
  const [activeTab, setActiveTab] = useState<'DISCHARGE' | 'EXIT_SENSORS'>('DISCHARGE');
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

  const handleMoveToLounge = async (p: Patient) => {
    await mockFirestore.updatePatientAudited(p.id, { 
      status: PatientStatus.DISCHARGE_LOUNGE 
    }, 'Clinical Discharge Order Signed. Moving to Lounge.', 'DR_SYSTEM');

    if (p.bedId) {
      await mockFirestore.updateBedStatus(p.bedId, 'CLEANING');
    }
  };

  const finalizeBill = async (p: Patient) => {
    await mockFirestore.updatePatientAudited(p.id, { 
      status: PatientStatus.DISCHARGED 
    }, 'Final Bill Paid & TPA Cleared. Patient Authorized to Exit.', 'BILLING_SYSTEM');
    
    await mockFirestore.updatePatient(p.id, { rfidTag: undefined });
  };

  const dischargeCandidates = patients.filter(p => [PatientStatus.WARD_ADMITTED, PatientStatus.ICU_ADMITTED, PatientStatus.READY_FOR_DISCHARGE].includes(p.status));
  const loungePatients = patients.filter(p => p.status === PatientStatus.DISCHARGE_LOUNGE);
  const exitingPatients = patients.filter(p => p.status === PatientStatus.DISCHARGED);

  return (
    <div className="space-y-6">
      <PatientContactModal 
        patient={viewingPatient} 
        onClose={() => setViewingPatient(null)} 
        isAdmin={isAdmin}
        onEdit={onEditPatient}
        onDelete={onDeletePatient}
      />
      <div className="flex gap-2 p-1.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#2D2D2D] w-fit border border-[#D2D2D7] dark:border-[#444] shadow-inner">
        {['DISCHARGE', 'EXIT_SENSORS'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2 rounded-xl font-black uppercase tracking-widest transition-all text-[9px] ${
              activeTab === tab 
              ? (theme === 'light' ? 'bg-white text-[#0071e3] shadow-md' : 'bg-[#1D1D1F] text-[#0A84FF] shadow-lg')
              : 'text-[#86868b] hover:opacity-80'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {activeTab === 'DISCHARGE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Wards -> Lounge */}
          <div className={`p-6 rounded-[2rem] border shadow-lg ${s.card}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-sm font-black uppercase tracking-tight flex items-center gap-3 ${s.header}`}>
                 <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm border shadow-inner ${s.badge}`}>1</span>
                 Pipeline
              </h3>
              <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${s.badge}`}>Queue</div>
            </div>
            <div className="space-y-3">
              {dischargeCandidates.length > 0 ? dischargeCandidates.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setViewingPatient(p)}
                  className={`p-4 rounded-2xl border flex justify-between items-center gap-4 group transition-all shadow-sm cursor-pointer hover:shadow-md ${s.btn}`}
                >
                  <div className="space-y-0.5 truncate">
                    <h4 className={`text-sm font-black tracking-tight truncate ${s.header}`}>{p.name}</h4>
                    <p className={`text-[8px] uppercase font-black tracking-widest opacity-40 truncate ${s.sub}`}>BED: {p.bedId} | {p.id}</p>
                  </div>
                  <button 
                    onClick={() => handleMoveToLounge(p)}
                    className={`px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[8px] transition-all shadow-lg active:scale-95 shrink-0 ${theme === 'light' ? 'bg-[#0071e3] text-white' : 'bg-[#0A84FF] text-white'}`}
                  >
                    LOUNGE
                  </button>
                </div>
              )) : (
                <div className="py-12 text-center space-y-2 opacity-20">
                  <div className="text-4xl">🛌</div>
                  <p className={`text-[8px] font-black uppercase tracking-widest ${s.sub}`}>No pending discharges</p>
                </div>
              )}
            </div>
          </div>

          {/* Lounge -> Final Bill */}
          <div className={`p-6 rounded-[2rem] border shadow-lg ${s.card}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-sm font-black uppercase tracking-tight flex items-center gap-3 ${s.header}`}>
                 <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm border shadow-inner ${s.badge}`}>2</span>
                 Settlement
              </h3>
              <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${s.badge}`}>Billing</div>
            </div>
            <div className="space-y-3">
              {loungePatients.length > 0 ? loungePatients.map(p => {
                const [billForm, setBillForm] = useState({
                  bed: 2500,
                  meds: 1200,
                  consult: 500,
                  proc: 0,
                  other: 150,
                  discount: 0,
                  feedback: 5,
                  mode: 'Cash' as any
                });

                const total = billForm.bed + billForm.meds + billForm.consult + billForm.proc + billForm.other - billForm.discount;

                return (
                  <div key={p.id} className={`p-6 rounded-[2.5rem] border transition-all shadow-xl space-y-6 ${s.card}`}>
                    <div className="flex justify-between items-start">
                      <div onClick={() => setViewingPatient(p)} className="cursor-pointer hover:text-blue-500 transition-colors">
                        <h4 className={`text-xl font-black tracking-tight ${s.header}`}>{p.name}</h4>
                        <p className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ${s.sub}`}>Settlement Required</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${s.badge}`}>
                         Lounge
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase opacity-40">Bed Charges</label>
                          <input type="number" value={billForm.bed} onChange={e => setBillForm({...billForm, bed: +e.target.value})} className={`w-full p-2 rounded-xl border text-xs font-black ${s.input}`} />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase opacity-40">Medication</label>
                          <input type="number" value={billForm.meds} onChange={e => setBillForm({...billForm, meds: +e.target.value})} className={`w-full p-2 rounded-xl border text-xs font-black ${s.input}`} />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase opacity-40">Consultation</label>
                          <input type="number" value={billForm.consult} onChange={e => setBillForm({...billForm, consult: +e.target.value})} className={`w-full p-2 rounded-xl border text-xs font-black ${s.input}`} />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase opacity-40">Procedures</label>
                          <input type="number" value={billForm.proc} onChange={e => setBillForm({...billForm, proc: +e.target.value})} className={`w-full p-2 rounded-xl border text-xs font-black ${s.input}`} />
                       </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-dashed border-opacity-20">
                       <div className="flex-1">
                          <p className="text-[8px] font-black uppercase opacity-40">Total Settlement</p>
                          <p className={`text-2xl font-black ${s.accent}`}>₹{total.toLocaleString()}</p>
                       </div>
                       <select 
                          value={billForm.mode}
                          onChange={e => setBillForm({...billForm, mode: e.target.value as any})}
                          className={`p-2 rounded-xl border text-[10px] font-black ${s.input}`}
                       >
                          <option>Cash</option>
                          <option>Card</option>
                          <option>UPI</option>
                          <option>NetBanking</option>
                       </select>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-dashed border-opacity-20">
                       <span className="text-[8px] font-black uppercase opacity-40">Patient Feedback</span>
                       <div className="flex gap-1">
                          {[1,2,3,4,5].map(star => (
                             <button 
                                key={star} 
                                onClick={() => setBillForm({...billForm, feedback: star})}
                                className={`text-xl transition-all ${billForm.feedback >= star ? 'grayscale-0 scale-110' : 'grayscale opacity-30'}`}
                             >
                                ⭐
                             </button>
                          ))}
                       </div>
                    </div>

                    <button 
                      onClick={async () => {
                        await mockFirestore.updatePatient(p.id, {
                          feedbackScore: billForm.feedback,
                          billingSummary: {
                            totalBedCharges: billForm.bed,
                            medicationCharges: billForm.meds,
                            consultationFees: billForm.consult,
                            procedureCharges: billForm.proc,
                            otherCharges: billForm.other,
                            discountAmount: billForm.discount,
                            taxAmount: total * 0.18, // GST
                            totalAmountPaid: total,
                            paymentMode: billForm.mode,
                            isPaid: true
                          }
                        });
                        await finalizeBill(p);
                      }}
                      className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 text-[10px] ${theme === 'light' ? 'bg-[#0071e3] text-white' : 'bg-[#0A84FF] text-white'}`}
                    >
                      COLLECT ₹{total} & AUTHORIZE EXIT
                    </button>
                  </div>
                );
              }) : (
                <div className="py-12 text-center space-y-2 opacity-20">
                  <div className="text-4xl">🛋️</div>
                  <p className={`text-[8px] font-black uppercase tracking-widest ${s.sub}`}>Lounge empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'EXIT_SENSORS' && (
        <div className="space-y-6">
          <section className={`p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border shadow-xl relative overflow-hidden ${s.card}`}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className={`text-xl sm:text-3xl font-black uppercase tracking-tighter text-red-500`}>EXIT MONITOR</h3>
                <p className={`text-[8px] font-black uppercase tracking-widest opacity-40 ${s.sub}`}>Real-time perimeter gate surveillance</p>
              </div>
              <div className="flex items-center gap-2 bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                <span className={`text-[10px] font-black uppercase tracking-widest text-red-500`}>Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-[2rem] border-2 border-dashed border-red-500/30 text-center group transition-all hover:bg-red-500/5 ${s.btn}`}>
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🚨</div>
                <h4 className="text-red-500 text-lg font-black uppercase tracking-tight mb-2 leading-none">RFID BREACH</h4>
                <p className={`text-[10px] mb-6 font-black uppercase tracking-widest opacity-60 leading-relaxed ${s.header}`}>Gate Alpha breach detected.</p>
                <button className={`w-full px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[8px] shadow-lg shadow-red-500/20 active:scale-95 ${theme === 'light' ? 'bg-red-500 text-white' : 'bg-red-600 text-white'}`}>DEPLOY</button>
              </div>
              
              <div className={`p-6 rounded-[2rem] border text-center flex flex-col shadow-inner ${s.card}`}>
                <div className="text-5xl mb-4">✅</div>
                <h4 className={`text-lg font-black uppercase tracking-tight mb-4 ${s.accent}`}>CLEARED</h4>
                <div className="space-y-2 flex-1">
                  {exitingPatients.length > 0 ? exitingPatients.slice(0, 3).map(p => (
                    <div key={p.id} className={`p-3 rounded-xl border flex justify-between items-center group transition-all hover:shadow-sm ${s.btn}`}>
                      <span className={`text-xs font-black tracking-tight truncate ${s.header}`}>{p.name}</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${s.badge}`}>CLEARED</span>
                    </div>
                  )) : (
                    <p className={`text-[8px] font-black uppercase tracking-widest opacity-20 py-8`}>Log empty</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Processed Registry */}
      <div className="w-full mt-12 pb-10 border-t border-white/5 pt-8">
        <h3 className={`text-sm font-black uppercase tracking-widest mb-6 ${s.sub}`}>Processed Registry (Settlements & Exits)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 opacity-70 hover:opacity-100 transition-opacity">
          {patients.filter(p => p.status === PatientStatus.DISCHARGED)
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, 8)
            .map((p) => (
              <div key={p.id} className={`p-3 rounded-xl border flex items-center gap-3 ${s.card} border-emerald-500/20 bg-emerald-500/5`}>
                 <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">✓</div>
                 <div className="min-w-0">
                    <div className={`text-[10px] font-black uppercase truncate ${s.header}`}>{p.name}</div>
                    <div className={`text-[7px] font-bold uppercase tracking-tighter opacity-50 ${s.sub}`}>Bill Settled • Exit Auth</div>
                 </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default StaffBilling;

