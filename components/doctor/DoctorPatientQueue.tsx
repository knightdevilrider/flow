import React from 'react';
import { Patient, Theme, PatientStatus } from '../../types';

interface DoctorPatientQueueProps {
  innerQueue: Patient[];
  waitingHall: Patient[];
  absentList: Patient[];
  theme: Theme;
  themeStyles: any;
  currentPatientId?: string;
  onSelectPatient?: (p: Patient) => void;
  onHoldQueue?: () => void;
  onEmergencyBypass?: () => void;
  onExit?: () => void;
  isQueueHeld?: boolean;
}

const DoctorPatientQueue: React.FC<DoctorPatientQueueProps> = ({
  innerQueue,
  waitingHall,
  absentList,
  theme,
  themeStyles: s,
  currentPatientId,
  onSelectPatient,
  onHoldQueue,
  onEmergencyBypass,
  onExit,
  isQueueHeld = false
}) => {
  
  const renderPatientCard = (p: Patient, isCurrent: boolean) => (
    <button 
      key={p.id}
      onClick={() => onSelectPatient && onSelectPatient(p)}
      className={`w-full text-left p-3 sm:p-4 rounded-xl border flex flex-col gap-2 transition-all ${
        isCurrent 
          ? `${theme === 'light' ? 'bg-[#0071e3]/10 border-[#0071e3]/30 shadow-md' : 'bg-[#0A84FF]/10 border-[#0A84FF]/30 shadow-md'}` 
          : `hover:bg-black/5 dark:hover:bg-white/5 border-transparent ${s.card}`
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs sm:text-sm font-black uppercase tracking-tight truncate ${s.header}`}>
          {p.name}
        </span>
        {p.isPriorityReconsult && (
          <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[7px] font-black uppercase tracking-widest rounded-md">
            Re-Consult
          </span>
        )}
      </div>
      <div className="flex items-center justify-between opacity-60">
        <span className={`text-[9px] font-bold uppercase tracking-widest ${s.sub}`}>
          {(p.idNumber || '').slice(-4) || 'ID N/A'} • {p.age || 'N/A'} {(p.gender || 'U')[0]}
        </span>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${
            p.status === PatientStatus.DOCTOR_WAITING ? 'bg-emerald-500 animate-pulse' :
            p.status === PatientStatus.CHECKIN_WAITING ? 'bg-amber-500' : 'bg-red-500'
          }`}></div>
          <span className={`text-[8px] font-black uppercase tracking-widest ${s.sub}`}>
            {p.status === PatientStatus.DOCTOR_WAITING ? 'In-Room/Outside' : 'Waiting Area'}
          </span>
        </div>
      </div>
    </button>
  );

  return (
    <div className={`h-[calc(100vh-12rem)] flex flex-col rounded-[2rem] border shadow-lg overflow-hidden ${s.card}`}>
      {/* Queue Header Controls */}
      <div className="p-4 sm:p-6 border-b border-black/5 dark:border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-sm sm:text-base font-black uppercase tracking-widest ${s.header}`}>
            Patient Queue
          </h3>
          <button 
            onClick={onExit}
            className={`px-4 py-1.5 rounded-full font-black text-[8px] uppercase tracking-widest transition-all border ${s.sub} hover:text-red-500 hover:border-red-500/30 active:scale-95`}
          >
            EXIT PORTAL
          </button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onHoldQueue}
            className={`flex-1 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${
              isQueueHeld 
                ? 'bg-amber-500 text-white shadow-lg animate-pulse' 
                : `${s.btn} shadow-sm`
            }`}
          >
            {isQueueHeld ? 'Queue Paused' : 'Hold Queue'}
          </button>
          <button 
            onClick={onEmergencyBypass}
            className={`flex-1 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white shadow-sm border border-red-500/20`}
          >
            Emergency Bypass
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Inner Queue */}
        <div>
          <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-2 flex items-center gap-2 ${s.accent}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Ready (Vitals Done)
          </h4>
          <div className="space-y-2">
            {innerQueue.length === 0 ? (
              <div className={`p-4 rounded-xl border border-dashed border-black/10 dark:border-white/10 text-center text-[9px] font-black uppercase tracking-widest opacity-40 ${s.sub}`}>
                No patients waiting
              </div>
            ) : (
              innerQueue.map(p => renderPatientCard(p, p.id === currentPatientId))
            )}
          </div>
        </div>

        {/* Main Hall */}
        {waitingHall.length > 0 && (
          <div>
            <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-2 flex items-center gap-2 ${s.accent}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Waiting Hall
            </h4>
            <div className="space-y-2">
              {waitingHall.map(p => renderPatientCard(p, p.id === currentPatientId))}
            </div>
          </div>
        )}

        {/* Absent */}
        {absentList.length > 0 && (
          <div>
            <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-2 flex items-center gap-2 ${s.accent}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              Absent
            </h4>
            <div className="space-y-2 opacity-50">
              {absentList.map(p => renderPatientCard(p, false))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DoctorPatientQueue;
