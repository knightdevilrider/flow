
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
  [PatientStatus.TREATMENT]: 'In Treatment',
  [PatientStatus.MEDICINE_WAITING]: 'Waiting for Meds',
  [PatientStatus.DOCTOR_RECONSULT]: 'Re-Consultation',
  [PatientStatus.ADMISSION_DESK]: 'Admission Desk',
  [PatientStatus.WARD_ADMITTED]: 'Ward Admitted',
  [PatientStatus.ICU_ADMITTED]: 'ICU Admitted',
  [PatientStatus.CLEANING_REQUIRED]: 'Cleaning Req',
  [PatientStatus.READY_FOR_DISCHARGE]: 'Ready for Discharge',
  [PatientStatus.DISCHARGE_LOUNGE]: 'Discharge Lounge',
  [PatientStatus.DISCHARGED]: 'Discharged',
  [PatientStatus.WARD_HANDOVER]: 'Ward Handover',
  [PatientStatus.CROSS_CONSULT]: 'Cross Consultation',
  [PatientStatus.COMPLETED]: 'Complete'
};

export const FLOW_STAGES = [
  { status: PatientStatus.GATE_REGISTERED, label: 'Gate Entry', color: 'blue' },
  { status: PatientStatus.RECEPTION_WAITING, label: 'Reception', color: 'indigo' },
  { status: PatientStatus.PAYMENT_DONE, label: 'Payment Done', color: 'purple' },
  { status: PatientStatus.CHECKIN_WAITING, label: 'Check In', color: 'pink' },
  { status: PatientStatus.DOCTOR_WAITING, label: 'Doctor Consult', color: 'red' },
  { status: PatientStatus.CONSULTATION_DONE, label: 'Medical Supply', color: 'orange' },
  { status: PatientStatus.COMPLETED, label: 'Complete', color: 'emerald' },
];

export interface LocalityInfo {
  name: string;
  pincode: string;
  distance: number;
  zone: 'Urban-Ahmednagar' | 'Rural-Taluka';
}

export const LOCALITY_DATABASE: LocalityInfo[] = [
  // Urban Ahmednagar - Northern
  { name: "Savedi", pincode: "414003", distance: 3.5, zone: "Urban-Ahmednagar" },
  { name: "Professor Colony", pincode: "414003", distance: 3.0, zone: "Urban-Ahmednagar" },
  { name: "Pipeline Road", pincode: "414003", distance: 4.0, zone: "Urban-Ahmednagar" },
  { name: "Manmad Road / Jakat Naka", pincode: "414003", distance: 4.5, zone: "Urban-Ahmednagar" },
  { name: "Sambhajinagar", pincode: "414001", distance: 2.5, zone: "Urban-Ahmednagar" },
  { name: "Tawalenagar", pincode: "414003", distance: 4.2, zone: "Urban-Ahmednagar" },
  { name: "Pankaj Colony / T.V. Center", pincode: "414003", distance: 5.0, zone: "Urban-Ahmednagar" },
  { name: "Balikashram Road", pincode: "414003", distance: 3.8, zone: "Urban-Ahmednagar" },
  { name: "Bhistabag", pincode: "414003", distance: 5.5, zone: "Urban-Ahmednagar" },
  { name: "Shri Vihar / Shila Vihar", pincode: "414003", distance: 4.8, zone: "Urban-Ahmednagar" },
  
  // Urban Ahmednagar - Central
  { name: "Maliwada", pincode: "414001", distance: 1.5, zone: "Urban-Ahmednagar" },
  { name: "Tarakpur", pincode: "414003", distance: 0.0, zone: "Urban-Ahmednagar" },
  { name: "Kotla", pincode: "414001", distance: 2.0, zone: "Urban-Ahmednagar" },
  { name: "Topkhana", pincode: "414001", distance: 1.2, zone: "Urban-Ahmednagar" },
  { name: "Delhi Gate", pincode: "414001", distance: 1.0, zone: "Urban-Ahmednagar" },
  { name: "Sarjepura", pincode: "414001", distance: 1.8, zone: "Urban-Ahmednagar" },
  { name: "Cloth Market / Main Bazar areas", pincode: "414001", distance: 2.2, zone: "Urban-Ahmednagar" },
  
  // Urban Ahmednagar - Eastern
  { name: "Mukundnagar", pincode: "414001", distance: 2.5, zone: "Urban-Ahmednagar" },
  { name: "Mulla Colony", pincode: "414001", distance: 2.8, zone: "Urban-Ahmednagar" },
  { name: "Bhingar", pincode: "414002", distance: 5.0, zone: "Urban-Ahmednagar" },
  { name: "Burhan Nagar", pincode: "414002", distance: 4.5, zone: "Urban-Ahmednagar" },
  { name: "Ahinsanagar", pincode: "414002", distance: 3.5, zone: "Urban-Ahmednagar" },
  { name: "Sindhi Colony", pincode: "414001", distance: 2.0, zone: "Urban-Ahmednagar" },
  
  // Urban Ahmednagar - Southern/Western
  { name: "Kedgaon", pincode: "414005", distance: 6.0, zone: "Urban-Ahmednagar" },
  { name: "Gulmohor Park / Kedgaon Outskirts", pincode: "414005", distance: 7.0, zone: "Urban-Ahmednagar" },
  { name: "Nalegaon", pincode: "414001", distance: 3.0, zone: "Urban-Ahmednagar" },
  { name: "Bhutkarwadi", pincode: "414005", distance: 6.5, zone: "Urban-Ahmednagar" },
  { name: "Sarasnagar", pincode: "414005", distance: 5.8, zone: "Urban-Ahmednagar" },
  { name: "Burudgaon", pincode: "414005", distance: 7.5, zone: "Urban-Ahmednagar" },
  
  // Urban Ahmednagar - Industrial
  { name: "Nagapur / MIDC Nagapur", pincode: "414111", distance: 8.0, zone: "Urban-Ahmednagar" },
  { name: "Bolhegaon", pincode: "414111", distance: 6.5, zone: "Urban-Ahmednagar" },
  { name: "Gandhinagar", pincode: "414001", distance: 3.2, zone: "Urban-Ahmednagar" },
  { name: "Govindpura", pincode: "414001", distance: 4.0, zone: "Urban-Ahmednagar" },
  { name: "Shivajinagar", pincode: "414001", distance: 2.8, zone: "Urban-Ahmednagar" },

  // Rural Talukas
  { name: "Nagar Taluka villages", pincode: "414001", distance: 12, zone: "Rural-Taluka" },
  { name: "Parner", pincode: "414302", distance: 30, zone: "Rural-Taluka" },
  { name: "Rahuri", pincode: "413705", distance: 38, zone: "Rural-Taluka" },
  { name: "Shrigonda", pincode: "413701", distance: 45, zone: "Rural-Taluka" },
  { name: "Newasa", pincode: "414603", distance: 50, zone: "Rural-Taluka" },
  { name: "Pathardi", pincode: "414102", distance: 45, zone: "Rural-Taluka" },
  { name: "Shevgaon", pincode: "414502", distance: 60, zone: "Rural-Taluka" },
  { name: "Karjat", pincode: "414402", distance: 60, zone: "Rural-Taluka" },
  { name: "Jamkhed", pincode: "413201", distance: 75, zone: "Rural-Taluka" },
  { name: "Shrirampur", pincode: "413709", distance: 65, zone: "Rural-Taluka" },
  { name: "Sangamner", pincode: "422605", distance: 75, zone: "Rural-Taluka" },
  { name: "Rahata / Shirdi", pincode: "423107", distance: 85, zone: "Rural-Taluka" },
  { name: "Kopargaon", pincode: "423601", distance: 95, zone: "Rural-Taluka" },
];
