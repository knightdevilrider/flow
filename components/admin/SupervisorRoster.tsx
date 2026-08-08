import React, { useState, useEffect } from 'react';
import { StaffMember, Post, RosterSchedule, ShiftConfig, UserRole } from '../../types';
import { generateRoster } from '../../lib/rosterEngine';
import { Calendar, Clock, MapPin, UserPlus, AlertCircle, CheckCircle, ShieldAlert, FileText, ChevronRight, Download } from 'lucide-react';

interface SupervisorRosterProps {
  staffList: StaffMember[];
  shifts: ShiftConfig[];
}

export const SupervisorRoster: React.FC<SupervisorRosterProps> = ({ staffList, shifts }) => {
  const [posts, setPosts] = useState<Post[]>([
    { id: 'gate1', name: 'Main Gate', type: 'Outside', requiredRole: UserRole.GATE, requiredHeadcount: 2 },
    { id: 'icu', name: 'ICU Entrance', type: 'Inside', requiredRole: UserRole.GATE, requiredHeadcount: 1 },
    { id: 'reception', name: 'Front Desk', type: 'Inside', requiredRole: UserRole.RECEPTION, requiredHeadcount: 2 }
  ]);
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [schedule, setSchedule] = useState<RosterSchedule | null>(null);
  const [isDraft, setIsDraft] = useState(true);
  
  // Post Management State
  const [showAddPost, setShowAddPost] = useState(false);
  const [newPost, setNewPost] = useState<Partial<Post>>({ type: 'Inside', requiredHeadcount: 1 });

  // Handle Generate
  const handleGenerate = () => {
    const newSchedule = generateRoster(selectedDate, staffList, posts, shifts);
    setSchedule(newSchedule);
    setIsDraft(true);
  };

  const handleAddPost = () => {
    if (newPost.name && newPost.requiredRole) {
      setPosts([...posts, { ...newPost, id: `post-${Date.now()}` } as Post]);
      setShowAddPost(false);
      setNewPost({ type: 'Inside', requiredHeadcount: 1 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-100 dark:border-white/5">
        <div>
          <h2 className="text-2xl font-bold dark:text-white mb-2">Auto-Roster Engine</h2>
          <p className="text-gray-500 dark:text-gray-400">Intelligent scheduling, leave detection, and shift rotation</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 dark:text-white"
          />
          <button
            onClick={handleGenerate}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            Generate Draft
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Posts Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-gray-100 dark:border-white/5 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                <MapPin size={20} className="text-blue-500" />
                Active Posts
              </h3>
              <button 
                onClick={() => setShowAddPost(!showAddPost)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 p-2 rounded-xl"
              >
                <UserPlus size={18} />
              </button>
            </div>

            {showAddPost && (
              <div className="mb-6 space-y-3 p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/5">
                <input
                  placeholder="Post Name"
                  className="w-full px-3 py-2 rounded-xl text-sm dark:bg-[#1C1C1E] dark:text-white border dark:border-white/10"
                  value={newPost.name || ''}
                  onChange={e => setNewPost({...newPost, name: e.target.value})}
                />
                <select
                  className="w-full px-3 py-2 rounded-xl text-sm dark:bg-[#1C1C1E] dark:text-white border dark:border-white/10"
                  value={newPost.type}
                  onChange={e => setNewPost({...newPost, type: e.target.value as 'Inside'|'Outside'})}
                >
                  <option value="Inside">Inside</option>
                  <option value="Outside">Outside</option>
                </select>
                <select
                  className="w-full px-3 py-2 rounded-xl text-sm dark:bg-[#1C1C1E] dark:text-white border dark:border-white/10"
                  value={newPost.requiredRole || ''}
                  onChange={e => setNewPost({...newPost, requiredRole: e.target.value as UserRole})}
                >
                  <option value="">Select Role</option>
                  {Object.values(UserRole).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <button onClick={handleAddPost} className="w-full py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold">
                  Add Post
                </button>
              </div>
            )}

            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="flex justify-between items-center p-3 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5">
                  <div>
                    <p className="font-bold text-sm dark:text-white">{post.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{post.type} • Need: {post.requiredHeadcount}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                    post.type === 'Outside' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                  }`}>
                    {post.type.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-3">
                  <Calendar className="text-blue-500" />
                  Roster for {new Date(selectedDate).toLocaleDateString()}
                  {schedule && (
                    <span className={`text-xs px-3 py-1 rounded-full ${isDraft ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'}`}>
                      {isDraft ? 'DRAFT' : 'PUBLISHED'}
                    </span>
                  )}
                </h3>
              </div>
              {schedule && isDraft && (
                <button
                  onClick={() => setIsDraft(false)}
                  className="px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm flex items-center gap-2"
                >
                  <CheckCircle size={16} /> Publish Roster
                </button>
              )}
            </div>

            {/* Matrix */}
            {!schedule ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                <FileText size={48} className="mb-4 opacity-20" />
                <p>Select a date and generate the draft roster.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
                      <th className="p-4 font-bold text-sm text-gray-500 dark:text-gray-400">Post</th>
                      <th className="p-4 font-bold text-sm text-gray-500 dark:text-gray-400">Shift</th>
                      <th className="p-4 font-bold text-sm text-gray-500 dark:text-gray-400">Assigned Staff</th>
                      <th className="p-4 font-bold text-sm text-gray-500 dark:text-gray-400">Status</th>
                      <th className="p-4 font-bold text-sm text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {posts.map(post => (
                      <React.Fragment key={post.id}>
                        {shifts.map(shift => {
                          const assignments = schedule.assignments.filter(a => a.postId === post.id && a.shiftId === shift.id);
                          const isMissing = assignments.length < post.requiredHeadcount;
                          
                          return (
                            <tr key={`${post.id}-${shift.id}`} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                              <td className="p-4">
                                <div className="font-bold dark:text-white">{post.name}</div>
                                <div className="text-xs text-gray-500">{post.type}</div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2 text-sm font-medium dark:text-white">
                                  <Clock size={14} className="text-blue-500" />
                                  {shift.label}
                                </div>
                              </td>
                              <td className="p-4">
                                {assignments.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {assignments.map(a => {
                                      const s = staffList.find(st => st.id === a.staffId);
                                      return (
                                        <div key={a.staffId} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                                          a.status === 'Leave' 
                                            ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-500/30' 
                                            : 'bg-white border-gray-200 dark:bg-[#1C1C1E] dark:border-white/10'
                                        }`}>
                                          <div className={`w-2 h-2 rounded-full ${a.status === 'Leave' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                          <span className={`text-sm font-bold ${a.status === 'Leave' ? 'text-red-700 dark:text-red-400' : 'dark:text-white'}`}>
                                            {s?.name || 'Unknown'}
                                          </span>
                                          {a.isOfflineUser && (
                                            <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 rounded text-gray-600 dark:text-gray-300">Offline</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400 italic">No assignments</span>
                                )}
                              </td>
                              <td className="p-4">
                                {isMissing ? (
                                  <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-lg w-max">
                                    <ShieldAlert size={14} /> Gap Detected
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                                    Covered
                                  </span>
                                )}
                              </td>
                              <td className="p-4">
                                {isMissing && (
                                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                    Find Substitute
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                    {/* Standby Staff */}
                    <tr className="bg-gray-50/50 dark:bg-black/10">
                      <td className="p-4 font-bold text-gray-600 dark:text-gray-300">Standby / Float</td>
                      <td colSpan={4} className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {schedule.assignments.filter(a => a.postId === 'standby').map(a => {
                            const s = staffList.find(st => st.id === a.staffId);
                            return (
                              <div key={a.staffId} className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm dark:text-white">
                                {s?.name} ({a.shiftId})
                              </div>
                            );
                          })}
                          {schedule.assignments.filter(a => a.postId === 'standby').length === 0 && (
                            <span className="text-sm text-gray-400 italic">No floaters available</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Leaves / Holidays */}
                    <tr className="bg-red-50/30 dark:bg-red-900/10">
                      <td className="p-4 font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle size={16} /> On Leave / Off
                      </td>
                      <td colSpan={4} className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {schedule.assignments.filter(a => a.status === 'Leave').map(a => {
                            const s = staffList.find(st => st.id === a.staffId);
                            return (
                              <div key={a.staffId} className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-500/20 bg-white dark:bg-[#1C1C1E] text-sm text-red-700 dark:text-red-400 line-through opacity-70">
                                {s?.name}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
