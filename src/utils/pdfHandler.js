/**
 * PDF Handler Utility
 * Extracts text from PDF files using pdf.js
 */

import * as pdfjsLib from 'pdfjs-dist';

// Set worker source - use unpkg CDN which has all versions
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

/**
 * Extract text from PDF file
 * @param {File} file - PDF file object
 * @returns {Promise<string>} Extracted text from all pages
 */
export const extractTextFromPDF = async (file) => {
  try {
    console.log('📄 Starting PDF text extraction...');

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    console.log(`📄 PDF loaded: ${pdf.numPages} pages`);

    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine text items
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');

      fullText += pageText + '\n\n';

      console.log(`📄 Extracted page ${pageNum}/${pdf.numPages}`);
    }

    console.log(`✅ PDF extraction complete: ${fullText.length} characters`);

    return fullText.trim();

  } catch (error) {
    console.error('❌ PDF extraction error:', error);
    throw new Error('PDF 텍스트 추출에 실패했습니다: ' + error.message);
  }
};

/**
 * Validate PDF file
 * @param {File} file - File object
 * @returns {boolean} Is valid PDF
 */
export const validatePDFFile = (file) => {
  if (!file) {
    throw new Error('파일을 선택해주세요.');
  }

  if (file.type !== 'application/pdf') {
    throw new Error('PDF 파일만 업로드 가능합니다.');
  }

  // Max 10MB
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('파일 크기는 10MB 이하여야 합니다.');
  }

  return true;
};

/**
 * Get file info
 * @param {File} file - File object
 * @returns {Object} File information
 */
export const getFileInfo = (file) => {
  return {
    name: file.name,
    size: (file.size / 1024).toFixed(2) + ' KB',
    type: file.type,
    lastModified: new Date(file.lastModified).toLocaleDateString('ko-KR')
  };
};

export default {
  extractTextFromPDF,
  validatePDFFile,
  getFileInfo
};
