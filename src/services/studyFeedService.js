/**
 * Study Feed Service
 * Manages daily study items and completion status
 */

const STUDY_FEED_STORAGE_KEY = 'insightlog_study_feed';
const COMPLETION_STATUS_KEY = 'insightlog_study_completion';

/**
 * Get completion status for study items
 * @returns {Object} Map of item IDs to completion status
 */
export const getCompletionStatus = () => {
  try {
    const stored = localStorage.getItem(COMPLETION_STATUS_KEY);
    if (!stored) {
      return {};
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading completion status:', error);
    return {};
  }
};

/**
 * Mark study item as completed
 * @param {string} itemId - Study item ID
 * @returns {void}
 */
export const markAsCompleted = (itemId) => {
  try {
    const status = getCompletionStatus();
    status[itemId] = {
      completed: true,
      completedAt: new Date().toISOString()
    };
    localStorage.setItem(COMPLETION_STATUS_KEY, JSON.stringify(status));
    console.log('✅ Marked as completed:', itemId);
  } catch (error) {
    console.error('Error marking as completed:', error);
  }
};

/**
 * Mark study item as incomplete
 * @param {string} itemId - Study item ID
 * @returns {void}
 */
export const markAsIncomplete = (itemId) => {
  try {
    const status = getCompletionStatus();
    delete status[itemId];
    localStorage.setItem(COMPLETION_STATUS_KEY, JSON.stringify(status));
    console.log('✅ Marked as incomplete:', itemId);
  } catch (error) {
    console.error('Error marking as incomplete:', error);
  }
};

/**
 * Merge study items with completion status
 * @param {Array} items - Study items from Google Sheets
 * @returns {Array} Items with isCompleted flag
 */
export const mergeWithCompletionStatus = (items) => {
  const status = getCompletionStatus();

  return items.map(item => ({
    ...item,
    isCompleted: status[item.id]?.completed || false,
    completedAt: status[item.id]?.completedAt || null
  }));
};

/**
 * Get study feed statistics
 * @param {Array} items - Study items
 * @returns {Object} Statistics
 */
export const getStudyFeedStats = (items) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const todayItems = items.filter(item => item.date === todayStr);
  const completedToday = todayItems.filter(item => item.isCompleted).length;

  return {
    total: items.length,
    todayTotal: todayItems.length,
    todayCompleted: completedToday,
    todayProgress: todayItems.length > 0
      ? Math.round((completedToday / todayItems.length) * 100)
      : 0
  };
};

/**
 * Clean up old completion status (older than 7 days)
 * @returns {void}
 */
export const cleanupOldStatus = () => {
  try {
    const status = getCompletionStatus();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let cleaned = false;
    Object.keys(status).forEach(itemId => {
      const completedAt = new Date(status[itemId].completedAt);
      if (completedAt < sevenDaysAgo) {
        delete status[itemId];
        cleaned = true;
      }
    });

    if (cleaned) {
      localStorage.setItem(COMPLETION_STATUS_KEY, JSON.stringify(status));
      console.log('✅ Cleaned up old completion status');
    }
  } catch (error) {
    console.error('Error cleaning up status:', error);
  }
};

export default {
  getCompletionStatus,
  markAsCompleted,
  markAsIncomplete,
  mergeWithCompletionStatus,
  getStudyFeedStats,
  cleanupOldStatus
};
