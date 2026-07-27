import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedDatabase = async () => {
  try {
    const specializations = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology', 'Dermatology', 'General Surgery', 'Internal Medicine', 'Emergency Medicine', 'Psychiatry'];
    const roles = ['nurse', 'technician', 'reception', 'ward_care', 'pharmacy', 'billing'];
    
    console.log('Seeding Doctors...');
    for (let i = 1; i <= 15; i++) {
      await addDoc(collection(db, 'doctors'), {
        name: `Dr. ${['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'William', 'Emma'][Math.floor(Math.random() * 10)]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'][Math.floor(Math.random() * 10)]}`,
        specialty: specializations[Math.floor(Math.random() * specializations.length)],
        experience: Math.floor(Math.random() * 20) + 1,
        active: true,
        photo: '',
        registrationNumber: `REG${Math.floor(Math.random() * 100000)}`,
        qualification: 'MBBS, MD',
        timestamp: serverTimestamp()
      });
    }
    console.log('Doctors seeded successfully.');

    console.log('Seeding Staff...');
    for (let i = 1; i <= 55; i++) {
      await addDoc(collection(db, 'staff'), {
        name: `${['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Harper'][Math.floor(Math.random() * 10)]} ${['Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 'Hill'][Math.floor(Math.random() * 10)]}`,
        role: roles[Math.floor(Math.random() * roles.length)],
        employeeId: `EMP${Math.floor(Math.random() * 10000)}`,
        contactNumber: `555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        department: specializations[Math.floor(Math.random() * specializations.length)],
        supervisorId: '',
        timestamp: serverTimestamp()
      });
    }
    console.log('Staff seeded successfully.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
