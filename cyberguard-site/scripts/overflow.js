const { chromium } = require('playwright');
(async () => {
  const [file, ...ws] = process.argv.slice(2);
  const b = await chromium.launch();
  for (const w of ws.map(Number)) {
    const p = await b.newPage({ viewport: { width: w, height: 800 } });
    await p.goto('file://' + file); await p.waitForTimeout(800);
    const r = await p.evaluate(() => {
      const W = document.documentElement.clientWidth, bad = [];
      document.querySelectorAll('body *').forEach((el) => { const rc = el.getBoundingClientRect(); if (rc.width && (rc.right > W + 1 || rc.left < -1)) { const cs = getComputedStyle(el); let a = el.parentElement, clip = false; while (a && a !== document.body) { const o = getComputedStyle(a); if (/(hidden|clip|auto|scroll)/.test(o.overflowX) || o.position === 'fixed') { clip = true; break; } a = a.parentElement; } if (cs.position !== 'fixed' && !clip) bad.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} L${Math.round(rc.left)} R${Math.round(rc.right)}`); } });
      return { sw: document.documentElement.scrollWidth, W, bad: bad.slice(0, 12) };
    });
    console.log(w, JSON.stringify(r));
    await p.close();
  }
  await b.close();
})();
