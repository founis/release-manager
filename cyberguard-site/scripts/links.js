const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('file://' + encodeURI(path.resolve(process.argv[2])), { waitUntil: 'networkidle' });
  const r = await p.evaluate(() => {
    const hrefs = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'));
    const anchors = hrefs.filter(h => h.startsWith('#') && h.length > 1);
    const missing = [...new Set(anchors)].filter(h => !document.querySelector(h));
    const abs = [...document.querySelectorAll('a[href]')].map(a => a.href);
    return { total: hrefs.length, anchors: [...new Set(anchors)], missing, abs: [...new Set(abs)] };
  });
  fs.writeFileSync(process.argv[3], JSON.stringify(r, null, 1));
  console.log('links', r.total, '| anchors', r.anchors.join(' '), '| missing anchors:', r.missing.length ? r.missing.join(' ') : 'none');
  await b.close();
})();
