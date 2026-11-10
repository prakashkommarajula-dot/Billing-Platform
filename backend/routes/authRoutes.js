const express = require('express');
const router = express.Router();
const {
  getPublicBusinesses,
  registerUser,
  loginUser,
  getCurrentUserProfile,
  updateUserProfile,
  seedDemoUsers,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.get('/businesses', getPublicBusinesses);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/seed', seedDemoUsers);
router.get('/profile', protect, getCurrentUserProfile);
router.put('/profile', protect, updateUserProfile);

module.exports = router;
