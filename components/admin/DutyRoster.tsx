import React, { useState } from 'react';
import { StaffMember, Theme, Shift, UserRole, ShiftConfig } from '../../types';
import { doc, updateDoc, addDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { Users, Sun, Sunset, Moon, GripVertical, ShieldCheck, CheckCircle, Plus, Trash2, Edit2, X, Circle } from 'lucide-react';

interface DutyRosterProps {
  staff: StaffMember[];
  theme: Theme;
  customShifts?: ShiftConfig[];
  setCustomShifts?: (shifts: ShiftConfig[]) => void;
}

const DutyRoster: React.FC<DutyRosterProps> = ({ staff, theme, customShifts = [], setCustomShifts }) => {
  const [viewMode, setViewMode] = useState<'SHIFTS' | 'SUPERVISORS'>('SHIFTS');
  const [isEditingShifts, setIsEditingShifts] = useState(false);
  
  const s = theme === 'dark' || theme === 'titanium' ? {
    card: 'bg-[#141417] border-white/10',
    text: 'text-white',
    sub: 'text-[#8E8E93]',
    bucket: 'bg-white/5 border-white/10',
    hover: 'hover:bg-white/10'
  } : {
    card: 'bg-white border-black/5',
    text: 'text-black',
    sub: 'text-[#636366]',
    bucket: 'bg-black/5 border-black/10',
    hover: 'hover:bg-black/5'
  };

  const handleDragStart = (e: React.DragEvent, staffId: string) => {
    e.dataTransfer.setData('staffId', staffId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropShift = async (e: React.DragEvent, shiftId: string) => {
    e.preventDefault();
    const staffId = e.dataTransfer.getData('staffId');
    if (!staffId) return;

    try {
      await updateDoc(doc(db, 'staff', staffId), {
        currentShift: shiftId === 'UNASSIGNED' ? null : shiftId,
        shiftApproved: false // Reset approval when shift changes
      });
    } catch (err) {
      console.error('Error assigning shift:', err);
    }
  };

  const handleDropSupervisor = async (e: React.DragEvent, supervisorId: string) => {
    e.preventDefault();
    const staffId = e.dataTransfer.getData('staffId');
    if (!staffId) return;

    try {
      await updateDoc(doc(db, 'staff', staffId), {
        supervisorId: supervisorId === 'UNASSIGNED' ? null : supervisorId
      });
    } catch (err) {
      console.error('Error assigning supervisor:', err);
    }
  };

  const handleToggleApproval = async (member: StaffMember) => {
    try {
      await updateDoc(doc(db, 'staff', member.id), {
        shiftApproved: !member.shiftApproved
      });
    } catch (err) {
      console.error('Error toggling approval:', err);
    }
  };

  const defaultShifts: ShiftConfig[] = [
    { id: 'MORNING', label: 'Morning (07:00 - 15:00)', startTime: '07:00', endTime: '15:00', iconName: 'Sun', color: 'text-amber-500' },
    { id: 'EVENING', label: 'Evening (15:00 - 23:00)', startTime: '15:00', endTime: '23:00', iconName: 'Sunset', color: 'text-orange-500' },
    { id: 'NIGHT', label: 'Night (23:00 - 07:00)', startTime: '23:00', endTime: '07:00', iconName: 'Moon', color: 'text-indigo-500' }
  ];

  const shifts = customShifts.length > 0 ? customShifts : defaultShifts;

  const supervisors = staff.filter(s => s.role === UserRole.SUPERVISOR || s.role === UserRole.ADMIN);
  
  const getIcon = (iconName: string = '') => {
    switch(iconName) {
      case 'Sun': return Sun;
      case 'Sunset': return Sunset;
      case 'Moon': return Moon;
      default: return Clock;
    }
  };
  const Clock = Moon; // fallback icon

  const renderDraggableStaff = (member: StaffMember) => (
    <div
      key={member.id}
      draggable
      onDragStart={(e) => handleDragStart(e, member.id)}
      className={`p-3 mb-2 rounded-xl border flex items-center gap-3 cursor-grab active:cursor-grabbing transition-colors ${s.card} ${s.hover}`}
    >
      <GripVertical className={`w-4 h-4 ${s.sub} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-sm truncate ${s.text}`}>{member.name}</div>
        <div className={`text-[10px] font-black uppercase tracking-widest truncate ${s.sub}`}>
          {member.role} â€¢ {member.department || 'General'}
        </div>
      </div>
      {viewMode === 'SHIFTS' && !member.currentShift && (
        <button 
          onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, 'staff', member.id)); }} 
          className="p-1 rounded-full hover:bg-white/10 transition-colors flex-shrink-0" 
          title="Remove Staff"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      )}
      {viewMode === 'SHIFTS' && member.currentShift && (
        <button 
          onClick={(e) => { e.stopPropagation(); handleToggleApproval(member); }}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
          title="Toggle Approval"
        >
          {member.shiftApproved ? (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          ) : (
            <Circle className={`w-5 h-5 ${s.sub}`} />
          )}
        </button>
      )}
    </div>
  );

  const handleScrollToSupervisor = (supId: string) => {
    if (!supId) return;
    const el = document.getElementById(`sup-${supId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  };

  const handleAddUnassignedStaff = async () => {
    try {
      await addDoc(collection(db, 'staff'), {
        name: 'New Staff',
        role: UserRole.MEDICAL,
        employeeId: 'EMP' + Math.floor(Math.random() * 10000),
        currentShift: null,
        supervisorId: null,
        shiftApproved: false
      });
    } catch (err) {
      console.error('Error adding unassigned staff:', err);
    }
  };

  const handleAddShift = () => {
    if (!setCustomShifts) return;
    const newShift: ShiftConfig = {
      id: `SHIFT_${Date.now()}`,
      label: 'NEW SHIFT (00:00 - 00:00)',
      startTime: '00:00',
      endTime: '00:00',
      iconName: 'Sun',
      color: 'text-gray-500'
    };
    setCustomShifts([...shifts, newShift]);
  };

  const handleUpdateShift = (id: string, updates: Partial<ShiftConfig>) => {
    if (!setCustomShifts) return;
    setCustomShifts(shifts.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleRemoveShift = (id: string) => {
    if (!setCustomShifts) return;
    setCustomShifts(shifts.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h3 className={`text-xl font-black uppercase tracking-widest ${s.text}`}>Duty & Hierarchy Management</h3>
        <div className="flex flex-1 justify-end items-center gap-4">
          {viewMode === 'SUPERVISORS' && supervisors.length > 0 && (
            <select
              className={`px-4 py-2 rounded-xl text-xs font-bold outline-none ${s.bucket} ${s.text} border cursor-pointer`}
              onChange={(e) => handleScrollToSupervisor(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Jump to Supervisor...</option>
              {supervisors.map(sup => (
                <option key={sup.id} value={sup.id}>{sup.name} ({sup.role})</option>
              ))}
            </select>
          )}
          {viewMode === 'SHIFTS' && setCustomShifts && (
            <button
              onClick={() => setIsEditingShifts(!isEditingShifts)}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                isEditingShifts ? 'bg-blue-600 text-white shadow-sm' : `bg-black/5 dark:bg-white/5 ${s.text}`
              }`}
            >
              {isEditingShifts ? 'Done Editing' : 'Edit Shifts'}
            </button>
          )}
          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => { setViewMode('SHIFTS'); setIsEditingShifts(false); }}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                viewMode === 'SHIFTS' ? 'bg-white dark:bg-[#2D2D2D] shadow-sm text-blue-600' : `opacity-50 ${s.text}`
              }`}
            >
              Assign Shifts
            </button>
            <button
              onClick={() => { setViewMode('SUPERVISORS'); setIsEditingShifts(false); }}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                viewMode === 'SUPERVISORS' ? 'bg-white dark:bg-[#2D2D2D] shadow-sm text-blue-600' : `opacity-50 ${s.text}`
              }`}
            >
              Assign Supervisors
            </button>
          </div>
        </div>
      </div>

      {isEditingShifts && viewMode === 'SHIFTS' && (
        <div className={`p-6 rounded-[2rem] border ${s.card} shadow-xl mb-6`}>
          <div className="flex justify-between items-center mb-6">
            <h4 className={`text-sm font-black uppercase tracking-widest ${s.text}`}>Configure Dynamic Shifts</h4>
            <button onClick={handleAddShift} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Shift
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {shifts.map(shift => (
              <div key={shift.id} className={`p-4 rounded-2xl border ${s.bucket} flex flex-wrap gap-4 items-center`}>
                <input 
                  type="text" 
                  value={shift.label}
                  onChange={e => handleUpdateShift(shift.id, { label: e.target.value })}
                  className={`flex-1 px-4 py-2 rounded-xl border outline-none font-bold text-sm bg-transparent ${s.text}`}
                  placeholder="Shift Name & Time"
                />
                <input 
                  type="time" 
                  value={shift.startTime}
                  onChange={e => handleUpdateShift(shift.id, { startTime: e.target.value })}
                  className={`px-4 py-2 rounded-xl border outline-none font-bold text-sm bg-transparent ${s.text}`}
                />
                <span className={s.sub}>to</span>
                <input 
                  type="time" 
                  value={shift.endTime}
                  onChange={e => handleUpdateShift(shift.id, { endTime: e.target.value })}
                  className={`px-4 py-2 rounded-xl border outline-none font-bold text-sm bg-transparent ${s.text}`}
                />
                <button onClick={() => handleRemoveShift(shift.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Unassigned Pool */}
        <div className="lg:col-span-1 flex flex-col h-[600px]">
          <div className={`p-4 rounded-t-3xl border border-b-0 font-black uppercase tracking-widest text-xs flex items-center justify-between ${s.card} ${s.text}`}>
            <span>Unassigned Staff</span>
            <button onClick={handleAddUnassignedStaff} className="ml-2 p-1 bg-white/10 rounded-md hover:bg-white/20 transition-colors" title="Add Staff"><Plus className="w-4 h-4" /></button>
            <span className="bg-white/10 px-2 py-1 rounded-md">
              {viewMode === 'SHIFTS' 
                ? staff.filter(s => !s.currentShift).length 
                : staff.filter(s => !s.supervisorId && s.role !== UserRole.SUPERVISOR && s.role !== UserRole.ADMIN).length}
            </span>
          </div>
          <div 
            className={`flex-1 p-4 rounded-b-3xl border overflow-y-auto apple-scroll ${s.bucket}`}
            onDragOver={handleDragOver}
            onDrop={(e) => viewMode === 'SHIFTS' ? handleDropShift(e, 'UNASSIGNED') : handleDropSupervisor(e, 'UNASSIGNED')}
          >
            {viewMode === 'SHIFTS' 
              ? staff.filter(s => !s.currentShift).map(renderDraggableStaff)
              : staff.filter(s => !s.supervisorId && s.role !== UserRole.SUPERVISOR && s.role !== UserRole.ADMIN).map(renderDraggableStaff)
            }
            {((viewMode === 'SHIFTS' && staff.filter(s => !s.currentShift).length === 0) ||
              (viewMode === 'SUPERVISORS' && staff.filter(s => !s.supervisorId && s.role !== UserRole.SUPERVISOR && s.role !== UserRole.ADMIN).length === 0)) && (
              <div className={`h-full flex flex-col items-center justify-center opacity-40 ${s.sub}`}>
                <Users className="w-8 h-8 mb-2" />
                <span className="text-xs font-bold">All Staff Assigned</span>
              </div>
            )}
          </div>
        </div>

        {/* Buckets */}
        <div className={`lg:col-span-3 grid gap-6 h-[600px] overflow-y-auto apple-scroll pb-6 pr-2 ${shifts.length > 3 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
          {viewMode === 'SHIFTS' && shifts.map(shift => {
            const IconComponent = getIcon(shift.iconName);
            return (
            <div key={shift.id} className="flex flex-col h-[400px] lg:h-[600px]">
              <div className={`p-4 rounded-t-3xl border border-b-0 font-black uppercase tracking-widest text-xs flex items-center gap-2 ${s.card} ${s.text}`}>
                <IconComponent className={`w-4 h-4 ${shift.color || 'text-gray-500'}`} />
                <span className="flex-1">{shift.label}</span>
                <span className="bg-white/10 px-2 py-1 rounded-md text-[10px]">
                  {staff.filter(s => s.currentShift === shift.id).length}
                </span>
              </div>
              <div 
                className={`flex-1 p-4 rounded-b-3xl border overflow-y-auto apple-scroll ${s.bucket}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropShift(e, shift.id)}
              >
                {staff.filter(s => s.currentShift === shift.id).map(renderDraggableStaff)}
              </div>
            </div>
            );
          })}

          {viewMode === 'SUPERVISORS' && supervisors.map(sup => (
            <div key={sup.id} id={`sup-${sup.id}`} className="flex flex-col h-[400px] lg:h-[600px] scroll-mt-6">
              <div className={`p-4 rounded-t-3xl border border-b-0 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 ${s.card} ${s.text}`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <div className="flex-1 truncate">
                  {sup.name} <span className="opacity-50 text-[8px]">({sup.role})</span>
                </div>
                <span className="bg-white/10 px-2 py-1 rounded-md">
                  {staff.filter(s => s.supervisorId === sup.id).length}
                </span>
              </div>
              <div 
                className={`flex-1 p-4 rounded-b-3xl border overflow-y-auto apple-scroll ${s.bucket}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropSupervisor(e, sup.id)}
              >
                {staff.filter(s => s.supervisorId === sup.id).map(renderDraggableStaff)}
              </div>
            </div>
          ))}

          {viewMode === 'SUPERVISORS' && supervisors.length === 0 && (
            <div className={`col-span-full h-full flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-12 text-center ${s.card} ${s.sub}`}>
              <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
              <h3 className="text-lg font-black uppercase tracking-widest mb-2">No Supervisors Found</h3>
              <p className="text-xs font-medium max-w-md">
                Register a staff member with the "SUPERVISOR" role to enable hierarchy management and team assignments.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DutyRoster;
