import React, { useState, useEffect } from 'react';
import { FileText, Upload, Trash2, Calendar, TrendingDown, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { extractTextFromPDF, validatePDFFile, getFileInfo } from '../utils/pdfHandler';
import { fetchMarketReports } from '../services/naverFinanceService';
import { analyzeOversoldStocks } from '../services/oversoldAnalyzer';
import {
  getAllWeeklyReports,
  saveWeeklyReport,
  deleteWeeklyReport,
  getWeeklyReportStats,
  hasReportForCurrentWeek
} from '../services/weeklyReportService';
import Layout from '../components/Layout';
import Card from '../components/Card';
import ReactMarkdown from 'react-markdown';
import './WeeklyAnalysis.css';

const WeeklyAnalysis = () => {
  const { state } = useApp();
  const { portfolio, macroIndicators } = state;

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Analysis state
  const [pdfText, setPdfText] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // Reports state
  const [reports, setReports] = useState([]);
  const [weeklyArchive, setWeeklyArchive] = useState([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, lastAnalyzed: null });
  const [expandedReport, setExpandedReport] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadReports();
    loadWeeklyArchive();
  }, []);

  const loadReports = async () => {
    try {
      const data = await fetchMarketReports();
      if (data && data.reports) {
        setReports(data.reports.slice(0, 10)); // Top 10 for sector analysis
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const loadWeeklyArchive = () => {
    const archive = getAllWeeklyReports();
    setWeeklyArchive(archive);
    setStats(getWeeklyReportStats());
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    try {
      validatePDFFile(file);
      setSelectedFile(file);
      setFileInfo(getFileInfo(file));
      setAnalysisError(null);
    } catch (error) {
      alert(error.message);
      setSelectedFile(null);
      setFileInfo(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      alert('PDF 파일을 선택해주세요.');
      return;
    }

    if (portfolio.length === 0) {
      alert('포트폴리오에 종목을 추가해주세요.');
      return;
    }

    setIsAnalyzing(true);
    setIsUploading(true);
    setAnalysisError(null);
    setAiAnalysis(null);
    setPdfText('');

    try {
      // Step 1: Extract text from PDF
      console.log('📄 Extracting PDF text...');
      const extractedText = await extractTextFromPDF(selectedFile);
      setPdfText(extractedText);

      // Step 2: Analyze with AI
      console.log('🤖 Analyzing with AI...');
      const analysis = await analyzeOversoldStocks({
        portfolio,
        oversoldText: extractedText,
        dailyReports: reports,
        macroIndicators
      });

      setAiAnalysis(analysis);

      // Step 3: Auto-save to archive
      console.log('💾 Saving to archive...');
      saveWeeklyReport({
        pdfFileName: selectedFile.name,
        aiAnalysis: analysis,
        rawSummary: extractedText,
        portfolio
      });

      loadWeeklyArchive();

      console.log('✅ Analysis complete and saved');

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      setAnalysisError(error.message || 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
      setIsUploading(false);
    }
  };

  const handleDeleteReport = (id) => {
    const confirm = window.confirm('이 주간 분석을 삭제하시겠습니까?');
    if (!confirm) return;

    try {
      deleteWeeklyReport(id);
      loadWeeklyArchive();
      if (expandedReport === id) {
        setExpandedReport(null);
      }
    } catch (error) {
      alert('삭제에 실패했습니다: ' + error.message);
    }
  };

  const toggleExpandReport = (id) => {
    setExpandedReport(expandedReport === id ? null : id);
  };

  const handleNewAnalysis = () => {
    setSelectedFile(null);
    setFileInfo(null);
    setPdfText('');
    setAiAnalysis(null);
    setAnalysisError(null);
  };

  const currentWeekExists = hasReportForCurrentWeek();

  return (
    <Layout>
      <Layout.Content maxWidth="large">
        <div className="weekly-analysis-page">
          {/* Header */}
          <div className="weekly-header">
            <div className="weekly-title-section">
              <h1 className="weekly-title">
                <TrendingDown size={32} />
                주간 과매도 리스트 심층 분석
              </h1>
              <p className="weekly-subtitle">
                전문가 리포트를 AI가 3중 교차 검증하여 진짜 기회와 함정을 구분합니다
              </p>
            </div>

            {/* Stats */}
            <div className="weekly-stats">
              <div className="stat-item">
                <span className="stat-label">전체 분석</span>
                <span className="stat-value">{stats.total}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">이번 달</span>
                <span className="stat-value">{stats.thisMonth}</span>
              </div>
              {currentWeekExists && (
                <div className="stat-item highlight">
                  <CheckCircle size={20} />
                  <span className="stat-label">이번 주 완료</span>
                </div>
              )}
            </div>
          </div>

          {/* Upload Section */}
          <Card title="📂 PDF 리포트 업로드" padding="large">
            <div className="upload-section">
              <div className="upload-description">
                <p>💡 <strong>주간 과매도 리포트</strong>를 업로드하면 AI가 자동으로 분석합니다:</p>
                <ul>
                  <li>✅ 전문가 의견 분석 (일시적 vs 구조적 문제)</li>
                  <li>✅ 오늘의 섹터 분위기 교차 확인</li>
                  <li>✅ 거시지표 기반 진입 타이밍 판단</li>
                  <li>✅ 진짜 기회 vs 함정 명확히 구분</li>
                </ul>
              </div>

              <div className="file-input-wrapper">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  id="pdf-upload"
                  className="file-input"
                  disabled={isAnalyzing}
                />
                <label htmlFor="pdf-upload" className="file-input-label">
                  <Upload size={20} />
                  {selectedFile ? '다른 파일 선택' : 'PDF 파일 선택'}
                </label>
              </div>

              {fileInfo && (
                <div className="file-info">
                  <FileText size={20} />
                  <div className="file-details">
                    <div className="file-name">{fileInfo.name}</div>
                    <div className="file-meta">
                      {fileInfo.size} • {fileInfo.lastModified}
                    </div>
                  </div>
                </div>
              )}

              {selectedFile && !aiAnalysis && (
                <button
                  className="analyze-btn"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>⏳ AI 분석 중... (30초~1분 소요)</>
                  ) : (
                    <>🔍 PDF 분석 시작</>
                  )}
                </button>
              )}
            </div>
          </Card>

          {/* Analysis Loading State */}
          {isUploading && (
            <Card padding="large">
              <div className="loading-state">
                <div className="spinner"></div>
                <h3>분석 진행 중...</h3>
                <p>
                  {pdfText ? '✅ PDF 텍스트 추출 완료 → 🤖 AI 분석 중...' : '📄 PDF 텍스트 추출 중...'}
                </p>
              </div>
            </Card>
          )}

          {/* Analysis Error */}
          {analysisError && (
            <Card padding="large">
              <div className="error-state">
                <div className="error-icon">⚠️</div>
                <h3>분석 오류</h3>
                <p>{analysisError}</p>
                <button className="retry-btn" onClick={handleAnalyze}>
                  다시 시도
                </button>
              </div>
            </Card>
          )}

          {/* Analysis Result */}
          {aiAnalysis && (
            <div className="analysis-result-section">
              <Card title="⚖️ 과매도 교차 검증 보고서" padding="large">
                <div className="analysis-content">
                  <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                </div>

                <div className="analysis-disclaimer">
                  ⚡ <strong>3중 교차 검증</strong>을 통해 분석된 결과입니다.
                  전문가 의견 + 섹터 분위기 + 시장 타이밍을 모두 고려했습니다.
                  <br/>
                  <small>실제 투자 결정은 본인의 판단과 책임하에 신중하게 하시기 바랍니다.</small>
                </div>

                <button
                  className="new-analysis-btn"
                  onClick={handleNewAnalysis}
                >
                  새로운 분석 시작
                </button>
              </Card>
            </div>
          )}

          {/* Weekly Archive */}
          <div className="weekly-archive-section">
            <h2 className="archive-title">
              <Calendar size={24} />
              주간 분석 아카이브 ({weeklyArchive.length})
            </h2>

            {weeklyArchive.length === 0 ? (
              <Card padding="large">
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3>아직 저장된 주간 분석이 없습니다</h3>
                  <p>PDF 리포트를 업로드하여 첫 번째 분석을 시작해보세요!</p>
                </div>
              </Card>
            ) : (
              <div className="archive-list">
                {weeklyArchive.map(report => (
                  <Card key={report.id} padding="large" className="archive-card">
                    <div className="archive-header">
                      <div className="archive-meta">
                        <div className="archive-week">{report.week}</div>
                        <div className="archive-date">{report.date}</div>
                      </div>
                      <button
                        className="delete-archive-btn"
                        onClick={() => handleDeleteReport(report.id)}
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="archive-filename">
                      <FileText size={16} />
                      {report.pdfFileName}
                    </div>

                    {report.rawSummary && (
                      <div className="archive-summary">
                        <strong>📄 원본 요약:</strong>
                        <p>{report.rawSummary}</p>
                      </div>
                    )}

                    <button
                      className="expand-archive-btn"
                      onClick={() => toggleExpandReport(report.id)}
                    >
                      {expandedReport === report.id ? 'AI 분석 접기 ▲' : 'AI 분석 전체 보기 ▼'}
                    </button>

                    {expandedReport === report.id && (
                      <div className="archive-analysis-full">
                        <ReactMarkdown>{report.aiAnalysis}</ReactMarkdown>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Info Card */}
          <Card title="💡 활용 가이드" padding="large">
            <div className="guide-grid">
              <div className="guide-item">
                <div className="guide-icon">🎯</div>
                <div className="guide-content">
                  <h4>3중 교차 검증</h4>
                  <p>전문가 의견 + 섹터 분위기 + 시장 타이밍을 모두 확인하여 진짜 기회를 찾습니다</p>
                </div>
              </div>
              <div className="guide-item">
                <div className="guide-icon">⚠️</div>
                <div className="guide-content">
                  <h4>함정 회피</h4>
                  <p>"과매도"라는 이유만으로 매수하지 않고, 리스크 요인을 명확히 알려드립니다</p>
                </div>
              </div>
              <div className="guide-item">
                <div className="guide-icon">📚</div>
                <div className="guide-content">
                  <h4>주간 아카이브</h4>
                  <p>매주 분석이 자동 저장되어 과거 전략을 복습하고 실력을 키울 수 있습니다</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Layout.Content>
    </Layout>
  );
};

export default WeeklyAnalysis;
