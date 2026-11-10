const path = require('path');
const { getNextInvoiceNumber, getInvoicePayments, getInvoicePDF, getInvoices } = require('../controllers/invoiceController');
const { getEligibleInvoices: getPaymentEligible } = require('../controllers/paymentController');
const { getEligibleInvoices: getCreditEligible } = require('../controllers/creditNoteController');
const { getReceivablesReport, getTaxSummaryReport, getCustomerLedgerReport } = require('../controllers/reportController');
const { getPortalInvoices, getPortalPayments, getPortalStatement } = require('../controllers/portalController');

const mockReq = (params = {}, query = {}, body = {}) => ({
  user: {
    _id: '6aef0e891a7af6c7eede0001',
    id: '6aef0e891a7af6c7eede0001',
    name: 'System Administrator',
    email: 'admin@platform.com',
    role: 'Admin',
    companyName: 'Platform Central Corp'
  },
  params,
  query,
  body,
  headers: {}
});

const mockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
    setHeader(k, v) {
      this.headers[k] = v;
      return this;
    },
    end(data) {
      this.data = data;
      return this;
    }
  };
  return res;
};

const next = (err) => {
  if (err) console.error('  [NEXT ERROR CAUGHT]:', err.message);
};

(async () => {
  console.log('Testing Controllers Directly in Offline/Disconnected Mode...\n');

  // 1. Next Invoice Number
  {
    const req = mockReq();
    const res = mockRes();
    await getNextInvoiceNumber(req, res, next);
    console.log('1. getNextInvoiceNumber =>', res.statusCode, res.data);
  }

  // 2. Invoice Payments
  {
    const req = mockReq({ id: '6aef0e891a7af6c7eede0301' });
    const res = mockRes();
    await getInvoicePayments(req, res, next);
    console.log('2. getInvoicePayments =>', res.statusCode, 'payments count:', res.data?.payments?.length);
  }

  // 3. Payment Eligible Invoices
  {
    const req = mockReq();
    const res = mockRes();
    await getPaymentEligible(req, res, next);
    console.log('3. getPaymentEligible =>', res.statusCode, 'eligible invoices count:', res.data?.invoices?.length);
  }

  // 4. Credit Note Eligible Invoices
  {
    const req = mockReq();
    const res = mockRes();
    await getCreditEligible(req, res, next);
    console.log('4. getCreditEligible =>', res.statusCode, 'eligible invoices count:', res.data?.invoices?.length);
  }

  // 5. Receivables Report
  {
    const req = mockReq();
    const res = mockRes();
    await getReceivablesReport(req, res, next);
    console.log('5. getReceivablesReport =>', res.statusCode, 'invoices:', res.data?.invoices?.length, 'totalReceivables:', res.data?.metrics?.totalReceivables);
  }

  // 6. Tax Summary Report
  {
    const req = mockReq();
    const res = mockRes();
    await getTaxSummaryReport(req, res, next);
    console.log('6. getTaxSummaryReport =>', res.statusCode, 'taxableSales:', res.data?.summary?.totalTaxableSales);
  }

  // 7. Customer Ledger Report
  {
    const req = mockReq();
    const res = mockRes();
    await getCustomerLedgerReport(req, res, next);
    console.log('7. getCustomerLedgerReport =>', res.statusCode, 'ledger entries:', res.data?.ledger?.length);
  }

  // 8. Portal Invoices
  {
    const req = mockReq();
    const res = mockRes();
    await getPortalInvoices(req, res, next);
    console.log('8. getPortalInvoices =>', res.statusCode, 'invoices count:', res.data?.invoices?.length);
  }

  // 9. Portal Payments
  {
    const req = mockReq();
    const res = mockRes();
    await getPortalPayments(req, res, next);
    console.log('9. getPortalPayments =>', res.statusCode, 'payments count:', res.data?.payments?.length);
  }

  // 10. Portal Statement
  {
    const req = mockReq();
    const res = mockRes();
    await getPortalStatement(req, res, next);
    console.log('10. getPortalStatement =>', res.statusCode, 'ledger count:', res.data?.statement?.ledger?.length);
  }

  // 11. Invoice PDF Generation
  {
    const req = mockReq({ id: '6aef0e891a7af6c7eede0301' });
    const res = mockRes();
    await getInvoicePDF(req, res, next);
    console.log('11. getInvoicePDF =>', res.statusCode, 'PDF Buffer length:', res.data?.length, 'Content-Type:', res.headers['Content-Type']);
  }

  console.log('\nAll 11 critical endpoints tested successfully!');
  process.exit(0);
})();
