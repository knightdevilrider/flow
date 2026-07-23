import React, { useState } from 'react';
import { Edit2, Trash2, Search, Filter, Stethoscope, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { Doctor, Theme } from '../../types';

interface DoctorTableProps {
  doctors: Doctor[];
  onEdit: (doctor: Doctor) => void;
  onDelete: (id: string) => void;
  theme: Theme;
}

const DoctorTable: React.FC<DoctorTableProps> = ({ doctors, onEdit, onDelete, theme }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         doc.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = specialtyFilter === '' || doc.specialty === specialtyFilter;
    const matchesStatus = statusFilter === '' || doc.status === statusFilter;
    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  const specialties = Array.from(new Set(doctors.map(d => d.specialty).filter(Boolean)));

  const s = theme === 'dark' || theme === 'titanium' ? {
    card: 'bg-[#141417] border-white/10',
    text: 'text-white',
    sub: 'text-[#8E8E93]',
    input: 'bg-white/5 border-white/10 text-white',
    tableHeader: 'bg-white/5 text-[#8E8E93]',
    rowHover: 'hover:bg-white/5'
  } : {
    card: 'bg-white border-black/5',
    text: 'text-black',
    sub: 'text-[#636366]',
    input: 'bg-black/5 border-black/10 text-black',
    tableHeader: 'bg-black/5 text-[#636366]',
    rowHover: 'hover:bg-black/5'
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
          <input
            type="text"
            placeholder="Search doctors by name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-2xl border outline-none font-medium transition-all focus:ring-2 focus:ring-blue-500/20 ${s.input}`}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className={`px-4 py-3 rounded-2xl border outline-none font-medium ${s.input}`}
          >
            <option value="">All Specialties</option>
            {specialties.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-3 rounded-2xl border outline-none font-medium ${s.input}`}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-3xl border ${s.card} overflow-hidden shadow-xl`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={s.tableHeader}>
              <tr>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Doctor Name</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Specialization</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Room / Location</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Availability</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-white/5 ${s.text}`}>
              {filteredDoctors.map((doc) => (
                <tr key={doc.id} className={`${s.rowHover} transition-colors`}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                        {doc.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold">{doc.name}</div>
                        <div className={`text-[10px] font-medium opacity-50`}>{doc.qualification}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-3 h-3 opacity-40" />
                      <span className="text-xs font-bold opacity-80">{doc.specialty}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 opacity-40" />
                        <span className="text-xs font-bold uppercase tracking-wider">{doc.roomId || 'N/A'}</span>
                      </div>
                      <div className="text-[10px] opacity-40 uppercase tracking-tighter">Floor: {doc.opdFloor || '-'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 opacity-40" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-tight">{doc.workingHours || 'Not Set'}</span>
                        <div className="flex gap-1 mt-1">
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                            const isActive = doc.consultationDays?.includes(days[idx]);
                            return (
                              <span 
                                key={idx} 
                                className={`w-4 h-4 rounded-[4px] flex items-center justify-center text-[8px] font-bold ${
                                  isActive ? 'bg-blue-500 text-white' : 'bg-white/5 opacity-20'
                                }`}
                              >
                                {day}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      doc.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' :
                      doc.status === 'On Leave' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {doc.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onEdit(doc)}
                        className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors"
                        title="Edit Doctor"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(doc.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                        title="Delete Doctor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDoctors.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Search className="w-12 h-12" />
                      <div className="font-black uppercase tracking-widest text-sm">No doctors found matching your criteria</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorTable;
