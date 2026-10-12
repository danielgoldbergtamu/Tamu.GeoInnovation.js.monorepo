// node probe-app.js <base url> <path> [<path>...]: load each page in a fresh tab, print its heading, text length and errors.
const { chromium } = require('@playwright/test');

(async () => {
  const [base, ...paths] = process.argv.slice(2);
  const browser = await chromium.launch();
  for (const p of paths) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
    let line;
    try {
      await page.goto(base + p, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(4000);
      const r = await Promise.race([
        page.evaluate(() => ({
          path: location.pathname,
          len: document.body.innerText.length,
          h: (document.querySelector('h1,h2') || {}).innerText || ''
        })),
        new Promise((res) => setTimeout(() => res({ hung: true }), 15000))
      ]);
      line = r.hung ? 'HUNG (page thread busy for 15 s)' : `${r.path} | ${r.len} chars | ${r.h.slice(0, 50).replace(/\n/g, ' ')}`;
    } catch (e) {
      line = 'FAILED ' + String(e).slice(0, 150);
    }
    const ng = errors.filter((e) => /NG0|NullInjector|No provider|is not a function|Cannot read/.test(e));
    console.log(`${p || '/'} -> ${line}${ng.length ? '\n     ' + [...new Set(ng)].slice(0, 4).join('\n     ') : ''} (${errors.length} console errors)`);
    await page.close().catch(() => {});
  }
  await browser.close();
})();
