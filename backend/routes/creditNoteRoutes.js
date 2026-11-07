const express = require('express');
const router = express.Router();
const {
  getCreditNotes,
  getCreditNoteById,
  getEligibleInvoices,
  createCreditNote,
  getCreditNotePDF,
} = require('../controllers/creditNoteController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/eligible-invoices', getEligibleInvoices);

router.route('/')
  .get(getCreditNotes)
  .post(createCreditNote);

router.route('/:id')
  .get(getCreditNoteById);

router.get('/:id/pdf', getCreditNotePDF);

module.exports = router;
