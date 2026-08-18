import React,{ useState, useEffect} from 'react';
import{ 
 Users, 
 UserPlus, 
 Calendar, 
 ShieldCheck, 
 Stethoscope, 
 DoorOpen, 
 Plus, 
 Trash2, 
 Search,
 Filter,
 Save,
 Clock,
 LayoutGrid,
 List,
 ChevronRight,
 ClipboardList,
 UserCog,
 ShieldAlert
} from 'lucide-react';
import{ 
 Patient, 
 PatientStatus, 
 Doctor, 
 StaffMember, 
 ShiftRotation, 
 Shift, 
 Theme,
 UserRole,
 Section,
 ROLE_CATEGORIES,
 CustomRole
} from '../types';
import{ db} from '../src/lib/firebase';
import{ mockFirestore} from '../services/mockFirestore';
import{ 
 collection, 
 onSnapshot, 
 addDoc, 
 deleteDoc, 
 doc, 
 updateDoc,
 query,
 orderBy,
 limit,
 where
} from 'firebase/firestore';
import DutyRoster from '../components/admin/DutyRoster';
import RosterManager from './RosterManager';
import{ SupervisorRoster} from '../components/admin/SupervisorRoster';
import PatientTable from '../components/admin/PatientTable';
import PatientFormModal from '../components/admin/PatientFormModal';
import PatientTimelineModal from '../components/admin/PatientTimelineModal';
import DeletePatientModal from '../components/admin/DeletePatientModal';
import{ getPremiumStyles} from '../theme/premiumDesign';

interface AdminConsoleProps{
 theme: Theme;
 doctors: Doctor[];
 staff: StaffMember[];
 rotations: ShiftRotation[];
 isAdmin: boolean;
}

type StaffSubTab = 'doctors' | 'staff_list' | 'duty_list' | 'patients' | 'deletion_requests';

const AdminConsole: React.FC<AdminConsoleProps> = ({ 
 theme, 
 doctors: initialDoctors, 
 staff: initialStaff, 
 rotations: initialRotations,
 isAdmin,
 customRoles = [],
 setCustomRoles,
 customShifts = [],
 setCustomShifts
}) =>{
 const [activeTab, setActiveTab] = useState<'staff' | 'roster' | 'auto-roster' | 'system'>('staff');
 const [staffSubTab, setStaffSubTab] = useState<StaffSubTab>('doctors');
 
 const [patients, setPatients] = useState<Patient[]>([]);
 const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors || []);
 const [staff, setStaff] = useState<StaffMember[]>(initialStaff || []);
 const [rotations, setRotations] = useState<ShiftRotation[]>(initialRotations || []);
 const [loading, setLoading] = useState(true);

 // Modal States
 const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
 const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
 
 const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
 const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
 const [timelinePatient, setTimelinePatient] = useState<Patient | null>(null);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

 // Form States
 const [staffForm, setStaffForm] = useState<Partial<StaffMember>>({ name: '', employeeId: '', role: UserRole.RECEPTION});
 const [rosterForm, setRosterForm] = useState<Partial<ShiftRotation>>({ staffId: '', dayOfWeek: 1, shift: 'MORNING', roomNumber: ''});
 const [patientSearchQuery, setPatientSearchQuery] = useState('');
 
 // Custom Role State
 const [isAddingCustomRole, setIsAddingCustomRole] = useState(false);
 const [newCustomRoleName, setNewCustomRoleName] = useState('');

 // Fetch Patients (Dynamic based on search)
 useEffect(() =>{
 let qPatients;
 if (patientSearchQuery.trim().length > 0){
 qPatients = query(
 collection(db, 'patients'), 
 where('name', '>=', patientSearchQuery),
 where('name', '<=', patientSearchQuery + '\uf8ff'),
 limit(100)
 );
} else{
 qPatients = query(collection(db, 'patients'), orderBy('timestamp', 'desc'), limit(500));
}
 
 const unsubPatients = onSnapshot(qPatients, (snap) =>{
 setPatients(snap.docs.map(d => ({ id: d.id, ...d.data()} as Patient)).filter(p => !p.isDeleted));
});

 return () => unsubPatients();
}, [patientSearchQuery]);

 // Fetch Static Data (Doctors, Staff, Roster)
 useEffect(() =>{
 const qDoctors = query(collection(db, 'doctors'), orderBy('name'));
 const qStaff = query(collection(db, 'staff'), orderBy('name'));
 const qRoster = query(collection(db, 'roster'));

 const unsubDoctors = onSnapshot(qDoctors, (snap) =>{
 setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data()} as Doctor)));
});

 const unsubStaff = onSnapshot(qStaff, (snap) =>{
 setStaff(snap.docs.map(d => ({ id: d.id, ...d.data()} as StaffMember)));
});

 const unsubRoster = onSnapshot(qRoster, (snap) =>{
 setRotations(snap.docs.map(d => ({ id: d.id, ...d.data()} as ShiftRotation)));
});

 setLoading(false);
 return () =>{
 unsubDoctors();
 unsubStaff();
 unsubRoster();
};
}, []);

 const handleSaveDoctor = async (doctorData: Partial<Doctor>) =>{
 try{
 if (editingDoctor){
 await updateDoc(doc(db, 'doctors', editingDoctor.id), doctorData);
} else{
 await addDoc(collection(db, 'doctors'),{
 ...doctorData,
 maxCapacity: doctorData.maxCapacity || 50,
 estWaitPerPatient: doctorData.estWaitPerPatient || 15
});
}
 setIsDoctorModalOpen(false);
 setEditingDoctor(null);
} catch (err){
 console.error('Error saving doctor:', err);
 alert('Failed to save doctor data.');
}
};

 const handleSavePatient = async (patientData: Partial<Patient>) =>{
 try{
 if (editingPatient){
 await mockFirestore.updatePatient(editingPatient.id,{
 ...patientData,
 lastModifiedAt: Date.now(),
 lastModifiedBy: 'Admin'
});
} else{
 await mockFirestore.addPatient({
 ...patientData,
 isDeleted: false,
 lastModifiedBy: 'Admin'
} as any);
}
 setIsPatientModalOpen(false);
 setEditingPatient(null);
} catch (err: any){
 console.error('Error saving patient:', err);
 if (err.code === 'not-found' || err.message?.includes('No document to update')){
 alert('Patient record not found. It might have been deleted already.');
} else{
 alert('Failed to save patient record.');
}
}
};

 const handleSoftDelete = async (reason: string) =>{
 if (!patientToDelete) return;
 try{
 await mockFirestore.updatePatient(patientToDelete.id,{
 isDeleted: true,
 deletedAt: Date.now(),
 deletedReason: reason,
 lastModifiedBy: 'Admin',
 deletionRequest: null // Clear any pending request
});
 setIsDeleteModalOpen(false);
 setPatientToDelete(null);
} catch (err: any){
 console.error('Error deleting patient:', err);
 if (err.code === 'not-found' || err.message?.includes('No document to update')){
 alert('This patient record no longer exists.');
 setIsDeleteModalOpen(false);
 setPatientToDelete(null);
} else{
 alert('Failed to archive patient record.');
}
}
};

 const handleApproveDeletion = async (p: Patient, adminReason: string) =>{
 try{
 await mockFirestore.updatePatient(p.id,{
 isDeleted: true,
 deletedAt: Date.now(),
 deletedReason:`[Staff: ${p.deletionRequest?.reason}] Admin Note: ${adminReason}`,
 lastModifiedBy: 'Admin',
 deletionRequest: null
});
} catch (err){
 console.error('Error approving deletion:', err);
 alert('Failed to approve deletion.');
}
};

 const handleRejectDeletion = async (p: Patient) =>{
 try{
 await mockFirestore.updatePatient(p.id,{
 deletionRequest: null,
 lastModifiedBy: 'Admin'
});
} catch (err){
 console.error('Error rejecting deletion:', err);
 alert('Failed to reject deletion request.');
}
};

 const handleEditDoctor = (doctor: Doctor) =>{
 setEditingDoctor(doctor);
 setIsDoctorModalOpen(true);
};

 const handlePatientClick = (patient: Patient) =>{
 setTimelinePatient(patient);
};

 const handleEditPatient = (patient: Patient) =>{
 setEditingPatient(patient);
 setIsPatientModalOpen(true);
};

 const handleAddStaff = async (e: React.FormEvent) =>{
 e.preventDefault();
 if (!staffForm.name || !staffForm.employeeId) return;
 try{
 await addDoc(collection(db, 'staff'),{
 ...staffForm,
 active: true,
 createdAt: Date.now()
});
 setStaffForm({ name: '', employeeId: '', role: UserRole.RECEPTION});
 alert('Staff member registered successfully.');
} catch (err){
 console.error('Error adding staff:', err);
 alert('Failed to register staff.');
}
};

 const handleAddRoster = async (e: React.FormEvent) =>{
 e.preventDefault();
 if (!rosterForm.staffId) return;
 try{
 await addDoc(collection(db, 'roster'),{
 ...rosterForm,
 updatedAt: Date.now()
});
 setRosterForm({ staffId: '', dayOfWeek: 1, shift: 'MORNING', roomNumber: ''});
 alert('Roster updated successfully.');
} catch (err){
 console.error('Error adding roster:', err);
 alert('Failed to update roster.');
}
};

 const handleDelete = async (coll: string, id: string) =>{
 if (window.confirm('Are you sure you want to delete this record?')){
 await deleteDoc(doc(db, coll, id));
}
};

 const handleAddCustomRole = () =>{
 if (newCustomRoleName.trim() && setCustomRoles){
 const newRole: CustomRole ={
 id:`custom_${Date.now()}`,
 name: newCustomRoleName.trim(),
 permissions: []
};
 setCustomRoles([...customRoles, newRole]);
 setStaffForm({...staffForm, role: newRole.id});
 setNewCustomRoleName('');
 setIsAddingCustomRole(false);
}
};

 const handleRemoveCustomRole = (roleId: string) =>{
 if (setCustomRoles){
 setCustomRoles(customRoles.filter(r => r.id !== roleId));
 if (staffForm.role === roleId){
 setStaffForm({...staffForm, role: UserRole.UNASSIGNED});
}
}
};

 const s = themeStyles[theme === 'titanium' ? 'dark' : theme];

 const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
 const SHIFTS: Shift[] = ['MORNING', 'EVENING', 'NIGHT'];
 

 const getStaffByRole = (role: UserRole) =>{
 const list = staff.filter(st => st.role === role);
 if (role === UserRole.DOCTOR){
 return [...list.map(s => s.name), ...doctors.map(d => d.name)];
}
 return list.map(st => st.name);
};

 return (
 <div className={`flex-1 overflow-y-auto \${s.bg} w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-10 font-sans`}>
{/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
 <div>
 <div className="flex items-center gap-3 mb-1">
 <ShieldCheck className={`w-8 h-8 ${s.accent}`} />
 <h1 className={`text-4xl font-black uppercase tracking-tighter ${s.text}`}>Admin Console</h1>
 </div>
 <p className={`text-sm font-medium ${s.sub}`}>Master configuration for healthcare compliance and operations.</p>
 </div>

{/* Tab Switcher */}
 <div className={`flex p-1 rounded-2xl ${s.card} border`}>
{[
{ id: 'staff', label: 'Operations & Staff', icon: Users},
{ id: 'roster', label: 'Global Roster', icon: Calendar},
{ id: 'auto-roster', label: 'Auto Scheduler', icon: Clock},
{ id: 'system', label: 'System Access', icon: UserCog}
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
 activeTab === tab.id 
 ? 'bg-blue-600 text-white shadow-lg' 
 :`opacity-50 hover:opacity-100 ${s.text}`
}`}
 >
 <tab.icon className="w-3 h-3" />
{tab.label}
 </button>
 ))}
 </div>
 </div>

{!isAdmin && (
 <div className={`p-10 rounded-[2.5rem] border ${s.card} text-center mb-10`}>
 <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-50" />
 <h2 className={`text-2xl font-black uppercase tracking-tighter ${s.text}`}>Restricted Access</h2>
 <p className={`text-sm font-bold uppercase tracking-widest mt-2 ${s.sub}`}>Admin mode must be unlocked via PIN to access controls.</p>
 </div>
 )}

 <div className={`space-y-12 w-full px-4 sm:px-6 lg:px-8 xl:px-12 ${!isAdmin ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
{/* Staff Management Main View */}
{activeTab === 'staff' && (
 <div className="space-y-8">
 <div className="flex flex-wrap items-center justify-between gap-4">
 <div className="flex p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/5">
{[
{ id: 'doctors', label: 'Doctors', icon: Stethoscope},
{ id: 'patients', label: 'Patient Registry', icon: List},
{ id: 'staff_list', label: 'Staff List', icon: List},
{ id: 'duty_list', label: 'Duty List', icon: ClipboardList},
{ id: 'deletion_requests', label: 'Deletion Requests', icon: ShieldAlert}
 ].map(sub => (
 <button
 key={sub.id}
 onClick={() => setStaffSubTab(sub.id as StaffSubTab)}
 className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
 staffSubTab === sub.id 
 ? 'bg-white dark:bg-[#1C1C1E] shadow-sm text-blue-600' 
 :`opacity-40 hover:opacity-100 ${s.text}`
}`}
 >
 <sub.icon className="w-3 h-3" />
{sub.label}
 </button>
 ))}
 </div>

 <div className="flex gap-3">
{staffSubTab === 'doctors' && (
 <button 
 onClick={() =>{ setEditingDoctor(null); setIsDoctorModalOpen(true);}}
 className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-xl shadow-blue-600/20 hover:scale-105 transition-transform"
 >
 <Plus className="w-4 h-4" />
 Add Doctor
 </button>
 )}
{staffSubTab === 'patients' && (
 <button 
 onClick={() =>{ setEditingPatient(null); setIsPatientModalOpen(true);}}
 className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-xl shadow-emerald-600/20 hover:scale-105 transition-transform"
 >
 <Plus className="w-4 h-4" />
 Register Patient
 </button>
 )}
 </div>
 </div>

{/* Sub Tab Content */}
 <div className="min-h-[500px]">
{staffSubTab === 'doctors' && (
 <DoctorTable 
 doctors={doctors} 
 onEdit={handleEditDoctor} 
 onDelete={(id) => handleDelete('doctors', id)} 
 theme={theme} 
 />
 )}

{staffSubTab === 'patients' && (
 <div className="space-y-4">
 <div className={`p-4 rounded-3xl border ${s.card} flex items-center gap-3`}>
 <Search className={`w-5 h-5 ${s.sub}`} />
 <input 
 type="text" 
 placeholder="Search million+ database by patient name..." 
 value={patientSearchQuery}
 onChange={e => setPatientSearchQuery(e.target.value)}
 className={`flex-1 bg-transparent border-none outline-none font-bold tracking-wide ${s.text}`}
 />
{patientSearchQuery && (
 <div className="text-[10px] font-black uppercase text-blue-500 animate-pulse">
 Searching Live Database...
 </div>
 )}
 </div>
 <PatientTable 
 patients={patients}
 onPatientClick={handlePatientClick}
 theme={theme}
 />
 </div>
 )}

{staffSubTab === 'staff_list' && (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 <div className="lg:col-span-4">
 <div className={`p-8 rounded-[2.5rem] border ${s.card} shadow-2xl`}>
 <form onSubmit={handleAddStaff} className="space-y-5">
 <h2 className={`text-xl font-black uppercase tracking-tight mb-4 ${s.text}`}>Register Staff</h2>
 <input
 type="text" required placeholder="Staff Full Name"
 value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})}
 className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
 />
 <div className="grid grid-cols-1 gap-4">
 <input
 type="text" required placeholder="Employee ID"
 value={staffForm.employeeId} onChange={e => setStaffForm({...staffForm, employeeId: e.target.value})}
 className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
 />
 <div className="flex flex-col gap-2">
 <div className="flex gap-2">
 <select
 value={staffForm.role || 'unassigned'}
 onChange={e =>{
 const val = e.target.value;
 if (val === 'add_new'){
 setIsAddingCustomRole(true);
} else{
 setStaffForm({...staffForm, role: val});
}
}}
 className={`flex-1 px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
 >
 <option value="unassigned" className="bg-[#1C1C1E] text-white">UNASSIGNED</option>
{ROLE_CATEGORIES.map(category => (
 <optgroup key={category.label} label={category.label} className="bg-[#2C2C2E] text-white/50 font-bold">
{category.roles.map(role => (
 <option key={role.id} value={role.id} className="bg-[#1C1C1E] text-white">{(role.name || '').toUpperCase()}</option>
 ))}
 </optgroup>
 ))}
{customRoles && customRoles.length > 0 && (
 <optgroup label="Custom Roles" className="bg-[#2C2C2E] text-white/50 font-bold">
{customRoles.map(role => (
 <option key={role.id} value={role.id} className="bg-[#1C1C1E] text-white">{(role.name || '').toUpperCase()}</option>
 ))}
 </optgroup>
 )}
 <option value="add_new" className="bg-[#3A3A3C] text-blue-400 font-bold">+ ADD NEW ROLE</option>
 </select>
{customRoles.find(r => r.id === staffForm.role) && (
 <button
 type="button"
 onClick={() => handleRemoveCustomRole(staffForm.role as string)}
 className="p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
 title="Remove Custom Role"
 >
 <Trash2 className="w-6 h-6" />
 </button>
 )}
 </div>
{isAddingCustomRole && (
 <div className="flex gap-2">
 <input
 type="text"
 placeholder="Enter Custom Role Name"
 value={newCustomRoleName}
 onChange={e => setNewCustomRoleName(e.target.value)}
 className={`flex-1 px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
 autoFocus
 />
 <button
 type="button"
 onClick={handleAddCustomRole}
 className="px-6 py-4 rounded-2xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors"
 >
 Add
 </button>
 <button
 type="button"
 onClick={() =>{ setIsAddingCustomRole(false); setNewCustomRoleName('');}}
 className="px-6 py-4 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
 >
 Cancel
 </button>
 </div>
 )}
 </div>
 </div>
 <button type="submit" className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl bg-indigo-600 text-white`}>
 Add Staff Member
 </button>
 </form>
 </div>
 </div>
 <div className="lg:col-span-8">
 <div className={`rounded-[2.5rem] border ${s.card} overflow-hidden shadow-xl`}>
 <table className="w-full text-left">
 <thead className={s.tableHeader}>
 <tr>
 <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Staff Name</th>
 <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Role</th>
 <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Emp ID</th>
 <th className="px-6 py-5"></th>
 </tr>
 </thead>
 <tbody className={`divide-y divide-white/5 ${s.text}`}>
{staff.map(st => (
 <tr key={st.id} className="hover:bg-white/5 transition-colors">
 <td className="px-6 py-5 font-bold">{st.name}</td>
 <td className="px-6 py-5">
 <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
{st.role}
 </span>
 </td>
 <td className="px-6 py-5 font-mono text-xs opacity-50">{st.employeeId}</td>
 <td className="px-6 py-5 text-right">
 <button onClick={() => handleDelete('staff', st.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500/50 hover:text-red-500 transition-colors">
 <Trash2 className="w-4 h-4" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

{staffSubTab === 'duty_list' && (
 <div className={`rounded-[2.5rem] border ${s.card} overflow-hidden shadow-xl`}>
 <table className="w-full text-left">
 <thead className={s.tableHeader}>
 <tr>
 <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Personnel</th>
 <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Shift Timing</th>
 <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Location</th>
 <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Assignment</th>
 </tr>
 </thead>
 <tbody className={`divide-y divide-white/5 ${s.text}`}>
{[...rotations].sort((a, b) => a.dayOfWeek - b.dayOfWeek).map(rot =>{
 const p = doctors.find(d => d.id === rot.staffId) || staff.find(st => st.id === rot.staffId);
 return (
 <tr key={rot.id} className="hover:bg-white/5 transition-colors">
 <td className="px-6 py-5">
 <div className="font-bold">{p?.name || 'Unknown'}</div>
 <div className="text-[10px] font-medium opacity-50 uppercase tracking-widest">
{doctors.find(d => d.id === rot.staffId) ? 'Clinical' : 'Operations'}
 </div>
 </td>
 <td className="px-6 py-5">
 <div className="flex items-center gap-2">
 <Clock className="w-3 h-3 text-blue-500" />
 <span className="text-[10px] font-black uppercase tracking-widest">
{DAYS[rot.dayOfWeek]} •{rot.shift}
 </span>
 </div>
 </td>
 <td className="px-6 py-5 font-mono text-xs opacity-70">{rot.roomNumber || 'Main Facility'}</td>
 <td className="px-6 py-5">
 <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold">
 Assigned
 </span>
 </td>
 </tr>
 );
})}
 </tbody>
 </table>
 </div>
 )}

{staffSubTab === 'deletion_requests' && (
 <div className={`rounded-[2.5rem] border ${s.card} overflow-hidden shadow-xl p-8`}>
 <h2 className={`text-xl font-black uppercase tracking-tight mb-6 ${s.text}`}>Pending Deletion Requests</h2>
{patients.filter(p => p.deletionRequest).length === 0 ? (
 <p className={`text-sm ${s.sub} font-bold`}>No pending deletion requests.</p>
 ) : (
 <div className="space-y-4">
{patients.filter(p => p.deletionRequest).map(p => (
 <div key={p.id} className="p-6 border border-white/10 rounded-2xl bg-white/5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
 <div>
 <h3 className={`text-lg font-black ${s.text}`}>{p.name}</h3>
 <p className={`text-xs ${s.sub} font-bold mt-1`}>Requested By:{p.deletionRequest?.requestedBy}</p>
 <p className={`text-sm ${s.accent} mt-2`}>Reason: "{p.deletionRequest?.reason}"</p>
 <p className={`text-xs ${s.sub} mt-1`}>Requested At:{new Date(p.deletionRequest?.requestedAt || 0).toLocaleString()}</p>
 </div>
 <div className="flex gap-2">
 <button
 onClick={() =>{
 const note = prompt('Admin Note (optional):');
 if (note !== null) handleApproveDeletion(p, note);
}}
 className="px-4 py-2 bg-red-600 text-white text-xs font-black rounded-xl uppercase hover:bg-red-500"
 >
 Approve Delete
 </button>
 <button
 onClick={() => handleRejectDeletion(p)}
 className="px-4 py-2 bg-slate-600 text-white text-xs font-black rounded-xl uppercase hover:bg-slate-500"
 >
 Reject
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 )}
{/* Global Roster Main View */}
{activeTab === 'roster' && (
 <RosterManager 
 staffList={[...doctors, ...staff] as any[]} 
 rotations={rotations}
 onAssignShift={async (staffId, dayOfWeek, shift) =>{
 await addDoc(collection(db, 'roster'),{
 staffId,
 dayOfWeek,
 shift,
 updatedAt: Date.now()
});
}}
 onRemoveShift={async (rotationId) =>{
 await deleteDoc(doc(db, 'roster', rotationId));
}}
 theme={theme}
 isAdmin={isAdmin}
 />
 )}

{/* Auto Scheduler Main View */}
{activeTab === 'auto-roster' && (
 <SupervisorRoster
 staffList={[...doctors, ...staff] as any[]}
 shifts={customShifts}
 />
 )}

{/* System Access Main View */}
{activeTab === 'system' && (
 <section className="space-y-8">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
 <ShieldCheck className="w-5 h-5 text-purple-500" />
 </div>
 <h2 className={`text-2xl font-black uppercase tracking-tighter ${s.text}`}>Staff Access Matrix</h2>
 </div>

 <div className={`rounded-[2.5rem] border ${s.card} overflow-hidden shadow-xl`}>
 <table className="w-full text-left">
 <thead>
 <tr className={s.tableHeader}>
 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Department / Portal</th>
 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Authorized Personnel</th>
 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Control Count</th>
 </tr>
 </thead>
 <tbody className={`divide-y divide-white/5 ${s.text}`}>
{[
{ role: UserRole.GATE, label: 'Gate Security'},
{ role: UserRole.RECEPTION, label: 'Admission Desk'},
{ role: UserRole.CHECKIN, label: 'Check-In Counter'},
{ role: UserRole.DOCTOR, label: 'Clinical Review (Doctors)'},
{ role: UserRole.MEDICAL, label: 'Pharmacy / Medical Intake'},
{ role: UserRole.WARD_CARE, label: 'Ward Management'},
{ role: UserRole.BILLING, label: 'Discharge Desk'},
{ role: UserRole.VISITOR_MGMT, label: 'Visitor Control'},
{ role: UserRole.ADMIN, label: 'Admin Console'},
 ].map(item =>{
 const authorized = getStaffByRole(item.role);
 return (
 <tr key={item.role} className="hover:bg-white/5">
 <td className="px-8 py-5 font-bold">{item.label}</td>
 <td className="px-8 py-5">
 <div className="flex flex-wrap gap-2">
{authorized.map((name, i) => (
 <span key={i} className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 opacity-70">
{name}
 </span>
 ))}
{authorized.length === 0 && <span className="text-[10px] opacity-30 italic">No staff assigned</span>}
 </div>
 </td>
 <td className="px-8 py-5">
 <div className="flex items-center gap-2">
 <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">
{authorized.length}
 </span>
 </div>
 </td>
 </tr>
 );
})}
 </tbody>
 </table>
 </div>
 </section>
 )}

{/* Master Patient Registry (Downward List) */}
 <section className="space-y-8 pb-20">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
 <List className="w-5 h-5 text-emerald-500" />
 </div>
 <h2 className={`text-2xl font-black uppercase tracking-tighter ${s.text}`}>Master Registry Summary</h2>
 </div>

 <div className={`rounded-[2.5rem] border ${s.card} overflow-hidden shadow-2xl`}>
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className={s.tableHeader}>
 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Patient</th>
 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Latest Update</th>
 </tr>
 </thead>
 <tbody className={`divide-y divide-white/5 ${s.text}`}>
{patients.filter(p => !p.isDeleted).map(p => (
 <tr key={p.id} className="hover:bg-white/5">
 <td className="px-8 py-5 font-bold">{p.name}</td>
 <td className="px-8 py-5 uppercase text-[10px] font-black opacity-60 tracking-widest">{p.status.replace(/_/g, ' ')}</td>
 <td className="px-8 py-5 text-[10px] opacity-40">{new Date(p.timestamp).toLocaleString()}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </section>
 </div>

{/* Modals */}
{timelinePatient && (
 <PatientTimelineModal
 patient={timelinePatient}
 theme={theme}
 onClose={() => setTimelinePatient(null)}
 onEdit={(p) =>{
 setTimelinePatient(null);
 handleEditPatient(p);
}}
 onDelete={(p, reason) =>{
 setTimelinePatient(null);
 setPatientToDelete(p);
 handleSoftDelete(reason);
}}
 />
 )}

 <DoctorFormModal 
 isOpen={isDoctorModalOpen} 
 onClose={() =>{ setIsDoctorModalOpen(false); setEditingDoctor(null);}} 
 onSave={handleSaveDoctor} 
 initialData={editingDoctor} 
 theme={theme} 
 />

 <PatientFormModal
 isOpen={isPatientModalOpen}
 onClose={() =>{ setIsPatientModalOpen(false); setEditingPatient(null);}}
 onSave={handleSavePatient}
 initialData={editingPatient}
 theme={theme}
 doctors={doctors}
 />

 <DeletePatientModal
 isOpen={isDeleteModalOpen}
 onClose={() =>{ setIsDeleteModalOpen(false); setPatientToDelete(null);}}
 onConfirm={handleSoftDelete}
 patient={patientToDelete}
 theme={theme}
 />
 </div>
 );
};

// Sub-components for Doctor Management
const DoctorTable: React.FC<{
 doctors: Doctor[];
 onEdit: (d: Doctor) => void;
 onDelete: (id: string) => void;
 theme: Theme;
}> = ({ doctors, onEdit, onDelete, theme}) =>{
 const s = theme === 'light' ?{
 header: 'bg-gray-50 border-b border-gray-100 text-gray-400',
 row: 'border-b border-gray-50 hover:bg-gray-50/50',
 text: 'text-gray-900',
 sub: 'text-gray-500'
} :{
 header: 'bg-white/5 border-b border-white/5 text-white/40',
 row: 'border-b border-white/5 hover:bg-white/5',
 text: 'text-white',
 sub: 'text-white/40'
};

 return (
 <div className={`rounded-[2.5rem] border ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-white/5'} overflow-hidden shadow-xl`}>
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className={s.header}>
 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Doctor Details</th>
 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Specialty</th>
 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Experience</th>
 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
 </tr>
 </thead>
 <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-100' : 'divide-white/5'}`}>
{doctors.map((doc) => (
 <tr key={doc.id} className={s.row}>
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 font-black text-lg">
{doc.name.charAt(0)}
 </div>
 <div>
 <div className={`font-black tracking-tight ${s.text}`}>{doc.name}</div>
 <div className={`text-[10px] uppercase font-black tracking-widest opacity-40 ${s.sub}`}>{doc.id}</div>
 </div>
 </div>
 </td>
 <td className="px-8 py-6">
 <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>
{doc.specialty || 'General'}
 </span>
 </td>
 <td className="px-8 py-6">
 <div className={`text-sm font-bold ${s.text}`}>{doc.experience} Years</div>
 </td>
 <td className="px-8 py-6">
 <div className="flex items-center gap-2">
 <div className={`w-2 h-2 rounded-full ${doc.active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
 <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{doc.active ? 'Available' : 'Offline'}</span>
 </div>
 </td>
 <td className="px-8 py-6">
 <div className="flex justify-end gap-3">
 <button 
 onClick={() => onEdit(doc)}
 className={`p-2 rounded-xl transition-all ${theme === 'light' ? 'hover:bg-blue-50 text-blue-600' : 'hover:bg-blue-500/10 text-blue-400'}`}
 >
 <UserCog className="w-5 h-5" />
 </button>
 <button 
 onClick={() => onDelete(doc.id)}
 className={`p-2 rounded-xl transition-all ${theme === 'light' ? 'hover:bg-red-50 text-red-600' : 'hover:bg-red-500/10 text-red-400'}`}
 >
 <Trash2 className="w-5 h-5" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );
};

const DoctorFormModal: React.FC<{
 isOpen: boolean;
 onClose: () => void;
 onSave: (data: Partial<Doctor>) => void;
 initialData: Doctor | null;
 theme: Theme;
}> = ({ isOpen, onClose, onSave, initialData, theme}) =>{
 const [formData, setFormData] = useState<Partial<Doctor &{ experience?: number; active?: boolean}>>({
 name: '',
 specialty: '',
 experience: 0,
 active: true,
 photo: '',
 registrationNumber: '',
 qualification: ''
});

 useEffect(() =>{
 if (initialData){
 setFormData(initialData);
} else{
 setFormData({
 name: '',
 specialty: '',
 experience: 0,
 active: true,
 photo: '',
 registrationNumber: '',
 qualification: ''
});
}
}, [initialData, isOpen]);

 if (!isOpen) return null;

 const s = theme === 'light' ?{
 overlay: 'bg-black/20 backdrop-blur-sm',
 card: 'bg-white shadow-2xl',
 input: 'bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900',
 label: 'text-gray-400',
 title: 'text-gray-900'
} :{
 overlay: 'bg-black/60 backdrop-blur-md',
 card: 'bg-[#1D1D1F] border border-white/10 shadow-2xl',
 input: 'bg-white/5 border-white/10 focus:border-blue-500 text-white',
 label: 'text-white/40',
 title: 'text-white'
};

 const handleSubmit = (e: React.FormEvent) =>{
 e.preventDefault();
 onSave(formData);
 onClose();
};

 return (
 <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 ${s.overlay}`}>
 <div className={`w-full max-w-2xl rounded-[3rem] overflow-hidden ${s.card} animate-in fade-in zoom-in-95 duration-300`}>
 <div className="p-10 sm:p-12">
 <div className="flex justify-between items-center mb-10">
 <div>
 <h2 className={`text-3xl font-black uppercase tracking-tighter ${s.title}`}>
{initialData ? 'Edit Doctor' : 'Add New Doctor'}
 </h2>
 <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mt-1">Professional Registry Entry</p>
 </div>
 <button onClick={onClose} className="w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
 <Plus className="w-6 h-6 rotate-45" />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="space-y-8">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className={`text-[10px] font-black uppercase tracking-widest ${s.label}`}>Full Name (With MD/MS)</label>
 <input 
 type="text" required value={formData.name}
 onChange={e => setFormData({...formData, name: e.target.value})}
 className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold transition-all ${s.input}`}
 placeholder="e.g. Dr. John Doe, MD"
 />
 </div>
 <div className="space-y-2">
 <label className={`text-[10px] font-black uppercase tracking-widest ${s.label}`}>Specialty</label>
 <input 
 type="text" required value={formData.specialty}
 onChange={e => setFormData({...formData, specialty: e.target.value})}
 className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold transition-all ${s.input}`}
 placeholder="e.g. Cardiology"
 />
 </div>
 <div className="space-y-2">
 <label className={`text-[10px] font-black uppercase tracking-widest ${s.label}`}>Experience (Years)</label>
 <input 
 type="number" required value={formData.experience}
 onChange={e => setFormData({...formData, experience: +e.target.value})}
 className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold transition-all ${s.input}`}
 />
 </div>
 <div className="space-y-2">
 <label className={`text-[10px] font-black uppercase tracking-widest ${s.label}`}>Registration Number</label>
 <input 
 type="text" required value={formData.licenseNumber}
 onChange={e => setFormData({...formData, licenseNumber: e.target.value})}
 className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold transition-all ${s.input}`}
 placeholder="e.g. MC-12345"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className={`text-[10px] font-black uppercase tracking-widest ${s.label}`}>Qualification</label>
 <input 
 type="text" required value={formData.qualification}
 onChange={e => setFormData({...formData, qualification: e.target.value})}
 className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold transition-all ${s.input}`}
 placeholder="e.g. MBBS, MD (Cardiology)"
 />
 </div>

 <div className="flex gap-4 pt-6">
 <button 
 type="button" onClick={onClose}
 className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border ${theme === 'light' ? 'border-gray-200 hover:bg-gray-50' : 'border-white/10 hover:bg-white/5'}`}
 >
 Cancel
 </button>
 <button 
 type="submit"
 className="flex-[2] py-5 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all"
 >
 <div className="flex items-center justify-center gap-2">
 <Save className="w-4 h-4" />
 Save Doctor Profile
 </div>
 </button>
 </div>
 </form>
 </div>
 </div>
 </div>
 );
};

export default AdminConsole;

