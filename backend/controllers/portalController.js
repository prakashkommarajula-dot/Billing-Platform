const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const CreditNote = require('../models/CreditNote');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { demoInvoices, demoPayments } = require('../utils/mockData');

const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

/**
 * Helper to resolve customer criteria and security scope
 */
const resolveCustomerScope = async (req) => {
  const isCustomerRole = req.user.role === 'Customer';

  let customerEmail = req.user.email.toLowerCase();
  let customerUserId = req.user._id;
  let customerDocId = null;

  // If Admin or Business Owner requested a specific customer view via query param
  if (!isCustomerRole && req.query.customerId) {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(req.query.customerId)) {
      try {
        const specifiedCust = await Customer.findById(req.query.customerId);
        if (specifiedCust) {
          customerEmail = specifiedCust.email.toLowerCase();
          customerDocId = specifiedCust._id;
        }
      } catch (e) {}
    }
  }

  // Find linked customer document
  let custDoc = null;
  if (mongoose.connection.readyState === 1) {
    try {
      custDoc = await Customer.findOne({
        $or: [{ email: customerEmail }, ...(customerDocId ? [{ _id: customerDocId }] : [])],
      });
    } catch (e) {}
  }

  const matchingDocIds = [customerUserId];
  if (custDoc) matchingDocIds.push(custDoc._id);

  const invoiceQuery = {
    $or: [
      { customerEmail: customerEmail },
      { customer: { $in: matchingDocIds } },
    ],
    status: { $ne: 'Draft' }, // Customers do not see Draft invoices
  };

  return {
    customerEmail,
    custDoc,
    invoiceQuery,
    isCustomerRole,
  };
};

// @desc    Get customer portal dashboard summary metrics and profile
// @route   GET /api/portal/summary
// @access  Private (Customer, Admin, Business Owner)
const getPortalSummary = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        metrics: {
          totalInvoices: demoInvoices.length,
          paidInvoices: 2,
          pendingInvoices: 2,
          outstandingBalance: 87000,
        },
        profile: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone || '+1 555-0199',
          companyName: req.user.companyName || 'Global Tech Solutions',
          gstin: req.user.taxId || 'US-EIN-9921827',
          billingAddress: req.user.businessAddress || {},
        },
        recentInvoices: demoInvoices.slice(0, 5),
        recentPayments: demoPayments.slice(0, 5),
      });
    }

    const { customerEmail, custDoc, invoiceQuery } = await resolveCustomerScope(req);

    const invoices = await Invoice.find(invoiceQuery).sort({ invoiceDate: -1 });

    let totalInvoices = invoices.length;
    let paidInvoices = 0;
    let pendingInvoices = 0;
    let outstandingBalance = 0;

    invoices.forEach((inv) => {
      if (inv.status === 'Paid') {
        paidInvoices += 1;
      } else if (['Sent', 'Partially Paid', 'Overdue', 'Pending'].includes(inv.status)) {
        pendingInvoices += 1;
        outstandingBalance += inv.balanceDue || 0;
      }
    });

    // Recent 5 Invoices
    const recentInvoices = invoices.slice(0, 5);

    // Fetch customer's payments
    const invoiceIds = invoices.map((i) => i._id);
    const recentPayments = await Payment.find({
      invoice: { $in: invoiceIds },
      status: 'Completed',
    })
      .sort({ paymentDate: -1 })
      .limit(5);

    // Customer profile info
    const profile = {
      name: req.user.name,
      email: customerEmail,
      phone: custDoc?.phone || req.user.phone || '',
      companyName: custDoc?.companyName || req.user.companyName || '',
      gstin: custDoc?.gstin || req.user.taxId || '',
      billingAddress: custDoc?.billingAddress || req.user.businessAddress || {},
    };

    res.status(200).json({
      success: true,
      metrics: {
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        outstandingBalance: round2(outstandingBalance),
      },
      profile,
      recentInvoices,
      recentPayments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer's own invoices
// @route   GET /api/portal/invoices
// @access  Private (Customer only views own)
const getPortalInvoices = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        invoices: demoInvoices,
        pagination: {
          total: demoInvoices.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    }

    const { invoiceQuery } = await resolveCustomerScope(req);
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = { ...invoiceQuery };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && search.trim()) {
      query.invoiceNumber = new RegExp(search.trim(), 'i');
    }

    const currentPage = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (currentPage - 1) * pageSize;

    const totalCount = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(pageSize);

    res.status(200).json({
      success: true,
      invoices,
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

// @desc    Get customer's own payment history
// @route   GET /api/portal/payments
// @access  Private
const getPortalPayments = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        payments: demoPayments,
      });
    }

    const { invoiceQuery } = await resolveCustomerScope(req);

    const customerInvoices = await Invoice.find(invoiceQuery).select('_id');
    const invoiceIds = customerInvoices.map((i) => i._id);

    const payments = await Payment.find({
      invoice: { $in: invoiceIds },
    }).sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer's credit notes
// @route   GET /api/portal/credit-notes
// @access  Private
const getPortalCreditNotes = async (req, res, next) => {
  try {
    const { demoCreditNotes } = require('../utils/mockData');
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        creditNotes: demoCreditNotes,
      });
    }

    const { invoiceQuery } = await resolveCustomerScope(req);

    const customerInvoices = await Invoice.find(invoiceQuery).select('_id');
    const invoiceIds = customerInvoices.map((i) => i._id);

    const creditNotes = await CreditNote.find({
      invoice: { $in: invoiceIds },
      status: { $ne: 'Cancelled' },
    }).sort({ creditNoteDate: -1 });

    res.status(200).json({
      success: true,
      creditNotes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer account statement
// @route   GET /api/portal/statement
// @access  Private
const getPortalStatement = async (req, res, next) => {
  try {
    const { demoCreditNotes } = require('../utils/mockData');
    if (mongoose.connection.readyState !== 1) {
      const allEntries = [];
      demoInvoices.forEach(inv => {
        allEntries.push({
          date: new Date(inv.invoiceDate),
          type: 'Invoice',
          reference: inv.invoiceNumber,
          description: `Tax Invoice - ${inv.status}`,
          debit: round2(inv.totalAmount || 0),
          credit: 0,
        });
      });
      demoPayments.forEach(p => {
        allEntries.push({
          date: new Date(p.paymentDate),
          type: 'Payment',
          reference: p.paymentNumber,
          description: `Payment via ${p.paymentMethod}`,
          debit: 0,
          credit: round2(p.amount || 0),
        });
      });
      allEntries.sort((a, b) => a.date - b.date);

      let run = 0;
      const ledger = allEntries.map(e => {
        run = round2(run + e.debit - e.credit);
        return { ...e, runningBalance: run };
      });

      return res.status(200).json({
        success: true,
        customer: {
          name: req.user.name,
          email: req.user.email,
          companyName: req.user.companyName || 'Global Tech Solutions',
          phone: req.user.phone || '+1 555-0199',
          gstin: req.user.taxId || 'US-EIN-9921827',
          billingAddress: req.user.businessAddress || {},
        },
        statement: {
          startDate: null,
          endDate: null,
          openingBalance: 0,
          closingBalance: run,
          periodDebits: 234660,
          periodCredits: 147660,
          ledger,
        },
      });
    }

    const { invoiceQuery, custDoc, customerEmail } = await resolveCustomerScope(req);
    const { startDate, endDate } = req.query;

    const invoices = await Invoice.find(invoiceQuery).select(
      'invoiceNumber invoiceDate totalAmount balanceDue status'
    );
    const invoiceIds = invoices.map((i) => i._id);

    const [payments, creditNotes] = await Promise.all([
      Payment.find({ invoice: { $in: invoiceIds }, status: 'Completed' }),
      CreditNote.find({ invoice: { $in: invoiceIds }, status: { $ne: 'Cancelled' } }),
    ]);

    const allEntries = [];

    // Invoices = Debit
    invoices.forEach((inv) => {
      allEntries.push({
        date: new Date(inv.invoiceDate),
        type: 'Invoice',
        reference: inv.invoiceNumber,
        description: `Tax Invoice - ${inv.status}`,
        debit: round2(inv.totalAmount || 0),
        credit: 0,
      });
    });

    // Payments = Credit
    payments.forEach((p) => {
      allEntries.push({
        date: new Date(p.paymentDate),
        type: 'Payment',
        reference: p.paymentNumber,
        description: `Payment via ${p.paymentMethod}`,
        debit: 0,
        credit: round2(p.amount || 0),
      });
    });

    // Credit Notes = Credit
    creditNotes.forEach((cn) => {
      allEntries.push({
        date: new Date(cn.creditNoteDate),
        type: 'Credit Note',
        reference: cn.creditNoteNumber,
        description: `Credit Note - ${cn.reason}`,
        debit: 0,
        credit: round2(cn.amount || 0),
      });
    });

    allEntries.sort((a, b) => a.date - b.date);

    let openingBalance = 0;
    let runningBalance = 0;
    const ledger = [];
    let periodDebits = 0;
    let periodCredits = 0;

    const startFilter = startDate ? new Date(startDate) : null;
    const endFilter = endDate ? new Date(endDate) : null;
    if (endFilter) endFilter.setHours(23, 59, 59, 999);

    allEntries.forEach((entry) => {
      if (startFilter && entry.date < startFilter) {
        openingBalance = round2(openingBalance + entry.debit - entry.credit);
      } else if (!endFilter || entry.date <= endFilter) {
        if (ledger.length === 0) {
          runningBalance = openingBalance;
        }
        runningBalance = round2(runningBalance + entry.debit - entry.credit);
        periodDebits = round2(periodDebits + entry.debit);
        periodCredits = round2(periodCredits + entry.credit);

        ledger.push({
          ...entry,
          runningBalance,
        });
      }
    });

    const closingBalance = ledger.length > 0
      ? ledger[ledger.length - 1].runningBalance
      : openingBalance;

    res.status(200).json({
      success: true,
      customer: {
        name: req.user.name,
        companyName: custDoc?.companyName || req.user.companyName,
        email: customerEmail,
        phone: custDoc?.phone || req.user.phone,
        gstin: custDoc?.gstin || req.user.taxId,
      },
      openingBalance: round2(openingBalance),
      closingBalance: round2(closingBalance),
      totalDebits: round2(periodDebits),
      totalCredits: round2(periodCredits),
      ledger,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update permitted profile details (phone, companyName, billingAddress)
// @route   PUT /api/portal/profile
// @access  Private (Customer, Admin)
const updatePortalProfile = async (req, res, next) => {
  try {
    const { phone, companyName, billingAddress } = req.body;

    if (mongoose.connection.readyState !== 1) {
      if (req.user) {
        if (phone !== undefined) req.user.phone = phone.trim();
        if (companyName !== undefined) req.user.companyName = companyName.trim();
        if (billingAddress) req.user.businessAddress = { ...(req.user.businessAddress || {}), ...billingAddress };
      }
      return res.status(200).json({
        success: true,
        message: 'Portal profile updated successfully (Demo Mode)',
        user: req.user,
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (phone !== undefined) user.phone = phone.trim();
    if (companyName !== undefined) user.companyName = companyName.trim();
    if (billingAddress) {
      user.businessAddress = {
        ...(user.businessAddress || {}),
        ...billingAddress,
      };
    }

    await user.save();

    // Also update matching Customer document if present
    const customer = await Customer.findOne({ email: user.email.toLowerCase() });
    if (customer) {
      if (phone !== undefined) customer.phone = phone.trim();
      if (companyName !== undefined) customer.companyName = companyName.trim();
      if (billingAddress) {
        customer.billingAddress = {
          ...(customer.billingAddress || {}),
          ...billingAddress,
        };
      }
      await customer.save();
    }

    res.status(200).json({
      success: true,
      message: 'Profile details updated successfully',
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        companyName: user.companyName,
        billingAddress: user.businessAddress,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process customer payment for an invoice (with simulated demo mode)
// @route   POST /api/portal/pay
// @access  Private (Customer, Admin, Business Owner)
const payPortalInvoice = async (req, res, next) => {
  try {
    const {
      invoiceId,
      amount,
      paymentMethod = 'UPI',
      transactionReference,
      notes = '',
    } = req.body;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID is required to process payment',
      });
    }

    const payAmount = round2(Number(amount));
    if (isNaN(payAmount) || payAmount < 1.0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be at least ₹1.00',
      });
    }

    // Resilient offline / demo fallback
    if (mongoose.connection.readyState !== 1) {
      const demoInv = demoInvoices.find((i) => i._id === invoiceId || i.id === invoiceId) || demoInvoices[0];
      const receiptNo = `RCPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const ref = transactionReference || `SIM-UPI-${Date.now().toString().slice(-6)}`;
      const newPaid = round2((demoInv.paidAmount || 0) + payAmount);
      const newBalance = Math.max(0, round2((demoInv.totalAmount || 10000) - newPaid));
      const newStatus = newBalance === 0 ? 'Paid' : 'Partially Paid';

      demoInv.paidAmount = newPaid;
      demoInv.balanceDue = newBalance;
      demoInv.status = newStatus;

      const demoPaymentRecord = {
        _id: 'pay_' + Date.now(),
        paymentNumber: receiptNo,
        invoice: demoInv._id,
        invoiceNumber: demoInv.invoiceNumber,
        customerName: req.user.name,
        amount: payAmount,
        paymentDate: new Date(),
        paymentMethod,
        transactionReference: ref,
        status: 'Completed',
        isSimulatedDemo: true,
        notes: notes || 'Simulated Customer Portal Payment',
      };
      demoPayments.unshift(demoPaymentRecord);

      return res.status(200).json({
        success: true,
        message: `Payment of ₹${payAmount.toLocaleString('en-IN')} processed successfully! (Simulated Academic Demo)`,
        receipt: {
          receiptNumber: receiptNo,
          invoiceNumber: demoInv.invoiceNumber,
          invoiceId: demoInv._id,
          amountPaid: payAmount,
          remainingBalance: newBalance,
          paymentDate: new Date(),
          paymentMethod,
          transactionReference: ref,
          status: 'Completed',
          customerName: req.user.name,
          businessName: demoInv.companyName || 'Apex Enterprises Pvt Ltd',
          isSimulated: true,
        },
        invoice: demoInv,
      });
    }

    // 1. Fetch Target Invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'The requested invoice was not found',
      });
    }

    // 2. Authorization: Customer can only pay their own invoices
    const isCustomer = req.user.role === 'Customer';
    if (isCustomer) {
      const matchEmail = (invoice.customerEmail || '').toLowerCase() === req.user.email.toLowerCase();
      const matchUserId = String(invoice.customer) === String(req.user._id);
      const matchCustRecord = req.user.customerRecord && String(invoice.customer) === String(req.user.customerRecord);
      if (!matchEmail && !matchUserId && !matchCustRecord) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to pay this invoice',
        });
      }
    }

    if (invoice.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot process payment for a cancelled invoice',
      });
    }

    if (invoice.status === 'Paid' || invoice.balanceDue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This invoice has already been fully settled',
      });
    }

    // 3. Overpayment check
    const currentBalance = round2(invoice.balanceDue);
    if (payAmount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount of ₹${payAmount.toLocaleString('en-IN')} exceeds remaining balance of ₹${currentBalance.toLocaleString('en-IN')}. Overpayment is prohibited.`,
      });
    }

    // 4. Generate Unique Sequential Receipt / Payment Number
    const year = new Date().getFullYear();
    const payCount = await Payment.countDocuments({ user: invoice.user });
    const paymentNumber = `PAY-${year}-${(payCount + 1).toString().padStart(4, '0')}`;
    const receiptNumber = `RCPT-${year}-${(payCount + 1).toString().padStart(4, '0')}`;
    const ref = transactionReference && transactionReference.trim()
      ? transactionReference.trim()
      : `SIM-${paymentMethod.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`;

    // 5. Create Payment Record
    const payment = await Payment.create({
      user: invoice.user,
      customer: invoice.customer,
      invoice: invoice._id,
      paymentNumber,
      amount: payAmount,
      paymentDate: new Date(),
      paymentMethod,
      transactionReference: ref,
      status: 'Completed',
      notes: notes || 'Customer Portal Self-Service Payment (Simulated Academic Demo)',
    });

    // 6. Update Invoice Totals & Status
    const newPaidAmount = round2(invoice.paidAmount + payAmount);
    const newBalanceDue = Math.max(0, round2(invoice.totalAmount - newPaidAmount));
    const newStatus = newBalanceDue === 0 ? 'Paid' : 'Partially Paid';

    invoice.paidAmount = newPaidAmount;
    invoice.balanceDue = newBalanceDue;
    invoice.status = newStatus;
    await invoice.save();

    // 7. Update Customer Ledger Balance if Customer doc exists
    if (invoice.customer) {
      try {
        const custDoc = await Customer.findById(invoice.customer);
        if (custDoc) {
          custDoc.outstandingBalance = Math.max(0, round2((custDoc.outstandingBalance || 0) - payAmount));
          await custDoc.save();
        }
      } catch (custErr) {
        console.warn('[Portal Pay] Customer balance update warning:', custErr.message);
      }
    }

    // Fetch Business info for receipt
    let businessName = 'BillFlow Workspace';
    try {
      const bizOwner = await User.findById(invoice.user).select('companyName businessName');
      if (bizOwner) businessName = bizOwner.companyName || bizOwner.businessName || businessName;
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: `Payment of ₹${payAmount.toLocaleString('en-IN')} processed successfully!`,
      receipt: {
        receiptNumber,
        paymentNumber,
        invoiceNumber: invoice.invoiceNumber,
        invoiceId: invoice._id,
        amountPaid: payAmount,
        remainingBalance: newBalanceDue,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        transactionReference: payment.transactionReference,
        status: 'Completed',
        customerName: invoice.customerName,
        businessName,
        isSimulated: true,
      },
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPortalSummary,
  getPortalInvoices,
  getPortalPayments,
  getPortalCreditNotes,
  getPortalStatement,
  updatePortalProfile,
  payPortalInvoice,
};
