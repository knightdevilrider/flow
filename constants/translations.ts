import { PatientStatus } from '../types';

export type LanguageCode = 'mr' | 'hi' | 'en';

export interface AppTranslations {
  calling: string;
  patientId: string;
  waitlistQueue: string;
  queueEmpty: string;
  id: string;
  estWait: string;
  min: string;
  status: Record<PatientStatus, string>;
  criticalSystemBlackout?: string;
  criticalMessage: string;
  marquee: string;
  boards: Record<string, string>;
  waiting: string;
}

export const TRANSLATIONS: Record<LanguageCode, AppTranslations> = {
  mr: {
    calling: 'पुढील कॉल',
    patientId: 'रुग्ण आयडी',
    waitlistQueue: 'प्रतीक्षा यादी',
    queueEmpty: 'रांग रिकामी आहे',
    id: 'आयडी',
    estWait: 'अंदाजे वेळ',
    min: 'मिनिटे',
    criticalSystemBlackout: 'गंभीर सिस्टीम ब्लॅकआउट',
    criticalMessage: 'पुढील सूचनेपर्यंत सर्व गैर-तातडीच्या सेवा निलंबित',
    marquee: 'आपल्या सहकार्याबद्दल धन्यवाद   साईदीप हॉस्पिटलमध्ये आपले स्वागत आहे   कृपया आपल्या नावाची प्रतीक्षा करा   प्रगत आरोग्य प्रणाली',
    boards: {
      reception: 'रिसेप्शन',
      checkin: 'चेक-इन',
      doctor: 'डॉक्टर',
      treatment: 'उपचार',
      billing: 'बिलिंग आणि फार्मसी',
      waitlist: 'प्रतीक्षा यादी'
    },
    waiting: 'वाट पाहणे',
    status: {
      [PatientStatus.GATE_REGISTERED]: 'गेटवर उपस्थित',
      [PatientStatus.RECEPTION_WAITING]: 'रिसेप्शनला बोलावले',
      [PatientStatus.PAYMENT_DONE]: 'पेमेंट पूर्ण',
      [PatientStatus.CHECKIN_WAITING]: 'चेक-इन पूर्ण',
      [PatientStatus.DOCTOR_WAITING]: 'डॉक्टरांसोबत',
      [PatientStatus.CONSULTATION_DONE]: 'तपासणी पूर्ण',
      [PatientStatus.TREATMENT]: 'उपचार सुरू',
      [PatientStatus.MEDICINE_WAITING]: 'औषधांची प्रतीक्षा',
      [PatientStatus.DOCTOR_RECONSULT]: 'पुन्हा तपासणी',
      [PatientStatus.LAB_WAITING]: 'लॅबची प्रतीक्षा',
      [PatientStatus.LAB_DONE]: 'लॅब पूर्ण',
      [PatientStatus.RADIOLOGY_WAITING]: 'रेडिओलॉजीची प्रतीक्षा',
      [PatientStatus.RADIOLOGY_DONE]: 'रेडिओलॉजी पूर्ण',
      [PatientStatus.PHARMACY_DONE]: 'फार्मसी पूर्ण',
      [PatientStatus.MISSED_TURN]: 'तपासणी चुकली',
      [PatientStatus.ADMISSION_DESK]: 'प्रवेश डेस्क',
      [PatientStatus.WARD_ADMITTED]: 'वॉर्डमध्ये दाखल',
      [PatientStatus.ICU_ADMITTED]: 'आयसीयूत दाखल',
      [PatientStatus.CLEANING_REQUIRED]: 'स्वच्छता आवश्यक',
      [PatientStatus.READY_FOR_DISCHARGE]: 'डिस्चार्जसाठी तयार',
      [PatientStatus.DISCHARGE_LOUNGE]: 'डिस्चार्ज लाउंज',
      [PatientStatus.DISCHARGED]: 'डिस्चार्ज दिले',
      [PatientStatus.WARD_HANDOVER]: 'वॉर्ड हँडओव्हर',
      [PatientStatus.CROSS_CONSULT]: 'क्रॉस कन्सल्टेशन',
      [PatientStatus.COMPLETED]: 'पूर्ण'
    }
  },
  hi: {
    calling: 'अगला कॉल',
    patientId: 'मरीज आईडी',
    waitlistQueue: 'प्रतीक्षा सूची',
    queueEmpty: 'कतार खाली है',
    id: 'आईडी',
    estWait: 'अनुमानित समय',
    min: 'मिनट',
    criticalSystemBlackout: 'गंभीर सिस्टम ब्लैकआउट',
    criticalMessage: 'अगली सूचना तक सभी गैर-आपातकालीन सेवाएं निलंबित',
    marquee: 'आपके सहयोग के लिए धन्यवाद   साईदीप अस्पताल में आपका स्वागत है   कृपया अपने नाम की प्रतीक्षा करें   उन्नत स्वास्थ्य प्रणाली',
    boards: {
      reception: 'रिसेप्शन',
      checkin: 'चेक-इन',
      doctor: 'डॉक्टर',
      treatment: 'उपचार',
      billing: 'बिलिंग और फार्मेसी',
      waitlist: 'प्रतीक्षा सूची'
    },
    waiting: 'इंतज़ार',
    status: {
      [PatientStatus.GATE_REGISTERED]: 'गेट पर मौजूद',
      [PatientStatus.RECEPTION_WAITING]: 'रिसेप्शन पर बुलाया',
      [PatientStatus.PAYMENT_DONE]: 'भुगतान पूर्ण',
      [PatientStatus.CHECKIN_WAITING]: 'चेक-इन पूर्ण',
      [PatientStatus.DOCTOR_WAITING]: 'डॉक्टर के साथ',
      [PatientStatus.CONSULTATION_DONE]: 'परामर्श पूर्ण',
      [PatientStatus.TREATMENT]: 'उपचार चल रहा है',
      [PatientStatus.MEDICINE_WAITING]: 'दवा की प्रतीक्षा',
      [PatientStatus.DOCTOR_RECONSULT]: 'पुनः परामर्श',
      [PatientStatus.LAB_WAITING]: 'लैब की प्रतीक्षा',
      [PatientStatus.LAB_DONE]: 'लैब पूर्ण',
      [PatientStatus.RADIOLOGY_WAITING]: 'रेडियोलॉजी की प्रतीक्षा',
      [PatientStatus.RADIOLOGY_DONE]: 'रेडियोलॉजी पूर्ण',
      [PatientStatus.PHARMACY_DONE]: 'फार्मेसी पूर्ण',
      [PatientStatus.MISSED_TURN]: 'बारी छूट गई',
      [PatientStatus.ADMISSION_DESK]: 'प्रवेश डेस्क',
      [PatientStatus.WARD_ADMITTED]: 'वार्ड में भर्ती',
      [PatientStatus.ICU_ADMITTED]: 'आईसीयू में भर्ती',
      [PatientStatus.CLEANING_REQUIRED]: 'सफाई आवश्यक',
      [PatientStatus.READY_FOR_DISCHARGE]: 'छुट्टी के लिए तैयार',
      [PatientStatus.DISCHARGE_LOUNGE]: 'डिस्चार्ज लाउंज',
      [PatientStatus.DISCHARGED]: 'छुट्टी दे दी गई',
      [PatientStatus.WARD_HANDOVER]: 'वार्ड हैंडओवर',
      [PatientStatus.CROSS_CONSULT]: 'क्रॉस कंसल्टेशन',
      [PatientStatus.COMPLETED]: 'पूर्ण'
    }
  },
  en: {
    calling: 'Calling',
    patientId: 'PATIENT ID',
    waitlistQueue: 'Waitlist Queue',
    queueEmpty: 'Queue is Empty',
    id: 'ID',
    estWait: 'EST. WAIT',
    min: 'MIN',
    criticalSystemBlackout: 'CRITICAL SYSTEM BLACKOUT',
    criticalMessage: 'All non-emergency services suspended until further notice',
    marquee: 'THANK YOU FOR YOUR COOPERATION   WELCOME TO SAIDEEP HOSPITAL   PLEASE WATCH FOR YOUR NAME   ADVANCED HEALTH SYSTEMS',
    boards: {
      reception: 'Reception',
      checkin: 'Check-In',
      doctor: 'Doctor',
      treatment: 'Treatment',
      billing: 'Billing & Pharmacy',
      waitlist: 'Waitlist Queue'
    },
    waiting: 'WAITING',
    status: {
      [PatientStatus.GATE_REGISTERED]: 'Arrived at Gate',
      [PatientStatus.RECEPTION_WAITING]: 'Called to Reception',
      [PatientStatus.PAYMENT_DONE]: 'Payment Processed',
      [PatientStatus.CHECKIN_WAITING]: 'Checked In',
      [PatientStatus.DOCTOR_WAITING]: 'In Consultation',
      [PatientStatus.CONSULTATION_DONE]: 'Consultation Over',
      [PatientStatus.TREATMENT]: 'In Treatment',
      [PatientStatus.MEDICINE_WAITING]: 'Waiting for Meds',
      [PatientStatus.DOCTOR_RECONSULT]: 'Re-Consultation',
      [PatientStatus.LAB_WAITING]: 'Waiting for Lab',
      [PatientStatus.LAB_DONE]: 'Lab Done',
      [PatientStatus.RADIOLOGY_WAITING]: 'Waiting for Radiology',
      [PatientStatus.RADIOLOGY_DONE]: 'Radiology Done',
      [PatientStatus.PHARMACY_DONE]: 'Pharmacy Done',
      [PatientStatus.MISSED_TURN]: 'Missed Turn',
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
    }
  }
};
