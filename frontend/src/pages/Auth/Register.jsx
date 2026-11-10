import React, { useState, useEffect } from 'react';
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
  BarChart3,
  Users,
  ChevronRight,
  ArrowLeft,
  Key,
} from 'lucide-react';
import { authAPI } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import './auth.css';

export const Register = () => {
  const navigate = useNavigate();

  // Wizard Step: 'select-role' | 'fill-form'
  const [step, setStep] = useState('select-role');
  const [selectedRole, setSelectedRole] = useState('Business Owner');

  // Available Businesses for Accountant and Customer Linking
  const [businesses, setBusinesses] = useState([]);
  const [loadingBiz, setLoadingBiz] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    businessAddress: '',
    gstin: '',
    businessId: '',
    invitationCode: '',
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

  // Load public registered businesses for selection
  useEffect(() => {
    setLoadingBiz(true);
    authAPI
      .getBusinesses()
      .then((res) => {
        if (res.success && res.businesses) {
          setBusinesses(res.businesses);
          if (res.businesses.length > 0 && !formData.businessId) {
            setFormData((prev) => ({ ...prev, businessId: res.businesses[0].id || res.businesses[0]._id }));
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load businesses list:', err);
      })
      .finally(() => setLoadingBiz(false));
  }, []);

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
    const phoneRegex = /^(?:\+?\d{1,3}[-\s]?)?[6-9]\d{9}$|^[+]?[0-9\s-]{10,15}$/;

    // 1. Full Name
    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Full name must be at least 2 characters';
    }

    // 2. Role Specific Validations
    if (selectedRole === 'Business Owner') {
      if (!formData.businessName.trim()) {
        errs.businessName = 'Business or company name is required';
      }
      if (!formData.businessAddress.trim()) {
        errs.businessAddress = 'Physical or registered business address is required';
      }
      if (formData.gstin && formData.gstin.trim()) {
        const cleanGstin = formData.gstin.trim().toUpperCase();
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGstin)) {
          errs.gstin = 'Invalid GSTIN structure (15 uppercase chars, e.g. 29ABCDE1234F1Z5)';
        }
      }
    } else {
      // Accountant or Customer must select a business or provide an invitation code
      if (!formData.businessId && !formData.invitationCode.trim()) {
        errs.businessId = 'Please select a business or enter a business invitation code';
      }
    }

    // 3. Email Address
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address (e.g. name@company.com)';
    }

    // 4. Phone Number
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      errs.phone = 'Please enter a valid 10-digit mobile number or standard phone format';
    }

    // 5. Password
    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
    } else if (!/[a-zA-Z]/.test(formData.password) || !/\d/.test(formData.password)) {
      errs.password = 'Password must include both letters and numbers';
    }

    // 6. Confirm Password
    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    // 7. Terms Agreement
    if (!formData.agreeTerms) {
      errs.agreeTerms = 'You must accept the Terms of Service to proceed';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    setServerError('');
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setServerError('');
    setSuccessMessage('');

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: selectedRole,
        businessName: formData.businessName.trim() || undefined,
        companyName: formData.businessName.trim() || undefined,
        businessAddress: formData.businessAddress.trim() || undefined,
        gstin: formData.gstin.trim() || undefined,
        taxId: formData.gstin.trim() || undefined,
        businessId: formData.businessId || undefined,
        invitationCode: formData.invitationCode.trim() || undefined,
      };

      const response = await authAPI.register(payload);

      setSuccessMessage(response.message || `Account created successfully as ${selectedRole}!`);

      setTimeout(() => {
        navigate('/login', {
          state: {
            registeredEmail: formData.email.trim(),
            successMessage: `Welcome aboard, ${formData.name}! Your ${selectedRole} account is active. Please sign in below.`,
          },
          replace: true,
        });
      }, 1400);
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
        {/* LEFT COLUMN: BRANDING & ROLE VALUE PROPOSITIONS          */}
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
                Multi-Tenant Billing Platform
              </span>
            </div>
          </div>

          {/* Hero Content */}
          <div className="auth-hero-content">
            <div className="hero-badge-pill">
              <Sparkles size={14} />
              <span>Multi-Role Account Creation</span>
            </div>

            <h1 className="auth-hero-title">
              Power Your Billing with Multi-Tenant Architecture.
            </h1>
            <p className="auth-hero-subtitle">
              Join BillFlow as a Business Owner, Accountant, or Customer. Experience isolated business workspaces, GST-compliant invoicing, real-time ledgers, and seamless payments.
            </p>

            {/* Feature Checklist */}
            <div className="auth-features-list">
              <div className="auth-feature-item">
                <div className="feature-check-icon">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div className="feature-title">Independent Business Workspaces</div>
                  <div className="feature-desc">
                    Every business operates within its own isolated tenant containing dedicated customers, products, and invoices.
                  </div>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="feature-check-icon">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div className="feature-title">Collaborative Multi-Role Governance</div>
                  <div className="feature-desc">
                    Owners invite accountants to audit ledgers and give customers self-service portal access to settle invoices.
                  </div>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="feature-check-icon">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div className="feature-title">Enterprise Security & Encryption</div>
                  <div className="feature-desc">
                    Salted bcryptjs hashing, stateless JWT session tokens, and strict role-based backend authorization.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Footer */}
          <div className="auth-hero-footer">
            <span>© 2026 BillFlow Platform • Multi-User & Multi-Business Billing</span>
            <div className="hero-security-pill">
              <ShieldCheck size={14} color="#16A34A" />
              <span>B.Tech Project Evaluation Edition</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: REGISTRATION WIZARD CARD                    */}
        {/* ========================================================= */}
        <div className="auth-form-panel">
          <div className="auth-card register-card">
            {/* Mobile Brand Icon */}
            <div className="auth-card-icon-mobile">
              <Building2 size={24} color="#2563EB" />
            </div>

            {/* STEP 1: ROLE SELECTION */}
            {step === 'select-role' && (
              <div>
                <div className="auth-card-header mb-3">
                  <h2 className="auth-card-title">Create Account</h2>
                  <p className="auth-card-subtitle font-medium text-primary">
                    Which type of account would you like to create?
                  </p>
                </div>

                <div className="role-cards-grid">
                  {/* Card 1: Business Owner */}
                  <div
                    className={`role-select-card ${selectedRole === 'Business Owner' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('Business Owner')}
                  >
                    <div className="role-card-icon-box">
                      <Building2 size={22} />
                    </div>
                    <div className="role-card-content">
                      <div className="role-card-title-row">
                        <span className="role-card-name">Business Owner</span>
                        <span className="role-card-badge">Full Administration</span>
                      </div>
                      <p className="role-card-desc">
                        Create an organization workspace, issue GST invoices, manage products, invite accountants, and register customers.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Accountant */}
                  <div
                    className={`role-select-card ${selectedRole === 'Accountant' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('Accountant')}
                  >
                    <div className="role-card-icon-box">
                      <BarChart3 size={22} />
                    </div>
                    <div className="role-card-content">
                      <div className="role-card-title-row">
                        <span className="role-card-name">Accountant</span>
                        <span className="role-card-badge">Financial Auditing</span>
                      </div>
                      <p className="role-card-desc">
                        Join an existing business, audit sales, reconcile payments, inspect receivables aging, and generate tax reports.
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Customer */}
                  <div
                    className={`role-select-card ${selectedRole === 'Customer' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('Customer')}
                  >
                    <div className="role-card-icon-box">
                      <Users size={22} />
                    </div>
                    <div className="role-card-content">
                      <div className="role-card-title-row">
                        <span className="role-card-name">Customer</span>
                        <span className="role-card-badge">Client Portal</span>
                      </div>
                      <p className="role-card-desc">
                        Access your client portal to review tax invoices, download A4 receipts, and complete due invoice payments.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  className="mt-4"
                  icon={ArrowRight}
                  onClick={() => setStep('fill-form')}
                >
                  Continue as {selectedRole} &rarr;
                </Button>

                <div className="auth-card-footer mt-4">
                  <span>Already have a workspace account? </span>
                  <Link to="/login" className="auth-switch-link">
                    Sign in here
                  </Link>
                </div>
              </div>
            )}

            {/* STEP 2: TAILORED REGISTRATION FORM */}
            {step === 'fill-form' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    className="role-change-btn"
                    onClick={() => setStep('select-role')}
                  >
                    <ArrowLeft size={14} /> Back to Role Selection
                  </button>
                  <span className="role-card-badge font-bold">
                    {selectedRole} Account
                  </span>
                </div>

                <div className="auth-card-header">
                  <h2 className="auth-card-title">{selectedRole} Registration</h2>
                  <p className="auth-card-subtitle">
                    Enter your details to create your secure {selectedRole.toLowerCase()} account.
                  </p>
                </div>

                {/* Alerts */}
                {serverError && (
                  <Alert
                    type="error"
                    message={serverError}
                    onClose={() => setServerError('')}
                    className="login-alert"
                  />
                )}
                {successMessage && (
                  <Alert
                    type="success"
                    message={successMessage}
                    className="login-alert"
                  />
                )}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                  {/* Field: Full Name */}
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
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g. John Doe"
                        className="input-field has-icon-left"
                        disabled={loading}
                        required
                      />
                    </div>
                    {errors.name && <p className="input-error-text">{errors.name}</p>}
                  </div>

                  {/* Role Specific: Business Name (Only for Owner) */}
                  {selectedRole === 'Business Owner' && (
                    <div className="input-group">
                      <label className="input-label" htmlFor="reg-biz-name">
                        Business / Company Name <span className="input-required-star">*</span>
                      </label>
                      <div className={`input-wrapper ${errors.businessName ? 'input-error-border' : ''}`}>
                        <span className="input-icon-left">
                          <Building size={18} />
                        </span>
                        <input
                          id="reg-biz-name"
                          type="text"
                          value={formData.businessName}
                          onChange={(e) => handleInputChange('businessName', e.target.value)}
                          placeholder="e.g. Acme Tech Solutions Pvt Ltd"
                          className="input-field has-icon-left"
                          disabled={loading}
                          required
                        />
                      </div>
                      {errors.businessName && <p className="input-error-text">{errors.businessName}</p>}
                    </div>
                  )}

                  {/* Role Specific: Business Association (For Accountant & Customer) */}
                  {selectedRole !== 'Business Owner' && (
                    <div className="input-group">
                      <label className="input-label" htmlFor="reg-select-biz">
                        Select Business Workspace <span className="input-required-star">*</span>
                      </label>
                      <div className={`input-wrapper ${errors.businessId ? 'input-error-border' : ''}`}>
                        <span className="input-icon-left">
                          <Building size={18} />
                        </span>
                        <select
                          id="reg-select-biz"
                          value={formData.businessId}
                          onChange={(e) => handleInputChange('businessId', e.target.value)}
                          className="input-field has-icon-left"
                          disabled={loading || loadingBiz}
                        >
                          <option value="">-- Choose Business to Associate --</option>
                          {businesses.map((b) => (
                            <option key={b.id || b._id} value={b.id || b._id}>
                              {b.companyName || b.businessName} (Owner: {b.name})
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.businessId && <p className="input-error-text">{errors.businessId}</p>}
                      <div className="mt-1">
                        <input
                          type="text"
                          value={formData.invitationCode}
                          onChange={(e) => handleInputChange('invitationCode', e.target.value)}
                          placeholder="Or enter Business Invitation Code (e.g. APEX-2026)"
                          className="input-field text-xs mt-1 font-mono uppercase"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}

                  {/* Field: Email Address */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="reg-email">
                      Email Address (Login ID) <span className="input-required-star">*</span>
                    </label>
                    <div className={`input-wrapper ${errors.email ? 'input-error-border' : ''}`}>
                      <span className="input-icon-left">
                        <Mail size={18} />
                      </span>
                      <input
                        id="reg-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="name@business.com"
                        className="input-field has-icon-left"
                        disabled={loading}
                        required
                      />
                    </div>
                    {errors.email && <p className="input-error-text">{errors.email}</p>}
                  </div>

                  {/* Field: Phone Number */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="reg-phone">
                      Mobile Number <span className="input-required-star">*</span>
                    </label>
                    <div className={`input-wrapper ${errors.phone ? 'input-error-border' : ''}`}>
                      <span className="input-icon-left">
                        <Phone size={18} />
                      </span>
                      <input
                        id="reg-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="input-field has-icon-left"
                        disabled={loading}
                        required
                      />
                    </div>
                    {errors.phone && <p className="input-error-text">{errors.phone}</p>}
                  </div>

                  {/* Role Specific: Address & GSTIN (For Business Owner) */}
                  {selectedRole === 'Business Owner' && (
                    <>
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
                            value={formData.businessAddress}
                            onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                            placeholder="Street, City, State, PIN"
                            className="input-field has-icon-left"
                            disabled={loading}
                            required
                          />
                        </div>
                        {errors.businessAddress && <p className="input-error-text">{errors.businessAddress}</p>}
                      </div>

                      <div className="input-group">
                        <label className="input-label" htmlFor="reg-gstin">
                          GSTIN / Tax ID <span className="text-muted text-xs font-normal">(Optional)</span>
                        </label>
                        <div className={`input-wrapper ${errors.gstin ? 'input-error-border' : ''}`}>
                          <span className="input-icon-left">
                            <FileCheck2 size={18} />
                          </span>
                          <input
                            id="reg-gstin"
                            type="text"
                            value={formData.gstin}
                            onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                            placeholder="e.g. 29ABCDE1234F1Z5"
                            className="input-field has-icon-left font-mono"
                            disabled={loading}
                            maxLength={15}
                          />
                        </div>
                        {errors.gstin && <p className="input-error-text">{errors.gstin}</p>}
                      </div>
                    </>
                  )}

                  {/* Password & Strength Meter */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="reg-password">
                      Account Password <span className="input-required-star">*</span>
                    </label>
                    <div className={`input-wrapper ${errors.password ? 'input-error-border' : ''}`}>
                      <span className="input-icon-left">
                        <Lock size={18} />
                      </span>
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Minimum 8 alphanumeric characters"
                        className="input-field has-icon-left has-icon-right"
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="input-password-toggle"
                        tabIndex="-1"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {formData.password && (
                      <div className="password-strength-container mt-1">
                        <div className="strength-header">
                          <span className="strength-label">Password Strength:</span>
                          <span className="strength-val" style={{ color: passwordStrength.color }}>
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
                      </div>
                    )}
                    {errors.password && <p className="input-error-text">{errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="reg-confirm-password">
                      Confirm Password <span className="input-required-star">*</span>
                    </label>
                    <div className={`input-wrapper ${errors.confirmPassword ? 'input-error-border' : ''}`}>
                      <span className="input-icon-left">
                        <Lock size={18} />
                      </span>
                      <input
                        id="reg-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Re-enter your password"
                        className="input-field has-icon-left has-icon-right"
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="input-password-toggle"
                        tabIndex="-1"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="input-error-text">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Terms Checkbox */}
                  <div className="terms-checkbox-wrap">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.agreeTerms}
                        onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                      />
                      <span>
                        I agree to the <span className="terms-link">Terms of Service</span> and{' '}
                        <span className="terms-link">Privacy Policy</span>.
                      </span>
                    </label>
                    {errors.agreeTerms && (
                      <p className="input-error-text mt-1">{errors.agreeTerms}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={loading}
                    className="register-submit-btn"
                    icon={Check}
                  >
                    Complete {selectedRole} Registration
                  </Button>
                </form>

                <div className="auth-card-footer mt-4">
                  <span>Already have an account? </span>
                  <Link to="/login" className="auth-switch-link">
                    Sign in here
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
