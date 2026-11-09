const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const CreditNote = require('../models/CreditNote');
const BusinessSettings = require('../models/BusinessSettings');

const {
  demoUsers,
  demoCustomers,
  demoProducts,
  demoInvoices,
  demoPayments,
  demoCreditNotes,
  demoSettings,
} = require('../utils/mockData');

const seed = async () => {
  const atlasUri = 'mongodb+srv://prakashkommarajula_db_user:dYsxThAyl3Z1i97W@billing.zhvmruf.mongodb.net/invoice_billing_platform?retryWrites=true&w=majority';
  const uri = process.argv[2] || (process.env.SEED_ATLAS === 'true' ? atlasUri : (process.env.MONGODB_URI || atlasUri));
  console.log(`[Seed] Connecting to MongoDB: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log('[Seed] Connected successfully to MongoDB Atlas cluster.');

  // 1. Seed Users
  for (const email of Object.keys(demoUsers)) {
    const raw = demoUsers[email];
    let user = await User.findOne({ email: raw.email });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Password123!', salt);
      user = await User.create({
        _id: new mongoose.Types.ObjectId(raw._id),
        name: raw.name,
        email: raw.email,
        password: hashedPassword,
        role: raw.role,
        companyName: raw.companyName,
        businessName: raw.businessName,
        phone: raw.phone,
        taxId: raw.taxId,
        businessAddress: raw.businessAddress,
        isActive: true,
      });
      console.log(`[Seed] Created User: ${raw.name} (${raw.email}) [${raw.role}]`);
    } else {
      console.log(`[Seed] User already exists: ${raw.email}`);
    }
  }

  const owner = await User.findOne({ email: 'owner@apexenterprises.com' });
  const ownerId = owner._id;

  // 2. Seed Customers
  for (const c of demoCustomers) {
    let cust = await Customer.findOne({ customerId: c.customerId, user: ownerId });
    if (!cust) {
      cust = await Customer.create({
        _id: new mongoose.Types.ObjectId(c._id),
        user: ownerId,
        customerId: c.customerId,
        name: c.name,
        companyName: c.companyName,
        email: c.email,
        phone: c.phone,
        gstin: c.gstin,
        taxId: c.taxId,
        status: c.status,
        paymentTerms: c.paymentTerms,
        currency: c.currency,
        billingAddress: c.billingAddress,
        shippingAddress: c.shippingAddress,
      });
      console.log(`[Seed] Created Customer: ${c.name} (${c.customerId})`);
    }
  }

  // 3. Seed Products
  for (const p of demoProducts) {
    let prod = await Product.findOne({ productId: p.productId, user: ownerId });
    if (!prod) {
      prod = await Product.create({
        _id: new mongoose.Types.ObjectId(p._id),
        user: ownerId,
        productId: p.productId,
        productCode: p.productCode,
        name: p.name,
        description: p.description,
        category: p.category,
        type: p.type,
        unit: p.unit,
        price: p.price,
        taxRate: p.taxRate,
        status: p.status,
      });
      console.log(`[Seed] Created Product: ${p.name}`);
    }
  }

  // 4. Seed Invoices
  for (const inv of demoInvoices) {
    let invoice = await Invoice.findOne({ invoiceNumber: inv.invoiceNumber, user: ownerId });
    if (!invoice) {
      invoice = await Invoice.create({
        _id: new mongoose.Types.ObjectId(inv._id),
        user: ownerId,
        invoiceNumber: inv.invoiceNumber,
        customer: new mongoose.Types.ObjectId(inv.customer),
        customerName: inv.customerName,
        customerEmail: inv.customerEmail,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        subtotal: inv.subtotal,
        taxTotal: inv.taxTotal,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        balanceDue: inv.balanceDue,
        status: inv.status,
        paymentTerms: inv.paymentTerms,
        currency: inv.currency,
        items: inv.items,
        billingAddress: inv.billingAddress,
      });
      console.log(`[Seed] Created Invoice: ${inv.invoiceNumber} (${inv.status})`);
    }
  }

  // 5. Seed Payments
  for (const py of demoPayments) {
    let payment = await Payment.findOne({ paymentNumber: py.paymentNumber, user: ownerId });
    if (!payment) {
      payment = await Payment.create({
        _id: new mongoose.Types.ObjectId(py._id),
        user: ownerId,
        paymentNumber: py.paymentNumber,
        invoice: new mongoose.Types.ObjectId(py.invoice),
        invoiceNumber: py.invoiceNumber,
        customer: new mongoose.Types.ObjectId(py.customer),
        customerName: py.customerName,
        amount: py.amount,
        paymentDate: py.paymentDate,
        paymentMethod: py.paymentMethod,
        transactionReference: py.transactionReference,
        status: py.status,
        notes: py.notes,
      });
      console.log(`[Seed] Created Payment: ${py.paymentNumber}`);
    }
  }

  // 6. Seed Credit Notes
  for (const cn of demoCreditNotes) {
    let note = await CreditNote.findOne({ creditNoteNumber: cn.creditNoteNumber, user: ownerId });
    if (!note) {
      note = await CreditNote.create({
        _id: new mongoose.Types.ObjectId(cn._id),
        user: ownerId,
        creditNoteNumber: cn.creditNoteNumber,
        invoice: new mongoose.Types.ObjectId(cn.invoice),
        invoiceNumber: cn.invoiceNumber,
        customer: new mongoose.Types.ObjectId(cn.customer),
        customerName: cn.customerName,
        amount: cn.amount,
        creditNoteDate: cn.creditNoteDate,
        reason: cn.reason,
        status: cn.status,
        items: cn.items,
      });
      console.log(`[Seed] Created Credit Note: ${cn.creditNoteNumber}`);
    }
  }

  // 7. Seed Settings
  let settings = await BusinessSettings.findOne({ user: ownerId });
  if (!settings) {
    await BusinessSettings.create({
      user: ownerId,
      ...demoSettings,
    });
    console.log('[Seed] Created Business Settings');
  }

  console.log('[Seed] Database seeding completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('[Seed] Error during seeding:', err);
  process.exit(1);
});
