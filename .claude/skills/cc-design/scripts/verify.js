#!/usr/bin/env node
/**
 * verify.js — Structural check + screenshots without Playwright MCP.
 *
 * Use it when the session has no mcp__playwright__* tools. It loads a page at
 * one or more widths and reports what Phase 1 of verification-protocol.md asks
 * for, then writes screenshots you can open with the Read tool for Phase 2.
 *
 * Usage:
 *   node verify.js <file.html | https://url> [--out dir] [--widths 1440,390] [--wait 800]
 *
 * Reports, per width:
 *   - console errors / warnings and uncaught page errors
 *   - failed requests and HTTP responses >= 400 (marked third-party when off-origin)
 *   - horizontal overflow (RTL pages overflow to the left, so both sides are checked)
 *   - <html lang/dir>, and whether Hebrew text is present but the page is not RTL
 *   - the font each heading/body actually asks for, and whether it covers Hebrew
 *   - text smaller than 12px, and (at widths < 600) tap targets smaller than 44px
 * Writes <out>/<name>-<width>-fold.png (first screen) and -full.png (whole page).
 * Exit code 1 when an error-level problem was found, else 0.
 */

const fs = require('fs');
const path = require('path');

function parse(argv) {
  const opts = { target: '', out: 'verify-shots', widths: '1440,390', wait: '800' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--') && argv[i + 1] !== undefined) opts[a.slice(2)] = argv[++i];
    else if (!opts.target) opts.target = a;
  }
  return opts;
}

async function main() {
  const opts = parse(process.argv);
  if (!opts.target) {
    console.error('Usage: node verify.js <file.html | https://url> [--out dir] [--widths 1440,390] [--wait 800]');
    process.exit(2);
  }

  let url = opts.target;
  if (!/^https?:\/\//i.test(url) && !url.startsWith('file://')) {
    const p = path.resolve(url);
    if (!fs.existsSync(p)) { console.error(`Not found: ${p}`); process.exit(2); }
    url = 'file://' + p;
  }
  const origin = url.startsWith('file://') ? 'file://' : new URL(url).origin;
  const name = (url.startsWith('file://') ? path.basename(url, '.html') : new URL(url).hostname)
    .replace(/[^\w.-]+/g, '_') || 'page';
  const widths = opts.widths.split(',').map(Number).filter(Boolean);
  fs.mkdirSync(opts.out, { recursive: true });

  let chromium;
  try { ({ chromium } = require('playwright')); } catch {
    console.error('Playwright not found. Install it: npm install playwright && npx playwright install chromium');
    process.exit(2);
  }
  const browser = await chromium.launch();
  let failed = false;

  for (const width of widths) {
    const mobile = width < 600;
    const ctx = await browser.newContext({
      viewport: { width, height: mobile ? 844 : 900 },
      deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile,
    });
    const page = await ctx.newPage();
    const errors = [], warnings = [], requests = [];
    const tag = (u) => (u.startsWith(origin) || u.startsWith('data:') ? '' : ' [third-party]');
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
      else if (m.type() === 'warning') warnings.push(m.text());
    });
    page.on('pageerror', (e) => errors.push('Uncaught: ' + e.message));
    page.on('requestfailed', (r) => requests.push(`FAILED ${r.url()}${tag(r.url())} (${r.failure()?.errorText})`));
    page.on('response', (r) => { if (r.status() >= 400) requests.push(`${r.status()} ${r.url()}${tag(r.url())}`); });

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch {
      await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    }
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(Number(opts.wait));

    const report = await page.evaluate(({ isMobile, vw }) => {
      // vw is the requested width: mobile Chrome widens the layout viewport to fit
      // overflowing content, so window.innerWidth would hide the overflow.
      const html = document.documentElement;
      const text = document.body ? document.body.innerText : '';
      const hasHebrew = /[֐-׿]/.test(text);
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
      };
      const label = (el) => {
        const id = el.id ? '#' + el.id : '';
        const cls = typeof el.className === 'string' && el.className.trim()
          ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
        return el.tagName.toLowerCase() + id + cls;
      };

      const overflow = [];
      if (html.scrollWidth > vw + 1) {
        const lw = window.innerWidth;
        const out = [...document.body.querySelectorAll('*')].filter((el) => {
          if (!visible(el)) return false;
          const r = el.getBoundingClientRect();
          return r.width > vw + 1 || r.left < -1 || r.right > lw + 1;
        });
        // Report the innermost offenders, not every ancestor that contains them.
        for (const el of out.filter((el) => !out.some((o) => o !== el && el.contains(o))).slice(0, 6)) {
          const r = el.getBoundingClientRect();
          overflow.push(`${label(el)} (width ${Math.round(r.width)}, left ${Math.round(r.left)}, right ${Math.round(r.right)})`);
        }
      }

      // Does the first font in the stack have a web font face covering the page's script?
      // (document.fonts.check() says "true" when no face covers the text at all, so it can't tell.)
      const sample = hasHebrew ? 0x05d0 : 0x61;
      const covers = (range, cp) => range.split(',').some((part) => {
        const m = part.trim().match(/^U\+([0-9A-F?]+)(?:-([0-9A-F]+))?$/i);
        if (!m) return false;
        const lo = parseInt(m[1].replace(/\?/g, '0'), 16);
        const hi = m[2] ? parseInt(m[2], 16) : m[1].includes('?') ? parseInt(m[1].replace(/\?/g, 'F'), 16) : lo;
        return cp >= lo && cp <= hi;
      });
      const faces = [...document.fonts];
      const fonts = {};
      for (const sel of ['h1', 'h2', 'body', 'button']) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const s = getComputedStyle(el);
        const first = s.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
        const own = faces.filter((f) => f.family.replace(/^["']|["']$/g, '') === first);
        const covering = own.filter((f) => covers(f.unicodeRange, sample));
        let state;
        if (!own.length) state = 'system';                  // not a web font: depends on the device
        else if (!covering.length) state = 'no-glyphs';     // web font lacks this script
        else if (!covering.some((f) => f.status === 'loaded')) state = 'not-loaded';
        else state = 'loaded';
        fonts[sel] = { family: s.fontFamily, size: s.fontSize, weight: s.fontWeight, state };
      }

      let smallText = 0;
      const smallSamples = [];
      for (const el of document.body.querySelectorAll('p,span,a,li,small,label,td,div,button')) {
        if (!visible(el) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 12) { smallText++; if (smallSamples.length < 3) smallSamples.push(`${label(el)} ${fs}px`); }
      }

      const smallTargets = [];
      if (isMobile) {
        for (const el of document.querySelectorAll('button,[role=button],input,select,a')) {
          if (!visible(el)) continue;
          const s = getComputedStyle(el);
          if (el.tagName === 'A' && s.display === 'inline') continue; // links inside running text
          const r = el.getBoundingClientRect();
          if (r.height < 44 || r.width < 44) smallTargets.push(`${label(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }

      return {
        title: document.title, lang: html.lang || '(none)', dir: html.dir || getComputedStyle(html).direction,
        hasHebrew, scrollWidth: html.scrollWidth, viewport: vw, overflow, fonts,
        smallText, smallSamples, smallTargets: smallTargets.slice(0, 8), smallTargetCount: smallTargets.length,
        pageHeight: html.scrollHeight,
      };
    }, { isMobile: mobile, vw: width });

    const fold = path.join(opts.out, `${name}-${width}-fold.png`);
    const full = path.join(opts.out, `${name}-${width}-full.png`);
    await page.screenshot({ path: fold });
    await page.screenshot({ path: full, fullPage: true });

    const problems = [];
    if (errors.length) problems.push('console errors');
    if (requests.some((r) => !r.includes('[third-party]'))) problems.push('failed first-party requests');
    if (report.overflow.length || report.scrollWidth > report.viewport + 1) problems.push('horizontal overflow');
    if (report.hasHebrew && report.dir !== 'rtl') problems.push('Hebrew text but page is not dir="rtl"');
    const script = report.hasHebrew ? 'Hebrew' : 'Latin';
    for (const [sel, f] of Object.entries(report.fonts)) {
      const fam = f.family.split(',')[0].trim();
      if (f.state === 'no-glyphs') problems.push(`${sel} font ${fam} has no ${script} glyphs — the text falls back to a system font`);
      if (f.state === 'not-loaded') problems.push(`${sel} font ${fam} did not load`);
    }
    if (problems.length) failed = true;

    console.log(`\n=== ${width}px${mobile ? ' (mobile)' : ''} — ${report.title || name} ===`);
    console.log(`lang=${report.lang} dir=${report.dir} hebrew=${report.hasHebrew} height=${report.pageHeight}px`);
    console.log(`Console errors (${errors.length}):${errors.length ? '\n  ' + errors.slice(0, 10).join('\n  ') : ' none'}`);
    console.log(`Console warnings (${warnings.length}):${warnings.length ? '\n  ' + warnings.slice(0, 5).join('\n  ') : ' none'}`);
    console.log(`Requests >=400 / failed (${requests.length}):${requests.length ? '\n  ' + requests.slice(0, 10).join('\n  ') : ' none'}`);
    console.log(`Horizontal overflow: ${report.scrollWidth > report.viewport + 1 ? `scrollWidth ${report.scrollWidth} > ${report.viewport}\n  ` + report.overflow.join('\n  ') : 'none'}`);
    const fontNote = {
      loaded: `web font loaded for ${script}`,
      system: 'system/generic font (looks different per device)',
      'no-glyphs': `NO ${script.toUpperCase()} GLYPHS in this web font`,
      'not-loaded': 'NOT LOADED',
    };
    for (const [sel, f] of Object.entries(report.fonts)) {
      console.log(`Font ${sel}: ${f.family} ${f.weight} ${f.size} — ${fontNote[f.state]}`);
    }
    console.log(`Text under 12px: ${report.smallText}${report.smallSamples.length ? ' e.g. ' + report.smallSamples.join(', ') : ''}`);
    if (mobile) console.log(`Tap targets under 44px: ${report.smallTargetCount}${report.smallTargets.length ? '\n  ' + report.smallTargets.join('\n  ') : ''}`);
    console.log(`Screenshots: ${fold}\n             ${full}`);
    console.log(problems.length ? `PROBLEMS: ${problems.join('; ')}` : 'Structural checks passed.');
    await ctx.close();
  }

  await browser.close();
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
