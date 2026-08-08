import React, { useState } from 'react';
import { Patient, Theme, TrackingLog } from '../../types';
import { STATUS_LABELS } from '../../constants';
import { X, Clock, User, Trash2, Edit2, AlertTriangle } from 'lucide-react';

interface PatientTimelineModalProps {
  patient: Patient;
  theme: Theme;
  onClose: () => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient, reason: string) => void;
}

const PatientTimelineModal: React.FC<PatientTimelineModalProps> = ({ patient, theme, onClose, onEdit, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  
  const themeStyles = {
    light: {
      bg: 'bg-[#F5F5F7]',
      card: 'bg-white border-[#D2D2D7]',
      text: 'text-[#1D1D1F]',
      sub: 'text-[#86868b]',
      accent: 'text-[#0071e3]',
      modalBg: 'bg-white',
      timelineBorder: 'border-[#D2D2D7]'
    },
    dark: {
      bg: 'bg-[#000]',
      card: 'bg-[#1D1D1F] border-[#333]',
      text: 'text-white',
      sub: 'text-[#86868b]',
      accent: 'text-[#0A84FF]',
      modalBg: 'bg-[#1D1D1F]',
      timelineBorder: 'border-[#333]'
    },
    titanium: {
      bg: 'bg-[#1D1D1F]',
      card: 'bg-[#4D4D4D] border-[#5D5D5D]',
      text: 'text-[#E8E8ED]',
      sub: 'text-[#A1A1A6]',
      accent: 'text-[#0A84FF]',
      modalBg: 'bg-[#333333]',
      timelineBorder: 'border-[#5D5D5D]'
    }
  };

  const s = themeStyles[theme];

  const formatTime = (ts?: number) => {
    if (!ts) return '--:--';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDuration = (start?: number, end?: number) => {
    if (!start) return '--';
    if (!end) return 'Ongoing';
    const diffMins = Math.floor((end - start) / 60000);
    if (isNaN(diffMins)) return '--';
    if (diffMins < 1) return '< 1 min';
    return `${diffMins} min`;
  };

  const handleDelete = () => {
    if (!deleteReason.trim()) {
      alert("Please provide a reason for deletion.");
      return;
    }
    onDelete(patient, deleteReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl ${s.modalBg} ${s.text} border ${s.card}`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${s.card}`}>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest">Patient Details & Timeline</h2>
            <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${s.sub}`}>ID: {patient.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
          
          {/* Left Panel: Details & Actions */}
          <div className="w-full md:w-1/3 flex flex-col gap-6">
            <div className={`p-5 rounded-xl border ${s.card} bg-opacity-50`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase truncate">{patient.name}</h3>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${s.sub}`}>{patient.category}</p>
                </div>
              </div>
              
              <div className="space-y-3 mt-6">
                <div>
                  <p className={`text-[8px] font-black uppercase tracking-widest ${s.sub}`}>Current Status</p>
                  <p className="font-bold text-sm uppercase">{STATUS_LABELS[patient.status] || patient.status}</p>
                </div>
                <div>
                  <p className={`text-[8px] font-black uppercase tracking-widest ${s.sub}`}>Contact</p>
                  <p className="font-bold text-sm">{patient.contactNumber || 'N/A'}</p>
                </div>
                {patient.authorName && (
                  <div>
                    <p className={`text-[8px] font-black uppercase tracking-widest ${s.sub}`}>Registered By</p>
                    <p className="font-bold text-sm">{patient.authorName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Actions */}
            <div className={`p-5 rounded-xl border ${s.card} flex flex-col gap-3`}>
              <h4 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${s.sub}`}>Admin Controls</h4>
              
              {!isDeleting ? (
                <>
                  <button 
                    onClick={() => onEdit(patient)}
                    className="w-full py-3 rounded-lg flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Record
                  </button>
                  <button 
                    onClick={() => setIsDeleting(true)}
                    className="w-full py-3 rounded-lg flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Patient
                  </button>
                </>
              ) : (
                <div className="animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-red-500 mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Confirm Deletion</span>
                  </div>
                  <textarea
                    placeholder="Enter reason for deletion (Required)..."
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className={`w-full p-3 rounded-lg text-xs font-bold bg-black/5 dark:bg-white/5 border border-red-500/30 outline-none focus:border-red-500 mb-3 resize-none ${s.text}`}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsDeleting(false)}
                      className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-colors border ${s.card} hover:bg-black/5`}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDelete}
                      disabled={!deleteReason.trim()}
                      className="flex-1 py-2 rounded-lg text-xs font-black uppercase bg-red-500 text-white disabled:opacity-50 transition-colors"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Timeline */}
          <div className="w-full md:w-2/3">
            <h3 className={`text-xs font-black uppercase tracking-widest mb-6 ${s.sub}`}>Journey Timeline</h3>
            
            <div className="relative pl-6 border-l-2 border-dashed space-y-8" style={{ borderColor: 'rgba(150, 150, 150, 0.2)' }}>
              {(!patient.history || !Array.isArray(patient.history) || patient.history.length === 0) ? (
                <p className={`text-sm font-bold ${s.sub}`}>No history recorded.</p>
              ) : (
                patient.history.map((log: TrackingLog, idx: number) => {
                  if (!log) return null;
                  const isLast = idx === patient.history.length - 1;
                  return (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-4 ${s.modalBg} ${isLast ? 'bg-blue-500 border-blue-500/30 animate-pulse' : 'bg-gray-400 border-gray-400/30'}`} />
                      
                      <div className={`p-4 rounded-xl border ${s.card} relative ${isLast ? 'shadow-md ring-1 ring-blue-500/20' : 'opacity-70'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black text-sm uppercase tracking-wider">{STATUS_LABELS[log.stage] || log.stage}</h4>
                          <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${s.sub}`}>
                            <Clock className="w-3 h-3" />
                            {formatDuration(log.entryTime, log.exitTime)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className={`text-[8px] font-black uppercase tracking-widest ${s.sub}`}>Entered At</p>
                            <p className="text-xs font-bold">{formatTime(log.entryTime)}</p>
                          </div>
                          {log.exitTime && (
                            <div>
                              <p className={`text-[8px] font-black uppercase tracking-widest ${s.sub}`}>Exited At</p>
                              <p className="text-xs font-bold">{formatTime(log.exitTime)}</p>
                            </div>
                          )}
                        </div>
                        
                        {(log.authorId || patient.authorName) && (
                          <div className={`mt-3 pt-3 border-t ${s.card} flex items-center gap-2`}>
                            <User className="w-3 h-3 opacity-50" />
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${s.sub}`}>
                              Processed By: {log.authorId === 'STAFF_AUTO' ? 'System Workflow' : (log.authorId || patient.authorName)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientTimelineModal;
