import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Check,
  AlertCircle,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { authAPI } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import './auth.css';

export const Register = () => {
  const navigate = useNavigate();

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    businessAddress: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  });

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation & Server Feedback States
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Real-time Password Strength Calculator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: 'transparent', width: '0%' };

    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^a-zA-Z\d]/.test(pwd)) score += 1;

    if (score <= 2) {
      return { score: 1, label: 'Weak', color: 'var(--danger-red)', width: '33%' };
    } else if (score <= 3) {
      return { score: 2, label: 'Medium', color: 'var(--warning-orange)', width: '66%' };
    } else {
      return { score: 3, label: 'Strong', color: 'var(--success-green)', width: '100%' };
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Field Validation
  const validateForm = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+0-9\s\-()]{7,20}$/;

    // 1. Full Name
    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Full name must be at least 2 characters';
    }

    // 2. Business Name
    if (!formData.businessName.trim()) {
      errs.businessName = 'Business or company name is required';
    }

    // 3. Email Address
    if (!formData.email.trim()) {
      errs.email = 'Business email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please provide a valid business email (e.g., name@company.com)';
    }

    // 4. Phone Number
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      errs.phone = 'Please enter a valid phone number (e.g. +91 98765 43210)';
    }

    // 5. Business Address
    if (!formData.businessAddress.trim()) {
      errs.businessAddress = 'Physical or registered business address is required';
    }

    // 6. Password
    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
    } else if (!/[a-zA-Z]/.test(formData.password) || !/\d/.test(formData.password)) {
      errs.password = 'Password must include both letters and numbers';
    }

    // 7. Confirm Password
    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    // 8. Terms Agreement
    if (!formData.agreeTerms) {
      errs.agreeTerms = 'You must accept the Terms of Service to proceed';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  // Submission to POST /api/auth/register
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setServerError('');
    setSuccessMessage('');

    try {
      const response = await authAPI.register({
        name: formData.name.trim(),
        businessName: formData.businessName.trim(),
        companyName: formData.businessName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        businessAddress: formData.businessAddress.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: 'Business Owner', // Controlled role: defaults to Business Owner; public Admin is disallowed
      });

      setSuccessMessage('Account registered successfully! Redirecting to login page...');

      // Redirect successfully registered users to login after 1.5 seconds
      setTimeout(() => {
        navigate('/login', {
          state: {
            registeredEmail: formData.email.trim(),
            successMessage: `Welcome aboard, ${formData.name}! Your account has been registered. Please sign in below.`,
          },
          replace: true,
        });
      }, 1500);
    } catch (err) {
      setServerError(
        err.message || 'Registration failed. An account with this email may already exist.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-wrapper">
        {/* ========================================================= */}
        {/* LEFT COLUMN: BRANDING & BUSINESS VALUE                    */}
        {/* ========================================================= */}
        <div className="auth-hero-panel">
          {/* Brand Header */}
          <div className="auth-hero-brand">
            <div className="hero-brand-icon">
              <Building2 size={26} color="#FFFFFF" />
            </div>
            <div>
              <h2 className="brand-title-text">BillFlow</h2>
              <span className="brand-subtitle-badge">
                Billing & Accounting Platform
              </span>
            </div>
          </div>

          {/* Hero Content */}
          <div className="auth-hero-content">
            <div className="hero-badge-pill">
              <Sparkles size={14} />
              <span>Business Owner Onboarding</span>
            </div>

            <h1 className="auth-hero-title">
              Power Your Business with Smart, Compliant Billing.
            </h1>
            <p className="auth-hero-subtitle">
              Register your organization to unlock instant tax invoicing, automated payment reconciliations, customer credit ledgers, and audit-ready reports.
            </p>

            {/* Feature Checklist */}
            <div className="auth-features-list">
              <div className="auth-feature-item">
                <div className="feature-check-icon">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div className="feature-title">Immediate Business Owner Setup</div>
                  <div className="feature-desc">
                    Get instant access as a Business Owner to generate GST/VAT invoices and manage client relationships.
                  </div>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="feature-check-icon">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div className="feature-title">Enterprise Security with bcrypt & JWT</div>
                  <div className="feature-desc">
                    All credentials are encrypted with salted bcrypt hashing and authenticated using stateless JSON Web Tokens.
                  </div>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="feature-check-icon">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div className="feature-title">Self-Service Customer Ledger</div>
                  <div className="feature-desc">
                    Your customers receive dedicated portal access to review pending statements and download PDF invoices.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="auth-hero-footer">
            <span>© 2026 BillFlow • B.Tech Full Stack & DevOps</span>
            <div className="hero-security-pill">
              <ShieldCheck size={14} color="#16A34A" />
              <span>MongoDB Persistent Storage</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: REGISTRATION FORM CARD                      */}
        {/* ========================================================= */}
        <div className="auth-form-panel">
          <div className="auth-card register-card">
            {/* Header */}
            <div className="auth-card-header">
              <div className="auth-card-icon-mobile">
                <Building2 size={24} color="#2563EB" />
              </div>
              <h2 className="auth-card-title">Create Business Account</h2>
              <p className="auth-card-subtitle">
                Enter your business details below to set up your billing workspace.
              </p>
            </div>

            {/* Role Badge Indicator */}
            <div className="register-role-callout">
              <div className="role-callout-icon">
                <Zap size={16} color="var(--primary-blue)" />
              </div>
              <div className="role-callout-text">
                <strong>Standard Business Account:</strong> Grants full access to Invoicing, Clients, Payments, Reports, and Inventory.
              </div>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <Alert
                type="error"
                message={serverError}
                onClose={() => setServerError('')}
                className="register-alert"
              />
            )}

            {/* Success Alert */}
            {successMessage && (
              <Alert
                type="success"
                message={successMessage}
                className="register-alert"
              />
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {/* Row 1: Full Name & Business Name */}
              <div className="form-row-2">
                {/* Field 1: Full Name */}
                <div className="input-group">
                  <label className="input-label" htmlFor="reg-name">
                    Full Name <span className="input-required-star">*</span>
                  </label>
                  <div className={`input-wrapper ${errors.name ? 'input-error-border' : ''}`}>
                    <span className="input-icon-left">
                      <User size={18} />
                    </span>
                    <input
                      id="reg-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Rajesh Sharma"
                      disabled={loading}
                      className="input-field has-icon-left"
                      required
                    />
                  </div>
                  {errors.name && <p className="input-error-text">{errors.name}</p>}
                </div>

                {/* Field 2: Business Name */}
                <div className="input-group">
                  <label className="input-label" htmlFor="reg-businessName">
                    Business / Company Name <span className="input-required-star">*</span>
                  </label>
                  <div className={`input-wrapper ${errors.businessName ? 'input-error-border' : ''}`}>
                    <span className="input-icon-left">
                      <Building size={18} />
                    </span>
                    <input
                      id="reg-businessName"
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="e.g. Apex Enterprises Pvt Ltd"
                      disabled={loading}
                      className="input-field has-icon-left"
                      required
                    />
                  </div>
                  {errors.businessName && <p className="input-error-text">{errors.businessName}</p>}
                </div>
              </div>

              {/* Row 2: Email Address & Phone Number */}
              <div className="form-row-2">
                {/* Field 3: Email Address */}
                <div className="input-group">
                  <label className="input-label" htmlFor="reg-email">
                    Business Email <span className="input-required-star">*</span>
                  </label>
                  <div className={`input-wrapper ${errors.email ? 'input-error-border' : ''}`}>
                    <span className="input-icon-left">
                      <Mail size={18} />
                    </span>
                    <input
                      id="reg-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@business.com"
                      disabled={loading}
                      className="input-field has-icon-left"
                      autoComplete="email"
                      required
                    />
                  </div>
                  {errors.email && <p className="input-error-text">{errors.email}</p>}
                </div>

                {/* Field 4: Phone Number */}
                <div className="input-group">
                  <label className="input-label" htmlFor="reg-phone">
                    Phone Number <span className="input-required-star">*</span>
                  </label>
                  <div className={`input-wrapper ${errors.phone ? 'input-error-border' : ''}`}>
                    <span className="input-icon-left">
                      <Phone size={18} />
                    </span>
                    <input
                      id="reg-phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      disabled={loading}
                      className="input-field has-icon-left"
                      required
                    />
                  </div>
                  {errors.phone && <p className="input-error-text">{errors.phone}</p>}
                </div>
              </div>

              {/* Field 5: Business Address */}
              <div className="input-group">
                <label className="input-label" htmlFor="reg-address">
                  Registered Business Address <span className="input-required-star">*</span>
                </label>
                <div className={`input-wrapper ${errors.businessAddress ? 'input-error-border' : ''}`}>
                  <span className="input-icon-left">
                    <MapPin size={18} />
                  </span>
                  <input
                    id="reg-address"
                    type="text"
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleChange}
                    placeholder="e.g. 42 Innovation Tech Park, Indiranagar, Bengaluru, KA 560038"
                    disabled={loading}
                    className="input-field has-icon-left"
                    required
                  />
                </div>
                {errors.businessAddress && (
                  <p className="input-error-text">{errors.businessAddress}</p>
                )}
              </div>

              {/* Row 3: Password & Confirm Password */}
              <div className="form-row-2">
                {/* Field 6: Password */}
                <div className="input-group">
                  <label className="input-label" htmlFor="reg-password">
                    Password <span className="input-required-star">*</span>
                  </label>
                  <div className={`input-wrapper ${errors.password ? 'input-error-border' : ''}`}>
                    <span className="input-icon-left">
                      <Lock size={18} />
                    </span>
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min. 8 characters"
                      disabled={loading}
                      className="input-field has-icon-left has-icon-right"
                      required
                    />
                    <button
                      type="button"
                      className="input-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={0}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="input-error-text">{errors.password}</p>}
                </div>

                {/* Field 7: Confirm Password */}
                <div className="input-group">
                  <label className="input-label" htmlFor="reg-confirmPassword">
                    Confirm Password <span className="input-required-star">*</span>
                  </label>
                  <div
                    className={`input-wrapper ${
                      errors.confirmPassword ? 'input-error-border' : ''
                    }`}
                  >
                    <span className="input-icon-left">
                      <Lock size={18} />
                    </span>
                    <input
                      id="reg-confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-type password"
                      disabled={loading}
                      className="input-field has-icon-left has-icon-right"
                      required
                    />
                    <button
                      type="button"
                      className="input-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={0}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="input-error-text">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Password Strength Indicator Bar */}
              {formData.password && (
                <div className="password-strength-container">
                  <div className="strength-header">
                    <span className="strength-text">Password Strength:</span>
                    <span
                      className="strength-label"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="strength-bar-track">
                    <div
                      className="strength-bar-fill"
                      style={{
                        width: passwordStrength.width,
                        backgroundColor: passwordStrength.color,
                      }}
                    />
                  </div>
                  <div className="strength-hints">
                    Must be at least 8 characters with letters & numbers.
                  </div>
                </div>
              )}

              {/* Terms of Service Checkbox */}
              <div className="terms-checkbox-wrap">
                <label className="checkbox-label" htmlFor="reg-agree">
                  <input
                    id="reg-agree"
                    type="checkbox"
                    name="agreeTerms"
                    className="checkbox-input"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span>
                    I accept the{' '}
                    <a
                      href="#terms"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('BillFlow Terms of Service: Standard SaaS billing terms apply.');
                      }}
                      className="terms-link"
                    >
                      Terms of Service
                    </a>{' '}
                    and Privacy Policy.
                  </span>
                </label>
                {errors.agreeTerms && (
                  <p className="input-error-text">{errors.agreeTerms}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={loading}
                fullWidth
                iconRight={ArrowRight}
                className="register-submit-btn"
              >
                {loading ? 'Creating Business Account...' : 'Complete Registration'}
              </Button>
            </form>

            {/* Footer with Login Link */}
            <div className="auth-card-footer">
              <span>Already have an account?</span>
              <Link to="/login" className="register-link font-semibold">
                Sign in to your account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
