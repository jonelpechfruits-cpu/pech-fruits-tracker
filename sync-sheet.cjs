const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function syncSheet() {
  const auth = new google.auth.GoogleAuth({
    keyFile: './service-account-key.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  
  try {
    // Read from Row 2 (headers) to Row 1000
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1YukR5yAfxcJOo9wMWCXt4sbfLki09u6mbhNQV6ajv1s',
      range: 'TRACKING!A2:W1000', // Only up to column W
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found.');
      return;
    }

    // Row 2 = Headers (first row in response)
    const headers = rows[0].map(h => h.trim() || 'Column');

    // Define which columns to KEEP (by index: A=0, B=1, ..., W=22)
    const keepIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 14, 16, 22]; // A-I, K, O, Q, W

    // Filter headers
    const filteredHeaders = keepIndices.map(i => headers[i] || `Col ${i}`);

    // Filter data rows (start from Row 3 → index 1)
    const data = rows.slice(1).map(row => {
      const obj = {};
      keepIndices.forEach((idx, newIdx) => {
        obj[filteredHeaders[newIdx]] = (row[idx] || '').toString().trim();
      });
      return obj;
    }).filter(row => Object.values(row).some(val => val !== ''));

    const outputPath = path.join(__dirname, 'public', 'data', 'shipments.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Synced ${data.length} shipments with ${filteredHeaders.length} selected columns`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

syncSheet();