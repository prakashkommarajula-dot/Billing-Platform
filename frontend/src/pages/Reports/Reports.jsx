import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Receipt,
  BookOpen,
  Calendar,
  Filter,
  Download,
  Printer,
  Search,
  RefreshCw,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  X,
  Building,
  User,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { reportAPI, customerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import './reports.css';

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

export const Reports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Active Tab: 'sales' | 'receivables' | 'tax' | 'ledger'
  const [activeTab, setActiveTab] = useState('sales');

  // Shared Date Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Tab 1: Sales State
  const [salesData, setSalesData] = useState({
    invoices: [],
    metrics: { totalSales: 0, totalPaid: 0, totalOutstanding: 0, invoiceCount: 0 },
    chartData: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
  });
  const [salesSearch, setSalesSearch] = useState('');
  const [salesCustomer, setSalesCustomer] = useState('All');
  const [salesStatus, setSalesStatus] = useState('All');
  const [salesPage, setSalesPage] = useState(1);

  // Tab 2: Receivables State
  const [receivablesData, setReceivablesData] = useState({
    invoices: [],
    metrics: { totalReceivables: 0, totalOverdue: 0, unpaidInvoiceCount: 0 },
    agingChartData: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
  });
  const [recAgingCategory, setRecAgingCategory] = useState('All');
  const [recCustomer, setRecCustomer] = useState('All');
  const [recSearch, setRecSearch] = useState('');
  const [recPage, setRecPage] = useState(1);

  // Tab 3: Tax Summary State
  const [taxData, setTaxData] = useState({
    invoices: [],
    metrics: { taxableSales: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, invoiceCount: 0 },
    taxDistributionChart: [],
    slabBreakdown: [],
  });
  const [taxCategory, setTaxCategory] = useState('All');

  // Tab 4: Customer Ledger State
  const [ledgerData, setLedgerData] = useState({
    customers: [],
    customer: null,
    openingBalance: 0,
    closingBalance: 0,
    totalDebits: 0,
    totalCredits: 0,
    ledger: [],
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // General Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // All Customers for Dropdowns
  const [allCustomers, setAllCustomers] = useState([]);

  // Fetch Customers List for filter dropdowns on mount
  useEffect(() => {
    customerAPI.getAll({ limit: 100 })
      .then((res) => {
        if (res.success && res.customers) {
          setAllCustomers(res.customers);
        }
      })
      .catch((err) => console.warn('Could not load customers for filters:', err));
  }, []);

  // 1. Fetch Tab 1: Sales Report
  const fetchSalesReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportAPI.getSales({
        page: salesPage,
        limit: 10,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        customer: salesCustomer,
        status: salesStatus,
        search: salesSearch,
      });
      if (res.success) {
        setSalesData({
          invoices: res.invoices || [],
          metrics: res.metrics || { totalSales: 0, totalPaid: 0, totalOutstanding: 0 },
          chartData: res.chartData || [],
          pagination: res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 },
        });
      }
    } catch (err) {
      console.error('Fetch sales report error:', err);
      setError(err.message || 'Failed to load sales report');
    } finally {
      setLoading(false);
    }
  }, [salesPage, startDate, endDate, salesCustomer, salesStatus, salesSearch]);

  // 2. Fetch Tab 2: Receivables Report
  const fetchReceivablesReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportAPI.getReceivables({
        page: recPage,
        limit: 10,
        customer: recCustomer,
        agingCategory: recAgingCategory,
        search: recSearch,
      });
      if (res.success) {
        setReceivablesData({
          invoices: res.invoices || [],
          metrics: res.metrics || { totalReceivables: 0, totalOverdue: 0 },
          agingChartData: res.agingChartData || [],
          pagination: res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 },
        });
      }
    } catch (err) {
      console.error('Fetch receivables report error:', err);
      setError(err.message || 'Failed to load receivables report');
    } finally {
      setLoading(false);
    }
  }, [recPage, recCustomer, recAgingCategory, recSearch]);

  // 3. Fetch Tab 3: Tax Summary Report
  const fetchTaxReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportAPI.getTaxSummary({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        taxCategory,
      });
      if (res.success) {
        setTaxData({
          invoices: res.invoices || [],
          metrics: res.metrics || { taxableSales: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
          taxDistributionChart: res.taxDistributionChart || [],
          slabBreakdown: res.slabBreakdown || [],
        });
      }
    } catch (err) {
      console.error('Fetch tax report error:', err);
      setError(err.message || 'Failed to load tax report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, taxCategory]);

  // 4. Fetch Tab 4: Customer Ledger
  const fetchLedgerReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportAPI.getCustomerLedger({
        customerId: selectedCustomerId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.success) {
        setLedgerData(res);
        if (!selectedCustomerId && res.customer) {
          setSelectedCustomerId(res.customer._id);
        }
      }
    } catch (err) {
      console.error('Fetch ledger report error:', err);
      setError(err.message || 'Failed to load customer ledger');
    } finally {
      setLoading(false);
    }
  }, [selectedCustomerId, startDate, endDate]);

  // Tab Switch Trigger
  useEffect(() => {
    if (activeTab === 'sales') fetchSalesReport();
    else if (activeTab === 'receivables') fetchReceivablesReport();
    else if (activeTab === 'tax') fetchTaxReport();
    else if (activeTab === 'ledger') fetchLedgerReport();
  }, [activeTab, fetchSalesReport, fetchReceivablesReport, fetchTaxReport, fetchLedgerReport]);

  // Export to CSV Functionality
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `Report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'sales') {
      headers = ['Invoice Number', 'Customer', 'Invoice Date', 'Total Amount (INR)', 'Paid Amount (INR)', 'Balance Due (INR)', 'Status'];
      rows = salesData.invoices.map((inv) => [
        inv.invoiceNumber,
        `"${inv.customerName}"`,
        formatDate(inv.invoiceDate),
        inv.totalAmount,
        inv.paidAmount,
        inv.balanceDue,
        inv.status,
      ]);
    } else if (activeTab === 'receivables') {
      headers = ['Customer', 'Invoice Number', 'Invoice Date', 'Due Date', 'Total Amount (INR)', 'Paid Amount (INR)', 'Outstanding Balance (INR)', 'Days Overdue', 'Aging Bucket'];
      rows = receivablesData.invoices.map((inv) => [
        `"${inv.customerName}"`,
        inv.invoiceNumber,
        formatDate(inv.invoiceDate),
        formatDate(inv.dueDate),
        inv.totalAmount,
        inv.paidAmount,
        inv.outstandingBalance,
        inv.daysOverdue,
        inv.agingCategory,
      ]);
    } else if (activeTab === 'tax') {
      headers = ['Invoice Number', 'Customer', 'Date', 'Taxable Amount (INR)', 'CGST (INR)', 'SGST (INR)', 'IGST (INR)', 'Total Tax (INR)', 'Total Amount (INR)', 'Type'];
      rows = taxData.invoices.map((inv) => [
        inv.invoiceNumber,
        `"${inv.customerName}"`,
        formatDate(inv.invoiceDate),
        inv.taxableAmount,
        inv.cgst,
        inv.sgst,
        inv.igst,
        inv.taxTotal,
        inv.totalAmount,
        inv.transactionType,
      ]);
    } else if (activeTab === 'ledger') {
      headers = ['Date', 'Transaction Type', 'Reference #', 'Description', 'Debit (INR)', 'Credit (INR)', 'Running Balance (INR)'];
      rows = ledgerData.ledger.map((entry) => [
        formatDate(entry.date),
        entry.type,
        entry.reference,
        `"${entry.description}"`,
        entry.debit,
        entry.credit,
        entry.runningBalance,
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="reports-page-content">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & EXPORT ACTIONS                            */}
      {/* ========================================================= */}
      <div className="reports-header-row no-print">
        <div>
          <h2 className="reports-main-title">Reports & Financial Analytics</h2>
          <p className="reports-sub-title">
            Consolidated sales reporting, aging receivables distribution, GST tax audits, and client ledger accounts.
          </p>
        </div>

        <div className="reports-header-actions">
          <Button
            variant="outline"
            icon={FileSpreadsheet}
            onClick={handleExportCSV}
            title="Export Active Report to CSV"
          >
            Export to CSV
          </Button>

          <Button
            variant="outline"
            icon={Printer}
            onClick={() => window.print()}
            title="Print or Save PDF"
          >
            Print / PDF
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
          className="mb-4 no-print"
        />
      )}

      {/* ========================================================= */}
      {/* 2. TAB NAVIGATION BAR                                     */}
      {/* ========================================================= */}
      <div className="reports-tab-nav no-print">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          <TrendingUp size={16} />
          <span>Tab 1 – Sales Invoice Report</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'receivables' ? 'active' : ''}`}
          onClick={() => setActiveTab('receivables')}
        >
          <Clock size={16} />
          <span>Tab 2 – Outstanding Receivables</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'tax' ? 'active' : ''}`}
          onClick={() => setActiveTab('tax')}
        >
          <Receipt size={16} />
          <span>Tab 3 – Tax Summary (GST)</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          <BookOpen size={16} />
          <span>Tab 4 – Customer Ledger</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SALES INVOICE REPORT                               */}
      {/* ========================================================= */}
      {activeTab === 'sales' && (
        <div className="tab-pane-content">
          {/* Summary Metric Chips */}
          <div className="report-summary-chips-row">
            <div className="report-chip chip-sales">
              <span className="chip-label">Total Invoiced Sales</span>
              <span className="chip-val text-primary">{formatINR(salesData.metrics.totalSales)}</span>
              <span className="chip-sub">{salesData.metrics.invoiceCount} invoices issued</span>
            </div>

            <div className="report-chip chip-paid">
              <span className="chip-label">Total Collections</span>
              <span className="chip-val text-success">{formatINR(salesData.metrics.totalPaid)}</span>
              <span className="chip-sub">Settled revenues</span>
            </div>

            <div className="report-chip chip-outstanding">
              <span className="chip-label">Pending Receivables</span>
              <span className="chip-val text-danger">{formatINR(salesData.metrics.totalOutstanding)}</span>
              <span className="chip-sub">Uncollected customer balance</span>
            </div>
          </div>

          {/* Monthly Sales vs Collections Recharts Chart */}
          {salesData.chartData.length > 0 && (
            <Card padding="normal" className="chart-card no-print">
              <h3 className="chart-title">Monthly Revenue Trend & Collections (INR)</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={salesData.chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="paidColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                    <YAxis stroke="#64748B" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip formatter={(value) => formatINR(value)} />
                    <Legend />
                    <Area type="monotone" dataKey="sales" name="Invoiced Sales" stroke="#2563EB" fillOpacity={1} fill="url(#salesColor)" />
                    <Area type="monotone" dataKey="collected" name="Collections" stroke="#16A34A" fillOpacity={1} fill="url(#paidColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Filters Bar */}
          <Card padding="normal" className="filters-card no-print">
            <div className="report-filters-grid">
              <div className="search-input-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search invoice # or customer..."
                  value={salesSearch}
                  onChange={(e) => {
                    setSalesSearch(e.target.value);
                    setSalesPage(1);
                  }}
                  className="search-field"
                />
              </div>

              <div className="filter-dropdown-wrap">
                <span className="filter-label">Customer:</span>
                <select
                  value={salesCustomer}
                  onChange={(e) => {
                    setSalesCustomer(e.target.value);
                    setSalesPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="All">All Customers</option>
                  {allCustomers.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-dropdown-wrap">
                <span className="filter-label">Status:</span>
                <select
                  value={salesStatus}
                  onChange={(e) => {
                    setSalesStatus(e.target.value);
                    setSalesPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Sent">Sent / Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div className="filter-date-wrap">
                <span className="filter-label">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="filter-date-input"
                />
              </div>

              <div className="filter-date-wrap">
                <span className="filter-label">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="filter-date-input"
                />
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card padding="none" className="table-card">
            <div className="table-responsive">
              <table className="report-master-table">
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Customer Name</th>
                    <th>Invoice Date</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                    <th style={{ textAlign: 'right' }}>Paid Amount</th>
                    <th style={{ textAlign: 'right' }}>Outstanding</th>
                    <th style={{ textAlign: 'center' }}>Invoice Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <RefreshCw className="animate-spin text-primary inline" size={20} /> Loading sales invoices...
                      </td>
                    </tr>
                  ) : salesData.invoices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No sales invoices found matching the specified parameters.
                      </td>
                    </tr>
                  ) : (
                    salesData.invoices.map((inv) => (
                      <tr key={inv._id}>
                        <td className="font-mono font-bold text-primary">
                          <button
                            type="button"
                            className="table-link-btn"
                            onClick={() => navigate(`/invoices/${inv._id}`)}
                          >
                            {inv.invoiceNumber}
                          </button>
                        </td>
                        <td className="font-medium">{inv.customerName}</td>
                        <td className="text-muted">{formatDate(inv.invoiceDate)}</td>
                        <td className="text-right font-semibold">{formatINR(inv.totalAmount)}</td>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {salesData.pagination.totalPages > 1 && (
              <div className="pagination-bar no-print">
                <span className="pagination-info">
                  Showing {(salesPage - 1) * 10 + 1} to {Math.min(salesPage * 10, salesData.pagination.total)} of {salesData.pagination.total} records
                </span>
                <div className="pagination-controls">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ChevronLeft}
                    disabled={salesPage === 1}
                    onClick={() => setSalesPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <span className="page-current">Page {salesPage} of {salesData.pagination.totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ChevronRight}
                    disabled={salesPage === salesData.pagination.totalPages}
                    onClick={() => setSalesPage((p) => Math.min(salesData.pagination.totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: OUTSTANDING RECEIVABLES REPORT                     */}
      {/* ========================================================= */}
      {activeTab === 'receivables' && (
        <div className="tab-pane-content">
          {/* Summary Chips */}
          <div className="report-summary-chips-row">
            <div className="report-chip chip-outstanding">
              <span className="chip-label">Total Outstanding Balance</span>
              <span className="chip-val text-danger">{formatINR(receivablesData.metrics.totalReceivables)}</span>
              <span className="chip-sub">{receivablesData.metrics.unpaidInvoiceCount} unpaid invoice(s)</span>
            </div>

            <div className="report-chip chip-overdue">
              <span className="chip-label">Overdue Portfolio</span>
              <span className="chip-val text-danger">{formatINR(receivablesData.metrics.totalOverdue)}</span>
              <span className="chip-sub">Past contractual due date</span>
            </div>
          </div>

          {/* Aging Distribution BarChart */}
          {receivablesData.agingChartData.length > 0 && (
            <Card padding="normal" className="chart-card no-print">
              <h3 className="chart-title">Aging Distribution of Receivables (INR)</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={receivablesData.agingChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="category" stroke="#64748B" fontSize={12} />
                    <YAxis stroke="#64748B" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip formatter={(val) => formatINR(val)} />
                    <Bar dataKey="amount" name="Outstanding Balance" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Filters Bar */}
          <Card padding="normal" className="filters-card no-print">
            <div className="report-filters-grid">
              <div className="search-input-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search invoice # or customer..."
                  value={recSearch}
                  onChange={(e) => {
                    setRecSearch(e.target.value);
                    setRecPage(1);
                  }}
                  className="search-field"
                />
              </div>

              <div className="filter-dropdown-wrap">
                <span className="filter-label">Aging Bucket:</span>
                <select
                  value={recAgingCategory}
                  onChange={(e) => {
                    setRecAgingCategory(e.target.value);
                    setRecPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="All">All Aging Buckets</option>
                  <option value="Current">Current / Not Overdue</option>
                  <option value="1-30 Days">1 - 30 Days Overdue</option>
                  <option value="31-60 Days">31 - 60 Days Overdue</option>
                  <option value="61-90 Days">61 - 90 Days Overdue</option>
                  <option value="90+ Days">90+ Days Delinquent</option>
                </select>
              </div>

              <div className="filter-dropdown-wrap">
                <span className="filter-label">Customer:</span>
                <select
                  value={recCustomer}
                  onChange={(e) => {
                    setRecCustomer(e.target.value);
                    setRecPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="All">All Customers</option>
                  {allCustomers.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Receivables Table */}
          <Card padding="none" className="table-card">
            <div className="table-responsive">
              <table className="report-master-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Invoice Number</th>
                    <th>Invoice Date</th>
                    <th>Due Date</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                    <th style={{ textAlign: 'right' }}>Paid Amount</th>
                    <th style={{ textAlign: 'right' }}>Outstanding</th>
                    <th style={{ textAlign: 'center' }}>Days Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5">
                        <RefreshCw className="animate-spin text-primary inline" size={20} /> Loading receivables...
                      </td>
                    </tr>
                  ) : receivablesData.invoices.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        No outstanding receivables found.
                      </td>
                    </tr>
                  ) : (
                    receivablesData.invoices.map((inv) => (
                      <tr key={inv._id}>
                        <td className="font-semibold text-dark">{inv.customerName}</td>
                        <td className="font-mono font-bold text-primary">
                          <button
                            type="button"
                            className="table-link-btn"
                            onClick={() => navigate(`/invoices/${inv._id}`)}
                          >
                            {inv.invoiceNumber}
                          </button>
                        </td>
                        <td className="text-muted">{formatDate(inv.invoiceDate)}</td>
                        <td className="text-muted">{formatDate(inv.dueDate)}</td>
                        <td className="text-right font-medium">{formatINR(inv.totalAmount)}</td>
                        <td className="text-right text-success">{formatINR(inv.paidAmount)}</td>
                        <td className="text-right font-bold text-danger">{formatINR(inv.outstandingBalance)}</td>
                        <td className="text-center">
                          {inv.daysOverdue > 0 ? (
                            <span className="overdue-tag tag-danger font-bold">
                              {inv.daysOverdue} days
                            </span>
                          ) : (
                            <span className="overdue-tag tag-normal">
                              Current
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {receivablesData.pagination.totalPages > 1 && (
              <div className="pagination-bar no-print">
                <span className="pagination-info">
                  Showing {(recPage - 1) * 10 + 1} to {Math.min(recPage * 10, receivablesData.pagination.total)} of {receivablesData.pagination.total} records
                </span>
                <div className="pagination-controls">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ChevronLeft}
                    disabled={recPage === 1}
                    onClick={() => setRecPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <span className="page-current">Page {recPage} of {receivablesData.pagination.totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ChevronRight}
                    disabled={recPage === receivablesData.pagination.totalPages}
                    onClick={() => setRecPage((p) => Math.min(receivablesData.pagination.totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: TAX SUMMARY REPORT (GST)                           */}
      {/* ========================================================= */}
      {activeTab === 'tax' && (
        <div className="tab-pane-content">
          {/* Summary Chips */}
          <div className="report-summary-chips-row">
            <div className="report-chip chip-sales">
              <span className="chip-label">Total Taxable Sales</span>
              <span className="chip-val text-primary">{formatINR(taxData.metrics.taxableSales)}</span>
              <span className="chip-sub">Net base revenue</span>
            </div>

            <div className="report-chip chip-tax">
              <span className="chip-label">CGST (Central Tax)</span>
              <span className="chip-val font-semibold">{formatINR(taxData.metrics.cgst)}</span>
              <span className="chip-sub">Intra-State portion</span>
            </div>

            <div className="report-chip chip-tax">
              <span className="chip-label">SGST (State Tax)</span>
              <span className="chip-val font-semibold">{formatINR(taxData.metrics.sgst)}</span>
              <span className="chip-sub">Local jurisdiction</span>
            </div>

            <div className="report-chip chip-tax">
              <span className="chip-label">IGST (Integrated Tax)</span>
              <span className="chip-val font-semibold">{formatINR(taxData.metrics.igst)}</span>
              <span className="chip-sub">Inter-State transfers</span>
            </div>

            <div className="report-chip chip-total-tax">
              <span className="chip-label">Total GST Collected</span>
              <span className="chip-val text-amber font-extrabold">{formatINR(taxData.metrics.totalTax)}</span>
              <span className="chip-sub">Government tax dues</span>
            </div>
          </div>

          {/* GST Slabs Breakdown Grid */}
          <div className="tax-slabs-grid">
            <Card padding="normal" className="slabs-card">
              <h3 className="card-title-sm mb-3">GST Slab-Wise Distribution</h3>
              <table className="slabs-table">
                <thead>
                  <tr>
                    <th>GST Slab Rate</th>
                    <th style={{ textAlign: 'right' }}>Taxable Sales</th>
                    <th style={{ textAlign: 'right' }}>Total Tax Liability</th>
                  </tr>
                </thead>
                <tbody>
                  {taxData.slabBreakdown.map((s) => (
                    <tr key={s.slab}>
                      <td className="font-bold">{s.slab} GST</td>
                      <td className="text-right">{formatINR(s.taxableAmount)}</td>
                      <td className="text-right font-bold text-primary">{formatINR(s.taxAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Tax Component Distribution Chart */}
            <Card padding="normal" className="chart-card no-print">
              <h3 className="card-title-sm mb-2">Tax Breakdown by Regime Component</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={taxData.taxDistributionChart} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" tickFormatter={(val) => `₹${val / 1000}k`} stroke="#64748B" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} width={130} />
                    <Tooltip formatter={(val) => formatINR(val)} />
                    <Bar dataKey="amount" name="Tax Amount" fill="#2563EB" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card padding="normal" className="filters-card no-print">
            <div className="report-filters-grid">
              <div className="filter-dropdown-wrap">
                <span className="filter-label">Tax Regime Category:</span>
                <select
                  value={taxCategory}
                  onChange={(e) => setTaxCategory(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Transactions (Intra & Inter-State)</option>
                  <option value="Intra-State">Intra-State (CGST + SGST)</option>
                  <option value="Inter-State">Inter-State (IGST)</option>
                </select>
              </div>

              <div className="filter-date-wrap">
                <span className="filter-label">From Date:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="filter-date-input"
                />
              </div>

              <div className="filter-date-wrap">
                <span className="filter-label">To Date:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="filter-date-input"
                />
              </div>
            </div>
          </Card>

          {/* Invoices Tax Table */}
          <Card padding="none" className="table-card">
            <div className="table-responsive">
              <table className="report-master-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Taxable Sales</th>
                    <th style={{ textAlign: 'right' }}>CGST</th>
                    <th style={{ textAlign: 'right' }}>SGST</th>
                    <th style={{ textAlign: 'right' }}>IGST</th>
                    <th style={{ textAlign: 'right' }}>Total Tax</th>
                    <th style={{ textAlign: 'center' }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="text-center py-5">
                        <RefreshCw className="animate-spin text-primary inline" size={20} /> Loading tax details...
                      </td>
                    </tr>
                  ) : taxData.invoices.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-5 text-muted">
                        No taxable invoices found for this period.
                      </td>
                    </tr>
                  ) : (
                    taxData.invoices.map((inv) => (
                      <tr key={inv._id}>
                        <td className="font-mono font-bold text-primary">
                          <button
                            type="button"
                            className="table-link-btn"
                            onClick={() => navigate(`/invoices/${inv._id}`)}
                          >
                            {inv.invoiceNumber}
                          </button>
                        </td>
                        <td className="font-medium">{inv.customerName}</td>
                        <td className="text-muted">{formatDate(inv.invoiceDate)}</td>
                        <td className="text-right font-medium">{formatINR(inv.taxableAmount)}</td>
                        <td className="text-right font-mono text-xs">{formatINR(inv.cgst || 0)}</td>
                        <td className="text-right font-mono text-xs">{formatINR(inv.sgst || 0)}</td>
                        <td className="text-right font-mono text-xs">{formatINR(inv.igst || 0)}</td>
                        <td className="text-right font-bold text-amber">{formatINR(inv.taxTotal)}</td>
                        <td className="text-center">
                          <Badge variant={inv.transactionType === 'Inter-State' ? 'warning' : 'primary'} size="sm">
                            {inv.transactionType || 'Intra-State'}
                          </Badge>
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
      {/* TAB 4: CUSTOMER LEDGER                                    */}
      {/* ========================================================= */}
      {activeTab === 'ledger' && (
        <div className="tab-pane-content">
          {/* Customer Selector & Profile Header Card */}
          <Card padding="normal" className="ledger-client-card no-print">
            <div className="client-select-row">
              <div className="filter-dropdown-wrap" style={{ flex: 1 }}>
                <label className="filter-label font-bold" htmlFor="ledger-cust-select">
                  Select Customer Account:
                </label>
                <select
                  id="ledger-cust-select"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="filter-select font-semibold"
                  style={{ width: '100%', maxWidth: '400px' }}
                >
                  {ledgerData.customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-date-wrap">
                <span className="filter-label">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="filter-date-input"
                />
              </div>

              <div className="filter-date-wrap">
                <span className="filter-label">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="filter-date-input"
                />
              </div>
            </div>

            {ledgerData.customer && (
              <div className="client-meta-banner mt-3">
                <div className="meta-box">
                  <span className="meta-lbl">Client Name</span>
                  <span className="meta-val font-bold text-dark">{ledgerData.customer.name}</span>
                </div>
                {ledgerData.customer.companyName && (
                  <div className="meta-box">
                    <span className="meta-lbl">Company</span>
                    <span className="meta-val">{ledgerData.customer.companyName}</span>
                  </div>
                )}
                <div className="meta-box">
                  <span className="meta-lbl">GSTIN</span>
                  <span className="meta-val font-mono">{ledgerData.customer.gstin || '—'}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-lbl">Email</span>
                  <span className="meta-val">{ledgerData.customer.email || '—'}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Ledger Financial Summary Strip */}
          <div className="ledger-balance-strip">
            <div className="balance-item">
              <span className="bal-lbl">Opening Balance</span>
              <span className="bal-val">{formatINR(ledgerData.openingBalance)}</span>
            </div>
            <div className="balance-item">
              <span className="bal-lbl">Period Invoices (Debits)</span>
              <span className="bal-val text-primary">+ {formatINR(ledgerData.totalDebits)}</span>
            </div>
            <div className="balance-item">
              <span className="bal-lbl">Payments & Credits</span>
              <span className="bal-val text-success">- {formatINR(ledgerData.totalCredits)}</span>
            </div>
            <div className="balance-item highlight-closing">
              <span className="bal-lbl">Closing Outstanding Balance</span>
              <span className={`bal-val font-extrabold ${ledgerData.closingBalance > 0 ? 'text-danger' : 'text-success'}`}>
                {formatINR(ledgerData.closingBalance)}
              </span>
            </div>
          </div>

          {/* Chronological Ledger Table */}
          <Card padding="none" className="table-card">
            <div className="table-responsive">
              <table className="report-master-table ledger-table">
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
                  {/* Opening Balance Row */}
                  <tr className="opening-balance-row">
                    <td className="text-muted">{startDate ? formatDate(startDate) : 'Start'}</td>
                    <td><Badge variant="default" size="sm">Opening</Badge></td>
                    <td className="font-mono text-muted">—</td>
                    <td className="font-semibold text-muted">Initial Opening Balance Forward</td>
                    <td className="text-right text-muted">—</td>
                    <td className="text-right text-muted">—</td>
                    <td className="text-right font-bold">{formatINR(ledgerData.openingBalance)}</td>
                  </tr>

                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <RefreshCw className="animate-spin text-primary inline" size={20} /> Loading ledger entries...
                      </td>
                    </tr>
                  ) : ledgerData.ledger.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No transactions recorded for this customer in the selected date window.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.ledger.map((entry, idx) => (
                      <tr key={idx} className="ledger-entry-row">
                        <td className="text-sm text-muted">{formatDate(entry.date)}</td>
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

                  {/* Closing Balance Row */}
                  <tr className="closing-balance-row">
                    <td colSpan="4" className="text-right font-bold">
                      CLOSING BALANCE DUE:
                    </td>
                    <td className="text-right font-bold text-dark">{formatINR(ledgerData.totalDebits)}</td>
                    <td className="text-right font-bold text-success">{formatINR(ledgerData.totalCredits)}</td>
                    <td className={`text-right font-extrabold text-base ${ledgerData.closingBalance > 0 ? 'text-danger' : 'text-success'}`}>
                      {formatINR(ledgerData.closingBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reports;
