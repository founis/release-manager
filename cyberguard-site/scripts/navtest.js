// the services dropdown (desktop) and the mobile service list on the new-design pages
const { chromium } = require('playwright'); const path = require('path');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); } };
(async () => { const [file, out] = process.argv.slice(2); const b = await chromium.launch();
  for (const w of [1440, 1200]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } }); await p.goto('file://' + encodeURI(path.resolve(file))); await p.waitForTimeout(500);
    ok(await p.evaluate(() => getComputedStyle(document.querySelector('.nav-panel')).visibility === 'hidden'), `${w}: menu closed until you point at it`);
    await p.hover('.nav-dd-btn'); await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const box = document.querySelector('.nav-box').getBoundingClientRect(); const links = [...document.querySelectorAll('.nav-panel a')]; const hidden = links.filter((a) => { const q = a.getBoundingClientRect(); return !q.width || q.left < 0 || q.right > innerWidth; }).length;
      return { vis: getComputedStyle(document.querySelector('.nav-panel')).visibility, left: box.left, right: box.right, vw: innerWidth, links: links.length, hidden, svc: links.filter((a) => a.classList.contains('nav-it')).length, sw: document.documentElement.scrollWidth }; });
    ok(r.vis === 'visible' && r.left >= 0 && r.right <= r.vw && r.hidden === 0 && r.sw <= r.vw, `${w}: menu opens fully on screen (${Math.round(r.left)}–${Math.round(r.right)} of ${r.vw})`);
    ok(r.svc === 14 && r.links === 25, `${w}: 14 services + 9 sub-pages listed (${r.links} links)`);
    await p.mouse.move(w / 2, 700); await p.waitForTimeout(400);
    ok(await p.evaluate(() => getComputedStyle(document.querySelector('.nav-panel')).visibility === 'hidden'), `${w}: closes when you move away`);
    await p.keyboard.press('Tab'); await p.evaluate(() => document.querySelector('.nav-dd-btn').focus()); await p.waitForTimeout(300);
    ok(await p.evaluate(() => getComputedStyle(document.querySelector('.nav-panel')).visibility === 'visible'), `${w}: opens with the keyboard too`);
    if (w === 1440) { await p.hover('.nav-dd-btn'); await p.waitForTimeout(400); await p.screenshot({ path: out + '-desk.png' }); }
    await p.close();
  }
  const m = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); await m.goto('file://' + encodeURI(path.resolve(file))); await m.waitForTimeout(400);
  await m.tap('.menu-btn'); await m.waitForTimeout(300);
  const mm = await m.evaluate(() => { const a = [...document.querySelectorAll('.mnav-plat a')]; return { n: a.length, names: a.map((x) => x.textContent.trim()), sw: document.documentElement.scrollWidth, more: [...document.querySelectorAll('.mnav-more a')].map((x) => x.textContent.trim()) }; });
  ok(mm.n === 12 && ['טלגרם', 'לינקדאין', 'מנהל מודעות', 'אימות עסק'].every((x) => mm.names.includes(x)), `phone menu lists 12 services (${mm.names.join(', ')})`);
  ok(mm.more.includes('כל השירותים'), 'phone menu links to all services');
  await m.evaluate(() => document.querySelector('.mnav-plat').scrollIntoView({ block: 'center' })); await m.waitForTimeout(200); await m.screenshot({ path: out + '-mob.png' });
  await b.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); })();
