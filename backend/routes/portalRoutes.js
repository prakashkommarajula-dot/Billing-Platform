const express = require('express');
const router = express.Router();
const {
  getPortalSummary,
  getPortalInvoices,
  getPortalPayments,
  getPortalCreditNotes,
  getPortalStatement,
  updatePortalProfile,
} = require('../controllers/portalController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', getPortalSummary);
router.get('/invoices', getPortalInvoices);
router.get('/payments', getPortalPayments);
router.get('/credit-notes', getPortalCreditNotes);
router.get('/statement', getPortalStatement);
router.put('/profile', updatePortalProfile);

module.exports = router;
