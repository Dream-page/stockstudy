/**
 * Google Sheet CSV Service
 * Fetches real-time stock prices and exchange rates from Google Sheets
 */

// Price data (default sheet)
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTE6rU_HSro410_ho2cm9qlg-zgvNQuakmK_iYzRcCpRmS4ZFCnsM_GvZ4egwhTMWjpLs5zwYJB2SSh/pub?output=csv';

// Portfolio data (gid=990988367)
const PORTFOLIO_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTt4eUW1ahkWVF5Z6ksdOF0O6Lr1wDagKI6BGwypatyUrnIakh_wQoc6fzN24GU0AWzgFdikZdhc2ug/pub?gid=990988367&single=true&output=csv';

// StudyFeed data (gid=882611753) - Published spreadsheet
const STUDY_FEED_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRf0qx4x4UjpUyExXofuHM0X7Q3dLC1IgaIAENkw_ZfvwqDKw2yV8n8IsLjqPyWbu4yofpLo-ygUiJj/pub?gid=882611753&single=true&output=csv';

/**
 * Parse CSV text to array of objects
 */
const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV data is empty or invalid');
  }

  // Get headers from first line
  const headers = lines[0].split(',').map(h => h.trim());

  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());

    // Skip rows with #N/A or error values (but allow empty optional fields)
    const hasError = values.some(v =>
      v.includes('#N/A') ||
      v.includes('#ERROR') ||
      v.includes('#REF!')
    );

    if (hasError) {
      console.warn(`Skipping row ${i + 1} due to error values:`, values);
      continue;
    }

    // Create object from headers and values
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    data.push(row);
  }

  return data;
};

/**
 * Fetch and parse Google Sheet data
 * @returns {Promise<{stocks: Array, exchangeRate: number}>}
 */
export const fetchGoogleSheetData = async () => {
  try {
    console.log('📊 Fetching data from Google Sheets...');

    const response = await fetch(GOOGLE_SHEET_CSV_URL, {
      method: 'GET',
      cache: 'no-cache', // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    const parsedData = parseCSV(csvText);

    console.log('✅ Parsed data:', parsedData);

    // Extract stock prices and exchange rate
    const stocks = [];
    let exchangeRate = 1300; // Default fallback

    parsedData.forEach(row => {
      // Handle multiple column name formats
      const ticker = row['Ticker (종목코드)'] || row['Ticker (A열)'] || row.Ticker || row.ticker || row.TICKER;
      const price = row['Price (현재가)'] || row['Price (B열: 여기에 수식이 들어갑니다)'] || row.Price || row.price || row.PRICE;

      if (!ticker || !price) {
        console.warn('Skipping row with missing ticker or price:', row);
        return;
      }

      // Skip rows with #N/A or error values
      if (price.includes('#N/A') || price.includes('#ERROR') || price.includes('#REF!')) {
        console.warn(`Skipping ${ticker} with error value: ${price}`);
        return;
      }

      // Check if this is the exchange rate row
      if (ticker.toUpperCase() === 'USD' || ticker.toUpperCase() === 'USDKRW') {
        const rate = parseFloat(price.replace(/[^0-9.]/g, ''));
        if (!isNaN(rate) && rate > 0) {
          exchangeRate = rate;
          console.log(`💱 Exchange rate found: ${exchangeRate}`);
        }
      } else {
        // This is a stock price
        const parsedPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
        if (!isNaN(parsedPrice) && parsedPrice > 0) {
          stocks.push({
            ticker: ticker.trim(),
            price: parsedPrice
          });
        }
      }
    });

    console.log(`✅ Fetched ${stocks.length} stock prices and exchange rate: ${exchangeRate}`);

    return {
      stocks,
      exchangeRate,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error fetching Google Sheet data:', error);
    throw error;
  }
};

/**
 * Update portfolio with latest prices from Google Sheets
 * @param {Array} portfolio - Current portfolio array
 * @param {Array} sheetStocks - Stock prices from Google Sheets
 * @returns {Array} Updated portfolio
 */
export const updatePortfolioWithSheetData = (portfolio, sheetStocks) => {
  if (!portfolio || portfolio.length === 0) {
    return portfolio;
  }

  const updatedPortfolio = portfolio.map(stock => {
    // Find matching stock in sheet data by ticker or name
    const sheetStock = sheetStocks.find(s =>
      s.ticker.toUpperCase() === (stock.ticker || stock.name).toUpperCase()
    );

    if (sheetStock) {
      console.log(`📈 Updating ${stock.name}: ${stock.currentPrice} → ${sheetStock.price}`);
      return {
        ...stock,
        currentPrice: sheetStock.price,
        lastUpdated: new Date().toISOString()
      };
    }

    return stock;
  });

  return updatedPortfolio;
};

/**
 * Fetch portfolio from Google Sheets
 * @returns {Promise<Array>} Portfolio array
 */
export const fetchPortfolioFromSheet = async () => {
  try {
    console.log('📊 Fetching portfolio from Google Sheets...');

    // Check if gid is set
    if (PORTFOLIO_SHEET_CSV_URL.includes('PORTFOLIO_GID')) {
      console.warn('⚠️ Portfolio sheet gid not configured yet. Skipping portfolio fetch.');
      return null;
    }

    const response = await fetch(PORTFOLIO_SHEET_CSV_URL, {
      method: 'GET',
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    const parsedData = parseCSV(csvText);

    console.log('✅ Raw portfolio data:', parsedData);

    // Transform to portfolio format
    const portfolio = parsedData.map((row, index) => {
      const name = row.Name || row.name || row.NAME;
      const ticker = row.Ticker || row.ticker || row.TICKER;
      const country = row.Country || row.country || row.COUNTRY;
      const quantity = parseFloat(row.Quantity || row.quantity || row.QUANTITY || 0);
      const avgPrice = parseFloat(row.AvgPrice || row.avgPrice || row.AVG_PRICE || 0);
      const category = (row.Category || row.category || row.CATEGORY || 'growth').toLowerCase();

      if (!name || !ticker || !country) {
        console.warn('Skipping invalid portfolio row:', row);
        return null;
      }

      return {
        id: `${country.toLowerCase()}-${ticker}-${Date.now()}-${index}`,
        name: name.trim(),
        ticker: ticker.trim(),
        country: country.toUpperCase(),
        category,
        quantity,
        avgPrice,
        currentPrice: avgPrice, // Will be updated by price service
        currency: country.toUpperCase() === 'US' ? 'USD' : 'KRW',
        createdAt: Date.now()
      };
    }).filter(item => item !== null);

    console.log(`✅ Fetched ${portfolio.length} stocks from Google Sheets`);

    return portfolio;

  } catch (error) {
    console.error('❌ Error fetching portfolio from Google Sheet:', error);
    throw error;
  }
};

/**
 * Fetch daily study items from Google Sheets (StudyFeed tab)
 * @returns {Promise<Array>} Array of study items filtered by date
 */
export const fetchDailyStudyItems = async () => {
  try {
    console.log('📚 Fetching daily study items from Google Sheets...');

    // Check if gid is set
    if (STUDY_FEED_CSV_URL.includes('STUDY_FEED_GID')) {
      console.warn('⚠️ StudyFeed sheet gid not configured yet. Skipping study feed fetch.');
      return [];
    }

    const response = await fetch(STUDY_FEED_CSV_URL, {
      method: 'GET',
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    const parsedData = parseCSV(csvText);

    console.log('✅ Raw study feed data:', parsedData);

    // Get today's date and date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Transform and filter data
    const studyItems = parsedData
      .map((row, index) => {
        // Column mapping (A:E)
        const dateStr = row.Date || row.date || row.DATE || row['날짜'];
        const category = row.Category || row.category || row.CATEGORY || row['카테고리'];
        const title = row.Title || row.title || row.TITLE || row['제목'];
        const link = row.Link || row.link || row.LINK || row['링크'];
        const source = row.Source || row.source || row.SOURCE || row['출처'];

        if (!dateStr || !title) {
          console.warn('Skipping invalid study item row:', row);
          return null;
        }

        // Parse date (support multiple formats)
        let itemDate;
        try {
          // Try parsing YYYY-MM-DD format
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            itemDate = new Date(dateStr);
          }
          // Try parsing Korean date format (YYYY.MM.DD or YYYY/MM/DD)
          else if (dateStr.match(/^\d{4}[./]\d{2}[./]\d{2}$/)) {
            const normalized = dateStr.replace(/[./]/g, '-');
            itemDate = new Date(normalized);
          }
          // Try parsing relative format like "2026-01-14"
          else {
            itemDate = new Date(dateStr);
          }

          itemDate.setHours(0, 0, 0, 0);

          // Skip if date is invalid or too old
          if (isNaN(itemDate.getTime()) || itemDate < threeDaysAgo) {
            return null;
          }
        } catch (error) {
          console.warn('Failed to parse date:', dateStr);
          return null;
        }

        return {
          id: `study-${Date.now()}-${index}`,
          date: dateStr,
          dateObject: itemDate, // For sorting
          category: category?.toLowerCase() || 'market',
          title: title.trim(),
          link: link?.trim() || '',
          source: source?.trim() || '네이버 증권',
          isCompleted: false // Will be managed locally
        };
      })
      .filter(item => item !== null);

    // Sort by date (newest first)
    studyItems.sort((a, b) => b.dateObject - a.dateObject);

    // Prioritize today's items
    const todayItems = studyItems.filter(item =>
      item.dateObject.getTime() === today.getTime()
    );
    const olderItems = studyItems.filter(item =>
      item.dateObject.getTime() !== today.getTime()
    );

    const finalItems = [...todayItems, ...olderItems];

    // Remove dateObject before returning (not needed in UI)
    finalItems.forEach(item => delete item.dateObject);

    console.log(`✅ Fetched ${finalItems.length} study items (${todayItems.length} today, ${olderItems.length} older)`);

    return finalItems;

  } catch (error) {
    console.error('❌ Error fetching study feed from Google Sheet:', error);
    throw error;
  }
};

export default {
  fetchGoogleSheetData,
  updatePortfolioWithSheetData,
  fetchPortfolioFromSheet,
  fetchDailyStudyItems
};
