
import React,{ useState} from 'react';
import{ Patient, PatientStatus, PatientCategory, Theme} from '../types';
import{ mockFirestore} from '../services/mockFirestore';
import{ getPremiumStyles} from '../theme/premiumDesign';

interface StaffAttendantMgmtProps{
 patients: Patient[];
 theme: Theme;
 isAdmin?: boolean;
 onEditPatient?: (p: Patient) => void;
 onDeletePatient?: (p: Patient) => void;
}

const StaffAttendantMgmt: React.FC<StaffAttendantMgmtProps> = ({ patients, theme, isAdmin, onEditPatient, onDeletePatient}) =>{
 const [selectedAttendant, setSelectedAttendant] = useState<Patient | null>(null);

 const s = getPremiumStyles(theme);

 const activeAttendants = patients.filter(p => 
 p.category === PatientCategory.ATTENDANT && 
 p.status !== PatientStatus.COMPLETED
 ).sort((a, b) => b.timestamp - a.timestamp);

 const getTargetPatientName = (targetId?: string) =>{
 return patients.find(p => p.id === targetId)?.name || 'Unknown Patient';
};

 const handleTransfer = (id: string) =>{
 mockFirestore.updatePatient(id,{ status: PatientStatus.COMPLETED});
 setSelectedAttendant(null);
};

 return (
 <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:p-8 sm:gap-12">
 <div className="lg:col-span-2 space-y-6 pr-4">
 <div className="flex items-center justify-between mb-4 px-2">
 <h3 className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${s.header}`}>ATTENDANT REGISTRY ({activeAttendants.length})</h3>
 <span className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${s.sub}`}>Inpatient Support</span>
 </div>

{activeAttendants.map((att) => (
 <div 
 key={att.id}
 onClick={() => setSelectedAttendant(att)}
 className={`p-3 sm:p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border-2 transition-all cursor-pointer group flex flex-col sm:flex-row items-center justify-between gap-4 sm:p-8 shadow-lg hover:shadow-2xl ${s.card} ${selectedAttendant?.id === att.id ? 'ring-4 ring-[#0A84FF] scale-[1.02]' : 'hover:scale-[1.01] active:scale-95'}`}
 >
 <div className="flex items-center gap-4 sm:p-8 w-full sm:w-auto">
 <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border-4 shadow-xl transition-transform group-hover:rotate-3 ${s.btn}`}>
{att.photo ? (
 <img src={att.photo} alt={att.name} className="w-full h-full object-cover" />
 ) : (
 <div className={`w-full h-full flex items-center justify-center text-4xl ${s.sub}`}>👤</div>
 )}
 </div>
 <div className="space-y-3">
 <h3 className={`text-xl sm:text-3xl font-black tracking-tight group-hover:${s.accent} transition-colors leading-none ${s.header}`}>{att.name}</h3>
 <div className="flex flex-wrap items-center gap-3">
 <span className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${s.sub}`}>Assigned Inmate:</span>
 <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-tight shadow-md border-2 ${s.badge}`}>{getTargetPatientName(att.targetPatientId)}</span>
 </div>
 <div className="pt-1">
 <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 shadow-sm ${s.badge}`}>
 FULL PERIMETER ACCESS
 </span>
 </div>
 </div>
 </div>
 <div className="text-center sm:text-right w-full sm:w-auto bg-[#F5F5F7] dark:bg-[#2D2D2D] p-5 sm:p-0 sm:bg-transparent rounded-[2rem]">
 <div className={`text-[10px] font-black uppercase tracking-widest mb-2 opacity-40 ${s.sub}`}>TELEMETRY CONTACT</div>
 <div className={`text-lg sm:text-xl font-black tracking-tighter ${s.header}`}>{att.contactNumber}</div>
 </div>
 </div>
 ))}

{activeAttendants.length === 0 && (
 <div className={`text-center py-36 rounded-[3rem] border-4 border-dashed border-opacity-10 space-y-8 ${s.card}`}>
 <div className="text-9xl opacity-10 grayscale animate-pulse">🛡️</div>
 <p className={`font-black uppercase tracking-[0.4em] text-[10px] opacity-40 ${s.sub}`}>SUPPORT REGISTRY VACANT Authority</p>
 </div>
 )}
 </div>

 <div className="space-y-8">
{selectedAttendant ? (
 <div className={`p-10 sm:p-12 rounded-[3.5rem] border shadow-2xl animate-in fade-in slide-in-from-right-10 ${s.card}`}>
 <div className="flex justify-between items-start mb-10">
 <h3 className={`text-2xl font-black tracking-tighter uppercase ${s.header}`}>Authority Profile</h3>
 <button onClick={() => setSelectedAttendant(null)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-black/5 dark:hover:bg-white/5 ${s.sub}`}>
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
 </button>
 </div>

 <div className={`w-full aspect-square rounded-[3rem] sm:rounded-[4rem] overflow-hidden border-8 mb-10 relative shadow-2xl transition-transform hover:scale-[1.05] ${s.btn}`}>
{selectedAttendant.photo ? (
 <img src={selectedAttendant.photo} alt={selectedAttendant.name} className="w-full h-full object-cover" />
 ) : (
 <div className={`w-full h-full flex items-center justify-center text-[10rem] ${s.sub}`}>👤</div>
 )}
 </div>

 <div className="grid grid-cols-1 gap-4 mb-12">
 <div className={`p-3 sm:p-6 rounded-[2rem] border-2 shadow-inner group transition-all ${s.btn}`}>
 <span className={`block text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-40 ${s.sub}`}>Credential Sync</span>
 <span className={`text-base sm:text-lg font-black tracking-tight ${s.header}`}>{selectedAttendant.idType}:{selectedAttendant.idNumber}</span>
 </div>
 <div className={`p-3 sm:p-6 rounded-[2rem] border-2 shadow-inner group transition-all ${s.btn}`}>
 <span className={`block text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-40 ${s.sub}`}>Clinical Kinship</span>
 <span className={`text-base sm:text-lg font-black tracking-tight ${s.header}`}>{selectedAttendant.relationship || 'Primary Caretaker'}</span>
 </div>
 <div className={`p-3 sm:p-6 rounded-[2rem] border-2 shadow-inner group transition-all ${s.btn}`}>
 <span className={`block text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-40 ${s.sub}`}>Subject Nexus</span>
 <span className={`text-base sm:text-lg font-black tracking-tight ${s.accent}`}>{getTargetPatientName(selectedAttendant.targetPatientId)}</span>
 </div>
 </div>

 <button 
 onClick={() => handleTransfer(selectedAttendant.id)}
 className={`w-full py-6 sm:py-8 rounded-[2rem] sm:rounded-[2.5rem] font-black transition-all uppercase tracking-[0.4em] text-xs sm:text-sm shadow-2xl active:scale-95 ${theme === 'light' ? 'bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-[#0071e3]/30' : 'bg-[#0A84FF] text-white hover:bg-[#409fff] shadow-[#0A84FF]/30'}`}
 >
 REVOKE CREDENTIALS
 </button>
 
 <p className={`mt-6 text-[10px] text-center font-black uppercase tracking-widest leading-relaxed opacity-20 ${s.sub}`}>
 DEACTIVATION PERMITS NEW PERIMETER ENTRY Authority.
 </p>
 </div>
 ) : (
 <div className={`p-16 rounded-[4rem] border-4 border-dashed border-opacity-10 h-[32rem] flex flex-col items-center justify-center text-center space-y-10 ${s.card}`}>
 <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-pulse ${s.btn}`}>
 <span className="text-6xl grayscale">📂</span>
 </div>
 <div className="space-y-4 max-w-[15rem]">
 <h4 className={`text-[12px] font-black uppercase tracking-widest leading-relaxed ${s.sub}`}>Authority Selection Pending</h4>
 <p className={`text-[10px] font-black uppercase tracking-widest leading-relaxed opacity-20 ${s.sub}`}>
 Select a live attendant log entry to synchronise high-priority credentials.
 </p>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
};

export default StaffAttendantMgmt;

