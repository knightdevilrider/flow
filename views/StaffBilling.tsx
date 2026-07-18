import React, { useState } from 'react';
import { Patient, PatientStatus } from '../types';
import { mockFirestore } from '../services/mockFirestore';

interface StaffBillingProps {
  patients: Patient[];
}

const StaffBilling: React.FC<StaffBillingProps> = ({ patients }) => {
  const [activeTab, setActiveTab] = useState<'DISCHARGE' | 'EXIT_SENSORS'>('DISCHARGE');

  const handleMoveToLounge = async (p: Patient) => {
    // 1. Move patient to Lounge status
    await mockFirestore.updatePatientAudited(p.id, { 
      status: PatientStatus.DISCHARGE_LOUNGE 
    }, 'Clinical Discharge Order Signed. Moving to Lounge.', 'DR_SYSTEM');

    // 2. Free the bed immediately
    if (p.bedId) {
      await mockFirestore.updateBedStatus(p.bedId, 'CLEANING');
    }
  };

  const finalizeBill = async (p: Patient) => {
    await mockFirestore.updatePatientAudited(p.id, { 
      status: PatientStatus.DISCHARGED 
    }, 'Final Bill Paid & TPA Cleared. Patient Authorized to Exit.', 'BILLING_SYSTEM');
    
    // RFID is cut
    await mockFirestore.updatePatient(p.id, { rfidTag: undefined });
  };

  const dischargeCandidates = patients.filter(p => [PatientStatus.WARD_ADMITTED, PatientStatus.ICU_ADMITTED, PatientStatus.READY_FOR_DISCHARGE].includes(p.status));
  const loungePatients = patients.filter(p => p.status === PatientStatus.DISCHARGE_LOUNGE);
  const exitingPatients = patients.filter(p => p.status === PatientStatus.DISCHARGED);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex gap-4">
        {['DISCHARGE', 'EXIT_SENSORS'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'DISCHARGE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Wards -> Lounge */}
          <div className="glass p-8 rounded-[2.5rem] border border-blue-500/20">
            <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 text-sm">1</span>
              Discharge Flow
            </h3>
            <div className="space-y-4">
              {dischargeCandidates.map(p => (
                <div key={p.id} className="p-6 bg-slate-900/40 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex justify-between items-center group">
                  <div>
                    <h4 className="font-bold text-slate-200">{p.name}</h4>
                    <p className="text-[10px] uppercase font-black text-slate-500">Bed: {p.bedId} | RFID: {p.rfidTag}</p>
                  </div>
                  <button 
                    onClick={() => handleMoveToLounge(p)}
                    className="px-6 py-3 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-black uppercase hover:bg-indigo-600 text-white transition-all"
                  >
                    Move to Lounge
                  </button>
                </div>
              ))}
              {dischargeCandidates.length === 0 && <p className="text-center py-8 text-slate-500 text-sm italic">No pending discharge orders</p>}
            </div>
          </div>

          {/* Lounge -> Final Bill */}
          <div className="glass p-8 rounded-[2.5rem] border border-emerald-500/20">
            <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
              <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 text-sm">2</span>
              Discharge Lounge
            </h3>
            <div className="space-y-4">
              {loungePatients.map(p => (
                <div key={p.id} className="p-6 bg-slate-900/40 rounded-3xl border border-slate-800 hover:border-emerald-500/40 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-200">{p.name}</h4>
                      <p className="text-[10px] uppercase font-black text-slate-500">Waiting for TPA/Insurance</p>
                    </div>
                    <div className="animate-pulse bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-black uppercase">
                      In Lounge
                    </div>
                  </div>
                  <button 
                    onClick={() => finalizeBill(p)}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20"
                  >
                    Clear Final Bill & TPA
                  </button>
                </div>
              ))}
              {loungePatients.length === 0 && <p className="text-center py-8 text-slate-500 text-sm italic">Lounge is currently empty</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'EXIT_SENSORS' && (
        <div className="space-y-6">
          <div className="glass p-8 rounded-[2.5rem] border border-red-500/10">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-red-500">Hospital Exit Sensors</h3>
                <p className="text-slate-400 text-xs mt-1 font-bold">Scanning for unauthorized RFID tags at main exit</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                <span className="text-xs font-black uppercase text-red-400">Live Monitor</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 border-dashed text-center">
                <div className="text-5xl mb-4">🚨</div>
                <h4 className="text-red-500 font-bold uppercase mb-2">Unauthorized Attempt</h4>
                <p className="text-slate-400 text-xs mb-6">Patient "John Doe" detected at Exit A without discharge status.</p>
                <button className="px-6 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase">Dispatch Security</button>
              </div>
              
              <div className="bg-emerald-500/5 p-8 rounded-3xl border border-emerald-500/20 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h4 className="text-emerald-500 font-bold uppercase mb-2">Authorized Exits</h4>
                <div className="space-y-2">
                  {exitingPatients.map(p => (
                    <div key={p.id} className="text-[10px] font-bold text-slate-400 flex justify-between px-4">
                      <span>{p.name}</span>
                      <span className="text-emerald-400">CLEARED AT {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</span>
                    </div>
                  ))}
                  {exitingPatients.length === 0 && <p className="text-[10px] text-slate-500">No authorized exits in last hour</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffBilling;
