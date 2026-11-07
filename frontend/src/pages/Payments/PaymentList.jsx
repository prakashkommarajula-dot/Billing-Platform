import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Calendar,
  Eye,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Receipt,
  User,
  Building,
  ArrowRight,
  DollarSign,
  Wallet,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { paymentAPI, invoiceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { Input } from '../../components/common/Input';
import './payments.css';

// Currency Formatter in INR
const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
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

export const PaymentList = () => {
  const navigate = useNavigate();
  const { user, isCustomer } = useAuth();

  // Data States
  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState({
    totalCollected: 0,
    totalTransactions: 0,
    byMethod: { upi: 0, bankTransfer: 0, card: 0, cash: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Eligible Invoices for Recording Payment
  const [eligibleInvoices, setEligibleInvoices] = useState([]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Record Payment Form Fields
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedInvoiceObj, setSelectedInvoiceObj] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch Payments from Backend API
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit,
        search: searchTerm,
        paymentMethod: selectedMethod,
        status: selectedStatus,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await paymentAPI.getAll(params);
      if (res.success) {
        setPayments(res.payments || []);
        if (res.metrics) setMetrics(res.metrics);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalCount(res.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('Fetch payments error:', err);
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedMethod, selectedStatus, startDate, endDate]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Load eligible invoices when opening Record Payment modal
  const handleOpenRecordModal = async () => {
    setFormError('');
    setSelectedInvoiceId('');
    setSelectedInvoiceObj(null);
    setPayAmount('');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayMethod('Bank Transfer');
    setTransactionRef('');
    setPayNotes('');

    try {
      const res = await paymentAPI.getEligibleInvoices();
      if (res.success && res.invoices) {
        setEligibleInvoices(res.invoices);
      }
    } catch (err) {
      console.warn('Could not load eligible invoices:', err);
    }
    setIsRecordModalOpen(true);
  };

  // Handle invoice selection change in modal
  const handleSelectInvoice = (e) => {
    const invId = e.target.value;
    setSelectedInvoiceId(invId);
    setFormError('');

    if (!invId) {
      setSelectedInvoiceObj(null);
      setPayAmount('');
      return;
    }

    const inv = eligibleInvoices.find((i) => i._id === invId);
    if (inv) {
      setSelectedInvoiceObj(inv);
      // Pre-fill with outstanding balance
      setPayAmount(inv.balanceDue > 0 ? inv.balanceDue : '');
    }
  };

  // Submit Record Payment
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedInvoiceId) {
      setFormError('Please choose an invoice to apply this payment.');
      return;
    }

    const numAmount = Number(payAmount);
    if (!numAmount || numAmount <= 0) {
      setFormError('Payment amount must be greater than zero.');
      return;
    }

    if (selectedInvoiceObj && numAmount > selectedInvoiceObj.balanceDue) {
      setFormError(
        `Payment amount of ${formatINR(numAmount)} exceeds remaining invoice balance of ${formatINR(
          selectedInvoiceObj.balanceDue
        )}. Overpayment is not permitted.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        invoice: selectedInvoiceId,
        amount: numAmount,
        paymentDate: payDate,
        paymentMethod: payMethod,
        transactionReference: transactionRef.trim(),
        notes: payNotes.trim(),
      };

      const res = await paymentAPI.record(payload);
      if (res.success) {
        setSuccessMessage(res.message || 'Payment logged successfully!');
        setIsRecordModalOpen(false);
        fetchPayments();
      }
    } catch (err) {
      console.error('Record payment error:', err);
      setFormError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Receipt Modal
  const handleOpenReceipt = (payment) => {
    setSelectedReceipt(payment);
    setIsReceiptModalOpen(true);
  };

  // Helper for Payment Method Badges
  const getMethodBadgeVariant = (method) => {
    switch (method) {
      case 'UPI':
        return 'primary';
      case 'Bank Transfer':
      case 'Net Banking':
        return 'info';
      case 'Card':
      case 'Credit Card':
      case 'Debit Card':
        return 'warning';
      case 'Cash':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <div className="payments-page-content">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & METRIC CARDS                              */}
      {/* ========================================================= */}
      <div className="payments-header-row">
        <div>
          <h2 className="payments-main-title">Payment Management</h2>
          <p className="payments-sub-title">
            Track customer settlements, record incoming transactions, and reconcile invoice receivables.
          </p>
        </div>

        <div className="payments-header-actions">
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={fetchPayments}
            title="Refresh payment transactions"
          >
            Refresh
          </Button>

          {!isCustomer && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleOpenRecordModal}
            >
              Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* Top Metric Summary Cards */}
      <div className="payments-metrics-grid">
        <div className="payment-summary-chip chip-total">
          <div className="chip-icon-box icon-primary">
            <DollarSign size={22} />
          </div>
          <div className="chip-details">
            <span className="chip-label">Total Collections</span>
            <span className="chip-val text-primary">{formatINR(metrics.totalCollected)}</span>
            <span className="chip-sub">{metrics.totalTransactions} transactions recorded</span>
          </div>
        </div>

        <div className="payment-summary-chip chip-upi">
          <div className="chip-icon-box icon-upi">
            <Wallet size={22} />
          </div>
          <div className="chip-details">
            <span className="chip-label">UPI Settlements</span>
            <span className="chip-val font-semibold">{formatINR(metrics.byMethod?.upi || 0)}</span>
            <span className="chip-sub">Instant digital transfers</span>
          </div>
        </div>

        <div className="payment-summary-chip chip-bank">
          <div className="chip-icon-box icon-bank">
            <Building size={22} />
          </div>
          <div className="chip-details">
            <span className="chip-label">Bank & NEFT / RTGS</span>
            <span className="chip-val font-semibold">{formatINR(metrics.byMethod?.bankTransfer || 0)}</span>
            <span className="chip-sub">Direct wire settlements</span>
          </div>
        </div>

        <div className="payment-summary-chip chip-card">
          <div className="chip-icon-box icon-card">
            <CreditCard size={22} />
          </div>
          <div className="chip-details">
            <span className="chip-label">Card & Cash</span>
            <span className="chip-val font-semibold">
              {formatINR((metrics.byMethod?.card || 0) + (metrics.byMethod?.cash || 0))}
            </span>
            <span className="chip-sub">POS & physical tender</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage('')}
          className="mb-4"
        />
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
          className="mb-4"
        />
      )}

      {/* ========================================================= */}
      {/* 2. SEARCH & MULTI-CRITERIA FILTER BAR                     */}
      {/* ========================================================= */}
      <Card padding="normal" className="filters-card">
        <div className="payments-filters-grid">
          {/* Search Field */}
          <div className="search-input-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Payment ID, Invoice #, Customer, or UTR..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-field"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Payment Method Filter */}
          <div className="filter-dropdown-wrap">
            <span className="filter-label">Method:</span>
            <select
              value={selectedMethod}
              onChange={(e) => {
                setSelectedMethod(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="All">All Methods</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date Range Filters */}
          <div className="filter-date-wrap">
            <span className="filter-label">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-date-input"
            />
          </div>

          <div className="filter-date-wrap">
            <span className="filter-label">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-date-input"
            />
          </div>

          {(searchTerm || selectedMethod !== 'All' || startDate || endDate) && (
            <button
              type="button"
              className="clear-all-filters-btn"
              onClick={() => {
                setSearchTerm('');
                setSelectedMethod('All');
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* ========================================================= */}
      {/* 3. MASTER PAYMENTS TABLE                                  */}
      {/* ========================================================= */}
      <Card padding="none" className="table-card">
        <div className="table-responsive">
          <table className="payments-master-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Invoice #</th>
                <th>Customer Name</th>
                <th>Payment Date</th>
                <th style={{ textAlign: 'right' }}>Amount Paid</th>
                <th style={{ textAlign: 'center' }}>Method</th>
                <th>Transaction Ref / UTR</th>
                <th>Recorded By</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-5">
                    <div className="loading-spinner-wrap">
                      <RefreshCw className="animate-spin text-primary" size={24} />
                      <span className="ml-2 font-medium">Loading payment transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5">
                    <div className="empty-state-box">
                      <Receipt size={36} className="text-muted mb-2" />
                      <h4 className="font-semibold text-dark">No Payment Transactions Found</h4>
                      <p className="text-xs text-muted mt-1">
                        {searchTerm || selectedMethod !== 'All'
                          ? 'Try adjusting your search query or filter criteria.'
                          : 'Record your first incoming customer payment using the button above.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="payment-row">
                    {/* Payment ID */}
                    <td className="font-mono font-semibold text-primary">
                      <button
                        type="button"
                        className="pay-id-link"
                        onClick={() => handleOpenReceipt(p)}
                        title="View Payment Receipt"
                      >
                        {p.paymentNumber}
                      </button>
                    </td>

                    {/* Invoice Number */}
                    <td className="font-mono font-medium">
                      {p.invoice?._id ? (
                        <button
                          type="button"
                          className="inv-link-text"
                          onClick={() => navigate(`/invoices/${p.invoice._id}`)}
                          title="View Invoice Details"
                        >
                          {p.invoiceNumber}
                        </button>
                      ) : (
                        <span>{p.invoiceNumber}</span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="font-medium">
                      <span>{p.customerName}</span>
                    </td>

                    {/* Payment Date */}
                    <td className="text-sm text-muted">
                      {formatDate(p.paymentDate)}
                    </td>

                    {/* Payment Amount */}
                    <td className="text-right font-bold text-success font-mono">
                      {formatINR(p.amount)}
                    </td>

                    {/* Payment Method */}
                    <td className="text-center">
                      <Badge variant={getMethodBadgeVariant(p.paymentMethod)} size="sm">
                        {p.paymentMethod}
                      </Badge>
                    </td>

                    {/* Transaction Reference */}
                    <td className="text-xs font-mono text-muted">
                      {p.transactionReference ? (
                        <span className="ref-pill" title={p.transactionReference}>
                          {p.transactionReference}
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                    {/* Recorded By */}
                    <td className="text-xs text-muted">
                      <div className="recorded-by-cell">
                        <User size={13} className="text-muted" />
                        <span>{p.recordedByName || p.recordedBy?.name || 'Staff'}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="text-center">
                      <div className="action-buttons-wrap">
                        <button
                          type="button"
                          className="action-icon-btn action-view"
                          onClick={() => handleOpenReceipt(p)}
                          title="View & Print Payment Receipt"
                        >
                          <Eye size={15} />
                        </button>
                        {p.invoice?._id && (
                          <button
                            type="button"
                            className="action-icon-btn action-invoice"
                            onClick={() => navigate(`/invoices/${p.invoice._id}`)}
                            title="Go to Related Invoice"
                          >
                            <ExternalLink size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!loading && totalPages > 1 && (
          <div className="pagination-bar">
            <span className="pagination-info">
              Showing {(currentPage - 1) * limit + 1} to{' '}
              {Math.min(currentPage * limit, totalCount)} of {totalCount} records
            </span>
            <div className="pagination-controls">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="page-current">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={ChevronRight}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ========================================================= */}
      {/* 4. MODAL: RECORD PAYMENT                                  */}
      {/* ========================================================= */}
      {isRecordModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsRecordModalOpen(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-box">
                  <CreditCard size={20} color="var(--primary-blue)" />
                </div>
                <div>
                  <h3 className="modal-title">Record Incoming Payment</h3>
                  <p className="modal-subtitle">
                    Select an unpaid invoice and log payment transaction
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsRecordModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment}>
              <div className="modal-body">
                {formError && (
                  <Alert type="error" message={formError} className="mb-3" />
                )}

                {/* 1. Select Invoice */}
                <div className="input-group">
                  <label className="input-label" htmlFor="select-invoice">
                    Select Invoice <span className="input-required-star">*</span>
                  </label>
                  <div className="input-wrapper">
                    <select
                      id="select-invoice"
                      value={selectedInvoiceId}
                      onChange={handleSelectInvoice}
                      className="input-field"
                      required
                    >
                      <option value="">-- Choose Unpaid or Partially Paid Invoice --</option>
                      {eligibleInvoices.map((inv) => (
                        <option key={inv._id} value={inv._id}>
                          {inv.invoiceNumber} • {inv.customerName} (Due: {formatINR(inv.balanceDue)})
                        </option>
                      ))}
                    </select>
                  </div>
                  {eligibleInvoices.length === 0 && (
                    <span className="text-xs text-muted mt-1">
                      No unpaid invoices available. All invoices are currently settled!
                    </span>
                  )}
                </div>

                {/* Selected Invoice Snapshot Card */}
                {selectedInvoiceObj && (
                  <div className="invoice-preview-chip">
                    <div className="chip-row">
                      <span className="chip-meta-label">Customer:</span>
                      <span className="chip-meta-val font-semibold">
                        {selectedInvoiceObj.customerName}
                      </span>
                    </div>
                    <div className="chip-row">
                      <span className="chip-meta-label">Total Invoiced:</span>
                      <span className="chip-meta-val">
                        {formatINR(selectedInvoiceObj.totalAmount)}
                      </span>
                    </div>
                    <div className="chip-row">
                      <span className="chip-meta-label">Current Outstanding:</span>
                      <span className="chip-meta-val font-bold text-danger">
                        {formatINR(selectedInvoiceObj.balanceDue)}
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Payment Amount & Date */}
                <div className="modal-row-2">
                  <Input
                    label="Payment Amount (₹)"
                    type="number"
                    min="0.01"
                    step="any"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    icon={Receipt}
                    helperText={
                      selectedInvoiceObj
                        ? `Max allowable: ${formatINR(selectedInvoiceObj.balanceDue)}`
                        : ''
                    }
                    required
                  />

                  <Input
                    label="Payment Date"
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    icon={Calendar}
                    required
                  />
                </div>

                {/* 3. Payment Method & Transaction Reference */}
                <div className="modal-row-2">
                  <div className="input-group">
                    <label className="input-label" htmlFor="pay-method">
                      Payment Method <span className="input-required-star">*</span>
                    </label>
                    <div className="input-wrapper">
                      <select
                        id="pay-method"
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value)}
                        className="input-field"
                        required
                      >
                        <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                        <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                        <option value="Card">Card (Credit / Debit)</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <Input
                    label="Transaction Reference / UTR"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UTR-98234123"
                    helperText="Unique reference to prevent duplicate logging"
                  />
                </div>

                {/* 4. Notes */}
                <div className="input-group">
                  <label className="input-label" htmlFor="pay-notes">
                    Payment Notes / Remarks
                  </label>
                  <div className="input-wrapper">
                    <input
                      id="pay-notes"
                      type="text"
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      placeholder="Optional remarks (e.g. Cleared via HDFC Bank)"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  icon={CheckCircle2}
                  loading={submitting}
                >
                  Confirm & Process Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: PAYMENT RECEIPT PREVIEW SLIP                    */}
      {/* ========================================================= */}
      {isReceiptModalOpen && selectedReceipt && (
        <div className="modal-backdrop" onClick={() => setIsReceiptModalOpen(false)}>
          <div
            className="modal-card receipt-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header no-print">
              <div className="modal-title-wrap">
                <div className="modal-icon-box">
                  <Receipt size={20} color="var(--primary-blue)" />
                </div>
                <div>
                  <h3 className="modal-title">Payment Receipt</h3>
                  <p className="modal-subtitle">{selectedReceipt.paymentNumber}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Printer}
                  onClick={() => window.print()}
                >
                  Print Receipt
                </Button>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsReceiptModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Receipt Printable Sheet */}
            <div className="receipt-sheet" id="printable-payment-receipt">
              <div className="receipt-top-banner">
                <div>
                  <h2 className="receipt-brand-title">
                    {user?.companyName || user?.businessName || 'BillFlow Billing Platform'}
                  </h2>
                  <p className="receipt-brand-sub">
                    Official Settlement Receipt • GSTIN: {user?.taxId || '29ABCDE1234F1Z5'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="receipt-status-stamp">PAYMENT RECEIVED</div>
                  <div className="receipt-num font-mono">{selectedReceipt.paymentNumber}</div>
                </div>
              </div>

              <div className="receipt-divider" />

              <div className="receipt-info-grid">
                <div>
                  <span className="receipt-label">RECEIVED FROM:</span>
                  <div className="receipt-client-name font-bold">{selectedReceipt.customerName}</div>
                  <span className="receipt-label mt-2">APPLIED TO INVOICE:</span>
                  <div className="font-mono font-semibold text-primary">{selectedReceipt.invoiceNumber}</div>
                </div>
                <div className="text-right">
                  <div className="receipt-meta-row">
                    <span className="receipt-label">Payment Date:</span>
                    <span className="font-semibold">{formatDate(selectedReceipt.paymentDate)}</span>
                  </div>
                  <div className="receipt-meta-row">
                    <span className="receipt-label">Payment Method:</span>
                    <span className="font-semibold">{selectedReceipt.paymentMethod}</span>
                  </div>
                  {selectedReceipt.transactionReference && (
                    <div className="receipt-meta-row">
                      <span className="receipt-label">Transaction Ref:</span>
                      <span className="font-mono text-xs">{selectedReceipt.transactionReference}</span>
                    </div>
                  )}
                  <div className="receipt-meta-row">
                    <span className="receipt-label">Logged By:</span>
                    <span>{selectedReceipt.recordedByName || 'Authorized Staff'}</span>
                  </div>
                </div>
              </div>

              <div className="receipt-amount-box">
                <span className="receipt-amount-label">AMOUNT RECEIVED (INR):</span>
                <span className="receipt-amount-large font-mono font-extrabold text-success">
                  {formatINR(selectedReceipt.amount)}
                </span>
              </div>

              {selectedReceipt.notes && (
                <div className="receipt-notes-box">
                  <span className="receipt-label">REMARKS:</span>
                  <p className="text-xs text-muted mt-1">{selectedReceipt.notes}</p>
                </div>
              )}

              <div className="receipt-footer">
                <p>This is a computer-generated payment acknowledgement receipt issued under BillFlow Billing Platform.</p>
                <p>Payment ID: {selectedReceipt._id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentList;
