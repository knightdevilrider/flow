import React, { useState } from 'react';
import { Theme, Doctor, Ward, Section, DoctorRoster, Shift, SystemThresholds, AuditLog, Patient, BillingScheme, NABHKPI, UserRole, StaffMember } from '../types';
import AuditIntelligence from '../components/AuditIntelligence';

import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import DoctorTable from '../components/admin/DoctorTable';
import DoctorFormModal from '../components/admin/DoctorFormModal';
import { 
  Users, 
  Stethoscope, 
  List, 
  ClipboardList, 
  Plus,
  Trash2,
  Clock,
  ShieldCheck,
  Building2,
  Zap,
  Activity,
  History,
  Settings as SettingsIcon
} from 'lucide-react';

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
}

type Tab = 'STAFF' | 'FACILITY' | 'OPERATIONS' | 'COMPLIANCE' | 'SYSTEM' | 'HISTORY';
type StaffSubTab = 'doctors' | 'staff_list' | 'duty_list';

const SettingsView: React.FC<SettingsViewProps> = ({ 
  theme, doctors, setDoctors, wards, setWards, roster, setRoster, thresholds, setThresholds, 
  schemes, setSchemes, kpis, setKpis, auditLogs, onAddAuditLog, patients, staff 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('STAFF');
  const [staffSubTab, setStaffSubTab] = useState<StaffSubTab>('doctors');
  
  // Modal States
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  // Form states
  const [newStaff, setNewStaff] = useState({ name: '', employeeId: '', role: UserRole.RECEPTION });
  const [newWard, setNewWard] = useState({ name: '', type: 'GENERAL' as any, capacity: 20 });
  const [newRoster, setNewRoster] = useState({ doctorId: '', shift: 'MORNING' as Shift, room: '' });
  const [newScheme, setNewScheme] = useState({ name: '', discount: 0, tax: 0, limit: 100000 });

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
    setNewStaff({ name: '', employeeId: '', role: UserRole.RECEPTION });
  };

  const handleAddWard = () => {
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
    setWards([...wards, ward]);
    onAddAuditLog('Add Ward', `Configured ${ward.name} with capacity ${ward.totalBeds}`);
    setNewWard({ name: '', type: 'GENERAL', capacity: 20 });
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 space-y-8 pb-32">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${s.text}`}>Admin Console</h2>
          <p className={`text-xs sm:text-sm font-medium ${s.sub} max-w-xl`}>Master configuration for Indian healthcare compliance and operations.</p>
        </div>

        {/* Tab Switcher */}
        <div className={`p-1 sm:p-1.5 rounded-2xl flex flex-wrap gap-1 ${theme === 'light' ? 'bg-[#F5F5F7]' : 'bg-black/40'} border border-white/5 w-full lg:w-auto`}>
          {[
            { id: 'STAFF', label: 'Staff', icon: Users },
            { id: 'FACILITY', label: 'Facility', icon: Building2 },
            { id: 'OPERATIONS', label: 'Ops', icon: Zap },
            { id: 'COMPLIANCE', label: 'Rules', icon: ShieldCheck },
            { id: 'SYSTEM', label: 'System', icon: SettingsIcon },
            { id: 'HISTORY', label: 'Logs', icon: History }
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
        {activeTab === 'STAFF' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/5 overflow-x-auto">
                {[
                  { id: 'doctors', label: 'Doctor Table', icon: Stethoscope },
                  { id: 'staff_list', label: 'Staff List', icon: List },
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
                          <select
                            value={newStaff.role}
                            onChange={e => setNewStaff({...newStaff, role: e.target.value as UserRole})}
                            className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${s.input}`}
                          >
                            {(Object.values(UserRole) as string[]).filter(r => r !== UserRole.PUBLIC).map(role => (
                              <option key={role} value={role} className="bg-[#1C1C1E] text-white">{role.toUpperCase()}</option>
                            ))}
                          </select>
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
                              <td className="px-6 py-5">
                                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                                  {st.role}
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
            </div>
          </div>
        )}

        {activeTab === 'FACILITY' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
            <div className={`p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border shadow-2xl ${s.card}`}>
              <div className="flex items-center gap-4 mb-8 sm:mb-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-emerald-500/10 flex items-center justify-center text-2xl sm:text-4xl shadow-inner">🏨</div>
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
                    <option value="ICU" className="bg-[#1C1C1E] text-white">ICU Unit</option>
                    <option value="PRIVATE" className="bg-[#1C1C1E] text-white">Private Suite</option>
                    <option value="SEMI-PRIVATE" className="bg-[#1C1C1E] text-white">Semi-Private Room</option>
                  </select>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      placeholder="Beds"
                      value={isNaN(newWard.capacity) ? '' : newWard.capacity}
                      onChange={(e) => setNewWard({...newWard, capacity: parseInt(e.target.value)})}
                      className={`w-24 sm:w-32 px-6 py-4 sm:py-5 rounded-2xl sm:rounded-3xl border outline-none transition-all font-bold text-center ${s.input}`}
                    />
                    <button 
                      onClick={handleAddWard}
                      className={`flex-1 sm:flex-none px-10 py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 ${s.btn}`}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              {wards.map(ward => (
                <div key={ward.id} className={`p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border shadow-2xl transition-all hover:scale-[1.01] ${s.card} flex flex-col gap-8`}>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <h4 className={`text-2xl sm:text-3xl font-black tracking-tighter ${s.text}`}>{ward.name}</h4>
                      <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-40 ${s.sub}`}>{ward.type}</span>
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">Active</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ${s.sub}`}>Total Capacity</span>
                      <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/5 bg-black/5 text-2xl sm:text-3xl font-black tracking-tighter ${s.text} shadow-inner`}>{ward.totalBeds}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/60`}>In Maintenance</span>
                      <input 
                        type="number"
                        value={isNaN(ward.maintenanceBeds) ? '' : ward.maintenanceBeds}
                        onChange={(e) => setWards(wards.map(w => w.id === ward.id ? { ...w, maintenanceBeds: parseInt(e.target.value) } : w))}
                        className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/5 bg-black/5 text-2xl sm:text-3xl font-black tracking-tighter text-orange-500 outline-none w-full shadow-inner`}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60`}>ER Reservation</span>
                      <input 
                        type="number"
                        value={isNaN(ward.reserveBeds) ? '' : ward.reserveBeds}
                        onChange={(e) => setWards(wards.map(w => w.id === ward.id ? { ...w, reserveBeds: parseInt(e.target.value) } : w))}
                        className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/5 bg-black/5 text-2xl sm:text-3xl font-black tracking-tighter text-emerald-500 outline-none w-full shadow-inner`}
                      />
                    </div>
                  </div>
                </div>
              ))}
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
                <button className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-inner transition-all hover:scale-110 active:scale-95 ${s.btn}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                </button>
              </div>

              <div>
                <AuditIntelligence patients={patients} theme={theme} />
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
    </div>
  );
};

export default SettingsView;
