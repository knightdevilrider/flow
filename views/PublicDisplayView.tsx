
import React, { useState, useEffect, useRef } from 'react';
import { Patient, PatientStatus, PatientCategory } from '../types';
import { STATUS_LABELS } from '../constants';
import { GoogleGenAI, Modality } from "@google/genai";

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
}

const FullScreenAnnouncement: React.FC<FullScreenAnnouncementProps> = ({ patient, onClose }) => {
  const announcedRef = useRef(false);

  useEffect(() => {
    if (announcedRef.current) return;
    announcedRef.current = true;

    const announce = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: `Attention please. ${patient.name}, please proceed to ${STATUS_LABELS[patient.status]}.` }] }],
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
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center animate-in fade-in duration-500 select-none">
      <div className="absolute inset-0 bg-blue-600/5 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
      </div>
      <div className="text-center relative z-10 p-12 glass rounded-[4rem] border-4 border-blue-500/30 shadow-[0_0_100px_rgba(59,130,246,0.2)]">
        <h3 className="text-4xl font-black text-blue-400 uppercase tracking-[1em] mb-8 animate-pulse">Now Calling</h3>
        <h2 className="text-[12rem] font-black text-white leading-none mb-4 tracking-tighter">{patient.name}</h2>
        <p className="text-4xl font-mono text-blue-500 font-black mb-16 tracking-[0.4em]">PATIENT ID: {patient.id}</p>
        <div className="inline-block px-24 py-10 bg-blue-600 rounded-[3rem] shadow-2xl">
          <p className="text-6xl font-black text-white uppercase tracking-widest">{STATUS_LABELS[patient.status]}</p>
        </div>
      </div>
    </div>
  );
};

const PublicDisplayView: React.FC<{ patients: Patient[]; viewType: string }> = ({ patients, viewType }) => {
  const [announcingPatient, setAnnouncingPatient] = useState<Patient | null>(null);
  const lastAnnouncedRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const now = Date.now();
    const called = patients.find(p => p.lastCalledTimestamp && p.lastCalledTimestamp > now - 5000 && !lastAnnouncedRef.current[p.id]);
    if (called) {
      lastAnnouncedRef.current[called.id] = called.lastCalledTimestamp!;
      setAnnouncingPatient(called);
    }
  }, [patients]);

  const getCategoryColor = (cat: string) => {
    if (cat.includes('OPD')) return 'bg-blue-500';
    if (cat.includes('IPD')) return 'bg-indigo-500';
    if (cat.includes('Emergency')) return 'bg-red-500';
    return 'bg-slate-500';
  };

  const renderList = (filterStatuses: PatientStatus[]) => {
    const list = patients
      .filter(p => filterStatuses.includes(p.status))
      .sort((a, b) => {
        // Show last called patients at the very top
        if (a.lastCalledTimestamp && b.lastCalledTimestamp) return b.lastCalledTimestamp - a.lastCalledTimestamp;
        if (a.lastCalledTimestamp) return -1;
        if (b.lastCalledTimestamp) return 1;
        return a.timestamp - b.timestamp;
      })
      .slice(0, 8);

    return (
      <div className="h-full w-full flex flex-col p-6 gap-4 bg-[#020617]">
        {/* Header Row */}
        <div className="grid grid-cols-12 px-12 py-4 text-[1.2rem] font-black text-slate-500 uppercase tracking-[0.3em]">
          <div className="col-span-1">Pos</div>
          <div className="col-span-2 text-center">Identity</div>
          <div className="col-span-4">Patient Name</div>
          <div className="col-span-2">Department</div>
          <div className="col-span-3 text-right">Status / Location</div>
        </div>

        {list.map((p, i) => {
          const isFirst = i === 0;
          const catColor = getCategoryColor(p.category);
          
          return (
            <div 
              key={p.id} 
              className={`grid grid-cols-12 items-center rounded-[2rem] border transition-all duration-500 overflow-hidden relative ${
                isFirst 
                ? 'bg-slate-900 border-blue-500/50 h-[18%] shadow-[0_0_60px_rgba(59,130,246,0.1)]' 
                : 'bg-slate-900/40 border-slate-800/60 h-[10%]'
              }`}
            >
              {/* Vertical Color Indicator */}
              <div className={`absolute left-0 top-0 bottom-0 w-3 ${catColor}`}></div>

              {/* Position Number */}
              <div className="col-span-1 pl-12">
                <span className={`font-black italic ${isFirst ? 'text-8xl text-blue-500' : 'text-4xl text-slate-700'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Photo */}
              <div className="col-span-2 flex justify-center">
                <div className={`${isFirst ? 'w-24 h-24' : 'w-16 h-16'} rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden shadow-lg`}>
                  {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>}
                </div>
              </div>

              {/* Name & ID */}
              <div className="col-span-4">
                <h3 className={`font-black tracking-tighter text-white truncate ${isFirst ? 'text-6xl' : 'text-4xl'}`}>
                  {p.name}
                </h3>
                <p className={`font-mono font-bold text-slate-500 ${isFirst ? 'text-xl mt-1' : 'text-sm'}`}>
                  ID: {p.id}
                </p>
              </div>

              {/* Category */}
              <div className="col-span-2">
                <div className={`inline-block px-4 py-2 rounded-xl text-white font-black uppercase tracking-widest text-center ${catColor} bg-opacity-20 border border-current border-opacity-30 ${isFirst ? 'text-lg' : 'text-xs'}`}>
                  {p.category.split('(')[0].trim()}
                </div>
              </div>

              {/* Status Badge */}
              <div className="col-span-3 text-right pr-12">
                <div className={`inline-flex items-center justify-center px-10 py-4 rounded-full font-black uppercase tracking-widest whitespace-nowrap ${
                  isFirst 
                  ? 'bg-blue-600 text-white text-3xl animate-pulse shadow-lg' 
                  : 'bg-slate-800 text-slate-400 text-xl'
                }`}>
                  {STATUS_LABELS[p.status]}
                </div>
              </div>
            </div>
          );
        })}

        {list.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20">
            <span className="text-[15rem]">📋</span>
            <p className="text-4xl font-black text-white uppercase tracking-[1em]">Queue Empty</p>
          </div>
        )}
      </div>
    );
  };

  const currentContent = (() => {
    switch (viewType) {
      case 'reception': return renderList([PatientStatus.GATE_REGISTERED, PatientStatus.RECEPTION_WAITING]);
      case 'checkin': return renderList([PatientStatus.PAYMENT_DONE, PatientStatus.CHECKIN_WAITING]);
      case 'doctor': return renderList([PatientStatus.CHECKIN_WAITING, PatientStatus.DOCTOR_WAITING]);
      case 'medical': return renderList([PatientStatus.CONSULTATION_DONE, PatientStatus.MEDICINE_WAITING]);
      default: return null;
    }
  })();

  return (
    <div className="fixed inset-0 bg-[#020617] select-none cursor-none flex flex-col">
      {/* Top Banner */}
      <div className="h-[80px] bg-slate-900 border-b border-slate-800 flex items-center justify-between px-12 shadow-2xl z-10">
        <div className="flex items-center gap-4">
          <div className="w-3 h-10 bg-blue-500 rounded-full"></div>
          <h1 className="text-3xl font-black text-white uppercase tracking-[0.2em]">Live Patient Tracking</h1>
        </div>
        <div className="flex items-center gap-8">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Status</p>
              <p className="text-emerald-500 font-bold text-sm tracking-widest">STABLE / SYNCED</p>
           </div>
           <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-2xl">🏥</div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {announcingPatient && <FullScreenAnnouncement patient={announcingPatient} onClose={() => setAnnouncingPatient(null)} />}
        {currentContent}
      </div>

      {/* Ticker / Footer */}
      <div className="h-[60px] bg-blue-600 flex items-center px-12 overflow-hidden whitespace-nowrap">
        <div className="animate-marquee flex gap-20 items-center">
          <span className="text-white font-black uppercase text-xl tracking-[0.3em]">
             Welcome to Virtual Clinic • Please keep your Patient ID ready for verification • Mask wearing is mandatory in all waiting halls • Download our app for digital prescriptions
          </span>
          <span className="text-white font-black uppercase text-xl tracking-[0.3em]">
             Welcome to Virtual Clinic • Please keep your Patient ID ready for verification • Mask wearing is mandatory in all waiting halls • Download our app for digital prescriptions
          </span>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default PublicDisplayView;
