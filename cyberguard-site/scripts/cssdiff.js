// Compare computed styles of the standalone page vs the WP simulation, element by element.
const { chromium } = require('playwright');
const path = require('path');
const PROPS = ['font-family','font-size','font-weight','line-height','color','background-color','margin-top','margin-bottom','padding-top','padding-right','letter-spacing','text-transform','border-top-width','border-radius','text-decoration-line','box-shadow','width','min-height','animation-name','animation-duration','transition-property','opacity','transform'];
async function grab(b, file, rootSel, width) {
  const p = await b.newPage({ viewport: { width, height: 900 } });
  await p.goto('file://' + encodeURI(path.resolve(file)), { waitUntil: 'networkidle' });
  await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 60)); } scrollTo({ top: 0, behavior: 'instant' }); }); await p.waitForTimeout(1500);
  const r = await p.evaluate(({ rootSel, PROPS }) => {
    const root = rootSel === 'body' ? document.body : document.querySelector(rootSel);
    return [...root.querySelectorAll('*')].filter(e => !['SCRIPT','STYLE','LINK','symbol','path','rect','use'].includes(e.tagName)).map(e => {
      const s = getComputedStyle(e);
      const cls = typeof e.className === 'string' ? e.className : '';
      return { tag: e.tagName.toLowerCase() + (cls ? '.' + cls.split(' ').join('.') : ''), st: Object.fromEntries(PROPS.map(k => [k, s.getPropertyValue(k).replace(/cgx-/g, '')])) };
    });
  }, { rootSel, PROPS });
  await p.close();
  return r;
}
(async () => {
  const [a, bfile, width] = process.argv.slice(2);
  const br = await chromium.launch();
  const A = await grab(br, a, 'body', Number(width)), B = await grab(br, bfile, '#cgx', Number(width));
  console.log('elements', A.length, B.length);
  const counts = {};
  for (let i = 0; i < Math.min(A.length, B.length); i++) {
    for (const k of PROPS) {
      if (A[i].st[k] !== B[i].st[k]) {
        const key = `${A[i].tag.slice(0, 40)} | ${k}: ${A[i].st[k].slice(0, 40)} -> ${B[i].st[k].slice(0, 40)}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    }
  }
  Object.entries(counts).sort((x, y) => y[1] - x[1]).slice(0, 60).forEach(([k, v]) => console.log(v, k));
  await br.close();
})();
