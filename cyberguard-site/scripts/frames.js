const { chromium, devices } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const out = process.argv[3];
  for (const [nm, ctx] of [['d', { viewport: { width: 1440, height: 900 } }], ['m', devices['iPhone 13']]]) {
    const p = await b.newPage(ctx);
    await p.route('**/*', r => r.continue());
    await p.goto('file://' + encodeURI(path.resolve(process.argv[2])), { waitUntil: 'domcontentloaded' });
    const t0 = Date.now();
    for (const t of [250, 700, 1150, 1600, 2100, 3600]) {
      const wait = t - (Date.now() - t0); if (wait > 0) await p.waitForTimeout(wait);
      await p.screenshot({ path: `${out}/${nm}-${String(t).padStart(4, '0')}.png`, clip: nm === 'd' ? { x: 0, y: 0, width: 1440, height: 900 } : undefined });
    }
    await p.close();
  }
  await b.close();
})();
