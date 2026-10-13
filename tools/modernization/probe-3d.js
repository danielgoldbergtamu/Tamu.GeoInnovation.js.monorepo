// node probe-3d.js <base url> <out dir> <label> [basemap title to choose in 3D]: open the main map's basemap panel,
// switch to 3D, optionally choose a basemap, and print the scene's state, the 3D layer's state and console errors.
const { chromium } = require('@playwright/test');

(async () => {
  const [base, out, label, choose] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  let step = 'load';
  page.on('console', async (m) => {
    if (m.type() !== 'error' && !/\[esri/.test(m.text())) return;
    let detail = m.text();
    if (/^ERROR/.test(detail)) {
      const parts = await Promise.all(m.args().map((arg) => arg.evaluate((v) => (v && (v.stack || v.message || (v.details && JSON.stringify(v.details)))) || String(v)).catch(() => '?')));
      detail = parts.join(' | ');
    }
    errors.push(`[${step}] ` + detail.slice(0, 420));
  });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + String(e).slice(0, 240)));
  await page.goto(base + '/map/d/settings', { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForFunction(() => window.__tamuGiscMapProbe && window.__tamuGiscMapProbe.ready, null, { timeout: 150000 });
  await page.waitForTimeout(6000);

  const report = async (name) => {
    step = name;
    const state = await page.evaluate(async () => {
      const p = window.__tamuGiscMapProbe;
      const s = await p.snapshot();
      const b = s.layers.find((l) => /3D Buildings/.test(l.title));
      return { viewSR: s.spatialReference, framing: p.framing, buildings: b ? { loaded: b.loaded, error: b.error, sr: b.spatialReference, drawable: b.drawable } : null, failed: s.layers.filter((l) => l.error).length };
    }).catch((e) => ({ snapshotError: String(e).slice(0, 200) }));
    await page.screenshot({ path: `${out}/${label}-${name}.png` });
    console.log(`${label} | ${name} | toggle=${await page.locator('tamu-gisc-perspective-toggle').first().innerText()} | active basemap=${JSON.stringify(await page.locator('.basemap.active .basemap-title').allTextContents())} | ${JSON.stringify(state)}`);
  };

  await report('1-2d');
  await page.locator('tamu-gisc-perspective-toggle').first().click();
  await page.waitForTimeout(Number(process.env.WAIT_3D_MS || 25000));
  await report('2-3d');
  if (choose) {
    await page.getByText(choose, { exact: true }).first().click();
    await page.waitForTimeout(25000);
    await report('3-3d-after-choosing');
    await page.locator('tamu-gisc-perspective-toggle').first().click();
    await page.waitForTimeout(20000);
    await report('4-back-to-2d');
  }
  console.log('errors:', JSON.stringify([...new Set(errors)].slice(0, 8)));
  await browser.close();
})();
