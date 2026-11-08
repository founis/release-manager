// Checks that looping animations actually move (ticker, review wall, hero background)
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('file://' + encodeURI(path.resolve(process.argv[2])), { waitUntil: 'networkidle' }); await p.mouse.move(700, 600);
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const snap = () => p.evaluate(() => ['.tk-track', '.wall-track', '.hero-bg'].map(sel => { const e = document.querySelector(sel); return e ? getComputedStyle(e).transform : 'missing'; }));
  const a = await snap(); await p.waitForTimeout(1500); const c = await snap();
  ['ticker', 'review wall', 'hero background'].forEach((n, i) => ok(a[i] !== 'missing' && a[i] !== c[i], `${n} is moving`));
  await b.close();
})();
