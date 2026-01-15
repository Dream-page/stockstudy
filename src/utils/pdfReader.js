/**
 * PDF Reader Utility
 * Fetches and extracts text from remote PDF files using CORS proxy
 */

import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

// CORS proxy options - ordered by reliability
const CORS_PROXIES = [
  {
    url: 'https://corsproxy.io/?',
    name: 'CorsProxy.io'
  },
  {
    url: 'https://api.allorigins.win/raw?url=',
    name: 'AllOrigins'
  },
  {
    url: 'https://api.codetabs.com/v1/proxy?quest=',
    name: 'CodeTabs'
  },
  {
    url: '', // Direct fetch (no proxy)
    name: 'Direct'
  }
];

/**
 * Fetch with timeout
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Response>}
 */
const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
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
 * Validate PDF buffer
 * @param {ArrayBuffer} buffer - Buffer to validate
 * @returns {boolean}
 */
const isPDFBuffer = (buffer) => {
  if (!buffer || buffer.byteLength < 5) return false;

  // Check PDF signature: %PDF-
  const arr = new Uint8Array(buffer, 0, 5);
  return arr[0] === 0x25 && // %
         arr[1] === 0x50 && // P
         arr[2] === 0x44 && // D
         arr[3] === 0x46 && // F
         arr[4] === 0x2D;   // -
};

/**
 * Fetch PDF via CORS proxy
 * @param {string} url - Original PDF URL
 * @returns {Promise<ArrayBuffer>} PDF data
 */
const fetchViaCorsProxy = async (url) => {
  const errors = [];

  // Try each proxy until one works
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxy = CORS_PROXIES[i];
    const proxyUrl = proxy.url ? proxy.url + encodeURIComponent(url) : url;

    try {
      console.log(`🌐 [${i + 1}/${CORS_PROXIES.length}] Trying ${proxy.name}...`);
      console.log(`   URL: ${proxyUrl.substring(0, 100)}...`);

      const response = await fetchWithTimeout(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf, */*',
        }
      }, 30000);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      console.log(`   Content-Type: ${contentType}`);

      const arrayBuffer = await response.arrayBuffer();

      // Validate size
      if (arrayBuffer.byteLength < 100) {
        throw new Error(`응답이 너무 작음 (${arrayBuffer.byteLength} bytes)`);
      }

      // Validate PDF signature
      if (!isPDFBuffer(arrayBuffer)) {
        throw new Error('PDF 형식이 아닙니다 (잘못된 파일 시그니처)');
      }

      console.log(`✅ Success! PDF size: ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`);
      return arrayBuffer;

    } catch (error) {
      const errorMsg = `${proxy.name} 실패: ${error.message}`;
      console.warn(`❌ ${errorMsg}`);
      errors.push(errorMsg);

      // If this was the last proxy, throw detailed error
      if (i === CORS_PROXIES.length - 1) {
        const detailedError = new Error(
          `모든 프록시 시도 실패.\n\n시도한 방법:\n${errors.map((e, idx) => `${idx + 1}. ${e}`).join('\n')}\n\n원본 URL: ${url}`
        );
        throw detailedError;
      }

      // Otherwise, try next proxy
      continue;
    }
  }
};

/**
 * Extract text from PDF ArrayBuffer
 * @param {ArrayBuffer} arrayBuffer - PDF data
 * @returns {Promise<string>} Extracted text
 */
const extractTextFromPDFBuffer = async (arrayBuffer) => {
  try {
    console.log('📄 Loading PDF document...');

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    console.log(`📄 PDF loaded: ${pdf.numPages} pages`);

    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine text items with proper spacing
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      fullText += pageText + '\n\n';

      console.log(`📄 Extracted page ${pageNum}/${pdf.numPages} (${pageText.length} characters)`);

      // Limit to first 50 pages to avoid memory issues
      if (pageNum >= 50) {
        console.warn('⚠️ Reached 50 page limit, stopping extraction');
        break;
      }
    }

    const finalText = fullText.trim();
    console.log(`✅ PDF extraction complete: ${finalText.length} total characters`);

    return finalText;

  } catch (error) {
    console.error('❌ PDF text extraction error:', error);
    throw new Error('PDF 텍스트 추출에 실패했습니다: ' + error.message);
  }
};

/**
 * Extract PDF download link from HTML page
 * @param {string} htmlUrl - URL of the HTML page (e.g., .aspx)
 * @returns {Promise<string>} Direct PDF download URL
 */
const extractPDFLinkFromHTML = async (htmlUrl) => {
  console.log('🔍 Extracting PDF link from HTML page...');

  try {
    // Step 1: Fetch HTML via proxy
    const proxy = CORS_PROXIES[0]; // Use first proxy for HTML fetch
    const proxyUrl = proxy.url + encodeURIComponent(htmlUrl);

    console.log(`   Fetching HTML from: ${htmlUrl}`);
    console.log(`   Via proxy: ${proxyUrl.substring(0, 120)}...`);

    const response = await fetchWithTimeout(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html, application/xhtml+xml, */*',
      }
    }, 30000);

    console.log(`   Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch HTML: ${response.status} ${response.statusText}`);
    }

    const htmlText = await response.text();
    console.log(`   HTML fetched: ${htmlText.length} characters`);

    // Log first 500 chars for debugging
    console.log(`   HTML preview: ${htmlText.substring(0, 500)}`);

    // Step 2: Extract PDF links using regex patterns
    const pdfLinkPatterns = [
      // Pattern 1: filedownload.aspx with file parameter
      /href=["']([^"']*filedownload\.aspx[^"']*)["']/gi,
      // Pattern 2: Direct .pdf links
      /href=["']([^"']*\.pdf[^"']*)["']/gi,
      // Pattern 3: onclick with window.open or location
      /window\.open\(['"]([^'"]*\.pdf[^'"]*)['"]\)/gi,
      // Pattern 4: Data attributes with PDF
      /data-[^=]*=["']([^"']*\.pdf[^"']*)["']/gi,
      // Pattern 5: JavaScript href for filedownload
      /["']([^"']*filedownload[^"']*)["']/gi
    ];

    let pdfLinks = [];
    for (const pattern of pdfLinkPatterns) {
      const matches = [...htmlText.matchAll(pattern)];
      const foundLinks = matches.map(match => match[1]);
      if (foundLinks.length > 0) {
        console.log(`   Pattern matched ${foundLinks.length} links:`, foundLinks);
      }
      pdfLinks.push(...foundLinks);
    }

    console.log(`   Total found ${pdfLinks.length} potential PDF links`);

    if (pdfLinks.length === 0) {
      // Try alternative: look for any download or file links
      const alternativePattern = /href=["']([^"']*download[^"']*)["']/gi;
      const altMatches = [...htmlText.matchAll(alternativePattern)];
      if (altMatches.length > 0) {
        pdfLinks = altMatches.map(m => m[1]);
        console.log(`   Found ${pdfLinks.length} alternative download links`);
      }
    }

    if (pdfLinks.length === 0) {
      throw new Error('HTML 페이지에서 PDF 다운로드 링크를 찾을 수 없습니다. 페이지 구조가 예상과 다를 수 있습니다.');
    }

    // Step 3: Convert relative URL to absolute URL
    const baseUrl = new URL(htmlUrl);
    const firstPdfLink = pdfLinks[0];

    let absolutePdfUrl;
    if (firstPdfLink.startsWith('http')) {
      absolutePdfUrl = firstPdfLink;
    } else if (firstPdfLink.startsWith('/')) {
      absolutePdfUrl = `${baseUrl.protocol}//${baseUrl.host}${firstPdfLink}`;
    } else if (firstPdfLink.startsWith('./')) {
      absolutePdfUrl = `${baseUrl.protocol}//${baseUrl.host}${baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/'))}/${firstPdfLink.substring(2)}`;
    } else {
      absolutePdfUrl = `${baseUrl.protocol}//${baseUrl.host}${baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/'))}/${firstPdfLink}`;
    }

    // Decode HTML entities
    absolutePdfUrl = absolutePdfUrl
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');

    console.log(`✅ Extracted PDF URL: ${absolutePdfUrl}`);
    return absolutePdfUrl;

  } catch (error) {
    console.error('❌ Failed to extract PDF link from HTML:');
    console.error('   Error type:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Full error:', error);
    throw new Error(`HTML에서 PDF 링크 추출 실패: ${error.message}`);
  }
};

/**
 * Check if URL is a web page (not direct PDF)
 * @param {string} url - URL to check
 * @returns {boolean}
 */
const isWebPage = (url) => {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.aspx') ||
         lowerUrl.includes('.html') ||
         lowerUrl.includes('.htm') ||
         lowerUrl.includes('.jsp') ||
         lowerUrl.includes('.php') ||
         (lowerUrl.includes('research') && !lowerUrl.endsWith('.pdf'));
};

/**
 * Fetch and parse PDF from URL (auto-detect web page vs direct PDF)
 * @param {string} url - PDF URL or web page URL
 * @returns {Promise<string>} Extracted text from PDF
 */
export const fetchAndParsePDF = async (url) => {
  try {
    console.log('🚀 Starting PDF fetch and parse:', url);

    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid PDF URL');
    }

    let finalPdfUrl = url;

    // Step 1: Check if this is a web page containing PDF link
    if (isWebPage(url)) {
      console.log('📄 URL is a web page - extracting PDF link...');
      finalPdfUrl = await extractPDFLinkFromHTML(url);
    } else {
      console.log('📑 URL appears to be a direct PDF');
    }

    // Step 2: Fetch PDF via CORS proxy
    const arrayBuffer = await fetchViaCorsProxy(finalPdfUrl);

    // Step 3: Extract text from PDF
    const text = await extractTextFromPDFBuffer(arrayBuffer);

    // Validate extracted text
    if (!text || text.length < 100) {
      throw new Error('Extracted text is too short or empty. PDF may be image-based or corrupted.');
    }

    console.log(`✅ Successfully extracted ${text.length} characters from PDF`);
    return text;

  } catch (error) {
    console.error('❌ fetchAndParsePDF error:', error);
    throw error;
  }
};

/**
 * Check if URL is likely a PDF or web page containing PDF
 * @param {string} url - URL to check
 * @returns {boolean} Is likely a PDF or report page
 */
export const isPDFUrl = (url) => {
  if (!url || typeof url !== 'string') return false;

  const lowerUrl = url.toLowerCase();

  // Direct PDF
  if (lowerUrl.endsWith('.pdf')) return true;

  // Web page that likely contains PDF (대신증권, etc.)
  return lowerUrl.includes('.pdf') ||
         lowerUrl.includes('/pdf/') ||
         lowerUrl.includes('research') ||
         lowerUrl.includes('report') ||
         isWebPage(url); // Include web pages
};

/**
 * Truncate text to fit within token limits
 * @param {string} text - Full text
 * @param {number} maxChars - Maximum characters (default: 30000 ~= 7500 tokens)
 * @returns {string} Truncated text
 */
export const truncateForAI = (text, maxChars = 30000) => {
  if (!text) return '';

  if (text.length <= maxChars) {
    return text;
  }

  // Truncate and add indicator
  const truncated = text.substring(0, maxChars);
  console.warn(`⚠️ Text truncated from ${text.length} to ${maxChars} characters`);

  return truncated + '\n\n[... 텍스트가 길이 제한으로 인해 잘렸습니다 ...]';
};

export default {
  fetchAndParsePDF,
  isPDFUrl,
  truncateForAI
};
