/**
 * Check raw CSV structure
 */

const NAVER_REPORTS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTE6rU_HSro410_ho2cm9qlg-zgvNQuakmK_iYzRcCpRmS4ZFCnsM_GvZ4egwhTMWjpLs5zwYJB2SSh/pub?gid=1977864363&single=true&output=csv';

async function checkRawCSV() {
  try {
    console.log('📊 Fetching raw CSV...\n');

    const response = await fetch(NAVER_REPORTS_CSV_URL, {
      method: 'GET',
      cache: 'no-cache',
    });

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');

    console.log('First 5 lines (raw):\n');
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      console.log(`Line ${i}: ${lines[i].substring(0, 150)}${lines[i].length > 150 ? '...' : ''}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRawCSV();
