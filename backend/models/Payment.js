const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: [true, 'Invoice selection is required'],
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: false,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
    },
    paymentNumber: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than zero'],
    },
    outstandingBeforePayment: {
      type: Number,
      default: 0,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: [
        'Cash',
        'UPI',
        'Bank Transfer',
        'Card',
        'Credit Card',
        'Debit Card',
        'Cheque',
        'Net Banking',
        'Other',
      ],
      default: 'Bank Transfer',
      required: true,
    },
    transactionReference: {
      type: String,
      default: '',
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    recordedByName: {
      type: String,
      default: 'System',
    },
    status: {
      type: String,
      enum: ['Completed', 'Pending', 'Failed', 'Reversed'],
      default: 'Completed',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate processing with identical transaction reference for same invoice
paymentSchema.index(
  { invoice: 1, transactionReference: 1 },
  {
    unique: true,
    partialFilterExpression: { transactionReference: { $gt: '' } },
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
