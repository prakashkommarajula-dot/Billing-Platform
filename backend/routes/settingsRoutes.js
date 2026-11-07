const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  uploadLogo,
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('Admin', 'Business Owner'));

router.route('/')
  .get(getSettings)
  .put(updateSettings);

router.post('/logo', uploadLogo);

module.exports = router;
