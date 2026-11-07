const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getReceivablesReport,
  getTaxSummaryReport,
  getCustomerLedgerReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('Admin', 'Business Owner', 'Accountant'));

router.get('/sales', getSalesReport);
router.get('/receivables', getReceivablesReport);
router.get('/tax-summary', getTaxSummaryReport);
router.get('/customer-ledger', getCustomerLedgerReport);

module.exports = router;
