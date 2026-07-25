import { Patient, PatientStatus, PatientCategory, TrackingLog, Bed } from '../types';
import { db } from '../src/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  arrayUnion,
  runTransaction
} from 'firebase/firestore';
import { workspaceSync } from '../src/services/workspaceSync';
import { getAccessToken } from '../src/lib/firebase';

const COLLECTION = 'patients';
const BEDS_COLLECTION = 'beds';

const generatePatientId = (): string => {
  const now = new Date();
  const f = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${f(now.getMonth() + 1)}${f(now.getDate())}${f(now.getHours())}${f(now.getMinutes())}${f(now.getSeconds())}`;
};

let useLocalStorage = false;

export const mockFirestore = {
  setUseLocalStorage: (val: boolean) => {
    useLocalStorage = val;
  },

  onSnapshot: (callback: (data: Patient[]) => void, onError: (err: any) => void) => {
    if (useLocalStorage) {
      const refresh = () => {
        const data = localStorage.getItem('hospital_patients_demo');
        callback(data ? JSON.parse(data) : []);
      };
      refresh();
      const interval = setInterval(refresh, 2000);
      return () => clearInterval(interval);
    }

    const q = query(collection(db, COLLECTION), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const patients = snapshot.docs.map(d => ({ ...d.data() } as Patient));
      callback(patients);
    }, onError);
  },

  getPatients: async (): Promise<Patient[]> => {
    if (useLocalStorage) {
      const data = localStorage.getItem('hospital_patients_demo');
      return data ? JSON.parse(data) : [];
    }
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map(d => d.data() as Patient);
  },

  addPatient: async (patientData: Omit<Patient, 'id' | 'timestamp' | 'history'>) => {
    const id = generatePatientId();
    const now = Date.now();
    const patient: Patient = {
      ...patientData as any,
      id,
      timestamp: now,
      history: [{ stage: (patientData as any).status || PatientStatus.GATE_REGISTERED, entryTime: now }]
    };

    if (useLocalStorage) {
      const data = localStorage.getItem('hospital_patients_demo');
      const patients = data ? JSON.parse(data) : [];
      patients.push(patient);
      localStorage.setItem('hospital_patients_demo', JSON.stringify(patients));
      return patient;
    }

    await setDoc(doc(db, COLLECTION, id), patient);
    return patient;
  },

  updatePatient: async (id: string, updates: Partial<Patient>) => {
    if (useLocalStorage) {
      const data = localStorage.getItem('hospital_patients_demo');
      const patients = data ? JSON.parse(data) : [];
      const idx = patients.findIndex((p: any) => p.id === id);
      if (idx !== -1) {
        patients[idx] = { ...patients[idx], ...updates };
        localStorage.setItem('hospital_patients_demo', JSON.stringify(patients));
      }
      return;
    }

    const patientRef = doc(db, COLLECTION, id);
    const snap = await getDoc(patientRef);
    if (!snap.exists()) {
      console.warn(`Attempted to update non-existent patient: ${id}`);
      return;
    }

    await updateDoc(patientRef, updates as any);

    if (updates.status === PatientStatus.COMPLETED) {
      const snap = await getDoc(patientRef);
      if (snap.exists()) {
        const fullPatient = snap.data() as Patient;
        const token = getAccessToken();
        if (token) {
          const success = await workspaceSync.syncPatientToWorkspace(token, fullPatient);
          if (success) {
            await deleteDoc(patientRef);
          }
        }
      }
    }
  },

  updatePatientAudited: async (id: string, updates: Partial<Patient>, logOrMessage: TrackingLog | string, authorId?: string) => {
    const now = Date.now();
    let finalLog: TrackingLog;
    
    if (typeof logOrMessage === 'string') {
      finalLog = {
        stage: (updates.status as PatientStatus) || PatientStatus.GATE_REGISTERED,
        entryTime: now,
        note: logOrMessage,
        authorId: authorId || 'SYSTEM'
      };
    } else {
      finalLog = logOrMessage;
    }

    if (useLocalStorage) {
      const data = localStorage.getItem('hospital_patients_demo');
      const patients = data ? JSON.parse(data) : [];
      const idx = patients.findIndex((p: any) => p.id === id);
      if (idx !== -1) {
        const history = [...(patients[idx].history || []), finalLog];
        patients[idx] = { ...patients[idx], ...updates, history };
        localStorage.setItem('hospital_patients_demo', JSON.stringify(patients));
      }
      return;
    }

    const patientRef = doc(db, COLLECTION, id);
    
    // Use arrayUnion for atomic updates to the history array
    await updateDoc(patientRef, {
      ...updates,
      history: arrayUnion(finalLog)
    } as any);

    if (updates.status === PatientStatus.COMPLETED) {
      const snap = await getDoc(patientRef);
      if (snap.exists()) {
        const fullPatient = snap.data() as Patient;
        const token = getAccessToken();
        if (token) {
          const success = await workspaceSync.syncPatientToWorkspace(token, fullPatient);
          if (success) {
            await deleteDoc(patientRef);
          }
        }
      }
    }
  },

  callPatient: async (id: string, newStatus: PatientStatus, currentPatients?: Patient[]) => {
    const now = Date.now();

    if (useLocalStorage) {
      const data = localStorage.getItem('hospital_patients_demo');
      const patients = data ? JSON.parse(data) : [];
      const idx = patients.findIndex((p: any) => p.id === id);
      if (idx !== -1) {
        const updatedHistory = [...(patients[idx].history || [])];
        if (updatedHistory.length > 0) {
          updatedHistory[updatedHistory.length - 1].exitTime = now;
        }
        updatedHistory.push({ stage: newStatus, entryTime: now, callTime: now, authorId: 'STAFF_AUTO' });
        patients[idx].status = newStatus;
        patients[idx].lastCalledTimestamp = now;
        patients[idx].history = updatedHistory;
        localStorage.setItem('hospital_patients_demo', JSON.stringify(patients));
      }
      return;
    }

    const patientRef = doc(db, COLLECTION, id);

    // Use a transaction since we are modifying the last element of the history array
    await runTransaction(db, async (transaction) => {
      const pDoc = await transaction.get(patientRef);
      if (!pDoc.exists()) return;

      const pData = pDoc.data() as Patient;
      const updatedHistory = [...(pData.history || [])];
      
      if (updatedHistory.length > 0) {
        updatedHistory[updatedHistory.length - 1].exitTime = now;
      }

      updatedHistory.push({ 
        stage: newStatus, 
        entryTime: now,
        callTime: now,
        authorId: 'STAFF_AUTO'
      });

      transaction.update(patientRef, {
        status: newStatus,
        lastCalledTimestamp: now,
        history: updatedHistory
      });
    });
  },

  getNextInQueue: (patients: Patient[], status: PatientStatus, doctorId?: string) => {
    return patients
      .filter(p => p.status === status && !p.isAbsent && (!doctorId || p.assignedDoctorId === doctorId))
      .sort((a, b) => (a.isPriority === b.isPriority ? a.timestamp - b.timestamp : a.isPriority ? -1 : 1))[0];
  },

  getBeds: async (): Promise<Bed[]> => {
    if (useLocalStorage) {
      const data = localStorage.getItem('hospital_beds_demo');
      return data ? JSON.parse(data) : [];
    }
    const snap = await getDocs(collection(db, BEDS_COLLECTION));
    return snap.docs.map(d => d.data() as Bed);
  },

  updateBedStatus: async (bedId: string, status: Bed['status'], patientId?: string) => {
    if (useLocalStorage) {
      const data = localStorage.getItem('hospital_beds_demo');
      const beds = data ? JSON.parse(data) : [];
      const idx = beds.findIndex((b: any) => b.id === bedId);
      if (idx !== -1) {
        beds[idx].status = status;
        beds[idx].patientId = patientId;
        localStorage.setItem('hospital_beds_demo', JSON.stringify(beds));
      }
      return;
    }
    await setDoc(doc(db, BEDS_COLLECTION, bedId), {
      status,
      currentPatientId: patientId || null,
      lastUpdated: Date.now()
    }, { merge: true });
  },

  seedDemoData: async () => {
    // Basic seeding for local storage if needed
  },

  // Helpers for clinical views
  recordConsent: async (id: string, authorId: string, signatureHash: string) => {
    await mockFirestore.updatePatient(id, { surgicalConsentDone: true } as any);
  },

  addOutsideMeds: async (id: string, medName: string) => {
    const patients = await mockFirestore.getPatients();
    const p = patients.find(x => x.id === id);
    if (p) {
      const customMeds = [...(p.customMeds || []), medName];
      await mockFirestore.updatePatient(id, { customMeds } as any);
    }
  },

  skipPatient: async (id: string) => {
    await mockFirestore.updatePatient(id, { isAbsent: true });
  },

  prioritizePatient: async (id: string) => {
    await mockFirestore.updatePatient(id, { isPriority: true, isAbsent: false });
  }
};
