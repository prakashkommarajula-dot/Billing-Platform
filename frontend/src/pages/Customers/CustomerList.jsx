import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Building,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Receipt,
  IndianRupee,
  ShieldAlert,
  FileSpreadsheet,
} from 'lucide-react';
import { customerAPI } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { Input } from '../../components/common/Input';
import './customers.css';

// Currency Formatter in INR
const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export const CustomerList = () => {
  const navigate = useNavigate();

  // State
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [balanceFilter, setBalanceFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Form State for Add / Edit
  const initialForm = {
    name: '',
    companyName: '',
    email: '',
    phone: '',
    gstin: '',
    billingAddress: '',
    state: '',
    city: '',
    postalCode: '',
    notes: '',
  };
  const [formData, setFormData] = useState(initialForm);

  // Fetch Customers from GET /api/customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page: currentPage,
        limit: pageSize,
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== 'All') params.status = statusFilter;

      const res = await customerAPI.getAll(params);

      if (res.success) {
        let items = res.customers || [];
        // Apply client-side balance filter if requested
        if (balanceFilter === 'WithBalance') {
          items = items.filter((c) => c.outstandingAmount > 0);
        } else if (balanceFilter === 'ZeroBalance') {
          items = items.filter((c) => !c.outstandingAmount || c.outstandingAmount === 0);
        }

        setCustomers(items);
        setPagination(res.pagination || { total: items.length, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'Failed to retrieve customer directory.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, balanceFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Form Validation
  const validateCustomerForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Customer name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address';
    }
    if (formData.phone && !/^[+0-9\s\-()]{7,20}$/.test(formData.phone.trim())) {
      errs.phone = 'Please provide a valid phone number';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData(initialForm);
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cust) => {
    setSelectedCustomer(cust);
    setFormData({
      name: cust.name || '',
      companyName: cust.companyName || '',
      email: cust.email || '',
      phone: cust.phone || '',
      gstin: cust.gstin || cust.taxId || '',
      billingAddress: cust.billingAddress?.street || '',
      state: cust.billingAddress?.state || '',
      city: cust.billingAddress?.city || '',
      postalCode: cust.billingAddress?.postalCode || cust.billingAddress?.zipCode || '',
      notes: cust.notes || '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (cust) => {
    setSelectedCustomer(cust);
    setIsDeleteModalOpen(true);
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateCustomerForm()) return;

    setFormSubmitting(true);
    try {
      const res = await customerAPI.create(formData);
      if (res.success) {
        setSuccessMessage(`Customer "${formData.name}" added successfully!`);
        setIsAddModalOpen(false);
        fetchCustomers();
      }
    } catch (err) {
      setError(err.message || 'Failed to create customer');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Update Submit
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!validateCustomerForm()) return;

    setFormSubmitting(true);
    try {
      const res = await customerAPI.update(selectedCustomer._id, formData);
      if (res.success) {
        setSuccessMessage(`Customer "${formData.name}" updated successfully!`);
        setIsEditModalOpen(false);
        fetchCustomers();
      }
    } catch (err) {
      setError(err.message || 'Failed to update customer');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete / Archive Submit
  const handleDeleteSubmit = async (archiveOnly = false) => {
    setFormSubmitting(true);
    try {
      const res = await customerAPI.delete(selectedCustomer._id, archiveOnly);
      if (res.success) {
        setSuccessMessage(res.message);
        setIsDeleteModalOpen(false);
        fetchCustomers();
      }
    } catch (err) {
      setError(err.message || 'Failed to remove customer');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="customer-page-content">
      {/* Top Header & Actions */}
      <div className="page-header-row">
        <div>
          <h2 className="header-title">Customer Directory</h2>
          <p className="header-subtitle">
            Manage your client master ledger, contact details, tax compliance IDs, and credit balances.
          </p>
        </div>
        <div className="header-actions">
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={() => fetchCustomers()}
            title="Refresh Directory"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={handleOpenAddModal}
          >
            Add Customer
          </Button>
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

      {/* Search & Filters Bar Card */}
      <Card padding="normal" className="filters-card">
        <div className="filters-bar-grid">
          {/* Search Input */}
          <div className="search-input-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by customer name, company, email, phone or GSTIN..."
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

          {/* Status Filter */}
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
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Balance Filter */}
          <div className="filter-dropdown-wrap">
            <span className="filter-label">Balance:</span>
            <select
              value={balanceFilter}
              onChange={(e) => {
                setBalanceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="All">All Balances</option>
              <option value="WithBalance">With Outstanding</option>
              <option value="ZeroBalance">Zero Balance</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Customers Table Card */}
      <Card padding="normal" className="table-card">
        <div className="table-responsive">
          <table className="custom-table customer-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>GSTIN</th>
                <th>City</th>
                <th className="text-center">Invoices</th>
                <th className="text-right">Outstanding</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-6">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                      <RefreshCw size={20} className="btn-spinner" />
                      <span>Loading customer accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8">
                    <div className="empty-state-box">
                      <Users size={40} className="empty-icon" />
                      <h4 className="empty-title">No customers found</h4>
                      <p className="empty-desc">
                        {searchTerm || statusFilter !== 'All'
                          ? 'Try adjusting your search criteria or clearing filters.'
                          : 'Get started by creating your first client account.'}
                      </p>
                      {!searchTerm && statusFilter === 'All' && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={UserPlus}
                          onClick={handleOpenAddModal}
                        >
                          Add Your First Customer
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="customer-row">
                    {/* Customer ID */}
                    <td className="font-mono font-semibold text-primary">
                      {c.customerId || `CUST-${c._id.slice(-4).toUpperCase()}`}
                    </td>

                    {/* Customer Name & Company */}
                    <td>
                      <div className="customer-name-cell">
                        <span className="customer-primary-name">{c.name}</span>
                        {c.companyName && (
                          <span className="customer-company-name">
                            <Building size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {c.companyName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="text-sm">
                      {c.email ? (
                        <span className="flex items-center gap-1">
                          <Mail size={13} className="text-muted" />
                          <span>{c.email}</span>
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="text-sm">
                      {c.phone ? (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone size={13} className="text-muted" />
                          <span>{c.phone}</span>
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* GSTIN */}
                    <td>
                      {c.gstin ? (
                        <span className="gstin-badge font-mono text-xs">
                          {c.gstin}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">Not Registered</span>
                      )}
                    </td>

                    {/* City */}
                    <td className="text-sm">
                      {c.billingAddress?.city ? (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-muted" />
                          <span>{c.billingAddress.city}</span>
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* Total Invoices */}
                    <td className="text-center font-semibold">
                      <span className="invoice-count-pill">
                        {c.totalInvoices || 0}
                      </span>
                    </td>

                    {/* Outstanding Amount */}
                    <td className="text-right font-semibold">
                      <span className={c.outstandingAmount > 0 ? 'text-danger' : 'text-success'}>
                        {formatINR(c.outstandingAmount)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="text-center">
                      <div className="action-buttons-wrap">
                        <button
                          type="button"
                          className="action-icon-btn action-view"
                          onClick={() => navigate(`/customers/details?id=${c._id}`)}
                          title="View Customer Profile & Ledger"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          className="action-icon-btn action-edit"
                          onClick={() => handleOpenEditModal(c)}
                          title="Edit Customer"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          type="button"
                          className="action-icon-btn action-delete"
                          onClick={() => handleOpenDeleteModal(c)}
                          title="Delete / Archive Customer"
                        >
                          <Trash2 size={16} />
                        </button>
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
              {customers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong>
              {Math.min(currentPage * pageSize, pagination.total || customers.length)}
            </strong>{' '}
            of <strong>{pagination.total || customers.length}</strong> customers
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
      {/* ADD / EDIT CUSTOMER MODAL DIALOG                          */}
      {/* ========================================================= */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
          }}
        >
          <div
            className="modal-card customer-form-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-box">
                  <UserPlus size={20} color="var(--primary-blue)" />
                </div>
                <div>
                  <h3 className="modal-title">
                    {isEditModalOpen ? 'Edit Customer Details' : 'Add New Customer'}
                  </h3>
                  <p className="modal-subtitle">
                    {isEditModalOpen
                      ? `Updating record for ${selectedCustomer?.name}`
                      : 'Register a client account to issue invoices and track balances.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={isEditModalOpen ? handleUpdateSubmit : handleCreateSubmit}>
              <div className="modal-body">
                {/* Row 1: Customer Name & Company Name */}
                <div className="modal-form-row">
                  <Input
                    label="Customer Name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Acme Technologies"
                    icon={Users}
                    error={formErrors.name}
                    required
                  />

                  <Input
                    label="Company Name"
                    name="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Acme Corp Pvt Ltd"
                    icon={Building}
                  />
                </div>

                {/* Row 2: Email & Phone */}
                <div className="modal-form-row">
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="billing@company.com"
                    icon={Mail}
                    error={formErrors.email}
                  />

                  <Input
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    icon={Phone}
                    error={formErrors.phone}
                  />
                </div>

                {/* Row 3: GSTIN (Tax Identification) */}
                <Input
                  label="GSTIN (Tax Identification)"
                  name="gstin"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  icon={Receipt}
                  helperText="15-digit GSTIN used for automated tax invoices and GSTR filing"
                />

                {/* Row 4: Billing Address (Street) */}
                <Input
                  label="Billing Street Address"
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  placeholder="e.g. 12 Electronic City Phase 1"
                  icon={MapPin}
                />

                {/* Row 5: City, State, Postal Code */}
                <div className="modal-form-row-3">
                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Bengaluru"
                  />

                  <Input
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Karnataka"
                  />

                  <Input
                    label="Postal Code"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="560100"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  disabled={formSubmitting}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  loading={formSubmitting}
                >
                  {isEditModalOpen ? 'Save Changes' : 'Create Customer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE / ARCHIVE CONFIRMATION MODAL                       */}
      {/* ========================================================= */}
      {isDeleteModalOpen && selectedCustomer && (
        <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div
            className="modal-card delete-confirm-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="delete-modal-content">
              <div className="delete-warning-icon">
                <AlertTriangle size={32} color="var(--danger-red)" />
              </div>

              <h3 className="delete-modal-title">
                Remove Customer Account?
              </h3>

              <p className="delete-modal-desc">
                You are about to delete <strong>{selectedCustomer.name}</strong> (
                {selectedCustomer.customerId}).
                {selectedCustomer.totalInvoices > 0 ? (
                  <span className="delete-audit-warning">
                    <br />
                    This customer has <strong>{selectedCustomer.totalInvoices}</strong> existing
                    invoices. To preserve legal accounting integrity, this customer will be safely{' '}
                    <strong>Archived</strong> rather than permanently wiped.
                  </span>
                ) : (
                  <span> This action cannot be undone.</span>
                )}
              </p>

              <div className="delete-modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  loading={formSubmitting}
                  onClick={() => handleDeleteSubmit(selectedCustomer.totalInvoices > 0)}
                >
                  {selectedCustomer.totalInvoices > 0 ? 'Archive Customer' : 'Delete Permanently'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
