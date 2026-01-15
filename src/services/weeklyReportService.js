/**
 * Weekly Report Service
 * Manages weekly oversold stock analysis reports (separate from daily journals)
 */

const WEEKLY_STORAGE_KEY = 'insightlog_weekly_reports';

/**
 * Get week identifier from date (e.g., "2024-01-3주차")
 * @param {Date} date - Date object
 * @returns {string} Week identifier
 */
const getWeekIdentifier = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  // Calculate week of month
  const firstDay = new Date(year, month - 1, 1);
  const dayOfMonth = date.getDate();
  const weekOfMonth = Math.ceil((dayOfMonth + firstDay.getDay()) / 7);

  return `${year}-${String(month).padStart(2, '0')}-${weekOfMonth}주차`;
};

/**
 * Get all weekly reports from localStorage
 * @returns {Array} Array of weekly reports, sorted by date (newest first)
 */
export const getAllWeeklyReports = () => {
  try {
    const stored = localStorage.getItem(WEEKLY_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const reports = JSON.parse(stored);

    // Sort by createdAt (newest first)
    return reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error loading weekly reports:', error);
    return [];
  }
};

/**
 * Save a new weekly report
 * @param {Object} report - Report data
 * @param {string} report.pdfFileName - PDF file name
 * @param {string} report.aiAnalysis - AI analysis result
 * @param {string} report.rawSummary - PDF raw text summary
 * @param {Array} report.portfolio - Portfolio snapshot (optional)
 * @returns {Object} Saved report with id and metadata
 */
export const saveWeeklyReport = ({ pdfFileName, aiAnalysis, rawSummary, portfolio = [] }) => {
  try {
    const reports = getAllWeeklyReports();
    const now = new Date();

    const newReport = {
      id: `weekly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      week: getWeekIdentifier(now),
      pdfFileName,
      aiAnalysis,
      rawSummary: rawSummary.substring(0, 500) + '...', // Store first 500 chars as summary
      portfolio: portfolio.map(stock => ({
        name: stock.name,
        profitLoss: ((stock.currentPrice - stock.avgPrice) / stock.avgPrice * 100).toFixed(2)
      })),
      createdAt: now.toISOString(),
      date: now.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    };

    reports.unshift(newReport); // Add to beginning

    localStorage.setItem(WEEKLY_STORAGE_KEY, JSON.stringify(reports));

    console.log('✅ Weekly report saved:', newReport.id);
    return newReport;

  } catch (error) {
    console.error('Error saving weekly report:', error);
    throw new Error('주간 리포트 저장에 실패했습니다.');
  }
};

/**
 * Get a single weekly report by ID
 * @param {string} id - Report ID
 * @returns {Object|null} Report or null if not found
 */
export const getWeeklyReportById = (id) => {
  const reports = getAllWeeklyReports();
  return reports.find(r => r.id === id) || null;
};

/**
 * Delete a weekly report
 * @param {string} id - Report ID to delete
 * @returns {boolean} Success status
 */
export const deleteWeeklyReport = (id) => {
  try {
    const reports = getAllWeeklyReports();
    const filtered = reports.filter(r => r.id !== id);

    if (filtered.length === reports.length) {
      console.warn('Weekly report not found:', id);
      return false;
    }

    localStorage.setItem(WEEKLY_STORAGE_KEY, JSON.stringify(filtered));
    console.log('✅ Weekly report deleted:', id);
    return true;

  } catch (error) {
    console.error('Error deleting weekly report:', error);
    throw new Error('주간 리포트 삭제에 실패했습니다.');
  }
};

/**
 * Get weekly report statistics
 * @returns {Object} Statistics
 */
export const getWeeklyReportStats = () => {
  const reports = getAllWeeklyReports();

  return {
    total: reports.length,
    thisMonth: reports.filter(r => {
      const reportDate = new Date(r.createdAt);
      const now = new Date();
      return reportDate.getMonth() === now.getMonth() &&
             reportDate.getFullYear() === now.getFullYear();
    }).length,
    lastAnalyzed: reports.length > 0 ? reports[0].date : null
  };
};

/**
 * Check if report exists for current week
 * @returns {boolean} True if report exists for current week
 */
export const hasReportForCurrentWeek = () => {
  const reports = getAllWeeklyReports();
  const currentWeek = getWeekIdentifier();

  return reports.some(r => r.week === currentWeek);
};

/**
 * Get report for current week
 * @returns {Object|null} Report for current week or null
 */
export const getCurrentWeekReport = () => {
  const reports = getAllWeeklyReports();
  const currentWeek = getWeekIdentifier();

  return reports.find(r => r.week === currentWeek) || null;
};

/**
 * Export all weekly reports as JSON
 * @returns {string} JSON string
 */
export const exportWeeklyReports = () => {
  const reports = getAllWeeklyReports();
  return JSON.stringify(reports, null, 2);
};

export default {
  getAllWeeklyReports,
  saveWeeklyReport,
  getWeeklyReportById,
  deleteWeeklyReport,
  getWeeklyReportStats,
  hasReportForCurrentWeek,
  getCurrentWeekReport,
  exportWeeklyReports
};
