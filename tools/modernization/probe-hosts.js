// node probe-hosts.js <url>: load a map and print, per host, how many requests were made and how many failed,
// then the failed ones, and the layers the map probe reports as errored.
const { chromium } = require('@playwright/test');

(async () => {
  const [url] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const hosts = {};
  const failed = [];
  const note = (u, ok, why) => {
    const h = new URL(u).hostname;
    hosts[h] = hosts[h] || { ok: 0, bad: 0 };
    hosts[h][ok ? 'ok' : 'bad']++;
    if (!ok) failed.push(`${why} ${u.slice(0, 150)}`);
  };
  page.on('response', (r) => { if (/arcgis|portal|gis/.test(r.url())) note(r.url(), r.status() < 400, r.status()); });
  page.on('requestfailed', (r) => { if (/arcgis|portal|gis/.test(r.url())) note(r.url(), false, r.failure()?.errorText || 'failed'); });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForFunction(() => window.__tamuGiscMapProbe && window.__tamuGiscMapProbe.ready, null, { timeout: 150000 }).catch(() => console.log('never ready'));
  await page.waitForTimeout(8000);
  console.log('hosts:', JSON.stringify(hosts));
  for (const f of [...new Set(failed)].slice(0, 14)) console.log('  failed:', f);
  const layers = await page.evaluate(async () => {
    const s = await window.__tamuGiscMapProbe.snapshot();
    return s.layers.filter((l) => l.error || !l.loaded).map((l) => `${l.title}: ${l.error}`);
  }).catch((e) => ['snapshot failed: ' + e.message]);
  console.log('errored layers:', JSON.stringify(layers).slice(0, 900));
  console.log('acting:', await page.evaluate(() => sessionStorage.getItem('tamu-gisc-acting-as')), '| struck:', JSON.stringify(await page.locator('.layer-list-item.error, .error, [class*=fail]').allTextContents()).slice(0, 300));
  await browser.close();
})();
