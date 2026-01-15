/**
 * Oversold Stock Analyzer Service
 * AI-powered cross-validation analysis of oversold stocks
 */

// Direct REST API approach using Gemini 2.5 Flash
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

const getAPIKey = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not set in environment variables');
  }

  return apiKey;
};

/**
 * Call Gemini API directly using REST
 */
const callGeminiAPI = async (prompt) => {
  const apiKey = getAPIKey();
  const url = `${GEMINI_API_URL}?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 64,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle rate limit (429) error
    if (response.status === 429) {
      const retryMatch = errorData.error?.message?.match(/retry in ([\d.]+)s/);
      if (retryMatch) {
        const seconds = Math.ceil(parseFloat(retryMatch[1]));
        throw new Error(
          `API 요청 제한에 도달했습니다. ${seconds}초 후에 다시 시도해주세요. ⏱️`
        );
      }
      throw new Error('API 요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요.');
    }

    throw new Error(
      `Gemini API error (${response.status}): ${errorData.error?.message || response.statusText}`
    );
  }

  const data = await response.json();

  if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
};

/**
 * Analyze oversold stocks with 3-way cross-validation
 * @param {Object} params - Analysis parameters
 * @param {Array} params.portfolio - User's portfolio
 * @param {string} params.oversoldText - Expert's oversold analysis text
 * @param {Array} params.dailyReports - Today's market reports
 * @param {Array} params.macroIndicators - Macro economic indicators
 * @returns {Promise<string>} AI-generated analysis
 */
export const analyzeOversoldStocks = async ({ portfolio, oversoldText, dailyReports, macroIndicators }) => {
  try {
    console.log('🔍 Starting oversold stock analysis...');

    // Prepare portfolio summary
    const portfolioSummary = portfolio.map(stock => ({
      name: stock.name,
      ticker: stock.ticker || stock.name,
      quantity: stock.quantity,
      avgPrice: stock.avgPrice,
      currentPrice: stock.currentPrice,
      profitLoss: ((stock.currentPrice - stock.avgPrice) / stock.avgPrice * 100).toFixed(2),
      country: stock.country
    }));

    // Prepare report titles (top 10 for sector sentiment)
    const reportTitles = dailyReports.slice(0, 10).map(r => `[${r.firm}] ${r.title}`);

    // Prepare macro indicators
    const macroSummary = macroIndicators.length > 0
      ? macroIndicators.map(m => `${m.name}: ${m.value} (${m.judgment})`).join('\n')
      : '데이터 없음';

    // Create prompt with 3-way cross-validation logic
    const prompt = `
# 🎯 당신의 역할
당신은 **리스크 관리를 최우선으로 하는 펀드 매니저**입니다. "과매도니까 매수하세요"라는 1차원적 조언은 절대 금지입니다.

# 🚨 절대 금지 사항
❌ "과매도 리스트에 있으니 매수 기회입니다" → 금지
❌ "저평가되어 있으니 진입하세요" → 금지
✅ **3중 교차 검증을 통해 '기회'와 '함정'을 명확히 구분**하는 것이 임무

# 📊 분석 방법 (3중 교차 검증)

## 1단계: 전문가 의견 분석
- 과매도 텍스트에서 **하락 사유**를 파악
- "일시적 수급" vs "펀더멘탈 훼손" 구분
- 예시:
  - ✅ 일시적: "매크로 우려로 과도한 매도", "차익 실현 매물"
  - ⛔ 구조적: "실적 악화", "시장 점유율 하락", "규제 리스크"

## 2단계: 섹터 분위기 확인
- 오늘의 증권사 리포트에서 **해당 종목의 섹터** 분위기 파악
- 예시:
  - 과매도 종목이 "반도체"인데, 오늘 리포트에 "반도체 수요 증가" → ✅ 긍정
  - 과매도 종목이 "전기차"인데, 오늘 리포트에 "전기차 수요 둔화" → ⛔ 부정

## 3단계: 시장 타이밍 판단
- 거시지표(VIX, 환율, 금리)로 **지금이 진입 적기인지** 판단
- 예시:
  - VIX 15 이하 + 환율 안정 → ✅ 진입 적기
  - VIX 20 이상 + 변동성 증가 → ⛔ 진입 보류

# 📊 입력 데이터

## 효린님의 포트폴리오
${JSON.stringify(portfolioSummary, null, 2)}

## 전문가 과매도 분석 (입력 텍스트)
${oversoldText}

## 오늘의 증권사 리포트 (섹터 분위기 파악용)
${reportTitles.join('\n')}

## 거시경제 지표
${macroSummary}

---

# 📋 분석 요청 (아래 형식 필수)

## ⚖️ 과매도 종목 교차 검증 보고서

### 💎 기회 포착 (매수 고려)
(3중 검증을 모두 통과한 종목만 여기에 포함)

**각 종목마다 아래 형식으로 작성:**
- **종목명 / 현재가**
  - **✅ 긍정 근거 (3중 검증)**:
    1. **전문가 의견**: (일시적 수급 요인, 펀더멘탈 건전)
    2. **섹터 분위기**: (오늘 리포트에서 해당 섹터 긍정적 언급)
    3. **시장 타이밍**: (VIX 안정, 변동성 낮음)
  - **전략**: [분할 진입 / 소액 정찰병 / 비중 X%]
  - **주의사항**: (그래도 조심해야 할 점)

**예시:**
- **엔비디아 / $120**
  - **✅ 긍정 근거**:
    1. **전문가 의견**: "AI 칩 수요는 견조, 단기 차익 실현 매물로 하락"
    2. **섹터 분위기**: [IBKS Daily]에서 "AI 반도체 수요 증가" 언급
    3. **시장 타이밍**: VIX 14로 안정권, 나스닥 상승 추세
  - **전략**: 분할 진입 (전체 자산의 3-5%), 추가 하락 시 물타기 고려
  - **주의사항**: 단기 변동성 있을 수 있음, 손절 라인 -10% 설정

---

### ⚠️ 함정 주의 (매수 보류)
(3중 검증 중 하나라도 부정적이면 여기에 포함)

**각 종목마다 아래 형식으로 작성:**
- **종목명 / 현재가**
  - **⛔ 리스크 요인 (교차 검증 결과)**:
    1. **전문가 의견**: (과매도라고 하지만...)
    2. **섹터 분위기**: (오늘 리포트에서 해당 섹터 부정적 또는 언급 없음)
    3. **시장 타이밍**: (VIX 높거나 변동성 증가)
  - **판단**: 진입 금지 / 추가 하락 가능성 / 관망 후 재평가
  - **대안**: (다른 종목 추천 또는 현금 보유)

**예시:**
- **테슬라 / $180**
  - **⛔ 리스크 요인**:
    1. **전문가 의견**: "과매도라고 하지만 실적 악화 우려 지속"
    2. **섹터 분위기**: 오늘 리포트에 전기차 관련 언급 없음, 업황 불투명
    3. **시장 타이밍**: VIX 18로 보통 수준이나, 섹터 펀더멘털 약화
  - **판단**: 진입 금지, 추가 하락 가능성 높음
  - **대안**: 같은 성장주보다 반도체 섹터 고려

---

### 💼 내 포트폴리오 대응
(내 보유 종목이 과매도 리스트에 있다면 물타기 여부 판단)

**보유 중인 종목이 과매도 리스트에 있는 경우:**
- **종목명 (현재 손익률%)**
  - **3중 검증 결과**: (긍정 / 부정)
  - **대응 전략**:
    - ✅ 긍정: 물타기 고려 (분할 매수)
    - ⛔ 부정: 추가 매수 금지, 손절 라인 점검
  - **구체적 액션**: (매수 비중 / 관망 / 손절 등)

**보유 종목이 리스트에 없는 경우:**
- 현재 포트폴리오 유지, 과매도 리스트는 참고만

---

## 🎯 최종 액션 플랜

### ✅ 진입 추천 (우선순위)
1. **종목명**: (이유 요약)
2. **종목명**: (이유 요약)

### ⛔ 진입 금지
1. **종목명**: (이유 요약)
2. **종목명**: (이유 요약)

### 💰 현금 배분 전략
- 추천 진입 비중: 전체 자산의 X%
- 나머지 현금 보유: Y% (변동성 대비)

---

**⚡ 중요**:
- "과매도"라는 단어에 현혹되지 말고, **3중 교차 검증으로 냉정하게 판단**
- 전문가 의견 + 섹터 분위기 + 시장 타이밍이 **모두 긍정적일 때만 기회**
- 하나라도 부정적이면 **함정으로 분류**
- 투자자가 바로 실행할 수 있는 구체적인 액션 제공
`;

    const analysis = await callGeminiAPI(prompt);

    console.log('✅ Oversold analysis generated successfully');

    return analysis;

  } catch (error) {
    console.error('❌ Error analyzing oversold stocks:', error);

    if (error.message.includes('API_KEY')) {
      throw new Error('Gemini API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
    }

    throw new Error('AI 분석 중 오류가 발생했습니다: ' + error.message);
  }
};

export default {
  analyzeOversoldStocks
};
