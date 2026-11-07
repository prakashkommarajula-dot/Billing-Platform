const express = require('express');
const router = express.Router();
const {
  getPayments,
  getPaymentById,
  getEligibleInvoices,
  recordPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/eligible-invoices', getEligibleInvoices);

router.route('/')
  .get(getPayments)
  .post(recordPayment);

router.route('/:id')
  .get(getPaymentById);

module.exports = router;
