
import React, { useState } from 'react';
import { ShieldAlert, Trash2, X, MessageSquare } from 'lucide-react';
import { Patient, Theme } from '../../types';

interface DeletePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  patient: Patient | null;
  theme: Theme;
  isAdmin?: boolean;
}

const DeletePatientModal: React.FC<DeletePatientModalProps> = ({ isOpen, onClose, onConfirm, patient, theme, isAdmin }) => {
  const [reason, setReason] = useState('');

  if (!isOpen || !patient) return null;

  const themeStyles = {
    dark: {
      bg: 'bg-black/80',
      card: 'bg-[#1D1D1F] border-[#2D2D2D]',
      text: 'text-white',
      sub: 'text-[#86868b]',
      input: 'bg-black border-[#2D2D2D] text-white focus:border-red-500',
    },
    light: {
      bg: 'bg-black/40',
      card: 'bg-white border-[#D2D2D7]',
      text: 'text-[#1D1D1F]',
      sub: 'text-[#86868b]',
      input: 'bg-[#F5F5F7] border-[#D2D2D7] text-black focus:border-red-600',
    },
    titanium: {
      bg: 'bg-black/80',
      card: 'bg-[#4D4D4D] border-[#5D5D5D]',
      text: 'text-[#E8E8ED]',
      sub: 'text-[#A1A1A6]',
      input: 'bg-[#3D3D3D] border-[#5D5D5D] text-[#E8E8ED] focus:border-red-500',
    }
  };

  const s = themeStyles[theme];

  return (
    <div className={`fixed inset-0 z-[120] flex items-center justify-center p-6 backdrop-blur-xl ${s.bg}`}>
      <div className={`w-full max-w-md rounded-[2.5rem] border p-8 shadow-2xl transition-all ${s.card}`}>
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center text-4xl mb-6 border border-red-500/20 shadow-inner">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h2 className={`text-2xl font-black tracking-tight ${s.text}`}>
            {isAdmin ? 'Archive Patient Record?' : 'Submit Deletion Request?'}
          </h2>
          <p className={`text-sm font-medium mt-2 px-4 leading-relaxed ${s.sub}`}>
            {isAdmin ? (
              <>You are about to soft-delete <span className="text-red-500 font-bold">{patient.name}</span>. This action is audited and reversible by master administrators only.</>
            ) : (
              <>You are requesting to delete <span className="text-red-500 font-bold">{patient.name}</span>. This request will be sent to the Admin for approval.</>
            )}
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ml-1 ${s.sub}`}>
              <MessageSquare className="w-3 h-3" />
              Reason for Deletion
            </label>
            <textarea
              autoFocus
              required
              placeholder="e.g. Duplicate record, Data entry error, Patient request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold min-h-[120px] transition-all ${s.input}`}
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all border ${s.text} border-current opacity-40 hover:opacity-100`}
            >
              Cancel
            </button>
            <button
              disabled={!reason.trim()}
              onClick={() => onConfirm(reason)}
              className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl bg-red-600 text-white hover:bg-red-500 disabled:opacity-30 active:scale-95 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isAdmin ? 'Archive' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletePatientModal;
