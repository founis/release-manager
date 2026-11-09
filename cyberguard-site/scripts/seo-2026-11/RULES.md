# Rules for rewriting and merging CyberGuard blog posts (cyberguard.co.il)

CyberGuard is a private Israeli company. It guides people through the official recovery routes when they lose access to WhatsApp, Instagram, Facebook, TikTok, Telegram, Gmail, phones, etc. The blog brings in most of the leads. Google traffic to these clusters fell after the 2025–2026 core updates. The audit (`../../seo/article-audit.md`, section 5 and section 9 per post) and the Google guidelines research (`../../seo/google-updates.md`) explain why. Read the parts for your posts.

You write the new **post_content** (WordPress HTML) for each HUB in your cluster brief. You do not publish anything. You only write files.

## What to produce, per hub
1. `../out/<wp_id>.html`: the full new post_content.
2. `../out/<wp_id>.json` with these keys:
   - `wp_id`
   - `meta_description`: Hebrew, 120–155 characters, no phone number, answers the query.
   - `excerpt`: same text as `meta_description`, or a shorter version.
   - `merged_from`: list of the source wp_ids whose material you carried in.
   - `faq`: list of `{q, a}` exactly as in the FAQ section, as plain text.
   - `summary_he`: 2–3 lines in Hebrew on what changed.
   - `facts_to_verify`: any claim you were not sure of.
   - `official_links_used`.

## REWRITE vs KEEP+IMPROVE
- **REWRITE:** a new article, built on the audit's `add`/`remove` and your judgement. Keep what is accurate and useful from the current text and the merge sources. Drop filler and duplication.
- **KEEP+IMPROVE:** keep the existing structure and most of the text. Do the following:
  - Integrate the unique, useful material from the MERGE sources as a section or paragraphs, without duplicates.
  - Apply the audit's `add`/`remove` items.
  - Fix links to merged URLs.
  - Remove the phone number from the body.
- **MERGE sources:** they will 301 to the hub. Carry over only what adds something: a distinct sub-case, a step, an FAQ that people really ask. Never paste a source wholesale. Their top queries should be answered somewhere in the hub, for example with a short sub-section whose H3 uses that wording.

## Writing (Hebrew)
- Natural Israeli Hebrew. Address the reader in plural ("אתם").
  - Short sentences.
  - No machine filler such as "ראשית", "בנוסף", "למעשה", "כתוצאה מכך", "לסיכום", "חשוב לציין", "בעידן הדיגיטלי".
  - No keyword stuffing; the main phrase appears naturally a few times.
- **Answer first.** The first paragraph (2–3 sentences) answers the query directly. Keep it a plain `<p>`: the template styles the first `<p>` as the lead and inserts the "official free route" box right after it.
- **Then:**
  - which situation you are in (often a short decision list or a table),
  - the official steps for each situation, with exact in-app paths where you know them,
  - common mistakes,
  - "when the official route is not enough" (one honest paragraph),
  - FAQ,
  - related articles.
- **Length:** REWRITE hubs about 900–1,500 words. KEEP+IMPROVE hubs grow only as much as the merged material requires.
- **Do not invent anything:**
  - statistics, success rates, numbers of clients or cases;
  - response times you cannot source;
  - prices;
  - testimonials;
  - "real cases";
  - screenshots.

  If the source text contains a concrete first-hand observation, you may keep it, phrased carefully. Otherwise write in general terms, and list in `facts_to_verify` what the owner could add from experience.
- **Describe the service honestly:**
  - CyberGuard does diagnosis, guidance and preparing appeals through the platforms' official channels.
  - It has no special access to Meta, Google or any other platform.
  - It never asks for passwords or verification codes.
  - Do not write "תשלום רק על הצלחה", "98%", "100%" or "מומחים עם גישה".
  - Mention CyberGuard at most twice in the body: once in "when it is not enough", and optionally once in the FAQ ("מתי כדאי לפנות לליווי?").
- Do **not** put the phone number 052-3001030 or WhatsApp links in the body. The template already has the CTA card, the inline CTA, the service box and the mobile dock.

## HTML format (the article template and its content filter depend on this)
- **Elements:**
  - Allowed: `<p>`, `<h2>`, `<h3>`, `<ul>`/`<ol>`/`<li>`, `<strong>`, `<a>`, `<table>` with `<thead>`/`<tbody>`/`<tr>`/`<th>`/`<td>`, `<blockquote>`.
  - Not allowed: `<h1>`, `<div>`, inline styles, scripts, Gutenberg comments, emoji in headings.
- **H2 sections:** at least 5, so the template's inline CTA (inserted before the 3rd H2) lands mid-article.
- **FAQ:** exactly `<h2>שאלות נפוצות</h2>` followed by 3–5 pairs of `<h3>שאלה?</h3>` + `<p>תשובה</p>` (or a `<ul>`). Nothing else inside the FAQ. The filter turns these pairs into an accordion.
- **After the FAQ:** `<h3>מאמרים קשורים</h3><ul><li><a href="…">…</a></li>…</ul>` with 3–5 links. Nothing after that list.
- **Internal links:**
  - Absolute `https://cyberguard.co.il/<hebrew-slug>/` URLs, from `briefs/allowed-links.txt` only.
  - 3–8 contextual links in the body, plus the related list.
  - Never link to a URL that is being merged (all MERGE sources across the site), or to the post itself.
  - At most one contextual link to the matching service page. The template adds a service box before the FAQ anyway.

## Official links you may use (verified on 9.11.2026)
| Platform | Links |
|---|---|
| Facebook | https://www.facebook.com/hacked · https://www.facebook.com/login/identify · https://www.facebook.com/help/ |
| Meta business | https://www.facebook.com/business/help |
| Instagram | https://www.instagram.com/hacked/ · https://help.instagram.com/ |
| WhatsApp | https://faq.whatsapp.com/ · https://www.whatsapp.com/contact/ |
| Telegram | https://telegram.org/support · https://t.me/SpamBot |
| TikTok | https://support.tiktok.com/he |
| Google | https://accounts.google.com/signin/recovery · https://support.google.com/accounts/answer/7682439 · https://www.google.com/android/find |
| Apple | https://support.apple.com/he-il/118430 (forgot iPhone passcode) |
| LinkedIn | https://www.linkedin.com/help/linkedin |

You may use another official help-center URL only if you fetched it yourself and it loaded the right page; list it in `official_links_used`. In-app paths, such as "הגדרות ← מרכז החשבונות ← סיסמה ואבטחה", are fine when you are confident they are current; otherwise describe them more generally. Israel's national cyber hotline is **119**: mention the number, no link.

## Before you finish
For each output, check:
- the HTML parses;
- there are no `<div>` tags and no phone number;
- every `<a href>` is either in allowed-links.txt or in the official list;
- the FAQ format is exact;
- the word count is in range.

Reply with a short table: wp_id, words, merged_from, and the 1–2 riskiest facts to verify.
