// does the hero move while the phone headline rotates through all its versions?
const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch();
  for (const f of process.argv.slice(2)) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true }); await p.goto('file://' + encodeURI(path.resolve(f))); await p.waitForTimeout(800);
    const hs = new Set(), lead = new Set();
    for (let i = 0; i < 8; i++) { const v = await p.evaluate(() => [document.querySelector('.hero').offsetHeight, Math.round(document.querySelector('.hero .lead').getBoundingClientRect().top + scrollY)]); hs.add(v[0]); lead.add(v[1]); await p.waitForTimeout(1500); }
    const clip = await p.evaluate(() => { const e = document.getElementById('pain'); const r = document.createRange(); r.selectNodeContents(e); const t = r.getBoundingClientRect(); return t.left >= 0 && t.right <= innerWidth; });
    console.log(path.basename(f), '| hero heights seen:', [...hs].join(','), '| lead top seen:', [...lead].join(','), '| text inside the screen:', clip); await p.close();
  }
  await b.close(); })();
