import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import './PortfolioPage.css';

const PortfolioPage = () => {
  const { portfolio, addStock, removeStock, updateStock } = usePortfolio();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [formData, setFormData] = useState({
    symbol: '',
    quantity: '',
    purchasePrice: '',
    currentPrice: '',
    purchaseDate: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const stockData = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      purchasePrice: parseFloat(formData.purchasePrice),
      currentPrice: parseFloat(formData.currentPrice)
    };

    if (editingStock) {
      updateStock(editingStock.symbol, stockData);
      setEditingStock(null);
    } else {
      addStock(stockData);
    }

    setFormData({
      symbol: '',
      quantity: '',
      purchasePrice: '',
      currentPrice: '',
      purchaseDate: ''
    });
    setShowAddForm(false);
  };

  const handleEdit = (stock) => {
    setEditingStock(stock);
    setFormData({
      symbol: stock.symbol,
      quantity: stock.quantity.toString(),
      purchasePrice: stock.purchasePrice.toString(),
      currentPrice: stock.currentPrice.toString(),
      purchaseDate: stock.purchaseDate
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingStock(null);
    setFormData({
      symbol: '',
      quantity: '',
      purchasePrice: '',
      currentPrice: '',
      purchaseDate: ''
    });
  };

  // 포트폴리오 통계 계산
  const totalValue = portfolio.reduce((sum, stock) =>
    sum + (stock.currentPrice * stock.quantity), 0
  );

  const totalCost = portfolio.reduce((sum, stock) =>
    sum + (stock.purchasePrice * stock.quantity), 0
  );

  const totalReturn = totalValue - totalCost;
  const returnRate = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

  return (
    <Layout>
      <Layout.Content maxWidth="large">
        <Layout.Section
          title="포트폴리오 관리"
          subtitle="보유 종목을 추가하고 실시간으로 수익률을 추적하세요"
        >
          {/* Summary Stats */}
          <Layout.Grid columns={4} gap="medium">
            <Card hover={false} padding="medium">
              <div className="portfolio-stat">
                <div className="stat-label">총 평가액</div>
                <div className="stat-value">{totalValue.toLocaleString()}원</div>
              </div>
            </Card>

            <Card hover={false} padding="medium">
              <div className="portfolio-stat">
                <div className="stat-label">총 투자금</div>
                <div className="stat-value">{totalCost.toLocaleString()}원</div>
              </div>
            </Card>

            <Card hover={false} padding="medium">
              <div className="portfolio-stat">
                <div className="stat-label">평가 손익</div>
                <div className={`stat-value ${totalReturn >= 0 ? 'stat-positive' : 'stat-negative'}`}>
                  {totalReturn >= 0 ? '+' : ''}{totalReturn.toLocaleString()}원
                </div>
              </div>
            </Card>

            <Card hover={false} padding="medium">
              <div className="portfolio-stat">
                <div className="stat-label">수익률</div>
                <div className={`stat-value ${returnRate >= 0 ? 'stat-positive' : 'stat-negative'}`}>
                  {returnRate >= 0 ? '+' : ''}{returnRate.toFixed(2)}%
                </div>
              </div>
            </Card>
          </Layout.Grid>

          {/* Add Stock Button */}
          {!showAddForm && (
            <div className="add-stock-section">
              <Button
                variant="primary"
                size="large"
                onClick={() => setShowAddForm(true)}
                icon="➕"
              >
                종목 추가하기
              </Button>
            </div>
          )}

          {/* Add/Edit Stock Form */}
          {showAddForm && (
            <Card title={editingStock ? "종목 수정" : "새 종목 추가"} padding="large">
              <form onSubmit={handleSubmit} className="stock-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="symbol">종목 코드</label>
                    <input
                      type="text"
                      id="symbol"
                      name="symbol"
                      value={formData.symbol}
                      onChange={handleInputChange}
                      placeholder="예: AAPL"
                      required
                      disabled={!!editingStock}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="quantity">수량</label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="10"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="purchasePrice">매수 단가</label>
                    <input
                      type="number"
                      id="purchasePrice"
                      name="purchasePrice"
                      value={formData.purchasePrice}
                      onChange={handleInputChange}
                      placeholder="150000"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="currentPrice">현재 가격</label>
                    <input
                      type="number"
                      id="currentPrice"
                      name="currentPrice"
                      value={formData.currentPrice}
                      onChange={handleInputChange}
                      placeholder="155000"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="purchaseDate">매수일</label>
                    <input
                      type="date"
                      id="purchaseDate"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <Button type="submit" variant="primary">
                    {editingStock ? '수정하기' : '추가하기'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleCancel}>
                    취소
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Portfolio Table */}
          <Card title="보유 종목" padding="large">
            {portfolio.length > 0 ? (
              <div className="portfolio-table-wrapper">
                <table className="portfolio-table">
                  <thead>
                    <tr>
                      <th>종목 코드</th>
                      <th>수량</th>
                      <th>매수 단가</th>
                      <th>현재 가격</th>
                      <th>평가액</th>
                      <th>손익</th>
                      <th>수익률</th>
                      <th>매수일</th>
                      <th>액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map((stock, index) => {
                      const value = stock.currentPrice * stock.quantity;
                      const cost = stock.purchasePrice * stock.quantity;
                      const pl = value - cost;
                      const plRate = (pl / cost) * 100;

                      return (
                        <tr key={index}>
                          <td className="stock-symbol">{stock.symbol}</td>
                          <td>{stock.quantity}</td>
                          <td>{stock.purchasePrice.toLocaleString()}원</td>
                          <td>{stock.currentPrice.toLocaleString()}원</td>
                          <td className="value-cell">{value.toLocaleString()}원</td>
                          <td className={pl >= 0 ? 'stat-positive' : 'stat-negative'}>
                            {pl >= 0 ? '+' : ''}{pl.toLocaleString()}원
                          </td>
                          <td className={plRate >= 0 ? 'stat-positive' : 'stat-negative'}>
                            {plRate >= 0 ? '+' : ''}{plRate.toFixed(2)}%
                          </td>
                          <td>{stock.purchaseDate}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => handleEdit(stock)}
                                title="수정"
                              >
                                ✏️
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => removeStock(stock.symbol)}
                                title="삭제"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-portfolio">
                <div className="empty-icon">📊</div>
                <h3>아직 보유 종목이 없습니다</h3>
                <p>첫 번째 종목을 추가하여 포트폴리오를 시작하세요</p>
              </div>
            )}
          </Card>
        </Layout.Section>
      </Layout.Content>
    </Layout>
  );
};

export default PortfolioPage;
