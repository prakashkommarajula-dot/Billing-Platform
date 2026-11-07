import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './common.css';

export const Input = forwardRef(
  (
    {
      label,
      type = 'text',
      name,
      value,
      onChange,
      placeholder,
      error,
      helperText,
      required = false,
      disabled = false,
      icon: Icon = null,
      iconRight = null,
      className = '',
      wrapperClassName = '',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={`input-group ${wrapperClassName}`}>
        {label && (
          <label className="input-label" htmlFor={name}>
            {label}
            {required && <span className="input-required-star">*</span>}
          </label>
        )}

        <div className={`input-wrapper ${error ? 'input-error-border' : ''} ${disabled ? 'input-disabled' : ''}`}>
          {Icon && (
            <span className="input-icon-left">
              <Icon size={18} />
            </span>
          )}

          <input
            ref={ref}
            id={name}
            name={name}
            type={computedType}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`input-field ${Icon ? 'has-icon-left' : ''} ${isPassword || iconRight ? 'has-icon-right' : ''} ${className}`}
            {...props}
          />

          {isPassword ? (
            <button
              type="button"
              className="input-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          ) : iconRight ? (
            <span className="input-icon-right">{iconRight}</span>
          ) : null}
        </div>

        {error ? (
          <p className="input-error-text">{error}</p>
        ) : helperText ? (
          <p className="input-helper-text">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
