import React, { createContext, useContext, useState, useEffect } from 'react';

const PortfolioContext = createContext();

export const PortfolioProvider = ({ children }) => {
  const [portfolio, setPortfolio] = useState(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('portfolio');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever portfolio changes
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  const addStock = (stock) => {
    const newStock = {
      ...stock,
      id: Date.now().toString(),
      addedAt: new Date().toISOString()
    };
    setPortfolio(prev => [...prev, newStock]);
  };

  const removeStock = (symbol) => {
    setPortfolio(prev => prev.filter(stock => stock.symbol !== symbol));
  };

  const updateStock = (symbol, updates) => {
    setPortfolio(prev =>
      prev.map(stock =>
        stock.symbol === symbol ? { ...stock, ...updates } : stock
      )
    );
  };

  const clearPortfolio = () => {
    if (window.confirm('모든 포트폴리오 데이터를 삭제하시겠습니까?')) {
      setPortfolio([]);
    }
  };

  return (
    <PortfolioContext.Provider
      value={{
        portfolio,
        addStock,
        removeStock,
        updateStock,
        clearPortfolio
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within PortfolioProvider');
  }
  return context;
};

export default PortfolioContext;
