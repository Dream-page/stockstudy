import { createContext, useContext, useReducer, useEffect } from 'react';
import { saveToStorage, loadFromStorage } from '../utils/localStorage';
import { autoFetchExchangeRate } from '../services/exchangeRate';
import { fetchGoogleSheetData, updatePortfolioWithSheetData, fetchPortfolioFromSheet } from '../services/googleSheetService';
import {
  STORAGE_KEYS,
  MACRO_INDICATORS,
  DEFAULT_EXCHANGE_RATE,
  JUDGMENT_LEVELS
} from '../utils/constants';

// Initialize state from localStorage or use default
const initState = () => {
  // Load portfolio
  const portfolio = loadFromStorage(STORAGE_KEYS.PORTFOLIO, null);

  // Load journals
  const journals = loadFromStorage(STORAGE_KEYS.JOURNALS, null);

  // Load studies
  const studies = loadFromStorage(STORAGE_KEYS.STUDIES, null);

  // Load macro indicators or initialize with default
  const macroIndicators = loadFromStorage(
    STORAGE_KEYS.MACRO,
    MACRO_INDICATORS.map(indicator => ({
      ...indicator,
      value: indicator.defaultValue,
      judgment: JUDGMENT_LEVELS.NEUTRAL,
      lastUpdated: Date.now()
    }))
  );

  // Load settings
  const settings = loadFromStorage(STORAGE_KEYS.SETTINGS, {
    exchangeRate: DEFAULT_EXCHANGE_RATE,
    exchangeRateSource: 'manual',
    exchangeRateLastUpdated: Date.now(),
    currency: 'KRW'
  });

  // Initialize with empty arrays (no sample data)
  return {
    portfolio: portfolio || [],
    journals: journals || [],
    studies: studies || [],
    macroIndicators,
    settings
  };
};

// Create context
const AppContext = createContext();

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    // Portfolio actions
    case 'ADD_STOCK':
      return {
        ...state,
        portfolio: [...state.portfolio, action.payload]
      };

    case 'UPDATE_STOCK':
      return {
        ...state,
        portfolio: state.portfolio.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };

    case 'DELETE_STOCK':
      return {
        ...state,
        portfolio: state.portfolio.filter(item => item.id !== action.payload)
      };

    // Journal actions
    case 'ADD_JOURNAL':
      return {
        ...state,
        journals: [action.payload, ...state.journals]
      };

    case 'UPDATE_JOURNAL':
      return {
        ...state,
        journals: state.journals.map(j =>
          j.id === action.payload.id ? action.payload : j
        )
      };

    case 'DELETE_JOURNAL':
      return {
        ...state,
        journals: state.journals.filter(j => j.id !== action.payload)
      };

    // Study actions
    case 'ADD_STUDY':
      return {
        ...state,
        studies: [action.payload, ...state.studies]
      };

    case 'UPDATE_STUDY':
      return {
        ...state,
        studies: state.studies.map(study =>
          study.id === action.payload.id ? { ...study, ...action.payload.updates } : study
        )
      };

    case 'DELETE_STUDY':
      return {
        ...state,
        studies: state.studies.filter(study => study.id !== action.payload)
      };

    // Macro indicators actions
    case 'UPDATE_INDICATOR':
      return {
        ...state,
        macroIndicators: state.macroIndicators.map(indicator =>
          indicator.id === action.payload.id
            ? { ...indicator, ...action.payload.data, lastUpdated: Date.now() }
            : indicator
        )
      };

    // Settings actions
    case 'UPDATE_EXCHANGE_RATE':
      return {
        ...state,
        settings: {
          ...state.settings,
          exchangeRate: action.payload.rate,
          exchangeRateSource: action.payload.source,
          exchangeRateLastUpdated: action.payload.timestamp
        }
      };

    case 'SET_MANUAL_EXCHANGE_RATE':
      return {
        ...state,
        settings: {
          ...state.settings,
          exchangeRate: action.payload,
          exchangeRateSource: 'manual',
          exchangeRateLastUpdated: Date.now()
        }
      };

    // Update portfolio prices from Google Sheets
    case 'UPDATE_PORTFOLIO_PRICES':
      return {
        ...state,
        portfolio: action.payload.portfolio,
        settings: {
          ...state.settings,
          exchangeRate: action.payload.exchangeRate,
          exchangeRateSource: 'google-sheets',
          exchangeRateLastUpdated: Date.now()
        }
      };

    // Backup & Restore
    case 'RESTORE_ALL':
      return {
        ...state,
        portfolio: action.payload.portfolio || [],
        journals: action.payload.journals || [],
        studies: action.payload.studies || [],
        macroIndicators: action.payload.macroIndicators || state.macroIndicators,
        settings: {
          ...state.settings,
          ...action.payload.settings
        }
      };

    default:
      return state;
  }
};

/**
 * Context Provider Component
 */
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, null, initState);

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PORTFOLIO, state.portfolio);
  }, [state.portfolio]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.JOURNALS, state.journals);
  }, [state.journals]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.STUDIES, state.studies);
  }, [state.studies]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.MACRO, state.macroIndicators);
  }, [state.macroIndicators]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, state.settings);
  }, [state.settings]);

  // Auto-fetch data from Google Sheets on mount and every 5 minutes
  useEffect(() => {
    const fetchAndUpdateData = async () => {
      try {
        console.log('🔄 Fetching latest data from Google Sheets...');

        // Step 1: Try to fetch portfolio from Google Sheets (if configured)
        if (state.portfolio.length === 0) {
          console.log('📊 Portfolio is empty, attempting to load from Google Sheets...');
          try {
            const portfolioFromSheet = await fetchPortfolioFromSheet();

            if (portfolioFromSheet && portfolioFromSheet.length > 0) {
              console.log(`✅ Loaded ${portfolioFromSheet.length} stocks from Google Sheets`);

              // Fetch price data
              const sheetData = await fetchGoogleSheetData();

              if (sheetData) {
                // Update with latest prices
                const updatedPortfolio = updatePortfolioWithSheetData(
                  portfolioFromSheet,
                  sheetData.stocks
                );

                dispatch({
                  type: 'UPDATE_PORTFOLIO_PRICES',
                  payload: {
                    portfolio: updatedPortfolio,
                    exchangeRate: sheetData.exchangeRate
                  }
                });
              } else {
                // No price data, use portfolio as-is
                dispatch({
                  type: 'UPDATE_PORTFOLIO_PRICES',
                  payload: {
                    portfolio: portfolioFromSheet,
                    exchangeRate: state.settings.exchangeRate
                  }
                });
              }
              return;
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch portfolio from Google Sheets:', error.message);
          }
        }

        // Step 2: Update prices for existing portfolio
        const sheetData = await fetchGoogleSheetData();

        if (sheetData) {
          // Update portfolio with latest prices
          const updatedPortfolio = updatePortfolioWithSheetData(
            state.portfolio,
            sheetData.stocks
          );

          // Dispatch update
          dispatch({
            type: 'UPDATE_PORTFOLIO_PRICES',
            payload: {
              portfolio: updatedPortfolio,
              exchangeRate: sheetData.exchangeRate
            }
          });

          const now = new Date().toLocaleTimeString('ko-KR');
          console.log(`✅ Portfolio updated at ${now}`);
        }
      } catch (error) {
        console.error('⚠️ Failed to fetch Google Sheets data:', error);

        // Fallback: Try to fetch exchange rate from API
        const result = await autoFetchExchangeRate();

        if (result && result.rate) {
          dispatch({
            type: 'UPDATE_EXCHANGE_RATE',
            payload: {
              rate: result.rate,
              source: result.source,
              timestamp: result.timestamp
            }
          });
        }
      }
    };

    // Initial fetch on mount
    console.log('🚀 Initializing app data...');
    fetchAndUpdateData();

    // Set up 5-minute auto-refresh interval
    const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds
    const intervalId = setInterval(() => {
      console.log('⏰ 5 minutes passed - auto-refreshing prices...');
      fetchAndUpdateData();
    }, FIVE_MINUTES);

    // Cleanup interval on unmount
    return () => {
      console.log('🛑 Stopping auto-refresh');
      clearInterval(intervalId);
    };
  }, []); // Run only once on mount

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use app context
export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }

  return context;
};
