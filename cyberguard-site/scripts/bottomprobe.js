const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const [list, out] = process.argv.slice(2); const urls = fs.readFileSync(list, 'utf8').split('\n').filter(Boolean); const b = await chromium.launch(); const rows = [];
  for (const i of process.argv.slice(5).map(Number)) {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await c.route('**/*', (r) => /google-analytics|googleadservices|doubleclick|clarity|facebook|google\.[a-z.]+\/(pagead|ccm)|userway|clixtell/.test(r.request().url()) ? r.fulfill({ status: 204, body: '' }) : r.continue());
    const p = await c.newPage(); await p.goto(urls[i], { waitUntil: 'load', timeout: 60000 }); await p.touchscreen.tap(200, 300).catch(() => {}); await p.waitForTimeout(700);
    const ck = p.locator('#cg-pgck button:has-text("הבנתי")'); if (await ck.count()) await ck.first().click().catch(() => {});
    await p.evaluate(() => window.scrollTo(0, 1600)); await p.waitForTimeout(1200);
    const info = await p.evaluate(() => { const pts = [[60, 820], [195, 820], [330, 820], [195, 790]]; return pts.map(([x, y]) => { const el = document.elementFromPoint(x, y); if (!el) return '-'; const a = el.closest('a,button'); return (a ? (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 26) + ' [' + (a.closest('[class*=pgdock]') ? 'site dock' : (a.className || '').toString().slice(0, 30)) + ']' : el.tagName + '.' + String(el.className).slice(0, 20)); }); });
    rows.push(i + ' ' + info.join(' | '));
    await p.screenshot({ path: `${out}-${i}.png`, clip: { x: 0, y: 644, width: 390, height: 200 } }); await c.close();
  }
  console.log(rows.join('\n')); await b.close(); })();
