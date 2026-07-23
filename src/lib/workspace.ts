import { Patient } from '../../types';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export async function uploadToDrive(accessToken: string, fileName: string, blob: Blob) {
  const metadata = {
    name: fileName,
    mimeType: blob.type,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Drive upload failed: ${response.statusText}`);
  }

  return response.json();
}

export async function appendToSheet(accessToken: string, spreadsheetId: string, range: string, values: any[][]) {
  const response = await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    throw new Error(`Sheet append failed: ${response.statusText}`);
  }

  return response.json();
}

export async function createSpreadsheet(accessToken: string, title: string) {
  const response = await fetch(SHEETS_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
    }),
  });

  if (!response.ok) {
    throw new Error(`Spreadsheet creation failed: ${response.statusText}`);
  }

  return response.json();
}
