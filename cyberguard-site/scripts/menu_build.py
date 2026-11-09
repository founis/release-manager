"""Rebuild the site header (Elementor template 1213, HTML widget cgh26w1) services menu: every service, in three groups.
usage: python3 -I menu_build.py <widget.html> <out.html>   (keeps the file's own line endings)"""
import re, sys
from urllib.parse import quote, unquote
src, dst = sys.argv[1:3]
hdr = open(src, encoding='utf-8', newline='').read()
st = hdr.rfind('</style>'); css, body = hdr[:st], hdr[st:]
a = body.find('<div class="cgh-svc">'); b = body.find('<div class="cgh-mega-foot', a)
blk = body[a:b]; blk_end = blk.rfind('</div>')
items = {unquote(m.group(1)).replace('https://cyberguard.co.il', ''): m.group(0) for m in re.finditer(r'<a href="([^"]+)">.*?</a>', blk[:blk_end], re.S)}
assert len(items) == 10, len(items)
U = lambda p: 'https://cyberguard.co.il' + quote(p)
TG = '<svg width="18" height="18" viewBox="0 0 496 512" fill="currentColor" aria-hidden="true"><path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5l-142 89.4-61.2-19.1c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z"/></svg>'
LI = '<svg width="18" height="18" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true"><path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"/></svg>'
BRIEF = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></svg>'
CLOCK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
def it(path, svg, title, small): return f'<a href="{U(path)}"><span class="cgh-ic">{svg}</span><span><b>{title}</b><small>{small}</small></span></a>'
def subs(pairs): return '<div class="cgh-sub">' + ''.join(f'<a href="{U(p)}">{t}</a>' for p, t in pairs) + '</div>'
FB = subs([('/פרצו-לי-לפייסבוק/', 'פרצו לי לפייסבוק'), ('/חשבון-פייסבוק-מושבת/', 'חשבון מושבת'), ('/שחרור-חשבון-פייסבוק-ללא-סיסמה/', 'בלי סיסמה'), ('/חשבון-פייסבוק-נחסם-בטעות/', 'נחסם בטעות')])
IG = subs([('/פרצו-לי-לאינסטגרם/', 'פרצו לי לאינסטגרם'), ('/חשבון-אינסטגרם-מושבת/', 'חשבון מושבת'), ('/ערעור-השבתת-חשבון-אינסטגרם/', 'ערעור על השבתה'), ('/שחרור-חשבון-אינסטגרם-ללא-סיסמא/', 'בלי סיסמה'), ('/חשבון-אינסטגרם-נחסם-בטעות/', 'נחסם בטעות')])
col1 = items['/וואטסאפ-חדש/'] + items['/שחרור-חשבון-פייסבוק/'] + FB + items['/שחרור-חשבון-אינסטגרם/'] + IG
col2 = (items['/שחרור-ads-manager-חסום/'] + items['/שחרור-עמוד-עסקי-פייסבוק/'] + items['/business-verification/']
        + it('/האימות-של-העסק-ב-meta/', CLOCK, 'אימות עסק שנתקע או נדחה', 'Meta דחתה או ביקשה מסמכים')
        + it('/שחרור-חשבון-אינסטגרם-עסקי/', BRIEF, 'אינסטגרם עסקי', 'פרופיל עסקי שנחסם או הושבת'))
col3 = (items['/שחרור-חשבון-gmail/'] + items['/שחרור-חשבון-יוטיוב/'] + items['/שחרור-חשבון-טיקטוק/']
        + it('/שחרור-חשבון-טלגרם/', TG, 'טלגרם', 'חשבון חסום (Banned) או פרוץ')
        + it('/שחזור-חשבון-לינקדאין/', LI, 'לינקדאין', 'חשבון פרוץ, חסום או מוגבל') + items['/שחרור-טלפון-ננעל/'])
new_blk = ('<div class="cgh-svc cgh-svc3">\n      <div class="cgh-col"><p class="cgh-colt">רשתות חברתיות</p>' + col1 + '</div>\n'
           '      <div class="cgh-col"><p class="cgh-colt">עסקים ופרסום</p>' + col2 + '</div>\n'
           '      <div class="cgh-col"><p class="cgh-colt">עוד פלטפורמות</p>' + col3 + '</div>\n     ')
body = body[:a] + new_blk + body[a + blk_end:]
j = body.find('<div class="cgh-msvc">'); k = body.find('</div>', j)
mi = lambda path, svg, title: f'\n     <a href="{U(path)}"><span class="cgh-ic">{svg.replace(chr(34) + "18" + chr(34), chr(34) + "16" + chr(34))}</span>{title}</a>'
body = body[:k] + mi('/שחרור-חשבון-טלגרם/', TG, 'טלגרם') + mi('/שחזור-חשבון-לינקדאין/', LI, 'לינקדאין') + '\n    ' + body[k:]
newcss = '''
/* 2026-11-09: services menu shows every service, in three groups (anchored to the header so the wide panel never leaves the screen) */
.cgh .cgh-in{position:relative}
.cgh .cgh-nav>ul>li.cgh-has{position:static}
.cgh .cgh-mega{width:min(960px,calc(100vw - 40px))}
.cgh .cgh-svc3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px 14px}
.cgh .cgh-col{display:flex;flex-direction:column;gap:2px;min-width:0}
.cgh .cgh-colt{margin:4px 12px 6px;font-size:12.5px;font-weight:800;letter-spacing:.02em;color:var(--v3);opacity:.85}
.cgh .cgh-sub{display:flex;flex-wrap:wrap;gap:2px 12px;padding:0 62px 8px 12px;margin-top:-4px}
.cgh .cgh-sub a{font-size:13px;font-weight:600;color:var(--tx3);padding:3px 0;transition:color .15s ease}
.cgh .cgh-sub a:hover,.cgh .cgh-sub a:focus-visible{color:#fff}
.cgh .cgh-svc3 .cgh-ic{width:34px;height:34px;border-radius:10px}
.cgh .cgh-svc3>.cgh-col>a{padding:8px 10px}
.cgh .cgh-svc3 b{font-size:14.5px}
.cgh .cgh-svc3 small{font-size:12.5px}
'''
if '\r\n' in hdr: newcss = newcss.replace('\n', '\r\n')
open(dst, 'w', encoding='utf-8', newline='').write(css + newcss + body)
print('desktop links', len(re.findall(r'<a href=', new_blk)), '| mobile links', len(re.findall(r'<a href=', body[j:body.find('</div>', j)])))
