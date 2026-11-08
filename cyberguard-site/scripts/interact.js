const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
  await p.goto('file://' + encodeURI(path.resolve(process.argv[2])), { waitUntil: 'networkidle' });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  // hero lead form
  await p.click('.hero-form button[type=submit]'); ok(await p.evaluate(() => window.__opened.length) === 0, 'hero form blocked when empty');
  await p.fill('.hero-form [name=name]', 'רון'); await p.fill('.hero-form [name=phone]', '0547778899'); await p.selectOption('.hero-form [name=issue]', 'טלפון נעול'); await p.check('.hero-form [name=consent]');
  await p.click('.hero-form button[type=submit]');
  const m0 = await p.evaluate(() => decodeURIComponent(window.__opened.pop().split('text=')[1]));
  ok(m0.includes('רון') && m0.includes('0547778899') && m0.includes('טלפון נעול'), 'hero form message has name, phone, issue');
  // quick check
  await p.click('#check .qc-opt[data-v="instagram"]'); await p.click('#check .qc-opt[data-v="changed"]'); await p.click('#check .qc-opt[data-v="no"]');
  const res = await p.textContent('[data-qc-result]');
  ok(res.includes('זמן טיפול משוער') && res.includes('שינו') === false ? true : res.includes('זמן טיפול משוער'), 'quick check shows result');
  ok(res.includes('גם כשהמייל והסיסמה הוחלפו'), 'tip for changed email/password present');
  const href = await p.getAttribute('.qc-send', 'href'); const msg = decodeURIComponent(href.split('text=')[1]);
  ok(msg.includes('אינסטגרם') && msg.includes('שינו לי את המייל והסיסמה') && msg.includes('אין גישה'), 'WhatsApp summary has all 3 answers');
  await p.screenshot({ path: process.argv[3] + '/qc-result.png', clip: await p.$eval('[data-qc]', e => { const r = e.getBoundingClientRect(); return { x: r.x - 10, y: r.y + scrollY - 10, width: r.width + 20, height: r.height + 20 }; }), fullPage: true });
  await p.click('.qc-callback summary'); await p.fill('.qc-form [name=name]', 'ישראל'); await p.fill('.qc-form [name=phone]', '0501234567');
  await p.click('.qc-form button[type=submit]'); let o = await p.evaluate(() => window.__opened.length);
  ok(o === 0, 'callback blocked without consent');
  await p.check('.qc-form [name=consent]'); await p.click('.qc-form button[type=submit]');
  const m2 = await p.evaluate(() => decodeURIComponent(window.__opened.pop().split('text=')[1]));
  ok(m2.includes('ישראל') && m2.includes('0501234567') && m2.includes('פלטפורמה: אינסטגרם'), 'callback message includes name, phone and answers');
  await p.click('.qc-restart'); ok(await p.isVisible('#check .qc-step[data-step="0"]'), 'restart returns to question 1');
  // band form
  await p.click('#callback button[type=submit]'); ok(await p.evaluate(() => window.__opened.length) === 0, 'band form blocked when empty');
  await p.fill('#callback [name=name]', 'דנה'); await p.fill('#callback [name=phone]', '0521112233'); await p.selectOption('#callback [name=issue]', 'מנהל המודעות נחסם'); await p.check('#callback [name=consent]');
  await p.click('#callback button[type=submit]');
  const m3 = await p.evaluate(() => decodeURIComponent(window.__opened.pop().split('text=')[1]));
  ok(m3.includes('דנה') && m3.includes('מנהל המודעות נחסם'), 'band form message has name + issue');
  await p.screenshot({ path: process.argv[3] + '/band.png', clip: await p.$eval('#callback .lb', e => { const r = e.getBoundingClientRect(); return { x: r.x - 10, y: r.y + scrollY - 10, width: r.width + 20, height: r.height + 20 }; }), fullPage: true });
  // reviews
  ok(await p.$$eval('.wall-track .wcard', a => a.length) === 84, 'review wall has 42 reviews x2 (loop)');
  ok(await p.isHidden('[data-rev-all]'), 'full list hidden by default');
  await p.click('[data-rev-toggle]'); ok(await p.$$eval('#reviewList .rev', a => a.length) === 6, 'full list opens with 6 cards');
  await p.click('#chips .chip[data-net="youtube"]'); const nets = await p.$$eval('#reviewList .net', a => a.map(x => x.textContent));
  ok(nets.length > 0 && nets.every(t => t.includes('יוטיוב')), `filter youtube -> ${nets.length} cards, all יוטיוב`);
  // video modal
  await p.click('.case-media >> nth=0'); const src = await p.getAttribute('#modalFrame', 'src'); ok(/player\.vimeo\.com\/video\/\d+/.test(src), 'video modal loads Vimeo');
  await p.keyboard.press('Escape'); ok(!(await p.isVisible('#modal')), 'Escape closes video');
  ok(errs.length === 0, 'no page errors ' + errs.join('; '));
  await b.close();
})();
