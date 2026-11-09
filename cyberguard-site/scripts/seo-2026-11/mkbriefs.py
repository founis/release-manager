import json, os
S = os.environ['S']
a = json.load(open(f'{S}/seo/article-audit.json')); ia = {x['id']: x for x in a}; pa = {x['url']: x for x in a}
rows = json.load(open(f'{S}/fix/posts.json'))['rows']; by = {x['slug']: int(x['ID']) for x in rows if x['post_type'] == 'post'}
meta = json.load(open(f'{S}/fix/meta_plan_final.json'))
idx = json.load(open(f'{S}/p2/src/_index.json'))
wid = lambda i: by[ia[i]['path'].strip('/')]
merges = {}
for x in a:
    if x['action_type'] == 'MERGE': merges.setdefault(pa[x['merge_target']]['id'], []).append(x['id'])
gone = {x['id'] for x in a if x['action_type'] in ('MERGE', 'NOINDEX')}
# allowed internal links: live indexable posts that stay + service pages
allowed = [f"https://cyberguard.co.il{x['path']} | {idx.get(str(wid(x['id'])), {}).get('title') or x['h1']}" for x in a if x['id'] not in gone]
svc = ['/וואטסאפ-חדש/ (שחרור וואטסאפ)', '/שחרור-חשבון-אינסטגרם/', '/פרצו-לי-לאינסטגרם/', '/חשבון-אינסטגרם-מושבת/', '/שחרור-חשבון-פייסבוק/', '/פרצו-לי-לפייסבוק/', '/חשבון-פייסבוק-מושבת/', '/שחרור-חשבון-פייסבוק-ללא-סיסמה/', '/שחרור-ads-manager-חסום/', '/שחרור-עמוד-עסקי-פייסבוק/', '/האימות-של-העסק-ב-meta/', '/שחרור-חשבון-טיקטוק/', '/שחרור-חשבון-gmail/', '/שחרור-טלפון-ננעל/', '/שחרור-חשבון-טלגרם/', '/שחזור-חשבון-לינקדאין/', '/שחרור-חשבון-יוטיוב/']
open(f'{S}/p2/briefs/allowed-links.txt', 'w').write('# Blog posts that stay live (use only these for internal links)\n' + '\n'.join(allowed) + '\n\n# Service pages (commercial; at most one contextual link per article, the template already adds a service box)\n' + '\n'.join('https://cyberguard.co.il' + s for s in svc) + '\n')
CL = {
 'whatsapp': ['053', '089', '110', '012', '009', '011', '072'],
 'instagram': ['054', '061', '073'],
 'facebook': ['078', '065', '059', '112', '069'],
 'meta-business': ['068', '022', '047'],
 'phone': ['027', '051'],
 'scams-tiktok-security': ['102', '044', '008', '113', '041'],
}
KEYS = ['action', 'reasons', 'add', 'remove', 'internal_links_to_add', 'top_queries', 'sc_last3m', 'sc_nov25_jan26', 'flags']
for name, hubs in CL.items():
    L = [f'# Cluster: {name}\n', 'Read ../RULES.md first. Source HTML files are in ../src/<wp_id>.html (current post_content). Write outputs to ../out/.\n']
    for h in hubs:
        x = ia[h]; pid = wid(h); m = meta.get(str(pid), {})
        L.append(f"\n## HUB {h} · wp_id {pid} · {x['url']}\n- audit action: {x['action_type']}  (REWRITE = full rewrite; KEEP+IMPROVE = keep structure, add merged material + fix listed issues)")
        L.append(f"- current H1 (post title, already updated today): {idx[str(pid)]['title']}")
        if m.get('title'): L.append(f"- SEO title already set: {m['title']}")
        L.append(f"- matching service page: {x['matching_service_page']}  · platform: {x['platform']}")
        for k in KEYS:
            if x.get(k): L.append(f"- {k}: {json.dumps(x[k], ensure_ascii=False)}")
        L.append(f"- source: ../src/{pid}.html" + (f"  (FAQ JSON-LD: ../src/{pid}.faq.json)" if os.path.exists(f'{S}/p2/src/{pid}.faq.json') else ''))
        for sid in merges.get(h, []):
            y = ia[sid]; spid = wid(sid)
            L.append(f"  - MERGE INTO THIS HUB: {sid} · wp_id {spid} · {y['url']} · clicks last 3m {y['sc_last3m']['clicks']} · top queries {json.dumps(y['top_queries'][:5], ensure_ascii=False)} · reasons {json.dumps(y['reasons'], ensure_ascii=False)} · source ../src/{spid}.html")
    open(f'{S}/p2/briefs/{name}.md', 'w').write('\n'.join(L) + '\n')
    print(name, [(h, wid(h), merges.get(h, [])) for h in hubs])
