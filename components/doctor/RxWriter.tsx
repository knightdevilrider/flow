import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem } from '../../types';

export interface PrescribedDrug {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration: string;
}

interface RxWriterProps {
  prescribedDrugs: PrescribedDrug[];
  onChange: (drugs: PrescribedDrug[]) => void;
  patientAllergies?: string[];
  themeStyles: any;
  inventory?: InventoryItem[];
}



const FREQUENCIES = ['1-0-1 (BD)', '1-1-1 (TDS)', '1-0-0 (OD)', '0-0-1 (HS)', 'SOS (As needed)'];
const TIMINGS = ['After Food (PC)', 'Before Food (AC)', 'Empty Stomach', 'With Milk'];

const RxWriter: React.FC<RxWriterProps> = ({ prescribedDrugs, onChange, patientAllergies = [], themeStyles: s, inventory = [] }) => {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<any>(null);
  
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState(FREQUENCIES[0]);
  const [timing, setTiming] = useState(TIMINGS[0]);
  const [duration, setDuration] = useState('5 Days');

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredDrugs = inventory.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelectDrug = (drug: any) => {
    setSelectedDrug(drug);
    setSearch(drug.name);
    setDosage(drug.commonDosage);
    setShowDropdown(false);
  };

  const handleAddDrug = () => {
    if (!search) return;
    
    const newDrug: PrescribedDrug = {
      id: Math.random().toString(36).substring(7),
      name: selectedDrug ? selectedDrug.name : search,
      dosage,
      frequency,
      timing,
      duration
    };

    onChange([...prescribedDrugs, newDrug]);
    
    // Reset form
    setSearch('');
    setSelectedDrug(null);
    setDosage('');
    setFrequency(FREQUENCIES[0]);
    setTiming(TIMINGS[0]);
    setDuration('5 Days');
  };

  const handleRemoveDrug = (id: string) => {
    onChange(prescribedDrugs.filter(d => d.id !== id));
  };

  const hasAllergyRisk = selectedDrug?.allergyRisk && patientAllergies.some(a => a.toLowerCase().includes(selectedDrug.allergyRisk.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Digital Rx (Prescriptions)</label>
      </div>

      {/* Rx Builder Form */}
      <div className={`p-4 rounded-2xl border flex flex-col gap-3 shadow-inner ${s.card}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative" ref={wrapperRef}>
            <input 
              type="text" 
              placeholder="Search drug (e.g. Paracetamol)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
                setSelectedDrug(null);
              }}
              onFocus={() => setShowDropdown(true)}
              className={`w-full rounded-xl px-4 py-2 text-xs font-bold outline-none border-2 transition-all ${s.input}`}
            />
            {showDropdown && search && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-xl border shadow-xl bg-white dark:bg-[#1D1D1F] border-black/10 dark:border-white/10 z-50">
                {filteredDrugs.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectDrug(d)}
                    className={`w-full text-left px-4 py-2 border-b last:border-b-0 border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 flex justify-between items-center`}
                  >
                    <div>
                      <div className={`text-[10px] font-black ${s.header}`}>{d.name}</div>
                      <div className={`text-[8px] font-black uppercase tracking-widest opacity-50 ${s.sub}`}>{d.type}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.quantity <= d.minThreshold && (
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${d.quantity === 0 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}>
                          {d.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      )}
                      <span className={`text-[10px] font-black opacity-70 ${d.quantity === 0 ? 'text-red-500' : s.sub}`}>
                        Stock: {d.quantity}
                      </span>
                      {d.allergyRisk && (
                        <span className="text-[7px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 font-black uppercase">
                          Allergy Risk
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <input 
            type="text" 
            placeholder="Dosage (e.g. 650mg)"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className={`w-full rounded-xl px-4 py-2 text-xs font-bold outline-none border-2 transition-all ${s.input}`}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select 
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className={`rounded-xl px-2 py-2 text-[10px] font-bold outline-none border-2 transition-all ${s.input}`}
          >
            {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
          </select>
          <select 
            value={timing}
            onChange={(e) => setTiming(e.target.value)}
            className={`rounded-xl px-2 py-2 text-[10px] font-bold outline-none border-2 transition-all ${s.input}`}
          >
            {TIMINGS.map(t => <option key={t}>{t}</option>)}
          </select>
          <input 
            type="text" 
            placeholder="Duration (e.g. 5 Days)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={`rounded-xl px-4 py-2 text-xs font-bold outline-none border-2 transition-all ${s.input}`}
          />
          <button 
            type="button"
            onClick={handleAddDrug}
            disabled={!search}
            className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              search ? 'bg-[#0A84FF] text-white hover:bg-blue-600 shadow-md active:scale-95' : 'bg-black/5 dark:bg-white/5 opacity-50 cursor-not-allowed'
            }`}
          >
            + Add Rx
          </button>
        </div>

        {hasAllergyRisk && (
          <div className="px-4 py-2 mt-1 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
            <span className="text-red-500 mt-0.5">⚠️</span>
            <div>
              <div className="text-[10px] font-black uppercase text-red-500 tracking-widest">Potential Allergy Conflict</div>
              <div className="text-[9px] font-bold text-red-500/80">Patient has a recorded allergy to {selectedDrug.allergyRisk}.</div>
            </div>
          </div>
        )}
      </div>

      {/* Prescribed Drugs List */}
      {prescribedDrugs.length > 0 && (
        <div className="space-y-2">
          {prescribedDrugs.map((drug, idx) => (
            <div key={drug.id} className={`p-3 rounded-xl border flex items-center justify-between ${s.card}`}>
              <div className="flex items-center gap-4">
                <span className={`text-[10px] font-black opacity-40 ${s.sub}`}>{(idx + 1).toString().padStart(2, '0')}</span>
                <div>
                  <div className={`text-xs font-black ${s.header}`}>{drug.name} <span className="opacity-60 font-bold ml-1">{drug.dosage}</span></div>
                  <div className={`text-[9px] font-bold uppercase tracking-widest opacity-60 ${s.sub}`}>
                    {drug.frequency} • {drug.timing} • {drug.duration}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleRemoveDrug(drug.id)}
                className={`w-6 h-6 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RxWriter;
