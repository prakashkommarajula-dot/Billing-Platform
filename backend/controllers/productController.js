const mongoose = require('mongoose');
const Product = require('../models/Product');
const { demoProducts } = require('../utils/mockData');

// Helper to seed initial sample catalog for a business if empty
const seedInitialProducts = async (userId) => {
  const count = await Product.countDocuments({ user: userId });
  if (count > 0) return;

  const sampleCatalog = [
    {
      user: userId,
      productId: 'PRD-001',
      name: 'Cloud Infrastructure & DevOps Consultation',
      productCode: 'SAC-998313',
      description: 'Senior DevOps architecture, Kubernetes orchestration, CI/CD pipeline automation.',
      category: 'Consulting & Professional',
      type: 'Service',
      unit: 'Hours',
      price: 3500,
      taxRate: 18,
      status: 'Active',
    },
    {
      user: userId,
      productId: 'PRD-002',
      name: 'Enterprise ERP Billing Software License',
      productCode: 'SAC-997331',
      description: 'Annual multi-user billing, ledger accounting, and inventory management license.',
      category: 'Software & Cloud',
      type: 'Service',
      unit: 'License',
      price: 45000,
      taxRate: 18,
      status: 'Active',
    },
    {
      user: userId,
      productId: 'PRD-003',
      name: '24/7 SLA Server Maintenance & Monitoring',
      productCode: 'SAC-998719',
      description: 'Monthly uptime guarantee, automated patch management, security firewall monitoring.',
      category: 'Maintenance & Support',
      type: 'Service',
      unit: 'Month',
      price: 18000,
      taxRate: 18,
      status: 'Active',
    },
    {
      user: userId,
      productId: 'PRD-004',
      name: 'Thermal Barcode POS Billing Printer',
      productCode: 'HSN-844332',
      description: 'High-speed 80mm thermal receipt printer with USB and Ethernet connectivity.',
      category: 'Hardware & Devices',
      type: 'Product',
      unit: 'Pcs',
      price: 6800,
      taxRate: 18,
      status: 'Active',
    },
    {
      user: userId,
      productId: 'PRD-005',
      name: 'Handheld 2D QR Code Barcode Scanner',
      productCode: 'HSN-847160',
      description: 'Rugged wireless 2.4GHz USB barcode reader with automatic stand sensor.',
      category: 'Hardware & Devices',
      type: 'Product',
      unit: 'Pcs',
      price: 3200,
      taxRate: 18,
      status: 'Active',
    },
    {
      user: userId,
      productId: 'PRD-006',
      name: 'Corporate Cyber Security Vulnerability Audit',
      productCode: 'SAC-998315',
      description: 'OWASP top-10 penetration testing, API vulnerability assessment, compliance report.',
      category: 'Consulting & Professional',
      type: 'Service',
      unit: 'Audit',
      price: 65000,
      taxRate: 18,
      status: 'Active',
    },
  ];

  await Product.insertMany(sampleCatalog);
};

// @desc    Get all products & services with search, filters & pagination
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        products: demoProducts,
        pagination: {
          total: demoProducts.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    }

    try {
      // Auto-seed sample catalog if brand new business
      await seedInitialProducts(userId);
    } catch (seedErr) {
      console.warn('[Product] Auto-seed warning:', seedErr.message);
    }

    const {
      search,
      category,
      type,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = { user: userId };

    // Search query
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { productCode: searchRegex },
        { productId: searchRegex },
        { category: searchRegex },
        { description: searchRegex },
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Type filter (Product vs Service)
    if (type && type !== 'All') {
      query.type = type;
    }

    // Status filter
    if (status && status !== 'All') {
      query.status = status;
    } else {
      // By default don't show Archived unless explicitly asked
      query.status = { $ne: 'Archived' };
    }

    const currentPage = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (currentPage - 1) * pageSize;

    const totalCount = await Product.countDocuments(query);

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    // Get unique categories for this business to populate frontend dropdown filter
    const uniqueCategories = await Product.distinct('category', { user: userId });

    res.status(200).json({
      success: true,
      products,
      categories: uniqueCategories,
      pagination: {
        total: totalCount,
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(totalCount / pageSize) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product or service
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      productCode,
      description,
      category,
      type,
      unit,
      price,
      taxRate,
      status,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product or service name is required',
      });
    }

    if (price === undefined || price === null || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid non-negative price is required',
      });
    }

    // Auto-generate sequential or clean productId
    const count = await Product.countDocuments({ user: req.user._id });
    const formattedId = `PRD-${(count + 1).toString().padStart(3, '0')}`;

    const product = await Product.create({
      user: req.user._id,
      productId: formattedId,
      name: name.trim(),
      productCode: productCode ? productCode.trim().toUpperCase() : '',
      description: description ? description.trim() : '',
      category: category ? category.trim() : 'General',
      type: type === 'Product' ? 'Product' : 'Service',
      unit: unit ? unit.trim() : 'Units',
      price: Number(price),
      taxRate: taxRate !== undefined ? Number(taxRate) : 18,
      status: status || 'Active',
    });

    res.status(201).json({
      success: true,
      message: `${product.type} "${product.name}" created successfully`,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product or service
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or access denied',
      });
    }

    const {
      name,
      productCode,
      description,
      category,
      type,
      unit,
      price,
      taxRate,
      status,
    } = req.body;

    if (name) product.name = name.trim();
    if (productCode !== undefined) product.productCode = productCode.trim().toUpperCase();
    if (description !== undefined) product.description = description.trim();
    if (category) product.category = category.trim();
    if (type) product.type = type;
    if (unit) product.unit = unit.trim();
    if (price !== undefined) product.price = Number(price);
    if (taxRate !== undefined) product.taxRate = Number(taxRate);
    if (status) product.status = status;

    const updated = await product.save();

    res.status(200).json({
      success: true,
      message: `${updated.type} "${updated.name}" updated successfully`,
      product: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or archive a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res, next) => {
  try {
    const { archiveOnly } = req.query;

    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or access denied',
      });
    }

    if (archiveOnly === 'true') {
      product.status = 'Archived';
      await product.save();
      return res.status(200).json({
        success: true,
        message: `${product.type} "${product.name}" has been archived.`,
        action: 'archived',
      });
    }

    await Product.findByIdAndDelete(product._id);

    res.status(200).json({
      success: true,
      message: `${product.type} "${product.name}" deleted permanently.`,
      action: 'deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
