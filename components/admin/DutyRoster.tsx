import React, { useState } from 'react';
import { StaffMember, Theme, Shift, UserRole } from '../../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { Users, Sun, Sunset, Moon, GripVertical, ShieldCheck } from 'lucide-react';

interface DutyRosterProps {
  staff: StaffMember[];
  theme: Theme;
}

const DutyRoster: React.FC<DutyRosterProps> = ({ staff, theme }) => {
  const [viewMode, setViewMode] = useState<'SHIFTS' | 'SUPERVISORS'>('SHIFTS');
  
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
    hover: 'hover:bg-black/10'
  };

  const handleDragStart = (e: React.DragEvent, staffId: string) => {
    e.dataTransfer.setData('staffId', staffId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
  };

  const handleDropShift = async (e: React.DragEvent, shift: Shift | 'UNASSIGNED') => {
    e.preventDefault();
    const staffId = e.dataTransfer.getData('staffId');
    if (!staffId) return;

    try {
      const staffRef = doc(db, 'staff', staffId);
      if (shift === 'UNASSIGNED') {
        await updateDoc(staffRef, { currentShift: null });
      } else {
        await updateDoc(staffRef, { currentShift: shift });
      }
    } catch (error) {
      console.error("Error updating shift:", error);
    }
  };

  const handleDropSupervisor = async (e: React.DragEvent, supervisorId: string | 'UNASSIGNED') => {
    e.preventDefault();
    const staffId = e.dataTransfer.getData('staffId');
    if (!staffId || staffId === supervisorId) return; // Prevent assigning to self

    try {
      const staffRef = doc(db, 'staff', staffId);
      if (supervisorId === 'UNASSIGNED') {
        await updateDoc(staffRef, { supervisorId: null });
      } else {
        await updateDoc(staffRef, { supervisorId: supervisorId });
      }
    } catch (error) {
      console.error("Error updating supervisor:", error);
    }
  };

  const shifts: { id: Shift, label: string, icon: any, color: string }[] = [
    { id: 'MORNING', label: 'Morning (07:00 - 15:00)', icon: Sun, color: 'text-amber-500' },
    { id: 'EVENING', label: 'Evening (15:00 - 23:00)', icon: Sunset, color: 'text-orange-500' },
    { id: 'NIGHT', label: 'Night (23:00 - 07:00)', icon: Moon, color: 'text-indigo-500' }
  ];

  const supervisors = staff.filter(s => s.role === UserRole.SUPERVISOR || s.role === UserRole.ADMIN);
  
  const renderDraggableStaff = (member: StaffMember) => (
    <div
      key={member.id}
      draggable
      onDragStart={(e) => handleDragStart(e, member.id)}
      className={`p-3 mb-2 rounded-xl border flex items-center gap-3 cursor-grab active:cursor-grabbing transition-colors ${s.card} ${s.hover}`}
    >
      <GripVertical className={`w-4 h-4 ${s.sub}`} />
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-sm truncate ${s.text}`}>{member.name}</div>
        <div className={`text-[10px] font-black uppercase tracking-widest truncate ${s.sub}`}>
          {member.role} • {member.department || 'General'}
        </div>
      </div>
    </div>
  );

  const handleScrollToSupervisor = (supId: string) => {
    if (!supId) return;
    const el = document.getElementById(`sup-${supId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
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
          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('SHIFTS')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                viewMode === 'SHIFTS' ? 'bg-white dark:bg-[#2D2D2D] shadow-sm text-blue-600' : `opacity-50 ${s.text}`
              }`}
            >
              Assign Shifts
            </button>
            <button
              onClick={() => setViewMode('SUPERVISORS')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                viewMode === 'SUPERVISORS' ? 'bg-white dark:bg-[#2D2D2D] shadow-sm text-blue-600' : `opacity-50 ${s.text}`
              }`}
            >
              Assign Supervisors
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Unassigned Pool */}
        <div className="lg:col-span-1 flex flex-col h-[600px]">
          <div className={`p-4 rounded-t-3xl border border-b-0 font-black uppercase tracking-widest text-xs flex items-center justify-between ${s.card} ${s.text}`}>
            <span>Unassigned Staff</span>
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
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 h-[600px] overflow-y-auto apple-scroll pb-6 pr-2">
          {viewMode === 'SHIFTS' && shifts.map(shift => (
            <div key={shift.id} className="flex flex-col h-[400px] lg:h-[600px]">
              <div className={`p-4 rounded-t-3xl border border-b-0 font-black uppercase tracking-widest text-xs flex items-center gap-2 ${s.card} ${s.text}`}>
                <shift.icon className={`w-4 h-4 ${shift.color}`} />
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
          ))}

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
