import React, { useState } from 'react';
import { UserRole, Patient, PatientStatus, Theme } from '../types';
import { mockFirestore } from '../services/mockFirestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, UserPlus, FileCheck, Stethoscope, Syringe, 
  Pill, FlaskConical, Radio, Package, Bed, 
  Receipt, Users, Lock, ChevronRight, Activity, Zap, Server, Settings, Sun, Moon, ArrowRight,
  MonitorPlay,
  ListTodo,
  UserCheck
} from 'lucide-react';

interface MainDashboardProps {
  onRoleSelect: (role: UserRole, subView?: string) => void;
  patients: Patient[];
  theme: Theme;
  onThemeToggle: () => void;
  onSettings: () => void;
  isAdmin?: boolean;
}

const MainDashboard: React.FC<MainDashboardProps> = ({ onRoleSelect, patients, theme, onThemeToggle, onSettings, isAdmin }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const getCount = (status: PatientStatus | PatientStatus[]) => {
    if (Array.isArray(status)) {
      return patients.filter(p => status.includes(p.status)).length;
    }
    return patients.filter(p => p.status === status).length;
  };

  const FLOW_STAGES = [
    { label: 'Gate Entry', status: [PatientStatus.GATE_REGISTERED], dotColor: 'bg-blue-400', subView: 'reception' },
    { label: 'Reception', status: [PatientStatus.RECEPTION_WAITING, PatientStatus.PAYMENT_DONE], dotColor: 'bg-indigo-400', subView: 'reception' },
    { label: 'Check In', status: [PatientStatus.CHECKIN_WAITING], dotColor: 'bg-pink-400', subView: 'checkin' },
    { label: 'Doctor', status: [PatientStatus.DOCTOR_WAITING, PatientStatus.CONSULTATION_DONE], dotColor: 'bg-red-400', subView: 'doctor' },
    { label: 'Treatment', status: [PatientStatus.TREATMENT], dotColor: 'bg-yellow-400', subView: 'treatment' },
    { label: 'Pharmacy', status: [PatientStatus.MEDICINE_WAITING], dotColor: 'bg-orange-400', subView: 'medical' },
    { label: 'Ward', status: [PatientStatus.ADMISSION_DESK, PatientStatus.WARD_ADMITTED, PatientStatus.ICU_ADMITTED], dotColor: 'bg-purple-400', subView: 'ward' },
    { label: 'Complete', status: [PatientStatus.COMPLETED, PatientStatus.DISCHARGED], dotColor: 'bg-emerald-400', subView: 'ward' },
  ];

  const themeStyles = {
    light: {
      bg: 'bg-[#F5F5F7]',
      orb1: 'bg-blue-400/20',
      orb2: 'bg-purple-400/20',
      card: 'bg-white/70 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)]',
      cardHeader: 'border-b border-black/5',
      btn: 'bg-white hover:bg-slate-50 border-slate-200 text-[#1D1D1F] shadow-sm hover:shadow-md hover:border-[#0071e3]/30',
      accent: 'text-[#0071e3]',
      sub: 'text-[#86868b]',
      header: 'text-[#1D1D1F]',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      mobileBar: 'bg-white/80 border-b border-[#D2D2D7]',
      drawer: 'bg-white/95 backdrop-blur-xl border-r border-[#D2D2D7]',
      chartBg: 'bg-slate-100',
      chartFill: 'bg-[#0071e3]'
    },
    dark: {
      bg: 'bg-[#000000]',
      orb1: 'bg-blue-600/20',
      orb2: 'bg-purple-600/20',
      card: 'bg-[#111111]/80 backdrop-blur-3xl border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)]',
      cardHeader: 'border-b border-white/5',
      btn: 'bg-white/5 hover:bg-white/10 border-white/10 text-white shadow-sm hover:shadow-[0_0_20px_rgba(10,132,255,0.2)] hover:border-[#0A84FF]/50',
      accent: 'text-[#0A84FF]',
      sub: 'text-[#86868b]',
      header: 'text-white',
      iconBg: 'bg-white/10',
      iconColor: 'text-white/80',
      mobileBar: 'bg-black/80 border-b border-white/10',
      drawer: 'bg-black/95 backdrop-blur-xl border-r border-white/10',
      chartBg: 'bg-white/5',
      chartFill: 'bg-[#0A84FF]'
    },
    titanium: {
      bg: 'bg-[#1A1A1A]',
      orb1: 'bg-blue-500/10',
      orb2: 'bg-emerald-500/10',
      card: 'bg-[#252525]/90 backdrop-blur-3xl border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)]',
      cardHeader: 'border-b border-white/5',
      btn: 'bg-[#333333] hover:bg-[#444444] border-[#555555] text-white shadow-sm hover:shadow-md hover:border-[#0A84FF]/40',
      accent: 'text-[#0A84FF]',
      sub: 'text-[#A1A1A6]',
      header: 'text-[#E8E8ED]',
      iconBg: 'bg-[#444]',
      iconColor: 'text-[#ccc]',
      mobileBar: 'bg-[#3D3D3D]/80 border-b border-[#4D4D4D]',
      drawer: 'bg-[#4D4D4D]/95 backdrop-blur-xl border-r border-[#5D5D5D]',
      chartBg: 'bg-[#333]',
      chartFill: 'bg-[#0A84FF]'
    }
  };

  const s = themeStyles[theme];

  const StaffPortalButton = ({ role, label, icon: Icon }: { role: UserRole, label: string, icon: any }) => (
    <button 
      onClick={() => onRoleSelect(role)}
      className={`w-full flex items-center justify-between p-4 sm:p-5 rounded-[2rem] border transition-all duration-300 group ${s.btn}`}
    >
      <div className="flex items-center gap-4 sm:gap-5">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${s.iconBg} group-hover:scale-110 group-hover:bg-[#0A84FF]/10 group-hover:text-[#0A84FF]`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${s.iconColor} group-hover:text-[#0A84FF] transition-colors`} />
        </div>
        <span className={`text-xs sm:text-sm md:text-base font-black uppercase tracking-widest group-hover:translate-x-2 transition-transform duration-300 ${s.header}`}>{label}</span>
      </div>
      <ArrowRight className={`w-5 h-5 sm:w-6 sm:h-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ${s.accent}`} />
    </button>
  );

  const PublicBoardButton = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
    <button 
      onClick={() => onRoleSelect(UserRole.PUBLIC, id)}
      className={`w-full flex items-center justify-between p-4 sm:p-5 rounded-[2rem] border transition-all duration-300 group ${s.btn}`}
    >
      <div className="flex items-center gap-4 sm:gap-5">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${s.iconBg} group-hover:scale-110 group-hover:bg-[#0A84FF]/10 group-hover:text-[#0A84FF]`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${s.iconColor} group-hover:text-[#0A84FF] transition-colors`} />
        </div>
        <span className={`text-xs sm:text-sm md:text-base font-black uppercase tracking-widest group-hover:translate-x-2 transition-transform duration-300 ${s.header}`}>{label}</span>
      </div>
      <MonitorPlay className={`w-5 h-5 sm:w-6 sm:h-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ${s.accent}`} />
    </button>
  );

  return (
    <div className={`min-h-screen w-full flex flex-col relative overflow-hidden ${s.bg}`}>
      {/* Ambient Background Orbs */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none ${s.orb1}`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none ${s.orb2}`}></div>

      {/* Mobile Top Bar */}
      <div className={`xl:hidden fixed top-0 left-0 right-0 z-[60] h-16 flex items-center justify-between px-6 backdrop-blur-xl shadow-lg ${s.mobileBar}`}>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className={`w-10 h-10 rounded-[1.5rem] flex items-center justify-center transition-all active:scale-90 border ${s.btn}`}
        >
          <div className="flex flex-col gap-1.5 items-center">
            <div className={`w-5 h-0.5 rounded-full ${theme === 'light' ? 'bg-black' : 'bg-white'}`}></div>
            <div className={`w-3 h-0.5 rounded-full ${theme === 'light' ? 'bg-black' : 'bg-white'} -ml-2`}></div>
          </div>
        </button>
        <span className={`text-sm font-black uppercase tracking-widest ${s.header}`}>HospitalFlow</span>
        <button onClick={onThemeToggle} className={`w-10 h-10 rounded-[1.5rem] flex items-center justify-center border ${s.btn}`}>
           {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] xl:hidden"
            />
            <motion.div 
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.05}
              onDragEnd={(_, info) => {
                if (info.offset.x < -50 || info.velocity.x < -500) {
                  setIsDrawerOpen(false);
                }
              }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 left-0 bottom-0 w-[280px] z-[80] xl:hidden shadow-2xl flex flex-col cursor-grab active:cursor-grabbing ${s.drawer}`}
            >
              <div className={`p-8 border-b flex items-center justify-between gap-4 ${s.cardHeader}`}>
                <div>
                  <h3 className={`text-xl font-black tracking-tighter uppercase ${s.accent}`}>Menu</h3>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 apple-scroll">
                <StaffPortalButton role={UserRole.GATE} label="Gate Security" icon={Shield} />
                <StaffPortalButton role={UserRole.RECEPTION} label="Admission Desk" icon={UserPlus} />
                <StaffPortalButton role={UserRole.CHECKIN} label="Check In" icon={FileCheck} />
                <StaffPortalButton role={UserRole.DOCTOR} label="Doctor Portal" icon={Stethoscope} />
                <StaffPortalButton role={UserRole.MEDICAL} label="Treatment Station" icon={Syringe} />
                <StaffPortalButton role={UserRole.PHARMACY} label="Pharmacy & Billing" icon={Pill} />
                <StaffPortalButton role={UserRole.WARD_CARE} label="Ward Management" icon={Bed} />
                {isAdmin && <StaffPortalButton role={UserRole.ADMIN} label="Admin Console" icon={Lock} />}
                
                <div className="mt-8 mb-4 px-2">
                  <h3 className={`text-xs font-black uppercase tracking-widest opacity-50 ${s.sub}`}>Public Boards</h3>
                </div>
                <PublicBoardButton id="reception" label="Reception" icon={MonitorPlay} />
                <PublicBoardButton id="checkin" label="Check In" icon={MonitorPlay} />
                <PublicBoardButton id="doctor" label="Doctor" icon={MonitorPlay} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 pt-24 xl:pt-12 pb-24 relative z-10">
        
        {/* Header Section */}
        <header className="w-full flex flex-col xl:flex-row items-center justify-between mb-12 gap-8">
          <div className="flex flex-col items-center xl:items-start text-center xl:text-left">
            <h1 className={`text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-none mb-2 ${s.header}`}>
              Hospital<span className={s.accent}>Flow</span>
            </h1>
            <p className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] ${s.sub}`}>
              Intelligent EMR Logistics & Throughput Engine
            </p>
          </div>

          {/* Desktop Controls */}
          <div className="hidden xl:flex items-center gap-4">
            <button 
              onClick={onSettings}
              className={`px-6 py-4 rounded-[2rem] border transition-all flex items-center gap-3 shadow-lg group ${s.btn}`}
            >
              <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-xs font-black uppercase tracking-widest">Settings</span>
            </button>
            <button 
              onClick={onThemeToggle}
              className={`w-14 h-14 rounded-[2rem] border transition-all flex items-center justify-center shadow-lg group ${s.btn}`}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Hero Telemetry Pipeline */}
        <div className={`hidden sm:flex w-full mb-12 p-8 sm:p-12 ${s.card} rounded-[3rem] sm:rounded-[4rem] border relative overflow-hidden flex-col items-center`}>
          <div className={`flex justify-between items-center w-full mb-12 relative z-10 pb-6 ${s.cardHeader}`}>
             <div className="flex items-center gap-3">
               <Activity className={`w-6 h-6 ${s.accent} animate-pulse`} />
               <span className={`text-sm font-black uppercase tracking-[0.3em] ${s.header}`}>Live Telemetry</span>
             </div>
             <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-lg">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">System Online</span>
             </div>
          </div>
          
          <div className="w-full flex items-center justify-between relative z-10 px-4 md:px-8 lg:px-16">
            {/* The animated connection line */}
            <div className="absolute left-8 right-8 top-1/2 h-1 bg-white/5 -translate-y-1/2 rounded-full overflow-hidden">
               <motion.div 
                 className={`h-full w-1/3 bg-gradient-to-r from-transparent via-[#0A84FF] to-transparent`}
                 animate={{ x: ['-100%', '300%'] }}
                 transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
               />
            </div>
            
            {FLOW_STAGES.map((stage, idx) => {
              const isComplete = stage.label === 'Complete';
              return (
                <button 
                  key={idx}
                  onClick={() => !isComplete && onRoleSelect(UserRole.PUBLIC, stage.subView)}
                  disabled={isComplete}
                  className={`relative z-10 flex flex-col items-center group transition-all ${isComplete ? 'cursor-default' : 'active:scale-95'}`}
                >
                  <div className={`w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-2xl border border-white/20 shadow-2xl transition-all duration-500 ${!isComplete && 'group-hover:scale-110 group-hover:border-white/60 group-hover:shadow-[#0A84FF]/20'} overflow-hidden`}>
                     <div className={`absolute inset-0 opacity-20 ${!isComplete && 'group-hover:opacity-40'} transition-opacity duration-500 ${stage.dotColor}`}></div>
                     <span className={`text-2xl md:text-3xl lg:text-4xl font-black text-white ${!isComplete && 'group-hover:scale-110'} transition-transform duration-500`}>
                        {getCount(stage.status)}
                     </span>
                  </div>
                  <span className={`absolute -bottom-8 whitespace-nowrap text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#86868b] ${!isComplete && 'group-hover:text-[#0A84FF] dark:group-hover:text-white'} transition-colors duration-300`}>
                    {stage.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Grids */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-12 flex-grow">
          
          {/* Staff Portals */}
          <div className={`w-full p-6 sm:p-10 rounded-[3rem] sm:rounded-[4rem] border shadow-2xl flex flex-col ${s.card}`}>
            <div className={`flex items-center justify-between mb-8 pb-6 ${s.cardHeader}`}>
              <div className="flex flex-col">
                <h3 className={`text-xl sm:text-2xl font-black tracking-tighter uppercase ${s.header}`}>Staff Portals</h3>
                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${s.sub}`}>Internal Operations</span>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.iconBg}`}>
                <Shield className={`w-6 h-6 ${s.accent}`} />
              </div>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pr-2 apple-scroll flex-grow max-h-[600px]">
              <StaffPortalButton role={UserRole.GATE} label="Gate Security" icon={Shield} />
              <StaffPortalButton role={UserRole.RECEPTION} label="Admission Desk" icon={UserPlus} />
              <StaffPortalButton role={UserRole.CHECKIN} label="Check In" icon={FileCheck} />
              <StaffPortalButton role={UserRole.DOCTOR} label="Doctor Portal" icon={Stethoscope} />
              <StaffPortalButton role={UserRole.MEDICAL} label="Treatment Station" icon={Syringe} />
              <StaffPortalButton role={UserRole.PHARMACY} label="Pharmacy & Billing" icon={Pill} />
              <StaffPortalButton role={UserRole.LAB} label="Laboratory Services" icon={FlaskConical} />
              <StaffPortalButton role={UserRole.RADIOLOGY} label="Radiology / RIS" icon={Radio} />
              <StaffPortalButton role={UserRole.INVENTORY} label="Store & Inventory" icon={Package} />
              <StaffPortalButton role={UserRole.WARD_CARE} label="Ward Management" icon={Bed} />
              <StaffPortalButton role={UserRole.BILLING} label="Discharge Desk" icon={Receipt} />
              <StaffPortalButton role={UserRole.VISITOR_MGMT} label="Visitor Control" icon={Users} />
              {isAdmin && <StaffPortalButton role={UserRole.ADMIN} label="Admin Console" icon={Lock} />}
            </div>
          </div>

          {/* Public Boards */}
          <div className={`w-full p-6 sm:p-10 rounded-[3rem] sm:rounded-[4rem] border shadow-2xl flex flex-col ${s.card}`}>
            <div className={`flex items-center justify-between mb-8 pb-6 ${s.cardHeader}`}>
              <div className="flex flex-col">
                <h3 className={`text-xl sm:text-2xl font-black tracking-tighter uppercase ${s.header}`}>Public Boards</h3>
                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${s.sub}`}>Real-time Displays</span>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.iconBg}`}>
                <MonitorPlay className={`w-6 h-6 ${s.accent}`} />
              </div>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pr-2 apple-scroll flex-grow max-h-[600px]">
              <PublicBoardButton id="reception" label="Reception List" icon={ListTodo} />
              <PublicBoardButton id="checkin" label="Check In Status" icon={UserCheck} />
              <PublicBoardButton id="doctor" label="Consultations" icon={Stethoscope} />
              <PublicBoardButton id="treatment" label="Treatment Board" icon={Syringe} />
              <PublicBoardButton id="medical" label="Pharmacy Board" icon={Pill} />
              <PublicBoardButton id="ward" label="Ward Occupancy" icon={Bed} />
            </div>
          </div>

          {/* Clinical Analytics */}
          <div className={`w-full p-6 sm:p-10 rounded-[3rem] sm:rounded-[4rem] border shadow-2xl flex flex-col justify-between ${s.card} relative overflow-hidden group lg:col-span-2 xl:col-span-1`}>
            {/* Ambient Background Chart effect */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0A84FF]/5 to-transparent pointer-events-none transition-opacity duration-1000 group-hover:opacity-100 opacity-50"></div>
            
            <div className="relative z-10 w-full flex-grow flex flex-col">
              <div className={`flex items-center justify-between mb-12 pb-6 ${s.cardHeader}`}>
                <div className="flex flex-col">
                  <h3 className={`text-xl sm:text-2xl font-black tracking-tighter uppercase ${s.header}`}>Clinical Analytics</h3>
                  <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${s.sub}`}>Intelligent Throughput</span>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.iconBg}`}>
                  <Activity className={`w-6 h-6 ${s.accent}`} />
                </div>
              </div>
              
              <div className="flex flex-col justify-center gap-12 flex-grow sm:flex-row xl:flex-col">
                <div className="flex flex-col group/stat cursor-default flex-1">
                  <div className="flex items-end gap-4 mb-2">
                    <span className={`text-7xl sm:text-8xl lg:text-9xl font-black tracking-tighter leading-none ${s.header} transition-transform duration-500 group-hover/stat:scale-105 origin-left`}>
                      {patients.length}
                    </span>
                    <span className="text-2xl sm:text-3xl text-emerald-500 font-black mb-2 animate-bounce">↑</span>
                  </div>
                  <span className={`text-xs sm:text-sm font-black uppercase tracking-[0.3em] ${s.sub}`}>Total Patient Flow</span>
                  <div className={`w-full h-2 mt-4 rounded-full overflow-hidden ${s.chartBg}`}>
                    <div className={`h-full ${s.chartFill} w-full transition-all duration-1000 origin-left scale-x-100`}></div>
                  </div>
                </div>

                <div className="flex flex-col group/stat cursor-default flex-1">
                  <div className="flex items-end gap-4 mb-2">
                    <span className={`text-7xl sm:text-8xl lg:text-9xl font-black tracking-tighter leading-none ${s.header} transition-transform duration-500 group-hover/stat:scale-105 origin-left`}>
                      {patients.filter(p => p.status === PatientStatus.COMPLETED || p.status === PatientStatus.DISCHARGED).length}
                    </span>
                    <span className="text-2xl sm:text-3xl text-blue-500 font-black mb-2">→</span>
                  </div>
                  <span className={`text-xs sm:text-sm font-black uppercase tracking-[0.3em] ${s.sub}`}>Total Outflows</span>
                  <div className={`w-full h-2 mt-4 rounded-full overflow-hidden ${s.chartBg}`}>
                    <div 
                      className={`h-full bg-emerald-500 transition-all duration-1000`} 
                      style={{ width: `${Math.max(5, (patients.filter(p => p.status === PatientStatus.COMPLETED || p.status === PatientStatus.DISCHARGED).length / Math.max(1, patients.length)) * 100)}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`relative z-10 mt-12 flex items-center justify-between w-full pt-6 ${s.cardHeader}`}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500`}>System Secured</span>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] opacity-40 ${s.sub}`}>v2.0 Enterprise</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
