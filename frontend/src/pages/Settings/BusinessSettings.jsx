import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileText,
  CreditCard,
  UploadCloud,
  CheckCircle2,
  Save,
  RefreshCw,
  Building,
  Mail,
  Phone,
  MapPin,
  Landmark,
  Receipt,
  FileCheck2,
  HelpCircle,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { settingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { Input } from '../../components/common/Input';
import './settings.css';

export const BusinessSettings = () => {
  const { user } = useAuth();

  // Active Tab: 'company' | 'invoice' | 'bank'
  const [activeTab, setActiveTab] = useState('company');

  // Loading & Feedback
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Company Information State
  const [companyName, setCompanyName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [taxId, setTaxId] = useState('');
  const [logo, setLogo] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');

  // 2. Invoice Settings State
  const [prefix, setPrefix] = useState('INV-');
  const [nextNumber, setNextNumber] = useState(15);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState('Net 30');
  const [defaultTaxRate, setDefaultTaxRate] = useState(18);
  const [defaultTaxType, setDefaultTaxType] = useState('Intra-State');
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [defaultNotes, setDefaultNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  // 3. Bank & Settlement Details State
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [upiId, setUpiId] = useState('');

  // Fetch Current Settings
  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await settingsAPI.getSettings();
      if (res.success && res.settings) {
        const s = res.settings;
        setCompanyName(s.companyName || '');
        setBusinessEmail(s.businessEmail || '');
        setPhone(s.phone || '');
        setGstin(s.gstin || '');
        setTaxId(s.taxId || '');
        setLogo(s.logo || '');

        if (s.address) {
          setStreet(s.address.street || '');
          setCity(s.address.city || '');
          setStateName(s.address.state || '');
          setPostalCode(s.address.postalCode || '');
          setCountry(s.address.country || 'India');
        }

        if (s.invoiceSettings) {
          setPrefix(s.invoiceSettings.prefix || 'INV-');
          setNextNumber(s.invoiceSettings.nextNumber || 1);
          setDefaultPaymentTerms(s.invoiceSettings.defaultPaymentTerms || 'Net 30');
          setDefaultTaxRate(s.invoiceSettings.defaultTaxRate ?? 18);
          setDefaultTaxType(s.invoiceSettings.defaultTaxType || 'Intra-State');
          setDefaultCurrency(s.invoiceSettings.defaultCurrency || 'INR');
          setDefaultNotes(s.invoiceSettings.defaultNotes || '');
          setTermsAndConditions(s.invoiceSettings.termsAndConditions || '');
        }

        if (s.bankDetails) {
          setBankName(s.bankDetails.bankName || '');
          setAccountNumber(s.bankDetails.accountNumber || '');
          setIfscCode(s.bankDetails.ifscCode || '');
          setBranchName(s.bankDetails.branchName || '');
          setUpiId(s.bankDetails.upiId || '');
        }
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
      setError(err.message || 'Failed to load business settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle Logo Upload (Base64)
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, or SVG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image file size must be less than 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result);
      setSuccessMessage('Logo preview updated. Click "Save Settings" to persist.');
    };
    reader.readAsDataURL(file);
  };

  // Remove Logo
  const handleRemoveLogo = () => {
    setLogo('');
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = {
        companyName,
        businessEmail,
        phone,
        gstin,
        taxId,
        logo,
        address: {
          street,
          city,
          state: stateName,
          postalCode,
          country,
        },
        invoiceSettings: {
          prefix,
          nextNumber: Number(nextNumber),
          defaultPaymentTerms,
          defaultTaxRate: Number(defaultTaxRate),
          defaultTaxType,
          defaultCurrency,
          defaultNotes,
          termsAndConditions,
        },
        bankDetails: {
          bankName,
          accountNumber,
          ifscCode,
          branchName,
          upiId,
        },
      };

      const res = await settingsAPI.updateSettings(payload);
      if (res.success) {
        setSuccessMessage(res.message || 'Business settings and invoicing defaults saved successfully!');
      }
    } catch (err) {
      console.error('Save settings error:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page-content">
      {/* Header Row */}
      <div className="settings-header-row">
        <div>
          <h1 className="settings-main-title">Business & Invoicing Settings</h1>
          <p className="settings-sub-title">
            Configure enterprise legal details, tax identification, numbering series, and settlement preferences.
          </p>
        </div>
        <div className="settings-header-actions">
          <Button
            variant="outline"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchSettings}
          >
            Reload
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={saving}
            onClick={handleSaveSettings}
          >
            Save Settings
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage('')}
        />
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {/* Navigation Tabs */}
      <div className="settings-tabs-strip">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'company' ? 'active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          <Building2 size={16} />
          <span>Company & Legal Information</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'invoice' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoice')}
        >
          <FileText size={16} />
          <span>Invoice & Tax Configuration</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'bank' ? 'active' : ''}`}
          onClick={() => setActiveTab('bank')}
        >
          <Landmark size={16} />
          <span>Bank & Payment Settlement</span>
        </button>
      </div>

      <form onSubmit={handleSaveSettings}>
        {/* ========================================================= */}
        {/* TAB 1: COMPANY & LEGAL INFORMATION                        */}
        {/* ========================================================= */}
        {activeTab === 'company' && (
          <div className="settings-tab-pane">
            {/* Logo & Brand Card */}
            <Card padding="normal" className="settings-card">
              <Card.Header
                title="Business Logo & Branding"
                subtitle="This logo will be displayed on all printed and downloaded A4 tax invoices"
              />
              <Card.Body>
                <div className="logo-upload-container">
                  <div className="logo-preview-box">
                    {logo ? (
                      <img src={logo} alt="Business Logo" className="logo-img" />
                    ) : (
                      <div className="logo-placeholder">
                        <ImageIcon size={32} className="text-muted" />
                        <span className="text-xs text-muted mt-1">No Logo Uploaded</span>
                      </div>
                    )}
                  </div>

                  <div className="logo-upload-controls">
                    <div className="upload-btn-wrapper">
                      <Button
                        variant="outline"
                        icon={UploadCloud}
                        type="button"
                        onClick={() => document.getElementById('logo-file-input').click()}
                      >
                        Choose Logo Image
                      </Button>
                      <input
                        id="logo-file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                    {logo && (
                      <Button
                        variant="ghost"
                        icon={X}
                        type="button"
                        onClick={handleRemoveLogo}
                        className="text-danger"
                      >
                        Remove Logo
                      </Button>
                    )}
                    <span className="text-xs text-muted">
                      Recommended: High-resolution PNG or SVG with transparent background (Max 2 MB).
                    </span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* General Information Card */}
            <Card padding="normal" className="settings-card">
              <Card.Header
                title="Company Legal Entity Details"
                subtitle="Official registered trade name and direct business contact points"
              />
              <Card.Body>
                <div className="settings-form-grid">
                  <Input
                    label="Business / Registered Trade Name *"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Enterprises Pvt Ltd"
                    required
                  />

                  <Input
                    label="Official Business Email *"
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="e.g. billing@apexenterprises.com"
                    required
                  />

                  <Input
                    label="Business Phone Number *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                  />

                  <Input
                    label="Goods and Services Tax ID (GSTIN) *"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    helperText="15-character statutory GST identification number"
                    required
                  />

                  <Input
                    label="Permanent Account Number (PAN / Tax ID)"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="e.g. ABCDE1234F"
                  />

                  <Input
                    label="Country"
                    value={country}
                    disabled
                  />
                </div>

                <h4 className="settings-section-divider">Registered Office / Billing Address</h4>

                <div className="settings-form-grid">
                  <div style={{ gridColumn: 'span 2' }}>
                    <Input
                      label="Street Address / Suite / Building *"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. 124 Tech Park Road, Whitefield"
                      required
                    />
                  </div>

                  <Input
                    label="City *"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    required
                  />

                  <Input
                    label="State / Province *"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="e.g. Karnataka"
                    required
                  />

                  <Input
                    label="Postal PIN Code *"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="560066"
                    required
                  />
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: INVOICE & TAX CONFIGURATION                        */}
        {/* ========================================================= */}
        {activeTab === 'invoice' && (
          <div className="settings-tab-pane">
            <Card padding="normal" className="settings-card">
              <Card.Header
                title="Invoice Numbering & Default Terms"
                subtitle="Configure sequential serial number formats, default payment terms, and applicable taxes"
              />
              <Card.Body>
                <div className="settings-form-grid">
                  <Input
                    label="Invoice Numbering Prefix *"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="e.g. INV- or BILL-"
                    helperText="Prepended to every generated invoice number"
                    required
                  />

                  <Input
                    label="Next Invoice Sequence Counter *"
                    type="number"
                    min="1"
                    value={nextNumber}
                    onChange={(e) => setNextNumber(e.target.value)}
                    placeholder="15"
                    helperText="Current sequential seed for newly generated invoices"
                    required
                  />

                  <div className="custom-input-wrap">
                    <label className="input-label">Default Payment Terms *</label>
                    <select
                      value={defaultPaymentTerms}
                      onChange={(e) => setDefaultPaymentTerms(e.target.value)}
                      className="form-select"
                      required
                    >
                      <option value="Due on Receipt">Due on Receipt (Immediate)</option>
                      <option value="Net 15">Net 15 (15 Days)</option>
                      <option value="Net 30">Net 30 (30 Days)</option>
                      <option value="Net 45">Net 45 (45 Days)</option>
                      <option value="Net 60">Net 60 (60 Days)</option>
                    </select>
                  </div>

                  <div className="custom-input-wrap">
                    <label className="input-label">Default GST Tax Rate *</label>
                    <select
                      value={defaultTaxRate}
                      onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                      className="form-select"
                      required
                    >
                      <option value="0">0% (Nil / Exempt)</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% Standard GST</option>
                      <option value="28">28% Luxury / Cess GST</option>
                    </select>
                  </div>

                  <div className="custom-input-wrap">
                    <label className="input-label">Default Transaction Mode *</label>
                    <select
                      value={defaultTaxType}
                      onChange={(e) => setDefaultTaxType(e.target.value)}
                      className="form-select"
                      required
                    >
                      <option value="Intra-State">Intra-State (CGST 50% + SGST 50%)</option>
                      <option value="Inter-State">Inter-State (Integrated IGST 100%)</option>
                    </select>
                  </div>

                  <div className="custom-input-wrap">
                    <label className="input-label">Default Currency *</label>
                    <select
                      value={defaultCurrency}
                      onChange={(e) => setDefaultCurrency(e.target.value)}
                      className="form-select"
                      required
                    >
                      <option value="INR">INR (₹ - Indian Rupee)</option>
                      <option value="USD">USD ($ - US Dollar)</option>
                      <option value="EUR">EUR (€ - Euro)</option>
                      <option value="GBP">GBP (£ - British Pound)</option>
                    </select>
                  </div>
                </div>

                <h4 className="settings-section-divider">Standard Invoice Annotations & Legal Terms</h4>

                <div className="textarea-grid">
                  <div className="custom-input-wrap">
                    <label className="input-label">Default Client Notes</label>
                    <textarea
                      rows="4"
                      value={defaultNotes}
                      onChange={(e) => setDefaultNotes(e.target.value)}
                      placeholder="e.g. Thank you for your business. Please remit payment on or before the due date."
                      className="form-textarea"
                    />
                    <span className="text-xs text-muted mt-1">
                      Appears on the bottom-left note section of generated invoice PDFs.
                    </span>
                  </div>

                  <div className="custom-input-wrap">
                    <label className="input-label">Default Terms and Conditions</label>
                    <textarea
                      rows="4"
                      value={termsAndConditions}
                      onChange={(e) => setTermsAndConditions(e.target.value)}
                      placeholder="e.g. 1. All payments must be made strictly according to agreed credit terms..."
                      className="form-textarea"
                    />
                    <span className="text-xs text-muted mt-1">
                      Printed on the official legal disclosures footer of tax invoices.
                    </span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: BANK & PAYMENT SETTLEMENT                          */}
        {/* ========================================================= */}
        {activeTab === 'bank' && (
          <div className="settings-tab-pane">
            <Card padding="normal" className="settings-card">
              <Card.Header
                title="Bank Account & Remittance Instructions"
                subtitle="Bank wire details printed on invoices so customers can transfer funds directly"
              />
              <Card.Body>
                <div className="settings-form-grid">
                  <Input
                    label="Bank Name *"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank Ltd"
                    required
                  />

                  <Input
                    label="Bank Account Number *"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 50200012345678"
                    required
                  />

                  <Input
                    label="Bank IFSC Code *"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    helperText="11-character Indian Financial System Code"
                    required
                  />

                  <Input
                    label="Branch Name & City"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Whitefield Branch, Bengaluru"
                  />

                  <div style={{ gridColumn: 'span 2' }}>
                    <Input
                      label="Unified Payments Interface (UPI ID / VPA)"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. apexenterprises@hdfcbank"
                      helperText="Enables fast mobile payments through Google Pay, PhonePe, and BHIM"
                    />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Bottom Save Button Bar */}
        <div className="settings-bottom-bar">
          <Button
            variant="primary"
            type="submit"
            icon={Save}
            loading={saving}
            size="lg"
          >
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BusinessSettings;
