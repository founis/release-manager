// node trustcheck.js — checks the article trust blocks on live posts (fresh render via query string)
const { chromium } = require('playwright');
const OUT = process.argv[2];
const P = [
  ['telegram', 'שחרור-חשבון-טלגרם-חסום-banned'], ['whatsapp', 'מה-לעשות-אם-פרצו-לי-לוואטסאפ'], ['facebook', 'איך-לשחזר-חשבון-פייסבוק'],
  ['phone', 'שכחתי-קוד-לטלפון'], ['instagram', 'פרצו-לי-לאינסטגרם-איך-משחזרים-חשבון'], ['general', '15-כללי-אבטחה'], ['tiktok', 'שחזור-חשבון-טיקטוק-שנפרץ-או-נחסם'],
];
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const mobile of [true, false]) {
    const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1366, height: 900 } });
    for (const [k, slug] of P) {
      const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
      const r = await p.goto('https://cyberguard.co.il/' + encodeURI(slug) + '/?cgchk=' + Date.now(), { waitUntil: 'load', timeout: 60000 });
      const info = await p.evaluate(() => {
        const q = s => document.querySelector(s);
        const h1 = document.querySelectorAll('h1');
        const disc = q('.cgh-disc'), off = q('#cg-official'), svc = q('.cg-svc-box'), vs = q('.cgvs-head b');
        const meta = q('.cgh-meta'); const caps = [...document.querySelectorAll('.cgv-cap')].map(x => x.firstChild.textContent);
        const sw = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        const offIdx = off ? [...document.querySelectorAll('.cga-content > *')].indexOf(off) : -1;
        return { h1: h1.length, disc: disc && disc.textContent.trim().slice(0, 90), off: !!off, offIdx, offLinks: off ? off.querySelectorAll('a').length : 0, svc: svc && svc.querySelector('a').textContent, voices: vs && vs.textContent, caps, date: meta && meta.textContent.replace(/\s+/g, ' ').trim(), overflow: sw, lead: !!q('.cga-content p.cga-lead') };
      });
      const okk = r.status() === 200 && info.h1 === 1 && info.disc && info.overflow <= 0 && !errs.length;
      if (!okk) bad++;
      console.log(`${okk ? 'OK ' : 'BAD'} ${mobile ? 'phone' : 'desk '} ${k}: ${JSON.stringify(info)}${errs.length ? ' ERR ' + errs.join('|') : ''}`);
      if (mobile && ['telegram', 'phone', 'whatsapp'].includes(k)) await p.screenshot({ path: `${OUT}/${k}-top.png` });
      if (mobile && k === 'whatsapp') { const el = await p.$('#cg-official'); if (el) { await el.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${OUT}/${k}-official.png` }); } const sv = await p.$('.cg-svc-box'); if (sv) { await sv.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${OUT}/${k}-svc.png` }); } }
      await p.close();
    }
    await ctx.close();
  }
  await b.close(); console.log(bad ? `${bad} problems` : 'all good'); process.exit(bad ? 1 : 0);
})();
