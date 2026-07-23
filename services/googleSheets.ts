
const SPREADSHEET_ID_KEY = 'google_sheets_log_spreadsheet_id';

export interface DeletionLog {
  patientId: string;
  patientName: string;
  reason: string;
  deletedAt: string;
  deletedBy: string;
}

export interface SyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  timestamp: number;
}

export const googleSheetsService = {
  async logDeletion(log: DeletionLog, accessToken: string) {
    let spreadsheetId = localStorage.getItem(SPREADSHEET_ID_KEY);

    if (!spreadsheetId) {
      spreadsheetId = await this.createLogSheet(accessToken);
      localStorage.setItem(SPREADSHEET_ID_KEY, spreadsheetId);
    }

    await this.appendRow(spreadsheetId, log, accessToken);
  },

  async exportToSheets(accessToken: string, patients: any[]): Promise<SyncResult> {
    const spreadsheetId = await this.createFullExportSheet(accessToken);
    
    // Header row
    const headers = [
      'Patient ID', 'Name', 'Category', 'Status', 'Registration Time', 'Area', 'Triage Level'
    ];
    
    const rows = patients.map(p => [
      p.id, p.name, p.category, p.status, new Date(p.timestamp).toLocaleString(), p.area || 'N/A', p.triageUrgency || 'N/A'
    ]);

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [headers, ...rows],
      }),
    });

    return {
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      timestamp: Date.now()
    };
  },

  async createFullExportSheet(accessToken: string): Promise<string> {
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `Patient Flow Export - ${new Date().toLocaleDateString()}`,
        },
      }),
    });
    if (!response.ok) throw new Error('Failed to create export spreadsheet');
    const data = await response.json();
    return data.spreadsheetId;
  },

  async createLogSheet(accessToken: string): Promise<string> {
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: 'Hospital Patient Deletion Log',
        },
        sheets: [
          {
            properties: {
              title: 'Logs',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: [
                      { userEnteredValue: { stringValue: 'Patient ID' } },
                      { userEnteredValue: { stringValue: 'Patient Name' } },
                      { userEnteredValue: { stringValue: 'Reason' } },
                      { userEnteredValue: { stringValue: 'Deleted At' } },
                      { userEnteredValue: { stringValue: 'Deleted By' } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Failed to create spreadsheet: ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    return data.spreadsheetId;
  },

  async appendRow(spreadsheetId: string, log: DeletionLog, accessToken: string) {
    const range = 'Logs!A:E';
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [
          [log.patientId, log.patientName, log.reason, log.deletedAt, log.deletedBy],
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Failed to append row: ${JSON.stringify(err)}`);
    }
  },
};

export const exportToSheets = googleSheetsService.exportToSheets.bind(googleSheetsService);
export const logDeletion = googleSheetsService.logDeletion.bind(googleSheetsService);
