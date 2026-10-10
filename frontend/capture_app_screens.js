import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\vansh\\.gemini\\antigravity-ide\\brain\\26ce746a-d26a-48eb-8924-48506fba235d';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  console.log('Navigating to /login...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

  // Type credentials
  const emailInput = await page.$('input[type="email"]');
  const passwordInput = await page.$('input[type="password"]');
  await emailInput.click({ clickCount: 3 });
  await emailInput.type('rohan.sharma@logistics.in');
  await passwordInput.click({ clickCount: 3 });
  await passwordInput.type('Password123!');

  console.log('Clicking Sign In...');
  const submitBtn = await page.$('button[type="submit"]');
  await submitBtn.click();

  // Wait for navigation
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  console.log('Logged in! Current URL:', page.url());

  // Wait for map tiles and telemetry to render
  console.log('Waiting for map tiles to render...');
  await new Promise((r) => setTimeout(r, 4000));

  // Control Tower
  const controlTowerPath = path.join(ARTIFACT_DIR, 'control_tower_redesign.png');
  await page.screenshot({ path: controlTowerPath });
  console.log('Saved Control Tower:', controlTowerPath);

  // Shipments Page
  console.log('Navigating to /shipments...');
  await page.goto('http://localhost:5173/shipments', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2500));
  const shipmentsPath = path.join(ARTIFACT_DIR, 'shipments_telemetry_redesign.png');
  await page.screenshot({ path: shipmentsPath });
  console.log('Saved Shipments:', shipmentsPath);

  // Risk Radar Page
  console.log('Navigating to /radar...');
  await page.goto('http://localhost:5173/radar', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2500));
  const radarPath = path.join(ARTIFACT_DIR, 'risk_radar_redesign.png');
  await page.screenshot({ path: radarPath });
  console.log('Saved Radar:', radarPath);

  await browser.close();
  console.log('All dashboard screens captured successfully!');
}

capture().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
