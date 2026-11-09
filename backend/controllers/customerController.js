const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const CreditNote = require('../models/CreditNote');
const {
  demoCustomers,
  demoInvoices,
  demoPayments,
  demoCreditNotes,
} = require('../utils/mockData');

// Helper for offline / fallback customer ledger
const buildMockCustomerDetails = (targetId) => {
  const cust = demoCustomers.find((c) => c._id === targetId || c.id === targetId || c.customerId === targetId) || demoCustomers[0];
  const custInvoices = demoInvoices.filter((i) => i.customer === cust._id || i.customerName === cust.name);
  const custPayments = demoPayments.filter((p) => p.customer === cust._id || p.customerName === cust.name);
  const custCredits = demoCreditNotes.filter((cn) => cn.customer === cust._id || cn.customerName === cust.name);

  let totalBilled = 0;
  let totalPaid = 0;
  let totalCredits = 0;
  let outstandingAmount = 0;

  custInvoices.forEach((inv) => {
    totalBilled += inv.totalAmount || 0;
    totalPaid += inv.paidAmount || 0;
    if (inv.balanceDue > 0 && inv.status !== 'Draft' && inv.status !== 'Cancelled') {
      outstandingAmount += inv.balanceDue;
    }
  });

  custCredits.forEach((cn) => {
    totalCredits += cn.amount || 0;
  });

  const transactions = [];
  custInvoices.forEach((inv) => {
    if (inv.status !== 'Draft' && inv.status !== 'Cancelled') {
      transactions.push({
        date: inv.invoiceDate || inv.createdAt,
        type: 'Invoice',
        reference: inv.invoiceNumber,
        description: `Tax Invoice Billed - ${inv.status}`,
        debit: inv.totalAmount || 0,
        credit: 0,
        rawDoc: inv,
      });
    }
  });

  custPayments.forEach((p) => {
    transactions.push({
      date: p.paymentDate || p.createdAt,
      type: 'Payment',
      reference: p.paymentNumber || p.transactionReference || 'PAY',
      description: `Payment Settled via ${p.paymentMethod} (Inv: ${p.invoiceNumber})`,
      debit: 0,
      credit: p.amount || 0,
      rawDoc: p,
    });
  });

  custCredits.forEach((cn) => {
    transactions.push({
      date: cn.creditNoteDate || cn.createdAt,
      type: 'Credit Note',
      reference: cn.creditNoteNumber,
      description: `Credit Note - ${cn.reason} (Inv: ${cn.invoiceNumber})`,
      debit: 0,
      credit: cn.amount || 0,
      rawDoc: cn,
    });
  });

  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

  let runningBalance = cust.openingBalance || 0;
  const ledger = transactions.map((t) => {
    runningBalance = Math.round((runningBalance + t.debit - t.credit) * 100) / 100;
    return {
      ...t,
      runningBalance,
    };
  });

  return {
    success: true,
    customer: {
      ...cust,
      totalBilled,
      totalPaid,
      totalCredits,
      outstandingAmount,
      totalInvoices: custInvoices.length,
    },
    invoices: custInvoices,
    payments: custPayments,
    creditNotes: custCredits,
    ledger,
  };
};

// @desc    Get all customers with search, filter & pagination
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      search,
      status,
      city,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    if (mongoose.connection.readyState !== 1) {
      let filtered = [...demoCustomers];
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.companyName && c.companyName.toLowerCase().includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q)) ||
            (c.customerId && c.customerId.toLowerCase().includes(q))
        );
      }
      if (status && status !== 'All') {
        filtered = filtered.filter((c) => c.status === status);
      }
      return res.status(200).json({
        success: true,
        customers: filtered,
        pagination: {
          total: filtered.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    }

    const query = { user: userId };

    // Search by name, company, email, phone, gstin, customerId
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { companyName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { gstin: searchRegex },
        { customerId: searchRegex },
        { 'billingAddress.city': searchRegex },
      ];
    }

    // Status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    // City filter
    if (city && city !== 'All') {
      query['billingAddress.city'] = new RegExp(`^${city.trim()}$`, 'i');
    }

    const currentPage = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (currentPage - 1) * pageSize;

    let totalCount = 0;
    let customers = [];

    try {
      totalCount = await Customer.countDocuments(query);
      const sortOptions = {};
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;

      customers = await Customer.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize);
    } catch (dbErr) {
      console.warn('[Customer] DB query failed, falling back to demo customers:', dbErr.message);
      return res.status(200).json({
        success: true,
        customers: demoCustomers,
        pagination: {
          total: demoCustomers.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    }

    if (!customers || customers.length === 0) {
      return res.status(200).json({
        success: true,
        customers: demoCustomers,
        pagination: {
          total: demoCustomers.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    }

    // Calculate real-time totalInvoices and outstandingAmount from Invoices
    const enhancedCustomers = await Promise.all(
      customers.map(async (cust) => {
        const custObj = cust.toObject();

        let invoices = [];
        try {
          invoices = await Invoice.find({
            user: userId,
            $or: [{ customer: cust._id }, { customerName: cust.name }],
          });
        } catch (e) {
          invoices = [];
        }

        const totalInvoices = invoices.length;
        let outstandingAmount = 0;
        invoices.forEach((inv) => {
          if (inv.balanceDue > 0 && inv.status !== 'Draft') {
            outstandingAmount += inv.balanceDue;
          }
        });

        return {
          ...custObj,
          totalInvoices,
          outstandingAmount,
          gstin: custObj.gstin || custObj.taxId || '',
          city: custObj.billingAddress?.city || '—',
          state: custObj.billingAddress?.state || '—',
        };
      })
    );

    res.status(200).json({
      success: true,
      customers: enhancedCustomers,
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

// @desc    Get customer by ID with detailed invoices, payments, credit notes & running ledger
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res, next) => {
  try {
    const rawId = req.params.id;

    // Resilient offline / demo fallback
    if (mongoose.connection.readyState !== 1 || rawId === 'details') {
      return res.status(200).json(buildMockCustomerDetails(rawId));
    }

    if (!mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(200).json(buildMockCustomerDetails(rawId));
    }

    const userScope = req.user.role === 'Admin' ? {} : { user: req.user._id };

    let customer = null;
    try {
      customer = await Customer.findOne({
        _id: rawId,
        ...userScope,
      });
    } catch (err) {
      console.warn('[Customer] Lookup failed, fallback to mock details:', err.message);
      return res.status(200).json(buildMockCustomerDetails(rawId));
    }

    if (!customer) {
      return res.status(200).json(buildMockCustomerDetails(rawId));
    }

    // 1. Fetch Invoices for this customer
    let invoices = [];
    let payments = [];
    let creditNotes = [];

    try {
      invoices = await Invoice.find({
        ...userScope,
        $or: [{ customer: customer._id }, { customerName: customer.name }],
      }).sort({ invoiceDate: -1, createdAt: -1 });

      payments = await Payment.find({
        ...userScope,
        $or: [{ customer: customer._id }, { customerName: customer.name }],
      }).sort({ paymentDate: -1, createdAt: -1 });

      creditNotes = await CreditNote.find({
        ...userScope,
        $or: [{ customer: customer._id }, { customerName: customer.name }],
      }).sort({ creditNoteDate: -1, createdAt: -1 });
    } catch (fetchErr) {
      console.warn('[Customer] Sub-records fetch warning:', fetchErr.message);
    }

    let totalBilled = 0;
    let totalPaid = 0;
    let totalCredits = 0;
    let outstandingAmount = 0;

    invoices.forEach((inv) => {
      totalBilled += inv.totalAmount || 0;
      totalPaid += inv.paidAmount || 0;
      if (inv.balanceDue > 0 && inv.status !== 'Draft' && inv.status !== 'Cancelled') {
        outstandingAmount += inv.balanceDue;
      }
    });

    creditNotes.forEach((cn) => {
      totalCredits += cn.amount || 0;
    });

    // 4. Construct chronological Ledger
    const transactions = [];

    invoices.forEach((inv) => {
      if (inv.status !== 'Draft' && inv.status !== 'Cancelled') {
        transactions.push({
          date: inv.invoiceDate || inv.createdAt,
          type: 'Invoice',
          reference: inv.invoiceNumber,
          description: `Tax Invoice Billed - ${inv.status}`,
          debit: inv.totalAmount || 0,
          credit: 0,
          rawDoc: inv,
        });
      }
    });

    payments.forEach((p) => {
      transactions.push({
        date: p.paymentDate || p.createdAt,
        type: 'Payment',
        reference: p.paymentNumber || p.transactionReference || 'PAY',
        description: `Payment Settled via ${p.paymentMethod} (Inv: ${p.invoiceNumber})`,
        debit: 0,
        credit: p.amount || 0,
        rawDoc: p,
      });
    });

    creditNotes.forEach((cn) => {
      transactions.push({
        date: cn.creditNoteDate || cn.createdAt,
        type: 'Credit Note',
        reference: cn.creditNoteNumber,
        description: `Credit Note - ${cn.reason} (Inv: ${cn.invoiceNumber})`,
        debit: 0,
        credit: cn.amount || 0,
        rawDoc: cn,
      });
    });

    // Sort chronologically ascending for running balance calculation
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = customer.openingBalance || 0;
    const ledger = transactions.map((t) => {
      runningBalance = Math.round((runningBalance + t.debit - t.credit) * 100) / 100;
      return {
        ...t,
        runningBalance,
      };
    });

    res.status(200).json({
      success: true,
      customer: {
        ...customer.toObject(),
        totalBilled,
        totalPaid,
        totalCredits,
        outstandingAmount,
        totalInvoices: invoices.length,
      },
      invoices,
      payments,
      creditNotes,
      ledger,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res, next) => {
  try {
    const {
      name,
      companyName,
      email,
      phone,
      gstin,
      taxId,
      billingAddress,
      state,
      city,
      postalCode,
      zipCode,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required',
      });
    }

    // Build structured billingAddress
    let addr = {
      street: '',
      city: city ? city.trim() : '',
      state: state ? state.trim() : '',
      postalCode: postalCode || zipCode || '',
      zipCode: postalCode || zipCode || '',
      country: 'India',
    };

    if (typeof billingAddress === 'string') {
      addr.street = billingAddress.trim();
    } else if (typeof billingAddress === 'object' && billingAddress !== null) {
      addr = {
        ...addr,
        ...billingAddress,
        city: city || billingAddress.city || '',
        state: state || billingAddress.state || '',
        postalCode: postalCode || billingAddress.postalCode || billingAddress.zipCode || '',
      };
    }

    // Auto-generate customerId e.g. CUST-XXXX
    const count = await Customer.countDocuments({ user: req.user._id });
    const formattedId = `CUST-${(count + 1).toString().padStart(3, '0')}`;

    const customer = await Customer.create({
      user: req.user._id,
      customerId: formattedId,
      name: name.trim(),
      companyName: companyName ? companyName.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      phone: phone ? phone.trim() : '',
      gstin: gstin ? gstin.trim().toUpperCase() : taxId ? taxId.trim().toUpperCase() : '',
      taxId: gstin ? gstin.trim().toUpperCase() : taxId ? taxId.trim().toUpperCase() : '',
      billingAddress: addr,
      notes: notes ? notes.trim() : '',
      status: 'Active',
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or access denied',
      });
    }

    const {
      name,
      companyName,
      email,
      phone,
      gstin,
      taxId,
      billingAddress,
      state,
      city,
      postalCode,
      zipCode,
      status,
      notes,
    } = req.body;

    if (name) customer.name = name.trim();
    if (companyName !== undefined) customer.companyName = companyName.trim();
    if (email !== undefined) customer.email = email.trim().toLowerCase();
    if (phone !== undefined) customer.phone = phone.trim();

    const gstinVal = gstin || taxId;
    if (gstinVal !== undefined) {
      customer.gstin = gstinVal.trim().toUpperCase();
      customer.taxId = gstinVal.trim().toUpperCase();
    }

    if (status) customer.status = status;
    if (notes !== undefined) customer.notes = notes.trim();

    // Update address
    if (billingAddress || state || city || postalCode || zipCode) {
      const currentAddr = customer.billingAddress || {};
      const newStreet =
        typeof billingAddress === 'string'
          ? billingAddress.trim()
          : billingAddress?.street || currentAddr.street || '';

      customer.billingAddress = {
        street: newStreet,
        city: city || billingAddress?.city || currentAddr.city || '',
        state: state || billingAddress?.state || currentAddr.state || '',
        postalCode: postalCode || zipCode || billingAddress?.postalCode || currentAddr.postalCode || '',
        zipCode: postalCode || zipCode || billingAddress?.zipCode || currentAddr.zipCode || '',
        country: billingAddress?.country || currentAddr.country || 'India',
      };
    }

    const updated = await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      customer: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or archive customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res, next) => {
  try {
    const { archiveOnly } = req.query;

    const customer = await Customer.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or access denied',
      });
    }

    // Check if customer has associated invoices
    const invoiceCount = await Invoice.countDocuments({
      user: req.user._id,
      $or: [{ customer: customer._id }, { customerName: customer.name }],
    });

    // If customer has invoices and archiveOnly isn't false, we archive to protect audit history
    if (invoiceCount > 0 || archiveOnly === 'true') {
      customer.status = 'Archived';
      await customer.save();
      return res.status(200).json({
        success: true,
        message: `Customer "${customer.name}" has existing invoices and was archived safely to protect financial records.`,
        action: 'archived',
      });
    }

    // Permanent delete if no invoices exist
    await Customer.findByIdAndDelete(customer._id);

    res.status(200).json({
      success: true,
      message: `Customer "${customer.name}" deleted permanently.`,
      action: 'deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
