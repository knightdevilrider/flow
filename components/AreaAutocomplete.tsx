
import React, { useState, useRef, useEffect } from 'react';
import { LOCALITY_DATABASE, LocalityInfo } from '../constants';
import { Theme } from '../types';

interface AreaAutocompleteProps {
  value: string;
  onSelectLocality: (locality: LocalityInfo | null) => void;
  onManualChange: (value: string) => void;
  theme: Theme;
  styles: any;
  isManualMode?: boolean;
  selectedZone?: 'Urban-Ahmednagar' | 'Rural-Taluka';
}

export const AreaAutocomplete: React.FC<AreaAutocompleteProps> = ({ 
  value, 
  onSelectLocality, 
  onManualChange,
  theme, 
  styles,
  isManualMode = false,
  selectedZone
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const filteredOptions = LOCALITY_DATABASE.filter(locality => {
    const matchesSearch = locality.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         locality.pincode.includes(searchTerm);
    
    if (searchTerm === '' && selectedZone) {
      return locality.zone === selectedZone;
    }
    
    return matchesSearch;
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (locality: LocalityInfo | 'Other') => {
    if (locality === 'Other') {
      onSelectLocality(null);
      setSearchTerm('');
    } else {
      onSelectLocality(locality);
      setSearchTerm(locality.name);
    }
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (!isManualMode) {
      setIsOpen(true);
      // Try to find an exact match by pincode or name to auto-sync while typing
      const exactMatch = LOCALITY_DATABASE.find(l => 
        l.pincode === val || l.name.toLowerCase() === val.toLowerCase()
      );
      if (exactMatch) {
        onSelectLocality(exactMatch);
      } else {
        onManualChange(val);
      }
    } else {
      onManualChange(val);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => !isManualMode && setIsOpen(true)}
          placeholder={isManualMode ? "Type locality manually..." : "Search Area / Locality / Pincode..."}
          className={`${styles.input} w-full pr-10`}
          required
        />
        {isManualMode && (
          <button
            type="button"
            onClick={() => {
              onSelectLocality(null);
              setSearchTerm('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
          >
            Reset
          </button>
        )}
      </div>

      {isOpen && !isManualMode && (
        <div className={`absolute z-[100] w-full mt-2 rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${theme === 'light' ? 'bg-white border-[#D2D2D7]' : 'bg-[#1D1D1F] border-[#444]'}`}>
          <div className="max-h-[300px] overflow-y-auto apple-scroll">
            {searchTerm === '' && selectedZone === 'Rural-Taluka' && (
              <div className={`px-5 py-2 text-[8px] font-black uppercase tracking-widest border-b ${theme === 'light' ? 'bg-blue-50/50 text-blue-600 border-blue-100' : 'bg-blue-500/10 text-blue-400 border-blue-900/30'}`}>
                Rural Talukas & Major Towns (&lt; 100 km radius)
              </div>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((locality, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(locality)}
                  className={`w-full text-left px-5 py-3 transition-colors border-b last:border-b-0 ${theme === 'light' ? 'hover:bg-[#F5F5F7] border-[#F5F5F7]' : 'hover:bg-[#2D2D2D] border-[#2D2D2D]'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider">{locality.name}</div>
                      <div className="text-[9px] opacity-60 uppercase font-black tracking-widest">{locality.zone}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black">{locality.pincode}</div>
                      <div className="text-[9px] opacity-60 font-bold">{locality.distance} KM</div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-5 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 italic">
                No matching results
              </div>
            )}
            <button
              type="button"
              onClick={() => handleSelect('Other')}
              className={`w-full text-left px-5 py-4 text-[11px] font-black uppercase tracking-widest transition-colors flex items-center justify-between ${theme === 'light' ? 'bg-[#F5F5F7] hover:bg-[#E8E8ED] text-blue-600' : 'bg-[#2D2D2D] hover:bg-[#3D3D3F] text-blue-400'}`}
            >
              <span>Other (Manual Entry)</span>
              <span className="text-[14px]">✍️</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
