import React, { useState, useEffect } from 'react';
import { RefreshCw, BookOpen, ExternalLink, X, Sparkles, Edit3, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchMarketReports } from '../services/naverFinanceService';
import { analyzeMarketReport } from '../services/aiAdvisor';
import { fetchNaverArticle } from '../utils/naverScraper';
import { fetchAndParsePDF } from '../utils/pdfReader';
import Layout from '../components/Layout';
import Card from '../components/Card';
import './LearningPage.css';

const LearningPage = () => {
  const { state } = useApp();
  const { portfolio } = state;

  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Modal states
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Learning notes state
  const [notes, setNotes] = useState({});
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [currentNote, setCurrentNote] = useState('');

  // Fetch reports on mount
  useEffect(() => {
    loadReports();
    loadNotesFromStorage();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchMarketReports();

      if (data && data.reports && data.reports.length > 0) {
        setReports(data.reports);
        setLastUpdated(data.lastUpdated || new Date().toISOString());
      }
    } catch (err) {
      console.error('Failed to load research reports:', err);
      setError('리포트를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotesFromStorage = () => {
    try {
      const savedNotes = localStorage.getItem('learningNotes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    }
  };

  const saveNoteToStorage = (reportId, note) => {
    try {
      const updatedNotes = { ...notes, [reportId]: note };
      setNotes(updatedNotes);
      localStorage.setItem('learningNotes', JSON.stringify(updatedNotes));
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadReports();
      alert('최신 리포트로 업데이트되었습니다! 📚');
    } catch (err) {
      alert('업데이트에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const date = new Date(lastUpdated);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReportClick = async (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
    setIsAILoading(true);
    setAiError(null);
    setAiAnalysis(null);
    setCurrentNote(notes[report.id] || '');
    setIsEditingNote(false);

    try {
      console.log('📚 Analyzing report:', report.title);

      // Determine if this is a PDF link or Naver article
      let extractedText = '';
      const isPDF = report.url && (
        report.url.includes('.pdf') ||
        report.url.includes('research') ||
        report.url.includes('.aspx')
      );

      if (isPDF) {
        // PDF analysis
        console.log('📑 Fetching PDF content...');
        extractedText = await fetchAndParsePDF(report.url);
      } else {
        // Naver article analysis
        console.log('📰 Fetching Naver article...');
        extractedText = await fetchNaverArticle(report.url);
      }

      console.log(`✅ Extracted ${extractedText.length} characters`);

      // AI analysis
      const analysis = await analyzeMarketReport(
        report.title,
        extractedText,
        portfolio
      );

      setAiAnalysis(analysis);
      console.log('✅ AI analysis completed');

    } catch (err) {
      console.error('❌ Analysis failed:', err);
      setAiError(err.message || '콘텐츠 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAILoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedReport(null);
      setAiAnalysis(null);
      setAiError(null);
      setIsEditingNote(false);
    }, 300);
  };

  const handleSaveNote = () => {
    if (selectedReport) {
      saveNoteToStorage(selectedReport.id, currentNote);
      setIsEditingNote(false);
      alert('메모가 저장되었습니다! 📝');
    }
  };

  const getFirmBadgeStyle = (firm) => {
    const colors = {
      '대신증권': { bg: '#FFF3E0', color: '#E65100' },
      'IBK투자증권': { bg: '#E3F2FD', color: '#1565C0' },
      'SK증권': { bg: '#F3E5F5', color: '#6A1B9A' },
      'KB증권': { bg: '#FFF9C4', color: '#F57F17' },
      '미래에셋증권': { bg: '#E8F5E9', color: '#2E7D32' }
    };
    return colors[firm] || { bg: '#F5F5F5', color: '#616161' };
  };

  return (
    <Layout>
      <Layout.Content maxWidth="large">
        <div className="learning-page">
          {/* Header */}
          <div className="learning-header">
            <div className="learning-title-section">
              <h1 className="learning-title">
                <BookOpen size={32} />
                증권사 리서치
              </h1>
              <p className="learning-subtitle">
                리포트를 클릭하면 AI가 심층 분석하고 학습 메모를 작성할 수 있습니다
              </p>
            </div>

            <button
              className={`refresh-btn-large ${isRefreshing ? 'refreshing' : ''}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={20} />
              {isRefreshing ? '업데이트 중...' : '새로고침'}
            </button>
          </div>

          {/* Last Updated Info */}
          {lastUpdated && (
            <div className="last-updated">
              마지막 업데이트: {formatLastUpdated()}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>리포트를 불러오는 중...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Card padding="large">
              <div className="error-state">
                <div className="error-icon">⚠️</div>
                <h3>{error}</h3>
                <p>네트워크 연결을 확인하고 다시 시도해주세요.</p>
                <button className="retry-btn" onClick={loadReports}>
                  다시 시도
                </button>
              </div>
            </Card>
          )}

          {/* Reports List */}
          {!isLoading && !error && reports.length > 0 && (
            <div className="reports-section">
              <div className="reports-count">
                총 <strong>{reports.length}개</strong>의 리포트
              </div>

              <div className="reports-grid">
                {reports.map((report) => {
                  const badgeStyle = getFirmBadgeStyle(report.firm);
                  const hasNote = notes[report.id] && notes[report.id].trim() !== '';

                  return (
                    <div
                      key={report.id}
                      className="learning-report-card"
                      onClick={() => handleReportClick(report)}
                    >
                      <div className="report-header">
                        <span className="report-date">{report.date}</span>
                        <span
                          className="report-firm"
                          style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color }}
                        >
                          {report.firm}
                        </span>
                      </div>

                      <h3 className="report-title">
                        {report.title}
                      </h3>

                      <div className="report-footer">
                        <div className="report-views">
                          👁️ {report.views}
                        </div>
                        {hasNote && (
                          <div className="has-note-indicator">
                            <Edit3 size={14} />
                            메모 작성됨
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && reports.length === 0 && (
            <Card padding="large">
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>리포트가 없습니다</h3>
                <p>구글 시트에 데이터를 추가해주세요.</p>
              </div>
            </Card>
          )}

          {/* Info Card */}
          <Card title="💡 활용 팁" padding="large">
            <div className="tips-grid">
              <div className="tip-item">
                <div className="tip-icon">🤖</div>
                <div className="tip-content">
                  <h4>AI 심층 분석</h4>
                  <p>리포트를 클릭하면 AI가 자동으로 원문을 추출하고 핵심 내용을 요약합니다</p>
                </div>
              </div>
              <div className="tip-item">
                <div className="tip-icon">📝</div>
                <div className="tip-content">
                  <h4>학습 메모</h4>
                  <p>분석 결과를 보면서 나만의 학습 메모를 작성하고 저장할 수 있습니다</p>
                </div>
              </div>
              <div className="tip-item">
                <div className="tip-icon">🔍</div>
                <div className="tip-content">
                  <h4>포트폴리오 영향</h4>
                  <p>AI가 내 포트폴리오에 미치는 영향을 분석해 투자 인사이트를 제공합니다</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Analysis Modal */}
        {isModalOpen && (
          <>
            <div className="modal-backdrop" onClick={handleCloseModal} />
            <div className="learning-modal">
              <div className="modal-header">
                <div className="modal-title">
                  <Sparkles size={24} />
                  <h2>AI 심층 분석</h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={24} />
                </button>
              </div>

              <div className="modal-content">
                {/* Report Info */}
                {selectedReport && (
                  <div className="report-info-section">
                    <h3 className="report-modal-title">{selectedReport.title}</h3>
                    <div className="report-meta">
                      <span>{selectedReport.firm}</span>
                      <span>·</span>
                      <span>{selectedReport.date}</span>
                      <span>·</span>
                      <a
                        href={selectedReport.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="original-link"
                      >
                        <ExternalLink size={14} />
                        원문 보기
                      </a>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {isAILoading && (
                  <div className="ai-loading-state">
                    <div className="ai-loading-spinner"></div>
                    <p className="ai-loading-text">AI가 리포트를 분석하고 있습니다...</p>
                    <p className="ai-loading-subtext">원문 추출 및 핵심 내용 요약 중</p>
                  </div>
                )}

                {/* Error State */}
                {aiError && !isAILoading && (
                  <div className="ai-error-state">
                    <div className="ai-error-icon">⚠️</div>
                    <h3>분석 오류</h3>
                    <p>{aiError}</p>
                  </div>
                )}

                {/* Analysis Result */}
                {aiAnalysis && !isAILoading && !aiError && (
                  <div className="ai-analysis-result">
                    <div className="analysis-section">
                      <h4>📝 요약</h4>
                      <p>{aiAnalysis.summary}</p>
                    </div>

                    <div className="analysis-section">
                      <h4>💼 포트폴리오 영향</h4>
                      <p>{aiAnalysis.portfolioImpact}</p>
                    </div>

                    {aiAnalysis.quiz && (
                      <div className="analysis-section quiz-section">
                        <h4>🎯 학습 퀴즈</h4>
                        <div className="quiz-question">
                          <strong>Q:</strong> {aiAnalysis.quiz.question}
                        </div>
                        <div className="quiz-options">
                          {aiAnalysis.quiz.options?.map((option, idx) => (
                            <div key={idx} className="quiz-option">
                              {idx + 1}. {option}
                            </div>
                          ))}
                        </div>
                        <div className="quiz-answer">
                          <strong>정답:</strong> {aiAnalysis.quiz.answer}
                        </div>
                        <div className="quiz-explanation">
                          <strong>해설:</strong> {aiAnalysis.quiz.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Learning Notes Section */}
                {selectedReport && !isAILoading && (
                  <div className="notes-section">
                    <div className="notes-header">
                      <h4>📚 나만의 학습 메모</h4>
                      {!isEditingNote && (
                        <button
                          className="edit-note-btn"
                          onClick={() => setIsEditingNote(true)}
                        >
                          <Edit3 size={16} />
                          {notes[selectedReport.id] ? '수정' : '작성'}
                        </button>
                      )}
                    </div>

                    {isEditingNote ? (
                      <div className="note-editor">
                        <textarea
                          className="note-textarea"
                          value={currentNote}
                          onChange={(e) => setCurrentNote(e.target.value)}
                          placeholder="이 리포트에서 배운 내용, 중요한 포인트, 투자 아이디어 등을 메모하세요..."
                          rows={6}
                        />
                        <div className="note-actions">
                          <button
                            className="save-note-btn"
                            onClick={handleSaveNote}
                          >
                            <Save size={16} />
                            저장
                          </button>
                          <button
                            className="cancel-note-btn"
                            onClick={() => {
                              setCurrentNote(notes[selectedReport.id] || '');
                              setIsEditingNote(false);
                            }}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="note-display">
                        {notes[selectedReport.id] ? (
                          <p>{notes[selectedReport.id]}</p>
                        ) : (
                          <p className="note-placeholder">아직 작성된 메모가 없습니다. 위의 "작성" 버튼을 눌러 메모를 추가해보세요.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isAILoading && (
                <div className="modal-footer">
                  <button className="close-modal-btn" onClick={handleCloseModal}>
                    확인
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </Layout.Content>
    </Layout>
  );
};

export default LearningPage;
