"""Build the WhatsApp landing page from the homepage design (same CSS, header, footer, scripts).
usage: python3 -I build_wa.py <home.html> <wa-src-dir> <faq.json> <out.html>"""
import json, re, sys, html
home, src, faq_path, out = sys.argv[1:5]
s = open(home, encoding='utf-8').read()
rd = lambda n: open(f'{src}/{n}', encoding='utf-8').read()
faq = json.load(open(faq_path, encoding='utf-8'))

def rep(old, new, count=1):
    global s
    assert s.count(old) >= 1, old[:80]
    s = s.replace(old, new) if count == 0 else s.replace(old, new, count)

# head
rep('<title>CyberGuard — שחרור ושחזור חשבונות</title>', '<title>וואטסאפ - בדיקת חשבון וליווי מקצועי | CyberGuard</title>')
rep('content="ליווי מקצועי וזהיר בבעיות גישה לחשבונות פייסבוק, אינסטגרם, וואטסאפ ומנהל מודעות. שיחת בדיקה ראשונית ללא התחייבות."',
    'content="בדיקת בעיות גישה בחשבון וואטסאפ וליווי מקצועי וזהיר. שיחת בדיקה ראשונית ללא התחייבות."')
rep('</style>', rd('wa.css') + '</style>')

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
}
sprite = ''.join(f'\n  <symbol id="i-{k}" viewBox="0 0 24 24">{v}</symbol>' for k, v in ICONS.items())
rep('  <symbol id="p-facebook"', sprite.lstrip('\n') + '\n  <symbol id="p-facebook"')

# header + mobile menu
H = 'https://cyberguard.co.il/'
rep('<a class="brand" href="#top">', f'<a class="brand" href="{H}">', 0)
rep('<a href="https://cyberguard.co.il/וואטסאפ-חדש/">שחרור וואטסאפ</a>\n    <a href="#services">השירותים שלנו</a>',
    '<a href="#top" aria-current="page">שחרור וואטסאפ</a>\n    <a href="https://cyberguard.co.il/שירותים/">השירותים שלנו</a>')
rep('<a href="#about">קצת עלינו</a>\n    <a href="#contact">צור קשר</a>', '<a href="https://cyberguard.co.il/קצת-עלינו/">קצת עלינו</a>\n    <a href="#contact">צור קשר</a>')
m = re.search(r'<div class="mnav-links">.*?</div>', s, re.S)
links = [('#situations', 'מה קרה לחשבון?'), ('#dont', 'מה לא לעשות'), ('#process', 'איך זה עובד'), ('#reviews', 'לקוחות ממליצים'), ('#price', 'כמה זה עולה'), ('#faq', 'שאלות נפוצות'), ('#guides', 'מדריכים'), ('#contact', 'צור קשר')]
s = s[:m.start()] + '<div class="mnav-links">' + ''.join(f'<a href="{h}">{t}<span aria-hidden="true">←</span></a>' for h, t in links) + '</div>' + s[m.end():]
rep('<div class="mnav-more"><a href="https://cyberguard.co.il/וואטסאפ-חדש/">שחרור וואטסאפ</a>', f'<div class="mnav-more"><a href="{H}">עמוד הבית</a>')

# main
WA_SELECT = ('<select name="issue" required><option value="" disabled selected>בחרו מה קרה</option>'
  '<option value="שחרור חשבון וואטסאפ חסום">החשבון נחסם (זמנית)</option>'
  '<option value="שחרור חשבון וואטסאפ חסום לצמיתות">החשבון נחסם לצמיתות</option>'
  '<option value="שחרור חשבון וואטסאפ פרוץ">החשבון נפרץ</option>'
  '<option>WhatsApp Business נחסם</option><option>מישהו הפעיל אימות דו-שלבי (PIN)</option>'
  '<option>קוד האימות לא מגיע</option><option>לא בטוח/ה מה קרה</option></select>')
cases = re.findall(r'      <article class="case"[^>]*>.*?</article>', s, re.S)
assert len(cases) == 22
isw = lambda c: 'pi sm whatsapp' in c
order = [c for c in cases if isw(c)] + [c for c in cases if not isw(c)]
def vis(c, i):
    c = c.replace('<article class="case" hidden data-reveal>', '<article class="case" data-reveal>')
    return c if i < 6 else c.replace('<article class="case" data-reveal>', '<article class="case" hidden data-reveal>')
CASES = '\n'.join(vis(c, i) for i, c in enumerate(order))
FAQ = '\n'.join(f'        <details{" open" if i == 0 else ""}><summary>{html.escape(x["q"], False)}<span class="pm" aria-hidden="true"></span></summary><p>{html.escape(x["a"], False)}</p></details>' for i, x in enumerate(faq['items']))
GUIDES = '\n'.join(f'      <a class="guide" data-reveal href="{g["h"]}"><span class="badge"><svg class="ico"><use href="#i-book"/></svg></span><b>{html.escape(g["t"], False)}</b><span class="g-go" aria-hidden="true">←</span></a>' for g in faq['guides'])
ld = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': x['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': x['a']}} for x in faq['items']]}
LD = '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False).replace('</', '<\\/') + '</script>'
main = rd('main.html').replace('@@WA_SELECT@@', WA_SELECT).replace('@@CASES@@', CASES).replace('@@FAQ@@', FAQ).replace('@@GUIDES@@', GUIDES).replace('@@LDJSON@@', LD)
assert '@@' not in main
a, b = s.index('<main id="top">'), s.index('</main>') + len('</main>')
s = s[:a] + main.rstrip('\n') + s[b:]
rep('<li><a href="https://cyberguard.co.il/וואטסאפ-חדש/">וואטסאפ חסום או פרוץ</a></li>', f'<li><a href="{H}">עמוד הבית</a></li>')

# script
rep("const LIVE = ['זמינים עכשיו לבדיקה ראשונית חינם', '32 פניות חדשות ב-7 הימים האחרונים', 'ליווי אישי בערוצים הרשמיים'];",
    "const LIVE = ['שחרור חשבונות וואטסאפ חסומים', 'זמינים עכשיו לבדיקה ראשונית חינם', 'ליווי אישי בערוצים הרשמיים'];")
rep("const PAINS = ['החשבון שלך נחסם?', 'פרצו לך לאינסטגרם?', 'הוואטסאפ נחסם?', 'הפייסבוק הושבת?', 'מנהל המודעות נחסם?', 'שינו לך את הסיסמה?', 'לא מצליח להתחבר?'];",
    "const PAINS = ['חשבון הוואטסאפ שלך נחסם?', 'פרצו לך לוואטסאפ?', 'WhatsApp Business נחסם?', 'קוד האימות לא מגיע?', 'מישהו הפעיל קוד PIN?'];")
rep("const DEFAULT_MSG = 'היי, הגעתי מהאתר ואני צריך עזרה עם חשבון';", "const DEFAULT_MSG = 'היי, הגעתי מעמוד הוואטסאפ ואני צריך עזרה עם החשבון';")
rep("let filter = 'all', shown = PAGE;", "let filter = 'whatsapp', shown = PAGE;")
rep("lines = ['היי, הגעתי מהאתר ואשמח שתחזרו אליי.'", "lines = ['היי, הגעתי מעמוד הוואטסאפ ואשמח שתחזרו אליי.'")
# the quick check is not on this page
qa, qb = s.index('/* Quick check: 3 questions'), s.index('/* Review wall: two rows')
s = s[:qa] + s[qb:]
rep("e.target.closest('.svc-card,.promise,.case,.feature')", "e.target.closest('.svc-card,.promise,.case,.feature,.sit,.guide,.quote,.tl-card')")
rep("document.querySelectorAll('.svc-card, .case, .promise').forEach((c) => {", "document.querySelectorAll('.case, .promise, .guide').forEach((c) => {")
rep('</script>\n</body>', rd('wa.js') + '</script>\n</body>')
open(out, 'w', encoding='utf-8').write(s)
print('ok', len(s))
