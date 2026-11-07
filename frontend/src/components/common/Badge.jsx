import React from 'react';
import './common.css';

export const Badge = ({
  children,
  variant = 'default', // 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'dark' | 'default'
  size = 'md', // 'sm' | 'md'
  dot = false,
  className = '',
}) => {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {dot && <span className="badge-dot" />}
      <span>{children}</span>
    </span>
  );
};

export const RoleBadge = ({ role, size = 'md' }) => {
  let variant = 'default';
  switch (role) {
    case 'Admin':
      variant = 'dark';
      break;
    case 'Business Owner':
      variant = 'primary';
      break;
    case 'Accountant':
      variant = 'warning';
      break;
    case 'Customer':
      variant = 'success';
      break;
    default:
      variant = 'default';
  }

  return (
    <Badge variant={variant} size={size}>
      {role || 'User'}
    </Badge>
  );
};

export default Badge;
