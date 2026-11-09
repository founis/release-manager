const { chromium, devices } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  for (const [nm, ctx] of [['phone', devices['iPhone 13']], ['small', { viewport: { width: 320, height: 700 }, isMobile: true }], ['desktop', { viewport: { width: 1440, height: 900 } }]]) {
    const p = await b.newPage(ctx);
    await p.goto('file://' + encodeURI(path.resolve(process.argv[2])), { waitUntil: 'networkidle' });
    await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 60)); } });
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => [...document.querySelectorAll('.sec .h2, .sec .big, .lb-h')].map(h => {
      const words = [...h.querySelectorAll('.w-in')]; const tops = new Set(words.map(w => Math.round(w.getBoundingClientRect().top)));
      const blocky = words.filter(w => getComputedStyle(w).display !== 'inline-block').length;
      return { t: h.textContent.trim().slice(0, 30), words: words.length, lines: tops.size, blocky };
    }));
    const bad = r.filter(x => x.blocky || (x.words > 3 && x.lines >= x.words));
    ok(bad.length === 0, `${nm}: no heading breaks into one word per line ${bad.map(x => `"${x.t}" ${x.lines} lines/${x.words} words`).join('; ')}`);
    await p.close();
  }
  await b.close();
})();
