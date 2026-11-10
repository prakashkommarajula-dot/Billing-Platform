const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { demoPayments } = require('../utils/mockData');

// Helper for decimal-safe monetary rounding (2 decimal places)
const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

// @desc    Get all payments with search, filters, pagination & summary statistics
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res, next) => {
  try {
    const {
      search,
      paymentMethod,
      startDate,
      endDate,
      status,
      page = 1,
      limit = 10,
      sortBy = 'paymentDate',
      order = 'desc',
    } = req.query;

    const query = {};

    // 1. Role-based scoping
    if (req.user.role === 'Admin') {
      // Admin can view all payments
    } else if (req.user.role === 'Customer') {
      // Customer can only view their own payments
      const customerInvoices = await Invoice.find({
        $or: [{ customerEmail: req.user.email }, { customer: req.user._id }],
      }).select('_id');
      const invoiceIds = customerInvoices.map((inv) => inv._id);
      query.invoice = { $in: invoiceIds };
    } else {
      // Business Owner / Accountant: view business payments
      query.user = req.user._id;
    }

    // 2. Search by payment number, invoice number, customer name, transaction reference
    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      query.$or = [
        { paymentNumber: regex },
        { invoiceNumber: regex },
        { customerName: regex },
        { transactionReference: regex },
        { recordedByName: regex },
      ];
    }

    // 3. Payment Method Filter
    if (paymentMethod && paymentMethod !== 'All') {
      if (paymentMethod === 'Card') {
        query.paymentMethod = { $in: ['Card', 'Credit Card', 'Debit Card'] };
      } else {
        query.paymentMethod = paymentMethod;
      }
    }

    // 4. Status Filter
    if (status && status !== 'All') {
      query.status = status;
    }

    // 5. Date Range Filter
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }

    const currentPage = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (currentPage - 1) * pageSize;

    if (mongoose.connection.readyState !== 1) {
      let totalCollected = 0;
      let upiTotal = 0;
      let bankTotal = 0;
      let cardTotal = 0;
      let cashTotal = 0;

      demoPayments.forEach((p) => {
        const amt = p.amount || 0;
        totalCollected += amt;
        if (p.paymentMethod === 'UPI') upiTotal += amt;
        else if (p.paymentMethod === 'Bank Transfer') bankTotal += amt;
        else if (['Card', 'Credit Card'].includes(p.paymentMethod)) cardTotal += amt;
        else if (p.paymentMethod === 'Cash') cashTotal += amt;
      });

      return res.status(200).json({
        success: true,
        payments: demoPayments,
        metrics: {
          totalCollected,
          upiTotal,
          bankTotal,
          cardTotal,
          cashTotal,
          totalCount: demoPayments.length,
        },
        pagination: {
          total: demoPayments.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    }

    const totalCount = await Payment.countDocuments(query);

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const payments = await Payment.find(query)
      .populate('recordedBy', 'name email role')
      .populate('invoice', 'invoiceNumber totalAmount balanceDue status')
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    // Compute Summary Statistics
    const allMatching = await Payment.find(query);
    let totalCollected = 0;
    let upiTotal = 0;
    let bankTotal = 0;
    let cardTotal = 0;
    let cashTotal = 0;

    allMatching.forEach((p) => {
      if (p.status === 'Completed') {
        const amt = p.amount || 0;
        totalCollected += amt;
        if (p.paymentMethod === 'UPI') upiTotal += amt;
        else if (p.paymentMethod === 'Bank Transfer' || p.paymentMethod === 'Net Banking') bankTotal += amt;
        else if (['Card', 'Credit Card', 'Debit Card'].includes(p.paymentMethod)) cardTotal += amt;
        else if (p.paymentMethod === 'Cash') cashTotal += amt;
      }
    });

    res.status(200).json({
      success: true,
      payments,
      metrics: {
        totalCollected: round2(totalCollected),
        totalTransactions: allMatching.length,
        byMethod: {
          upi: round2(upiTotal),
          bankTransfer: round2(bankTotal),
          card: round2(cardTotal),
          cash: round2(cashTotal),
        },
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

// @desc    Get single payment by ID
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('invoice')
      .populate('customer')
      .populate('recordedBy', 'name email role');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    // Role verification
    if (
      req.user.role !== 'Admin' &&
      req.user.role !== 'Customer' &&
      String(payment.user) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Payment does not belong to your organization',
      });
    }

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of unpaid / partially paid invoices eligible for receiving payments
// @route   GET /api/payments/eligible-invoices
// @access  Private
const getEligibleInvoices = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        const query = {
          user: req.user._id,
          status: { $in: ['Sent', 'Partially Paid', 'Overdue'] },
          balanceDue: { $gt: 0 },
        };

        const invoices = await Invoice.find(query)
          .select('invoiceNumber customer customerName balanceDue totalAmount paidAmount invoiceDate dueDate')
          .sort({ invoiceDate: -1 });

        return res.status(200).json({
          success: true,
          invoices,
        });
      } catch (dbErr) {
        console.warn('[Payment] Eligible invoices DB query warning:', dbErr.message);
      }
    }

    const { demoInvoices } = require('../utils/mockData');
    const eligible = demoInvoices.filter(
      (i) => ['Sent', 'Partially Paid', 'Overdue'].includes(i.status) && (i.balanceDue || 0) > 0
    );

    res.status(200).json({
      success: true,
      invoices: eligible,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a new payment with balance validation and duplicate prevention
// @route   POST /api/payments
// @access  Private (Business Owner, Accountant, Admin)
const recordPayment = async (req, res, next) => {
  try {
    const {
      invoice: invoiceId,
      amount,
      paymentDate = new Date(),
      paymentMethod = 'Bank Transfer',
      transactionReference = '',
      notes = '',
    } = req.body;

    // 1. Basic validation
    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: 'Please select an invoice to apply this payment.',
      });
    }

    const payAmount = round2(Number(amount));
    if (isNaN(payAmount) || payAmount < 1.0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be at least ₹1.00.',
      });
    }

    // 2. Fetch Target Invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'The selected invoice does not exist.',
      });
    }

    // Role authorization check
    if (req.user.role !== 'Admin' && String(invoice.user) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: This invoice does not belong to your organization.',
      });
    }

    if (invoice.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot record payment for a cancelled invoice.',
      });
    }

    // 3. Prevent payments exceeding remaining balance
    const currentBalance = round2(invoice.balanceDue);
    if (payAmount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount of ₹${payAmount.toLocaleString('en-IN')} exceeds the remaining balance of ₹${currentBalance.toLocaleString('en-IN')}. Overpayment is prohibited.`,
      });
    }

    // 4. Prevent duplicate payment processing with identical transaction reference
    const cleanRef = transactionReference ? transactionReference.trim() : '';
    if (cleanRef) {
      const duplicate = await Payment.findOne({
        invoice: invoice._id,
        transactionReference: cleanRef,
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Duplicate payment detected: A payment with reference "${cleanRef}" (Payment ID: ${duplicate.paymentNumber}) was already recorded on ${new Date(duplicate.paymentDate).toLocaleDateString('en-IN')}.`,
        });
      }
    }

    // 5. Generate Sequential Payment Number (e.g. PAY-2026-0001)
    const year = new Date().getFullYear();
    const existingPayments = await Payment.find({ user: invoice.user }).select('paymentNumber');
    let maxNum = 0;
    existingPayments.forEach((p) => {
      const match = p.paymentNumber && p.paymentNumber.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const paymentNumber = `PAY-${year}-${(maxNum + 1).toString().padStart(4, '0')}`;

    // 6. Execute atomic update with transaction if available, or sequential save
    let session = null;
    let useTransaction = false;

    try {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } catch (e) {
      // Standalone MongoDB without replica set
      session = null;
      useTransaction = false;
    }

    try {
      const sessionOpt = useTransaction && session ? { session } : {};

      // Create Payment Document
      const paymentData = {
        user: invoice.user,
        invoice: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customer,
        customerName: invoice.customerName,
        paymentNumber,
        amount: payAmount,
        outstandingBeforePayment: currentBalance,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod,
        transactionReference: cleanRef,
        recordedBy: req.user._id,
        recordedByName: req.user.name || 'Accountant',
        status: 'Completed',
        notes: notes ? notes.trim() : '',
      };

      let newPayment;
      if (useTransaction) {
        const createdArray = await Payment.create([paymentData], sessionOpt);
        newPayment = createdArray[0];
      } else {
        newPayment = await Payment.create(paymentData);
      }

      // Update Invoice financials
      const newPaidAmount = round2(invoice.paidAmount + payAmount);
      const newBalanceDue = Math.max(0, round2(invoice.totalAmount - newPaidAmount));

      invoice.paidAmount = newPaidAmount;
      invoice.balanceDue = newBalanceDue;

      if (newBalanceDue <= 0 && invoice.totalAmount > 0) {
        invoice.status = 'Paid';
      } else if (newPaidAmount > 0) {
        invoice.status = 'Partially Paid';
      }

      await invoice.save(sessionOpt);

      if (useTransaction && session) {
        await session.commitTransaction();
      }

      res.status(201).json({
        success: true,
        message: `Payment of ₹${payAmount.toLocaleString('en-IN')} recorded successfully against ${invoice.invoiceNumber}.`,
        payment: newPayment,
        invoice: {
          _id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          paidAmount: invoice.paidAmount,
          balanceDue: invoice.balanceDue,
          status: invoice.status,
        },
      });
    } catch (err) {
      if (useTransaction && session) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  getEligibleInvoices,
  recordPayment,
};
