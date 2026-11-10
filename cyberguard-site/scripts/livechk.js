const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2]; const b = await chromium.launch(); let bad = 0;
  for (const [n, o] of [['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }], ['desktop', { viewport: { width: 1366, height: 900 } }]]) {
    const c = await b.newContext(o); const p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    const r = await p.goto(url + '?cgchk=' + Date.now(), { waitUntil: 'load' }); await p.mouse.wheel(0, 300); await p.waitForTimeout(1500);
    const i = await p.evaluate(() => ({ h1: document.querySelectorAll('h1').length, ovf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      forms: document.querySelectorAll('#cgx form[data-lead]').length, cases: document.querySelectorAll('#cgx .case').length, faq: document.querySelectorAll('#cgx #faq details').length,
      robots: (document.querySelector('meta[name=robots]') || {}).content, title: document.title, siteHdr: !!document.querySelector('.elementor-location-header') }));
    const ok = r.status() === 200 && i.h1 === 1 && i.ovf <= 0 && i.forms >= 2 && !errs.length; if (!ok) bad++;
    console.log(ok ? 'OK ' : 'BAD', n, r.status(), JSON.stringify(i), errs.slice(0, 2).join(' | '));
    if (n === 'phone') await p.screenshot({ path: 'live-phone.png' });
    await c.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
