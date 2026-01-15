/**
 * Check Research sheet data structure
 */

const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTE6rU_HSro410_ho2cm9qlg-zgvNQuakmK_iYzRcCpRmS4ZFCnsM_GvZ4egwhTMWjpLs5zwYJB2SSh/pub';

async function checkResearchSheet() {
  try {
    const csvUrl = `${BASE_URL}?gid=1977864363&single=true&output=csv`;
    console.log('📊 Fetching Research sheet data...\n');

    const response = await fetch(csvUrl, {
      method: 'GET',
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');

    console.log(`Total lines: ${lines.length}\n`);
    console.log('Header (Line 0):');
    console.log(lines[0]);
    console.log('\nFirst 5 data rows:\n');

    for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
      console.log(`Line ${i}:`);
      console.log(lines[i]);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkResearchSheet();
