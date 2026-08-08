import { StaffMember, Post, RosterSchedule, ShiftConfig } from '../../types';

export const generateRoster = (
  dateStr: string,
  staffList: StaffMember[],
  posts: Post[],
  shifts: ShiftConfig[]
): RosterSchedule => {
  const assignments: RosterSchedule['assignments'] = [];
  const targetDate = new Date(dateStr);
  const msInDay = 24 * 60 * 60 * 1000;
  
  const postNeeds: Record<string, Record<string, number>> = {};
  posts.forEach(p => {
    postNeeds[p.id] = {};
    shifts.forEach(s => {
      postNeeds[p.id][s.id] = p.requiredHeadcount || 1;
    });
  });

  const availableStaff = staffList.filter(s => 
    posts.some(p => p.requiredRole === s.role)
  );

  availableStaff.forEach(staff => {
    let assignedShiftId = 'MORNING';
    let isHoliday = false;

    if (staff.rotationPattern === 'Morning-Night' && staff.lastWeeklyOff) {
      const daysSinceOff = Math.floor((targetDate.getTime() - staff.lastWeeklyOff) / msInDay);
      if (daysSinceOff % 7 === 0 && daysSinceOff > 0) {
        isHoliday = true;
      } else {
        const cycle = Math.floor(daysSinceOff / 7);
        assignedShiftId = (cycle % 2 === 0) ? 'MORNING' : 'NIGHT';
      }
    } else if (staff.rotationPattern?.startsWith('Fixed-')) {
      const fixed = staff.rotationPattern.split('-')[1].toUpperCase();
      assignedShiftId = fixed;
      if (staff.lastWeeklyOff) {
        const daysSinceOff = Math.floor((targetDate.getTime() - staff.lastWeeklyOff) / msInDay);
        if (daysSinceOff % 7 === 0 && daysSinceOff > 0) {
          isHoliday = true;
        }
      }
    }

    if (isHoliday) {
      assignments.push({
        staffId: staff.id,
        postId: 'holiday',
        shiftId: 'NONE',
        status: 'Leave',
        isOfflineUser: !staff.hasAppAccess
      });
      return;
    }

    let assignedPost = null;
    for (const post of posts) {
      if (post.requiredRole === staff.role && postNeeds[post.id][assignedShiftId] > 0) {
        assignedPost = post;
        postNeeds[post.id][assignedShiftId]--;
        break;
      }
    }

    if (assignedPost) {
      assignments.push({
        staffId: staff.id,
        postId: assignedPost.id,
        shiftId: assignedShiftId,
        status: 'Present',
        isOfflineUser: !staff.hasAppAccess
      });
    } else {
      assignments.push({
        staffId: staff.id,
        postId: 'standby',
        shiftId: assignedShiftId,
        status: 'Present',
        isOfflineUser: !staff.hasAppAccess
      });
    }
  });

  return {
    id: ROSTER- + dateStr,
    date: dateStr,
    status: 'Draft',
    assignments,
    generatedAt: Date.now()
  };
};
