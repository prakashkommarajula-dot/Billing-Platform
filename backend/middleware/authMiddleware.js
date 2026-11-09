const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { demoUsers } = require('../utils/mockData');

// Quick lookup map of demo users indexed by their static ID
const demoUsersById = {};
Object.values(demoUsers).forEach((u) => {
  demoUsersById[u.id] = u;
  demoUsersById[u._id] = u;
});

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_jwt_key_invoice_billing_dev_2026_xyz123'
      );

      // 1. Resilient offline check: If database is disconnected, use demo user immediately
      if (mongoose.connection.readyState !== 1 && demoUsersById[decoded.id]) {
        req.user = demoUsersById[decoded.id];
        return next();
      }

      // 2. Query DB with error handling to avoid 10s buffering timeouts
      let user = null;
      if (mongoose.connection.readyState === 1) {
        try {
          user = await User.findById(decoded.id).select('-password');
        } catch (dbErr) {
          console.warn('[AuthMiddleware] Database lookup warning:', dbErr.message);
        }
      }

      // 3. Fallback to demo user if DB didn't return or was unreachable
      if (!user && demoUsersById[decoded.id]) {
        user = demoUsersById[decoded.id];
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'This account has been deactivated. Please contact support.',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authorization token',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no bearer token provided',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for this operation',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
