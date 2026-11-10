const https = require('https');

async function testEndpoint(name, path, method = 'GET', body = null, token = null) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'billflow-billing-platform.onrender.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        resolve({ name, path, status: res.statusCode, body: resBody });
      });
    });
    req.on('error', (err) => resolve({ name, path, status: 'ERROR', body: err.message }));
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  console.log('Testing Live Render APIs...');
  
  // 1. Login
  const loginRes = await testEndpoint('Login Admin', '/api/auth/login', 'POST', {
    email: 'admin@platform.com',
    password: 'password123'
  });
  console.log(loginRes.name, '=>', loginRes.status);
  
  let token = null;
  try {
    const parsed = JSON.parse(loginRes.body);
    token = parsed.token;
  } catch (e) {
    console.error('Failed to parse login response:', loginRes.body);
  }

  if (!token) {
    console.error('No token obtained, aborting endpoint tests.');
    return;
  }

  const endpoints = [
    ['Dashboard Summary', '/api/dashboard/summary', 'GET'],
    ['List Customers', '/api/customers', 'GET'],
    ['Customer Details (details)', '/api/customers/details', 'GET'],
    ['List Products', '/api/products', 'GET'],
    ['List Invoices', '/api/invoices', 'GET'],
    ['Invoice Details (details)', '/api/invoices/details', 'GET'],
    ['List Payments', '/api/payments', 'GET'],
    ['List Credit Notes', '/api/credit-notes', 'GET'],
    ['Get Business Settings', '/api/settings', 'GET'],
    ['Get Profile', '/api/profile', 'GET'],
    ['Get Users', '/api/users', 'GET'],
    ['Get Health', '/api/health', 'GET']
  ];

  for (const [name, path, method] of endpoints) {
    const res = await testEndpoint(name, path, method, null, token);
    const preview = res.body.substring(0, 100).replace(/\n/g, ' ');
    console.log(`${name} [${path}] => ${res.status} | ${preview}`);
  }
})();
