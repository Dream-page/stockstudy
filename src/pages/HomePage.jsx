import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { calculatePortfolioValue } from '../utils/calculations';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const { portfolio, settings } = state;
  const exchangeRate = settings.exchangeRate;

  // 포트폴리오 요약 계산
  const portfolioValue = calculatePortfolioValue(portfolio, exchangeRate);
  const totalValue = portfolioValue.totalKRW;

  // Calculate total investment
  const totalCost = portfolio.reduce((sum, item) => {
    const investment = item.avgPrice * item.quantity;
    if (item.currency === 'USD') {
      return sum + (investment * exchangeRate);
    }
    return sum + investment;
  }, 0);

  const totalReturn = totalValue - totalCost;
  const returnRate = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

  const quickActions = [
    { icon: '➕', label: '종목 추가', path: '/portfolio', color: '#667eea' },
    { icon: '📊', label: '차트 분석', path: '/macro', color: '#10b981' },
    { icon: '📚', label: '학습하기', path: '/learning', color: '#f59e0b' },
    { icon: '⚙️', label: '설정', path: '/settings', color: '#6b7280' }
  ];

  const recentActivities = [
    { type: '매수', stock: 'AAPL', date: '2026-01-10', amount: '+10주' },
    { type: '분석', stock: 'MSFT', date: '2026-01-09', amount: '차트 확인' },
    { type: '학습', stock: '가치투자', date: '2026-01-08', amount: '강의 완료' }
  ];

  return (
    <Layout>
      <Layout.Content maxWidth="large">
        {/* Welcome Section */}
        <div className="home-welcome">
          <h1 className="home-title">안녕하세요! 📈</h1>
          <p className="home-subtitle">오늘도 현명한 투자 결정을 함께 만들어가요</p>
        </div>

        {/* Portfolio Summary */}
        <Layout.Section title="포트폴리오 요약">
          <Layout.Grid columns={4} gap="medium">
            <Card hover={false} padding="medium">
              <div className="stat-card">
                <div className="stat-label">총 평가액</div>
                <div className="stat-value">
                  {totalValue.toLocaleString()}원
                </div>
              </div>
            </Card>

            <Card hover={false} padding="medium">
              <div className="stat-card">
                <div className="stat-label">총 투자금</div>
                <div className="stat-value">
                  {totalCost.toLocaleString()}원
                </div>
              </div>
            </Card>

            <Card hover={false} padding="medium">
              <div className="stat-card">
                <div className="stat-label">평가 손익</div>
                <div className={`stat-value ${totalReturn >= 0 ? 'stat-positive' : 'stat-negative'}`}>
                  {totalReturn >= 0 ? '+' : ''}{totalReturn.toLocaleString()}원
                </div>
              </div>
            </Card>

            <Card hover={false} padding="medium">
              <div className="stat-card">
                <div className="stat-label">수익률</div>
                <div className={`stat-value ${returnRate >= 0 ? 'stat-positive' : 'stat-negative'}`}>
                  {returnRate >= 0 ? '+' : ''}{returnRate.toFixed(2)}%
                </div>
              </div>
            </Card>
          </Layout.Grid>
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section title="빠른 액션">
          <div className="quick-actions">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                hover
                padding="medium"
                className="quick-action-card"
                onClick={() => navigate(action.path)}
              >
                <div className="quick-action" style={{ '--action-color': action.color }}>
                  <span className="quick-action-icon">{action.icon}</span>
                  <span className="quick-action-label">{action.label}</span>
                </div>
              </Card>
            ))}
          </div>
        </Layout.Section>

        <Layout.Grid columns={2} gap="medium">
          {/* Recent Activities */}
          <Card title="최근 활동" padding="medium">
            <div className="activity-list">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-type">{activity.type}</div>
                    <div className="activity-details">
                      <div className="activity-stock">{activity.stock}</div>
                      <div className="activity-amount">{activity.amount}</div>
                    </div>
                    <div className="activity-date">{activity.date}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>아직 활동 내역이 없습니다</p>
                </div>
              )}
            </div>
          </Card>

          {/* Top Holdings */}
          <Card title="주요 보유 종목" padding="medium">
            <div className="holdings-list">
              {portfolio.length > 0 ? (
                portfolio.slice(0, 5).map((stock, index) => {
                  const value = stock.currentPrice * stock.quantity;
                  const pl = ((stock.currentPrice - stock.avgPrice) / stock.avgPrice) * 100;

                  return (
                    <div key={index} className="holding-item">
                      <div className="holding-info">
                        <div className="holding-symbol">{stock.name}</div>
                        <div className="holding-shares">{stock.quantity}주</div>
                      </div>
                      <div className="holding-stats">
                        <div className="holding-value">{value.toLocaleString()}원</div>
                        <div className={`holding-pl ${pl >= 0 ? 'stat-positive' : 'stat-negative'}`}>
                          {pl >= 0 ? '+' : ''}{pl.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <p>보유 중인 종목이 없습니다</p>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => navigate('/portfolio')}
                  >
                    종목 추가하기
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </Layout.Grid>

        {/* Market Insights */}
        <Card title="시장 인사이트" subtitle="주요 경제 뉴스 및 트렌드" padding="large">
          <div className="insights">
            <div className="insight-item">
              <span className="insight-icon">📰</span>
              <div className="insight-content">
                <h4>미국 증시 상승세 지속</h4>
                <p>기술주 중심으로 강세를 보이며 S&P 500 지수 신고점 경신</p>
              </div>
            </div>
            <div className="insight-item">
              <span className="insight-icon">💹</span>
              <div className="insight-content">
                <h4>금리 인하 기대감</h4>
                <p>연준의 통화정책 완화 시그널에 시장 낙관론 확산</p>
              </div>
            </div>
            <div className="insight-item">
              <span className="insight-icon">🌐</span>
              <div className="insight-content">
                <h4>AI 섹터 주목</h4>
                <p>인공지능 관련 기업들의 실적 호조로 투자 관심 증가</p>
              </div>
            </div>
          </div>
        </Card>
      </Layout.Content>
    </Layout>
  );
};

export default HomePage;
