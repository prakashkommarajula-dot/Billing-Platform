const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(__dirname, '../../documentation/screenshots');
const baseUrl = 'https://billflow-billing-platform.onrender.com';

(async () => {
  console.log('Launching headless Chrome from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,920'],
    defaultViewport: { width: 1440, height: 920, deviceScaleFactor: 1.5 },
  });

  const page = await browser.newPage();

  try {
    // 1. Capture Login Page
    console.log('[1/7] Capturing Login Page...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig01_login.png') });
    console.log('✓ fig01_login.png');

    // 2. Capture Registration Page (Role Selection Wizard)
    console.log('[2/7] Capturing Register Wizard...');
    await page.goto(`${baseUrl}/register`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig17_register_roles.png') });
    console.log('✓ fig17_register_roles.png');

    // 3. Login as Business Owner
    console.log('[3/7] Logging in as Business Owner & Capturing Dashboard...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate((el) => el.innerText, b);
      if (text && text.includes('Business Owner')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));

    const submitBtns = await page.$$('button');
    for (const b of submitBtns) {
      const text = await page.evaluate((el) => el.innerText, b);
      if (text && text.includes('Sign In to Dashboard')) {
        await b.click();
        break;
      }
    }
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 25000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig02_dashboard.png') });
    console.log('✓ fig02_dashboard.png');

    // 4. Capture Create Invoice
    console.log('[4/7] Capturing Create Invoice...');
    await page.goto(`${baseUrl}/invoices/create`, { waitUntil: 'networkidle2', timeout: 25000 });
    await new Promise((r) => setTimeout(r, 1800));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig05_create_invoice.png') });
    console.log('✓ fig05_create_invoice.png');

    // 5. Capture Reports & Analytics
    console.log('[5/7] Capturing Reports...');
    await page.goto(`${baseUrl}/reports`, { waitUntil: 'networkidle2', timeout: 25000 });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig19_reports_gst.png') });
    console.log('✓ fig19_reports_gst.png');

    // 6. Capture Customer Portal
    console.log('[6/7] Capturing Customer Portal...');
    await page.goto(`${baseUrl}/portal`, { waitUntil: 'networkidle2', timeout: 25000 });
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig18_customer_portal.png') });
    console.log('✓ fig18_customer_portal.png');

    // 7. Capture Admin Users (Switch to Admin)
    console.log('[7/7] Capturing Admin Users...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    const adminBtns = await page.$$('button');
    for (const b of adminBtns) {
      const text = await page.evaluate((el) => el.innerText, b);
      if (text && text.includes('Admin') && !text.includes('Business')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));
    const submitBtns2 = await page.$$('button');
    for (const b of submitBtns2) {
      const text = await page.evaluate((el) => el.innerText, b);
      if (text && text.includes('Sign In to Dashboard')) {
        await b.click();
        break;
      }
    }
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 25000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig20_user_management.png') });
    console.log('✓ fig20_user_management.png');

  } catch (err) {
    console.error('Capture warning:', err.message);
  } finally {
    await browser.close();
    console.log('Browser closed. Live screenshots ready.');
  }
})();
