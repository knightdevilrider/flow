import React, { useState } from 'react';
import { Patient, PatientStatus, Theme, InventoryItem } from '../types';
import { mockFirestore } from '../services/mockFirestore';
import PatientContactModal from '../components/PatientContactModal';

interface StaffPharmacyProps {
  patients: Patient[];
  theme: Theme;
  isAdmin?: boolean;
  inventory?: InventoryItem[];
  onEditPatient?: (p: Patient) => void;
  onDeletePatient?: (p: Patient) => void;
}

const StaffPharmacy: React.FC<StaffPharmacyProps> = ({ patients, theme, isAdmin, inventory = [], onEditPatient, onDeletePatient }) => {
  const [message, setMessage] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);
  const [prescribedCount, setPrescribedCount] = useState(0);
  const [dispensedCount, setDispensedCount] = useState(0);
  const [isStockOut, setIsStockOut] = useState(false);
  const [isSubstitution, setIsSubstitution] = useState(false);
  
  // Billing specific state
  const [billAmount, setBillAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI'>('Cash');
  const [isPaid, setIsPaid] = useState(false);
  
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

  const allowedStatusesForStation = [PatientStatus.MEDICINE_WAITING];

  const currentPatient = patients.find(p => allowedStatusesForStation.includes(p.status));
  
  const queue = patients.filter(p => !p.isAbsent && allowedStatusesForStation.includes(p.status));
  const absentList = patients.filter(p => p.isAbsent && allowedStatusesForStation.includes(p.status));

  React.useEffect(() => {
    // Reset state when patient changes
    if (currentPatient) {
      setPrescribedCount(0); // This could be populated automatically if prescribedDrugs array exists
      setDispensedCount(0);
      setIsStockOut(false);
      setIsSubstitution(false);
      setBillAmount(0);
      setIsPaid(false);
    }
  }, [currentPatient?.id]);

  const handleCallNext = async () => {
    // Look for someone in CONSULTATION_DONE (who needs medicine) or checkin queue
    const next = mockFirestore.getNextInQueue(patients, PatientStatus.CONSULTATION_DONE);
    
    if (next) {
      await mockFirestore.callPatient(next.id, PatientStatus.MEDICINE_WAITING, patients);
      setMessage(`Calling ${next.name}`);
    } else {
      setMessage("No pending prescriptions");
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDispense = async () => {
    if (!currentPatient) return;
    setIsArchiving(true);
    setMessage('Processing Dispensation & Billing...');
    
    // Auto-deduct inventory
    if (currentPatient.prescribedDrugs && currentPatient.prescribedDrugs.length > 0) {
      for (const drug of currentPatient.prescribedDrugs) {
        // Find in inventory
        const item = inventory.find(i => i.name.toLowerCase() === drug.name.toLowerCase());
        if (item) {
          // Assume dispensing 1 packet/strip for simplicity, or could calculate from dosage/duration
          const deduction = 1; 
          const newQuantity = Math.max(0, item.quantity - deduction);
          await mockFirestore.updateInventoryItem(item.id, { quantity: newQuantity });
        }
      }
    }
    
    await mockFirestore.updatePatientAudited(currentPatient.id, { 
      status: PatientStatus.COMPLETED,
      prescribedItemsCount: prescribedCount,
      dispensedItemsCount: dispensedCount,
      prescriptionSubstitutionFlag: isSubstitution,
      // Record billing metrics in history
      history: [
        ...currentPatient.history,
        {
          stage: PatientStatus.MEDICINE_WAITING,
          entryTime: Date.now() - 120000,
          handoverTime: Date.now(),
          exitTime: Date.now(),
          authorId: 'PHARMACIST_ID_1',
          slaBreach: false,
          note: `Bill: ₹${billAmount}, Paid via ${paymentMethod}`
        }
      ]
    }, 'Pharmacy Dispensing Completed', 'PHARMACIST_ID_1');
    
    setTimeout(() => {
      setIsArchiving(false);
      setMessage('Completed & Synced');
      setTimeout(handleCallNext, 1000);
    }, 2000);
  };

  if (!currentPatient && queue.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12 sm:py-24 px-6 sm:px-10">
        <div className="text-center mb-12 sm:mb-20">
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-8 shadow-inner">
            <span className="text-4xl sm:text-6xl">💊</span>
          </div>
          <h2 className={`text-4xl sm:text-6xl font-black mb-4 uppercase tracking-tighter leading-none ${s.header}`}>Pharmacy & Billing</h2>
          <p className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] opacity-40 ${s.sub}`}>No Pending Prescriptions</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <button
            onClick={handleCallNext}
            className={`w-full py-6 sm:py-8 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-2 group ${s.card} hover:scale-[1.03] active:scale-95 shadow-lg hover:shadow-xl`}
          >
            <div className={`text-3xl sm:text-4xl mb-2`}>🛎️</div>
            <div className={`text-sm sm:text-lg font-black text-emerald-600 transition-colors tracking-tight`}>Call Next Patient</div>
          </button>
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
          <div className={`absolute top-0 right-0 px-6 py-2 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl shadow-lg bg-pink-600`}>
            Pharmacy Fulfillment
          </div>
          
          {currentPatient ? (
            <div className="flex flex-col xl:flex-row gap-8 xl:items-start animate-in slide-in-from-bottom-4">
              <div 
                onClick={() => setViewingPatient(currentPatient)}
                className={`w-32 h-32 sm:w-48 sm:h-48 rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden border-4 shadow-lg shrink-0 transition-transform cursor-pointer hover:scale-105 active:scale-95 mx-auto xl:mx-0 ${theme === 'light' ? 'border-white' : 'border-[#333]'}`}
              >
                {currentPatient.photo ? (
                  <img src={currentPatient.photo} alt={currentPatient.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-5xl sm:text-7xl ${s.btn}`}>👤</div>
                )}
              </div>
              <div className="flex-1 w-full space-y-6">
                <div>
                  <h3 
                    onClick={() => setViewingPatient(currentPatient)}
                    className={`text-3xl sm:text-4xl font-black tracking-tight leading-tight cursor-pointer hover:text-emerald-500 transition-colors text-center xl:text-left ${s.header}`}
                  >
                    {currentPatient.name}
                  </h3>
                  <p className={`text-[8px] font-black uppercase tracking-widest mt-2 text-center xl:text-left ${s.sub}`}>ID: {currentPatient.id} • STG 8: PHARMACY</p>
                </div>
                
                <div className={`p-6 rounded-2xl border-2 shadow-inner group transition-all ${s.btn}`}>
                  <h4 className={`text-[8px] font-black uppercase tracking-widest mb-2 opacity-40 ${s.sub}`}>Doctor's Prescription</h4>
                  <p className={`text-lg sm:text-xl font-black tracking-tight leading-tight ${s.header}`}>"{currentPatient.prescription || 'No Prescription Notes'}"</p>
                  
                  {/* Digital Prescription Details if available */}
                  {currentPatient.prescribedDrugs && currentPatient.prescribedDrugs.length > 0 && (
                     <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
                       <h5 className={`text-[8px] font-black uppercase tracking-widest mb-3 ${s.accent}`}>Prescribed Drugs</h5>
                       <div className="space-y-2">
                         {currentPatient.prescribedDrugs.map((drug, i) => (
                           <div key={i} className={`flex justify-between items-center text-xs p-2 rounded-lg bg-black/5 dark:bg-white/5`}>
                             <span className="font-bold">{drug.name}</span>
                             <span className="opacity-70">{drug.dosage} • {drug.frequency} • {drug.duration} Days</span>
                           </div>
                         ))}
                       </div>
                     </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dispensing Area */}
                  <div className="space-y-4">
                    <h4 className={`text-xs font-black uppercase tracking-widest ${s.header}`}>Fulfillment</h4>
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

                  {/* Billing Area */}
                  <div className={`space-y-4 p-5 rounded-2xl border-2 ${s.card}`}>
                    <h4 className={`text-xs font-black uppercase tracking-widest ${s.header}`}>Billing Options</h4>
                    <div className="space-y-2">
                      <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Total Amount (₹)</label>
                      <input 
                        type="number"
                        value={billAmount}
                        onChange={(e) => setBillAmount(+e.target.value)}
                        className={`w-full rounded-xl px-4 py-3 font-black text-lg text-emerald-600 border-2 outline-none transition-all ${s.input}`}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2 pt-2">
                      <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Payment Method</label>
                      <div className="flex gap-2">
                        {['Cash', 'Card', 'UPI'].map(method => (
                          <button
                            key={method}
                            onClick={() => setPaymentMethod(method as any)}
                            className={`flex-1 py-2 rounded-lg font-black text-[10px] border transition-all ${paymentMethod === method ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : s.btn}`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 mt-4 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={isPaid}
                        onChange={(e) => setIsPaid(e.target.checked)}
                        className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                      />
                      <span className={`text-[10px] font-black uppercase tracking-wider group-hover:text-emerald-500 transition-colors ${s.header}`}>Payment Received</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-black/10 dark:border-white/10">
                  <button 
                    onClick={handleDispense}
                    disabled={isArchiving || (billAmount > 0 && !isPaid)}
                    className={`flex-1 py-4 rounded-2xl font-black transition-all uppercase tracking-[0.3em] text-[10px] shadow-xl disabled:opacity-50 active:scale-95 bg-emerald-600 text-white`}
                  >
                    {isArchiving ? 'RECORDING...' : 'DISPENSE & COMPLETE'}
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
              <div className="text-6xl sm:text-8xl opacity-10 animate-pulse">💊</div>
              <div>
                <h4 className={`text-xl sm:text-2xl font-black uppercase tracking-tight mb-4 ${s.header}`}>Pharmacy Counter</h4>
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
              Medicine Queue ({queue.length})
            </h3>
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
            <h3 className={`text-sm font-black uppercase tracking-widest ${s.sub}`}>Processed Registry (Medicines Dispensed)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 opacity-60 hover:opacity-100 transition-opacity">
            {patients.filter(p => p.status === PatientStatus.COMPLETED)
              .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
              .slice(0, 8)
              .map((p) => (
                <div key={p.id} className={`p-3 rounded-xl border flex items-center gap-3 ${s.card} border-emerald-500/20 bg-emerald-500/5`}>
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">✓</div>
                   <div className="min-w-0">
                      <div className={`text-[10px] font-black uppercase truncate ${s.header}`}>{p.name}</div>
                      <div className={`text-[7px] font-bold uppercase tracking-tighter opacity-50 ${s.sub}`}>Meds Dispensed</div>
                   </div>
                </div>
              ))
            }
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className={`p-6 rounded-[2rem] border shadow-lg ${s.card}`}>
          <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 text-red-500`}>MISSING FROM COUNTER</h3>
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

      {/* Inventory Management */}
      <div className="lg:col-span-4 mt-8">
        <section className={`p-6 rounded-[2rem] border shadow-xl relative overflow-hidden ${s.card}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-black uppercase tracking-widest ${s.header}`}>Live Inventory Management</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b-2 ${theme === 'light' ? 'border-[#D2D2D7]' : 'border-[#333]'}`}>
                  <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${s.sub}`}>Drug Name</th>
                  <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${s.sub}`}>Type / Dosage</th>
                  <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${s.sub}`}>Current Stock</th>
                  <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${s.sub}`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id} className={`border-b last:border-b-0 ${theme === 'light' ? 'border-[#D2D2D7]/50' : 'border-[#333]/50'}`}>
                    <td className={`p-4 text-xs font-bold ${s.header}`}>{item.name}</td>
                    <td className={`p-4 text-[10px] uppercase font-black opacity-60 ${s.sub}`}>{item.type} • {item.commonDosage}</td>
                    <td className={`p-4`}>
                      <span className={`text-xs font-black ${item.quantity <= item.minThreshold ? 'text-red-500' : 'text-emerald-500'}`}>
                        {item.quantity} units {item.quantity <= item.minThreshold && '(LOW)'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => mockFirestore.updateInventoryItem(item.id, { quantity: item.quantity + 50 })}
                        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all active:scale-95 shadow-sm ${s.badge}`}
                      >
                        RESTOCK +50
                      </button>
                    </td>
                  </tr>
                ))}
                {inventory.length === 0 && (
                  <tr>
                    <td colSpan={4} className={`p-8 text-center text-xs font-bold ${s.sub}`}>Loading Inventory...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StaffPharmacy;
