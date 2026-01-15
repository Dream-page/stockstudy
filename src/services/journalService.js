/**
 * Learning Journal Service
 * Manages investment learning journal entries in localStorage
 */

const JOURNAL_STORAGE_KEY = 'insightlog_learning_journal';

/**
 * Get all journal entries from localStorage
 * @returns {Array} Array of journal entries, sorted by date (newest first)
 */
export const getAllJournals = () => {
  try {
    const stored = localStorage.getItem(JOURNAL_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const journals = JSON.parse(stored);

    // Sort by timestamp (newest first)
    return journals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('Error loading journals:', error);
    return [];
  }
};

/**
 * Save a new journal entry
 * @param {Object} entry - Journal entry data
 * @param {string} entry.aiAnalysis - AI analysis content
 * @param {string} entry.userNote - User's learning note
 * @param {Array} entry.reports - Reports analyzed (optional)
 * @param {Array} entry.portfolio - Portfolio snapshot (optional)
 * @returns {Object} Saved journal entry with id and timestamp
 */
export const saveJournal = ({ aiAnalysis, userNote, reports = [], portfolio = [] }) => {
  try {
    const journals = getAllJournals();

    const newEntry = {
      id: `journal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      timestamp: new Date().toISOString(),
      aiAnalysis,
      userNote,
      reports: reports.slice(0, 5).map(r => ({
        title: r.title,
        firm: r.firm,
        date: r.date
      })),
      portfolio: portfolio.map(stock => ({
        name: stock.name,
        profitLoss: ((stock.currentPrice - stock.avgPrice) / stock.avgPrice * 100).toFixed(2)
      }))
    };

    journals.unshift(newEntry); // Add to beginning

    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(journals));

    console.log('✅ Journal saved:', newEntry.id);
    return newEntry;

  } catch (error) {
    console.error('Error saving journal:', error);
    throw new Error('일지 저장에 실패했습니다.');
  }
};

/**
 * Get a single journal entry by ID
 * @param {string} id - Journal entry ID
 * @returns {Object|null} Journal entry or null if not found
 */
export const getJournalById = (id) => {
  const journals = getAllJournals();
  return journals.find(j => j.id === id) || null;
};

/**
 * Delete a journal entry
 * @param {string} id - Journal entry ID to delete
 * @returns {boolean} Success status
 */
export const deleteJournal = (id) => {
  try {
    const journals = getAllJournals();
    const filtered = journals.filter(j => j.id !== id);

    if (filtered.length === journals.length) {
      console.warn('Journal not found:', id);
      return false;
    }

    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(filtered));
    console.log('✅ Journal deleted:', id);
    return true;

  } catch (error) {
    console.error('Error deleting journal:', error);
    throw new Error('일지 삭제에 실패했습니다.');
  }
};

/**
 * Update an existing journal entry
 * @param {string} id - Journal entry ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated entry or null if not found
 */
export const updateJournal = (id, updates) => {
  try {
    const journals = getAllJournals();
    const index = journals.findIndex(j => j.id === id);

    if (index === -1) {
      console.warn('Journal not found:', id);
      return null;
    }

    journals[index] = {
      ...journals[index],
      ...updates,
      timestamp: new Date().toISOString() // Update timestamp
    };

    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(journals));
    console.log('✅ Journal updated:', id);
    return journals[index];

  } catch (error) {
    console.error('Error updating journal:', error);
    throw new Error('일지 수정에 실패했습니다.');
  }
};

/**
 * Get journals within a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Filtered journal entries
 */
export const getJournalsByDateRange = (startDate, endDate) => {
  const journals = getAllJournals();

  return journals.filter(j => {
    const journalDate = new Date(j.timestamp);
    return journalDate >= startDate && journalDate <= endDate;
  });
};

/**
 * Get journal statistics
 * @returns {Object} Statistics about journals
 */
export const getJournalStats = () => {
  const journals = getAllJournals();

  return {
    total: journals.length,
    thisMonth: journals.filter(j => {
      const journalDate = new Date(j.timestamp);
      const now = new Date();
      return journalDate.getMonth() === now.getMonth() &&
             journalDate.getFullYear() === now.getFullYear();
    }).length,
    thisWeek: journals.filter(j => {
      const journalDate = new Date(j.timestamp);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return journalDate >= weekAgo;
    }).length
  };
};

/**
 * Export all journals as JSON
 * @returns {string} JSON string of all journals
 */
export const exportJournals = () => {
  const journals = getAllJournals();
  return JSON.stringify(journals, null, 2);
};

/**
 * Import journals from JSON
 * @param {string} jsonString - JSON string of journals
 * @returns {number} Number of journals imported
 */
export const importJournals = (jsonString) => {
  try {
    const imported = JSON.parse(jsonString);

    if (!Array.isArray(imported)) {
      throw new Error('Invalid journal data format');
    }

    const existing = getAllJournals();
    const merged = [...imported, ...existing];

    // Remove duplicates by id
    const unique = merged.filter((journal, index, self) =>
      index === self.findIndex(j => j.id === journal.id)
    );

    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(unique));
    console.log(`✅ Imported ${imported.length} journals`);
    return imported.length;

  } catch (error) {
    console.error('Error importing journals:', error);
    throw new Error('일지 가져오기에 실패했습니다.');
  }
};

export default {
  getAllJournals,
  saveJournal,
  getJournalById,
  deleteJournal,
  updateJournal,
  getJournalsByDateRange,
  getJournalStats,
  exportJournals,
  importJournals
};
