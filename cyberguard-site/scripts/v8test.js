const { chromium, devices } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  for (const [nm, ctx] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['phone', devices['iPhone 13']], ['small', { viewport: { width: 360, height: 740 }, isMobile: true }]]) {
    const p = await b.newPage({ ...ctx, acceptDownloads: true }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + encodeURI(path.resolve(process.argv[2])), { waitUntil: 'networkidle' });
    const pain = process.argv[3] || '#pain';
    // every pain phrase must fit on one line
    const lines = await p.evaluate((sel) => {
      const el = document.querySelector(sel); const lh = parseFloat(getComputedStyle(el).lineHeight);
      return ['החשבון שלך נחסם?', 'פרצו לך לאינסטגרם?', 'הוואטסאפ נחסם?', 'הפייסבוק הושבת?', 'מנהל המודעות נחסם?', 'שינו לך את הסיסמה?', 'לא מצליח להתחבר?'].map(t => { el.textContent = t; return [t, Math.round(el.getBoundingClientRect().height / lh)]; });
    }, pain);
    const multi = lines.filter(x => x[1] > 1);
    ok(multi.length === 0, `${nm}: all pain phrases fit one line ${multi.map(x => x[0]).join(', ')}`);
    await p.reload({ waitUntil: 'networkidle' });
    const t0 = await p.textContent(pain); await p.waitForTimeout(3400); const t1 = await p.textContent(pain);
    ok(t0 !== t1, `${nm}: pain line rotates ("${t0}" -> "${t1}")`);
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('.save-card [data-vcard]')]);
    const fp = await dl.path(); const v = fs.readFileSync(fp, 'utf8');
    ok(dl.suggestedFilename() === 'CyberGuard.vcf' && v.includes('TEL;TYPE=CELL:+972523001030') && v.includes('BEGIN:VCARD'), `${nm}: vCard downloads with the phone number`);
    ok(await p.isVisible('.save-toast'), `${nm}: confirmation toast shows`);
    const wa = await p.getAttribute('.svc-other .btn', 'href');
    ok(decodeURIComponent(wa).includes('לא מופיעה ברשימה'), `${nm}: "something else" opens WhatsApp with a message`);
    ok(errs.length === 0, `${nm}: no page errors ${errs.join(';')}`);
    await p.close();
  }
  await b.close();
})();
