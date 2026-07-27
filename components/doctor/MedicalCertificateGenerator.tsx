import React, { useState } from 'react';
import { Patient, Theme } from '../../types';

interface MedicalCertificateGeneratorProps {
  patient: Patient;
  theme: Theme;
  themeStyles: any;
  onGenerate: (certificateDetails: any) => void;
}

const MedicalCertificateGenerator: React.FC<MedicalCertificateGeneratorProps> = ({ patient, theme, themeStyles: s, onGenerate }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [diagnosis, setDiagnosis] = useState('');
  const [remarks, setRemarks] = useState('Advised complete rest.');

  const handleGenerate = () => {
    onGenerate({
      type: 'Medical Leave Certificate',
      patientId: patient.id,
      patientName: patient.name,
      fromDate,
      toDate,
      diagnosis,
      remarks,
      issuedOn: new Date().toISOString()
    });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all shadow-sm flex items-center gap-2 ${s.badge} hover:bg-[#0071e3]/5`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        Med Certificate
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className={`relative w-full max-w-md rounded-[2rem] shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 ${theme === 'light' ? 'bg-white' : 'bg-[#1D1D1F]'}`}>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className={`text-lg font-black tracking-tight ${s.header}`}>Medical Certificate</h3>
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>For {patient.name}</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${s.btn}`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>From Date</label>
                  <input 
                    type="date" 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className={`w-full rounded-xl px-4 py-3 font-bold text-xs border-2 outline-none transition-all ${s.input}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>To Date</label>
                  <input 
                    type="date" 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className={`w-full rounded-xl px-4 py-3 font-bold text-xs border-2 outline-none transition-all ${s.input}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Primary Diagnosis</label>
                <input 
                  type="text" 
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Viral Fever"
                  className={`w-full rounded-xl px-4 py-3 font-bold text-xs border-2 outline-none transition-all ${s.input}`}
                />
              </div>

              <div className="space-y-2">
                <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Remarks</label>
                <textarea 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 font-bold text-xs border-2 outline-none transition-all resize-none ${s.input}`}
                  rows={2}
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={!diagnosis}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 ${theme === 'light' ? 'bg-[#0071e3] text-white hover:bg-blue-600' : 'bg-[#0A84FF] text-white hover:bg-blue-500'}`}
              >
                Generate & Attach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalCertificateGenerator;
