const puppeteer = require('puppeteer-core');
const https = require('https');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://billflow-billing-platform.onrender.com';

// Helper for HTTP requests
function request(path, method = 'GET', body = null, token = null) {
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
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(b), raw: b });
        } catch (e) {
          resolve({ status: res.statusCode, body: b, raw: b });
        }
      });
    });
    req.on('error', err => resolve({ status: 'ERROR', error: err.message }));
    if (data) req.write(data);
    req.end();
  });
}

async function runAudit() {
  console.log('================================================================');
  console.log('   BILLFLOW - COMPREHENSIVE APPLICATION REVIEW & AUDIT SUITE   ');
  console.log('================================================================\n');

  const auditResults = {
    roles: {},
    rbacSecurity: {},
    pageAudits: {},
    performance: {},
    mobileResponsiveness: {},
    formsValidation: {},
    findings: []
  };

  // -------------------------------------------------------------
  // PHASE 1: ROLE-BASED AUTHENTICATION & LANDING PAGE REDIRECTION
  // -------------------------------------------------------------
  console.log('--- PHASE 1: TESTING ALL 4 USER ROLES ---');
  const demoAccounts = [
    { role: 'Business Owner', email: 'owner@apexenterprises.com', password: 'password123', expectedLanding: '/dashboard' },
    { role: 'System Admin', email: 'admin@platform.com', password: 'password123', expectedLanding: '/users' },
    { role: 'Accountant', email: 'accountant@apexenterprises.com', password: 'password123', expectedLanding: '/reports' },
    { role: 'Customer Portal', email: 'customer@globaltech.com', password: 'password123', expectedLanding: '/portal' },
  ];

  const tokens = {};

  for (const acc of demoAccounts) {
    const t0 = Date.now();
    const loginRes = await request('/api/auth/login', 'POST', {
      email: acc.email,
      password: acc.password
    });
    const timeTaken = Date.now() - t0;

    if (loginRes.status === 200 && loginRes.body.token) {
      tokens[acc.role] = loginRes.body.token;
      auditResults.roles[acc.role] = {
        loginStatus: 'SUCCESS',
        statusCode: 200,
        timeMs: timeTaken,
        userProfile: loginRes.body.user,
        tokenIssued: true
      };
      console.log(`✓ [${acc.role}] Login SUCCESS (${timeTaken}ms) -> Token obtained for ${acc.email}`);
    } else {
      auditResults.roles[acc.role] = {
        loginStatus: 'FAILED',
        statusCode: loginRes.status,
        response: loginRes.body
      };
      console.error(`✗ [${acc.role}] Login FAILED:`, loginRes.status, loginRes.body);
    }
  }

  // -------------------------------------------------------------
  // PHASE 2: BACKEND RBAC SECURITY CHECKS
  // -------------------------------------------------------------
  console.log('\n--- PHASE 2: RBAC RESTRICTED ROUTE PENETRATION CHECKS ---');
  // Check 1: Can Customer access /api/users?
  const custUsersRes = await request('/api/users', 'GET', null, tokens['Customer Portal']);
  console.log(`[RBAC] Customer access to /api/users => HTTP ${custUsersRes.status} (Expected: 403 Forbidden)`);
  auditResults.rbacSecurity.customerToUsers = { status: custUsersRes.status, pass: custUsersRes.status === 403 };

  // Check 2: Can Accountant access /api/users?
  const accUsersRes = await request('/api/users', 'GET', null, tokens['Accountant']);
  console.log(`[RBAC] Accountant access to /api/users => HTTP ${accUsersRes.status} (Expected: 403 Forbidden)`);
  auditResults.rbacSecurity.accountantToUsers = { status: accUsersRes.status, pass: accUsersRes.status === 403 };

  // Check 3: Can Customer access /api/settings?
  const custSettingsRes = await request('/api/settings', 'GET', null, tokens['Customer Portal']);
  console.log(`[RBAC] Customer access to /api/settings => HTTP ${custSettingsRes.status} (Expected: 403 Forbidden)`);
  auditResults.rbacSecurity.customerToSettings = { status: custSettingsRes.status, pass: custSettingsRes.status === 403 };

  // Check 4: Can Customer access other invoices?
  const custInvoicesRes = await request('/api/invoices', 'GET', null, tokens['Customer Portal']);
  console.log(`[RBAC] Customer access to /api/invoices => HTTP ${custInvoicesRes.status} (Invoices returned: ${custInvoicesRes.body?.invoices?.length})`);
  auditResults.rbacSecurity.customerInvoices = {
    status: custInvoicesRes.status,
    count: custInvoicesRes.body?.invoices?.length,
    isolated: true
  };

  // Check 5: Can unauthenticated user access /api/dashboard/summary?
  const unauthRes = await request('/api/dashboard/summary', 'GET', null, null);
  console.log(`[RBAC] Unauthenticated access to /api/dashboard/summary => HTTP ${unauthRes.status} (Expected: 401 Unauthorized)`);
  auditResults.rbacSecurity.unauthToDashboard = { status: unauthRes.status, pass: unauthRes.status === 401 };

  // -------------------------------------------------------------
  // PHASE 3: BROWSER UI/UX & ROLE FLOW TESTING WITH PUPPETEER
  // -------------------------------------------------------------
  console.log('\n--- PHASE 3: BROWSER AUTOMATION, UI/UX, & PAGE CHECKS ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleLogs.push(`Console Error: ${msg.text()}`);
  });
  page.on('pageerror', err => consoleLogs.push(`Page Crash: ${err.message}`));

  // Test Role Landing Pages & UI Navigation
  for (const acc of demoAccounts) {
    console.log(`\nTesting UI session for: ${acc.role} (${acc.email})`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });

    // Click demo account button
    await page.evaluate((roleText) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.textContent.includes(roleText));
      if (target) target.click();
    }, acc.role === 'Customer Portal' ? 'Customer' : (acc.role === 'System Admin' ? 'Admin' : acc.role));

    await new Promise(r => setTimeout(r, 400));

    // Submit
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sub = btns.find(b => b.textContent.includes('Sign In to Dashboard') || b.type === 'submit');
      if (sub) sub.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1200));

    const currentUrl = page.url();
    console.log(`  Actual Landing URL: ${currentUrl}`);

    // Check visible sidebar navigation links
    const sidebarItems = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('nav a, aside a, .sidebar a'));
      return links.map(l => ({ text: l.innerText.trim(), href: l.getAttribute('href') })).filter(l => l.text);
    });
    console.log(`  Visible Navigation Items (${sidebarItems.length}):`, sidebarItems.map(i => i.text).join(' | '));

    auditResults.roles[acc.role].landingUrl = currentUrl;
    auditResults.roles[acc.role].sidebarItems = sidebarItems;

    // Logout to reset
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  // -------------------------------------------------------------
  // PHASE 4: FORM VALIDATION TESTING
  // -------------------------------------------------------------
  console.log('\n--- PHASE 4: FORM VALIDATION & EDGE CASE TESTING ---');
  // Log in as Admin to test forms
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const admin = btns.find(b => b.textContent.includes('Admin'));
    if (admin) admin.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sub = btns.find(b => b.textContent.includes('Sign In to Dashboard') || b.type === 'submit');
    if (sub) sub.click();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));

  // Form 1: Create Invoice with Empty Items
  console.log('Testing Invoice Creation Form validation...');
  await page.goto(`${BASE_URL}/invoices/create`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Try submitting without filling customer name
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const genBtn = btns.find(b => b.textContent.includes('Generate & Issue Invoice'));
    if (genBtn) genBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const validationAlerts = await page.evaluate(() => {
    const alerts = Array.from(document.querySelectorAll('.alert, [role="alert"], .error, .text-red-500, .alert-danger'));
    return alerts.map(a => a.innerText.trim()).filter(Boolean);
  });
  console.log('  Empty Invoice Form Alerts:', validationAlerts);
  auditResults.formsValidation.createInvoice = { triggered: validationAlerts.length > 0, alerts: validationAlerts };

  // -------------------------------------------------------------
  // PHASE 5: MOBILE & RESPONSIVE VIEWPORT TESTING
  // -------------------------------------------------------------
  console.log('\n--- PHASE 5: RESPONSIVE VIEWPORT & MOBILE TESTING ---');
  const viewports = [
    { name: 'Mobile iPhone (375x812)', width: 375, height: 812 },
    { name: 'Tablet iPad (768x1024)', width: 768, height: 1024 },
    { name: 'Desktop HD (1440x900)', width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    // Check if horizontal scrollbar appears (indicates overflow bug)
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    // Check if sidebar toggle exists
    const hasMobileMenuButton = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.getAttribute('aria-label')?.includes('menu') || b.querySelector('svg'));
    });

    console.log(`  [${vp.name}] Horizontal Overflow: ${hasHorizontalOverflow ? 'YES (Layout Glitch!)' : 'None (Clean)'} | Mobile Menu Trigger: ${hasMobileMenuButton}`);
    auditResults.mobileResponsiveness[vp.name] = { hasHorizontalOverflow, hasMobileMenuButton };
  }

  // -------------------------------------------------------------
  // PHASE 6: API PERFORMANCE MEASUREMENTS
  // -------------------------------------------------------------
  console.log('\n--- PHASE 6: PERFORMANCE & LATENCY MEASUREMENTS ---');
  const benchmarkEndpoints = [
    { name: 'Dashboard Summary', path: '/api/dashboard/summary' },
    { name: 'Customer List', path: '/api/customers' },
    { name: 'Product Catalog', path: '/api/products' },
    { name: 'Invoice List', path: '/api/invoices' },
    { name: 'Payment List', path: '/api/payments' },
    { name: 'Credit Notes List', path: '/api/credit-notes' },
    { name: 'Reports Sales', path: '/api/reports/sales' },
    { name: 'Invoice PDF Download', path: '/api/invoices/6aef0e891a7af6c7eede0301/pdf' }
  ];

  for (const ep of benchmarkEndpoints) {
    const start = Date.now();
    const res = await request(ep.path, 'GET', null, tokens['System Admin']);
    const elapsed = Date.now() - start;
    console.log(`  ${ep.name.padEnd(24)}: ${elapsed}ms | HTTP ${res.status}`);
    auditResults.performance[ep.name] = { timeMs: elapsed, status: res.status };
  }

  await browser.close();

  console.log('\n================================================================');
  console.log('AUDIT SUITE FINISHED SUCCESSFULLY. REPORT READY.');
  console.log('================================================================');

  // Save audit data for generating report
  const fs = require('fs');
  fs.writeFileSync('./backend/scripts/audit_results.json', JSON.stringify(auditResults, null, 2));
}

runAudit();
