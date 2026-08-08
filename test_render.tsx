
import React from 'react';
import { renderToString } from 'react-dom/server';
import PatientTimelineModal from './components/admin/PatientTimelineModal';
import PatientTable from './components/admin/PatientTable';
import { PatientCategory, PatientStatus } from './types';

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

try {
  renderToString(<PatientTimelineModal patient={badPatient} theme='dark' onClose={()=>{}} onEdit={()=>{}} onDelete={()=>{}} />);
  console.log('PatientTimelineModal rendered successfully');
} catch(e) {
  console.error('PatientTimelineModal crash:', e);
}

try {
  renderToString(<PatientTable patients={[badPatient]} onPatientClick={()=>{}} theme='dark' />);
  console.log('PatientTable rendered successfully');
} catch(e) {
  console.error('PatientTable crash:', e);
}

