// node watest.js <page.html> [idPrefix]   — WhatsApp page: headline, situations/phone, timeline, forms (off-site and on-site), reviews, stories, FAQ, menu
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const [file, pre = ''] = process.argv.slice(2);
const dir = path.dirname(path.resolve(file)), base = path.basename(file);
const id = (x) => '#' + pre + x;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); } };
const MIME = { '.html': 'text/html', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.js': 'text/javascript' };

(async () => {
  const b = await chromium.launch();
  const errs = [];
  // ---------- off-site (file://) ----------
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(String(u)); return null; }; });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + encodeURI(path.resolve(file)), { waitUntil: 'load' });
  await p.waitForTimeout(600);
  ok(await p.evaluate(() => document.querySelectorAll('h1').length === 1), 'one H1');
  ok((await p.textContent(id('pain'))).trim() === 'חשבון הוואטסאפ שלך נחסם?', 'H1 starts with the SEO question');
  const h0 = await p.evaluate(() => document.querySelector('.hero').offsetHeight);
  const seen = new Set();
  for (let i = 0; i < 4; i++) { await p.waitForTimeout(1500); seen.add((await p.textContent(id('pain'))).trim()); }
  const h1 = await p.evaluate(() => document.querySelector('.hero').offsetHeight);
  ok(seen.size >= 2, `headline rotates (${[...seen].join(' | ')})`);
  ok(h0 === h1, `hero height stays put while rotating (${h0} → ${h1})`);
  // situations + phone
  await p.locator('#situations').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await p.hover('[data-sit="2"]'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.querySelector('[data-phone]').dataset.state === '2' && document.querySelector('.ph-state[data-i="2"]').classList.contains('on') && document.querySelector('[data-sit="2"]').classList.contains('on')), 'pointing at "החשבון נפרץ" shows it on the phone');
  await p.hover('[data-sit="4"]'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.querySelector('[data-phone]').dataset.state === '4'), 'pointing at the PIN card switches the phone');
  await p.mouse.move(5, 5);
  const t1 = await p.textContent('.ph-state[data-i="0"] .ph-time'); await p.waitForTimeout(2100); const t2 = await p.textContent('.ph-state[data-i="0"] .ph-time');
  ok(t1 !== t2, `phone countdown ticks (${t1} → ${t2})`);
  await p.waitForTimeout(9000);
  ok(await p.evaluate(() => document.querySelector('[data-phone]').dataset.state !== '4'), 'phone cycles on its own once you stop pointing');
  const sitLinks = await p.$$eval('.sit-go', (a) => a.map((x) => x.href));
  ok(sitLinks.length === 6 && sitLinks.every((h) => h.startsWith('https://wa.me/972523001030?text=') && decodeURIComponent(h).includes('המצב שלי')), '6 "זה המצב שלי" links open WhatsApp with the situation');
  // timeline
  await p.locator('[data-tl]').scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.querySelector('[data-tl]').classList.contains('on')), 'timeline lights up on screen');
  // forms off-site → WhatsApp
  const hero = p.locator('.hero-form form');
  await hero.locator('[type=submit]').click(); await p.waitForTimeout(200);
  ok(await p.evaluate(() => window.__opened.length === 0), 'empty form does not send');
  ok(await hero.evaluate((f) => f.elements.issue.validationMessage === 'נא לבחור מה קרה' || f.elements.name.validationMessage === 'נא למלא שם'), 'Hebrew validation message');
  await hero.locator('[name=name]').fill('דנה'); await hero.locator('[name=phone]').fill('050 123 4567');
  await hero.locator('[name=issue]').selectOption({ label: 'החשבון נפרץ' }); await hero.locator('[name=consent]').check();
  await hero.locator('[type=submit]').click(); await p.waitForTimeout(200);
  const op = await p.evaluate(() => window.__opened.slice());
  ok(op.length === 1 && decodeURIComponent(op[0]).includes('שם: דנה') && decodeURIComponent(op[0]).includes('שחרור חשבון וואטסאפ פרוץ'), 'off the live site the form opens WhatsApp with the details');
  ok((await p.$$('form[data-lead] select[name=issue][required]')).length === 3, '3 lead forms ask what happened');
  // reviews
  await p.click('[data-rev-toggle]'); await p.waitForTimeout(200);
  ok(await p.evaluate((sel) => { const c = document.querySelector(sel + ' .chip[aria-pressed="true"]'); return c && c.dataset.net === 'whatsapp'; }, id('chips')), 'review list opens filtered to WhatsApp');
  const revs = await p.$$eval(id('reviewList') + ' .rev', (r) => r.map((x) => x.querySelector('.pi').className));
  ok(revs.length === 6 && revs.every((c) => c.includes('whatsapp')), `6 WhatsApp reviews shown (${revs.length})`);
  ok(await p.$$eval('.wall-track .wcard', (w) => w.length) === 84, 'review wall has all 42 reviews (x2 for the loop)');
  // stories
  const firstCases = await p.$$eval(id('cases') + ' .case:not([hidden])', (c) => c.map((x) => x.querySelector('.case-tag .pi').className));
  ok(firstCases.length === 6 && firstCases.every((c) => c.includes('whatsapp')), 'first 6 video stories are WhatsApp stories');
  await p.click('[data-cases-more]');
  ok(await p.$$eval(id('cases') + ' .case:not([hidden])', (c) => c.length) === 12, '"עוד סיפורי לקוחות" shows 6 more');
  await p.click(id('cases') + ' .case-media >> nth=0');
  ok(await p.evaluate((sel) => document.querySelector(sel).src.includes('player.vimeo.com/video/1214971619'), id('modalFrame')), 'video opens in the player');
  await p.keyboard.press('Escape');
  // FAQ + structured data + guides
  ok(await p.$$eval('#faq details', (d) => d.length) === 7, '7 WhatsApp questions');
  const ld = await p.evaluate(() => { try { const j = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent); return j['@type'] + ':' + j.mainEntity.length; } catch (e) { return 'bad ' + e.message; } });
  ok(ld === 'FAQPage:7', `FAQ structured data is valid (${ld})`);
  const guides = await p.$$eval('.guide', (g) => g.map((a) => decodeURI(a.href)));
  ok(guides.length === 6 && guides.every((h) => h.startsWith('https://cyberguard.co.il/')), '6 guide links to the site');
  const waAll = await p.$$eval('[data-wa]', (a) => a.filter((x) => !x.href.startsWith('https://wa.me/972523001030')).length);
  ok(waAll === 0, 'every WhatsApp button points at the right number');
  ok(await p.evaluate(() => document.querySelector('.nav [aria-current="page"]').textContent.trim() === 'שחרור וואטסאפ'), 'menu marks this page');
  await ctx.close();

  // ---------- phone: menu ----------
  const mc = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const m = await mc.newPage(); m.on('pageerror', (e) => errs.push(e.message));
  await m.goto('file://' + encodeURI(path.resolve(file)), { waitUntil: 'load' });
  await m.tap('.menu-btn'); await m.waitForTimeout(150);
  ok(await m.evaluate((sel) => !document.querySelector(sel).hidden, id('mnav')), 'phone menu opens');
  ok(await m.$$eval(id('mnav') + ' .mnav-links a', (a) => a.length) === 8, 'phone menu has 8 page links');
  await m.tap(id('mnav') + ' .mnav-links a >> nth=0'); await m.waitForTimeout(400);
  ok(await m.evaluate((sel) => document.querySelector(sel).hidden, id('mnav')), 'tapping a link closes the menu');
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= 390), 'no sideways scroll on the phone');
  ok(await m.evaluate(() => getComputedStyle(document.querySelector('[data-phone]')).display === 'none' && !document.querySelector('.sit.on')), 'phone mock-up stays out of the way on small screens');
  await mc.close();

  // ---------- on the live domain: lead goes to the Elementor form ----------
  const lc = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const posts = [];
  let reply = { success: true, data: { message: 'ok', data: { redirect_url: 'https://cyberguard.co.il/tnx/' } } };
  await lc.route('https://cyberguard.co.il/**', async (r) => {
    const u = new URL(r.request().url());
    if (u.pathname === '/wp-admin/admin-ajax.php') { posts.push(r.request().postDataBuffer().toString('utf8')); return r.fulfill({ contentType: 'application/json', body: JSON.stringify(reply) }); }
    if (u.pathname === '/tnx/') return r.fulfill({ contentType: 'text/html', body: '<title>tnx</title>thanks' });
    if (u.pathname.startsWith('/__wa/')) {
      const f = path.join(dir, decodeURIComponent(u.pathname.slice(6)) || base);
      if (fs.existsSync(f)) return r.fulfill({ body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream' });
    }
    return r.fulfill({ status: 404, body: '' });
  });
  await lc.route('https://wa.me/**', (r) => r.fulfill({ contentType: 'text/html', body: '<title>wa</title>wa' }));
  const l = await lc.newPage(); l.on('pageerror', (e) => errs.push(e.message));
  await l.goto('https://cyberguard.co.il/__wa/' + encodeURIComponent(base) + '?gclid=TEST-GCLID&utm_source=google', { waitUntil: 'load' });
  await l.evaluate(() => document.body.classList.add('page-id-4608'));
  // the site's anti-spam scripts, as the live site loads them
  const MCFG = { honeypot: true, honeypotName: 'full-name-maspik-hp', honeypotLabel: 'x', advancedKey: false, keyName: 'maspik_spam_key', keyValue: '', atomicHpId: 'maspik_atomic_hp', atomicKeyId: 'maspik_atomic_sk', atomicSignalsId: 'maspik_atomic_sg', signals: true, signalsName: 'maspik_signals', signalsVersion: 1, signalsProbes: false, skipSelector: '' };
  // MASPIK_DIR: a folder with maspik-guard.js and signals.js from the live site (not kept in the repo)
  const MDIR = process.env.MASPIK_DIR || path.join(__dirname, '..', 'mcptest', 'maspik');
  const haveMaspik = fs.existsSync(path.join(MDIR, 'maspik-guard.js')) && fs.existsSync(path.join(MDIR, 'signals.js'));
  if (haveMaspik) {
    await l.addScriptTag({ content: 'window.maspikGuardConfig = ' + JSON.stringify(MCFG) + ';' });
    await l.addScriptTag({ path: path.join(MDIR, 'maspik-guard.js') });
    await l.addScriptTag({ path: path.join(MDIR, 'signals.js') });
  } else console.log('note: anti-spam scripts not found, skipping that check (set MASPIK_DIR)');
  await l.mouse.move(200, 300); await l.mouse.move(400, 500);
  // phone that is not a 10-digit mobile is stopped before sending
  const bad = l.locator('#callback form');
  await bad.locator('[name=name]').fill('בדיקה'); await bad.locator('[name=phone]').fill('03-123456');
  await bad.locator('[name=issue]').selectOption({ index: 1 }); await bad.locator('[name=consent]').check();
  await bad.locator('[type=submit]').click(); await l.waitForTimeout(300);
  ok(posts.length === 0 && (await bad.locator('[name=phone]').evaluate((i) => i.validationMessage)).includes('10 ספרות'), 'a phone that is not 10 digits is stopped with a Hebrew message');
  const lf = l.locator('#callback form');
  await lf.locator('[name=name]').fill('בדיקה'); await lf.locator('[name=phone]').fill('+972 52-300-1030');
  await lf.locator('[name=issue]').selectOption({ label: 'WhatsApp Business נחסם' }); await lf.locator('[name=consent]').check();
  await Promise.all([l.waitForURL('https://cyberguard.co.il/tnx/', { timeout: 8000 }).catch(() => {}), lf.locator('[type=submit]').click()]);
  const body = posts[0] || '';
  const field = (n) => { const m = body.match(new RegExp('name="' + n.replace(/[[\]]/g, '\\$&') + '"\\r\\n\\r\\n([^\\r]*)')); return m ? m[1] : null; };
  ok(posts.length === 1, 'on cyberguard.co.il the form posts to the Elementor form');
  ok(field('action') === 'elementor_pro_forms_send_form' && field('post_id') === '5777' && field('form_id') === '0b89619' && field('queried_id') === '4608', 'targets the site-wide lead form, tagged with this page');
  ok(field('form_fields[name]') === 'בדיקה' && field('form_fields[message]') === '0523001030' && field('form_fields[field_8dcda2c]') === 'WhatsApp Business נחסם', 'name, phone (+972 → 10 digits) and issue are sent');
  ok(field('form_fields[cg_gclid]') === 'TEST-GCLID' && field('form_fields[cg_utm_source]') === 'google' && (field('form_fields[cg_landing_url]') || '').includes('gclid=TEST-GCLID'), 'ad click id and utm are sent');
  if (haveMaspik) ok(/name="full-name-maspik-hp"\r\n\r\n\r\n/.test(body) && /name="maspik_signals"\r\n\r\n[^\r]{20,}/.test(body), 'anti-spam fields (honeypot + signals) are passed on');
  ok(l.url() === 'https://cyberguard.co.il/tnx/', 'after sending, the visitor lands on the thank-you page');
  // stored gclid is reused on a later visit without it
  reply = { success: false, data: { message: 'err' } };
  await l.goto('https://cyberguard.co.il/__wa/' + encodeURIComponent(base), { waitUntil: 'load' });
  const lf2 = l.locator('#contact form');
  await lf2.locator('[name=name]').fill('בדיקה'); await lf2.locator('[name=phone]').fill('0523001030');
  await lf2.locator('[name=issue]').selectOption({ index: 1 }); await lf2.locator('[name=consent]').check();
  await Promise.all([l.waitForURL(/wa\.me/, { timeout: 8000 }).catch(() => {}), lf2.locator('[type=submit]').click()]);
  const body2 = posts[1] || '';
  ok(/name="form_fields\[cg_gclid\]"\r\n\r\nTEST-GCLID/.test(body2), 'gclid remembered from the first visit');
  ok(l.url().startsWith('https://wa.me/972523001030'), 'if the site rejects the form, the visitor is sent to WhatsApp with the details');
  await lc.close();

  const real = errs.filter((e) => !/fonts\.g|ERR_|Failed to load resource/.test(e));
  ok(real.length === 0, 'no script errors' + (real.length ? ': ' + real.join(' | ') : ''));
  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
