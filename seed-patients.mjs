import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedPatients = async () => {
  try {
    const statuses = [
      'gate_registered', 'reception_waiting', 'payment_done', 
      'checkin_waiting', 'doctor_waiting', 'consultation_done',
      'treatment', 'medicine_waiting', 'doctor_reconsult',
      'admission_desk', 'ward_admitted', 'icu_admitted'
    ];
    const categories = ['Consultation (OPD)', 'Admitted (IPD)', 'Emergency'];
    
    console.log('Seeding 100 Patients...');
    let promises = [];
    for (let i = 1; i <= 100; i++) {
      promises.push(addDoc(collection(db, 'patients'), {
        name: `${['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'William', 'Emma'][Math.floor(Math.random() * 10)]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'][Math.floor(Math.random() * 10)]}`,
        contactNumber: `98765${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        timestamp: Date.now() - Math.floor(Math.random() * 10000000), // Random time in the past few hours
        age: `${Math.floor(Math.random() * 80) + 1}`,
        gender: ['Male', 'Female'][Math.floor(Math.random() * 2)]
      }));
    }
    
    await Promise.all(promises);
    console.log('100 Patients seeded successfully.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding patients:', error);
    process.exit(1);
  }
};

seedPatients();
