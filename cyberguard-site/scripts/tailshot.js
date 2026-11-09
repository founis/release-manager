// node tailshot.js <file.html> <out.png> <width> <fromSelector>
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [file, out, w, sel] = process.argv.slice(2); const width = Number(w), mobile = width < 600;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile });
  await p.goto('file://' + encodeURI(path.resolve(file)), { waitUntil: 'networkidle' });
  await p.evaluate(async () => { await document.fonts.ready; for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 50)); } });
  await p.addStyleTag({ content: '.head{position:relative!important}.mbar{display:none!important}*{animation-play-state:paused!important}' });
  await p.waitForTimeout(700);
  const top = await p.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.screenshot({ path: out, fullPage: true, clip: { x: 0, y: top, width, height: Math.min(H - top, 15000) } });
  await b.close();
})();
