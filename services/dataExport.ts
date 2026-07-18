
import { Patient } from '../types';

/**
 * PRO-TIP: To make this work, create a Google Apps Script with a doPost(e) function
 * that appends the incoming JSON to your sheet, then deploy it as a Web App.
 */
const GOOGLE_SHEET_WEBHOOK_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

export const exportPatientToSheet = async (patient: Patient) => {
  // If no URL is provided, we just log to console to simulate the success for this demo
  if (GOOGLE_SHEET_WEBHOOK_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
    console.log("📊 ANALYTICS_SYNC: Simulated Export to Google Sheets", {
      timestamp: new Date().toISOString(),
      patient_id: patient.id,
      name: patient.name,
      total_duration_ms: patient.history.length > 0 ? 
        (Date.now() - patient.history[0].entryTime) : 0,
      protocol_path: patient.history.map(h => h.stage).join(' -> ')
    });
    return true;
  }

  try {
    const totalDuration = patient.history.length > 0 ? 
      ((Date.now() - patient.history[0].entryTime) / 60000).toFixed(2) : '0';

    const payload = {
      sheet_id: "PATIENT_ARCHIVE_2100",
      data: {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        phone: patient.contactNumber,
        category: patient.category,
        doctor: patient.assignedDoctorId,
        prescription: patient.prescription,
        medical_history: patient.medicalHistory,
        total_minutes: totalDuration,
        checkin_time: new Date(patient.timestamp).toLocaleString(),
        completion_time: new Date().toLocaleString(),
        timeline: JSON.stringify(patient.history)
      }
    };

    const response = await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors', // Common for Apps Script web apps
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return true;
  } catch (error) {
    console.error("❌ ARCHIVE_SYNC_ERROR:", error);
    return false;
  }
};
