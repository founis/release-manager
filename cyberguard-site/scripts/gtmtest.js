// node gtmtest.js — live check of the GTM container (GTM-PMKWPSNZ) on the new pages.
// Tracking requests (Google Ads / GA4 / Clarity / Meta) are recorded and answered locally with 204, so nothing reaches
// the ad accounts; the lead form request is answered with a fake success, so no real lead is created.
const { chromium } = require('playwright');
const L = { form: 'N9uvCJXjzpgbEJLR2oY-', wa: 'Inj7CLGxvZgbEJLR2oY-', tel: 'i_75CL-nzpgbEJLR2oY-' };
const TRACK = /google-analytics\.com|analytics\.google\.com|googleadservices\.com|doubleclick\.net|google\.[a-z.]+\/(pagead|ccm|rmkt|ads)|clarity\.ms|facebook\.(com|net)|bing\.com|tiktok/;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); } };
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const PAGES = [
  ['LinkedIn page', 'https://cyberguard.co.il/%D7%A9%D7%97%D7%96%D7%95%D7%A8-%D7%97%D7%A9%D7%91%D7%95%D7%9F-%D7%9C%D7%99%D7%A0%D7%A7%D7%93%D7%90%D7%99%D7%9F/'],
  ['Telegram page', 'https://cyberguard.co.il/%D7%A9%D7%97%D7%A8%D7%95%D7%A8-%D7%97%D7%A9%D7%91%D7%95%D7%9F-%D7%98%D7%9C%D7%92%D7%A8%D7%9D/'],
  ['homepage', 'https://cyberguard.co.il/'],
  ['WhatsApp page', 'https://cyberguard.co.il/%D7%95%D7%95%D7%90%D7%98%D7%A1%D7%90%D7%A4-%D7%97%D7%93%D7%A9/'],
].filter(([n]) => !ONLY || ONLY.includes(n));

async function open(b, url, mobile) {
  const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' } : { viewport: { width: 1366, height: 900 } });
  const hits = [], leads = [];
  await ctx.route('**/*', async (r) => {
    const req = r.request(), u = req.url();
    if (TRACK.test(u)) { hits.push(u + ' ' + (req.postData() || '')); return r.fulfill({ status: 204, body: '' }); }
    if (u.includes('/wp-admin/admin-ajax.php') && (req.postData() || '').includes('elementor_pro_forms_send_form')) {
      leads.push(req.postDataBuffer().toString('utf8'));
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: { message: 'ok', data: { redirect_url: 'https://cyberguard.co.il/tnx/' } } }) });
    }
    if (/wa\.me|api\.whatsapp\.com/.test(u)) return r.fulfill({ contentType: 'text/html', body: 'wa' });
    return r.continue();
  });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(url + (url.includes('?') ? '&' : '?') + 'gclid=TEST-GTM-CHECK', { waitUntil: 'load', timeout: 60000 });
  // WP Rocket starts delayed scripts on the first interaction
  await p.mouse.move(300, 300); await p.mouse.wheel(0, 200); await p.waitForTimeout(300); await p.mouse.wheel(0, -200);
  await p.waitForFunction(() => window.google_tag_manager && window.google_tag_manager['GTM-PMKWPSNZ'] && window.dataLayer && window.dataLayer.some((e) => e && e.event === 'gtm.load'), null, { timeout: 25000 }).catch(() => {});
  await p.waitForTimeout(1500);
  return { ctx, p, hits, leads, errs };
}
const events = (p) => p.evaluate(() => (window.dataLayer || []).map((e) => e && (e.event || (e[0] === 'consent' ? 'consent:' + e[1] : null))).filter(Boolean));
const hitWith = (hits, s) => hits.filter((h) => h.includes(s));

(async () => {
  const b = await chromium.launch();
  for (const [name, url] of PAGES) {
    console.log(`\n=== ${name} ===`);
    const { ctx, p, hits, leads, errs } = await open(b, url);
    ok(await p.evaluate(() => !!(window.google_tag_manager && window.google_tag_manager['GTM-PMKWPSNZ'])), `${name}: GTM container loads`);
    const ev0 = await events(p);
    ok(ev0.includes('gtm.js') && ev0.includes('gtm.load'), `${name}: page view reaches the data layer (${ev0.filter((e) => e.startsWith('gtm.')).join(', ')})`);
    ok(hitWith(hits, 'G-YG8VR4TVJL').length > 0, `${name}: GA4 page view sent (G-YG8VR4TVJL)`);
    ok(hitWith(hits, '16657066130').length > 0, `${name}: Google Ads tag active (AW-16657066130)`);
    ok(hits.some((h) => h.includes('clarity.ms')), `${name}: Microsoft Clarity loads`);
    // cookie banner
    const accept = p.locator('button:has-text("הבנתי")').first();
    if (await accept.count() && await accept.isVisible().catch(() => false)) { await accept.click().catch(() => {}); await p.waitForTimeout(500); }
    // 1) phone click
    const n0 = hits.length;
    await p.evaluate(() => { const a = [...document.querySelectorAll('#cgx a[href^="tel:"]')].find((x) => x.offsetParent); a.addEventListener('click', (e) => e.preventDefault(), { once: true }); a.click(); });
    await p.waitForTimeout(2500);
    ok((await events(p)).includes('gtm.linkClick') && hitWith(hits.slice(n0), L.tel).length > 0, `${name}: phone click → Google Ads "call" conversion fires`);
    // 2) WhatsApp click (hero button)
    const n1 = hits.length;
    const [pop] = await Promise.all([p.waitForEvent('popup', { timeout: 8000 }).catch(() => null), p.locator('#cgx .hero a[data-wa]').first().click()]);
    if (pop) await pop.close();
    await p.waitForTimeout(2500);
    const evWa = await events(p);
    ok(evWa.includes('Click to Chat'), `${name}: WhatsApp click → "Click to Chat" event`);
    ok(hitWith(hits.slice(n1), L.wa).length > 0, `${name}: WhatsApp click → Google Ads WhatsApp conversion fires`);
    // 3) empty form: no conversion
    const n2 = hits.length;
    await p.locator('#cgx .hero-form [type=submit]').click(); await p.waitForTimeout(1500);
    ok(!(await events(p)).includes('gtm.formSubmit') && hitWith(hits.slice(n2), L.form).length === 0, `${name}: empty form → no form event, no conversion`);
    // 4) real-looking lead (answered locally)
    const f = p.locator('#cgx #callback form');
    await f.evaluate((x) => x.scrollIntoView({ block: 'center' }));
    await f.locator('[name=name]').fill('בדיקת מעקב'); await f.locator('[name=phone]').fill('050-000 0000');
    const sel = f.locator('[name=issue]'); if (await sel.count()) await sel.selectOption({ index: 1 });
    await f.locator('[name=consent]').check();
    const n3 = hits.length;
    await Promise.all([p.waitForURL(/\/tnx\//, { timeout: 15000 }).catch(() => {}), f.locator('[type=submit]').click()]);
    await p.waitForTimeout(2500);
    const formHits = hitWith(hits.slice(n3), L.form);
    ok(leads.length === 1 && leads[0].includes('name="form_id"\r\n\r\n0b89619') && leads[0].includes('TEST-GTM-CHECK'), `${name}: form posts the lead to the Elementor form with the gclid`);
    ok(formHits.length > 0, `${name}: form submit → Google Ads form conversion fires`);
    ok(formHits.some((h) => /[?&](em|ph|ecsid|ec_mode|eme)=|user_data|_tu=|&ec=/.test(h)) || hits.slice(n3).some((h) => /ph=|em=/.test(h)), `${name}: conversion carries enhanced-conversion data`);
    ok(p.url().includes('/tnx/'), `${name}: visitor lands on the thank-you page (${decodeURI(p.url())})`);
    const gcs = (formHits[0] || '').match(/[?&]gcs=([^&\s]+)/);
    console.log(`   consent state on the conversion: ${gcs ? gcs[1] : 'n/a'} | Ads/GA requests recorded: ${hits.length}`);
    const realErrs = errs.filter((e) => !/Failed to load|ERR_/.test(e));
    ok(realErrs.length === 0, `${name}: no script errors${realErrs.length ? ' — ' + realErrs.slice(0, 3).join(' | ') : ''}`);
    await ctx.close();
  }
  // phone: WhatsApp from the bottom bar
  console.log('\n=== phone ===');
  for (const [name, url] of PAGES) {
    const { ctx, p, hits } = await open(b, url, true);
    const n = hits.length;
    const covered = await p.evaluate(() => { const a = document.querySelector('#cgx .mbar a[data-wa]'); const r = a.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return t && !a.contains(t) ? (t.closest('[id]') || t).id || t.className : ''; }); console.log('   bottom bar covered by:', covered || 'nothing'); const nb = p.locator('#cg-pgck button').first(); if (await nb.count() && await nb.isVisible().catch(() => false)) await p.locator('#cg-pgck button:has-text("הבנתי")').first().tap().catch(() => {}); await p.waitForTimeout(400); const [pop] = await Promise.all([p.waitForEvent('popup', { timeout: 8000 }).catch(() => null), p.locator('#cgx .mbar a[data-wa]').tap({ timeout: 8000 }).catch((e) => console.log('   tap failed', e.message.split('\n')[0]))]);
    if (pop) await pop.close();
    await p.waitForTimeout(2500);
    ok((await events(p)).includes('Click to Chat') && hitWith(hits.slice(n), L.wa).length > 0, `${name} (phone): bottom WhatsApp bar → WhatsApp conversion fires`);
    await ctx.close();
  }
  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
