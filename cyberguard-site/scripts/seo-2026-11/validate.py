"""Validate agent outputs in p2/out against RULES.md. usage: python3 -I validate.py [wp_id ...]"""
import json, os, re, sys, glob
from html.parser import HTMLParser
from urllib.parse import unquote
S = os.environ['S']; P = f'{S}/p2'
allowed = set()
for line in open(f'{P}/briefs/allowed-links.txt', encoding='utf-8'):
    if line.startswith('https://'): allowed.add(line.split(' ')[0].strip())
OFFICIAL = {'https://www.facebook.com/hacked', 'https://www.facebook.com/login/identify', 'https://www.facebook.com/help/', 'https://www.facebook.com/business/help',
            'https://www.instagram.com/hacked/', 'https://help.instagram.com/', 'https://faq.whatsapp.com/', 'https://www.whatsapp.com/contact/', 'https://telegram.org/support',
            'https://t.me/SpamBot', 'https://support.tiktok.com/he', 'https://accounts.google.com/signin/recovery', 'https://support.google.com/accounts/answer/7682439',
            'https://www.google.com/android/find', 'https://support.apple.com/he-il/118430', 'https://www.linkedin.com/help/linkedin'}
class T(HTMLParser):
    def __init__(s): super().__init__(); s.tags = []; s.hrefs = []; s.stack = []; s.err = []
    def handle_starttag(s, t, a):
        s.tags.append(t)
        if t == 'a': s.hrefs.append(dict(a).get('href', ''))
        if t not in ('br', 'img', 'hr'): s.stack.append(t)
    def handle_endtag(s, t):
        if t in ('br', 'img', 'hr'): return
        if s.stack and s.stack[-1] == t: s.stack.pop()
        else: s.err.append(f'unbalanced </{t}> (open: {s.stack[-3:]})')
ids = sys.argv[1:] or [os.path.basename(f)[:-5] for f in sorted(glob.glob(f'{P}/out/*.html'))]
report = {}
for i in ids:
    h = open(f'{P}/out/{i}.html', encoding='utf-8').read(); probs = []; warn = []
    try: meta = json.load(open(f'{P}/out/{i}.json', encoding='utf-8'))
    except Exception as e: meta = {}; probs.append(f'json: {e}')
    t = T(); t.feed(h); t.close()
    probs += t.err[:3]
    if t.stack: probs.append(f'unclosed {t.stack[-3:]}')
    for bad in ('div', 'h1', 'script', 'style', 'iframe'):
        if bad in t.tags: probs.append(f'<{bad}> present')
    if re.search(r'052-?3001030|0523001030|wa\.me', h): probs.append('phone/whatsapp in body')
    if 'style=' in h: probs.append('inline style')
    if '<!-- wp:' in h: probs.append('gutenberg comment')
    ext = []
    for u in t.hrefs:
        if u.startswith('https://cyberguard.co.il/'):
            if unquote(u) not in allowed: probs.append(f'link not allowed: {unquote(u)}')
        elif u.startswith('#'): pass
        else:
            if u not in OFFICIAL: ext.append(u)
    if ext: warn.append(f'external links to check: {ext}')
    m = re.search(r'<h2>שאלות נפוצות</h2>(.*?)(<h3>מאמרים קשורים</h3>|$)', h, re.S)
    if not m: probs.append('FAQ section missing/format')
    else:
        faq = m.group(1)
        qn = len(re.findall(r'<h3>', faq))
        if not 3 <= qn <= 6: warn.append(f'FAQ questions {qn}')
        if '<h2' in faq: probs.append('h2 inside FAQ')
    if not re.search(r'<h3>מאמרים קשורים</h3>\s*<ul>', h): probs.append('related list missing')
    tail = h.split('<h3>מאמרים קשורים</h3>')[-1]
    if re.search(r'</ul>\s*\S', tail.split('</ul>', 1)[-1] if '</ul>' in tail else ''): warn.append('content after related list')
    h2 = len(re.findall(r'<h2[\s>]', h))
    if h2 < 5: warn.append(f'only {h2} h2')
    if not h.lstrip().startswith('<p'): warn.append('does not start with <p>')
    words = len(re.sub(r'<[^>]+>', ' ', h).split())
    md = meta.get('meta_description', '')
    if not 90 <= len(md) <= 165: warn.append(f'meta_description length {len(md)}')
    if re.search(r'052|3001030', md): probs.append('phone in meta_description')
    for w in ('ראשית', 'לסיכום', 'כתוצאה מכך', 'בעידן הדיגיטלי', '98%', 'תשלום רק על הצלחה', '100%'):
        if w in h: warn.append(f'phrase: {w}')
    report[i] = {'words': words, 'h2': h2, 'merged_from': meta.get('merged_from'), 'problems': probs, 'warnings': warn}
    print(('OK  ' if not probs else 'BAD ') + i, words, 'words', 'merged', meta.get('merged_from'), '|', '; '.join(probs + warn)[:600])
json.dump(report, open(f'{P}/validate.json', 'w'), ensure_ascii=False, indent=1)
