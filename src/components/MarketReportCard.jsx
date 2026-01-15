import React from 'react';
import { ExternalLink, Eye } from 'lucide-react';
import { formatReportDate, getFirmColor } from '../services/naverFinanceService';
import './MarketReportCard.css';

const MarketReportCard = ({ report }) => {
  const { title, firm, date, views, url } = report;

  const handleClick = () => {
    if (url && url.trim() !== '') {
      console.log('✓ Opening report:', title.substring(0, 40) + '...');
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      console.warn('✗ No URL for report:', title);
      alert('이 리포트는 링크가 없습니다.');
    }
  };

  const firmColor = getFirmColor(firm);
  const hasUrl = url && url.trim() !== '';

  return (
    <div
      className="market-report-card"
      onClick={handleClick}
      style={{ cursor: hasUrl ? 'pointer' : 'default', opacity: hasUrl ? 1 : 0.7 }}
    >
      <div className="report-header">
        <span className="report-date">{formatReportDate(date)}</span>
        <span
          className="report-firm"
          style={{ backgroundColor: `${firmColor}20`, color: firmColor }}
        >
          {firm}
        </span>
      </div>

      <h3 className="report-title">
        {title}
        <ExternalLink size={16} className="external-icon" />
      </h3>

      <div className="report-footer">
        <div className="report-views">
          <Eye size={14} />
          <span>{views}</span>
        </div>
      </div>
    </div>
  );
};

export default MarketReportCard;
