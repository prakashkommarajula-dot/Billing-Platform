import React from 'react';
import './common.css';

export const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'normal', // 'none' | 'sm' | 'normal' | 'lg'
  onClick,
  ...props
}) => {
  return (
    <div
      className={`custom-card card-pad-${padding} ${hover ? 'card-hoverable' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={`card-header ${className}`}>
      <div className="card-header-titles">
        {title && <h3 className="card-title">{title}</h3>}
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="card-header-action">{action}</div>}
    </div>
  );
};

export const CardBody = ({ children, className = '' }) => {
  return <div className={`card-body ${className}`}>{children}</div>;
};

export const CardFooter = ({ children, className = '' }) => {
  return <div className={`card-footer ${className}`}>{children}</div>;
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
