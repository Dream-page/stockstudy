/**
 * Naver Finance Market Reports Service
 * Fetches market analysis reports from Naver Finance via Google Sheets
 */

// Use CORS proxy to bypass CORS restrictions
const NAVER_REPORTS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTE6rU_HSro410_ho2cm9qlg-zgvNQuakmK_iYzRcCpRmS4ZFCnsM_GvZ4egwhTMWjpLs5zwYJB2SSh/pub?gid=1977864363&single=true&output=csv';

/**
 * Parse CSV text to array of report objects
 */
const parseReportsCSV = (csvText) => {
  const lines = csvText.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV data is empty or invalid');
  }

  // Skip header row and parse data
  const reports = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma, but handle quotes
    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());

    // Skip rows with errors or empty values
    const hasError = cleanValues.some(v =>
      v.includes('#N/A') ||
      v.includes('#ERROR') ||
      v.includes('#REF!') ||
      v === ''
    );

    if (hasError || cleanValues.length < 4) {
      console.warn(`Skipping row ${i + 1} due to invalid data:`, cleanValues);
      continue;
    }

    // CSV columns: [종목명(없음), 제목, 증권사, 작성일, 조회수, URL]
    // Index:        [0,          1,    2,      3,      4,     5]
    const report = {
      id: `report-${i}-${Date.now()}`,
      title: cleanValues[1] || '',
      firm: cleanValues[2] || '증권사',
      date: cleanValues[3] || '',
      views: cleanValues[4] || '0',
      url: cleanValues[5] || ''
    };

    // Log for debugging (first 3 reports)
    if (i <= 3) {
      console.log(`Report ${i}:`, {
        title: report.title.substring(0, 30) + '...',
        firm: report.firm,
        url: report.url ? `✓ ${report.url.substring(0, 40)}...` : '✗ NO URL'
      });
    }

    // Validate required fields
    if (report.title && report.firm && report.date) {
      reports.push(report);
    }
  }

  return reports;
};

/**
 * Fetch market reports from Google Sheets
 * @returns {Promise<Array>} Array of report objects
 */
export const fetchMarketReports = async () => {
  try {
    console.log('📊 Fetching market reports from Naver Finance...');

    const response = await fetch(NAVER_REPORTS_CSV_URL, {
      method: 'GET',
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    const reports = parseReportsCSV(csvText);

    console.log(`✅ Fetched ${reports.length} market reports`);

    return {
      reports,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error fetching market reports:', error);
    throw error;
  }
};

/**
 * Format date string for display
 * @param {string} dateStr - Date string from CSV
 * @returns {string} Formatted date
 */
export const formatReportDate = (dateStr) => {
  try {
    // Handle various date formats
    if (dateStr.includes('/')) {
      const [year, month, day] = dateStr.split('/');
      return `${year}.${month.padStart(2, '0')}.${day.padStart(2, '0')}`;
    } else if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return `${year}.${month.padStart(2, '0')}.${day.padStart(2, '0')}`;
    }
    return dateStr;
  } catch (error) {
    return dateStr;
  }
};

/**
 * Get firm badge color
 * @param {string} firm - Firm name
 * @returns {string} Color code
 */
export const getFirmColor = (firm) => {
  const colors = {
    '삼성증권': '#1428A0',
    '미래에셋증권': '#003DA5',
    'KB증권': '#FFCD00',
    '한국투자증권': '#003DA5',
    'NH투자증권': '#005BAC',
    '신한투자증권': '#0046FF',
    '하나증권': '#008485',
    '키움증권': '#EA002C',
    '대신증권': '#003DA5',
    '메리츠증권': '#E60012'
  };

  return colors[firm] || '#667eea';
};

export default {
  fetchMarketReports,
  formatReportDate,
  getFirmColor
};
