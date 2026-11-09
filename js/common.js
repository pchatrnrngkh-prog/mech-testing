/* ===== ตัวช่วยที่ใช้ร่วมกันของบทที่ 4 (fluid.html) และบทที่ 5 (pipe.html) =====
   บทที่ 2 ใช้ main.js/lab.js และบทที่ 3 ใช้ engine.js ของตัวเอง ไฟล์นี้จึงไม่ยุ่งกับสองบทนั้น
   หน้าที่โหลดไฟล์นี้ต้องโหลดก่อนสคริปต์ของบท และห้ามประกาศชื่อตัวแปรซ้ำกับไฟล์นี้ */

/* ---------- ตัวช่วยทั่วไป ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const G = 9.81;
const N = (x, dp = 2) => Number(x).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
const FR = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
/* เลขวิทยาศาสตร์ เช่น 1.09 × 10⁻³ */
const SCI = (v, dp = 2) => {
  if (!isFinite(v) || v === 0) return N(v, dp);
  const [m, e] = v.toExponential(dp).split('e');
  return `${m} × 10<sup>${Number(e)}</sup>`;
};
/* เลือกรูปแบบให้อ่านง่าย: ใหญ่/เล็กมากใช้เลขวิทยาศาสตร์ */
const NUM = (v, dp = 3) => {
  const a = Math.abs(v);
  if (a !== 0 && (a < 0.01 || a >= 1e6)) return SCI(v, dp - 1);
  return N(v, a >= 1000 ? Math.min(dp, 1) : a >= 100 ? Math.min(dp, 2) : dp);
};
/* บรรทัดสูตรสด: ชื่อขั้น · สูตร · แทนค่า · คำตอบ */
const LF = (k, eq, sub, ans, cls = '') =>
  `<div class="lf ${cls}"><div class="lf-k">${k}</div><div class="lf-row"><span class="lf-eq">${eq}</span><span class="lf-sub">${sub}</span><span class="lf-ans">${ans}</span></div></div>`;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const r2 = x => Math.round(x * 100) / 100;
const sig3 = x => +x.toPrecision(3);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* ไม่เป็นไร */ } }
};
const cssVar = (name, el = document.documentElement) => getComputedStyle(el).getPropertyValue(name).trim();
function niceMax(v) {
  if (!(v > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}
/* กดค้างแล้วทำซ้ำ (ปุ่ม + − เท ฯลฯ) */
function hold(btn, fn) {
  let t = null;
  const go = () => { fn(); t = setTimeout(function rep() { fn(); t = setTimeout(rep, 60); }, 350); };
  const end = () => clearTimeout(t);
  btn.addEventListener('pointerdown', e => { e.preventDefault(); go(); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, end));
  btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
}

/* ---------- โหมดสว่าง / มืด ---------- */
(function theme() {
  const saved = store.get('theme');
  if (saved) document.documentElement.dataset.theme = saved;
  const btn = $('#themeBtn'); if (!btn) return;
  btn.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.set('theme', next);
    document.dispatchEvent(new CustomEvent('themechange'));
  });
})();

/* ---------- เมนูไฮไลต์ตามตำแหน่ง + ปุ่มกลับด้านบน ---------- */
(function nav() {
  const links = $$('#nav a');
  const secs = links.map(a => $(a.getAttribute('href')));
  const toTop = $('#toTop');
  let last = null;
  const onScroll = () => {
    const y = scrollY + 140;
    let cur = -1;
    secs.forEach((s, i) => { if (s && s.offsetTop <= y) cur = i; });
    if (cur !== last) {
      last = cur;
      links.forEach((a, i) => a.classList.toggle('active', i === cur));
      if (cur >= 0) {
        const nav = $('#nav'), a = links[cur];
        nav.scrollTo({ left: a.offsetLeft - nav.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' });
      }
    }
    if (toTop) toTop.classList.toggle('show', scrollY > 600);
  };
  addEventListener('scroll', onScroll, { passive: true });
  if (toTop) toTop.addEventListener('click', () => scrollTo({ top: 0 }));
  onScroll();
})();

/* ---------- กราฟเส้นแบบง่าย (คืนค่าเป็นข้อความ SVG) ---------- */
function smoothPath(pts) {
  if (pts.length < 3) return 'M' + pts.map(p => p.join(',')).join(' L');
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
/* o = { W, H, m:{l,r,t,b}, x:{min,max,step,label,fmt}, y:{...}, series:[{pts, color, dots, smooth, dash, label}], empty } */
function lineChart(o) {
  const { W, H, m, x, y } = o;
  const X = v => m.l + (v - x.min) / (x.max - x.min) * (W - m.l - m.r);
  const Y = v => H - m.b - (v - y.min) / (y.max - y.min) * (H - m.t - m.b);
  let s = '';
  for (let v = x.min; v <= x.max + 1e-9; v += x.step) {
    s += `<line class="ch-grid" x1="${X(v)}" x2="${X(v)}" y1="${m.t}" y2="${H - m.b}"/>`;
    s += `<text class="ch-tick" x="${X(v)}" y="${H - m.b + 16}" text-anchor="middle">${(x.fmt || (t => +t.toFixed(3)))(v)}</text>`;
  }
  for (let v = y.min; v <= y.max + 1e-9; v += y.step) {
    s += `<line class="ch-grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/>`;
    s += `<text class="ch-tick" x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end">${(y.fmt || (t => +t.toFixed(3)))(v)}</text>`;
  }
  s += `<line class="ch-axis" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${H - m.b}"/><line class="ch-axis" x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/>`;
  s += `<text class="ch-lab" x="${(m.l + W - m.r) / 2}" y="${H - 6}" text-anchor="middle">${x.label}</text>`;
  s += `<text class="ch-lab" transform="translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)" text-anchor="middle">${y.label}</text>`;
  (o.series || []).forEach(se => {
    const pts = se.pts.map(p => [X(p[0]), Y(p[1])]);
    if (!pts.length) return;
    if (pts.length > 1) s += `<path class="ch-line" d="${se.smooth ? smoothPath(pts) : 'M' + pts.map(p => p.join(',')).join(' L')}" stroke="${se.color}"${se.dash ? ' stroke-dasharray="7 5" style="stroke-width:2"' : ''}/>`;
    if (se.dots) pts.forEach(p => { s += `<circle class="ch-dot" cx="${p[0]}" cy="${p[1]}" r="5" fill="${se.color}"/>`; });
  });
  if (o.empty) s += `<text class="ch-tick" x="${(m.l + W - m.r) / 2}" y="${(m.t + H - m.b) / 2}" text-anchor="middle">${o.empty}</text>`;
  return s;
}

/* ---------- เครื่องคิดเลขแบบสูตรสด ----------
   <div class="ecalc" data-calc="ชื่อ"> ... <input data-k="m"> <select data-k="u"> ... <div data-out></div></div>
   ปุ่มตัวอย่าง: <button data-set='{"m":460}'> */
function initCalcs(CALC) {
  $$('[data-calc]').forEach(box => {
    const fn = CALC[box.dataset.calc]; if (!fn) return;
    const run = () => {
      const v = {}; let bad = false;
      $$('[data-k]', box).forEach(i => {
        if (i.tagName === 'SELECT') v[i.dataset.k] = i.value;
        else { const x = parseFloat(i.value); if (!isFinite(x) || (x <= 0 && !i.dataset.any)) bad = true; v[i.dataset.k] = x; }
      });
      const out = $('[data-out]', box);
      if (bad) { out.innerHTML = '<div class="calc-err">กรอกตัวเลขที่มากกว่า 0 ให้ครบทุกช่อง</div>'; return; }
      out.innerHTML = fn(v, box);
    };
    box.addEventListener('input', run);
    box.addEventListener('change', run);
    $$('[data-set]', box).forEach(b => b.addEventListener('click', () => {
      const set = JSON.parse(b.dataset.set);
      Object.entries(set).forEach(([k, val]) => { const el = $(`[data-k="${k}"]`, box); if (el) el.value = val; });
      run();
    }));
    run();
  });
}

/* ---------- แบบทดสอบ ---------- */
function initQuiz(QUIZ) {
  const tabs = $('#quizTabs'), box = $('#quizBox'); if (!tabs) return;
  let cur = 0;
  tabs.innerHTML = QUIZ.map((s, i) => `<button data-i="${i}">${i + 1}. ${s.title}</button>`).join('');
  tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) load(+b.dataset.i); });
  $('#quizReset').addEventListener('click', () => load(cur));
  function load(i) {
    cur = i;
    $$('button', tabs).forEach((b, j) => b.classList.toggle('on', j === i));
    box.innerHTML = QUIZ[i].qs.map((q, k) => `<div class="q" data-q="${k}"><div class="q-text"><span class="qn">${k + 1}.</span>${q.q}</div>
      <div class="choices">${q.c.map((c, j) => `<button data-c="${j}">${c}</button>`).join('')}</div></div>`).join('') + '<div class="result-box" id="quizResult" hidden></div>';
    score();
  }
  box.addEventListener('click', e => {
    const b = e.target.closest('.choices button'); if (!b || b.disabled) return;
    const qEl = b.closest('.q'), q = QUIZ[cur].qs[+qEl.dataset.q], pick = +b.dataset.c;
    $$('button', qEl).forEach((x, j) => { x.disabled = true; if (j === q.a) x.classList.add('correct'); });
    if (pick !== q.a) b.classList.add('wrong');
    qEl.dataset.ok = pick === q.a ? '1' : '0';
    qEl.insertAdjacentHTML('beforeend', `<div class="explain ${pick === q.a ? 'ok' : 'no'}">${pick === q.a ? '✔ ถูกต้อง' : '✘ ยังไม่ถูก'} — ${q.e}</div>`);
    score();
  });
  function score() {
    const n = QUIZ[cur].qs.length, done = $$('.q[data-ok]', box), ok = done.filter(x => x.dataset.ok === '1').length;
    $('#quizScore').textContent = `${ok} / ${n}`;
    const res = $('#quizResult');
    if (done.length === n) {
      res.hidden = false;
      res.innerHTML = `<div class="big">${ok} / ${n}</div><div>${ok / n >= .8 ? '🎉 เยี่ยมมาก เข้าใจบทนี้ดีแล้ว' : ok / n >= .5 ? '👍 ผ่าน ลองทบทวนข้อที่ผิดอีกครั้ง' : '📖 ลองกลับไปอ่านเนื้อหาแล้วทำใหม่'}</div>`;
    }
  }
  load(0);
}

/* ---------- สรุปสูตร ---------- */
function initFormulas(FX, unitRows) {
  const box = $('#fxList'); if (!box) return;
  box.innerHTML = FX.map((f, i) => `<div class="fx" id="${f.id}"><div class="fx-head"><span class="fx-no">${i + 1}</span><h4>${f.t}</h4></div>
    <div class="formula"><span class="eq">${f.eq}</span></div>
    <div class="origin"><b>ที่มา:</b> ${f.o}</div>
    <div class="table-wrap"><table class="vars"><thead><tr><th>ตัวแปร</th><th class="left">คืออะไร</th><th>หน่วย</th><th class="left">ได้ค่ามาจากไหน</th></tr></thead>
    <tbody>${f.v.map(r => `<tr><td>${r[0]}</td><td class="left">${r[1]}</td><td>${r[2]}</td><td class="left">${r[3]}</td></tr>`).join('')}</tbody></table></div>
    <p class="fx-ex">ตัวอย่าง: ${f.ex}</p></div>`).join('') + (unitRows ? `
    <div class="fx" id="fxu"><div class="fx-head"><span class="fx-no">⇄</span><h4>ตารางแปลงหน่วยที่ใช้บ่อยในบทนี้</h4></div>
    <div class="table-wrap"><table class="vars units"><thead><tr><th>แปลง</th><th class="left">วิธี / เหตุผล</th></tr></thead><tbody>
      ${unitRows.map(r => `<tr><td>${r[0]}</td><td class="left">${r[1]}</td></tr>`).join('')}
    </tbody></table></div></div>` : '');
}

/* ---------- วิดีโอ YouTube (โหลดเมื่อกดเล่น) ---------- */
(function videos() {
  $$('.yt').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.yt, card = btn.closest('.video-card');
    const box = document.createElement('div');
    box.className = 'yt-frame';
    box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=0&fs=1" title="${btn.getAttribute('aria-label')}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
      <button class="yt-close" aria-label="ออกจากโหมดเต็มจอ">✕ ปิดเต็มจอ</button>`;
    btn.replaceWith(box);
    card.classList.add('playing');
    const bar = document.createElement('div');
    bar.className = 'yt-bar';
    bar.innerHTML = `<button class="btn btn-accent btn-sm yt-full">⛶ ดูเต็มจอ</button><a class="btn btn-line btn-sm" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">▶ เปิดใน YouTube</a>`;
    box.after(bar);
    const exit = () => { box.classList.remove('yt-max'); document.body.classList.remove('yt-lock'); };
    bar.querySelector('.yt-full').addEventListener('click', () => {
      const req = box.requestFullscreen || box.webkitRequestFullscreen;
      if (req) Promise.resolve(req.call(box)).catch(() => { box.classList.add('yt-max'); document.body.classList.add('yt-lock'); });
      else { box.classList.add('yt-max'); document.body.classList.add('yt-lock'); }
    });
    box.querySelector('.yt-close').addEventListener('click', exit);
    card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }));
})();

/* ---------- ทำงานเฉพาะตอนมองเห็น (ประหยัดแบตมือถือ) ---------- */
function whenVisible(el, cb) {
  const io = new IntersectionObserver(es => cb(es[0].isIntersecting));
  io.observe(el);
}
