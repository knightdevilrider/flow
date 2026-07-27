import React from 'react';
import { Patient, Theme } from '../../types';

interface PatientHistoryTimelineProps {
  patient: Patient | null;
  onClose: () => void;
  theme: Theme;
  themeStyles: any;
}

// Mock historical data since real past visits array doesn't exist deeply on the Patient type yet
const generateMockHistory = (patientName: string) => [
  {
    date: '2026-06-15',
    type: 'Consultation',
    doctor: 'Dr. Sharma',
    notes: 'Patient reported mild fever and body ache. Prescribed Paracetamol 650mg.',
    vitals: { temp: '100.2', bp: '120/80', pulse: '88' }
  },
  {
    date: '2026-01-10',
    type: 'Lab Test',
    doctor: 'Lab Dept',
    notes: 'Complete Blood Count (CBC). Hb: 13.5 g/dL (Normal). WBC slightly elevated.',
    vitals: null
  },
  {
    date: '2025-11-05',
    type: 'Consultation',
    doctor: 'Dr. Verma',
    notes: 'Routine checkup. Blood pressure stable. Advised diet control.',
    vitals: { temp: '98.6', bp: '118/78', pulse: '72' }
  }
];

const PatientHistoryTimeline: React.FC<PatientHistoryTimelineProps> = ({ patient, onClose, theme, themeStyles: s }) => {
  if (!patient) return null;

  const history = generateMockHistory(patient.name);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`relative w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right transition-transform ${theme === 'light' ? 'bg-[#F5F5F7]' : 'bg-[#1D1D1F]'}`}>
        
        {/* Header */}
        <div className={`p-6 flex items-center justify-between border-b ${theme === 'light' ? 'border-[#D2D2D7] bg-white' : 'border-[#333] bg-[#2D2D2D]'}`}>
          <div>
            <h2 className={`text-lg font-black tracking-tight ${s.header}`}>Patient History</h2>
            <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>{patient.name}</p>
          </div>
          <button 
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all hover:bg-red-500 hover:text-white hover:border-red-500 active:scale-95 ${s.btn}`}
          >
            ✕
          </button>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8 relative">
            {/* Vertical Line */}
            <div className={`absolute top-2 bottom-0 left-[15px] w-0.5 ${theme === 'light' ? 'bg-[#D2D2D7]' : 'bg-[#444]'}`}></div>

            {history.map((event, idx) => (
              <div key={idx} className="relative pl-10">
                {/* Timeline Dot */}
                <div className={`absolute top-1 left-[11px] w-2.5 h-2.5 rounded-full border-2 ${
                  event.type === 'Lab Test' 
                    ? 'bg-amber-500 border-amber-200' 
                    : 'bg-[#0071e3] border-blue-200'
                }`}></div>

                {/* Event Card */}
                <div className={`p-4 rounded-2xl border shadow-sm ${s.card}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-tight ${s.header}`}>{event.type}</h4>
                      <p className={`text-[9px] font-bold ${s.sub}`}>{event.doctor}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-black/5 dark:bg-white/5 ${s.sub}`}>
                      {event.date}
                    </span>
                  </div>
                  
                  <p className={`text-[11px] font-medium leading-relaxed mb-3 ${s.header}`}>
                    {event.notes}
                  </p>

                  {event.vitals && (
                    <div className="flex gap-3 pt-3 border-t border-black/5 dark:border-white/5">
                      <div className="flex flex-col">
                        <span className={`text-[8px] font-black uppercase opacity-60 ${s.sub}`}>Temp</span>
                        <span className={`text-[10px] font-bold ${s.header}`}>{event.vitals.temp}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[8px] font-black uppercase opacity-60 ${s.sub}`}>BP</span>
                        <span className={`text-[10px] font-bold ${s.header}`}>{event.vitals.bp}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[8px] font-black uppercase opacity-60 ${s.sub}`}>Pulse</span>
                        <span className={`text-[10px] font-bold ${s.header}`}>{event.vitals.pulse}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="relative pl-10 pb-4">
               <div className={`absolute top-1 left-[11px] w-2.5 h-2.5 rounded-full border-2 bg-gray-400 border-gray-200`}></div>
               <p className={`text-[10px] font-black uppercase tracking-widest italic opacity-40 ${s.sub}`}>End of Records</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatientHistoryTimeline;
