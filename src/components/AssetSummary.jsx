import React from 'react';
import { useApp } from '../context/AppContext';
import { calculatePortfolioValue } from '../utils/calculations';
import './AssetSummary.css';

const AssetSummary = () => {
  const { state } = useApp();
  const { portfolio, settings } = state;
  const exchangeRate = settings.exchangeRate;

  // Calculate portfolio values
  const portfolioValue = calculatePortfolioValue(portfolio, exchangeRate);

  // Format numbers in Korean style
  const formatKRW = (value) => {
    return Math.round(value).toLocaleString('ko-KR') + '원';
  };

  const formatUSD = (value) => {
    return '$' + value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Calculate profit/loss
  const totalInvestment = calculateTotalInvestment(portfolio, exchangeRate);
  const totalPL = portfolioValue.totalKRW - totalInvestment;
  const totalPLRate = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0;

  return (
    <div className="asset-summary">
      <div className="asset-summary-header">
        <h2>내 계좌보기</h2>
        <span className="update-time">22:08 기준</span>
      </div>

      <div className="asset-cards">
        <div className="asset-card">
          <div className="asset-label">원화</div>
          <div className="asset-value">{formatKRW(portfolioValue.krStocksValue)}</div>
        </div>

        <div className="asset-card">
          <div className="asset-label">달러</div>
          <div className="asset-value">{formatUSD(portfolioValue.totalUSD)}</div>
        </div>
      </div>

      <div className="total-assets">
        <div className="total-label">내 종목보기</div>
        <div className="total-value">{formatKRW(portfolioValue.totalKRW)}</div>
        {totalInvestment > 0 && (
          <div className={`total-change ${totalPL >= 0 ? 'positive' : 'negative'}`}>
            {totalPL >= 0 ? '+' : ''}{formatKRW(totalPL)} ({totalPL >= 0 ? '+' : ''}{totalPLRate.toFixed(2)}%)
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to calculate total investment
const calculateTotalInvestment = (portfolio, exchangeRate) => {
  return portfolio.reduce((sum, item) => {
    const investment = item.avgPrice * item.quantity;
    if (item.currency === 'USD') {
      return sum + (investment * exchangeRate);
    }
    return sum + investment;
  }, 0);
};

export default AssetSummary;
