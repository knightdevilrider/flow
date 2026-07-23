
export enum PatientStatus {
  GATE_REGISTERED = 'gate_registered',
  RECEPTION_WAITING = 'reception_waiting',
  PAYMENT_DONE = 'payment_done',
  CHECKIN_WAITING = 'checkin_waiting',
  DOCTOR_WAITING = 'doctor_waiting',
  CONSULTATION_DONE = 'consultation_done',
  TREATMENT = 'treatment',
  MEDICINE_WAITING = 'medicine_waiting',
  DOCTOR_RECONSULT = 'doctor_reconsult',
  
  // IPD Workflow
  ADMISSION_DESK = 'admission_desk',
  WARD_ADMITTED = 'ward_admitted',
  ICU_ADMITTED = 'icu_admitted',
  CLEANING_REQUIRED = 'cleaning_required',
  READY_FOR_DISCHARGE = 'ready_for_discharge',
  DISCHARGE_LOUNGE = 'discharge_lounge',
  DISCHARGED = 'discharged',
  
  WARD_HANDOVER = 'ward_handover',
  CROSS_CONSULT = 'cross_consult',
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
  entryTime: number; // Milestone Start / Queue Entry
  callTime?: number; // Staff Call / Trigger
  arrivalTime?: number; // Physical Arrival at Desk/Cabin
  procedureStartTime?: number; // For Lab/Treatment
  procedureExitTime?: number; // For Lab/Treatment
  resultGenTime?: number; // For Lab/Diagnostics
  handoverTime?: number; // For Lab/Pharmacy
  exitTime?: number; // Milestone End / Stage Forwarded
  
  // IPD specific
  ipdOrderTime?: number;
  bedAllocationTime?: number;
  
  // Metadata & Accountability
  note?: string;
  actionTaken?: string; // What/Why
  directive?: string; // Clinical instructions
  stockOut?: boolean; // Pharmacy flag
  referringDoctorId?: string;
  orderingDoctorId?: string;
  authorId?: string;
  authorName?: string;
  authorSpecialty?: string;
  authorLicense?: string;
  auditHash?: string; 
  
  // Compliance
  slaBreach?: boolean;
  diagnosisICD?: string;
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
  area?: string;
  pincode?: string;
  geographicZone?: 'Urban-Ahmednagar' | 'Rural-Taluka';
  travelDistanceKm?: number;
  isUnplannedReturn24Hr?: boolean;
  payerType?: 'Cash' | 'Insurance_TPA' | 'Corporate' | 'Govt_Scheme';
  abhaStatus?: 'Linked' | 'Failed' | 'Skipped';
  abhaConsentFetchTimeSec?: number;
  // TPA Audit
  tpaPreAuthTime?: number;
  tpaApprovalTime?: number;
  
  // NABH Compliance
  isRedChannelBypass?: boolean;
  bypassJustification?: string;
  triageUrgency?: 'Red_Critical' | 'Yellow_Urgent' | 'Green_Routine';
  triageHighRiskAlert?: boolean;
  nabhPainAssessmentDone?: boolean;
  nabhInitialAssessmentTimeMins?: number;

  // Cross Consultation
  crossConsultTriggered?: boolean;

  // Ward Admission (Stage 7)
  wardAdmissionOrdered?: boolean;
  wardOrderTime?: number;
  wardAllocationTime?: number;
  wardBedArrivalTime?: number;
  wardStaffId?: string;
  allocatedBedNumber?: string;

  // Pharmacy & Revenue (Stage 8)
  prescribedItemsCount?: number;
  dispensedItemsCount?: number;
  prescriptionSubstitutionFlag?: boolean;

  photo?: string; // base64 string
  insuranceType?: string;
  isForeigner?: boolean;
  medicalHistory?: string;
  
  // Medical History & Vital Details (Admin requested)
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  currentMedications?: string;
  
  // Safety & Compliance (Admin requested)
  isDeleted?: boolean;
  deletedAt?: number;
  deletedReason?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: number;
  
  // Clinical Governance
  assignedDoctorId?: string;
  specialistNotesPending?: boolean; // Forced Reconciliation
  surgicalConsentDone?: boolean;
  dietPlan?: string;
  dietLastChecked?: number;
  customMeds?: string[]; // "Outside Meds" intake
  
  // Clinical workflow additions
  prescription?: string;
  checkinSection?: string;
  directive?: string;
  
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
    consultationFees: number;
    procedureCharges: number;
    otherCharges: number;
    discountAmount: number;
    taxAmount: number;
    totalAmountPaid: number;
    paymentMode?: 'Cash' | 'Card' | 'UPI' | 'NetBanking';
    isPaid: boolean;
  };
  referralSource?: string;
  department?: string;
  procedureDone?: string;
  diagnosisICD?: string;
  feedbackScore?: number;
}

export interface Doctor {
  id: string;
  name: string;
  section: Section;
  maxCapacity: number;
  estWaitPerPatient: number;
  roomId?: string;
  specialty?: string;
  
  // New requested fields
  subSpecialization?: string;
  licenseNumber?: string;
  qualification?: string;
  opdFloor?: string;
  associatedWard?: string;
  consultationDays?: string[];
  workingHours?: string;
  avgConsultationTime?: number;
  status?: 'Active' | 'On Leave' | 'Inactive';
  extension?: string;
  email?: string;
  phone?: string;
  consultationFee?: number;
  assistantTag?: string;
  experience?: number;
  active?: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  role: UserRole;
  employeeId: string;
  contactNumber?: string;
  department?: string;
}

export interface ShiftRotation {
  id: string;
  staffId: string;
  dayOfWeek: number; // 0-6
  shift: Shift;
  roomNumber?: string;
}

export interface Room {
  id: string;
  name: string;
  type: 'CONSULTATION' | 'PROCEDURE' | 'WARD' | 'ICU';
  assignedDoctorId?: string;
}

export interface Ward {
  id: string;
  name: string;
  type: 'GENERAL' | 'ICU' | 'PRIVATE' | 'SEMI-PRIVATE';
  totalBeds: number;
  occupiedBeds: number;
  maintenanceBeds: number;
  reserveBeds: number;
}

export type Shift = 'MORNING' | 'EVENING' | 'NIGHT';

export interface DoctorRoster {
  doctorId: string;
  shift: Shift;
  roomNumber: string;
  isOnCall: boolean;
}

export interface SystemThresholds {
  highVolumeTrigger: number;
  opdTokenLimit: number;
  isMaintenanceMode: boolean;
  waitTimeOverride?: number;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  action: string;
  details: string;
  user: string;
}

export interface ABHAConsentConfig {
  forceABHAVerification: boolean;
  autoLinkRecords: boolean;
  consentDurationMonths: number;
}

export interface BillingScheme {
  id: string;
  name: string; // PM-JAY, CGHS, etc.
  discountPercentage: number;
  taxRate: number; // GST
  preAuthLimit: number;
}

export interface NABHKPI {
  id: string;
  name: string;
  target: number;
  unit: 'days' | 'percentage' | 'minutes' | 'count';
  currentValue: number;
}

export interface SystemThresholds {
  highVolumeTrigger: number;
  opdTokenLimit: number;
  isMaintenanceMode: boolean;
  waitTimeOverride?: number;
  abhaRequired: boolean;
  gstEnabled: boolean;
  mlcPromptEnabled: boolean;
  pndtLoggingEnabled: boolean;
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
  PUBLIC = 'public',
  ADMIN = 'admin'
}

export type Theme = 'light' | 'dark' | 'titanium';
