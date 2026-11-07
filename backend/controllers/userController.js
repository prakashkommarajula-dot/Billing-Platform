const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all users with search, role & status filters, and pagination
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const {
      search = '',
      role = '',
      status = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    // Filter by search keyword (name, email, companyName, phone)
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { companyName: searchRegex },
        { phone: searchRegex },
      ];
    }

    // Filter by role
    if (role && role !== 'All') {
      query.role = role;
    }

    // Filter by status (active / inactive)
    if (status && status !== 'All') {
      query.isActive = status === 'Active';
    }

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (currentPage - 1) * pageSize;

    const totalCount = await User.countDocuments(query);

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const users = await User.find(query)
      .select('-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    // Compute metrics for header cards
    const totalUsers = await User.countDocuments({});
    const totalAdmins = await User.countDocuments({ role: 'Admin' });
    const totalOwners = await User.countDocuments({ role: 'Business Owner' });
    const totalAccountants = await User.countDocuments({ role: 'Accountant' });
    const totalCustomers = await User.countDocuments({ role: 'Customer' });
    const totalActive = await User.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: currentPage,
        limit: pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize) || 1,
      },
      metrics: {
        totalUsers,
        totalAdmins,
        totalOwners,
        totalAccountants,
        totalCustomers,
        totalActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user details
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User record not found',
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

// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, companyName, phone, isActive = true } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check duplicate email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists in the system',
      });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // Password hashing handled by userSchema.pre('save')
      role: role || 'Business Owner',
      companyName: companyName ? companyName.trim() : '',
      phone: phone ? phone.trim() : '',
      isActive: Boolean(isActive),
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: `User '${newUser.name}' created successfully with role ${newUser.role}`,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const { name, phone, role, companyName, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent demoting the last active Admin
    if (user.role === 'Admin' && role && role !== 'Admin') {
      const activeAdmins = await User.countDocuments({ role: 'Admin', isActive: true });
      if (activeAdmins <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the only remaining active Administrator on the platform',
        });
      }
    }

    // Prevent deactivating own account if logged in Admin
    if (String(user._id) === String(req.user._id) && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account while logged in',
      });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (companyName !== undefined) user.companyName = companyName.trim();
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = Boolean(isActive);

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: 'User details updated successfully',
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user status (Active / Inactive)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent self-deactivation
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User '${user.name}' has been ${user.isActive ? 'activated' : 'deactivated'}`,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin reset user password
// @route   POST /api/users/:id/reset-password
// @access  Private/Admin
const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.password = newPassword; // Will be hashed by pre('save') hook
    await user.save();

    res.status(200).json({
      success: true,
      message: `Password for user '${user.name}' (${user.email}) has been reset successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user record
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent self-deletion
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own administrative account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `User '${user.name}' deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  deleteUser,
};
