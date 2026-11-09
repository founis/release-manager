// node livecheck.js '<json {hub_id: {url, sources:[url]}}>' — checks rewritten hubs render and merge sources 301 to them
const { chromium } = require('playwright');
const https = require('https');
const head = (u) => new Promise((res) => { https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0 cgcheck' } }, (r) => { res([r.statusCode, decodeURI(r.headers.location || '')]); r.resume(); }).on('error', (e) => res([0, e.message])); });
(async () => {
  const items = JSON.parse(process.argv[2]); const b = await chromium.launch(); let bad = 0;
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  for (const [id, it] of Object.entries(items)) {
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    const r = await p.goto(encodeURI(it.url) + '?cgchk=' + Date.now(), { waitUntil: 'load', timeout: 60000 });
    const i = await p.evaluate(() => ({
      h1: [...document.querySelectorAll('h1')].map((x) => x.textContent.trim()),
      updated: (document.querySelector('.cgh-meta') || {}).textContent?.replace(/\s+/g, ' ').trim(),
      off: !!document.querySelector('#cg-official'), svc: !!document.querySelector('.cg-svc-box'), faq: document.querySelectorAll('.cga-faq details').length,
      inline: !!document.querySelector('.cga-inline'), toc: document.querySelectorAll('.elementor-toc__list-item').length, form: !!document.querySelector('form.elementor-form'),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, ld: [...document.querySelectorAll('script[type="application/ld+json"]')].some((s) => s.textContent.includes('FAQPage')),
    }));
    const ok = r.status() === 200 && i.h1.length === 1 && i.faq >= 3 && i.overflow <= 0 && !errs.length && i.form;
    if (!ok) bad++;
    console.log(`${ok ? 'OK ' : 'BAD'} ${id} ${r.status()} ${JSON.stringify(i)}${errs.length ? ' ERR ' + errs[0] : ''}`);
    await p.close();
    for (const s of it.sources || []) {
      const [code, loc] = await head(encodeURI(s));
      const sok = code === 301 && loc.replace(/\/$/, '') === it.url.replace(/\/$/, '');
      if (!sok) bad++;
      console.log(`   ${sok ? 'OK ' : 'BAD'} 301 ${decodeURI(s).replace('https://cyberguard.co.il', '')} -> ${code} ${loc.replace('https://cyberguard.co.il', '')}`);
    }
  }
  await b.close(); console.log(bad ? `${bad} problems` : 'all good'); process.exit(bad ? 1 : 0);
})();
