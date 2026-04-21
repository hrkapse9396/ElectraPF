import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const db = new Database('electrapf.db');

// Create Table
db.exec(`
  CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    billing_period TEXT,
    kWh REAL,
    kVARh_lag REAL,
    kVARh_lead REAL,
    kVAh REAL,
    meter_pf REAL,
    calculated_pf REAL,
    load_type TEXT,
    bill_amount REAL,
    sanctioned_demand_kva REAL,
    sanctioned_load_kw REAL,
    billing_demand_kva REAL,
    min_demand_kva REAL,
    explanation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// API Endpoints
app.post('/api/bills', (req, res) => {
  try {
    const data = req.body;
    const stmt = db.prepare(`
      INSERT INTO bills (
        customer_name, billing_period, kWh, kVARh_lag, kVARh_lead, kVAh, 
        meter_pf, calculated_pf, load_type, bill_amount, 
        sanctioned_demand_kva, sanctioned_load_kw, billing_demand_kva, 
        min_demand_kva, explanation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.customer_name || 'N/A',
      data.billing_period || 'N/A',
      data.kWh || 0,
      data.kVARh_lag || 0,
      data.kVARh_lead || 0,
      data.kVAh || 0,
      data.meter_pf || null,
      data.calculated_pf || 0,
      data.load_type || 'lagging',
      data.bill_amount || 0,
      data.sanctioned_demand_kva || 0,
      data.sanctioned_load_kw || 0,
      data.billing_demand_kva || 0,
      data.min_demand_kva || 0,
      data.explanation || ''
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error saving bill:', err);
    res.status(500).json({ error: 'Failed to save bill data' });
  }
});

app.get('/api/bills', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM bills ORDER BY created_at DESC').all();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.get('/api/reports/excel', async (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM bills ORDER BY created_at ASC').all() as any[];
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Electricity Bills');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 5 },
      { header: 'Date Added', key: 'created_at', width: 20 },
      { header: 'Customer', key: 'customer_name', width: 25 },
      { header: 'Period', key: 'billing_period', width: 15 },
      { header: 'kWh (Active)', key: 'kWh', width: 15 },
      { header: 'kVAh (Apparent)', key: 'kVAh', width: 15 },
      { header: 'Calculated PF', key: 'calculated_pf', width: 15 },
      { header: 'Meter PF', key: 'meter_pf', width: 15 },
      { header: 'Load Type', key: 'load_type', width: 15 },
      { header: 'Sanctioned (kVA)', key: 'sanctioned_demand_kva', width: 15 },
      { header: 'Actual Demand', key: 'billing_demand_kva', width: 15 },
      { header: 'Amount', key: 'bill_amount', width: 15 },
    ];

    rows.forEach(row => worksheet.addRow(row));

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFECECEC' }
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'ElectraPF_Report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
