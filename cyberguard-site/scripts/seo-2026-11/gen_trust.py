import json, os, base64, re
S = os.environ['S']
a = json.load(open(f'{S}/seo/article-audit.json'))
rows = json.load(open(f'{S}/fix/posts.json'))['rows']
by = {x['slug']: int(x['ID']) for x in rows if x['post_type'] == 'post'}
posts = {}
for x in a:
    pid = by[x['path'].strip('/')]
    svc = (x['matching_service_page'] or '').replace('https://cyberguard.co.il', '')
    if svc == '/שירותים/': svc = ''
    posts[pid] = {'pl': x['platform'], 'svc': svc, 'has_svc': bool(x['links_to_matching_service_page'])}
who = {
 'facebook': 'Meta (פייסבוק)', 'instagram': 'Meta (אינסטגרם)', 'meta_ads': 'Meta', 'whatsapp': 'WhatsApp ול-Meta',
 'telegram': 'Telegram', 'tiktok': 'TikTok', 'google': 'Google', 'youtube': 'Google ו-YouTube', 'microsoft': 'Microsoft',
 'linkedin': 'LinkedIn', 'phone': 'Apple, Samsung או Google', 'apple': 'Apple', 'snapchat': 'Snap',
 'general': 'Meta, Google, WhatsApp, TikTok, Telegram או כל פלטפורמה אחרת'}
official = {
 'facebook': {'intro': 'רוב בעיות הגישה לפייסבוק נפתרות בחינם בכלים של Meta עצמה. כך מתחילים:', 'links': [
   ['facebook.com/hacked', 'https://www.facebook.com/hacked', 'כשמישהו נכנס לחשבון או שינה פרטים'],
   ['facebook.com/login/identify', 'https://www.facebook.com/login/identify', 'כשלא זוכרים סיסמה, מייל או את החשבון עצמו'],
   ['מרכז העזרה של פייסבוק', 'https://www.facebook.com/help/', 'השבתה, ערעור ואימות זהות']]},
 'instagram': {'intro': 'לאינסטגרם יש מסלולים רשמיים וחינמיים לשחזור. כך מתחילים:', 'links': [
   ['instagram.com/hacked', 'https://www.instagram.com/hacked/', 'פריצה, שינוי מייל או טלפון, וחשבון מושבת'],
   ['מרכז העזרה של אינסטגרם', 'https://help.instagram.com/', 'ערעור, אימות זהות והגבלות']]},
 'meta_ads': {'intro': 'בעיות במודעות, בעמוד עסקי ובאימות עסק מתחילות במרכז העזרה העסקי של Meta:', 'links': [
   ['מרכז העזרה העסקי של Meta', 'https://www.facebook.com/business/help', 'חשבון מודעות, עמוד עסקי ואימות עסק'],
   ['facebook.com/hacked', 'https://www.facebook.com/hacked', 'כשהחשבון האישי שמנהל את העסק נפרץ']]},
 'whatsapp': {'intro': 'בחסימה של וואטסאפ, בקשת הבדיקה הרשמית נשלחת מתוך האפליקציה, ממסך החסימה ("בקשת בדיקה"), והיא בחינם. עזרה נוספת:', 'links': [
   ['מרכז העזרה של WhatsApp', 'https://faq.whatsapp.com/', 'חסימה, פריצה, אימות דו-שלבי וגיבוי'],
   ['יצירת קשר עם WhatsApp', 'https://www.whatsapp.com/contact/', 'פנייה לתמיכה הרשמית']]},
 'telegram': {'intro': 'לטלגרם יש ערוצי תמיכה רשמיים וחינמיים:', 'links': [
   ['telegram.org/support', 'https://telegram.org/support', 'טופס התמיכה הרשמי'],
   ['@SpamBot', 'https://t.me/SpamBot', 'הבוט הרשמי של טלגרם לבדיקת הגבלות על החשבון']]},
 'tiktok': {'intro': 'בטיקטוק, דיווח על בעיה נשלח מתוך האפליקציה (פרופיל ← הגדרות ← דיווח על בעיה), והוא בחינם. עזרה נוספת:', 'links': [
   ['מרכז העזרה של TikTok', 'https://support.tiktok.com/he', 'חשבון נפרץ, נחסם או הוסר']]},
 'google': {'intro': 'לחשבון Google יש תהליך שחזור רשמי וחינמי:', 'links': [
   ['שחזור חשבון Google', 'https://accounts.google.com/signin/recovery', 'הכלי הרשמי לשחזור'],
   ['המדריך של Google לשחזור', 'https://support.google.com/accounts/answer/7682439', 'מה עוזר לתהליך להצליח']]},
 'linkedin': {'intro': 'ללינקדאין יש מרכז עזרה רשמי עם טופסי שחזור:', 'links': [
   ['מרכז העזרה של LinkedIn', 'https://www.linkedin.com/help/linkedin', 'חשבון נפרץ, מוגבל או נעול']]},
 'phone': {'intro': 'ליצרני הטלפונים יש דרכים רשמיות לשחזר גישה. חשוב לדעת: באייפון, איפוס בלי קוד מוחק את המכשיר, ולכן כדאי לבדוק קודם אם יש גיבוי.', 'links': [
   ['Apple: איפוס iPhone ששכחתם את הקוד שלו', 'https://support.apple.com/he-il/118430', 'המדריך הרשמי של Apple'],
   ['Google Find Hub', 'https://www.google.com/android/find', 'איתור, נעילה ומחיקה של מכשיר אנדרואיד']]},
}
official['youtube'] = official['google']
svc = {
 '/וואטסאפ-חדש/': {'anchor': 'ליווי בשחרור חשבון וואטסאפ חסום או פרוץ', 'why': 'אם בקשת הבדיקה נדחתה, החשבון נפרץ ואין לכם קוד, או שמדובר בחשבון עסקי, אפשר לקבל ליווי אישי.'},
 '/שחרור-טלפון-ננעל/': {'anchor': 'ליווי בשחרור טלפון נעול', 'why': 'אם אין גיבוי, יש על המכשיר מידע שאסור לאבד, או שהדרך הרשמית נתקעה, אפשר לקבל ליווי אישי.'},
 '/שחרור-חשבון-אינסטגרם/': {'anchor': 'ליווי בשחרור חשבון אינסטגרם', 'why': 'אם הערעור נדחה, אין לכם גישה למייל או לטלפון שבחשבון, או שמדובר בחשבון עסקי, אפשר לקבל ליווי אישי.'},
 '/פרצו-לי-לאינסטגרם/': {'anchor': 'ליווי בשחזור חשבון אינסטגרם שנפרץ', 'why': 'אם הפורץ שינה את המייל והטלפון והקישור הרשמי לא עוזר, אפשר לקבל ליווי אישי.'},
 '/חשבון-אינסטגרם-מושבת/': {'anchor': 'ליווי בחשבון אינסטגרם מושבת', 'why': 'אם הערעור נדחה או שלא הגיעה תשובה, אפשר לקבל ליווי אישי.'},
 '/חשבון-אינסטגרם-נחסם-בטעות/': {'anchor': 'ליווי בחשבון אינסטגרם שנחסם בטעות', 'why': 'אם הערעור נדחה או שלא הגיעה תשובה, אפשר לקבל ליווי אישי.'},
 '/שחרור-חשבון-טיקטוק/': {'anchor': 'ליווי בשחרור חשבון טיקטוק', 'why': 'אם הדיווח באפליקציה לא עזר, או שהחשבון נפרץ ופרטי הכניסה שונו, אפשר לקבל ליווי אישי.'},
 '/שחרור-חשבון-פייסבוק/': {'anchor': 'ליווי בשחרור חשבון פייסבוק', 'why': 'אם הערעור נדחה, אין לכם גישה למייל או לטלפון שבחשבון, או שמדובר בחשבון שמנהל עסק, אפשר לקבל ליווי אישי.'},
 '/שחרור-חשבון-פייסבוק-ללא-סיסמה/': {'anchor': 'ליווי בשחזור חשבון פייסבוק בלי סיסמה', 'why': 'אם אין לכם גישה למייל או לטלפון שרשומים בחשבון והכלים הרשמיים נתקעים, אפשר לקבל ליווי אישי.'},
 '/חשבון-פייסבוק-מושבת/': {'anchor': 'ליווי בחשבון פייסבוק מושבת', 'why': 'אם הערעור נדחה או שלא הגיעה תשובה, אפשר לקבל ליווי אישי.'},
 '/שחרור-ads-manager-חסום/': {'anchor': 'ליווי בשחרור חשבון מודעות חסום', 'why': 'אם הבקשה לבדיקה חוזרת נדחתה והפרסום של העסק עומד, אפשר לקבל ליווי אישי.'},
 '/שחרור-עמוד-עסקי-פייסבוק/': {'anchor': 'ליווי בשחזור עמוד עסקי בפייסבוק', 'why': 'אם איבדתם את הניהול של העמוד ומרכז העזרה לא פותר את זה, אפשר לקבל ליווי אישי.'},
 '/האימות-של-העסק-ב-meta/': {'anchor': 'ליווי באימות עסק ב-Meta', 'why': 'אם האימות נדחה שוב ושוב ולא ברור למה, אפשר לקבל ליווי אישי.'},
 '/שחרור-חשבון-gmail/': {'anchor': 'ליווי בשחזור חשבון Gmail', 'why': 'אם התהליך הרשמי של Google נכשל כמה פעמים, אפשר לקבל ליווי אישי.'},
 '/שחרור-חשבון-יוטיוב/': {'anchor': 'ליווי בשחזור ערוץ יוטיוב', 'why': 'אם הערוץ נפרץ או הוסר והתהליך הרשמי נכשל, אפשר לקבל ליווי אישי.'},
 '/שחרור-חשבון-טלגרם/': {'anchor': 'ליווי בשחרור חשבון טלגרם', 'why': 'אם הפנייה לתמיכה לא נענתה, אפשר לקבל ליווי אישי.'},
 '/שחזור-חשבון-לינקדאין/': {'anchor': 'ליווי בשחזור חשבון לינקדאין', 'why': 'אם טופסי השחזור לא עזרו, אפשר לקבל ליווי אישי.'},
}
missing = sorted({p['svc'] for p in posts.values() if p['svc'] and not p['has_svc'] and p['svc'] not in svc})
assert not missing, missing
voice_re = {'facebook': 'פייסבוק', 'meta_ads': 'פייסבוק', 'instagram': 'אינסטגרם', 'whatsapp': 'וואטצאפ|וואטסאפ'}
voice_head = {'facebook': 'לקוחות שחשבון הפייסבוק שלהם חזר', 'meta_ads': 'לקוחות שחשבון הפייסבוק שלהם חזר', 'instagram': 'לקוחות שחשבון האינסטגרם שלהם חזר', 'whatsapp': 'לקוחות שהוואטסאפ שלהם חזר'}
data = {'posts': posts, 'who': who, 'official': official, 'svc': svc, 'voice_re': voice_re, 'voice_head': voice_head}
code = open(f'{S}/fix/snip/trust.php.tpl', encoding='utf-8').read().replace('DATA', base64.b64encode(json.dumps(data, ensure_ascii=False).encode()).decode())
open(f'{S}/fix/snip/trust.php', 'w', encoding='utf-8').write(code)
print('posts', len(posts), 'svc boxes', sum(1 for p in posts.values() if p['svc'] and not p['has_svc']), 'official', sum(1 for p in posts.values() if p['pl'] in official))
