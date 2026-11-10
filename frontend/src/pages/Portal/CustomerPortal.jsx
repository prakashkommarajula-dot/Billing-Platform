import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Receipt,
  FileText,
  CreditCard,
  FileMinus,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Edit,
  Save,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  BookOpen,
  DollarSign,
  ShieldCheck,
  X,
  CreditCard as PayIcon,
} from 'lucide-react';
import { portalAPI, invoiceAPI, creditNoteAPI, customerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { Input } from '../../components/common/Input';
import './portal.css';

// Currency Formatter in INR
const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

// Date Formatter
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const CustomerPortal = () => {
  const navigate = useNavigate();
  const { user, isCustomer } = useAuth();

  // Active Navigation Tab: 'overview' | 'invoices' | 'payments' | 'credit-notes' | 'statement' | 'profile'
  const [activeTab, setActiveTab] = useState('overview');

  // Customer Selector for Admin/Owner preview
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Portal Summary & Dashboard State
  const [summary, setSummary] = useState({
    metrics: { totalInvoices: 0, paidInvoices: 0, pendingInvoices: 0, outstandingBalance: 0 },
    profile: { name: '', email: '', phone: '', companyName: '', gstin: '', billingAddress: {} },
    recentInvoices: [],
    recentPayments: [],
  });

  // Sub-Tab States
  const [invoicesList, setInvoicesList] = useState([]);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('All');
  const [invoiceSearch, setInvoiceSearch] = useState('');

  const [paymentsList, setPaymentsList] = useState([]);
  const [creditNotesList, setCreditNotesList] = useState([]);

  // Statement State
  const [statementData, setStatementData] = useState({
    customer: null,
    openingBalance: 0,
    closingBalance: 0,
    totalDebits: 0,
    totalCredits: 0,
    ledger: [],
  });
  const [statementStartDate, setStatementStartDate] = useState('');
  const [statementEndDate, setStatementEndDate] = useState('');

  // Profile Edit State
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [profileStreet, setProfileStreet] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileState, setProfileState] = useState('');
  const [profilePostal, setProfilePostal] = useState('');

  // Loading & Feedback
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Pay Now Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPayInvoice, setSelectedPayInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState('');

  // Official Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);

  // Open Pay Modal
  const handleOpenPayModal = (inv) => {
    setSelectedPayInvoice(inv);
    setPayAmount(inv.balanceDue || 0);
    setPayMethod('UPI');
    setPayRef(`UPI-${Date.now().toString().slice(-8)}`);
    setPayNotes('Portal self-service balance settlement');
    setPayError('');
    setIsPayModalOpen(true);
  };

  // Generate Reference Number
  const handleGenerateRef = () => {
    const prefixes = {
      UPI: 'UPI',
      'Bank Transfer': 'UTR',
      'Credit/Debit Card': 'CARD',
      Cash: 'CSH',
    };
    const prefix = prefixes[payMethod] || 'PAY';
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    setPayRef(`${prefix}-${randomDigits}`);
  };

  // Submit Due Payment
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    setPayError('');

    if (!selectedPayInvoice) return;

    const numAmount = Number(payAmount);
    if (isNaN(numAmount) || numAmount < 1) {
      setPayError('Minimum payment amount must be ₹1.00');
      return;
    }

    if (numAmount > selectedPayInvoice.balanceDue) {
      setPayError(
        `Payment amount of ₹${numAmount} exceeds remaining balance of ₹${selectedPayInvoice.balanceDue}`
      );
      return;
    }

    setPaySubmitting(true);
    try {
      const res = await portalAPI.payInvoice({
        invoiceId: selectedPayInvoice._id,
        amount: numAmount,
        paymentMethod: payMethod,
        transactionReference: payRef.trim(),
        notes: payNotes.trim(),
      });

      if (res.success && res.receipt) {
        setCurrentReceipt(res.receipt);
        setIsPayModalOpen(false);
        setReceiptModalOpen(true);
        setSuccessMessage(`Payment for ${selectedPayInvoice.invoiceNumber} processed successfully!`);

        // Refresh all portal collections
        fetchPortalSummary();
        fetchInvoices();
        fetchPayments();
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      setPayError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setPaySubmitting(false);
    }
  };

  // Fetch Customers if user is Admin/Owner for switcher
  useEffect(() => {
    if (!isCustomer) {
      customerAPI.getAll({ limit: 100 })
        .then((res) => {
          if (res.success && res.customers) {
            setAllCustomers(res.customers);
          }
        })
        .catch(console.warn);
    }
  }, [isCustomer]);

  // Fetch Portal Summary Data
  const fetchPortalSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await portalAPI.getSummary({
        customerId: selectedCustomerId || undefined,
      });

      if (res.success) {
        setSummary(res);
        // Pre-fill profile fields
        setProfilePhone(res.profile.phone || '');
        setProfileCompany(res.profile.companyName || '');
        setProfileStreet(res.profile.billingAddress?.street || '');
        setProfileCity(res.profile.billingAddress?.city || '');
        setProfileState(res.profile.billingAddress?.state || '');
        setProfilePostal(res.profile.billingAddress?.postalCode || res.profile.billingAddress?.zipCode || '');
      }
    } catch (err) {
      console.error('Fetch portal summary error:', err);
      setError(err.message || 'Failed to load customer portal');
    } finally {
      setLoading(false);
    }
  }, [selectedCustomerId]);

  // Fetch Invoices Tab
  const fetchInvoices = useCallback(async () => {
    try {
      const res = await portalAPI.getInvoices({
        customerId: selectedCustomerId || undefined,
        status: invoiceStatusFilter !== 'All' ? invoiceStatusFilter : undefined,
        search: invoiceSearch || undefined,
      });
      if (res.success) setInvoicesList(res.invoices || []);
    } catch (err) {
      console.error('Fetch portal invoices error:', err);
    }
  }, [selectedCustomerId, invoiceStatusFilter, invoiceSearch]);

  // Fetch Payments Tab
  const fetchPayments = useCallback(async () => {
    try {
      const res = await portalAPI.getPayments({
        customerId: selectedCustomerId || undefined,
      });
      if (res.success) setPaymentsList(res.payments || []);
    } catch (err) {
      console.error('Fetch portal payments error:', err);
    }
  }, [selectedCustomerId]);

  // Fetch Credit Notes Tab
  const fetchCreditNotes = useCallback(async () => {
    try {
      const res = await portalAPI.getCreditNotes({
        customerId: selectedCustomerId || undefined,
      });
      if (res.success) setCreditNotesList(res.creditNotes || []);
    } catch (err) {
      console.error('Fetch portal credit notes error:', err);
    }
  }, [selectedCustomerId]);

  // Fetch Statement Tab
  const fetchStatement = useCallback(async () => {
    try {
      const res = await portalAPI.getStatement({
        customerId: selectedCustomerId || undefined,
        startDate: statementStartDate || undefined,
        endDate: statementEndDate || undefined,
      });
      if (res.success) setStatementData(res);
    } catch (err) {
      console.error('Fetch portal statement error:', err);
    }
  }, [selectedCustomerId, statementStartDate, statementEndDate]);

  // Trigger loads based on active tab
  useEffect(() => {
    fetchPortalSummary();
  }, [fetchPortalSummary]);

  useEffect(() => {
    if (activeTab === 'invoices') fetchInvoices();
    else if (activeTab === 'payments') fetchPayments();
    else if (activeTab === 'credit-notes') fetchCreditNotes();
    else if (activeTab === 'statement') fetchStatement();
  }, [activeTab, fetchInvoices, fetchPayments, fetchCreditNotes, fetchStatement]);

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = {
        phone: profilePhone,
        companyName: profileCompany,
        billingAddress: {
          street: profileStreet,
          city: profileCity,
          state: profileState,
          postalCode: profilePostal,
          country: 'India',
        },
      };

      const res = await portalAPI.updateProfile(payload);
      if (res.success) {
        setSuccessMessage('Billing and contact profile updated successfully!');
        fetchPortalSummary();
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.message || 'Failed to update profile details');
    } finally {
      setSavingProfile(false);
    }
  };

  // Export Statement to CSV
  const handleExportStatementCSV = () => {
    const headers = ['Date', 'Transaction Type', 'Reference #', 'Description', 'Debit (INR)', 'Credit (INR)', 'Running Balance (INR)'];
    const rows = statementData.ledger.map((entry) => [
      formatDate(entry.date),
      entry.type,
      entry.reference,
      `"${entry.description}"`,
      entry.debit,
      entry.credit,
      entry.runningBalance,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Account_Statement_${summary.profile.name || 'Client'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="portal-page-container">
      {/* ========================================================= */}
      {/* 1. ADMIN / OWNER CUSTOMER PREVIEW SWITCHER                */}
      {/* ========================================================= */}
      {!isCustomer && (
        <div className="portal-admin-preview-banner no-print">
          <div className="preview-info">
            <ShieldCheck size={18} className="text-primary" />
            <span className="font-semibold text-sm">
              Customer Portal Preview Mode:
            </span>
            <span className="text-xs text-muted">
              Select any customer account to simulate their live portal experience
            </span>
          </div>
          <div className="preview-selector">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="preview-select"
            >
              <option value="">-- Active Demo Customer (David Miller) --</option>
              {allCustomers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.companyName ? `(${c.companyName})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. TOP BANNER & WELCOME HEADER                            */}
      {/* ========================================================= */}
      <div className="portal-welcome-card no-print">
        <div className="welcome-main-info">
          <div className="client-avatar-box">
            <User size={28} color="var(--primary-blue)" />
          </div>
          <div>
            <div className="welcome-sub">CLIENT BILLING PORTAL</div>
            <h2 className="welcome-title">
              Welcome, {summary.profile.name || user?.name || 'Valued Client'}
            </h2>
            <p className="welcome-company">
              {summary.profile.companyName || user?.companyName || 'Global Tech Solutions'} • GSTIN: {summary.profile.gstin || '29ABCDE8888G1Z9'}
            </p>
          </div>
        </div>

        <div className="welcome-action-buttons">
          <Button
            variant="outline"
            icon={BookOpen}
            onClick={() => setActiveTab('statement')}
          >
            Account Statement
          </Button>
          <Button
            variant="primary"
            icon={Edit}
            onClick={() => setActiveTab('profile')}
          >
            Update Billing Details
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage('')}
          className="mb-4 no-print"
        />
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
          className="mb-4 no-print"
        />
      )}

      {/* ========================================================= */}
      {/* 3. CUSTOMER DASHBOARD SUMMARY METRIC CARDS                */}
      {/* ========================================================= */}
      <div className="portal-metrics-grid no-print">
        {/* Card 1: Total Invoices */}
        <div className="portal-stat-card card-invoices">
          <div className="stat-top">
            <span className="stat-label">Total Invoices</span>
            <div className="stat-icon icon-primary">
              <FileText size={20} />
            </div>
          </div>
          <div className="stat-value">{summary.metrics.totalInvoices}</div>
          <div className="stat-footer text-muted">All-time issued invoices</div>
        </div>

        {/* Card 2: Paid Invoices */}
        <div className="portal-stat-card card-paid">
          <div className="stat-top">
            <span className="stat-label">Paid Invoices</span>
            <div className="stat-icon icon-success">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="stat-value text-success">{summary.metrics.paidInvoices}</div>
          <div className="stat-footer text-success">Fully settled accounts</div>
        </div>

        {/* Card 3: Pending Invoices */}
        <div className="portal-stat-card card-pending">
          <div className="stat-top">
            <span className="stat-label">Pending Invoices</span>
            <div className="stat-icon icon-warning">
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-value text-warning">{summary.metrics.pendingInvoices}</div>
          <div className="stat-footer text-warning">Awaiting completion</div>
        </div>

        {/* Card 4: Outstanding Balance */}
        <div className="portal-stat-card card-balance">
          <div className="stat-top">
            <span className="stat-label">Outstanding Balance</span>
            <div className="stat-icon icon-danger">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="stat-value text-danger">
            {formatINR(summary.metrics.outstandingBalance)}
          </div>
          <div className="stat-footer text-danger">Total balance payable</div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. NAVIGATION TABS                                        */}
      {/* ========================================================= */}
      <div className="portal-tabs-nav no-print">
        <button
          type="button"
          className={`portal-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Globe size={16} />
          <span>Dashboard Overview</span>
        </button>

        <button
          type="button"
          className={`portal-tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <FileText size={16} />
          <span>My Invoices</span>
        </button>

        <button
          type="button"
          className={`portal-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <CreditCard size={16} />
          <span>Payment History</span>
        </button>

        <button
          type="button"
          className={`portal-tab-btn ${activeTab === 'credit-notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('credit-notes')}
        >
          <FileMinus size={16} />
          <span>Credit Notes</span>
        </button>

        <button
          type="button"
          className={`portal-tab-btn ${activeTab === 'statement' ? 'active' : ''}`}
          onClick={() => setActiveTab('statement')}
        >
          <BookOpen size={16} />
          <span>Account Statement</span>
        </button>

        <button
          type="button"
          className={`portal-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <Edit size={16} />
          <span>Billing Profile</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DASHBOARD OVERVIEW                                 */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="portal-tab-content">
          <div className="portal-overview-grid">
            {/* Left: Recent Invoices */}
            <Card padding="normal" className="overview-card">
              <Card.Header
                title="Recent Invoices"
                subtitle="Your most recent business tax invoices"
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ChevronRight}
                    onClick={() => setActiveTab('invoices')}
                  >
                    View All
                  </Button>
                }
              />
              <Card.Body>
                {summary.recentInvoices.length === 0 ? (
                  <p className="text-muted text-sm py-4 text-center">No invoices issued to date.</p>
                ) : (
                  <div className="portal-table-wrap">
                    <table className="portal-compact-table">
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Date</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                          <th style={{ textAlign: 'right' }}>Balance</th>
                          <th style={{ textAlign: 'center' }}>Status</th>
                          <th style={{ textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.recentInvoices.map((inv) => (
                          <tr key={inv._id}>
                            <td className="font-mono font-bold text-primary">
                              <button
                                type="button"
                                className="portal-link-btn"
                                onClick={() => navigate(`/invoices/${inv._id}`)}
                              >
                                {inv.invoiceNumber}
                              </button>
                            </td>
                            <td className="text-muted text-xs">{formatDate(inv.invoiceDate)}</td>
                            <td className="text-right font-medium">{formatINR(inv.totalAmount)}</td>
                            <td className="text-right font-bold">
                              <span className={inv.balanceDue > 0 ? 'text-danger' : 'text-success'}>
                                {formatINR(inv.balanceDue)}
                              </span>
                            </td>
                            <td className="text-center">
                              <Badge
                                variant={
                                  inv.status === 'Paid'
                                    ? 'success'
                                    : inv.status === 'Partially Paid'
                                    ? 'warning'
                                    : inv.status === 'Overdue'
                                    ? 'danger'
                                    : 'default'
                                }
                                size="sm"
                                dot
                              >
                                {inv.status}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                {inv.balanceDue > 0 && (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    icon={PayIcon}
                                    onClick={() => handleOpenPayModal(inv)}
                                    title="Pay outstanding balance"
                                  >
                                    Pay Now
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={Download}
                                  onClick={() => invoiceAPI.downloadPDF(inv._id, inv.invoiceNumber)}
                                  title="Download A4 PDF"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Right: Billing Profile Summary & Recent Payments */}
            <div className="overview-sidebar-col">
              {/* Billing Information Card */}
              <Card padding="normal" className="overview-card">
                <Card.Header
                  title="Billing Information"
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit}
                      onClick={() => setActiveTab('profile')}
                    >
                      Edit
                    </Button>
                  }
                />
                <Card.Body>
                  <div className="billing-info-rows">
                    <div className="b-info-item">
                      <Building size={16} className="text-muted" />
                      <div>
                        <span className="b-lbl">Company</span>
                        <span className="b-val font-semibold">{summary.profile.companyName || '—'}</span>
                      </div>
                    </div>
                    <div className="b-info-item">
                      <Mail size={16} className="text-muted" />
                      <div>
                        <span className="b-lbl">Email</span>
                        <span className="b-val">{summary.profile.email}</span>
                      </div>
                    </div>
                    <div className="b-info-item">
                      <Phone size={16} className="text-muted" />
                      <div>
                        <span className="b-lbl">Phone</span>
                        <span className="b-val">{summary.profile.phone || '—'}</span>
                      </div>
                    </div>
                    <div className="b-info-item">
                      <MapPin size={16} className="text-muted" />
                      <div>
                        <span className="b-lbl">Registered Address</span>
                        <span className="b-val text-xs text-muted">
                          {[
                            summary.profile.billingAddress?.street,
                            summary.profile.billingAddress?.city,
                            summary.profile.billingAddress?.state,
                            summary.profile.billingAddress?.postalCode,
                          ]
                            .filter(Boolean)
                            .join(', ') || 'No address configured'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Recent Payments */}
              <Card padding="normal" className="overview-card">
                <Card.Header
                  title="Recent Settlements"
                  subtitle="Latest logged payment receipts"
                />
                <Card.Body>
                  {summary.recentPayments.length === 0 ? (
                    <p className="text-muted text-sm py-3 text-center">No settlements logged yet.</p>
                  ) : (
                    <div className="portal-payments-mini-list">
                      {summary.recentPayments.map((p) => (
                        <div key={p._id} className="mini-payment-item">
                          <div className="mini-pay-icon">
                            <CheckCircle2 size={16} color="var(--success-green)" />
                          </div>
                          <div className="mini-pay-details">
                            <span className="font-bold text-success">{formatINR(p.amount)}</span>
                            <span className="text-xs text-muted">
                              {p.paymentMethod} • {formatDate(p.paymentDate)}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-muted">{p.paymentNumber}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MY INVOICES                                        */}
      {/* ========================================================= */}
      {activeTab === 'invoices' && (
        <div className="portal-tab-content">
          {/* Filters Bar */}
          <Card padding="normal" className="filters-card no-print">
            <div className="portal-filters-grid">
              <div className="search-input-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search invoice number..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="search-field"
                />
              </div>

              <div className="filter-dropdown-wrap">
                <span className="filter-label">Status:</span>
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Sent">Sent / Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchInvoices}>
                Refresh
              </Button>
            </div>
          </Card>

          {/* Master Invoices Table */}
          <Card padding="none" className="table-card">
            <div className="table-responsive">
              <table className="portal-master-table">
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                    <th style={{ textAlign: 'right' }}>Amount Paid</th>
                    <th style={{ textAlign: 'right' }}>Balance Due</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesList.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        No invoices found.
                      </td>
                    </tr>
                  ) : (
                    invoicesList.map((inv) => (
                      <tr key={inv._id}>
                        <td className="font-mono font-bold text-primary">
                          <button
                            type="button"
                            className="portal-link-btn"
                            onClick={() => navigate(`/invoices/${inv._id}`)}
                            title="View Full Invoice Details"
                          >
                            {inv.invoiceNumber}
                          </button>
                        </td>
                        <td className="text-muted text-sm">{formatDate(inv.invoiceDate)}</td>
                        <td className="text-muted text-sm">{formatDate(inv.dueDate)}</td>
                        <td className="text-right font-medium">{formatINR(inv.totalAmount)}</td>
                        <td className="text-right text-success font-medium">{formatINR(inv.paidAmount)}</td>
                        <td className="text-right font-bold">
                          <span className={inv.balanceDue > 0 ? 'text-danger' : 'text-success'}>
                            {formatINR(inv.balanceDue)}
                          </span>
                        </td>
                        <td className="text-center">
                          <Badge
                            variant={
                              inv.status === 'Paid'
                                ? 'success'
                                : inv.status === 'Partially Paid'
                                ? 'warning'
                                : inv.status === 'Overdue'
                                ? 'danger'
                                : 'default'
                            }
                            size="sm"
                            dot
                          >
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <div className="portal-action-btns">
                            {inv.balanceDue > 0 && (
                              <Button
                                variant="primary"
                                size="sm"
                                icon={PayIcon}
                                onClick={() => handleOpenPayModal(inv)}
                                title="Pay outstanding balance"
                              >
                                Pay Now
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Download}
                              onClick={() => invoiceAPI.downloadPDF(inv._id, inv.invoiceNumber)}
                              title="Download A4 PDF"
                            >
                              PDF
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={ExternalLink}
                              onClick={() => navigate(`/invoices/${inv._id}`)}
                              title="View Details"
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PAYMENT HISTORY                                    */}
      {/* ========================================================= */}
      {activeTab === 'payments' && (
        <div className="portal-tab-content">
          <Card padding="none" className="table-card">
            <div className="table-responsive">
              <table className="portal-master-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Invoice #</th>
                    <th>Payment Date</th>
                    <th>Payment Method</th>
                    <th>Transaction Reference / UTR</th>
                    <th style={{ textAlign: 'right' }}>Amount Paid</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No payment records found.
                      </td>
                    </tr>
                  ) : (
                    paymentsList.map((p) => (
                      <tr key={p._id}>
                        <td className="font-mono font-bold text-primary">{p.paymentNumber}</td>
                        <td className="font-mono font-medium">{p.invoiceNumber}</td>
                        <td className="text-muted text-sm">{formatDate(p.paymentDate)}</td>
                        <td>
                          <Badge variant="primary" size="sm">{p.paymentMethod}</Badge>
                        </td>
                        <td className="font-mono text-xs text-muted">
                          {p.transactionReference || '—'}
                        </td>
                        <td className="text-right font-bold text-success">{formatINR(p.amount)}</td>
                        <td className="text-center">
                          <Badge variant="success" size="sm" dot>Completed</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: CREDIT NOTES                                       */}
      {/* ========================================================= */}
      {activeTab === 'credit-notes' && (
        <div className="portal-tab-content">
          <Card padding="none" className="table-card">
            <div className="table-responsive">
              <table className="portal-master-table">
                <thead>
                  <tr>
                    <th>Credit Note #</th>
                    <th>Original Invoice #</th>
                    <th>Date Issued</th>
                    <th>Reason</th>
                    <th style={{ textAlign: 'right' }}>Credit Amount</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {creditNotesList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No credit notes issued for your account.
                      </td>
                    </tr>
                  ) : (
                    creditNotesList.map((cn) => (
                      <tr key={cn._id}>
                        <td className="font-mono font-bold text-amber">{cn.creditNoteNumber}</td>
                        <td className="font-mono font-medium">{cn.invoiceNumber}</td>
                        <td className="text-muted text-sm">{formatDate(cn.creditNoteDate)}</td>
                        <td>
                          <Badge variant="warning" size="sm">{cn.reason}</Badge>
                        </td>
                        <td className="text-right font-bold text-amber">- {formatINR(cn.amount)}</td>
                        <td className="text-center">
                          <Badge variant="success" size="sm" dot>{cn.status || 'Issued'}</Badge>
                        </td>
                        <td className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Download}
                            onClick={() => creditNoteAPI.downloadPDF(cn._id, cn.creditNoteNumber)}
                            title="Download Credit Note PDF"
                          >
                            PDF
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: ACCOUNT STATEMENT                                  */}
      {/* ========================================================= */}
      {activeTab === 'statement' && (
        <div className="portal-tab-content">
          <Card padding="normal" className="filters-card no-print">
            <div className="portal-statement-header">
              <div className="filter-date-group">
                <div className="filter-date-wrap">
                  <span className="filter-label">From:</span>
                  <input
                    type="date"
                    value={statementStartDate}
                    onChange={(e) => setStatementStartDate(e.target.value)}
                    className="filter-date-input"
                  />
                </div>
                <div className="filter-date-wrap">
                  <span className="filter-label">To:</span>
                  <input
                    type="date"
                    value={statementEndDate}
                    onChange={(e) => setStatementEndDate(e.target.value)}
                    className="filter-date-input"
                  />
                </div>
              </div>

              <div className="statement-action-buttons">
                <Button
                  variant="outline"
                  icon={Download}
                  onClick={handleExportStatementCSV}
                >
                  Export CSV
                </Button>
                <Button
                  variant="primary"
                  icon={Printer}
                  onClick={() => window.print()}
                >
                  Print Statement
                </Button>
              </div>
            </div>
          </Card>

          {/* Statement Balance Summary */}
          <div className="statement-summary-strip">
            <div className="statement-box">
              <span className="s-lbl">Opening Balance</span>
              <span className="s-val">{formatINR(statementData.openingBalance)}</span>
            </div>
            <div className="statement-box">
              <span className="s-lbl">Invoices (Debits)</span>
              <span className="s-val text-primary">+ {formatINR(statementData.totalDebits)}</span>
            </div>
            <div className="statement-box">
              <span className="s-lbl">Payments & Credits</span>
              <span className="s-val text-success">- {formatINR(statementData.totalCredits)}</span>
            </div>
            <div className="statement-box highlight-box">
              <span className="s-lbl">Closing Outstanding</span>
              <span className={`s-val font-extrabold ${statementData.closingBalance > 0 ? 'text-danger' : 'text-success'}`}>
                {formatINR(statementData.closingBalance)}
              </span>
            </div>
          </div>

          {/* Statement Ledger Table */}
          <Card padding="none" className="table-card">
            <div className="table-responsive">
              <table className="portal-master-table statement-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Reference #</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Debit (₹)</th>
                    <th style={{ textAlign: 'right' }}>Credit (₹)</th>
                    <th style={{ textAlign: 'right' }}>Running Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="statement-opening-row">
                    <td className="text-muted">{statementStartDate ? formatDate(statementStartDate) : 'Start'}</td>
                    <td><Badge variant="default" size="sm">Opening</Badge></td>
                    <td className="font-mono text-muted">—</td>
                    <td className="font-semibold text-muted">Opening Balance Carried Forward</td>
                    <td className="text-right text-muted">—</td>
                    <td className="text-right text-muted">—</td>
                    <td className="text-right font-bold">{formatINR(statementData.openingBalance)}</td>
                  </tr>

                  {statementData.ledger.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No transactions recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    statementData.ledger.map((entry, idx) => (
                      <tr key={idx}>
                        <td className="text-muted text-sm">{formatDate(entry.date)}</td>
                        <td>
                          <Badge
                            variant={
                              entry.type === 'Invoice'
                                ? 'primary'
                                : entry.type === 'Payment'
                                ? 'success'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {entry.type}
                          </Badge>
                        </td>
                        <td className="font-mono font-semibold">{entry.reference}</td>
                        <td className="text-sm">{entry.description}</td>
                        <td className="text-right font-semibold text-dark">
                          {entry.debit > 0 ? formatINR(entry.debit) : '—'}
                        </td>
                        <td className="text-right font-semibold text-success">
                          {entry.credit > 0 ? formatINR(entry.credit) : '—'}
                        </td>
                        <td className={`text-right font-bold ${entry.runningBalance > 0 ? 'text-danger' : 'text-success'}`}>
                          {formatINR(entry.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}

                  <tr className="statement-closing-row">
                    <td colSpan="4" className="text-right font-bold">
                      CLOSING BALANCE DUE:
                    </td>
                    <td className="text-right font-bold text-dark">{formatINR(statementData.totalDebits)}</td>
                    <td className="text-right font-bold text-success">{formatINR(statementData.totalCredits)}</td>
                    <td className={`text-right font-extrabold text-base ${statementData.closingBalance > 0 ? 'text-danger' : 'text-success'}`}>
                      {formatINR(statementData.closingBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: BILLING PROFILE & PERMITTED UPDATES                */}
      {/* ========================================================= */}
      {activeTab === 'profile' && (
        <div className="portal-tab-content">
          <Card padding="normal" className="profile-edit-card">
            <Card.Header
              title="Update Permitted Billing Details"
              subtitle="Keep your company contact and invoicing address accurate"
            />
            <Card.Body>
              <form onSubmit={handleUpdateProfile}>
                <div className="profile-form-grid">
                  <Input
                    label="Account Name (Primary Contact)"
                    value={summary.profile.name}
                    disabled
                    helperText="Contact system administrator to change primary identity"
                  />

                  <Input
                    label="Email Address (Login ID)"
                    value={summary.profile.email}
                    disabled
                    helperText="Official verified billing email"
                  />

                  <Input
                    label="Company Name"
                    value={profileCompany}
                    onChange={(e) => setProfileCompany(e.target.value)}
                    placeholder="e.g. Global Tech Solutions"
                    required
                  />

                  <Input
                    label="Phone Number"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>

                <h4 className="section-divider-title mt-4">Invoicing Billing Address</h4>

                <div className="address-form-grid">
                  <div style={{ gridColumn: 'span 2' }}>
                    <Input
                      label="Street Address / Suite / Tech Park"
                      value={profileStreet}
                      onChange={(e) => setProfileStreet(e.target.value)}
                      placeholder="e.g. 450 Innovation Parkway, Suite 300"
                      required
                    />
                  </div>

                  <Input
                    label="City"
                    value={profileCity}
                    onChange={(e) => setProfileCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    required
                  />

                  <Input
                    label="State"
                    value={profileState}
                    onChange={(e) => setProfileState(e.target.value)}
                    placeholder="e.g. Karnataka"
                    required
                  />

                  <Input
                    label="Postal PIN Code"
                    value={profilePostal}
                    onChange={(e) => setProfilePostal(e.target.value)}
                    placeholder="560100"
                    required
                  />

                  <Input
                    label="Country"
                    value="India"
                    disabled
                  />
                </div>

                <div className="profile-btn-row mt-4">
                  <Button
                    variant="primary"
                    type="submit"
                    icon={Save}
                    loading={savingProfile}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. MODAL: PAY DUE INVOICE                                 */}
      {/* ========================================================= */}
      {isPayModalOpen && selectedPayInvoice && (
        <div className="modal-backdrop no-print" onClick={() => setIsPayModalOpen(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-box icon-blue-bg">
                  <PayIcon size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="modal-title">Settle Due Invoice</h3>
                  <p className="modal-subtitle">
                    Invoice #{selectedPayInvoice.invoiceNumber} • Due: {formatDate(selectedPayInvoice.dueDate)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsPayModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment}>
              <div className="modal-body">
                {payError && (
                  <Alert
                    type="error"
                    message={payError}
                    onClose={() => setPayError('')}
                    className="mb-3"
                  />
                )}

                {/* Summary Strip */}
                <div className="pay-summary-strip">
                  <div className="pay-sum-item">
                    <span className="pay-sum-label">Invoice Total</span>
                    <span className="pay-sum-val">{formatINR(selectedPayInvoice.totalAmount)}</span>
                  </div>
                  <div className="pay-sum-item">
                    <span className="pay-sum-label">Already Paid</span>
                    <span className="pay-sum-val text-success">
                      {formatINR(selectedPayInvoice.paidAmount || 0)}
                    </span>
                  </div>
                  <div className="pay-sum-item highlight">
                    <span className="pay-sum-label">Balance Outstanding</span>
                    <span className="pay-sum-val text-danger">
                      {formatINR(selectedPayInvoice.balanceDue)}
                    </span>
                  </div>
                </div>

                {/* Payment Amount */}
                <div className="pay-form-group">
                  <div className="pay-amount-label-row">
                    <label className="input-label">Payment Amount (₹) *</label>
                    <div className="quick-amount-btns">
                      <button
                        type="button"
                        className="quick-amt-btn"
                        onClick={() => setPayAmount(selectedPayInvoice.balanceDue)}
                      >
                        Full Balance
                      </button>
                      <button
                        type="button"
                        className="quick-amt-btn"
                        onClick={() =>
                          setPayAmount(Math.round(selectedPayInvoice.balanceDue / 2))
                        }
                      >
                        50% Partial
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={selectedPayInvoice.balanceDue}
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="pay-input font-bold"
                    required
                  />
                  <span className="text-xs text-muted mt-1 block">
                    You can pay the full remaining amount or enter a partial settlement (min ₹1.00).
                  </span>
                </div>

                {/* Payment Method & UTR / Reference */}
                <div className="modal-row-2 mt-3">
                  <div className="pay-form-group">
                    <label className="input-label">Payment Method *</label>
                    <select
                      value={payMethod}
                      onChange={(e) => {
                        setPayMethod(e.target.value);
                      }}
                      className="filter-select w-full"
                    >
                      <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                      <option value="Credit/Debit Card">Credit / Debit Card</option>
                      <option value="Cash">Cash Settlement</option>
                    </select>
                  </div>

                  <div className="pay-form-group">
                    <div className="flex justify-between items-center mb-1">
                      <label className="input-label mb-0">Transaction Ref / UTR *</label>
                      <button
                        type="button"
                        className="text-xs text-primary font-semibold hover:underline"
                        onClick={handleGenerateRef}
                      >
                        Auto-Gen UTR
                      </button>
                    </div>
                    <input
                      type="text"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      placeholder="e.g. UPI-982374619"
                      className="pay-input font-mono text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="pay-form-group mt-3">
                  <label className="input-label">Payment Notes (Optional)</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="e.g. Month-end invoice settlement"
                    className="pay-input"
                  />
                </div>

                {/* Academic Simulation Demo Notice */}
                <div className="academic-demo-alert mt-4">
                  <ShieldCheck size={18} className="academic-demo-icon" />
                  <div className="academic-demo-content">
                    <span className="academic-demo-title">Academic Demonstration Mode</span>
                    <p className="academic-demo-text">
                      Real monetary transactions are safely simulated for academic evaluation. Submitting this settlement reconciles genuine ledger accounts, updates invoice balance, and issues an official receipt.
                    </p>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  icon={PayIcon}
                  loading={paySubmitting}
                >
                  Confirm & Pay {formatINR(payAmount)}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. MODAL: OFFICIAL PAYMENT RECEIPT SLIP                   */}
      {/* ========================================================= */}
      {receiptModalOpen && currentReceipt && (
        <div className="modal-backdrop" onClick={() => setReceiptModalOpen(false)}>
          <div
            className="modal-dialog modal-receipt"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="receipt-print-wrapper" id="printable-receipt">
              <div className="receipt-header">
                <div className="receipt-logo-title">
                  <div className="receipt-logo-box">
                    <ShieldCheck size={26} color="#FFFFFF" />
                  </div>
                  <div>
                    <h3 className="receipt-title">BillFlow</h3>
                    <span className="receipt-subtitle">Official Payment Receipt</span>
                  </div>
                </div>
                <div className="receipt-badge-status">
                  <Badge variant="success" size="lg" dot>
                    Settled & Verified
                  </Badge>
                </div>
              </div>

              <div className="receipt-body">
                <div className="receipt-amount-banner">
                  <span className="receipt-amt-label">Amount Paid</span>
                  <span className="receipt-amt-value font-mono">
                    {formatINR(currentReceipt.amountPaid)}
                  </span>
                  <span className="receipt-amt-sub text-success">
                    ✓ Transaction Reconciled Successfully
                  </span>
                </div>

                <div className="receipt-details-grid">
                  <div className="receipt-field">
                    <span className="r-label">Receipt Number</span>
                    <span className="r-val font-mono font-bold text-primary">
                      {currentReceipt.receiptNumber}
                    </span>
                  </div>

                  <div className="receipt-field">
                    <span className="r-label">Invoice Reference</span>
                    <span className="r-val font-mono font-bold">
                      {currentReceipt.invoiceNumber}
                    </span>
                  </div>

                  <div className="receipt-field">
                    <span className="r-label">Payment Date & Time</span>
                    <span className="r-val">
                      {new Date(currentReceipt.paymentDate).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>

                  <div className="receipt-field">
                    <span className="r-label">Payment Mode</span>
                    <span className="r-val font-semibold">{currentReceipt.paymentMethod}</span>
                  </div>

                  <div className="receipt-field">
                    <span className="r-label">Transaction Reference (UTR)</span>
                    <span className="r-val font-mono text-sm">{currentReceipt.transactionReference}</span>
                  </div>

                  <div className="receipt-field">
                    <span className="r-label">Remaining Balance Due</span>
                    <span className="r-val font-bold">
                      <span className={currentReceipt.remainingBalance > 0 ? 'text-danger' : 'text-success'}>
                        {formatINR(currentReceipt.remainingBalance)}
                      </span>
                    </span>
                  </div>

                  <div className="receipt-field">
                    <span className="r-label">Billed To (Customer)</span>
                    <span className="r-val font-semibold">{currentReceipt.customerName || user?.name}</span>
                  </div>

                  <div className="receipt-field">
                    <span className="r-label">Issued By (Organization)</span>
                    <span className="r-val font-semibold">{currentReceipt.businessName || 'BillFlow Organization'}</span>
                  </div>
                </div>

                <div className="receipt-footer-note">
                  <p className="text-xs text-muted text-center">
                    This is a computer-generated billing payment receipt. Validated under B.Tech Project Demonstration Architecture.
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer no-print">
              <Button
                variant="outline"
                icon={Printer}
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
              <Button
                variant="primary"
                onClick={() => setReceiptModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPortal;
