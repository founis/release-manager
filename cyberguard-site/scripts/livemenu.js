const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); } };
  const pages = [['site header (TikTok page)', 'https://cyberguard.co.il/%D7%A9%D7%97%D7%A8%D7%95%D7%A8-%D7%97%D7%A9%D7%91%D7%95%D7%9F-%D7%98%D7%99%D7%A7%D7%98%D7%95%D7%A7/', 'old'], ['site header (article)', 'https://cyberguard.co.il/%D7%A9%D7%97%D7%A8%D7%95%D7%A8-%D7%97%D7%A9%D7%91%D7%95%D7%9F-%D7%98%D7%9C%D7%92%D7%A8%D7%9D-%D7%97%D7%A1%D7%95%D7%9D-banned/', 'old'], ['homepage', 'https://cyberguard.co.il/', 'new'], ['LinkedIn page', 'https://cyberguard.co.il/%D7%A9%D7%97%D7%96%D7%95%D7%A8-%D7%97%D7%A9%D7%91%D7%95%D7%9F-%D7%9C%D7%99%D7%A0%D7%A7%D7%93%D7%90%D7%99%D7%9F/', 'new']];
  for (const [name, url, kind] of pages) {
    for (const [w, mob] of [[1366, false], [390, true]]) {
      const c = await b.newContext(mob ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: w, height: 900 } });
      await c.route('**/*', (r) => /google-analytics|googleadservices|doubleclick|clarity|facebook|google\.[a-z.]+\/(pagead|ccm)|userway|clixtell/.test(r.request().url()) ? r.fulfill({ status: 204, body: '' }) : r.continue());
      const p = await c.newPage(); await p.goto(url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now(), { waitUntil: 'load', timeout: 60000 }); await p.mouse.move(40, 400); await p.waitForTimeout(1200);
      const ck = p.locator('#cg-pgck button:has-text("הבנתי")'); if (await ck.count()) await ck.first().click().catch(() => {});
      if (kind === 'old') {
        if (!mob) { await p.hover('.cgh .cgh-has > a'); await p.waitForTimeout(500);
          const r = await p.evaluate(() => { const box = document.querySelector('.cgh .cgh-mega-box').getBoundingClientRect(); return { n: document.querySelectorAll('.cgh .cgh-svc3 a').length, l: box.left, r: box.right, vw: innerWidth, tg: !!document.querySelector('.cgh .cgh-svc3 a[href*="%D7%98%D7%9C%D7%92%D7%A8%D7%9D"]') }; });
          ok(r.n === 23 && r.l >= 0 && r.r <= r.vw && r.tg, `${name} desktop: 23 links incl. Telegram, on screen (${Math.round(r.l)}–${Math.round(r.r)})`); if (name.includes('TikTok')) await p.screenshot({ path: '/tmp/claude-0/-home-user-release-manager/e734821e-e5e3-5dd9-b2a4-c0b5f29024d0/scratchpad/menu/live-old.png' }); }
        else { await p.tap('.cgh .cgh-burger > summary'); await p.waitForTimeout(500); const n = await p.evaluate(() => document.querySelectorAll('.cgh .cgh-burger .cgh-msvc a').length || document.querySelectorAll('.cgh .cgh-msvc a').length); ok(n >= 12, `${name} phone: ${n} services in the menu`); }
      } else {
        if (!mob) { await p.hover('#cgx .nav-dd-btn'); await p.waitForTimeout(500); const r = await p.evaluate(() => { const pn = document.querySelector('#cgx .nav-panel'); const box = pn.querySelector('.nav-box').getBoundingClientRect(); return { vis: getComputedStyle(pn).visibility, n: pn.querySelectorAll('.nav-it').length, l: box.left, r: box.right, vw: innerWidth }; });
          ok(r.vis === 'visible' && r.n === 14 && r.l >= 0 && r.r <= r.vw, `${name} desktop: dropdown with 14 services, on screen`); if (name === 'homepage') await p.screenshot({ path: '/tmp/claude-0/-home-user-release-manager/e734821e-e5e3-5dd9-b2a4-c0b5f29024d0/scratchpad/menu/live-new.png' }); }
        else { await p.tap('#cgx .menu-btn'); await p.waitForTimeout(400); const n = await p.evaluate(() => document.querySelectorAll('#cgx .mnav-plat a').length); ok(n === 12, `${name} phone: 12 services in the menu`); }
      }
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} ${mob ? 'phone' : 'desktop'}: no sideways scroll`);
      await c.close();
    }
  }
  await b.close(); console.log(`\n${pass} passed, ${fail} failed`); })();
