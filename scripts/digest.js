/* Daily digest builder — runs in GitHub Actions.
   Reads clients from Supabase, computes today's releases / overdue / amount to collect,
   writes digest.html and sets step outputs (subject, send). No secrets are hardcoded —
   SUPABASE_URL / SUPABASE_KEY come from GitHub Actions secrets (env). */
const fs = require('fs');

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_KEY;

function todayIsrael() {
  // YYYY-MM-DD in Asia/Jerusalem regardless of runner timezone
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
  return parts; // en-CA gives YYYY-MM-DD
}
function fullyPaid(c){
  if (c.pay === 'paid') return true;
  if (c.pay === 'partial') return (+c.paid_amount||0) >= (+c.amount||0) && (+c.amount||0) > 0;
  return false;
}
function owed(c){
  if (c.pay === 'paid') return 0;
  if (c.pay === 'partial') return Math.max(0, (+c.amount||0) - (+c.paid_amount||0));
  return +c.amount||0;
}
function ils(n){ return '₪' + (+n||0).toLocaleString('he-IL'); }
function esc(s){ return String(s==null?'':s).replace(/[&<>]/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); }

async function main(){
  const out = process.env.GITHUB_OUTPUT;
  const setOut = (k,v)=>{ if(out) fs.appendFileSync(out, `${k}<<EOF\n${v}\nEOF\n`); };

  if(!URL || !KEY){
    console.log('Missing SUPABASE_URL / SUPABASE_KEY secrets');
    setOut('send','false');
    return;
  }
  let rows = [];
  try {
    const res = await fetch(`${URL}/rest/v1/clients?select=*&limit=5000`, {
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
    });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    rows = await res.json();
  } catch(e){
    console.log('Fetch failed:', e.message);
    setOut('send','false');
    return;
  }

  const today = todayIsrael();
  const active = rows.filter(c => c.status !== 'done');
  const dueToday = active.filter(c => c.release_date === today);
  const overdue  = active.filter(c => c.release_date && c.release_date < today);
  const soon = active.filter(c => {
    if(!c.release_date) return false;
    const d = Math.round((new Date(c.release_date) - new Date(today)) / 86400000);
    return d > 0 && d <= 3;
  });
  const collectNow = [...overdue, ...dueToday].reduce((s,c)=>s+owed(c),0);
  const totalOwed = active.reduce((s,c)=>s+owed(c),0);

  const svcIcon = {'וואטסאפ':'💬','Google / Gmail':'📧','פייסבוק':'👤','אינסטגרם':'📷','אחר':'🔓'};
  function row(c, tag){
    const o = owed(c);
    return `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #eee">${svcIcon[c.service]||'🔓'} <b>${esc(c.name)}</b>${tag?` <span style="color:#b91c1c;font-size:12px">${tag}</span>`:''}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:left">${o>0?'לגבות '+ils(o):'שולם ✓'}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:left;color:#555">${c.phone?esc(c.phone):''}</td>
    </tr>`;
  }

  let bodyRows = '';
  overdue.forEach(c => bodyRows += row(c, '⏰ באיחור'));
  dueToday.forEach(c => bodyRows += row(c, '🟠 היום'));
  soon.forEach(c => bodyRows += row(c, '🔵 בקרוב'));

  const headline = (overdue.length || dueToday.length)
    ? `היום ${dueToday.length} שחרורים${overdue.length?` · ${overdue.length} באיחור`:''}${collectNow>0?` · לגבות ${ils(collectNow)}`:''}`
    : (soon.length ? `אין שחרורים היום · ${soon.length} מתקרבים בימים הקרובים` : 'אין שחרורים היום — יום רגוע ☕');

  const subject = `☀️ ${headline}`;

  const html = `<!DOCTYPE html><html dir="rtl"><body style="margin:0;background:#f4f6fb;font-family:Arial,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:20px">
    <div style="background:linear-gradient(135deg,#14b8a6,#0f766e);border-radius:16px;padding:22px;color:#fff">
      <div style="font-size:14px;opacity:.9">בוקר טוב ☀️</div>
      <div style="font-size:20px;font-weight:800;margin-top:6px">${esc(headline)}</div>
    </div>
    <div style="display:flex;gap:10px;margin-top:14px">
      <div style="flex:1;background:#fff;border-radius:12px;padding:14px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#0f766e">${dueToday.length}</div>
        <div style="font-size:12px;color:#666">משתחררים היום</div></div>
      <div style="flex:1;background:#fff;border-radius:12px;padding:14px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#b91c1c">${overdue.length}</div>
        <div style="font-size:12px;color:#666">באיחור</div></div>
      <div style="flex:1;background:#fff;border-radius:12px;padding:14px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#b45309">${ils(collectNow)}</div>
        <div style="font-size:12px;color:#666">לגבות עכשיו</div></div>
    </div>
    ${bodyRows ? `<div style="background:#fff;border-radius:12px;margin-top:14px;overflow:hidden">
      <table style="width:100%;border-collapse:collapse;font-size:14px">${bodyRows}</table>
    </div>` : `<div style="background:#fff;border-radius:12px;margin-top:14px;padding:22px;text-align:center;color:#666">אין מה לטפל בו היום 🎉</div>`}
    <div style="text-align:center;margin-top:16px">
      <a href="https://founis.github.io/release-manager/" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700">פתח את המערכת</a>
    </div>
    <div style="text-align:center;color:#9aa;font-size:11px;margin-top:14px">סה״כ ממתין לתשלום: ${ils(totalOwed)} · מערכת שחרור חשבונות</div>
  </div></body></html>`;

  fs.writeFileSync('digest.html', html);
  setOut('subject', subject);
  setOut('send', 'true');
  console.log('Digest built:', subject);
}

main();
