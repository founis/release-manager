// node leadtest.js <page.html> <pageId>  — every lead form on the page, served from cyberguard.co.il, posts to the Elementor form
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const [file, pageId] = process.argv.slice(2); const dir = path.dirname(path.resolve(file)), base = path.basename(file);
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); } };
const MIME = { '.html': 'text/html', '.webp': 'image/webp' };
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); const posts = [];
  await c.route('https://cyberguard.co.il/**', async (r) => {
    const u = new URL(r.request().url());
    if (u.pathname === '/wp-admin/admin-ajax.php') { posts.push(r.request().postDataBuffer().toString('utf8')); return r.fulfill({ contentType: 'application/json', body: '{"success":true,"data":{"message":"ok","data":{"redirect_url":"https://cyberguard.co.il/tnx/"}}}' }); }
    if (u.pathname === '/tnx/') return r.fulfill({ contentType: 'text/html', body: 'thanks' });
    const f = path.join(dir, decodeURIComponent(u.pathname.slice(5)) || base);
    if (u.pathname.startsWith('/__t/') && fs.existsSync(f)) return r.fulfill({ body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream' });
    return r.fulfill({ status: 404, body: '' });
  });
  const p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('https://cyberguard.co.il/__t/' + encodeURIComponent(base) + '?gclid=G1', { waitUntil: 'load' });
  const n = await p.$$eval('form[data-lead]', (f) => f.length);
  for (let i = 0; i < n; i++) {
    if (i) await p.goto('https://cyberguard.co.il/__t/' + encodeURIComponent(base), { waitUntil: 'load' });
    await p.evaluate((id) => document.body.classList.add('page-id-' + id), pageId);
    const f = p.locator('form[data-lead]').nth(i);
    await f.evaluate((x) => x.scrollIntoView());
    await f.locator('[name=name]').fill('בדיקה'); await f.locator('[name=phone]').fill('050-123 4567');
    if (await f.locator('[name=issue]').count()) await f.locator('[name=issue]').selectOption({ index: 2 });
    await f.locator('[name=consent]').check();
    await Promise.all([p.waitForURL('https://cyberguard.co.il/tnx/', { timeout: 8000 }).catch(() => {}), f.locator('[type=submit]').click()]);
    const body = posts[i] || '';
    const fld = (k) => { const m = body.match(new RegExp('name="' + k.replace(/[[\]]/g, '\\$&') + '"\\r\\n\\r\\n([^\\r]*)')); return m ? m[1] : null; };
    ok(fld('form_id') === '0b89619' && fld('queried_id') === pageId && fld('form_fields[message]') === '0501234567' && fld('form_fields[name]') === 'בדיקה' && fld('form_fields[cg_gclid]') === 'G1' && !!fld('form_fields[field_8dcda2c]') && p.url().endsWith('/tnx/'), `form ${i + 1}/${n} → Elementor lead form → thank-you page (issue: ${fld('form_fields[field_8dcda2c]')})`);
  }
  ok(errs.length === 0, 'no script errors ' + errs.join('|'));
  await b.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
