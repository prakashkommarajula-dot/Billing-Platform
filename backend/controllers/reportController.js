const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const CreditNote = require('../models/CreditNote');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { demoInvoices } = require('../utils/mockData');

// Helper for decimal-safe monetary rounding (2 decimal places)
const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

// @desc    Tab 1: Sales Invoice Report with metrics, monthly chart data & pagination
// @route   GET /api/reports/sales
// @access  Private
const getSalesReport = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      customer,
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = 'invoiceDate',
      order = 'desc',
    } = req.query;

    const query = {};

    // 1. Role Scoping
    if (req.user.role === 'Admin') {
      // Admin sees all
    } else if (req.user.role === 'Customer') {
      query.$or = [{ customerEmail: req.user.email }, { customer: req.user._id }];
    } else {
      query.user = req.user._id;
    }

    // Exclude Drafts by default from sales reports unless explicitly filtered
    if (status && status !== 'All') {
      query.status = status;
    } else {
      query.status = { $ne: 'Draft' };
    }

    // 2. Customer Filter
    if (customer && customer !== 'All') {
      if (mongoose.Types.ObjectId.isValid(customer)) {
        query.customer = customer;
      } else {
        query.customerName = new RegExp(`^${customer.trim()}$`, 'i');
      }
    }

    // 3. Search
    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [{ invoiceNumber: regex }, { customerName: regex }],
      });
    }

    // 4. Date Range
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
      let totalSales = 0;
      let totalPaid = 0;
      let totalOutstanding = 0;
      demoInvoices.forEach((inv) => {
        totalSales += inv.totalAmount || 0;
        totalPaid += inv.paidAmount || 0;
        totalOutstanding += inv.balanceDue || 0;
      });

      return res.status(200).json({
        success: true,
        invoices: demoInvoices,
        metrics: {
          totalSales: round2(totalSales),
          totalPaid: round2(totalPaid),
          totalOutstanding: round2(totalOutstanding),
          invoiceCount: demoInvoices.length,
        },
        chartData: [
          { month: 'Jan 2026', sales: 18500, collected: 0 },
          { month: 'Feb 2026', sales: 191160, collected: 147660 },
          { month: 'Mar 2026', sales: 25000, collected: 0 },
        ],
        pagination: {
          total: demoInvoices.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    }

    const totalCount = await Invoice.countDocuments(query);

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const invoices = await Invoice.find(query)
      .select('invoiceNumber customer customerName invoiceDate dueDate totalAmount paidAmount balanceDue status transactionType')
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    // Compute Overall Totals
    const allInvoices = await Invoice.find(query).select('totalAmount paidAmount balanceDue invoiceDate status');

    let totalSales = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    const monthlyMap = {};

    allInvoices.forEach((inv) => {
      if (inv.status !== 'Cancelled') {
        totalSales += inv.totalAmount || 0;
        totalPaid += inv.paidAmount || 0;
        totalOutstanding += inv.balanceDue || 0;

        // Group by Month for Chart
        if (inv.invoiceDate) {
          const d = new Date(inv.invoiceDate);
          const key = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
          if (!monthlyMap[key]) {
            monthlyMap[key] = { month: key, sales: 0, collected: 0, sortDate: new Date(d.getFullYear(), d.getMonth(), 1) };
          }
          monthlyMap[key].sales = round2(monthlyMap[key].sales + (inv.totalAmount || 0));
          monthlyMap[key].collected = round2(monthlyMap[key].collected + (inv.paidAmount || 0));
        }
      }
    });

    const monthlyChartData = Object.values(monthlyMap)
      .sort((a, b) => a.sortDate - b.sortDate)
      .map(({ month, sales, collected }) => ({ month, sales, collected }));

    res.status(200).json({
      success: true,
      invoices,
      metrics: {
        totalSales: round2(totalSales),
        totalPaid: round2(totalPaid),
        totalOutstanding: round2(totalOutstanding),
        invoiceCount: allInvoices.length,
      },
      chartData: monthlyChartData,
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

// @desc    Tab 2: Outstanding Receivables Report with aging distribution (0-30, 31-60, 61-90, 90+)
// @route   GET /api/reports/receivables
// @access  Private
const getReceivablesReport = async (req, res, next) => {
  try {
    const { customer, agingCategory = 'All', search, page = 1, limit = 10 } = req.query;

    const query = {
      balanceDue: { $gt: 0 },
      status: { $nin: ['Draft', 'Cancelled', 'Paid'] },
    };

    // Role Scoping
    if (req.user.role === 'Admin') {
      // Admin sees all
    } else if (req.user.role === 'Customer') {
      query.$or = [{ customerEmail: req.user.email }, { customer: req.user._id }];
    } else {
      query.user = req.user._id;
    }

    if (customer && customer !== 'All') {
      if (mongoose.Types.ObjectId.isValid(customer)) {
        query.customer = customer;
      } else {
        query.customerName = new RegExp(`^${customer.trim()}$`, 'i');
      }
    }

    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      query.$or = [{ invoiceNumber: regex }, { customerName: regex }];
    }

    let allInvoices = [];
    if (mongoose.connection.readyState === 1) {
      try {
        allInvoices = await Invoice.find(query)
          .select('invoiceNumber customer customerName invoiceDate dueDate totalAmount paidAmount balanceDue status')
          .sort({ dueDate: 1 });
      } catch (dbErr) {
        console.warn('[Report] Receivables DB warning:', dbErr.message);
        allInvoices = demoInvoices.filter((i) => (i.balanceDue || 0) > 0);
      }
    } else {
      allInvoices = demoInvoices.filter((i) => (i.balanceDue || 0) > 0);
    }

    const now = new Date();
    let totalReceivables = 0;
    let totalOverdue = 0;

    // Aging Buckets
    let currentBucket = 0;   // 0 or not overdue
    let bucket1_30 = 0;      // 1-30 days
    let bucket31_60 = 0;     // 31-60 days
    let bucket61_90 = 0;     // 61-90 days
    let bucket90Plus = 0;    // 90+ days

    const evaluatedInvoices = allInvoices.map((inv) => {
      const due = new Date(inv.dueDate);
      const isOverdue = due < now;
      const daysOverdue = isOverdue
        ? Math.max(0, Math.floor((now - due) / (1000 * 60 * 60 * 24)))
        : 0;

      const balance = inv.balanceDue || 0;
      totalReceivables += balance;
      if (isOverdue) totalOverdue += balance;

      let category = 'Current';
      if (daysOverdue > 90) {
        category = '90+ Days';
        bucket90Plus += balance;
      } else if (daysOverdue > 60) {
        category = '61-90 Days';
        bucket61_90 += balance;
      } else if (daysOverdue > 30) {
        category = '31-60 Days';
        bucket31_60 += balance;
      } else if (daysOverdue > 0) {
        category = '1-30 Days';
        bucket1_30 += balance;
      } else {
        currentBucket += balance;
      }

      return {
        _id: inv._id,
        customerName: inv.customerName,
        customer: inv.customer,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        outstandingBalance: balance,
        daysOverdue,
        agingCategory: category,
        status: inv.status,
      };
    });

    // Filter by Aging Category if requested
    let filteredList = evaluatedInvoices;
    if (agingCategory && agingCategory !== 'All') {
      filteredList = evaluatedInvoices.filter((inv) => inv.agingCategory === agingCategory);
    }

    const currentPage = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (currentPage - 1) * pageSize;
    const paginatedInvoices = filteredList.slice(skip, skip + pageSize);

    const agingChartData = [
      { category: 'Current', amount: round2(currentBucket) },
      { category: '1-30 Days', amount: round2(bucket1_30) },
      { category: '31-60 Days', amount: round2(bucket31_60) },
      { category: '61-90 Days', amount: round2(bucket61_90) },
      { category: '90+ Days', amount: round2(bucket90Plus) },
    ];

    res.status(200).json({
      success: true,
      invoices: paginatedInvoices,
      metrics: {
        totalReceivables: round2(totalReceivables),
        totalOverdue: round2(totalOverdue),
        unpaidInvoiceCount: allInvoices.length,
      },
      agingChartData,
      pagination: {
        total: filteredList.length,
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(filteredList.length / pageSize) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tab 3: Tax Summary Report (Taxable Sales, CGST, SGST, IGST, Total Tax) with GST Rate breakdown
// @route   GET /api/reports/tax-summary
// @access  Private
const getTaxSummaryReport = async (req, res, next) => {
  try {
    const { startDate, endDate, taxCategory = 'All' } = req.query;

    const query = {
      status: { $nin: ['Draft', 'Cancelled'] },
    };

    // Role Scoping
    if (req.user.role === 'Admin') {
      // Admin
    } else if (req.user.role === 'Customer') {
      query.$or = [{ customerEmail: req.user.email }, { customer: req.user._id }];
    } else {
      query.user = req.user._id;
    }

    // Transaction Type / Tax Category Filter
    if (taxCategory && taxCategory !== 'All') {
      if (taxCategory === 'Intra-State' || taxCategory === 'Inter-State') {
        query.transactionType = taxCategory;
      }
    }

    // Date Range
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = end;
      }
    }

    let invoices = [];
    if (mongoose.connection.readyState === 1) {
      try {
        invoices = await Invoice.find(query)
          .select('invoiceNumber customerName invoiceDate taxableAmount subtotal discount cgst sgst igst taxTotal totalAmount transactionType items')
          .sort({ invoiceDate: -1 });
      } catch (dbErr) {
        console.warn('[Report] Tax summary DB warning:', dbErr.message);
        invoices = demoInvoices;
      }
    } else {
      invoices = demoInvoices;
    }

    let totalTaxableSales = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalTax = 0;

    // Rate Wise Breakdowns
    const rateWise = {
      '0%': { taxable: 0, tax: 0 },
      '5%': { taxable: 0, tax: 0 },
      '12%': { taxable: 0, tax: 0 },
      '18%': { taxable: 0, tax: 0 },
      '28%': { taxable: 0, tax: 0 },
    };

    const evaluatedInvoices = invoices.map((inv) => {
      const invTaxable = inv.taxableAmount || Math.max(0, (inv.subtotal || 0) - (inv.discount || 0)) || 0;
      const invTaxTotal = inv.taxTotal || 0;

      let invCgst = inv.cgst || 0;
      let invSgst = inv.sgst || 0;
      let invIgst = inv.igst || 0;

      if (!invCgst && !invSgst && !invIgst && invTaxTotal > 0) {
        if (inv.transactionType === 'Inter-State') {
          invIgst = invTaxTotal;
        } else {
          invCgst = round2(invTaxTotal / 2);
          invSgst = round2(invTaxTotal / 2);
        }
      }

      totalTaxableSales += invTaxable;
      totalCgst += invCgst;
      totalSgst += invSgst;
      totalIgst += invIgst;
      totalTax += invTaxTotal;

      // Scan items for GST slab distribution
      if (inv.items && inv.items.length) {
        inv.items.forEach((it) => {
          const rateKey = `${it.taxRate || 0}%`;
          if (rateWise[rateKey]) {
            const itemTaxable = it.taxableAmount || (it.quantity * it.unitPrice - (it.discount || 0));
            rateWise[rateKey].taxable += itemTaxable;
            rateWise[rateKey].tax += (it.cgst || 0) + (it.sgst || 0) + (it.igst || 0) || (itemTaxable * (it.taxRate || 0) / 100);
          }
        });
      }

      return {
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        invoiceDate: inv.invoiceDate,
        taxableAmount: invTaxable,
        cgst: invCgst,
        sgst: invSgst,
        igst: invIgst,
        taxTotal: invTaxTotal,
        totalAmount: inv.totalAmount,
        transactionType: inv.transactionType || 'Intra-State',
      };
    });

    const taxDistributionChart = [
      { name: 'CGST (Central Tax)', amount: round2(totalCgst) },
      { name: 'SGST (State Tax)', amount: round2(totalSgst) },
      { name: 'IGST (Integrated Tax)', amount: round2(totalIgst) },
    ];

    const slabBreakdown = Object.keys(rateWise).map((slab) => ({
      slab,
      taxableAmount: round2(rateWise[slab].taxable),
      taxAmount: round2(rateWise[slab].tax),
    }));

    res.status(200).json({
      success: true,
      invoices: evaluatedInvoices,
      metrics: {
        taxableSales: round2(totalTaxableSales),
        cgst: round2(totalCgst),
        sgst: round2(totalSgst),
        igst: round2(totalIgst),
        totalTax: round2(totalTax),
        invoiceCount: evaluatedInvoices.length,
      },
      taxDistributionChart,
      slabBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tab 4: Customer Ledger (Chronological audit of Invoices, Payments & Credit Notes with Running Balance)
// @route   GET /api/reports/customer-ledger
// @access  Private
const getCustomerLedgerReport = async (req, res, next) => {
  try {
    const { customerId, startDate, endDate } = req.query;

    if (mongoose.connection.readyState !== 1) {
      const { demoCustomers, demoPayments, demoCreditNotes } = require('../utils/mockData');
      const targetCust = (customerId ? demoCustomers.find(c => c._id === customerId || c.id === customerId) : null) || demoCustomers[0];
      const invoices = demoInvoices.filter(i => i.customer === targetCust._id || i.customerName === targetCust.name);
      const payments = demoPayments.filter(p => p.customer === targetCust._id || p.customerName === targetCust.name);
      const creditNotes = demoCreditNotes.filter(cn => cn.customer === targetCust._id || cn.customerName === targetCust.name);

      const transactions = [];
      invoices.forEach(inv => {
        if (inv.status !== 'Draft' && inv.status !== 'Cancelled') {
          transactions.push({
            date: inv.invoiceDate || inv.createdAt,
            type: 'Invoice',
            reference: inv.invoiceNumber,
            description: `Tax Invoice Billed - ${inv.status}`,
            debit: inv.totalAmount || 0,
            credit: 0,
          });
        }
      });
      payments.forEach(p => {
        transactions.push({
          date: p.paymentDate || p.createdAt,
          type: 'Payment',
          reference: p.paymentNumber || 'PAY',
          description: `Payment Settled via ${p.paymentMethod}`,
          debit: 0,
          credit: p.amount || 0,
        });
      });
      creditNotes.forEach(cn => {
        transactions.push({
          date: cn.creditNoteDate || cn.createdAt,
          type: 'Credit Note',
          reference: cn.creditNoteNumber,
          description: `Credit Note - ${cn.reason}`,
          debit: 0,
          credit: cn.amount || 0,
        });
      });
      transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

      let running = 0;
      let totalDebits = 0;
      let totalCredits = 0;
      const ledger = transactions.map(t => {
        running = round2(running + t.debit - t.credit);
        totalDebits += t.debit;
        totalCredits += t.credit;
        return { ...t, runningBalance: running };
      });

      return res.status(200).json({
        success: true,
        customers: demoCustomers,
        customer: targetCust,
        ledger,
        openingBalance: 0,
        closingBalance: running,
        totalDebits: round2(totalDebits),
        totalCredits: round2(totalCredits),
      });
    }

    const userScope = req.user.role === 'Admin' ? {} : { user: req.user._id };

    // 1. Get Customers List for dropdown picker
    const customers = await Customer.find(userScope).select('name companyName email phone gstin outstandingBalance');

    let targetCustomer = null;
    if (customerId) {
      targetCustomer = await Customer.findOne({ _id: customerId, ...userScope });
    } else if (customers.length > 0) {
      targetCustomer = customers[0];
    }

    if (!targetCustomer) {
      return res.status(200).json({
        success: true,
        customers,
        customer: null,
        ledger: [],
        openingBalance: 0,
        closingBalance: 0,
        totalDebits: 0,
        totalCredits: 0,
      });
    }

    // 2. Fetch Invoices for this customer
    const invoiceQuery = {
      user: req.user.role === 'Admin' ? targetCustomer.user : req.user._id,
      $or: [{ customer: targetCustomer._id }, { customerName: targetCustomer.name }],
      status: { $ne: 'Draft' },
    };

    // 3. Fetch Payments for this customer
    const paymentQuery = {
      user: req.user.role === 'Admin' ? targetCustomer.user : req.user._id,
      $or: [{ customer: targetCustomer._id }, { customerName: targetCustomer.name }],
      status: 'Completed',
    };

    // 4. Fetch Credit Notes for this customer
    const creditNoteQuery = {
      user: req.user.role === 'Admin' ? targetCustomer.user : req.user._id,
      $or: [{ customer: targetCustomer._id }, { customerName: targetCustomer.name }],
      status: { $ne: 'Cancelled' },
    };

    const [invoices, payments, creditNotes] = await Promise.all([
      Invoice.find(invoiceQuery).select('invoiceNumber invoiceDate totalAmount notes status'),
      Payment.find(paymentQuery).select('paymentNumber paymentDate amount paymentMethod transactionReference notes'),
      CreditNote.find(creditNoteQuery).select('creditNoteNumber creditNoteDate amount reason description'),
    ]);

    // 5. Combine and Sort Chronologically
    const allEntries = [];

    // Invoices are DEBIT entries (increases receivable)
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

    // Payments are CREDIT entries (decreases receivable)
    payments.forEach((pay) => {
      allEntries.push({
        date: new Date(pay.paymentDate),
        type: 'Payment',
        reference: pay.paymentNumber,
        description: `Payment received via ${pay.paymentMethod}${pay.transactionReference ? ` (${pay.transactionReference})` : ''}`,
        debit: 0,
        credit: round2(pay.amount || 0),
      });
    });

    // Credit Notes are CREDIT entries (decreases receivable)
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

    // Sort ascending by date
    allEntries.sort((a, b) => a.date - b.date);

    // Filter by Date Range and compute Opening Balance
    let openingBalance = 0;
    let runningBalance = 0;
    const filteredLedger = [];
    let periodDebits = 0;
    let periodCredits = 0;

    const startFilter = startDate ? new Date(startDate) : null;
    const endFilter = endDate ? new Date(endDate) : null;
    if (endFilter) endFilter.setHours(23, 59, 59, 999);

    allEntries.forEach((entry) => {
      if (startFilter && entry.date < startFilter) {
        openingBalance = round2(openingBalance + entry.debit - entry.credit);
      } else if (!endFilter || entry.date <= endFilter) {
        if (filteredLedger.length === 0) {
          runningBalance = openingBalance;
        }
        runningBalance = round2(runningBalance + entry.debit - entry.credit);
        periodDebits = round2(periodDebits + entry.debit);
        periodCredits = round2(periodCredits + entry.credit);

        filteredLedger.push({
          ...entry,
          runningBalance,
        });
      }
    });

    const closingBalance = filteredLedger.length > 0
      ? filteredLedger[filteredLedger.length - 1].runningBalance
      : openingBalance;

    res.status(200).json({
      success: true,
      customers,
      customer: targetCustomer,
      openingBalance: round2(openingBalance),
      closingBalance: round2(closingBalance),
      totalDebits: round2(periodDebits),
      totalCredits: round2(periodCredits),
      ledger: filteredLedger,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesReport,
  getReceivablesReport,
  getTaxSummaryReport,
  getCustomerLedgerReport,
};
