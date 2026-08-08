import React, { useState, useMemo } from 'react';
import { StaffMember, ShiftRotation, Shift, UserRole, Theme } from '../types';
import { Search, Calendar, Users, AlertTriangle, Trash2, Filter } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SHIFTS: { id: Shift; label: string; color: string; bg: string }[] = [
  { id: 'MORNING', label: 'Morning (07:00 - 15:00)', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'EVENING', label: 'Evening (15:00 - 23:00)', color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 'NIGHT', label: 'Night (23:00 - 07:00)', color: 'text-red-500', bg: 'bg-red-500/10' }
];

interface RosterManagerProps {
  staffList: StaffMember[];
  rotations: ShiftRotation[];
  onAssignShift: (staffId: string, dayOfWeek: number, shift: Shift) => Promise<void>;
  onRemoveShift: (rotationId: string) => Promise<void>;
  theme: Theme;
  isAdmin: boolean;
  loggedInUserId?: string; // To check if they are a supervisor
}

const RosterManager: React.FC<RosterManagerProps> = ({
  staffList, rotations, onAssignShift, onRemoveShift, theme, isAdmin, loggedInUserId
}) => {
  const [draggedStaffId, setDraggedStaffId] = useState<string | null>(null);
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Styles
  const s = {
    bg: theme === 'light' ? 'bg-[#F5F5F7]' : 'bg-[#1C1C1E]',
    card: theme === 'light' ? 'bg-white border-[#E5E5EA]' : 'bg-[#2C2C2E] border-[#38383A]',
    text: theme === 'light' ? 'text-[#1D1D1F]' : 'text-[#F5F5F7]',
    sub: theme === 'light' ? 'text-[#86868B]' : 'text-[#98989D]',
    border: theme === 'light' ? 'border-[#E5E5EA]' : 'border-[#38383A]',
    hover: theme === 'light' ? 'hover:bg-black/5' : 'hover:bg-white/5',
  };

  // Departments
  const departments = useMemo(() => {
    const depts = new Set(staffList.map(s => s.department || 'Unassigned'));
    return ['ALL', ...Array.from(depts)];
  }, [staffList]);

  // Viewable Staff based on RBAC (Admin sees all, Supervisor sees only their assigned staff)
  const viewableStaff = useMemo(() => {
    if (isAdmin) return staffList;
    
    // If not admin, check if they are a supervisor
    const currentUser = staffList.find(s => s.id === loggedInUserId);
    if (currentUser?.role === UserRole.SUPERVISOR) {
      // Supervisor sees themselves and anyone assigned to them
      return staffList.filter(s => s.id === loggedInUserId || s.supervisorId === loggedInUserId);
    }
    
    // Regular staff only sees themselves (but they shouldn't even be here usually)
    return staffList.filter(s => s.id === loggedInUserId);
  }, [staffList, isAdmin, loggedInUserId]);

  const filteredStaff = viewableStaff.filter(s => 
    (filterDept === 'ALL' || (s.department || 'Unassigned') === filterDept) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.employeeId.includes(search))
  );

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, staffId: string) => {
    setDraggedStaffId(staffId);
    e.dataTransfer.setData('text/plain', staffId);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dayIndex: number, shiftId: Shift) => {
    e.preventDefault();
    const staffId = e.dataTransfer.getData('text/plain');
    if (!staffId) return;

    // VALIDATIONS
    // 1. Double Booking (Already assigned a shift this day)
    const hasShiftToday = rotations.some(r => r.staffId === staffId && r.dayOfWeek === dayIndex);
    if (hasShiftToday) {
      alert("Conflict: Staff member is already assigned to a shift on this day.");
      return;
    }

    // 2. Rest Violation (Assigning Morning after a Night shift)
    if (shiftId === 'MORNING' && dayIndex > 0) {
      const hadNightShift = rotations.some(r => r.staffId === staffId && r.dayOfWeek === dayIndex - 1 && r.shift === 'NIGHT');
      if (hadNightShift) {
        alert("Rest Violation: Cannot assign Morning shift immediately following a Night shift.");
        return;
      }
    }

    await onAssignShift(staffId, dayIndex, shiftId);
    setDraggedStaffId(null);
  };

  return (
    <div className="flex h-full flex-col lg:flex-row gap-6">
      
      {/* LEFT SIDEBAR - STAFF POOL */}
      <div className={`w-full lg:w-80 flex-shrink-0 flex flex-col rounded-3xl border ${s.card} overflow-hidden h-[800px]`}>
        <div className={`p-4 border-b ${s.border}`}>
          <h3 className={`font-black uppercase tracking-widest text-sm mb-4 ${s.text} flex items-center gap-2`}>
            <Users className="w-4 h-4" /> Personnel Pool
          </h3>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Search staff..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl text-sm font-medium border outline-none ${s.card} ${s.text} ${s.border}`}
            />
            <div className="relative">
              <Filter className={`w-4 h-4 absolute left-3 top-3 ${s.sub}`} />
              <select 
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm font-medium border outline-none appearance-none ${s.card} ${s.text} ${s.border}`}
              >
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredStaff.map(staff => {
            // Count total shifts this week
            const shiftCount = rotations.filter(r => r.staffId === staff.id).length;
            
            return (
              <div
                key={staff.id}
                draggable={isAdmin || staff.supervisorId === loggedInUserId || staff.id === loggedInUserId}
                onDragStart={(e) => handleDragStart(e, staff.id)}
                className={`p-3 rounded-xl border ${s.border} ${s.bg} cursor-grab active:cursor-grabbing hover:border-blue-500 transition-colors group relative`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className={`font-bold text-sm ${s.text}`}>{staff.name}</div>
                  <div className={`text-[10px] font-black px-2 py-1 rounded-full ${shiftCount > 5 ? 'bg-orange-500/20 text-orange-500' : 'bg-black/5 dark:bg-white/5'} ${s.text}`}>
                    {shiftCount} SHIFTS
                  </div>
                </div>
                <div className={`text-xs ${s.sub} flex items-center justify-between`}>
                  <span>{staff.department || 'General'}</span>
                  <span className="font-mono">{staff.employeeId}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN GRID - SCHEDULE */}
      <div className={`flex-1 rounded-3xl border ${s.card} overflow-hidden flex flex-col min-w-0`}>
        <div className={`p-4 border-b ${s.border} flex justify-between items-center`}>
          <h3 className={`font-black uppercase tracking-widest text-sm ${s.text} flex items-center gap-2`}>
            <Calendar className="w-4 h-4" /> Weekly Roster
          </h3>
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
             <span className="flex items-center gap-1 text-blue-500"><div className="w-2 h-2 rounded-full bg-blue-500"/> Morning</span>
             <span className="flex items-center gap-1 text-green-500"><div className="w-2 h-2 rounded-full bg-green-500"/> Evening</span>
             <span className="flex items-center gap-1 text-red-500"><div className="w-2 h-2 rounded-full bg-red-500"/> Night</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-4">
          <div className="min-w-[800px] border rounded-xl overflow-hidden shadow-inner border-[#38383A] dark:border-[#38383A]">
            {/* Header Row */}
            <div className="grid grid-cols-8 border-b border-[#38383A]">
              <div className="p-3 bg-black/5 dark:bg-white/5"></div>
              {DAYS.map(day => (
                <div key={day} className="p-3 text-center font-black uppercase tracking-widest text-xs border-l border-[#38383A] bg-black/5 dark:bg-white/5">
                  {day}
                </div>
              ))}
            </div>

            {/* Shift Rows */}
            {SHIFTS.map(shift => (
              <div key={shift.id} className="grid grid-cols-8 border-b last:border-0 border-[#38383A] group">
                
                {/* Row Header */}
                <div className="p-3 flex flex-col justify-center bg-black/5 dark:bg-white/5">
                  <div className={`font-black uppercase tracking-wider text-xs ${shift.color}`}>{shift.label.split(' ')[0]}</div>
                  <div className={`text-[10px] font-bold opacity-50`}>{shift.label.split(' ')[1]}</div>
                </div>

                {/* Days Columns */}
                {DAYS.map((_, dayIndex) => {
                  const cellRotations = rotations.filter(r => r.dayOfWeek === dayIndex && r.shift === shift.id);
                  const isUnderstaffed = cellRotations.length < 2; // Assuming min 2 staff per shift

                  return (
                    <div 
                      key={`${shift.id}-${dayIndex}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, dayIndex, shift.id)}
                      className={`p-2 min-h-[100px] border-l border-[#38383A] transition-colors relative ${draggedStaffId ? 'hover:bg-blue-500/10' : ''}`}
                    >
                      {/* Alert Icon */}
                      {isUnderstaffed && (
                        <div className="absolute top-1 right-1 text-orange-500 opacity-30 group-hover:opacity-100 transition-opacity" title="Understaffed (< 2)">
                          <AlertTriangle className="w-3 h-3" />
                        </div>
                      )}

                      <div className="flex flex-col gap-1 mt-3">
                        {cellRotations.map(rot => {
                          const staff = staffList.find(s => s.id === rot.staffId);
                          if (!staff) return null;
                          return (
                            <div key={rot.id} className={`group/item flex items-center justify-between p-2 rounded-lg ${shift.bg} ${shift.color} border border-current/20`}>
                              <div className="truncate text-[10px] font-bold uppercase tracking-wider">
                                {staff.name}
                              </div>
                              <button 
                                onClick={() => onRemoveShift(rot.id)}
                                className="opacity-0 group-hover/item:opacity-100 hover:text-red-500 transition-opacity p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default RosterManager;
