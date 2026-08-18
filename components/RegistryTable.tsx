import React, { useState, useMemo } from 'react';
import { Patient, Theme, PatientStatus } from '../types';
import { getPremiumStyles } from '../theme/premiumDesign';
import { Search, Edit, Trash2, Clock, MapPin, Phone } from 'lucide-react';
import { STATUS_LABELS } from '../constants';

interface RegistryTableProps {
  patients: Patient[];
  theme: Theme;
  onEdit?: (patient: Patient) => void;
  onDelete?: (patient: Patient) => void;
  onRowClick?: (patient: Patient) => void;
  hideCategoryFilter?: boolean;
}

export const RegistryTable: React.FC<RegistryTableProps> = ({ 
  patients, 
  theme, 
  onEdit, 
  onDelete,
  hideCategoryFilter = false,
  onRowClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const s = getPremiumStyles(theme);

  // Extract unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(patients.map(p => p.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [patients]);

  const filteredPatients = useMemo(() => {
    let result = [...patients];
    
    // Sort newest first based on entry time
    result.sort((a, b) => b.timestamp - a.timestamp);

    // Apply category filter
    if (categoryFilter !== 'All') {
      result = result.filter(p => p.category === categoryFilter);
    }

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q)) ||
        (p.idNumber && p.idNumber.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q))
      );
    }
    
    return result;
  }, [patients, searchQuery, categoryFilter]);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`w-full flex flex-col gap-4 ${s.card} p-4 sm:p-6 rounded-3xl border`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className={`text-sm font-black uppercase tracking-widest ${s.sub}`}>Processed Registry</h3>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search Name, Phone, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/50 ${s.input}`}
            />
          </div>

          {/* Category Filter */}
          {!hideCategoryFilter && (
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    categoryFilter === cat 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : `opacity-50 hover:opacity-100 border ${s.btn}`
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`border-b ${s.cardHeader} text-[10px] uppercase tracking-widest opacity-60`}>
              <th className="px-4 py-3 font-black">Patient</th>
                            <th className="px-4 py-3 font-black">Category</th>
                            <th className="px-4 py-3 font-black">Time</th>
              {(onEdit || onDelete) && (
                <th className="px-4 py-3 font-black text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm opacity-50 font-bold">
                  No records found
                </td>
              </tr>
            ) : (
              filteredPatients.map(p => (
                <tr key={p.id} onClick={() => onRowClick?.(p)} className={`border-b border-white/5 hover:bg-white/5 transition-colors group ${onRowClick ? 'cursor-pointer' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight">{p.name}</span>
                        <span className={`text-[10px] uppercase tracking-wider ${s.sub}`}>{p.idType}: {p.idNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-white/5 border border-white/10">
                      {p.category || 'Unknown'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs opacity-70">
                      <Clock className="w-3 h-3" />
                      {formatTime(p.timestamp)}
                    </div>
                  </td>

                  {(onEdit || onDelete) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity">
                        {onEdit && (
                          <button 
                            onClick={() => onEdit(p)}
                            className="p-1.5 rounded-md hover:bg-blue-500/20 text-blue-400 transition-colors"
                            title="Edit Record"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && !p.deletionRequest && (
                          <button 
                            onClick={() => onDelete(p)}
                            className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Request Deletion"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
