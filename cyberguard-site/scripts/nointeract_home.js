// Loads the public page and does NOT touch it: checks the page works before any interaction
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  for (const [nm, ctx] of [['phone', devices['iPhone 13']], ['desktop', { viewport: { width: 1440, height: 900 } }]]) {
    const c = await b.newContext(ctx); const p = await c.newPage();
    await p.goto('https://cyberguard.co.il/', { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(3400);
    const r = await p.evaluate(() => ({ wall: document.querySelectorAll('#cgx .wcard').length, pain: document.getElementById('cgx-pain').textContent, chips: document.querySelectorAll('#cgx-chips .chip').length }));
    ok(r.wall === 84, `${nm}: review wall built before any touch (${r.wall})`);
    ok(r.chips === 7, `${nm}: review filters built (${r.chips})`);
    ok(r.pain !== 'החשבון שלך נחסם?', `${nm}: headline already rotating ("${r.pain}")`);
    await c.close();
  }
  await b.close();
})();
