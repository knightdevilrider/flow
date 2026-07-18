
export enum PatientStatus {
  GATE_REGISTERED = 'gate_registered',
  RECEPTION_WAITING = 'reception_waiting',
  PAYMENT_DONE = 'payment_done',
  CHECKIN_WAITING = 'checkin_waiting',
  DOCTOR_WAITING = 'doctor_waiting',
  CONSULTATION_DONE = 'consultation_done',
  MEDICINE_WAITING = 'medicine_waiting',
  
  // IPD Workflow
  ADMISSION_DESK = 'admission_desk',
  WARD_ADMITTED = 'ward_admitted',
  ICU_ADMITTED = 'icu_admitted',
  CLEANING_REQUIRED = 'cleaning_required',
  READY_FOR_DISCHARGE = 'ready_for_discharge',
  DISCHARGE_LOUNGE = 'discharge_lounge',
  DISCHARGED = 'discharged',
  
  COMPLETED = 'completed'
}

export enum PatientCategory {
  OPD = 'Consultation (OPD)',
  IPD = 'Admitted (IPD)',
  VISITOR = 'Visitor & Family',
  ATTENDANT = 'Attendant',
  EMERGENCY = 'Emergency'
}

export type Section = 'A' | 'B' | 'C';

export interface TrackingLog {
  stage: PatientStatus;
  entryTime: number;
  exitTime?: number;
  note?: string;
  authorId?: string;
  auditHash?: string; // For "Cryptographic Consent"
}

export interface Bed {
  id: string;
  type: 'WARD' | 'ICU';
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING';
  lastOccupiedAt?: number;
  patientId?: string;
  hourlyRate: number;
}

export interface Patient {
  id: string;
  name: string;
  contactNumber: string;
  status: PatientStatus;
  category: PatientCategory;
  timestamp: number;
  lastCalledTimestamp?: number;
  
  // IPD & Security
  rfidTag?: string;
  familyQrCode?: string;
  bedId?: string;
  admissionTime?: number;
  
  // Queue flags
  isPriority?: boolean;
  isAbsent?: boolean;
  
  // Identity Fields
  idType?: string;
  idNumber?: string;
  age?: string;
  gender?: string;
  address?: string;
  photo?: string; // base64 string
  insuranceType?: string;
  isForeigner?: boolean;
  medicalHistory?: string;
  
  // Clinical Governance
  assignedDoctorId?: string;
  specialistNotesPending?: boolean; // Forced Reconciliation
  surgicalConsentDone?: boolean;
  dietPlan?: string;
  dietLastChecked?: number;
  customMeds?: string[]; // "Outside Meds" intake
  
  // Visitor & Attendant specific fields
  activeVisitorsCount: number; // 1-In / 1-Out Protocol
  targetPatientId?: string;
  relationship?: string;
  emergencyContact?: string;
  expiryTimestamp?: number;
  
  // Audit / Tracking
  history: TrackingLog[];
  billingSummary?: {
    totalBedCharges: number;
    medicationCharges: number;
    isPaid: boolean;
  };
}

export interface Doctor {
  id: string;
  name: string;
  section: Section;
  maxCapacity: number;
  estWaitPerPatient: number;
}

export enum UserRole {
  GATE = 'gate', // Exit sensors / Entrance
  RECEPTION = 'reception', // Admission Desk
  CHECKIN = 'checkin',
  DOCTOR = 'doctor',
  MEDICAL = 'medical',
  WARD_CARE = 'ward_care', // Bed management, Dietary
  BILLING = 'billing', // Discharge lounge
  VISITOR_MGMT = 'visitor_mgmt',
  ATTENDANT_MGMT = 'attendant_mgmt',
  PUBLIC = 'public'
}
