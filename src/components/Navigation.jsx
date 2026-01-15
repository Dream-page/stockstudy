import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      label: '홈',
      icon: '🏠',
      description: '대시보드'
    },
    {
      path: '/portfolio',
      label: '포트폴리오',
      icon: '💼',
      description: '내 투자 현황'
    },
    {
      path: '/macro',
      label: '거시경제',
      icon: '🌍',
      description: '경제 지표'
    },
    {
      path: '/daily-study',
      label: '일일퀘스트',
      icon: '🎯',
      description: 'AI가 엄선한 오늘의 학습'
    },
    {
      path: '/learning',
      label: '학습',
      icon: '📚',
      description: '투자 공부'
    },
    {
      path: '/weekly',
      label: '주간분석',
      icon: '📊',
      description: '과매도 분석'
    },
    {
      path: '/settings',
      label: '설정',
      icon: '⚙️',
      description: '환경 설정'
    }
  ];

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <span className="nav-brand-icon">📈</span>
          <span className="nav-brand-text">Stock Study</span>
        </div>
        <ul className="nav-menu">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'nav-link-active' : ''}`}
                title={item.description}
              >
                <span className="nav-link-icon">{item.icon}</span>
                <span className="nav-link-text">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
