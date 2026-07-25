import React from 'react';
import { ShieldAlert, Trash2, CheckCircle2 } from 'lucide-react';
import { Patient, Theme } from '../../types';

interface HistoryLogTableProps {
  patients: Patient[];
  theme: Theme;
}

const HistoryLogTable: React.FC<HistoryLogTableProps> = ({ patients, theme }) => {
  const themeStyles = {
    dark: {
      text: 'text-white',
      sub: 'text-[#8E8E93]',
      tableHeader: 'bg-white/5 text-[#8E8E93]',
      rowHover: 'hover:bg-white/5',
      border: 'border-white/5',
      container: 'bg-[#1D1D1F] border-white/10'
    },
    light: {
      text: 'text-black',
      sub: 'text-[#636366]',
      tableHeader: 'bg-black/5 text-[#636366]',
      rowHover: 'hover:bg-black/5',
      border: 'border-black/10',
      container: 'bg-white border-black/10'
    },
    titanium: {
      text: 'text-[#E8E8ED]',
      sub: 'text-[#A1A1A6]',
      tableHeader: 'bg-white/5 text-[#A1A1A6]',
      rowHover: 'hover:bg-white/5',
      border: 'border-white/10',
      container: 'bg-[#4D4D4D] border-white/20'
    }
  };

  const s = themeStyles[theme];

  // Show only completed/discharged or deleted patients
  const inactivePatients = patients.filter(
    p => p.isDeleted || p.status === 'discharged' || p.status === 'completed'
  ).sort((a, b) => {
    // Sort by deletedAt first, then timestamp
    const timeA = a.deletedAt || a.timestamp;
    const timeB = b.deletedAt || b.timestamp;
    return timeB - timeA;
  });

  return (
    <div className={`rounded-[2.5rem] border ${s.container} overflow-hidden shadow-2xl flex flex-col`}>
      <div className="overflow-x-auto max-h-[600px] apple-scroll">
        <table className="w-full text-left relative">
          <thead className={`sticky top-0 z-10 ${s.tableHeader}`}>
            <tr>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Patient Identity</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Category</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Log Status</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Admin Note / Reason</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Timestamp</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${s.border} ${s.text}`}>
            {inactivePatients.map(p => (
              <tr key={p.id} className={`${s.rowHover} transition-colors`}>
                <td className="px-6 py-5">
                  <div className="font-bold">{p.name}</div>
                  <div className="text-[10px] opacity-50 uppercase tracking-widest">ID: {p.id} • {p.age}Y • {p.gender}</div>
                  <div className="text-[9px] opacity-40 mt-0.5">{p.contactNumber}</div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-[10px] font-black uppercase tracking-tight">{p.category}</div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    {p.isDeleted ? (
                      <span className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border bg-red-500/10 text-red-500 border-red-500/20">
                        <Trash2 className="w-3 h-3" /> DELETED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> {p.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-[10px] opacity-70 font-medium max-w-xs leading-relaxed">
                    {p.deletedReason ? (
                      <span className="text-red-500/80 italic">"{p.deletedReason}"</span>
                    ) : (
                      <span className="opacity-40">Processed / Completed standard workflow.</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-[10px] opacity-50 font-medium">
                    {new Date(p.deletedAt || p.timestamp).toLocaleString()}
                  </div>
                </td>
              </tr>
            ))}
            {inactivePatients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center opacity-30">
                    <ShieldAlert className="w-12 h-12 mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest">No inactive or deleted records found</p>
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

export default HistoryLogTable;
