const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const User = require('../models/User');
const Payment = require('../models/Payment');
const CreditNote = require('../models/CreditNote');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { demoInvoices, demoUsers } = require('../utils/mockData');

// Helper for decimal-safe monetary rounding (2 decimal places)
const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

// Helper to recalculate all financial values on backend with GST breakdown
const calculateInvoiceTotals = (items = [], overallDiscount = 0, transactionType = 'Intra-State') => {
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

    const baseAmount = round2(qty * price);
    const taxable = Math.max(0, round2(baseAmount - itemDisc));

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (transactionType === 'Inter-State') {
      igst = round2(taxable * (taxRate / 100));
    } else {
      // Intra-State divides GST rate equally into CGST and SGST
      cgst = round2(taxable * (taxRate / 2) / 100);
      sgst = round2(taxable * (taxRate / 2) / 100);
    }

    const itemTotal = round2(taxable + cgst + sgst + igst);

    subtotal = round2(subtotal + baseAmount);
    totalItemDiscount = round2(totalItemDiscount + itemDisc);
    totalCgst = round2(totalCgst + cgst);
    totalSgst = round2(totalSgst + sgst);
    totalIgst = round2(totalIgst + igst);

    return {
      product: item.product || null,
      productCode: item.productCode || '',
      description: item.description || 'Deliverable Item',
      quantity: qty,
      unitPrice: price,
      discount: itemDisc,
      taxRate: taxRate,
      taxableAmount: taxable,
      cgst,
      sgst,
      igst,
      amount: itemTotal,
    };
  });

  const overallDisc = Math.max(0, Number(overallDiscount) || 0);
  const totalDiscount = round2(totalItemDiscount + overallDisc);
  const taxableAmount = Math.max(0, round2(subtotal - totalDiscount));
  const taxTotal = round2(totalCgst + totalSgst + totalIgst);
  const grandTotal = round2(taxableAmount + taxTotal);

  return {
    items: calculatedItems,
    subtotal,
    discount: totalDiscount,
    taxableAmount,
    cgst: totalCgst,
    sgst: totalSgst,
    igst: totalIgst,
    taxTotal,
    totalAmount: grandTotal,
  };
};

// @desc    Get next sequential invoice number reliably
// @route   GET /api/invoices/next-number
// @access  Private
const getNextInvoiceNumber = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const invoices = await Invoice.find({ user: userId }).select('invoiceNumber');
    let maxNum = 0;
    const year = new Date().getFullYear();

    invoices.forEach((inv) => {
      const match = inv.invoiceNumber && inv.invoiceNumber.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    const invoiceNumber = `INV-${year}-${nextNum}`;

    res.status(200).json({
      success: true,
      nextInvoiceNumber: invoiceNumber,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all invoices with search, filters & pagination
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res, next) => {
  try {
    const {
      search,
      customer,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    let query = {};

    // Role-based isolation
    if (req.user.role === 'Customer') {
      query.$or = [
        { customerEmail: req.user.email.toLowerCase() },
        { customer: req.user._id },
      ];
    } else {
      query.user = req.user._id;
    }

    // Search query
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { invoiceNumber: searchRegex },
        { customerName: searchRegex },
        { customerEmail: searchRegex },
      ];
    }

    // Customer filter
    if (customer && customer !== 'All') {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [{ customer: customer }, { customerName: new RegExp(`^${customer.trim()}$`, 'i') }],
      });
    }

    // Status filter
    if (status && status !== 'All') {
      if (status === 'Pending') {
        query.status = { $in: ['Sent', 'Pending'] };
      } else {
        query.status = status;
      }
    }

    // Date range filter
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = end;
      }
    }

    const currentPage = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (currentPage - 1) * pageSize;

    if (mongoose.connection.readyState !== 1) {
      let filtered = [...demoInvoices];
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(
          (inv) =>
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.customerName.toLowerCase().includes(q) ||
            inv.customerEmail.toLowerCase().includes(q)
        );
      }
      if (status && status !== 'All') {
        filtered = filtered.filter((inv) => inv.status === status);
      }

      let totalBilled = 0;
      let totalPaid = 0;
      let totalOutstanding = 0;
      filtered.forEach((inv) => {
        totalBilled += inv.totalAmount || 0;
        totalPaid += inv.paidAmount || 0;
        totalOutstanding += inv.balanceDue || 0;
      });

      return res.status(200).json({
        success: true,
        invoices: filtered,
        metrics: {
          totalBilled,
          totalPaid,
          totalOutstanding,
        },
        pagination: {
          total: filtered.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    }

    let totalCount = 0;
    let invoices = [];

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const invoices = await Invoice.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    // Auto-update Overdue status dynamically if dueDate has passed and balance remains
    const now = new Date();
    const evaluatedInvoices = invoices.map((inv) => {
      const invObj = inv.toObject();
      if (
        new Date(inv.dueDate) < now &&
        inv.balanceDue > 0 &&
        ['Sent', 'Pending', 'Partially Paid'].includes(inv.status)
      ) {
        invObj.status = 'Overdue';
      }
      return invObj;
    });

    // Compute Summary Totals for Header Cards
    const allMatching = await Invoice.find(query);
    let totalBilled = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    allMatching.forEach((inv) => {
      if (inv.status !== 'Draft' && inv.status !== 'Cancelled') {
        totalBilled += inv.totalAmount || 0;
        totalPaid += inv.paidAmount || 0;
        totalOutstanding += inv.balanceDue || 0;
      }
    });

    res.status(200).json({
      success: true,
      invoices: evaluatedInvoices,
      metrics: {
        totalBilled,
        totalPaid,
        totalOutstanding,
      },
      pagination: {
        total: totalCount,
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(totalCount / pageSize) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const fallbackBusiness = demoUsers['owner@apexenterprises.com'];

    if (
      mongoose.connection.readyState !== 1 ||
      rawId === 'details' ||
      !mongoose.Types.ObjectId.isValid(rawId)
    ) {
      const inv =
        demoInvoices.find(
          (i) => i._id === rawId || i.id === rawId || i.invoiceNumber === rawId
        ) || demoInvoices[0];
      return res.status(200).json({
        success: true,
        invoice: inv,
        business: fallbackBusiness,
      });
    }

    let invoice = null;
    try {
      invoice = await Invoice.findById(rawId).populate('customer');
    } catch (dbErr) {
      console.warn('[Invoice] Lookup warning:', dbErr.message);
    }

    if (!invoice) {
      const inv =
        demoInvoices.find(
          (i) => i._id === rawId || i.id === rawId || i.invoiceNumber === rawId
        ) || demoInvoices[0];
      return res.status(200).json({
        success: true,
        invoice: inv,
        business: fallbackBusiness,
      });
    }

    // Role check: customer can only view their own
    if (
      req.user.role === 'Customer' &&
      invoice.customerEmail !== req.user.email &&
      String(invoice.customer?._id) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this invoice',
      });
    } else if (
      req.user.role !== 'Admin' &&
      req.user.role !== 'Customer' &&
      String(invoice.user) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Invoice does not belong to your organization',
      });
    }

    const business = await User.findById(invoice.user).select(
      'name companyName businessName email phone taxId businessAddress'
    );

    res.status(200).json({
      success: true,
      invoice,
      business,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private (Business Owner, Accountant, Admin)
const createInvoice = async (req, res, next) => {
  try {
    const {
      customer,
      customerName,
      customerEmail,
      customerGstin,
      billingAddress,
      transactionType = 'Intra-State',
      invoiceNumber,
      invoiceDate,
      dueDate,
      items,
      discount = 0,
      paidAmount = 0,
      status,
      paymentTerms = 'Net 15 Days',
      notes,
      terms,
    } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required',
      });
    }

    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one line item is required to generate an invoice',
      });
    }

    // Auto-generate invoice number if missing: e.g. INV-2026-008
    let invNum = invoiceNumber;
    if (!invNum || !invNum.trim()) {
      const year = new Date().getFullYear();
      const count = await Invoice.countDocuments({ user: req.user._id });
      invNum = `INV-${year}-${(count + 1).toString().padStart(3, '0')}`;
    }

    // Check for duplicate invoice number within this business
    const existing = await Invoice.findOne({
      user: req.user._id,
      invoiceNumber: invNum.trim(),
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `An invoice with number "${invNum.trim()}" already exists for your business. Please select or refresh for a unique number.`,
      });
    }

    // Decimal-safe recalculation of all financial values on backend
    const totals = calculateInvoiceTotals(items, discount, transactionType);
    const initialPaid = round2(Number(paidAmount) || 0);
    const balanceDue = Math.max(0, round2(totals.totalAmount - initialPaid));

    let calculatedStatus = status || 'Sent';
    if (status !== 'Draft') {
      if (initialPaid >= totals.totalAmount && totals.totalAmount > 0) {
        calculatedStatus = 'Paid';
      } else if (initialPaid > 0) {
        calculatedStatus = 'Partially Paid';
      }
    }

    // Parse billing address
    let bAddr = {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
    };
    if (typeof billingAddress === 'string') {
      bAddr.street = billingAddress.trim();
    } else if (typeof billingAddress === 'object' && billingAddress !== null) {
      bAddr = { ...bAddr, ...billingAddress };
    }

    const invoice = await Invoice.create({
      user: req.user._id,
      customer: customer || null,
      customerName: customerName.trim(),
      customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : '',
      customerGstin: customerGstin ? customerGstin.trim().toUpperCase() : '',
      billingAddress: bAddr,
      transactionType: transactionType === 'Inter-State' ? 'Inter-State' : 'Intra-State',
      invoiceNumber: invNum.trim(),
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      items: totals.items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxableAmount: totals.taxableAmount,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      taxTotal: totals.taxTotal,
      totalAmount: totals.totalAmount,
      paidAmount: initialPaid,
      balanceDue,
      status: calculatedStatus,
      paymentTerms: paymentTerms || 'Net 15 Days',
      notes: notes ? notes.trim() : 'Thank you for your business. Please remit payment on or before the due date.',
      terms: terms ? terms.trim() : 'Interest @ 18% per annum will be charged if payment is delayed beyond the agreed due date.',
    });

    res.status(201).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} created successfully`,
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice (e.g. edit draft)
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found or access denied',
      });
    }

    if (invoice.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cancelled invoices cannot be modified.',
      });
    }

    const {
      customerName,
      customerEmail,
      invoiceDate,
      dueDate,
      items,
      discount,
      paidAmount,
      status,
      notes,
      terms,
    } = req.body;

    if (customerName) invoice.customerName = customerName.trim();
    if (customerEmail !== undefined) invoice.customerEmail = customerEmail.trim();
    if (invoiceDate) invoice.invoiceDate = new Date(invoiceDate);
    if (dueDate) invoice.dueDate = new Date(dueDate);

    // If items or discount changed, re-evaluate totals
    if (items && items.length) {
      const totals = calculateInvoiceTotals(items, discount !== undefined ? discount : invoice.discount);
      invoice.items = totals.items;
      invoice.subtotal = totals.subtotal;
      invoice.taxTotal = totals.taxTotal;
      invoice.discount = totals.discount;
      invoice.totalAmount = totals.totalAmount;
    }

    if (paidAmount !== undefined) {
      invoice.paidAmount = Number(paidAmount);
    }

    invoice.balanceDue = Math.max(0, invoice.totalAmount - invoice.paidAmount);

    if (status) {
      invoice.status = status;
    } else {
      if (invoice.paidAmount >= invoice.totalAmount && invoice.totalAmount > 0) {
        invoice.status = 'Paid';
      } else if (invoice.paidAmount > 0) {
        invoice.status = 'Partially Paid';
      }
    }

    if (notes !== undefined) invoice.notes = notes.trim();
    if (terms !== undefined) invoice.terms = terms.trim();

    const updated = await invoice.save();

    res.status(200).json({
      success: true,
      message: `Invoice ${updated.invoiceNumber} updated successfully`,
      invoice: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an invoice
// @route   POST /api/invoices/:id/cancel
// @access  Private
const cancelInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found or access denied',
      });
    }

    if (invoice.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This invoice is already marked as Cancelled.',
      });
    }

    if (invoice.status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot directly cancel a Paid invoice. Please issue a Credit Note instead.',
      });
    }

    const { reason } = req.body;

    invoice.status = 'Cancelled';
    invoice.balanceDue = 0;
    invoice.cancellationReason = reason ? reason.trim() : 'Cancelled by business owner';
    invoice.cancelledAt = new Date();

    await invoice.save();

    res.status(200).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} has been successfully cancelled.`,
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an invoice (Drafts only)
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found or access denied',
      });
    }

    if (invoice.status !== 'Draft' && req.user.role !== 'Admin') {
      return res.status(400).json({
        success: false,
        message: 'Only Draft invoices can be permanently deleted. For issued invoices, use Cancel Invoice.',
      });
    }

    await Invoice.findByIdAndDelete(invoice._id);

    res.status(200).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate / Download professional A4 invoice PDF using PDFKit
// @route   GET /api/invoices/:id/pdf
// @access  Private
const getInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('customer');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Role-based access check
    if (
      req.user.role === 'Customer' &&
      invoice.customerEmail !== req.user.email &&
      String(invoice.customer?._id) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: 'Access denied: Unauthorized invoice access' });
    } else if (
      req.user.role !== 'Admin' &&
      req.user.role !== 'Customer' &&
      String(invoice.user) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: 'Access denied: Invoice belongs to another organization' });
    }

    const business = await User.findById(invoice.user).select(
      'name companyName businessName email phone taxId businessAddress'
    );

    // If client explicitly requested JSON metadata
    if (req.query.format === 'json') {
      return res.status(200).json({
        success: true,
        invoice,
        business,
      });
    }

    // Generate real A4 PDF buffer with PDFKit
    const pdfBuffer = await generateInvoicePDF(invoice, business || {});

    // Set headers for PDF download or inline view
    const isInline = req.query.inline === 'true';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader(
      'Content-Disposition',
      `${isInline ? 'inline' : 'attachment'}; filename="Invoice-${invoice.invoiceNumber || 'INV'}.pdf"`
    );

    return res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// @desc    Record a payment against an invoice
// @route   POST /api/invoices/:id/payments
// @access  Private (Business Owner, Accountant, Admin)
const recordInvoicePayment = async (req, res, next) => {
  try {
    const {
      amount,
      paymentDate = new Date(),
      paymentMethod = 'Bank Transfer',
      transactionReference = '',
      notes = '',
    } = req.body;

    const paymentAmount = round2(Number(amount));
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0',
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Role check: Only business owner, accountant, or admin
    if (req.user.role !== 'Admin' && String(invoice.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (invoice.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot record payment for a cancelled invoice' });
    }

    // Generate payment number
    const paymentCount = await Payment.countDocuments({ user: invoice.user });
    const paymentNumber = `PAY-${new Date().getFullYear()}-${(paymentCount + 1).toString().padStart(4, '0')}`;

    // Create Payment record
    const payment = await Payment.create({
      user: invoice.user,
      invoice: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer,
      customerName: invoice.customerName,
      paymentNumber,
      amount: paymentAmount,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      transactionReference,
      status: 'Completed',
      notes,
    });

    // Update Invoice balance and paid amount
    const newPaidAmount = round2(invoice.paidAmount + paymentAmount);
    const newBalanceDue = Math.max(0, round2(invoice.totalAmount - newPaidAmount));

    invoice.paidAmount = newPaidAmount;
    invoice.balanceDue = newBalanceDue;

    if (newBalanceDue <= 0 && invoice.totalAmount > 0) {
      invoice.status = 'Paid';
    } else if (newPaidAmount > 0) {
      invoice.status = 'Partially Paid';
    }

    await invoice.save();

    res.status(201).json({
      success: true,
      message: `Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded successfully`,
      payment,
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment history for an invoice
// @route   GET /api/invoices/:id/payments
// @access  Private
const getInvoicePayments = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Role check
    if (
      req.user.role === 'Customer' &&
      invoice.customerEmail !== req.user.email &&
      String(invoice.customer?._id) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    } else if (
      req.user.role !== 'Admin' &&
      req.user.role !== 'Customer' &&
      String(invoice.user) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const payments = await Payment.find({ invoice: invoice._id }).sort({ paymentDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a credit note for an invoice
// @route   POST /api/invoices/:id/credit-notes
// @access  Private (Business Owner, Accountant, Admin)
const createInvoiceCreditNote = async (req, res, next) => {
  try {
    const { amount, reason = 'Price Adjustment', notes = '' } = req.body;
    const creditAmount = round2(Number(amount));

    if (!creditAmount || creditAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Credit amount must be greater than 0' });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Role check
    if (req.user.role !== 'Admin' && String(invoice.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const cnCount = await CreditNote.countDocuments({ user: invoice.user });
    const creditNoteNumber = `CN-${new Date().getFullYear()}-${(cnCount + 1).toString().padStart(4, '0')}`;

    const creditNote = await CreditNote.create({
      user: invoice.user,
      invoice: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer,
      customerName: invoice.customerName,
      creditNoteNumber,
      amount: creditAmount,
      reason,
      status: 'Issued',
      notes,
    });

    res.status(201).json({
      success: true,
      message: `Credit Note ${creditNote.creditNoteNumber} of ₹${creditAmount.toLocaleString('en-IN')} issued successfully`,
      creditNote,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  getNextInvoiceNumber,
  createInvoice,
  updateInvoice,
  cancelInvoice,
  deleteInvoice,
  getInvoicePDF,
  recordInvoicePayment,
  getInvoicePayments,
  createInvoiceCreditNote,
};
