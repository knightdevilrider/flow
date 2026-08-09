import React, { useState } from 'react';
import { Patient, PatientStatus, Theme, InventoryItem, InventoryBatch } from '../types';
import { mockFirestore } from '../services/mockFirestore';

interface StaffPharmacyProps {
  patients: Patient[];
  theme: Theme;
  isAdmin?: boolean;
  inventory?: InventoryItem[];
}

const StaffPharmacy: React.FC<StaffPharmacyProps> = ({ patients, theme, isAdmin, inventory = [] }) => {
  const [activeTab, setActiveTab] = useState<'billing' | 'inventory'>('billing');
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [expandedDrug, setExpandedDrug] = useState<string | null>(null);
  const [showAddBatch, setShowAddBatch] = useState<InventoryItem | null>(null);

  // New Batch Form State
  const [newBatch, setNewBatch] = useState<Partial<InventoryBatch>>({
    batchId: '', quantity: 0, expiryDate: '', location: { rack: '', shelf: '', box: '' }
  });

  const isDark = theme === 'dark' || theme === 'titanium';
  const themeStyles = {
    card: isDark ? 'bg-[#1D1D1F] border-[#333] shadow-2xl text-white' : 'bg-white border-[#D2D2D7] shadow-sm text-[#1D1D1F]',
    btn: isDark ? 'bg-[#2D2D2D] hover:bg-[#3D3D3D] border-[#444] text-white' : 'bg-[#F5F5F7] hover:bg-[#E8E8ED] border-[#D2D2D7] text-[#1D1D1F]',
    input: isDark ? 'bg-[#2D2D2D] border-[#444] text-white' : 'bg-white border-[#D2D2D7] text-[#1D1D1F]',
    sub: isDark ? 'text-[#86868b]' : 'text-black/60',
  };

  const queue = patients.filter(p => p.status === PatientStatus.MEDICINE_WAITING)
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  const handleCallNext = () => {
    if (queue.length > 0) setViewingPatient(queue[0]);
  };

  const handleDispense = async () => {
    if (!viewingPatient) return;
    
    // In a real app, we would loop through prescribed meds and call dispatchMedicine for each.
    // For demo, we just complete the patient's stage.
    await mockFirestore.updatePatient(viewingPatient.id, {
      status: PatientStatus.COMPLETED
    });
    setViewingPatient(null);
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddBatch || !newBatch.batchId || !newBatch.quantity || !newBatch.expiryDate) return;
    
    const batchToAdd: InventoryBatch = {
      batchId: newBatch.batchId as string,
      quantity: Number(newBatch.quantity),
      expiryDate: newBatch.expiryDate as string,
      location: newBatch.location as any,
      dateAdded: Date.now()
    };
    
    const updatedBatches = [...(showAddBatch.batches || []), batchToAdd];
    const newTotal = updatedBatches.reduce((acc, b) => acc + b.quantity, 0);

    await mockFirestore.updateInventoryItem(showAddBatch.id, {
      batches: updatedBatches,
      totalQuantity: newTotal,
      lastUpdated: Date.now()
    });
    
    setShowAddBatch(null);
    setNewBatch({ batchId: '', quantity: 0, expiryDate: '', location: { rack: '', shelf: '', box: '' } });
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-black/10 dark:border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab('billing')}
          className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'billing' ? 'bg-[#0A84FF] text-white shadow-lg' : themeStyles.btn}`}
        >
          Prescription Billing
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'inventory' ? 'bg-[#0A84FF] text-white shadow-lg' : themeStyles.btn}`}
        >
          Live Inventory
        </button>
      </div>

      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <section className={`p-8 rounded-[2rem] border shadow-lg ${themeStyles.card}`}>
              {viewingPatient ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-6 border-b border-inherit">
                    <div>
                      <h2 className="text-3xl font-black tracking-tight">{viewingPatient.name}</h2>
                      <p className={`text-xs font-black uppercase tracking-widest mt-1 ${themeStyles.sub}`}>ID: {viewingPatient.id} • {viewingPatient.age} / {viewingPatient.gender}</p>
                    </div>
                    <button onClick={() => setViewingPatient(null)} className={`w-10 h-10 rounded-full flex items-center justify-center ${themeStyles.btn}`}>✕</button>
                  </div>
                  
                  <div className="py-6 space-y-4">
                    <h3 className={`text-sm font-black uppercase tracking-widest ${themeStyles.sub}`}>Prescribed Medicines</h3>
                    <p className="text-sm font-medium italic opacity-70">No active prescriptions linked for this demo patient.</p>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-inherit">
                    <button onClick={handleDispense} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95">
                      Dispense & Bill
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center space-y-6">
                  <div className="text-6xl opacity-20">💊</div>
                  <h4 className="text-2xl font-black uppercase tracking-tight">Pharmacy Counter</h4>
                  <button onClick={handleCallNext} disabled={queue.length === 0} className={`px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl active:scale-95 ${queue.length > 0 ? 'bg-[#0A84FF] text-white hover:bg-[#0071e3]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                    CALL NEXT PATIENT
                  </button>
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <section className={`p-6 rounded-[2rem] border shadow-lg ${themeStyles.card}`}>
              <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${themeStyles.sub}`}>Medicine Queue ({queue.length})</h3>
              <div className="space-y-3">
                {queue.map((p, i) => (
                  <div key={p.id} onClick={() => setViewingPatient(p)} className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all active:scale-95 ${themeStyles.btn}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border border-inherit bg-black/5 dark:bg-white/5">{i + 1}</div>
                    <div className="truncate">
                      <div className="text-xs font-black truncate">{p.name}</div>
                      <div className={`text-[9px] font-bold uppercase ${themeStyles.sub}`}>{p.id}</div>
                    </div>
                  </div>
                ))}
                {queue.length === 0 && <p className={`text-xs font-bold text-center py-4 ${themeStyles.sub}`}>Queue is empty.</p>}
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <section className={`p-8 rounded-[2rem] border shadow-lg ${themeStyles.card}`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black tracking-tight">Live Inventory Management</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-inherit">
                  <th className={`p-4 text-xs font-black uppercase tracking-widest ${themeStyles.sub}`}>Drug Name</th>
                  <th className={`p-4 text-xs font-black uppercase tracking-widest ${themeStyles.sub}`}>Category</th>
                  <th className={`p-4 text-xs font-black uppercase tracking-widest ${themeStyles.sub}`}>Total Stock</th>
                  <th className={`p-4 text-xs font-black uppercase tracking-widest text-right ${themeStyles.sub}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => (
                  <React.Fragment key={item.id}>
                    <tr className={`border-b border-inherit cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${item.totalQuantity <= item.minThreshold ? 'bg-red-500/10' : ''}`} onClick={() => setExpandedDrug(expandedDrug === item.id ? null : item.id)}>
                      <td className="p-4 font-bold">
                        {item.name}
                        {item.totalQuantity <= item.minThreshold && <span className="ml-2 text-[10px] bg-red-500 text-white px-2 py-1 rounded-full uppercase tracking-widest">Low Stock</span>}
                      </td>
                      <td className="p-4 text-sm opacity-70">{item.category}</td>
                      <td className="p-4 font-black">{item.totalQuantity} {item.unit}</td>
                      <td className="p-4 text-right">
                        <button onClick={(e) => { e.stopPropagation(); setShowAddBatch(item); }} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors">
                          + Add Batch
                        </button>
                      </td>
                    </tr>
                    {expandedDrug === item.id && (
                      <tr className="bg-black/5 dark:bg-white/5">
                        <td colSpan={4} className="p-6">
                          <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 ${themeStyles.sub}`}>Physical Batches Tracking (FEFO)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {item.batches && item.batches.map(b => (
                              <div key={b.batchId} className={`p-4 rounded-xl border ${themeStyles.card}`}>
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-xs font-black uppercase tracking-widest">Batch: {b.batchId}</span>
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${new Date(b.expiryDate) < new Date(Date.now() + 7776000000) /* 90 days */ ? 'bg-red-500 text-white' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                    Exp: {b.expiryDate}
                                  </span>
                                </div>
                                <div className="text-2xl font-black mb-2">{b.quantity} <span className="text-sm font-medium opacity-50">{item.unit}</span></div>
                                <div className={`text-[10px] font-bold uppercase tracking-widest ${themeStyles.sub}`}>
                                  Location: RACK {b.location.rack} • SHELF {b.location.shelf} • BOX {b.location.box}
                                </div>
                              </div>
                            ))}
                            {(!item.batches || item.batches.length === 0) && (
                              <div className="p-4 text-sm opacity-50 italic">No active batches in storage.</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Add Batch Modal */}
      {showAddBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleAddBatch} className={`w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-6 ${themeStyles.card}`}>
            <div>
              <h3 className="text-xl font-black tracking-tight">Inward Stock Entry</h3>
              <p className={`text-xs mt-1 ${themeStyles.sub}`}>Adding batch to {showAddBatch.name}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-1">Batch Number</label>
                <input required type="text" value={newBatch.batchId} onChange={e => setNewBatch({...newBatch, batchId: e.target.value})} className={`w-full p-3 rounded-xl text-sm font-medium outline-none border ${themeStyles.input}`} placeholder="e.g. B-005" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1">Quantity</label>
                  <input required type="number" min="1" value={newBatch.quantity || ''} onChange={e => setNewBatch({...newBatch, quantity: Number(e.target.value)})} className={`w-full p-3 rounded-xl text-sm font-medium outline-none border ${themeStyles.input}`} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1">Expiry Date</label>
                  <input required type="month" value={newBatch.expiryDate} onChange={e => setNewBatch({...newBatch, expiryDate: e.target.value})} className={`w-full p-3 rounded-xl text-sm font-medium outline-none border ${themeStyles.input}`} />
                </div>
              </div>
              
              <div className="pt-2">
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-[#0A84FF]">Physical Location</label>
                <div className="grid grid-cols-3 gap-2">
                  <input required type="text" placeholder="Rack" value={newBatch.location?.rack} onChange={e => setNewBatch({...newBatch, location: {...newBatch.location, rack: e.target.value} as any})} className={`w-full p-3 rounded-xl text-xs font-bold outline-none border text-center ${themeStyles.input}`} />
                  <input required type="text" placeholder="Shelf" value={newBatch.location?.shelf} onChange={e => setNewBatch({...newBatch, location: {...newBatch.location, shelf: e.target.value} as any})} className={`w-full p-3 rounded-xl text-xs font-bold outline-none border text-center ${themeStyles.input}`} />
                  <input required type="text" placeholder="Box" value={newBatch.location?.box} onChange={e => setNewBatch({...newBatch, location: {...newBatch.location, box: e.target.value} as any})} className={`w-full p-3 rounded-xl text-xs font-bold outline-none border text-center ${themeStyles.input}`} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-inherit">
              <button type="button" onClick={() => setShowAddBatch(null)} className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${themeStyles.btn}`}>Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-[#0A84FF] hover:bg-[#0071e3] text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95">Save Batch</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StaffPharmacy;
