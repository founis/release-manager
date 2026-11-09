# CyberGuard — homepage and WhatsApp page

A redesign of cyberguard.co.il, built with the cc-design skill
(`.claude/skills/cc-design`). The homepage is live (page 5940). The WhatsApp
landing page (`/וואטסאפ-חדש/`, page 4608) is built and tested here, waiting to
go live.

## Files

- `design/CyberGuard Home.html` — the page. Open it in a browser; it loads
  `logo.webp`, `hero.webp`, `img/` and `thumbs/` from this folder.
- `design/CyberGuard WhatsApp.html` — the WhatsApp landing page. Built from the
  homepage (same styles, header, footer, scripts) by `scripts/build_wa.py`; its
  own sections are in `whatsapp-src/` and its FAQ and guide links in
  `data/whatsapp-faq.json`. All copy comes from the current live page.
- `wordpress/קוד-לעמוד-וואטסאפ.html` — the WhatsApp page as WordPress content.
- `wordpress/קוד-לעמוד-וורדפרס.html` — the homepage as WordPress post content
  (one Custom HTML block). All CSS is scoped under `#cgx`, so it doesn't touch
  the rest of the site. Images load from cyberguard.co.il/wp-content/uploads.
  Use template "Elementor Canvas"; set visibility to password-protected or
  private for a preview.
- `data/` — the 42 reviews and 22 video stories taken from the live site, and
  `live-site-audit.json` (crawl of all 155 live URLs, Nov 2026).
- `scripts/` — the converter and the browser tests.

## Live

Page 5940 (template Elementor Canvas) is the site's front page
(`page_on_front`). Its Yoast title and description were copied from the old
front page, 1044. To roll back, set `page_on_front` to 1044 again.
`scripts/livetest_home.js` checks the live homepage on phone and desktop.

## Lead forms

On cyberguard.co.il every lead form posts to the site's existing Elementor
lead form, the site-wide popup form (post 5777, form `0b89619`). That form has
the same email recipients, Make webhook and `/tnx/` redirect as the old
homepage and WhatsApp-page forms. So each lead is saved in Elementor
submissions, emailed, sent to Make, and lands on the thank-you page, with the
ad click ids the site already stores (`cg_gclid`, `cg_gbraid`, `cg_wbraid`,
`cg_utm_*`).

Notes:
- `queried_id` is the page the visitor is on, read from the body class.
- The phone goes as 10 digits, with `+972` turned into `0`. A Code Snippets rule
  on the site rejects anything else.
- The forms are `method="post"`, so the Maspik anti-spam scripts add their
  honeypot and signals fields; those are passed on with the lead.
- Off the live domain, or if the site rejects the lead, the details open in
  WhatsApp instead.

`scripts/leadtest.js <page> <page-id>` runs every lead form against a mocked
endpoint on the live domain. `scripts/watest.js` covers the WhatsApp page; set
`MASPIK_DIR` to a folder with the plugin's `maspik-guard.js` and `signals.js`
to include the anti-spam check.

Notes for the WordPress version:
- WordPress content filters rewrite some `&&` inside inline scripts, so the
  converter ships the page script base64-encoded in a `data-cgx` attribute.
- The site injects its own ticker (`.cg-tk`) and bottom dock (`.cg-pgdock`) on
  every page; the page CSS hides those two on this page only. The cookie
  banner and accessibility button stay.

## Rebuild

```bash
python3 -I scripts/build_wa.py "design/CyberGuard Home.html" whatsapp-src data/whatsapp-faq.json "design/CyberGuard WhatsApp.html"
python3 -I scripts/to_wp.py "design/CyberGuard Home.html" data/videos.txt "wordpress/קוד-לעמוד-וורדפרס.html"
python3 -I scripts/to_wp.py "design/CyberGuard WhatsApp.html" data/videos.txt "wordpress/קוד-לעמוד-וואטסאפ.html"
```

The converter also marks the script `nowprocket` so WP Rocket's "Delay JS"
leaves it alone.

## Tests (Playwright)

```bash
node scripts/interact.js "design/CyberGuard Home.html" x   # quick check, forms, reviews, video
node scripts/casestest.js "design/CyberGuard Home.html"    # 22 video stories + "more"
node scripts/menutest.js  "design/CyberGuard Home.html" x  # mobile menu
node scripts/v8test.js    "design/CyberGuard Home.html"    # rotating headline, vCard, catch-all
node scripts/motiontest.js "design/CyberGuard Home.html"   # ticker / review wall / hero move
node scripts/qa.js "design/CyberGuard Home.html" <path-to>/axe.min.js  # reduced motion, CLS, axe
node scripts/watest.js "design/CyberGuard WhatsApp.html"   # WhatsApp page: situations, phone, timeline, forms, reviews
node scripts/leadtest.js "design/CyberGuard Home.html" 5940 # lead forms → Elementor form → /tnx/
node .claude/skills/cc-design/scripts/verify.js "cyberguard-site/design/CyberGuard Home.html" --widths 320,390,1440
```

## Open items

- "32 פניות חדשות ב-7 הימים האחרונים" is copied from the live site; connect it
  to the same live number.
- Upload `CyberGuard.vcf` as a file so "save our number" works on every phone.
