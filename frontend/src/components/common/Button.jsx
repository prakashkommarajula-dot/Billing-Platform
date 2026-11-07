import React from 'react';
import { Loader2 } from 'lucide-react';
import './common.css';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'dark'
  size = 'md', // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon = null,
  iconRight: IconRight = null,
  onClick,
  className = '',
  ...props
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const widthClass = fullWidth ? 'btn-full' : '';
  const loadingClass = loading ? 'btn-loading' : '';

  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${loadingClass} ${className}`.trim()}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="btn-spinner" size={16} />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="btn-icon-left" size={18} />}
          <span>{children}</span>
          {IconRight && <IconRight className="btn-icon-right" size={18} />}
        </>
      )}
    </button>
  );
};

export default Button;
