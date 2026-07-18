
import { Doctor, PatientStatus } from './types';

export const DOCTORS: Doctor[] = [
  { id: 'dr-1', name: 'Dr. Anya Sharma', section: 'A', maxCapacity: 5, estWaitPerPatient: 5 },
  { id: 'dr-2', name: 'Dr. Rohan Patel', section: 'B', maxCapacity: 5, estWaitPerPatient: 5 },
  { id: 'dr-3', name: 'Dr. Sarah Jenkins', section: 'C', maxCapacity: 5, estWaitPerPatient: 5 },
  { id: 'dr-4', name: 'Dr. Michael Chen', section: 'A', maxCapacity: 5, estWaitPerPatient: 5 },
];

export const STATUS_LABELS: Record<PatientStatus, string> = {
  [PatientStatus.GATE_REGISTERED]: 'Arrived at Gate',
  [PatientStatus.RECEPTION_WAITING]: 'Called to Reception',
  [PatientStatus.PAYMENT_DONE]: 'Payment Processed',
  [PatientStatus.CHECKIN_WAITING]: 'Checked In',
  [PatientStatus.DOCTOR_WAITING]: 'In Consultation',
  [PatientStatus.CONSULTATION_DONE]: 'Consultation Over',
  [PatientStatus.MEDICINE_WAITING]: 'Waiting for Meds',
  [PatientStatus.COMPLETED]: 'Complete'
};

export const FLOW_STAGES = [
  { status: PatientStatus.GATE_REGISTERED, label: 'Gate Entry', color: 'blue' },
  { status: PatientStatus.RECEPTION_WAITING, label: 'Reception', color: 'indigo' },
  { status: PatientStatus.PAYMENT_DONE, label: 'Payment Done', color: 'purple' },
  { status: PatientStatus.CHECKIN_WAITING, label: 'Check-in', color: 'pink' },
  { status: PatientStatus.DOCTOR_WAITING, label: 'Doctor Consult', color: 'red' },
  { status: PatientStatus.CONSULTATION_DONE, label: 'Medical Supply', color: 'orange' },
  { status: PatientStatus.COMPLETED, label: 'Complete', color: 'emerald' },
];
