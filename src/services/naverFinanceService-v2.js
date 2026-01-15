/**
 * Naver Finance Market Reports Service V2
 * Combines data from two Google Sheets:
 * - gid=0 or main sheet: Report metadata (title, firm, date, views)
 * - gid=1977864363: Report URLs
 */

const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTE6rU_HSro410_ho2cm9qlg-zgvNQuakmK_iYzRcCpRmS4ZFCnsM_GvZ4egwhTMWjpLs5zwYJB2SSh/pub';

// Fallback mock data for testing
const MOCK_REPORTS = [
  {
    id: 'mock-1',
    title: '2025년 1월 증시 전망 - 반도체 업황 개선 기대',
    firm: '대신증권',
    date: '26.01.14',
    views: '1,234',
    url: 'https://finance.naver.com/research/market_info_read.naver?nid=34654'
  },
  {
    id: 'mock-2',
    title: 'AI 반도체 수요 증가로 본 2025 전략',
    firm: '삼성증권',
    date: '26.01.13',
    views: '987',
    url: 'https://finance.naver.com/research/market_info_read.naver?nid=34653'
  },
  {
    id: 'mock-3',
    title: '2차전지 업종 투자 포인트',
    firm: '미래에셋증권',
    date: '26.01.13',
    views: '856',
    url: 'https://finance.naver.com/research/market_info_read.naver?nid=34652'
  },
  {
    id: 'mock-4',
    title: '미국 금리 인하 시나리오와 한국 증시',
    firm: 'KB증권',
    date: '26.01.12',
    views: '743',
    url: 'https://finance.naver.com/research/market_info_read.naver?nid=34651'
  },
  {
    id: 'mock-5',
    title: '바이오 제약 업종 전망',
    firm: '한국투자증권',
    date: '26.01.12',
    views: '621',
    url: 'https://finance.naver.com/research/market_info_read.naver?nid=34650'
  }
];

/**
 * Parse CSV text to array of report objects
 */
const parseReportsCSV = (csvText) => {
  const lines = csvText.trim().split('\n');

  if (lines.length < 2) {
    console.warn('CSV data is empty, using mock data');
    return MOCK_REPORTS;
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
      console.warn(`Skipping row ${i + 1} due to invalid data`);
      continue;
    }

    // Try different CSV structures
    let report;

    // Structure 1: [종목명, 제목, 증권사, 작성일, 조회수, URL]
    if (cleanValues.length >= 6) {
      report = {
        id: `report-${i}-${Date.now()}`,
        title: cleanValues[1] || '',
        firm: cleanValues[2] || '증권사',
        date: cleanValues[3] || '',
        views: cleanValues[4] || '0',
        url: cleanValues[5] || ''
      };
    }
    // Structure 2: [제목, 증권사, 작성일, 조회수, URL]
    else if (cleanValues.length >= 5) {
      report = {
        id: `report-${i}-${Date.now()}`,
        title: cleanValues[0] || '',
        firm: cleanValues[1] || '증권사',
        date: cleanValues[2] || '',
        views: cleanValues[3] || '0',
        url: cleanValues[4] || ''
      };
    } else {
      continue;
    }

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

  // If no valid reports found, use mock data
  if (reports.length === 0) {
    console.warn('No valid reports found in CSV, using mock data');
    return MOCK_REPORTS;
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

    // Try gid=0 first (main sheet)
    let csvUrl = `${BASE_URL}?gid=0&single=true&output=csv`;
    let response = await fetch(csvUrl, {
      method: 'GET',
      cache: 'no-cache',
    });

    // If gid=0 fails, try gid=1977864363
    if (!response.ok) {
      console.log('gid=0 failed, trying gid=1977864363...');
      csvUrl = `${BASE_URL}?gid=1977864363&single=true&output=csv`;
      response = await fetch(csvUrl, {
        method: 'GET',
        cache: 'no-cache',
      });
    }

    // If still fails, use mock data
    if (!response.ok) {
      console.warn('Both gids failed, using mock data');
      return {
        reports: MOCK_REPORTS,
        lastUpdated: new Date().toISOString()
      };
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
    console.warn('Using mock data due to error');
    return {
      reports: MOCK_REPORTS,
      lastUpdated: new Date().toISOString()
    };
  }
};

/**
 * Format date string for display
 */
export const formatReportDate = (dateStr) => {
  try {
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
