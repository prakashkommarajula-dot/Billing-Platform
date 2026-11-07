import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import './common.css';

export const Alert = ({
  type = 'info', // 'success' | 'error' | 'warning' | 'info'
  message,
  children,
  onClose,
  className = '',
}) => {
  const content = message || children;
  if (!content) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="alert-icon text-success" />;
      case 'error':
        return <AlertCircle size={18} className="alert-icon text-danger" />;
      case 'warning':
        return <AlertTriangle size={18} className="alert-icon text-warning" />;
      case 'info':
      default:
        return <Info size={18} className="alert-icon text-info" />;
    }
  };

  return (
    <div className={`alert-box alert-${type} ${className}`} role="alert">
      <div className="alert-icon-wrapper">{getIcon()}</div>
      <div className="alert-content">{content}</div>
      {onClose && (
        <button type="button" className="alert-close-btn" onClick={onClose} aria-label="Close alert">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Alert;
