const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_jwt_key_invoice_billing_dev_2026_xyz123',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      businessName,
      companyName,
      email,
      phone,
      businessAddress,
      password,
      confirmPassword,
      role,
    } = req.body;

    const orgName = (businessName || companyName || '').trim();

    // 1. Required fields validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your full name',
      });
    }

    if (!orgName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered business name',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid business email address',
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a business contact phone number',
      });
    }

    if (!businessAddress || (typeof businessAddress === 'string' && !businessAddress.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your physical or registered business address',
      });
    }

    // 3. Password presence & strength validation
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a secure password',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain both letters and numbers for adequate strength',
      });
    }

    // 4. Confirm password check
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation does not match',
      });
    }

    // 5. Controlled Role Assignment: Disallow public registration as Admin
    if (role && role.trim().toLowerCase() === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrative accounts cannot be registered publicly. Please contact platform administration.',
      });
    }

    // Default public role is Business Owner (or Accountant/Customer if invited)
    const assignedRole =
      role === 'Accountant' || role === 'Customer' ? role : 'Business Owner';

    // 6. Prevent duplicate email registrations
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
      });
    }

    // 7. Parse business address
    let formattedAddress = {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      fullAddress: '',
    };

    if (typeof businessAddress === 'string') {
      formattedAddress.street = businessAddress.trim();
      formattedAddress.fullAddress = businessAddress.trim();
    } else if (typeof businessAddress === 'object') {
      formattedAddress = {
        ...formattedAddress,
        ...businessAddress,
        fullAddress:
          businessAddress.fullAddress ||
          [
            businessAddress.street,
            businessAddress.city,
            businessAddress.state,
            businessAddress.zipCode,
            businessAddress.country,
          ]
            .filter(Boolean)
            .join(', '),
      };
    }

    // 8. Create user in MongoDB (bcrypt hashing handled in pre('save') hook)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      companyName: orgName,
      businessName: orgName,
      phone: phone.trim(),
      businessAddress: formattedAddress,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully! Redirecting to sign in...',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        businessName: user.businessName,
        phone: user.phone,
        businessAddress: user.businessAddress,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    // Explicitly select password field
    let user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      // Auto-provision demo accounts if not yet created in the database
      const demoUsers = {
        'admin@platform.com': {
          name: 'System Administrator',
          role: 'Admin',
          companyName: 'Platform Central Corp',
          phone: '+1 555-0100',
        },
        'owner@apexenterprises.com': {
          name: 'Rajesh Sharma',
          role: 'Business Owner',
          companyName: 'Apex Enterprises Pvt Ltd',
          phone: '+91 98765 43210',
          taxId: '29ABCDE1234F1Z5',
        },
        'accountant@apexenterprises.com': {
          name: 'Ananya Roy',
          role: 'Accountant',
          companyName: 'Apex Enterprises Pvt Ltd',
          phone: '+91 98765 43211',
        },
        'customer@globaltech.com': {
          name: 'David Miller',
          role: 'Customer',
          companyName: 'Global Tech Solutions',
          phone: '+1 555-0199',
        },
      };

      const normalizedEmail = email.toLowerCase().trim();
      if (demoUsers[normalizedEmail]) {
        user = await User.create({
          name: demoUsers[normalizedEmail].name,
          email: normalizedEmail,
          password: password || 'Password123!',
          role: demoUsers[normalizedEmail].role,
          companyName: demoUsers[normalizedEmail].companyName,
          phone: demoUsers[normalizedEmail].phone,
          taxId: demoUsers[normalizedEmail].taxId || '',
          isActive: true,
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact administration.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        phone: user.phone,
        taxId: user.taxId,
        businessAddress: user.businessAddress,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getCurrentUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        phone: user.phone,
        businessAddress: user.businessAddress,
        taxId: user.taxId,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.companyName = req.body.companyName !== undefined ? req.body.companyName : user.companyName;
    user.taxId = req.body.taxId !== undefined ? req.body.taxId : user.taxId;

    if (req.body.businessAddress) {
      user.businessAddress = {
        ...user.businessAddress.toObject(),
        ...req.body.businessAddress,
      };
    }

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long',
        });
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    const token = generateToken(updatedUser._id);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      token,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        companyName: updatedUser.companyName,
        phone: updatedUser.phone,
        businessAddress: updatedUser.businessAddress,
        taxId: updatedUser.taxId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seed demo accounts if database is empty
// @route   POST /api/auth/seed
// @access  Public (dev utility)
const seedDemoUsers = async (req, res, next) => {
  try {
    const demoAccounts = [
      {
        name: 'System Administrator',
        email: 'admin@platform.com',
        password: 'Password123!',
        role: 'Admin',
        companyName: 'Platform Central Corp',
        phone: '+1 555-0100',
      },
      {
        name: 'Rajesh Sharma',
        email: 'owner@apexenterprises.com',
        password: 'Password123!',
        role: 'Business Owner',
        companyName: 'Apex Enterprises Pvt Ltd',
        phone: '+91 98765 43210',
        taxId: '29ABCDE1234F1Z5',
      },
      {
        name: 'Ananya Roy',
        email: 'accountant@apexenterprises.com',
        password: 'Password123!',
        role: 'Accountant',
        companyName: 'Apex Enterprises Pvt Ltd',
        phone: '+91 98765 43211',
      },
      {
        name: 'David Miller',
        email: 'customer@globaltech.com',
        password: 'Password123!',
        role: 'Customer',
        companyName: 'Global Tech Solutions',
        phone: '+1 555-0199',
      },
    ];

    const results = [];
    for (const acc of demoAccounts) {
      let existing = await User.findOne({ email: acc.email });
      if (!existing) {
        const created = await User.create(acc);
        results.push({ email: created.email, role: created.role, status: 'created' });
      } else {
        results.push({ email: existing.email, role: existing.role, status: 'already exists' });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Demo accounts checked/seeded',
      accounts: results,
      defaultPassword: 'Password123!',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUserProfile,
  updateUserProfile,
  seedDemoUsers,
};
