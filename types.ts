
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
  LAB_WAITING = 'lab_waiting',
  LAB_DONE = 'lab_done',
  RADIOLOGY_WAITING = 'radiology_waiting',
  RADIOLOGY_DONE = 'radiology_done',
  PHARMACY_DONE = 'pharmacy_done',
  MISSED_TURN = 'missed_turn',
  
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
  EMERGENCY = 'Emergency',
  GENERAL_WARD = 'General Ward'
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
  authorId?: string; // Who made the update
  note?: string; // Any notes left at this stage
  
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
  
  // Deletion Request
  deletionRequest?: {
    requestedBy: string;
    reason: string;
    requestedAt: number;
  };
  
  // Identity Fields
  authorName?: string;
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
  
  // NABH Compliance & Vitals
  isRedChannelBypass?: boolean;
  bypassJustification?: string;
  triageUrgency?: 'Red_Critical' | 'Yellow_Urgent' | 'Green_Routine';
  triageHighRiskAlert?: boolean;
  nabhPainAssessmentDone?: boolean;
  nabhInitialAssessmentTimeMins?: number;
  
  // Vitals
  temperature?: string;
  bloodPressure?: string;
  pulse?: string;
  weight?: string;
  spo2?: string;

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
  publicDisplayConsent?: boolean;
  labTests?: any[];
  labResults?: any[];
  tokenNumber?: string;
  
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
  assignedTreatmentType?: string; // e.g. 'X-Ray', 'Laboratory'
  treatmentResults?: string; // e.g. 'Fracture detected in left tibia'
  isPriorityReconsult?: boolean; // True when returning from treatment
  
  // Clinical workflow additions
  prescription?: string;
  prescribedDrugs?: any[];
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
  supervisorId?: string; // Links this staff to a SUPERVISOR
  currentShift?: Shift; // Added for duty roster drag and drop
  shiftApproved?: boolean;
  
  // Auto-Scheduling & Roster Fields
  rotationPattern?: 'Morning-Night' | 'Fixed-Morning' | 'Fixed-Evening' | 'Fixed-Night';
  lastWeeklyOff?: number;
  hasAppAccess?: boolean;
  isOnline?: boolean;
}

export interface Post {
  id: string;
  name: string;
  type: 'Inside' | 'Outside';
  requiredRole: UserRole;
  requiredHeadcount: number;
  department?: string;
}

export interface RosterSchedule {
  id: string;
  date: string; // YYYY-MM-DD
  status: 'Draft' | 'Published';
  assignments: {
    staffId: string;
    postId: string;
    shiftId: string; // 'MORNING' or 'NIGHT'
    status: 'Present' | 'Absent' | 'Leave';
    isOfflineUser?: boolean;
  }[];
  generatedAt: number;
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

export type Shift = string;

export interface ShiftConfig {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  iconName?: string;
  color?: string;
}

export interface CustomRole {
  id: string;
  name: string;
  createdAt: number;
}

export interface InventoryBatch {
  batchId: string;
  quantity: number;
  expiryDate: string;
  location: { rack: string; shelf: string; box: string; };
  dateAdded: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  type?: string;
  commonDosage?: string;
  allergyRisk?: string;
  category: 'Medicine' | 'Consumable' | 'Equipment';
  batches: InventoryBatch[];
  totalQuantity: number;
  minThreshold: number;
  unit: string;
  lastUpdated: number;
}

export interface RadiologyOrder {
  id: string;
  patientId: string;
  patientName: string;
  testName: string; // e.g. "Chest X-Ray", "MRI Brain"
  orderedBy: string; // Doctor name
  orderedAt: number;
  status: 'pending' | 'completed';
  resultText?: string;
  resultImageUrl?: string;
  completedAt?: number;
  completedBy?: string; // Radiologist name
}

export enum UserRole {
  UNASSIGNED = 'unassigned',
  GATE = 'gate', // Exit sensors / Entrance
  RECEPTION = 'reception', // Admission Desk
  CHECKIN = 'checkin',
  DOCTOR = 'doctor',
  MEDICAL = 'medical', // Treatment Station
  PHARMACY = 'pharmacy', // Pharmacy & Billing
  WARD_CARE = 'ward_care', // Bed management, Dietary
  BILLING = 'billing', // Discharge lounge
  LAB = 'lab', // Laboratory Services
  RADIOLOGY = 'radiology', // Radiology / RIS
  INVENTORY = 'inventory', // Store & Inventory Management
  VISITOR_MGMT = 'visitor_mgmt',
  ATTENDANT_MGMT = 'attendant_mgmt',
  PUBLIC = 'public',
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor'
}

export const ROLE_CATEGORIES = [
  {
    label: 'Medical Staff (Doctors)',
    roles: [
      { id: UserRole.DOCTOR, name: 'Consultants & Specialists' },
      { id: UserRole.MEDICAL, name: 'Resident Medical Officers (RMOs)' },
      { id: UserRole.DOCTOR, name: 'Surgeons & Anesthetists' },
      { id: UserRole.DOCTOR, name: 'Intensivists (ICU/NICU/PICU)' },
      { id: UserRole.MEDICAL, name: 'Emergency Medical Officers' },
    ]
  },
  {
    label: 'Nursing & Ward Care',
    roles: [
      { id: UserRole.WARD_CARE, name: 'Ward Nurses / Bed Management' },
      { id: UserRole.MEDICAL, name: 'Treatment Station Nurse' },
    ]
  },
  {
    label: 'Allied Medical',
    roles: [
      { id: UserRole.PHARMACY, name: 'Pharmacy & Billing' },
      { id: UserRole.LAB, name: 'Laboratory Services' },
      { id: UserRole.RADIOLOGY, name: 'Radiology / RIS' },
      { id: UserRole.INVENTORY, name: 'Store / Inventory' },
    ]
  },
  {
    label: 'Administration & Front Desk',
    roles: [
      { id: UserRole.RECEPTION, name: 'Reception & Admission Desk' },
      { id: UserRole.CHECKIN, name: 'Check-In Station' },
      { id: UserRole.BILLING, name: 'Discharge Lounge (Billing)' },
      { id: UserRole.ADMIN, name: 'System Administrator' },
      { id: UserRole.SUPERVISOR, name: 'Floor Supervisor' },
    ]
  },
  {
    label: 'Security & Management',
    roles: [
      { id: UserRole.GATE, name: 'Gate & Security Guards' },
      { id: UserRole.VISITOR_MGMT, name: 'Visitor Management' },
      { id: UserRole.ATTENDANT_MGMT, name: 'Attendant Management' },
    ]
  }
];

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



export type Theme = 'light' | 'dark' | 'titanium';

export interface Workstation {
  id: string;
  name: string;
  type?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  role?: string;
  domain?: string;
  createdAt?: number;
}

export interface CustomRole {
  id: string;
  name: string;
  permissions: string[];
}
