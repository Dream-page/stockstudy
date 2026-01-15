/**
 * Streak Handler Utility
 * Manages daily study streak tracking
 */

const STREAK_STORAGE_KEY = 'insightlog_study_streak';

/**
 * Get current streak data
 * @returns {Object} Streak data { lastStudyDate, currentStreak, maxStreak }
 */
export const getStreakData = () => {
  try {
    const stored = localStorage.getItem(STREAK_STORAGE_KEY);
    if (!stored) {
      return {
        lastStudyDate: null,
        currentStreak: 0,
        maxStreak: 0
      };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading streak data:', error);
    return {
      lastStudyDate: null,
      currentStreak: 0,
      maxStreak: 0
    };
  }
};

/**
 * Save streak data
 * @param {Object} data - Streak data to save
 */
const saveStreakData = (data) => {
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving streak data:', error);
  }
};

/**
 * Get today's date string (YYYY-MM-DD)
 * @returns {string} Today's date
 */
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Check if a date is yesterday
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {boolean} Is yesterday
 */
const isYesterday = (dateStr) => {
  if (!dateStr) return false;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  return dateStr === yesterdayStr;
};

/**
 * Check in - Record today's study completion
 * @returns {Object} Updated streak data with isNewRecord flag
 */
export const checkIn = () => {
  const today = getTodayDateString();
  const streakData = getStreakData();

  // Already checked in today - no change
  if (streakData.lastStudyDate === today) {
    console.log('✅ Already checked in today');
    return {
      ...streakData,
      isNewRecord: false,
      streakIncreased: false
    };
  }

  let newStreak;
  let isNewRecord = false;

  // Studied yesterday - increment streak
  if (isYesterday(streakData.lastStudyDate)) {
    newStreak = streakData.currentStreak + 1;
    console.log(`🔥 Streak +1! Now at ${newStreak} days`);
  }
  // Missed a day - reset to 1
  else {
    newStreak = 1;
    console.log('📅 New streak started: 1 day');
  }

  // Check if new max streak
  const newMaxStreak = Math.max(newStreak, streakData.maxStreak);
  if (newMaxStreak > streakData.maxStreak) {
    isNewRecord = true;
    console.log(`🏆 New record! ${newMaxStreak} days`);
  }

  const updatedData = {
    lastStudyDate: today,
    currentStreak: newStreak,
    maxStreak: newMaxStreak
  };

  saveStreakData(updatedData);

  return {
    ...updatedData,
    isNewRecord,
    streakIncreased: newStreak > 1 || (newStreak === 1 && streakData.currentStreak === 0)
  };
};

/**
 * Check if user studied today
 * @returns {boolean} Studied today
 */
export const hasStudiedToday = () => {
  const today = getTodayDateString();
  const streakData = getStreakData();
  return streakData.lastStudyDate === today;
};

/**
 * Reset streak (for testing or user request)
 */
export const resetStreak = () => {
  const resetData = {
    lastStudyDate: null,
    currentStreak: 0,
    maxStreak: 0
  };
  saveStreakData(resetData);
  console.log('🔄 Streak reset');
};

/**
 * Get streak status message
 * @returns {string} Status message
 */
export const getStreakMessage = () => {
  const streakData = getStreakData();
  const { currentStreak } = streakData;

  if (currentStreak === 0) {
    return '학습을 시작해보세요!';
  } else if (currentStreak === 1) {
    return '좋은 시작입니다!';
  } else if (currentStreak < 7) {
    return `${currentStreak}일 연속 성장 중!`;
  } else if (currentStreak < 30) {
    return `${currentStreak}일 연속! 대단해요! 🎉`;
  } else if (currentStreak < 100) {
    return `${currentStreak}일 연속! 전문가의 길! 🔥`;
  } else {
    return `${currentStreak}일 연속! 레전드! 👑`;
  }
};

/**
 * Get motivational message based on streak
 * @returns {string} Motivational message
 */
export const getMotivationalMessage = (currentStreak) => {
  if (currentStreak < 3) {
    return '꾸준함이 실력이 됩니다!';
  } else if (currentStreak < 7) {
    return '일주일만 더 채우면 습관이 돼요!';
  } else if (currentStreak < 30) {
    return '이미 투자 고수의 습관을 가지셨네요!';
  } else if (currentStreak < 100) {
    return '효린님의 투자 내공이 느껴집니다!';
  } else {
    return '효린님은 이미 전설입니다!';
  }
};

export default {
  getStreakData,
  checkIn,
  hasStudiedToday,
  resetStreak,
  getStreakMessage,
  getMotivationalMessage
};
