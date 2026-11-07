import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Wrench,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Tag,
  Receipt,
  Layers,
  RefreshCw,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Building,
  DollarSign,
  Percent,
  SlidersHorizontal,
} from 'lucide-react';
import { productAPI } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { Input } from '../../components/common/Input';
import './products.css';

// Currency Formatter in INR
const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export const ProductList = () => {
  const navigate = useNavigate();

  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Form State for Add / Edit
  const initialForm = {
    name: '',
    productCode: '',
    description: '',
    category: 'General',
    type: 'Service',
    unit: 'Units',
    price: '',
    taxRate: 18,
    status: 'Active',
  };
  const [formData, setFormData] = useState(initialForm);

  // Common Unit Presets
  const commonUnits = ['Units', 'Hours', 'Days', 'Pcs', 'Month', 'Year', 'License', 'Box', 'Kg'];

  // Common Tax Rate Presets in India
  const taxRates = [0, 5, 12, 18, 28];

  // Fetch Products from GET /api/products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page: currentPage,
        limit: pageSize,
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (typeFilter !== 'All') params.type = typeFilter;
      if (statusFilter !== 'All') params.status = statusFilter;

      const res = await productAPI.getAll(params);

      if (res.success) {
        setProducts(res.products || []);
        if (res.categories && res.categories.length) {
          setCategories(res.categories);
        }
        setPagination(res.pagination || { total: res.products?.length || 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to retrieve products catalog.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, categoryFilter, typeFilter, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Form Validation
  const validateProductForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Product or service name is required';
    if (formData.price === '' || formData.price === null || isNaN(formData.price) || Number(formData.price) < 0) {
      errs.price = 'Please enter a valid price (greater than or equal to 0)';
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
  const handleOpenEditModal = (prod) => {
    setSelectedProduct(prod);
    setFormData({
      name: prod.name || '',
      productCode: prod.productCode || '',
      description: prod.description || '',
      category: prod.category || 'General',
      type: prod.type || 'Service',
      unit: prod.unit || 'Units',
      price: prod.price !== undefined ? prod.price : '',
      taxRate: prod.taxRate !== undefined ? prod.taxRate : 18,
      status: prod.status || 'Active',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (prod) => {
    setSelectedProduct(prod);
    setIsDeleteModalOpen(true);
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateProductForm()) return;

    setFormSubmitting(true);
    try {
      const res = await productAPI.create(formData);
      if (res.success) {
        setSuccessMessage(`Item "${formData.name}" added to catalog successfully!`);
        setIsAddModalOpen(false);
        fetchProducts();
      }
    } catch (err) {
      setError(err.message || 'Failed to create item');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Update Submit
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!validateProductForm()) return;

    setFormSubmitting(true);
    try {
      const res = await productAPI.update(selectedProduct._id, formData);
      if (res.success) {
        setSuccessMessage(`Item "${formData.name}" updated successfully!`);
        setIsEditModalOpen(false);
        fetchProducts();
      }
    } catch (err) {
      setError(err.message || 'Failed to update item');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete / Archive Submit
  const handleDeleteSubmit = async (archiveOnly = false) => {
    setFormSubmitting(true);
    try {
      const res = await productAPI.delete(selectedProduct._id, archiveOnly);
      if (res.success) {
        setSuccessMessage(res.message);
        setIsDeleteModalOpen(false);
        fetchProducts();
      }
    } catch (err) {
      setError(err.message || 'Failed to remove product');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="products-page-content">
      {/* Top Header & Actions */}
      <div className="page-header-row">
        <div>
          <h2 className="header-title">Products & Services Catalog</h2>
          <p className="header-subtitle">
            Manage your inventory of goods, service deliverables, SAC/HSN tax codes, and default unit prices.
          </p>
        </div>
        <div className="header-actions">
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={() => fetchProducts()}
            title="Refresh Catalog"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleOpenAddModal}
          >
            Add Product / Service
          </Button>
        </div>
      </div>

      {/* Success & Error Notifications */}
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
        <div className="products-filters-grid">
          {/* Search Field */}
          <div className="search-input-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, code/SKU, category or description..."
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

          {/* Type Filter */}
          <div className="filter-dropdown-wrap">
            <span className="filter-label">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="All">All Types</option>
              <option value="Service">Services</option>
              <option value="Product">Products</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="filter-dropdown-wrap">
            <span className="filter-label">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
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
              <option value="All">Active & Inactive</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Product Listing Table Card */}
      <Card padding="normal" className="table-card">
        <div className="table-responsive">
          <table className="custom-table product-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Item Name</th>
                <th>Code / SKU</th>
                <th>Category</th>
                <th className="text-center">Type</th>
                <th className="text-right">Unit Price</th>
                <th className="text-center">Tax Rate</th>
                <th className="text-center">Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-6">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                      <RefreshCw size={20} className="btn-spinner" />
                      <span>Loading products and services catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8">
                    <div className="empty-state-box">
                      <Package size={40} className="empty-icon" />
                      <h4 className="empty-title">No items found in catalog</h4>
                      <p className="empty-desc">
                        {searchTerm || categoryFilter !== 'All' || typeFilter !== 'All'
                          ? 'Try clearing active search terms or category filters.'
                          : 'Get started by adding your standard billable products and services.'}
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Plus}
                        onClick={handleOpenAddModal}
                      >
                        Add Item to Catalog
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr key={item._id} className="product-row">
                    {/* Product ID */}
                    <td className="font-mono font-semibold text-primary">
                      {item.productId || `PRD-${item._id.slice(-4).toUpperCase()}`}
                    </td>

                    {/* Product Name & Description */}
                    <td>
                      <div className="product-name-cell">
                        <span className="product-primary-name">{item.name}</span>
                        {item.description && (
                          <span className="product-desc-snippet">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Product Code / HSN / SAC */}
                    <td>
                      <span className="product-code-tag font-mono text-xs">
                        {item.productCode || '—'}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="text-sm">
                      <span className="category-pill font-medium">
                        {item.category || 'General'}
                      </span>
                    </td>

                    {/* Type (Product vs Service) */}
                    <td className="text-center">
                      <span className={`type-badge type-${item.type?.toLowerCase()}`}>
                        {item.type === 'Product' ? (
                          <>
                            <Package size={13} />
                            <span>Product</span>
                          </>
                        ) : (
                          <>
                            <Wrench size={13} />
                            <span>Service</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Price & Unit */}
                    <td className="text-right">
                      <div className="price-cell">
                        <span className="font-semibold">{formatINR(item.price)}</span>
                        <span className="unit-label text-xs text-muted">
                          / {item.unit || 'unit'}
                        </span>
                      </div>
                    </td>

                    {/* Tax Rate */}
                    <td className="text-center">
                      <span className="tax-rate-badge font-mono text-xs">
                        {item.taxRate}% GST
                      </span>
                    </td>

                    {/* Status */}
                    <td className="text-center">
                      <Badge
                        variant={item.status === 'Active' ? 'success' : 'default'}
                        size="sm"
                        dot
                      >
                        {item.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="text-center">
                      <div className="action-buttons-wrap">
                        <button
                          type="button"
                          className="action-icon-btn action-edit"
                          onClick={() => handleOpenEditModal(item)}
                          title="Edit Product / Service"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          type="button"
                          className="action-icon-btn action-delete"
                          onClick={() => handleOpenDeleteModal(item)}
                          title="Delete / Archive Item"
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
              {products.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong>
              {Math.min(currentPage * pageSize, pagination.total || products.length)}
            </strong>{' '}
            of <strong>{pagination.total || products.length}</strong> catalog items
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
      {/* ADD / EDIT PRODUCT MODAL DIALOG                           */}
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
            className="modal-card product-form-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-box">
                  <Package size={20} color="var(--primary-blue)" />
                </div>
                <div>
                  <h3 className="modal-title">
                    {isEditModalOpen ? 'Edit Catalog Item' : 'Add Product or Service'}
                  </h3>
                  <p className="modal-subtitle">
                    {isEditModalOpen
                      ? `Update specifications, pricing and tax rates for ${selectedProduct?.name}`
                      : 'Configure item pricing, default units, and GST tax percentages.'}
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
                {/* Type Selection Tabs */}
                <div className="type-toggle-container">
                  <label className="input-label" style={{ marginBottom: '0.4rem' }}>
                    Item Type <span className="input-required-star">*</span>
                  </label>
                  <div className="type-toggle-switch">
                    <button
                      type="button"
                      className={`type-switch-btn ${formData.type === 'Service' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, type: 'Service' })}
                    >
                      <Wrench size={16} />
                      <span>Service Deliverable</span>
                    </button>
                    <button
                      type="button"
                      className={`type-switch-btn ${formData.type === 'Product' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, type: 'Product' })}
                    >
                      <Package size={16} />
                      <span>Physical Product / Good</span>
                    </button>
                  </div>
                </div>

                {/* Row 1: Product Name & Code */}
                <div className="modal-form-row">
                  <Input
                    label="Item Name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={formData.type === 'Service' ? 'e.g. Cloud DevOps Consulting' : 'e.g. POS Thermal Printer'}
                    icon={Tag}
                    error={formErrors.name}
                    required
                  />

                  <Input
                    label={formData.type === 'Service' ? 'SAC Code / SKU' : 'HSN Code / SKU'}
                    name="productCode"
                    value={formData.productCode}
                    onChange={(e) => setFormData({ ...formData, productCode: e.target.value.toUpperCase() })}
                    placeholder={formData.type === 'Service' ? 'e.g. SAC-998313' : 'e.g. HSN-844332'}
                    icon={Receipt}
                    helperText="Standard tax classification code"
                  />
                </div>

                {/* Description */}
                <div className="input-group">
                  <label className="input-label" htmlFor="prod-desc">
                    Description
                  </label>
                  <div className="input-wrapper" style={{ height: 'auto', padding: '0.5rem 0.75rem' }}>
                    <textarea
                      id="prod-desc"
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief specification or scope of work that appears on invoice line items..."
                      className="input-textarea"
                    />
                  </div>
                </div>

                {/* Row 2: Category & Unit */}
                <div className="modal-form-row">
                  <div className="input-group">
                    <label className="input-label" htmlFor="prod-category">
                      Category
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="prod-category"
                        list="categories-datalist"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g. Software & Cloud, Hardware, Consulting"
                        className="input-field"
                      />
                      <datalist id="categories-datalist">
                        <option value="Consulting & Professional" />
                        <option value="Software & Cloud" />
                        <option value="Hardware & Devices" />
                        <option value="Maintenance & Support" />
                        <option value="Subscriptions" />
                        <option value="Logistics & Shipping" />
                      </datalist>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="prod-unit">
                      Billing Unit
                    </label>
                    <div className="input-wrapper">
                      <select
                        id="prod-unit"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="input-field"
                      >
                        {commonUnits.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Row 3: Price, Tax Rate & Status */}
                <div className="modal-form-row-3">
                  {/* Price */}
                  <Input
                    label="Unit Price (INR)"
                    type="number"
                    step="any"
                    name="price"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    icon={DollarSign}
                    error={formErrors.price}
                    required
                  />

                  {/* Tax Percentage */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="prod-tax">
                      GST Rate (%)
                    </label>
                    <div className="input-wrapper">
                      <select
                        id="prod-tax"
                        value={formData.taxRate}
                        onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                        className="input-field"
                      >
                        {taxRates.map((rate) => (
                          <option key={rate} value={rate}>
                            {rate}% GST
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="prod-status">
                      Status
                    </label>
                    <div className="input-wrapper">
                      <select
                        id="prod-status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="input-field"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
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
                  {isEditModalOpen ? 'Save Changes' : 'Create Item'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE / ARCHIVE CONFIRMATION MODAL                       */}
      {/* ========================================================= */}
      {isDeleteModalOpen && selectedProduct && (
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
                Remove Item from Catalog?
              </h3>

              <p className="delete-modal-desc">
                Are you sure you want to remove <strong>{selectedProduct.name}</strong> (
                {selectedProduct.productId}) from your active catalog?
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
                  onClick={() => handleDeleteSubmit(false)}
                >
                  Delete Item
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
