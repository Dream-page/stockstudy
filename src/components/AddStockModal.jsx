import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { COUNTRIES, CURRENCIES, STOCK_CATEGORIES, CATEGORY_LABELS } from '../utils/constants';
import { X } from 'lucide-react';
import './AddStockModal.css';

const AddStockModal = ({ isOpen, onClose, editingStock = null }) => {
  const { dispatch } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    ticker: '',
    country: COUNTRIES.KR,
    currency: CURRENCIES.KRW,
    avgPrice: '',
    currentPrice: '',
    quantity: '',
    category: STOCK_CATEGORIES.GROWTH
  });

  // Load editing stock data
  useEffect(() => {
    if (editingStock) {
      setFormData({
        name: editingStock.name,
        ticker: editingStock.ticker || '',
        country: editingStock.country,
        currency: editingStock.currency,
        avgPrice: editingStock.avgPrice.toString(),
        currentPrice: editingStock.currentPrice.toString(),
        quantity: editingStock.quantity.toString(),
        category: editingStock.category
      });
    }
  }, [editingStock]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-update currency when country changes
      if (name === 'country') {
        updated.currency = value === COUNTRIES.US ? CURRENCIES.USD : CURRENCIES.KRW;
      }

      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const stockData = {
      id: editingStock?.id || `stock-${Date.now()}`,
      name: formData.name,
      ticker: formData.ticker || formData.name,
      country: formData.country,
      currency: formData.currency,
      avgPrice: parseFloat(formData.avgPrice),
      currentPrice: parseFloat(formData.currentPrice),
      quantity: parseFloat(formData.quantity),
      category: formData.category,
      createdAt: editingStock?.createdAt || Date.now()
    };

    if (editingStock) {
      dispatch({ type: 'UPDATE_STOCK', payload: stockData });
    } else {
      dispatch({ type: 'ADD_STOCK', payload: stockData });
    }

    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      ticker: '',
      country: COUNTRIES.KR,
      currency: CURRENCIES.KRW,
      avgPrice: '',
      currentPrice: '',
      quantity: '',
      category: STOCK_CATEGORIES.GROWTH
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={handleClose} />
      <div className="add-stock-modal">
        <div className="modal-header">
          <h2>{editingStock ? '종목 수정' : '종목 추가'}</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">종목명 *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="예: 삼성전자, Tesla"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="ticker">티커 (선택)</label>
            <input
              type="text"
              id="ticker"
              name="ticker"
              value={formData.ticker}
              onChange={handleChange}
              placeholder="예: 005930, TSLA"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="country">국가 *</label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
              >
                <option value={COUNTRIES.KR}>🇰🇷 한국</option>
                <option value={COUNTRIES.US}>🇺🇸 미국</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="currency">통화 *</label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
              >
                <option value={CURRENCIES.KRW}>KRW (₩)</option>
                <option value={CURRENCIES.USD}>USD ($)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="avgPrice">평단가 *</label>
              <input
                type="number"
                id="avgPrice"
                name="avgPrice"
                value={formData.avgPrice}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="quantity">수량 *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="0"
                step={formData.country === COUNTRIES.US ? "0.000001" : "1"}
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="currentPrice">현재가 *</label>
            <input
              type="number"
              id="currentPrice"
              name="currentPrice"
              value={formData.currentPrice}
              onChange={handleChange}
              placeholder="0"
              step="0.01"
              min="0"
              required
            />
            <small className="form-hint">나중에 수정할 수 있습니다</small>
          </div>

          <div className="form-group">
            <label htmlFor="category">카테고리 *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              취소
            </button>
            <button type="submit" className="btn-submit">
              {editingStock ? '수정하기' : '추가하기'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddStockModal;
