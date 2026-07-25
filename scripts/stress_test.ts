// Polyfill localStorage for Node.js
class LocalStorageMock {
  private store: { [key: string]: string } = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = value.toString(); }
  clear() { this.store = {}; }
}
(global as any).localStorage = new LocalStorageMock();

// Firebase will throw a warning about auth in node, but it should still run.

import { mockFirestore } from '../services/mockFirestore';
import { PatientStatus, PatientCategory } from '../types';

async function runStressTest() {
  console.log('Starting High-Load Stress Test...');
  mockFirestore.setUseLocalStorage(true);
  
  const startTime = Date.now();
  
  // 1. Simulate 100 Patients Arriving Simultaneously
  const addPromises = [];
  for (let i = 0; i < 100; i++) {
    addPromises.push(mockFirestore.addPatient({
      name: `Test Patient ${i}`,
      contactNumber: '9999999999',
      status: PatientStatus.GATE_REGISTERED,
      category: PatientCategory.OPD
    } as any));
  }
  
  const patients = await Promise.all(addPromises);
  console.log(`Added ${patients.length} patients in ${Date.now() - startTime}ms.`);

  // 2. Simulate 10 Staff Members Processing All Patients Concurrently
  const processPromises = [];
  const staffCount = 10;
  
  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    // Each patient gets hit by multiple concurrent state updates
    for (let j = 0; j < staffCount; j++) {
      processPromises.push(
        mockFirestore.callPatient(patient.id, PatientStatus.RECEPTION_WAITING)
      );
    }
  }

  await Promise.all(processPromises);
  
  // Verify Data Integrity
  const finalPatients = await mockFirestore.getPatients();
  let errors = 0;
  
  for (const p of finalPatients) {
    if (p.history.length === 0) {
      console.error(`ERROR: Patient ${p.id} lost history logs!`);
      errors++;
    }
  }

  if (errors === 0) {
    console.log('SUCCESS: Stress test completed with 0 data loss incidents!');
  } else {
    console.error(`FAILED: Found ${errors} concurrency errors.`);
  }
}

runStressTest().catch(console.error);
