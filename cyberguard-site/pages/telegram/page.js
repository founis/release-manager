
/* ===================== WhatsApp page ===================== */
/* Situations: the phone shows the screen for the card you point at; on its own it cycles through all six */
const phone = document.querySelector('[data-phone]');
const sits = [...document.querySelectorAll('[data-sit]')];
if (phone && sits.length) {
  const states = [...phone.querySelectorAll('.ph-state')], dots = [...phone.querySelectorAll('.ph-dots i')];
  const timers = new Map();
  let cur = 0, held = 0, seen = false;
  const pad = (n) => String(n).padStart(2, '0');
  const fmtT = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  const set = (i) => {
    cur = i; phone.dataset.state = String(i);
    states.forEach((s, k) => s.classList.toggle('on', k === i));
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
    const vis = phone.offsetParent !== null;
    sits.forEach((c, k) => c.classList.toggle('on', vis && k === i));
  };
  sits.forEach((c, i) => {
    const pick = () => { held = Date.now(); set(i); };
    c.addEventListener('pointerenter', pick);
    c.addEventListener('focusin', pick);
  });
  phone.querySelectorAll('[data-timer]').forEach((t) => timers.set(t, Number(t.dataset.timer)));
  if (!calm) {
    setInterval(() => {
      timers.forEach((v, t) => { const n = v > 0 ? v - 1 : Number(t.dataset.timer); timers.set(t, n); t.textContent = fmtT(n); });
    }, 1000);
    setInterval(() => { if (seen && Date.now() - held > 7000) set((cur + 1) % states.length); }, 3400);
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((e) => { seen = e.isIntersecting; })).observe(phone);
  }
  set(0);
}
/* Timeline: the line draws and the steps light up once it is on screen */
const tl = document.querySelector('[data-tl]');
if (tl) {
  if (calm || !('IntersectionObserver' in window)) tl.classList.add('on');
  else { const to = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { tl.classList.add('on'); to.disconnect(); } }), { threshold: 0.3 }); to.observe(tl); }
}
