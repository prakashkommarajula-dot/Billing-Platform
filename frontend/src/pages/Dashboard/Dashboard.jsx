import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  UserPlus,
  PackagePlus,
  BarChart3,
  ArrowUpRight,
  RefreshCw,
  Building,
  CreditCard,
  ArrowRight,
  TrendingUp,
  Receipt,
  Calendar,
  AlertCircle,
  Users,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, RoleBadge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import './dashboard.css';

// Currency Formatter in Indian Rupee (INR)
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

export const Dashboard = () => {
  const { user, role, isOwner } = useAuth();
  const navigate = useNavigate();

  // State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    const code = user?.invitationCode || 'APEX-2026';
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Fetch Dashboard Data from GET /api/dashboard/summary
  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await dashboardAPI.getSummary();
      if (res.success) {
        setData(res);
      } else {
        throw new Error(res.message || 'Failed to retrieve dashboard metrics');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Could not connect to backend server to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Summary Metrics Map
  const summary = data?.summary || {
    totalSales: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    outstandingReceivables: 0,
  };

  const monthlyRevenue = data?.monthlyRevenue || [];
  const recentInvoices = data?.recentInvoices || [];
  const recentPayments = data?.recentPayments || [];
  const outstandingInvoices = data?.outstandingInvoices || [];

  // Dynamic Month-over-Month (MoM) Revenue Calculation
  const momGrowth = React.useMemo(() => {
    if (!monthlyRevenue || monthlyRevenue.length < 2) return null;
    const currentMonth = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0;
    const previousMonth = monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 0;
    if (previousMonth === 0) {
      return currentMonth > 0 ? { text: '+100% MoM', isPositive: true } : null;
    }
    const diffPercent = ((currentMonth - previousMonth) / previousMonth) * 100;
    const rounded = Math.round(diffPercent * 10) / 10;
    return {
      text: `${rounded >= 0 ? '+' : ''}${rounded}% MoM vs prior month`,
      isPositive: rounded >= 0,
    };
  }, [monthlyRevenue]);

  // Helper for invoice status badge variant
  const getStatusVariant = (status) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Partially Paid':
        return 'info';
      case 'Overdue':
        return 'danger';
      case 'Draft':
      default:
        return 'default';
    }
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-month font-semibold">{label}</p>
          <div className="tooltip-item">
            <span className="tooltip-dot dot-revenue" />
            <span>Total Invoiced: <strong>{formatINR(payload[0]?.value)}</strong></span>
          </div>
          {payload[1] && (
            <div className="tooltip-item">
              <span className="tooltip-dot dot-collected" />
              <span>Payments Collected: <strong>{formatINR(payload[1]?.value)}</strong></span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-content">
      {/* ========================================================= */}
      {/* 1. TOP WELCOME & BUSINESS WORKSPACE BANNER                */}
      {/* ========================================================= */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-text-side">
          <div className="welcome-role-row">
            <span className="welcome-role-pill">
              Workspace Context: <RoleBadge role={role} size="sm" />
            </span>
            <span className="welcome-date">
              <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <h2 className="welcome-title">
            Welcome back, {user?.name || 'Business Leader'}! 👋
          </h2>
          <p className="welcome-desc">
            {user?.companyName ? (
              <>
                Operating billing & receivables for <strong>{user.companyName}</strong>.
              </>
            ) : (
              'Monitor real-time sales, track customer balances, and issue compliant tax invoices.'
            )}
          </p>
        </div>

        <div className="welcome-actions">
          <Button
            variant="outline"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => fetchDashboardData(true)}
            title="Refresh MongoDB Data"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/invoices/create')}
          >
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} className="mb-4">
          <div style={{ marginTop: '0.5rem' }}>
            <Button size="sm" variant="outline" onClick={() => fetchDashboardData()}>
              Retry Loading Data
            </Button>
          </div>
        </Alert>
      )}

      {/* ========================================================= */}
      {/* 2. 5 SUMMARY CARDS                                        */}
      {/* ========================================================= */}
      <div className="stats-grid-5">
        {/* Card 1: Total Sales */}
        <Card padding="normal" className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-title">Total Sales</span>
            <div className="stat-icon-box stat-icon-primary">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-card-value">
            {loading ? <span className="stat-skeleton" /> : formatINR(summary.totalSales)}
          </div>
          <div className={`stat-card-footer ${momGrowth ? (momGrowth.isPositive ? 'trend-up' : 'text-danger') : 'text-muted'}`}>
            <TrendingUp size={13} />
            <span>{momGrowth ? momGrowth.text : 'Cumulative billed revenue'}</span>
          </div>
        </Card>

        {/* Card 2: Total Invoices */}
        <Card padding="normal" className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-title">Total Invoices</span>
            <div className="stat-icon-box stat-icon-info">
              <FileText size={20} />
            </div>
          </div>
          <div className="stat-card-value">
            {loading ? <span className="stat-skeleton" /> : summary.totalInvoices}
          </div>
          <div className="stat-card-footer text-muted">
            <Receipt size={13} />
            <span>Generated tax invoices</span>
          </div>
        </Card>

        {/* Card 3: Paid Invoices */}
        <Card padding="normal" className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-title">Paid Invoices</span>
            <div className="stat-icon-box stat-icon-success">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="stat-card-value text-success">
            {loading ? <span className="stat-skeleton" /> : summary.paidInvoices}
          </div>
          <div className="stat-card-footer trend-up">
            <span>Settled in full</span>
          </div>
        </Card>

        {/* Card 4: Pending Invoices */}
        <Card padding="normal" className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-title">Pending Invoices</span>
            <div className="stat-icon-box stat-icon-warning">
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-card-value text-warning">
            {loading ? <span className="stat-skeleton" /> : summary.pendingInvoices}
          </div>
          <div className="stat-card-footer text-warning">
            <span>Awaiting full settlement</span>
          </div>
        </Card>

        {/* Card 5: Outstanding Receivables */}
        <Card padding="normal" className="stat-card stat-card-highlight">
          <div className="stat-card-top">
            <span className="stat-card-title">Outstanding Receivables</span>
            <div className="stat-icon-box stat-icon-danger">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="stat-card-value text-danger">
            {loading ? <span className="stat-skeleton" /> : formatINR(summary.outstandingReceivables)}
          </div>
          <div className="stat-card-footer text-danger">
            <span>Uncollected client balance</span>
          </div>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* 3. QUICK ACTIONS BAR                                      */}
      {/* ========================================================= */}
      <Card padding="sm" className="quick-actions-bar-card">
        <div className="quick-actions-bar">
          <div className="quick-actions-header">
            <span className="font-semibold text-sm">Quick Actions:</span>
          </div>
          <div className="quick-actions-buttons">
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() => navigate('/invoices/create')}
            >
              Create Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={UserPlus}
              onClick={() => navigate('/customers')}
            >
              Add Customer
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={PackagePlus}
              onClick={() => navigate('/products')}
            >
              Add Product
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={BarChart3}
              onClick={() => navigate('/reports')}
            >
              View Reports
            </Button>
          </div>
        </div>
      </Card>

      {/* ========================================================= */}
      {/* 4. REVENUE OVERVIEW: MONTHLY LINE CHART (RECHARTS)        */}
      {/* ========================================================= */}
      <Card padding="normal" className="revenue-chart-card">
        <Card.Header
          title="Revenue Overview"
          subtitle="Monthly billed invoice volume and payment collections (INR)"
          action={
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="ghost"
                size="sm"
                iconRight={ArrowRight}
                onClick={() => navigate('/reports')}
              >
                Detailed Analytics
              </Button>
            </div>
          }
        />
        <Card.Body>
          {loading ? (
            <div className="chart-loading-placeholder">
              <RefreshCw size={24} className="btn-spinner text-primary" />
              <span>Fetching financial trends from MongoDB...</span>
            </div>
          ) : (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart
                  data={monthlyRevenue}
                  margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#94A3B8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '1rem', fontSize: '0.825rem' }}
                  />
                  <Line
                    name="Invoiced Revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563EB"
                    strokeWidth={3}
                    dot={{ fill: '#2563EB', r: 4 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    name="Payments Collected"
                    type="monotone"
                    dataKey="paid"
                    stroke="#16A34A"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{ fill: '#16A34A', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ========================================================= */}
      {/* 5. TWO COLUMNS: RECENT INVOICES & OUTSTANDING INVOICES     */}
      {/* ========================================================= */}
      <div className="dashboard-grid-2">
        {/* Recent Invoices Table */}
        <Card padding="normal" className="dashboard-table-card">
          <Card.Header
            title="Recent Invoices"
            subtitle="Latest billing documents created across the organization"
            action={
              <Button
                variant="ghost"
                size="sm"
                iconRight={ArrowUpRight}
                onClick={() => navigate('/invoices')}
              >
                View All
              </Button>
            }
          />
          <Card.Body>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Customer Name</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        No invoices generated yet. Click "Create Invoice" to begin.
                      </td>
                    </tr>
                  ) : (
                    recentInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="font-mono font-semibold text-primary">
                          {inv.invoiceNumber}
                        </td>
                        <td className="font-medium">{inv.customerName}</td>
                        <td className="text-muted text-sm">{formatDate(inv.invoiceDate)}</td>
                        <td className="font-semibold">{formatINR(inv.totalAmount)}</td>
                        <td>
                          <Badge variant={getStatusVariant(inv.status)} size="sm" dot>
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>

        {/* Outstanding Invoices Table */}
        <Card padding="normal" className="dashboard-table-card">
          <Card.Header
            title="Outstanding Invoices"
            subtitle="Invoices with pending balances awaiting client settlement"
            action={
              <Button
                variant="ghost"
                size="sm"
                iconRight={ArrowUpRight}
                onClick={() => navigate('/invoices')}
              >
                Manage
              </Button>
            }
          />
          <Card.Body>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Customer Name</th>
                    <th>Due Date</th>
                    <th>Balance Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        All invoices are fully paid! No outstanding balances.
                      </td>
                    </tr>
                  ) : (
                    outstandingInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="font-mono font-semibold text-primary">
                          {inv.invoiceNumber}
                        </td>
                        <td className="font-medium">{inv.customerName}</td>
                        <td className="text-muted text-sm">{formatDate(inv.dueDate)}</td>
                        <td className="font-semibold text-danger">
                          {formatINR(inv.balanceDue)}
                        </td>
                        <td>
                          <Badge variant={getStatusVariant(inv.status)} size="sm" dot>
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* 6. RECENT PAYMENTS SECTION                                */}
      {/* ========================================================= */}
      <Card padding="normal" className="dashboard-table-card">
        <Card.Header
          title="Recent Payments"
          subtitle="Real-time audit log of customer settlements received"
          action={
            <Button
              variant="ghost"
              size="sm"
              iconRight={ArrowUpRight}
              onClick={() => navigate('/payments')}
            >
              All Payment Records
            </Button>
          }
        />
        <Card.Body>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Invoice Ref</th>
                  <th>Customer Name</th>
                  <th>Amount Settled</th>
                  <th>Payment Method</th>
                  <th>Payment Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      No payment transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono font-semibold text-primary">
                        {p.paymentNumber}
                      </td>
                      <td className="font-mono text-muted text-sm">
                        {p.invoiceNumber}
                      </td>
                      <td className="font-medium">{p.customerName}</td>
                      <td className="font-semibold text-success">
                        {formatINR(p.amount)}
                      </td>
                      <td>
                        <span className="payment-method-tag font-mono text-xs">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="text-muted text-sm">{formatDate(p.paymentDate)}</td>
                      <td>
                        <Badge
                          variant={p.status === 'Completed' ? 'success' : 'warning'}
                          size="sm"
                          dot
                        >
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      {/* ========================================================= */}
      {/* 7. BUSINESS WORKSPACE & TEAM COLLABORATION (OWNER/ADMIN)  */}
      {/* ========================================================= */}
      {(isOwner || role === 'Admin') && (
        <Card padding="normal" className="dashboard-table-card mt-4">
          <Card.Header
            title="Business Workspace & Team Governance"
            subtitle={`Multi-user access control and team delegation for ${user?.companyName || user?.businessName || 'Your Business'}`}
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="text-xs text-muted font-medium">Workspace Code:</span>
                <button
                  type="button"
                  className="invitation-code-pill"
                  onClick={handleCopyCode}
                  title="Click to copy invitation code"
                >
                  <span className="font-mono font-bold text-primary">
                    {user?.invitationCode || 'APEX-2026'}
                  </span>
                  {copiedCode ? (
                    <Check size={14} className="text-success" />
                  ) : (
                    <Copy size={14} className="text-muted" />
                  )}
                </button>
              </div>
            }
          />
          <Card.Body>
            <div className="workspace-team-grid">
              {/* Left Column: Assigned Accountants */}
              <div className="workspace-sub-card">
                <div className="workspace-sub-header">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-primary" />
                    <h4 className="workspace-sub-title">Assigned Accountants</h4>
                  </div>
                  <Badge variant="primary" size="sm">Workspace Delegation</Badge>
                </div>
                <p className="text-xs text-muted mb-3">
                  Accountants linked to this business can create invoices, manage payments, and generate GST statements.
                </p>

                <div className="workspace-user-list">
                  <div className="workspace-user-item">
                    <div className="w-user-avatar">AR</div>
                    <div className="w-user-info">
                      <span className="w-user-name">Ananya Roy</span>
                      <span className="w-user-email">accountant@apexenterprises.com</span>
                    </div>
                    <Badge variant="success" size="sm" dot>Active</Badge>
                  </div>

                  <div className="workspace-invite-box">
                    <span className="text-xs text-muted">
                      💡 <strong>Invite Team Member:</strong> New accountants can select <em>"{user?.companyName || user?.businessName || 'Apex Enterprises Pvt Ltd'}"</em> or enter Workspace Code <code>{user?.invitationCode || 'APEX-2026'}</code> during registration.
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Customer Portals & Ledger Links */}
              <div className="workspace-sub-card">
                <div className="workspace-sub-header">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-success" />
                    <h4 className="workspace-sub-title">Connected Client Accounts</h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconRight={ArrowRight}
                    onClick={() => navigate('/customers')}
                  >
                    View All Clients
                  </Button>
                </div>
                <p className="text-xs text-muted mb-3">
                  Customers linked to this organization can log into their Customer Portal (`/portal`) to inspect billing records and settle due payments.
                </p>

                <div className="workspace-user-list">
                  <div className="workspace-user-item">
                    <div className="w-user-avatar client-avatar">AC</div>
                    <div className="w-user-info">
                      <span className="w-user-name">Acme Cloud Technologies</span>
                      <span className="w-user-email">billing@acmecloud.com</span>
                    </div>
                    <Badge variant="success" size="sm">Portal Enabled</Badge>
                  </div>
                  <div className="workspace-user-item">
                    <div className="w-user-avatar client-avatar">GT</div>
                    <div className="w-user-info">
                      <span className="w-user-name">Global Tech Solutions</span>
                      <span className="w-user-email">customer@globaltech.com</span>
                    </div>
                    <Badge variant="success" size="sm">Portal Enabled</Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
