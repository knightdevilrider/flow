import ExcelJS from 'exceljs';
import { Patient } from '../types';
import { workspaceSync } from '../src/services/workspaceSync';

export const downloadAuditExcel = async (patients: Patient[]) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Clinical Audit Ledger');

  // Define Columns from workspaceSync headers
  const headers = workspaceSync.getHeaders();
  sheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));

  // Add Rows
  patients.forEach((p, pIdx) => {
    const rowData = workspaceSync.formatPatientForSheet(p, pIdx);
    const row = sheet.addRow(rowData);

    // 1. Color code row backgrounds for Red Bypass or High Risk (Soft Yellow)
    if (p.isRedChannelBypass || p.triageHighRiskAlert) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF9C4' }
        };
      });
    }

    // 2. Precise Cell-Level Formatting for SLA Breaches and Revenue Leakage (Soft Red)
    // We iterate through every cell; if the header indicates a breach/leakage field and value is TRUE, color it red.
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      const value = cell.value?.toString().toUpperCase();

      const isSlaField = header.includes('SLA_Breach') || header.includes('Leakage_Flag');
      
      if (isSlaField && value === 'TRUE') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCDD2' } // Soft Red
        };
        cell.font = { bold: true, color: { argb: 'FFB71C1C' } }; // Dark Red Text
      }
    });

    // Add borders to the row for definition
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
      };
    });
  });

  // Final Styling
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } }; // Dark Blue Header

  // Add filters
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length }
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Hospital_Audit_Matrix_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
