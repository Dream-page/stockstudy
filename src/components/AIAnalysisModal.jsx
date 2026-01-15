import React from 'react';
import { X, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './AIAnalysisModal.css';

const AIAnalysisModal = ({ isOpen, onClose, analysis, isLoading, error }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="ai-modal-backdrop" onClick={onClose} />
      <div className="ai-analysis-modal">
        <div className="ai-modal-header">
          <div className="ai-modal-title">
            <Sparkles size={24} />
            <h2>오늘의 투자 전략 보고서</h2>
          </div>
          <button className="ai-modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="ai-modal-content">
          {/* Loading State */}
          {isLoading && (
            <div className="ai-loading-state">
              <div className="ai-loading-spinner"></div>
              <p className="ai-loading-text">AI가 시장을 분석하고 있습니다...</p>
              <p className="ai-loading-subtext">포트폴리오와 리포트를 종합적으로 검토 중입니다</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="ai-error-state">
              <div className="ai-error-icon">⚠️</div>
              <h3>분석 오류</h3>
              <p>{error}</p>
              <button className="ai-retry-btn" onClick={onClose}>
                닫기
              </button>
            </div>
          )}

          {/* Analysis Result */}
          {analysis && !isLoading && !error && (
            <div className="ai-analysis-result">
              <div className="ai-badge">
                <Sparkles size={14} />
                AI 분석 완료
              </div>
              <div className="ai-markdown-content">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
              <div className="ai-disclaimer">
                <div style={{ marginBottom: '8px' }}>
                  💡 <strong>AI의 분석입니다.</strong> 정확한 정보는 원문 리포트를 참고하세요.
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  이 분석은 참고 자료일 뿐이며, 실제 투자 결정은 본인의 판단과 책임하에 신중하게 하시기 바랍니다.
                </div>
              </div>
            </div>
          )}
        </div>

        {!isLoading && analysis && (
          <div className="ai-modal-footer">
            <button className="ai-close-btn" onClick={onClose}>
              확인
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default AIAnalysisModal;
