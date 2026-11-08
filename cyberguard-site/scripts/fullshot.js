// node fullshot.js <file.html> <out.png> <width> <dpr>
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [file, out, w, dpr] = process.argv.slice(2);
  const width = Number(w), mobile = width < 600;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width, height: mobile ? 844 : 900 }, deviceScaleFactor: Number(dpr), isMobile: mobile, hasTouch: mobile });
  await p.goto('file://' + encodeURI(path.resolve(file)), { waitUntil: 'networkidle' });
  await p.evaluate(async () => { await document.fonts.ready; document.querySelectorAll('img').forEach(i => i.loading = 'eager'); for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 60)); } scrollTo({ top: 0, behavior: 'instant' }); });
  await p.addStyleTag({ content: '.head{position:relative!important}.mbar{display:none!important}body{padding-bottom:0!important}*{animation-play-state:paused!important}' });
  await p.waitForTimeout(800);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
})();
