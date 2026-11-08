const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const urls = fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean);
  const b = await chromium.launch(); const results = []; let i = 0;
  const worker = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    // block third-party requests up front (they are blocked by the network anyway) so pages settle fast
    await ctx.route('**/*', (r) => (new URL(r.request().url()).hostname.endsWith('cyberguard.co.il') ? r.continue() : r.abort()));
    const p = await ctx.newPage();
    while (i < urls.length) {
      const url = urls[i++]; const errs = [];
      const onErr = (m) => { if (m.type() === 'error' && !/net::ERR_FAILED|ERR_BLOCKED|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 140)); };
      const onPE = (e) => errs.push('Uncaught ' + e.message.slice(0, 140));
      p.on('console', onErr); p.on('pageerror', onPE);
      let status = 0, t0 = Date.now();
      try { const resp = await p.goto(url, { waitUntil: 'load', timeout: 40000 }); status = resp ? resp.status() : 0; await p.waitForTimeout(600); }
      catch (e) { status = 'ERR ' + e.message.slice(0, 60); }
      const ms = Date.now() - t0;
      let info = {};
      try {
        info = await p.evaluate(() => {
          const t = document.title || ''; const md = (document.querySelector('meta[name=description]') || {}).content || '';
          const h1 = [...document.querySelectorAll('h1')].filter(h => h.offsetParent).map(h => h.innerText.trim().slice(0, 60));
          const sw = document.documentElement.scrollWidth, vw = innerWidth;
          const links = [...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => h.startsWith('https://cyberguard.co.il') || h.startsWith('http://cyberguard.co.il'));
          const wa = [...document.querySelectorAll('a[href*="wa.me"], a[href*="api.whatsapp"], a[href*="whatsapp.com/send"]')].map(a => a.href);
          const tel = [...document.querySelectorAll('a[href^="tel:"]')].map(a => a.getAttribute('href'));
          const noAlt = [...document.querySelectorAll('img')].filter(im => !im.hasAttribute('alt')).length;
          const forms = document.querySelectorAll('form').length;
          return { t, md, h1, sw, vw, links: [...new Set(links.map(l => l.split('#')[0]))], wa: [...new Set(wa)], tel: [...new Set(tel)], noAlt, forms };
        });
      } catch (e) { info = { evalErr: e.message.slice(0, 80) }; }
      results.push({ url, status, ms, errs: [...new Set(errs)], ...info });
      p.off('console', onErr); p.off('pageerror', onPE);
      if (results.length % 20 === 0) console.error('done', results.length);
    }
    await ctx.close();
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  fs.writeFileSync(process.argv[3], JSON.stringify(results, null, 1));
  await b.close();
})();
