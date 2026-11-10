const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://billflow-billing-platform.onrender.com';

async function runE2ETest() {
  console.log(`[E2E] Starting comprehensive UI & Page health check on ${BASE_URL}...`);
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      errors.push(`Console Error: ${text}`);
      console.log(`  [CONSOLE ERROR] ${text}`);
    } else if (type === 'warn') {
      warnings.push(`Console Warn: ${text}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`Page Error: ${err.message}`);
    console.log(`  [PAGE CRASH/ERROR] ${err.message}`);
  });

  page.on('requestfailed', req => {
    // Ignore aborted or extension requests
    if (req.url().includes('chrome-extension')) return;
    errors.push(`Failed Request: ${req.method()} ${req.url()} (${req.failure() ? req.failure().errorText : 'failed'})`);
    console.log(`  [REQUEST FAILED] ${req.method()} ${req.url()}`);
  });

  page.on('response', res => {
    if (res.status() >= 400) {
      errors.push(`HTTP ${res.status()} on ${res.url()}`);
      console.log(`  [HTTP ${res.status()}] ${res.url()}`);
    }
  });

  try {
    // 1. Visit Login
    console.log('\n--- Testing Login Page ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Check if demo buttons exist and click Admin demo button
    const adminDemoBtn = await page.$('button[type="button"]');
    console.log('Finding demo buttons...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const adminBtn = btns.find(b => b.textContent.includes('Admin'));
      if (adminBtn) adminBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 600));

    // Click Sign In
    console.log('Submitting login form...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const submitBtn = btns.find(b => b.textContent.includes('Sign In to Dashboard') || b.type === 'submit');
      if (submitBtn) submitBtn.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    console.log('Current URL after login:', page.url());

    // Pages to test
    const pagesToTest = [
      { name: 'Dashboard', url: `${BASE_URL}/dashboard` },
      { name: 'Customer Directory', url: `${BASE_URL}/customers` },
      { name: 'Customer Details', url: `${BASE_URL}/customers/details` },
      { name: 'Product Catalog', url: `${BASE_URL}/products` },
      { name: 'Invoice Directory', url: `${BASE_URL}/invoices` },
      { name: 'Create Invoice', url: `${BASE_URL}/invoices/create` },
      { name: 'Invoice Details', url: `${BASE_URL}/invoices/details` },
      { name: 'Payment Records', url: `${BASE_URL}/payments` },
      { name: 'Credit Notes', url: `${BASE_URL}/credit-notes` },
      { name: 'Reports & Analytics', url: `${BASE_URL}/reports` },
      { name: 'Customer Portal', url: `${BASE_URL}/portal` },
      { name: 'User Management', url: `${BASE_URL}/users` },
      { name: 'Business Settings', url: `${BASE_URL}/settings` },
      { name: 'User Profile', url: `${BASE_URL}/profile` }
    ];

    for (const p of pagesToTest) {
      console.log(`\n--- Navigating to ${p.name} (${p.url}) ---`);
      await page.goto(p.url, { waitUntil: 'networkidle0', timeout: 20000 }).catch(err => {
        errors.push(`Navigation timeout to ${p.name}: ${err.message}`);
      });
      await new Promise(r => setTimeout(r, 1000));
      
      // Check for any visible error alerts on the page
      const visibleErrors = await page.evaluate(() => {
        const alertElements = document.querySelectorAll('.alert-danger, [role="alert"], .error-message');
        return Array.from(alertElements).map(el => el.innerText.trim()).filter(Boolean);
      });

      if (visibleErrors.length > 0) {
        console.log(`  [UI ERROR ALERT on ${p.name}]:`, visibleErrors);
        errors.push(`UI Alert on ${p.name}: ${visibleErrors.join('; ')}`);
      } else {
        console.log(`  ✓ ${p.name} loaded cleanly with no UI error alerts.`);
      }
    }

    console.log('\n==========================================');
    console.log(`E2E Check Finished.`);
    console.log(`Total Errors Detected: ${errors.length}`);
    console.log(`Total Warnings: ${warnings.length}`);
    if (errors.length > 0) {
      console.log('Errors List:');
      errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }
    console.log('==========================================');

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    await browser.close();
  }
}

runE2ETest();
