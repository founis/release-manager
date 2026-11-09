// apply a CSS file to live pages and measure header height, article title visibility, sticky vs dock, overflow
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const [css, out, ...urls] = process.argv.slice(2); const b = await chromium.launch(); const CSS = css === '-' ? '' : fs.readFileSync(css, 'utf8');
  for (const [w, mob] of [[390, true], [1366, false]]) for (let i = 0; i < urls.length; i++) {
    const c = await b.newContext(mob ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1366, height: 900 } });
    await c.route('**/*', (r) => /google-analytics|googleadservices|doubleclick|clarity|facebook|google\.[a-z.]+\/(pagead|ccm)|userway|clixtell/.test(r.request().url()) ? r.fulfill({ status: 204, body: '' }) : r.continue());
    const p = await c.newPage(); await p.goto(urls[i], { waitUntil: 'load', timeout: 60000 }); await p.mouse.move(100, 100); await p.waitForTimeout(1200);
    const ck = p.locator('#cg-pgck button:has-text("הבנתי")'); if (await ck.count()) await ck.first().click().catch(() => {});
    if (CSS) await p.addStyleTag({ content: CSS }); await p.waitForTimeout(400); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
    const m = await p.evaluate(() => { const hd = document.querySelector('[data-elementor-type="header"] .cgh'); const t = document.querySelector('.cga .cgh-title'); const hero = document.querySelector('.cga.cgh');
      let titleVis = null; if (t && hero) { const a = t.getBoundingClientRect(), h = hero.getBoundingClientRect(); titleVis = a.bottom <= h.bottom + 1 && a.top >= h.top - 1 && a.height > 20; }
      const s = document.querySelector('.cg-sticky-lead, .cg-sticky'), d = document.querySelector('.cg-pgdock'); let ov = null; if (s && d && getComputedStyle(s).display !== 'none' && getComputedStyle(d).display !== 'none') { const a = s.getBoundingClientRect(), z = d.getBoundingClientRect(); ov = a.bottom > z.top; }
      return `header ${hd ? Math.round(hd.getBoundingClientRect().height) : '-'}px | article title fully visible: ${titleVis} | hero ${hero ? Math.round(hero.getBoundingClientRect().height) : '-'}px | sticky over dock: ${ov} | sideways scroll: ${document.documentElement.scrollWidth - innerWidth}px`; });
    console.log(`${w} ${decodeURI(urls[i]).replace('https://cyberguard.co.il/', '').slice(0, 34).padEnd(34)} ${m}`);
    if (out !== '-') await p.screenshot({ path: `${out}-${w}-${i}.png` });
    await c.close();
  }
  await b.close(); })();
