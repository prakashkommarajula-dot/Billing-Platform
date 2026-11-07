import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FilePlus,
  Search,
  Filter,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Printer,
  Download,
  Ban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Receipt,
  Building,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import { invoiceAPI, customerAPI } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { Input } from '../../components/common/Input';
import './invoices.css';

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
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const InvoiceList = () => {
  const navigate = useNavigate();

  // State
  const [invoices, setInvoices] = useState([]);
  const [metrics, setMetrics] = useState({ totalBilled: 0, totalPaid: 0, totalOutstanding: 0 });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Fetch Customers for Filter Dropdown
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await customerAPI.getAll({ limit: 100 });
        if (res.success && res.customers) {
          setCustomers(res.customers);
        }
      } catch (err) {
        console.warn('Could not load customers for filter dropdown:', err);
      }
    };
    loadCustomers();
  }, []);

  // Fetch Invoices from GET /api/invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page: currentPage,
        limit: pageSize,
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== 'All') params.status = statusFilter;
      if (customerFilter !== 'All') params.customer = customerFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await invoiceAPI.getAll(params);

      if (res.success) {
        setInvoices(res.invoices || []);
        if (res.metrics) setMetrics(res.metrics);
        setPagination(res.pagination || { total: res.invoices?.length || 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Failed to retrieve invoice records.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, customerFilter, startDate, endDate]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Status Badge Mapper
  const getStatusVariant = (status) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Sent':
      case 'Pending':
        return 'primary';
      case 'Partially Paid':
        return 'info';
      case 'Overdue':
        return 'danger';
      case 'Cancelled':
        return 'default';
      case 'Draft':
      default:
        return 'warning';
    }
  };

  // Open Cancel Modal
  const handleOpenCancelModal = (inv) => {
    setSelectedInvoice(inv);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  // Submit Invoice Cancellation
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setModalSubmitting(true);
    try {
      const res = await invoiceAPI.cancel(selectedInvoice._id, cancelReason);
      if (res.success) {
        setSuccessMessage(`Invoice ${selectedInvoice.invoiceNumber} has been marked as Cancelled.`);
        setIsCancelModalOpen(false);
        fetchInvoices();
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel invoice');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Open Printable Invoice Preview
  const handleOpenPrintModal = (inv) => {
    setSelectedInvoice(inv);
    setIsPrintModalOpen(true);
  };

  // Execute Browser Print / PDF save
  const handleTriggerPrint = () => {
    window.print();
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCustomerFilter('All');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="invoices-page-content">
      {/* Top Header & Quick Metrics */}
      <div className="page-header-row">
        <div>
          <h2 className="header-title">Invoice Management</h2>
          <p className="header-subtitle">
            Issue legal tax invoices, monitor payment settlement lifecycles, and export audit documents.
          </p>
        </div>
        <div className="header-actions">
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={() => fetchInvoices()}
            title="Refresh Invoices"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={FilePlus}
            onClick={() => navigate('/invoices/create')}
          >
            Create New Invoice
          </Button>
        </div>
      </div>

      {/* Top Metric Summary Cards */}
      <div className="invoice-metrics-summary-row">
        <div className="invoice-summary-chip chip-billed">
          <div className="chip-label">Total Invoiced Volume</div>
          <div className="chip-value text-primary">{formatINR(metrics.totalBilled)}</div>
        </div>

        <div className="invoice-summary-chip chip-paid">
          <div className="chip-label">Settled Payments</div>
          <div className="chip-value text-success">{formatINR(metrics.totalPaid)}</div>
        </div>

        <div className="invoice-summary-chip chip-outstanding">
          <div className="chip-label">Outstanding Balance</div>
          <div className="chip-value text-danger">{formatINR(metrics.totalOutstanding)}</div>
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

      {/* Search & Multi-Criteria Filter Bar */}
      <Card padding="normal" className="filters-card">
        <div className="invoices-filters-grid">
          {/* Search by invoice number / customer */}
          <div className="search-input-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by invoice # or customer name..."
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

          {/* Filter by Customer */}
          <div className="filter-dropdown-wrap">
            <span className="filter-label">Customer:</span>
            <select
              value={customerFilter}
              onChange={(e) => {
                setCustomerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="All">All Customers</option>
              {customers.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div className="filter-dropdown-wrap">
            <span className="filter-label">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent / Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid in Full</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Range: From */}
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

          {/* Date Range: To */}
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

          {(searchTerm || statusFilter !== 'All' || customerFilter !== 'All' || startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={handleResetFilters}
              title="Reset All Filters"
            >
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* Invoices Master Table Card */}
      <Card padding="normal" className="table-card">
        <div className="table-responsive">
          <table className="custom-table invoice-master-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th className="text-right">Subtotal</th>
                <th className="text-right">Tax (GST)</th>
                <th className="text-right">Discount</th>
                <th className="text-right">Grand Total</th>
                <th className="text-right">Paid</th>
                <th className="text-right">Outstanding</th>
                <th className="text-center">Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" className="text-center py-6">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                      <RefreshCw size={20} className="btn-spinner" />
                      <span>Loading invoice records...</span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center py-8">
                    <div className="empty-state-box">
                      <Receipt size={40} className="empty-icon" />
                      <h4 className="empty-title">No invoices found</h4>
                      <p className="empty-desc">
                        {searchTerm || statusFilter !== 'All' || customerFilter !== 'All' || startDate
                          ? 'Try clearing active search filters or selecting a wider date range.'
                          : 'Get started by creating your first customer tax invoice.'}
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={FilePlus}
                        onClick={() => navigate('/invoices/create')}
                      >
                        Create Your First Invoice
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="invoice-row">
                    {/* Invoice Number */}
                    <td className="font-mono font-semibold text-primary">
                      <button
                        type="button"
                        className="inv-number-link"
                        onClick={() => navigate(`/invoices/${inv._id}`)}
                        title="View Invoice Details"
                      >
                        {inv.invoiceNumber}
                      </button>
                    </td>

                    {/* Customer Name */}
                    <td>
                      <div className="customer-cell font-medium">
                        <span>{inv.customerName}</span>
                      </div>
                    </td>

                    {/* Invoice Date */}
                    <td className="text-sm text-muted">
                      {formatDate(inv.invoiceDate)}
                    </td>

                    {/* Due Date */}
                    <td className="text-sm text-muted">
                      {formatDate(inv.dueDate)}
                    </td>

                    {/* Subtotal */}
                    <td className="text-right text-sm">
                      {formatINR(inv.subtotal)}
                    </td>

                    {/* Tax Total */}
                    <td className="text-right text-sm text-muted">
                      {formatINR(inv.taxTotal)}
                    </td>

                    {/* Discount */}
                    <td className="text-right text-sm text-muted">
                      {inv.discount > 0 ? formatINR(inv.discount) : '—'}
                    </td>

                    {/* Grand Total */}
                    <td className="text-right font-semibold">
                      {formatINR(inv.totalAmount)}
                    </td>

                    {/* Paid Amount */}
                    <td className="text-right text-sm text-success font-medium">
                      {formatINR(inv.paidAmount)}
                    </td>

                    {/* Outstanding Amount */}
                    <td className="text-right font-semibold">
                      <span className={inv.balanceDue > 0 ? 'text-danger' : 'text-success'}>
                        {formatINR(inv.balanceDue)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="text-center">
                      <Badge variant={getStatusVariant(inv.status)} size="sm" dot>
                        {inv.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="text-center">
                      <div className="action-buttons-wrap">
                        {/* View Invoice Details */}
                        <button
                          type="button"
                          className="action-icon-btn action-view"
                          onClick={() => navigate(`/invoices/${inv._id}`)}
                          title="View Invoice Details"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Download PDF directly */}
                        <button
                          type="button"
                          className="action-icon-btn action-download"
                          onClick={() => invoiceAPI.downloadPDF(inv._id, inv.invoiceNumber)}
                          title="Download A4 PDF"
                        >
                          <Download size={15} />
                        </button>

                        {/* Print / Quick Preview */}
                        <button
                          type="button"
                          className="action-icon-btn action-print"
                          onClick={() => handleOpenPrintModal(inv)}
                          title="Quick Print Invoice"
                        >
                          <Printer size={15} />
                        </button>

                        {/* Edit Draft Invoice */}
                        {inv.status === 'Draft' && (
                          <button
                            type="button"
                            className="action-icon-btn action-edit"
                            onClick={() => navigate(`/invoices/create?editId=${inv._id}`)}
                            title="Edit Draft Invoice"
                          >
                            <Edit size={15} />
                          </button>
                        )}

                        {/* Cancel Invoice */}
                        {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                          <button
                            type="button"
                            className="action-icon-btn action-cancel"
                            onClick={() => handleOpenCancelModal(inv)}
                            title="Cancel Invoice"
                          >
                            <Ban size={15} />
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

        {/* Pagination Footer */}
        <div className="pagination-footer">
          <div className="pagination-info text-sm text-muted">
            Showing{' '}
            <strong>
              {invoices.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong>
              {Math.min(currentPage * pageSize, pagination.total || invoices.length)}
            </strong>{' '}
            of <strong>{pagination.total || invoices.length}</strong> invoices
          </div>

          <div className="pagination-controls">
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>

            <span className="page-number-display">
              Page {currentPage} of {pagination.totalPages || 1}
            </span>

            <Button
              variant="outline"
              size="sm"
              iconRight={ChevronRight}
              disabled={currentPage >= (pagination.totalPages || 1) || loading}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* ========================================================= */}
      {/* PRINT / DOWNLOAD INVOICE PREVIEW MODAL                    */}
      {/* ========================================================= */}
      {isPrintModalOpen && selectedInvoice && (
        <div className="modal-backdrop" onClick={() => setIsPrintModalOpen(false)}>
          <div
            className="modal-card print-preview-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="print-modal-header no-print">
              <div className="modal-title-wrap">
                <div className="modal-icon-box">
                  <Receipt size={20} color="var(--primary-blue)" />
                </div>
                <div>
                  <h3 className="modal-title">Tax Invoice Document</h3>
                  <p className="modal-subtitle">{selectedInvoice.invoiceNumber}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Button
                  variant="primary"
                  icon={Printer}
                  onClick={handleTriggerPrint}
                >
                  Print / Save as PDF
                </Button>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsPrintModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Print-Ready Invoice Sheet */}
            <div className="invoice-print-sheet" id="printable-invoice">
              {/* Document Header */}
              <div className="sheet-header">
                <div>
                  <div className="sheet-brand">BillFlow Billing</div>
                  <div className="sheet-sub">Tax Invoice & Billing Management</div>
                </div>
                <div className="sheet-invoice-meta text-right">
                  <h2 className="sheet-tax-title">TAX INVOICE</h2>
                  <div className="sheet-meta-num font-mono">{selectedInvoice.invoiceNumber}</div>
                  <div className="sheet-status-tag">
                    <Badge variant={getStatusVariant(selectedInvoice.status)} size="sm">
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="sheet-divider" />

              {/* Billed To & Dates */}
              <div className="sheet-parties-grid">
                <div>
                  <div className="sheet-meta-label">BILLED TO:</div>
                  <div className="sheet-client-name font-bold">{selectedInvoice.customerName}</div>
                  {selectedInvoice.customerEmail && (
                    <div className="sheet-meta-val">{selectedInvoice.customerEmail}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="sheet-date-row">
                    <span className="sheet-meta-label">Invoice Date:</span>{' '}
                    <span className="font-semibold">{formatDate(selectedInvoice.invoiceDate)}</span>
                  </div>
                  <div className="sheet-date-row">
                    <span className="sheet-meta-label">Payment Due:</span>{' '}
                    <span className="font-semibold">{formatDate(selectedInvoice.dueDate)}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="sheet-items-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-center">Tax %</th>
                    <th className="text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="font-medium">{it.description}</td>
                      <td className="text-center">{it.quantity}</td>
                      <td className="text-right">{formatINR(it.unitPrice)}</td>
                      <td className="text-center">{it.taxRate}%</td>
                      <td className="text-right font-semibold">{formatINR(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div className="sheet-totals-container">
                <div className="sheet-notes-box">
                  <span className="font-semibold text-xs text-muted">TERMS & NOTES:</span>
                  <p className="text-xs text-muted mt-1">
                    {selectedInvoice.notes || 'Thank you for your business. Please remit payment by the due date.'}
                  </p>
                </div>

                <div className="sheet-totals-table">
                  <div className="sheet-total-row">
                    <span>Subtotal:</span>
                    <span>{formatINR(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="sheet-total-row">
                    <span>Tax Total (GST):</span>
                    <span>{formatINR(selectedInvoice.taxTotal)}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="sheet-total-row text-muted">
                      <span>Discount:</span>
                      <span>- {formatINR(selectedInvoice.discount)}</span>
                    </div>
                  )}
                  <div className="sheet-total-row grand-total-row">
                    <span>Grand Total:</span>
                    <span className="text-primary">{formatINR(selectedInvoice.totalAmount)}</span>
                  </div>
                  <div className="sheet-total-row paid-row">
                    <span>Paid Amount:</span>
                    <span className="text-success">{formatINR(selectedInvoice.paidAmount)}</span>
                  </div>
                  <div className="sheet-total-row balance-row">
                    <span>Balance Due:</span>
                    <span className={selectedInvoice.balanceDue > 0 ? 'text-danger' : 'text-success'}>
                      {formatINR(selectedInvoice.balanceDue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CANCEL INVOICE CONFIRMATION MODAL                         */}
      {/* ========================================================= */}
      {isCancelModalOpen && selectedInvoice && (
        <div className="modal-backdrop" onClick={() => setIsCancelModalOpen(false)}>
          <div
            className="modal-card cancel-invoice-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="delete-modal-content">
              <div className="delete-warning-icon">
                <Ban size={32} color="var(--warning-orange)" />
              </div>

              <h3 className="delete-modal-title">
                Cancel Invoice {selectedInvoice.invoiceNumber}?
              </h3>

              <p className="delete-modal-desc">
                Cancelling this invoice will void the balance due of{' '}
                <strong>{formatINR(selectedInvoice.balanceDue)}</strong> for{' '}
                <strong>{selectedInvoice.customerName}</strong>.
              </p>

              <div className="input-group text-left" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                <label className="input-label" htmlFor="cancel-reason">
                  Cancellation Reason (Audit Note)
                </label>
                <div className="input-wrapper">
                  <input
                    id="cancel-reason"
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Order cancelled by client, duplicate invoice, revision required"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="delete-modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={modalSubmitting}
                >
                  Keep Invoice
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  loading={modalSubmitting}
                  onClick={handleCancelSubmit}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
