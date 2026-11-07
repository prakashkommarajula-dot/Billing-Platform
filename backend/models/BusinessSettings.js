const mongoose = require('mongoose');

const businessSettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: 'Apex Enterprises Pvt Ltd',
    },
    businessEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'billing@apexenterprises.com',
    },
    phone: {
      type: String,
      trim: true,
      default: '+91 98765 43210',
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: '29ABCDE1234F1Z5',
    },
    taxId: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'ABCDE1234F',
    },
    logo: {
      type: String,
      default: '',
    },
    address: {
      street: { type: String, default: '124 Tech Park Road, Whitefield' },
      city: { type: String, default: 'Bengaluru' },
      state: { type: String, default: 'Karnataka' },
      postalCode: { type: String, default: '560066' },
      country: { type: String, default: 'India' },
    },
    invoiceSettings: {
      prefix: {
        type: String,
        trim: true,
        default: 'INV-',
      },
      nextNumber: {
        type: Number,
        default: 15,
      },
      defaultPaymentTerms: {
        type: String,
        enum: ['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60'],
        default: 'Net 30',
      },
      defaultTaxRate: {
        type: Number,
        default: 18,
      },
      defaultTaxType: {
        type: String,
        enum: ['Intra-State', 'Inter-State'],
        default: 'Intra-State',
      },
      defaultCurrency: {
        type: String,
        default: 'INR',
      },
      defaultNotes: {
        type: String,
        default: 'Thank you for your business. Please remit payment on or before the due date.',
      },
      termsAndConditions: {
        type: String,
        default: '1. All payments must be made strictly according to agreed credit terms.\n2. Overdue invoices attract interest @ 18% p.a.\n3. Goods or services once delivered and accepted are non-refundable.',
      },
    },
    bankDetails: {
      bankName: { type: String, default: 'HDFC Bank Ltd' },
      accountNumber: { type: String, default: '50200012345678' },
      ifscCode: { type: String, default: 'HDFC0001234' },
      branchName: { type: String, default: 'Whitefield Branch, Bengaluru' },
      upiId: { type: String, default: 'apexenterprises@hdfcbank' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BusinessSettings', businessSettingsSchema);
