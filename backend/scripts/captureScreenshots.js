const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(__dirname, '../../documentation/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('[Puppeteer] Launching Chrome from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
    defaultViewport: { width: 1400, height: 900, deviceScaleFactor: 1.5 },
  });

  const page = await browser.newPage();
  const baseUrl = 'https://billflow-billing-platform.onrender.com';

  console.log('[1/8] Capturing Login Page...');
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig01_login.png') });
  console.log('✓ Captured fig01_login.png');

  console.log('[2/8] Logging in as Business Owner & Capturing Dashboard...');
  // Click Business Owner demo testing button
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate((el) => el.innerText, b);
    if (text && text.includes('Business Owner')) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));

  // Click Sign In button
  for (const b of await page.$$('button')) {
    const text = await page.evaluate((el) => el.innerText, b);
    if (text && text.includes('Sign In to Dashboard')) {
      await b.click();
      break;
    }
  }

  // Wait for Dashboard to load
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig02_dashboard.png') });
  console.log('✓ Captured fig02_dashboard.png');

  console.log('[3/8] Capturing Customers Page...');
  await page.goto(`${baseUrl}/customers`, { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig03_customers.png') });
  console.log('✓ Captured fig03_customers.png');

  console.log('[4/8] Capturing Customer Details & Ledger Page...');
  await page.goto(`${baseUrl}/customers/details`, { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig03b_customer_details.png') });
  console.log('✓ Captured fig03b_customer_details.png');

  console.log('[5/8] Capturing Products & Services Page...');
  await page.goto(`${baseUrl}/products`, { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig04_products.png') });
  console.log('✓ Captured fig04_products.png');

  console.log('[6/8] Capturing Invoice Creation Page...');
  await page.goto(`${baseUrl}/invoices/create`, { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig05_create_invoice.png') });
  console.log('✓ Captured fig05_create_invoice.png');

  console.log('[7/8] Capturing Invoice Details & PDF Preview...');
  await page.goto(`${baseUrl}/invoices/details`, { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig06_invoice_details.png') });
  console.log('✓ Captured fig06_invoice_details.png');

  console.log('[8/8] Capturing GitHub Repository Page...');
  try {
    await page.goto('https://github.com/prakashkommarajula-dot/Billing-Platform', { waitUntil: 'networkidle2', timeout: 25000 });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig13_github_repo.png') });
    console.log('✓ Captured fig13_github_repo.png');
  } catch (ghErr) {
    console.warn('GitHub capture warning:', ghErr.message);
  }

  await browser.close();
  console.log('[Puppeteer] All application screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('[Puppeteer] Error during screenshot capture:', err);
  process.exit(1);
});
