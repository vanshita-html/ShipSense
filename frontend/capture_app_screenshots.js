import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_SCREENSHOTS_DIR = path.resolve(__dirname, '..', 'docs', 'screenshots');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function captureAll() {
  if (!fs.existsSync(DOCS_SCREENSHOTS_DIR)) {
    fs.mkdirSync(DOCS_SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-device-scale-factor=1'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  // 1. Capture Login
  console.log('1. Capturing Login Page...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(DOCS_SCREENSHOTS_DIR, 'login.png') });

  // Sign in or Create Account to access dashboard
  console.log('Authenticating...');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text && text.includes('Create Account')) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 400));

  const inputs = await page.$$('input');
  if (inputs.length >= 4) {
    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type('Vanshita Shivankar');
    await inputs[1].click({ clickCount: 3 });
    await inputs[1].type('Apex Logistics');
    await inputs[2].click({ clickCount: 3 });
    await inputs[2].type('vanshita.ops@shipsense.ai');
    await inputs[3].click({ clickCount: 3 });
    await inputs[3].type('Password123!');
    if (inputs.length >= 5) {
      await inputs[4].click({ clickCount: 3 });
      await inputs[4].type('Password123!');
    }
  }

  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) await submitBtn.click();
  await new Promise((r) => setTimeout(r, 2000));

  // If still on /login, try Sign In
  if (page.url().includes('/login')) {
    const btns = await page.$$('button');
    for (const btn of btns) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes('Sign In') && !text.includes('Sign in to')) {
        await btn.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 400));
    const loginInputs = await page.$$('input');
    if (loginInputs.length >= 2) {
      await loginInputs[0].click({ clickCount: 3 });
      await loginInputs[0].type('vanshita.ops@shipsense.ai');
      await loginInputs[1].click({ clickCount: 3 });
      await loginInputs[1].type('Password123!');
    }
    const loginSubmit = await page.$('button[type="submit"]');
    if (loginSubmit) await loginSubmit.click();
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log('Authenticated! Current page:', page.url());

  // 2. Control Tower
  console.log('2. Capturing Control Tower...');
  await page.goto('http://localhost:5173/control-tower', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(DOCS_SCREENSHOTS_DIR, 'control_tower.png') });

  // 3. Shipments Explorer
  console.log('3. Capturing Shipments Explorer...');
  await page.goto('http://localhost:5173/shipments', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(DOCS_SCREENSHOTS_DIR, 'shipments.png') });

  // 4. Risk Radar
  console.log('4. Capturing Risk Radar...');
  await page.goto('http://localhost:5173/radar', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(DOCS_SCREENSHOTS_DIR, 'risk_radar.png') });

  // 5. Action Board
  console.log('5. Capturing Action Board...');
  await page.goto('http://localhost:5173/actions', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(DOCS_SCREENSHOTS_DIR, 'action_board.png') });

  // 6. Decision Ledger
  console.log('6. Capturing Decision Ledger...');
  await page.goto('http://localhost:5173/decisions', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(DOCS_SCREENSHOTS_DIR, 'decision_ledger.png') });

  // 7. What-If Sandbox
  console.log('7. Capturing What-If Sandbox...');
  await page.goto('http://localhost:5173/what-if', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(DOCS_SCREENSHOTS_DIR, 'what_if.png') });

  // 8. Model Monitor
  console.log('8. Capturing Model Monitor...');
  await page.goto('http://localhost:5173/monitor', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(DOCS_SCREENSHOTS_DIR, 'model_monitor.png') });

  await browser.close();
  console.log('All 8 documentation screenshots saved into docs/screenshots/ successfully!');
}

captureAll().catch((err) => {
  console.error('Error generating screenshots:', err);
  process.exit(1);
});
