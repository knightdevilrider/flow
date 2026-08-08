
import React from 'react';
import { renderToString } from 'react-dom/server';
import AdminConsole from './views/AdminConsole';
import { Theme, PatientCategory } from './types';
import { mockFirestore } from './services/mockFirestore';

const badPatient = {
  id: 'test',
  name: 'Test',
  contactNumber: '00',
  category: PatientCategory.GENERAL_WARD,
  gender: 'M',
  idNumber: '1234',
  timestamp: undefined as any,
  history: [
    { stage: undefined as any, entryTime: undefined as any }
  ],
  status: undefined as any,
  age: '30'
};

const originalOnSnapshot = mockFirestore.onSnapshot;
mockFirestore.onSnapshot = (callback) => {
  callback([badPatient]);
  return () => {};
};

try {
  renderToString(<AdminConsole theme='dark' doctors={[]} staff={[]} onDoctorsChange={()=>{}} onStaffChange={()=>{}} />);
  console.log('AdminConsole rendered successfully with bad data!');
} catch(e) {
  console.error('AdminConsole crash:', e);
}

mockFirestore.onSnapshot = originalOnSnapshot;

