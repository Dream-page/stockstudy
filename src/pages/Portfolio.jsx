import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { COUNTRIES, CURRENCIES } from '../utils/constants';
import { Plus, RefreshCw } from 'lucide-react';
import { fetchGoogleSheetData, updatePortfolioWithSheetData } from '../services/googleSheetService';
import AssetSummary from '../components/AssetSummary';
import StockCard from '../components/StockCard';
import AddStockModal from '../components/AddStockModal';
import './Portfolio.css';

const Portfolio = () => {
  const { state, dispatch } = useApp();
  const { portfolio, settings } = state;
  const exchangeRate = settings.exchangeRate;

  const [activeTab, setActiveTab] = useState('KR');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter stocks by country
  const filteredStocks = portfolio.filter(stock => stock.country === activeTab);

  // Sort by creation date (most recent first)
  const sortedStocks = [...filteredStocks].sort((a, b) => b.createdAt - a.createdAt);

  const handleAddStock = () => {
    setEditingStock(null);
    setIsModalOpen(true);
  };

  const handleEditStock = (stock) => {
    setEditingStock(stock);
    setIsModalOpen(true);
  };

  const handleDeleteStock = (stockId) => {
    if (window.confirm('이 종목을 삭제하시겠습니까?')) {
      dispatch({ type: 'DELETE_STOCK', payload: stockId });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStock(null);
  };

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Refreshing prices from Google Sheets...');

      const sheetData = await fetchGoogleSheetData();

      if (sheetData) {
        const updatedPortfolio = updatePortfolioWithSheetData(
          portfolio,
          sheetData.stocks
        );

        dispatch({
          type: 'UPDATE_PORTFOLIO_PRICES',
          payload: {
            portfolio: updatedPortfolio,
            exchangeRate: sheetData.exchangeRate
          }
        });

        console.log('✅ Prices refreshed successfully!');
        alert('최신 가격으로 업데이트되었습니다! 💰');
      }
    } catch (error) {
      console.error('❌ Failed to refresh prices:', error);
      alert('가격 업데이트에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="portfolio-page">
      <div className="portfolio-header">
        <h1>토스증권</h1>
        <button
          className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
          onClick={handleRefreshPrices}
          disabled={isRefreshing}
          title="구글 시트에서 최신 가격 가져오기"
        >
          <RefreshCw size={20} />
          {isRefreshing ? '업데이트 중...' : ''}
        </button>
      </div>

      {/* Asset Summary */}
      <AssetSummary />

      {/* Tab Navigation */}
      <div className="portfolio-tabs">
        <button
          className={`tab-btn ${activeTab === 'KR' ? 'active' : ''}`}
          onClick={() => setActiveTab('KR')}
        >
          국내 주식
        </button>
        <button
          className={`tab-btn ${activeTab === 'US' ? 'active' : ''}`}
          onClick={() => setActiveTab('US')}
        >
          미국 주식
        </button>
      </div>

      {/* Sort Options */}
      <div className="sort-options">
        <button className="sort-btn active">
          직접 설정한 순 ↕
        </button>
        <div className="currency-toggle">
          <button className={activeTab === 'US' ? 'active' : ''}>$</button>
          <button className={activeTab === 'KR' ? 'active' : ''}>원</button>
        </div>
      </div>

      {/* Stock Holdings */}
      <div className="stock-list-section">
        <div className="section-header">
          <h3>해외주식</h3>
          <button className="view-all-btn">보기</button>
        </div>

        <div className="stock-list">
          {sortedStocks.length > 0 ? (
            sortedStocks.map(stock => (
              <StockCard
                key={stock.id}
                stock={stock}
                exchangeRate={exchangeRate}
                onEdit={handleEditStock}
                onDelete={handleDeleteStock}
              />
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>보유 종목이 없습니다</p>
              <p className="empty-hint">하단의 + 버튼을 눌러 종목을 추가하세요</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      <button className="floating-add-btn" onClick={handleAddStock}>
        <Plus size={24} />
      </button>

      {/* Add/Edit Modal */}
      <AddStockModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingStock={editingStock}
      />
    </div>
  );
};

export default Portfolio;
