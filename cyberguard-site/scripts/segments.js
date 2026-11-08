// node segments.js <file.html> <outdir> <width> <segHeight> [dpr]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [file, out, w, sh, dpr] = process.argv.slice(2);
  const width = Number(w), segH = Number(sh);
  const b = await chromium.launch();
  const mobile = width < 600;
  const p = await b.newPage({ viewport: { width, height: mobile ? 844 : 900 }, deviceScaleFactor: Number(dpr || 1), isMobile: mobile, hasTouch: mobile });
  await p.goto('file://' + encodeURI(path.resolve(file)), { waitUntil: 'networkidle' });
  await p.evaluate(async () => { await document.fonts.ready; for (const img of document.images) { img.loading = 'eager'; } });
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 80)); } scrollTo({ top: 0, behavior: 'instant' }); });
  await p.waitForTimeout(800);
  // freeze animations so segments line up
  await p.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused!important}.mbar,.head{position:static!important}' });
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  let i = 1;
  for (let y = 0; y < h; y += segH, i++) {
    await p.screenshot({ path: `${out}/${width}-${String(i).padStart(2, '0')}.png`, clip: { x: 0, y, width, height: Math.min(segH, h - y) }, fullPage: true });
  }
  console.log(`${i - 1} segments, page height ${h}`);
  await b.close();
})();
