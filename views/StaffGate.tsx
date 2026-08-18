
import React,{ useState, useRef, useEffect} from 'react';
import{ Patient, PatientStatus, PatientCategory, Theme} from '../types';
import{ mockFirestore} from '../services/mockFirestore';
import{ AreaAutocomplete} from '../components/AreaAutocomplete';
import{ LOCALITY_DATABASE, LocalityInfo} from '../constants';
import{ getPremiumStyles} from '../theme/premiumDesign';

interface StaffGateProps{
 patients: Patient[];
 theme: Theme;
 waitingCount: number;
 isAdmin?: boolean;
 onEditPatient?: (p: Patient) => void;
 onDeletePatient?: (p: Patient) => void;
}

const StaffGate: React.FC<StaffGateProps> = ({ patients, theme, waitingCount, isAdmin, onEditPatient, onDeletePatient}) =>{
 const [step, setStep] = useState<'selection' | 'form'>('selection');

  useEffect(() => {
    const handleAppBack = (e) => {
      if (step === 'form') {
        e.preventDefault();
        setStep('selection');
      }
    };
    window.addEventListener('app-back-button', handleAppBack);
    return () => window.removeEventListener('app-back-button', handleAppBack);
  }, [step]);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [success, setSuccess] = useState(false);
 const [error, setError] = useState('');
 const [registryFilter, setRegistryFilter] = useState<string>(() =>{
 return localStorage.getItem('gate_registry_filter') || 'All';
});
 
 useEffect(() =>{
 localStorage.setItem('gate_registry_filter', registryFilter);
}, [registryFilter]);

 const [formData, setFormData] = useState({
 staffName: '',
 category: PatientCategory.OPD,
 name: '',
 phone: '',
 idType: 'Aadhaar Card',
 idNumber: '',
 publicDisplayConsent: true,
 photoUrl: '',
 age: '',
 gender: 'Male',
 address: '',
 area: '',
 pincode: '',
 geographicZone: 'Urban-Ahmednagar' as const,
 travelDistanceKm: 0,
 isRedChannelBypass: false,
 bypassJustification: '',
 photo: '',
 insuranceType: 'Cash/Self-Pay',
 isForeigner: false,
 medicalHistory: '',
 targetPatientId: '',
 relationship: '',
 emergencyContact: '',
 temperature: '',
 bloodPressure: '',
 pulse: '',
 weight: '',
 spo2: ''
});

 const s = getPremiumStyles(theme);

 // Dynamically calculate waiting patients from current live state (removed from internal to use prop)

 const categories = [
{ id: PatientCategory.OPD, icon: '🩺', desc: 'Check-ups, Tests, Advice', color: 'blue'},
{ id: PatientCategory.IPD, icon: '🛌', desc: 'Surgery or Serious Care', color: 'indigo'},
{ id: PatientCategory.VISITOR, icon: '👥', desc: 'Friends & Family', color: 'purple'},
{ id: PatientCategory.ATTENDANT, icon: '🤝', desc: 'Overnight Caretakers', color: 'pink'},
{ id: PatientCategory.EMERGENCY, icon: '🚑', desc: 'Immediate Life-Saving', color: 'red'},
 ];

 const admittedPatients = patients.filter(p => p.category === PatientCategory.IPD && p.status !== PatientStatus.COMPLETED);
 
 const [isManualArea, setIsManualArea] = useState(false);

 const handleLocalitySelect = (locality: LocalityInfo | null) =>{
 if (locality){
 setFormData(prev => ({
 ...prev,
 area: locality.name,
 pincode: locality.pincode,
 geographicZone: locality.zone,
 travelDistanceKm: locality.distance
}));
 setIsManualArea(false);
} else{
 setIsManualArea(true);
 setFormData(prev => ({
 ...prev,
 area: '',
 geographicZone: 'Rural-Taluka' // Default to rural for 'Other'
}));
}
};

 const handlePincodeChange = (pin: string) =>{
 const cleanedPin = pin.replace(/\D/g, '').slice(0, 6);
 setFormData(prev => ({ ...prev, pincode: cleanedPin}));
 
 // Auto-fill logic for pincode
 if (cleanedPin.length === 6){
 const match = LOCALITY_DATABASE.find(l => l.pincode === cleanedPin);
 if (match){
 setFormData(prev => ({
 ...prev,
 area: match.name,
 geographicZone: match.zone,
 travelDistanceKm: match.distance
}));
 setIsManualArea(false);
}
}
};

 const handleCategorySelect = (cat: PatientCategory) =>{
 setFormData({ ...formData, category: cat});
 setError('');
 setStep('form');
};

 const [isCameraActive, setIsCameraActive] = useState(false);
 const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
 const videoRef = useRef<HTMLVideoElement>(null);
 const [stream, setStream] = useState<MediaStream | null>(null);
 const [cameraError, setCameraError] = useState<string | null>(null);
 const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

 // Check for multiple cameras
 useEffect(() =>{
 const checkCameras = async () =>{
 try{
 const devices = await navigator.mediaDevices.enumerateDevices();
 const videoDevices = devices.filter(device => device.kind === 'videoinput');
 setHasMultipleCameras(videoDevices.length > 1);
} catch (err){
 console.error("Error checking devices:", err);
}
};
 checkCameras();
}, []);

 // Attach stream to video element when it becomes available in the DOM
 useEffect(() =>{
 let isMounted = true;
 if (isCameraActive && stream && videoRef.current){
 const video = videoRef.current;
 video.srcObject = stream;
 
 const playVideo = async () =>{
 try{
 await video.play();
} catch (err){
 console.error("Video play error:", err);
 if (isMounted) setCameraError("Failed to start video playback. Please click 'Retake'.");
}
};
 playVideo();
}
 return () =>{ isMounted = false;};
}, [isCameraActive, stream]);

 // Clean up stream on unmount
 useEffect(() =>{
 return () =>{
 if (stream){
 stream.getTracks().forEach(track => track.stop());
}
};
}, [stream]);

 const startCamera = async (currentFacingMode: 'user' | 'environment' = facingMode) =>{
 setCameraError(null);
 try{
 if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
 throw new Error("Camera API not supported in this browser.");
}

 if (stream){
 stream.getTracks().forEach(track => track.stop());
}

 // Try with specific facingMode
 const constraints: MediaStreamConstraints ={
 video:{ 
 width:{ ideal: 1280}, 
 height:{ ideal: 720},
 facingMode: currentFacingMode
}
};
 
 try{
 const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
 setStream(mediaStream);
 setIsCameraActive(true);
} catch (innerErr){
 console.warn("Retrying with simple constraints...");
 const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true});
 setStream(fallbackStream);
 setIsCameraActive(true);
}
 
 setError('');
} catch (err: any){
 console.error("Camera Access Error:", err);
 setCameraError(err.message || "Camera access failed.");
 setIsCameraActive(false);
 setError("Camera permission denied or camera not found. Please ensure camera access is allowed.");
}
};

 const toggleCamera = () =>{
 const nextMode = facingMode === 'user' ? 'environment' : 'user';
 setFacingMode(nextMode);
 if (isCameraActive){
 startCamera(nextMode);
}
};

 const stopCamera = () =>{
 if (stream){
 stream.getTracks().forEach(track => track.stop());
 setStream(null);
}
 setIsCameraActive(false);
};

 const capturePhoto = () =>{
 if (videoRef.current){
 try{
 const video = videoRef.current;
 const canvas = document.createElement('canvas');
 canvas.width = video.videoWidth || 640;
 canvas.height = video.videoHeight || 480;
 const ctx = canvas.getContext('2d');
 if (ctx){
 if (facingMode === 'user'){
 ctx.translate(canvas.width, 0);
 ctx.scale(-1, 1); // Flip horizontally to match front-camera preview
}
 ctx.drawImage(video, 0, 0);
 const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
 setFormData({ ...formData, photo: dataUrl});
 stopCamera();
}
} catch (err){
 console.error("Capture error:", err);
 setCameraError("Failed to capture photo. Please try again.");
}
}
};

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>{
 const file = e.target.files?.[0];
 if (file){
 const reader = new FileReader();
 reader.onloadend = () => setFormData({ ...formData, photo: reader.result as string});
 reader.readAsDataURL(file);
}
};

 const handleSubmit = async (e: React.FormEvent) =>{
 e.preventDefault();
 setIsSubmitting(true);
 setError('');

 try{
 await mockFirestore.addPatient({
 name: formData.name,
 contactNumber: formData.phone,
 status: PatientStatus.GATE_REGISTERED,
 category: formData.category,
 idType: formData.idType,
 idNumber: formData.idNumber,
 publicDisplayConsent: formData.publicDisplayConsent,
 photoUrl: formData.photoUrl,
 age: formData.age,
 gender: formData.gender,
 address: formData.address,
 area: formData.area,
 pincode: formData.pincode,
 geographicZone: formData.geographicZone,
 travelDistanceKm: formData.travelDistanceKm,
 isRedChannelBypass: formData.isRedChannelBypass,
 bypassJustification: formData.bypassJustification,
 photo: formData.photo,
 insuranceType: formData.insuranceType,
 isForeigner: formData.isForeigner,
 medicalHistory: formData.medicalHistory,
 temperature: formData.temperature,
 bloodPressure: formData.bloodPressure,
 pulse: formData.pulse,
 weight: formData.weight,
 spo2: formData.spo2,
 targetPatientId: formData.targetPatientId,
 relationship: formData.relationship,
 emergencyContact: formData.emergencyContact,
 authorName: formData.staffName || 'Gate Staff',
 activeVisitorsCount: 0,
 expiryTimestamp: formData.category === PatientCategory.VISITOR ? Date.now() + (2 * 60 * 60 * 1000) : undefined
});

 setSuccess(true);
 setTimeout(() =>{
 setSuccess(false);
 setStep('selection');
 setFormData({
 staffName: formData.staffName,
 category: PatientCategory.OPD,
 name: '',
 phone: '',
 idType: 'Aadhaar Card',
 idNumber: '',
 publicDisplayConsent: true,
 photoUrl: '',
 age: '',
 gender: 'Male',
 address: '',
 area: '',
 pincode: '',
 geographicZone: 'Urban-Ahmednagar',
 travelDistanceKm: 0,
 isRedChannelBypass: false,
 bypassJustification: '',
 photo: '',
 insuranceType: 'Cash/Self-Pay',
 isForeigner: false,
 medicalHistory: '',
 targetPatientId: '',
 relationship: '',
 emergencyContact: '',
 temperature: '',
 bloodPressure: '',
 pulse: '',
 weight: '',
 spo2: ''
});
}, 1500);
} catch (err: any){
 setError(err.message || "Failed to register patient.");
} finally{
 setIsSubmitting(false);
}
};

 if (step === 'selection'){
 return (
 <div className="flex flex-col items-center py-4 sm:py-8 w-full">
{/* Title Group */}
 <div className="text-center mb-6 sm:mb-10 w-full max-w-7xl mx-auto">
 <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-4 sm:p-8">
 <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${s.header}`}>Intake System</h1>
 
 <div className="flex flex-row sm:flex-col items-center sm:items-start justify-center px-4 py-1 sm:py-0 sm:pl-8 border-t sm:border-t-0 sm:border-l border-emerald-500/20 w-full sm:w-auto">
 <span className="text-[10px] sm:text-lg font-black uppercase tracking-[0.1em] text-emerald-500 leading-none mr-2 sm:mr-0">
 Waiting
 </span>
 <div className="flex items-center gap-2">
 <span className="text-2xl sm:text-4xl font-black tracking-tight text-emerald-500 tabular-nums leading-none">
{waitingCount}
 </span>
 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
 </div>
 </div>
 </div>
 </div>

{/* Main Selection Grid */}
 <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 space-y-4 sm:space-y-6 pb-8">
 <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
{categories.map((cat) => (
 <button
 key={cat.id}
 onClick={() => handleCategorySelect(cat.id)}
 className={`group relative flex flex-col items-center text-center p-4 sm:p-3 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-300 min-h-[120px] sm:min-h-[160px] ${s.card} hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-xl`}
 >
 <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-3xl mb-3 sm:mb-4 shadow-inner border transition-all ${s.btn}`}>
{cat.icon}
 </div>
 <h3 className={`text-[10px] sm:text-xs font-black mb-1 uppercase tracking-widest leading-tight ${s.header}`}>{cat.id}</h3>
 <p className={`font-bold text-[8px] sm:text-[10px] leading-tight opacity-60 ${s.sub}`}>{cat.desc}</p>
 </button>
 ))}
 </div>
 </div>
 
{/* Processed Registry (Selection View) */}
 <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 mx-auto mt-12 pb-10 border-t border-white/5 pt-8">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
 <h3 className={`text-sm font-black uppercase tracking-widest ${s.sub}`}>Processed Registry (Gate Entry)</h3>
 
 <div className="flex flex-wrap gap-2">
{['All', ...Object.values(PatientCategory)].map(cat => (
 <button
 key={cat}
 onClick={() => setRegistryFilter(cat)}
 className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
 registryFilter === cat 
 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
 :`opacity-50 hover:opacity-100 border ${s.card}`
}`}
 >
{cat}
 </button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 opacity-70 hover:opacity-100 transition-opacity">
{patients.filter(p => p.status === PatientStatus.GATE_REGISTERED || p.status === PatientStatus.RECEPTION_WAITING)
 .filter(p => registryFilter === 'All' || p.category === registryFilter)
 .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
 .slice(0, 16)
 .map((p) => (
 <div key={p.id} className={`p-3 rounded-xl border flex items-center gap-3 ${s.card} border-emerald-500/20 bg-emerald-500/5`}>
 <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">✓</div>
 <div className="min-w-0">
 <div className={`text-[10px] font-black uppercase truncate ${s.header}`}>{p.name}</div>
 <div className={`text-[7px] font-bold uppercase tracking-tighter opacity-50 ${s.sub}`}>{p.category} •{new Date(p.timestamp).toLocaleTimeString([],{ hour: '2-digit', minute: '2-digit'})}</div>
 <div className={`text-[7px] font-bold uppercase tracking-tighter opacity-80 ${s.accent} mt-0.5`}>Staff:{p.authorName || 'Unknown'}</div>
 </div>
 </div>
 ))
}
 </div>
 </div>
 </div>
 );
}

 const isVisitorOrAttendant = formData.category === PatientCategory.VISITOR || formData.category === PatientCategory.ATTENDANT;

 return (
 <div className="w-full mx-auto py-4 sm:py-8 max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
{/* Form Header */}
 <div className="flex justify-between items-center mb-6 sm:mb-8 gap-4">
 <button onClick={() => setStep('selection')} className={`px-6 py-2 rounded-full text-[10px] font-black transition-all border flex items-center justify-center gap-2 shadow-md active:scale-95 ${s.btn}`}>
 <span>←</span> RETURN
 </button>
 <div className={`px-6 py-2 border rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-inner text-center ${s.btn}`}>
 Intake: <span className={s.accent}>{formData.category}</span>
 </div>
 </div>

 <div className={`p-3 sm:p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border shadow-xl relative overflow-hidden transition-all ${s.card}`}>
{success && (
 <div className="absolute inset-0 bg-white/95 dark:bg-black/95 z-50 flex flex-col items-center justify-center animate-in fade-in">
 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-6 border-2 border-emerald-500/40 animate-bounce shadow-xl">
 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
 </div>
 <h3 className={`text-xl sm:text-2xl font-black uppercase tracking-widest ${s.header}`}>Registry Synced</h3>
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-12">
{error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 font-black text-xs text-center">{error}</div>}
 
{/* Section 01: Linked Patient */}
{isVisitorOrAttendant && (
 <section className="animate-in slide-in-from-top-2">
 <h4 className={`text-[8px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-3 ${s.accent}`}>
 <span className={`w-1 h-6 rounded-full ${theme === 'light' ? 'bg-[#0071e3]' : 'bg-[#0A84FF]'}`}></span> 01 PATIENT LINK
 </h4>
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Select Admitted Patient</label>
 <div className="relative">
 <select 
 required
 value={formData.targetPatientId}
 onChange={(e) => setFormData({ ...formData, targetPatientId: e.target.value})}
 className={`w-full rounded-xl sm:rounded-2xl px-4 py-3 sm:py-4 font-black outline-none border-2 transition-all text-xs sm:text-base appearance-none ${s.input} focus:ring-4 focus:ring-[#0071e3]/20 shadow-sm`}
 >
 <option value="">Select Patient from List...</option>
{admittedPatients.map(p => <option key={p.id} value={p.id}>{p.name} (ID:{p.id})</option>)}
 </select>
 </div>
 </div>
 </section>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:p-8 sm:gap-12">
{/* Left Column: Form Fields */}
 <div className="space-y-8">
{/* Section: Identity Proof */}
 <section>
 <h4 className={`text-[8px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-3 ${s.accent}`}>
 <span className={`w-1 h-6 rounded-full ${theme === 'light' ? 'bg-[#0071e3]' : 'bg-[#0A84FF]'}`}></span> 
 IDENTITY VERIFICATION
 </h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>ID Type</label>
 <select 
 value={formData.idType}
 onChange={(e) => setFormData({ ...formData, idType: e.target.value})}
 className={`w-full rounded-xl px-4 py-3 font-black outline-none border-2 text-xs sm:text-sm ${s.input}`}
 >
 <option>Aadhaar Card</option>
 <option>Driving License</option>
 <option>Passport</option>
 <option>Voter ID</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>ID Number</label>
 <input 
 type="text" 
 required 
 placeholder="Number..."
 value={formData.idNumber} 
 onChange={(e) => setFormData({ ...formData, idNumber: e.target.value})} 
 className={`w-full rounded-xl px-4 py-3 font-black outline-none border-2 text-xs sm:text-sm ${s.input}`} 
 />
 </div>
 </div>
 </section>

{/* Section: Profile Details */}
 <section>
 <h4 className={`text-[8px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-3 ${s.accent}`}>
 <span className={`w-1 h-6 rounded-full ${theme === 'light' ? 'bg-[#0071e3]' : 'bg-[#0A84FF]'}`}></span> 
 PROFILE DETAILS
 </h4>
 <div className="space-y-4">
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Full Legal Name</label>
 <input 
 type="text" 
 required 
 placeholder="Name..."
 value={formData.name} 
 onChange={(e) => setFormData({ ...formData, name: e.target.value})} 
 className={`w-full rounded-xl px-4 py-3 font-black outline-none border-2 text-xs sm:text-base ${s.input}`} 
 />
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Contact</label>
 <input 
 type="tel" 
 required 
 placeholder="+91..."
 value={formData.phone} 
 onChange={(e) => setFormData({ ...formData, phone: e.target.value})} 
 className={`w-full rounded-xl px-4 py-3 font-black outline-none border-2 text-xs sm:text-sm ${s.input}`} 
 />
 </div>
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Age</label>
 <input 
 type="number" 
 required 
 placeholder="Age..."
 value={formData.age} 
 onChange={(e) => setFormData({ ...formData, age: e.target.value})} 
 className={`w-full rounded-xl px-4 py-3 font-black outline-none border-2 text-xs sm:text-sm ${s.input}`} 
 />
 </div>
 </div>
 
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Geographic Zone</label>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
{(['Urban-Ahmednagar', 'Rural-Taluka'] as const).map(zone => (
 <button
 key={zone}
 type="button"
 onClick={() =>{
 setFormData({ ...formData, geographicZone: zone, area: '', travelDistanceKm: 0, pincode: ''});
 setIsManualArea(false);
}}
 className={`py-2 px-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all ${
 formData.geographicZone === zone 
 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' 
 :`border-transparent ${theme === 'light' ? 'bg-[#F5F5F7]' : 'bg-[#2D2D2D]'}`
}`}
 >
{zone.replace('-', ' ')}
 </button>
 ))}
 </div>
 </div>

 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Area / Locality</label>
 <AreaAutocomplete 
 value={formData.area} 
 onSelectLocality={handleLocalitySelect}
 onManualChange={(val) => setFormData({ ...formData, area: val})}
 theme={theme}
 styles={s}
 isManualMode={isManualArea}
 selectedZone={formData.geographicZone as any}
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Pincode</label>
 <input 
 type="text" 
 required 
 maxLength={6}
 placeholder="6-digit..."
 value={formData.pincode} 
 onChange={(e) => handlePincodeChange(e.target.value)} 
 className={`w-full rounded-xl px-4 py-3 font-black outline-none border-2 text-xs sm:text-sm ${s.input}`} 
 />
 </div>
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Distance (Km)</label>
 <input 
 type="number" 
 required 
 step="0.1"
 placeholder="Km..."
 value={formData.travelDistanceKm} 
 onChange={(e) => setFormData({ ...formData, travelDistanceKm: parseFloat(e.target.value) || 0})} 
 className={`w-full rounded-xl px-4 py-3 font-black outline-none border-2 text-xs sm:text-sm ${s.input}`} 
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Geographic Zone</label>
 <select 
 value={formData.geographicZone}
 onChange={(e) => setFormData({ ...formData, geographicZone: e.target.value as any})}
 className={`w-full rounded-xl px-4 py-3 font-black outline-none border-2 text-xs sm:text-sm ${s.input}`}
 >
 <option value="Urban-Ahmednagar">Urban-Ahmednagar</option>
 <option value="Rural-Taluka">Rural-Taluka</option>
 </select>
 </div>

 <div className="space-y-2 p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
 <div className="flex items-center justify-between">
 <label className={`text-[8px] font-black uppercase tracking-widest text-red-500`}>Red Channel Bypass</label>
 <button 
 type="button"
 onClick={() => setFormData({ ...formData, isRedChannelBypass: !formData.isRedChannelBypass})}
 className={`w-10 h-6 rounded-full transition-all relative ${formData.isRedChannelBypass ? 'bg-red-500' : 'bg-slate-300'}`}
 >
 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isRedChannelBypass ? 'left-5' : 'left-1'}`}></div>
 </button>
 </div>
{formData.isRedChannelBypass && (
 <input 
 type="text" 
 required 
 placeholder="Justification (e.g. Trauma, AMI)..."
 value={formData.bypassJustification} 
 onChange={(e) => setFormData({ ...formData, bypassJustification: e.target.value})} 
 className={`w-full rounded-xl px-4 py-2 mt-2 font-black outline-none border-2 text-[10px] ${s.input}`} 
 />
 )}
 </div>
 
{isVisitorOrAttendant && (
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Relationship</label>
 <select 
 required
 value={formData.relationship}
 onChange={(e) => setFormData({...formData, relationship: e.target.value})}
 className={`w-full rounded-xl px-4 py-3 font-black outline-none border-2 text-xs sm:text-sm ${s.input}`}
 >
 <option value="">Select...</option>
 <option>Spouse</option>
 <option>Parent</option>
 <option>Sibling</option>
 <option>Child</option>
 <option>Relative</option>
 <option>Friend</option>
 </select>
 </div>
 )}
 </div>
 </section>
{/* Section: Clinical Vitals */}
 <section>
 <h4 className={`text-[8px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-3 ${s.accent}`}>
 <span className={`w-1 h-6 rounded-full ${theme === 'light' ? 'bg-[#0071e3]' : 'bg-[#0A84FF]'}`}></span> 
 CLINICAL VITALS
 </h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Temperature (°F)</label>
 <input type="text" placeholder="98.6" value={formData.temperature} onChange={(e) => setFormData({...formData, temperature: e.target.value})} className={`w-full rounded-xl px-4 py-3 font-black outline-none border-2 text-xs sm:text-sm ${s.input}`} />
 </div>
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Blood Pressure</label>
 <input type="text" placeholder="120/80" value={formData.bloodPressure} onChange={(e) => setFormData({...formData, bloodPressure: e.target.value})} className={`w-full rounded-xl px-4 py-3 font-black outline-none border-2 text-xs sm:text-sm ${s.input}`} />
 </div>
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Pulse (bpm)</label>
 <input type="text" placeholder="72" value={formData.pulse} onChange={(e) => setFormData({...formData, pulse: e.target.value})} className={`w-full rounded-xl px-4 py-3 font-black outline-none border-2 text-xs sm:text-sm ${s.input}`} />
 </div>
 <div className="space-y-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Weight (kg)</label>
 <input type="text" placeholder="65" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} className={`w-full rounded-xl px-4 py-3 font-black outline-none border-2 text-xs sm:text-sm ${s.input}`} />
 </div>
 <div className="space-y-2 col-span-2">
 <label className={`block text-[8px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>SpO2 (%)</label>
 <input type="text" placeholder="98" value={formData.spo2} onChange={(e) => setFormData({...formData, spo2: e.target.value})} className={`w-full rounded-xl px-4 py-3 font-black outline-none border-2 text-xs sm:text-sm ${s.input}`} />
 </div>
 </div>
 </section>
 </div>

{/* Right Column: Photo & Notes */}
 <div className="space-y-8">
 <section className="flex flex-col items-center">
 <label className={`block text-[8px] font-black uppercase mb-4 tracking-widest opacity-60 ${s.sub}`}>Biometric Photo</label>
 <div className={`w-full max-w-[240px] aspect-square rounded-[2rem] border-2 border-dashed flex items-center justify-center overflow-hidden relative group transition-all shadow-inner ${theme === 'light' ? 'border-[#D2D2D7] bg-[#F5F5F7]' : 'border-[#444] bg-[#2D2D2D]'}`}>
{cameraError ? (
 <div className="flex flex-col items-center justify-center p-4 text-center">
 <span className="text-2xl mb-2">⚠️</span>
 <p className="text-[8px] font-black uppercase text-red-500 mb-4">{cameraError}</p>
 <button 
 type="button"
 onClick={startCamera}
 className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-black text-[9px] uppercase tracking-widest rounded-full shadow-lg active:scale-95"
 >
 Try Again
 </button>
 </div>
 ) : isCameraActive ? (
 <div className="relative w-full h-full">
 <video 
 ref={videoRef} 
 autoPlay 
 playsInline 
 muted
 className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
 />
 <div className="absolute inset-0 border-[3px] border-emerald-500/30 rounded-[2rem] pointer-events-none">
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-white/20 rounded-full border-dashed"></div>
 </div>
 <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
{hasMultipleCameras && (
 <button 
 type="button"
 onClick={toggleCamera}
 className="w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full active:scale-95 backdrop-blur-md"
 title="Switch Camera"
 >
 <span className="text-sm">🔄</span>
 </button>
 )}
 <button 
 type="button"
 onClick={capturePhoto}
 className="px-6 py-2 bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest rounded-full shadow-lg active:scale-95"
 >
 Snap Biometric
 </button>
 <button 
 type="button"
 onClick={stopCamera}
 className="w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full active:scale-95 backdrop-blur-md"
 >
 ✕
 </button>
 </div>
 </div>
 ) : formData.photo ? (
 <div className="relative w-full h-full group">
 <img src={formData.photo} className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
 <button 
 type="button"
 onClick={startCamera}
 className="px-4 py-2 bg-white text-black font-black text-[8px] uppercase tracking-widest rounded-full shadow-lg active:scale-95"
 >
 Retake
 </button>
 <button 
 type="button"
 onClick={() => setFormData({ ...formData, photo: ''})}
 className="px-4 py-2 bg-red-500 text-white font-black text-[8px] uppercase tracking-widest rounded-full shadow-lg active:scale-95"
 >
 Clear
 </button>
 </div>
 </div>
 ) : (
 <button 
 type="button"
 onClick={startCamera}
 className="w-full h-full flex flex-col items-center justify-center text-center group"
 >
 <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
 <span className="text-3xl">📸</span>
 </div>
 <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Activate Biometric</p>
 <p className="text-[6px] font-bold uppercase tracking-[0.2em] mt-2 opacity-30">Camera Only On Click</p>
 </button>
 )}
 </div>
 </section>

 <section>
 <label className={`block text-[8px] font-black uppercase mb-2 tracking-widest opacity-60 ${s.sub}`}>Admin Notes</label>
 <textarea 
 placeholder="Reason for entry..."
 value={formData.medicalHistory} 
 onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value})} 
 rows={3}
 className={`w-full rounded-xl px-4 py-3 font-bold outline-none border-2 text-xs resize-none ${s.input}`} 
 />
 </section>
 </div>
 </div>

 <div className="pt-4">
 <button 
 type="submit" 
 disabled={isSubmitting} 
 className={`w-full py-4 sm:py-6 rounded-2xl sm:rounded-3xl font-black transition-all uppercase tracking-[0.3em] disabled:opacity-50 text-[10px] sm:text-xs shadow-xl active:scale-95 ${theme === 'light' ? 'bg-[#0071e3] text-white' : 'bg-[#0A84FF] text-white'}`}
 >
{isSubmitting ? 'SYNCING...' : 'FINALIZE REGISTRATION'}
 </button>
 </div>
 
{/* Patient Photo Section */}
 <div className={`p-4 rounded-[1rem] border-2 ${s.card} space-y-4 mb-4`}>
 <h3 className={`text-xs font-black uppercase tracking-widest opacity-60 ${s.sub}`}>Public Display Preferences</h3>
 
 <label className="flex items-center gap-3 cursor-pointer group">
 <input 
 type="checkbox" 
 checked={formData.publicDisplayConsent}
 onChange={(e) => setFormData({ ...formData, publicDisplayConsent: e.target.checked})}
 className="w-5 h-5 rounded-md border-2 accent-[#007AFF] bg-transparent" 
 />
 <span className={`text-sm font-bold ${s.text} group-hover:opacity-80 transition-opacity`}>
 Allow Photo on Public Display (helps patients recognize their turn)
 </span>
 </label>

 
 </div>
 
 </form>
 </div>

{/* Processed Registry (Form View) */}
 <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mx-auto mt-12 pb-10 border-t border-white/5 pt-8">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
 <h3 className={`text-sm font-black uppercase tracking-widest ${s.sub}`}>Processed Registry (Gate Entry)</h3>
 
 <div className="flex flex-wrap gap-2">
{['All', ...Object.values(PatientCategory)].map(cat => (
 <button
 key={cat}
 onClick={() => setRegistryFilter(cat)}
 className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
 registryFilter === cat 
 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
 :`opacity-50 hover:opacity-100 border ${s.card}`
}`}
 >
{cat}
 </button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 opacity-70 hover:opacity-100 transition-opacity">
{patients.filter(p => p.status === PatientStatus.GATE_REGISTERED || p.status === PatientStatus.RECEPTION_WAITING)
 .filter(p => registryFilter === 'All' || p.category === registryFilter)
 .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
 .slice(0, 16)
 .map((p) => (
 <div key={p.id} className={`p-3 rounded-xl border flex items-center gap-3 ${s.card} border-emerald-500/20 bg-emerald-500/5`}>
 <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-500">✓</div>
 <div className="min-w-0">
 <div className={`text-[10px] font-black uppercase truncate ${s.header}`}>{p.name}</div>
 <div className={`text-[7px] font-bold uppercase tracking-tighter opacity-50 ${s.sub}`}>{p.category} •{new Date(p.timestamp).toLocaleTimeString([],{ hour: '2-digit', minute: '2-digit'})}</div>
 <div className={`text-[7px] font-bold uppercase tracking-tighter opacity-80 ${s.accent} mt-0.5`}>Staff:{p.authorName || 'Unknown'}</div>
 </div>
 </div>
 ))
}
 </div>
 </div>
 </div>
 );
};

export default StaffGate;

