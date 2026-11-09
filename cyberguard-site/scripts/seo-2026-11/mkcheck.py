import json, os, sys
S = os.environ['S']; P = f'{S}/p2'
rows = json.load(open(f'{S}/fix/posts.json'))['rows']; url = {int(x['ID']): 'https://cyberguard.co.il/' + x['slug'] + '/' for x in rows}
o = {}
for i in sys.argv[1:]:
    m = json.load(open(f'{P}/out/{i}.json')); o[i] = {'url': url[int(i)], 'sources': [url[int(s)] for s in m.get('merged_from') or [] if int(s) != int(i)]}
print(json.dumps(o, ensure_ascii=False))
