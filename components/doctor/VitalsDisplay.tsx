import React from 'react';
import { Patient, Theme } from '../../types';

interface VitalsDisplayProps {
  patient: Patient;
  theme: Theme;
  themeStyles: any;
}

const Sparkline = ({ color }: { color: string }) => {
  // A simple SVG sparkline mock for trend visualization
  const points = "0,10 5,15 10,8 15,12 20,5 25,10 30,2";
  return (
    <svg width="40" height="20" viewBox="0 0 35 20" className="ml-auto opacity-50">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle cx="30" cy="2" r="2.5" fill={color} />
    </svg>
  );
};

const VitalsDisplay: React.FC<VitalsDisplayProps> = ({ patient, theme, themeStyles: s }) => {
  const v = {
    temp: patient.temperature || 'N/A',
    bp: patient.bloodPressure || 'N/A',
    pulse: patient.pulse || 'N/A',
    weight: patient.weight || 'N/A',
    spo2: patient.spo2 || 'N/A',
  };

  const getAccentColor = () => {
    if (theme === 'light') return '#0071e3';
    return '#0A84FF';
  };

  return (
    <div className={`p-4 sm:p-6 rounded-[1.5rem] border mb-6 ${s.card}`}>
      <h4 className={`text-[9px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ${s.accent}`}>
        <span className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: getAccentColor() }}></span>
        Clinical Vitals & Trends
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="flex flex-col">
          <span className={`text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 ${s.sub}`}>Temp</span>
          <div className="flex items-center">
            <span className={`text-lg sm:text-xl font-black ${s.header}`}>{v.temp}</span>
            <span className={`text-[10px] ml-1 opacity-50 ${s.sub}`}>°F</span>
            {v.temp !== 'N/A' && <Sparkline color="#ff3b30" />}
          </div>
        </div>
        
        <div className="flex flex-col">
          <span className={`text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 ${s.sub}`}>BP</span>
          <div className="flex items-center">
            <span className={`text-lg sm:text-xl font-black ${s.header}`}>{v.bp}</span>
            {v.bp !== 'N/A' && <Sparkline color="#ff9500" />}
          </div>
        </div>

        <div className="flex flex-col">
          <span className={`text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 ${s.sub}`}>Pulse</span>
          <div className="flex items-center">
            <span className={`text-lg sm:text-xl font-black ${s.header}`}>{v.pulse}</span>
            <span className={`text-[10px] ml-1 opacity-50 ${s.sub}`}>bpm</span>
            {v.pulse !== 'N/A' && <Sparkline color="#ff2d55" />}
          </div>
        </div>

        <div className="flex flex-col">
          <span className={`text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 ${s.sub}`}>Weight</span>
          <div className="flex items-center">
            <span className={`text-lg sm:text-xl font-black ${s.header}`}>{v.weight}</span>
            <span className={`text-[10px] ml-1 opacity-50 ${s.sub}`}>kg</span>
            {v.weight !== 'N/A' && <Sparkline color="#5ac8fa" />}
          </div>
        </div>

        <div className="flex flex-col">
          <span className={`text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 ${s.sub}`}>SpO2</span>
          <div className="flex items-center">
            <span className={`text-lg sm:text-xl font-black ${v.spo2 !== 'N/A' && Number(v.spo2) < 95 ? 'text-red-500' : s.header}`}>{v.spo2}</span>
            <span className={`text-[10px] ml-1 opacity-50 ${s.sub}`}>%</span>
            {v.spo2 !== 'N/A' && <Sparkline color={Number(v.spo2) < 95 ? '#ff3b30' : '#34c759'} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VitalsDisplay;
