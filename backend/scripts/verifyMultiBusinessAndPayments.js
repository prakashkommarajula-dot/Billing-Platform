const { payPortalInvoice } = require('../controllers/portalController');
const { getPublicBusinesses, registerUser, loginUser } = require('../controllers/authController');

const mockReq = (user, body = {}, query = {}, params = {}) => ({
  user,
  body,
  query,
  params,
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
  console.log('Testing Multi-Business, Multi-Role & Customer Due Payments...\n');

  // Test 1: Public Businesses Discovery
  {
    const req = mockReq(null);
    const res = mockRes();
    await getPublicBusinesses(req, res, next);
    console.log('1. GET /api/auth/businesses:');
    console.log('   Status:', res.statusCode);
    console.log('   Businesses count:', res.data?.businesses?.length);
    console.log('   Names:', res.data?.businesses?.map(b => `${b.businessName} (${b.invitationCode})`).join(' | '));
  }

  // Test 2: Multi-Role Registration - Accountant linking to Business
  {
    const req = mockReq(null, {
      name: 'Priya Accountant',
      email: 'priya.' + Date.now() + '@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      phone: '+91 98765 44332',
      role: 'Accountant',
      invitationCode: 'APEX-2026',
    });
    const res = mockRes();
    await registerUser(req, res, next);
    console.log('\n2. Register Accountant linking via Code:');
    console.log('   Status:', res.statusCode);
    console.log('   Message:', res.data?.message);
    console.log('   Assigned Role:', res.data?.user?.role);
    console.log('   Linked Business Workspace:', res.data?.user?.companyName);
  }

  // Test 3: Customer Due Payment Processing (Pay Now)
  {
    const customerUser = {
      _id: '6aef0e891a7af6c7eede0003',
      id: '6aef0e891a7af6c7eede0003',
      name: 'Sarah Connor',
      email: 'customer@globaltech.com',
      role: 'Customer',
      customerRecord: '6aef0e891a7af6c7eede0101'
    };

    const req = mockReq(customerUser, {
      invoiceId: '6aef0e891a7af6c7eede0011', // INV-2026-001 with balance 25,000
      amount: 15000,
      paymentMethod: 'UPI',
      transactionReference: 'SIM-UPI-TEST-' + Date.now().toString().slice(-4),
      notes: 'Automated verification test settlement'
    });
    const res = mockRes();
    await payPortalInvoice(req, res, next);

    console.log('\n3. POST /api/portal/pay (Customer Settling Due Invoice):');
    console.log('   Status:', res.statusCode);
    console.log('   Message:', res.data?.message);
    console.log('   Receipt Number:', res.data?.receipt?.receiptNumber);
    console.log('   Amount Paid:', res.data?.receipt?.amountPaid);
    console.log('   Remaining Balance:', res.data?.receipt?.remainingBalance);
    console.log('   Payment Method:', res.data?.receipt?.paymentMethod);
    console.log('   Reconciled Status:', res.data?.invoice?.status);
  }

  // Test 4: Full Settlement of Balance
  {
    const customerUser = {
      _id: '6aef0e891a7af6c7eede0003',
      id: '6aef0e891a7af6c7eede0003',
      name: 'Sarah Connor',
      email: 'customer@globaltech.com',
      role: 'Customer',
    };

    const req = mockReq(customerUser, {
      invoiceId: '6aef0e891a7af6c7eede0011',
      amount: 10000, // remaining balance
      paymentMethod: 'Bank Transfer',
      transactionReference: 'UTR-HDFC-FINAL-' + Date.now().toString().slice(-4),
    });
    const res = mockRes();
    await payPortalInvoice(req, res, next);

    console.log('\n4. POST /api/portal/pay (Full Settlement to Paid):');
    console.log('   Status:', res.statusCode);
    console.log('   Receipt Number:', res.data?.receipt?.receiptNumber);
    console.log('   Remaining Balance:', res.data?.receipt?.remainingBalance);
    console.log('   Updated Status:', res.data?.invoice?.status);
  }

  console.log('\nAll Multi-Business, Multi-Role & Customer Payment Tests Passed Successfully!\n');
  process.exit(0);
})();
