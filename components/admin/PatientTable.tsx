
import React from 'react';
import { Trash2, Edit2, ShieldAlert } from 'lucide-react';
import { Patient, Theme } from '../../types';

interface PatientTableProps {
  patients: Patient[];
  onPatientClick: (patient: Patient) => void;
  theme: Theme;
}

const PatientTable: React.FC<PatientTableProps> = ({ patients, onPatientClick, theme }) => {
  const themeStyles = {
    dark: {
      text: 'text-white',
      sub: 'text-[#8E8E93]',
      tableHeader: 'bg-white/5 text-[#8E8E93]',
      rowHover: 'hover:bg-white/5',
      border: 'border-white/5'
    },
    light: {
      text: 'text-black',
      sub: 'text-[#636366]',
      tableHeader: 'bg-black/5 text-[#636366]',
      rowHover: 'hover:bg-black/5',
      border: 'border-black/10'
    },
    titanium: {
      text: 'text-[#E8E8ED]',
      sub: 'text-[#A1A1A6]',
      tableHeader: 'bg-white/5 text-[#A1A1A6]',
      rowHover: 'hover:bg-white/5',
      border: 'border-white/10'
    }
  };

  const s = themeStyles[theme];

  const activePatients = patients.filter(p => !p.isDeleted && p.status !== 'discharged' && p.status !== 'completed');

  return (
    <div className={`rounded-[2.5rem] border ${s.border} overflow-hidden shadow-xl`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className={s.tableHeader}>
            <tr>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Patient Details</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Medical Info</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Admission</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${s.border} ${s.text}`}>
            {activePatients.map(p => (
              <tr key={p.id} onClick={() => onPatientClick(p)} className={`${s.rowHover} transition-colors cursor-pointer`}>
                <td className="px-6 py-5">
                  <div className="font-bold">{p.name}</div>
                  <div className="text-[10px] opacity-50 uppercase tracking-widest">ID: {p.id} • {p.age}Y • {p.gender}</div>
                  <div className="text-[9px] opacity-40 mt-0.5">{p.contactNumber}</div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex gap-1.5 flex-wrap">
                    {p.bloodGroup && (
                      <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[8px] font-black border border-red-500/20">
                        {p.bloodGroup}
                      </span>
                    )}
                    {p.allergies && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[8px] font-black border border-amber-500/20">
                        ALLERGIES
                      </span>
                    )}
                    {p.chronicConditions && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[8px] font-black border border-blue-500/20">
                        CHRONIC
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] opacity-50 mt-1 truncate max-w-[150px]">
                    {p.allergies || 'No known allergies'}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-[10px] font-black uppercase tracking-tight">{p.category}</div>
                  <div className="text-[9px] opacity-50 font-medium">Bed: {p.allocatedBedNumber || 'Not assigned'}</div>
                  <div className="text-[8px] opacity-30 mt-0.5">{new Date(p.timestamp).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${
                    p.status.includes('discharged') ? 'bg-slate-500/10 text-slate-500 border-slate-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  }`}>
                    {p.status.replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {activePatients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center opacity-30">
                    <ShieldAlert className="w-12 h-12 mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest">No active patient records found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientTable;
