const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch();
  for (const f of process.argv.slice(2)) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    if (f.startsWith('http')) await p.goto(f, { waitUntil: 'load' }); else await p.goto('file://' + encodeURI(path.resolve(f)));
    await p.waitForTimeout(1200);
    console.log(path.basename(f).slice(0, 40), JSON.stringify(await p.evaluate(() => { const e = document.getElementById('pain') || document.getElementById('cgx-pain'); const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
      const range = document.createRange(); range.selectNodeContents(e); const tr = range.getBoundingClientRect();
      return { text: e.textContent, display: cs.display, ws: cs.whiteSpace, wrap: cs.textWrap || cs.textWrapMode, w: Math.round(r.width), textW: Math.round(tr.width), textLeft: Math.round(tr.left), lines: Math.round(tr.height / parseFloat(cs.lineHeight || 60)), minH: e.style.minHeight, fs: cs.fontSize }; })));
    await p.close();
  }
  await b.close(); })();
