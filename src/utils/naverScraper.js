/**
 * Naver Finance Report Scraper
 * Fetches and extracts text content from Naver finance articles
 */

// CORS proxy for Naver (use same as pdfReader)
const CORS_PROXY = 'https://corsproxy.io/?';

/**
 * Fetch with timeout
 * @param {string} url - URL to fetch
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Response>}
 */
const fetchWithTimeout = async (url, timeout = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('요청 시간 초과 (30초)');
    }
    throw error;
  }
};

/**
 * Extract text from HTML string
 * Removes all HTML tags and normalizes whitespace
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
const extractTextFromHTML = (html) => {
  // Remove script and style tags with their content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
};

/**
 * Extract article content from Naver finance HTML
 * Tries multiple selectors to find the main content
 * @param {string} html - Full HTML page
 * @returns {string} Extracted article text
 */
const extractNaverArticleContent = (html) => {
  console.log('📄 Extracting article content from HTML...');

  // Try different content selectors (Naver uses different structures)
  const contentPatterns = [
    // Pattern 1: Research center articles (class="view_con")
    /<div[^>]*class="view_con"[^>]*>([\s\S]*?)<\/div>/i,
    // Pattern 2: News articles (id="content")
    /<div[^>]*id="content"[^>]*>([\s\S]*?)<\/div>/i,
    // Pattern 3: Article body (class="article_body")
    /<div[^>]*class="article_body"[^>]*>([\s\S]*?)<\/div>/i,
    // Pattern 4: Research detail (class="box_type_m")
    /<div[^>]*class="box_type_m"[^>]*>([\s\S]*?)<\/div>/i,
    // Pattern 5: Generic article container
    /<article[^>]*>([\s\S]*?)<\/article>/i
  ];

  let articleHTML = '';

  for (const pattern of contentPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      articleHTML = match[1];
      console.log(`   ✅ Found content using pattern: ${pattern.source.substring(0, 50)}...`);
      break;
    }
  }

  if (!articleHTML) {
    console.warn('   ⚠️ No content found with specific selectors, using full HTML');
    articleHTML = html;
  }

  // Extract text from HTML
  const text = extractTextFromHTML(articleHTML);

  console.log(`   📝 Extracted ${text.length} characters`);

  return text;
};

/**
 * Fetch and parse Naver finance article
 * @param {string} url - Naver finance article URL
 * @returns {Promise<string>} Extracted article text
 */
export const fetchNaverArticle = async (url) => {
  try {
    console.log('🚀 Fetching Naver article:', url);

    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid Naver article URL');
    }

    // Use CORS proxy
    const proxyUrl = CORS_PROXY + encodeURIComponent(url);
    console.log('🌐 Using CORS proxy:', proxyUrl.substring(0, 100) + '...');

    // Fetch HTML
    const response = await fetchWithTimeout(proxyUrl, 30000);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`✅ Fetched HTML: ${html.length} characters`);

    // Extract article content
    const articleText = extractNaverArticleContent(html);

    // Validate extracted text
    if (!articleText || articleText.length < 50) {
      throw new Error('추출된 텍스트가 너무 짧습니다. 페이지 구조가 예상과 다를 수 있습니다.');
    }

    console.log(`✅ Successfully extracted ${articleText.length} characters from Naver article`);
    return articleText;

  } catch (error) {
    console.error('❌ fetchNaverArticle error:', error);
    throw error;
  }
};

/**
 * Check if URL is a Naver finance URL
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export const isNaverFinanceUrl = (url) => {
  if (!url || typeof url !== 'string') return false;

  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('finance.naver.com') ||
         lowerUrl.includes('news.naver.com');
};

export default {
  fetchNaverArticle,
  isNaverFinanceUrl
};
