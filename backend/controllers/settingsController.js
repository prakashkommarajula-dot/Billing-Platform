const mongoose = require('mongoose');
const BusinessSettings = require('../models/BusinessSettings');
const User = require('../models/User');
const { demoSettings } = require('../utils/mockData');

// Helper to get or create business settings for a user
const getOrCreateSettings = async (userId, userObj = null) => {
  let settings = await BusinessSettings.findOne({ user: userId });
  if (!settings) {
    settings = await BusinessSettings.create({
      user: userId,
      companyName: userObj?.companyName || userObj?.businessName || 'Apex Enterprises Pvt Ltd',
      businessEmail: userObj?.email || 'billing@apexenterprises.com',
      phone: userObj?.phone || '+91 98765 43210',
      gstin: userObj?.taxId || '29ABCDE1234F1Z5',
      address: {
        street: userObj?.businessAddress?.street || '124 Tech Park Road, Whitefield',
        city: userObj?.businessAddress?.city || 'Bengaluru',
        state: userObj?.businessAddress?.state || 'Karnataka',
        postalCode: userObj?.businessAddress?.zipCode || '560066',
        country: userObj?.businessAddress?.country || 'India',
      },
    });
  }
  return settings;
};

// @desc    Get business settings for logged-in user
// @route   GET /api/settings
// @access  Private (Admin, Business Owner)
const getSettings = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        settings: demoSettings,
      });
    }

    let settings = null;
    try {
      settings = await getOrCreateSettings(req.user._id, req.user);
    } catch (e) {
      settings = demoSettings;
    }

    res.status(200).json({
      success: true,
      settings: settings || demoSettings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update business settings
// @route   PUT /api/settings
// @access  Private (Admin, Business Owner)
const updateSettings = async (req, res, next) => {
  try {
    const {
      companyName,
      businessEmail,
      phone,
      gstin,
      taxId,
      logo,
      address,
      invoiceSettings,
      bankDetails,
    } = req.body;

    let settings = await getOrCreateSettings(req.user._id, req.user);

    // Update Company Information
    if (companyName) settings.companyName = companyName.trim();
    if (businessEmail) settings.businessEmail = businessEmail.toLowerCase().trim();
    if (phone) settings.phone = phone.trim();
    if (gstin) settings.gstin = gstin.toUpperCase().trim();
    if (taxId) settings.taxId = taxId.toUpperCase().trim();
    if (logo !== undefined) settings.logo = logo;

    // Update Address
    if (address) {
      settings.address = {
        street: address.street ? address.street.trim() : settings.address.street,
        city: address.city ? address.city.trim() : settings.address.city,
        state: address.state ? address.state.trim() : settings.address.state,
        postalCode: address.postalCode ? address.postalCode.trim() : settings.address.postalCode,
        country: address.country ? address.country.trim() : settings.address.country,
      };
    }

    // Update Invoice Settings
    if (invoiceSettings) {
      settings.invoiceSettings = {
        prefix: invoiceSettings.prefix !== undefined ? invoiceSettings.prefix.trim() : settings.invoiceSettings.prefix,
        nextNumber: invoiceSettings.nextNumber !== undefined ? Math.max(1, Number(invoiceSettings.nextNumber)) : settings.invoiceSettings.nextNumber,
        defaultPaymentTerms: invoiceSettings.defaultPaymentTerms || settings.invoiceSettings.defaultPaymentTerms,
        defaultTaxRate: invoiceSettings.defaultTaxRate !== undefined ? Number(invoiceSettings.defaultTaxRate) : settings.invoiceSettings.defaultTaxRate,
        defaultTaxType: invoiceSettings.defaultTaxType || settings.invoiceSettings.defaultTaxType,
        defaultCurrency: invoiceSettings.defaultCurrency || settings.invoiceSettings.defaultCurrency,
        defaultNotes: invoiceSettings.defaultNotes !== undefined ? invoiceSettings.defaultNotes : settings.invoiceSettings.defaultNotes,
        termsAndConditions: invoiceSettings.termsAndConditions !== undefined ? invoiceSettings.termsAndConditions : settings.invoiceSettings.termsAndConditions,
      };
    }

    // Update Bank Details
    if (bankDetails) {
      settings.bankDetails = {
        bankName: bankDetails.bankName !== undefined ? bankDetails.bankName.trim() : settings.bankDetails.bankName,
        accountNumber: bankDetails.accountNumber !== undefined ? bankDetails.accountNumber.trim() : settings.bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode !== undefined ? bankDetails.ifscCode.toUpperCase().trim() : settings.bankDetails.ifscCode,
        branchName: bankDetails.branchName !== undefined ? bankDetails.branchName.trim() : settings.bankDetails.branchName,
        upiId: bankDetails.upiId !== undefined ? bankDetails.upiId.toLowerCase().trim() : settings.bankDetails.upiId,
      };
    }

    await settings.save();

    // Also sync companyName and phone to User model
    if (companyName || phone) {
      await User.findByIdAndUpdate(req.user._id, {
        ...(companyName && { companyName: companyName.trim(), businessName: companyName.trim() }),
        ...(phone && { phone: phone.trim() }),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Business settings and invoicing preferences saved successfully',
      settings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload or update business logo
// @route   POST /api/settings/logo
// @access  Private (Admin, Business Owner)
const uploadLogo = async (req, res, next) => {
  try {
    const { logo } = req.body;
    if (!logo) {
      return res.status(400).json({
        success: false,
        message: 'No logo image data provided',
      });
    }

    const settings = await getOrCreateSettings(req.user._id, req.user);
    settings.logo = logo;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Company logo uploaded and updated successfully',
      logo: settings.logo,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  uploadLogo,
};
