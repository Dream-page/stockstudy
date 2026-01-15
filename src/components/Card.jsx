import React from 'react';
import './Card.css';

const Card = ({
  children,
  title,
  subtitle,
  action,
  hover = true,
  padding = 'medium',
  className = ''
}) => {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} card-padding-${padding} ${className}`}>
      {(title || action) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

export default Card;
