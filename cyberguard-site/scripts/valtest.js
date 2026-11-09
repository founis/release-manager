const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
  await p.goto('file://' + encodeURI(path.resolve(process.argv[2])), { waitUntil: 'networkidle' });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const msg = (sel) => p.$eval(sel, (el) => { el.form.checkValidity(); return el.validationMessage; });
  await p.click('.hero-form [type=submit]');
  ok(await msg('.hero-form [name=name]') === 'נא למלא שם', 'empty name -> Hebrew message');
  await p.fill('.hero-form [name=name]', 'דנה'); await p.fill('.hero-form [name=phone]', '12');
  ok((await msg('.hero-form [name=phone]')).startsWith('נא להזין מספר נייד בן 10 ספרות'), 'short phone -> Hebrew message');
  await p.fill('.hero-form [name=phone]', '050-1234567'); ok(await msg('.hero-form [name=phone]') === '', 'valid phone accepted');
  await p.fill('.hero-form [name=phone]', '+972 50 123 4567'); ok(await msg('.hero-form [name=phone]') === '', 'international format accepted');
  ok(await msg('.hero-form [name=consent]') === 'נא לאשר את מדיניות הפרטיות', 'consent -> Hebrew message');
  await p.check('.hero-form [name=consent]'); await p.click('.hero-form [type=submit]');
  ok((await p.evaluate(() => window.__opened.length)) === 1, 'valid form sends');
  await b.close();
})();
