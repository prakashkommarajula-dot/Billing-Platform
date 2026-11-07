const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/next-number', getNextInvoiceNumber);

router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.route('/:id')
  .get(getInvoiceById)
  .put(updateInvoice)
  .delete(deleteInvoice);

router.post('/:id/cancel', cancelInvoice);
router.get('/:id/pdf', getInvoicePDF);

router.route('/:id/payments')
  .get(getInvoicePayments)
  .post(recordInvoicePayment);

router.post('/:id/credit-notes', createInvoiceCreditNote);

module.exports = router;
