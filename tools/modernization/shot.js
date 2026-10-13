// node shot.js <url> <output.png> [wait selector] [settle ms] [click text]: one 1600x900 screenshot, after the selector
// appears and the page has had time to draw. With a fifth argument, clicks the element with that exact text first.
const { chromium } = require('@playwright/test');

(async () => {
  const [url, out, selector, settle, click] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, timezoneId: 'America/Chicago' });
  // SAVED_BASEMAP stands in for a visitor who chose that basemap in the gallery on an earlier visit.
  if (process.env.SAVED_BASEMAP) {
    await page.addInitScript((id) => localStorage.setItem('user-preferences', JSON.stringify({ settings: { basemap: id } })), process.env.SAVED_BASEMAP);
  }
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });
  if (selector) await page.locator(selector).first().waitFor({ timeout: 180000 });
  if (click) {
    await page.getByText(click, { exact: true }).first().click();
  }
  await page.waitForTimeout(Number(settle || 20000));
  await page.screenshot({ path: out });
  console.log('saved', out, '| gallery:', JSON.stringify(await page.locator('.basemap-title').allTextContents()),
    '| active:', JSON.stringify(await page.locator('.basemap.active .basemap-title').allTextContents()));
  await browser.close();
})();
