import React, { useState, useMemo, useEffect } from 'react';
import { Patient, Theme, PatientStatus, PatientCategory, TrackingLog } from '../types';
import { initAuth, googleSignIn, getAccessToken } from '../services/auth';
import { exportToSheets, SyncResult } from '../services/googleSheets';
import { downloadAuditExcel } from '../services/excelExport';
import { Cloud, CheckCircle2, AlertCircle, ExternalLink, Loader2, LogIn, ChevronDown, ChevronUp, User, Clock, ShieldCheck, Activity, Download, MapPin, AlertTriangle, Syringe, Pill, Stethoscope, Bed } from 'lucide-react';

interface AuditIntelligenceProps {
  patients: Patient[];
  theme: Theme;
}

const AuditIntelligence: React.FC<AuditIntelligenceProps> = ({ patients, theme }) => {
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const themeStyles = {
    light: {
      card: 'bg-white border-[#D2D2D7]',
      text: 'text-[#1D1D1F]',
      sub: 'text-[#86868b]',
      tableHeader: 'bg-[#F5F5F7] text-[#86868b]',
      rowHover: 'hover:bg-[#F5F5F7]',
      expanded: 'bg-[#F9F9FB]',
      accent: 'text-[#0071e3]',
      border: 'border-[#D2D2D7]',
      alert: 'bg-red-50 border-red-200 text-red-600',
      success: 'bg-emerald-50 border-emerald-200 text-emerald-600'
    },
    dark: {
      card: 'bg-[#1D1D1F] border-[#2D2D2D]',
      text: 'text-white',
      sub: 'text-[#86868b]',
      tableHeader: 'bg-black/30 text-[#86868b]',
      rowHover: 'hover:bg-white/5',
      expanded: 'bg-black/20',
      accent: 'text-[#0A84FF]',
      border: 'border-[#2D2D2D]',
      alert: 'bg-red-500/10 border-red-500/20 text-red-500',
      success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
    },
    titanium: {
      card: 'bg-[#4D4D4D] border-[#5D5D5D]',
      text: 'text-[#E8E8ED]',
      sub: 'text-[#A1A1A6]',
      tableHeader: 'bg-black/20 text-[#A1A1A6]',
      rowHover: 'hover:bg-white/5',
      expanded: 'bg-black/10',
      accent: 'text-[#0A84FF]',
      border: 'border-[#5D5D5D]',
      alert: 'bg-red-500/10 border-red-500/20 text-red-500',
      success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
    }
  };

  const s = themeStyles[theme];

  const formatTime = (ts?: number) => {
    if (!ts) return '--:--';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

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
            if (processingTime > 0) {
              results.gateProcessing.total += processingTime;
              results.gateProcessing.count++;
            }
            break;
          case PatientStatus.RECEPTION_WAITING:
            if (waitTime > 0) {
              results.receptionWait.total += waitTime;
              results.receptionWait.count++;
            }
            break;
          case PatientStatus.CHECKIN_WAITING:
            if (processingTime > 0) {
              results.checkinProcessing.total += processingTime;
              results.checkinProcessing.count++;
            }
            break;
          case PatientStatus.DOCTOR_WAITING:
            if (waitTime > 0) {
              results.doctorWait.total += waitTime;
              results.doctorWait.count++;
            }
            break;
          case PatientStatus.TREATMENT:
            const tat = log.exitTime ? log.exitTime - log.entryTime : 0;
            if (tat > 0) {
              results.treatmentTAT.total += tat;
              results.treatmentTAT.count++;
            }
            break;
          case PatientStatus.MEDICINE_WAITING:
            if (processingTime > 0) {
              results.pharmacyProcessing.total += processingTime;
              results.pharmacyProcessing.count++;
            }
            break;
          case PatientStatus.DISCHARGE_LOUNGE:
            if (processingTime > 0) {
              results.dischargeTAT.total += processingTime;
              results.dischargeTAT.count++;
            }
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

  useEffect(() => {
    initAuth(
      () => setNeedsAuth(false),
      () => setNeedsAuth(true)
    );
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const result = await googleSignIn();
        if (result) {
          token = result.accessToken;
          setNeedsAuth(false);
        } else {
          throw new Error('Authentication required');
        }
      }
      
      const result = await exportToSheets(token, patients);
      setLastSync(result);
    } catch (err: any) {
      console.error('Sync failed:', err);
      setError(err.message || 'Failed to sync with Google Drive');
    } finally {
      setIsSyncing(false);
    }
  };

  const STAGES_CONFIG = [
    { label: 'Gate Intake', status: PatientStatus.GATE_REGISTERED, threshold: 300000 }, // 5m
    { label: 'Reception', status: PatientStatus.RECEPTION_WAITING, threshold: 600000 }, // 10m
    { label: 'Check-In', status: PatientStatus.CHECKIN_WAITING, threshold: 300000 }, // 5m
    { label: 'Doctor', status: PatientStatus.DOCTOR_WAITING, threshold: 900000 }, // 15m
    { label: 'Treatment', status: PatientStatus.TREATMENT, threshold: 1800000 }, // 30m
    { label: 'Re-Consult', status: PatientStatus.DOCTOR_RECONSULT, threshold: 600000 }, // 10m
    { label: 'Pharmacy', status: PatientStatus.MEDICINE_WAITING, threshold: 600000 }, // 10m
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Cloud Sync Bar */}
      <div className={`mb-6 p-4 rounded-[1.5rem] border ${s.card} flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${needsAuth ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            <Cloud size={20} />
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-widest ${s.text}`}>Operational Cloud Sync</span>
            <span className={`text-xs font-bold ${s.sub}`}>
              {needsAuth ? 'Google Workspace integration pending' : 'Connected & Ready for Audit Export'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {error && <span className="text-red-500 text-[10px] font-bold uppercase">{error}</span>}
          {lastSync && (
            <a href={lastSync.spreadsheetUrl} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 rounded-xl border ${s.border} text-[10px] font-black uppercase tracking-widest ${s.text} flex items-center gap-2`}>
              <ExternalLink size={14} /> View
            </a>
          )}
          
          <button 
            onClick={async () => {
              try {
                await downloadAuditExcel(patients);
              } catch (err) {
                console.error('Excel download failed:', err);
                setError('Failed to generate Excel audit');
              }
            }}
            className={`px-4 py-2.5 rounded-xl border ${s.border} text-[10px] font-black uppercase tracking-widest ${s.text} flex items-center gap-2 hover:bg-white/5 transition-all`}
          >
            <Download size={14} /> Matrix
          </button>

          <button onClick={handleSync} disabled={isSyncing} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${needsAuth ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'} flex items-center gap-2`}>
            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : needsAuth ? <LogIn size={14} /> : <CheckCircle2 size={14} />}
            {isSyncing ? 'Syncing...' : needsAuth ? 'Connect' : 'Export'}
          </button>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { m: metrics.gate, label: 'Gate', color: 'text-blue-500' },
          { m: metrics.reception, label: 'Reg/Wait', color: 'text-orange-500' },
          { m: metrics.doctor, label: 'Doc/Wait', color: 'text-purple-500' },
          { m: metrics.treatment, label: 'Lab/TAT', color: 'text-cyan-500' },
          { m: metrics.pharmacy, label: 'Pharmacy', color: 'text-pink-500' },
          { m: metrics.discharge, label: 'Discharge', color: 'text-rose-500' },
        ].map((item, i) => (
          <div key={i} className={`p-4 rounded-3xl border ${s.card} shadow-sm flex flex-col gap-1`}>
            <span className={`text-[8px] font-black uppercase tracking-widest ${s.sub}`}>{item.label}</span>
            <span className={`text-sm font-black tracking-tighter ${item.color}`}>{formatDuration(item.m)}</span>
          </div>
        ))}
      </div>

      {/* Horizontal Flat Matrix - Desktop Optimized View */}
      <div className={`overflow-x-auto border rounded-[2.5rem] ${s.border} apple-scroll shadow-2xl relative bg-white/5`}>
        <table className="w-full text-left border-collapse min-w-[5000px]">
          <thead>
            <tr className={`${s.tableHeader} border-b border-white/10 text-[9px] font-black uppercase tracking-widest`}>
              {/* Group Headers */}
              <th colSpan={5} className="px-6 py-4 bg-black/50 border-r border-white/10 sticky left-0 z-30">CORE PATIENT DEMOGRAPHICS & GEOGRAPHIC INFRASTRUCTURE</th>
              <th colSpan={7} className="px-4 py-4 bg-black/30 border-r border-white/10">GEOGRAPHY & FINANCE</th>
              <th colSpan={6} className="px-4 py-4 bg-black/40 border-r border-white/10">CLINICAL TRIAGE & COMPLIANCE (NABH)</th>
              <th colSpan={5} className="px-4 py-4 bg-blue-500/20 text-blue-300 border-r border-white/10">STAGE 1: GATE INTAKE & REGISTRATION</th>
              <th colSpan={9} className="px-4 py-4 bg-orange-500/20 text-orange-300 border-r border-white/10">STAGE 2: RECEPTION, BILLING & CLEARANCE</th>
              <th colSpan={9} className="px-4 py-4 bg-emerald-500/20 text-emerald-300 border-r border-white/10">STAGE 3: TRIAGE CHECK-IN</th>
              <th colSpan={11} className="px-4 py-4 bg-purple-500/20 text-purple-300 border-r border-white/10">STAGE 4: PRIMARY CLINICAL CONSULTATION</th>
              <th colSpan={8} className="px-4 py-4 bg-indigo-500/20 text-indigo-300 border-r border-white/10">STAGE 4A: CROSS-CONSULTATION</th>
              <th colSpan={11} className="px-4 py-4 bg-cyan-500/20 text-cyan-300 border-r border-white/10">STAGE 5: TREATMENT / LABORATORY / INVESTIGATION</th>
              <th colSpan={7} className="px-4 py-4 bg-pink-500/20 text-pink-300 border-r border-white/10">STAGE 6: DOCTOR RE-CONSULTATION</th>
              <th colSpan={8} className="px-4 py-4 bg-red-500/20 text-red-300 border-r border-white/10">STAGE 7: EMERGENCY-TO-WARD HANDOVER</th>
              <th colSpan={12} className="px-4 py-4 bg-amber-500/20 text-amber-300 border-r border-white/10">STAGE 8: PHARMACY DISCHARGE & REVENUE</th>
              <th colSpan={5} className="px-6 py-4 bg-black/50 border-l border-white/10 sticky right-0 z-30">FINAL PERFORMANCE SUMMARIES</th>
            </tr>
            <tr className="text-[8px] font-black uppercase tracking-widest border-b border-white/5 bg-black/20">
              {/* Demographic Fields */}
              <th className="px-6 py-2 sticky left-0 z-30 bg-black/60">S.No | Patient_ID | Patient_Name | Age | Gender</th>
              <th className="px-4 py-2 border-r border-white/5">Address (Locality/Area)</th>
              <th className="px-4 py-2 border-r border-white/5">Pincode (6-Digit)</th>
              <th className="px-4 py-2 border-r border-white/5">Zone (Urban/Rural)</th>
              <th className="px-4 py-2 border-r border-white/5">Travel (Km)</th>
              <th className="px-4 py-2 border-r border-white/5">Category</th>
              <th className="px-4 py-2 border-r border-white/5">Unplanned (24Hr)</th>
              <th className="px-4 py-2 border-r border-white/5">Payer / Scheme</th>
              <th className="px-4 py-2 border-r border-white/5">ABHA Linked</th>
              <th className="px-4 py-2 border-r border-white/5">ABHA (Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">TPA Pre-Auth</th>
              <th className="px-4 py-2 border-r border-white/5">TPA Appr</th>
              <th className="px-4 py-2 border-r border-white/5">TPA Lag (Min)</th>
              
              {/* NABH */}
              <th className="px-4 py-2 border-r border-white/5">Red Bypass</th>
              <th className="px-4 py-2 border-r border-white/5">Justification</th>
              <th className="px-4 py-2 border-r border-white/5">Triage Level</th>
              <th className="px-4 py-2 border-r border-white/5">High Risk</th>
              <th className="px-4 py-2 border-r border-white/5">Pain Asmt</th>
              <th className="px-4 py-2 border-r border-white/5">Initial Asmt</th>

              {/* S1 */}
              <th className="px-4 py-2 border-r border-white/5">Entry</th>
              <th className="px-4 py-2 border-r border-white/5">Exit</th>
              <th className="px-4 py-2 border-r border-white/5">Proc(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Staff</th>
              <th className="px-4 py-2 border-r border-white/5">SLA Breach</th>

              {/* S2 */}
              <th className="px-4 py-2 border-r border-white/5">Queue IN</th>
              <th className="px-4 py-2 border-r border-white/5">Call</th>
              <th className="px-4 py-2 border-r border-white/5">Arrival</th>
              <th className="px-4 py-2 border-r border-white/5">Out</th>
              <th className="px-4 py-2 border-r border-white/5">Wait(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Resp(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Proc(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Staff</th>
              <th className="px-4 py-2 border-r border-white/5">SLA</th>

              {/* S3 */}
              <th className="px-4 py-2 border-r border-white/5">Queue IN</th>
              <th className="px-4 py-2 border-r border-white/5">Call</th>
              <th className="px-4 py-2 border-r border-white/5">Arrival</th>
              <th className="px-4 py-2 border-r border-white/5">Out</th>
              <th className="px-4 py-2 border-r border-white/5">Wait(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Resp(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Proc(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Staff</th>
              <th className="px-4 py-2 border-r border-white/5">SLA</th>

              {/* S4 */}
              <th className="px-4 py-2 border-r border-white/5">Queue IN</th>
              <th className="px-4 py-2 border-r border-white/5">Call</th>
              <th className="px-4 py-2 border-r border-white/5">Arrival</th>
              <th className="px-4 py-2 border-r border-white/5">Out</th>
              <th className="px-4 py-2 border-r border-white/5">Wait(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Resp(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Consult(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Doc ID</th>
              <th className="px-4 py-2 border-r border-white/5">Specialty</th>
              <th className="px-4 py-2 border-r border-white/5">SLA</th>
              <th className="px-4 py-2 border-r border-white/5">ICD / Directive</th>

              {/* S4A */}
              <th className="px-4 py-2 border-r border-white/5">Trigger</th>
              <th className="px-4 py-2 border-r border-white/5">Ref Doc</th>
              <th className="px-4 py-2 border-r border-white/5">Spec Doc</th>
              <th className="px-4 py-2 border-r border-white/5">Queue IN</th>
              <th className="px-4 py-2 border-r border-white/5">Arrival</th>
              <th className="px-4 py-2 border-r border-white/5">Out</th>
              <th className="px-4 py-2 border-r border-white/5">Wait(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">SLA</th>

              {/* S5 */}
              <th className="px-4 py-2 border-r border-white/5">Arrival</th>
              <th className="px-4 py-2 border-r border-white/5">Start</th>
              <th className="px-4 py-2 border-r border-white/5">Exit</th>
              <th className="px-4 py-2 border-r border-white/5">Result</th>
              <th className="px-4 py-2 border-r border-white/5">Handover</th>
              <th className="px-4 py-2 border-r border-white/5">Wait(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Proc(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">TAT(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Tech ID</th>
              <th className="px-4 py-2 border-r border-white/5">Ord Doc</th>
              <th className="px-4 py-2 border-r border-white/5">SLA</th>

              {/* S6 */}
              <th className="px-4 py-2 border-r border-white/5">Queue IN</th>
              <th className="px-4 py-2 border-r border-white/5">Arrival</th>
              <th className="px-4 py-2 border-r border-white/5">Out</th>
              <th className="px-4 py-2 border-r border-white/5">Wait(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Review(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Doc ID</th>
              <th className="px-4 py-2 border-r border-white/5">SLA</th>

              {/* S7 */}
              <th className="px-4 py-2 border-r border-white/5">Ordered</th>
              <th className="px-4 py-2 border-r border-white/5">Order Time</th>
              <th className="px-4 py-2 border-r border-white/5">Allocation</th>
              <th className="px-4 py-2 border-r border-white/5">Arrival</th>
              <th className="px-4 py-2 border-r border-white/5">Lag(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Staff</th>
              <th className="px-4 py-2 border-r border-white/5">Bed</th>
              <th className="px-4 py-2 border-r border-white/5">SLA</th>

              {/* S8 */}
              <th className="px-4 py-2 border-r border-white/5">Token IN</th>
              <th className="px-4 py-2 border-r border-white/5">Arrival</th>
              <th className="px-4 py-2 border-r border-white/5">Out</th>
              <th className="px-4 py-2 border-r border-white/5">Wait(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Disp(Sec)</th>
              <th className="px-4 py-2 border-r border-white/5">Pharma ID</th>
              <th className="px-4 py-2 border-r border-white/5">Ord Doc</th>
              <th className="px-4 py-2 border-r border-white/5">Stock Out</th>
              <th className="px-4 py-2 border-r border-white/5">Subst</th>
              <th className="px-4 py-2 border-r border-white/5">Presc Count</th>
              <th className="px-4 py-2 border-r border-white/5">Disp Count</th>
              <th className="px-4 py-2 border-r border-white/5">Revenue Leak</th>

              <th className="px-6 py-2 sticky right-0 z-30 bg-black/60">Journey(Min)</th>
              <th className="px-4 py-2 bg-black/60 sticky right-0">Active(Min)</th>
              <th className="px-4 py-2 bg-black/60 sticky right-0">Wait(Min)</th>
              <th className="px-4 py-2 bg-black/60 sticky right-0">Breaches</th>
              <th className="px-4 py-2 bg-black/60 sticky right-0">Compliance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {patients.map((patient, pIdx) => {
              const start = patient.history[0]?.entryTime || patient.timestamp;
              const end = patient.history[patient.history.length - 1]?.exitTime || (patient.status === PatientStatus.COMPLETED ? Date.now() : undefined);
              const totalDuration = end ? end - start : Date.now() - start;
              
              const getStage = (status: PatientStatus) => patient.history.find(h => h.stage === status);
              const gate = getStage(PatientStatus.GATE_REGISTERED);
              const billing = getStage(PatientStatus.RECEPTION_WAITING);
              const triage = getStage(PatientStatus.CHECKIN_WAITING);
              const doc = getStage(PatientStatus.DOCTOR_WAITING);
              const cross = getStage(PatientStatus.CROSS_CONSULT);
              const lab = getStage(PatientStatus.TREATMENT);
              const reDoc = getStage(PatientStatus.DOCTOR_RECONSULT);
              const ward = getStage(PatientStatus.WARD_HANDOVER);
              const pharmacy = getStage(PatientStatus.MEDICINE_WAITING);
              
              const totalLateActions = patient.history.filter(h => h.slaBreach).length;
              const revenueLeakage = (patient.prescribedItemsCount || 0) !== (patient.dispensedItemsCount || 0);

              const s1 = calcDurations(gate || { stage: PatientStatus.GATE_REGISTERED, entryTime: 0 });
              const s2 = calcDurations(billing || { stage: PatientStatus.RECEPTION_WAITING, entryTime: 0 });
              const s3 = calcDurations(triage || { stage: PatientStatus.CHECKIN_WAITING, entryTime: 0 });
              const s4 = calcDurations(doc || { stage: PatientStatus.DOCTOR_WAITING, entryTime: 0 });
              const s4a = calcDurations(cross || { stage: PatientStatus.CROSS_CONSULT, entryTime: 0 });
              const s5 = calcDurations(lab || { stage: PatientStatus.TREATMENT, entryTime: 0 });
              const s6 = calcDurations(reDoc || { stage: PatientStatus.DOCTOR_RECONSULT, entryTime: 0 });
              const s7 = calcDurations(ward || { stage: PatientStatus.WARD_HANDOVER, entryTime: 0 });
              const s8 = calcDurations(pharmacy || { stage: PatientStatus.MEDICINE_WAITING, entryTime: 0 });

              const totalActive = (s1.processingTime + s2.processingTime + s3.processingTime + s4.processingTime + s4a.processingTime + s5.processingTime + s6.processingTime + s7.processingTime + s8.processingTime) / 60000;
              const totalWait = (s2.waitTime + s3.waitTime + s4.waitTime + s4a.waitTime + s5.waitTime + s6.waitTime + s7.waitTime + s8.waitTime) / 60000;

              return (
                <React.Fragment key={patient.id}>
                  <tr 
                    onClick={() => setExpandedPatientId(expandedPatientId === patient.id ? null : patient.id)}
                    className={`${s.rowHover} text-[9px] font-bold transition-all cursor-pointer ${patient.isRedChannelBypass || patient.triageHighRiskAlert ? 'bg-yellow-500/5' : ''} ${expandedPatientId === patient.id ? s.expanded : ''}`}
                  >
                    {/* Demographics Row Cells */}
                    <td className="px-6 py-4 sticky left-0 z-30 bg-[#000]/90 backdrop-blur-md border-r border-white/5">
                      <div className="flex items-center gap-3">
                        {expandedPatientId === patient.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-black ${s.text}`}>{pIdx+1}. {patient.name}</span>
                          <span className={`text-[8px] opacity-60 ${s.sub}`}>{patient.id.slice(-6).toUpperCase()} | {patient.age}Y | {patient.gender}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-r border-white/5">{patient.area || patient.address}</td>
                    <td className="px-4 py-4 border-r border-white/5">{patient.pincode}</td>
                    <td className="px-4 py-4 border-r border-white/5">{patient.geographicZone}</td>
                    <td className="px-4 py-4 border-r border-white/5">{patient.travelDistanceKm}</td>
                    <td className="px-4 py-4 border-r border-white/5">{patient.category}</td>
                    <td className="px-4 py-4 border-r border-white/5 text-center">{patient.isUnplannedReturn24Hr ? 'TRUE' : 'FALSE'}</td>
                    <td className="px-4 py-4 border-r border-white/5">{patient.payerType}</td>
                    <td className={`px-4 py-4 border-r border-white/5 ${patient.abhaStatus === 'Linked' ? 'text-emerald-500' : 'text-red-400'}`}>{patient.abhaStatus}</td>
                    <td className="px-4 py-4 border-r border-white/5 text-center">{patient.abhaConsentFetchTimeSec}s</td>
                    <td className="px-4 py-2 border-r border-white/5">{formatTime(patient.tpaPreAuthTime)}</td>
                    <td className="px-4 py-2 border-r border-white/5">{formatTime(patient.tpaApprovalTime)}</td>
                    <td className="px-4 py-2 border-r border-white/5">{patient.tpaApprovalTime && patient.tpaPreAuthTime ? Math.floor((patient.tpaApprovalTime - patient.tpaPreAuthTime) / 60000) : 0}m</td>

                    {/* NABH */}
                    <td className="px-4 py-4 border-r border-white/5 text-center">{patient.isRedChannelBypass ? 'TRUE' : 'FALSE'}</td>
                    <td className="px-4 py-4 border-r border-white/5 max-w-[150px] truncate">{patient.bypassJustification || 'N/A'}</td>
                    <td className="px-4 py-4 border-r border-white/5">{patient.triageUrgency}</td>
                    <td className={`px-4 py-4 border-r border-white/5 text-center ${patient.triageHighRiskAlert ? 'text-red-500 font-black' : ''}`}>{patient.triageHighRiskAlert ? 'TRUE' : 'FALSE'}</td>
                    <td className="px-4 py-4 border-r border-white/5 text-center">{patient.nabhPainAssessmentDone ? 'TRUE' : 'FALSE'}</td>
                    <td className="px-4 py-4 border-r border-white/5 text-center">{patient.nabhInitialAssessmentTimeMins}m</td>

                    {/* S1: Gate */}
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(gate?.entryTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(gate?.exitTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{Math.floor(s1.processingTime/1000)}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{gate?.authorId || 'N/A'}</td>
                    <td className={`px-4 py-4 border-r border-white/5 ${gate?.slaBreach ? 'bg-red-500/20 text-red-500' : ''}`}>{gate?.slaBreach ? 'TRUE' : 'FALSE'}</td>

                    {/* S2: Reception */}
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(billing?.entryTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(billing?.callTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(billing?.arrivalTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(billing?.exitTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{Math.floor(s2.waitTime/1000)}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{billing?.arrivalTime && billing?.callTime ? Math.floor((billing.arrivalTime - billing.callTime)/1000) : 0}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{Math.floor(s2.processingTime/1000)}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{billing?.authorId || 'N/A'}</td>
                    <td className={`px-4 py-4 border-r border-white/5 ${billing?.slaBreach ? 'bg-red-500/20 text-red-500' : ''}`}>{billing?.slaBreach ? 'TRUE' : 'FALSE'}</td>

                    {/* S3: Checkin */}
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(triage?.entryTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(triage?.callTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(triage?.arrivalTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(triage?.exitTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{Math.floor(s3.waitTime/1000)}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{triage?.arrivalTime && triage?.callTime ? Math.floor((triage.arrivalTime - triage.callTime)/1000) : 0}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{Math.floor(s3.processingTime/1000)}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{triage?.authorId || 'N/A'}</td>
                    <td className={`px-4 py-4 border-r border-white/5 ${triage?.slaBreach ? 'bg-red-500/20 text-red-500' : ''}`}>{triage?.slaBreach ? 'TRUE' : 'FALSE'}</td>

                    {/* S4: Doctor */}
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(doc?.entryTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(doc?.callTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(doc?.arrivalTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(doc?.exitTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{Math.floor(s4.waitTime/1000)}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{doc?.arrivalTime && doc?.callTime ? Math.floor((doc.arrivalTime - doc.callTime)/1000) : 0}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{Math.floor(s4.processingTime/1000)}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{doc?.authorId || 'N/A'}</td>
                    <td className="px-4 py-4 border-r border-white/5">{doc?.authorSpecialty || 'N/A'}</td>
                    <td className={`px-4 py-4 border-r border-white/5 ${doc?.slaBreach ? 'bg-red-500/20 text-red-500' : ''}`}>{doc?.slaBreach ? 'TRUE' : 'FALSE'}</td>
                    <td className="px-4 py-4 border-r border-white/5">{patient.diagnosisICD || 'N/A'} / {doc?.directive || 'N/A'}</td>

                    {/* S4A: Cross */}
                    <td className="px-4 py-4 border-r border-white/5 text-center">{patient.crossConsultTriggered ? 'TRUE' : 'FALSE'}</td>
                    <td className="px-4 py-4 border-r border-white/5">{cross?.orderingDoctorId || 'N/A'}</td>
                    <td className="px-4 py-4 border-r border-white/5">{cross?.authorId || 'N/A'}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(cross?.entryTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(cross?.arrivalTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(cross?.exitTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{Math.floor(s4a.waitTime/1000)}s</td>
                    <td className={`px-4 py-4 border-r border-white/5 ${cross?.slaBreach ? 'bg-red-500/20 text-red-500' : ''}`}>{cross?.slaBreach ? 'TRUE' : 'FALSE'}</td>

                    {/* S5: Lab */}
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(lab?.arrivalTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(lab?.procedureStartTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(lab?.procedureExitTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(lab?.resultGenTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(lab?.handoverTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{Math.floor(s5.waitTime/1000)}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{Math.floor(s5.processingTime/1000)}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{lab?.resultGenTime && lab?.procedureExitTime ? Math.floor((lab.resultGenTime - lab.procedureExitTime)/1000) : 0}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{lab?.authorId || 'N/A'}</td>
                    <td className="px-4 py-4 border-r border-white/5">{lab?.orderingDoctorId || 'N/A'}</td>
                    <td className={`px-4 py-4 border-r border-white/5 ${lab?.slaBreach ? 'bg-red-500/20 text-red-500' : ''}`}>{lab?.slaBreach ? 'TRUE' : 'FALSE'}</td>

                    {/* S6: ReDoc */}
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(reDoc?.entryTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(reDoc?.arrivalTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(reDoc?.exitTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{Math.floor(s6.waitTime/1000)}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{Math.floor(s6.processingTime/1000)}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{reDoc?.authorId || 'N/A'}</td>
                    <td className={`px-4 py-4 border-r border-white/5 ${reDoc?.slaBreach ? 'bg-red-500/20 text-red-500' : ''}`}>{reDoc?.slaBreach ? 'TRUE' : 'FALSE'}</td>

                    {/* S7: Ward */}
                    <td className="px-4 py-4 border-r border-white/5 text-center">{patient.wardAdmissionOrdered ? 'TRUE' : 'FALSE'}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(patient.wardOrderTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(patient.wardAllocationTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(patient.wardBedArrivalTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{patient.wardBedArrivalTime && patient.wardAllocationTime ? Math.floor((patient.wardBedArrivalTime - patient.wardAllocationTime)/1000) : 0}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{patient.wardStaffId || 'N/A'}</td>
                    <td className="px-4 py-4 border-r border-white/5">{patient.allocatedBedNumber || 'N/A'}</td>
                    <td className={`px-4 py-4 border-r border-white/5 ${ward?.slaBreach ? 'bg-red-500/20 text-red-500' : ''}`}>{ward?.slaBreach ? 'TRUE' : 'FALSE'}</td>

                    {/* S8: Pharmacy */}
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(pharmacy?.entryTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(pharmacy?.arrivalTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{formatTime(pharmacy?.exitTime)}</td>
                    <td className="px-4 py-4 border-r border-white/5">{Math.floor(s8.waitTime/1000)}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{Math.floor(s8.processingTime/1000)}s</td>
                    <td className="px-4 py-4 border-r border-white/5">{pharmacy?.authorId || 'N/A'}</td>
                    <td className="px-4 py-4 border-r border-white/5">{pharmacy?.orderingDoctorId || 'N/A'}</td>
                    <td className="px-4 py-4 border-r border-white/5 text-center">{pharmacy?.stockOut ? 'TRUE' : 'FALSE'}</td>
                    <td className="px-4 py-4 border-r border-white/5 text-center">{patient.prescriptionSubstitutionFlag ? 'TRUE' : 'FALSE'}</td>
                    <td className="px-4 py-4 border-r border-white/5 text-center">{patient.prescribedItemsCount || 0}</td>
                    <td className="px-4 py-4 border-r border-white/5 text-center">{patient.dispensedItemsCount || 0}</td>
                    <td className={`px-4 py-4 border-r border-white/5 text-center ${revenueLeakage ? 'bg-red-500/20 text-red-500' : ''}`}>{revenueLeakage ? 'TRUE' : 'FALSE'}</td>

                    {/* Summary Sticky */}
                    <td className="px-6 py-4 sticky right-0 z-30 bg-[#000]/90 backdrop-blur-md border-l border-white/5 font-black text-xs text-center">{Math.floor(totalDuration/60000)}m</td>
                    <td className="px-4 py-4 sticky right-0 bg-[#000]/90 backdrop-blur-md text-center">{Math.floor(totalActive)}m</td>
                    <td className="px-4 py-4 sticky right-0 bg-[#000]/90 backdrop-blur-md text-center">{Math.floor(totalWait)}m</td>
                    <td className={`px-4 py-4 sticky right-0 bg-[#000]/90 backdrop-blur-md text-center ${totalLateActions > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>{totalLateActions}</td>
                    <td className={`px-4 py-4 sticky right-0 bg-[#000]/90 backdrop-blur-md text-center font-black ${totalLateActions > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{totalLateActions > 0 ? 'FAIL' : 'PASS'}</td>
                  </tr>

                  {/* --- DEEP UN-COLLAPSED LEDGER VIEW --- */}
                  {expandedPatientId === patient.id && (
                    <tr className={s.expanded}>
                      <td colSpan={100} className="px-12 py-10">
                        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                          <div className="flex items-center justify-between mb-8">
                             <h4 className={`text-xl font-black uppercase tracking-tighter ${s.text}`}>Step-by-Step Patient Timeline Ledger</h4>
                             <div className={`px-4 py-2 rounded-xl border ${s.border} text-[10px] font-black uppercase tracking-widest ${s.sub}`}>
                                {patient.history.length} Explicit Milestone Events
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                            {patient.history.map((log, idx) => {
                              const { processingTime } = calcDurations(log);
                              return (
                                <div key={idx} className={`p-6 rounded-[2rem] border shadow-lg flex items-center justify-between gap-8 ${s.card} ${log.slaBreach ? 'border-red-500/30' : ''}`}>
                                  <div className="flex items-center gap-6 min-w-[200px]">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black border-2 ${log.slaBreach ? 'border-red-500/50 text-red-500' : s.badge}`}>
                                      {idx + 1}
                                    </div>
                                    <div>
                                      <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${s.sub}`}>{log.stage.replace('_', ' ')}</p>
                                      <p className={`text-lg font-black tracking-tight ${s.header}`}>{log.actionTaken || 'Clinical Milestone'}</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-4 gap-12 flex-1">
                                    <div className="flex flex-col">
                                      <span className="text-[8px] font-black uppercase opacity-40 mb-1">Entry Timestamp</span>
                                      <span className={`text-xs font-black ${s.text}`}>{formatTime(log.entryTime)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[8px] font-black uppercase opacity-40 mb-1">Exit Timestamp</span>
                                      <span className={`text-xs font-black ${s.text}`}>{formatTime(log.exitTime)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[8px] font-black uppercase opacity-40 mb-1">Total Time Taken</span>
                                      <span className={`text-xs font-black ${log.slaBreach ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {Math.floor(processingTime / 60000)} Minutes
                                      </span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[8px] font-black uppercase opacity-40 mb-1">Responsible Staff</span>
                                      <span className={`text-xs font-black ${s.text}`}>{log.authorName || 'System'}</span>
                                      <span className="text-[8px] opacity-40">ID: {log.authorId || 'N/A'}</span>
                                    </div>
                                  </div>

                                  {log.slaBreach && (
                                    <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                                      <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">SLA BREACH</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditIntelligence;
