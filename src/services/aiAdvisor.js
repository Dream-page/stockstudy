/**
 * AI Investment Advisor Service
 * Mode: ROBUST (Crash Prevention + Gemini 2.0 First)
 */

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// 🚀 모델 전략 수정:
// 1. 아까 '존재는 확인된' 2.0 모델을 1순위로 씁니다. (새 키면 429 안 뜰 확률 높음)
// 2. 1.5 모델을 2순위로 둡니다.
const MODEL_PRIORITY = [
  'gemini-2.0-flash-exp', 
  'gemini-1.5-flash',
  'gemini-pro'
];

const getAPIKey = () => import.meta.env.VITE_GEMINI_API_KEY;

/**
 * 🛡️ 안전 API 호출 (에러 나면 null 반환)
 */
const callGeminiAPI = async (prompt) => {
  const apiKey = getAPIKey();
  
  if (!apiKey) {
    console.error("API Key missing!");
    return null;
  }

  for (const modelName of MODEL_PRIORITY) {
    try {
      console.log(`🤖 Trying ${modelName}...`);
      const response = await fetch(`${GEMINI_API_BASE_URL}/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      });

      if (!response.ok) {
        console.warn(`❌ ${modelName} Error: ${response.status}`);
        continue; // 다음 모델 시도
      }

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        console.log(`✅ Success: ${modelName}`);
        return data.candidates[0].content.parts[0].text;
      }
    } catch (e) {
      console.error(`⚠️ Exception in ${modelName}:`, e);
    }
  }
  
  return null; // 모든 시도 실패 시 null (앱 멈춤 방지용)
};

// -----------------------------------------------------------
// 🛡️ 안전장치가 추가된 분석 함수들
// -----------------------------------------------------------

// 1. Top 3 선정
export const selectTop3Reports = async (reports) => {
  if (!reports || reports.length === 0) return [];
  
  // 기본값 (AI 실패 시 보여줄 내용)
  const defaultSelection = reports.slice(0, 3).map(r => ({ ...r, selectionReason: "AI 연결 지연으로 자동 선정되었습니다." }));

  try {
    const list = reports.map((r, i) => `${i}. ${r.title}`).join('\n');
    const prompt = `중요한 리포트 3개의 인덱스 번호만 JSON 배열로 반환해 (예: [0, 2, 5]).\n${list}`;
    
    const text = await callGeminiAPI(prompt);
    
    // 🚨 여기서 null 체크! (이게 없어서 아까 뻗은 것)
    if (!text) return defaultSelection;

    const match = text.match(/\[.*\]/s);
    if (!match) return defaultSelection;

    const indices = JSON.parse(match[0]);
    return indices.map(i => reports[i]).filter(Boolean);
  } catch (e) {
    console.error("Top 3 Error:", e);
    return defaultSelection;
  }
};

// 2. 네이버/PDF 요약 공통 함수
export const analyzeMarketReport = async (title, text, portfolio) => {
  // 기본값 (실패 시)
  const fallback = {
    summary: "AI 서버 연결이 원활하지 않습니다. 원문을 직접 확인해주세요.",
    portfolioImpact: "분석 불가",
    quiz: { 
      type: "multiple_choice",
      question: "현재 상태는?", 
      options: ["분석 성공", "분석 실패", "대기 중", "알 수 없음"], 
      answer: "분석 실패", 
      explanation: "잠시 후 다시 시도해주세요." 
    }
  };

  try {
    if (!text || text.length < 50) return fallback;

    const prompt = `
제목: ${title}
내용: ${text.substring(0, 15000)}

JSON 작성:
{
  "summary": "3줄 요약",
  "portfolioImpact": "투자 영향",
  "quiz": { "type":"multiple_choice", "question":"퀴즈", "options":["A","B","C","D"], "answer":"정답", "explanation":"해설" }
}
`;
    const responseText = await callGeminiAPI(prompt);
    
    // 🚨 안전장치
    if (!responseText) return fallback;

    const jsonText = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonText);

  } catch (e) {
    console.error("Analysis Error:", e);
    return fallback;
  }
};

// 3. 스페셜 리포트 (호환성 유지)
export const analyzeSpecialReport = async (title, pdfText, portfolio) => {
  const result = await analyzeMarketReport(title, pdfText, portfolio);
  // PDF용 필드 추가 보정
  return {
    ...result,
    keyPoints: [result.summary],
    riskFactor: "-",
    actionableInsight: "-",
  };
};

// 4. 종목 리포트 전용 분석 (페르소나 강화 버전)
export const analyzeCompanyReport = async (title, articleText, portfolio) => {
  // 기본값 (실패 시)
  const fallback = {
    stockName: "정보 없음",
    rating: "분석 불가",
    targetPrice: "-",
    summary: "AI 서버 연결이 원활하지 않습니다. 원문을 직접 확인해주세요.",
    insight: "리포트 원문을 참고해 판단해주세요.",
    keyRisks: "정보 없음"
  };

  try {
    if (!articleText || articleText.length < 50) return fallback;

    const prompt = `
# 🎯 당신의 역할
당신은 **대한민국 주식 시장 최고의 애널리스트**입니다.
효린님을 위해 네이버 금융의 '종목분석' 리포트를 정밀 분석합니다.

# 📄 분석 대상
**리포트 제목**: ${title}
**리포트 본문 (상단 5000자)**:
${articleText.substring(0, 5000)}

# 🔍 분석 미션
네이버 금융 리포트는 상단에 핵심 정보가 집중되어 있습니다:
- **종목명**: 제목 또는 본문 상단에서 '현대차', '삼성전자' 같은 기업명 추출
- **투자의견**: 'Buy(매수)', 'Hold(중립)', 'Sell(매도)' 또는 '목표가 상향/하향' 키워드 확인
- **목표주가**: '목표가:', 'TP:', 'Target' 옆의 숫자 (쉼표 포함, 예: "85,000원")
- **핵심 근거**: 리포트의 투자 판단 이유 (실적, 사업 전망, 밸류에이션 등)
- **리스크**: 주의할 점이나 하방 요인

# 💡 효린님 포트폴리오 맞춤 분석
효린님은 현재 다음 종목들을 보유 중입니다:
${portfolio && portfolio.length > 0 ? portfolio.map(p => p.name).join(', ') : '정보 없음'}

**임무**: 이 리포트가 효린님의 포트폴리오에 미치는 영향을 구체적으로 설명하세요.
- 보유 종목과 관련이 있다면: "효린님이 보유한 XXX 종목에 대한 분석으로..."
- 산업 전반에 영향이 있다면: "XXX 산업 전망이 개선되어 효린님의 YYY 종목도..."
- 무관하다면: "새로운 투자 기회로, ZZZ 섹터 진입을 고려할 수 있습니다"

# 📋 출력 형식 (반드시 JSON)
{
  "stockName": "기업명 (예: 현대차, 삼성전자)",
  "rating": "매수 또는 홀딩 또는 매도",
  "targetPrice": "목표주가 (예: 85,000원) 또는 -",
  "summary": "리포트 핵심 근거를 3줄로 요약. 각 줄은 마침표로 끝나야 함.",
  "insight": "효린님 포트폴리오 관점의 시사점 (2-3문장, 구체적으로)",
  "keyRisks": "주의할 리스크 요인 (1-2문장)"
}

**중요**: JSON 형식만 출력하세요. 설명이나 추가 텍스트는 금지입니다.
`;

    const responseText = await callGeminiAPI(prompt);

    if (!responseText) return fallback;

    const jsonText = responseText.replace(/```json|```/g, '').trim();
    const result = JSON.parse(jsonText);

    // 기본값으로 필드 보완
    return {
      stockName: result.stockName || "정보 없음",
      rating: result.rating || "분석 불가",
      targetPrice: result.targetPrice || "-",
      summary: result.summary || "요약 정보를 추출할 수 없습니다.",
      insight: result.insight || "포트폴리오 영향 분석이 불가능합니다.",
      keyRisks: result.keyRisks || "정보 없음"
    };

  } catch (e) {
    console.error("Company Report Analysis Error:", e);
    return fallback;
  }
};

// 5. 시황 리포트 종합 분석 (여러 제목을 한번에)
export const analyzeMarketInfoBatch = async (reportTitles) => {
  const fallback = {
    summary: "AI 서버 연결이 원활하지 않습니다.",
    keyIndicators: ["분석 오류"],
    strategy: "원문 리포트를 직접 확인해주세요."
  };

  try {
    const titlesList = reportTitles.map((title, idx) => `${idx + 1}. ${title}`).join('\n');

    const prompt = `
# 🎯 당신의 역할
당신은 **대한민국 증권 시장의 시황 분석 전문가**입니다.

# 📊 오늘의 시황 리포트 제목들
${titlesList}

# 🔍 분석 미션
위 리포트 제목들을 종합하여 오늘 시장의 **핵심 메시지**를 추출하세요.

1. **시장 분위기**: 제목에서 드러나는 시장 심리와 주요 이슈를 3-4문장으로 요약
2. **핵심 키워드**: 가장 중요한 이슈/지표 2-3개 (예: 금리, 환율, 특정 섹터)
3. **투자자 전략**: 오늘 시황을 고려한 실전 대응법 (2-3문장, 구체적으로)

# 📋 출력 형식 (JSON)
{
  "summary": "시장 분위기 종합 요약 (3-4문장, 마침표로 문장 구분)",
  "keyIndicators": ["키워드1", "키워드2", "키워드3"],
  "strategy": "투자자 대응 전략 (2-3문장, 구체적 행동 제시)"
}
`;

    const responseText = await callGeminiAPI(prompt);
    if (!responseText) return fallback;

    const jsonText = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonText);

  } catch (e) {
    console.error("Market Info Batch Analysis Error:", e);
    return fallback;
  }
};

// 6. 투자 조언
export const generateInvestmentAdvice = async (portfolio, reports) => {
  const prompt = `포트폴리오: ${JSON.stringify(portfolio)}\n리포트: ${JSON.stringify(reports.slice(0,3))}\n투자 조언(마크다운):`;
  const text = await callGeminiAPI(prompt);
  return text || "AI 연결 상태가 좋지 않아 조언을 불러올 수 없습니다.";
};

export const generateStudyContent = async (r, p) => analyzeMarketReport(r.title, "내용", p);
export const analyzeMarketSentiment = async () => ({ sentiment: "중립", summary: "데이터 없음", keywords: [] });

export default {
  generateInvestmentAdvice,
  selectTop3Reports,
  analyzeSpecialReport,
  analyzeMarketReport,
  analyzeCompanyReport,
  analyzeMarketInfoBatch,
  generateStudyContent,
  analyzeMarketSentiment
};