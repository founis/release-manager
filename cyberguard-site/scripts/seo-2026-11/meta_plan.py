import json, os, re
S = os.environ['S']
v = json.load(open(f'{S}/fix/p10.full'))['data']['return_value']['posts']
a = json.load(open(f'{S}/seo/article-audit.json'))
rows = json.load(open(f'{S}/fix/posts.json'))['rows']; by = {x['slug']: x['ID'] for x in rows if x['post_type'] == 'post'}
TAILS = [r'\s*לסיכום,\s*פתרון מקצועי 052-3001030\.?', r'\s*לעזרה מקצועית ומהירה\s*[–-]\s*פתרון מקצועי 052-3001030\.?',
         r'\s*פתרון מקצועי מותאם אישית\s*[–-]\s*התקשרו עכשיו: 052-3001030 לייעוץ ללא עלות\.?', r'\s*צוות המומחים שלנו זמין לעזור\s*[–-]\s*התקשרו 052-3001030 עוד היום\.?',
         r'\s*מומחי סייבר זמינים עכשיו: 052-3001030\.?', r'\s*(?:פתרון מקצועי|ליווי מקצועי|ליווי|ייעוץ:?)\s*052-3001030\.?', r'\s*052-3001030\.?']
MANUAL = {  # templated "X - מדריך פעולה ברור..." descriptions and broken ones
 '045': 'אינסטגרם מבקש אימות זהות? מה זה אומר, איך מצלמים סרטון סלפי או שולחים תעודה, כמה זמן זה לוקח, ומה עושים כשהאימות נדחה.',
 '046': 'הפוסטים באינסטגרם מגיעים לפחות אנשים? איך בודקים אם יש הגבלה בסטטוס החשבון, מה גורם לה, ואיך מחזירים את החשיפה בלי לפתוח חשבון חדש.',
 '052': 'כמה עולה שירות לשחזור חשבון, ממה מורכב המחיר, ומה אפשר לעשות לבד ובחינם דרך הערוצים הרשמיים לפני שמשלמים למישהו.',
 '072': 'אין לוואטסאפ מספר טלפון לשירות לקוחות. כך פונים לתמיכה הרשמית של WhatsApp מתוך האפליקציה ובטופס, ומה עושים כשהחשבון חסום ואין תשובה.',
 '048': 'אבטחת סייבר לעסקים קטנים בישראל: הצעדים הבסיסיים להגנה על חשבונות, מיילים ומכשירים, ולאן מדווחים על אירוע סייבר.',
 '058': 'Meta לא מאשרת את אימות החשבון או העסק? הסיבות הנפוצות לדחייה, אילו מסמכים מתקבלים, ומה עושים לפני שמגישים שוב.',
 '068': 'חשבון המודעות בפייסבוק הושבת? איך בודקים מה בדיוק נחסם, מגישים בקשה לבדיקה חוזרת דרך איכות החשבון, ומה עושים אם היא נדחתה.',
 '069': 'אבטחת חשבון פייסבוק צעד אחר צעד: בדיקת האבטחה של Meta, התראות על כניסה, אימות דו-שלבי ומכשירים מחוברים.',
 '027': 'שכחתם את הקוד לטלפון? אילו דרכים רשמיות קיימות לאייפון ולאנדרואיד, מה מוחק את המידע ומה לא, ולמה כדאי לבדוק גיבוי לפני איפוס.',
 '089': 'פרצו לכם לוואטסאפ? איך מזהים פריצה, מתחברים מחדש עם המספר שלכם כדי לנתק את הפורץ, מגדירים אימות דו-שלבי ומזהירים את אנשי הקשר.',
 '071': 'אימות דו-שלבי בוואטסאפ: איך מפעילים קוד PIN, מוסיפים מייל לשחזור, ומה עושים כששכחתם את הקוד.',
}
plan = {}
for x in a:
    pid = by[x['path'].strip('/')]; p = v[pid]; ch = {}
    d = p['yd'] or ''
    if x['id'] in MANUAL: nd = MANUAL[x['id']]
    elif '052' in d or '3001030' in d:
        nd = d
        for t in TAILS: nd = re.sub(t + r'\s*$', '', nd)
        nd = re.sub(r'\s*(ראשית|לסיכום),?\s*$', '', nd).strip()
        if not nd.endswith(('.', '?', '!')): nd += '.'
    else: nd = None
    if nd and nd != d: ch['desc'] = nd
    ex = p['ex'] or ''
    if '052' in ex or '3001030' in ex or ex.startswith(('?', ':', 'היא ', 'מגן ')):
        ch['excerpt'] = nd or d
    t = x['suggested_title']
    if t and x['action_type'] != 'MERGE':
        t = t.replace(' (מדריך 2026)', '')
        if t != p['yt']: ch['title'] = t
    if x['suggested_h1'] and x['action_type'] != 'MERGE' and x['suggested_h1'] != p['title']: ch['h1'] = x['suggested_h1']
    if 'DEFAULT_TITLE_SUFFIX' in x['flags'] and 'title' not in ch and x['action_type'] == 'KEEP+IMPROVE':
        ch['title'] = re.sub(r'\s*\(2026\)', '', x['h1']) + ' | CyberGuard'
    if x['action_type'] == 'NOINDEX': ch['noindex'] = True
    if ch: plan[pid] = dict(ch, id=x['id'], action=x['action_type'])
json.dump(plan, open(f'{S}/fix/meta_plan.json', 'w'), ensure_ascii=False, indent=1)
for pid, c in plan.items():
    print(c['id'], c['action'], {k: v for k, v in c.items() if k not in ('id', 'action')})
print(len(plan))
