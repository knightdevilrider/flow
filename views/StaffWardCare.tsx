import React, { useState, useEffect } from 'react';
import { Patient, Bed, PatientStatus, PatientCategory, Theme } from '../types';
import { mockFirestore } from '../services/mockFirestore';
import PatientContactModal from '../components/PatientContactModal';

interface StaffWardCareProps {
  patients: Patient[];
  theme: Theme;
  isAdmin?: boolean;
  onEditPatient?: (p: Patient) => void;
  onDeletePatient?: (p: Patient) => void;
}

const StaffWardCare: React.FC<StaffWardCareProps> = ({ patients, theme, isAdmin, onEditPatient, onDeletePatient }) => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [activeTab, setActiveTab] = useState<'BEDS' | 'DIETARY' | 'MEDS' | 'ROLLCALL'>('BEDS');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [medName, setMedName] = useState('');
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

  useEffect(() => {
    mockFirestore.getBeds().then(setBeds);
  }, []);

  const handleBedStatus = async (bedId: string, status: Bed['status'], pId?: string) => {
    if (status === 'OCCUPIED' && pId) {
      await mockFirestore.updatePatientAudited(pId, {
        bedId,
        wardAllocationTime: Date.now(),
        wardBedArrivalTime: Date.now(), // Physical arrival at bed
        status: PatientStatus.WARD_ADMITTED,
        allocatedBedNumber: bedId
      }, `Bed ${bedId} Allocated & Occupied`, 'WARD_STAFF_ID_9');
    }
    await mockFirestore.updateBedStatus(bedId, status, pId);
    const updated = await mockFirestore.getBeds();
    setBeds(updated);
  };

  const addMed = async () => {
    if (selectedPatientId && medName) {
      await mockFirestore.addOutsideMeds(selectedPatientId, medName);
      setMedName('');
    }
  };

  const ipdPatients = patients.filter(p => [PatientStatus.WARD_ADMITTED, PatientStatus.ICU_ADMITTED].includes(p.status));

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
        {['BEDS', 'DIETARY', 'MEDS', 'ROLLCALL'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2 rounded-xl font-black uppercase tracking-widest transition-all text-[9px] ${
              activeTab === tab 
              ? (theme === 'light' ? 'bg-white text-[#0071e3] shadow-md' : 'bg-[#1D1D1F] text-[#0A84FF] shadow-lg')
              : 'text-[#86868b] hover:opacity-80'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'BEDS' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {beds.map(bed => (
            <div key={bed.id} className={`p-5 rounded-[1.5rem] border shadow-md transition-all ${s.card} hover:scale-[1.02] active:scale-95`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[8px] font-black uppercase tracking-widest opacity-40 ${s.sub}`}>{bed.type}</span>
                <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                  bed.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  bed.status === 'CLEANING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : s.badge
                }`}>
                  {bed.status}
                </div>
              </div>
              <h3 className={`text-2xl font-black tracking-tight mb-4 ${s.header}`}>{bed.id}</h3>
              
              {bed.status === 'AVAILABLE' ? (
                <div className="relative">
                  <select 
                    className={`w-full rounded-xl p-3 font-black text-[10px] outline-none border shadow-inner appearance-none ${s.input}`}
                    onChange={(e) => handleBedStatus(bed.id, 'OCCUPIED', e.target.value)}
                    value=""
                  >
                    <option value="" disabled>Assign...</option>
                    {patients.filter(p => !p.bedId && p.category === PatientCategory.IPD).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              ) : bed.status === 'OCCUPIED' ? (
                <button 
                  onClick={() => handleBedStatus(bed.id, 'CLEANING')}
                  className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[8px] transition-all shadow-md active:scale-95 ${theme === 'light' ? 'bg-amber-500 text-white' : 'bg-amber-600 text-white'}`}
                >
                  CLEANING
                </button>
              ) : (
                <button 
                  onClick={() => handleBedStatus(bed.id, 'AVAILABLE')}
                  className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[8px] transition-all shadow-md active:scale-95 ${theme === 'light' ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white'}`}
                >
                  CLEANED
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'DIETARY' && (
        <div className="max-w-4xl mx-auto">
          <div className={`p-8 sm:p-12 rounded-[2.5rem] border shadow-xl text-center space-y-8 ${s.card}`}>
            <div className="text-6xl animate-bounce">🥗</div>
            <h3 className={`text-xl sm:text-3xl font-black uppercase tracking-tighter ${s.header}`}>DIETARY COMPLIANCE</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ipdPatients.length > 0 ? ipdPatients.map(p => (
                <button 
                  key={p.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col items-start shadow-sm active:scale-95 group ${s.btn} hover:scale-[1.02] cursor-pointer`}
                  onClick={() => setViewingPatient(p)}
                >
                  <p className={`text-[8px] font-black uppercase tracking-widest mb-1 opacity-40 ${s.sub}`}>{p.rfidTag}</p>
                  <p className={`text-sm font-black tracking-tight truncate w-full text-left ${s.header}`}>{p.name}</p>
                </button>
              )) : (
                <p className={`col-span-full text-[10px] font-black uppercase tracking-widest opacity-20 py-12 ${s.sub}`}>No patients in ward</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'MEDS' && (
        <div className="max-w-xl mx-auto">
           <div className={`p-8 rounded-[2rem] border shadow-xl ${s.card}`}>
            <div className="flex items-center gap-4 mb-8">
              <div className="text-4xl">💊</div>
              <h3 className={`text-xl font-black uppercase tracking-tight ${s.header}`}>MEDICATION LOG</h3>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Authority ID</label>
                <select 
                  className={`w-full rounded-xl p-4 font-black text-xs outline-none border transition-all shadow-inner ${s.input}`}
                  value={selectedPatientId || ''}
                  onChange={e => setSelectedPatientId(e.target.value)}
                >
                  <option value="">Choose patient...</option>
                  {ipdPatients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.rfidTag})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Dosage</label>
                <input 
                  type="text" 
                  placeholder="e.g. Paracetamol 500mg IV"
                  className={`w-full rounded-xl p-4 font-black text-xs outline-none border transition-all shadow-inner ${s.input}`}
                  value={medName}
                  onChange={e => setMedName(e.target.value)}
                />
              </div>
              <button 
                onClick={addMed}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 text-[10px] ${theme === 'light' ? 'bg-[#0071e3] text-white' : 'bg-[#0A84FF] text-white'}`}
              >
                LOG ENTRY
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ROLLCALL' && (
        <div className={`p-6 sm:p-10 rounded-[2.5rem] border shadow-xl ${s.card}`}>
          <div className="flex justify-between items-center mb-8">
            <h3 className={`text-xl font-black uppercase tracking-tighter ${s.header}`}>ROLL-CALL</h3>
            <div className={`px-4 py-1.5 rounded-lg border text-xs font-black shadow-inner tracking-tight ${s.badge}`}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ipdPatients.length > 0 ? ipdPatients.map(p => (
              <div 
                key={p.id} 
                onClick={() => setViewingPatient(p)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all shadow-sm active:scale-95 group ${s.btn} cursor-pointer hover:shadow-md`}
              >
                <div className="flex items-center gap-4 truncate">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black border shadow-inner text-xs ${s.badge}`}>
                    {p.bedId?.replace('BED-', '')}
                  </div>
                  <div className="truncate">
                    <h4 className={`text-sm font-black tracking-tight truncate ${s.header}`}>{p.name}</h4>
                    <p className={`text-[8px] font-black uppercase opacity-40 truncate ${s.sub}`}>{p.rfidTag}</p>
                  </div>
                </div>
                <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-md active:scale-90 shrink-0 ${theme === 'light' ? 'bg-[#0071e3] text-white' : 'bg-[#0A84FF] text-white'}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            )) : (
              <p className={`col-span-full text-[10px] font-black uppercase tracking-widest opacity-20 py-12 text-center ${s.sub}`}>Ward empty</p>
            )}
          </div>
        </div>
      )}

      {/* Processed Registry */}
      <div className="w-full mt-12 pb-10 border-t border-white/5 pt-8">
        <h3 className={`text-sm font-black uppercase tracking-widest mb-6 ${s.sub}`}>Processed Registry (Ward Transitions)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 opacity-70 hover:opacity-100 transition-opacity">
          {patients.filter(p => p.status === PatientStatus.READY_FOR_DISCHARGE || p.status === PatientStatus.DISCHARGE_LOUNGE || p.status === PatientStatus.DISCHARGED)
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, 8)
            .map((p) => (
              <div key={p.id} className={`p-3 rounded-xl border flex items-center gap-3 ${s.card} border-emerald-500/20 bg-emerald-500/5`}>
                 <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">✓</div>
                 <div className="min-w-0">
                    <div className={`text-[10px] font-black uppercase truncate ${s.header}`}>{p.name}</div>
                    <div className={`text-[7px] font-bold uppercase tracking-tighter opacity-50 ${s.sub}`}>{p.status === PatientStatus.READY_FOR_DISCHARGE ? 'Bed Released' : 'Discharged'}</div>
                 </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default StaffWardCare;

