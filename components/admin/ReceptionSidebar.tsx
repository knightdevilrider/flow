import React, { useState } from 'react';
import { 
  BedDouble, Stethoscope, IndianRupee, BellRing, Activity, UserMinus, Star, Crown, 
  CalendarDays, FileCheck, FileWarning, Search, Zap, ScanLine, Ticket, MessageSquare, 
  Mic, Ambulance, UserX, Clock, CreditCard, ChevronRight
} from 'lucide-react';
import { Patient, PatientStatus, Theme, Doctor } from '../../types';

interface ReceptionSidebarProps {
  patients: Patient[];
  doctors: Doctor[];
  theme: Theme;
}

type TabType = 'dashboard' | 'tasks' | 'comms' | 'tools';

export const ReceptionSidebar: React.FC<ReceptionSidebarProps> = ({ patients, doctors, theme }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const s = {
    card: theme === 'light' ? 'bg-white border-[#D2D2D7]' : 'bg-[#1D1D1F] border-[#333]',
    bg: theme === 'light' ? 'bg-[#F5F5F7]' : 'bg-[#2D2D2D]',
    text: theme === 'light' ? 'text-[#1D1D1F]' : 'text-white',
    sub: theme === 'light' ? 'text-[#86868b]' : 'text-[#86868b]',
    border: theme === 'light' ? 'border-[#D2D2D7]' : 'border-[#444]',
    accent: theme === 'light' ? 'bg-[#0071e3] text-white' : 'bg-[#0A84FF] text-white',
    accentText: theme === 'light' ? 'text-[#0071e3]' : 'text-[#0A84FF]',
    hover: theme === 'light' ? 'hover:bg-[#E8E8ED]' : 'hover:bg-[#3D3D3D]',
    tabActive: theme === 'light' ? 'bg-white shadow-sm text-[#1D1D1F]' : 'bg-[#3D3D3D] shadow-sm text-white',
    tabInactive: theme === 'light' ? 'text-[#86868b] hover:text-[#1D1D1F]' : 'text-[#86868b] hover:text-white',
  };

  // Calculated Stats
  const settledPatients = patients.filter(p => p.status === PatientStatus.PAYMENT_DONE);
  const totalRevenue = settledPatients.length * 500; // Mock 500 per consultation
  
  // Doctor Loads
  const doctorLoads = doctors.map(doc => {
    const queueLength = patients.filter(p => p.assignedDoctorId === doc.id && p.status !== PatientStatus.PAYMENT_DONE && p.status !== PatientStatus.PHARMACY_DONE).length;
    return { ...doc, queueLength };
  });

  return (
    <div className={`h-[calc(100vh-8rem)] flex flex-col space-y-6`}>
      
      {/* Tabs */}
      <div className={`p-1 flex rounded-xl border ${s.bg} ${s.border}`}>
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'tasks', label: 'Tasks' },
          { id: 'comms', label: 'Comms' },
          { id: 'tools', label: 'Tools' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex-1 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === tab.id ? s.tabActive : s.tabInactive
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-10 custom-scrollbar pr-2">
        
        {/* ===================== DASHBOARD TAB ===================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Live Bed Status */}
            <section className={`p-4 rounded-2xl border ${s.card} ${s.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <BedDouble className={`w-4 h-4 ${s.accentText}`} />
                <h3 className={`text-[10px] font-black uppercase tracking-widest ${s.text}`}>Live Bed Status</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[{ label: 'ICU', avail: 2, total: 10, color: 'text-red-500' },
                  { label: 'General', avail: 15, total: 50, color: 'text-emerald-500' },
                  { label: 'Private', avail: 1, total: 8, color: 'text-amber-500' }
                ].map(b => (
                  <div key={b.label} className={`p-2 rounded-xl text-center border ${s.bg} ${s.border}`}>
                    <div className={`text-lg font-black ${b.color}`}>{b.avail}</div>
                    <div className={`text-[8px] font-bold uppercase tracking-tighter ${s.sub}`}>{b.label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Doctor Duty Roster */}
            <section className={`p-4 rounded-2xl border ${s.card} ${s.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className={`w-4 h-4 ${s.accentText}`} />
                  <h3 className={`text-[10px] font-black uppercase tracking-widest ${s.text}`}>Doctor Duty Roster</h3>
                </div>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div className="space-y-2">
                {doctorLoads.map(doc => (
                  <div key={doc.id} className={`flex items-center justify-between p-2 rounded-xl border ${s.bg} ${s.border}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${doc.queueLength > 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <div className={`text-[10px] font-black ${s.text}`}>{doc.name}</div>
                    </div>
                    <div className={`text-[9px] font-bold ${s.sub}`}>{doc.queueLength} in Queue</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Shift Revenue */}
            <section className={`p-4 rounded-2xl border ${s.card} ${s.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <IndianRupee className={`w-4 h-4 text-emerald-500`} />
                <h3 className={`text-[10px] font-black uppercase tracking-widest ${s.text}`}>Shift Revenue</h3>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between bg-emerald-500/10 border-emerald-500/20`}>
                <div>
                  <div className={`text-[8px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400`}>Total Cash</div>
                  <div className={`text-xl font-black text-emerald-600 dark:text-emerald-400`}>₹{totalRevenue.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className={`text-[8px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70`}>UPI/Card</div>
                  <div className={`text-sm font-black text-emerald-600/70 dark:text-emerald-400/70`}>₹{(totalRevenue * 0.4).toLocaleString()}</div>
                </div>
              </div>
            </section>

            {/* Live Alerts & Bottlenecks */}
            <section className={`p-4 rounded-2xl border ${s.card} ${s.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <BellRing className={`w-4 h-4 text-amber-500`} />
                <h3 className={`text-[10px] font-black uppercase tracking-widest ${s.text}`}>Alerts & Bottlenecks</h3>
              </div>
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-2 border border-amber-500/20">
                  <Activity className="w-3 h-3" /> Pharmacy queue exceeds 15 mins
                </div>
                <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold flex items-center gap-2 border border-red-500/20">
                  <Ambulance className="w-3 h-3" /> Emergency Patient ETA: 4 mins
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ===================== TASKS TAB ===================== */}
        {activeTab === 'tasks' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Actionable Lists */}
            {[
              { icon: UserMinus, label: 'Pending Discharges', count: 4, color: 'text-purple-500', bg: 'bg-purple-500/20' },
              { icon: Crown, label: 'VIP Watchlist', count: 1, color: 'text-amber-500', bg: 'bg-amber-500/20' },
              { icon: CalendarDays, label: 'Expected Follow-ups', count: 12, color: 'text-blue-500', bg: 'bg-blue-500/20' },
              { icon: FileCheck, label: 'Live Insurance Approvals', count: 3, color: 'text-emerald-500', bg: 'bg-emerald-500/20' },
              { icon: FileWarning, label: 'Missing Documents', count: 5, color: 'text-red-500', bg: 'bg-red-500/20' },
              { icon: CreditCard, label: 'Pending Dues Alerts', count: 2, color: 'text-rose-500', bg: 'bg-rose-500/20' },
              { icon: UserX, label: 'No-Show Manager', count: 0, color: 'text-gray-500', bg: 'bg-gray-500/20' }
            ].map((task, i) => (
              <button key={i} className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${s.card} ${s.border} ${s.hover}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${task.color} ${task.bg}`}>
                    <task.icon className={`w-4 h-4`} />
                  </div>
                  <span className={`text-[11px] font-black uppercase tracking-wider ${s.text}`}>{task.label}</span>
                </div>
                {task.count > 0 && (
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black ${task.color} ${task.bg}`}>
                    {task.count} pending
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ===================== COMMS TAB ===================== */}
        {activeTab === 'comms' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <section className={`p-4 rounded-2xl border ${s.card} ${s.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <Mic className={`w-4 h-4 text-red-500`} />
                <h3 className={`text-[10px] font-black uppercase tracking-widest ${s.text}`}>PA Announcement</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className={`p-2 rounded-lg border text-[9px] font-black uppercase transition-all ${s.bg} ${s.border} ${s.hover} ${s.text}`}>Call Next Token</button>
                <button className={`p-2 rounded-lg border text-[9px] font-black uppercase transition-all ${s.bg} ${s.border} ${s.hover} ${s.text}`}>Call Emergency</button>
              </div>
            </section>

            <section className={`p-4 rounded-2xl border ${s.card} ${s.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Ambulance className={`w-4 h-4 text-rose-500`} />
                  <h3 className={`text-[10px] font-black uppercase tracking-widest ${s.text}`}>Ambulance Tracker</h3>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold">
                  <span className="text-rose-500">MH-14 AB 1234 (Trauma)</span>
                  <span className={`${s.text}`}>4 mins</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </section>
            
            <section className={`p-4 rounded-2xl border ${s.card} ${s.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <Star className={`w-4 h-4 text-amber-400`} />
                <h3 className={`text-[10px] font-black uppercase tracking-widest ${s.text}`}>Live Patient Feedback</h3>
              </div>
              <div className={`p-2 rounded-lg border flex items-center justify-between ${s.bg} ${s.border}`}>
                <div className={`text-[10px] font-bold ${s.text}`}>Overall Rating</div>
                <div className="flex text-amber-400">★★★★☆</div>
              </div>
            </section>
          </div>
        )}

        {/* ===================== TOOLS TAB ===================== */}
        {activeTab === 'tools' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <section className={`p-4 rounded-2xl border ${s.card} ${s.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <Search className={`w-4 h-4 ${s.accentText}`} />
                <h3 className={`text-[10px] font-black uppercase tracking-widest ${s.text}`}>Universal Search</h3>
              </div>
              <input type="text" placeholder="ABHA ID, Phone, Reg No..." className={`w-full p-3 rounded-xl font-bold outline-none border transition-all ${s.bg} ${s.border} ${s.text} focus:ring-2 focus:ring-[#0071e3]/20`} />
            </section>

            <div className="grid grid-cols-2 gap-3">
              <button className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${s.card} ${s.border} hover:border-[#0A84FF] hover:bg-[#0A84FF]/5`}>
                <Zap className="w-6 h-6 text-amber-500" />
                <span className={`text-[9px] font-black uppercase text-center ${s.text}`}>Direct Walk-in<br/>Register</span>
              </button>
              <button className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${s.card} ${s.border} hover:border-red-500 hover:bg-red-500/5`}>
                <Activity className="w-6 h-6 text-red-500" />
                <span className={`text-[9px] font-black uppercase text-center ${s.text}`}>Trigger Code Blue<br/>(Emergency)</span>
              </button>
              <button className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${s.card} ${s.border} hover:border-blue-500 hover:bg-blue-500/5`}>
                <ScanLine className="w-6 h-6 text-blue-500" />
                <span className={`text-[9px] font-black uppercase text-center ${s.text}`}>Scan<br/>Documents</span>
              </button>
              <button className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${s.card} ${s.border} hover:border-purple-500 hover:bg-purple-500/5`}>
                <Ticket className="w-6 h-6 text-purple-500" />
                <span className={`text-[9px] font-black uppercase text-center ${s.text}`}>Print Visitor<br/>Pass</span>
              </button>
            </div>

            <section className={`p-4 rounded-2xl border ${s.card} ${s.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${s.accentText}`} />
                  <h3 className={`text-[10px] font-black uppercase tracking-widest ${s.text}`}>Recent History</h3>
                </div>
              </div>
              <div className="space-y-2">
                {patients.slice(0, 3).map((p, i) => (
                  <div key={i} className={`flex items-center justify-between p-2 rounded-lg border ${s.bg} ${s.border}`}>
                    <div className={`text-[10px] font-bold ${s.text}`}>{p.name}</div>
                    <ChevronRight className={`w-3 h-3 ${s.sub}`} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
