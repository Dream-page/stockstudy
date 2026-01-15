import { CURRENCIES, STOCK_CATEGORIES, JUDGMENT_LEVELS } from './constants';

/**
 * Calculate profit/loss for a stock position
 * @param {number} avgPrice - Average purchase price
 * @param {number} currentPrice - Current market price
 * @param {number} quantity - Number of shares
 * @returns {object} - P&L info
 */
export const calculateProfitLoss = (avgPrice, currentPrice, quantity) => {
  const profitLoss = (currentPrice - avgPrice) * quantity;
  const profitLossRate = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;

  return {
    profitLoss: profitLoss,
    profitLossRate: profitLossRate,
    isProfit: profitLoss > 0,
    isLoss: profitLoss < 0
  };
};

/**
 * Calculate total value of a stock position
 * @param {number} currentPrice - Current market price
 * @param {number} quantity - Number of shares
 * @returns {number} - Total value
 */
export const calculateTotalValue = (currentPrice, quantity) => {
  return currentPrice * quantity;
};

/**
 * Calculate total portfolio value in KRW
 * @param {array} portfolio - Array of portfolio items
 * @param {number} exchangeRate - USD to KRW exchange rate
 * @returns {object} - Portfolio value breakdown
 */
export const calculatePortfolioValue = (portfolio, exchangeRate) => {
  let totalKRW = 0;
  let totalUSD = 0;
  let krStocksValue = 0;
  let usStocksValue = 0;

  portfolio.forEach(item => {
    const value = calculateTotalValue(item.currentPrice, item.quantity);

    if (item.currency === CURRENCIES.KRW) {
      krStocksValue += value;
      totalKRW += value;
    } else if (item.currency === CURRENCIES.USD) {
      usStocksValue += value;
      totalUSD += value;
      totalKRW += value * exchangeRate;
    }
  });

  return {
    totalKRW,
    totalUSD,
    krStocksValue,
    usStocksValue,
    usStocksValueInKRW: usStocksValue * exchangeRate
  };
};

/**
 * Calculate market score from macro indicators
 * @param {array} indicators - Array of macro indicators
 * @returns {object} - Market score info
 */
export const calculateMarketScore = (indicators) => {
  const totalScore = indicators.reduce((sum, indicator) => {
    return sum + (indicator.judgment || 0);
  }, 0);

  const maxScore = indicators.length * JUDGMENT_LEVELS.STRONG_BUY;
  const minScore = indicators.length * JUDGMENT_LEVELS.STRONG_SELL;

  return {
    totalScore,
    maxScore,
    minScore,
    sentiment: getMarketSentiment(totalScore),
    sentimentColor: getSentimentColor(totalScore)
  };
};

/**
 * Get market sentiment based on score
 * @param {number} score - Market score
 * @returns {string} - Sentiment description
 */
export const getMarketSentiment = (score) => {
  if (score >= 12) return '강력 매수';
  if (score >= 6) return '매수 우위';
  if (score >= -6) return '중립';
  if (score >= -12) return '매도 우위';
  return '강력 매도';
};

/**
 * Get sentiment color class
 * @param {number} score - Market score
 * @returns {string} - Tailwind color class
 */
export const getSentimentColor = (score) => {
  if (score >= 12) return 'text-red-600';
  if (score >= 6) return 'text-red-500';
  if (score >= -6) return 'text-gray-600';
  if (score >= -12) return 'text-blue-500';
  return 'text-blue-600';
};

/**
 * Get rebalancing recommendation for a stock
 * @param {string} category - Stock category
 * @param {number} marketScore - Current market score
 * @returns {object} - Rebalancing recommendation
 */
export const getRebalancingRecommendation = (category, marketScore) => {
  // Strong bullish market (score >= 10)
  if (marketScore >= 10) {
    switch (category) {
      case STOCK_CATEGORIES.LEVERAGE:
        return { text: '비중 확대 추천', color: 'bg-red-100 text-red-700', icon: '📈' };
      case STOCK_CATEGORIES.GROWTH:
        return { text: '비중 확대 추천', color: 'bg-red-100 text-red-700', icon: '🚀' };
      case STOCK_CATEGORIES.INVERSE:
        return { text: '비중 축소 추천', color: 'bg-blue-100 text-blue-700', icon: '📉' };
      case STOCK_CATEGORIES.DIVIDEND:
        return { text: '현재 유지', color: 'bg-gray-100 text-gray-700', icon: '➡️' };
      default:
        return null;
    }
  }

  // Strong bearish market (score <= -10)
  if (marketScore <= -10) {
    switch (category) {
      case STOCK_CATEGORIES.LEVERAGE:
        return { text: '비중 축소 추천', color: 'bg-blue-100 text-blue-700', icon: '⚠️' };
      case STOCK_CATEGORIES.GROWTH:
        return { text: '신중한 접근', color: 'bg-yellow-100 text-yellow-700', icon: '⚡' };
      case STOCK_CATEGORIES.INVERSE:
        return { text: '진입 고려', color: 'bg-green-100 text-green-700', icon: '✅' };
      case STOCK_CATEGORIES.DIVIDEND:
        return { text: '비중 확대 추천', color: 'bg-green-100 text-green-700', icon: '🛡️' };
      default:
        return null;
    }
  }

  // Neutral market (-10 < score < 10)
  switch (category) {
    case STOCK_CATEGORIES.LEVERAGE:
      return { text: '변동성 주의', color: 'bg-yellow-100 text-yellow-700', icon: '⚡' };
    case STOCK_CATEGORIES.GROWTH:
      return { text: '현재 유지', color: 'bg-gray-100 text-gray-700', icon: '➡️' };
    case STOCK_CATEGORIES.INVERSE:
      return { text: '시장 대응 준비', color: 'bg-gray-100 text-gray-700', icon: '👀' };
    case STOCK_CATEGORIES.DIVIDEND:
      return { text: '안정적 보유', color: 'bg-green-100 text-green-700', icon: '💎' };
    default:
      return null;
  }
};

/**
 * Get overall rebalancing alert message
 * @param {number} marketScore - Current market score
 * @returns {object} - Alert info
 */
export const getRebalancingAlert = (marketScore) => {
  if (marketScore >= 12) {
    return {
      message: '강력 매수 시그널! 레버리지/성장주 비중 확대를 고려하세요.',
      color: 'bg-red-50 border-red-200 text-red-800',
      icon: '🚀'
    };
  }

  if (marketScore >= 6) {
    return {
      message: '매수 우위 시장. 공격적 자산 비중 증가 검토하세요.',
      color: 'bg-orange-50 border-orange-200 text-orange-800',
      icon: '📈'
    };
  }

  if (marketScore >= -6) {
    return {
      message: '중립 시장. 현재 포지션 유지 및 관망 전략을 권장합니다.',
      color: 'bg-gray-50 border-gray-200 text-gray-800',
      icon: '⚖️'
    };
  }

  if (marketScore >= -12) {
    return {
      message: '매도 우위 시장. 방어적 자산 비중 확대를 고려하세요.',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: '🛡️'
    };
  }

  return {
    message: '강력 매도 시그널! 현금 확보 및 인버스 진입을 검토하세요.',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
    icon: '⚠️'
  };
};

/**
 * Format number as currency
 * @param {number} value - Number to format
 * @param {string} currency - Currency code (KRW or USD)
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value, currency) => {
  const symbol = currency === CURRENCIES.KRW ? '₩' : '$';

  if (currency === CURRENCIES.KRW) {
    return `${symbol}${Math.round(value).toLocaleString('ko-KR')}`;
  } else {
    return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @returns {string} - Formatted percentage string
 */
export const formatPercentage = (value) => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

/**
 * Format large numbers in Korean style
 * @param {number} value - Number to format
 * @returns {string} - Formatted string (e.g., "150만원", "1,500만원")
 */
export const formatKoreanCurrency = (value) => {
  if (value >= 100000000) { // 억
    return `${(value / 100000000).toFixed(1)}억원`;
  } else if (value >= 10000) { // 만
    return `${(value / 10000).toFixed(0)}만원`;
  } else {
    return `${Math.round(value).toLocaleString()}원`;
  }
};

/**
 * Get time ago string in Korean
 * @param {number} timestamp - Unix timestamp
 * @returns {string} - Time ago string
 */
export const getTimeAgo = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return '방금 전';
};

/**
 * Format date to Korean format
 * @param {number} timestamp - Unix timestamp
 * @returns {string} - Formatted date string
 */
export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
};

/**
 * Format date with time to Korean format
 * @param {number} timestamp - Unix timestamp
 * @returns {string} - Formatted datetime string
 */
export const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}.${month}.${day} ${hours}:${minutes}`;
};
