// slow real scroll on a phone, screenshot each screen; reports how much of each screen is blank
const { chromium } = require('playwright');
(async () => { const [url, out, n] = process.argv.slice(2); const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await c.route('**/*', (r) => /google-analytics|googleadservices|doubleclick|clarity|facebook|google\.[a-z.]+\/(pagead|ccm)|userway|clixtell/.test(r.request().url()) ? r.fulfill({ status: 204, body: '' }) : r.continue());
  const p = await c.newPage(); await p.goto(url, { waitUntil: 'load', timeout: 60000 });
  await p.touchscreen.tap(380, 400).catch(() => {}); await p.waitForTimeout(800);
  const ck = p.locator('#cg-pgck button:has-text("הבנתי")'); if (await ck.count()) await ck.first().click().catch(() => {});
  const H = await p.evaluate(() => document.documentElement.scrollHeight); const res = [];
  for (let k = 0, y = 0; y < H && k < Number(n || 40); k++, y += 760) {
    await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'smooth' }), y); await p.waitForTimeout(1100);
    await p.screenshot({ path: `${out}-${String(k).padStart(2, '0')}.png` });
    const blank = await p.evaluate(() => { let filled = 0, total = 0; for (let yy = 100; yy < innerHeight - 90; yy += 30) for (let xx = 20; xx < innerWidth - 20; xx += 30) { total++; const el = document.elementFromPoint(xx, yy); if (!el) continue; const t = el.closest('p,h1,h2,h3,h4,li,img,a,button,input,svg,video,iframe,span,figure,label,td'); if (t && t.getBoundingClientRect().height < 900) filled++; } return Math.round(100 - filled * 100 / total); });
    res.push(blank);
  }
  console.log('screens', res.length, 'blank% per screen:', res.join(' ')); await b.close(); })();
