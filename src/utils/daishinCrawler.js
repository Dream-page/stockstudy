/**
 * Daisin Securities Report Crawler (Placeholder)
 *
 * Note: Due to CORS and certificate issues, direct crawling from browser is not feasible.
 * This module provides a structure for future server-side implementation.
 *
 * Recommended approach:
 * 1. Use a backend service (Node.js, Python) to crawl Daishin Securities
 * 2. Store results in Google Sheets
 * 3. Frontend reads from Google Sheets (current implementation)
 *
 * For now, manually add reports to Google Sheets with this format:
 * Date | Category | Title | Link | Source
 * 2026-01-14 | special | [리포트 제목] | [PDF URL] | 대신증권
 */

/**
 * Daishin Research Center URLs
 */
export const DAISHIN_URLS = {
  RESEARCH_CENTER: 'https://money2.daishin.com/E5/ResearchCenter/DM_ResearchList.aspx',
  STRATEGY_REPORTS: 'https://money2.daishin.com/E5/ResearchCenter/DM_ResearchList.aspx?pr_code=1',
  INDUSTRY_REPORTS: 'https://money2.daishin.com/E5/ResearchCenter/DM_ResearchList.aspx?pr_code=4',
  COMPANY_REPORTS: 'https://money2.daishin.com/E5/ResearchCenter/DM_ResearchList.aspx?pr_code=2'
};

/**
 * Parse Daishin report URL from Google Sheets
 * @param {string} url - Report URL
 * @returns {object} Parsed info
 */
export const parseDaishinReportUrl = (url) => {
  if (!url || !url.includes('daishin')) {
    return null;
  }

  const isDaishin = url.includes('daishin.com') || url.includes('daishin.co.kr');
  const isPDF = url.toLowerCase().includes('.pdf');
  const isResearchPage = url.includes('Research');

  return {
    isDaishin,
    isPDF,
    isResearchPage,
    source: '대신증권',
    url
  };
};

/**
 * Placeholder for future server-side crawler
 * This would be implemented in a Node.js backend
 */
export const crawlDaishinReports = async () => {
  throw new Error(
    '브라우저에서 직접 크롤링은 CORS 제한으로 불가능합니다.\n\n' +
    '해결 방법:\n' +
    '1. Google Sheets에 수동으로 리포트 추가 (현재 방식)\n' +
    '2. 백엔드 서버에서 크롤링 후 Google Sheets 자동 업데이트\n' +
    '3. Chrome Extension을 사용한 크롤링\n\n' +
    '지금은 Google Sheets를 통한 수동 입력을 권장합니다.'
  );
};

/**
 * Instructions for manual Google Sheets update
 */
export const getManualUpdateInstructions = () => {
  return `
📝 대신증권 리포트 수동 추가 방법

1. 대신증권 리서치센터 방문:
   ${DAISHIN_URLS.RESEARCH_CENTER}

2. 원하는 리포트를 찾아 클릭

3. 리포트 상세 페이지에서 PDF 다운로드 링크 복사

4. Google Sheets의 StudyFeed 탭에 다음 형식으로 추가:

   | Date       | Category | Title                    | Link                | Source     |
   |------------|----------|--------------------------|---------------------|------------|
   | 2026-01-14 | special  | [리포트 제목]            | [PDF URL 전체]      | 대신증권   |

5. 웹앱을 새로고침하면 자동으로 반영됩니다!

💡 Tip: Category를 "special"로 설정하면 PDF 전문 분석이 자동 실행됩니다.
`;
};

/**
 * Check if a report should use PDF analysis
 * @param {object} report - Report object from Google Sheets
 * @returns {boolean}
 */
export const shouldUsePDFAnalysis = (report) => {
  if (!report) return false;

  // Category가 "special"인 경우
  if (report.category?.toLowerCase() === 'special') {
    return true;
  }

  // Link가 PDF URL인 경우
  if (report.link?.toLowerCase().includes('.pdf')) {
    return true;
  }

  // 대신증권 리포트인 경우
  if (report.source?.includes('대신증권') && report.link) {
    return true;
  }

  return false;
};

export default {
  DAISHIN_URLS,
  parseDaishinReportUrl,
  crawlDaishinReports,
  getManualUpdateInstructions,
  shouldUsePDFAnalysis
};
