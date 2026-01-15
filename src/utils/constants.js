// ==========================================
// 1. 앱 설정 및 상수 (원본 구조 유지)
// ==========================================

// Stock categories
export const STOCK_CATEGORIES = {
  LEVERAGE: 'leverage',
  GROWTH: 'growth',
  DIVIDEND: 'dividend',
  INVERSE: 'inverse',
  VALUE: 'value',       // 추가됨
  DEFENSE: 'defense'    // 추가됨
};

export const CATEGORY_LABELS = {
  [STOCK_CATEGORIES.LEVERAGE]: '🚀 레버리지',
  [STOCK_CATEGORIES.GROWTH]: '📈 성장/기술',
  [STOCK_CATEGORIES.DIVIDEND]: '💰 배당',
  [STOCK_CATEGORIES.INVERSE]: '📉 인버스',
  [STOCK_CATEGORIES.VALUE]: '🛡️ 가치/방어',
  [STOCK_CATEGORIES.DEFENSE]: '⚔️ 방산'
};

// Countries
export const COUNTRIES = {
  KR: 'KR',
  US: 'US'
};

export const COUNTRY_LABELS = {
  [COUNTRIES.KR]: '🇰🇷 한국',
  [COUNTRIES.US]: '🇺🇸 미국'
};

// Currencies
export const CURRENCIES = {
  KRW: 'KRW',
  USD: 'USD'
};

export const CURRENCY_SYMBOLS = {
  [CURRENCIES.KRW]: '₩',
  [CURRENCIES.USD]: '$'
};

// Journal types
export const JOURNAL_TYPES = {
  BUY: 'buy',
  SELL: 'sell',
  HOLD: 'hold'
};

export const JOURNAL_TYPE_LABELS = {
  [JOURNAL_TYPES.BUY]: '매수',
  [JOURNAL_TYPES.SELL]: '매도',
  [JOURNAL_TYPES.HOLD]: '관망'
};

export const JOURNAL_TYPE_COLORS = {
  [JOURNAL_TYPES.BUY]: 'bg-red-100 text-red-700',
  [JOURNAL_TYPES.SELL]: 'bg-blue-100 text-blue-700',
  [JOURNAL_TYPES.HOLD]: 'bg-gray-100 text-gray-700'
};

// Judgment levels for macro indicators
export const JUDGMENT_LEVELS = {
  STRONG_BUY: 2,
  BUY: 1,
  NEUTRAL: 0,
  SELL: -1,
  STRONG_SELL: -2
};

export const JUDGMENT_LABELS = {
  [JUDGMENT_LEVELS.STRONG_BUY]: '강력 매수',
  [JUDGMENT_LEVELS.BUY]: '매수',
  [JUDGMENT_LEVELS.NEUTRAL]: '중립',
  [JUDGMENT_LEVELS.SELL]: '매도',
  [JUDGMENT_LEVELS.STRONG_SELL]: '강력 매도'
};

export const JUDGMENT_COLORS = {
  [JUDGMENT_LEVELS.STRONG_BUY]: 'bg-red-600 text-white',
  [JUDGMENT_LEVELS.BUY]: 'bg-red-400 text-white',
  [JUDGMENT_LEVELS.NEUTRAL]: 'bg-gray-400 text-white',
  [JUDGMENT_LEVELS.SELL]: 'bg-blue-400 text-white',
  [JUDGMENT_LEVELS.STRONG_SELL]: 'bg-blue-600 text-white'
};

// 10 Core Macro Indicators (초기값 스크린샷 반영 수정)
export const MACRO_INDICATORS = [
  {
    id: 'usd-krw',
    name: 'USD/KRW 환율',
    unit: 'KRW',
    defaultValue: 1477.35 // 스크린샷 반영
  },
  {
    id: 'kospi', // 앱에서 코스닥 대신 사용할 수도 있으므로 유지하되 값 업데이트
    name: 'KOSPI / KOSDAQ',
    unit: 'Index',
    defaultValue: 948.98 // 스크린샷 코스닥 지수 반영
  },
  {
    id: 'sp500',
    name: 'S&P 500 지수',
    unit: 'Index',
    defaultValue: 6977.27 // 스크린샷 반영
  },
  {
    id: 'vix',
    name: 'VIX 변동성 지수',
    unit: 'Index',
    defaultValue: 15.26 // 스크린샷 반영
  },
  {
    id: 'fear-greed',
    name: 'Fear & Greed Index',
    unit: 'Index (0-100)',
    defaultValue: 65
  },
  {
    id: 'us-10y-yield',
    name: '미국 10년물 국채',
    unit: '%',
    defaultValue: 4.1
  },
  {
    id: 'unemployment',
    name: '미국 실업률',
    unit: '%',
    defaultValue: 3.7
  },
  {
    id: 'cpi',
    name: 'CPI 인플레이션',
    unit: '%',
    defaultValue: 3.1
  },
  {
    id: 'fed-rate',
    name: '연방 기준 금리',
    unit: '%',
    defaultValue: 5.5
  },
  {
    id: 'oil-price',
    name: 'WTI 유가',
    unit: 'USD/barrel',
    defaultValue: 72.5
  }
];

// Default exchange rate
export const DEFAULT_EXCHANGE_RATE = 1477; // 스크린샷 기준 변경

// Exchange rate API URLs
export const EXCHANGE_RATE_APIS = {
  PRIMARY: 'https://api.frankfurter.app/latest?from=USD&to=KRW',
  FALLBACK: 'https://api.exchangerate-api.com/v4/latest/USD'
};

// Exchange rate cache duration (1 hour)
export const EXCHANGE_RATE_CACHE_DURATION = 60 * 60 * 1000;

// LocalStorage keys
export const STORAGE_KEYS = {
  PORTFOLIO: 'insight-log-portfolio',
  JOURNALS: 'insight-log-journals',
  STUDIES: 'insight-log-studies',
  MACRO: 'insight-log-macro',
  SETTINGS: 'insight-log-settings'
};

// App version
export const APP_VERSION = '1.0.0';


// ==========================================
// 2. 실제 포트폴리오 데이터 (스크린샷 전수 반영)
// ==========================================

export const SAMPLE_PORTFOLIO = [
  // --- 🇰🇷 국내 주식 (22종목) ---
  {
    id: 'kr-samsung-elec',
    name: '삼성전자',
    ticker: '005930',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 304,
    currentPrice: 137814,
    avgPrice: 63545,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-sk-hynix',
    name: 'SK하이닉스',
    ticker: '000660',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 23,
    currentPrice: 737501,
    avgPrice: 135633,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-hyundai',
    name: '현대차',
    ticker: '005380',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.VALUE,
    quantity: 51,
    currentPrice: 405653,
    avgPrice: 220715,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-naver',
    name: 'NAVER',
    ticker: '035420',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 22,
    currentPrice: 264438,
    avgPrice: 216723,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-kakao',
    name: '카카오',
    ticker: '035720',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 56,
    currentPrice: 59274,
    avgPrice: 43616,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-kakao-pay',
    name: '카카오페이',
    ticker: '377300',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 50,
    currentPrice: 50790,
    avgPrice: 55980,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-kakao-games',
    name: '카카오게임즈',
    ticker: '293490',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 66,
    currentPrice: 14467,
    avgPrice: 22615,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-vt',
    name: '브이티',
    ticker: '018290',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 121,
    currentPrice: 16642,
    avgPrice: 31193,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-flitto',
    name: '플리토',
    ticker: '300080',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 120,
    currentPrice: 16056,
    avgPrice: 15759,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-pnt',
    name: '피엔티',
    ticker: '137400',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 43,
    currentPrice: 37869,
    avgPrice: 33826,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-samsung-sec',
    name: '삼성증권',
    ticker: '016360',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.VALUE,
    quantity: 20,
    currentPrice: 78233,
    avgPrice: 68100,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-hanwha-ocean',
    name: '한화오션',
    ticker: '042660',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.DEFENSE,
    quantity: 10,
    currentPrice: 149684,
    avgPrice: 111900,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-pearlabyss',
    name: '펄어비스',
    ticker: '263750',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 36,
    currentPrice: 39713,
    avgPrice: 48222,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-hyundai-enc',
    name: '현대건설',
    ticker: '000720',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.VALUE,
    quantity: 15,
    currentPrice: 92705,
    avgPrice: 60000,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-hanwha-sys',
    name: '한화시스템',
    ticker: '272210',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.DEFENSE,
    quantity: 15,
    currentPrice: 86118,
    avgPrice: 59666,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-cape',
    name: '케이프',
    ticker: '064820',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.VALUE,
    quantity: 80,
    currentPrice: 11125,
    avgPrice: 13496,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-sk-ocean',
    name: 'SK오션플랜트',
    ticker: '100090',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 40,
    currentPrice: 20954,
    avgPrice: 22675,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-dexter',
    name: '덱스터',
    ticker: '206560',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 185,
    currentPrice: 4025,
    avgPrice: 10516,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-dnc',
    name: '디앤씨미디어',
    ticker: '263720',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 35,
    currentPrice: 12172,
    avgPrice: 21642,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-hmm',
    name: 'HMM',
    ticker: '011200',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.VALUE,
    quantity: 10,
    currentPrice: 20903,
    avgPrice: 30000,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-korean-air',
    name: '대한항공',
    ticker: '003490',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.VALUE,
    quantity: 20,
    currentPrice: 22202,
    avgPrice: 22600,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },
  {
    id: 'kr-skt',
    name: 'SK텔레콤',
    ticker: '017670',
    country: COUNTRIES.KR,
    category: STOCK_CATEGORIES.DIVIDEND,
    quantity: 41,
    currentPrice: 54183,
    avgPrice: 53402,
    currency: CURRENCIES.KRW,
    createdAt: Date.now()
  },

  // --- 🇺🇸 미국 주식 (14종목) ---
  {
    id: 'us-lulu',
    name: '룰루레몬',
    ticker: 'LULU',
    country: COUNTRIES.US,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 15,
    currentPrice: 206.50,
    avgPrice: 207.31,
    currency: CURRENCIES.USD,
    createdAt: Date.now()
  },
  {
    id: 'us-crocs',
    name: '크록스',
    ticker: 'CROX',
    country: COUNTRIES.US,
    category: STOCK_CATEGORIES.VALUE,
    quantity: 30.023023,
    currentPrice: 85.70,
    avgPrice: 87.95,
    currency: CURRENCIES.USD,
    createdAt: Date.now()
  },
  {
    id: 'us-meta',
    name: '메타',
    ticker: 'META',
    country: COUNTRIES.US,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 1,
    currentPrice: 635.50,
    avgPrice: 676.24,
    currency: CURRENCIES.USD,
    createdAt: Date.now()
  },
  {
    id: 'us-ethu',
    name: 'ETHU (2x)',
    ticker: 'ETHU',
    country: COUNTRIES.US,
    category: STOCK_CATEGORIES.LEVERAGE,
    quantity: 21,
    currentPrice: 59.42,
    avgPrice: 105.88,
    currency: CURRENCIES.USD,
    createdAt: Date.now()
  },
  {
    id: 'us-crca',
    name: 'CRCA (2x)',
    ticker: 'CRCA',
    country: COUNTRIES.US,
    category: STOCK_CATEGORIES.LEVERAGE,
    quantity: 225,
    currentPrice: 4.33,
    avgPrice: 6.99,
    currency: CURRENCIES.USD,
    createdAt: Date.now()
  },
  {
    id: 'us-metu',
    name: 'METU (2x)',
    ticker: 'METU',
    country: COUNTRIES.US,
    category: STOCK_CATEGORIES.LEVERAGE,
    quantity: 25,
    currentPrice: 29.97,
    avgPrice: 33.18,
    currency: CURRENCIES.USD,
    createdAt: Date.now()
  },
  {
    id: 'us-okll',
    name: 'OKLL (2x)',
    ticker: 'OKLL',
    country: COUNTRIES.US,
    category: STOCK_CATEGORIES.LEVERAGE,
    quantity: 18,
    currentPrice: 33.98,
    avgPrice: 24.98,
    currency: CURRENCIES.USD,
    createdAt: Date.now()
  },
  {
    id: 'us-poet',
    name: '포엣 테크놀로지스',
    ticker: 'POET',
    country: COUNTRIES.US,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 80,
    currentPrice: 7.10,
    avgPrice: 6.71,
    currency: CURRENCIES.USD,
    createdAt: Date.now()
  },
  {
    id: 'us-bmnu',
    name: 'BMNU (2x)',
    ticker: 'BMNU',
    country: COUNTRIES.US,
    category: STOCK_CATEGORIES.LEVERAGE,
    quantity: 76,
    currentPrice: 5.97,
    avgPrice: 15.57,
    currency: CURRENCIES.USD,
    createdAt: Date.now()
  },
  {
    id: 'us-spym',
    name: 'SPYM',
    ticker: 'SPYM',
    country: COUNTRIES.US,
    category: STOCK_CATEGORIES.LEVERAGE,
    quantity: 2,
    currentPrice: 80.89,
    avgPrice: 65.95,
    currency: CURRENCIES.USD,
    createdAt: Date.now()
  },
  {
    id: 'us-smu',
    name: 'SMU (2x)',
    ticker: 'SMU',
    country: COUNTRIES.US,
    category: STOCK_CATEGORIES.LEVERAGE,
    quantity: 4,
    currentPrice: 19.29,
    avgPrice: 18.99,
    currency: CURRENCIES.USD,
    createdAt: Date.now()
  },
  {
    id: 'us-jepq',
    name: 'JEPQ',
    ticker: 'JEPQ',
    country: COUNTRIES.US,
    category: STOCK_CATEGORIES.DIVIDEND,
    quantity: 1,
    currentPrice: 58.57,
    avgPrice: 48.91,
    currency: CURRENCIES.USD,
    createdAt: Date.now()
  },
  {
    id: 'us-rocket',
    name: '로켓 랩',
    ticker: 'RKLB',
    country: COUNTRIES.US,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 0.336212,
    currentPrice: 87.66,
    avgPrice: 39.87,
    currency: CURRENCIES.USD,
    createdAt: Date.now()
  },
  {
    id: 'us-tesla',
    name: '테슬라',
    ticker: 'TSLA',
    country: COUNTRIES.US,
    category: STOCK_CATEGORIES.GROWTH,
    quantity: 0.001187,
    currentPrice: 444.32,
    avgPrice: 315.42,
    currency: CURRENCIES.USD,
    createdAt: Date.now()
  }
];

export const SAMPLE_JOURNALS = [
  {
    id: 'journal-1',
    date: Date.now(),
    type: JOURNAL_TYPES.BUY,
    stock: '삼성전자',
    content: '반도체 업황 턴어라운드 기대감으로 추가 매수.',
    createdAt: Date.now()
  },
  {
    id: 'journal-2',
    date: Date.now() - 86400000 * 2,
    type: JOURNAL_TYPES.HOLD,
    stock: '전체',
    content: '환율이 1477원까지 상승. 미국 주식 추가 매수 보류.',
    createdAt: Date.now() - 86400000 * 2
  }
];

export const SAMPLE_STUDIES = [
  {
    id: 'study-1',
    title: 'Insight Log 앱 사용법',
    content: '내 포트폴리오를 한눈에 관리하고, 거시경제 지표를 통해 투자 점수를 매겨보세요.\n\n- Portfolio: 내 주식 자산 관리\n- Macro: 환율, 금리 등 경제 지표 확인\n- Journal: 매매 일지 기록',
    tags: ['가이드', '사용법'],
    createdAt: Date.now()
  }
];