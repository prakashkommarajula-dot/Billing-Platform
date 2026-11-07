const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const User = require('../models/User');

// Helper to auto-seed initial demo data for a business if empty
const seedBusinessDemoData = async (userId, userCompanyName) => {
  const existingInvoices = await Invoice.countDocuments({ user: userId });
  if (existingInvoices > 0) return;

  // Create sample customers
  const sampleCustomers = [
    {
      user: userId,
      name: 'Acme Cloud Technologies',
      companyName: 'Acme Corp Pvt Ltd',
      email: 'finance@acmetech.com',
      phone: '+91 98765 00001',
      taxId: '29AABCU9603R1ZM',
      billingAddress: {
        street: '12 Electronic City Phase 1',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560100',
        country: 'India',
      },
    },
    {
      user: userId,
      name: 'Zenith Logistics Hub',
      companyName: 'Zenith Global Solutions',
      email: 'billing@zenithlogistics.com',
      phone: '+91 98765 00002',
      taxId: '27AABCZ1234K1ZL',
      billingAddress: {
        street: '55 MIDC Industrial Area',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400093',
        country: 'India',
      },
    },
    {
      user: userId,
      name: 'Global Media Network',
      companyName: 'Global Media Network India',
      email: 'accounts@globalmedia.in',
      phone: '+91 98765 00003',
      taxId: '07AABCG5678P1ZQ',
      billingAddress: {
        street: '33 Barakhamba Road, Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        zipCode: '110001',
        country: 'India',
      },
    },
    {
      user: userId,
      name: 'NextGen Retail Mart',
      companyName: 'NextGen Retail India Pvt Ltd',
      email: 'payments@nextgenretail.com',
      phone: '+91 98765 00004',
      taxId: '33AABCN9988D1Z3',
      billingAddress: {
        street: '7 Anna Salai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        zipCode: '600002',
        country: 'India',
      },
    },
  ];

  const createdCustomers = await Customer.insertMany(sampleCustomers);

  // Generate historical sample invoices & payments across last 6 months
  const now = new Date();
  const invoicesData = [
    {
      user: userId,
      customer: createdCustomers[0]._id,
      customerName: createdCustomers[0].name,
      customerEmail: createdCustomers[0].email,
      invoiceNumber: 'INV-2026-001',
      invoiceDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 12),
      subtotal: 75000,
      taxTotal: 13500,
      totalAmount: 88500,
      paidAmount: 88500,
      balanceDue: 0,
      status: 'Paid',
      items: [
        { description: 'Cloud Infrastructure Management & DevOps Services', quantity: 1, unitPrice: 75000, taxRate: 18, amount: 88500 },
      ],
    },
    {
      user: userId,
      customer: createdCustomers[1]._id,
      customerName: createdCustomers[1].name,
      customerEmail: createdCustomers[1].email,
      invoiceNumber: 'INV-2026-002',
      invoiceDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10),
      subtotal: 42000,
      taxTotal: 7560,
      totalAmount: 49560,
      paidAmount: 20000,
      balanceDue: 29560,
      status: 'Partially Paid',
      items: [
        { description: 'Warehouse Logistics Automation Software License', quantity: 1, unitPrice: 42000, taxRate: 18, amount: 49560 },
      ],
    },
    {
      user: userId,
      customer: createdCustomers[2]._id,
      customerName: createdCustomers[2].name,
      customerEmail: createdCustomers[2].email,
      invoiceNumber: 'INV-2026-003',
      invoiceDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14),
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
      subtotal: 65000,
      taxTotal: 11700,
      totalAmount: 76700,
      paidAmount: 0,
      balanceDue: 76700,
      status: 'Overdue',
      items: [
        { description: 'Digital Marketing & Content Delivery CDN Package', quantity: 1, unitPrice: 65000, taxRate: 18, amount: 76700 },
      ],
    },
    {
      user: userId,
      customer: createdCustomers[3]._id,
      customerName: createdCustomers[3].name,
      customerEmail: createdCustomers[3].email,
      invoiceNumber: 'INV-2026-004',
      invoiceDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14),
      subtotal: 55000,
      taxTotal: 9900,
      totalAmount: 64900,
      paidAmount: 0,
      balanceDue: 64900,
      status: 'Pending',
      items: [
        { description: 'POS Hardware & Billing Terminal Setup', quantity: 2, unitPrice: 27500, taxRate: 18, amount: 64900 },
      ],
    },
    {
      user: userId,
      customer: createdCustomers[0]._id,
      customerName: createdCustomers[0].name,
      customerEmail: createdCustomers[0].email,
      invoiceNumber: 'INV-2026-005',
      invoiceDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 30),
      subtotal: 110000,
      taxTotal: 19800,
      totalAmount: 129800,
      paidAmount: 129800,
      balanceDue: 0,
      status: 'Paid',
      items: [
        { description: 'Quarterly Maintenance Contract & 24/7 SLA Support', quantity: 1, unitPrice: 110000, taxRate: 18, amount: 129800 },
      ],
    },
    {
      user: userId,
      customer: createdCustomers[1]._id,
      customerName: createdCustomers[1].name,
      customerEmail: createdCustomers[1].email,
      invoiceNumber: 'INV-2026-006',
      invoiceDate: new Date(now.getFullYear(), now.getMonth() - 2, 10),
      dueDate: new Date(now.getFullYear(), now.getMonth() - 2, 25),
      subtotal: 92000,
      taxTotal: 16560,
      totalAmount: 108560,
      paidAmount: 108560,
      balanceDue: 0,
      status: 'Paid',
      items: [
        { description: 'Database Optimization & Security Hardening Audit', quantity: 1, unitPrice: 92000, taxRate: 18, amount: 108560 },
      ],
    },
  ];

  const createdInvoices = await Invoice.insertMany(invoicesData);

  // Generate payments for the paid & partially paid invoices
  const paymentsData = [
    {
      user: userId,
      invoice: createdInvoices[0]._id,
      invoiceNumber: createdInvoices[0].invoiceNumber,
      customer: createdCustomers[0]._id,
      customerName: createdCustomers[0].name,
      paymentNumber: 'PAY-2026-081',
      amount: 88500,
      paymentDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
      paymentMethod: 'Bank Transfer',
      transactionReference: 'NEFT-HDFC-991823',
      status: 'Completed',
      notes: 'Full payment cleared via RTGS',
    },
    {
      user: userId,
      invoice: createdInvoices[1]._id,
      invoiceNumber: createdInvoices[1].invoiceNumber,
      customer: createdCustomers[1]._id,
      customerName: createdCustomers[1].name,
      paymentNumber: 'PAY-2026-080',
      amount: 20000,
      paymentDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3),
      paymentMethod: 'UPI',
      transactionReference: 'UPI-ICICI-44120',
      status: 'Completed',
      notes: 'Initial deposit advance payment',
    },
    {
      user: userId,
      invoice: createdInvoices[4]._id,
      invoiceNumber: createdInvoices[4].invoiceNumber,
      customer: createdCustomers[0]._id,
      customerName: createdCustomers[0].name,
      paymentNumber: 'PAY-2026-075',
      amount: 129800,
      paymentDate: new Date(now.getFullYear(), now.getMonth() - 1, 28),
      paymentMethod: 'Bank Transfer',
      transactionReference: 'IMPS-SBI-77291',
      status: 'Completed',
      notes: 'Q3 invoice settled',
    },
  ];

  await Payment.insertMany(paymentsData);
};

// @desc    Get complete dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Auto-seed initial demo invoices if none exist yet for this user
    await seedBusinessDemoData(userId, req.user.companyName || req.user.businessName);

    // Filter query strictly by logged-in business user (or admin)
    const filter = req.user.role === 'Admin' ? {} : { user: userId };

    // 1. Fetch Invoices
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });

    // 2. Fetch Payments
    const payments = await Payment.find(filter).sort({ paymentDate: -1 });

    // 3. Compute Summary Card Metrics
    let totalSales = 0;
    let totalInvoices = invoices.length;
    let paidInvoicesCount = 0;
    let pendingInvoicesCount = 0;
    let outstandingReceivables = 0;

    invoices.forEach((inv) => {
      // Add to total sales (excluding drafts)
      if (inv.status !== 'Draft') {
        totalSales += inv.totalAmount || 0;
      }

      if (inv.status === 'Paid') {
        paidInvoicesCount += 1;
      } else if (['Pending', 'Partially Paid', 'Overdue'].includes(inv.status)) {
        pendingInvoicesCount += 1;
        outstandingReceivables += inv.balanceDue || 0;
      }
    });

    // 4. Monthly Revenue Line Chart Data (Last 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyDataMap = {};

    // Initialize last 6 months in order
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlyDataMap[key] = {
        month: key,
        revenue: 0,
        paid: 0,
        invoices: 0,
      };
    }

    invoices.forEach((inv) => {
      const d = new Date(inv.invoiceDate || inv.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (monthlyDataMap[key]) {
        monthlyDataMap[key].revenue += inv.totalAmount || 0;
        monthlyDataMap[key].paid += inv.paidAmount || 0;
        monthlyDataMap[key].invoices += 1;
      }
    });

    const monthlyRevenue = Object.values(monthlyDataMap);

    // 5. Recent Invoices (Latest 5)
    const recentInvoices = invoices.slice(0, 5).map((inv) => ({
      id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      customerEmail: inv.customerEmail,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      balanceDue: inv.balanceDue,
      status: inv.status,
    }));

    // 6. Recent Payments (Latest 5)
    const recentPayments = payments.slice(0, 5).map((p) => ({
      id: p._id,
      paymentNumber: p.paymentNumber,
      invoiceNumber: p.invoiceNumber,
      customerName: p.customerName,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      paymentDate: p.paymentDate,
      status: p.status,
      transactionReference: p.transactionReference,
    }));

    // 7. Outstanding Invoices (Unpaid balances, sorted by due date)
    const outstandingInvoices = invoices
      .filter((inv) => inv.balanceDue > 0 && ['Pending', 'Partially Paid', 'Overdue'].includes(inv.status))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
      .map((inv) => ({
        id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        dueDate: inv.dueDate,
        totalAmount: inv.totalAmount,
        balanceDue: inv.balanceDue,
        status: inv.status,
      }));

    res.status(200).json({
      success: true,
      summary: {
        totalSales,
        totalInvoices,
        paidInvoices: paidInvoicesCount,
        pendingInvoices: pendingInvoicesCount,
        outstandingReceivables,
      },
      monthlyRevenue,
      recentInvoices,
      recentPayments,
      outstandingInvoices,
      businessInfo: {
        name: req.user.name,
        companyName: req.user.companyName || req.user.businessName,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
};
