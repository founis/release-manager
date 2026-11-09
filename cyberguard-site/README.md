# CyberGuard — new homepage (design draft)

A redesign of the cyberguard.co.il homepage, built with the cc-design skill
(`.claude/skills/cc-design`). Nothing here is live on the site yet.

## Files

- `design/CyberGuard Home.html` — the page. Open it in a browser; it loads
  `logo.webp`, `hero.webp`, `img/` and `thumbs/` from this folder.
- `wordpress/קוד-לעמוד-וורדפרס.html` — the same page as WordPress post content
  (one Custom HTML block). All CSS is scoped under `#cgx`, so it doesn't touch
  the rest of the site. Images load from cyberguard.co.il/wp-content/uploads.
  Use template "Elementor Canvas"; set visibility to password-protected or
  private for a preview.
- `data/` — the 42 reviews and 22 video stories taken from the live site, and
  `live-site-audit.json` (crawl of all 155 live URLs, Nov 2026).
- `scripts/` — the converter and the browser tests.

## Live preview

Published as page 5940, https://cyberguard.co.il/home-preview-2026/
(password-protected, template Elementor Canvas). The homepage is unchanged.
`scripts/livetest.js` checks the live page on phone and desktop.

Notes for the WordPress version:
- WordPress content filters rewrite some `&&` inside inline scripts, so the
  converter ships the page script base64-encoded in a `data-cgx` attribute.
- The site injects its own ticker (`.cg-tk`) and bottom dock (`.cg-pgdock`) on
  every page; the page CSS hides those two on this page only. The cookie
  banner and accessibility button stay.

## Rebuild the WordPress version

```bash
python3 -I scripts/to_wp.py "design/CyberGuard Home.html" data/videos.txt wordpress/out.html
```

## Tests (Playwright)

```bash
node scripts/interact.js "design/CyberGuard Home.html" x   # quick check, forms, reviews, video
node scripts/casestest.js "design/CyberGuard Home.html"    # 22 video stories + "more"
node scripts/menutest.js  "design/CyberGuard Home.html" x  # mobile menu
node scripts/v8test.js    "design/CyberGuard Home.html"    # rotating headline, vCard, catch-all
node scripts/motiontest.js "design/CyberGuard Home.html"   # ticker / review wall / hero move
node scripts/qa.js "design/CyberGuard Home.html" <path-to>/axe.min.js  # reduced motion, CLS, axe
node .claude/skills/cc-design/scripts/verify.js "cyberguard-site/design/CyberGuard Home.html" --widths 320,390,1440
```

## Before going live

- Lead forms currently hand the details to WhatsApp. On the live site, post
  them to the existing Elementor form so the ad-tracking hidden fields
  (gclid, utm_*) keep working.
- "32 פניות חדשות ב-7 הימים האחרונים" is copied from the live site; connect it
  to the same live number.
- Upload `CyberGuard.vcf` as a file so "save our number" works on every phone.
