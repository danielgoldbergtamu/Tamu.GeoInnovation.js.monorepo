// node probe-paint.js <base url> <path>...: for each map, time successive screenshots of the map surface the way
// waitForPaint does, and count animation frames, so a slow screenshot can be told from a canvas that changes.
const { chromium } = require('@playwright/test');

(async () => {
  const [base, ...paths] = process.argv.slice(2);
  const browser = await chromium.launch();
  for (const p of paths) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const t0 = Date.now();
    await page.goto(base + p, { waitUntil: 'domcontentloaded' });
    await page.locator('.esri-view-surface').first().waitFor({ timeout: 120000 }).catch(() => {});
    const surfaceAt = Date.now() - t0;
    const shots = [];
    while (Date.now() - t0 < 100000 && shots.length < 12) {
      const s = Date.now();
      let ok = true;
      try {
        await page.locator('.esri-view-surface').first().screenshot({ type: 'png' });
      } catch (e) {
        ok = false;
      }
      shots.push(`${((s - t0) / 1000).toFixed(0)}s:${ok ? '' : 'ERR '}${Date.now() - s}ms`);
      await page.waitForTimeout(2000);
    }
    const frames = await page.evaluate(
      () => new Promise((r) => { let n = 0; const end = performance.now() + 5000; const f = () => { n++; performance.now() < end ? requestAnimationFrame(f) : r(n); }; requestAnimationFrame(f); })
    );
    console.log(`${p} | surface at ${(surfaceAt / 1000).toFixed(1)}s | frames in 5s: ${frames} | screenshots (start:duration) ${shots.join(' ')}`);
    await page.close();
  }
  await browser.close();
})();
