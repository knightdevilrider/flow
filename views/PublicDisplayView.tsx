
import React, { useState, useEffect, useRef } from 'react';
import { Patient, PatientStatus, Theme, SystemThresholds, DoctorRoster, Doctor } from '../types';
import { STATUS_LABELS, TREATMENT_TYPES } from '../constants';
import { GoogleGenAI, Modality } from "@google/genai";
import { User, ArrowLeft, Info, RotateCcw, Monitor, Lock, UserCog, Trash2 } from 'lucide-react';
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

const FullScreenAnnouncement: React.FC<FullScreenAnnouncementProps> = ({ patient, onClose, theme }) => {
  const announcedRef = useRef(false);

  useEffect(() => {
    if (announcedRef.current) return;
    announcedRef.current = true;

    const announce = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: `Attention. ${patient.name}, please proceed to ${STATUS_LABELS[patient.status]}.` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start();
        }
      } catch (e) { console.error(e); }
    };

    announce();
    setTimeout(onClose, 6000);
  }, [patient, onClose]);

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center animate-in fade-in zoom-in duration-500 select-none ${theme === 'light' ? 'bg-[#F5F5F7]/95' : 'bg-[#000]/95'} backdrop-blur-xl`}>
      <div className="text-center relative z-10 w-full px-6 sm:px-12 lg:px-20 py-12 sm:py-20 rounded-[3rem] sm:rounded-[5rem] border-4 shadow-2xl bg-white dark:bg-[#1D1D1F] border-[#0A84FF]/30 mx-4">
        <h3 className="text-2xl sm:text-5xl font-black text-[#0A84FF] uppercase tracking-[0.5em] sm:tracking-[1em] mb-6 sm:mb-12 animate-pulse">Calling</h3>
        <h2 className="text-5xl sm:text-7xl md:text-[10rem] lg:text-[12rem] font-black text-[#1D1D1F] dark:text-white leading-tight sm:leading-none mb-4 tracking-tighter break-words">{patient.name}</h2>
        <p className="text-xl sm:text-3xl md:text-5xl font-bold text-[#86868b] mb-10 sm:mb-20 tracking-[0.1em] sm:tracking-[0.2em]">PATIENT ID: {patient.id}</p>
        <div className="inline-block px-12 sm:px-24 py-6 sm:py-12 bg-[#0A84FF] rounded-full shadow-2xl">
          <p className="text-2xl sm:text-5xl md:text-7xl font-black text-white uppercase tracking-widest leading-none">{STATUS_LABELS[patient.status]}</p>
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
  onBack?: () => void;
  isAdmin?: boolean;
  onEditPatient?: (p: Patient) => void;
  onDeletePatient?: (p: Patient) => void;
}> = ({ patients, viewType, theme, thresholds, roster, doctors, onBack, isAdmin, onEditPatient, onDeletePatient }) => {
  const [announcingPatient, setAnnouncingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [targetDoctorId, setTargetDoctorId] = useState<string>('');
  const [targetSection, setTargetSection] = useState<string>('');
  const [targetTreatment, setTargetTreatment] = useState<string>('');
  const lastAnnouncedRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const now = Date.now();
    const called = patients.find(p => p.lastCalledTimestamp && p.lastCalledTimestamp > now - 5000 && !lastAnnouncedRef.current[p.id]);
    if (called) {
      lastAnnouncedRef.current[called.id] = called.lastCalledTimestamp!;
      setAnnouncingPatient(called);
    }
  }, [patients]);

  const themeStyles = {
    light: {
      bg: 'bg-[#F5F5F7]',
      card: 'bg-white border-[#D2D2D7]',
      header: 'bg-white border-[#D2D2D7] text-[#1D1D1F]',
      text: 'text-[#1D1D1F]',
      sub: 'text-[#86868b]',
      accent: 'text-[#0071e3]',
      row: 'bg-white border-[#D2D2D7]',
      rowAlt: 'bg-[#F5F5F7] border-[#D2D2D7]',
    },
    dark: {
      bg: 'bg-[#000]',
      card: 'bg-[#1D1D1F] border-[#333]',
      header: 'bg-[#1D1D1F] border-[#333] text-white',
      text: 'text-white',
      sub: 'text-[#86868b]',
      accent: 'text-[#0A84FF]',
      row: 'bg-[#1D1D1F] border-[#333]',
      rowAlt: 'bg-[#2D2D2D] border-[#333]',
    },
    titanium: {
      bg: 'bg-[#1D1D1F]',
      card: 'bg-[#4D4D4D] border-[#5D5D5D]',
      header: 'bg-[#4D4D4D] border-[#5D5D5D] text-[#E8E8ED]',
      text: 'text-[#E8E8ED]',
      sub: 'text-[#A1A1A6]',
      accent: 'text-[#0A84FF]',
      row: 'bg-[#4D4D4D] border-[#5D5D5D]',
      rowAlt: 'bg-[#5D5D5D] border-[#5D5D5D]',
    }
  };

  const s = themeStyles[theme];

  const activePatients = patients.filter(p => p.status !== PatientStatus.COMPLETED);
  const isHighVolume = activePatients.length > thresholds.highVolumeTrigger;

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
      })
      .slice(0, 10);

    return (
      <div className="flex-1 flex flex-col px-10 pb-6 overflow-hidden">
        {/* Column Headers - Refined Grid Alignment */}
        <div className="grid grid-cols-[100px_2.5fr_1fr_1.5fr] gap-6 px-16 py-6 mb-2">
          <div className="text-[#8E8E93] text-base font-black uppercase tracking-[0.5em]">No</div>
          <div className="text-[#8E8E93] text-base font-black uppercase tracking-[0.5em]">Patient Name</div>
          <div className="text-[#8E8E93] text-base font-black uppercase tracking-[0.5em] text-center">Service</div>
          <div className="text-[#8E8E93] text-base font-black uppercase tracking-[0.5em] text-right">Status & Time</div>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 space-y-4 apple-scroll">
          <AnimatePresence mode="popLayout">
            {list.map((p, i) => {
              const isFirst = i === 0;
              // Dynamic countdown: Base estimate - elapsed minutes since registration
              const elapsedMinutes = Math.floor((Date.now() - p.timestamp) / 60000);
              const baseWait = (i + 1) * 15;
              const waitTime = Math.max(1, baseWait - elapsedMinutes);
              
              const statusText = p.status === PatientStatus.GATE_REGISTERED 
                ? 'Proceeding to Gate' 
                : p.status === PatientStatus.RECEPTION_WAITING 
                ? 'Awaiting Front Desk' 
                : STATUS_LABELS[p.status];

              return (
                <motion.div 
                  key={p.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className={`grid grid-cols-[100px_2.5fr_1fr_1.5fr] items-center gap-6 bg-[#007AFF] rounded-[1.5rem] relative overflow-hidden group transition-all duration-500 shadow-[0_15px_30px_rgba(0,122,255,0.2)] ${
                    isFirst ? 'p-10 min-h-[180px] border-8 border-white/10 ring-4 ring-[#007AFF] scale-[1.01]' : 'p-3 min-h-[70px]'
                  }`}
                >
                  {/* Next Up Badge for first item */}
                  {isFirst && (
                    <div className="absolute top-0 right-0 px-8 py-2 bg-white text-[#007AFF] font-black text-xs uppercase tracking-[0.4em] rounded-bl-3xl shadow-lg animate-pulse z-20">
                      Next to Call
                    </div>
                  )}

                  {/* Queue Number */}
                  <div className="flex justify-center items-center">
                    <span 
                      className={`${isFirst ? 'text-[120px]' : 'text-[40px]'} font-black leading-none text-transparent transition-all duration-500`}
                      style={{ WebkitTextStroke: `${isFirst ? '3px' : '1px'} rgba(255,255,255,0.6)` }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Profile + Name */}
                  <div className="flex items-center gap-8 overflow-hidden">
                    <div className={`${isFirst ? 'w-24 h-24' : 'w-10 h-10'} rounded-full bg-[#B2E0FF] border-[4px] border-white/30 flex items-center justify-center flex-shrink-0 shadow-inner relative transition-all duration-500`}>
                      <User className={`${isFirst ? 'w-12 h-12' : 'w-5 h-5'} text-[#5856D6]`} />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      {(() => {
                        const parts = p.name.split(' ');
                        const first = parts[0];
                        const last = parts.slice(1).join(' ');
                        return (
                          <>
                            <h3 className={`text-white ${isFirst ? 'text-4xl md:text-5xl' : 'text-lg md:text-xl'} font-black uppercase tracking-tight leading-none drop-shadow-xl truncate`}>
                              {first}
                            </h3>
                            {last && (
                              <h4 className={`text-white/80 ${isFirst ? 'text-3xl md:text-4xl' : 'text-base md:text-lg'} font-bold uppercase tracking-tight leading-tight truncate`}>
                                {last}
                              </h4>
                            )}
                          </>
                        );
                      })()}
                      {isFirst && <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-2">ID: {p.id.slice(-6)}</p>}
                    </div>
                  </div>

                  {/* Service Pill */}
                  <div className="flex justify-center">
                    <div className={`${isFirst ? 'px-8 py-3' : 'px-3 py-1'} rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-sm transition-all duration-500`}>
                      <span className={`text-white ${isFirst ? 'text-xl' : 'text-[9px]'} font-black uppercase tracking-[0.1em]`}>
                        {p.category.split('(')[0].trim()}
                      </span>
                    </div>
                  </div>

                  {/* Destination & Situation */}
                  <div className="flex items-center gap-6 justify-end pr-6">
                    <div className="text-right">
                      <div className={`text-white ${isFirst ? 'text-3xl' : 'text-base'} font-black uppercase tracking-wider transition-all duration-500`}>
                        {statusText}
                      </div>
                      <div className={`text-white/50 ${isFirst ? 'text-xs' : 'text-[8px]'} font-bold uppercase tracking-[0.05em]`}>
                        EST. WAIT: <span className="text-white font-black">{waitTime} MIN</span>
                      </div>
                    </div>
                  </div>

                  {/* First Item Glow Effect */}
                  {isFirst && (
                    <motion.div 
                      className="absolute inset-0 pointer-events-none bg-white/5"
                      animate={{ opacity: [0.05, 0.15, 0.05] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {list.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-5">
              <Monitor className="w-[20rem] h-[20rem]" />
              <p className="text-5xl font-black uppercase tracking-[0.8em] mt-10">Current Status: Clear</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const currentContent = (() => {
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

  return (
    <div className={`h-screen w-screen flex flex-col bg-[#121212] relative overflow-hidden`}>
      {/* High-Fidelity Header */}
      <div className="flex items-center justify-between px-16 py-10 bg-[#121212] border-b border-white/5 z-30 shrink-0">
        <div className="flex items-center gap-6 w-[350px] group">
          <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-4 group-hover:translate-x-0">
            <button 
              onClick={onBack} 
              className="w-16 h-16 flex items-center justify-center rounded-[2rem] bg-white/5 hover:bg-white/10 transition-all border border-white/10 shadow-lg"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-8 h-8 text-white/60" />
            </button>
            <button 
              className="w-16 h-16 flex items-center justify-center rounded-[2rem] bg-white/5 hover:bg-white/10 transition-all border border-white/10 shadow-lg"
              title="Lock Screen"
            >
              <Lock className="w-8 h-8 text-white/60" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 text-center">
          <h1 className="text-7xl font-black text-white uppercase tracking-[0.15em] drop-shadow-2xl">{getBoardTitle()}</h1>
        </div>
        
        <div className="flex items-center justify-end gap-6 w-[350px] opacity-0 hover:opacity-100 transition-opacity">
          {viewType === 'doctor' && (
            <select 
              value={targetDoctorId} 
              onChange={e => setTargetDoctorId(e.target.value)}
              className="bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2 outline-none text-sm font-bold"
            >
              <option value="">All Doctors</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id} className="text-black">{d.name}</option>
              ))}
            </select>
          )}
          {viewType === 'checkin' && (
            <select 
              value={targetSection} 
              onChange={e => setTargetSection(e.target.value)}
              className="bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2 outline-none text-sm font-bold"
            >
              <option value="">All Sections</option>
              {['A', 'B', 'C'].map(s => (
                <option key={s} value={s} className="text-black">Section {s}</option>
              ))}
            </select>
          )}
          {viewType === 'treatment' && (
            <select 
              value={targetTreatment} 
              onChange={e => setTargetTreatment(e.target.value)}
              className="bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2 outline-none text-sm font-bold"
            >
              <option value="">All Treatments</option>
              {TREATMENT_TYPES.map(t => (
                <option key={t} value={t} className="text-black">{t}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* High Volume / Emergency Alerts */}
      {(isHighVolume || thresholds.isMaintenanceMode) && (
        <div className={`absolute top-[120px] left-0 w-full z-50 animate-bounce`}>
          <div className={`px-10 py-6 flex items-center justify-center gap-8 shadow-2xl ${thresholds.isMaintenanceMode ? 'bg-red-600' : 'bg-amber-500'}`}>
            <span className="text-4xl">⚠️</span>
            <div className="flex flex-col">
              <span className="text-white font-black uppercase tracking-[0.3em] text-lg leading-none">
                {thresholds.isMaintenanceMode ? 'CRITICAL SYSTEM BLACKOUT' : 'ANALYTICS: HIGH VOLUME MODE'}
              </span>
              <span className="text-white/70 font-black uppercase tracking-widest text-[10px] mt-1">
                {thresholds.isMaintenanceMode ? 'All non-emergency services suspended until further notice' : `Waiting threshold exceeded (${activePatients.length} active subjects)`}
              </span>
            </div>
            <span className="text-4xl">⚠️</span>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-hidden ${(isHighVolume || thresholds.isMaintenanceMode) ? 'pt-32' : ''}`}>
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
      <div className="h-24 bg-[#007AFF] flex items-center overflow-hidden border-t-4 border-white/20 shadow-[0_-20px_50px_rgba(0,122,255,0.2)] z-30">
        <div className="animate-marquee flex gap-24 items-center whitespace-nowrap">
          <span className="text-white text-4xl font-black uppercase tracking-[0.3em]">
             THANK YOU FOR YOUR COOPERATION • WELCOME TO SAIDEEP HOSPITAL • PLEASE WATCH FOR YOUR NAME • ADVANCED HEALTH SYSTEMS • 
          </span>
          <span className="text-white text-4xl font-black uppercase tracking-[0.3em]">
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

