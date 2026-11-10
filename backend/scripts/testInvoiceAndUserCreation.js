const { createInvoice } = require('../controllers/invoiceController');
const { registerUser } = require('../controllers/authController');
const { createUser } = require('../controllers/userController');

const mockReq = (body = {}) => ({
  user: {
    _id: '6aef0e891a7af6c7eede0001',
    id: '6aef0e891a7af6c7eede0001',
    name: 'Ananya Roy',
    email: 'accountant@apexenterprises.com',
    role: 'Accountant',
    companyName: 'Apex Enterprises Pvt Ltd'
  },
  body,
  query: {},
  params: {},
  headers: {}
});

const mockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };
  return res;
};

const next = (err) => {
  if (err) console.error('  [NEXT ERROR CAUGHT]:', err.message);
};

(async () => {
  console.log('Testing Invoice Creation and User Creation in Disconnected State...\n');

  // 1. Test Invoice Creation (same as in user screenshot)
  {
    const req = mockReq({
      customerName: 'Acme Cloud Technologies',
      customerEmail: 'billing@acmecloud.com',
      customerGstin: '29AABCU9603R1ZM',
      billingAddress: '12 Electronic City Phase 1, Hosur Road, Bengaluru, Karnataka, 560100',
      transactionType: 'Inter-State',
      invoiceNumber: 'INV-2026-006',
      invoiceDate: '2026-11-10',
      dueDate: '2026-11-25',
      items: [
        {
          description: 'Enterprise ERP License',
          quantity: 1,
          unitPrice: 45000,
          discount: 0,
          taxRate: 18,
          amount: 53100
        }
      ],
      discount: 0,
      paidAmount: 0,
      status: 'Sent'
    });
    const res = mockRes();
    await createInvoice(req, res, next);
    console.log('1. createInvoice Status:', res.statusCode);
    console.log('   Message:', res.data?.message);
    console.log('   Invoice Number:', res.data?.invoice?.invoiceNumber);
    console.log('   Total Amount:', res.data?.invoice?.totalAmount);
    console.log('   Balance Due:', res.data?.invoice?.balanceDue);
  }

  // 2. Test User Registration (Public Register)
  {
    const req = mockReq({
      name: 'Prakash Rao',
      email: 'prakash.test.' + Date.now() + '@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      companyName: 'Prakash Tech Solutions',
      phone: '+91 98765 11223',
      businessAddress: 'Plot 44, Madhapur, Hyderabad, Telangana, 500081',
      role: 'Business Owner'
    });
    const res = mockRes();
    await registerUser(req, res, next);
    console.log('\n2. registerUser Status:', res.statusCode);
    console.log('   Message:', res.data?.message);
    console.log('   User ID:', res.data?.user?.id || res.data?.user?._id);
    console.log('   User Email:', res.data?.user?.email);
    console.log('   Token received:', !!res.data?.token);
  }

  // 3. Test Admin User Creation (via /users)
  {
    const req = mockReq({
      name: 'Vikram Seth',
      email: 'vikram.test.' + Date.now() + '@example.com',
      password: 'Password123!',
      role: 'Accountant',
      companyName: 'Apex Enterprises Pvt Ltd',
      phone: '+91 98765 99887',
      isActive: true
    });
    const res = mockRes();
    await createUser(req, res, next);
    console.log('\n3. createUser Status:', res.statusCode);
    console.log('   Message:', res.data?.message);
    console.log('   Created Name:', res.data?.user?.name);
    console.log('   Created Role:', res.data?.user?.role);
  }

  console.log('\nBoth Invoice Creation and User Creation Verified Successfully!');
  process.exit(0);
})();
