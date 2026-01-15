/**
 * Test updated naverFinanceService
 */

// Import the service (simulated since we're in Node.js)
const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTE6rU_HSro410_ho2cm9qlg-zgvNQuakmK_iYzRcCpRmS4ZFCnsM_GvZ4egwhTMWjpLs5zwYJB2SSh/pub';

const parseReportsCSV = (csvText) => {
  const lines = csvText.trim().split('\n');

  if (lines.length < 2) {
    console.warn('CSV data is empty');
    return [];
  }

  const reports = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());

    if (cleanValues.length === 0 || !cleanValues[0]) {
      continue;
    }

    const hasError = cleanValues.some(v =>
      v.includes('#N/A') ||
      v.includes('#ERROR') ||
      v.includes('#REF!')
    );

    if (hasError) {
      continue;
    }

    const report = {
      id: `report-${i}-${Date.now()}-${Math.random()}`,
      title: cleanValues[0] || '',
      firm: cleanValues[1] || '증권사',
      date: cleanValues[3] || '',
      views: cleanValues[4] || '0',
      url: cleanValues[5] || ''
    };

    if (report.title && report.firm && report.date) {
      reports.push(report);
    }
  }

  // Sort by date (newest first)
  reports.sort((a, b) => {
    const parseDate = (dateStr) => {
      if (!dateStr) return 0;
      const cleaned = dateStr.replace(/[./]/g, '');
      return parseInt(cleaned, 10);
    };
    return parseDate(b.date) - parseDate(a.date);
  });

  console.log(`✅ Parsed ${reports.length} reports, sorted by date (newest first)`);
  console.log(`📅 Date range: ${reports[0]?.date} → ${reports[reports.length - 1]?.date}\n`);

  return reports;
};

async function testService() {
  try {
    const csvUrl = `${BASE_URL}?gid=1977864363&single=true&output=csv`;
    console.log('📊 Testing updated service...\n');

    const response = await fetch(csvUrl, {
      method: 'GET',
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    const reports = parseReportsCSV(csvText);

    console.log('Top 5 reports (최신순):');
    reports.slice(0, 5).forEach((report, index) => {
      console.log(`\n${index + 1}. ${report.title}`);
      console.log(`   증권사: ${report.firm}`);
      console.log(`   날짜: ${report.date}`);
      console.log(`   조회수: ${report.views}`);
      console.log(`   URL: ${report.url ? '✓' : '✗'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testService();
