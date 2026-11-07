import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Printer,
  Download,
  CreditCard,
  FileMinus,
  Edit,
  ArrowLeft,
  Calendar,
  Building,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Receipt,
  Check,
  RefreshCw,
  Plus,
  Send,
  X,
  History,
  ShieldCheck,
  Percent,
  ExternalLink,
} from 'lucide-react';
import { invoiceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { Input } from '../../components/common/Input';
import './invoice-details.css';

// Currency Formatter in INR
const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0);
};

// Date Formatter helper
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

export const InvoiceDetails = () => {
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isCustomer } = useAuth();

  const invoiceId = paramId || searchParams.get('id');

  // Main State
  const [invoice, setInvoice] = useState(null);
  const [business, setBusiness] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Available invoices list (if no ID provided or for quick switcher)
  const [recentInvoices, setRecentInvoices] = useState([]);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Credit Note Form State
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('Price Adjustment');
  const [creditNotes, setCreditNotes] = useState('');

  // Fetch Invoice Details and Payment History
  const fetchInvoiceData = async (targetId) => {
    setLoading(true);
    setError('');
    try {
      if (!targetId) {
        // Fetch recent invoices to let user pick one
        const res = await invoiceAPI.getAll({ limit: 10 });
        if (res.success && res.invoices && res.invoices.length > 0) {
          setRecentInvoices(res.invoices);
          // Auto select first invoice
          await loadSingleInvoice(res.invoices[0]._id);
        } else {
          setError('No invoices found in your workspace.');
        }
        return;
      }

      await loadSingleInvoice(targetId);
    } catch (err) {
      console.error('Invoice details load error:', err);
      setError(err.message || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const loadSingleInvoice = async (idToFetch) => {
    const res = await invoiceAPI.getById(idToFetch);
    if (res.success) {
      setInvoice(res.invoice);
      setBusiness(res.business);
      setPaymentAmount(res.invoice.balanceDue > 0 ? res.invoice.balanceDue : '');
      setCreditAmount(res.invoice.balanceDue > 0 ? res.invoice.balanceDue : '');

      // Load payment history
      try {
        const payRes = await invoiceAPI.getPayments(idToFetch);
        if (payRes.success) {
          setPayments(payRes.payments || []);
        }
      } catch (pErr) {
        console.warn('Could not load payments history:', pErr);
      }
    } else {
      setError(res.message || 'Invoice not found');
    }
  };

  useEffect(() => {
    fetchInvoiceData(invoiceId);
  }, [invoiceId]);

  // Handle PDF Download
  const handleDownloadPDF = async () => {
    if (!invoice) return;
    setDownloadingPdf(true);
    try {
      await invoiceAPI.downloadPDF(invoice._id, invoice.invoiceNumber);
      setSuccessMessage('Invoice PDF generated and downloaded successfully.');
    } catch (err) {
      console.error('PDF download error:', err);
      setError(err.message || 'Failed to download PDF invoice.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Handle Record Payment Submit
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await invoiceAPI.recordPayment(invoice._id, {
        amount: amt,
        paymentDate,
        paymentMethod,
        transactionReference: transactionRef,
        notes: paymentNotes,
      });

      if (res.success) {
        setSuccessMessage(res.message || 'Payment recorded successfully!');
        setIsPaymentModalOpen(false);
        setPaymentNotes('');
        setTransactionRef('');
        // Refresh invoice and payments
        await loadSingleInvoice(invoice._id);
      }
    } catch (err) {
      console.error('Record payment error:', err);
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Create Credit Note Submit
  const handleCreditNoteSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const amt = Number(creditAmount);
    if (!amt || amt <= 0) {
      setError('Please enter a valid credit amount.');
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await invoiceAPI.createCreditNote(invoice._id, {
        amount: amt,
        reason: creditReason,
        notes: creditNotes,
      });

      if (res.success) {
        setSuccessMessage(res.message || 'Credit note generated successfully!');
        setIsCreditNoteModalOpen(false);
        setCreditNotes('');
      }
    } catch (err) {
      console.error('Credit note error:', err);
      setError(err.message || 'Failed to create credit note');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Status Badge Variant helper
  const getStatusVariant = (status) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Partially Paid':
        return 'warning';
      case 'Overdue':
      case 'Cancelled':
        return 'danger';
      case 'Sent':
        return 'info';
      case 'Draft':
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="invoice-details-loading-state">
        <RefreshCw className="animate-spin text-primary" size={32} />
        <p className="mt-3 text-muted font-medium">Loading tax invoice and audit history...</p>
      </div>
    );
  }

  if (!invoice && !loading) {
    return (
      <div className="invoice-details-error-wrap">
        <Alert
          type="error"
          message={error || 'No invoice selected or access denied.'}
          className="mb-4"
        />
        <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  // Calculate payment percentage
  const totalAmt = invoice.totalAmount || 1;
  const paidAmt = invoice.paidAmount || 0;
  const paymentPercentage = Math.min(100, Math.round((paidAmt / totalAmt) * 100));

  return (
    <div className="invoice-details-page">
      {/* ========================================================= */}
      {/* TOP HEADER & ACTION CONTROLS                              */}
      {/* ========================================================= */}
      <div className="invoice-details-header no-print">
        <div>
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate('/invoices')}
          >
            <ArrowLeft size={16} />
            <span>Back to Invoices</span>
          </button>
          <div className="title-status-row">
            <h2 className="invoice-header-title">{invoice.invoiceNumber}</h2>
            <Badge variant={getStatusVariant(invoice.status)} size="md" dot>
              {invoice.status}
            </Badge>
            <span className="invoice-badge-sub">
              {invoice.transactionType || 'Intra-State (CGST + SGST)'}
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="invoice-action-toolbar">
          {/* Download PDF via PDFKit */}
          <Button
            variant="outline"
            icon={Download}
            loading={downloadingPdf}
            onClick={handleDownloadPDF}
            title="Download PDF generated via PDFKit"
          >
            Download PDF
          </Button>

          {/* Print Invoice */}
          <Button
            variant="outline"
            icon={Printer}
            onClick={() => window.print()}
            title="Print Clean Tax Invoice"
          >
            Print
          </Button>

          {/* Record Payment (Restricted to Business Owner / Accountant / Admin) */}
          {!isCustomer && invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
            <Button
              variant="primary"
              icon={CreditCard}
              onClick={() => {
                setPaymentAmount(invoice.balanceDue > 0 ? invoice.balanceDue : '');
                setIsPaymentModalOpen(true);
              }}
            >
              Record Payment
            </Button>
          )}

          {/* Create Credit Note */}
          {!isCustomer && invoice.status !== 'Draft' && invoice.status !== 'Cancelled' && (
            <Button
              variant="secondary"
              icon={FileMinus}
              onClick={() => {
                setCreditAmount(invoice.totalAmount);
                setIsCreditNoteModalOpen(true);
              }}
            >
              Credit Note
            </Button>
          )}

          {/* Edit Draft */}
          {!isCustomer && invoice.status === 'Draft' && (
            <Button
              variant="outline"
              icon={Edit}
              onClick={() => navigate(`/invoices/create?editId=${invoice._id}`)}
            >
              Edit Draft
            </Button>
          )}
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
      {/* 2-COLUMN LAYOUT: INVOICE DOCUMENT + SUMMARY SIDEBAR       */}
      {/* ========================================================= */}
      <div className="invoice-details-grid">
        {/* ========================================================= */}
        {/* LEFT COLUMN: THE MASTER A4 INVOICE SHEET                  */}
        {/* ========================================================= */}
        <div className="invoice-sheet-container" id="printable-tax-invoice">
          <div className="sheet-paper">
            {/* 1. Header: Business Info & Title */}
            <div className="sheet-header">
              <div className="biz-brand-box">
                <div className="biz-logo-badge">
                  <Receipt size={24} color="#FFFFFF" />
                </div>
                <div>
                  <h1 className="biz-company-name">
                    {business?.companyName || business?.businessName || user?.companyName || 'Apex Enterprises Pvt Ltd'}
                  </h1>
                  <p className="biz-tax-id">
                    GSTIN: <strong>{business?.taxId || user?.taxId || '29ABCDE1234F1Z5'}</strong>
                  </p>
                  <p className="biz-contact-line">
                    {business?.email || user?.email} • {business?.phone || user?.phone || '+91 98765 43210'}
                  </p>
                  <p className="biz-address-line">
                    {business?.businessAddress
                      ? [
                          business.businessAddress.street,
                          business.businessAddress.city,
                          business.businessAddress.state,
                          business.businessAddress.zipCode,
                        ]
                          .filter(Boolean)
                          .join(', ')
                      : 'Whitefield, Bengaluru, Karnataka - 560066'}
                  </p>
                </div>
              </div>

              <div className="invoice-meta-side text-right">
                <span className="tax-invoice-tag">TAX INVOICE</span>
                <div className="invoice-number-display">{invoice.invoiceNumber}</div>
                <div className="invoice-status-pill">
                  <Badge variant={getStatusVariant(invoice.status)} size="md">
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="sheet-divider" />

            {/* 2. Client & Invoice Metadata Rows */}
            <div className="sheet-info-grid">
              {/* Client / Customer */}
              <div className="billed-to-box">
                <span className="info-section-title">BILLED TO (CLIENT):</span>
                <div className="client-full-name">{invoice.customerName}</div>
                {invoice.customerGstin && (
                  <div className="client-meta-line font-mono">
                    GSTIN: <strong>{invoice.customerGstin}</strong>
                  </div>
                )}
                {invoice.customerEmail && (
                  <div className="client-meta-line">{invoice.customerEmail}</div>
                )}
                <div className="client-address-line">
                  {typeof invoice.billingAddress === 'string'
                    ? invoice.billingAddress
                    : [
                        invoice.billingAddress?.street,
                        invoice.billingAddress?.city,
                        invoice.billingAddress?.state,
                        invoice.billingAddress?.zipCode,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                </div>
              </div>

              {/* Invoice Meta Dates */}
              <div className="dates-meta-box">
                <div className="meta-pair-row">
                  <span className="meta-label">Invoice Date:</span>
                  <span className="meta-value font-semibold">{formatDate(invoice.invoiceDate)}</span>
                </div>
                <div className="meta-pair-row">
                  <span className="meta-label">Payment Due Date:</span>
                  <span className="meta-value font-semibold text-danger">{formatDate(invoice.dueDate)}</span>
                </div>
                <div className="meta-pair-row">
                  <span className="meta-label">Payment Terms:</span>
                  <span className="meta-value">{invoice.paymentTerms || 'Net 15 Days'}</span>
                </div>
                <div className="meta-pair-row">
                  <span className="meta-label">Transaction Type:</span>
                  <span className="meta-value font-semibold text-primary">
                    {invoice.transactionType || 'Intra-State'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Products & Services Table */}
            <div className="sheet-table-wrap">
              <table className="sheet-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                    <th style={{ width: '42%' }}>Item Description</th>
                    <th style={{ width: '12%', textAlign: 'center' }}>HSN/SAC</th>
                    <th style={{ width: '8%', textAlign: 'center' }}>Qty</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ width: '9%', textAlign: 'right' }}>Disc (₹)</th>
                    <th style={{ width: '8%', textAlign: 'center' }}>GST</th>
                    <th style={{ width: '14%', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="text-center text-muted font-mono">{idx + 1}</td>
                      <td>
                        <div className="font-semibold text-dark">{it.description}</div>
                      </td>
                      <td className="text-center text-xs font-mono text-muted">
                        {it.productCode || '998313'}
                      </td>
                      <td className="text-center">{it.quantity}</td>
                      <td className="text-right">{formatINR(it.unitPrice)}</td>
                      <td className="text-right text-muted">
                        {it.discount > 0 ? formatINR(it.discount) : '—'}
                      </td>
                      <td className="text-center text-xs font-medium">{it.taxRate}%</td>
                      <td className="text-right font-semibold text-dark">
                        {formatINR(it.amount || it.quantity * it.unitPrice - (it.discount || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. Financial Totals & Tax Breakdown */}
            <div className="sheet-bottom-grid">
              {/* Notes & Terms Box */}
              <div className="sheet-notes-card">
                <span className="notes-heading">NOTES & INSTRUCTIONS:</span>
                <p className="notes-body">
                  {invoice.notes || 'Thank you for your business. Please remit payment on or before the due date.'}
                </p>

                <span className="notes-heading mt-3">TERMS & CONDITIONS:</span>
                <p className="notes-body">
                  {invoice.terms || 'Interest @ 18% per annum will be charged if payment is delayed beyond the agreed due date.'}
                </p>

                <div className="signature-line-box">
                  <div className="signature-dash" />
                  <span className="text-xs text-muted font-semibold">
                    Authorized Signatory • Computer Generated Document
                  </span>
                </div>
              </div>

              {/* Calculations Summary Table */}
              <div className="sheet-calc-table">
                <div className="calc-row">
                  <span className="calc-label">Subtotal:</span>
                  <span className="calc-val">{formatINR(invoice.subtotal)}</span>
                </div>

                {invoice.discount > 0 && (
                  <div className="calc-row text-muted">
                    <span className="calc-label">Total Discount:</span>
                    <span className="calc-val">- {formatINR(invoice.discount)}</span>
                  </div>
                )}

                <div className="calc-row font-medium">
                  <span className="calc-label">Taxable Amount:</span>
                  <span className="calc-val">{formatINR(invoice.taxableAmount)}</span>
                </div>

                <div className="calc-dashed-divider" />

                {/* GST Split */}
                {invoice.transactionType === 'Inter-State' || invoice.igst > 0 ? (
                  <div className="calc-row">
                    <span className="calc-label">IGST (Integrated Tax):</span>
                    <span className="calc-val text-primary font-mono">{formatINR(invoice.igst || invoice.taxTotal)}</span>
                  </div>
                ) : (
                  <>
                    <div className="calc-row">
                      <span className="calc-label">CGST (Central Tax):</span>
                      <span className="calc-val text-primary font-mono">
                        {formatINR(invoice.cgst !== undefined ? invoice.cgst : invoice.taxTotal / 2)}
                      </span>
                    </div>
                    <div className="calc-row">
                      <span className="calc-label">SGST (State Tax):</span>
                      <span className="calc-val text-primary font-mono">
                        {formatINR(invoice.sgst !== undefined ? invoice.sgst : invoice.taxTotal / 2)}
                      </span>
                    </div>
                  </>
                )}

                <div className="calc-row">
                  <span className="calc-label">Total Tax (GST):</span>
                  <span className="calc-val font-semibold">{formatINR(invoice.taxTotal)}</span>
                </div>

                <div className="calc-solid-divider" />

                {/* Grand Total Banner */}
                <div className="calc-row grand-total-highlight">
                  <span className="font-bold text-dark">Grand Total:</span>
                  <span className="font-extrabold text-primary text-lg">
                    {formatINR(invoice.totalAmount)}
                  </span>
                </div>

                {/* Paid Amount */}
                <div className="calc-row pt-1">
                  <span className="calc-label font-semibold">Amount Paid:</span>
                  <span className="calc-val text-success font-semibold">
                    {formatINR(invoice.paidAmount)}
                  </span>
                </div>

                {/* Outstanding Balance */}
                <div className="calc-row balance-highlight">
                  <span className="font-bold text-dark">Balance Due:</span>
                  <span
                    className={`font-extrabold text-base ${
                      invoice.balanceDue > 0 ? 'text-danger' : 'text-success'
                    }`}
                  >
                    {formatINR(invoice.balanceDue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="sheet-footer">
              <span>This is an official Tax Invoice generated under Indian GST Laws via BillFlow Accounting System.</span>
              <span>Invoice Ref: {invoice._id}</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: SIDEBAR AUDIT & ACTIONS                     */}
        {/* ========================================================= */}
        <div className="invoice-sidebar-col no-print">
          {/* Card 1: Payment Status & Balance Due */}
          <Card padding="normal" className="sidebar-metric-card">
            <span className="card-sub-header">RECEIVABLES STATUS</span>
            <div className="balance-big-amount">
              {formatINR(invoice.balanceDue)}
            </div>
            <p className="text-xs text-muted">
              {invoice.balanceDue > 0 ? 'Outstanding balance to be collected' : 'Invoice fully settled'}
            </p>

            <div className="payment-progress-wrap mt-3">
              <div className="progress-labels">
                <span>Settled: {paymentPercentage}%</span>
                <span>{formatINR(invoice.paidAmount)} / {formatINR(invoice.totalAmount)}</span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${paymentPercentage}%` }}
                />
              </div>
            </div>

            {!isCustomer && invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
              <Button
                variant="primary"
                fullWidth
                icon={CreditCard}
                className="mt-4"
                onClick={() => {
                  setPaymentAmount(invoice.balanceDue > 0 ? invoice.balanceDue : '');
                  setIsPaymentModalOpen(true);
                }}
              >
                Record Payment Now
              </Button>
            )}
          </Card>

          {/* Card 2: Payment History */}
          <Card padding="normal" className="sidebar-history-card">
            <Card.Header
              title="Payment History"
              subtitle={`${payments.length} transaction(s) recorded`}
            />
            <Card.Body>
              {payments.length === 0 ? (
                <div className="no-payments-box">
                  <History size={24} className="text-muted" />
                  <p className="text-xs text-muted mt-2">
                    No payment records logged yet. Use "Record Payment" to settle.
                  </p>
                </div>
              ) : (
                <div className="payments-history-list">
                  {payments.map((p) => (
                    <div key={p._id} className="payment-history-item">
                      <div className="pay-icon-box">
                        <CheckCircle2 size={16} color="var(--success-green)" />
                      </div>
                      <div className="pay-meta-text">
                        <div className="pay-amount font-semibold text-success">
                          {formatINR(p.amount)}
                        </div>
                        <div className="pay-method text-xs text-muted">
                          {p.paymentMethod} {p.transactionReference ? `• Ref: ${p.transactionReference}` : ''}
                        </div>
                        <div className="pay-date text-xs text-muted">
                          {formatDate(p.paymentDate)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Card 3: Customer Quick Info */}
          <Card padding="normal" className="sidebar-customer-card">
            <Card.Header title="Client Details" />
            <Card.Body>
              <div className="customer-info-row">
                <User size={16} className="text-muted" />
                <span className="font-semibold">{invoice.customerName}</span>
              </div>
              {invoice.customerEmail && (
                <div className="customer-info-row">
                  <span className="text-xs text-muted">Email:</span>
                  <span className="text-xs">{invoice.customerEmail}</span>
                </div>
              )}
              {invoice.customerGstin && (
                <div className="customer-info-row">
                  <span className="text-xs text-muted">GSTIN:</span>
                  <span className="text-xs font-mono">{invoice.customerGstin}</span>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: RECORD PAYMENT                                     */}
      {/* ========================================================= */}
      {isPaymentModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsPaymentModalOpen(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-box">
                  <CreditCard size={20} color="var(--primary-blue)" />
                </div>
                <div>
                  <h3 className="modal-title">Record Payment</h3>
                  <p className="modal-subtitle">
                    Invoice {invoice.invoiceNumber} • Balance Due: {formatINR(invoice.balanceDue)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit}>
              <div className="modal-body">
                <Input
                  label="Payment Amount (₹)"
                  type="number"
                  min="1"
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  icon={Receipt}
                  required
                />

                <Input
                  label="Payment Date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  icon={Calendar}
                  required
                />

                <div className="input-group">
                  <label className="input-label" htmlFor="pay-method-select">
                    Payment Method
                  </label>
                  <div className="input-wrapper">
                    <select
                      id="pay-method-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="input-field"
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                      <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Transaction Reference / Cheque No."
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UTR-827364129"
                />

                <Input
                  label="Payment Notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Optional internal remarks..."
                />
              </div>

              <div className="modal-footer">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  icon={Check}
                  loading={submittingAction}
                >
                  Confirm & Save Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE CREDIT NOTE                                 */}
      {/* ========================================================= */}
      {isCreditNoteModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreditNoteModalOpen(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-box">
                  <FileMinus size={20} color="var(--warning-orange)" />
                </div>
                <div>
                  <h3 className="modal-title">Issue Credit Note</h3>
                  <p className="modal-subtitle">
                    Against Invoice {invoice.invoiceNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCreditNoteModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreditNoteSubmit}>
              <div className="modal-body">
                <Input
                  label="Credit Amount (₹)"
                  type="number"
                  min="1"
                  step="any"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  icon={Receipt}
                  required
                />

                <div className="input-group">
                  <label className="input-label" htmlFor="cn-reason-select">
                    Reason for Credit Note
                  </label>
                  <div className="input-wrapper">
                    <select
                      id="cn-reason-select"
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                      className="input-field"
                    >
                      <option value="Price Adjustment">Price Adjustment / Discount</option>
                      <option value="Goods Return">Goods Return</option>
                      <option value="Order Cancellation">Order Cancellation</option>
                      <option value="Deficiency in Service">Deficiency in Service</option>
                      <option value="Correction in Invoice">Correction in Invoice</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Remarks & Reason Details"
                  value={creditNotes}
                  onChange={(e) => setCreditNotes(e.target.value)}
                  placeholder="Explain reason for issuing credit..."
                />
              </div>

              <div className="modal-footer">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsCreditNoteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  icon={Check}
                  loading={submittingAction}
                >
                  Issue Credit Note
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetails;
