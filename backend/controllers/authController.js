const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');
const BusinessSettings = require('../models/BusinessSettings');
const { demoUsers } = require('../utils/mockData');

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

// @desc    Get public businesses available for accountant/customer association
// @route   GET /api/auth/businesses
// @access  Public
const getPublicBusinesses = async (req, res, next) => {
  try {
    let businesses = [
      {
        id: '6aef0e891a7af6c7eede0002',
        _id: '6aef0e891a7af6c7eede0002',
        name: 'Rajesh Sharma',
        companyName: 'Apex Enterprises Pvt Ltd',
        businessName: 'Apex Enterprises Pvt Ltd',
        invitationCode: 'APEX-2026',
      },
      {
        id: '6aef0e891a7af6c7eede0022',
        _id: '6aef0e891a7af6c7eede0022',
        name: 'David Miller',
        companyName: 'Global Tech Solutions',
        businessName: 'Global Tech Solutions',
        invitationCode: 'GLOBAL-2026',
      },
      {
        id: '6aef0e891a7af6c7eede0032',
        _id: '6aef0e891a7af6c7eede0032',
        name: 'Vikram Malhotra',
        companyName: 'Sunrise Solutions',
        businessName: 'Sunrise Solutions',
        invitationCode: 'SUNRISE-2026',
      },
    ];

    if (mongoose.connection.readyState === 1) {
      try {
        const liveOwners = await User.find({
          role: 'Business Owner',
          isActive: true,
        }).select('_id name companyName businessName invitationCode taxId');
        if (liveOwners && liveOwners.length > 0) {
          businesses = liveOwners.map((o) => ({
            id: o._id,
            _id: o._id,
            name: o.name,
            companyName: o.companyName || o.businessName,
            businessName: o.businessName || o.companyName,
            invitationCode: o.invitationCode || 'INVITE-2026',
            taxId: o.taxId || '',
          }));
        }
      } catch (e) {
        console.warn('[Auth] Live business lookup warning:', e.message);
      }
    }

    res.status(200).json({
      success: true,
      businesses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user (Business Owner, Accountant, Customer)
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
      role = 'Business Owner',
      businessId,
      invitationCode,
      gstin,
      taxId,
    } = req.body;

    // 1. Required field validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your full name',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a contact phone number',
      });
    }

    // 2. Password strength & confirmation
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
        message: 'Password must contain both letters and numbers',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation does not match',
      });
    }

    // 3. Security: Prevent System Admin public registration
    if (role && (role.trim().toLowerCase() === 'admin' || role.trim().toLowerCase() === 'system admin')) {
      return res.status(403).json({
        success: false,
        message: 'System Administrator accounts cannot be registered publicly.',
      });
    }

    const assignedRole = ['Accountant', 'Customer'].includes(role) ? role : 'Business Owner';

    // 4. Resolve Target Business / Organization
    let targetOwner = null;
    let targetBusinessId = null;
    let orgName = (businessName || companyName || '').trim();

    if (assignedRole === 'Business Owner') {
      if (!orgName) {
        return res.status(400).json({
          success: false,
          message: 'Please provide your registered business or company name',
        });
      }
    } else {
      // Accountant or Customer must associate with an existing business
      if (mongoose.connection.readyState === 1) {
        if (businessId && mongoose.Types.ObjectId.isValid(businessId)) {
          targetOwner = await User.findOne({ _id: businessId, role: 'Business Owner' });
        }
        if (!targetOwner && invitationCode) {
          targetOwner = await User.findOne({
            invitationCode: invitationCode.trim().toUpperCase(),
            role: 'Business Owner',
          });
        }
        if (!targetOwner) {
          // Fallback to first available business owner if neither was provided
          targetOwner = await User.findOne({ role: 'Business Owner' });
        }
      }

      if (targetOwner) {
        targetBusinessId = targetOwner._id;
        orgName = targetOwner.companyName || targetOwner.businessName || 'Business Workspace';
      } else {
        targetBusinessId = '6aef0e891a7af6c7eede0002'; // Apex Enterprises demo fallback
        orgName = 'Apex Enterprises Pvt Ltd';
      }
    }

    // 5. Parse Address
    let formattedAddress = {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      fullAddress: '',
    };
    if (typeof businessAddress === 'string' && businessAddress.trim()) {
      formattedAddress.street = businessAddress.trim();
      formattedAddress.fullAddress = businessAddress.trim();
    } else if (typeof businessAddress === 'object' && businessAddress !== null) {
      formattedAddress = { ...formattedAddress, ...businessAddress };
    }

    // 6. Resilient Offline Bypass
    if (mongoose.connection.readyState !== 1) {
      const existingDemo = demoUsers[email.toLowerCase().trim()];
      if (existingDemo) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists. Please sign in.',
        });
      }

      const mockId = 'usr_' + Date.now();
      const mockUser = {
        _id: mockId,
        id: mockId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: assignedRole,
        companyName: orgName,
        businessName: orgName,
        businessId: assignedRole === 'Business Owner' ? mockId : targetBusinessId,
        phone: phone.trim(),
        taxId: gstin || taxId || '',
        businessAddress: formattedAddress,
        isActive: true,
      };
      demoUsers[mockUser.email] = mockUser;
      const token = generateToken(mockUser.id);

      return res.status(201).json({
        success: true,
        message: `Account created successfully as ${assignedRole}! Welcome to BillFlow.`,
        token,
        user: mockUser,
      });
    }

    // 7. Check Duplicate Email
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
      });
    }

    // 8. Generate Invitation Code for Business Owners
    let ownerInvitationCode = '';
    if (assignedRole === 'Business Owner') {
      const codePrefix = orgName.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'FLOW';
      ownerInvitationCode = `${codePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 9. Create User in MongoDB
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      companyName: orgName,
      businessName: orgName,
      phone: phone.trim(),
      taxId: gstin || taxId || '',
      businessAddress: formattedAddress,
      invitationCode: ownerInvitationCode,
    });

    if (assignedRole === 'Business Owner') {
      newUser.businessId = newUser._id;
    } else {
      newUser.businessId = targetBusinessId;
    }

    await newUser.save();

    // 10. Role-Specific Post-Registration Setup
    if (assignedRole === 'Business Owner') {
      try {
        await BusinessSettings.create({
          user: newUser._id,
          businessName: orgName,
          email: newUser.email,
          phone: newUser.phone,
          gstin: gstin || taxId || '',
          taxId: gstin || taxId || '',
          address: formattedAddress,
          currency: 'INR',
          currencySymbol: '₹',
        });
      } catch (bsErr) {
        console.warn('[Register] BusinessSettings auto-init warning:', bsErr.message);
      }
    } else if (assignedRole === 'Customer') {
      // Find or create Customer record linked to this login
      try {
        let custDoc = await Customer.findOne({
          user: targetBusinessId,
          email: newUser.email,
        });

        if (!custDoc) {
          custDoc = await Customer.create({
            user: targetBusinessId,
            name: newUser.name,
            companyName: orgName,
            email: newUser.email,
            phone: newUser.phone,
            gstin: gstin || taxId || '',
            billingAddress: formattedAddress,
            portalUser: newUser._id,
          });
        } else {
          custDoc.portalUser = newUser._id;
          await custDoc.save();
        }

        newUser.customerRecord = custDoc._id;
        await newUser.save();
      } catch (custErr) {
        console.warn('[Register] Customer link warning:', custErr.message);
      }
    }

    const token = generateToken(newUser._id);

    res.status(201).json({
      success: true,
      message: `Account created successfully as ${assignedRole}! Welcome to BillFlow.`,
      token,
      user: {
        id: newUser._id,
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        companyName: newUser.companyName,
        businessName: newUser.businessName,
        businessId: newUser.businessId,
        invitationCode: newUser.invitationCode,
        phone: newUser.phone,
        taxId: newUser.taxId,
        isActive: newUser.isActive,
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

    const normalizedEmail = email.toLowerCase().trim();
    const demo = demoUsers[normalizedEmail];

    // Resilient offline bypass: If database is disconnected or connecting, login demo accounts immediately
    if (mongoose.connection.readyState !== 1) {
      if (demo) {
        const token = generateToken(demo.id);
        return res.status(200).json({
          success: true,
          message: 'Logged in successfully (Demo Session)',
          token,
          user: {
            id: demo.id,
            _id: demo.id,
            name: demo.name,
            email: normalizedEmail,
            role: demo.role,
            companyName: demo.companyName,
            businessName: demo.businessName,
            phone: demo.phone,
            taxId: demo.taxId || '',
            businessAddress: demo.businessAddress,
            isActive: true,
          },
        });
      }
      return res.status(503).json({
        success: false,
        message: 'Database connection is currently initializing. Please use one of the 1-Click Demo accounts.',
      });
    }

    // Try finding user with immediate fallback on query error / buffer timeout
    let user = null;
    try {
      user = await User.findOne({ email: normalizedEmail }).select('+password');
    } catch (dbErr) {
      console.warn('[Auth] Database lookup warning:', dbErr.message);
      if (demo) {
        const token = generateToken(demo.id);
        return res.status(200).json({
          success: true,
          message: 'Logged in successfully (Demo Session)',
          token,
          user: {
            id: demo.id,
            _id: demo.id,
            name: demo.name,
            email: normalizedEmail,
            role: demo.role,
            companyName: demo.companyName,
            businessName: demo.businessName,
            phone: demo.phone,
            taxId: demo.taxId || '',
            businessAddress: demo.businessAddress,
            isActive: true,
          },
        });
      }
      throw dbErr;
    }

    if (!user) {
      if (demo) {
        try {
          user = await User.create({
            _id: demo._id ? new mongoose.Types.ObjectId(demo._id) : undefined,
            name: demo.name,
            email: normalizedEmail,
            password: password || 'Password123!',
            role: demo.role,
            companyName: demo.companyName,
            businessName: demo.businessName,
            phone: demo.phone,
            taxId: demo.taxId || '',
            businessAddress: demo.businessAddress,
            isActive: true,
          });
        } catch (createErr) {
          console.warn('[Auth] Auto-create demo user error:', createErr.message);
          const token = generateToken(demo.id);
          return res.status(200).json({
            success: true,
            message: 'Logged in successfully (Demo Session)',
            token,
            user: {
              id: demo.id,
              _id: demo.id,
              name: demo.name,
              email: normalizedEmail,
              role: demo.role,
              companyName: demo.companyName,
              businessName: demo.businessName,
              phone: demo.phone,
              taxId: demo.taxId || '',
              businessAddress: demo.businessAddress,
              isActive: true,
            },
          });
        }
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
    if (!isMatch && (!demo || password !== 'Password123!')) {
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
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        businessName: user.businessName,
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
    if (mongoose.connection.readyState !== 1 || !req.user || !req.user._id) {
      return res.status(200).json({
        success: true,
        user: req.user,
      });
    }

    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(200).json({
          success: true,
          user: req.user,
        });
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
          businessName: user.businessName,
          phone: user.phone,
          businessAddress: user.businessAddress,
          taxId: user.taxId,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      });
    } catch (dbErr) {
      return res.status(200).json({
        success: true,
        user: req.user,
      });
    }
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
  getPublicBusinesses,
  registerUser,
  loginUser,
  getCurrentUserProfile,
  updateUserProfile,
  seedDemoUsers,
};
