import React, { useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import './SettingsPage.css';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    // Display Settings
    theme: 'light',
    language: 'ko',
    currency: 'KRW',

    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    priceAlerts: true,
    newsAlerts: false,

    // Portfolio Settings
    defaultView: 'grid',
    showPercentage: true,
    autoRefresh: true,
    refreshInterval: 60,

    // Privacy Settings
    dataSharing: false,
    analytics: true
  });

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelect = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Save settings to localStorage or backend
    localStorage.setItem('appSettings', JSON.stringify(settings));
    alert('설정이 저장되었습니다!');
  };

  const handleReset = () => {
    if (window.confirm('모든 설정을 초기화하시겠습니까?')) {
      localStorage.removeItem('appSettings');
      window.location.reload();
    }
  };

  return (
    <Layout>
      <Layout.Content maxWidth="large">
        <Layout.Section
          title="설정"
          subtitle="앱을 자신에게 맞게 커스터마이징하세요"
        >
          {/* Display Settings */}
          <Card title="화면 설정" padding="large">
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">테마</div>
                  <div className="setting-description">앱의 색상 테마를 변경합니다</div>
                </div>
                <div className="setting-control">
                  <select
                    value={settings.theme}
                    onChange={(e) => handleSelect('theme', e.target.value)}
                    className="setting-select"
                  >
                    <option value="light">라이트</option>
                    <option value="dark">다크</option>
                    <option value="auto">자동</option>
                  </select>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">언어</div>
                  <div className="setting-description">앱에서 사용할 언어를 선택합니다</div>
                </div>
                <div className="setting-control">
                  <select
                    value={settings.language}
                    onChange={(e) => handleSelect('language', e.target.value)}
                    className="setting-select"
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                  </select>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">통화</div>
                  <div className="setting-description">가격 표시 기본 통화</div>
                </div>
                <div className="setting-control">
                  <select
                    value={settings.currency}
                    onChange={(e) => handleSelect('currency', e.target.value)}
                    className="setting-select"
                  >
                    <option value="KRW">KRW (₩)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card title="알림 설정" padding="large">
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">이메일 알림</div>
                  <div className="setting-description">중요한 업데이트를 이메일로 받습니다</div>
                </div>
                <div className="setting-control">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={() => handleToggle('emailNotifications')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">푸시 알림</div>
                  <div className="setting-description">실시간 푸시 알림을 받습니다</div>
                </div>
                <div className="setting-control">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications}
                      onChange={() => handleToggle('pushNotifications')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">가격 알림</div>
                  <div className="setting-description">설정한 목표 가격 도달 시 알림</div>
                </div>
                <div className="setting-control">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.priceAlerts}
                      onChange={() => handleToggle('priceAlerts')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">뉴스 알림</div>
                  <div className="setting-description">중요 경제 뉴스 알림</div>
                </div>
                <div className="setting-control">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.newsAlerts}
                      onChange={() => handleToggle('newsAlerts')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Portfolio Settings */}
          <Card title="포트폴리오 설정" padding="large">
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">기본 보기</div>
                  <div className="setting-description">포트폴리오 기본 표시 형식</div>
                </div>
                <div className="setting-control">
                  <select
                    value={settings.defaultView}
                    onChange={(e) => handleSelect('defaultView', e.target.value)}
                    className="setting-select"
                  >
                    <option value="grid">그리드</option>
                    <option value="list">리스트</option>
                    <option value="table">테이블</option>
                  </select>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">수익률 표시</div>
                  <div className="setting-description">퍼센트로 수익률 표시</div>
                </div>
                <div className="setting-control">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.showPercentage}
                      onChange={() => handleToggle('showPercentage')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">자동 새로고침</div>
                  <div className="setting-description">가격 정보 자동 업데이트</div>
                </div>
                <div className="setting-control">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.autoRefresh}
                      onChange={() => handleToggle('autoRefresh')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {settings.autoRefresh && (
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">새로고침 간격</div>
                    <div className="setting-description">초 단위로 설정</div>
                  </div>
                  <div className="setting-control">
                    <select
                      value={settings.refreshInterval}
                      onChange={(e) => handleSelect('refreshInterval', parseInt(e.target.value))}
                      className="setting-select"
                    >
                      <option value="30">30초</option>
                      <option value="60">1분</option>
                      <option value="300">5분</option>
                      <option value="600">10분</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Privacy Settings */}
          <Card title="개인정보 및 보안" padding="large">
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">데이터 공유</div>
                  <div className="setting-description">익명 사용 데이터 공유</div>
                </div>
                <div className="setting-control">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.dataSharing}
                      onChange={() => handleToggle('dataSharing')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">분석 허용</div>
                  <div className="setting-description">앱 개선을 위한 분석 데이터 수집</div>
                </div>
                <div className="setting-control">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.analytics}
                      onChange={() => handleToggle('analytics')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* About */}
          <Card title="앱 정보" padding="large">
            <div className="about-section">
              <div className="about-item">
                <span className="about-label">버전</span>
                <span className="about-value">1.0.0</span>
              </div>
              <div className="about-item">
                <span className="about-label">마지막 업데이트</span>
                <span className="about-value">2026-01-13</span>
              </div>
              <div className="about-item">
                <span className="about-label">개발자</span>
                <span className="about-value">Stock Study Team</span>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="settings-actions">
            <Button variant="primary" size="large" onClick={handleSave}>
              설정 저장
            </Button>
            <Button variant="secondary" size="large" onClick={handleReset}>
              초기화
            </Button>
          </div>
        </Layout.Section>
      </Layout.Content>
    </Layout>
  );
};

export default SettingsPage;
