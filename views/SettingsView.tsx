import React, { useState } from 'react';
import { Theme, Doctor, Ward, Section, DoctorRoster, Shift, SystemThresholds, AuditLog, Patient, BillingScheme, NABHKPI, UserRole, StaffMember, Workstation, CustomRole, ShiftConfig, ROLE_CATEGORIES } from '../types';


import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  query,
  limit,
  where,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { mockFirestore } from '../services/mockFirestore';
import DoctorTable from '../components/admin/DoctorTable';
import DoctorFormModal from '../components/admin/DoctorFormModal';
import PatientTable from '../components/admin/PatientTable';
import HistoryLogTable from '../components/admin/HistoryLogTable';
import DutyRoster from '../components/admin/DutyRoster';
import GlobalTATMetrics from '../components/admin/GlobalTATMetrics';
import PatientTimelineModal from '../components/admin/PatientTimelineModal';
import PatientFormModal from '../components/admin/PatientFormModal';
import DeletePatientModal from '../components/admin/DeletePatientModal';
import { RoleManagementBoard } from '../components/admin/RoleManagementBoard';
import { 
  Users, Building2, Zap, Settings as SettingsIcon, Database, HardDrive, ShieldCheck, 
  UserPlus, Upload, FileJson, Stethoscope, BriefcaseMedical, LayoutDashboard, History, List, ClipboardList, MessageSquare, Plus, Search, Trash2
} from 'lucide-react';
import { useIntercom } from '../src/contexts/IntercomContext';

interface SettingsViewProps {
  theme: Theme;
  doctors: Doctor[];
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  wards: Ward[];
  setWards: React.Dispatch<React.SetStateAction<Ward[]>>;
  roster: DoctorRoster[];
  setRoster: React.Dispatch<React.SetStateAction<DoctorRoster[]>>;
  thresholds: SystemThresholds;
  setThresholds: React.Dispatch<React.SetStateAction<SystemThresholds>>;
  schemes: BillingScheme[];
  setSchemes: React.Dispatch<React.SetStateAction<BillingScheme[]>>;
  kpis: NABHKPI[];
  setKpis: React.Dispatch<React.SetStateAction<NABHKPI[]>>;
  auditLogs: AuditLog[];
  onAddAuditLog: (action: string, details: string) => void;
  patients: Patient[];
  staff: StaffMember[];
  workstations: Workstation[];
  customRoles?: CustomRole[];
  setCustomRoles?: (roles: CustomRole[]) => void;
  customShifts?: ShiftConfig[];
  setCustomShifts?: (shifts: ShiftConfig[]) => void;
}

type Tab = 'STAFF' | 'FACILITY' | 'OPERATIONS' | 'COMPLIANCE' | 'SYSTEM' | 'HISTORY' | 'PATIENTS' | 'INTERCOM';
type StaffSubTab = 'doctors' | 'staff_list' | 'roles' | 'duty_list';

const SettingsView: React.FC<SettingsViewProps> = ({ 
  theme, doctors, setDoctors, wards, setWards, roster, setRoster, thresholds, setThresholds, 
  schemes, setSchemes, kpis, setKpis, auditLogs, onAddAuditLog, patients, staff, workstations,
  customRoles = [], setCustomRoles, customShifts = [], setCustomShifts
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('STAFF');
  const { alerts } = useIntercom();
  const [staffSubTab, setStaffSubTab] = useState<StaffSubTab>('doctors');
  
  // Modal States
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  const [timelinePatient, setTimelinePatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Form states
  const [newStaff, setNewStaff] = useState({ name: '', employeeId: '', role: UserRole.UNASSIGNED, workstationId: 'unassigned' });
  const [newWard, setNewWard] = useState({ name: '', type: 'GENERAL' as any, capacity: 20 });
  const [newWorkstation, setNewWorkstation] = useState({ name: '', role: UserRole.RECEPTION, domain: 'Medical Staff (Doctors)' });
  const [newRoster, setNewRoster] = useState({ doctorId: '', shift: 'MORNING' as Shift, room: '' });
  const [newScheme, setNewScheme] = useState({ name: '', discount: 0, tax: 0, limit: 100000 });
  const [newKPI, setNewKPI] = useState({ name: '', target: 0, unit: 'percentage', currentValue: 0 });
  
  // Custom Role State
  const [isAddingCustomRole, setIsAddingCustomRole] = useState(false);
  const [newCustomRoleName, setNewCustomRoleName] = useState('');

  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [localPatients, setLocalPatients] = useState<Patient[]>(patients);

  React.useEffect(() => {
    if (patientSearchQuery.trim().length > 0) {
      const qPatients = query(
        collection(db, 'patients'), 
        where('name', '>=', patientSearchQuery),
        where('name', '<=', patientSearchQuery + '\uf8ff'),
        limit(100)
      );
      const unsubPatients = onSnapshot(qPatients, (snap) => {
        setLocalPatients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient)).filter(p => !p.isDeleted));
      });
      return () => unsubPatients();
    } else {
      setLocalPatients(patients);
    }
  }, [patientSearchQuery, patients]);

  const themeStyles = {
    light: {
      card: 'bg-white border-[#D2D2D7]',
      text: 'text-[#1D1D1F]',
      sub: 'text-[#86868b]',
      input: 'bg-[#F5F5F7] border-[#D2D2D7] focus:border-[#0071e3]',
      btn: 'bg-[#0071e3] text-white hover:bg-[#0077ED]',
      tabActive: 'bg-white text-[#0071e3] shadow-md',
      tabInactive: 'text-[#86868b] hover:bg-black/5'
    },
    dark: {
      card: 'bg-[#1D1D1F] border-[#2D2D2D]',
      text: 'text-white',
      sub: 'text-[#86868b]',
      input: 'bg-[#1C1C1E] border-[#2D2D2D] focus:border-[#0A84FF]',
      btn: 'bg-[#0A84FF] text-white hover:bg-[#409CFF]',
      tabActive: 'bg-[#2D2D2D] text-white shadow-lg',
      tabInactive: 'text-[#86868b] hover:bg-white/5'
    },
    titanium: {
      card: 'bg-[#4D4D4D] border-[#5D5D5D]',
      text: 'text-[#E8E8ED]',
      sub: 'text-[#A1A1A6]',
      input: 'bg-[#3D3D3D] border-[#5D5D5D] focus:border-[#0A84FF]',
      btn: 'bg-[#0A84FF] text-white hover:bg-[#409CFF]',
      tabActive: 'bg-[#5D5D5D] text-white shadow-lg',
      tabInactive: 'text-[#A1A1A6] hover:bg-white/5'
    }
  };

  const s = themeStyles[theme];
  const isDark = theme !== 'light';

  const handleAddCustomRole = () => {
    if (newCustomRoleName.trim() && setCustomRoles) {
      const newRole: CustomRole = {
        id: `custom_${Date.now()}`,
        name: newCustomRoleName.trim(),
        createdAt: Date.now()
      };
      setCustomRoles([...(customRoles || []), newRole]);
      setNewStaff({...newStaff, role: newRole.id});
      setNewCustomRoleName('');
      setIsAddingCustomRole(false);
    }
  };

  const handleRemoveCustomRole = (roleId: string) => {
    if (setCustomRoles) {
      setCustomRoles((customRoles || []).filter(r => r.id !== roleId));
      if (newStaff.role === roleId) {
        setNewStaff({...newStaff, role: UserRole.UNASSIGNED});
      }
    }
  };

  const handlePatientClick = (patient: Patient) => {
    setTimelinePatient(patient);
  };

  const handleSavePatient = async (patientData: Partial<Patient>) => {
    try {
      if (editingPatient) {
        await mockFirestore.updatePatient(editingPatient.id, {
          ...patientData,
          lastModifiedAt: Date.now(),
          lastModifiedBy: 'Admin'
        });
        onAddAuditLog('Update Patient', `Updated details for ${patientData.name}`);
      } else {
        await mockFirestore.addPatient({
          ...patientData,
          status: patientData.status || 'GATE_ENTRY',
          timestamp: Date.now(),
          isDeleted: false,
          trackingLog: [{
            stage: 'GATE_ENTRY',
            timestamp: Date.now(),
            staffName: 'Admin',
            notes: 'Added via Admin Console'
          }]
        } as Omit<Patient, 'id'>);
        onAddAuditLog('Add Patient', `Registered patient ${patientData.name}`);
      }
      setIsPatientModalOpen(false);
      setEditingPatient(null);
    } catch (err) {
      console.error('Error saving patient:', err);
      alert('Failed to save patient record.');
    }
  };

  const handleSoftDelete = async (reason: string) => {
    if (!patientToDelete) return;
    try {
      await mockFirestore.updatePatient(patientToDelete.id, {
        isDeleted: true,
        deletedAt: Date.now(),
        deletedReason: reason,
        lastModifiedBy: 'Admin',
        deletionRequest: null
      });
      onAddAuditLog('Delete Patient', `Deleted patient ${patientToDelete.name} - Reason: ${reason}`);
      setIsDeleteModalOpen(false);
      setPatientToDelete(null);
    } catch (err) {
      console.error('Error deleting patient:', err);
      alert('Failed to delete patient record.');
    }
  };

  const handleSaveDoctor = async (doctorData: Partial<Doctor>) => {
    try {
      if (editingDoctor) {
        await updateDoc(doc(db, 'doctors', editingDoctor.id), doctorData);
        onAddAuditLog('Update Doctor', `Updated details for Dr. ${doctorData.name}`);
      } else {
        await addDoc(collection(db, 'doctors'), {
          ...doctorData,
          maxCapacity: doctorData.maxCapacity || 50,
          estWaitPerPatient: doctorData.estWaitPerPatient || 15
        });
        onAddAuditLog('Add Doctor', `Registered Dr. ${doctorData.name}`);
      }
      setIsDoctorModalOpen(false);
      setEditingDoctor(null);
    } catch (err) {
      console.error('Error saving doctor:', err);
      alert('Failed to save doctor data.');
    }
  };

  const handleDelete = async (coll: string, id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      await deleteDoc(doc(db, coll, id));
      onAddAuditLog('Delete Record', `Removed item from ${coll}`);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.employeeId) return;
    await addDoc(collection(db, 'staff'), newStaff);
    onAddAuditLog('Add Staff', `Registered ${newStaff.name} as ${newStaff.role}`);
    setNewStaff({ name: '', employeeId: '', role: UserRole.UNASSIGNED, workstationId: 'unassigned' });
  };

  const handleUpdateStaffRole = async (staffId: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'staff', staffId), {
        role: newRole,
        updatedAt: Date.now()
      });
      onAddAuditLog('Update Role', `Updated staff role to ${newRole}`);
    } catch (err) {
      console.error('Error updating staff role:', err);
    }
  };

  const handleAddWard = async () => {
    if (!newWard.name) return;
    const ward: Ward = {
      id: `WARD-${Date.now()}`,
      name: newWard.name,
      type: newWard.type,
      totalBeds: newWard.capacity,
      occupiedBeds: 0,
      maintenanceBeds: 0,
      reserveBeds: 0
    };
    await addDoc(collection(db, 'wards'), ward);
    onAddAuditLog('Add Ward', `Added new ward ${ward.name}`);
    setNewWard({ name: '', type: 'GENERAL', capacity: 20 });
  };

  const handleAddWorkstation = async () => {
    if (!newWorkstation.name) return;
    const ws: Workstation = {
      id: `WS-${Date.now()}`,
      name: newWorkstation.name,
      role: newWorkstation.role,
      domain: newWorkstation.domain,
      createdAt: Date.now()
    };
    await addDoc(collection(db, 'workstations'), ws);
    onAddAuditLog('Add Workstation', `Added new workstation ${ws.name}`);
    setNewWorkstation({ name: '', role: UserRole.RECEPTION, domain: 'Medical Staff (Doctors)' });
  };

  const handleSeedWorkstations = async () => {
    const seedData = [
      { domain: 'Medical Staff (Doctors)', name: 'Consultants & Specialists', role: UserRole.DOCTOR },
      { domain: 'Medical Staff (Doctors)', name: 'Resident Medical Officers (RMOs)', role: UserRole.WARD_CARE },
      { domain: 'Medical Staff (Doctors)', name: 'Surgeons & Anesthetists', role: UserRole.DOCTOR },
      { domain: 'Medical Staff (Doctors)', name: 'Intensivists', role: UserRole.DOCTOR },
      { domain: 'Nursing Staff', name: 'Staff Nurses', role: UserRole.MEDICAL },
      { domain: 'Nursing Staff', name: 'Matron / Nursing Superintendent', role: UserRole.SUPERVISOR },
      { domain: 'Nursing Staff', name: 'OT Nurses', role: UserRole.MEDICAL },
      { domain: 'Allied Medical & Technical Staff', name: 'Lab Technicians', role: UserRole.MEDICAL },
      { domain: 'Allied Medical & Technical Staff', name: 'Radiologists & X-Ray Technicians', role: UserRole.MEDICAL },
      { domain: 'Allied Medical & Technical Staff', name: 'Lab Technicians', role: UserRole.LAB },
      { domain: 'Allied Medical & Technical Staff', name: 'Pharmacists', role: UserRole.PHARMACY },
      { domain: 'Housekeeping & Cleaning Staff', name: 'Ward Cleaners', role: UserRole.WARD_CARE },
      { domain: 'Housekeeping & Cleaning Staff', name: 'Sanitation Workers', role: UserRole.WARD_CARE },
      { domain: 'Housekeeping & Cleaning Staff', name: 'Housekeeping Supervisor', role: UserRole.SUPERVISOR },
      { domain: 'Security Staff', name: 'Main Guards', role: UserRole.GATE },
      { domain: 'Security Staff', name: 'Bouncer/Floor Guards', role: UserRole.GATE },
      { domain: 'Security Staff', name: 'CCTV Officers', role: UserRole.GATE },
      { domain: 'Front Desk & Administrative Staff', name: 'Receptionists', role: UserRole.RECEPTION },
      { domain: 'Front Desk & Administrative Staff', name: 'Billing & TPA Insurance Executives', role: UserRole.BILLING },
      { domain: 'Front Desk & Administrative Staff', name: 'Medical Record Executives (MRD)', role: UserRole.RECEPTION },
    ];
    for (const data of seedData) {
      await addDoc(collection(db, 'workstations'), {
        id: `WS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: data.name,
        role: data.role,
        domain: data.domain,
        createdAt: Date.now()
      });
    }
    onAddAuditLog('Seed Workstations', 'Seeded default hospital staff domains and positions');
    alert('Hospital Domains Seeded Successfully!');
  };

  const handleAddRoster = async () => {
    if (!newRoster.doctorId || !newRoster.room) return;
    try {
      await addDoc(collection(db, 'roster'), {
        staffId: newRoster.doctorId,
        shift: newRoster.shift,
        roomNumber: newRoster.room,
        dayOfWeek: new Date().getDay() // Default to today
      });
      const docName = doctors.find(d => d.id === newRoster.doctorId)?.name;
      onAddAuditLog('Assign Roster', `Assigned ${docName} to ${newRoster.shift} shift in Room ${newRoster.room}`);
      setNewRoster({ doctorId: '', shift: 'MORNING', room: '' });
    } catch (err) {
      console.error('Error adding roster:', err);
      alert('Failed to assign duty.');
    }
  };

  const handleAddScheme = () => {
    if (!newScheme.name) return;
    const scheme: BillingScheme = {
      id: `SCH-${Date.now()}`,
      name: newScheme.name,
      discountPercentage: newScheme.discount,
      taxRate: newScheme.tax,
      preAuthLimit: newScheme.limit
    };
    setSchemes([...schemes, scheme]);
    onAddAuditLog('Add Billing Scheme', `Added ${scheme.name} with ${scheme.taxRate}% GST`);
    setNewScheme({ name: '', discount: 0, tax: 0, limit: 100000 });
  };

  const toggleOnCall = (doctorId: string) => {
    setRoster(prev => prev.map(r => r.doctorId === doctorId ? { ...r, isOnCall: !r.isOnCall } : r));
    const docName = doctors.find(d => d.id === doctorId)?.name;
    const status = roster.find(r => r.doctorId === doctorId)?.isOnCall ? 'OFF' : 'ON';
    onAddAuditLog('On-Call Toggle', `Doctor ${docName} On-Call status set to ${status}`);
  };

  const updateThreshold = (key: keyof SystemThresholds, value: any) => {
    setThresholds(prev => ({ ...prev, [key]: value }));
    onAddAuditLog('System Threshold Update', `Updated ${key} to ${value}`);
  };

  const handleResetSystem = () => {
    if (window.confirm('This will clear all daily counters and active queues. Archiving today\'s data...')) {
      onAddAuditLog('System Reset', 'Manual End-of-Day system reset performed.');
      window.location.reload(); 
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-10 space-y-8 pb-32">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${s.text}`}>Admin Console</h2>
          <p className={`text-xs sm:text-sm font-medium ${s.sub} max-w-xl`}>Master configuration for Indian healthcare compliance and operations.</p>
        </div>

        {/* Tab Switcher */}
        <div className={`p-1 sm:p-1.5 rounded-2xl flex flex-wrap gap-1 ${theme === 'light' ? 'bg-[#F5F5F7]' : 'bg-black/40'} border border-white/5 w-full lg:w-auto`}>
          {[
            { id: 'STAFF', label: 'Staff', icon: Users },
            { id: 'PATIENTS', label: 'Patient List', icon: List },
            { id: 'FACILITY', label: 'Facility', icon: Building2 },
            { id: 'OPERATIONS', label: 'Ops', icon: Zap },
            { id: 'COMPLIANCE', label: 'Rules', icon: ShieldCheck },
            { id: 'SYSTEM', label: 'System', icon: SettingsIcon },
            { id: 'HISTORY', label: 'Logs', icon: History },
            { id: 'INTERCOM', label: 'Intercom', icon: MessageSquare }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-1 lg:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-black text-[10px] sm:text-xs transition-all whitespace-nowrap uppercase tracking-widest flex items-center gap-2 ${activeTab === tab.id ? s.tabActive : s.tabInactive}`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === 'PATIENTS' && (
          <div className="space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 w-full">
              <h3 className={`text-xl font-black uppercase tracking-widest whitespace-nowrap ${s.text} shrink-0`}>Master Patient List</h3>
              
              <div className="flex-1 w-full overflow-x-auto apple-scroll pb-2 xl:pb-0">
                <GlobalTATMetrics patients={patients} theme={theme} />
              </div>

              <button 
                onClick={() => { setEditingPatient(null); setIsPatientModalOpen(true); }}
                className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-xl shadow-emerald-600/20 hover:scale-105 transition-transform shrink-0"
              >
                <Plus className="w-4 h-4" />
                Register Patient
              </button>
            </div>
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
              patients={localPatients}
              onPatientClick={handlePatientClick}
              theme={theme}
            />
          </div>
        )}

        {activeTab === 'STAFF' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/5 overflow-x-auto">
                {[
                  { id: 'doctors', label: 'Doctor Table', icon: Stethoscope },
                  { id: 'staff_list', label: 'Staff List', icon: List },
                  { id: 'roles', label: 'Users & Roles', icon: Users },
                  { id: 'duty_list', label: 'Duty List', icon: ClipboardList }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setStaffSubTab(sub.id as StaffSubTab)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                      staffSubTab === sub.id 
                        ? 'bg-white dark:bg-[#2D2D2D] shadow-sm text-blue-600' 
                        : `opacity-40 hover:opacity-100 ${s.text}`
                    }`}
                  >
                    <sub.icon className="w-3 h-3" />
                    {sub.label}
                  </button>
                ))}
              </div>

              {staffSubTab === 'doctors' && (
                <button 
                  onClick={() => { setEditingDoctor(null); setIsDoctorModalOpen(true); }}
                  className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-xl shadow-blue-600/20 hover:scale-105 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                  Add Doctor
                </button>
              )}
            </div>

            <div className="min-h-[400px]">
              {staffSubTab === 'doctors' && (
                <DoctorTable 
                  doctors={doctors} 
                  onEdit={(doc) => { setEditingDoctor(doc); setIsDoctorModalOpen(true); }} 
                  onDelete={(id) => handleDelete('doctors', id)} 
                  theme={theme} 
                />
              )}

              {staffSubTab === 'staff_list' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4">
                    <div className={`p-8 rounded-[2.5rem] border ${s.card} shadow-2xl`}>
                      <div className="space-y-5">
                        <h2 className={`text-xl font-black uppercase tracking-tight mb-4 ${s.text}`}>Register Staff</h2>
                        <input
                          type="text" required placeholder="Staff Full Name"
                          value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                          className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                        />
                        <div className="grid grid-cols-1 gap-4">
                          <input
                            type="text" required placeholder="Employee ID"
                            value={newStaff.employeeId} onChange={e => setNewStaff({...newStaff, employeeId: e.target.value})}
                            className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                          />
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <select
                                value={newStaff.role || 'unassigned'}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === 'add_new') {
                                    setIsAddingCustomRole(true);
                                  } else {
                                    setNewStaff({...newStaff, role: val});
                                  }
                                }}
                                className={`flex-1 px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                              >
                                <option value="unassigned" className="bg-[#1C1C1E] text-white">UNASSIGNED</option>
                                {ROLE_CATEGORIES.map(category => (
                                  <optgroup key={category.label} label={category.label} className="bg-[#2C2C2E] text-white/50 font-bold">
                                    {category.roles.map(role => (
                                      <option key={role.id} value={role.id} className="bg-[#1C1C1E] text-white">{role.name.toUpperCase()}</option>
                                    ))}
                                  </optgroup>
                                ))}
                                {(customRoles || []).length > 0 && (
                                  <optgroup label="Custom Roles" className="bg-[#2C2C2E] text-white/50 font-bold">
                                    {(customRoles || []).map(role => (
                                      <option key={role.id} value={role.id} className="bg-[#1C1C1E] text-white">{role.name.toUpperCase()}</option>
                                    ))}
                                  </optgroup>
                                )}
                                <option value="add_new" className="bg-[#3A3A3C] text-blue-400 font-bold">+ ADD NEW ROLE</option>
                              </select>
                              {(customRoles || []).find(r => r.id === newStaff.role) && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomRole(newStaff.role as string)}
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
                                  onClick={() => { setIsAddingCustomRole(false); setNewCustomRoleName(''); }}
                                  className="px-6 py-4 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <button onClick={handleAddStaff} className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl bg-indigo-600 text-white`}>
                          Add Staff Member
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-8">
                    <div className={`rounded-[2.5rem] border ${s.card} overflow-hidden shadow-xl`}>
                      <table className="w-full text-left">
                        <thead className="bg-black/5 dark:bg-white/5">
                          <tr>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-50">Staff Name</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-50">Role</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-50 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y divide-white/5 ${s.text}`}>
                          {staff.map(st => (
                            <tr key={st.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-5 font-bold">{st.name}</td>
                              <td className="px-6 py-5 opacity-70">{st.employeeId}</td>
                              <td className="px-6 py-5">
                                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider">
                                    {(st.role || 'unassigned').replace('_', ' ')}
                                  </span>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <button onClick={() => handleDelete('staff', st.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500/50 hover:text-red-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {staff.length === 0 && (
                            <tr className="hover:bg-white/5 transition-colors">
                              <td colSpan={3} className="px-6 py-10 text-center opacity-30 italic">No staff members registered.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
              {staffSubTab === 'roles' && (
                <div className="space-y-4">
                  <h2 className={`text-xl font-black uppercase tracking-tight mb-4 ${s.text}`}>User Role Assignment</h2>
                  <p className={`text-sm mb-6 ${s.sub}`}>Drag and drop staff members to reassign their operational roles instantly.</p>
                  <RoleManagementBoard 
                    staff={staff}
                    theme={theme}
                    onUpdateRole={handleUpdateStaffRole}
                  />
                </div>
              )}
                
              {staffSubTab === 'duty_list' && (
                <DutyRoster staff={staff} theme={theme} customShifts={customShifts} setCustomShifts={setCustomShifts} />
              )}
            </div>
          </div>
        )}

        {activeTab === 'FACILITY' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
            {/* Wards Configuration */}
            <div className={`p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border shadow-2xl ${s.card}`}>
              <div className="flex items-center gap-4 mb-8 sm:mb-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-emerald-500/10 flex items-center justify-center text-2xl sm:text-4xl shadow-inner">🏥</div>
                <h3 className={`text-xl sm:text-2xl font-black ${s.text} tracking-tight`}>Ward Configuration</h3>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <input
                  type="text"
                  placeholder="Ward Name (e.g. ICU-A)"
                  value={newWard.name}
                  onChange={(e) => setNewWard({...newWard, name: e.target.value})}
                  className={`w-full px-6 py-4 sm:py-5 rounded-2xl sm:rounded-3xl border outline-none transition-all font-bold ${s.input}`}
                />
                <div className="flex flex-col sm:flex-row gap-4">
                  <select
                    value={newWard.type}
                    onChange={(e) => setNewWard({...newWard, type: e.target.value as any})}
                    className={`flex-1 px-6 py-4 sm:py-5 rounded-2xl sm:rounded-3xl border outline-none transition-all font-bold ${s.input}`}
                  >
                    <option value="GENERAL" className="bg-[#1C1C1E] text-white">General Ward</option>
                    <option value="ICU" className="bg-[#1C1C1E] text-white">ICU</option>
                    <option value="EMERGENCY" className="bg-[#1C1C1E] text-white">Emergency</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Beds"
                    value={newWard.capacity}
                    onChange={(e) => setNewWard({...newWard, capacity: parseInt(e.target.value) || 0})}
                    className={`w-32 px-6 py-4 sm:py-5 rounded-2xl sm:rounded-3xl border outline-none transition-all font-bold ${s.input}`}
                  />
                </div>
                <button 
                  onClick={handleAddWard}
                  className="w-full py-5 rounded-3xl font-black uppercase tracking-widest bg-emerald-600 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:translate-y-0"
                >
                  Create Ward
                </button>
              </div>
            </div>

            {/* Workstation Configuration */}
            <div className={`p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border shadow-2xl ${s.card}`}>
              <div className="flex items-center gap-4 mb-8 sm:mb-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-indigo-500/10 flex items-center justify-center text-2xl sm:text-4xl shadow-inner">📍</div>
                <h3 className={`text-xl sm:text-2xl font-black ${s.text} tracking-tight`}>Workstations / Posts</h3>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <input
                  type="text" required placeholder="Workstation Name (e.g. ICU Wing A)"
                  value={newWorkstation.name}
                  onChange={(e) => setNewWorkstation({...newWorkstation, name: e.target.value})}
                  className={`w-full px-6 py-4 sm:py-5 rounded-2xl sm:rounded-3xl border outline-none transition-all font-bold ${s.input}`}
                />
                <select
                  value={newWorkstation.domain}
                  onChange={(e) => setNewWorkstation({...newWorkstation, domain: e.target.value})}
                  className={`w-full px-6 py-4 sm:py-5 rounded-2xl sm:rounded-3xl border outline-none transition-all font-bold ${s.input}`}
                >
                  <option value="Medical Staff (Doctors)" className="bg-[#1C1C1E] text-white">Medical Staff (Doctors)</option>
                  <option value="Nursing Staff" className="bg-[#1C1C1E] text-white">Nursing Staff</option>
                  <option value="Allied Medical & Technical Staff" className="bg-[#1C1C1E] text-white">Allied Medical & Technical Staff</option>
                  <option value="Housekeeping & Cleaning Staff" className="bg-[#1C1C1E] text-white">Housekeeping & Cleaning Staff</option>
                  <option value="Security Staff" className="bg-[#1C1C1E] text-white">Security Staff</option>
                  <option value="Front Desk & Administrative Staff" className="bg-[#1C1C1E] text-white">Front Desk & Administrative Staff</option>
                  <option value="Other" className="bg-[#1C1C1E] text-white">Other</option>
                </select>
                <select
                  value={newWorkstation.role}
                  onChange={(e) => setNewWorkstation({...newWorkstation, role: e.target.value as UserRole})}
                  className={`w-full px-6 py-4 sm:py-5 rounded-2xl sm:rounded-3xl border outline-none transition-all font-bold ${s.input}`}
                >
                  {ROLE_CATEGORIES.map(category => (
                    <optgroup key={category.label} label={category.label} className="bg-[#2C2C2E] text-white/50 font-bold">
                      {category.roles.map(role => (
                        <option key={role.id} value={role.id} className="bg-[#1C1C1E] text-white">{role.name.toUpperCase()}</option>
                      ))}
                    </optgroup>
                  ))}
                  {(customRoles || []).length > 0 && (
                    <optgroup label="Custom Roles" className="bg-[#2C2C2E] text-white/50 font-bold">
                      {(customRoles || []).map(role => (
                        <option key={role.id} value={role.id} className="bg-[#1C1C1E] text-white">{role.name.toUpperCase()}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <div className="flex gap-4">
                  <button 
                    onClick={handleAddWorkstation}
                    className="flex-1 py-5 rounded-3xl font-black uppercase tracking-widest bg-indigo-600 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:translate-y-0"
                  >
                    Create Post
                  </button>
                  <button 
                    onClick={handleSeedWorkstations}
                    className="py-5 px-6 rounded-3xl font-black uppercase tracking-widest bg-emerald-600 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:translate-y-0"
                    title="Seed Default Hospital Domains"
                  >
                    Seed Data
                  </button>
                </div>
              </div>
            </div>

            {/* System Capacity Overview */}
            <div className={`lg:col-span-2 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border shadow-2xl ${s.card}`}>
              <div className="flex items-center gap-4 mb-8 sm:mb-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-blue-500/10 flex items-center justify-center text-2xl sm:text-4xl shadow-inner">📊</div>
                <h3 className={`text-xl sm:text-2xl font-black ${s.text} tracking-tight`}>System Capacity</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Wards Display */}
                <div>
                  <h4 className={`text-sm font-bold uppercase tracking-widest opacity-50 mb-4 ${s.text}`}>Wards Overview</h4>
                  <div className="space-y-3">
                    {wards.map(ward => (
                      <div key={ward.id} className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <span className="font-bold">{ward.name}</span>
                          <span className="text-xs px-2 py-1 bg-white/10 rounded-lg">{ward.type}</span>
                        </div>
                        <div className="text-sm font-black">{ward.totalBeds} Beds</div>
                      </div>
                    ))}
                    {wards.length === 0 && <div className="text-sm opacity-50">No wards configured</div>}
                  </div>
                </div>

                {/* Workstations Display */}
                <div>
                  <h4 className={`text-sm font-bold uppercase tracking-widest opacity-50 mb-4 ${s.text}`}>Workstations Overview</h4>
                  <div className="space-y-3">
                    {workstations.map(ws => (
                      <div key={ws.id} className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <span className="font-bold">{ws.name}</span>
                        </div>
                        <div className="text-xs px-2 py-1 bg-white/10 rounded-lg">{ws.domain || 'Other'}</div>
                      </div>
                    ))}
                    {workstations.length === 0 && <div className="text-sm opacity-50">No workstations configured</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'OPERATIONS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
            {/* Threshold Controls */}
            <div className={`p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border shadow-2xl ${s.card} space-y-8 sm:space-y-10`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-red-500/10 flex items-center justify-center text-2xl sm:text-4xl shadow-inner">🚨</div>
                <h3 className={`text-xl sm:text-2xl font-black ${s.text} tracking-tight`}>Alert Thresholds</h3>
              </div>
              <div className="space-y-6 sm:space-y-8">
                <div className="flex flex-col gap-3">
                  <label className={`text-[10px] font-black uppercase tracking-widest ${s.sub}`}>High Volume Mode Trigger</label>
                  <input 
                    type="range" min="1" max="50" 
                    value={thresholds.highVolumeTrigger}
                    onChange={(e) => updateThreshold('highVolumeTrigger', parseInt(e.target.value))}
                    className="w-full h-3 bg-black/10 rounded-full appearance-none cursor-pointer accent-[#0A84FF]"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xl sm:text-2xl font-black text-[#0A84FF] tracking-tighter">{isNaN(thresholds.highVolumeTrigger) ? 0 : thresholds.highVolumeTrigger} Patients</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${s.sub}`}>Cap: 50</span>
                  </div>
                </div>
                <div className="pt-8 border-t border-white/5 space-y-3">
                  <label className={`text-[10px] font-black uppercase tracking-widest ${s.sub} block`}>Wait Time Manual Override</label>
                  <div className="relative">
                    <input 
                      type="number"
                      placeholder="Auto"
                      value={thresholds.waitTimeOverride || ''}
                      onChange={(e) => updateThreshold('waitTimeOverride', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={`w-full px-6 py-4 sm:py-5 rounded-2xl sm:rounded-3xl border outline-none transition-all font-black text-xl ${s.input}`}
                    />
                    <span className={`absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest ${s.sub}`}>Min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Queue Throttling */}
            <div className={`p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border shadow-2xl ${s.card} space-y-8 sm:space-y-10`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-purple-500/10 flex items-center justify-center text-2xl sm:text-4xl shadow-inner">🚦</div>
                <h3 className={`text-xl sm:text-2xl font-black ${s.text} tracking-tight`}>Queue Throttling</h3>
              </div>
              <div className="space-y-6 sm:space-y-8">
                <div className="space-y-3">
                  <label className={`text-[10px] font-black uppercase tracking-widest ${s.sub}`}>Daily OPD Token Ceiling</label>
                  <input 
                    type="number"
                    value={isNaN(thresholds.opdTokenLimit) ? '' : thresholds.opdTokenLimit}
                    onChange={(e) => updateThreshold('opdTokenLimit', parseInt(e.target.value))}
                    className={`w-full px-6 py-4 sm:py-5 rounded-2xl sm:rounded-3xl border outline-none transition-all font-black text-xl ${s.input}`}
                  />
                </div>
                <div className={`p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border shadow-xl transition-all ${thresholds.isMaintenanceMode ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col items-center sm:items-start">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${thresholds.isMaintenanceMode ? 'text-red-500' : 'text-emerald-500'}`}>System Status</span>
                      <span className={`text-sm font-black uppercase tracking-tight ${thresholds.isMaintenanceMode ? 'text-red-500' : 'text-emerald-500'}`}>
                        {thresholds.isMaintenanceMode ? 'Emergency Blackout' : 'Fully Operational'}
                      </span>
                    </div>
                    <button 
                      onClick={() => updateThreshold('isMaintenanceMode', !thresholds.isMaintenanceMode)}
                      className={`w-16 h-10 rounded-full relative shadow-inner transition-all ${thresholds.isMaintenanceMode ? 'bg-red-500' : 'bg-emerald-500'}`}
                    >
                      <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full shadow-lg transition-all ${thresholds.isMaintenanceMode ? 'left-7.5' : 'left-1.5'}`}></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Schemes */}
            <div className={`p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border shadow-2xl ${s.card} space-y-8 sm:space-y-10`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-yellow-500/10 flex items-center justify-center text-2xl sm:text-4xl shadow-inner">💳</div>
                <h3 className={`text-xl sm:text-2xl font-black ${s.text} tracking-tight`}>Rate Masters</h3>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <input 
                  type="text" placeholder="Scheme Name (e.g. PM-JAY)"
                  value={newScheme.name}
                  onChange={(e) => setNewScheme({...newScheme, name: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl sm:rounded-3xl border outline-none font-bold ${s.input}`}
                />
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <input 
                      type="number" placeholder="Tax"
                      value={isNaN(newScheme.tax) ? '' : newScheme.tax}
                      onChange={(e) => setNewScheme({...newScheme, tax: parseInt(e.target.value)})}
                      className={`w-full px-6 py-4 rounded-2xl sm:rounded-3xl border outline-none font-black text-center ${s.input}`}
                    />
                    <span className={`absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black ${s.sub}`}>%</span>
                  </div>
                  <button onClick={handleAddScheme} className={`w-full sm:w-auto px-10 py-4 rounded-2xl sm:rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl ${s.btn}`}>Add</button>
                </div>
                <div className="space-y-2 pt-4 max-h-[200px] overflow-y-auto pr-1 apple-scroll">
                  {schemes.map(sch => (
                    <div key={sch.id} className="flex justify-between items-center p-4 rounded-2xl border border-white/5 bg-black/5 hover:bg-black/10 transition-all">
                      <span className={`text-sm font-black tracking-tight ${s.text}`}>{sch.name}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${s.sub}`}>{sch.tax}% GST</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'COMPLIANCE' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
            {/* ABDM & ABHA */}
            <div className={`p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border shadow-2xl ${s.card} space-y-8 sm:space-y-10`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-indigo-500/10 flex items-center justify-center text-2xl sm:text-4xl shadow-inner">🇮🇳</div>
                <h3 className={`text-xl sm:text-2xl font-black ${s.text} tracking-tight`}>ABDM Integration</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 rounded-[2rem] bg-black/5 border border-white/5 transition-all hover:bg-black/10">
                  <div className="flex flex-col pr-4">
                    <span className={`font-black tracking-tight ${s.text}`}>Force ABHA ID</span>
                    <span className={`text-[10px] sm:text-xs font-medium leading-tight mt-1 ${s.sub}`}>Mandatory for all digital registries</span>
                  </div>
                  <button 
                    onClick={() => updateThreshold('abhaRequired', !thresholds.abhaRequired)}
                    className={`w-14 h-8 rounded-full relative transition-all shadow-inner ${thresholds.abhaRequired ? 'bg-indigo-500' : 'bg-black/20'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${thresholds.abhaRequired ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
                <div className="p-6 rounded-[2rem] border border-indigo-500/20 bg-indigo-500/5 shadow-inner">
                  <p className="text-xs sm:text-sm font-bold text-indigo-500 leading-relaxed">
                    Consent Manager Bridge: <span className="opacity-60">m3_prod_v2</span> • <span className="underline cursor-pointer">Verify Link</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Medico-Legal & Statutory */}
            <div className={`p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border shadow-2xl ${s.card} space-y-8 sm:space-y-10`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-red-500/10 flex items-center justify-center text-2xl sm:text-4xl shadow-inner">⚖️</div>
                <h3 className={`text-xl sm:text-2xl font-black ${s.text} tracking-tight`}>Statutory Compliance</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-6 rounded-[2rem] bg-black/5 border border-white/5 transition-all hover:bg-black/10">
                  <span className={`font-black tracking-tight ${s.text}`}>MLC Flagging Engine</span>
                  <button 
                    onClick={() => updateThreshold('mlcPromptEnabled', !thresholds.mlcPromptEnabled)}
                    className={`w-14 h-8 rounded-full relative transition-all shadow-inner ${thresholds.mlcPromptEnabled ? 'bg-red-500' : 'bg-black/20'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${thresholds.mlcPromptEnabled ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between p-6 rounded-[2rem] bg-black/5 border border-white/5 transition-all hover:bg-black/10">
                  <span className={`font-black tracking-tight ${s.text}`}>PNDT Automated Log</span>
                  <button 
                    onClick={() => updateThreshold('pndtLoggingEnabled', !thresholds.pndtLoggingEnabled)}
                    className={`w-14 h-8 rounded-full relative transition-all shadow-inner ${thresholds.pndtLoggingEnabled ? 'bg-red-500' : 'bg-black/20'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${thresholds.pndtLoggingEnabled ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            </div>

            {/* NABH KPIs */}
            <div className={`lg:col-span-2 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border shadow-2xl ${s.card}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-emerald-500/10 flex items-center justify-center text-2xl sm:text-4xl shadow-inner">🏆</div>
                  <h3 className={`text-xl sm:text-2xl font-black ${s.text} tracking-tight`}>Quality Indicators (NABH)</h3>
                </div>
                <div className={`px-6 py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] bg-emerald-500/10 text-emerald-500 shadow-sm text-center`}>Compliance Index: 98.4%</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpis.map(kpi => (
                  <div key={kpi.id} className="p-6 rounded-[2rem] border border-white/5 bg-black/5 flex flex-col gap-5 shadow-inner transition-all hover:bg-black/10">
                    <span className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${s.sub}`}>{kpi.name}</span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl sm:text-5xl font-black tracking-tighter ${s.text}`}>{kpi.currentValue}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${s.sub}`}>{kpi.unit}</span>
                    </div>
                    <div className="space-y-2 mt-auto">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="opacity-40">Target: {kpi.target}</span>
                        <span className={kpi.currentValue <= kpi.target ? 'text-emerald-500' : 'text-red-500'}>
                          {kpi.currentValue <= kpi.target ? 'PERFORMANT' : 'CRITICAL'}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full transition-all duration-1000 ${kpi.currentValue <= kpi.target ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}
                          style={{ width: `${Math.min((kpi.currentValue / kpi.target) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'SYSTEM' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
            <div className="space-y-6 sm:space-y-10">
              <div className={`p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border shadow-2xl ${s.card} space-y-8 sm:space-y-10`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-red-500/10 flex items-center justify-center text-2xl sm:text-4xl shadow-inner">🔄</div>
                  <h3 className={`text-xl sm:text-2xl font-black ${s.text} tracking-tight`}>System Ops</h3>
                </div>
                <button 
                  onClick={handleResetSystem}
                  className="w-full py-5 rounded-[2.5rem] bg-red-500 text-white font-black uppercase tracking-[0.25em] text-xs sm:text-sm shadow-2xl shadow-red-500/30 hover:scale-[1.02] transition-all"
                >
                  Global System Reset
                </button>
              </div>
            </div>

            <div className="space-y-6 sm:space-y-10">
              {/* Billing Compliance */}
              <div className={`p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border shadow-2xl ${s.card} space-y-6 sm:space-y-8`}>
                <h3 className={`text-lg font-black tracking-tight ${s.text}`}>Compliance Verification</h3>
                <div className="flex items-center justify-between p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-inner">
                  <span className="text-emerald-500 font-black uppercase tracking-widest text-[10px]">UPI Static QR</span>
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shadow-lg">✅</div>
                </div>
                <div className="flex items-center justify-between p-5 rounded-2xl bg-black/5 border border-white/5 shadow-inner">
                  <span className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${s.sub}`}>Verified GSTIN</span>
                  <span className={`text-[10px] font-black tracking-widest ${s.text}`}>27AABCT9900A1Z5</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className={`p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border shadow-2xl ${s.card} flex flex-col`}>
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-emerald-500/10 flex items-center justify-center text-2xl sm:text-4xl shadow-inner">📜</div>
                  <div className="flex flex-col">
                    <h3 className={`text-xl sm:text-2xl font-black ${s.text} tracking-tight`}>Patient History Records</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${s.sub} opacity-60 mt-1`}>Granular Time-Motion & Accountability Matrix</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <List className="w-4 h-4 text-blue-500" />
                  </div>
                  <h4 className={`text-lg font-black uppercase tracking-widest ${s.text}`}>Archived & Completed Patients</h4>
                </div>
                <HistoryLogTable patients={patients} theme={theme} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'INTERCOM' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className={`p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border shadow-2xl ${s.card} flex flex-col`}>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-[#0A84FF]/10 flex items-center justify-center shadow-inner">
                  <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-[#0A84FF]" />
                </div>
                <div className="flex flex-col">
                  <h3 className={`text-xl sm:text-2xl font-black ${s.text} tracking-tight`}>Intercom Logs</h3>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${s.sub} opacity-60 mt-1`}>Admin Review of Internal Communications</p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${s.sub}`}>Timestamp</th>
                      <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${s.sub}`}>Sender</th>
                      <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${s.sub}`}>Recipient</th>
                      <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${s.sub}`}>Message</th>
                      <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${s.sub}`}>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.slice().reverse().map(alert => (
                      <tr key={alert.id} className="border-b border-gray-100 dark:border-gray-900/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className={`p-4 text-xs font-medium ${s.text}`}>
                          {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                        </td>
                        <td className={`p-4 text-xs font-bold uppercase ${s.text}`}>{alert.sender}</td>
                        <td className={`p-4 text-xs font-bold uppercase ${s.text}`}>{alert.recipientName}</td>
                        <td className={`p-4 text-xs ${s.text}`}>{alert.message}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                            alert.severity === 'critical' ? 'bg-red-500/10 text-red-500' :
                            alert.severity === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            {alert.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {alerts.length === 0 && (
                      <tr>
                        <td colSpan={5} className={`p-8 text-center text-sm font-bold opacity-50 ${s.text}`}>No intercom messages recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DoctorFormModal 
        isOpen={isDoctorModalOpen} 
        onClose={() => { setIsDoctorModalOpen(false); setEditingDoctor(null); }} 
        onSave={handleSaveDoctor} 
        initialData={editingDoctor} 
        theme={theme} 
      />

      {timelinePatient && (
        <PatientTimelineModal
          patient={timelinePatient}
          theme={theme}
          onClose={() => setTimelinePatient(null)}
          onEdit={(p) => {
            setTimelinePatient(null);
            setEditingPatient(p);
            setIsPatientModalOpen(true);
          }}
          onDelete={(p, reason) => {
            setTimelinePatient(null);
            setPatientToDelete(p);
            handleSoftDelete(reason);
          }}
        />
      )}

      <PatientFormModal
        isOpen={isPatientModalOpen}
        onClose={() => { setIsPatientModalOpen(false); setEditingPatient(null); }}
        onSave={handleSavePatient}
        initialData={editingPatient}
        theme={theme}
        doctors={doctors}
      />

      <DeletePatientModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setPatientToDelete(null); }}
        onConfirm={handleSoftDelete}
        patient={patientToDelete}
        theme={theme}
      />
    </div>
  );
};

export default SettingsView;
