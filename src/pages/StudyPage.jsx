import React, { useState, useEffect } from 'react';
import { BookOpen, RefreshCw, TrendingUp, Target, Edit3, Save, Loader } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import './StudyPage.css';

// 1. 🚨 올바른 CSV URL - 웹에 게시된 주소 사용
const STUDY_FEED_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTE6rU_HSro410_ho2cm9qlg-zgvNQuakmK_iYzRcCpRmS4ZFCnsM_GvZ4egwhTMWjpLs5zwYJB2SSh/pub?gid=925996007&single=true&output=csv';

// 2. Apps Script 업데이트 API
const REFRESH_API_URL = 'https://script.google.com/macros/s/AKfycbyiEGCAJ1ZR7_Di0NjN2ghbVg01DZ5OKPf-IK0zRQ0C3Q2g3kCMRAqho3kBaNJRiJOz/exec';

// Gemini API Key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const StudyPage = () => {
  // Reports state
  const [allReports, setAllReports] = useState([]);
  const [marketInfoReports, setMarketInfoReports] = useState([]);
  const [companyReports, setCompanyReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  // AI Analysis state
  const [marketSummary, setMarketSummary] = useState(null);
  const [isAnalyzingMarket, setIsAnalyzingMarket] = useState(false);
  const [companyAnalysis, setCompanyAnalysis] = useState([]);
  const [isAnalyzingCompanies, setIsAnalyzingCompanies] = useState(false);

  // Daily Study Note state (통합 메모장)
  const [dailyNote, setDailyNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteHistory, setNoteHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  // Load reports on mount
  useEffect(() => {
    loadReports();
  }, []);

  // Save daily note to Google Sheets
  const saveDailyNote = async () => {
    if (!dailyNote.trim()) {
      alert('메모 내용을 입력해주세요.');
      return;
    }

    setIsSavingNote(true);

    try {
      // CORS 우회: GET 요청으로 변경 (URL 파라미터로 전달)
      const encodedContent = encodeURIComponent(dailyNote);
      const url = `${REFRESH_API_URL}?action=saveNote&content=${encodedContent}`;

      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow'
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ 저장 완료!');
        setDailyNote(''); // 입력창 비우기
        // 자동으로 히스토리 새로고침
        loadNoteHistory();
      } else {
        throw new Error(result.message || '저장 실패');
      }

    } catch (error) {
      console.error('Save note error:', error);
      alert('❌ 저장 실패. 다시 시도해주세요.');
    } finally {
      setIsSavingNote(false);
    }
  };

  // Load note history from Google Sheets
  const loadNoteHistory = async () => {
    setIsLoadingHistory(true);

    try {
      const response = await fetch(`${REFRESH_API_URL}?action=getHistory&limit=50`, {
        method: 'GET',
        redirect: 'follow'
      });
      const result = await response.json();

      if (result.success) {
        setNoteHistory(result.notes || []);
      } else {
        console.error('Load history error:', result.message);
      }

    } catch (error) {
      console.error('Load history error:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Toggle history view
  const toggleHistory = () => {
    const newShowHistory = !showHistory;
    setShowHistory(newShowHistory);

    if (newShowHistory && noteHistory.length === 0) {
      loadNoteHistory();
    }
  };

  // Delete note
  const deleteNote = async (noteId) => {
    if (!window.confirm('이 메모를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`${REFRESH_API_URL}?action=deleteNote&id=${noteId}`, {
        method: 'GET',
        redirect: 'follow'
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ 삭제 완료!');
        loadNoteHistory();
      } else {
        throw new Error(result.message || '삭제 실패');
      }
    } catch (error) {
      console.error('Delete note error:', error);
      alert('❌ 삭제 실패. 다시 시도해주세요.');
    }
  };

  // Start editing note
  const startEditNote = (note) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  // Save edited note
  const saveEditedNote = async (noteId) => {
    if (!editingContent.trim()) {
      alert('메모 내용을 입력해주세요.');
      return;
    }

    try {
      const encodedContent = encodeURIComponent(editingContent);
      const response = await fetch(`${REFRESH_API_URL}?action=updateNote&id=${noteId}&content=${encodedContent}`, {
        method: 'GET',
        redirect: 'follow'
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ 수정 완료!');
        setEditingNoteId(null);
        setEditingContent('');
        loadNoteHistory();
      } else {
        throw new Error(result.message || '수정 실패');
      }
    } catch (error) {
      console.error('Update note error:', error);
      alert('❌ 수정 실패. 다시 시도해주세요.');
    }
  };

  // Fetch reports from Google Sheet
  const loadReports = async () => {
    try {
      setIsLoadingReports(true);

      // 🚨 [수정] CSV 전용 URL 사용
      const response = await fetch(STUDY_FEED_CSV_URL);
      const csvText = await response.text();

      // Parse CSV
      const rows = csvText.split('\n').slice(1); // Skip header row
      const parsedReports = rows.map((row, index) => {
        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (cols.length < 4) return null;

        return {
          id: `report-${index}`,
          date: cols[0]?.replace(/"/g, '').trim(),
          category: cols[1]?.replace(/"/g, '').trim().toLowerCase(),
          title: cols[2]?.replace(/"/g, '').trim(),
          link: cols[3]?.replace(/"/g, '').trim(),
          // 🆕 Apps Script에서 추출한 데이터 (E, F, G 컬럼)
          stockName: cols[4]?.replace(/"/g, '').trim() || '',
          targetPrice: cols[5]?.replace(/"/g, '').trim() || '',
          opinion: cols[6]?.replace(/"/g, '').trim() || ''
        };
      }).filter(item => item && item.title);

      setAllReports(parsedReports);

      // 카테고리별로 분류: 'market_info' → 시황, 'company' → 종목
      const marketInfo = parsedReports.filter(r => r.category === 'market_info');
      const company = parsedReports.filter(r => r.category === 'company');

      setMarketInfoReports(marketInfo);
      setCompanyReports(company);

      console.log(`✅ Loaded ${parsedReports.length} reports (${marketInfo.length} market_info, ${company.length} company)`);

    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoadingReports(false);
    }
  };

  // Refresh reports from server
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMessage('🔍 서버에서 새로운 리포트를 찾는 중...');

    try {
      const response = await fetch(REFRESH_API_URL, {
        method: 'GET',
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error('서버 응답 오류');
      }

      // Reload data
      await loadReports();
      setRefreshMessage('✅ 업데이트 성공!');

      setTimeout(() => {
        setRefreshMessage('');
      }, 2000);

    } catch (error) {
      console.error('Refresh failed:', error);
      setRefreshMessage('⚠️ 업데이트 실패. 다시 시도해주세요.');

      setTimeout(() => {
        setRefreshMessage('');
      }, 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Gemini API 공통 호출 함수 (DailyStudy 방식)
  const runGemini = async (prompt) => {
    if (!GEMINI_API_KEY) {
      console.warn("API Key is empty");
      throw new Error("API 키가 설정되지 않았습니다");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        })
      }
    );

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      const errorMsg = data.error ? data.error.message : "Blocked or Empty";
      throw new Error(`AI 응답 오류: ${errorMsg}`);
    }

    const rawText = data.candidates[0].content?.parts?.[0]?.text;
    return JSON.parse(rawText);
  };

  // Analyze market info reports
  const analyzeMarketInfo = async () => {
    if (marketInfoReports.length === 0) return;

    setIsAnalyzingMarket(true);

    try {
      // 제목들을 종합해서 분석
      const combinedTitles = marketInfoReports
        .map((r, idx) => `${idx + 1}. ${r.title}`)
        .join('\n');

      const prompt = `
당신은 증권 시장 전문 애널리스트입니다.
다음은 오늘의 시황 관련 리포트 제목들입니다:

${combinedTitles}

위 리포트들을 종합 분석하여 다음 형식으로 답변해주세요:

1. **오늘 시장 분위기**: 제목들에서 추론되는 시장의 전반적인 분위기를 3-4문장으로 요약하세요.
2. **주요 키워드**: 가장 중요한 시장 이슈나 지표 2-3개를 선정하세요.
3. **투자자 대응 전략**: 오늘 시장 상황에서 투자자가 주의해야 할 점을 구체적으로 제시하세요.

[응답 형식 (JSON)]:
{
  "summary": "오늘 시장 분위기 종합 요약 (3-4문장)",
  "keyIndicators": ["주요 키워드 1", "주요 키워드 2", "주요 키워드 3"],
  "strategy": "투자자 대응 전략 (2-3문장)"
}
`;

      const result = await runGemini(prompt);
      setMarketSummary(result);

    } catch (error) {
      console.error('Market analysis failed:', error);
      setMarketSummary({
        summary: "AI 서버 연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요.",
        keyIndicators: ["분석 오류"],
        strategy: "원문 리포트를 직접 확인해주세요."
      });
    } finally {
      setIsAnalyzingMarket(false);
    }
  };

  // Analyze company reports - 핵심 근거만 요약 (목표가/의견 중복 제거)
  const analyzeCompanies = async () => {
    if (companyReports.length === 0) return;

    setIsAnalyzingCompanies(true);

    try {
      // 각 리포트별로 개별 요약 생성
      const summaries = [];

      for (const report of companyReports) {
        const prompt = `
당신은 증권사 리포트 요약 전문가입니다.

**중요 지침:**
사용자에게는 이미 [목표주가: ${report.targetPrice || '-'}]와 [투자의견: ${report.opinion || '-'}] 정보가 별도로 표시됩니다.
따라서 요약문에서 "목표가는 얼마이고 의견은 매수입니다" 같은 말을 절대 반복하지 마세요.

**당신의 임무:**
아래 리포트 제목을 보고, **'왜' 그런 의견이 나왔는지 핵심 근거(Key Rationale)**만 1~2문장으로 요약하세요.
- 실적 호조? 수주 계약? 사업 전환? 낙폭 과대?
- 구체적 숫자나 이벤트를 언급하면 더 좋습니다.

**리포트 제목:**
${report.title}

**예시 (좋은 요약):**
- "2분기 영업이익이 컨센서스를 상회했고, 하반기 반도체 업황 회복이 예상되어 실적 개선 기대"
- "전기차 배터리 수주 물량 확대로 연간 매출 20% 성장 전망"
- "최근 주가 급락으로 밸류에이션 매력 부각, 장기 저가 매수 기회"

**예시 (나쁜 요약 - 절대 하지 말 것):**
- "목표주가는 8만원이고 투자의견은 매수입니다."
- "리포트에서 긍정적인 전망을 제시했습니다."

JSON 형식으로 답변하세요:
{
  "summary": "핵심 근거 1~2문장 (목표가/의견 언급 금지)"
}
`;

        try {
          const result = await runGemini(prompt);
          summaries.push({
            ...report,
            aiSummary: result.summary || '요약 생성 실패'
          });
        } catch (err) {
          console.error(`Failed to analyze ${report.title}:`, err);
          summaries.push({
            ...report,
            aiSummary: '분석 중 오류 발생'
          });
        }

        // API 호출 간격 (Rate Limit 방지)
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setCompanyAnalysis(summaries);

    } catch (error) {
      console.error('Company analysis failed:', error);
      setCompanyAnalysis([]);
    } finally {
      setIsAnalyzingCompanies(false);
    }
  };

  // Get opinion badge color
  const getOpinionColor = (opinion) => {
    if (opinion?.includes('매수')) return 'opinion-badge buy';
    if (opinion?.includes('매도')) return 'opinion-badge sell';
    if (opinion?.includes('홀딩')) return 'opinion-badge hold';
    return 'opinion-badge neutral';
  };

  return (
    <Layout>
      <Layout.Content maxWidth="large">
        <div className="study-page">
          {/* Header */}
          <div className="study-header">
            <div className="study-title-section">
              <h1 className="study-title">
                <BookOpen size={32} />
                증권사 리포트 분석
              </h1>
              <p className="study-subtitle">
                AI가 시황과 종목을 분석해드립니다
              </p>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="refresh-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: isRefreshing ? '#e0e0e0' : '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={20} className={isRefreshing ? 'spinning' : ''} />
              <span>{isRefreshing ? '업데이트 중...' : '🔄 최신 리포트 가져오기'}</span>
            </button>
          </div>

          {/* Refresh Message */}
          {refreshMessage && (
            <div style={{
              padding: '12px 20px',
              marginBottom: '20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: refreshMessage.includes('성공') ? '#D1FAE5' :
                             refreshMessage.includes('실패') ? '#FEE2E2' : '#DBEAFE',
              color: refreshMessage.includes('성공') ? '#065F46' :
                     refreshMessage.includes('실패') ? '#991B1B' : '#1E40AF',
              border: `1px solid ${refreshMessage.includes('성공') ? '#A7F3D0' :
                                  refreshMessage.includes('실패') ? '#FECACA' : '#BFDBFE'}`
            }}>
              {refreshMessage}
            </div>
          )}

          {/* Loading State */}
          {isLoadingReports && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              gap: '16px'
            }}>
              <Loader className="spinning" size={32} style={{ color: '#4F46E5' }} />
              <p style={{ color: '#6B7280', fontSize: '14px' }}>리포트를 불러오는 중...</p>
            </div>
          )}

          {/* Content */}
          {!isLoadingReports && (
            <div className="study-content">

              {/* Market Info Section */}
              <Card title="📉 오늘 시장은 어떨까? (시황 요약)" padding="large">
                {marketInfoReports.length === 0 ? (
                  <div className="empty-state">시황 리포트가 없습니다.</div>
                ) : (
                  <>
                    {/* Report List */}
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                        오늘의 시황 리포트 ({marketInfoReports.length}개)
                      </h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {marketInfoReports.map(report => (
                          <li key={report.id} style={{
                            padding: '10px 0',
                            borderBottom: '1px solid #E5E7EB',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <a
                              href={report.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#4F46E5',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: '500',
                                flex: 1
                              }}
                            >
                              {report.title}
                            </a>
                            <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '12px' }}>
                              {report.date}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* AI Analysis Button */}
                    {!marketSummary && (
                      <button
                        onClick={analyzeMarketInfo}
                        disabled={isAnalyzingMarket}
                        style={{
                          width: '100%',
                          padding: '14px',
                          backgroundColor: isAnalyzingMarket ? '#E5E7EB' : '#4F46E5',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: isAnalyzingMarket ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        {isAnalyzingMarket ? (
                          <>
                            <Loader size={16} className="spinning" />
                            AI 분석 중...
                          </>
                        ) : (
                          <>
                            <TrendingUp size={16} />
                            AI 시황 요약 보기
                          </>
                        )}
                      </button>
                    )}

                    {/* AI Summary */}
                    {marketSummary && (
                      <div style={{
                        marginTop: '20px',
                        padding: '20px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '16px',
                          color: '#4F46E5'
                        }}>
                          <TrendingUp size={20} />
                          <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>AI 시황 분석</h4>
                        </div>
                        <p style={{
                          fontSize: '14px',
                          lineHeight: '1.7',
                          color: '#374151',
                          marginBottom: '16px',
                          whiteSpace: 'pre-line'
                        }}>
                          {marketSummary.summary}
                        </p>

                        <div style={{ marginBottom: '16px' }}>
                          <strong style={{ fontSize: '14px', color: '#1F2937', display: 'block', marginBottom: '8px' }}>
                            📌 주요 키워드:
                          </strong>
                          <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            {marketSummary.keyIndicators.map((indicator, idx) => (
                              <li key={idx} style={{ fontSize: '14px', color: '#4B5563', lineHeight: '1.6' }}>
                                {indicator}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {marketSummary.strategy && (
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#FEF3C7',
                            borderRadius: '8px',
                            borderLeft: '3px solid #F59E0B'
                          }}>
                            <strong style={{ fontSize: '14px', color: '#92400E', display: 'block', marginBottom: '6px' }}>
                              💡 투자자 대응 전략:
                            </strong>
                            <p style={{ fontSize: '14px', color: '#78350F', lineHeight: '1.6', margin: 0 }}>
                              {marketSummary.strategy}
                            </p>
                          </div>
                        )}

                        {/* Market Note */}
                        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px'
                          }}>
                            <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                              📝 내 학습 메모
                            </h5>
                            {!isEditingMarketNote && (
                              <button
                                onClick={() => setIsEditingMarketNote(true)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '6px 12px',
                                  backgroundColor: 'white',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  color: '#4B5563'
                                }}
                              >
                                <Edit3 size={12} />
                                {marketNote ? '수정' : '작성'}
                              </button>
                            )}
                          </div>

                          {isEditingMarketNote ? (
                            <div>
                              <textarea
                                value={marketNote}
                                onChange={(e) => setMarketNote(e.target.value)}
                                placeholder="시황 분석에서 배운 내용을 메모하세요..."
                                rows={4}
                                style={{
                                  width: '100%',
                                  padding: '12px',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  fontFamily: 'inherit',
                                  resize: 'vertical'
                                }}
                              />
                              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button
                                  onClick={saveMarketNote}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '8px 16px',
                                    backgroundColor: '#4F46E5',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Save size={14} />
                                  저장
                                </button>
                                <button
                                  onClick={() => setIsEditingMarketNote(false)}
                                  style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'white',
                                    color: '#6B7280',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{
                              padding: '12px',
                              backgroundColor: 'white',
                              borderRadius: '6px',
                              fontSize: '14px',
                              color: '#4B5563',
                              border: '1px solid #E5E7EB',
                              minHeight: '60px'
                            }}>
                              {marketNote || '메모를 작성해보세요.'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card>

              {/* Company Analysis Section */}
              <Card title="🔍 전문가의 종목 픽 (종목 분석)" padding="large">
                {companyReports.length === 0 ? (
                  <div className="empty-state">종목 리포트가 없습니다.</div>
                ) : (
                  <>
                    {/* AI Analysis Button */}
                    {companyAnalysis.length === 0 && (
                      <button
                        onClick={analyzeCompanies}
                        disabled={isAnalyzingCompanies}
                        style={{
                          width: '100%',
                          padding: '14px',
                          marginBottom: '20px',
                          backgroundColor: isAnalyzingCompanies ? '#E5E7EB' : '#4F46E5',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: isAnalyzingCompanies ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        {isAnalyzingCompanies ? (
                          <>
                            <Loader size={16} className="spinning" />
                            AI 분석 중... ({companyReports.length}개 리포트)
                          </>
                        ) : (
                          <>
                            <Target size={16} />
                            AI 핵심 요약 생성 ({companyReports.length}개)
                          </>
                        )}
                      </button>
                    )}

                    {/* Company Analysis Results - Simple List */}
                    {companyAnalysis.length > 0 ? (
                      <div style={{
                        backgroundColor: '#F9FAFB',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                        overflow: 'hidden'
                      }}>
                        {companyAnalysis.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '20px',
                              borderBottom: idx < companyAnalysis.length - 1 ? '1px solid #E5E7EB' : 'none',
                              backgroundColor: 'white',
                              transition: 'all 0.2s'
                            }}
                          >
                            {/* Row 1: 종목명 + 투자의견 뱃지 */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              marginBottom: '10px'
                            }}>
                              <h3 style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#1F2937',
                                margin: 0
                              }}>
                                {item.stockName || '종목명 없음'}
                              </h3>
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: item.opinion?.includes('매수') || item.opinion?.toLowerCase().includes('buy') ? '#DCFCE7' :
                                               item.opinion?.includes('매도') || item.opinion?.toLowerCase().includes('sell') ? '#FEE2E2' :
                                               item.opinion?.includes('홀딩') || item.opinion?.toLowerCase().includes('hold') ? '#FEF3C7' : '#F3F4F6',
                                color: item.opinion?.includes('매수') || item.opinion?.toLowerCase().includes('buy') ? '#166534' :
                                       item.opinion?.includes('매도') || item.opinion?.toLowerCase().includes('sell') ? '#991B1B' :
                                       item.opinion?.includes('홀딩') || item.opinion?.toLowerCase().includes('hold') ? '#92400E' : '#4B5563'
                              }}>
                                {item.opinion || '-'}
                              </span>
                              <span style={{
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#DC2626',
                                marginLeft: 'auto'
                              }}>
                                {item.targetPrice || '-'}
                              </span>
                            </div>

                            {/* Row 2: 리포트 제목 (링크) */}
                            <div style={{ marginBottom: '12px' }}>
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '14px',
                                  color: '#4F46E5',
                                  textDecoration: 'none',
                                  lineHeight: '1.5',
                                  fontWeight: '500'
                                }}
                              >
                                📄 {item.title}
                              </a>
                            </div>

                            {/* Row 3: AI 핵심 요약 */}
                            {item.aiSummary && (
                              <div style={{
                                padding: '12px',
                                backgroundColor: '#F9FAFB',
                                borderLeft: '3px solid #4F46E5',
                                borderRadius: '6px'
                              }}>
                                <p style={{
                                  fontSize: '14px',
                                  lineHeight: '1.6',
                                  color: '#374151',
                                  margin: 0
                                }}>
                                  💡 <strong>핵심 근거:</strong> {item.aiSummary}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      // 분석 전 리포트 목록 - 메모 기능 포함
                      <div style={{
                        backgroundColor: '#F9FAFB',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                        overflow: 'hidden'
                      }}>
                        {companyReports.map((report, idx) => (
                          <div
                            key={report.id}
                            style={{
                              padding: '20px',
                              borderBottom: idx < companyReports.length - 1 ? '1px solid #E5E7EB' : 'none',
                              backgroundColor: 'white'
                            }}
                          >
                            {/* Row 1: 종목명 + 투자의견 + 목표가 */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              marginBottom: '10px'
                            }}>
                              <h3 style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#1F2937',
                                margin: 0
                              }}>
                                {report.stockName || '종목명 없음'}
                              </h3>
                              {report.opinion && (
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  backgroundColor: report.opinion?.includes('매수') || report.opinion?.toLowerCase().includes('buy') ? '#DCFCE7' :
                                                 report.opinion?.includes('매도') || report.opinion?.toLowerCase().includes('sell') ? '#FEE2E2' :
                                                 report.opinion?.includes('홀딩') || report.opinion?.toLowerCase().includes('hold') ? '#FEF3C7' : '#F3F4F6',
                                  color: report.opinion?.includes('매수') || report.opinion?.toLowerCase().includes('buy') ? '#166534' :
                                         report.opinion?.includes('매도') || report.opinion?.toLowerCase().includes('sell') ? '#991B1B' :
                                         report.opinion?.includes('홀딩') || report.opinion?.toLowerCase().includes('hold') ? '#92400E' : '#4B5563'
                                }}>
                                  {report.opinion}
                                </span>
                              )}
                              {report.targetPrice && (
                                <span style={{
                                  fontSize: '16px',
                                  fontWeight: '700',
                                  color: '#DC2626',
                                  marginLeft: 'auto'
                                }}>
                                  {report.targetPrice}
                                </span>
                              )}
                            </div>

                            {/* Row 2: 리포트 제목 */}
                            <div>
                              <a
                                href={report.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '14px',
                                  color: '#4F46E5',
                                  textDecoration: 'none',
                                  lineHeight: '1.5',
                                  fontWeight: '500'
                                }}
                              >
                                📄 {report.title}
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </Card>

            </div>
          )}

          {/* 통합 메모장 섹션 - 페이지 하단에 배치 */}
          {!isLoadingReports && (
            <Card title="📝 오늘의 공부 노트" padding="large" style={{ marginTop: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button
                  onClick={toggleHistory}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: showHistory ? '#4F46E5' : '#F3F4F6',
                    color: showHistory ? 'white' : '#6B7280',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <BookOpen size={16} />
                  {showHistory ? '메모 작성' : '지난 기록 보기'}
                </button>
              </div>

              {/* 메모 입력 영역 */}
              {!showHistory ? (
                <div>
                  <textarea
                    value={dailyNote}
                    onChange={(e) => setDailyNote(e.target.value)}
                    placeholder="오늘 본 리포트들에서 배운 점을 자유롭게 정리하세요...&#10;&#10;예시:&#10;• 삼성전자: AI 반도체 수요 증가로 실적 개선 기대&#10;• 카카오: 밸류에이션 매력, 장기 관점 매수 기회&#10;• 시장 전체: 금리 인하 가능성에 주목 필요"
                    rows={10}
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      lineHeight: '1.6',
                      marginBottom: '16px',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  />
                  <button
                    onClick={saveDailyNote}
                    disabled={isSavingNote || !dailyNote.trim()}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '14px',
                      backgroundColor: isSavingNote || !dailyNote.trim() ? '#D1D5DB' : '#4F46E5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: isSavingNote || !dailyNote.trim() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Save size={18} />
                    {isSavingNote ? '저장 중...' : '구글 시트에 저장'}
                  </button>
                </div>
              ) : (
                /* 히스토리 영역 */
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {isLoadingHistory ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                      <Loader className="spinning" size={32} style={{ margin: '0 auto', marginBottom: '12px' }} />
                      <p style={{ margin: 0, fontSize: '15px' }}>기록 불러오는 중...</p>
                    </div>
                  ) : noteHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                      <BookOpen size={48} style={{ margin: '0 auto', marginBottom: '16px', opacity: 0.3 }} />
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>아직 저장된 기록이 없습니다.</p>
                      <p style={{ margin: '8px 0 0', fontSize: '14px' }}>첫 공부 노트를 작성해보세요!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {noteHistory.map((note) => {
                        const isEditing = editingNoteId === note.id;

                        return (
                          <div
                            key={note.id}
                            style={{
                              padding: '20px',
                              backgroundColor: isEditing ? '#FFF7ED' : '#F9FAFB',
                              borderRadius: '12px',
                              border: isEditing ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                              transition: 'all 0.2s'
                            }}
                          >
                            {/* 날짜와 버튼 */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '12px'
                            }}>
                              <span style={{
                                fontSize: '13px',
                                color: '#6B7280',
                                fontWeight: '600'
                              }}>
                                📅 {note.date}
                              </span>

                              {!isEditing && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => startEditNote(note)}
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      color: '#4F46E5',
                                      backgroundColor: '#EEF2FF',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E0E7FF'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EEF2FF'}
                                  >
                                    ✏️ 수정
                                  </button>
                                  <button
                                    onClick={() => deleteNote(note.id)}
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      color: '#DC2626',
                                      backgroundColor: '#FEE2E2',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FECACA'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                                  >
                                    🗑️ 삭제
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* 내용 또는 편집 영역 */}
                            {isEditing ? (
                              <div>
                                <textarea
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  rows={6}
                                  style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid #F59E0B',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    lineHeight: '1.7',
                                    marginBottom: '12px',
                                    outline: 'none'
                                  }}
                                />
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => saveEditedNote(note.id)}
                                    style={{
                                      padding: '8px 16px',
                                      fontSize: '14px',
                                      fontWeight: '600',
                                      color: 'white',
                                      backgroundColor: '#4F46E5',
                                      border: 'none',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    ✅ 저장
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    style={{
                                      padding: '8px 16px',
                                      fontSize: '14px',
                                      fontWeight: '600',
                                      color: '#6B7280',
                                      backgroundColor: '#F3F4F6',
                                      border: 'none',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p style={{
                                margin: 0,
                                fontSize: '14px',
                                lineHeight: '1.7',
                                color: '#1F2937',
                                whiteSpace: 'pre-wrap'
                              }}>
                                {note.content}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </Layout.Content>
    </Layout>
  );
};

export default StudyPage;
