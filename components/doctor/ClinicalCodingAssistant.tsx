import React, { useState, useRef, useEffect } from 'react';

interface ClinicalCodingAssistantProps {
  value: string;
  onChange: (value: string) => void;
  themeStyles: any;
}

// Mock ICD-10 database for fast local search
const MOCK_ICD_DATABASE = [
  { code: 'J01.90', desc: 'Acute sinusitis, unspecified' },
  { code: 'J02.9', desc: 'Acute pharyngitis, unspecified' },
  { code: 'J06.9', desc: 'Acute upper respiratory infection, unspecified' },
  { code: 'I10', desc: 'Essential (primary) hypertension' },
  { code: 'E11.9', desc: 'Type 2 diabetes mellitus without complications' },
  { code: 'A09', desc: 'Infectious gastroenteritis and colitis, unspecified' },
  { code: 'R50.9', desc: 'Fever, unspecified' },
  { code: 'R51.9', desc: 'Headache, unspecified' },
  { code: 'M54.50', desc: 'Low back pain, unspecified' },
  { code: 'K29.70', desc: 'Gastritis, unspecified, without bleeding' }
];

const ClinicalCodingAssistant: React.FC<ClinicalCodingAssistantProps> = ({ value, onChange, themeStyles: s }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCodes = MOCK_ICD_DATABASE.filter(item => 
    item.code.toLowerCase().includes(search.toLowerCase()) || 
    item.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2 relative" ref={wrapperRef}>
      <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>ICD-10 Code</label>
      <div className="relative">
        <input 
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onClick={() => {
            setSearch(value);
            setIsOpen(true);
          }}
          placeholder="Search diagnosis or ICD-10 code (e.g. Fever)..."
          className={`w-full rounded-xl px-4 py-3 font-black text-[10px] sm:text-xs border-2 outline-none transition-all ${s.input} focus:ring-4 focus:ring-[#0071e3]/20`}
        />
        {value && (
          <button 
            type="button"
            onClick={() => {
              onChange('');
              setSearch('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (search.length > 0 || !value) && (
        <div className="absolute top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto rounded-xl border shadow-xl bg-white dark:bg-[#1D1D1F] border-black/10 dark:border-white/10 z-50">
          {filteredCodes.length > 0 ? (
            filteredCodes.map(item => (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  onChange(`${item.code} - ${item.desc}`);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 flex gap-3 items-center border-b last:border-b-0 border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5`}
              >
                <span className={`text-[10px] font-black shrink-0 ${s.accent}`}>{item.code}</span>
                <span className={`text-[10px] font-bold ${s.header}`}>{item.desc}</span>
              </button>
            ))
          ) : (
            <div className={`px-4 py-4 text-center text-[10px] font-bold opacity-50 ${s.sub}`}>
              No codes found for "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClinicalCodingAssistant;
