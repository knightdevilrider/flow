
import React, { useState, useEffect } from 'react';
import { Patient, UserRole, PatientStatus } from './types';
import { mockFirestore } from './services/mockFirestore';
import Layout from './components/Layout';
import MainDashboard from './views/MainDashboard';
import StaffGate from './views/StaffGate';
import StaffReception from './views/StaffReception';
import StaffCheckin from './views/StaffCheckin';
import StaffDoctor from './views/StaffDoctor';
import StaffMedical from './views/StaffMedical';
import StaffVisitorMgmt from './views/StaffVisitorMgmt';
import StaffAttendantMgmt from './views/StaffAttendantMgmt';
import PublicDisplayView from './views/PublicDisplayView';

import StaffWardCare from './views/StaffWardCare';
import StaffBilling from './views/StaffBilling';

const publicBoardTitles: Record<string, string> = {
  'reception': 'Reception Waiting List',
  'checkin': 'Check-in Status',
  'doctor': 'Consultation Board',
  'medical': 'Pharmacy Supply List',
  'ward': 'Ward Availability'
};

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedSubView, setSelectedSubView] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Initialize Demo Mode immediately
  useEffect(() => {
    mockFirestore.setUseLocalStorage(true);
    mockFirestore.seedDemoData().then(() => {
      refreshData();
    });
  }, []);

  const refreshData = async () => {
    try {
      const data = await mockFirestore.getPatients();
      setPatients(data);
      setError(null);
    } catch (err: any) {
      console.error("Manual Refresh Error:", err);
      const msg = err.message || JSON.stringify(err);
      setError(`Refresh Failed: ${msg}`);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initConnection = () => {
      setLoading(true);
      unsubscribe = mockFirestore.onSnapshot(
        (data) => {
          setPatients(data);
          setLoading(false);
          setError(null);
        },
        (err: any) => {
          console.error("Connection Stream Error:", err);
          const errorMessage = typeof err === 'string' 
            ? err 
            : (err.message || err.error_description || JSON.stringify(err));
          setError(errorMessage);
          setLoading(false);
        }
      );
    };

    initConnection();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isDemoMode]);

  const handleRoleSelect = (role: UserRole, subView?: string) => {
    setCurrentRole(role);
    if (subView) setSelectedSubView(subView);
  };

  const handleBack = () => {
    setCurrentRole(null);
    setSelectedSubView(null);
  };

  const startDemoMode = async () => {
    mockFirestore.setUseLocalStorage(true);
    await mockFirestore.seedDemoData();
    setIsDemoMode(true);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-black text-white uppercase tracking-widest animate-pulse">Connecting to Database...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#060b18] flex flex-col items-center justify-center p-8 text-center">
        <div className="text-7xl mb-8">🛰️</div>
        <h2 className="text-3xl font-black text-red-500 uppercase mb-4 tracking-tight">Sync Offline</h2>
        <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-[2.5rem] max-w-2xl mb-10 shadow-2xl overflow-hidden">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4">Technical Logs</p>
          <p className="text-red-400 text-sm font-mono break-all leading-relaxed bg-black/40 p-4 rounded-xl border border-red-500/20">
            {error}
          </p>
          <p className="mt-6 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            Ensure the "patients" table exists in your Supabase project.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => window.location.reload()} className="px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest hover:bg-indigo-500 transition-all">Retry Link</button>
          <button onClick={startDemoMode} className="px-10 py-5 bg-slate-800 text-slate-300 font-black rounded-2xl uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700">Go Offline (Demo)</button>
        </div>
      </div>
    );
  }

  if (!currentRole) {
    return <MainDashboard onRoleSelect={handleRoleSelect} patients={patients} />;
  }

  const renderView = () => {
    switch (currentRole) {
      case UserRole.GATE: return <StaffGate patients={patients} />;
      case UserRole.RECEPTION: return <StaffReception patients={patients} />;
      case UserRole.CHECKIN: return <StaffCheckin patients={patients} />;
      case UserRole.DOCTOR: return <StaffDoctor patients={patients} />;
      case UserRole.MEDICAL: return <StaffMedical patients={patients} />;
      case UserRole.WARD_CARE: return <StaffWardCare patients={patients} />;
      case UserRole.BILLING: return <StaffBilling patients={patients} />;
      case UserRole.VISITOR_MGMT: return <StaffVisitorMgmt patients={patients} />;
      case UserRole.ATTENDANT_MGMT: return <StaffAttendantMgmt patients={patients} />;
      case UserRole.PUBLIC: return <PublicDisplayView patients={patients} viewType={selectedSubView || 'all'} />;
      default: return <MainDashboard onRoleSelect={handleRoleSelect} patients={patients} />;
    }
  };

  const roleTitles: Partial<Record<UserRole, string>> = {
    [UserRole.GATE]: 'Gate & Security',
    [UserRole.RECEPTION]: 'Reception & IPD Admission',
    [UserRole.CHECKIN]: 'Station: Check-in',
    [UserRole.DOCTOR]: 'Clinical Review Console',
    [UserRole.MEDICAL]: 'Pharmacy & Medication Intake',
    [UserRole.WARD_CARE]: 'Ward Management & Bed Care',
    [UserRole.BILLING]: 'Billing & Discharge',
    [UserRole.VISITOR_MGMT]: 'Visitor Tracking',
    [UserRole.ATTENDANT_MGMT]: 'Attendant Mgmt',
  };

  const displayTitle = currentRole === UserRole.PUBLIC 
    ? (selectedSubView ? publicBoardTitles[selectedSubView] : 'Public Board')
    : (roleTitles[currentRole] || '');

  return (
    <Layout title={displayTitle} onBack={handleBack} onRefresh={refreshData}>
      {renderView()}
    </Layout>
  );
};

export default App;
