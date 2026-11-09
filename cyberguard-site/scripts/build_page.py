"""Build a service landing page from the homepage design (same CSS, header, footer, scripts).
usage: python3 -I build_page.py <home.html> <config.json> <out.html>
config paths (src, faq) are relative to the config file. See pages/*.json."""
import json, os, re, sys, html
home, cfg_path, out = sys.argv[1:4]
cfg = json.load(open(cfg_path, encoding='utf-8'))
base = os.path.dirname(os.path.abspath(cfg_path))
src = os.path.join(base, cfg['src'])
rd = lambda n: open(os.path.join(src, n), encoding='utf-8').read()
faq = json.load(open(os.path.join(base, cfg['faq']), encoding='utf-8'))
s = open(home, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    assert old in s, old[:80]
    s = s.replace(old, new) if count == 0 else s.replace(old, new, count)


# head
rep('<title>CyberGuard — שחרור ושחזור חשבונות</title>', f"<title>{html.escape(cfg['title'], False)}</title>")
rep('content="ליווי מקצועי וזהיר בבעיות גישה לחשבונות פייסבוק, אינסטגרם, וואטסאפ ומנהל מודעות. שיחת בדיקה ראשונית ללא התחייבות."',
    f"content=\"{html.escape(cfg['desc'])}\"")
rep('</style>', rd('page.css') + '</style>')

# extra icons
ICONS = {
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'ban': '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
    'alert': '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    'key': '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14.5 8.5l2 2"/>',
    'x': '<path d="M18 6 6 18M6 6l12 12"/>',
    'book': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    'search': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    'users': '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 3.1a4 4 0 0 1 0 7.8M22 21a7 7 0 0 0-5-6.7"/>',
    'device': '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
    'image': '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    'store': '<path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18"/><path d="M9 20v-6h6v6"/>',
    'trash': '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    'sim': '<path d="M6 2h9l5 5v15H6z"/><rect x="9" y="11" width="6" height="7" rx="1"/>',
}
sprite = ''.join(f'\n  <symbol id="i-{k}" viewBox="0 0 24 24">{v}</symbol>' for k, v in ICONS.items())
BRANDS = {'linkedin': ('0 0 448 512', 'M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z')}
for k in cfg.get('brands', []):
    vb, d = BRANDS[k]
    sprite += f'\n  <symbol id="p-{k}" viewBox="{vb}"><path d="{d}"></path></symbol>'
rep('  <symbol id="p-facebook"', sprite.lstrip('\n') + '\n  <symbol id="p-facebook"')

# header + mobile menu
H = 'https://cyberguard.co.il/'
rep('<a class="brand" href="#top">', f'<a class="brand" href="{H}">', 0)
if cfg.get('nav_current_wa'):
    rep('<a href="https://cyberguard.co.il/וואטסאפ-חדש/">שחרור וואטסאפ</a>\n    <a href="#services">השירותים שלנו</a>',
        '<a href="#top" aria-current="page">שחרור וואטסאפ</a>\n    <a href="https://cyberguard.co.il/שירותים/">השירותים שלנו</a>')
else:
    rep('<a href="#services">השירותים שלנו</a>', '<a href="https://cyberguard.co.il/שירותים/">השירותים שלנו</a>')
rep('<a href="#about">קצת עלינו</a>\n    <a href="#contact">צור קשר</a>', '<a href="https://cyberguard.co.il/קצת-עלינו/">קצת עלינו</a>\n    <a href="#contact">צור קשר</a>')
m = re.search(r'<div class="mnav-links">.*?</div>', s, re.S)
s = s[:m.start()] + '<div class="mnav-links">' + ''.join(f'<a href="{h}">{t}<span aria-hidden="true">←</span></a>' for h, t in cfg['mnav_links']) + '</div>' + s[m.end():]
if cfg.get('nav_current_wa'):
    rep('<div class="mnav-more"><a href="https://cyberguard.co.il/וואטסאפ-חדש/">שחרור וואטסאפ</a>', f'<div class="mnav-more"><a href="{H}">עמוד הבית</a>')
else:
    rep('<div class="mnav-more"><a href="https://cyberguard.co.il/וואטסאפ-חדש/">שחרור וואטסאפ</a>', f'<div class="mnav-more"><a href="{H}">עמוד הבית</a><a href="https://cyberguard.co.il/וואטסאפ-חדש/">שחרור וואטסאפ</a>')

# main
cases = re.findall(r'      <article class="case"[^>]*>.*?</article>', s, re.S)
assert len(cases) == 22
first = cfg.get('cases_first')
order = ([c for c in cases if f'pi sm {first}' in c] + [c for c in cases if f'pi sm {first}' not in c]) if first else cases
def vis(c, i):
    c = c.replace('<article class="case" hidden data-reveal>', '<article class="case" data-reveal>')
    return c if i < 6 else c.replace('<article class="case" data-reveal>', '<article class="case" hidden data-reveal>')
CASES = '\n'.join(vis(c, i) for i, c in enumerate(order))
FAQ = '\n'.join(f'        <details{" open" if i == 0 else ""}><summary>{html.escape(x["q"], False)}<span class="pm" aria-hidden="true"></span></summary><p>{html.escape(x["a"], False)}</p></details>' for i, x in enumerate(faq['items']))
GUIDES = '\n'.join(f'      <a class="guide" data-reveal href="{g["h"]}"><span class="badge"><svg class="ico"><use href="#i-book"/></svg></span><b>{html.escape(g["t"], False)}</b><span class="g-go" aria-hidden="true">←</span></a>' for g in faq['guides'])
ld = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': x['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': x['a']}} for x in faq['items']]}
LD = '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False).replace('</', '<\\/') + '</script>'
main = rd('main.html').replace('@@SELECT@@', cfg['select']).replace('@@WA_SELECT@@', cfg['select']).replace('@@CASES@@', CASES).replace('@@FAQ@@', FAQ).replace('@@GUIDES@@', GUIDES).replace('@@LDJSON@@', LD)
assert '@@' not in main
a, b = s.index('<main id="top">'), s.index('</main>') + len('</main>')
s = s[:a] + main.rstrip('\n') + s[b:]
for old, new in cfg.get('footer_replace', []):
    rep(old, new)

# script
rep("const LIVE = ['זמינים עכשיו לבדיקה ראשונית חינם', '32 פניות חדשות ב-7 הימים האחרונים', 'ליווי אישי בערוצים הרשמיים'];",
    'const LIVE = ' + json.dumps(cfg['live'], ensure_ascii=False).replace('", "', "', '").replace('["', "['").replace('"]', "']") + ';')
rep("const PAINS = ['החשבון שלך נחסם?', 'פרצו לך לאינסטגרם?', 'הוואטסאפ נחסם?', 'הפייסבוק הושבת?', 'מנהל המודעות נחסם?', 'שינו לך את הסיסמה?', 'לא מצליח להתחבר?'];",
    'const PAINS = ' + json.dumps(cfg['pains'], ensure_ascii=False).replace('", "', "', '").replace('["', "['").replace('"]', "']") + ';')
rep("const DEFAULT_MSG = 'היי, הגעתי מהאתר ואני צריך עזרה עם חשבון';", f"const DEFAULT_MSG = '{cfg['default_msg']}';")
if cfg.get('review_filter', 'all') != 'all':
    rep("let filter = 'all', shown = PAGE;", f"let filter = '{cfg['review_filter']}', shown = PAGE;")
rep("lines = ['היי, הגעתי מהאתר ואשמח שתחזרו אליי.'", f"lines = ['{cfg['lead_intro']}'")
qa, qb = s.index('/* Quick check: 3 questions'), s.index('/* Review wall: two rows')
s = s[:qa] + s[qb:]
rep("e.target.closest('.svc-card,.promise,.case,.feature')", "e.target.closest('.svc-card,.promise,.case,.feature,.sit,.guide,.quote,.tl-card')")
rep("document.querySelectorAll('.svc-card, .case, .promise').forEach((c) => {", "document.querySelectorAll('.case, .promise, .guide').forEach((c) => {")
rep('</script>\n</body>', rd('page.js') + '</script>\n</body>')
open(out, 'w', encoding='utf-8').write(s)
print('ok', len(s))
