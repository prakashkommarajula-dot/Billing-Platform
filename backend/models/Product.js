const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: String,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product or service name is required'],
      trim: true,
    },
    productCode: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
      index: true,
    },
    type: {
      type: String,
      enum: ['Product', 'Service'],
      default: 'Service',
      index: true,
    },
    unit: {
      type: String,
      trim: true,
      default: 'Units',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    taxRate: {
      type: Number,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
      default: 18,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Archived'],
      default: 'Active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate productId and default productCode if missing
productSchema.pre('save', async function (next) {
  if (!this.productId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.productId = `PRD-${randomSuffix}`;
  }
  if (!this.productCode) {
    const prefix = this.type === 'Service' ? 'SAC' : 'HSN';
    this.productCode = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
