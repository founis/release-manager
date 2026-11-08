const { chromium, devices } = require('playwright'); const path = require('path'); const fs = require('fs');
const AXE = fs.readFileSync(process.argv[3], 'utf8');
(async () => {
  const b = await chromium.launch(); const url = 'file://' + encodeURI(path.resolve(process.argv[2]));
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  // 1. reduced motion: nothing animates, everything visible
  const rm = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await rm.goto(url, { waitUntil: 'networkidle' }); await rm.waitForTimeout(400);
  const rmr = await rm.evaluate(() => {
    const running = document.getAnimations().filter(a => a.playState === 'running').map(a => (a.effect && a.effect.target && a.effect.target.className) + ':' + (a.animationName || '')).slice(0, 8);
    const hidden = ['.h1 .pain', '.h1 .h1-b', '.hero .lead', '.hero-form', '.proof'].filter(sel => { const e = document.querySelector(sel); return !e || parseFloat(getComputedStyle(e).opacity) < 0.99; });
    const p1 = (document.getElementById('pain') || document.getElementById('cgx-pain')).textContent;
    return { running, hidden, p1 };
  });
  ok(rmr.hidden.length === 0, `reduced motion: hero visible immediately ${rmr.hidden}`);
  ok(rmr.running.length === 0, `reduced motion: no running animations ${rmr.running.join(', ')}`);
  await rm.waitForTimeout(3200); ok(await rm.evaluate(() => (document.getElementById('pain') || document.getElementById('cgx-pain')).textContent) === rmr.p1, 'reduced motion: headline does not rotate');
  await rm.close();
  // 2. layout shift during load + 6s (headline rotation, counters, fonts)
  for (const [nm, ctx] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['phone', devices['iPhone 13']]]) {
    const p = await b.newPage(ctx);
    await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(6500);
    const cls = await p.evaluate(() => window.__cls);
    ok(cls < 0.1, `${nm}: layout shift score ${cls.toFixed(3)} (good < 0.1)`);
    // 3. accessibility (axe) on the page as loaded
    await p.addScriptTag({ content: AXE });
    const res = await p.evaluate(async () => { const r = await axe.run(document, { resultTypes: ['violations'] }); return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, ex: v.nodes.slice(0, 3).map(x => x.target.join(' ') + ' :: ' + (x.failureSummary || '').split('\n')[1]) })); });
    if (!res.length) ok(true, `${nm}: axe — no accessibility violations`);
    res.forEach(v => console.log(`AXE ${nm} [${v.impact}] ${v.id} x${v.n}\n    ${v.ex.join('\n    ')}`));
    await p.close();
  }
  await b.close();
})();
