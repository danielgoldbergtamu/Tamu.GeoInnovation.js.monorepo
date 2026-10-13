// node probe-perspective.js <url> <out dir> <label>: load a map, switch 2D -> 3D -> 2D, and at each step print where
// the view is looking (the map probe's framing), the view's own scale, and how long the map area stayed blank.
const { chromium } = require('@playwright/test');
const { PNG } = require('pngjs');

const TOGGLE = 'tamu-gisc-perspective-toggle';
const SURFACE = '#map-container, .esri-view, tamu-gisc-esri-map, .map-container';

function whiteShare(buffer) {
  const png = PNG.sync.read(buffer);
  let white = 0;
  const total = png.width * png.height;
  for (let i = 0; i < png.data.length; i += 4) {
    if (png.data[i] > 245 && png.data[i + 1] > 245 && png.data[i + 2] > 245) white++;
  }
  return white / total;
}

(async () => {
  const [url, out, label] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, timezoneId: 'America/Chicago' });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });

  const state = () =>
    page.evaluate(() => {
      const p = window.__tamuGiscMapProbe;
      const f = p && p.framing;
      return { ready: p && p.ready, drawing: p && p.drawing, zoom: f && Number(f.zoom.toFixed(2)), center: f && f.center.map((n) => Number(n.toFixed(5))) };
    });

  // The map area only: everything left of the sidebar.
  const clip = { x: 60, y: 60, width: 1000, height: 780 };
  const blankShare = async () => whiteShare(await page.screenshot({ clip }));

  const settle = async (name) => {
    const started = Date.now();
    let drawnAt = null;
    let last = null;
    let steady = 0;
    while (Date.now() - started < 90000) {
      const share = await blankShare();
      if (share < 0.65 && drawnAt === null) drawnAt = Date.now() - started;
      const now = JSON.stringify(await state());
      steady = now === last && share < 0.65 ? steady + 1 : 0;
      last = now;
      if (steady >= 6) break;
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: `${out}/${label}-${name}.png` });
    console.log(`${label} | ${name} | drawn after ${drawnAt === null ? 'NEVER (90 s)' : (drawnAt / 1000).toFixed(1) + ' s'} | settled after ${((Date.now() - started) / 1000).toFixed(1)} s | ${last}`);
  };

  await page.waitForFunction(() => window.__tamuGiscMapProbe && window.__tamuGiscMapProbe.ready, null, { timeout: 150000 });
  await settle('1-loaded-2d');

  await page.locator(TOGGLE).first().click();
  await settle('2-switched-to-3d');

  await page.locator(TOGGLE).first().click();
  await settle('3-back-to-2d');

  await browser.close();
})();
