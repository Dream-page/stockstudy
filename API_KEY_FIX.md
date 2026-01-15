# 🔑 API 키 문제 해결 가이드

## ❌ 현재 문제

```
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests,
limit: 0, model: gemini-2.0-flash
```

**"limit: 0"** 이 의미하는 것:
- API 키에 할당량이 전혀 없음
- 무료 티어가 제대로 활성화되지 않음
- API 키 설정에 문제가 있음

## ✅ 해결 방법

### 방법 1: 새로운 API 키 발급 (권장)

1. **기존 API 키 삭제**
   - [Google AI Studio](https://aistudio.google.com/app/apikey)에 접속
   - 기존 API 키 삭제

2. **새 API 키 생성**
   - "Create API Key" 클릭
   - **새로운 프로젝트** 또는 **기존 Google Cloud 프로젝트** 선택
   - API 키 복사

3. **`.env` 파일 업데이트**
   ```bash
   VITE_GEMINI_API_KEY=새로_발급받은_API_키
   ```

4. **개발 서버 재시작**
   ```bash
   # Ctrl+C로 서버 종료 후
   npm run dev
   ```

### 방법 2: Google Cloud 프로젝트 확인

API 키가 Google Cloud 프로젝트와 연결되어 있는 경우:

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. "APIs & Services" > "Enabled APIs" 확인
3. "Generative Language API" 활성화 확인
4. 청구(Billing) 계정 연결 확인 (무료 티어도 연결 필요할 수 있음)

### 방법 3: 다른 모델 시도 (임시 해결)

Gemini 2.0 Flash 대신 다른 모델 시도:
- `gemini-1.5-pro` (더 강력하지만 느림)
- `gemini-1.5-flash` (구버전이지만 작동할 수 있음)

## 🔍 문제 진단

현재 발급받은 API 키의 상태:
```
API Key: AIzaSyAhSg... (앞 10자리)
Status: limit: 0 (할당량 없음)
Issue: Free tier not activated
```

## 💡 추천 조치

**가장 확실한 방법:**
1. Google AI Studio에서 **완전히 새로운 API 키** 발급
2. 발급 시 "Free tier" 옵션 확인
3. 새 키로 `.env` 파일 업데이트
4. 서버 재시작

이렇게 하면 99% 해결됩니다!

## 📞 여전히 안 되는 경우

Google AI Studio에서:
- API 키의 할당량 확인
- 사용량 모니터링 페이지 확인
- API 키의 제한 설정 확인

또는 다른 Google 계정으로 새로 시도해보세요.
