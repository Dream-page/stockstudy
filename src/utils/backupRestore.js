import { APP_VERSION } from './constants';

/**
 * Export all app data as JSON file
 * @param {object} state - Complete app state
 * @returns {boolean} - Success status
 */
export const exportData = (state) => {
  try {
    const backup = {
      version: APP_VERSION,
      exportDate: new Date().toISOString(),
      data: {
        portfolio: state.portfolio || [],
        journals: state.journals || [],
        studies: state.studies || [],
        macroIndicators: state.macroIndicators || [],
        settings: state.settings || {}
      }
    };

    // Convert to JSON string with formatting
    const jsonString = JSON.stringify(backup, null, 2);

    // Create blob
    const blob = new Blob([jsonString], {
      type: 'application/json;charset=utf-8'
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Generate filename with timestamp
    const timestamp = Date.now();
    const date = new Date(timestamp);
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    link.download = `insight-log-backup-${dateStr}-${timestamp}.json`;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('데이터 내보내기에 실패했습니다.');
    return false;
  }
};

/**
 * Import data from JSON file
 * @param {File} file - JSON file to import
 * @param {Function} dispatch - Dispatch function for state update
 * @returns {Promise<boolean>} - Success status
 */
export const importData = (file, dispatch) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      alert('파일을 선택해주세요.');
      resolve(false);
      return;
    }

    // Check file type
    if (!file.name.endsWith('.json')) {
      alert('JSON 파일만 업로드할 수 있습니다.');
      resolve(false);
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기가 너무 큽니다. (최대 10MB)');
      resolve(false);
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const backup = JSON.parse(content);

        // Validate backup structure
        if (!validateBackup(backup)) {
          alert('유효하지 않은 백업 파일입니다.');
          resolve(false);
          return;
        }

        // Confirm with user
        const confirmMessage = `백업 데이터를 불러오시겠습니까?\n\n` +
          `백업 날짜: ${new Date(backup.exportDate).toLocaleString('ko-KR')}\n` +
          `버전: ${backup.version}\n` +
          `포트폴리오: ${backup.data.portfolio?.length || 0}개\n` +
          `투자 일지: ${backup.data.journals?.length || 0}개\n` +
          `공부 노트: ${backup.data.studies?.length || 0}개\n\n` +
          `⚠️ 현재 데이터가 모두 덮어씌워집니다!`;

        if (!confirm(confirmMessage)) {
          resolve(false);
          return;
        }

        // Restore data to state
        dispatch({
          type: 'RESTORE_ALL',
          payload: backup.data
        });

        alert('✅ 데이터를 성공적으로 복구했습니다!');
        resolve(true);
      } catch (error) {
        console.error('Error importing data:', error);
        alert('백업 파일을 읽는 중 오류가 발생했습니다.\n파일이 손상되었거나 형식이 올바르지 않습니다.');
        resolve(false);
      }
    };

    reader.onerror = () => {
      alert('파일을 읽는 중 오류가 발생했습니다.');
      resolve(false);
    };

    reader.readAsText(file);
  });
};

/**
 * Validate backup file structure
 * @param {object} backup - Backup object to validate
 * @returns {boolean} - True if valid
 */
const validateBackup = (backup) => {
  try {
    // Check required fields
    if (!backup.version || !backup.exportDate || !backup.data) {
      return false;
    }

    // Check data structure
    const data = backup.data;
    if (typeof data !== 'object') {
      return false;
    }

    // Validate arrays
    if (data.portfolio && !Array.isArray(data.portfolio)) {
      return false;
    }

    if (data.journals && !Array.isArray(data.journals)) {
      return false;
    }

    if (data.studies && !Array.isArray(data.studies)) {
      return false;
    }

    if (data.macroIndicators && !Array.isArray(data.macroIndicators)) {
      return false;
    }

    // Validate settings
    if (data.settings && typeof data.settings !== 'object') {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get backup file info from file
 * @param {File} file - JSON backup file
 * @returns {Promise<object>} - Backup info
 */
export const getBackupInfo = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const backup = JSON.parse(content);

        if (!validateBackup(backup)) {
          reject(new Error('Invalid backup file'));
          return;
        }

        const info = {
          version: backup.version,
          exportDate: backup.exportDate,
          portfolioCount: backup.data.portfolio?.length || 0,
          journalsCount: backup.data.journals?.length || 0,
          studiesCount: backup.data.studies?.length || 0,
          indicatorsCount: backup.data.macroIndicators?.length || 0,
          fileSize: file.size,
          fileSizeKB: (file.size / 1024).toFixed(2),
          fileName: file.name
        };

        resolve(info);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Create a quick backup in localStorage
 * Useful for auto-save before risky operations
 * @param {object} state - Complete app state
 * @returns {boolean} - Success status
 */
export const createQuickBackup = (state) => {
  try {
    const backup = {
      version: APP_VERSION,
      exportDate: new Date().toISOString(),
      data: state
    };

    localStorage.setItem('insight-log-quick-backup', JSON.stringify(backup));
    return true;
  } catch (error) {
    console.error('Error creating quick backup:', error);
    return false;
  }
};

/**
 * Restore from quick backup
 * @param {Function} dispatch - Dispatch function for state update
 * @returns {boolean} - Success status
 */
export const restoreQuickBackup = (dispatch) => {
  try {
    const backupStr = localStorage.getItem('insight-log-quick-backup');

    if (!backupStr) {
      alert('빠른 백업 데이터가 없습니다.');
      return false;
    }

    const backup = JSON.parse(backupStr);

    if (!validateBackup(backup)) {
      alert('백업 데이터가 손상되었습니다.');
      return false;
    }

    dispatch({
      type: 'RESTORE_ALL',
      payload: backup.data
    });

    alert('빠른 백업에서 데이터를 복구했습니다.');
    return true;
  } catch (error) {
    console.error('Error restoring quick backup:', error);
    alert('백업 복구에 실패했습니다.');
    return false;
  }
};
