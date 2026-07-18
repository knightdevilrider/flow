
import { Patient, PatientStatus, PatientCategory, TrackingLog } from '../types';
import { supabase } from './supabaseClient';
import { exportPatientToSheet } from './dataExport';

const TABLE_NAME = 'patients';

const generatePatientId = (): string => {
  const now = new Date();
  const f = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${f(now.getMonth() + 1)}${f(now.getDate())}${f(now.getHours())}${f(now.getMinutes())}${f(now.getSeconds())}`;
};

const toDb = (patient: any) => {
  const dbObj: any = {};
  for (const key in patient) {
    if (patient[key] !== undefined && patient[key] !== null) {
      dbObj[key.toLowerCase()] = patient[key];
    }
  }
  return dbObj;
};

const fromDb = (dbObj: any): Patient => {
  return {
    id: dbObj.id,
    name: dbObj.name,
    contactNumber: dbObj.contactnumber,
    status: dbObj.status as PatientStatus,
    category: dbObj.category as PatientCategory,
    timestamp: Number(dbObj.timestamp),
    lastCalledTimestamp: dbObj.lastcalledtimestamp ? Number(dbObj.lastcalledtimestamp) : undefined,
    isPriority: dbObj.ispriority,
    isAbsent: dbObj.isabsent,
    idType: dbObj.idtype,
    idNumber: dbObj.idnumber,
    age: dbObj.age,
    gender: dbObj.gender,
    address: dbObj.address,
    photo: dbObj.photo,
    insuranceType: dbObj.insurancetype,
    isForeigner: dbObj.isforeigner,
    medicalHistory: dbObj.medicalhistory,
    targetPatientId: dbObj.targetpatientid,
    relationship: dbObj.relationship,
    emergencyContact: dbObj.emergencycontact,
    expiryTimestamp: dbObj.expirytimestamp ? Number(dbObj.expirytimestamp) : undefined,
    assignedDoctorId: dbObj.assigneddoctorid,
    checkinSection: dbObj.checkinsection,
    prescription: dbObj.prescription,
    history: Array.isArray(dbObj.history) ? dbObj.history : []
  };
};

let useLocalStorage = true;
const LS_KEY = 'hospital_patients_demo';

const getLocalPatients = (): Patient[] => {
  const data = localStorage.getItem(LS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalPatients = (patients: Patient[]) => {
  localStorage.setItem(LS_KEY, JSON.stringify(patients));
};

const LS_BEDS_KEY = 'hospital_beds_demo';

const getLocalBeds = (): Bed[] => {
  const data = localStorage.getItem(LS_BEDS_KEY);
  if (data) return JSON.parse(data);
  const initialBeds: Bed[] = [
    { id: 'BED-W101', type: 'WARD', status: 'AVAILABLE', hourlyRate: 500 },
    { id: 'BED-W102', type: 'WARD', status: 'AVAILABLE', hourlyRate: 500 },
    { id: 'BED-I201', type: 'ICU', status: 'AVAILABLE', hourlyRate: 2000 },
    { id: 'BED-I202', type: 'ICU', status: 'AVAILABLE', hourlyRate: 2000 },
  ];
  saveLocalBeds(initialBeds);
  return initialBeds;
};

const saveLocalBeds = (beds: Bed[]) => {
  localStorage.setItem(LS_BEDS_KEY, JSON.stringify(beds));
};

export const mockFirestore = {
  setUseLocalStorage: (use: boolean) => {
    useLocalStorage = use;
    console.log(`Demo Mode: LocalStorage usage set to ${use}`);
  },

  seedDemoData: async () => {
    const demoPatients: Omit<Patient, 'id' | 'timestamp' | 'history' | 'activeVisitorsCount'>[] = [
      { name: 'Aditya Varma', contactNumber: '9888877777', status: PatientStatus.WARD_ADMITTED, category: PatientCategory.IPD, age: '45', gender: 'Male', rfidTag: 'RFID_001', bedId: 'BED-W101' },
      { name: 'Saira Bano', contactNumber: '9888866666', status: PatientStatus.GATE_REGISTERED, category: PatientCategory.OPD, age: '32', gender: 'Female' },
      { name: 'Kunal Kohli', contactNumber: '9888855555', status: PatientStatus.DOCTOR_WAITING, category: PatientCategory.OPD, age: '28', gender: 'Male' }
    ];
    
    if (useLocalStorage) {
      const current = getLocalPatients();
      if (current.length === 0) {
        for (const p of demoPatients) {
          const newId = generatePatientId() + Math.random().toString(36).substring(7);
          const now = Date.now();
          current.push({
            ...p as any,
            id: newId,
            timestamp: now,
            activeVisitorsCount: 0,
            history: [{ stage: p.status, entryTime: now }]
          });
        }
        saveLocalPatients(current);
      }
      return;
    }

    for (const p of demoPatients) {
      await mockFirestore.addPatient(p);
    }
  },

  // Bed Management
  getBeds: async (): Promise<Bed[]> => {
    return getLocalBeds();
  },

  updateBedStatus: async (bedId: string, status: Bed['status'], patientId?: string) => {
    const beds = getLocalBeds();
    const idx = beds.findIndex(b => b.id === bedId);
    if (idx !== -1) {
      beds[idx].status = status;
      beds[idx].patientId = patientId;
      if (status === 'CLEANING') beds[idx].lastOccupiedAt = Date.now();
      saveLocalBeds(beds);
    }
  },

  // EMR Governance: Immutable Addendum
  updatePatientAudited: async (id: string, updates: Partial<Patient>, note: string, authorId: string) => {
    const patients = getLocalPatients();
    const pIdx = patients.findIndex(p => p.id === id);
    if (pIdx === -1) return;

    const patient = patients[pIdx];
    const now = Date.now();
    const newEntry: TrackingLog = {
      stage: updates.status || patient.status,
      entryTime: now,
      note,
      authorId
    };

    const history = [...patient.history];
    if (history.length > 0) history[history.length - 1].exitTime = now;
    history.push(newEntry);

    patients[pIdx] = {
      ...patient,
      ...updates,
      history
    };

    saveLocalPatients(patients);
  },

  // Clinical Actions
  recordConsent: async (id: string, authorId: string, signatureHash: string) => {
    const patients = getLocalPatients();
    const pIdx = patients.findIndex(p => p.id === id);
    if (pIdx === -1) return;

    const patient = patients[pIdx];
    const history = [...patient.history];
    history.push({
      stage: patient.status,
      entryTime: Date.now(),
      note: 'Surgical Consent Signed via OTP + Stylus',
      authorId,
      auditHash: signatureHash
    });

    patients[pIdx] = { ...patient, surgicalConsentDone: true, history };
    saveLocalPatients(patients);
  },

  addOutsideMeds: async (id: string, medName: string) => {
    const patients = getLocalPatients();
    const pIdx = patients.findIndex(p => p.id === id);
    if (pIdx === -1) return;

    const currentMeds = patients[pIdx].customMeds || [];
    patients[pIdx].customMeds = [...currentMeds, medName];
    saveLocalPatients(patients);
  },

  skipPatient: async (id: string) => {
    await mockFirestore.updatePatient(id, { isAbsent: true });
  },

  prioritizePatient: async (id: string) => {
    await mockFirestore.updatePatient(id, { isPriority: true, isAbsent: false });
  },

  getPatients: async (): Promise<Patient[]> => {
    if (useLocalStorage) {
      return getLocalPatients();
    }
    const { data, error } = await supabase.from(TABLE_NAME).select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    return (data || []).map(fromDb);
  },

  addPatient: async (patient: Omit<Patient, 'id' | 'timestamp' | 'history'>) => {
    const newId = generatePatientId();
    const now = Date.now();
    const newPatient: Patient = { 
      ...patient as any, 
      id: newId, 
      timestamp: now,
      history: [{ stage: PatientStatus.GATE_REGISTERED, entryTime: now }]
    };
    
    if (useLocalStorage) {
      const patients = getLocalPatients();
      patients.push(newPatient);
      saveLocalPatients(patients);
      return newPatient;
    }

    const dbRow = toDb(newPatient);
    const { data, error } = await supabase.from(TABLE_NAME).insert([dbRow]).select();
    if (error) throw error;
    return fromDb(data![0]);
  },

  updatePatient: async (id: string, updates: Partial<Patient>) => {
    if (useLocalStorage) {
      const patients = getLocalPatients();
      const index = patients.findIndex(p => p.id === id);
      if (index !== -1) {
        patients[index] = { ...patients[index], ...updates };
        saveLocalPatients(patients);
      }
      return;
    }

    const dbUpdates = toDb(updates);
    const { error } = await supabase.from(TABLE_NAME).update(dbUpdates).eq('id', id);
    if (error) throw error;

    // AUTO-EXPORT TRIGGER
    if (updates.status === PatientStatus.COMPLETED) {
      // Get full patient data first to ensure we export everything
      const { data } = await supabase.from(TABLE_NAME).select('*').eq('id', id).single();
      if (data) {
        const fullPatient = fromDb(data);
        await exportPatientToSheet(fullPatient);
      }
    }
  },

  callPatient: async (id: string, newStatus: PatientStatus, currentPatients: Patient[]) => {
    const p = currentPatients.find(item => item.id === id);
    if (!p) return;

    const now = Date.now();
    const updatedHistory = [...p.history];
    
    if (updatedHistory.length > 0) {
      updatedHistory[updatedHistory.length - 1].exitTime = now;
    }

    updatedHistory.push({ stage: newStatus, entryTime: now });

    await mockFirestore.updatePatient(id, { 
      status: newStatus, 
      lastCalledTimestamp: now,
      history: updatedHistory
    });
  },

  getNextInQueue: (patients: Patient[], status: PatientStatus, doctorId?: string) => {
    return patients
      .filter(p => p.status === status && !p.isAbsent && (!doctorId || p.assignedDoctorId === doctorId))
      .sort((a, b) => (a.isPriority === b.isPriority ? a.timestamp - b.timestamp : a.isPriority ? -1 : 1))[0];
  },

  onSnapshot: (callback: (patients: Patient[]) => void, onError: (err: any) => void) => {
    const refresh = () => mockFirestore.getPatients().then(callback).catch(onError);
    
    if (useLocalStorage) {
      refresh();
      // Polling for local storage changes (optional but helpful if multiple tabs)
      const interval = setInterval(refresh, 2000);
      return () => clearInterval(interval);
    }

    refresh();
    const channel = supabase.channel('patients-realtime').on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, () => refresh()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }
};
