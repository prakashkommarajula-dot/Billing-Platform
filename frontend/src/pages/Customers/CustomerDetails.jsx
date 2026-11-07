import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Building,
  Mail,
  Phone,
  MapPin,
  Receipt,
  FilePlus,
  CreditCard,
  FileMinus,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { customerAPI, invoiceAPI, creditNoteAPI } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import './customer-details.css';

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

export const CustomerDetails = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Customer ID from URL route (/customers/:id) or query (?id=...)
  const customerIdFromUrl = params.id || searchParams.get('id');

  // Customer List for Switcher Dropdown
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerIdFromUrl || '');

  // Customer Data & Sub-Collections
  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [creditNotes, setCreditNotes] = useState([]);
  const [ledger, setLedger] = useState([]);

  // Active Tab: 'ledger' | 'invoices' | 'payments' | 'credit-notes'
  const [activeTab, setActiveTab] = useState('ledger');

  // Filters for Ledger
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');

  // Loading & Feedback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch All Customers for Switcher
  useEffect(() => {
    customerAPI.getAll({ limit: 100 })
      .then((res) => {
        if (res.success && res.customers && res.customers.length > 0) {
          setAllCustomers(res.customers);
          // If no customer ID is specified in URL, auto-select first customer
          if (!customerIdFromUrl) {
            setSelectedCustomerId(res.customers[0]._id);
            setSearchParams({ id: res.customers[0]._id });
          }
        }
      })
      .catch((err) => console.warn('Fetch all customers error:', err));
  }, [customerIdFromUrl, setSearchParams]);

  // 2. Fetch Selected Customer Details
  const fetchCustomerDetails = useCallback(async (idToFetch) => {
    if (!idToFetch) return;
    setLoading(true);
    setError('');

    try {
      const res = await customerAPI.getById(idToFetch);
      if (res.success && res.customer) {
        setCustomer(res.customer);
        setInvoices(res.invoices || []);
        setPayments(res.payments || []);
        setCreditNotes(res.creditNotes || []);
        setLedger(res.ledger || []);
      } else {
        throw new Error(res.message || 'Failed to load customer record');
      }
    } catch (err) {
      console.error('Fetch customer details error:', err);
      setError(err.message || 'Could not retrieve customer details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerDetails(selectedCustomerId);
    }
  }, [selectedCustomerId, fetchCustomerDetails]);

  // Handle Switcher Change
  const handleSelectCustomer = (newId) => {
    setSelectedCustomerId(newId);
    setSearchParams({ id: newId });
  };

  // Filtered Ledger based on dates
  const filteredLedger = ledger.filter((entry) => {
    if (!ledgerStartDate && !ledgerEndDate) return true;
    const entryDate = new Date(entry.date);
    if (ledgerStartDate && entryDate < new Date(ledgerStartDate)) return false;
    if (ledgerEndDate) {
      const end = new Date(ledgerEndDate);
      end.setHours(23, 59, 59, 999);
      if (entryDate > end) return false;
    }
    return true;
  });

  // Export Ledger to CSV
  const handleExportCSV = () => {
    if (!customer) return;
    const headers = ['Date', 'Transaction Type', 'Reference #', 'Description', 'Debit (INR)', 'Credit (INR)', 'Running Balance (INR)'];
    const rows = filteredLedger.map((e) => [
      formatDate(e.date),
      e.type,
      e.reference,
      `"${e.description}"`,
      e.debit,
      e.credit,
      e.runningBalance,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ledger_${customer.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="cust-details-page-content">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & CUSTOMER SWITCHER                         */}
      {/* ========================================================= */}
      <div className="cust-details-header-row no-print">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={ChevronLeft}
            onClick={() => navigate('/customers')}
          >
            Back to Customer Directory
          </Button>

          {/* Quick Switcher Dropdown */}
          <div className="cust-switcher-wrap">
            <span className="text-xs text-muted font-semibold uppercase">Client Profile:</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="cust-switcher-select"
            >
              {allCustomers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.companyName ? `(${c.companyName})` : ''} — {formatINR(c.outstandingAmount || 0)} Due
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="cust-header-actions">
          <Button
            variant="outline"
            icon={RefreshCw}
            loading={loading}
            onClick={() => fetchCustomerDetails(selectedCustomerId)}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={FilePlus}
            onClick={() => navigate(`/invoices/create?customer=${selectedCustomerId}`)}
          >
            Create Invoice
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
          className="no-print"
        />
      )}

      {/* ========================================================= */}
      {/* 2. CUSTOMER IDENTITY & OVERVIEW CARD                      */}
      {/* ========================================================= */}
      {customer && (
        <div className="cust-hero-card">
          <div className="cust-hero-main">
            <div className="cust-avatar-badge">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="cust-hero-name">{customer.name}</h2>
                <span className="cust-id-chip font-mono">
                  {customer.customerId || `CUST-${customer._id.slice(-4).toUpperCase()}`}
                </span>
                <Badge variant={customer.status === 'Active' ? 'success' : 'default'} size="sm" dot>
                  {customer.status || 'Active'}
                </Badge>
              </div>

              {customer.companyName && (
                <div className="cust-hero-company">
                  <Building size={14} className="text-muted" />
                  <span>{customer.companyName}</span>
                </div>
              )}

              <div className="cust-hero-contacts">
                {customer.email && (
                  <span className="c-contact-item">
                    <Mail size={13} className="text-muted" />
                    <span>{customer.email}</span>
                  </span>
                )}
                {customer.phone && (
                  <span className="c-contact-item font-mono">
                    <Phone size={13} className="text-muted" />
                    <span>{customer.phone}</span>
                  </span>
                )}
                <span className="c-contact-item font-mono">
                  <span className="text-muted font-sans text-xs">GSTIN:</span>{' '}
                  <strong>{customer.gstin || customer.taxId || 'Not Registered'}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="cust-hero-address">
            <div className="flex items-start gap-1 text-xs text-muted">
              <MapPin size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                {[
                  customer.billingAddress?.street,
                  customer.billingAddress?.city,
                  customer.billingAddress?.state,
                  customer.billingAddress?.postalCode || customer.billingAddress?.zipCode,
                  customer.billingAddress?.country,
                ]
                  .filter(Boolean)
                  .join(', ') || 'No billing address provided'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. FINANCIAL SUMMARY METRIC CHIPS                         */}
      {/* ========================================================= */}
      {customer && (
        <div className="cust-metrics-grid no-print">
          <div className="c-metric-card">
            <div className="c-m-top">
              <span className="c-m-lbl">Lifetime Billed</span>
              <div className="c-m-icon bg-blue">
                <Receipt size={18} />
              </div>
            </div>
            <div className="c-m-val">{formatINR(customer.totalBilled)}</div>
            <div className="c-m-sub text-muted">{customer.totalInvoices || 0} total invoices issued</div>
          </div>

          <div className="c-metric-card">
            <div className="c-m-top">
              <span className="c-m-lbl">Total Payments Received</span>
              <div className="c-m-icon bg-green">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="c-m-val text-success">{formatINR(customer.totalPaid)}</div>
            <div className="c-m-sub text-success">{payments.length} settled payments</div>
          </div>

          <div className="c-metric-card">
            <div className="c-m-top">
              <span className="c-m-lbl">Credit Notes Adjusted</span>
              <div className="c-m-icon bg-amber">
                <FileMinus size={18} />
              </div>
            </div>
            <div className="c-m-val text-amber">- {formatINR(customer.totalCredits)}</div>
            <div className="c-m-sub text-amber">{creditNotes.length} issued credit adjustments</div>
          </div>

          <div className="c-metric-card highlight-card">
            <div className="c-m-top">
              <span className="c-m-lbl">Current Outstanding Balance</span>
              <div className="c-m-icon bg-danger">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className={`c-m-val ${customer.outstandingAmount > 0 ? 'text-danger' : 'text-success'}`}>
              {formatINR(customer.outstandingAmount)}
            </div>
            <div className="c-m-sub text-danger font-semibold">
              {customer.outstandingAmount > 0 ? 'Payment collection pending' : 'Account fully settled'}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. SUB-TABS NAVIGATION STRIP                              */}
      {/* ========================================================= */}
      <div className="cust-tabs-strip no-print">
        <button
          type="button"
          className={`cust-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          <BookOpen size={16} />
          <span>Customer Ledger & Statement</span>
        </button>

        <button
          type="button"
          className={`cust-tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <Receipt size={16} />
          <span>Invoices ({invoices.length})</span>
        </button>

        <button
          type="button"
          className={`cust-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <CreditCard size={16} />
          <span>Payment Settlements ({payments.length})</span>
        </button>

        <button
          type="button"
          className={`cust-tab-btn ${activeTab === 'credit-notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('credit-notes')}
        >
          <FileMinus size={16} />
          <span>Credit Notes ({creditNotes.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: RUNNING LEDGER & STATEMENT                         */}
      {/* ========================================================= */}
      {activeTab === 'ledger' && (
        <div className="cust-tab-pane">
          {/* Statement Actions & Date Filters */}
          <Card padding="normal" className="no-print">
            <div className="cust-statement-controls">
              <div className="date-filter-group">
                <div className="date-field-wrap">
                  <span className="text-xs font-semibold text-muted">From:</span>
                  <input
                    type="date"
                    value={ledgerStartDate}
                    onChange={(e) => setLedgerStartDate(e.target.value)}
                    className="date-input"
                  />
                </div>
                <div className="date-field-wrap">
                  <span className="text-xs font-semibold text-muted">To:</span>
                  <input
                    type="date"
                    value={ledgerEndDate}
                    onChange={(e) => setLedgerEndDate(e.target.value)}
                    className="date-input"
                  />
                </div>
                {(ledgerStartDate || ledgerEndDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLedgerStartDate('');
                      setLedgerEndDate('');
                    }}
                  >
                    Clear Filter
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  icon={Download}
                  onClick={handleExportCSV}
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

          {/* Ledger Table */}
          <Card padding="none" className="cust-table-card">
            <div className="table-responsive">
              <table className="cust-data-table statement-table">
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
                  <tr className="opening-row">
                    <td className="text-muted">Start</td>
                    <td><Badge variant="default" size="sm">Opening</Badge></td>
                    <td className="font-mono text-muted">—</td>
                    <td className="font-semibold text-muted">Opening Balance Carried Forward</td>
                    <td className="text-right text-muted">—</td>
                    <td className="text-right text-muted">—</td>
                    <td className="text-right font-bold">{formatINR(customer?.openingBalance || 0)}</td>
                  </tr>

                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-6 text-muted">
                        No transactions recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((entry, idx) => (
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
                        <td className="font-mono font-bold text-xs">{entry.reference}</td>
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

                  <tr className="closing-row">
                    <td colSpan="4" className="text-right font-bold">
                      CLOSING OUTSTANDING BALANCE:
                    </td>
                    <td className="text-right font-bold text-dark">
                      {formatINR(filteredLedger.reduce((sum, e) => sum + (e.debit || 0), 0))}
                    </td>
                    <td className="text-right font-bold text-success">
                      {formatINR(filteredLedger.reduce((sum, e) => sum + (e.credit || 0), 0))}
                    </td>
                    <td className={`text-right font-extrabold text-base ${customer?.outstandingAmount > 0 ? 'text-danger' : 'text-success'}`}>
                      {formatINR(customer?.outstandingAmount || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: INVOICES LIST                                      */}
      {/* ========================================================= */}
      {activeTab === 'invoices' && (
        <div className="cust-tab-pane">
          <Card padding="none" className="cust-table-card">
            <div className="table-responsive">
              <table className="cust-data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                    <th style={{ textAlign: 'right' }}>Paid Amount</th>
                    <th style={{ textAlign: 'right' }}>Balance Due</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-6 text-muted">
                        No invoices generated for this client.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv._id}>
                        <td className="font-mono font-bold text-primary">
                          <button
                            type="button"
                            className="cust-link-btn"
                            onClick={() => navigate(`/invoices/${inv._id}`)}
                          >
                            {inv.invoiceNumber}
                          </button>
                        </td>
                        <td className="text-sm text-muted">{formatDate(inv.invoiceDate)}</td>
                        <td className="text-sm text-muted">{formatDate(inv.dueDate)}</td>
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
                          <div className="cust-action-btn-group">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Download}
                              onClick={() => invoiceAPI.downloadPDF(inv._id, inv.invoiceNumber)}
                              title="Download PDF"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              icon={ExternalLink}
                              onClick={() => navigate(`/invoices/${inv._id}`)}
                              title="View Invoice Details"
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
      {/* TAB 3: PAYMENTS LIST                                      */}
      {/* ========================================================= */}
      {activeTab === 'payments' && (
        <div className="cust-tab-pane">
          <Card padding="none" className="cust-table-card">
            <div className="table-responsive">
              <table className="cust-data-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Invoice #</th>
                    <th>Payment Date</th>
                    <th>Method</th>
                    <th>Reference / UTR</th>
                    <th style={{ textAlign: 'right' }}>Amount Paid</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-6 text-muted">
                        No settlements recorded for this client.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p._id}>
                        <td className="font-mono font-bold text-primary">{p.paymentNumber}</td>
                        <td className="font-mono font-medium">{p.invoiceNumber}</td>
                        <td className="text-sm text-muted">{formatDate(p.paymentDate)}</td>
                        <td>
                          <Badge variant="primary" size="sm">{p.paymentMethod}</Badge>
                        </td>
                        <td className="font-mono text-xs text-muted">{p.transactionReference || '—'}</td>
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
      {/* TAB 4: CREDIT NOTES LIST                                  */}
      {/* ========================================================= */}
      {activeTab === 'credit-notes' && (
        <div className="cust-tab-pane">
          <Card padding="none" className="cust-table-card">
            <div className="table-responsive">
              <table className="cust-data-table">
                <thead>
                  <tr>
                    <th>Credit Note #</th>
                    <th>Invoice #</th>
                    <th>Date Issued</th>
                    <th>Reason</th>
                    <th style={{ textAlign: 'right' }}>Credit Amount</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {creditNotes.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-6 text-muted">
                        No credit notes issued for this client.
                      </td>
                    </tr>
                  ) : (
                    creditNotes.map((cn) => (
                      <tr key={cn._id}>
                        <td className="font-mono font-bold text-amber">{cn.creditNoteNumber}</td>
                        <td className="font-mono font-medium">{cn.invoiceNumber}</td>
                        <td className="text-sm text-muted">{formatDate(cn.creditNoteDate)}</td>
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
                          />
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
    </div>
  );
};

export default CustomerDetails;
