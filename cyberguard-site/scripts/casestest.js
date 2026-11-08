const { chromium, devices } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  for (const [nm, ctx] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['phone', devices['iPhone 13']]]) {
    const p = await b.newPage(ctx); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + encodeURI(path.resolve(process.argv[2])), { waitUntil: 'networkidle' });
    const sel = process.argv[3] || '';
    const vis = () => p.$$eval('.case', a => a.filter(c => !c.hidden).length);
    ok(await p.$$eval('.case', a => a.length) === 22, `${nm}: 22 case cards`);
    ok(await vis() === 6, `${nm}: 6 visible at start`);
    await p.click('[data-cases-more]'); ok(await vis() === 12, `${nm}: 12 after one click`);
    await p.click('[data-cases-more]'); await p.click('[data-cases-more]'); ok(await vis() === 22, `${nm}: all 22 after three clicks`);
    ok(await p.isHidden('[data-cases-more]'), `${nm}: button gone at the end`);
    await p.click('.case-play >> nth=15'); const src = await p.getAttribute(sel || '#modalFrame', 'src'); ok(/vimeo\.com\/video\/\d+/.test(src), `${nm}: card 16 plays its video`);
    ok(errs.length === 0, `${nm}: no page errors ${errs.join(';')}`);
    await p.close();
  }
  await b.close();
})();
