import React, { useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import './MacroPage.css';

const MacroPage = () => {
  const [selectedRegion, setSelectedRegion] = useState('US');

  // 주요 경제 지표 데이터 (실제로는 API에서 가져옴)
  const indicators = {
    US: [
      { name: 'GDP 성장률', value: '2.8%', change: '+0.3%', trend: 'up', icon: '📊' },
      { name: '실업률', value: '3.7%', change: '-0.1%', trend: 'down', icon: '👥' },
      { name: '인플레이션', value: '3.2%', change: '+0.2%', trend: 'up', icon: '💵' },
      { name: '기준금리', value: '5.50%', change: '0.0%', trend: 'stable', icon: '💰' }
    ],
    KR: [
      { name: 'GDP 성장률', value: '1.4%', change: '+0.1%', trend: 'up', icon: '📊' },
      { name: '실업률', value: '2.6%', change: '0.0%', trend: 'stable', icon: '👥' },
      { name: '인플레이션', value: '2.8%', change: '-0.3%', trend: 'down', icon: '💵' },
      { name: '기준금리', value: '3.50%', change: '0.0%', trend: 'stable', icon: '💰' }
    ]
  };

  const marketIndices = [
    { name: 'S&P 500', value: '4,783.45', change: '+1.24%', trend: 'up' },
    { name: 'NASDAQ', value: '15,011.35', change: '+1.68%', trend: 'up' },
    { name: 'KOSPI', value: '2,655.27', change: '+0.83%', trend: 'up' },
    { name: 'KOSDAQ', value: '875.64', change: '+1.12%', trend: 'up' }
  ];

  const economicNews = [
    {
      title: '미 연준, 금리 동결 결정',
      summary: '연방준비제도가 기준금리를 5.50%로 유지하기로 결정. 인플레이션 추이를 지켜보겠다는 입장 밝혀',
      date: '2026-01-10',
      category: '통화정책'
    },
    {
      title: 'GDP 성장률 예상치 상회',
      summary: '4분기 GDP 성장률이 예상치를 웃돌며 경기 회복세 지속',
      date: '2026-01-09',
      category: '경제지표'
    },
    {
      title: '고용시장 견조한 흐름 유지',
      summary: '신규 일자리 창출이 예상치를 상회하며 노동시장 안정세',
      date: '2026-01-08',
      category: '고용'
    }
  ];

  const commodities = [
    { name: '원유 (WTI)', value: '$72.45', change: '+2.1%', icon: '🛢️' },
    { name: '금', value: '$2,058.30', change: '+0.8%', icon: '🥇' },
    { name: '은', value: '$23.45', change: '+1.2%', icon: '🥈' },
    { name: '구리', value: '$3.82', change: '-0.5%', icon: '🔶' }
  ];

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  };

  const getTrendClass = (trend) => {
    if (trend === 'up') return 'trend-up';
    if (trend === 'down') return 'trend-down';
    return 'trend-stable';
  };

  return (
    <Layout>
      <Layout.Content maxWidth="large">
        <Layout.Section
          title="거시경제 지표"
          subtitle="주요 경제 지표와 시장 동향을 한눈에 확인하세요"
        >
          {/* Region Selector */}
          <div className="region-selector">
            <Button
              variant={selectedRegion === 'US' ? 'primary' : 'outline'}
              onClick={() => setSelectedRegion('US')}
            >
              🇺🇸 미국
            </Button>
            <Button
              variant={selectedRegion === 'KR' ? 'primary' : 'outline'}
              onClick={() => setSelectedRegion('KR')}
            >
              🇰🇷 한국
            </Button>
          </div>

          {/* Economic Indicators */}
          <Layout.Grid columns={4} gap="medium">
            {indicators[selectedRegion].map((indicator, index) => (
              <Card key={index} hover padding="medium">
                <div className="indicator-card">
                  <div className="indicator-icon">{indicator.icon}</div>
                  <div className="indicator-name">{indicator.name}</div>
                  <div className="indicator-value">{indicator.value}</div>
                  <div className={`indicator-change ${getTrendClass(indicator.trend)}`}>
                    {getTrendIcon(indicator.trend)} {indicator.change}
                  </div>
                </div>
              </Card>
            ))}
          </Layout.Grid>

          {/* Market Indices */}
          <Card title="주요 지수" padding="large">
            <div className="indices-grid">
              {marketIndices.map((index, i) => (
                <div key={i} className="index-item">
                  <div className="index-name">{index.name}</div>
                  <div className="index-value">{index.value}</div>
                  <div className={`index-change ${getTrendClass(index.trend)}`}>
                    {index.change}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Layout.Grid columns={2} gap="medium">
            {/* Economic News */}
            <Card title="경제 뉴스" padding="large">
              <div className="news-list">
                {economicNews.map((news, index) => (
                  <div key={index} className="news-item">
                    <div className="news-header">
                      <span className="news-category">{news.category}</span>
                      <span className="news-date">{news.date}</span>
                    </div>
                    <h4 className="news-title">{news.title}</h4>
                    <p className="news-summary">{news.summary}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Commodities */}
            <Card title="원자재 시장" padding="large">
              <div className="commodities-list">
                {commodities.map((commodity, index) => (
                  <div key={index} className="commodity-item">
                    <div className="commodity-info">
                      <span className="commodity-icon">{commodity.icon}</span>
                      <span className="commodity-name">{commodity.name}</span>
                    </div>
                    <div className="commodity-stats">
                      <div className="commodity-value">{commodity.value}</div>
                      <div className={`commodity-change ${
                        commodity.change.startsWith('+') ? 'trend-up' : 'trend-down'
                      }`}>
                        {commodity.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Layout.Grid>

          {/* Economic Calendar */}
          <Card title="경제 캘린더" subtitle="이번 주 주요 일정" padding="large">
            <div className="calendar-list">
              <div className="calendar-item">
                <div className="calendar-date">
                  <div className="calendar-day">15</div>
                  <div className="calendar-month">1월</div>
                </div>
                <div className="calendar-content">
                  <h4>미국 소비자물가지수 (CPI) 발표</h4>
                  <p>예상: 3.2% | 이전: 3.1%</p>
                </div>
                <div className="calendar-importance high">높음</div>
              </div>

              <div className="calendar-item">
                <div className="calendar-date">
                  <div className="calendar-day">17</div>
                  <div className="calendar-month">1월</div>
                </div>
                <div className="calendar-content">
                  <h4>미국 소매판매 발표</h4>
                  <p>예상: 0.5% | 이전: 0.3%</p>
                </div>
                <div className="calendar-importance medium">중간</div>
              </div>

              <div className="calendar-item">
                <div className="calendar-date">
                  <div className="calendar-day">18</div>
                  <div className="calendar-month">1월</div>
                </div>
                <div className="calendar-content">
                  <h4>한국은행 금통위 회의</h4>
                  <p>기준금리 결정</p>
                </div>
                <div className="calendar-importance high">높음</div>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout.Content>
    </Layout>
  );
};

export default MacroPage;
