import { Patient, PatientStatus } from '../../types';
import { appendToSheet, uploadToDrive, createSpreadsheet } from '../lib/workspace';
import ExcelJS from 'exceljs';

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Ideally this should be created or fetched

export const workspaceSync = {
  getSpreadsheetId: () => localStorage.getItem('AUDIT_SPREADSHEET_ID'),
  setSpreadsheetId: (id: string) => localStorage.setItem('AUDIT_SPREADSHEET_ID', id),

  syncPatientToWorkspace: async (accessToken: string, patient: Patient) => {
    try {
      // 1. Ensure we have a spreadsheet
      let spreadsheetId = workspaceSync.getSpreadsheetId();
      
      if (!spreadsheetId) {
        console.log('No spreadsheet found, creating new one...');
        const newSheet = await createSpreadsheet(accessToken, 'Audit Intelligence Pro - Clinical History Ledger');
        spreadsheetId = newSheet.spreadsheetId;
        if (spreadsheetId) {
          workspaceSync.setSpreadsheetId(spreadsheetId);
          // Add Headers
          const headers = workspaceSync.getHeaders();
          await appendToSheet(accessToken, spreadsheetId, 'Sheet1!A1', [headers]);
        }
      }

      if (!spreadsheetId) throw new Error('Could not resolve Spreadsheet ID');

      // 2. Prepare Data for Google Sheet (Horizontal History Record)
      const row = workspaceSync.formatPatientForSheet(patient);
      await appendToSheet(accessToken, spreadsheetId, 'Sheet1!A1', [row]);

      // 3. Generate Excel Audit and Upload to Drive
      const excelBlob = await workspaceSync.generateExcelAudit(patient);
      await uploadToDrive(accessToken, `Audit_${patient.id}_${patient.name.replace(/\s+/g, '_')}.xlsx`, excelBlob);

      return true;
    } catch (err) {
      console.error('Workspace sync error:', err);
      return false;
    }
  },

  getHeaders: () => [
    'S.No', 'Patient_ID', 'Patient_Name', 'Age', 'Gender',
    'Patient_Address (Locality/Area name within or around Ahmednagar, e.g., Savedi, Kedgaon, Bhingar)',
    'Patient_Pincode (6-digit postal code for catchment analysis)',
    'Geographic_Zone (Urban-Ahmednagar / Rural-Taluka)',
    'Travel_Distance_Km (Estimated transit distance to hospital)',
    'Patient_Category (OPD / IPD / Emergency)',
    'Is_Unplanned_Return_24Hr (TRUE/FALSE - Tracks clinical return risk)',
    'Payer_Type (Cash / Insurance_TPA / Corporate / Govt_Scheme like Ayushman Bharat-ABDM)',
    'ABHA_Linked_Status (Linked / Failed / Skipped)',
    'ABHA_Consent_Fetch_Time_Sec (Isolates ABDM server delay from staff metric)',
    'TPA_Pre_Auth_Submission_Time', 'TPA_Approval_Received_Time', 'TPA_Approval_Lag_Mins',
    
    // NABH
    'Is_Red_Channel_Bypass (TRUE/FALSE - If TRUE, bypasses standard stage timers straight to Doctor/ER)',
    'Bypass_Justification_Notes',
    'Triage_Urgency_Level (Red_Critical / Yellow_Urgent / Green_Routine)',
    'Triage_High_Risk_Alert (TRUE/FALSE evaluated from vital signs like high BP or low SpO2)',
    'NABH_Pain_Assessment_Done (TRUE/FALSE)',
    'NABH_Initial_Assessment_Time_Mins',

    // STAGE 1: GATE
    'Gate_Entry_Time', 'Gate_Exit_Time', 'Gate_Processing_Sec', 'Gate_Staff_ID', 'Gate_SLA_Breach (TRUE/FALSE if > 5 mins)',

    // STAGE 2: RECEPTION
    'Reception_Queue_IN', 'Reception_Call_Time', 'Reception_Arrival_Time', 'Reception_Process_OUT',
    'Reception_Wait_Sec', 'Reception_Response_Sec', 'Reception_Processing_Sec', 'Reception_Staff_ID', 'Reception_SLA_Breach (TRUE/FALSE if > 10 mins)',

    // STAGE 3: TRIAGE
    'Checkin_Queue_IN', 'Checkin_Call_Time', 'Checkin_Arrival_Time', 'Checkin_Process_OUT',
    'Checkin_Wait_Sec', 'Checkin_Response_Sec', 'Checkin_Processing_Sec', 'Checkin_Staff_ID', 'Checkin_SLA_Breach (TRUE/FALSE if > 8 mins)',

    // STAGE 4: CONSULTATION
    'Doc1_Queue_IN', 'Doc1_Call_Time', 'Doc1_Arrival_Time', 'Doc1_Process_OUT',
    'Doc1_Wait_Sec', 'Doc1_Response_Sec', 'Doc1_Consultation_Sec', 'Doc1_ID', 'Doc1_Specialty', 'Doc1_SLA_Breach (TRUE/FALSE if > 20 mins)',
    'Doc1_Diagnosis_ICD_Code', 'Doc1_Clinical_Directive (Referred to Treatment / Referred to Cross-Consult / Discharge)',

    // STAGE 4A: CROSS
    'Cross_Consult_Triggered (TRUE/FALSE)', 'Referring_Doc_ID', 'Receiving_Specialist_Doc_ID',
    'Specialist_Queue_IN', 'Specialist_Arrival_Time', 'Specialist_Process_OUT', 'Specialist_Wait_Sec', 'Specialist_SLA_Breach (TRUE/FALSE if > 15 mins)',

    // STAGE 5: LAB/TREATMENT
    'Lab_Arrival_Time', 'Lab_Proc_Start', 'Lab_Proc_Exit', 'Lab_Result_Gen_Time', 'Lab_Handover_Time',
    'Lab_Wait_Sec', 'Lab_Processing_Sec', 'Lab_Reporting_TAT_Sec', 'Lab_Tech_ID', 'Lab_Ordering_Doc_ID', 'Lab_SLA_Breach (TRUE/FALSE if TAT > 45 mins)',

    // STAGE 6: RE-CONSULT
    'Doc2_Queue_IN', 'Doc2_Arrival_Time', 'Doc2_Process_OUT', 'Doc2_Wait_Sec', 'Doc2_Review_Sec', 'Doc2_ID', 'Doc2_SLA_Breach (TRUE/FALSE if > 15 mins)',

    // STAGE 7: WARD
    'Ward_Admission_Ordered (TRUE/FALSE)', 'Ward_Order_Time', 'Ward_Allocation_Time', 'Ward_Bed_Arrival_Time',
    'Ward_Transit_Lag_Sec', 'Ward_Staff_ID', 'Allocated_Bed_Number', 'Ward_SLA_Breach (TRUE/FALSE if lag > 30 mins)',

    // STAGE 8: PHARMACY
    'Pharmacy_Token_IN', 'Pharmacy_Arrival_Time', 'Pharmacy_Process_OUT', 'Pharmacy_Wait_Sec', 'Pharmacy_Dispensing_Sec',
    'Pharmacist_ID', 'Pharmacy_Prescribing_Doc_ID', 'Pharmacy_Stock_Out_Flag (TRUE/FALSE)',
    'Prescription_Substitution_Flag (TRUE/FALSE)', 'Pharmacy_SLA_Breach (TRUE/FALSE if dispensing > 12 mins)',
    'Total_Prescribed_Items_Count', 'Total_Dispensed_Items_Count', 'Revenue_Leakage_Flag (TRUE/FALSE if counts mismatch)',

    // SUMMARIES
    'Total_Journey_Duration_Mins', 'Total_Active_Processing_Mins', 'Total_Passive_Waiting_Mins',
    'Total_Late_Action_Alerts_Triggered (Calculated aggregate sum of all TRUE SLA breach flags on this specific row)',
    'Operational_Compliance_Status (PASS / FAIL)'
  ],

  formatPatientForSheet: (p: Patient, index?: number) => {
    const getStage = (status: PatientStatus) => p.history.find(h => h.stage === status) || ({} as any);
    
    const calcDurations = (stage: any) => {
      const wait = stage.callTime && stage.entryTime ? (stage.callTime - stage.entryTime) / 1000 : 0;
      const response = stage.arrivalTime && stage.callTime ? (stage.arrivalTime - stage.callTime) / 1000 : 0;
      const process = stage.exitTime && (stage.arrivalTime || stage.callTime || stage.entryTime) 
        ? (stage.exitTime - (stage.arrivalTime || stage.callTime || stage.entryTime)) / 1000 
        : 0;
      const total = stage.exitTime && stage.entryTime ? (stage.exitTime - stage.entryTime) / 1000 : 0;
      return { wait, response, process, total };
    };

    const fmt = (t: number | undefined) => t ? new Date(t).toISOString() : '';

    const s1 = getStage(PatientStatus.GATE_REGISTERED);
    const s2 = getStage(PatientStatus.RECEPTION_WAITING);
    const s3 = getStage(PatientStatus.CHECKIN_WAITING);
    const s4 = getStage(PatientStatus.DOCTOR_WAITING);
    const s4a = getStage(PatientStatus.CROSS_CONSULT);
    const s5 = getStage(PatientStatus.TREATMENT);
    const s6 = getStage(PatientStatus.DOCTOR_RECONSULT);
    const s7 = getStage(PatientStatus.WARD_HANDOVER);
    const s8 = getStage(PatientStatus.MEDICINE_WAITING);

    const d1 = calcDurations(s1);
    const d2 = calcDurations(s2);
    const d3 = calcDurations(s3);
    const d4 = calcDurations(s4);
    const d4a = calcDurations(s4a);
    const d5 = calcDurations(s5);
    const d6 = calcDurations(s6);
    const d7 = calcDurations(s7);
    const d8 = calcDurations(s8);

    const totalDuration = p.history.length > 0 ? (p.history[p.history.length - 1].exitTime || Date.now()) - p.history[0].entryTime : 0;
    const totalActive = (d1.process + d2.process + d3.process + d4.process + d4a.process + d5.process + d6.process + d7.process + d8.process) / 60;
    const totalWait = (d2.wait + d3.wait + d4.wait + d4a.wait + d5.wait + d6.wait + d7.wait + d8.wait) / 60;
    const totalLateActions = p.history.filter(h => h.slaBreach).length;
    const revenueLeakage = (p.prescribedItemsCount || 0) !== (p.dispensedItemsCount || 0);

    return [
      index !== undefined ? index + 1 : '',
      // CORE PATIENT DEMOGRAPHICS & GEOGRAPHIC INFRASTRUCTURE
      p.id, p.name, p.age, p.gender, p.area || p.address, p.pincode, p.geographicZone, p.travelDistanceKm, p.category,
      p.isUnplannedReturn24Hr ? 'TRUE' : 'FALSE', p.payerType, p.abhaStatus, p.abhaConsentFetchTimeSec,
      fmt(p.tpaPreAuthTime), fmt(p.tpaApprovalTime),
      p.tpaApprovalTime && p.tpaPreAuthTime ? (p.tpaApprovalTime - p.tpaPreAuthTime) / 60000 : 0,

      // CLINICAL TRIAGE & COMPLIANCE (NABH QUALITY CONTROL)
      p.isRedChannelBypass ? 'TRUE' : 'FALSE', p.bypassJustification, p.triageUrgency,
      p.triageHighRiskAlert ? 'TRUE' : 'FALSE', p.nabhPainAssessmentDone ? 'TRUE' : 'FALSE', p.nabhInitialAssessmentTimeMins,

      // STAGE 1: GATE
      fmt(s1.entryTime), fmt(s1.exitTime), d1.total, s1.authorId, s1.slaBreach ? 'TRUE' : 'FALSE',

      // STAGE 2: RECEPTION
      fmt(s2.entryTime), fmt(s2.callTime), fmt(s2.arrivalTime), fmt(s2.exitTime),
      d2.wait, d2.response, d2.process, s2.authorId, s2.slaBreach ? 'TRUE' : 'FALSE',

      // STAGE 3: TRIAGE CHECK-IN
      fmt(s3.entryTime), fmt(s3.callTime), fmt(s3.arrivalTime), fmt(s3.exitTime),
      d3.wait, d3.response, d3.process, s3.authorId, s3.slaBreach ? 'TRUE' : 'FALSE',

      // STAGE 4: PRIMARY CONSULTATION
      fmt(s4.entryTime), fmt(s4.callTime), fmt(s4.arrivalTime), fmt(s4.exitTime),
      d4.wait, d4.response, d4.process, s4.authorId, s4.authorSpecialty, s4.slaBreach ? 'TRUE' : 'FALSE',
      p.diagnosisICD, s4.directive,

      // STAGE 4A: CROSS-CONSULTATION
      p.crossConsultTriggered ? 'TRUE' : 'FALSE', s4a.orderingDoctorId, s4a.authorId,
      fmt(s4a.entryTime), fmt(s4a.arrivalTime), fmt(s4a.exitTime), d4a.wait, s4a.slaBreach ? 'TRUE' : 'FALSE',

      // STAGE 5: LAB
      fmt(s5.arrivalTime), fmt(s5.procedureStartTime), fmt(s5.procedureExitTime), fmt(s5.resultGenTime), fmt(s5.handoverTime),
      d5.wait, d5.process, 
      s5.resultGenTime && s5.procedureExitTime ? (s5.resultGenTime - s5.procedureExitTime) / 1000 : 0,
      s5.authorId, s5.orderingDoctorId, s5.slaBreach ? 'TRUE' : 'FALSE',

      // STAGE 6: DOCTOR RE-CONSULTATION
      fmt(s6.entryTime), fmt(s6.arrivalTime), fmt(s6.exitTime), d6.wait, d6.process, s6.authorId, s6.slaBreach ? 'TRUE' : 'FALSE',

      // STAGE 7: EMERGENCY-TO-WARD HANDOVER
      p.wardAdmissionOrdered ? 'TRUE' : 'FALSE', fmt(p.wardOrderTime), fmt(p.wardAllocationTime), fmt(p.wardBedArrivalTime),
      p.wardBedArrivalTime && p.wardAllocationTime ? (p.wardBedArrivalTime - p.wardAllocationTime) / 1000 : 0,
      p.wardStaffId, p.allocatedBedNumber, s7.slaBreach ? 'TRUE' : 'FALSE',

      // STAGE 8: PHARMACY
      fmt(s8.entryTime), fmt(s8.arrivalTime), fmt(s8.exitTime), d8.wait, d8.process,
      s8.authorId, s8.orderingDoctorId, s8.stockOut ? 'TRUE' : 'FALSE',
      p.prescriptionSubstitutionFlag ? 'TRUE' : 'FALSE', s8.slaBreach ? 'TRUE' : 'FALSE',
      p.prescribedItemsCount || 0, p.dispensedItemsCount || 0, revenueLeakage ? 'TRUE' : 'FALSE',

      // FINAL PERFORMANCE SUMMARIES
      totalDuration / 60000, totalActive, totalWait, totalLateActions, totalLateActions > 0 ? 'FAIL' : 'PASS'
    ];
  },

  generateExcelAudit: async (p: Patient) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Clinical Audit Ledger');

    // Define all horizontal headers
    const headers = workspaceSync.getHeaders();
    
    // Set columns with headers
    sheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));

    // Format the data row
    const rowData = workspaceSync.formatPatientForSheet(p);
    
    // Add the single patient row
    const row = sheet.addRow(rowData);

    // Apply some styling to headers
    sheet.getRow(1).font = { bold: true, size: 10 };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Auto-filter for easy auditing
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
};
