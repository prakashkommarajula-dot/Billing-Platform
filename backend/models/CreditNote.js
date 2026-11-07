const mongoose = require('mongoose');

const creditNoteSchema = new mongoose.Schema(
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
      required: [true, 'Original invoice reference is required'],
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: [true, 'Original invoice number is required'],
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
    creditNoteNumber: {
      type: String,
      required: true,
      index: true,
    },
    creditNoteDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Credit amount is required'],
      min: [0.01, 'Credit amount must be greater than zero'],
    },
    reason: {
      type: String,
      enum: [
        'Order Cancellation',
        'Goods Return',
        'Deficiency in Service',
        'Correction in Invoice',
        'Price Adjustment',
        'Other',
      ],
      default: 'Price Adjustment',
      required: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    invoiceBalanceBeforeCredit: {
      type: Number,
      default: 0,
    },
    invoiceBalanceAfterCredit: {
      type: Number,
      default: 0,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    recordedByName: {
      type: String,
      default: 'Accountant',
    },
    status: {
      type: String,
      enum: ['Issued', 'Applied', 'Draft', 'Cancelled'],
      default: 'Issued',
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

module.exports = mongoose.model('CreditNote', creditNoteSchema);
