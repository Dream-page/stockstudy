import axios from 'axios';
import { EXCHANGE_RATE_APIS, DEFAULT_EXCHANGE_RATE, EXCHANGE_RATE_CACHE_DURATION } from '../utils/constants';
import { getTimeAgo } from '../utils/calculations';

/**
 * Fetch exchange rate from primary API (Frankfurter)
 * @returns {Promise<number|null>} - Exchange rate or null on failure
 */
const fetchFromFrankfurter = async () => {
  try {
    const response = await axios.get(EXCHANGE_RATE_APIS.PRIMARY, {
      timeout: 5000
    });

    if (response.data && response.data.rates && response.data.rates.KRW) {
      return response.data.rates.KRW;
    }

    return null;
  } catch (error) {
    console.warn('Frankfurter API failed:', error.message);
    return null;
  }
};

/**
 * Fetch exchange rate from fallback API (ExchangeRate-API)
 * @returns {Promise<number|null>} - Exchange rate or null on failure
 */
const fetchFromExchangeRateAPI = async () => {
  try {
    const response = await axios.get(EXCHANGE_RATE_APIS.FALLBACK, {
      timeout: 5000
    });

    if (response.data && response.data.rates && response.data.rates.KRW) {
      return response.data.rates.KRW;
    }

    return null;
  } catch (error) {
    console.warn('ExchangeRate-API failed:', error.message);
    return null;
  }
};

/**
 * Fetch current USD/KRW exchange rate from APIs
 * Tries primary API first, then fallback API
 * @returns {Promise<object>} - { rate, source, error }
 */
export const fetchExchangeRate = async () => {
  // Try primary API
  let rate = await fetchFromFrankfurter();

  if (rate !== null) {
    return {
      rate: Math.round(rate), // Round to whole number
      source: 'api',
      error: null,
      timestamp: Date.now()
    };
  }

  // Try fallback API
  rate = await fetchFromExchangeRateAPI();

  if (rate !== null) {
    return {
      rate: Math.round(rate),
      source: 'api',
      error: null,
      timestamp: Date.now()
    };
  }

  // Both APIs failed
  return {
    rate: DEFAULT_EXCHANGE_RATE,
    source: 'manual',
    error: 'API 연결 실패. 기본값을 사용합니다.',
    timestamp: Date.now()
  };
};

/**
 * Check if cached exchange rate is still valid
 * @param {number} lastUpdated - Last update timestamp
 * @returns {boolean} - True if cache is still valid
 */
export const isCacheValid = (lastUpdated) => {
  if (!lastUpdated) return false;

  const now = Date.now();
  const elapsed = now - lastUpdated;

  return elapsed < EXCHANGE_RATE_CACHE_DURATION;
};

/**
 * Get exchange rate display string
 * @param {number} rate - Exchange rate
 * @param {string} source - Source ('api' or 'manual')
 * @param {number} lastUpdated - Last update timestamp
 * @returns {string} - Formatted display string
 */
export const getExchangeRateDisplay = (rate, source, lastUpdated) => {
  const sourceLabel = source === 'api' ? '자동' : '수동';
  const timeAgo = getTimeAgo(lastUpdated);

  return `${rate.toLocaleString('ko-KR')}원 (${sourceLabel} · ${timeAgo})`;
};

/**
 * Get exchange rate status info
 * @param {string} source - Source ('api' or 'manual')
 * @param {number} lastUpdated - Last update timestamp
 * @returns {object} - Status info
 */
export const getExchangeRateStatus = (source, lastUpdated) => {
  const isAuto = source === 'api';
  const cacheValid = isCacheValid(lastUpdated);

  return {
    isAuto,
    isManual: !isAuto,
    cacheValid,
    needsRefresh: isAuto && !cacheValid,
    sourceLabel: isAuto ? '자동 (API)' : '수동',
    statusColor: isAuto ? 'text-green-600' : 'text-gray-600',
    statusIcon: isAuto ? '🌐' : '✏️'
  };
};

/**
 * Validate exchange rate value
 * @param {number} rate - Exchange rate to validate
 * @returns {object} - { isValid, error }
 */
export const validateExchangeRate = (rate) => {
  if (typeof rate !== 'number' || isNaN(rate)) {
    return {
      isValid: false,
      error: '유효한 숫자를 입력해주세요.'
    };
  }

  if (rate <= 0) {
    return {
      isValid: false,
      error: '환율은 0보다 커야 합니다.'
    };
  }

  if (rate < 100 || rate > 10000) {
    return {
      isValid: false,
      error: '환율이 정상 범위(100-10,000)를 벗어났습니다.'
    };
  }

  return {
    isValid: true,
    error: null
  };
};

/**
 * Auto-fetch exchange rate with retry logic
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<object>} - Exchange rate data
 */
export const autoFetchExchangeRate = async (maxRetries = 2) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await fetchExchangeRate();

    // Success
    if (result.source === 'api' && !result.error) {
      return result;
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }

  // All retries failed, return default
  return {
    rate: DEFAULT_EXCHANGE_RATE,
    source: 'manual',
    error: 'API 연결 실패. 수동으로 환율을 설정해주세요.',
    timestamp: Date.now()
  };
};
