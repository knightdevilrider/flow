import React, { useState } from 'react';
import { UserRole, StaffMember, Theme } from '../../types';
import { GripVertical, Users } from 'lucide-react';

interface RoleManagementBoardProps {
  staff: StaffMember[];
  onUpdateRole: (staffId: string, newRole: UserRole) => void;
  theme: Theme;
}

export const RoleManagementBoard: React.FC<RoleManagementBoardProps> = ({ staff, onUpdateRole, theme }) => {
  const [draggedStaffId, setDraggedStaffId] = useState<string | null>(null);
  
  const isDark = theme === 'dark' || theme === 'titanium';
  const ROLES = Object.values(UserRole).filter(r => r !== UserRole.PUBLIC && r !== UserRole.UNASSIGNED); // Exclude public and unassigned from columns

  const s = isDark ? {
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

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedStaffId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Slight delay to allow the drag image to generate before changing opacity
    setTimeout(() => {
      const el = document.getElementById(`staff-card-${id}`);
      if (el) el.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent, id: string) => {
    setDraggedStaffId(null);
    const el = document.getElementById(`staff-card-${id}`);
    if (el) el.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, role: UserRole) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id && id !== '') {
      const targetStaff = staff.find(st => st.id === id);
      if (targetStaff && targetStaff.role !== role) {
        onUpdateRole(id, role);
      }
    }
    setDraggedStaffId(null);
  };

  const staffByRole = ROLES.reduce((acc, role) => {
    acc[role] = staff.filter(st => st.role === role);
    return acc;
  }, {} as Record<string, StaffMember[]>);

  const formatRoleName = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const renderDraggableStaff = (member: StaffMember) => (
    <div
      key={member.id}
      id={`staff-card-${member.id}`}
      draggable
      onDragStart={(e) => handleDragStart(e, member.id)}
      onDragEnd={(e) => handleDragEnd(e, member.id)}
      className={`p-3 rounded-xl border flex items-center gap-3 cursor-grab active:cursor-grabbing transition-colors ${s.card} ${s.hover}`}
    >
      <GripVertical className={`w-4 h-4 ${s.sub}`} />
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-sm truncate ${s.text}`}>{member.name}</div>
        <div className={`text-[10px] font-black uppercase tracking-widest truncate ${s.sub}`}>
          {formatRoleName(member.role)} • {member.employeeId}
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Unassigned Pool (All Staff) */}
      <div 
        className="lg:col-span-1 flex flex-col h-[600px]"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, UserRole.UNASSIGNED)}
      >
        <div className={`p-4 rounded-t-3xl border border-b-0 font-black uppercase tracking-widest text-xs flex items-center justify-between ${s.card} ${s.text}`}>
          <span>Staff Directory</span>
          <span className="bg-white/10 px-2 py-1 rounded-md">
            {staff.filter(st => st.role === UserRole.UNASSIGNED).length}
          </span>
        </div>
        <div 
          className={`flex-1 p-4 rounded-b-3xl border border-t-0 overflow-y-auto custom-scrollbar space-y-2 ${s.card} ${
            draggedStaffId ? (isDark ? 'bg-white/5' : 'bg-black/5') : ''
          }`}
        >
          {staff.filter(st => st.role === UserRole.UNASSIGNED).map(st => renderDraggableStaff(st))}
          
          {draggedStaffId && staff.filter(st => st.role === UserRole.UNASSIGNED).length === 0 && (
            <div className={`border-2 border-dashed rounded-xl py-8 text-center mt-2 ${isDark ? 'border-white/10 text-white/30' : 'border-black/10 text-black/30'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest">Drop to Unassign</span>
            </div>
          )}
        </div>
      </div>

      {/* Roles Columns (Horizontal scroll) */}
      <div className="lg:col-span-3 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {ROLES.map(role => {
          const isDragTarget = draggedStaffId !== null;
          
          return (
            <div 
              key={role} 
              className="min-w-[300px] flex-1 flex flex-col h-[600px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, role)}
            >
              <div className={`p-4 rounded-t-3xl border border-b-0 font-black uppercase tracking-widest text-xs flex items-center justify-between ${s.card} ${s.text}`}>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>{formatRoleName(role)}</span>
                </div>
                <span className="bg-white/10 px-2 py-1 rounded-md">
                  {staffByRole[role].length}
                </span>
              </div>
              <div 
                className={`flex-1 p-4 rounded-b-3xl border border-t-0 overflow-y-auto custom-scrollbar space-y-2 transition-colors ${
                  s.card
                } ${isDragTarget ? (isDark ? 'bg-white/5 border-emerald-500/30' : 'bg-black/5 border-emerald-500/30') : ''}`}
              >
                {staffByRole[role].map(st => renderDraggableStaff(st))}
                
                {isDragTarget && staffByRole[role].length === 0 && (
                  <div className={`border-2 border-dashed rounded-xl py-8 text-center mt-2 ${isDark ? 'border-white/10 text-white/30' : 'border-black/10 text-black/30'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">Drop to Assign</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};