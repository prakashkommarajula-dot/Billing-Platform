import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileMinus,
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
  ExternalLink,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { creditNoteAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { Input } from '../../components/common/Input';
import './credit-notes.css';

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

export const CreditNoteList = () => {
  const navigate = useNavigate();
  const { user, isCustomer } = useAuth();

  // Data States
  const [creditNotes, setCreditNotes] = useState([]);
  const [metrics, setMetrics] = useState({
    totalCreditAmount: 0,
    totalCount: 0,
    activeCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Eligible Invoices for Issuing Credit Note
  const [eligibleInvoices, setEligibleInvoices] = useState([]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReason, setSelectedReason] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedCN, setSelectedCN] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Form Fields
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedInvoiceObj, setSelectedInvoiceObj] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [cnDate, setCnDate] = useState(new Date().toISOString().split('T')[0]);
  const [cnReason, setCnReason] = useState('Price Adjustment');
  const [cnDescription, setCnDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch Credit Notes from Backend API
  const fetchCreditNotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit,
        search: searchTerm,
        reason: selectedReason,
        status: selectedStatus,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await creditNoteAPI.getAll(params);
      if (res.success) {
        setCreditNotes(res.creditNotes || []);
        if (res.metrics) setMetrics(res.metrics);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalCount(res.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('Fetch credit notes error:', err);
      setError(err.message || 'Failed to load credit notes');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedReason, selectedStatus, startDate, endDate]);

  useEffect(() => {
    fetchCreditNotes();
  }, [fetchCreditNotes]);

  // Load eligible invoices when opening modal
  const handleOpenCreateModal = async () => {
    setFormError('');
    setSelectedInvoiceId('');
    setSelectedInvoiceObj(null);
    setCreditAmount('');
    setCnDate(new Date().toISOString().split('T')[0]);
    setCnReason('Price Adjustment');
    setCnDescription('');

    try {
      const res = await creditNoteAPI.getEligibleInvoices();
      if (res.success && res.invoices) {
        setEligibleInvoices(res.invoices);
      }
    } catch (err) {
      console.warn('Could not load eligible invoices for credit notes:', err);
    }
    setIsCreateModalOpen(true);
  };

  // Handle invoice selection
  const handleSelectInvoice = (e) => {
    const invId = e.target.value;
    setSelectedInvoiceId(invId);
    setFormError('');

    if (!invId) {
      setSelectedInvoiceObj(null);
      setCreditAmount('');
      return;
    }

    const inv = eligibleInvoices.find((i) => i._id === invId);
    if (inv) {
      setSelectedInvoiceObj(inv);
      // Pre-fill with available balance
      setCreditAmount(inv.balanceDue > 0 ? inv.balanceDue : '');
    }
  };

  // Submit Credit Note Creation
  const handleSubmitCreditNote = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedInvoiceId) {
      setFormError('Please select an invoice to apply this credit note.');
      return;
    }

    const numAmount = Number(creditAmount);
    if (!numAmount || numAmount <= 0) {
      setFormError('Credit amount must be greater than zero.');
      return;
    }

    if (selectedInvoiceObj && numAmount > selectedInvoiceObj.balanceDue) {
      setFormError(
        `Credit amount of ${formatINR(numAmount)} exceeds the available invoice outstanding balance of ${formatINR(
          selectedInvoiceObj.balanceDue
        )}. Credit cannot exceed balance.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        invoice: selectedInvoiceId,
        amount: numAmount,
        creditNoteDate: cnDate,
        reason: cnReason,
        description: cnDescription.trim(),
      };

      const res = await creditNoteAPI.create(payload);
      if (res.success) {
        setSuccessMessage(res.message || 'Credit note generated successfully!');
        setIsCreateModalOpen(false);
        fetchCreditNotes();
      }
    } catch (err) {
      console.error('Create credit note error:', err);
      setFormError(err.message || 'Failed to issue credit note');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Preview Slip Modal
  const handleOpenPreview = (cn) => {
    setSelectedCN(cn);
    setIsPreviewModalOpen(true);
  };

  // Handle Download PDF
  const handleDownloadPDF = async (cn) => {
    setDownloadingPdf(true);
    try {
      await creditNoteAPI.downloadPDF(cn._id, cn.creditNoteNumber);
      setSuccessMessage(`Credit Note ${cn.creditNoteNumber} PDF downloaded.`);
    } catch (err) {
      console.error('PDF download error:', err);
      setError(err.message || 'Failed to download Credit Note PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Reason Badge Variant
  const getReasonBadgeVariant = (reason) => {
    switch (reason) {
      case 'Price Adjustment':
        return 'primary';
      case 'Order Cancellation':
        return 'danger';
      case 'Goods Return':
        return 'warning';
      case 'Correction in Invoice':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <div className="credit-notes-page-content">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & METRICS                                   */}
      {/* ========================================================= */}
      <div className="credit-notes-header-row">
        <div>
          <h2 className="credit-notes-main-title">Credit Notes Management</h2>
          <p className="credit-notes-sub-title">
            Issue downward adjustments, handle returns/cancellations, and reconcile invoice balances under Indian GST rules.
          </p>
        </div>

        <div className="credit-notes-header-actions">
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={fetchCreditNotes}
            title="Refresh Credit Notes"
          >
            Refresh
          </Button>

          {!isCustomer && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleOpenCreateModal}
            >
              Create Credit Note
            </Button>
          )}
        </div>
      </div>

      {/* Summary Metrics Chips */}
      <div className="credit-notes-metrics-grid">
        <div className="cn-summary-chip chip-total">
          <div className="chip-icon-box icon-amber">
            <FileMinus size={22} />
          </div>
          <div className="chip-details">
            <span className="chip-label">Total Credits Issued</span>
            <span className="chip-val text-amber">{formatINR(metrics.totalCreditAmount)}</span>
            <span className="chip-sub">Downward adjustments</span>
          </div>
        </div>

        <div className="cn-summary-chip chip-active">
          <div className="chip-icon-box icon-primary">
            <CheckCircle2 size={22} />
          </div>
          <div className="chip-details">
            <span className="chip-label">Active Credit Notes</span>
            <span className="chip-val font-semibold">{metrics.activeCount} notes</span>
            <span className="chip-sub">Applied against receivables</span>
          </div>
        </div>

        <div className="cn-summary-chip chip-count">
          <div className="chip-icon-box icon-slate">
            <Receipt size={22} />
          </div>
          <div className="chip-details">
            <span className="chip-label">Total Transactions</span>
            <span className="chip-val font-semibold">{metrics.totalCount}</span>
            <span className="chip-sub">All-time credit records</span>
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
      {/* 2. SEARCH & MULTI-CRITERIA FILTERS                        */}
      {/* ========================================================= */}
      <Card padding="normal" className="filters-card">
        <div className="cn-filters-grid">
          {/* Search Field */}
          <div className="search-input-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Credit Note #, Invoice #, Customer, or Reason..."
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

          {/* Reason Filter */}
          <div className="filter-dropdown-wrap">
            <span className="filter-label">Reason:</span>
            <select
              value={selectedReason}
              onChange={(e) => {
                setSelectedReason(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="All">All Reasons</option>
              <option value="Price Adjustment">Price Adjustment</option>
              <option value="Order Cancellation">Order Cancellation</option>
              <option value="Goods Return">Goods Return</option>
              <option value="Correction in Invoice">Correction in Invoice</option>
              <option value="Deficiency in Service">Deficiency in Service</option>
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

          {(searchTerm || selectedReason !== 'All' || startDate || endDate) && (
            <button
              type="button"
              className="clear-all-filters-btn"
              onClick={() => {
                setSearchTerm('');
                setSelectedReason('All');
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
      {/* 3. CREDIT NOTES MASTER TABLE                              */}
      {/* ========================================================= */}
      <Card padding="none" className="table-card">
        <div className="table-responsive">
          <table className="credit-notes-master-table">
            <thead>
              <tr>
                <th>Credit Note #</th>
                <th>Original Invoice #</th>
                <th>Customer Name</th>
                <th>Credit Date</th>
                <th>Reason</th>
                <th style={{ textAlign: 'right' }}>Credit Amount</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="loading-spinner-wrap">
                      <RefreshCw className="animate-spin text-primary" size={24} />
                      <span className="ml-2 font-medium">Loading credit notes...</span>
                    </div>
                  </td>
                </tr>
              ) : creditNotes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="empty-state-box">
                      <FileMinus size={36} className="text-muted mb-2" />
                      <h4 className="font-semibold text-dark">No Credit Notes Found</h4>
                      <p className="text-xs text-muted mt-1">
                        {searchTerm || selectedReason !== 'All'
                          ? 'No matching credit notes found. Try adjusting your search query.'
                          : 'Issue a credit note against an invoice using the button above.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                creditNotes.map((cn) => (
                  <tr key={cn._id} className="cn-row">
                    {/* Credit Note Number */}
                    <td className="font-mono font-bold text-amber">
                      <button
                        type="button"
                        className="cn-id-link"
                        onClick={() => handleOpenPreview(cn)}
                        title="View Credit Note Details & PDF"
                      >
                        {cn.creditNoteNumber}
                      </button>
                    </td>

                    {/* Original Invoice Number */}
                    <td className="font-mono font-medium">
                      {cn.invoice?._id ? (
                        <button
                          type="button"
                          className="inv-link-text"
                          onClick={() => navigate(`/invoices/${cn.invoice._id}`)}
                          title="View Original Invoice"
                        >
                          {cn.invoiceNumber}
                        </button>
                      ) : (
                        <span>{cn.invoiceNumber}</span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="font-medium">
                      <span>{cn.customerName}</span>
                    </td>

                    {/* Credit Date */}
                    <td className="text-sm text-muted">
                      {formatDate(cn.creditNoteDate)}
                    </td>

                    {/* Reason */}
                    <td>
                      <Badge variant={getReasonBadgeVariant(cn.reason)} size="sm">
                        {cn.reason}
                      </Badge>
                    </td>

                    {/* Credit Amount */}
                    <td className="text-right font-mono font-bold text-amber">
                      - {formatINR(cn.amount)}
                    </td>

                    {/* Status */}
                    <td className="text-center">
                      <Badge variant="success" size="sm" dot>
                        {cn.status || 'Issued'}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="text-center">
                      <div className="action-buttons-wrap">
                        {/* View Preview Slip */}
                        <button
                          type="button"
                          className="action-icon-btn action-view"
                          onClick={() => handleOpenPreview(cn)}
                          title="Preview Credit Note Document"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Download PDFKit PDF */}
                        <button
                          type="button"
                          className="action-icon-btn action-download"
                          onClick={() => handleDownloadPDF(cn)}
                          title="Download Credit Note PDF"
                        >
                          <Download size={15} />
                        </button>

                        {/* Go to Invoice */}
                        {cn.invoice?._id && (
                          <button
                            type="button"
                            className="action-icon-btn action-invoice"
                            onClick={() => navigate(`/invoices/${cn.invoice._id}`)}
                            title="Go to Original Invoice"
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
      {/* 4. MODAL: CREATE CREDIT NOTE                              */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-box icon-amber-bg">
                  <FileMinus size={20} color="#D97706" />
                </div>
                <div>
                  <h3 className="modal-title">Create Credit Note</h3>
                  <p className="modal-subtitle">
                    Issue a downward adjustment against an outstanding invoice
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCreditNote}>
              <div className="modal-body">
                {formError && (
                  <Alert type="error" message={formError} className="mb-3" />
                )}

                {/* 1. Select Original Invoice */}
                <div className="input-group">
                  <label className="input-label" htmlFor="cn-select-invoice">
                    Select Original Invoice <span className="input-required-star">*</span>
                  </label>
                  <div className="input-wrapper">
                    <select
                      id="cn-select-invoice"
                      value={selectedInvoiceId}
                      onChange={handleSelectInvoice}
                      className="input-field"
                      required
                    >
                      <option value="">-- Choose Eligible Invoice with Balance --</option>
                      {eligibleInvoices.map((inv) => (
                        <option key={inv._id} value={inv._id}>
                          {inv.invoiceNumber} • {inv.customerName} (Bal: {formatINR(inv.balanceDue)})
                        </option>
                      ))}
                    </select>
                  </div>
                  {eligibleInvoices.length === 0 && (
                    <span className="text-xs text-muted mt-1">
                      No invoices with an outstanding balance available.
                    </span>
                  )}
                </div>

                {/* Customer Details Snapshot */}
                {selectedInvoiceObj && (
                  <div className="cn-preview-chip">
                    <div className="chip-row">
                      <span className="chip-meta-label">Customer / Client:</span>
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
                      <span className="chip-meta-label">Max Available Credit:</span>
                      <span className="chip-meta-val font-bold text-amber">
                        {formatINR(selectedInvoiceObj.balanceDue)}
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Credit Amount & Date */}
                <div className="modal-row-2">
                  <Input
                    label="Credit Amount (₹)"
                    type="number"
                    min="0.01"
                    step="any"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="0.00"
                    icon={Receipt}
                    helperText={
                      selectedInvoiceObj
                        ? `Max allowable credit: ${formatINR(selectedInvoiceObj.balanceDue)}`
                        : ''
                    }
                    required
                  />

                  <Input
                    label="Credit Note Date"
                    type="date"
                    value={cnDate}
                    onChange={(e) => setCnDate(e.target.value)}
                    icon={Calendar}
                    required
                  />
                </div>

                {/* 3. Reason */}
                <div className="input-group">
                  <label className="input-label" htmlFor="cn-reason-select">
                    Reason for Credit Note <span className="input-required-star">*</span>
                  </label>
                  <div className="input-wrapper">
                    <select
                      id="cn-reason-select"
                      value={cnReason}
                      onChange={(e) => setCnReason(e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="Price Adjustment">Price Adjustment / Commercial Discount</option>
                      <option value="Goods Return">Goods Return</option>
                      <option value="Order Cancellation">Order Cancellation</option>
                      <option value="Deficiency in Service">Deficiency in Service</option>
                      <option value="Correction in Invoice">Correction in Invoice</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* 4. Description */}
                <div className="input-group">
                  <label className="input-label" htmlFor="cn-desc">
                    Description & Remarks
                  </label>
                  <div className="input-wrapper">
                    <input
                      id="cn-desc"
                      type="text"
                      value={cnDescription}
                      onChange={(e) => setCnDescription(e.target.value)}
                      placeholder="e.g. Rate adjustment agreed per email dated 05 Nov"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  icon={CheckCircle2}
                  loading={submitting}
                >
                  Issue Credit Note
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: CREDIT NOTE PREVIEW SLIP                        */}
      {/* ========================================================= */}
      {isPreviewModalOpen && selectedCN && (
        <div className="modal-backdrop" onClick={() => setIsPreviewModalOpen(false)}>
          <div
            className="modal-card cn-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header no-print">
              <div className="modal-title-wrap">
                <div className="modal-icon-box icon-amber-bg">
                  <FileMinus size={20} color="#D97706" />
                </div>
                <div>
                  <h3 className="modal-title">Credit Note Preview</h3>
                  <p className="modal-subtitle">{selectedCN.creditNoteNumber}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Download}
                  loading={downloadingPdf}
                  onClick={() => handleDownloadPDF(selectedCN)}
                >
                  Download PDF
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Printer}
                  onClick={() => window.print()}
                >
                  Print
                </Button>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsPreviewModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Credit Note Document */}
            <div className="cn-sheet" id="printable-credit-note">
              <div className="cn-top-banner">
                <div>
                  <h2 className="cn-brand-title">
                    {user?.companyName || user?.businessName || 'BillFlow Billing Platform'}
                  </h2>
                  <p className="cn-brand-sub">
                    Official Credit Note • GSTIN: {user?.taxId || '29ABCDE1234F1Z5'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="cn-status-stamp">CREDIT NOTE</div>
                  <div className="cn-num font-mono">{selectedCN.creditNoteNumber}</div>
                </div>
              </div>

              <div className="cn-divider" />

              <div className="cn-info-grid">
                <div>
                  <span className="cn-label">ISSUED TO (CLIENT):</span>
                  <div className="cn-client-name font-bold">{selectedCN.customerName}</div>
                  <span className="cn-label mt-2">APPLIED TO INVOICE:</span>
                  <div className="font-mono font-semibold text-primary">{selectedCN.invoiceNumber}</div>
                </div>
                <div className="text-right">
                  <div className="cn-meta-row">
                    <span className="cn-label">Credit Note Date:</span>
                    <span className="font-semibold">{formatDate(selectedCN.creditNoteDate)}</span>
                  </div>
                  <div className="cn-meta-row">
                    <span className="cn-label">Reason:</span>
                    <span className="font-semibold">{selectedCN.reason}</span>
                  </div>
                  <div className="cn-meta-row">
                    <span className="cn-label">Authorized By:</span>
                    <span>{selectedCN.recordedByName || 'Authorized Accountant'}</span>
                  </div>
                </div>
              </div>

              {/* Adjustment Particulars Table */}
              <div className="cn-table-wrap">
                <table className="cn-details-table">
                  <thead>
                    <tr>
                      <th>Adjustment Particulars</th>
                      <th style={{ textAlign: 'right' }}>Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCN.invoiceBalanceBeforeCredit > 0 && (
                      <tr>
                        <td>Invoice Balance Before Adjustment</td>
                        <td className="text-right">{formatINR(selectedCN.invoiceBalanceBeforeCredit)}</td>
                      </tr>
                    )}
                    <tr className="cn-highlight-row">
                      <td className="font-bold text-amber">
                        Credit Note Value ({selectedCN.reason})
                      </td>
                      <td className="text-right font-bold text-amber">
                        - {formatINR(selectedCN.amount)}
                      </td>
                    </tr>
                    {selectedCN.invoiceBalanceAfterCredit !== undefined && (
                      <tr>
                        <td className="font-medium">Remaining Invoice Balance Due</td>
                        <td className="text-right font-semibold">
                          {formatINR(selectedCN.invoiceBalanceAfterCredit)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="cn-amount-banner">
                <span className="cn-amount-label">TOTAL CREDIT ADJUSTED:</span>
                <span className="cn-amount-large font-mono font-extrabold text-amber">
                  {formatINR(selectedCN.amount)}
                </span>
              </div>

              {(selectedCN.description || selectedCN.notes) && (
                <div className="cn-notes-box">
                  <span className="cn-label">REMARKS & DESCRIPTION:</span>
                  <p className="text-xs text-muted mt-1">
                    {selectedCN.description || selectedCN.notes}
                  </p>
                </div>
              )}

              <div className="cn-footer">
                <p>This Credit Note is issued in accordance with GST Rules for downward taxable value adjustment.</p>
                <p>Document ID: {selectedCN._id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditNoteList;
