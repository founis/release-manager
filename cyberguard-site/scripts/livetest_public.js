const { chromium, devices } = require('playwright');
const URL_ = 'https://cyberguard.co.il/home-preview-2026/';
(async () => {
  const b = await chromium.launch(); const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  for (const [nm, ctx] of [['phone', devices['iPhone 13']], ['desktop', { viewport: { width: 1440, height: 900 } }]]) {
    const c = await b.newContext({ ...ctx });
    const p = await c.newPage(); const errs = [], failed = [];
    p.on('pageerror', e => errs.push(e.message.slice(0, 150)));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 150)); });
    p.on('requestfailed', r => { const u = r.url(); if (u.includes('cyberguard.co.il') || u.includes('fonts.g')) failed.push(u.slice(0, 120)); });
    await p.goto(URL_, { waitUntil: 'load', timeout: 60000 });
    const gate = await p.$('input[name=post_password]');
    ok(!gate, `${nm}: opens without a password`);
    if (gate) { await gate.fill(process.env.PREVIEW_PASSWORD || ''); await Promise.all([p.waitForNavigation({ waitUntil: 'load', timeout: 60000 }), p.click('form.post-password-form [type=submit], form [name=Submit], form input[type=submit]')]); }
    await p.mouse.move(700, 600); await p.waitForTimeout(3500);
    const r = await p.evaluate(() => ({
      cgx: !!document.getElementById('cgx'), h1: document.querySelector('#cgx .h1') && document.querySelector('#cgx .h1').innerText.slice(0, 40),
      sw: document.documentElement.scrollWidth, iw: innerWidth,
      font: getComputedStyle(document.querySelector('#cgx .h1') || document.body).fontFamily,
      header: !!document.querySelector('header.elementor, .elementor-location-header'),
      imgsBroken: [...document.querySelectorAll('#cgx img')].filter(i => i.complete && i.naturalWidth === 0).length,
      tk: getComputedStyle(document.querySelector('#cgx .tk-track')).animationName,
      scripts: [...document.querySelectorAll('script[type="rocketlazyloadscript"], script[type*="rocket"]')].length,
      jsRan: !!document.querySelector('#cgx .wall-track .wcard'),
    }));
    ok(r.cgx, `${nm}: new design is on the page`); ok(!r.header, `${nm}: no site header around it (Elementor Canvas)`);
    ok(r.sw <= r.iw + 1, `${nm}: no sideways scroll (${r.sw}/${r.iw})`); ok(/IBM Plex Sans Hebrew/.test(r.font), `${nm}: Hebrew font applied`);
    ok(r.imgsBroken === 0, `${nm}: all images load`); ok(r.tk.includes('tk'), `${nm}: ticker animation set (${r.tk})`);
    ok(r.jsRan, `${nm}: page script ran (review wall built)${r.scripts ? ` — ${r.scripts} scripts delayed by the cache plugin` : ''}`);
    const real = errs.filter(e => !/ERR_TUNNEL|ERR_FAILED|Failed to load resource/.test(e)); ok(real.length === 0, `${nm}: no script errors (blocked third-party trackers ignored) ${real.slice(0, 3).join(' | ')}`); ok(failed.length === 0, `${nm}: no failed site requests ${failed.slice(0, 3).join(' | ')}`);
    // interactions on the live page
    await p.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
    await p.locator('#check .qc-opt[data-v="whatsapp"]').scrollIntoViewIfNeeded(); await p.click('#check .qc-opt[data-v="whatsapp"]'); await p.click('#check .qc-opt[data-v="blocked"]'); await p.click('#check .qc-opt[data-v="yes"]');
    ok((await p.textContent('[data-qc-result]')).includes('זמן טיפול משוער'), `${nm}: quick check works`);
    await p.fill('.hero-form [name=name]', 'בדיקה'); await p.fill('.hero-form [name=phone]', '050-1234567'); await p.check('.hero-form [name=consent]'); await p.click('.hero-form [type=submit]');
    const sent = await p.evaluate(() => window.__opened.pop() || '');
    ok(sent.startsWith('https://wa.me/972523001030'), `${nm}: hero form opens WhatsApp with the details`);
    if (nm === 'phone') { await p.evaluate(() => scrollTo(0, 0)); await p.click('#cgx .menu-btn'); await p.waitForTimeout(400); ok(await p.isVisible('#cgx-mnav'), `${nm}: mobile menu opens`); await p.keyboard.press('Escape'); }
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(500);
    await p.screenshot({ path: `${process.argv[2]}/live-${nm}.png` });
    await c.close();
  }
  await b.close();
})();
