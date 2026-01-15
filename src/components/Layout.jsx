import React from 'react';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      {children}
    </div>
  );
};

const LayoutHeader = ({ children }) => {
  return (
    <header className="layout-header">
      {children}
    </header>
  );
};

const LayoutContent = ({ children, maxWidth = 'full' }) => {
  return (
    <main className={`layout-content layout-max-${maxWidth}`}>
      {children}
    </main>
  );
};

const LayoutGrid = ({ children, columns = 2, gap = 'medium' }) => {
  return (
    <div className={`layout-grid layout-grid-${columns} layout-gap-${gap}`}>
      {children}
    </div>
  );
};

const LayoutSection = ({ children, title, subtitle }) => {
  return (
    <section className="layout-section">
      {(title || subtitle) && (
        <div className="layout-section-header">
          {title && <h2 className="layout-section-title">{title}</h2>}
          {subtitle && <p className="layout-section-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="layout-section-content">
        {children}
      </div>
    </section>
  );
};

Layout.Header = LayoutHeader;
Layout.Content = LayoutContent;
Layout.Grid = LayoutGrid;
Layout.Section = LayoutSection;

export default Layout;
