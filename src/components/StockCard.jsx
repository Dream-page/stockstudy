import React from 'react';
import { calculateProfitLoss, calculateTotalValue } from '../utils/calculations';
import { CURRENCIES, CATEGORY_LABELS } from '../utils/constants';
import './StockCard.css';

const StockCard = ({ stock, exchangeRate, onEdit, onDelete }) => {
  const { name, ticker, avgPrice, currentPrice, quantity, currency, category } = stock;

  // Calculate profit/loss
  const totalValue = calculateTotalValue(currentPrice, quantity);
  const { profitLoss, profitLossRate, isProfit } = calculateProfitLoss(avgPrice, currentPrice, quantity);

  // Format numbers
  const formatValue = (value) => {
    if (currency === CURRENCIES.KRW) {
      return Math.round(value).toLocaleString('ko-KR') + '원';
    } else {
      return '$' + value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  };

  // Format quantity - show decimal for US stocks if needed
  const formatQuantity = () => {
    if (quantity < 1) {
      return quantity.toFixed(6) + '주';
    }
    return quantity.toLocaleString('ko-KR') + '주';
  };

  // Format profit/loss
  const formatPL = () => {
    const sign = profitLoss > 0 ? '+' : '';
    if (currency === CURRENCIES.KRW) {
      return sign + Math.round(profitLoss).toLocaleString('ko-KR');
    } else {
      return sign + profitLoss.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  };

  const formatPLRate = () => {
    const sign = profitLossRate > 0 ? '+' : '';
    return `${sign}${profitLossRate.toFixed(2)}%`;
  };

  return (
    <div className="stock-card" onClick={() => onEdit && onEdit(stock)}>
      <div className="stock-card-header">
        <div className="stock-info">
          <div className="stock-name">{name}</div>
          <div className="stock-quantity">{formatQuantity()}</div>
        </div>
        <div className="stock-value">
          <div className="stock-value-amount">{formatValue(totalValue)}</div>
          <div className={`stock-pl ${isProfit ? 'profit' : 'loss'}`}>
            {formatPL()} ({formatPLRate()})
          </div>
        </div>
      </div>

      {category && (
        <div className="stock-footer">
          <span className="stock-category">{CATEGORY_LABELS[category]}</span>
        </div>
      )}
    </div>
  );
};

export default StockCard;
