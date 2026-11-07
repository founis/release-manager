# Hebrew & RTL Design

> **Load when:** The content, brand or audience is Hebrew (or any RTL language), or the existing site/app uses `dir="rtl"`
> **Skip when:** The artifact is LTR-only
> **Why it matters:** Every font in `frontend-design.md` is Latin-only. On a Hebrew page the browser silently falls back to Arial/Segoe for the Hebrew glyphs, which is exactly the generic look this skill tries to avoid. RTL also flips layout, icons and punctuation in ways that screenshots expose immediately.
> **Typical failure it prevents:** A "designed" page whose Hebrew renders in Arial, arrows that point backwards, phone numbers and prices scrambled by bidi, and an English-style eyebrow label that does nothing in Hebrew

## 1. Page setup

```html
<html lang="he" dir="rtl">
```

- Use logical CSS properties so the layout mirrors by itself: `margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `border-inline-start`, `text-align: start`. Avoid hard-coded `left`/`right`.
- Flexbox and grid already follow `dir`: the first item sits on the right. Don't reverse them by hand.
- Reading starts top-right. Logo top-right, main navigation from right to left, the hero image usually on the left with the text on the right.
- RTL overflow goes to the **left**. A stray wide element creates a horizontal scrollbar that starts scrolled to the right, so it's easy to miss — `scripts/verify.js` checks both sides.

## 2. Hebrew fonts (Google Fonts, all with a Hebrew subset)

| Tone | Headings | Body | Notes |
|------|----------|------|-------|
| Trust / professional (security, finance, legal) | `IBM Plex Sans Hebrew` 600–700 | `IBM Plex Sans Hebrew` 400 | Engineered, calm, less common than Heebo |
| Editorial / premium | `Frank Ruhl Libre` 500–700 | `Noto Sans Hebrew` 400 | Classic Hebrew serif headline over a clean sans |
| Bold / campaign | `Secular One` or `Suez One` (400 only) | `Assistant` 400 | Display faces have one weight — use size for hierarchy |
| Friendly / consumer | `Fredoka` 500–600 | `Rubik` 400 | Rounded and warm |
| Literary / elegant | `David Libre` 500–700 or `Bona Nova` | `Miriam Libre` 400 | Traditional book feel |
| Condensed display / posters | `Karantina` 700 | `Heebo` 400 | Tall, narrow, strong in big sizes only |

Weights available: IBM Plex Sans Hebrew 100–700 · Noto Sans/Serif Hebrew 100–900 · Heebo 100–900 · Frank Ruhl Libre 300–900 · Rubik 300–900 · Assistant 200–800 · Fredoka 300–700 · Miriam Libre 400–700 · David Libre 400/500/700 · Bona Nova 400/700 · Karantina 300/400/700 · Secular One, Suez One, Bellefair 400.

- **Heebo, Assistant and Rubik are the Inter of Israeli websites.** Fine for body text; if the brief is "look designed", give headings something with more character.
- **Pairing a Latin font:** fallback is per glyph, so `font-family: "Space Grotesk", "IBM Plex Sans Hebrew", sans-serif` draws English words and digits in Space Grotesk and Hebrew in Plex. Check the screenshot: if the x-heights clash, put the Hebrew font first.
- Load only the weights you use: `https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Hebrew:wght@400;600;700&display=swap`

## 3. Typography rules that differ from Latin

- **No capitals.** `text-transform: uppercase` and wide `letter-spacing` eyebrows ("FEATURES") do nothing in Hebrew. Mark a label with weight, size, color or a short rule instead.
- **No letter-spacing on Hebrew text.** It breaks the letter shapes. Keep `letter-spacing: 0` (tightening big display headings by −0.01em is the limit).
- **No real italics.** Hebrew fonts have no italic; the browser slants the glyphs. Emphasize with weight.
- **Size up.** Hebrew looks smaller than Latin at the same `font-size`: body 17–18px, line-height 1.6–1.7. Headings can stay tight (1.15–1.25).
- Digits are Western (0–9) and run left-to-right inside the sentence — that's normal.

## 4. Bidi: numbers, phones, prices, English words

- Phone numbers, emails, URLs, order/case numbers: wrap them so punctuation doesn't jump.
  ```html
  <a href="tel:+972501234567" dir="ltr">050-123-4567</a>
  <bdi>ABC-1234</bdi>
  ```
- Prices: write `350 ₪` (or `₪350`) — pick one and keep it. In JS: `new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(350)`.
- An English brand name at the start or end of a Hebrew sentence pushes the period to the wrong side. Wrap the name in `<bdi>` or reword so the sentence ends in Hebrew.
- Form fields for phone/email: `dir="ltr"` on the `<input>` and `inputmode="tel"` / `type="email"`; keep the label RTL.

## 5. Icons and motion

- Mirror directional icons: arrows, chevrons, "back/next", progress, send. `[dir="rtl"] .icon-dir { transform: scaleX(-1); }`
- Don't mirror icons that aren't directional: check marks, play/pause, clocks, logos, a phone handset, the WhatsApp mark.
- Carousels and slide-in animations come from the left in RTL ("next" moves leftwards).

## 6. Copy

- Write real Hebrew copy from the brand's own material — never lorem ipsum or "טקסט לדוגמה".
- Address the reader in plural (`בדקו`, `פנו אלינו`, `השאירו פרטים`). It's gender-neutral and the norm for Israeli marketing.
- Short, direct sentences. Hebrew marketing copy that is translated literally from English reads stiff.

## 7. Israeli small-business conventions

- **WhatsApp is the primary CTA** for most service businesses: `https://wa.me/972501234567?text=<encoded message>` (country code, no leading 0). On mobile, a sticky WhatsApp button in a bottom corner is expected — keep it ≥ 48px and clear of other floating controls (accessibility widgets, cookie bars).
- A `tel:` button next to it. Opening hours and response time near the CTA build trust.
- Trust signals people look for: real reviews with first names, number of cases handled, a clear price or price range, and what happens after they get in touch.
- Accessibility: Israeli law (תקנות נגישות) expects an accessibility statement page and WCAG AA contrast for business sites — leave room for the link in the footer.

## 8. Verify (adds to verification-protocol.md)

- `node <skill-dir>/scripts/verify.js page.html` reports `lang`/`dir`, warns on Hebrew text without `dir="rtl"`, and says whether the heading/body font actually loaded for Hebrew glyphs.
- On the screenshot: text is right-aligned, sentence-final punctuation is on the left end of the line, arrows point the right way, phone numbers read correctly, nothing sticks out on the left.
