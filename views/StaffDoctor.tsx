import React,{ useState, useEffect, useRef} from 'react';
import{ Patient, PatientStatus, Doctor, Theme, PatientCategory, DoctorRoster, InventoryItem, RadiologyOrder} from '../types';
import{ mockFirestore} from '../services/mockFirestore';
import{ TREATMENT_TYPES} from '../constants';
import PatientContactModal from '../components/PatientContactModal';
import DoctorPatientQueue from '../components/doctor/DoctorPatientQueue';
import VitalsDisplay from '../components/doctor/VitalsDisplay';
import ClinicalNotesDictation from '../components/doctor/ClinicalNotesDictation';
import ClinicalCodingAssistant from '../components/doctor/ClinicalCodingAssistant';
import PatientHistoryTimeline from '../components/doctor/PatientHistoryTimeline';
import RxWriter,{ PrescribedDrug} from '../components/doctor/RxWriter';
import MedicalCertificateGenerator from '../components/doctor/MedicalCertificateGenerator';
import PrintablePrescription from '../components/doctor/PrintablePrescription';
import SmartLabResults from '../components/doctor/SmartLabResults';
import FollowUpScheduler from '../components/doctor/FollowUpScheduler';
import DoctorDailySummary from '../components/doctor/DoctorDailySummary';
import{ getPremiumStyles} from '../theme/premiumDesign';

interface StaffDoctorProps{
 patients: Patient[];
 theme: Theme;
 doctors: Doctor[];
 roster: DoctorRoster[];
 isAdmin?: boolean;
 inventory?: InventoryItem[];
 radiologyOrders?: RadiologyOrder[];
 onEditPatient?: (p: Patient) => void;
 onDeletePatient?: (p: Patient) => void;
}

const StaffDoctor: React.FC<StaffDoctorProps> = ({ patients, theme, doctors: allDoctors, roster, inventory = [], radiologyOrders = [], isAdmin, onEditPatient, onDeletePatient}) =>{
 const [activeDoctorId, setActiveDoctorId] = useState<string>('');
 const [prescription, setPrescription] = useState('');
 const [diagnosisICD, setDiagnosisICD] = useState('');
 const [department, setDepartment] = useState('General Medicine');
 const [referralSource, setReferralSource] = useState('Direct');
 const [directive, setDirective] = useState('Discharge');
 const [targetTreatmentType, setTargetTreatmentType] = useState(TREATMENT_TYPES[0]);
 const [message, setMessage] = useState('');
 const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
 const [prescribedDrugs, setPrescribedDrugs] = useState<PrescribedDrug[]>([]);
 const [medicalCertificates, setMedicalCertificates] = useState<any[]>([]);
 const [showHistoryTimeline, setShowHistoryTimeline] = useState(false);
 const [showPrintPreview, setShowPrintPreview] = useState(false);
 const [showDailyDigest, setShowDailyDigest] = useState(false);
 const [isQueueHeld, setIsQueueHeld] = useState(false);
 const isProcessingAutoCall = useRef(false);

 const s = getPremiumStyles(theme);

 const activeRosterDocs = roster.length > 0 
 ? allDoctors.filter(d => roster.some(r => (r as any).staffId === d.id || (r as any).doctorId === d.id))
 : allDoctors;
 const doctor = activeRosterDocs.find(d => d.id === activeDoctorId);
 const currentRosterItem = roster.find(r => (r as any).staffId === activeDoctorId || (r as any).doctorId === activeDoctorId);
 
 const innerQueue = patients.filter(p => 
 p.assignedDoctorId === activeDoctorId && 
 (p.status === PatientStatus.DOCTOR_WAITING || p.status === PatientStatus.DOCTOR_RECONSULT) &&
 !p.isAbsent
 ).sort((a, b) =>{
 if (a.isPriorityReconsult && !b.isPriorityReconsult) return -1;
 if (!a.isPriorityReconsult && b.isPriorityReconsult) return 1;
 if (a.lastCalledTimestamp && b.lastCalledTimestamp) return a.lastCalledTimestamp - b.lastCalledTimestamp;
 return a.timestamp - b.timestamp;
});

 const waitingHall = patients.filter(p => 
 p.assignedDoctorId === activeDoctorId && 
 p.status === PatientStatus.CHECKIN_WAITING && 
 !!p.checkinSection && 
 !p.isAbsent
 );

 const currentPatient = innerQueue[0]; 
 const absentList = patients.filter(p => 
 p.assignedDoctorId === activeDoctorId && 
 p.status === PatientStatus.CHECKIN_WAITING && 
 p.isAbsent
 );

 useEffect(() =>{
 if (!activeDoctorId || !doctor || isProcessingAutoCall.current || isQueueHeld) return;

 const capacity = doctor.maxCapacity || 5;
 
 if (innerQueue.length < capacity && waitingHall.length > 0){
 const callNextAutomatically = async () =>{
 isProcessingAutoCall.current = true;
 const next = waitingHall[0];
 
 try{
 setMessage(`Auto-Calling: ${next.name}`);
 await mockFirestore.callPatient(next.id, PatientStatus.DOCTOR_WAITING, patients);
 setTimeout(() =>{
 isProcessingAutoCall.current = false;
 setMessage('');
}, 2000);
} catch (err){
 isProcessingAutoCall.current = false;
}
};

 callNextAutomatically();
}
}, [patients, activeDoctorId, doctor, innerQueue.length, waitingHall, isQueueHeld]);

 const applySmartDefault = (type: string) =>{
 if (type === 'Fever'){
 setDiagnosisICD('R50.9 - Fever, unspecified');
 setPrescription('Viral fever presentation. Patient is advised complete bed rest and plenty of oral fluids. Follow up if fever persists beyond 3 days.');
 setPrescribedDrugs([{ name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'SOS', duration: '3 days'}]);
} else if (type === 'Hypertension'){
 setDiagnosisICD('I10 - Essential (primary) hypertension');
 setPrescription('Elevated BP detected. Reduced salt intake and regular monitoring advised. Walk 30 mins daily.');
 setPrescribedDrugs([{ name: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'OD (Morning)', duration: '30 days'}]);
} else if (type === 'Gastritis'){
 setDiagnosisICD('K29.7 - Gastritis, unspecified');
 setPrescription('Acute gastritis symptoms. Advised bland diet and strict avoidance of spicy, oily outside food.');
 setPrescribedDrugs([{ name: 'Pantoprazole 40mg', dosage: '1 tablet', frequency: 'OD (Before Breakfast)', duration: '5 days'}]);
}
};

 const handleSkip = async () =>{
 if (currentPatient){
 await mockFirestore.skipPatient(currentPatient.id);
 await mockFirestore.updatePatient(currentPatient.id,{ status: PatientStatus.CHECKIN_WAITING});
}
};

 const handleComplete = async () =>{
 if (!currentPatient || (!prescription && prescribedDrugs.length === 0)) return;
 let finalStatus = PatientStatus.CONSULTATION_DONE;
 let finalTreatmentType = undefined;
 
 if (directive === 'Referred to Treatment'){
 finalStatus = PatientStatus.TREATMENT;
 finalTreatmentType = targetTreatmentType;
} else if (directive === 'Send to Lab'){
 finalStatus = PatientStatus.LAB_WAITING;
}

 await mockFirestore.updatePatientAudited(currentPatient.id,{
 status: finalStatus,
 prescription,
 prescribedDrugs,
 diagnosisICD,
 department,
 referralSource,
 directive,
 assignedTreatmentType: finalTreatmentType,
 isPriorityReconsult: false 
}, 'Standard Consultation Completed', activeDoctorId);
 setMessage('Consultation completed');
 setPrescription('');
 setDiagnosisICD('');
 setPrescribedDrugs([]);
 setMedicalCertificates([]);
 setDirective('Discharge');
 setTargetTreatmentType(TREATMENT_TYPES[0]);
 setTimeout(() => setMessage(''), 3000);
};

 const handleAdmit = async () =>{
 if (!currentPatient) return;
 await mockFirestore.updatePatientAudited(currentPatient.id,{
 status: PatientStatus.ADMISSION_DESK,
 category: PatientCategory.IPD
}, 'Clinical Order: IPD Admission Required', activeDoctorId);
 setMessage('Admission order created');
 setTimeout(() => setMessage(''), 3000);
};

 const handleConsent = async () =>{
 if (!currentPatient) return;
 const hash =`CONSENT_${Math.random().toString(36).substring(7).toUpperCase()}`;
 await mockFirestore.recordConsent(currentPatient.id, activeDoctorId, hash);
 setMessage(`Consent Signed: ${hash}`);
};

 if (!activeDoctorId){
 return (
 <div className="max-w-xl mx-auto py-12 sm:py-24 px-6 sm:px-10">
 <div className="text-center mb-12 sm:mb-20">
 <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#0071e3]/10 flex items-center justify-center mx-auto mb-8 shadow-inner">
 <span className="text-4xl sm:text-6xl">🩺</span>
 </div>
 <h2 className={`text-4xl sm:text-6xl font-black mb-4 uppercase tracking-tighter leading-none ${s.header}`}>Doctor Portal</h2>
 <p className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] opacity-40 ${s.sub}`}>Select authorized consultant profile</p>
 </div>
 <div className="grid grid-cols-1 gap-4 sm:gap-3 sm:p-6">
{activeRosterDocs.map(d =>{
 const rosterItem = roster.find(r => (r as any).doctorId === d.id || (r as any).staffId === d.id);
 return (
 <button
 key={d.id}
 onClick={() => setActiveDoctorId(d.id)}
 className={`w-full py-6 sm:py-10 rounded-[2.5rem] sm:rounded-[3.5rem] border-2 transition-all flex items-center justify-between px-8 sm:px-12 group ${s.card} hover:scale-[1.03] active:scale-95 shadow-xl hover:shadow-2xl relative overflow-hidden`}
 >
{rosterItem?.isOnCall && (
 <div className="absolute top-0 right-0 px-6 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg">On-Call Emergency</div>
 )}
 <div className="text-left space-y-1 sm:space-y-2">
 <div className={`text-xl sm:text-3xl font-black group-hover:${s.accent} transition-colors tracking-tight ${s.header}`}>{d.name}</div>
 <div className={`text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-40 ${s.sub}`}>
 Room{rosterItem?.roomNumber || 'N/A'} •{rosterItem?.shift} Shift
 </div>
 </div>
 <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 transition-all group-hover:bg-[#0A84FF] group-hover:text-white group-hover:border-[#0A84FF] shadow-inner ${s.btn}`}>
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
 </div>
 </button>
 );
})}
{activeRosterDocs.length === 0 && (
 <div className={`text-center py-20 rounded-[3rem] border-4 border-dashed border-opacity-10 space-y-6 ${s.card}`}>
 <span className="text-6xl grayscale opacity-20">📅</span>
 <p className={`text-xs font-black uppercase tracking-widest opacity-40 ${s.sub}`}>No Doctors Allocated Today</p>
 </div>
 )}
 </div>
 </div>
 );
}

 return (
 <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 grid grid-cols-1 lg:grid-cols-4 gap-3 sm:p-6">
{showDailyDigest && doctor && (
 <DoctorDailySummary
 doctor={doctor}
 patients={patients}
 theme={theme}
 themeStyles={s}
 onClose={() => setShowDailyDigest(false)}
 />
 )}
{showPrintPreview && currentPatient && (
 <PrintablePrescription
 patient={currentPatient}
 doctor={doctor}
 prescription={prescription}
 prescribedDrugs={prescribedDrugs}
 diagnosisICD={diagnosisICD}
 onClose={() => setShowPrintPreview(false)}
 />
 )}
{showHistoryTimeline && (
 <PatientHistoryTimeline
 patient={currentPatient}
 onClose={() => setShowHistoryTimeline(false)}
 theme={theme}
 themeStyles={s}
 />
 )}
 <PatientContactModal 
 patient={viewingPatient} 
 onClose={() => setViewingPatient(null)} 
 isAdmin={isAdmin}
 onEdit={onEditPatient}
 onDelete={onDeletePatient}
 />
 
{/* Sidebar Queue (1 col) */}
 <div className="lg:col-span-1 order-last lg:order-first mt-8 lg:mt-0">
 <DoctorPatientQueue 
 innerQueue={innerQueue}
 waitingHall={waitingHall}
 absentList={absentList}
 theme={theme}
 themeStyles={s}
 currentPatientId={currentPatient?.id}
 onSelectPatient={setViewingPatient}
 isQueueHeld={isQueueHeld}
 onHoldQueue={() => setIsQueueHeld(!isQueueHeld)}
 onExit={() => setActiveDoctorId('')}
 onEmergencyBypass={() =>{
 alert("Select an emergency patient to bypass the queue.");
}}
 />
 </div>

 <div className="lg:col-span-3 space-y-6">
 <section className={`p-3 sm:p-6 sm:p-4 sm:p-8 rounded-[2rem] border shadow-xl relative overflow-hidden ${s.card}`}>
 <div className={`absolute top-0 right-0 px-6 py-2 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl shadow-lg ${theme === 'light' ? 'bg-[#0071e3]' : 'bg-[#0A84FF]'}`}>
 Live Consultation
 </div>
 
{currentPatient ? (
 <div className="relative">
{currentPatient.specialistNotesPending && (
 <div className="absolute inset-[-1.5rem] sm:inset-[-2rem] z-50 backdrop-blur-xl border-4 border-amber-500/30 rounded-[2.5rem] flex flex-col items-center justify-center p-3 sm:p-6 text-center bg-white/40 dark:bg-black/40 animate-in fade-in zoom-in-95">
 <div className="text-5xl mb-4 animate-bounce">🤝</div>
 <h3 className="text-2xl font-black text-amber-500 uppercase tracking-tighter mb-4 leading-none">CLINICAL SYNC</h3>
 <p className={`text-[10px] max-w-xs mb-8 leading-relaxed font-black uppercase tracking-widest opacity-80 ${s.header}`}>
 Specialist submitted findings. Verify before completion.
 </p>
 <div className="flex gap-4 w-full max-w-sm">
 <button 
 onClick={() => mockFirestore.updatePatient(currentPatient.id,{ specialistNotesPending: false})}
 className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] hover:bg-emerald-500 transition-all shadow-xl active:scale-95"
 >
 ACKNOWLEDGE
 </button>
 <button className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] border-2 transition-all active:scale-95 ${s.btn}`}>DETAILS</button>
 </div>
 </div>
 )}

 <div className="flex flex-col sm:flex-row gap-4 sm:p-8 items-start animate-in fade-in">
 <div 
 onClick={() => setViewingPatient(currentPatient)}
 className={`w-28 h-28 sm:w-40 sm:h-40 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border-4 shadow-lg shrink-0 transition-transform cursor-pointer hover:scale-105 active:scale-95 ${theme === 'light' ? 'border-white' : 'border-[#333]'}`}
 >
{currentPatient.photo ? (
 <img src={currentPatient.photo} alt={currentPatient.name} className="w-full h-full object-cover" />
 ) : (
 <div className={`w-full h-full flex items-center justify-center text-5xl sm:text-7xl ${s.btn}`}>👤</div>
 )}
 </div>
 <div className="flex-1 w-full space-y-4">
 <div className="space-y-1">
 <div className="flex justify-between items-start gap-4">
 <h3 
 onClick={() => setViewingPatient(currentPatient)}
 className={`text-3xl sm:text-4xl font-black tracking-tight leading-tight cursor-pointer hover:text-blue-500 transition-colors ${s.header}`}
 >
{currentPatient.name}
 </h3>
{currentPatient.surgicalConsentDone && (
 <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border shadow-sm ${s.badge}`}>
 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
 CONSENT
 </span>
 )}
 </div>
 <div className="flex items-center gap-4">
 <span className={`text-[9px] font-black uppercase tracking-widest ${s.accent}`}>ID:{currentPatient.id}</span>
 <span className={`text-[9px] font-black uppercase tracking-widest ${s.sub}`}>{currentPatient.age || 'N/A'}Y •{currentPatient.gender}</span>
 <button 
 onClick={() => setShowHistoryTimeline(true)}
 className={`ml-auto px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all hover:bg-[#0071e3] hover:text-white hover:border-[#0071e3] active:scale-95 ${s.badge}`}
 >
 View History
 </button>
 </div>
 </div>
 
 <div className="pt-4">
 <VitalsDisplay patient={currentPatient} theme={theme} themeStyles={s} />
 </div>

{currentPatient.treatmentResults && (
 <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl mb-4">
 <div className="text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-1">Treatment Results (Priority)</div>
 <div className="text-sm font-bold text-emerald-700">{currentPatient.treatmentResults}</div>
 </div>
 )}
 
 <div className="space-y-4">
 <div className="pt-6 border-t border-inherit/10">
 <h4 className={`text-xs font-black uppercase tracking-widest ${s.header} mb-4 flex items-center gap-2`}>
 Clinical History
 <span className={`px-2 py-0.5 rounded text-[8px] ${s.btn} border border-inherit`}>Live</span>
 </h4>
 
{Array.isArray(currentPatient.labTests) && currentPatient.labTests.length > 0 && (
 <div className="mb-6 space-y-2">
 <h5 className={`text-[10px] font-black uppercase tracking-widest text-[#0A84FF]`}>Lab Reports</h5>
 <div className={`p-4 rounded-xl border ${s.btn} border-inherit/10`}>
 <div className="flex flex-wrap gap-2 mb-3">
{currentPatient.labTests.map((test: string) => (
 <span key={test} className="px-2 py-1 rounded bg-[#0A84FF]/10 text-[#0A84FF] text-[9px] font-bold uppercase tracking-widest">{test}</span>
 ))}
 </div>
{currentPatient.labResults ? (
 <div className={`text-xs font-medium ${s.header}`}>{currentPatient.labResults}</div>
 ) : (
 <div className={`text-xs font-medium italic opacity-50 ${s.sub}`}>Results Pending...</div>
 )}
 </div>
 </div>
 )}
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Department</label>
 <select 
 value={department}
 onChange={(e) => setDepartment(e.target.value)}
 className={`w-full rounded-xl px-4 py-3 font-black text-[10px] border-2 outline-none transition-all ${s.input}`}
 >
 <option>General Medicine</option>
 <option>Pediatrics</option>
 <option>Orthopedics</option>
 <option>Gynecology</option>
 <option>Cardiology</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Clinical Directive</label>
 <select 
 value={directive}
 onChange={(e) => setDirective(e.target.value)}
 className={`w-full rounded-xl px-4 py-3 font-black text-[10px] border-2 outline-none transition-all ${s.input}`}
 >
 <option>Referred to Treatment</option>
 <option>Send to Lab</option>
 <option>Referred to Cross-Consult</option>
 <option>Discharge</option>
 </select>
 </div>
{directive === 'Referred to Treatment' && (
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Treatment Station</label>
 <select 
 value={targetTreatmentType}
 onChange={(e) => setTargetTreatmentType(e.target.value)}
 className={`w-full rounded-xl px-4 py-3 font-black text-[10px] border-2 outline-none transition-all ${s.input}`}
 >
{TREATMENT_TYPES.map(t => (
 <option key={t} value={t}>{t}</option>
 ))}
 </select>
 </div>
 )}
 <div className="col-span-1 sm:col-span-2">
 <ClinicalCodingAssistant value={diagnosisICD} onChange={setDiagnosisICD} themeStyles={s} />
 </div>
 </div>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <SmartLabResults theme={theme} themeStyles={s} />
 <FollowUpScheduler themeStyles={s} />
 </div>

 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Smart Diagnosis Templates</label>
 <div className="flex flex-wrap gap-2">
 <button onClick={() => applySmartDefault('Fever')} className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all active:scale-95 ${s.btn} hover:border-[#0A84FF] hover:text-[#0A84FF]`}>
 🌡️ Viral Fever
 </button>
 <button onClick={() => applySmartDefault('Hypertension')} className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all active:scale-95 ${s.btn} hover:border-[#0A84FF] hover:text-[#0A84FF]`}>
 ❤️ Hypertension
 </button>
 <button onClick={() => applySmartDefault('Gastritis')} className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all active:scale-95 ${s.btn} hover:border-[#0A84FF] hover:text-[#0A84FF]`}>
 🦠 Gastritis
 </button>
 </div>
 </div>

 <ClinicalNotesDictation value={prescription} onChange={setPrescription} themeStyles={s} />

 <RxWriter 
 prescribedDrugs={prescribedDrugs} 
 onChange={setPrescribedDrugs} 
 patientAllergies={currentPatient.allergies || []}
 themeStyles={s} 
 inventory={inventory}
 />

 <div className="flex flex-wrap items-center gap-2">
 <MedicalCertificateGenerator 
 patient={currentPatient} 
 theme={theme} 
 themeStyles={s} 
 onGenerate={(cert) =>{
 setMedicalCertificates([...medicalCertificates, cert]);
 alert("Medical Certificate generated and attached to patient record.");
}} 
 />
 <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1"></div>
 <button 
 onClick={handleAdmit}
 className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all active:scale-95 shadow-sm ${s.badge} hover:bg-[#0071e3]/5`}
 >
 IPD
 </button>
 <button 
 onClick={handleConsent}
 className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all active:scale-95 shadow-sm ${s.badge} hover:bg-[#0071e3]/5`}
 >
 CONSENT
 </button>
 <button 
 onClick={() => mockFirestore.updatePatient(currentPatient.id,{ dietPlan: 'Liquid Diet'})}
 className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all active:scale-95 shadow-sm ${s.badge} hover:bg-[#0071e3]/5`}
 >
 DIET
 </button>
 </div>

 <div className="flex gap-4">
 <button
 onClick={() => setShowPrintPreview(true)}
 disabled={!prescription && prescribedDrugs.length === 0}
 className={`px-6 py-4 rounded-2xl font-black transition-all uppercase tracking-[0.3em] text-[10px] border-2 disabled:opacity-50 active:scale-95 ${s.btn}`}
 >
 PRINT Rx
 </button>
 <button 
 onClick={handleComplete}
 disabled={!prescription && prescribedDrugs.length === 0}
 className={`flex-1 py-4 rounded-2xl font-black transition-all uppercase tracking-[0.3em] text-[10px] shadow-xl disabled:opacity-50 active:scale-95 ${theme === 'light' ? 'bg-[#0071e3] text-white hover:bg-[#0077ed]' : 'bg-[#0A84FF] text-white hover:bg-[#409fff]'}`}
 >
 FINISH
 </button>
 <button 
 onClick={handleSkip}
 className={`px-6 py-4 rounded-2xl font-black transition-all uppercase tracking-[0.3em] text-[10px] border-2 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white shadow-lg active:scale-95`}
 >
 SKIP
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 ) : (
 <div className="py-16 sm:py-24 text-center space-y-6">
 <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto text-4xl border-2 animate-bounce shadow-xl ${s.btn}`}>⏳</div>
 <div>
 <h4 className={`text-xl sm:text-2xl font-black uppercase tracking-tight mb-2 ${s.header}`}>Station Idle</h4>
 <p className={`text-[8px] font-black uppercase tracking-widest max-w-xs mx-auto opacity-40 leading-relaxed ${s.sub}`}>
 Room{currentRosterItem?.roomNumber || doctor?.section} awaiting patient.
 </p>
 </div>
 </div>
 )}
 </section>
 
{/* Processed Registry & End of Day Stats */}
 <section className="space-y-4 pt-6 border-t border-black/5 dark:border-white/5">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-3 ${s.sub}`}>
 Processed Registry
 <button 
 onClick={() => setShowDailyDigest(true)}
 className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all hover:bg-black/10 dark:hover:bg-white/10 ${s.sub}`}
 >
 Daily Digest
 </button>
 </h3>
 
{/* End of Day Report Stats */}
 <div className={`flex items-center gap-4 p-3 rounded-xl border shadow-sm ${s.card}`}>
 <div className="flex flex-col text-center px-2">
 <span className={`text-base font-black leading-none ${s.header}`}>
{patients.filter(p => p.assignedDoctorId === activeDoctorId && (p.status === PatientStatus.CONSULTATION_DONE || p.status === PatientStatus.ADMISSION_DESK || p.status === PatientStatus.WARD_ADMITTED)).length}
 </span>
 <span className={`text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Seen</span>
 </div>
 <div className="w-px h-8 bg-black/10 dark:bg-white/10"></div>
 <div className="flex flex-col text-center px-2">
 <span className="text-base font-black leading-none text-emerald-500">
{patients.filter(p => p.assignedDoctorId === activeDoctorId && (p.status === PatientStatus.ADMISSION_DESK || p.status === PatientStatus.WARD_ADMITTED)).length}
 </span>
 <span className={`text-[8px] font-black uppercase tracking-widest text-emerald-500/80`}>IPD Conv.</span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 opacity-60 hover:opacity-100 transition-opacity">
{patients.filter(p => p.assignedDoctorId === activeDoctorId && (p.status === PatientStatus.CONSULTATION_DONE || p.status === PatientStatus.ADMISSION_DESK || p.status === PatientStatus.WARD_ADMITTED))
 .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
 .slice(0, 8)
 .map((p) => (
 <div key={p.id} className={`p-3 rounded-xl border flex items-center gap-3 ${s.card} border-emerald-500/20 bg-emerald-500/5`}>
 <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">✓</div>
 <div className="min-w-0">
 <div className={`text-[10px] font-black uppercase truncate ${s.header}`}>{p.name}</div>
 <div className={`text-[7px] font-bold uppercase tracking-tighter opacity-50 ${s.sub}`}>{p.status === PatientStatus.CONSULTATION_DONE ? 'Consulted' : 'Admitted'}</div>
 </div>
 </div>
 ))
}
 </div>
 </section>
 </div>
 </div>
 );
};

export default StaffDoctor;
