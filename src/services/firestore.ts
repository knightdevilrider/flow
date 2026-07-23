import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDocs, 
  query, 
  where,
  deleteDoc,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Patient, PatientStatus } from '../../types';

const COLLECTION = 'patients';

export const firestoreService = {
  onSnapshot: (callback: (data: Patient[]) => void, errorCallback: (err: any) => void) => {
    return onSnapshot(collection(db, COLLECTION), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data() } as Patient));
      callback(data);
    }, errorCallback);
  },

  getPatients: async () => {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map(doc => doc.data() as Patient);
  },

  savePatient: async (patient: Patient) => {
    const patientRef = doc(db, COLLECTION, patient.id);
    await setDoc(patientRef, {
      ...patient,
      updatedAt: Date.now()
    }, { merge: true });
  },

  deletePatient: async (patientId: string) => {
    await deleteDoc(doc(db, COLLECTION, patientId));
  }
};
