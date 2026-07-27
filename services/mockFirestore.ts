import { Patient, PatientStatus, PatientCategory, TrackingLog, Bed, InventoryItem } from '../types';
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

  onInventorySnapshot: (callback: (data: InventoryItem[]) => void, onError: (err: any) => void) => {
    if (useLocalStorage) {
      const refresh = () => {
        const data = localStorage.getItem('hospital_inventory_demo');
        callback(data ? JSON.parse(data) : []);
      };
      refresh();
      const interval = setInterval(refresh, 2000);
      return () => clearInterval(interval);
    }

    const q = query(collection(db, 'inventory'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ ...d.data() } as InventoryItem));
      callback(items);
    }, onError);
  },

  getInventory: async (): Promise<InventoryItem[]> => {
    if (useLocalStorage) {
      const data = localStorage.getItem('hospital_inventory_demo');
      return data ? JSON.parse(data) : [];
    }
    const snapshot = await getDocs(collection(db, 'inventory'));
    return snapshot.docs.map(d => d.data() as InventoryItem);
  },

  updateInventoryItem: async (id: string, updates: Partial<InventoryItem>) => {
    if (useLocalStorage) {
      const data = localStorage.getItem('hospital_inventory_demo');
      let inventory: InventoryItem[] = data ? JSON.parse(data) : [];
      inventory = inventory.map(item => item.id === id ? { ...item, ...updates } : item);
      localStorage.setItem('hospital_inventory_demo', JSON.stringify(inventory));
      return;
    }
    await updateDoc(doc(db, 'inventory', id), updates);
  },

  addInventoryItem: async (item: Omit<InventoryItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 15);
    const fullItem = { ...item, id } as InventoryItem;
    if (useLocalStorage) {
      const data = localStorage.getItem('hospital_inventory_demo');
      let inventory: InventoryItem[] = data ? JSON.parse(data) : [];
      inventory.push(fullItem);
      localStorage.setItem('hospital_inventory_demo', JSON.stringify(inventory));
      return;
    }
    await setDoc(doc(db, 'inventory', id), fullItem);
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

    // Firestore rejects undefined values, so we must remove them
    Object.keys(patient).forEach(key => {
      if ((patient as any)[key] === undefined) {
        delete (patient as any)[key];
      }
    });

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

    // Firestore rejects undefined values in updates too
    Object.keys(updates).forEach(key => {
      if ((updates as any)[key] === undefined) {
        delete (updates as any)[key];
      }
    });

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
    if (useLocalStorage) {
      const existingInventory = localStorage.getItem('hospital_inventory_demo');
      if (!existingInventory || JSON.parse(existingInventory).length === 0) {
        const INDIAN_DRUG_INDEX: InventoryItem[] = [
          { id: '1', name: 'Paracetamol', type: 'Analgesic/Antipyretic', commonDosage: '650mg', quantity: 250, minThreshold: 50 },
          { id: '2', name: 'Amoxicillin + Clavulanic Acid', type: 'Antibiotic', commonDosage: '625mg', allergyRisk: 'Penicillin', quantity: 15, minThreshold: 20 },
          { id: '3', name: 'Azithromycin', type: 'Antibiotic', commonDosage: '500mg', quantity: 120, minThreshold: 40 },
          { id: '4', name: 'Pantoprazole', type: 'Antacid', commonDosage: '40mg', quantity: 300, minThreshold: 50 },
          { id: '5', name: 'Domperidone + Pantoprazole', type: 'Antiemetic/Antacid', commonDosage: '30mg/40mg', quantity: 180, minThreshold: 50 },
          { id: '6', name: 'Metformin', type: 'Antidiabetic', commonDosage: '500mg', quantity: 80, minThreshold: 100 },
          { id: '7', name: 'Telmisartan', type: 'Antihypertensive', commonDosage: '40mg', quantity: 0, minThreshold: 50 },
          { id: '8', name: 'Amlodipine', type: 'Antihypertensive', commonDosage: '5mg', quantity: 200, minThreshold: 50 },
          { id: '9', name: 'Levocetirizine', type: 'Antihistamine', commonDosage: '5mg', quantity: 45, minThreshold: 50 },
          { id: '10', name: 'Ibuprofen + Paracetamol', type: 'NSAID', commonDosage: '400mg/325mg', quantity: 110, minThreshold: 50 },
        ];
        localStorage.setItem('hospital_inventory_demo', JSON.stringify(INDIAN_DRUG_INDEX));
      }
    }
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
