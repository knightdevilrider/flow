import React from 'react';
import { Patient, PatientStatus, Theme } from '../../types';

interface DoctorDailySummaryProps {
  doctor: any;
  patients: Patient[];
  theme: Theme;
  themeStyles: any;
  onClose: () => void;
}

const DoctorDailySummary: React.FC<DoctorDailySummaryProps> = ({ doctor, patients, theme, themeStyles: s, onClose }) => {
  const doctorPatients = patients.filter(p => p.assignedDoctorId === doctor.id);
  
  const totalSeen = doctorPatients.filter(p => 
    p.status === PatientStatus.CONSULTATION_DONE || 
    p.status === PatientStatus.ADMISSION_DESK || 
    p.status === PatientStatus.WARD_ADMITTED
  ).length;

  const totalAdmitted = doctorPatients.filter(p => 
    p.status === PatientStatus.ADMISSION_DESK || 
    p.status === PatientStatus.WARD_ADMITTED
  ).length;

  const totalWaiting = doctorPatients.filter(p => 
    p.status === PatientStatus.DOCTOR_WAITING || 
    p.status === PatientStatus.CHECKIN_WAITING
  ).length;

  const revenueEstimate = totalSeen * 500; // Mock 500 per consult

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 ${theme === 'light' ? 'bg-[#F5F5F7]' : 'bg-[#1D1D1F]'}`}>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${s.header}`}>Daily Digest</h2>
            <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button 
            onClick={onClose}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${s.btn} hover:bg-red-500 hover:text-white hover:border-red-500`}
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className={`p-6 rounded-[2rem] border shadow-sm ${s.card} flex flex-col justify-center items-center text-center`}>
            <div className={`text-4xl font-black mb-1 ${s.header}`}>{totalSeen}</div>
            <div className={`text-[9px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Patients Seen</div>
          </div>
          <div className={`p-6 rounded-[2rem] border shadow-sm ${s.card} flex flex-col justify-center items-center text-center`}>
            <div className="text-4xl font-black mb-1 text-emerald-500">{totalAdmitted}</div>
            <div className={`text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400`}>IPD Admissions</div>
          </div>
          <div className={`p-6 rounded-[2rem] border shadow-sm ${s.card} flex flex-col justify-center items-center text-center`}>
            <div className="text-4xl font-black mb-1 text-amber-500">{totalWaiting}</div>
            <div className={`text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400`}>Remaining</div>
          </div>
          <div className={`p-6 rounded-[2rem] border shadow-sm ${s.card} flex flex-col justify-center items-center text-center`}>
            <div className={`text-2xl font-black mb-1 mt-2 ${s.header}`}>₹{revenueEstimate}</div>
            <div className={`text-[9px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Est. Revenue</div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl active:scale-95 ${theme === 'light' ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-200'}`}
        >
          Close Digest
        </button>
      </div>
    </div>
  );
};

export default DoctorDailySummary;
