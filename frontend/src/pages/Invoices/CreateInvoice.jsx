import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FilePlus,
  Plus,
  Trash2,
  Calendar,
  User,
  Building,
  MapPin,
  Receipt,
  DollarSign,
  Percent,
  Eye,
  Printer,
  Save,
  Send,
  ArrowLeft,
  Sparkles,
  Package,
  Wrench,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { invoiceAPI, customerAPI, productAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { Input } from '../../components/common/Input';
import './create-invoice.css';

// Currency Formatter in INR
const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0);
};

// Date Formatter helper
const toInputDate = (date) => {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().split('T')[0];
};

export const CreateInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Initial Line Item Template
  const createEmptyItem = () => ({
    id: Date.now() + Math.random(),
    product: '',
    productCode: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    taxRate: 18,
  });

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(toInputDate(new Date()));
  const [dueDate, setDueDate] = useState(
    toInputDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000))
  );

  // Customer State
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [transactionType, setTransactionType] = useState('Intra-State'); // 'Intra-State' | 'Inter-State'

  // Products Catalog for Quick Selection
  const [productsCatalog, setProductsCatalog] = useState([]);

  // Line Items
  const [items, setItems] = useState([createEmptyItem()]);

  // Overall Discount & Payment
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  // Additional Information
  const [paymentTerms, setPaymentTerms] = useState('Net 15 Days');
  const [notes, setNotes] = useState(
    'Thank you for your business. Please remit payment on or before the due date.'
  );
  const [terms, setTerms] = useState(
    'Interest @ 18% per annum will be charged if payment is delayed beyond the agreed due date.'
  );

  // UI & Loading States
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch Next Invoice Number, Customers, and Products Catalog on mount
  useEffect(() => {
    const initializeData = async () => {
      setLoadingInitial(true);
      try {
        // 1. Next Invoice Number
        const numRes = await invoiceAPI.getNextNumber().catch(() => ({}));
        if (numRes.success && numRes.nextInvoiceNumber) {
          setInvoiceNumber(numRes.nextInvoiceNumber);
        } else {
          setInvoiceNumber(`INV-${new Date().getFullYear()}-001`);
        }

        // 2. Customers
        const custRes = await customerAPI.getAll({ limit: 100 }).catch(() => ({}));
        if (custRes.success && custRes.customers) {
          setCustomers(custRes.customers);
        }

        // 3. Products
        const prodRes = await productAPI.getAll({ limit: 100 }).catch(() => ({}));
        if (prodRes.success && prodRes.products) {
          setProductsCatalog(prodRes.products);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    initializeData();
  }, []);

  // Handle Customer Selection
  const handleSelectCustomer = (e) => {
    const cId = e.target.value;
    setSelectedCustomerId(cId);

    if (!cId) {
      setCustomerName('');
      setCustomerEmail('');
      setCustomerGstin('');
      setBillingAddress('');
      return;
    }

    const c = customers.find((item) => item._id === cId);
    if (c) {
      setCustomerName(c.name || '');
      setCustomerEmail(c.email || '');
      setCustomerGstin(c.gstin || c.taxId || '');

      const street = c.billingAddress?.street || '';
      const city = c.billingAddress?.city || '';
      const state = c.billingAddress?.state || '';
      const zip = c.billingAddress?.postalCode || c.billingAddress?.zipCode || '';
      const full = [street, city, state, zip].filter(Boolean).join(', ');
      setBillingAddress(full || street);

      // Auto-detect Intra-state vs Inter-state based on State
      const userState = user?.businessAddress?.state || 'Karnataka';
      if (state && userState && state.toLowerCase().trim() !== userState.toLowerCase().trim()) {
        setTransactionType('Inter-State');
      } else {
        setTransactionType('Intra-State');
      }
    }
  };

  // Handle Item Row Changes
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Quick Select Product from Catalog into a line item
  const handleProductSelect = (index, productId) => {
    if (!productId) return;
    const prod = productsCatalog.find((p) => p._id === productId);
    if (prod) {
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          product: prod._id,
          productCode: prod.productCode || '',
          description: prod.name + (prod.description ? ` - ${prod.description}` : ''),
          unitPrice: prod.price || 0,
          taxRate: prod.taxRate !== undefined ? prod.taxRate : 18,
        };
        return updated;
      });
    }
  };

  // Add Item Row
  const handleAddItemRow = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  // Remove Item Row
  const handleRemoveItemRow = (index) => {
    if (items.length <= 1) {
      alert('An invoice must contain at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // =========================================================
  // REAL-TIME AUTOMATIC CALCULATIONS
  // =========================================================
  let subtotal = 0;
  let totalItemDiscount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const calculatedItems = items.map((item) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    const itemDisc = Math.max(0, Number(item.discount) || 0);
    const taxRate = Math.max(0, Number(item.taxRate) || 0);

    const baseAmount = qty * price;
    const taxable = Math.max(0, baseAmount - itemDisc);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (transactionType === 'Inter-State') {
      igst = (taxable * taxRate) / 100;
    } else {
      cgst = (taxable * (taxRate / 2)) / 100;
      sgst = (taxable * (taxRate / 2)) / 100;
    }

    const itemTotal = taxable + cgst + sgst + igst;

    subtotal += baseAmount;
    totalItemDiscount += itemDisc;
    totalCgst += cgst;
    totalSgst += sgst;
    totalIgst += igst;

    return {
      ...item,
      baseAmount,
      taxable,
      cgst,
      sgst,
      igst,
      itemTotal,
    };
  });

  const overallDisc = Math.max(0, Number(overallDiscount) || 0);
  const totalDiscount = totalItemDiscount + overallDisc;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const taxTotal = totalCgst + totalSgst + totalIgst;
  const grandTotal = taxableAmount + taxTotal;
  const paid = Math.max(0, Number(paidAmount) || 0);
  const balanceDue = Math.max(0, grandTotal - paid);

  // Validate before submission
  const validateInvoice = () => {
    if (!customerName.trim()) {
      setError('Please select or specify a customer name.');
      return false;
    }

    if (!items.length) {
      setError('At least one item is required.');
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].description.trim()) {
        setError(`Item #${i + 1} requires a valid description.`);
        return false;
      }
      const qty = Number(items[i].quantity);
      if (isNaN(qty) || qty < 1) {
        setError(`Item #${i + 1} quantity must be 1 or greater.`);
        return false;
      }
      const price = Number(items[i].unitPrice);
      if (isNaN(price) || price <= 0) {
        setError(`Item #${i + 1} unit price must be greater than ₹0.00.`);
        return false;
      }
    }

    return true;
  };

  // Submit Invoice (Draft or Sent)
  const handleSubmitInvoice = async (targetStatus = 'Sent') => {
    setError('');
    setSuccessMessage('');

    if (!validateInvoice()) return;

    setSubmitting(true);
    try {
      const payload = {
        invoiceNumber,
        invoiceDate,
        dueDate,
        customer: selectedCustomerId || null,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerGstin: customerGstin.trim(),
        billingAddress,
        transactionType,
        items: items.map((it) => ({
          product: it.product || null,
          productCode: it.productCode || '',
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          discount: Number(it.discount) || 0,
          taxRate: Number(it.taxRate) || 0,
        })),
        discount: overallDisc,
        paidAmount: paid,
        status: targetStatus,
        paymentTerms,
        notes,
        terms,
      };

      const res = await invoiceAPI.create(payload);

      if (res.success) {
        setSuccessMessage(`Invoice ${res.invoice.invoiceNumber} generated successfully!`);
        setTimeout(() => {
          navigate('/invoices');
        }, 1200);
      }
    } catch (err) {
      console.error('Invoice creation error:', err);
      setError(err.message || 'Failed to generate invoice. Please check the fields and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-invoice-page">
      {/* Top Header */}
      <div className="create-invoice-header">
        <div>
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate('/invoices')}
          >
            <ArrowLeft size={16} />
            <span>Back to Invoices</span>
          </button>
          <h2 className="page-main-title">Create Tax Invoice</h2>
          <p className="page-main-subtitle">
            Generate GST-compliant tax invoices with automated CGST/SGST/IGST calculations and customer ledger updates.
          </p>
        </div>

        <div className="header-action-group">
          <Button
            variant="outline"
            icon={Eye}
            onClick={() => {
              if (validateInvoice()) setIsPreviewOpen(true);
            }}
          >
            Preview Document
          </Button>

          <Button
            variant="secondary"
            icon={Save}
            loading={submitting}
            onClick={() => handleSubmitInvoice('Draft')}
          >
            Save Draft
          </Button>

          <Button
            variant="primary"
            icon={Send}
            loading={submitting}
            onClick={() => handleSubmitInvoice('Sent')}
          >
            Generate & Issue Invoice
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} className="mb-4" />
      )}
      {successMessage && (
        <Alert type="success" message={successMessage} className="mb-4" />
      )}

      {/* Main Form Layout */}
      <div className="create-invoice-grid">
        <div className="form-main-column">
          {/* ========================================================= */}
          {/* SECTION 1: INVOICE & CUSTOMER DETAILS                     */}
          {/* ========================================================= */}
          <Card padding="normal" className="section-card">
            <Card.Header
              title="Section 1 – Invoice & Customer Details"
              subtitle="Invoice identification numbers and recipient client details"
            />
            <Card.Body>
              {/* Row 1: Invoice Number & Dates */}
              <div className="form-row-3">
                <Input
                  label="Invoice Number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-2026-008"
                  icon={Receipt}
                  required
                />

                <Input
                  label="Invoice Date"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  icon={Calendar}
                  required
                />

                <Input
                  label="Due Date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  icon={Calendar}
                  required
                />
              </div>

              {/* Row 2: Customer Selection & Tax Type */}
              <div className="form-row-2">
                <div className="input-group">
                  <label className="input-label" htmlFor="select-customer">
                    Select Customer <span className="input-required-star">*</span>
                  </label>
                  <div className="input-wrapper">
                    <select
                      id="select-customer"
                      value={selectedCustomerId}
                      onChange={handleSelectCustomer}
                      className="input-field"
                    >
                      <option value="">-- Choose Existing Client or Type Below --</option>
                      {customers.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} {c.companyName ? `(${c.companyName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* GST Transaction Type (Intra vs Inter State) */}
                <div className="input-group">
                  <label className="input-label">
                    GST Transaction Type <span className="input-required-star">*</span>
                  </label>
                  <div className="tax-type-toggle">
                    <button
                      type="button"
                      className={`tax-type-btn ${transactionType === 'Intra-State' ? 'active' : ''}`}
                      onClick={() => setTransactionType('Intra-State')}
                    >
                      Intra-State (CGST + SGST)
                    </button>
                    <button
                      type="button"
                      className={`tax-type-btn ${transactionType === 'Inter-State' ? 'active' : ''}`}
                      onClick={() => setTransactionType('Inter-State')}
                    >
                      Inter-State (IGST)
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 3: Customer Name, Email & GSTIN */}
              <div className="form-row-3">
                <Input
                  label="Customer / Client Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Acme Technologies"
                  icon={User}
                  required
                />

                <Input
                  label="Customer Email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="billing@client.com"
                />

                <Input
                  label="Customer GSTIN"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                  placeholder="29ABCDE1234F1Z5"
                  helperText={
                    transactionType === 'Intra-State'
                      ? 'Local supply subject to CGST + SGST'
                      : 'Interstate supply subject to IGST'
                  }
                />
              </div>

              {/* Row 4: Billing Address */}
              <div className="input-group">
                <label className="input-label" htmlFor="billing-address">
                  Billing Address
                </label>
                <div className="input-wrapper">
                  <span className="input-icon-left">
                    <MapPin size={18} />
                  </span>
                  <input
                    id="billing-address"
                    type="text"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="Street, City, State, PIN Code"
                    className="input-field has-icon-left"
                  />
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* ========================================================= */}
          {/* SECTION 2: ADD PRODUCTS AND SERVICES                      */}
          {/* ========================================================= */}
          <Card padding="normal" className="section-card">
            <Card.Header
              title="Section 2 – Products & Services Line Items"
              subtitle="Add deliverables from your catalog or define custom billing lines"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={handleAddItemRow}
                >
                  Add Item Row
                </Button>
              }
            />
            <Card.Body>
              <div className="table-responsive">
                <table className="items-table-grid">
                  <thead>
                    <tr>
                      <th style={{ width: '22%' }}>Catalog Quick-Select</th>
                      <th style={{ width: '28%' }}>Description *</th>
                      <th style={{ width: '10%' }}>Qty</th>
                      <th style={{ width: '13%' }}>Unit Price (₹)</th>
                      <th style={{ width: '10%' }}>Discount (₹)</th>
                      <th style={{ width: '10%' }}>GST Rate</th>
                      <th style={{ width: '12%', textAlign: 'right' }}>Total (₹)</th>
                      <th style={{ width: '5%', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculatedItems.map((it, idx) => (
                      <tr key={it.id || idx}>
                        {/* Catalog Select */}
                        <td>
                          <select
                            value={it.product || ''}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            className="item-input select-catalog-input"
                          >
                            <option value="">-- Custom Item --</option>
                            {productsCatalog.map((prod) => (
                              <option key={prod._id} value={prod._id}>
                                {prod.name} (₹{prod.price})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Description */}
                        <td>
                          <input
                            type="text"
                            value={it.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            placeholder="Deliverable description..."
                            className="item-input"
                            required
                          />
                        </td>

                        {/* Quantity */}
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="item-input text-center"
                            required
                          />
                        </td>

                        {/* Unit Price */}
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            className="item-input text-right"
                            required
                          />
                        </td>

                        {/* Discount */}
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.discount}
                            onChange={(e) => handleItemChange(idx, 'discount', e.target.value)}
                            className="item-input text-right"
                          />
                        </td>

                        {/* Tax Rate */}
                        <td>
                          <select
                            value={it.taxRate}
                            onChange={(e) => handleItemChange(idx, 'taxRate', Number(e.target.value))}
                            className="item-input text-center"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>

                        {/* Calculated Item Total */}
                        <td className="text-right font-semibold">
                          {formatINR(it.itemTotal)}
                        </td>

                        {/* Remove Row Button */}
                        <td className="text-center">
                          <button
                            type="button"
                            className="remove-item-btn"
                            onClick={() => handleRemoveItemRow(idx)}
                            title="Remove Line Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={handleAddItemRow}
                >
                  + Add Line Item
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* ========================================================= */}
          {/* SECTION 4: ADDITIONAL INFORMATION                         */}
          {/* ========================================================= */}
          <Card padding="normal" className="section-card">
            <Card.Header
              title="Section 4 – Additional Information & Terms"
              subtitle="Customer notes, payment terms, and legal billing conditions"
            />
            <Card.Body>
              <div className="form-row-2">
                <div className="input-group">
                  <label className="input-label" htmlFor="pay-terms">
                    Payment Terms
                  </label>
                  <div className="input-wrapper">
                    <select
                      id="pay-terms"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="input-field"
                    >
                      <option value="Due on Receipt">Due on Receipt</option>
                      <option value="Net 15 Days">Net 15 Days</option>
                      <option value="Net 30 Days">Net 30 Days</option>
                      <option value="Net 60 Days">Net 60 Days</option>
                      <option value="Custom">Custom Terms</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="inv-notes">
                    Customer Notes
                  </label>
                  <div className="input-wrapper">
                    <input
                      id="inv-notes"
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Thank you for your business."
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="inv-terms">
                  Terms & Conditions
                </label>
                <div className="input-wrapper">
                  <input
                    id="inv-terms"
                    type="text"
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Standard interest and legal jurisdiction conditions..."
                    className="input-field"
                  />
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: AUTOMATIC FINANCIAL CALCULATIONS (SIDE PANEL)  */}
        {/* ========================================================= */}
        <div className="calculations-sidebar-column">
          <Card padding="normal" className="calc-summary-card">
            <h3 className="calc-card-title">
              Section 3 – Financial Calculations
            </h3>
            <p className="calc-card-sub">
              Intra/Inter-State GST calculations in INR
            </p>

            <div className="calc-divider" />

            <div className="calc-rows-list">
              {/* Subtotal */}
              <div className="calc-row">
                <span className="calc-label">Subtotal:</span>
                <span className="calc-val">{formatINR(subtotal)}</span>
              </div>

              {/* Total Discount */}
              <div className="calc-row">
                <span className="calc-label">Item Discounts:</span>
                <span className="calc-val text-muted">- {formatINR(totalItemDiscount)}</span>
              </div>

              {/* Additional Overall Discount */}
              <div className="calc-row align-center">
                <span className="calc-label">Invoice Discount:</span>
                <div style={{ width: '110px' }}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={overallDiscount}
                    onChange={(e) => setOverallDiscount(e.target.value)}
                    className="calc-mini-input"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Taxable Amount */}
              <div className="calc-row font-medium">
                <span className="calc-label">Taxable Amount:</span>
                <span className="calc-val">{formatINR(taxableAmount)}</span>
              </div>

              <div className="calc-divider-dashed" />

              {/* Tax Breakdown: CGST & SGST or IGST */}
              {transactionType === 'Intra-State' ? (
                <>
                  <div className="calc-row">
                    <span className="calc-label">CGST (Central Tax):</span>
                    <span className="calc-val text-primary font-mono">{formatINR(totalCgst)}</span>
                  </div>
                  <div className="calc-row">
                    <span className="calc-label">SGST (State Tax):</span>
                    <span className="calc-val text-primary font-mono">{formatINR(totalSgst)}</span>
                  </div>
                </>
              ) : (
                <div className="calc-row">
                  <span className="calc-label">IGST (Integrated Tax):</span>
                  <span className="calc-val text-primary font-mono">{formatINR(totalIgst)}</span>
                </div>
              )}

              <div className="calc-row">
                <span className="calc-label">Total GST Tax:</span>
                <span className="calc-val font-semibold">{formatINR(taxTotal)}</span>
              </div>

              <div className="calc-divider" />

              {/* Grand Total */}
              <div className="calc-row grand-total-highlight">
                <span className="calc-label-lg">Grand Total:</span>
                <span className="calc-val-lg text-primary">{formatINR(grandTotal)}</span>
              </div>

              {/* Initial Amount Paid Input */}
              <div className="calc-row align-center" style={{ marginTop: '0.5rem' }}>
                <span className="calc-label font-semibold">Amount Paid:</span>
                <div style={{ width: '130px' }}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="calc-mini-input text-success font-semibold"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Outstanding Balance */}
              <div className="calc-row balance-highlight">
                <span className="calc-label-bold">Balance Due:</span>
                <span className={`calc-val-bold ${balanceDue > 0 ? 'text-danger' : 'text-success'}`}>
                  {formatINR(balanceDue)}
                </span>
              </div>
            </div>

            <div className="calc-footer-buttons">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                icon={Send}
                loading={submitting}
                onClick={() => handleSubmitInvoice('Sent')}
              >
                Generate & Issue Invoice
              </Button>

              <Button
                variant="outline"
                fullWidth
                icon={Save}
                loading={submitting}
                onClick={() => handleSubmitInvoice('Draft')}
              >
                Save as Draft
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* ========================================================= */}
      {/* INVOICE PREVIEW MODAL                                     */}
      {/* ========================================================= */}
      {isPreviewOpen && (
        <div className="modal-backdrop" onClick={() => setIsPreviewOpen(false)}>
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
                  <h3 className="modal-title">Invoice Preview</h3>
                  <p className="modal-subtitle">{invoiceNumber}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Button
                  variant="primary"
                  icon={Printer}
                  onClick={() => window.print()}
                >
                  Print / Download PDF
                </Button>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="invoice-print-sheet" id="printable-invoice">
              <div className="sheet-header">
                <div>
                  <div className="sheet-brand">
                    {user?.companyName || user?.businessName || 'BillFlow Billing Platform'}
                  </div>
                  <div className="sheet-sub">
                    Tax Invoice • GSTIN: {user?.taxId || '29ABCDE1234F1Z5'}
                  </div>
                </div>
                <div className="sheet-invoice-meta text-right">
                  <h2 className="sheet-tax-title">TAX INVOICE</h2>
                  <div className="sheet-meta-num font-mono">{invoiceNumber}</div>
                  <div className="sheet-status-tag">
                    <Badge variant="primary" size="sm">
                      {transactionType}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="sheet-divider" />

              <div className="sheet-parties-grid">
                <div>
                  <div className="sheet-meta-label">BILLED TO:</div>
                  <div className="sheet-client-name font-bold">{customerName}</div>
                  {customerGstin && (
                    <div className="sheet-meta-val font-mono">GSTIN: {customerGstin}</div>
                  )}
                  {billingAddress && (
                    <div className="sheet-meta-val">{billingAddress}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="sheet-date-row">
                    <span className="sheet-meta-label">Invoice Date:</span>{' '}
                    <span className="font-semibold">{invoiceDate}</span>
                  </div>
                  <div className="sheet-date-row">
                    <span className="sheet-meta-label">Due Date:</span>{' '}
                    <span className="font-semibold">{dueDate}</span>
                  </div>
                  <div className="sheet-date-row">
                    <span className="sheet-meta-label">Payment Terms:</span>{' '}
                    <span>{paymentTerms}</span>
                  </div>
                </div>
              </div>

              <table className="sheet-items-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-right">Discount</th>
                    <th className="text-center">GST %</th>
                    <th className="text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedItems.map((it, idx) => (
                    <tr key={idx}>
                      <td className="font-medium">{it.description}</td>
                      <td className="text-center">{it.quantity}</td>
                      <td className="text-right">{formatINR(it.unitPrice)}</td>
                      <td className="text-right text-muted">{it.discount > 0 ? formatINR(it.discount) : '—'}</td>
                      <td className="text-center">{it.taxRate}%</td>
                      <td className="text-right font-semibold">{formatINR(it.itemTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="sheet-totals-container">
                <div className="sheet-notes-box">
                  <span className="font-semibold text-xs text-muted">NOTES & TERMS:</span>
                  <p className="text-xs text-muted mt-1">{notes}</p>
                  <p className="text-xs text-muted mt-1">{terms}</p>
                </div>

                <div className="sheet-totals-table">
                  <div className="sheet-total-row">
                    <span>Subtotal:</span>
                    <span>{formatINR(subtotal)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="sheet-total-row text-muted">
                      <span>Total Discount:</span>
                      <span>- {formatINR(totalDiscount)}</span>
                    </div>
                  )}
                  <div className="sheet-total-row font-medium">
                    <span>Taxable Amount:</span>
                    <span>{formatINR(taxableAmount)}</span>
                  </div>
                  {transactionType === 'Intra-State' ? (
                    <>
                      <div className="sheet-total-row">
                        <span>CGST:</span>
                        <span>{formatINR(totalCgst)}</span>
                      </div>
                      <div className="sheet-total-row">
                        <span>SGST:</span>
                        <span>{formatINR(totalSgst)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="sheet-total-row">
                      <span>IGST:</span>
                      <span>{formatINR(totalIgst)}</span>
                    </div>
                  )}
                  <div className="sheet-total-row grand-total-row">
                    <span>Grand Total:</span>
                    <span className="text-primary">{formatINR(grandTotal)}</span>
                  </div>
                  <div className="sheet-total-row paid-row">
                    <span>Amount Paid:</span>
                    <span className="text-success">{formatINR(paid)}</span>
                  </div>
                  <div className="sheet-total-row balance-row">
                    <span>Balance Due:</span>
                    <span className={balanceDue > 0 ? 'text-danger' : 'text-success'}>
                      {formatINR(balanceDue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateInvoice;
