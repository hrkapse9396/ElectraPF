import { BillData } from './gemini';

const API_BASE_URL = 'http://localhost:3001/api';

export async function saveBillData(data: BillData): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/bills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to save bill data to database');
  }
}

export async function getBillHistory(): Promise<BillData[]> {
  const response = await fetch(`${API_BASE_URL}/bills`);
  if (!response.ok) {
    throw new Error('Failed to fetch bill history');
  }
  return response.json();
}

export async function downloadExcelReport(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/reports/excel`);
  if (!response.ok) {
    throw new Error('Failed to download report');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ElectraPF_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
