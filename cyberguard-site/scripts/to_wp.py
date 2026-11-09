"""Turn the standalone page into WordPress post content scoped under #cgx.
usage: python3 -I to_wp.py <in.html> <videos.txt> <out.html>"""
import re, sys
src, videos_path, out = sys.argv[1:4]
s = open(src, encoding='utf-8').read()
P = '#cgx'
css = re.search(r'<style>(.*?)</style>', s, re.S).group(1)
# comments right before an @media rule would otherwise be read as part of a selector
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
body = re.search(r'<body>(.*?)</body>', s, re.S).group(1)
fonts = re.search(r'<link href="https://fonts\.googleapis\.com/css2[^"]+" rel="stylesheet">', s).group(0)

def prefix_sel(sel):
    sel = sel.strip()
    if sel in (':root', 'body'): return P
    if sel == 'html': return 'html'
    if sel.startswith(':root') or sel.startswith('body'): return P + sel.split(' ', 1)[1:] and P + ' ' + sel.split(' ', 1)[1] or P
    return f'{P} {sel}'

def walk(text):
    out, i, n = [], 0, len(text)
    while i < n:
        j = text.find('{', i)
        if j < 0: out.append(text[i:]); break
        head = text[i:j].strip()
        depth, k = 1, j + 1
        while depth:
            if text[k] == '{': depth += 1
            elif text[k] == '}': depth -= 1
            k += 1
        inner = text[j + 1:k - 1]
        if head.startswith('@property') or head.startswith('@font-face'):
            out.append(f'{head}{{{inner}}}')
        elif head.startswith('@media') or head.startswith('@supports'):
            out.append(f'{head}{{{walk(inner)}}}')
        elif head.startswith('@keyframes'):
            out.append(f'@keyframes cgx-{head.split()[1]}{{{inner}}}')
        else:
            sels = ','.join(prefix_sel(x) for x in head.split(','))
            out.append(f'{sels}{{{inner}}}')
        i = k
    return '\n'.join(out)

css2 = walk(css)
# every keyframe was renamed cgx-NAME; point every animation / animation-name at the new names
KF = set(re.findall(r'@keyframes\s+([\w-]+)', css))
def fix_anim(m):
    val = re.sub(r'(?<![\w-])(' + '|'.join(sorted(map(re.escape, KF), key=len, reverse=True)) + r')(?![\w-])', r'cgx-\1', m.group(2))
    return m.group(1) + val
if KF:
    css2 = re.sub(r'(animation(?:-name)?\s*:)([^;}]+)', fix_anim, css2)
left = [n for n in re.findall(r'animation(?:-name)?\s*:\s*([\w-]+)', css2) if n not in ('none', 'inherit', 'initial') and not n.startswith('cgx-')]
assert not left, f'unrenamed animations: {left}'
# page-level background so overscroll and gaps match
RESET = ('html,body{margin:0!important;background:oklch(0.165 0.028 278)!important}\n'
  # the site injects its own ticker and bottom dock on every page; this design has both, so hide the site's copies on this page only
  'body > .cg-tk,.cg-pgdock{display:none!important}\n'
  # on phones this page has its own bottom call/WhatsApp bar; keep the site's cookie notice above it instead of on top of it
  '@media (max-width:720px){#cg-pgck{bottom:calc(84px + env(safe-area-inset-bottom))!important}}\n'
  # the site's Elementor kit and Hello theme style a/h1-h4/label/input/button directly; undo that inside #cgx only
  '#cgx :is(a,h1,h2,h3,h4,h5,h6,p,span,b,small,em,i,li,ul,ol,label,input,select,option,button,blockquote,div,nav,header,footer,section,aside,article,figure){font-family:inherit;line-height:inherit;letter-spacing:inherit;text-transform:none}\n'
  '#cgx button{padding:0;border-radius:0;font-weight:inherit;text-align:center}\n'
  '#cgx a:hover,#cgx a:focus{color:inherit}\n')
css2 = RESET + css2
css2 = css2.replace('#cgx .rail-nav button{', '#cgx .rail-nav button{padding:0;')

# ids → prefixed, assets → absolute site URLs
for old in ['chips', 'reviewList', 'moreBtn', 'rail', 'modal', 'modalFrame', 'modalX', 'leadForm', 'liveMsg', 'pain', 'mnav', 'cases']:
    body = body.replace(f'id="{old}"', f'id="cgx-{old}"').replace(f"getElementById('{old}')", f"getElementById('cgx-{old}')")
body = re.sub(r'id="i-([a-z]+)"', r'id="cgx-i-\1"', body).replace('href="#i-', 'href="#cgx-i-')
body = re.sub(r'id="p-([a-z]+)"', r'id="cgx-p-\1"', body).replace('href="#p-', 'href="#cgx-p-')
body = body.replace('id="top"', 'id="cgx-top"').replace('href="#top"', 'href="#cgx-top"')
body = body.replace("document.querySelectorAll('#cases .case[hidden]')", "document.querySelectorAll('#cgx-cases .case[hidden]')").replace('aria-controls="mnav"', 'aria-controls="cgx-mnav"')
body = body.replace("document.querySelectorAll('[data-wa]')", "document.querySelectorAll('#cgx [data-wa]')")
LOGO = 'https://cyberguard.co.il/wp-content/uploads/2023/12/ChatGPT-Image-Jul-15-2026-11_30_37-PM-150x150.webp'
HERO = 'https://cyberguard.co.il/wp-content/uploads/2025/12/unnamed-3.webp'
body = body.replace('src="logo.webp"', f'src="{LOGO}"')
css2 = css2.replace('url("hero.webp")', f'url("{HERO}")')
thumbs = dict(line.split() for line in open(videos_path) if line.strip())
body = re.sub(r'src="thumbs/(\d+)\.webp"', lambda m: f'src="{thumbs[m.group(1)]}"', body)
UP = {'ChatGPT-Image-Jul-15-2026-11_54': '2026/07/', 'ChatGPT-Image-Jul-15-2026-11_30': '2023/12/', 'Gemini_Generated_Image': '2026/04/', 'aa50ba15': '2026/04/'}
def img_url(m):
    f = m.group(1)
    return 'src="https://cyberguard.co.il/wp-content/uploads/' + next(v for k, v in UP.items() if f.startswith(k)) + f + '"'
body = re.sub(r'src="img/([^"]+)"', img_url, body)
assert 'src="img/' not in body
css2 = re.sub(r'url\("img/([^"]+)"\)', lambda m: 'url("https://cyberguard.co.il/wp-content/uploads/' + next(v for k, v in UP.items() if m.group(1).startswith(k)) + m.group(1) + '")', css2)
assert 'url("img/' not in css2
assert 'thumbs/' not in body and 'logo.webp' not in body and 'hero.webp' not in css2

# WordPress content filters rewrite some '&&' inside inline scripts to '&#038;&#038;' (breaking them).
# Ship the script base64-encoded in a data attribute; the loader has no & < or quotes for filters to touch.
import base64
def _pack(m):
    b64 = base64.b64encode(m.group(1).encode('utf-8')).decode('ascii')
    loader = '(function(){var s=atob(document.currentScript.dataset.cgx),b=new Uint8Array(s.length);for(var i=0;i!==s.length;i++)b[i]=s.charCodeAt(i);new Function(new TextDecoder().decode(b))()})()'
    return f'<script nowprocket data-cfasync="false" data-cgx="{b64}">{loader}</script>'
body = re.sub(r'<script>(.*?)</script>', _pack, body, flags=re.S)
assert '&&' not in re.sub(r'data-cgx="[^"]*"', '', body.split('<script data-cgx')[-1]) if '<script data-cgx' in body else True
content = f'<!-- wp:html -->\n{fonts}\n<style>\n{css2}\n</style>\n<div id="cgx" dir="rtl" lang="he">\n{body}\n</div>\n<!-- /wp:html -->\n'
open(out, 'w', encoding='utf-8').write(content)
print('bytes', len(content.encode()))
