import React, { useMemo } from 'react';
import { Patient, Theme, PatientStatus, TrackingLog } from '../../types';

interface GlobalTATMetricsProps {
  patients: Patient[];
  theme: Theme;
}

const GlobalTATMetrics: React.FC<GlobalTATMetricsProps> = ({ patients, theme }) => {
  const themeStyles = {
    dark: { card: 'bg-[#1D1D1F] border-[#2D2D2D]', sub: 'text-[#86868b]' },
    light: { card: 'bg-white border-[#D2D2D7]', sub: 'text-[#86868b]' },
    titanium: { card: 'bg-[#4D4D4D] border-[#5D5D5D]', sub: 'text-[#A1A1A6]' }
  };
  const s = themeStyles[theme];

  const formatDuration = (ms: number) => {
    if (ms <= 0) return '0s';
    const totalSecs = Math.floor(ms / 1000);
    if (totalSecs < 60) return `${totalSecs}s`;
    const mins = Math.floor(totalSecs / 60);
    if (mins < 60) return `${mins}m ${totalSecs % 60}s`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  const calcDurations = (log: TrackingLog) => {
    const waitTime = log.callTime ? log.callTime - log.entryTime : 0;
    const responseTime = log.arrivalTime && log.callTime ? log.arrivalTime - log.callTime : 0;
    const processingTime = log.exitTime && (log.arrivalTime || log.callTime || log.entryTime) 
      ? log.exitTime - (log.arrivalTime || log.callTime || log.entryTime) 
      : 0;
    return { waitTime, responseTime, processingTime };
  };

  const metrics = useMemo(() => {
    const results = {
      gateProcessing: { total: 0, count: 0 },
      receptionWait: { total: 0, count: 0 },
      checkinProcessing: { total: 0, count: 0 },
      doctorWait: { total: 0, count: 0 },
      treatmentTAT: { total: 0, count: 0 },
      pharmacyProcessing: { total: 0, count: 0 },
      dischargeTAT: { total: 0, count: 0 },
    };

    patients.forEach(p => {
      p.history.forEach(log => {
        const { waitTime, processingTime } = calcDurations(log);
        switch (log.stage) {
          case PatientStatus.GATE_REGISTERED:
            if (processingTime > 0) { results.gateProcessing.total += processingTime; results.gateProcessing.count++; }
            break;
          case PatientStatus.RECEPTION_WAITING:
            if (waitTime > 0) { results.receptionWait.total += waitTime; results.receptionWait.count++; }
            break;
          case PatientStatus.CHECKIN_WAITING:
            if (processingTime > 0) { results.checkinProcessing.total += processingTime; results.checkinProcessing.count++; }
            break;
          case PatientStatus.DOCTOR_WAITING:
            if (waitTime > 0) { results.doctorWait.total += waitTime; results.doctorWait.count++; }
            break;
          case PatientStatus.TREATMENT:
            const tat = log.exitTime ? log.exitTime - log.entryTime : 0;
            if (tat > 0) { results.treatmentTAT.total += tat; results.treatmentTAT.count++; }
            break;
          case PatientStatus.MEDICINE_WAITING:
            if (processingTime > 0) { results.pharmacyProcessing.total += processingTime; results.pharmacyProcessing.count++; }
            break;
          case PatientStatus.DISCHARGE_LOUNGE:
            if (processingTime > 0) { results.dischargeTAT.total += processingTime; results.dischargeTAT.count++; }
            break;
        }
      });
    });

    return {
      gate: results.gateProcessing.count ? results.gateProcessing.total / results.gateProcessing.count : 0,
      reception: results.receptionWait.count ? results.receptionWait.total / results.receptionWait.count : 0,
      checkin: results.checkinProcessing.count ? results.checkinProcessing.total / results.checkinProcessing.count : 0,
      doctor: results.doctorWait.count ? results.doctorWait.total / results.doctorWait.count : 0,
      treatment: results.treatmentTAT.count ? results.treatmentTAT.total / results.treatmentTAT.count : 0,
      pharmacy: results.pharmacyProcessing.count ? results.pharmacyProcessing.total / results.pharmacyProcessing.count : 0,
      discharge: results.dischargeTAT.count ? results.dischargeTAT.total / results.dischargeTAT.count : 0,
    };
  }, [patients]);

  return (
    <div className="flex gap-2 sm:gap-4 w-full overflow-x-auto apple-scroll pb-2">
      {[
        { m: metrics.gate, label: 'Gate', color: 'text-blue-500' },
        { m: metrics.reception, label: 'Reg/Wait', color: 'text-orange-500' },
        { m: metrics.doctor, label: 'Doc/Wait', color: 'text-purple-500' },
        { m: metrics.treatment, label: 'Lab/TAT', color: 'text-cyan-500' },
        { m: metrics.pharmacy, label: 'Pharmacy', color: 'text-pink-500' },
        { m: metrics.discharge, label: 'Discharge', color: 'text-rose-500' },
      ].map((item, i) => (
        <div key={i} className={`flex-1 py-3 px-4 sm:px-6 rounded-[1.5rem] border ${s.card} shadow-sm flex flex-col gap-1 min-w-[110px]`}>
          <span className={`text-[9px] sm:text-[11px] font-black uppercase tracking-widest ${s.sub}`}>{item.label}</span>
          <span className={`text-base sm:text-xl font-black tracking-tighter ${item.color}`}>{formatDuration(item.m)}</span>
        </div>
      ))}
    </div>
  );
};

export default GlobalTATMetrics;
