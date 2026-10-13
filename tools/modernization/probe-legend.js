// node probe-legend.js <url> <out dir> [name]: open a map, wait for its legend, and for each legend entry print the
// label, the swatch's kind and size, and (for the first matching [name]) its markup; saves a picture of the legend.
const { chromium } = require('@playwright/test');

(async () => {
  const [url, out, name] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, timezoneId: 'America/Chicago' });
  // PORTAL_DELAY_MS holds back every portal item's symbology, so the legend is drawn before it arrives (#1721).
  const delay = Number(process.env.PORTAL_DELAY_MS || 0);
  if (delay) {
    await page.route('**/sharing/rest/content/items/*/data*', async (route) => {
      await new Promise((r) => setTimeout(r, delay));
      await route.continue();
    });
  }
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.locator('tamu-gisc-legend-element .legend-info').first().waitFor({ timeout: 180000 });
  await page.waitForTimeout(25000 + delay);
  const rows = await page.evaluate((want) => {
    const result = [];
    for (const info of document.querySelectorAll('tamu-gisc-legend-element .legend-info')) {
      if (info.querySelector('tamu-gisc-legend-element')) continue;
      const label = (info.querySelector('.label, .group-title')?.textContent || '').trim();
      const box = info.querySelector('.image-container');
      const inner = box?.querySelector('svg, img, canvas') || box;
      const r = inner?.getBoundingClientRect();
      const row = { label, kind: inner?.tagName?.toLowerCase(), w: Math.round(r?.width || 0), h: Math.round(r?.height || 0) };
      if (want && label === want) row.html = (box?.outerHTML || '').replace(/data:image[^"']+/g, 'data:…').slice(0, 1800);
      result.push(row);
    }
    return result;
  }, name);
  for (const r of rows) console.log(JSON.stringify(r));
  const probe = await page.evaluate(() => {
    const p = window.__tamuGiscMapProbe;
    try { return p && p.snapshot().layers.map((l) => `${l.title}: ${l.symbology || l.symbologySource || '?'} ${l.rendererType || ''}`); } catch (e) { return String(e); }
  });
  console.log('probe:', JSON.stringify(probe));
  const legend = page.locator('tamu-gisc-legend').first();
  if (await legend.count()) await legend.screenshot({ path: `${out}/${process.env.SHOT || 'legend'}.png` }).catch((e) => console.log('shot failed', e.message));
  await browser.close();
})();
