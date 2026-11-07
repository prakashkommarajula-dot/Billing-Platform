const mongoose = require('mongoose');
const CreditNote = require('../models/CreditNote');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { generateCreditNotePDF } = require('../utils/pdfGenerator');

// Decimal-safe rounding
const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

// @desc    Get all credit notes with search, filters, pagination & summary statistics
// @route   GET /api/credit-notes
// @access  Private
const getCreditNotes = async (req, res, next) => {
  try {
    const {
      search,
      reason,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'creditNoteDate',
      order = 'desc',
    } = req.query;

    const query = {};

    // 1. Role Scoping
    if (req.user.role === 'Admin') {
      // Admin sees all
    } else if (req.user.role === 'Customer') {
      const customerInvoices = await Invoice.find({
        $or: [{ customerEmail: req.user.email }, { customer: req.user._id }],
      }).select('_id');
      query.invoice = { $in: customerInvoices.map((i) => i._id) };
    } else {
      query.user = req.user._id;
    }

    // 2. Search
    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      query.$or = [
        { creditNoteNumber: regex },
        { invoiceNumber: regex },
        { customerName: regex },
        { reason: regex },
        { description: regex },
      ];
    }

    // 3. Reason filter
    if (reason && reason !== 'All') {
      query.reason = reason;
    }

    // 4. Status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    // 5. Date filter
    if (startDate || endDate) {
      query.creditNoteDate = {};
      if (startDate) query.creditNoteDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.creditNoteDate.$lte = end;
      }
    }

    const currentPage = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (currentPage - 1) * pageSize;

    const totalCount = await CreditNote.countDocuments(query);

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const creditNotes = await CreditNote.find(query)
      .populate('invoice', 'invoiceNumber totalAmount balanceDue status')
      .populate('recordedBy', 'name email role')
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    // Compute Summary Metrics
    const allMatching = await CreditNote.find(query);
    let totalCreditAmount = 0;
    let activeCreditsCount = 0;

    allMatching.forEach((cn) => {
      if (cn.status !== 'Cancelled') {
        totalCreditAmount += cn.amount || 0;
        activeCreditsCount += 1;
      }
    });

    res.status(200).json({
      success: true,
      creditNotes,
      metrics: {
        totalCreditAmount: round2(totalCreditAmount),
        totalCount: allMatching.length,
        activeCount: activeCreditsCount,
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

// @desc    Get single credit note by ID
// @route   GET /api/credit-notes/:id
// @access  Private
const getCreditNoteById = async (req, res, next) => {
  try {
    const creditNote = await CreditNote.findById(req.params.id)
      .populate('invoice')
      .populate('customer')
      .populate('recordedBy', 'name email role');

    if (!creditNote) {
      return res.status(404).json({
        success: false,
        message: 'Credit note not found',
      });
    }

    // Role check
    if (
      req.user.role !== 'Admin' &&
      req.user.role !== 'Customer' &&
      String(creditNote.user) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Credit note does not belong to your business',
      });
    }

    const business = await User.findById(creditNote.user).select(
      'name companyName businessName email phone taxId businessAddress'
    );

    res.status(200).json({
      success: true,
      creditNote,
      business,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get eligible invoices with outstanding balance for issuing credit notes
// @route   GET /api/credit-notes/eligible-invoices
// @access  Private
const getEligibleInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({
      user: req.user._id,
      status: { $in: ['Sent', 'Partially Paid', 'Overdue'] },
      balanceDue: { $gt: 0 },
    })
      .select('invoiceNumber customer customerName balanceDue totalAmount paidAmount invoiceDate dueDate')
      .sort({ invoiceDate: -1 });

    res.status(200).json({
      success: true,
      invoices,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create credit note, apply downward balance adjustment, and update customer balances
// @route   POST /api/credit-notes
// @access  Private (Business Owner, Accountant, Admin)
const createCreditNote = async (req, res, next) => {
  try {
    const {
      invoice: invoiceId,
      amount,
      creditNoteDate = new Date(),
      reason = 'Price Adjustment',
      description = '',
      notes = '',
    } = req.body;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: 'Please choose an original invoice to attach this credit note.',
      });
    }

    const creditAmount = round2(Number(amount));
    if (!creditAmount || creditAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Credit note amount must be greater than zero.',
      });
    }

    // 1. Fetch Target Invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Original invoice not found.',
      });
    }

    // Role check
    if (req.user.role !== 'Admin' && String(invoice.user) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Invoice belongs to another organization.',
      });
    }

    if (invoice.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot issue credit note against a cancelled invoice.',
      });
    }

    // 2. Prevent credit notes exceeding available invoice balance
    const currentBalance = round2(invoice.balanceDue);
    if (creditAmount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: `Credit amount of ₹${creditAmount.toLocaleString('en-IN')} exceeds the available invoice outstanding balance of ₹${currentBalance.toLocaleString('en-IN')}. Credit cannot exceed balance.`,
      });
    }

    // 3. Generate sequential Credit Note Number: CN-2026-0001
    const year = new Date().getFullYear();
    const existingCNs = await CreditNote.find({ user: invoice.user }).select('creditNoteNumber');
    let maxNum = 0;
    existingCNs.forEach((cn) => {
      const match = cn.creditNoteNumber && cn.creditNoteNumber.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const creditNoteNumber = `CN-${year}-${(maxNum + 1).toString().padStart(4, '0')}`;

    // 4. Calculate adjusted balances
    const newBalanceDue = Math.max(0, round2(currentBalance - creditAmount));

    // 5. Create Credit Note record
    const creditNote = await CreditNote.create({
      user: invoice.user,
      invoice: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer,
      customerName: invoice.customerName,
      creditNoteNumber,
      creditNoteDate: creditNoteDate ? new Date(creditNoteDate) : new Date(),
      amount: creditAmount,
      reason,
      description: description ? description.trim() : notes ? notes.trim() : '',
      invoiceBalanceBeforeCredit: currentBalance,
      invoiceBalanceAfterCredit: newBalanceDue,
      recordedBy: req.user._id,
      recordedByName: req.user.name || 'Accountant',
      status: 'Issued',
      notes: notes ? notes.trim() : '',
    });

    // 6. Update Invoice Balance & Status
    invoice.balanceDue = newBalanceDue;
    if (newBalanceDue === 0) {
      invoice.status = 'Paid';
    }
    await invoice.save();

    // 7. Update Customer Outstanding Balance if linked
    if (invoice.customer) {
      await Customer.findByIdAndUpdate(invoice.customer, {
        $inc: { outstandingBalance: -creditAmount },
      });
    }

    res.status(201).json({
      success: true,
      message: `Credit Note ${creditNote.creditNoteNumber} of ₹${creditAmount.toLocaleString('en-IN')} issued successfully. Invoice balance updated to ₹${newBalanceDue.toLocaleString('en-IN')}.`,
      creditNote,
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        balanceDue: invoice.balanceDue,
        status: invoice.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download professional A4 Credit Note PDF using PDFKit
// @route   GET /api/credit-notes/:id/pdf
// @access  Private
const getCreditNotePDF = async (req, res, next) => {
  try {
    const creditNote = await CreditNote.findById(req.params.id);
    if (!creditNote) {
      return res.status(404).json({ success: false, message: 'Credit note not found' });
    }

    // Role check
    if (
      req.user.role !== 'Admin' &&
      req.user.role !== 'Customer' &&
      String(creditNote.user) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const business = await User.findById(creditNote.user).select(
      'name companyName businessName email phone taxId businessAddress'
    );

    // If client requested JSON metadata
    if (req.query.format === 'json') {
      return res.status(200).json({
        success: true,
        creditNote,
        business,
      });
    }

    // Generate real A4 PDF buffer with PDFKit
    const pdfBuffer = await generateCreditNotePDF(creditNote, business || {});

    const isInline = req.query.inline === 'true';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader(
      'Content-Disposition',
      `${isInline ? 'inline' : 'attachment'}; filename="CreditNote-${creditNote.creditNoteNumber || 'CN'}.pdf"`
    );

    return res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCreditNotes,
  getCreditNoteById,
  getEligibleInvoices,
  createCreditNote,
  getCreditNotePDF,
};
