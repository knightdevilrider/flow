
import React, { useState, useEffect } from 'react';
import { 
  Patient, 
  UserRole, 
  PatientStatus, 
  Theme,
  Doctor,
  Ward,
  DoctorRoster,
  SystemThresholds,
  AuditLog,
  BillingScheme,
  NABHKPI,
  StaffMember
} from './types';
import { mockFirestore } from './services/mockFirestore';
import { googleSheetsService } from './services/googleSheets';
import { googleSignIn, initAuth, logout, getAccessToken, db } from './src/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
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
import SettingsView from './views/SettingsView';
import AdminConsole from './views/AdminConsole';
import AdminAuthModal from './components/AdminAuthModal';
import PatientFormModal from './components/admin/PatientFormModal';
import DeletePatientModal from './components/admin/DeletePatientModal';
import { updateDoc, doc, addDoc } from 'firebase/firestore';

const publicBoardTitles: Record<string, string> = {
  'reception': 'Reception Waiting List',
  'checkin': 'Check In Status',
  'doctor': 'Consultation Board',
  'medical': 'Pharmacy Supply List',
  'ward': 'Ward Availability'
};

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedSubView, setSelectedSubView] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') === 'true' || params.get('demo') === null; // Default to true if not specified
  });
  const [theme, setTheme] = useState<Theme>('dark');
  const [showSettings, setShowSettings] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Patient Admin States
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // Global Admin State
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [roster, setRoster] = useState<DoctorRoster[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]); // Added staff state
  const [thresholds, setThresholds] = useState<SystemThresholds>({
    highVolumeTrigger: 10,
    opdTokenLimit: 100,
    isMaintenanceMode: false,
    abhaRequired: true,
    gstEnabled: true,
    mlcPromptEnabled: true,
    pndtLoggingEnabled: false
  });
  const [schemes, setSchemes] = useState<BillingScheme[]>([
    { id: '1', name: 'PM-JAY (Ayushman Bharat)', discountPercentage: 50, taxRate: 0, preAuthLimit: 100000 },
    { id: '2', name: 'CGHS', discountPercentage: 30, taxRate: 0, preAuthLimit: 50000 },
    { id: '3', name: 'Self-Pay', discountPercentage: 0, taxRate: 18, preAuthLimit: 0 }
  ]);
  const [kpis, setKpis] = useState<NABHKPI[]>([
    { id: '1', name: 'ALOS (Avg Length of Stay)', target: 3.5, unit: 'days', currentValue: 4.2 },
    { id: '2', name: 'LAMA Rate', target: 2, unit: 'percentage', currentValue: 1.5 },
    { id: '3', name: 'Emergency TAT', target: 15, unit: 'minutes', currentValue: 18 }
  ]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
        setLoading(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const addAuditLog = (action: string, details: string) => {
    const log: AuditLog = {
      id: `LOG-${Date.now()}`,
      timestamp: Date.now(),
      action,
      details,
      user: user?.displayName || 'Admin'
    };
    setAuditLogs(prev => [log, ...prev].slice(0, 50));
  };

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'titanium';
      return 'dark';
    });
  };

  // Initialize Demo Mode immediately
  useEffect(() => {
    mockFirestore.setUseLocalStorage(isDemoMode);
    if (isDemoMode) {
      mockFirestore.seedDemoData().then(() => {
        refreshData();
      });
    }
  }, [isDemoMode]);

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

  // Firestore Listeners for Global Data (Sync always to allow Admin configuration)
  useEffect(() => {
    const unsubDoctors = onSnapshot(query(collection(db, 'doctors'), orderBy('name')), (snap) => {
      setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Doctor)));
    });

    const unsubStaff = onSnapshot(query(collection(db, 'staff'), orderBy('name')), (snap) => {
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffMember)));
    });

    const unsubRoster = onSnapshot(query(collection(db, 'roster')), (snap) => {
      setRoster(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    const unsubWards = onSnapshot(query(collection(db, 'wards')), (snap) => {
      setWards(snap.docs.map(d => ({ id: d.id, ...d.data() } as Ward)));
    });

    return () => {
      unsubDoctors();
      unsubStaff();
      unsubRoster();
      unsubWards();
    };
  }, []);

  useEffect(() => {
    // Handle deep-linking via URL parameters
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role') as UserRole;
    const viewParam = params.get('view');
    
    const demoParam = params.get('demo');
    if (demoParam === 'false') setIsDemoMode(false);
    if (demoParam === 'true') setIsDemoMode(true);
    
    if (roleParam === UserRole.PUBLIC) {
      setCurrentRole(roleParam);
      if (viewParam) setSelectedSubView(viewParam);
    }
  }, []);

  const handleRoleSelect = (role: UserRole, subView?: string) => {
    setCurrentRole(role);
    if (subView) setSelectedSubView(subView);
  };

  const handleBack = () => {
    if (showSettings) {
      setShowSettings(false);
      return;
    }
    setCurrentRole(null);
    setSelectedSubView(null);
  };

  const handleSettingsClick = () => {
    if (isAdminMode) {
      setShowSettings(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAdminMode(true);
    setIsAuthModalOpen(false);
    if (currentRole === null) {
      setShowSettings(true);
    }
  };

  const toggleAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      setShowSettings(false);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleEditPatient = (p: Patient) => {
    setEditingPatient(p);
    setIsPatientModalOpen(true);
  };

  const handleDeletePatient = (p: Patient) => {
    setPatientToDelete(p);
    setIsDeleteModalOpen(true);
  };

  const handleSavePatient = async (patientData: Partial<Patient>) => {
    try {
      if (editingPatient) {
        await mockFirestore.updatePatient(editingPatient.id, {
          ...patientData,
          lastModifiedAt: Date.now(),
          lastModifiedBy: user?.displayName || 'Admin'
        });
      } else {
        await mockFirestore.addPatient({
          ...patientData,
          isDeleted: false,
          lastModifiedBy: user?.displayName || 'Admin'
        } as any);
      }
      setIsPatientModalOpen(false);
      setEditingPatient(null);
    } catch (err: any) {
      console.error('Error saving patient:', err);
      if (err.code === 'not-found' || err.message?.includes('No document to update')) {
        alert('Could not find the patient record in the database. It may have been already deleted.');
      }
    }
  };

  const handleSoftDelete = async (reason: string) => {
    if (!patientToDelete) return;
    try {
      await mockFirestore.updatePatient(patientToDelete.id, {
        isDeleted: true,
        deletedAt: Date.now(),
        deletedReason: reason,
        lastModifiedBy: user?.displayName || 'Admin'
      });

      // Log to Google Sheets if we have an access token
      if (accessToken) {
        try {
          await googleSheetsService.logDeletion({
            patientId: patientToDelete.id,
            patientName: patientToDelete.name,
            reason: reason,
            deletedAt: new Date().toLocaleString(),
            deletedBy: user?.displayName || 'Admin'
          }, accessToken);
          console.log('Logged deletion to Google Sheets');
        } catch (sheetErr) {
          console.error('Failed to log to Google Sheets:', sheetErr);
          // Don't block the UI if logging fails
        }
      }

      setIsDeleteModalOpen(false);
      setPatientToDelete(null);
    } catch (err: any) {
      console.error('Error deleting patient:', err);
      if (err.code === 'not-found' || err.message?.includes('No document to update')) {
        alert('This patient record no longer exists in the database.');
        setIsDeleteModalOpen(false);
        setPatientToDelete(null);
      }
    }
  };

  const startDemoMode = async () => {
    setIsDemoMode(true);
    mockFirestore.setUseLocalStorage(true);
    await mockFirestore.seedDemoData();
    setError(null);
  };

  // Theme-based background
  const themeClasses = {
    light: 'bg-[#F5F5F7] text-[#1D1D1F]',
    dark: 'bg-[#000000] text-[#F5F5F7]',
    titanium: 'bg-[#3D3D3D] text-[#E8E8ED]'
  };

  if (!user && !loading && !isDemoMode) {
    return (
      <div className={`min-h-screen ${themeClasses[theme]} flex flex-col items-center justify-center p-8 text-center`}>
         <div className="w-24 h-24 mb-8 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-2xl">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
         </div>
         <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Audit Intelligence Pro</h1>
         <p className="text-white/40 mb-12 max-w-md">Enterprise-grade clinical compliance monitoring. Please sign in with your hospital Google account to access real-time auditing and Workspace exports.</p>
         
         <button 
           onClick={handleLogin}
           className="gsi-material-button"
         >
           <div className="gsi-material-button-state"></div>
           <div className="gsi-material-button-content-wrapper">
             <div className="gsi-material-button-icon">
               <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                 <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                 <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                 <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                 <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                 <path fill="none" d="M0 0h48v48H0z"></path>
               </svg>
             </div>
             <span className="gsi-material-button-contents">Sign in with Google</span>
           </div>
         </button>

         <button 
           onClick={startDemoMode}
           className="mt-8 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
         >
           Enter Offline Demo Mode
         </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${themeClasses[theme]} flex flex-col items-center justify-center p-8`}>
        <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-black uppercase tracking-widest animate-pulse">Initializing System...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${themeClasses[theme]} flex flex-col items-center justify-center p-8 text-center`}>
        <div className="text-7xl mb-8">🛰️</div>
        <h2 className="text-3xl font-black text-red-500 uppercase mb-4 tracking-tight">Sync Offline</h2>
        <div className="bg-red-500/5 border border-red-500/10 p-8 squircle max-w-2xl mb-10 shadow-2xl overflow-hidden">
          <p className="text-red-400 text-sm font-mono break-all leading-relaxed">
            {error}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => window.location.reload()} className="px-10 py-5 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-widest hover:bg-blue-500 transition-all">Retry</button>
          <button onClick={startDemoMode} className="px-10 py-5 bg-slate-800 text-slate-300 font-black rounded-2xl uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700">Demo Mode</button>
        </div>
      </div>
    );
  }

  if (!currentRole && !showSettings) {
    return (
      <div className={`${themeClasses[theme]} min-h-screen`}>
        <MainDashboard onRoleSelect={handleRoleSelect} patients={patients} theme={theme} onThemeToggle={toggleTheme} onSettings={handleSettingsClick} />
        {isAuthModalOpen && (
          <AdminAuthModal 
            theme={theme} 
            onSuccess={handleAuthSuccess} 
            onClose={() => setIsAuthModalOpen(false)} 
          />
        )}
      </div>
    );
  }

  const renderView = () => {
    if (showSettings) {
      return (
        <SettingsView 
          theme={theme} 
          doctors={doctors} 
          setDoctors={setDoctors} 
          wards={wards} 
          setWards={setWards}
          roster={roster}
          setRoster={setRoster}
          thresholds={thresholds}
          setThresholds={setThresholds}
          schemes={schemes}
          setSchemes={setSchemes}
          kpis={kpis}
          setKpis={setKpis}
          auditLogs={auditLogs}
          onAddAuditLog={addAuditLog}
          patients={patients}
          staff={staff}
        />
      );
    }

    const activePatients = patients.filter(p => !p.isDeleted);

    switch (currentRole) {
      case UserRole.GATE: 
        const gateCount = activePatients.filter(p => p.status === PatientStatus.GATE_REGISTERED).length;
        return <StaffGate patients={activePatients} theme={theme} waitingCount={gateCount} isAdmin={isAdminMode} onEditPatient={handleEditPatient} onDeletePatient={handleDeletePatient} />;
      case UserRole.RECEPTION: return <StaffReception patients={activePatients} theme={theme} doctors={doctors} isAdmin={isAdminMode} onEditPatient={handleEditPatient} onDeletePatient={handleDeletePatient} />;
      case UserRole.CHECKIN: return <StaffCheckin patients={activePatients} theme={theme} isAdmin={isAdminMode} onEditPatient={handleEditPatient} onDeletePatient={handleDeletePatient} />;
      case UserRole.DOCTOR: return <StaffDoctor patients={activePatients} theme={theme} doctors={doctors} roster={roster} isAdmin={isAdminMode} onEditPatient={handleEditPatient} onDeletePatient={handleDeletePatient} />;
      case UserRole.MEDICAL: return <StaffMedical patients={activePatients} theme={theme} isAdmin={isAdminMode} onEditPatient={handleEditPatient} onDeletePatient={handleDeletePatient} />;
      case UserRole.WARD_CARE: return <StaffWardCare patients={activePatients} theme={theme} isAdmin={isAdminMode} onEditPatient={handleEditPatient} onDeletePatient={handleDeletePatient} />;
      case UserRole.BILLING: return <StaffBilling patients={activePatients} theme={theme} isAdmin={isAdminMode} onEditPatient={handleEditPatient} onDeletePatient={handleDeletePatient} />;
      case UserRole.VISITOR_MGMT: return <StaffVisitorMgmt patients={activePatients} theme={theme} isAdmin={isAdminMode} onEditPatient={handleEditPatient} onDeletePatient={handleDeletePatient} />;
      case UserRole.ATTENDANT_MGMT: return <StaffAttendantMgmt patients={activePatients} theme={theme} isAdmin={isAdminMode} onEditPatient={handleEditPatient} onDeletePatient={handleDeletePatient} />;
      case UserRole.ADMIN: return <AdminConsole theme={theme} doctors={doctors} staff={staff} rotations={roster as any} isAdmin={isAdminMode} />;
      case UserRole.PUBLIC: return <PublicDisplayView patients={patients} viewType={selectedSubView || 'all'} theme={theme} thresholds={thresholds} roster={roster} doctors={doctors} onBack={handleBack} isAdmin={isAdminMode} onEditPatient={handleEditPatient} onDeletePatient={handleDeletePatient} />;
      default: return <MainDashboard onRoleSelect={handleRoleSelect} patients={activePatients} theme={theme} onThemeToggle={toggleTheme} onSettings={handleSettingsClick} />;
    }
  };

  const roleTitles: Partial<Record<UserRole, string>> = {
    [UserRole.GATE]: 'Gate & Security',
    [UserRole.RECEPTION]: 'Reception & IPD Admission',
    [UserRole.CHECKIN]: 'Check In Station',
    [UserRole.DOCTOR]: 'Clinical Review Console',
    [UserRole.MEDICAL]: 'Pharmacy & Medication Intake',
    [UserRole.WARD_CARE]: 'Ward Management & Bed Care',
    [UserRole.BILLING]: 'Billing & Discharge',
    [UserRole.VISITOR_MGMT]: 'Visitor Tracking',
    [UserRole.ATTENDANT_MGMT]: 'Attendant Mgmt',
    [UserRole.ADMIN]: 'Administrative Console',
  };

  const displayTitle = showSettings
    ? 'System Settings'
    : currentRole === UserRole.PUBLIC 
      ? (selectedSubView ? publicBoardTitles[selectedSubView] : 'Public Board')
      : (roleTitles[currentRole!] || '');

  const currentView = currentRole === UserRole.PUBLIC ? 'public' : 'internal';

  return (
    <div className={`${themeClasses[theme]} min-h-screen`}>
      <Layout 
        title={displayTitle} 
        onBack={(currentRole || showSettings) ? handleBack : undefined} 
        onSettings={handleSettingsClick}
        onRefresh={refreshData}
        theme={theme}
        onThemeToggle={toggleTheme}
        statusNode={null}
        user={user}
        onLogout={logout}
        currentView={currentView}
        isAdminMode={isAdminMode}
        onToggleAdmin={toggleAdminMode}
      >
        {renderView()}
        {isAuthModalOpen && (
          <AdminAuthModal 
            theme={theme} 
            onSuccess={handleAuthSuccess} 
            onClose={() => setIsAuthModalOpen(false)} 
          />
        )}
        <PatientFormModal
          isOpen={isPatientModalOpen}
          onClose={() => { setIsPatientModalOpen(false); setEditingPatient(null); }}
          onSave={handleSavePatient}
          initialData={editingPatient}
          theme={theme}
          doctors={doctors}
        />
        <DeletePatientModal
          isOpen={isDeleteModalOpen}
          onClose={() => { setIsDeleteModalOpen(false); setPatientToDelete(null); }}
          onConfirm={handleSoftDelete}
          patient={patientToDelete}
          theme={theme}
        />
      </Layout>
    </div>
  );
};

export default App;
