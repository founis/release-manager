// node svcaudit.js <urls.txt> <outdir>  — per-page audit of live service pages (phone + desktop). Tracking calls answered locally.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [list, out] = process.argv.slice(2);
const urls = fs.readFileSync(list, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
const TRACK = /google-analytics\.com|analytics\.google\.com|googleadservices\.com|doubleclick\.net|google\.[a-z.]+\/(pagead|ccm|rmkt|ads)|clarity\.ms|facebook\.(com|net)|bing\.com|tiktok/;
fs.mkdirSync(out, { recursive: true });

async function visit(b, url, mobile, idx) {
  const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' } : { viewport: { width: 1366, height: 900 } });
  let bytes = 0, reqs = 0; const failed = [], errs = [];
  await ctx.route('**/*', (r) => TRACK.test(r.request().url()) ? r.fulfill({ status: 204, body: '' }) : r.continue());
  const p = await ctx.newPage();
  p.on('response', async (res) => { reqs++; const l = Number(res.headers()['content-length'] || 0); bytes += l; if (res.status() >= 400 && !TRACK.test(res.url())) failed.push(res.status() + ' ' + decodeURI(res.url()).slice(0, 140)); });
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  await p.addInitScript(() => {
    window.__cls = 0; window.__lcp = 0;
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { window.__lcp = e.startTime; })).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
  });
  const t0 = Date.now();
  const resp = await p.goto(url, { waitUntil: 'load', timeout: 90000 }).catch((e) => null);
  const loadMs = Date.now() - t0;
  // first screen as a visitor sees it (before any interaction)
  await p.waitForTimeout(1200);
  const fold = await p.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0 && cs.visibility !== 'hidden' && cs.opacity !== '0'; };
    const h1 = [...document.querySelectorAll('h1')].find(vis);
    const ctas = [...document.querySelectorAll('a[href*="wa.me"], a[href*="api.whatsapp"], a[href^="tel:"], button')].filter(vis).filter((a) => !a.closest('#cg-pgck, .cg-tk, #acwp-toolbar-btn-wrap, header .elementor-nav-menu')).map((a) => (a.textContent || a.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 40)).filter(Boolean);
    return { h1InFold: !!h1, ctasInFold: ctas.slice(0, 6) };
  });
  if (mobile) await p.screenshot({ path: path.join(out, `${idx}-m-fold.png`) });
  // interact so WP Rocket's delayed scripts run, then scroll the whole page
  await p.mouse.move(200, 200);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
  await p.waitForTimeout(1500);
  const d = await p.evaluate(() => {
    const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
    const W = document.documentElement.clientWidth;
    let widest = null;
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect(); if (!r.width) return;
      if (r.right > W + 2 || r.left < -2) {
        let a = el.parentElement, clip = false;
        while (a && a !== document.body) { const o = getComputedStyle(a); if (/(hidden|clip|auto|scroll)/.test(o.overflowX) || o.position === 'fixed') { clip = true; break; } a = a.parentElement; }
        if (!clip && getComputedStyle(el).position !== 'fixed') { const over = Math.max(r.right - W, -r.left); if (!widest || over > widest.over) widest = { over: Math.round(over), el: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''), name: el.getAttribute('name') || '' }; }
      }
    });
    const links = [...document.querySelectorAll('a[href]')].map((a) => a.href);
    const imgs = [...document.querySelectorAll('img')];
    const forms = [...document.querySelectorAll('form')].filter((f) => !f.closest('[data-elementor-type="popup"]') && !/search/i.test(f.className + f.getAttribute('role'))).map((f) => ({
      cls: f.className.slice(0, 40), id: (f.querySelector('[name=form_id]') || {}).value || '', post: (f.querySelector('[name=post_id]') || {}).value || '',
      tel: !!f.querySelector('input[type=tel]'), cg: f.querySelectorAll('[name^="form_fields[cg_"]').length, fields: [...f.querySelectorAll('input:not([type=hidden]), select, textarea')].filter((i) => !i.classList.contains('maspik-field')).map((i) => i.name.replace('form_fields', '')).join(','),
    }));
    const body = document.querySelector('main, [data-elementor-type="wp-page"], [data-elementor-type="single-page"], .elementor:not([data-elementor-type="header"]):not([data-elementor-type="footer"])') || document.body;
    const words = txt(body).split(' ').length;
    return {
      title: document.title, desc: (document.querySelector('meta[name=description]') || {}).content || '', canonical: (document.querySelector('link[rel=canonical]') || {}).href || '', robots: (document.querySelector('meta[name=robots]') || {}).content || '',
      h1: [...document.querySelectorAll('h1')].map(txt), h2: document.querySelectorAll('h2').length, words,
      sw: document.documentElement.scrollWidth, W, widest, height: document.documentElement.scrollHeight,
      links: [...new Set(links)], waLinks: links.filter((h) => /wa\.me|whatsapp\.com/.test(h)).length, googleWrapped: links.filter((h) => /google\.[a-z.]+\/search\?q=/.test(h)), tels: [...new Set(links.filter((h) => h.startsWith('tel:')))],
      waNums: [...new Set(links.map((h) => (h.match(/wa\.me\/(\d+)/) || [])[1]).filter(Boolean))],
      imgs: imgs.length, broken: imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith('data:')).map((i) => i.src.slice(-80)), noAlt: imgs.filter((i) => !i.hasAttribute('alt')).length,
      forms, gtm: !!(window.google_tag_manager && window.google_tag_manager['GTM-PMKWPSNZ']), cls: Math.round(window.__cls * 1000) / 1000, lcp: Math.round(window.__lcp),
      placeholders: (txt(document.body).match(/lorem ipsum|TODO|\[.*?shortcode.*?\]|undefined|NaN/gi) || []).slice(0, 5),
      emptyHeads: [...document.querySelectorAll('h1,h2,h3')].filter((h) => !txt(h)).length,
    };
  });
  if (mobile) {
    // full page in strips of 4000px (Chromium skips paint past ~16k px in one shot)
    const H = Math.min(d.height, 24000);
    for (let y = 0, k = 0; y < H; y += 4000, k++) await p.screenshot({ path: path.join(out, `${idx}-m-${k}.png`), fullPage: true, clip: { x: 0, y, width: 390, height: Math.min(4000, H - y) } });
  } else await p.screenshot({ path: path.join(out, `${idx}-d-fold.png`) });
  await ctx.close();
  return { status: resp ? resp.status() : 0, loadMs, reqs, kb: Math.round(bytes / 1024), failed: failed.slice(0, 8), errs: [...new Set(errs)].slice(0, 6), ...fold, ...d };
}

(async () => {
  const b = await chromium.launch();
  const res = [];
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    try {
      const m = await visit(b, u, true, i), dk = await visit(b, u, false, i);
      res.push({ i, url: decodeURI(u), m, d: { status: dk.status, sw: dk.sw, W: dk.W, widest: dk.widest, errs: dk.errs, h1InFold: dk.h1InFold, ctasInFold: dk.ctasInFold, lcp: dk.lcp, cls: dk.cls, kb: dk.kb } });
      console.log(i, decodeURI(u), m.status, `m-overflow ${m.sw - m.W}px`, `h1 ${m.h1.length}`, `forms ${m.forms.length}`, `errs ${m.errs.length}`);
    } catch (e) { console.log(i, u, 'ERROR', e.message.slice(0, 120)); res.push({ i, url: decodeURI(u), error: e.message }); }
    fs.writeFileSync(path.join(out, 'audit.json'), JSON.stringify(res, null, 1));
  }
  await b.close();
})();
