const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get current user profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update permitted personal information
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, companyName, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (companyName !== undefined) {
      user.companyName = companyName.trim();
      user.businessName = companyName.trim();
    }
    if (avatar !== undefined) user.avatar = avatar;

    // Strict Security: Users are NOT allowed to self-modify role or email via this endpoint
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: 'Personal profile details updated successfully',
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user account password
// @route   PUT /api/profile/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your current password and a new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    // Need password field for matching
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password with bcrypt
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect. Please re-enter your current password.',
      });
    }

    // Set new password (will be hashed in userSchema.pre('save'))
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully! You can now use your new password for future sign-ins.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update avatar / profile picture
// @route   POST /api/profile/avatar
// @access  Private
const updateAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: 'Please provide avatar image data',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.avatar = avatar;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      avatar: user.avatar,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updateAvatar,
};
