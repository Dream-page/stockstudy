import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, TrendingUp, FileText, ChevronRight, X, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, HelpCircle, Lightbulb, Wallet, ArrowRight, PlayCircle } from 'lucide-react';
import { fetchAndParsePDF } from '../utils/pdfReader';

const GOOGLE_SHEET_ID = '1R2NeMNH13No1lX84UnEu-sRc7mXF1vGwB4BwmOu_i5A';
const PORTFOLIO_SHEET_ID = '11Wi9s0Tve8rnG8U8kja-3ZbKXNIVGWfuevpvGeifn8c'; // 포트폴리오 시트 ID
const CORS_PROXY = 'https://corsproxy.io/?';

// Gemini API 설정
// 중요: 로컬 개발 환경(Vite/Claude)에서 실행할 때는 .env 파일을 만들고 
// 아래 주석을 해제하여 VITE_GEMINI_API_KEY를 사용하세요.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 
/**
 * 유틸리티: HTML 문자열에서 텍스트만 추출
 */
const stripHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

/**
 * 메인 컴포넌트
 */
export default function DailyStudyApp() {
  const [items, setItems] = useState([]);
  const [portfolio, setPortfolio] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // 개별 리포트 분석 모달 상태
  const [selectedItem, setSelectedItem] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  
  // 퀴즈 상태
  const [selectedQuizIndex, setSelectedQuizIndex] = useState(null); 
  const [showExplanation, setShowExplanation] = useState(false);

  // [NEW] 하단 포트폴리오 진단 섹션 상태
  const [portfolioDiagnosis, setPortfolioDiagnosis] = useState(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisError, setDiagnosisError] = useState(null);

  // 리포트 새로고침 상태
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  // 1. 초기 데이터 로드 (학습 자료 + 포트폴리오)
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchSheetData(), fetchPortfolioData()]);
      setLoading(false);
    };
    initData();
  }, []);

  // 최신 리포트 가져오기 함수
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMessage('🔍 서버에서 새로운 리포트를 찾는 중...');

    try {
      // Google Apps Script 엔드포인트로 직접 요청
      const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbwDxLi9XHy3bvz1vvY7jYxHS3sLWKDJ4ELHXsPoruQk7VF08yhaVyriNJ-an3uMNAYl/exec';

      const response = await fetch(appsScriptUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error('서버 응답 오류');
      }

      // 성공 시 데이터 새로고침
      await fetchSheetData();
      setRefreshMessage('✅ 업데이트 성공!');

      // 2초 후 메시지 숨김
      setTimeout(() => {
        setRefreshMessage('');
      }, 2000);

    } catch (error) {
      console.error('Refresh failed:', error);
      setRefreshMessage('⚠️ 업데이트 실패. 다시 시도해주세요.');

      // 3초 후 에러 메시지 숨김
      setTimeout(() => {
        setRefreshMessage('');
      }, 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 학습 자료 데이터 Fetch
  const fetchSheetData = async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv`;
      const response = await fetch(url);
      const csvText = await response.text();
      
      const rows = csvText.split('\n').slice(1);
      const parsedData = rows.map((row, index) => {
        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
        if (cols.length < 4) return null;
        return {
          id: index,
          date: cols[0]?.replace(/"/g, '').trim(),
          category: cols[1]?.replace(/"/g, '').trim(),
          title: cols[2]?.replace(/"/g, '').trim(),
          link: cols[3]?.replace(/"/g, '').trim(),
        };
      }).filter(item => item && item.title);
      setItems(parsedData);
    } catch (err) {
      console.error("Failed to fetch sheet:", err);
    }
  };

  // 포트폴리오 데이터 Fetch
  const fetchPortfolioData = async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${PORTFOLIO_SHEET_ID}/export?format=csv`;
      const response = await fetch(url);
      const csvText = await response.text();
      
      const rows = csvText.split('\n').slice(1);
      const parsedData = rows.map((row) => {
        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (cols.length < 1) return null;
        return {
          name: cols[0]?.replace(/"/g, '').trim(),
        };
      }).filter(item => item && item.name);
      
      setPortfolio(parsedData);
    } catch (err) {
      console.error("Failed to fetch portfolio:", err);
    }
  };

  // 콘텐츠 스크래핑 (개선된 버전)
  const fetchContent = async (item) => {
    try {
      let extractedText = "";

      if (item.category.toLowerCase() === 'special') {
        // Special 카테고리: pdfReader.js 사용
        console.log('📑 Special report - using pdfReader.js for:', item.link);
        try {
          extractedText = await fetchAndParsePDF(item.link);
          console.log(`✅ PDF extracted: ${extractedText.length} characters`);
        } catch (pdfError) {
          console.error('❌ PDF extraction failed:', pdfError);
          throw new Error(`PDF 분석 실패: ${pdfError.message}`);
        }
      } else {
        // Market 카테고리: 기존 방식 유지
        const proxyUrl = `${CORS_PROXY}${encodeURIComponent(item.link)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("네트워크 응답 오류");

        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const contentNode = doc.querySelector('.view_con') || doc.querySelector('#content') || doc.body;
        ["script", "style"].forEach(tag => contentNode.querySelectorAll(tag).forEach(el => el.remove()));
        extractedText = contentNode.innerText;
      }

      if (!extractedText || extractedText.trim().length < 50) throw new Error("본문 내용 부족");
      return extractedText.substring(0, 15000);
    } catch (e) {
      throw new Error(`콘텐츠 로딩 실패: ${e.message}`);
    }
  };

  // Gemini AI 분석 (개별 리포트 보기용)
  const analyzeContent = async (text, category) => {
    const isReport = category?.toLowerCase() === 'special';
    let systemPrompt = isReport 
      ? `당신은 증권사 리포트를 분석하는 애널리스트입니다. 상세 요약(7줄 이상), 실전 인사이트(종목명 필수), 심화 퀴즈를 출제하세요.` 
      : `당신은 실전 트레이더입니다. 뉴스 핵심 요약, 즉각 대응 전략, 실전 응용 퀴즈를 출제하세요.`;

    const prompt = `
      ${systemPrompt}
      [분석할 텍스트]: ${text}
      [응답 형식 (JSON)]:
      {
        "summary": "요약 내용",
        "insight": "시장 대응 전략",
        "quiz": { "question": "...", "options": ["..."], "correct_index": 0, "explanation": "..." }
      }
    `;
    return await runGemini(prompt);
  };

  // [수정된 부분] 포트폴리오 전용 분석 함수 (Market 뉴스 종합)
  const analyzePortfolio = async () => {
    if (items.length === 0) return;
    
    setIsDiagnosing(true);
    setDiagnosisError(null);
    
    try {
      // 1. 'Market' 카테고리 아이템만 필터링 (상위 3개 종합)
      const marketItems = items
        .filter(item => item.category.toLowerCase() === 'market')
        .slice(0, 3);

      if (marketItems.length === 0) {
        throw new Error("분석할 수 있는 Market 뉴스가 없습니다.");
      }

      // 2. 뉴스 본문 병렬 로딩
      const newsContents = await Promise.all(marketItems.map(async (item) => {
        try {
          const text = await fetchContent(item);
          return `[기사: ${item.title}]\n${text.substring(0, 5000)}...`; // 길이 조절
        } catch (e) {
          console.warn(`Failed to fetch ${item.title}`, e);
          return null;
        }
      }));

      const combinedText = newsContents.filter(t => t).join("\n\n=================\n\n");
      
      const portfolioList = portfolio.map(p => p.name).join(", ");
      
      const prompt = `
        당신은 **사용자의 개인 투자 자문가(PB)**입니다.
        증권사 리포트(PDF) 대신, 최신 **Market 뉴스들**을 종합하여 사용자의 포트폴리오를 점검해줍니다.
        
        [분석 대상 뉴스 종합]:
        ${combinedText}

        [사용자 보유 종목]: ${portfolioList}

        [임무]:
        위 뉴스들을 종합적으로 분석하여, **[사용자 보유 종목]**들의 대응 전략을 점검해주세요.
        
        1. **종합 시황 분석**: 뉴스들의 공통된 핵심 키워드(예: 금리, AI, 유가 등)를 파악하세요.
        2. **매매 의견**: 각 종목별로 **[비중확대 / 비중축소 / 관망]** 중 하나의 태그를 붙이세요.
        3. **이유**: 뉴스 내용을 근거로 1문장으로 명확히 설명하세요.
        4. **추천 종목**: 보유 종목 외에, 이 시장 흐름에서 유망한 종목 1개를 추천해주세요.

        [응답 형식 (JSON)]:
        {
          "target_title": "최신 Market 뉴스 종합 분석",
          "advice_list": [
            {
              "name": "보유 종목명",
              "action": "비중확대 or 비중축소 or 관망",
              "reason": "분석된 이유"
            }
          ],
          "new_recommendation": {
             "name": "추천 종목명",
             "reason": "추천 이유"
          }
        }
      `;

      const result = await runGemini(prompt);
      setPortfolioDiagnosis(result);

    } catch (e) {
      console.error("Portfolio diagnosis failed:", e);
      setDiagnosisError(e.message);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Gemini API 공통 호출 함수
  const runGemini = async (prompt) => {
    // API 키 체크 (빈 값일 경우 에러 메시지 강화)
    if (!apiKey) {
      // 이 부분은 실제 서비스 시에는 사용자 입력이나 시스템 주입으로 해결해야 함.
      // 현재 Canvas 환경에서는 시스템이 처리해주지만, 외부 환경에서는 에러가 날 수 있음.
      console.warn("API Key is empty. If running locally, please set VITE_GEMINI_API_KEY in .env");
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
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
    });

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
        const errorMsg = data.error ? data.error.message : "Blocked or Empty";
        throw new Error(`AI 응답 오류: ${errorMsg}`);
    }
    
    const rawText = data.candidates[0].content?.parts?.[0]?.text;
    return JSON.parse(rawText);
  };

  // 핸들러
  const handleCardClick = async (item) => {
    setSelectedItem(item);
    setAnalyzing(true);
    setAnalysisResult(null);
    setError(null);
    setSelectedQuizIndex(null);
    setShowExplanation(false);

    try {
      const text = await fetchContent(item);
      const result = await analyzeContent(text, item.category);
      setAnalysisResult(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const closeModal = () => {
    setSelectedItem(null);
    setAnalysisResult(null);
  };

  const handleQuizSelect = (index) => {
    if (showExplanation) return;
    setSelectedQuizIndex(index);
    setShowExplanation(true);
  };

  // 매매 액션에 따른 배지 컬러
  const getActionColor = (action) => {
    if (action.includes("확대") || action.includes("매수")) return "bg-red-100 text-red-700 border-red-200";
    if (action.includes("축소") || action.includes("매도")) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white px-6 py-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Daily Study</h1>
            {portfolio.length > 0 && (
               <span className="text-xs text-gray-500 font-medium">
                 내 종목 {portfolio.length}개 연동 중
               </span>
            )}
          </div>
        </div>
        <button onClick={() => window.location.reload()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
          <RefreshCw size={20} />
        </button>
      </header>

      {/* Main Feed */}
      <main className="max-w-md mx-auto px-4 mt-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">오늘의 리포트 & 뉴스</h2>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? '업데이트 중...' : '최신 리포트 가져오기'}</span>
          </button>
        </div>

        {/* Refresh Message */}
        {refreshMessage && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
            refreshMessage.includes('성공')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : refreshMessage.includes('실패')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {refreshMessage}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-white rounded-2xl shadow-sm animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
           <div className="text-center py-10 text-gray-500">
             <AlertCircle className="mx-auto mb-2" />
             데이터가 없습니다.
           </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} item={item} onClick={() => handleCardClick(item)} />
            ))}
          </div>
        )}
      </main>

      {/* [NEW] Bottom Section: Portfolio Diagnosis */}
      {!loading && portfolio.length > 0 && (
        <section className="max-w-md mx-auto px-4 mt-8 pb-10">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-blue-300">
                <TrendingUp size={20} />
                <h3 className="font-bold text-lg">내 포트폴리오 AI 진단</h3>
              </div>
              
              {!portfolioDiagnosis ? (
                <div className="mt-4">
                  <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    최신 <span className="font-semibold text-white">MARKET 뉴스</span>들을 종합하여<br/>
                    회원님의 종목 대응 전략을 분석합니다.
                  </p>
                  <button 
                    onClick={analyzePortfolio}
                    disabled={isDiagnosing}
                    className="w-full bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                  >
                    {isDiagnosing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        뉴스 종합 분석 중...
                      </>
                    ) : (
                      <>
                        <PlayCircle size={20} />
                        지금 바로 진단하기
                      </>
                    )}
                  </button>
                  {diagnosisError && (
                    <p className="text-red-400 text-xs mt-3 text-center">{diagnosisError}</p>
                  )}
                </div>
              ) : (
                <div className="mt-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="text-xs text-slate-400 mb-4 pb-4 border-b border-slate-700">
                    분석 기준: {portfolioDiagnosis.target_title}
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {portfolioDiagnosis.advice_list.map((advice, idx) => (
                      <div key={idx} className="bg-slate-700/50 p-3 rounded-xl border border-slate-600">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold">{advice.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            advice.action.includes('확대') ? 'bg-red-500/20 text-red-300' : 
                            advice.action.includes('축소') ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {advice.action}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{advice.reason}</p>
                      </div>
                    ))}
                  </div>

                  {portfolioDiagnosis.new_recommendation && (
                    <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30">
                      <div className="flex items-center gap-2 text-blue-300 font-bold mb-1">
                        <Lightbulb size={16} /> AI 추천 종목
                      </div>
                      <div className="font-bold text-lg mb-1">{portfolioDiagnosis.new_recommendation.name}</div>
                      <p className="text-xs text-blue-200/80">{portfolioDiagnosis.new_recommendation.reason}</p>
                    </div>
                  )}

                  <button 
                    onClick={() => setPortfolioDiagnosis(null)}
                    className="w-full mt-6 py-3 text-slate-400 text-sm hover:text-white transition"
                  >
                    다른 뉴스로 다시하기
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Analysis Modal (Existing) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          
          <div className="relative bg-white w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex justify-between items-start bg-white shrink-0">
              <div className="pr-8">
                <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold mb-2 ${
                  itemCategoryColor(selectedItem.category)
                }`}>
                  {selectedItem.category.toUpperCase()}
                </span>
                <h3 className="text-lg font-bold leading-snug line-clamp-2">{selectedItem.title}</h3>
              </div>
              <button onClick={closeModal} className="p-2 -mr-2 text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {analyzing ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-500 font-medium animate-pulse text-center">
                    AI가 내용을 분석 중입니다...
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-10 space-y-4">
                  <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-red-600">
                    <AlertCircle size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800">분석 실패</h4>
                  <p className="text-gray-600 text-sm px-4">{error}</p>
                </div>
              ) : analysisResult ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 text-blue-600">
                      <FileText size={20} />
                      <h4 className="font-bold text-lg">핵심 요약</h4>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line text-[15px]">
                      {analysisResult.summary}
                    </p>
                  </div>

                  {/* Insight */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 ring-1 ring-purple-100">
                    <div className="flex items-center gap-2 mb-3 text-purple-600">
                      <TrendingUp size={20} />
                      <h4 className="font-bold text-lg">실전 투자 팁</h4>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-[15px]">
                      {analysisResult.insight}
                    </p>
                  </div>

                  {/* Quiz */}
                  <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl shadow-sm border border-indigo-100">
                    <div className="flex items-center gap-2 mb-4 text-indigo-700">
                      <HelpCircle size={20} />
                      <h4 className="font-bold text-lg">실전 체크 퀴즈</h4>
                    </div>
                    <div className="mb-4 text-gray-800 font-medium text-lg">
                      Q. {analysisResult.quiz.question}
                    </div>
                    <div className="space-y-2.5">
                      {analysisResult.quiz.options.map((option, idx) => {
                        const isSelected = selectedQuizIndex === idx;
                        const isCorrect = idx === analysisResult.quiz.correct_index;
                        let btnClass = "w-full text-left p-4 rounded-xl border transition-all text-[15px] ";
                        
                        if (showExplanation) {
                          if (isCorrect) btnClass += "bg-green-100 border-green-300 text-green-800 font-semibold";
                          else if (isSelected) btnClass += "bg-red-50 border-red-200 text-red-700";
                          else btnClass += "bg-white border-gray-200 opacity-50";
                        } else {
                          btnClass += "bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.98]";
                        }

                        return (
                          <button key={idx} onClick={() => handleQuizSelect(idx)} disabled={showExplanation} className={btnClass}>
                            <div className="flex justify-between items-center">
                              <span>{option}</span>
                              {showExplanation && isCorrect && <CheckCircle2 size={18} className="text-green-600"/>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    {showExplanation && (
                      <div className={`mt-4 p-4 rounded-xl animate-in slide-in-from-top-2 border ${
                        selectedQuizIndex === analysisResult.quiz.correct_index 
                          ? "bg-green-50 border-green-200 text-green-800" 
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}>
                        <div className="font-bold text-lg mb-2 flex items-center gap-2">
                          {selectedQuizIndex === analysisResult.quiz.correct_index ? (
                            <> <Lightbulb size={22} className="text-green-600" /> <span>정답입니다!</span> </>
                          ) : (
                            <> <AlertCircle size={22} className="text-red-600" /> <span>아쉽네요, 오답입니다.</span> </>
                          )}
                        </div>
                        <div className="text-sm mt-1 text-gray-700 leading-relaxed">
                          <span className="font-bold mr-1 block mb-1">💡 해설 및 투자 팁:</span>
                          {analysisResult.quiz.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 pb-8 flex justify-center">
                     <a href={selectedItem.link} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1 underline decoration-gray-300">
                      원문 전체 읽기 <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ item, onClick }) {
  return (
    <div onClick={onClick} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]">
      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${itemCategoryColor(item.category)}`}>
          {item.category.toUpperCase()}
        </span>
        <span className="text-gray-400 text-xs">{item.date}</span>
      </div>
      <h3 className="text-gray-900 font-bold text-lg leading-snug mb-3 line-clamp-2">{item.title}</h3>
      <div className="flex items-center text-gray-400 text-sm gap-1 group">
        <span>분석 보기</span>
        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}

function itemCategoryColor(category) {
  if (category?.toLowerCase() === 'special') return "bg-purple-100 text-purple-700";
  return "bg-green-100 text-green-700";
}