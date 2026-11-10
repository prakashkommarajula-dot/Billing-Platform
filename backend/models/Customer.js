const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerId: {
      type: String,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    gstin: {
      type: String,
      trim: true,
      default: '',
    },
    taxId: {
      type: String,
      trim: true,
      default: '',
    },
    billingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Archived'],
      default: 'Active',
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    totalInvoices: {
      type: Number,
      default: 0,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
    },
    portalUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate customerId before save if not provided
customerSchema.pre('save', async function (next) {
  if (!this.customerId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.customerId = `CUST-${randomSuffix}`;
  }
  if (!this.gstin && this.taxId) {
    this.gstin = this.taxId;
  }
  if (!this.taxId && this.gstin) {
    this.taxId = this.gstin;
  }
  if (!this.billingAddress.postalCode && this.billingAddress.zipCode) {
    this.billingAddress.postalCode = this.billingAddress.zipCode;
  }
  if (!this.billingAddress.zipCode && this.billingAddress.postalCode) {
    this.billingAddress.zipCode = this.billingAddress.postalCode;
  }
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
