import { Patient, PatientStatus, PatientCategory, TrackingLog, Bed, InventoryItem, RadiologyOrder } from '../types';
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

const sanitizePatient = (p: any): Patient => ({
  ...p,
  name: String(p.name || 'Unknown Patient'),
  id: String(p.id || Math.random().toString(36).substring(2, 10)),
  status: String(p.status || 'gate_registered') as PatientStatus,
  category: String(p.category || 'General') as PatientCategory,
  gender: String(p.gender || 'Unknown'),
  idNumber: String(p.idNumber || '0000'),
  age: String(p.age || '0'),
  contactNumber: String(p.contactNumber || '0000000000'),
  bloodGroup: p.bloodGroup ? String(p.bloodGroup) : undefined,
  allergies: p.allergies ? String(p.allergies) : undefined,
  chronicConditions: p.chronicConditions ? String(p.chronicConditions) : undefined,
  timestamp: Number(p.timestamp || Date.now()) || Date.now(),
  history: Array.isArray(p.history) ? p.history : [],
});

export const mockFirestore = {
  setUseLocalStorage: (val: boolean) => {
    useLocalStorage = val;
  },

  onSnapshot: (callback: (data: Patient[]) => void, onError: (err: any) => void) => {
    if (useLocalStorage) {
      const refresh = () => {
        const data = localStorage.getItem('hospital_patients_demo');
        const parsed = data ? JSON.parse(data) : [];
        callback(parsed.map(sanitizePatient));
      };
      refresh();
      const interval = setInterval(refresh, 2000);
      return () => clearInterval(interval);
    }

    const q = query(collection(db, COLLECTION), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const patients = snapshot.docs.map(d => sanitizePatient({ ...d.data() }));
      callback(patients);
    }, onError);
  },

  getPatients: async (): Promise<Patient[]> => {
    if (useLocalStorage) {
      const data = localStorage.getItem('hospital_patients_demo');
      const parsed = data ? JSON.parse(data) : [];
      return parsed.map(sanitizePatient);
    }
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map(d => sanitizePatient(d.data()));
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

  onRadiologySnapshot: (callback: (data: RadiologyOrder[]) => void, onError: (err: any) => void) => {
    if (useLocalStorage) {
      const refresh = () => {
        const data = localStorage.getItem('hospital_radiology_demo');
        callback(data ? JSON.parse(data) : []);
      };
      refresh();
      const interval = setInterval(refresh, 2000);
      return () => clearInterval(interval);
    }

    const q = query(collection(db, 'radiology_orders'), orderBy('orderedAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ ...d.data() } as RadiologyOrder));
      callback(items);
    }, onError);
  },

  getRadiology: async (): Promise<RadiologyOrder[]> => {
    if (useLocalStorage) {
      const data = localStorage.getItem('hospital_radiology_demo');
      return data ? JSON.parse(data) : [];
    }
    const snapshot = await getDocs(collection(db, 'radiology_orders'));
    return snapshot.docs.map(d => d.data() as RadiologyOrder);
  },

  updateInventoryItem: async (id: string, updates: Partial<InventoryItem>) => {
    if (useLocalStorage) {
      const data = localStorage.getItem('hospital_inventory_demo');
      if (!data) return;
      let inventory: InventoryItem[] = JSON.parse(data);
      const index = inventory.findIndex(i => i.id === id);
      if (index !== -1) {
        inventory[index] = { ...inventory[index], ...updates };
        localStorage.setItem('hospital_inventory_demo', JSON.stringify(inventory));
      }
      return;
    }
    await updateDoc(doc(db, 'inventory', id), updates);
  },

  dispatchMedicine: async (id: string, requestedQuantity: number) => {
    // FEFO logic (First-Expiry-First-Out)
    if (useLocalStorage) {
      const data = localStorage.getItem('hospital_inventory_demo');
      if (!data) return;
      let inventory: InventoryItem[] = JSON.parse(data);
      const index = inventory.findIndex(i => i.id === id);
      if (index !== -1) {
        let item = inventory[index];
        let remainingToDeduct = requestedQuantity;
        
        // Sort batches by expiry date (oldest first)
        item.batches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
        
        for (let i = 0; i < item.batches.length; i++) {
          if (remainingToDeduct <= 0) break;
          
          if (item.batches[i].quantity > 0) {
            if (item.batches[i].quantity >= remainingToDeduct) {
              item.batches[i].quantity -= remainingToDeduct;
              remainingToDeduct = 0;
            } else {
              remainingToDeduct -= item.batches[i].quantity;
              item.batches[i].quantity = 0;
            }
          }
        }
        
        // Recalculate total quantity
        item.totalQuantity = item.batches.reduce((sum, b) => sum + b.quantity, 0);
        
        inventory[index] = item;
        localStorage.setItem('hospital_inventory_demo', JSON.stringify(inventory));
      }
      return;
    }
    // Implement Firestore version if needed, but we rely on local storage for demo
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
  { 
    id: '1', name: 'Paracetamol', type: 'Analgesic/Antipyretic', commonDosage: '650mg', category: 'Medicine', 
    batches: [{ batchId: 'B-001', quantity: 250, expiryDate: '2027-01', location: { rack: 'A', shelf: '1', box: '1' }, dateAdded: Date.now() }], 
    totalQuantity: 250, minThreshold: 50, unit: 'strips', lastUpdated: Date.now() 
  },
  { 
    id: '2', name: 'Amoxicillin + Clavulanic Acid', type: 'Antibiotic', commonDosage: '625mg', allergyRisk: 'Penicillin', category: 'Medicine', 
    batches: [{ batchId: 'B-002', quantity: 15, expiryDate: '2026-11', location: { rack: 'A', shelf: '2', box: '3' }, dateAdded: Date.now() }], 
    totalQuantity: 15, minThreshold: 20, unit: 'strips', lastUpdated: Date.now() 
  },
  { 
    id: '3', name: 'Azithromycin', type: 'Antibiotic', commonDosage: '500mg', category: 'Medicine', 
    batches: [{ batchId: 'B-003', quantity: 120, expiryDate: '2028-05', location: { rack: 'B', shelf: '1', box: '2' }, dateAdded: Date.now() }], 
    totalQuantity: 120, minThreshold: 40, unit: 'strips', lastUpdated: Date.now() 
  },
  { 
    id: '4', name: 'Pantoprazole', type: 'Antacid', commonDosage: '40mg', category: 'Medicine', 
    batches: [
      { batchId: 'B-004A', quantity: 100, expiryDate: '2026-12', location: { rack: 'C', shelf: '1', box: '1' }, dateAdded: Date.now() },
      { batchId: 'B-004B', quantity: 200, expiryDate: '2028-02', location: { rack: 'C', shelf: '1', box: '2' }, dateAdded: Date.now() }
    ], 
    totalQuantity: 300, minThreshold: 50, unit: 'strips', lastUpdated: Date.now() 
  }
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
  },

  simulateStressTest: async (count: number) => {
    if (useLocalStorage) {
      const statuses = [
        PatientStatus.GATE_REGISTERED, 
        PatientStatus.RECEPTION_WAITING, 
        PatientStatus.PAYMENT_DONE,
        PatientStatus.CHECKIN_WAITING,
        PatientStatus.DOCTOR_WAITING,
        PatientStatus.CONSULTATION_DONE,
        PatientStatus.MEDICINE_WAITING
      ];
      
      const newPatients = [];
      const now = Date.now();
      
      for (let i = 0; i < count; i++) {
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const id = `SIM-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
        
        newPatients.push({
          id,
          name: `Sim Patient ${i + 1}`,
          gender: Math.random() > 0.5 ? 'M' : 'F',
          age: Math.floor(Math.random() * 80) + 1,
          phone: '9999999999',
          timestamp: now - Math.floor(Math.random() * 10000000), // Randomize slightly so they sort correctly
          status: randomStatus,
          history: [{ stage: randomStatus, entryTime: now, authorId: 'SIMULATOR' }],
          publicDisplayConsent: true,
          photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`
        });
      }

      const existingData = localStorage.getItem('hospital_patients_demo');
      const existingPatients = existingData ? JSON.parse(existingData) : [];
      
      localStorage.setItem('hospital_patients_demo', JSON.stringify([...existingPatients, ...newPatients]));
    }
  },

  purgeToColdStorage: async () => {
    if (useLocalStorage) {
      const existingData = localStorage.getItem('hospital_patients_demo');
      if (!existingData) return;
      
      let patients = JSON.parse(existingData);
      const coldStorageData = localStorage.getItem('hospital_cold_storage') || '[]';
      const coldStorage = JSON.parse(coldStorageData);
      
      // Filter out COMPLETED or DISCHARGED patients, and drop their photo to save space
      const toArchive = patients.filter((p: any) => p.status === PatientStatus.COMPLETED || p.status === PatientStatus.DISCHARGED);
      const toKeep = patients.filter((p: any) => p.status !== PatientStatus.COMPLETED && p.status !== PatientStatus.DISCHARGED);
      
      const archivedWithDroppedPhotos = toArchive.map((p: any) => ({
        ...p,
        photo: p.photo ? 'URL_STORED_IN_CLOUD' : null // Free up huge base64 memory
      }));

      localStorage.setItem('hospital_cold_storage', JSON.stringify([...coldStorage, ...archivedWithDroppedPhotos]));
      localStorage.setItem('hospital_patients_demo', JSON.stringify(toKeep));
      
      // Notify listeners
      const listeners = (window as any).firestoreListeners || [];
      listeners.forEach((l: any) => l(toKeep));
      
      return toArchive.length;
    }
  }
};
