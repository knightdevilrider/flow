import React, { useState } from 'react';
import { Patient, PatientStatus, Theme } from '../types';
import { mockFirestore } from '../services/mockFirestore';
import PatientContactModal from '../components/PatientContactModal';
import { TestTube, FlaskConical, Clock, CheckCircle2, FileText, Beaker } from 'lucide-react';

interface StaffLabProps {
  patients: Patient[];
  theme: Theme;
  isAdmin?: boolean;
  onEditPatient?: (p: Patient) => void;
  onDeletePatient?: (p: Patient) => void;
}

const COMMON_TESTS = [
  'Complete Blood Count (CBC)',
  'Lipid Panel',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)',
  'Fasting Blood Sugar (FBS)',
  'Thyroid Profile (T3, T4, TSH)',
  'Urine Routine & Microscopic',
  'HbA1c',
  'C-Reactive Protein (CRP)',
  'Dengue Antigen/Antibody'
];

const StaffLab: React.FC<StaffLabProps> = ({ patients, theme, isAdmin, onEditPatient, onDeletePatient }) => {
  const [message, setMessage] = useState('');
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  
  // Lab form state
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [resultsText, setResultsText] = useState('');

  const themeStyles = {
    light: {
      card: 'bg-white border-[#D2D2D7] shadow-sm',
      btn: 'bg-[#F5F5F7] hover:bg-[#E8E8ED] border-[#D2D2D7] text-[#1D1D1F]',
      accent: 'text-[#0071e3]',
      sub: 'text-[#86868b]',
      header: 'text-[#1D1D1F]',
      input: 'bg-white border-[#D2D2D7] text-[#1D1D1F]',
      badge: 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20',
      success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    dark: {
      card: 'bg-[#1D1D1F] border-[#333] shadow-2xl',
      btn: 'bg-[#2D2D2D] hover:bg-[#3D3D3D] border-[#444] text-white',
      accent: 'text-[#0A84FF]',
      sub: 'text-[#86868b]',
      header: 'text-white',
      input: 'bg-[#2D2D2D] border-[#444] text-white',
      badge: 'bg-[#0A84FF]/10 text-[#0A84FF] border-[#0A84FF]/20',
      success: 'bg-emerald-900/10 text-emerald-400 border-emerald-900/20',
    },
    titanium: {
      card: 'bg-[#1C1C1E] border-[#3C3C3E] shadow-2xl',
      btn: 'bg-[#2C2C2E] hover:bg-[#3C3C3E] border-[#4C4C4E] text-[#F5F5F7]',
      accent: 'text-[#0A84FF]',
      sub: 'text-[#98989D]',
      header: 'text-[#F5F5F7]',
      input: 'bg-[#2C2C2E] border-[#4C4C4E] text-[#F5F5F7]',
      badge: 'bg-[#0A84FF]/10 text-[#0A84FF] border-[#0A84FF]/20',
      success: 'bg-emerald-900/20 text-emerald-400 border-emerald-800/30',
    }
  };

  const s = themeStyles[theme];

  const labQueue = patients.filter(p => p.status === PatientStatus.LAB_WAITING && !p.isAbsent)
    .sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return (a.timestamp || 0) - (b.timestamp || 0);
    });

  const toggleTest = (test: string) => {
    setSelectedTests(prev => 
      prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]
    );
  };

  const handleCall = async (patient: Patient) => {
    setViewingPatient(patient);
    setSelectedTests(patient.labTests || []);
    setResultsText(patient.labResults || '');
  };

  const handleCompleteLab = async () => {
    if (!viewingPatient) return;
    if (selectedTests.length === 0) {
      setMessage('Please select at least one test performed.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await mockFirestore.updatePatientAudited(viewingPatient.id, {
        status: PatientStatus.DOCTOR_RECONSULT,
        labTests: selectedTests,
        labResults: resultsText,
        labResultTime: Date.now()
      }, 'Lab Test Results Submitted', 'LAB_STAFF');
      
      setMessage('Results submitted successfully! Patient routed back to doctor.');
      setTimeout(() => {
        setMessage('');
        setViewingPatient(null);
        setSelectedTests([]);
        setResultsText('');
      }, 2000);
    } catch (e) {
      console.error(e);
      setMessage('Error updating results.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6">
      {/* Left Column - Processing Queue */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full md:max-w-[40%] xl:max-w-md h-full">
        <div className={`p-4 sm:p-6 rounded-3xl border flex-1 flex flex-col shadow-sm ${s.card}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2 ${s.header}`}>
                <FlaskConical className={`w-5 h-5 sm:w-6 sm:h-6 ${s.accent}`} />
                Laboratory
              </h2>
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60 ${s.sub}`}>Pending Samples & Reports</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${s.badge}`}>
              {labQueue.length}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-10">
            {labQueue.map((p, idx) => (
              <div 
                key={p.id} 
                onClick={() => handleCall(p)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group ${s.btn} ${viewingPatient?.id === p.id ? 'ring-2 ring-[#0A84FF] border-transparent' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                      p.isPriority ? 'bg-red-500 text-white' : 
                      idx === 0 ? 'bg-[#0A84FF] text-white' : 
                      'bg-black/10 dark:bg-white/10'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <div className={`text-sm font-black uppercase truncate max-w-[150px] ${s.header}`}>{p.name}</div>
                      <div className={`text-[9px] font-bold uppercase tracking-widest opacity-60 ${s.sub}`}>{p.category}</div>
                    </div>
                  </div>
                  {p.isPriority && (
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">Priority</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2">
                    {p.labTests && p.labTests.length > 0 && (
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${s.badge}`}>
                        {p.labTests.length} Tests Req
                      </span>
                    )}
                  </div>
                  <div className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 opacity-60 ${s.sub}`}>
                    <Clock className="w-3 h-3" />
                    {Math.floor((Date.now() - p.timestamp) / 60000)}m wait
                  </div>
                </div>
              </div>
            ))}
            
            {labQueue.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-10">
                <Beaker className={`w-12 h-12 mb-3 ${s.sub}`} />
                <p className={`text-xs font-bold uppercase tracking-widest ${s.sub}`}>No pending lab orders</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Lab Action Panel */}
      <div className="flex-[2] h-full">
        {viewingPatient ? (
          <div className={`p-4 sm:p-6 lg:p-8 rounded-3xl border shadow-xl h-full flex flex-col ${s.card} animate-in fade-in slide-in-from-right-4 duration-500`}>
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className={`text-2xl font-black uppercase tracking-tighter ${s.header}`}>{viewingPatient.name}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${s.badge}`}>ID: {viewingPatient.id}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest opacity-60 ${s.sub}`}>{viewingPatient.gender} • {viewingPatient.age}</span>
                </div>
              </div>
              <button 
                onClick={() => setViewingPatient(null)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${s.btn}`}
              >
                Close Profile
              </button>
            </div>

            {message && (
              <div className={`p-4 mb-6 rounded-xl text-xs font-bold uppercase tracking-widest border ${message.includes('success') ? s.success : 'bg-red-500/10 text-red-500 border-red-500/20'} animate-in fade-in slide-in-from-top-2`}>
                {message}
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
              
              <section className={`p-5 rounded-2xl border ${s.btn} border-inherit/10`}>
                <h4 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 ${s.header}`}>
                  <TestTube className={`w-4 h-4 ${s.accent}`} />
                  Select Tests Performed
                </h4>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TESTS.map(test => (
                    <button
                      key={test}
                      onClick={() => toggleTest(test)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide border transition-all ${
                        selectedTests.includes(test) 
                          ? `${s.badge} ring-1 ring-[#0A84FF]` 
                          : `${s.card} opacity-60 hover:opacity-100`
                      }`}
                    >
                      {test}
                    </button>
                  ))}
                </div>
              </section>

              <section className={`p-5 rounded-2xl border ${s.btn} border-inherit/10 flex-1 flex flex-col`}>
                <h4 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 ${s.header}`}>
                  <FileText className={`w-4 h-4 ${s.accent}`} />
                  Lab Results / Interpretation
                </h4>
                <textarea
                  value={resultsText}
                  onChange={(e) => setResultsText(e.target.value)}
                  placeholder="Enter test values, interpretation, or attach equipment output string..."
                  className={`flex-1 min-h-[150px] w-full p-4 rounded-xl text-xs font-medium outline-none border transition-all resize-none ${s.input} focus:border-[#0A84FF]`}
                />
              </section>

            </div>

            <div className="pt-6 border-t border-inherit/10 mt-6 flex justify-end gap-4">
              <button 
                onClick={handleCompleteLab}
                disabled={selectedTests.length === 0}
                className={`flex-1 sm:flex-none px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-2 ${
                  selectedTests.length > 0 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300' 
                    : 'bg-gray-500 opacity-50 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Submit Results & Complete
              </button>
            </div>

          </div>
        ) : (
          <div className={`h-full rounded-3xl border flex flex-col items-center justify-center text-center p-6 ${s.card}`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-gradient-to-br from-[#0A84FF]/20 to-purple-500/20`}>
              <FlaskConical className={`w-10 h-10 ${s.accent}`} />
            </div>
            <h3 className={`text-2xl font-black uppercase tracking-tighter mb-2 ${s.header}`}>Laboratory Station</h3>
            <p className={`text-xs font-bold tracking-widest uppercase opacity-50 max-w-xs ${s.sub}`}>
              Select a patient from the queue to process diagnostic lab tests and upload results.
            </p>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {viewingPatient && (
        <PatientContactModal 
          isOpen={false} 
          onClose={() => {}} 
          patient={viewingPatient} 
          theme={theme} 
        />
      )}
    </div>
  );
};

export default StaffLab;
