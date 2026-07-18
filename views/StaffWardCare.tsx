import React, { useState, useEffect } from 'react';
import { Patient, Bed, PatientStatus, PatientCategory } from '../types';
import { mockFirestore } from '../services/mockFirestore';

interface StaffWardCareProps {
  patients: Patient[];
}

const StaffWardCare: React.FC<StaffWardCareProps> = ({ patients }) => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [activeTab, setActiveTab] = useState<'BEDS' | 'DIETARY' | 'MEDS' | 'ROLLCALL'>('BEDS');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [medName, setMedName] = useState('');

  useEffect(() => {
    mockFirestore.getBeds().then(setBeds);
  }, []);

  const handleBedStatus = async (bedId: string, status: Bed['status'], pId?: string) => {
    await mockFirestore.updateBedStatus(bedId, status, pId);
    const updated = await mockFirestore.getBeds();
    setBeds(updated);
  };

  const addMed = async () => {
    if (selectedPatientId && medName) {
      await mockFirestore.addOutsideMeds(selectedPatientId, medName);
      setMedName('');
      alert('Medication logged as Zero-Cost Virtual Inventory');
    }
  };

  const ipdPatients = patients.filter(p => [PatientStatus.WARD_ADMITTED, PatientStatus.ICU_ADMITTED].includes(p.status));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-wrap gap-4 mb-8">
        {['BEDS', 'DIETARY', 'MEDS', 'ROLLCALL'].map(tab => (
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

      {activeTab === 'BEDS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {beds.map(bed => (
            <div key={bed.id} className={`glass p-6 rounded-3xl border ${
              bed.status === 'AVAILABLE' ? 'border-emerald-500/20' : 
              bed.status === 'CLEANING' ? 'border-yellow-500/20' : 'border-blue-500/20'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">{bed.type}</span>
                <div className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                  bed.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400' :
                  bed.status === 'CLEANING' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {bed.status}
                </div>
              </div>
              <h3 className="text-2xl font-black mb-2">{bed.id}</h3>
              <p className="text-xs text-slate-400 mb-6">Rate: ₹{bed.hourlyRate}/hr</p>
              
              {bed.status === 'AVAILABLE' ? (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Assign Patient</p>
                  <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm focus:outline-none focus:border-blue-500"
                    onChange={(e) => handleBedStatus(bed.id, 'OCCUPIED', e.target.value)}
                    value=""
                  >
                    <option value="" disabled>Select...</option>
                    {patients.filter(p => !p.bedId && p.category === PatientCategory.IPD).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              ) : bed.status === 'OCCUPIED' ? (
                <button 
                  onClick={() => handleBedStatus(bed.id, 'CLEANING')}
                  className="w-full py-3 bg-yellow-600/20 text-yellow-400 border border-yellow-500/20 rounded-xl text-xs font-black uppercase hover:bg-yellow-600/30 transition-all"
                >
                  Mark for Cleaning
                </button>
              ) : (
                <button 
                  onClick={() => handleBedStatus(bed.id, 'AVAILABLE')}
                  className="w-full py-3 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-black uppercase hover:bg-emerald-600/30 transition-all"
                >
                  Confirm Cleaned
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'DIETARY' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="glass p-8 rounded-[2.5rem] border border-blue-500/20 text-center">
            <div className="text-4xl mb-4">🥗</div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">Point-of-Care Tray Scan</h3>
            <p className="text-slate-400 text-sm mb-8">Scan RFID wristband before placing food tray</p>
            <div className="grid grid-cols-2 gap-4">
              {ipdPatients.map(p => (
                <button 
                  key={p.id}
                  className="p-6 bg-slate-900/60 rounded-3xl border border-slate-800 hover:border-emerald-500/40 transition-all group"
                  onClick={() => alert(`GREEN: Diet Verified for ${p.name}`)}
                >
                  <p className="text-left text-xs font-black uppercase text-slate-500 mb-1">Scan: {p.rfidTag}</p>
                  <p className="text-left font-bold text-slate-200">{p.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'MEDS' && (
        <div className="max-w-2xl mx-auto glass p-8 rounded-[2.5rem] border border-blue-500/20">
          <h3 className="text-xl font-black uppercase tracking-tight mb-6">"Outside Meds" Intake</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Select Patient</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 focus:outline-none focus:border-blue-500"
                value={selectedPatientId || ''}
                onChange={e => setSelectedPatientId(e.target.value)}
              >
                <option value="">Choose patient...</option>
                {ipdPatients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.rfidTag})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Medication Name / Batch</label>
              <input 
                type="text" 
                placeholder="e.g. Paracetamol 500mg Batch #22"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 focus:outline-none focus:border-blue-500"
                value={medName}
                onChange={e => setMedName(e.target.value)}
              />
            </div>
            <button 
              onClick={addMed}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20"
            >
              Log Virtual Inventory
            </button>
          </div>
        </div>
      )}

      {activeTab === 'ROLLCALL' && (
        <div className="glass p-8 rounded-[2.5rem] border border-blue-500/20">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Digital Roll-Call (2:00 AM)</h3>
              <p className="text-slate-400 text-xs mt-1 font-bold">Physical RFID scan required for every bed</p>
            </div>
            <div className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold text-slate-300">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="space-y-3">
            {ipdPatients.map(p => (
              <div key={p.id} className="flex items-center justify-between p-5 bg-slate-900/40 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                    {p.bedId?.replace('BED-', '')}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">{p.name}</h4>
                    <p className="text-[10px] uppercase font-black text-slate-500">{p.rfidTag}</p>
                  </div>
                </div>
                <button className="px-6 py-2 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600/20 transition-all">
                  Confirm Scan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffWardCare;
