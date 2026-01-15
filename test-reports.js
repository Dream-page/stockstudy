/**
 * Test script to verify Google Sheets data is being fetched correctly
 */

const NAVER_REPORTS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTE6rU_HSro410_ho2cm9qlg-zgvNQuakmK_iYzRcCpRmS4ZFCnsM_GvZ4egwhTMWjpLs5zwYJB2SSh/pub?gid=1977864363&single=true&output=csv';

async function testFetchReports() {
  try {
    console.log('📊 Testing fetch from Google Sheets...\n');

    const response = await fetch(NAVER_REPORTS_CSV_URL, {
      method: 'GET',
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');

    console.log(`✅ Fetched ${lines.length - 1} rows (excluding header)\n`);
    console.log('📋 First 3 data rows:\n');

    for (let i = 1; i <= Math.min(3, lines.length - 1); i++) {
      const line = lines[i].trim();
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());

      console.log(`Row ${i}:`);
      console.log(`  Title: ${cleanValues[1]}`);
      console.log(`  Firm: ${cleanValues[2]}`);
      console.log(`  Date: ${cleanValues[3]}`);
      console.log(`  Views: ${cleanValues[4]}`);
      console.log(`  URL: ${cleanValues[5] ? '✓ ' + cleanValues[5].substring(0, 60) + '...' : '✗ NO URL'}`);
      console.log('');
    }

    // Check for errors
    const errorRows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('#N/A') || line.includes('#ERROR') || line.includes('#REF!')) {
        errorRows.push(i);
      }
    }

    if (errorRows.length > 0) {
      console.log(`⚠️  Found ${errorRows.length} rows with errors: ${errorRows.slice(0, 5).join(', ')}${errorRows.length > 5 ? '...' : ''}`);
    } else {
      console.log('✅ No error rows detected');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFetchReports();
