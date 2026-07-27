import React, { useState, useEffect, useRef } from 'react';

interface ClinicalNotesDictationProps {
  value: string;
  onChange: (value: string) => void;
  themeStyles: any;
}

const MACROS = [
  { label: 'Type 2 Diabetes Routine', text: 'Patient presents for routine checkup of Type 2 Diabetes Mellitus. \nVitals stable. \nAdvised to continue current medication and maintain diabetic diet. \nReview in 3 months with HbA1c.' },
  { label: 'Viral Fever Protocol', text: 'Patient presents with acute onset fever, body ache, and mild upper respiratory symptoms. \nNo localized signs of infection. \nAdvised rest, adequate hydration, and symptomatic management. \nReview after 3 days if fever persists.' },
  { label: 'Hypertension Follow-up', text: 'Follow-up for essential hypertension. \nBP adequately controlled. \nNo new complaints of headache, dizziness, or chest pain. \nContinue current anti-hypertensive regimen.' },
];

const ClinicalNotesDictation: React.FC<ClinicalNotesDictationProps> = ({ value, onChange, themeStyles: s }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          onChange(value + ' ' + finalTranscript.trim() + ' ');
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [value, onChange]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const insertMacro = (text: string) => {
    onChange(value ? `${value}\n\n${text}` : text);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Clinical Notes & Directive</label>
        <div className="flex items-center gap-2">
          {/* Macro Dropdown */}
          <div className="relative group">
            <button type="button" className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${s.badge} hover:bg-[#0071e3]/10`}>
              + Insert Macro
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border shadow-xl bg-white dark:bg-[#1D1D1F] border-black/10 dark:border-white/10 hidden group-hover:block z-50">
              {MACROS.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => insertMacro(m.text)}
                  className={`w-full text-left px-4 py-3 text-[9px] font-bold border-b last:border-b-0 border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 ${s.header}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Dictation Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
              isListening ? 'bg-red-500 text-white animate-pulse shadow-red-500/50' : s.btn
            }`}
            title="Voice Dictation"
          >
            {isListening ? (
              <span className="text-[10px] sm:text-xs">🎙️</span>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="sm:w-4 sm:h-4"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
            )}
          </button>
        </div>
      </div>
      
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Dictate or type symptoms, diagnosis, medical plan..."
          rows={5}
          className={`w-full rounded-2xl px-6 py-4 font-bold text-xs sm:text-sm resize-none border-2 outline-none transition-all ${s.input} focus:ring-4 focus:ring-[#0071e3]/20 shadow-inner`}
        />
        {isListening && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 text-red-500 bg-red-500/10 px-3 py-1 rounded-full pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-[8px] font-black uppercase tracking-widest">Listening...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalNotesDictation;
