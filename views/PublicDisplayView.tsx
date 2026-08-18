
import React, { useState, useEffect, useRef } from 'react';
import { Patient, PatientStatus, Theme, SystemThresholds, DoctorRoster, Doctor } from '../types';
import { STATUS_LABELS, TREATMENT_TYPES } from '../constants';
import { GoogleGenAI, Modality } from "@google/genai";
import { User, ArrowLeft, Info, RotateCcw, Monitor, Lock, Unlock, UserCog, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PatientContactModal from '../components/PatientContactModal';

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

interface FullScreenAnnouncementProps {
  patient: Patient;
  onClose: () => void;
  theme: Theme;
}

const FullScreenAnnouncement: React.FC<FullScreenAnnouncementProps & { currentLang: LanguageCode }> = ({ patient, onClose, theme, currentLang }) => {
  const t = TRANSLATIONS[currentLang];
  const announcedRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onClose]);

  useEffect(() => {
    if (announcedRef.current) return;
    announcedRef.current = true;

    const announce = async () => {
      const textToSpeak = `Attention. ${patient.name}, please proceed to ${STATUS_LABELS[patient.status]}.`;
      const cacheKey = `tts_${patient.id}_${patient.status}`;

      const playFallback = () => {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        window.speechSynthesis.speak(utterance);
      };

      try {
        const cached = localStorage.getItem(cacheKey);
        let base64Audio = cached;

        if (!base64Audio) {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: textToSpeak }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            },
          });
          base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          
          if (base64Audio) {
            try {
              localStorage.setItem(cacheKey, base64Audio);
            } catch (storageErr) {
              console.warn("Storage quota exceeded for TTS caching.");
            }
          }
        }

        if (base64Audio) {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start();
        } else {
          playFallback();
        }
      } catch (e) { 
        console.error("TTS API Error:", e);
        playFallback();
      }
    };

    announce();
  }, [patient]);

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 select-none ${theme === 'light' ? 'bg-[#050505]/95' : 'bg-[#050505]/95'} backdrop-blur-xl`}>
      <div className="text-center relative z-10 w-full max-w-7xl px-6 sm:px-12 lg:px-20 py-12 sm:py-20 rounded-[3rem] sm:rounded-[5rem] border-4 shadow-2xl bg-white dark:bg-[#0a0a0a] border-emerald-500/30 mx-4">
        <h3 className="text-2xl sm:text-5xl font-black text-emerald-500 uppercase tracking-[0.5em] sm:tracking-[1em] mb-6 sm:mb-12 animate-pulse">{t.calling}</h3>
        {patient.publicDisplayConsent && patient.photo && <div className="mb-8 flex justify-center"><img src={patient.photo} alt="Patient" className="w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 rounded-full border-8 border-emerald-500 shadow-2xl object-cover" /></div>}
        <h2 className="text-5xl sm:text-7xl md:text-[10rem] lg:text-[12rem] font-black text-[#1D1D1F] dark:text-white leading-tight sm:leading-none mb-4 tracking-tighter break-words">{currentLang === 'en' ? patient.name : transliterateToDevanagari(patient.name)}</h2>
        <p className="text-xl sm:text-3xl md:text-5xl font-bold text-[#86868b] mb-10 sm:mb-20 tracking-[0.1em] sm:tracking-[0.2em]">{t.patientId}: {patient.id}</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
          <div className="inline-block px-12 sm:px-24 py-6 sm:py-12 bg-emerald-500 rounded-full shadow-2xl">
            <p className="text-2xl sm:text-5xl md:text-7xl font-black text-white uppercase tracking-widest leading-none">{t.status[patient.status] || STATUS_LABELS[patient.status]}</p>
          </div>
          <div className="inline-block px-12 sm:px-24 py-6 sm:py-12 border-4 border-emerald-500 rounded-full">
            <p className="text-2xl sm:text-5xl md:text-7xl font-black text-emerald-500 uppercase tracking-widest leading-none tabular-nums">
              0{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PublicDisplayView: React.FC<{ 
  patients: Patient[]; 
  viewType: string; 
  theme: Theme; 
  thresholds: SystemThresholds;
  roster: DoctorRoster[];
  doctors: Doctor[];
  wards?: Ward[];
  onBack?: () => void;
  isAdmin?: boolean;
  onEditPatient?: (p: Patient) => void;
  onDeletePatient?: (p: Patient) => void;
}> = ({ patients, viewType, theme, thresholds, roster, doctors, wards = [], onBack, isAdmin, onEditPatient, onDeletePatient }) => {
  const [announcingPatient, setAnnouncingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [targetDoctorId, setTargetDoctorId] = useState<string>('');
  const [targetSection, setTargetSection] = useState<string>('');
  const [targetTreatment, setTargetTreatment] = useState<string>('');
  const [targetWard, setTargetWard] = useState<string>('');
  const [isLocked, setIsLocked] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const lastAnnouncedRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const handleAppBack = (e) => {
      if (targetDoctorId) { e.preventDefault(); setTargetDoctorId(''); return; }
      if (targetWard) { e.preventDefault(); setTargetWard(''); return; }
      if (targetTreatment) { e.preventDefault(); setTargetTreatment(''); return; }
    };
    window.addEventListener('app-back-button', handleAppBack);
    return () => window.removeEventListener('app-back-button', handleAppBack);
  }, [targetDoctorId, targetWard, targetTreatment]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex(prev => prev + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleLockToggle = () => {
    if (isLocked) {
      const pin = window.prompt("Enter Admin PIN to unlock:");
      if (pin === "1234") {
        setIsLocked(false);
      } else if (pin !== null) {
        alert("Incorrect PIN");
      }
    } else {
      setIsLocked(true);
    }
  };

  const getFilterStatuses = () => {
    switch (viewType) {
      case 'reception': return [PatientStatus.GATE_REGISTERED, PatientStatus.RECEPTION_WAITING, PatientStatus.PAYMENT_DONE];
      case 'checkin': return [PatientStatus.PAYMENT_DONE, PatientStatus.CHECKIN_WAITING];
      case 'doctor': return [PatientStatus.CHECKIN_WAITING, PatientStatus.DOCTOR_WAITING];
      case 'treatment': return [PatientStatus.TREATMENT];
      case 'medical': return [PatientStatus.CONSULTATION_DONE, PatientStatus.MEDICINE_WAITING];
      case 'ward': return [PatientStatus.ADMISSION_DESK, PatientStatus.WARD_ADMITTED, PatientStatus.ICU_ADMITTED];
      default: return [];
    }
  };

  useEffect(() => {
    const now = Date.now();
    const validStatuses = getFilterStatuses();
    const called = patients.find(p => p.lastCalledTimestamp && p.lastCalledTimestamp > now - 5000 && !lastAnnouncedRef.current[p.id] && validStatuses.includes(p.status));
    if (called) {
      lastAnnouncedRef.current[called.id] = called.lastCalledTimestamp!;
      setAnnouncingPatient(called);
    }
  }, [patients, viewType]);

  const themeStyles = {
    light: {
      bg: 'bg-[#050505]',
      card: 'bg-[#0a0a0a] border border-white/5',
      header: 'bg-[#0a0a0a] border-b border-white/5 text-white',
      text: 'text-white',
      sub: 'text-white/50',
      accent: 'text-emerald-400',
      row: 'bg-[#0a0a0a] border-white/5',
      rowAlt: 'bg-white/5 border-white/5',
    },
    dark: {
      bg: 'bg-[#050505]',
      card: 'bg-[#0a0a0a] border border-white/5',
      header: 'bg-[#0a0a0a] border-b border-white/5 text-white',
      text: 'text-white',
      sub: 'text-white/50',
      accent: 'text-emerald-400',
      row: 'bg-[#0a0a0a] border-white/5',
      rowAlt: 'bg-white/5 border-white/5',
    },
    titanium: {
      bg: 'bg-[#050505]',
      card: 'bg-[#0a0a0a] border border-white/5',
      header: 'bg-[#0a0a0a] border-b border-white/5 text-white',
      text: 'text-white',
      sub: 'text-white/50',
      accent: 'text-emerald-400',
      row: 'bg-[#0a0a0a] border-white/5',
      rowAlt: 'bg-white/5 border-white/5',
    }
  };

  const s = themeStyles[theme];

  const activePatients = patients.filter(p => p.status !== PatientStatus.COMPLETED);
  const isHighVolume = activePatients.length > thresholds.highVolumeTrigger;

  const getFilteredListLength = () => {
    return patients
      .filter(p => getFilterStatuses().includes(p.status) && !p.isDeleted)
      .filter(p => {
        if (viewType === 'doctor' && targetDoctorId) {
          if (p.assignedDoctorId && p.assignedDoctorId !== targetDoctorId) return false;
        }
        if (viewType === 'checkin' && targetSection) {
          if (p.checkinSection && p.checkinSection !== targetSection) return false;
        }
        if (viewType === 'treatment' && targetTreatment) {
          if (p.assignedTreatmentType && p.assignedTreatmentType !== targetTreatment) return false;
        }
        if (viewType === 'ward' && targetWard) {
          if (p.allocatedBedNumber && !p.allocatedBedNumber.startsWith(targetWard)) return false; 
          // Note: Ward beds are usually named like "GENERAL-1", so we check if bed starts with targetWard name or ID
        }
        return true;
      }).length;
  };

  const renderList = (filterStatuses: PatientStatus[]) => {
    const list = patients
      .filter(p => filterStatuses.includes(p.status) && !p.isDeleted)
      .filter(p => {
        if (viewType === 'doctor' && targetDoctorId) {
          if (p.assignedDoctorId && p.assignedDoctorId !== targetDoctorId) return false;
        }
        if (viewType === 'checkin' && targetSection) {
          if (p.checkinSection && p.checkinSection !== targetSection) return false;
        }
        if (viewType === 'treatment' && targetTreatment) {
          if (p.assignedTreatmentType && p.assignedTreatmentType !== targetTreatment) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.lastCalledTimestamp && b.lastCalledTimestamp) return b.lastCalledTimestamp - a.lastCalledTimestamp;
        if (a.lastCalledTimestamp) return -1;
        if (b.lastCalledTimestamp) return 1;
        return a.timestamp - b.timestamp;
      });

    const activeCalls = list.slice(0, 3);
    
    // Calculate pages
    const CAROUSEL_SIZE = 6;
    const GRID_SIZE = 32;
    const pages: any[] = [];
    let idx = 3;

    if (list.length <= 3) {
      pages.push({ type: 'empty' });
    } else {
      // Up to 2 pages of detailed carousel
      while (idx < Math.min(14, list.length)) {
        pages.push({ type: 'carousel', items: list.slice(idx, idx + CAROUSEL_SIZE), startIndex: idx });
        idx += CAROUSEL_SIZE;
      }
      // Remaining as grid
      while (idx < list.length) {
        pages.push({ type: 'grid', items: list.slice(idx, idx + GRID_SIZE), startIndex: idx });
        idx += GRID_SIZE;
      }
    }

    const activePage = pages[carouselIndex % pages.length];

    const renderPatientDetail = (p: Patient, i: number, isLarge: boolean) => {
      const elapsedMinutes = Math.floor((Date.now() - p.timestamp) / 60000);
      const baseWait = (i + 1) * 15;
      const waitTime = Math.max(1, baseWait - elapsedMinutes);
      const statusText = p.status === PatientStatus.GATE_REGISTERED ? 'Proceeding to Gate' : p.status === PatientStatus.RECEPTION_WAITING ? 'Awaiting Front Desk' : STATUS_LABELS[p.status];

      const getProgress = (st: PatientStatus) => {
        if (st === PatientStatus.GATE_REGISTERED) return { pct: 20, label: "Registration Successful" };
        if (st === PatientStatus.RECEPTION_WAITING) return { pct: 40, label: "Proceed to Reception" };
        if (st === PatientStatus.PAYMENT_DONE) return { pct: 50, label: "Proceed to Check-in" };
        if (st === PatientStatus.CHECKIN_WAITING) return { pct: 60, label: "Awaiting Vitals" };
        if (st === PatientStatus.DOCTOR_WAITING) return { pct: 80, label: "Doctor Queue" };
        if (st === PatientStatus.CONSULTATION_DONE) return { pct: 100, label: "Consultation Complete" };
        return { pct: 20, label: "Processing" };
      };
      
      const { pct, label } = getProgress(p.status);

      let containerCls = 'p-5 min-h-[110px] bg-white/5 dark:bg-[#2C2C2E] border border-white/10 rounded-[1.5rem] flex items-center gap-6 shrink-0 shadow-lg';
      let numCls = 'text-[40px] w-16 text-center';
      let firstCls = 'text-2xl';
      let lastCls = 'text-xl';
      let idCls = 'text-xs mt-1';
      let pillCls = 'w-12 h-12';
      let pillTextCls = 'text-xs';
      let statusCls = 'text-lg';
      let waitCls = 'text-xs';

      if (isLarge) {
        if (i === 0) {
          containerCls = 'p-8 min-h-[220px] bg-emerald-500 rounded-[2.5rem] border-8 border-white/10 ring-4 ring-emerald-500 flex flex-col justify-between shrink-0 shadow-2xl';
          numCls = 'text-[100px]';
          firstCls = 'text-6xl';
          lastCls = 'text-5xl';
          idCls = 'text-sm mt-3';
          pillCls = 'px-8 py-3';
          pillTextCls = 'text-2xl';
          statusCls = 'text-3xl lg:text-4xl';
          waitCls = 'text-sm';
        } else if (i === 1) {
          containerCls = 'p-6 min-h-[140px] bg-emerald-500/90 rounded-[1.5rem] border-4 border-white/10 flex flex-col justify-between shrink-0 shadow-xl';
          numCls = 'text-[60px]';
          firstCls = 'text-4xl';
          lastCls = 'text-3xl';
          idCls = 'text-xs mt-1';
          pillCls = 'px-5 py-2';
          pillTextCls = 'text-lg';
          statusCls = 'text-xl lg:text-2xl';
          waitCls = 'text-[10px]';
        } else {
          containerCls = 'p-4 min-h-[90px] bg-emerald-500/80 rounded-[1rem] border-2 border-white/10 flex flex-col justify-between shrink-0 shadow-lg';
          numCls = 'text-[40px]';
          firstCls = 'text-2xl';
          lastCls = 'text-xl';
          idCls = 'text-[10px] mt-0.5';
          pillCls = 'px-4 py-1.5';
          pillTextCls = 'text-sm';
          statusCls = 'text-base lg:text-lg';
          waitCls = 'text-[8px]';
        }
      }

      return (
        <motion.div 
          key={p.id} 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`relative overflow-hidden group transition-all duration-500 ${containerCls}`}
        >
          {isLarge && i === 0 && (
            <div className="absolute top-0 right-0 px-8 py-2 bg-white text-emerald-500 font-black text-xs uppercase tracking-[0.4em] rounded-bl-3xl shadow-lg animate-pulse z-20">
              Next to Call
            </div>
          )}
          
          {isLarge ? (
            <>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-6">
                  <span className={`${numCls} font-black leading-none text-transparent`} style={{ WebkitTextStroke: '2px rgba(255,255,255,0.6)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    {(() => {
                      const parts = p.name.split(' ');
                      const first = parts[0];
                      const last = parts.slice(1).join(' ');
                      return (
                        <>
                          <h3 className={`text-white ${firstCls} font-black uppercase tracking-tight leading-none drop-shadow-xl truncate`}>{first}</h3>
                          {last && <h4 className={`text-white/80 ${lastCls} font-bold uppercase tracking-tight leading-tight truncate`}>{last}</h4>}
                        </>
                      );
                    })()}
                    <p className={`text-white/40 ${idCls} font-black uppercase tracking-[0.2em]`}>ID: {(p.id || '').slice(-6)}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col mt-4 gap-2 overflow-hidden w-full">
                <div className="flex justify-between items-end gap-4 w-full mb-2">
                  <div className={`${pillCls} rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-sm shrink-0 flex items-center justify-center`}>
                    <span className={`text-white ${pillTextCls} font-black uppercase tracking-[0.1em]`}>{p.category.split('(')[0].trim()}</span>
                  </div>
                  <div className="text-right min-w-0 flex-1">
                    <div className={`text-white ${statusCls} font-black uppercase tracking-wider truncate`}>{statusText}</div>
                    <div className={`text-white/50 ${waitCls} font-bold uppercase tracking-[0.05em] truncate`}>EST. WAIT: <span className="text-white font-black">{waitTime} MIN</span></div>
                  </div>
                </div>
                
                {/* Visual Goal Gradient Progress Bar */}
                <div className="w-full space-y-1">
                   <div className="flex justify-between items-center px-1">
                     <span className={`text-white/80 font-black tracking-widest uppercase ${i === 0 ? 'text-xs' : 'text-[8px]'}`}>{label}</span>
                     <span className={`text-white font-black ${i === 0 ? 'text-xs' : 'text-[8px]'}`}>{pct}% Complete</span>
                   </div>
                   <div className={`w-full bg-black/20 rounded-full overflow-hidden ${i === 0 ? 'h-3' : 'h-1.5'}`}>
                     <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                   </div>
                </div>
              </div>
              <motion.div className="absolute inset-0 pointer-events-none bg-white/5" animate={{ opacity: [0.05, 0.15, 0.05] }} transition={{ duration: 2, repeat: Infinity }} />
            </>
          ) : (
            <>
              <span className={`${numCls} font-black text-[#8E8E93] text-center`}>{String(i + 1).padStart(2, '0')}</span>
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-black uppercase truncate ${s.text}`}>{p.name}</h3>
                <p className="text-xs text-[#8E8E93] font-bold uppercase tracking-widest">{p.category.split('(')[0].trim()}</p>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-sm font-black uppercase ${s.text}`}>{statusText}</div>
                <div className="text-[10px] text-[#8E8E93] font-bold">WAIT: {waitTime}M</div>
              </div>
            </>
          )}
        </motion.div>
      );
    };

    return (
      <div className="flex-1 flex p-4 gap-4 overflow-hidden">
        {/* Left Panel: Active Calls */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1 flex flex-col relative overflow-hidden bg-black/20 rounded-[2rem] border border-white/5 p-4">

            <div className="flex-1 flex flex-col justify-center gap-4">
              <AnimatePresence mode="popLayout">
                {activeCalls.length > 0 ? (
                  activeCalls.map((p, idx) => renderPatientDetail(p, idx, true))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-white/20"
                  >
                    <div className="text-6xl mb-4">☕</div>
                    <div className="font-black uppercase tracking-widest text-lg">Desk Available</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Panel: Up Next Waitlist (Carousel / Grid) */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1 flex flex-col relative overflow-hidden bg-black/20 rounded-[2rem] border border-white/5 p-4">
            <div className="flex-1 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`page-${carouselIndex % Math.max(1, pages.length)}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex flex-col"
                >
                {activePage?.type === 'empty' && (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                    <User className="w-16 h-16 mb-4 text-white/20" />
                    <h3 className="text-lg font-black text-white/40 uppercase tracking-widest">Queue is Empty</h3>
                  </div>
                )}
                
                {activePage?.type === 'carousel' && (
                  <div className="flex flex-col gap-4 pr-2">
                    {activePage.items.map((p: Patient, idx: number) => renderPatientDetail(p, activePage.startIndex + idx, false))}
                  </div>
                )}

                {activePage?.type === 'grid' && (
                  <div className="flex flex-col h-full">
                    <div className="grid grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max pr-2 pb-10">
                      {activePage.items.map((p: Patient, idx: number) => {
                        const qNum = activePage.startIndex + idx + 1;
                        return (
                          <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] text-[#8E8E93] font-bold mb-1">Queue #{qNum}</span>
                            <span className={`text-xl font-black tracking-widest ${s.text}`}>{p.tokenNumber || (p.id || '').slice(-6)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          

        </div>
      </div>
    );
  };

  const needsSelection = () => {
    if (viewType === 'doctor' && !targetDoctorId) return true;
    if (viewType === 'checkin' && !targetSection) return true;
    if (viewType === 'treatment' && !targetTreatment) return true;
    if (viewType === 'ward' && !targetWard) return true;
    return false;
  };

  const renderSelectionScreen = () => {
    let items: {id: string, label: string}[] = [];
    let onSelect = (id: string) => {};
    let title = "";

    if (viewType === 'doctor') {
      title = "Select Doctor";
      items = doctors.map(d => ({ id: d.id, label: d.name }));
      onSelect = setTargetDoctorId;
    } else if (viewType === 'checkin') {
      title = "Select Section";
      items = ['A', 'B', 'C'].map(s => ({ id: s, label: `Section ${s}` }));
      onSelect = setTargetSection;
    } else if (viewType === 'treatment') {
      title = "Select Treatment Room";
      items = TREATMENT_TYPES.map(t => ({ id: t, label: t }));
      onSelect = setTargetTreatment;
    } else if (viewType === 'ward') {
      title = "Select Ward";
      items = wards.map(w => ({ id: w.name, label: w.name }));
      onSelect = setTargetWard;
    }

    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-10 animate-in fade-in zoom-in duration-500">
        <h2 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-[0.2em] mb-12 drop-shadow-2xl">{title}</h2>
        <div className="flex flex-wrap justify-center gap-6 max-w-7xl">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="bg-white/5 backdrop-blur-md border border-white/10 hover:border-emerald-500 hover:bg-emerald-500/20 text-white rounded-[3rem] px-12 py-10 shadow-2xl transition-all hover:scale-105 active:scale-95 group flex items-center justify-center min-w-[250px]"
            >
              <span className="text-2xl sm:text-4xl font-black uppercase tracking-widest group-hover:text-emerald-500 drop-shadow-md">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const currentContent = (() => {
    if (needsSelection()) {
      return renderSelectionScreen();
    }
    switch (viewType) {
      case 'reception': return renderList([PatientStatus.GATE_REGISTERED, PatientStatus.RECEPTION_WAITING, PatientStatus.PAYMENT_DONE]);
      case 'checkin': return renderList([PatientStatus.PAYMENT_DONE, PatientStatus.CHECKIN_WAITING]);
      case 'doctor': return renderList([PatientStatus.CHECKIN_WAITING, PatientStatus.DOCTOR_WAITING]);
      case 'treatment': return renderList([PatientStatus.TREATMENT]);
      case 'medical': return renderList([PatientStatus.CONSULTATION_DONE, PatientStatus.MEDICINE_WAITING]);
      case 'ward': return renderList([PatientStatus.ADMISSION_DESK, PatientStatus.WARD_ADMITTED, PatientStatus.ICU_ADMITTED]);
      default: return null;
    }
  })();

  const getBoardTitle = () => {
    switch (viewType) {
      case 'reception': return 'Reception';
      case 'checkin': return 'Check-In';
      case 'doctor': return 'Doctor';
      case 'treatment': return 'Treatment';
      case 'medical': return 'Medical';
      case 'ward': return 'Ward';
      default: return 'Flow';
    }
  };

  const getActiveEntityName = () => {
    if (viewType === 'doctor' && targetDoctorId) return doctors.find(d => d.id === targetDoctorId)?.name || 'Doctor';
    if (viewType === 'checkin' && targetSection) return `Section ${targetSection}`;
    if (viewType === 'treatment' && targetTreatment) return targetTreatment;
    if (viewType === 'ward' && targetWard) return targetWard;
    return getBoardTitle();
  };

  return (
    <div className={`h-screen w-screen flex flex-col bg-[#121212] relative overflow-hidden`}>
      {/* High-Fidelity Header */}
      <div className="flex items-center justify-between px-16 py-6 bg-[#121212] border-b border-white/5 z-30 shrink-0">
        <div className="flex items-center gap-6 w-[350px] group">
          <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-4 group-hover:translate-x-0">
            {!isLocked && (
              <button 
                onClick={onBack} 
                className="w-16 h-16 flex items-center justify-center rounded-[2rem] bg-white/5 hover:bg-white/10 transition-all border border-white/10 shadow-lg"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-8 h-8 text-white/60" />
              </button>
            )}
            <button 
              onClick={handleLockToggle}
              className={`w-16 h-16 flex items-center justify-center rounded-[2rem] hover:bg-white/10 transition-all border shadow-lg ${isLocked ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}
              title={isLocked ? "Unlock Screen" : "Lock Screen"}
            >
              {isLocked ? <Lock className="w-8 h-8 text-red-500/80" /> : <Unlock className="w-8 h-8 text-white/60" />}
            </button>
          </div>
        </div>
        
        <div className="flex-1 text-center">
          <h1 className="text-7xl font-black text-white uppercase tracking-[0.15em] drop-shadow-2xl">{getActiveEntityName()}</h1>
        </div>
        
        <div className="flex items-center justify-end gap-6 w-[350px] relative">
          <h1 className="text-5xl font-black text-[#34C759] uppercase tracking-[0.1em] drop-shadow-2xl whitespace-nowrap">
            {Math.max(0, getFilteredListLength() - 2)} WAITING
          </h1>
          <div className="absolute top-16 right-0 flex items-center gap-4 z-50">
            {!needsSelection() && ['doctor', 'checkin', 'treatment', 'ward'].includes(viewType) && (
              <button
                onClick={() => {
                  setTargetDoctorId('');
                  setTargetSection('');
                  setTargetTreatment('');
                  setTargetWard('');
                }}
                className="bg-white/5 dark:bg-[#2C2C2E] hover:bg-white/10 text-white border border-white/20 rounded-2xl px-6 py-2 outline-none text-sm font-black tracking-widest uppercase shadow-xl transition-all"
              >
                Change Selection
              </button>
            )}
          </div>
        </div>
      </div>

      {/* High Volume / Emergency Alerts */}
      {thresholds.isMaintenanceMode && (
        <div className={`absolute top-[120px] left-0 w-full z-50 animate-bounce`}>
          <div className="px-10 py-6 flex items-center justify-center gap-8 shadow-2xl bg-red-600">
            <span className="text-4xl">⚠️</span>
            <div className="flex flex-col">
              <span className="text-white font-black uppercase tracking-[0.3em] text-lg leading-none">
                CRITICAL SYSTEM BLACKOUT
              </span>
              <span className="text-white/70 font-black uppercase tracking-widest text-[10px] mt-1">
                All non-emergency services suspended until further notice
              </span>
            </div>
            <span className="text-4xl">⚠️</span>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-hidden ${thresholds.isMaintenanceMode ? 'pt-32' : ''}`}>
        <PatientContactModal 
          patient={viewingPatient} 
          onClose={() => setViewingPatient(null)} 
          isAdmin={isAdmin}
          onEdit={onEditPatient}
          onDelete={onDeletePatient}
        />
        {announcingPatient && <FullScreenAnnouncement patient={announcingPatient} onClose={() => setAnnouncingPatient(null)} theme={theme} />}
        {currentContent}
      </div>

      {/* High-Fidelity News Ticker Footer */}
      <div className="h-12 bg-emerald-500 flex items-center overflow-hidden border-t-2 border-white/20 shadow-[0_-10px_30px_rgba(0,122,255,0.2)] z-30">
        <div className="animate-marquee flex gap-24 items-center whitespace-nowrap">
          <span className="text-emerald-500/50 text-xl font-black uppercase tracking-[0.3em]">
             THANK YOU FOR YOUR COOPERATION • WELCOME TO SAIDEEP HOSPITAL • PLEASE WATCH FOR YOUR NAME • ADVANCED HEALTH SYSTEMS • 
          </span>
          <span className="text-emerald-500/50 text-xl font-black uppercase tracking-[0.3em]">
             THANK YOU FOR YOUR COOPERATION • WELCOME TO SAIDEEP HOSPITAL • PLEASE WATCH FOR YOUR NAME • ADVANCED HEALTH SYSTEMS • 
          </span>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default PublicDisplayView;

