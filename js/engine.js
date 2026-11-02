/* ===== บทที่ 3 งานทดสอบสมรรถนะของเครื่องยนต์ =====
   ไฟล์นี้ทำงานเองทั้งหมด (ไม่ใช้ main.js เพราะ main.js ผูกกับหน้าบทที่ 2)
   หมายเหตุ: ชุดทดลองเสมือนใช้ "ค่าจำลอง" ของเครื่องยนต์เล็กแก๊สโซลีน ปรับให้ตัวเลขใกล้เคียงตัวอย่างในหนังสือ */

/* ---------- ตัวช่วยทั่วไป ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const G = 9.81, TAU = 2 * Math.PI;
const N = (x, dp = 2) => Number(x).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
const FR = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
const SCI = (v, dp = 2) => {
  if (!isFinite(v) || v === 0) return N(v, dp);
  const [m, e] = v.toExponential(dp).split('e');
  return `${m} × 10<sup>${Number(e)}</sup>`;
};
const LF = (k, eq, sub, ans, cls = '') =>
  `<div class="lf ${cls}"><div class="lf-k">${k}</div><div class="lf-row"><span class="lf-eq">${eq}</span><span class="lf-sub">${sub}</span><span class="lf-ans">${ans}</span></div></div>`;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* ไม่เป็นไร */ } }
};
const MF = 'ṁ<sub>f</sub>';
/* ปัดเศษระหว่างทางแบบที่หนังสือและนักศึกษาทำด้วยมือ (คำตอบจะตรงกับหนังสือ) */
const r2 = x => Math.round(x * 100) / 100;
const sig3 = x => +x.toPrecision(3);

/* ---------- โหมดสว่าง / มืด ---------- */
(function theme() {
  const saved = store.get('theme');
  if (saved) document.documentElement.dataset.theme = saved;
  $('#themeBtn').addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.set('theme', next);
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
    toTop.classList.toggle('show', scrollY > 600);
  };
  addEventListener('scroll', onScroll, { passive: true });
  toTop.addEventListener('click', () => scrollTo({ top: 0 }));
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
function lineChart(o) {
  const { W, H, m, x, y } = o;
  const X = v => m.l + (v - x.min) / (x.max - x.min) * (W - m.l - m.r);
  const Y = v => H - m.b - (v - y.min) / (y.max - y.min) * (H - m.t - m.b);
  let s = '';
  for (let v = x.min; v <= x.max + 1e-9; v += x.step) {
    s += `<line class="ch-grid" x1="${X(v)}" x2="${X(v)}" y1="${m.t}" y2="${H - m.b}"/>`;
    s += `<text class="ch-tick" x="${X(v)}" y="${H - m.b + 16}" text-anchor="middle">${(x.fmt || (t => t.toLocaleString('en-US')))(v)}</text>`;
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
    s += `<path class="ch-line" d="${se.smooth ? smoothPath(pts) : 'M' + pts.map(p => p.join(',')).join(' L')}" stroke="${se.color}"/>`;
    if (se.dots) pts.forEach(p => { s += `<circle class="ch-dot" cx="${p[0]}" cy="${p[1]}" r="5" fill="${se.color}"/>`; });
  });
  if (o.empty) s += `<text class="ch-tick" x="${(m.l + W - m.r) / 2}" y="${(m.t + H - m.b) / 2}" text-anchor="middle">${o.empty}</text>`;
  return s;
}

/* ===== 3.2 ตัวสาธิตแรงบิด (ประแจ) ===== */
(function torqueDemo() {
  const svg = $('#torqueSvg'); if (!svg) return;
  const fR = $('#tqFr'), rR = $('#tqRr');
  function draw() {
    const F = +fR.value, r = +rR.value, T = F * r;
    $('#tqF').textContent = F; $('#tqR').textContent = r.toFixed(2);
    const bx = 70, by = 120, L = 40 + r / 0.5 * 330, ex = bx + L, arrow = 20 + F / 400 * 80;
    const ang = Math.min(300, 40 + T * 2);
    const a2 = (ang - 90) * Math.PI / 180, R = 44;
    svg.innerHTML = `
      <defs><linearGradient id="gWr" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d7dde3"/><stop offset="1" stop-color="#8c97a3"/></linearGradient></defs>
      <path d="M${bx} ${by - R} A${R} ${R} 0 ${ang > 180 ? 1 : 0} 1 ${bx + R * Math.cos(a2)} ${by + R * Math.sin(a2)}" fill="none" stroke="var(--torque)" stroke-width="5" stroke-linecap="round"/>
      <circle cx="${bx + R * Math.cos(a2)}" cy="${by + R * Math.sin(a2)}" r="7" fill="var(--torque)"/>
      <rect x="${bx}" y="${by - 11}" width="${L + 16}" height="22" rx="11" fill="url(#gWr)" stroke="var(--text)" stroke-width="1.5"/>
      <circle cx="${bx}" cy="${by}" r="26" fill="url(#gWr)" stroke="var(--text)" stroke-width="1.5"/>
      <polygon points="${[0, 1, 2, 3, 4, 5].map(i => `${bx + 13 * Math.cos(i * Math.PI / 3)},${by + 13 * Math.sin(i * Math.PI / 3)}`).join(' ')}" fill="#5d6876"/>
      <circle cx="${bx}" cy="${by}" r="3" fill="var(--accent)"/>
      <line x1="${ex}" y1="${by + 14}" x2="${ex}" y2="${by + 14 + arrow}" stroke="var(--bad)" stroke-width="5"/>
      <path d="M${ex - 9} ${by + 8 + arrow} l9 16 l9 -16z" fill="var(--bad)"/>
      <text x="${ex + 12}" y="${by + 30 + arrow / 2}" class="svg-b" fill="var(--bad)">F = ${F} N</text>
      <line x1="${bx}" y1="${by - 40}" x2="${ex}" y2="${by - 40}" stroke="var(--brand)" stroke-width="1.5"/>
      <line x1="${bx}" y1="${by - 48}" x2="${bx}" y2="${by - 32}" stroke="var(--brand)" stroke-width="1.5"/>
      <line x1="${ex}" y1="${by - 48}" x2="${ex}" y2="${by - 14}" stroke="var(--brand)" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="${(bx + ex) / 2}" y="${by - 48}" text-anchor="middle" class="svg-b" fill="var(--brand)">r = ${r.toFixed(2)} m</text>
      <text x="${bx}" y="${by + 60}" text-anchor="middle" class="svg-m">จุดหมุน</text>
      <text x="20" y="232" class="svg-b" fill="var(--torque)" font-size="18">T = ${N(T, 1)} N·m</text>`;
    $('#tqOut').innerHTML =
      LF('แรงบิด', 'T = F · r', `= (${F})(${r.toFixed(2)})`, `= ${N(T, 2)} N·m`, 'hl') +
      LF('ถ้าใช้แรงเท่าเดิมแต่แขนยาว 2 เท่า', 'T = F · 2r', `= (${F})(${(2 * r).toFixed(2)})`, `= ${N(2 * T, 2)} N·m (เพิ่ม 2 เท่า)`);
  }
  fR.addEventListener('input', draw); rR.addEventListener('input', draw); draw();
})();

/* ===== 3.3 หน่วยกำลังม้า (รูป 3-3) ===== */
(function hpUnits() {
  const tabs = $('#hpUnitTabs'); if (!tabs) return;
  const D = {
    HP: ['550 lb', '1 ft/s', '1 HP = ยกของหนัก 550 lb ขึ้นได้ 1 ft ใน 1 วินาที', '1 HP = 550 ft·lb/s ≈ 746 W'],
    PS: ['75 kg', '1 m/s', '1 PS = ยกของหนัก 75 kg ขึ้นได้ 1 m ใน 1 วินาที', '1 PS = 75 kg·m/s ≈ 736 W'],
    W: ['1 N', '1 m/s', '1 W = ยกของหนัก 1 N (ราว 102 กรัม) ขึ้นได้ 1 m ใน 1 วินาที', '1 W = 1 N·m/s = 1 J/s']
  };
  tabs.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', tabs).forEach(x => x.classList.toggle('on', x === b));
    const d = D[b.dataset.u];
    $('#hpW').textContent = d[0]; $('#hpV1').textContent = d[1]; $('#hpV2').textContent = d[1];
    $('#hpDef').textContent = d[2]; $('#hpEq').textContent = d[3];
  });
})();

/* ===== รูป 3-4 กำลังม้าเสียดทาน ===== */
(function fhpChart() {
  const svg = $('#fhpChart'); if (!svg) return;
  svg.innerHTML = lineChart({
    W: 460, H: 280, m: { l: 56, r: 16, t: 14, b: 44 },
    x: { min: 0, max: 4000, step: 1000, label: 'ความเร็วรอบเครื่องยนต์ (rpm)' },
    y: { min: 0, max: 60, step: 20, label: 'กำลังม้าเสียดทาน (hp)' },
    series: [{ color: 'var(--bad)', smooth: true, pts: [[750, 2.5], [1000, 3], [1500, 4.5], [2000, 7], [2500, 11], [3000, 17], [3500, 25], [4000, 34]] }]
  });
})();

/* ===== เครื่องคิดเลขแบบสูตรสด ===== */
const ECALC = {
  units(v) {
    const f = { W: 1, kW: 1000, HP: 746, PS: 736 }[v.u];
    const W = v.v * f;
    return [
      LF('แปลงเป็นวัตต์ก่อน', `P = ${v.v} ${v.u}`, v.u === 'W' ? '' : `× ${f}${v.u === 'kW' ? '' : ' W/' + v.u}`, `= ${N(W, 2)} W`, 'hl'),
      LF('เป็นกิโลวัตต์', 'kW = W ÷ 1,000', `= ${N(W, 2)} ÷ 1,000`, `= ${N(W / 1000, 3)} kW`),
      LF('เป็นกำลังม้าอังกฤษ', 'HP = W ÷ 746', `= ${N(W, 2)} ÷ 746`, `= ${N(W / 746, 2)} HP`),
      LF('เป็นกำลังม้าเมตริก', 'PS = W ÷ 736', `= ${N(W, 2)} ÷ 736`, `= ${N(W / 736, 2)} PS`)
    ].join('');
  },
  ihp(v) {
    const d = v.d / 1000, s = v.s / 1000, p = v.p * 1e5, n = v.rpm / 60, four = v.st === '4';
    const A = Math.PI / 4 * d * d, nn = four ? n / 2 : n;
    const I = p * A * s * nn * v.k, B = TAU * v.T * n, F = (r2(I / 1000) - r2(B / 1000)) * 1000;
    let out = [
      LF('แปลงหน่วย', 'imep, d, s, n', `= ${v.p} bar = ${SCI(p)} N/m² · d = ${d} m · s = ${s} m · n = ${v.rpm}/60`, `= ${N(n, 2)} rps`),
      LF('พื้นที่หน้าตัดกระบอกสูบ', `A = ${FR('π d²', '4')}`, `= ${FR('π (' + d + ')²', '4')}`, `= ${SCI(A, 3)} m²`),
      LF(`กำลังม้าอินดิเคต (${four ? '4 จังหวะ ใช้ n/2' : '2 จังหวะ'})`, four ? `IHP = imep·A·s·${FR('n', '2')}·k` : 'IHP = imep·A·s·n·k',
        `= (${SCI(p)})(${SCI(A, 3)})(${s})${four ? `(${FR(N(n, 2), '2')})` : `(${N(n, 2)})`}(${v.k})`, `= ${N(I, 0)} W = ${N(I / 1000, 2)} kW`, 'hl'),
      LF('กำลังม้าเบรก', 'BHP = 2π·T<sub>e</sub>·n', `= 2π(${v.T})(${FR(v.rpm, 60)})`, `= ${N(B, 0)} W = ${N(B / 1000, 2)} kW`, 'hl'),
      LF('กำลังม้าเสียดทาน', 'FHP = IHP − BHP', `= ${N(I / 1000, 2)} − ${N(B / 1000, 2)}`, `= ${N(F / 1000, 2)} kW`, 'hl'),
      LF('ประสิทธิภาพเชิงกล (หัวข้อ 3.7.2)', `η<sub>m</sub> = ${FR('BHP', 'IHP')}`, `= ${FR(N(B / 1000, 2), N(I / 1000, 2))}`, `= ${N(B / I * 100, 2)} %`)
    ].join('');
    if (F < 0) out += `<div class="calc-err">⚠️ BHP มากกว่า IHP เป็นไปไม่ได้ (BHP ต้องน้อยกว่า IHP เสมอ) ตรวจสอบข้อมูลอีกครั้ง</div>`;
    else {
      const pb = B / I * 100;
      out += `<div class="pbar" aria-label="สัดส่วน BHP และ FHP"><div class="p-b" style="width:${pb}%">BHP ${N(pb, 1)}%</div><div class="p-f" style="width:${100 - pb}%">${100 - pb > 8 ? 'FHP ' + N(100 - pb, 1) + '%' : ''}</div></div><div class="small muted">แถบแสดงว่ากำลังจากกระบอกสูบ (IHP = 100%) ไปถึงเพลาเท่าไร และเสียให้แรงเสียดทานเท่าไร</div>`;
    }
    return out;
  },
  dyno(v) {
    const F = v.kg * G, T = r2(F * v.r), n = v.rpm / 60, P = TAU * T * n;
    pronyShow(v.kg, v.r);
    return [
      LF('แปลงค่าที่เครื่องชั่งเป็นนิวตัน', 'F = kg × 9.81', `= ${v.kg} × 9.81`, `= ${N(F, 2)} N`),
      LF('แรงบิด', 'T<sub>e</sub> = F · r', `= (${v.kg} × 9.81)(${v.r})`, `= ${N(T, 2)} N·m`, 'hl'),
      LF('ความเร็วรอบ', 'n = rpm ÷ 60', `= ${v.rpm} ÷ 60`, `= ${N(n, 2)} rps`),
      LF('กำลังม้าเบรก', 'BHP = 2π·T<sub>e</sub>·n', `= 2π(${N(T, 2)})(${FR(v.rpm, 60)})`, `= ${N(P, 0)} W = ${N(P / 1000, 2)} kW (${N(P / 746, 2)} HP)`, 'hl')
    ].join('');
  },
  fuel(v) {
    const rho = v.sg * 1000, m = sig3(v.V * 1e-6 * rho / v.t), mh = r2(m * 3600);
    return [
      LF('ความหนาแน่นของน้ำมัน', 'ρ = (s.g.)·ρ<sub>w</sub>', `= (${v.sg})(1,000)`, `= ${N(rho, 0)} kg/m³`),
      LF('อัตราการสิ้นเปลืองเชื้อเพลิง', `${MF} = ${FR('V·ρ', 'Δt')}`, `= ${FR(`(${v.V} × 10<sup>−6</sup>)(${N(rho, 0)})`, v.t)}`, `= ${SCI(m, 2)} kg/s`, 'hl'),
      LF('เปลี่ยนเป็น kg/hr', `${MF} × 3,600`, `= (${SCI(m, 2)})(3,600)`, `= ${N(mh, 2)} kg/hr`, 'hl'),
      LF('อัตราการสิ้นเปลืองเชื้อเพลิงจำเพาะ', `s.f.c. = ${FR(MF, 'BHP')}`, `= ${FR(N(mh, 2), v.P)}`, `= ${N(mh / v.P, 2)} kg/kW·hr`, 'hl')
    ].join('');
  },
  eff(v) {
    const B = v.I - v.F, q = v.m / 3600 * v.cv * 1e6;
    return [
      LF('กำลังม้าเบรก', 'BHP = IHP − FHP', `= ${v.I} − ${v.F}`, `= ${N(B, 2)} kW`),
      LF('พลังงานความร้อนที่จ่ายต่อวินาที', `${MF} · C<sub>v</sub>`, `= (${FR(v.m, '3,600')})(${v.cv} × 10<sup>6</sup>)`, `= ${N(q, 0)} W`),
      LF('ประสิทธิภาพเชิงความร้อนอินดิเคต', `η<sub>ti</sub> = ${FR('IHP', MF + '·C<sub>v</sub>')}`, `= ${FR(`${v.I} × 10<sup>3</sup>`, N(q, 0))}`, `= ${N(v.I * 1000 / q, 4)} = ${N(v.I * 1000 / q * 100, 2)} %`, 'hl'),
      LF('ประสิทธิภาพเชิงความร้อนเบรก', `η<sub>tb</sub> = ${FR('BHP', MF + '·C<sub>v</sub>')}`, `= ${FR(`${N(B, 2)} × 10<sup>3</sup>`, N(q, 0))}`, `= ${N(B * 1000 / q, 4)} = ${N(B * 1000 / q * 100, 2)} %`, 'hl'),
      LF('ประสิทธิภาพเชิงกล', `η<sub>m</sub> = ${FR('BHP', 'IHP')}`, `= ${FR(N(B, 2), v.I)}`, `= ${N(B / v.I, 4)} = ${N(B / v.I * 100, 2)} %`, 'hl')
    ].join('');
  },
  full(v) {
    const rho = v.sg * 1000, m = sig3(v.V * 1e-6 * rho / v.t), mh = r2(m * 3600);
    const T = r2(v.kg * G * v.r), P = TAU * T * v.rpm / 60;
    return [
      LF('① ความหนาแน่น', 'ρ = (s.g.)·ρ<sub>w</sub>', `= (${v.sg})(1,000)`, `= ${N(rho, 0)} kg/m³`),
      LF('② อัตราสิ้นเปลืองเชื้อเพลิง', `${MF} = ${FR('V·ρ', 'Δt')}`, `= ${FR(`(${v.V} × 10<sup>−6</sup>)(${N(rho, 0)})`, v.t)}`, `= ${SCI(m, 2)} kg/s = ${N(mh, 2)} kg/hr`),
      LF('③ แรงบิด', 'T<sub>e</sub> = F · r', `= (${v.kg} × 9.81)(${v.r})`, `= ${N(T, 2)} N·m`),
      LF('④ กำลังม้าเบรก', 'BHP = 2π·T<sub>e</sub>·n', `= 2π(${N(T, 2)})(${FR(v.rpm, 60)})`, `= ${N(P, 2)} W = ${N(P / 1000, 2)} kW`),
      LF('⑤ อัตราสิ้นเปลืองเชื้อเพลิงจำเพาะ', `s.f.c. = ${FR(MF, 'BHP')}`, `= ${FR(N(mh, 2), N(P / 1000, 2))}`, `= ${N(mh / r2(P / 1000), 2)} kg/kW·hr`, 'hl'),
      LF('⑥ ประสิทธิภาพเชิงความร้อนเบรก', `η<sub>tb</sub> = ${FR('BHP', MF + '·C<sub>v</sub>')}`, `= ${FR(N(P, 2), `(${SCI(m, 2)})(${v.cv} × 10<sup>6</sup>)`)}`, `= ${N(P / (m * v.cv * 1e6) * 100, 2)} %`, 'hl')
    ].join('');
  }
};
function runCalc(box) {
  const v = {};
  let bad = false;
  $$('[data-k]', box).forEach(i => {
    if (i.tagName === 'SELECT') v[i.dataset.k] = i.value;
    else { const x = parseFloat(i.value); if (!isFinite(x) || x <= 0) bad = true; v[i.dataset.k] = x; }
  });
  const out = $('[data-out]', box);
  if (bad && box.dataset.ecalc !== 'units') { out.innerHTML = '<div class="calc-err">กรอกตัวเลขที่มากกว่า 0 ให้ครบทุกช่อง</div>'; return; }
  if (box.dataset.ecalc === 'units' && !isFinite(v.v)) { out.innerHTML = '<div class="calc-err">กรอกค่ากำลังเป็นตัวเลข</div>'; return; }
  out.innerHTML = ECALC[box.dataset.ecalc](v);
}

/* ===== รูป 3-5 ไดนาโมมิเตอร์แบบโพรนีเบรก ===== */
function pronyShow(kg, r) {
  const t = $('#pronyKg'); if (t) t.textContent = `${kg} kg`;
  const rr = $('#pronyR'); if (rr) rr.textContent = `r = ${r} m`;
}
(function pronyDraw() {
  const svg = $('#pronySvg'); if (!svg) return;
  const cx = 140, cy = 140, R = 92;
  let spokes = '';
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; spokes += `<line x1="${cx}" y1="${cy}" x2="${cx + (R - 12) * Math.cos(a)}" y2="${cy + (R - 12) * Math.sin(a)}" stroke="#6c737c" stroke-width="7"/>`; }
  let blocks = '';
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + .26; blocks += `<rect x="${cx - 9}" y="${cy - R - 14}" width="18" height="12" rx="2" fill="#a0672f" transform="rotate(${a * 180 / Math.PI} ${cx} ${cy})"/>`; }
  svg.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#9aa5b3" stroke-width="14"/>
    <g class="spin" style="transform-origin:${cx}px ${cy}px;transform-box:view-box">${spokes}<circle cx="${cx}" cy="${cy - R + 8}" r="5" fill="var(--accent)"/></g>
    <circle cx="${cx}" cy="${cy}" r="15" fill="#5d6876"/>
    ${blocks}
    <circle cx="${cx}" cy="${cy}" r="${R + 16}" fill="none" stroke="#3b3f45" stroke-width="3"/>
    <path d="M${cx + 70} ${cy - 80} L${cx + 230} ${cy + 92} L${cx + 70} ${cy + 80}" fill="none" stroke="#3b3f45" stroke-width="7" stroke-linejoin="round"/>
    <path d="M${cx - 40} ${cy - 58} A70 70 0 0 1 ${cx + 40} ${cy - 58}" fill="none" stroke="var(--torque)" stroke-width="4"/>
    <path d="M${cx + 40} ${cy - 58} l-2 -12 l12 6z" fill="var(--torque)"/>
    <text x="${cx}" y="${cy - 64}" text-anchor="middle" class="svg-b" fill="var(--torque)">n</text>
    <line x1="${cx}" y1="${cy + 28}" x2="${cx + 230}" y2="${cy + 28}" stroke="var(--brand)" stroke-width="1.5"/>
    <line x1="${cx + 230}" y1="${cy + 20}" x2="${cx + 230}" y2="${cy + 92}" stroke="var(--brand)" stroke-width="1.2" stroke-dasharray="4 3"/>
    <text id="pronyR" x="${cx + 140}" y="${cy + 22}" text-anchor="middle" class="svg-b" fill="var(--brand)">r = 0.15 m</text>
    <path d="M${cx + 222} ${cy + 92} l8 -12 l8 12z" fill="var(--text)"/>
    <rect x="${cx + 170}" y="${cy + 104}" width="140" height="14" rx="3" fill="#7a8796"/>
    <rect x="${cx + 286}" y="${cy - 10}" width="16" height="114" rx="4" fill="#9aa5b3" stroke="var(--text)" stroke-width="1.5"/>
    <rect x="${cx + 270}" y="${cy - 34}" width="48" height="26" rx="5" fill="var(--lcd-bg)"/>
    <text id="pronyKg" x="${cx + 294}" y="${cy - 16}" text-anchor="middle" fill="var(--lcd-text)" font-size="12" font-weight="700">12.3 kg</text>
    <circle cx="${cx + 186}" cy="${cy + 126}" r="9" fill="var(--surface)" stroke="var(--text)" stroke-width="2"/>
    <circle cx="${cx + 294}" cy="${cy + 126}" r="9" fill="var(--surface)" stroke="var(--text)" stroke-width="2"/>
    <line x1="${cx + 230}" y1="${cy + 132}" x2="${cx + 230}" y2="${cy + 152}" stroke="var(--bad)" stroke-width="4"/>
    <path d="M${cx + 222} ${cy + 148} l8 12 l8 -12z" fill="var(--bad)"/>
    <text x="${cx + 244}" y="${cy + 156}" class="svg-b" fill="var(--bad)">F</text>
    <text x="${cx + 236}" y="${cy + 50}" class="svg-m">เครื่องชั่ง →</text>
    <text x="10" y="20" class="svg-m">ล้อช่วยแรงของเครื่องยนต์ + ก้อนเบรกรัดรอบล้อ</text>`;
})();

/* ===== วาดชุดทดลอง (รูป 3-8) ใช้ทั้งรูปส่วนประกอบ และชุดทดลองเสมือน ===== */
function rigSVG(o) {
  const fuel = !!o.fuel, lab = !!o.labels;
  const dx = fuel ? 0 : -60;               // ถ้าไม่มีชุดวัดน้ำมัน เลื่อนทั้งรูปไปทางซ้าย
  const X = x => x + dx;
  const cx = X(400), cy = 235;
  let spokes = '';
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; spokes += `<line x1="${cx - 46 * Math.cos(a)}" y1="${cy - 46 * Math.sin(a)}" x2="${cx + 46 * Math.cos(a)}" y2="${cy + 46 * Math.sin(a)}" stroke="#5d6876" stroke-width="6"/>`; }
  let ticks = '';
  for (let k = 0; k <= 5; k++) {
    const a = (-120 + k * 48) * Math.PI / 180, tx = X(615), ty = 100;
    ticks += `<line x1="${tx + 30 * Math.sin(a)}" y1="${ty - 30 * Math.cos(a)}" x2="${tx + 36 * Math.sin(a)}" y2="${ty - 36 * Math.cos(a)}" stroke="var(--text)" stroke-width="2"/>`;
    ticks += `<text x="${tx + 22 * Math.sin(a)}" y="${ty - 22 * Math.cos(a) + 4}" text-anchor="middle" font-size="9" fill="var(--muted)">${k}</text>`;
  }
  let scaleTicks = '';
  for (let k = 0; k <= 15; k += 5) scaleTicks += `<line x1="${X(489)}" x2="${X(495)}" y1="${70 + k / 15 * 70}" y2="${70 + k / 15 * 70}" stroke="#333" stroke-width="1"/><text x="${X(486)}" y="${73 + k / 15 * 70}" font-size="8" text-anchor="end" fill="var(--muted)">${k}</text>`;
  const hl = (p, x, y, w, h) => lab ? `<rect class="part-hl" data-hl="${p}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="var(--accent)" stroke-width="4" stroke-dasharray="8 5"/>` : '';
  const L = (x1, y1, x2, y2, t, anchor = 'start') => lab ? `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="mach-line"/><text x="${x2 + (anchor === 'end' ? -4 : 4)}" y="${y2 + 4}" class="mach-label" text-anchor="${anchor}">${t}</text>` : '';
  return `
  <defs>
    <linearGradient id="gEng" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f08a3c"/><stop offset="1" stop-color="#b9541a"/></linearGradient>
    <linearGradient id="gSteel" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d7dde3"/><stop offset="1" stop-color="#8c97a3"/></linearGradient>
  </defs>
  <rect x="${X(fuel ? 10 : 70)}" y="300" width="${fuel ? 680 : 620}" height="36" rx="6" fill="#3d4450"/>
  ${fuel ? `
  <!-- ชุดวัดอัตราสิ้นเปลืองเชื้อเพลิง -->
  <line x1="68" y1="30" x2="68" y2="300" stroke="#6c737c" stroke-width="4"/>
  <rect x="14" y="26" width="46" height="40" rx="8" fill="var(--accent-soft)" stroke="var(--text)" stroke-width="1.5"/>
  <rect x="16" y="40" width="42" height="24" rx="6" fill="var(--fuel)" opacity=".8"/>
  <text x="37" y="20" text-anchor="middle" font-size="10" fill="var(--muted)">กระปุกน้ำมัน</text>
  <path d="M30 66 V285 H110 V262" fill="none" stroke="#6c737c" stroke-width="5"/>
  <path d="M30 66 V285 H110 V262" fill="none" stroke="var(--fuel)" stroke-width="2.5" data-r="fuelflow" class="flow"/>
  <g data-r="valve" transform="translate(30 240)"><circle r="9" fill="var(--surface)" stroke="var(--bad)" stroke-width="3"/><line data-r="valveH" x1="0" y1="-14" x2="0" y2="14" stroke="var(--bad)" stroke-width="4" stroke-linecap="round"/></g>
  <text x="14" y="232" font-size="10" fill="var(--bad)" text-anchor="start">วาล์ว</text>
  <rect x="47" y="70" width="14" height="215" fill="var(--surface)" stroke="var(--text)" stroke-width="1.5"/>
  <circle cx="54" cy="200" r="15" fill="var(--surface)" stroke="var(--text)" stroke-width="1.5"/>
  <clipPath id="clipBur"><rect x="48" y="71" width="12" height="214"/><circle cx="54" cy="200" r="14"/></clipPath>
  <rect data-r="level" x="38" y="176" width="32" height="120" fill="var(--fuel)" opacity=".85" clip-path="url(#clipBur)"/>
  <line x1="40" y1="176" x2="68" y2="176" stroke="var(--bad)" stroke-width="2"/><line x1="40" y1="224" x2="68" y2="224" stroke="var(--bad)" stroke-width="2"/>
  <text x="76" y="180" font-size="9" fill="var(--bad)">ขีดบน</text><text x="76" y="228" font-size="9" fill="var(--bad)">ขีดล่าง (5 ml)</text>
  <text x="54" y="322" text-anchor="middle" fill="#ffd36a" font-size="13" font-weight="700" data-r="watch">⏱ 0.00 s</text>
  <rect x="98" y="248" width="24" height="18" rx="3" fill="#9aa5b3" stroke="var(--text)" stroke-width="1.2"/>` : ''}
  <!-- เครื่องยนต์ -->
  ${hl('engine', X(98), 120, 216, 186)}
  <rect x="${X(140)}" y="130" width="120" height="40" rx="12" fill="#c62f25" stroke="var(--text)" stroke-width="1.5"/>
  <rect x="${X(188)}" y="122" width="24" height="10" rx="3" fill="#333"/>
  <rect x="${X(110)}" y="170" width="190" height="130" rx="14" fill="url(#gEng)" stroke="var(--text)" stroke-width="1.5"/>
  ${[0, 1, 2, 3, 4].map(i => `<line x1="${X(130)}" x2="${X(200)}" y1="${190 + i * 12}" y2="${190 + i * 12}" stroke="#8a3a10" stroke-width="3"/>`).join('')}
  <circle cx="${X(250)}" cy="235" r="30" fill="#4a4f57" stroke="var(--text)" stroke-width="1.5"/>
  <text x="${X(250)}" y="285" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">เครื่องยนต์</text>
  <!-- คันเร่ง -->
  ${hl('throttle', X(262), 140, 54, 50)}
  <circle cx="${X(288)}" cy="172" r="5" fill="#222"/>
  <g data-r="throttle" transform="rotate(-60 ${X(288)} 172)"><line x1="${X(288)}" y1="172" x2="${X(288)}" y2="146" stroke="#222" stroke-width="5" stroke-linecap="round"/><circle cx="${X(288)}" cy="146" r="5" fill="var(--accent)"/></g>
  <!-- เพลาและดรัม -->
  <rect x="${X(300)}" y="229" width="100" height="12" fill="url(#gSteel)" stroke="var(--text)" stroke-width="1"/>
  ${hl('drum', X(334), 170, 182, 106)}
  <circle cx="${cx}" cy="${cy}" r="50" fill="url(#gSteel)" stroke="var(--text)" stroke-width="1.5"/>
  <g data-r="spokes">${spokes}</g>
  <circle cx="${cx}" cy="${cy}" r="55" fill="none" stroke="#7a4a1f" stroke-width="8" data-r="band"/>
  <circle cx="${cx}" cy="${cy}" r="8" fill="#333"/>
  <!-- แขนรับแรงบิด -->
  <rect x="${cx}" y="${cy - 6}" width="${X(500) - cx + 6}" height="12" rx="4" fill="#4a4f57"/>
  <line x1="${cx}" y1="${cy + 22}" x2="${X(500)}" y2="${cy + 22}" stroke="var(--brand)" stroke-width="1.2"/>
  <text x="${X(478)}" y="${cy + 38}" text-anchor="middle" font-size="11" fill="var(--brand)" font-weight="700">r = 0.1 m</text>
  <!-- ตัวปรับเบรก -->
  ${hl('brake', X(314), 266, 44, 44)}
  <line x1="${X(342)}" y1="282" x2="${X(358)}" y2="270" stroke="#4a4f57" stroke-width="4"/>
  <g data-r="knob"><circle cx="${X(336)}" cy="288" r="13" fill="var(--surface)" stroke="#c62f25" stroke-width="4"/><line x1="${X(336)}" y1="288" x2="${X(348)}" y2="281" stroke="#c62f25" stroke-width="4" stroke-linecap="round"/></g>
  <!-- โครงและเครื่องชั่งสปริง -->
  <rect x="${X(536)}" y="30" width="10" height="270" fill="#6c737c"/>
  <rect x="${X(476)}" y="28" width="70" height="10" fill="#6c737c"/>
  ${hl('scale', X(472), 40, 52, 140)}
  <line x1="${X(500)}" y1="38" x2="${X(500)}" y2="60" stroke="#333" stroke-width="2"/>
  <rect x="${X(488)}" y="60" width="24" height="90" rx="6" fill="#e2c044" stroke="var(--text)" stroke-width="1.5"/>
  <rect x="${X(495)}" y="66" width="10" height="78" fill="#fff" opacity=".8"/>
  ${scaleTicks}
  <rect data-r="pointer" x="${X(493)}" y="70" width="14" height="3" fill="var(--bad)"/>
  <line data-r="rod" x1="${X(500)}" y1="150" x2="${X(500)}" y2="${cy - 6}" stroke="#333" stroke-width="3"/>
  <!-- เครื่องวัดรอบ -->
  ${hl('tacho', X(568), 54, 96, 130)}
  <line x1="${X(546)}" y1="100" x2="${X(580)}" y2="100" stroke="#6c737c" stroke-width="5"/>
  <circle cx="${X(615)}" cy="100" r="40" fill="var(--surface)" stroke="var(--text)" stroke-width="2"/>
  ${ticks}
  <text x="${X(615)}" y="124" text-anchor="middle" font-size="8" fill="var(--muted)">×1000 rpm</text>
  <line data-r="needle" x1="${X(615)}" y1="100" x2="${X(615)}" y2="68" stroke="var(--bad)" stroke-width="3" stroke-linecap="round" transform="rotate(-120 ${X(615)} 100)"/>
  <circle cx="${X(615)}" cy="100" r="4" fill="var(--text)"/>
  <rect x="${X(578)}" y="150" width="74" height="26" rx="5" fill="var(--lcd-bg)"/>
  <text data-r="rpmTxt" x="${X(615)}" y="168" text-anchor="middle" fill="var(--lcd-text)" font-size="13" font-weight="700">0 rpm</text>
  ${L(X(150), 140, X(140), 104, 'เครื่องยนต์', 'end')}
  ${L(X(296), 146, X(330), 120, 'คันเร่ง')}
  ${L(X(330), 300, X(300), 350, 'คันปรับแรงเบรก', 'end')}
  ${L(X(512), 100, X(560), 214, 'เครื่องชั่งสปริง')}
  ${L(X(640), 70, X(640), 46, 'เครื่องวัดความเร็วรอบ', 'end')}
  ${L(X(425), 186, X(440), 156, 'ดรัมเบรก + แขนรับแรงบิด', 'end')}`;
}
/* อัปเดตส่วนที่ขยับได้ของรูปชุดทดลอง */
function rigUpdate(svg, s, o) {
  const dx = o.fuel ? 0 : -60, X = x => x + dx;
  const r = (k) => svg.querySelector(`[data-r="${k}"]`);
  r('spokes').setAttribute('transform', `rotate(${s.angle} ${X(400)} 235)`);
  r('throttle').setAttribute('transform', `rotate(${-60 + s.u * 80} ${X(288)} 172)`);
  r('knob').setAttribute('transform', `rotate(${s.b * 720} ${X(336)} 288)`);
  r('band').setAttribute('stroke-width', 6 + s.b * 6);
  const kg = clamp(s.kg, 0, 15);
  r('pointer').setAttribute('y', 70 + kg / 15 * 70);
  r('needle').setAttribute('transform', `rotate(${-120 + clamp(s.rpm, 0, 5000) / 1000 * 48} ${X(615)} 100)`);
  r('rpmTxt').textContent = `${Math.round(s.rpmShow)} rpm`;
  if (o.fuel) {
    r('level').setAttribute('y', 176 + clamp(s.used, 0, 5) / 5 * 48);
    r('valveH').setAttribute('transform', s.valveOpen ? '' : 'rotate(90)');
    r('fuelflow').style.display = s.valveOpen && s.running ? '' : 'none';
    r('watch').textContent = `⏱ ${N(s.watch, 2)} s`;
  }
}

/* รูปส่วนประกอบ (รูป 3-8) */
(function partsFig() {
  const svg = $('#partsSvg'); if (!svg) return;
  svg.setAttribute('viewBox', '10 0 640 360');
  svg.innerHTML = rigSVG({ fuel: false, labels: true });
  const st = { angle: 0, u: .3, b: .4, kg: 6, rpm: 3000, rpmShow: 3000, used: 0, valveOpen: true, watch: 0 };
  rigUpdate(svg, st, { fuel: false });
  let last = performance.now();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function loop(t) {
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    if (!reduce) { st.angle = (st.angle + dt * 300) % 360; rigUpdate(svg, st, { fuel: false }); }
    requestAnimationFrame(loop);
  })(last);
  $('#partsPick').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const on = !b.classList.contains('on');
    $$('#partsPick button').forEach(x => x.classList.toggle('on', on && x === b));
    $$('.part-hl', svg).forEach(h => h.classList.toggle('on', on && h.dataset.hl === b.dataset.p));
  });
})();

/* ===== แบบจำลองเครื่องยนต์เล็กแก๊สโซลีน (ค่าจำลอง) =====
   แรงบิดเบรกสูงสุดราว 8.2 N·m ที่ 3,100 rpm · กำลังเบรกสูงสุดราว 3.1 kW ที่ 4,000 rpm
   ที่แขน r = 0.1 m เครื่องชั่งอ่านได้ราว 7–8.4 kg ใกล้เคียงตัวอย่าง 3.5 และแบบฝึกหัดในหนังสือ */
const ENG = {
  TbFull: r => 8.25 - 1.1 * ((r - 3100) / 1000) ** 2,      // แรงบิดเบรกเมื่อลิ้นเร่งเปิดสุด (N·m)
  Tfr: r => 0.6 + 1.6 * (r / 4000) ** 2,                    // แรงบิดที่เสียให้ความเสียดทาน (N·m)
  Tp: r => 2.0 * r / 1000,                                  // ความสูญเสียจากการปั๊มอากาศเมื่อลิ้นเร่งหรี่ (คูณ 1−ลิ้นเร่ง)
  TiFull(r) { return this.TbFull(r) + this.Tfr(r); },       // แรงบิดอินดิเคตเมื่อลิ้นเร่งเปิดสุด
  thNL(r) { return (this.Tfr(r) + this.Tp(r)) / (this.TiFull(r) + this.Tp(r)); },   // ลิ้นเร่งที่ทำให้หมุนตัวเปล่าที่รอบ r
  th(u) {                                                   // ตำแหน่งคันเร่ง (0–1) → การเปิดลิ้นเร่งจริง
    return u <= 0.5 ? this.thNL(1400 + 3100 * u / 0.5) : lerp(this.thNL(4500), 1, (u - 0.5) / 0.5);
  },
  brake: (b, r) => 14 * b * Math.pow(Math.max(r, 0) / 3000, 1.5),   // แรงบิดจากเบรก (N·m)
  etaTi: (r, th) => 0.26 * (1 - 0.06 * ((r - 3000) / 1000) ** 2) * (0.3 + 0.7 * th),
  J: 0.012,
  // แรงเบรกที่ทำให้เครื่องหมุนคงที่ที่รอบ r เมื่อคันเร่งอยู่ที่ u (ใช้กับปุ่ม "ช่วยปรับให้")
  bEq(u, r) { const th = this.th(u); return (this.TiFull(r) * th - this.Tfr(r) - this.Tp(r) * (1 - th)) / (14 * Math.pow(r / 3000, 1.5)); }
};
const FUELS = {
  g95: { name: 'แก๊สโซลีน (เบนซิน 95)', sg: 0.74, cv: 43.7 },
  e10: { name: 'แก๊สโซฮอล์ 95 (E10)', sg: 0.75, cv: 41.7 },
  e20: { name: 'แก๊สโซฮอล์ E20', sg: 0.76, cv: 40.2 }
};
const RPMS = [2000, 2500, 3000, 3500, 4000];
const RIG_INFO = {
  '3.1': { title: 'ใบงาน 3.1 งานทดสอบแรงบิดและกำลังม้าของเครื่องยนต์', fuel: false, load: true,
    aim: 'ศึกษาแรงบิด กำลังม้า และความสัมพันธ์กับความเร็วรอบ' },
  '3.2': { title: 'ใบงาน 3.2 งานทดสอบอัตราการสิ้นเปลืองเชื้อเพลิง', fuel: true, load: false,
    aim: 'ศึกษาอัตราการสิ้นเปลืองเชื้อเพลิงของเครื่องยนต์ (เดินตัวเปล่า ไม่ใส่ภาระเบรก)' },
  '3.3': { title: 'ใบงาน 3.3 งานทดสอบประสิทธิภาพเชิงความร้อนเบรกของเครื่องยนต์', fuel: true, load: true,
    aim: 'ศึกษาประสิทธิภาพเชิงความร้อนเบรก (วัดแรงบิดและน้ำมันไปพร้อมกัน)' }
};

function buildRig(host) {
  const mode = host.dataset.rig, info = RIG_INFO[mode];
  const uid = 'rig' + mode.replace('.', '');
  const steps = mode === '3.1'
    ? ['สตาร์ตและอุ่นเครื่องยนต์ 3 นาที (ในแบบจำลองย่อเหลือ 3 วินาที)', 'เลือกความเร็วรอบที่จะทดสอบ แล้วปรับคันเร่งให้ได้รอบนั้น',
      'ค่อย ๆ หมุนคันปรับแรงเบรกทีละน้อย เมื่อรอบตก ให้เร่งชดเชยให้รอบคงที่ ทำซ้ำจนคันเร่งเปิดสุด', 'อ่านค่าเครื่องชั่งสปริง แล้วกด "บันทึกค่า"',
      'ลดเบรกจนสุด ผ่อนคันเร่ง ให้เดินเบาสักครู่ แล้วทดสอบรอบถัดไป (2,000–4,000 rpm)']
    : mode === '3.2'
      ? ['วัดความถ่วงจำเพาะของน้ำมันด้วยไฮโดรมิเตอร์ แล้วคำนวณความหนาแน่น', 'สตาร์ตและอุ่นเครื่องยนต์ (เปิดวาล์วไว้ให้น้ำมันเต็มหลอดแก้ว)',
        'เร่งเครื่องยนต์ให้ได้รอบที่ต้องการ (ไม่ใส่เบรก)', 'ปิดวาล์ว แล้วจับเวลาที่น้ำมันลดลง 5 ml (นาฬิกาเดินและหยุดเอง)',
        'กด "บันทึกค่า" แล้วเปิดวาล์วให้น้ำมันเติมหลอดแก้ว ก่อนทดสอบรอบถัดไป']
      : ['วัดความถ่วงจำเพาะของน้ำมันด้วยไฮโดรมิเตอร์', 'สตาร์ตและอุ่นเครื่องยนต์ (เปิดวาล์วไว้)',
        'ตั้งรอบ แล้วเพิ่มเบรกพร้อมเร่งชดเชยจนคันเร่งเปิดสุด รอบคงที่ (เหมือนใบงาน 3.1)', 'ปิดวาล์ว จับเวลาน้ำมัน 5 ml ขณะรักษารอบและคันเร่งให้คงที่',
        'กด "บันทึกค่า" (บันทึกทั้งแรงที่เครื่องชั่งและเวลา) แล้วเปิดวาล์ว ลดเบรก ทดสอบรอบถัดไป'];
  host.innerHTML = `
  <div class="lab" id="${uid}">
    <div class="lab-top"><h3>🔧 ชุดทดลองเสมือน: ${info.title}</h3><span class="lab-sub">จุดประสงค์: ${info.aim}</span></div>
    <div class="lab-body">
      <div class="lab-panel"><p class="lab-step"><span class="n">?</span>ขั้นตอนตามใบงาน</p>
        <ol style="margin:0;padding-left:1.3em;font-size:.93rem">${steps.map(s => `<li>${s}</li>`).join('')}</ol></div>
      ${info.fuel ? `
      <div class="lab-panel"><p class="lab-step"><span class="n">1</span>วัดความถ่วงจำเพาะของน้ำมันเชื้อเพลิง</p>
        <div class="hydro-box">
          <svg viewBox="0 0 120 230" data-r="hydro" aria-label="ไฮโดรมิเตอร์ในกระบอกตวง" style="width:100%;max-width:170px;display:block;margin:0 auto"></svg>
          <div>
            <label class="small muted" style="display:block">ชนิดน้ำมันเชื้อเพลิง
              <select data-r="fuelSel" style="font:inherit;color:var(--text);background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:6px 10px;width:100%;margin-top:4px">
                ${Object.entries(FUELS).map(([k, f]) => `<option value="${k}">${f.name}</option>`).join('')}</select></label>
            <div class="ctrl"><button class="btn btn-accent btn-sm" data-r="hydroBtn">⬇ หย่อนไฮโดรมิเตอร์ลงในน้ำมัน 100 ml</button></div>
            <div class="lf-list" data-r="hydroOut"></div>
            <p class="small muted" style="margin:6px 0 0">ค่าความถ่วงจำเพาะและค่าความร้อนของน้ำมันแต่ละชนิดเป็นค่าโดยประมาณ</p>
          </div>
        </div></div>` : ''}
      <div class="lab-row r-machine">
        <div class="mach-box"><svg class="rig-svg" data-r="svg" viewBox="${info.fuel ? '0 0 700 360' : '10 0 640 360'}" aria-label="ชุดทดลองเครื่องยนต์"></svg>
          <div class="readouts" style="margin-top:8px">
            <div class="ro">ความเร็วรอบ<b data-r="roRpm">0</b>rpm</div>
            <div class="ro alt">เครื่องชั่งสปริง<b data-r="roKg">0.0</b>kg</div>
            <div class="ro">คันเร่ง<b data-r="roU">0</b>% ${info.load ? '' : ''}</div>
            ${info.fuel ? '<div class="ro alt">นาฬิกาจับเวลา<b data-r="roW">0.00</b>s · ใช้น้ำมัน <span data-r="roMl">0.0</span> ml</div>' : '<div class="ro alt">ตัวปรับเบรก<b data-r="roB">0</b>%</div>'}
          </div>
        </div>
        <div class="rig-ctrl">
          <div class="ctrl" style="margin:0"><button class="btn btn-go" data-r="startBtn">▶ สตาร์ตเครื่องยนต์</button>
            ${info.fuel ? '<button class="btn btn-line" data-r="valveBtn" disabled>🔒 ปิดวาล์ว เริ่มจับเวลา</button>' : ''}</div>
          <div class="ctl"><div class="ctl-h">รอบที่จะทดสอบ <span class="small">(✓ = บันทึกแล้ว)</span></div>
            <div class="rpm-pick" data-r="rpmPick">${RPMS.map((r, i) => `<button data-v="${r}" class="${i ? '' : 'on'}">${r.toLocaleString('en-US')}</button>`).join('')}</div></div>
          <div class="ctl"><div class="ctl-h">คันเร่ง <b data-r="uTxt">0%</b></div>
            <div class="ctl-r"><button data-r="uMinus" aria-label="ผ่อนคันเร่ง">−</button><input type="range" data-r="u" min="0" max="1" step="0.005" value="0" aria-label="คันเร่ง"><button data-r="uPlus" aria-label="เร่ง">+</button></div></div>
          ${info.load ? `<div class="ctl"><div class="ctl-h">คันปรับแรงเบรก <b data-r="bTxt">0%</b></div>
            <div class="ctl-r"><button data-r="bMinus" aria-label="คลายเบรก">−</button><input type="range" data-r="b" min="0" max="1" step="0.005" value="0" aria-label="แรงเบรก"><button data-r="bPlus" aria-label="เพิ่มเบรก">+</button></div></div>` : ''}
          ${info.fuel ? `<div class="speed">ความเร็วนาฬิกาจับเวลา: <button data-sp="1" class="on">×1 เวลาจริง</button><button data-sp="5">×5</button><button data-sp="20">×20</button></div>` : ''}
          <ul class="check-list" data-r="checks"></ul>
          <div class="ctrl" style="margin:0"><button class="btn btn-accent" data-r="recBtn" disabled>📝 บันทึกค่า</button><button class="btn btn-line" data-r="autoBtn" title="ปรับคันเร่งและเบรกให้อัตโนมัติ">🤖 ช่วยปรับให้</button><button class="btn btn-line" data-r="resetBtn">↺ ล้างตาราง</button></div>
          <div class="status" data-r="status">กด "สตาร์ตเครื่องยนต์" เพื่อเริ่ม</div>
        </div>
      </div>
      <div class="lab-panel"><p class="lab-step"><span class="n">✓</span>บันทึกผลการทดลอง <span class="small muted" style="font-weight:400">(กดแถวเพื่อดูตัวอย่างการคำนวณ)</span></p>
        <div class="table-wrap"><table class="rig-table" data-r="table"></table></div>
        <div class="lf-list" data-r="rowCalc"></div></div>
      <div class="lab-panel"><div class="ch-head"><p class="lab-step" style="margin:0"><span class="n">📈</span>กราฟจากผลการทดลอง</p><div class="tabs" data-r="chTabs"></div></div>
        <div class="chart-box"><svg viewBox="0 0 620 320" data-r="chart"></svg></div>
        <div class="small muted" data-r="chNote" style="margin-top:6px"></div></div>
    </div>
  </div>`;
  const R = k => host.querySelector(`[data-r="${k}"]`);
  const svg = R('svg');
  svg.innerHTML = rigSVG({ fuel: info.fuel, labels: false });

  const s = { running: false, starting: 0, warm: 0, rpm: 0, rpmShow: 0, u: 0, b: 0, angle: 0, kg: 0, kgShow: 0,
    valveOpen: true, measuring: false, used: 0, watch: 0, measOk: true, measDone: null, speed: 1,
    target: 2000, fuel: 'g95', sg: null, stableT: 0, stalled: false, auto: false };
  const rows = {};       // บันทึกผลตามรอบ
  let sel = null, chartTab = 0;

  /* --- ไฮโดรมิเตอร์ --- */
  function drawHydro(depth, sg) {
    const h = R('hydro'); if (!h) return;
    const fl = FUELS[s.fuel];
    h.innerHTML = `
      <rect x="30" y="40" width="60" height="176" rx="4" fill="var(--surface)" stroke="var(--text)" stroke-width="2"/>
      <rect x="22" y="212" width="76" height="10" rx="3" fill="var(--muted)"/>
      <rect x="32" y="90" width="56" height="124" fill="var(--fuel)" opacity=".55"/>
      <text x="92" y="86" font-size="9" fill="var(--muted)" text-anchor="middle">100 ml</text>
      <g transform="translate(0 ${depth})">
        <rect x="56" y="-10" width="8" height="120" fill="#f7f7f7" stroke="var(--text)" stroke-width="1"/>
        <ellipse cx="60" cy="130" rx="13" ry="26" fill="#f7f7f7" stroke="var(--text)" stroke-width="1"/>
        <circle cx="60" cy="150" r="7" fill="#555"/>
        ${[0, 1, 2, 3, 4, 5, 6].map(i => `<line x1="56" x2="${i % 2 ? 61 : 64}" y1="${10 + i * 12}" y2="${10 + i * 12}" stroke="#333" stroke-width="1"/>`).join('')}
      </g>
      ${sg ? `<line x1="40" x2="112" y1="90" y2="90" stroke="var(--bad)" stroke-width="1.5" stroke-dasharray="3 2"/><text x="60" y="30" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bad)">อ่านได้ ${sg.toFixed(2)}</text>` : ''}`;
  }
  function hydroOut() {
    const o = R('hydroOut'); if (!o) return;
    const f = FUELS[s.fuel];
    o.innerHTML = s.sg
      ? LF('ความหนาแน่นของน้ำมัน', 'ρ = (s.g.)·ρ<sub>w</sub>', `= (${s.sg.toFixed(2)})(1,000)`, `= ${N(s.sg * 1000, 0)} kg/m³`, 'hl') +
        (mode === '3.3' ? LF('ค่าความร้อนของเชื้อเพลิง (จากตาราง)', 'C<sub>v</sub>', '', `= ${f.cv} MJ/kg = ${f.cv} × 10<sup>6</sup> J/kg`) : '')
      : LF('ความหนาแน่นของน้ำมัน', 'ρ = (s.g.)·ρ<sub>w</sub>', 'ยังไม่ได้วัด s.g.', '?', 'wait');
  }
  if (info.fuel) {
    drawHydro(-60, null); hydroOut();
    R('fuelSel').addEventListener('change', e => {
      if (Object.keys(rows).length && !confirm('เปลี่ยนชนิดน้ำมันจะล้างตารางผลการทดลอง ต้องการเปลี่ยนหรือไม่?')) { e.target.value = s.fuel; return; }
      s.fuel = e.target.value; s.sg = null; clearRows(); drawHydro(-60, null); hydroOut();
    });
    R('hydroBtn').addEventListener('click', () => {
      const target = 46 - (FUELS[s.fuel].sg - 0.74) * 400;    // น้ำมันหนาแน่นมาก ไฮโดรมิเตอร์ลอยสูง
      let d = -60; const t0 = performance.now();
      (function sink(t) {
        const k = Math.min(1, (t - t0) / 1200);
        d = lerp(-60, target, 1 - Math.pow(1 - k, 3)) + (k < 1 ? Math.sin(k * 20) * 4 * (1 - k) : 0);
        drawHydro(d, k >= 1 ? FUELS[s.fuel].sg : null);
        if (k < 1) requestAnimationFrame(sink); else { s.sg = FUELS[s.fuel].sg; hydroOut(); }
      })(t0);
    });
  }

  /* --- ปุ่มควบคุม --- */
  const setU = v => { s.u = clamp(v, 0, 1); R('u').value = s.u; };
  const setB = v => { s.b = clamp(v, 0, 1); if (R('b')) R('b').value = s.b; };
  R('u').addEventListener('input', e => { s.auto = false; s.u = +e.target.value; });
  hold(R('uMinus'), () => { s.auto = false; setU(s.u - 0.005); });
  hold(R('uPlus'), () => { s.auto = false; setU(s.u + 0.005); });
  if (info.load) {
    R('b').addEventListener('input', e => { s.auto = false; s.b = +e.target.value; });
    hold(R('bMinus'), () => { s.auto = false; setB(s.b - 0.005); });
    hold(R('bPlus'), () => { s.auto = false; setB(s.b + 0.005); });
  }
  R('rpmPick').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (s.measuring) { status('กำลังจับเวลาอยู่ เปิดวาล์วเพื่อยกเลิกก่อนเปลี่ยนรอบ', 'warn'); return; }
    s.target = +b.dataset.v; s.measDone = null;
    $$('button', R('rpmPick')).forEach(x => x.classList.toggle('on', x === b));
  });
  R('startBtn').addEventListener('click', () => {
    if (s.running || s.starting) { stopEngine('ดับเครื่องยนต์แล้ว'); return; }
    if (info.fuel && !s.sg) { status('ขั้นที่ 1 ก่อน: วัดความถ่วงจำเพาะของน้ำมันด้วยไฮโดรมิเตอร์', 'warn'); return; }
    if (s.u > 0.15 || s.b > 0.02) { status('ก่อนสตาร์ต ให้ผ่อนคันเร่งและคลายเบรกจนสุด เพื่อความปลอดภัย', 'warn'); setU(0); setB(0); }
    s.starting = 0.8; s.stalled = false; status('กำลังสตาร์ต…');
  });
  if (info.fuel) {
    R('valveBtn').addEventListener('click', () => {
      if (s.valveOpen) {
        if (!s.running || s.warm > 0) return;
        if (Math.abs(s.rpm - s.target) > 50 || (info.load && s.u < 0.98)) {
          status(info.load ? 'ยังปิดวาล์วไม่ได้: ต้องให้คันเร่งเปิดสุดและรอบคงที่ที่รอบเป้าหมายก่อน (ดูรายการตรวจสอบ)' : 'ยังปิดวาล์วไม่ได้: ปรับรอบให้คงที่ที่รอบเป้าหมายก่อน', 'warn');
          return;
        }
        s.valveOpen = false; s.measuring = true; s.used = 0; s.watch = 0; s.measOk = true; s.measDone = null;
        s.measRpm = s.target;
      } else {
        s.valveOpen = true; s.measuring = false; s.used = 0;
        status('เปิดวาล์วแล้ว น้ำมันไหลเติมหลอดแก้วจนเต็มขีดบน', '');
      }
    });
    $$('.speed button', host).forEach(b => b.addEventListener('click', () => {
      s.speed = +b.dataset.sp; $$('.speed button', host).forEach(x => x.classList.toggle('on', x === b));
    }));
  }
  R('autoBtn').addEventListener('click', () => {
    if (!s.running) { status('สตาร์ตเครื่องยนต์ก่อน แล้วจึงให้ช่วยปรับ', 'warn'); return; }
    s.auto = !s.auto;
    R('autoBtn').classList.toggle('btn-accent', s.auto);
    status(s.auto ? 'ระบบกำลังปรับคันเร่ง' + (info.load ? 'และเบรก' : '') + 'ให้ (ในการทดลองจริงผู้ทดลองต้องปรับเอง)' : 'ยกเลิกการช่วยปรับ', '');
  });
  R('resetBtn').addEventListener('click', () => { if (!Object.keys(rows).length || confirm('ล้างตารางผลการทดลองทั้งหมด?')) clearRows(); });
  R('recBtn').addEventListener('click', record);

  function clearRows() { Object.keys(rows).forEach(k => delete rows[k]); sel = null; renderTable(); renderChart(); markDone(); }
  function hold(btn, fn) {
    let t = null;
    const go = () => { fn(); t = setTimeout(function rep() { fn(); t = setTimeout(rep, 60); }, 350); };
    const end = () => clearTimeout(t);
    btn.addEventListener('pointerdown', e => { e.preventDefault(); go(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, end));
    btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
  }
  function status(t, cls = '') { const el = R('status'); el.innerHTML = t; el.className = 'status ' + cls; s.msgT = 3; }
  function stopEngine(msg, cls = '') {
    s.running = false; s.starting = 0; s.measuring = false; s.valveOpen = true; s.used = 0; s.auto = false;
    R('autoBtn').classList.remove('btn-accent');
    status(msg, cls);
  }

  /* --- ตรวจเงื่อนไขก่อนบันทึก --- */
  function conditions() {
    const near = Math.abs(s.rpm - s.target) <= 50;
    const c = [['เครื่องยนต์ติดและอุ่นเครื่องแล้ว', s.running && s.warm <= 0],
      [`ความเร็วรอบคงที่ที่ ${s.target.toLocaleString('en-US')} ± 50 rpm`, s.running && near && s.stableT > 1]];
    if (info.load) c.push(['คันเร่งเปิดสุด (ลิ้นเร่งเปิดสุด)', s.u >= 0.98]);
    else c.push(['ไม่ใส่แรงเบรก (เดินตัวเปล่า)', true]);
    if (info.fuel) c.push(['จับเวลาน้ำมัน 5 ml ครบ ที่รอบนี้', !!s.measDone && s.measDone.rpm === s.target]);
    return c;
  }

  function record() {
    const c = conditions();
    if (!c.every(x => x[1])) { status('ยังบันทึกไม่ได้: ' + c.filter(x => !x[1]).map(x => x[0]).join(' · '), 'warn'); return; }
    const row = { rpm: s.target };
    if (info.load) row.kg = Math.round(s.kgShow * 10) / 10;
    if (info.fuel) { row.V = 5; row.t = Math.round(s.measDone.t * 100) / 100; row.sg = s.sg; row.cv = FUELS[s.fuel].cv; }
    rows[s.target] = row; sel = s.target;
    renderTable(); renderChart(); markDone();
    const next = RPMS.find(r => !rows[r]);
    status(`บันทึกค่าที่ ${s.target.toLocaleString('en-US')} rpm แล้ว ✔` + (next ? ` ต่อไป: ${info.load ? 'ลดเบรก ผ่อนคันเร่ง ' : ''}${info.fuel ? 'เปิดวาล์ว ' : ''}แล้วทดสอบที่ ${next.toLocaleString('en-US')} rpm` : ' ครบทุกรอบแล้ว ดูกราฟด้านล่าง'), 'ok');
    if (next) {
      s.target = next; s.measDone = null;
      $$('button', R('rpmPick')).forEach(x => x.classList.toggle('on', +x.dataset.v === next));
    }
  }
  function markDone() { $$('button', R('rpmPick')).forEach(x => x.classList.toggle('done', !!rows[+x.dataset.v])); }

  /* --- คำนวณผลของแต่ละแถว --- */
  function calc(row) {
    const o = { n: row.rpm / 60 };
    if (row.kg != null) { o.F = row.kg * G; o.T = r2(o.F * 0.1); o.P = TAU * o.T * o.n; o.hp = o.P / 746; }
    if (row.t != null) { o.rho = row.sg * 1000; o.m = sig3(row.V * 1e-6 * o.rho / row.t); o.mh = o.m * 3600; }
    if (o.P && o.m) { o.sfc = o.mh / (o.P / 1000); o.eta = o.P / (o.m * row.cv * 1e6) * 100; }
    return o;
  }
  function renderTable() {
    const t = R('table');
    let head;
    if (mode === '3.1') head = '<tr><th rowspan="2">ความเร็วรอบ<br>(rpm)</th><th colspan="2">แรงจากเครื่องชั่งสปริง</th><th>แรงบิด</th><th colspan="2">กำลังม้าเบรก</th></tr><tr><th>(kg)</th><th>(N)</th><th>(N·m)</th><th>(W)</th><th>HP</th></tr>';
    else if (mode === '3.2') head = '<tr><th>ความเร็วรอบ<br>(rpm)</th><th>เชื้อเพลิงที่ใช้<br>(ml)</th><th>ระยะเวลา<br>(s)</th><th>ṁ<sub>f</sub><br>(kg/s)</th><th>ṁ<sub>f</sub><br>(kg/hr)</th></tr>';
    else head = '<tr><th>รอบ<br>(rpm)</th><th>แรง<br>(kg)</th><th>แรง<br>(N)</th><th>แรงบิด<br>(N·m)</th><th>BHP<br>(W)</th><th>น้ำมัน<br>(cc)</th><th>เวลา<br>(s)</th><th>ṁ<sub>f</sub><br>(kg/s)</th><th>s.f.c.<br>(kg/kW·hr)</th><th>η<sub>tb</sub><br>(%)</th></tr>';
    const body = RPMS.map(r => {
      const row = rows[r];
      const dash = '<td class="miss">–</td>';
      if (!row) {
        const nc = mode === '3.1' ? 5 : mode === '3.2' ? 4 : 9;
        return `<tr data-r="${r}"><td>${r.toLocaleString('en-US')}</td>${mode === '3.2' ? '<td>5</td>' + dash.repeat(3) : dash.repeat(nc)}</tr>`;
      }
      const o = calc(row), cs = r === sel ? ' class="sel"' : '';
      if (mode === '3.1') return `<tr data-r="${r}"${cs}><td>${r.toLocaleString('en-US')}</td><td>${row.kg.toFixed(1)}</td><td>${N(o.F, 2)}</td><td>${N(o.T, 2)}</td><td>${N(o.P, 1)}</td><td>${N(o.hp, 2)}</td></tr>`;
      if (mode === '3.2') return `<tr data-r="${r}"${cs}><td>${r.toLocaleString('en-US')}</td><td>5</td><td>${N(row.t, 2)}</td><td>${SCI(o.m, 2)}</td><td>${N(o.mh, 3)}</td></tr>`;
      return `<tr data-r="${r}"${cs}><td>${r.toLocaleString('en-US')}</td><td>${row.kg.toFixed(1)}</td><td>${N(o.F, 2)}</td><td>${N(o.T, 2)}</td><td>${N(o.P, 1)}</td><td>5</td><td>${N(row.t, 2)}</td><td>${SCI(o.m, 2)}</td><td>${N(o.sfc, 3)}</td><td>${N(o.eta, 2)}</td></tr>`;
    }).join('');
    t.innerHTML = `<thead>${head}</thead><tbody>${body}</tbody>`;
    renderRowCalc();
  }
  R('table').addEventListener('click', e => {
    const tr = e.target.closest('tr[data-r]'); if (!tr || !rows[+tr.dataset.r]) return;
    sel = +tr.dataset.r; renderTable();
  });
  function renderRowCalc() {
    const out = R('rowCalc');
    if (!sel || !rows[sel]) { out.innerHTML = '<div class="small muted">ยังไม่มีข้อมูล — บันทึกค่าอย่างน้อย 1 รอบ แล้วตัวอย่างการคำนวณจะขึ้นที่นี่</div>'; return; }
    const row = rows[sel], o = calc(row);
    let h = `<div class="small" style="font-weight:600">ตัวอย่างการคำนวณ ที่ ${sel.toLocaleString('en-US')} rpm</div>`;
    if (row.kg != null) {
      h += LF('① แรงบิดของเครื่องยนต์', 'T<sub>e</sub> = F · r', `= (${row.kg.toFixed(1)} × 9.81)(0.1)`, `= ${N(o.T, 2)} N·m`, 'hl');
      h += LF(`② กำลังม้าเบรก${mode === '3.1' ? ' (P<sub>e</sub>)' : ''}`, `${mode === '3.1' ? 'P<sub>e</sub>' : 'BHP'} = 2π·T<sub>e</sub>·n`, `= 2π(${N(o.T, 2)})(${FR(sel, 60)})`, `= ${N(o.P, 2)} W = ${N(o.hp, 2)} HP`, 'hl');
    }
    if (row.t != null) {
      h += LF(`${row.kg != null ? '③' : '①'} ความหนาแน่นของน้ำมัน`, 'ρ = (s.g.)·ρ<sub>w</sub>', `= (${row.sg.toFixed(2)})(1,000)`, `= ${N(o.rho, 0)} kg/m³`);
      h += LF(`${row.kg != null ? '④' : '②'} อัตราการสิ้นเปลืองเชื้อเพลิง`, `${MF} = ${FR('V·ρ', 'Δt')}`, `= ${FR(`(5 × 10<sup>−6</sup>)(${N(o.rho, 0)})`, N(row.t, 2))}`, `= ${SCI(o.m, 2)} kg/s = ${N(o.mh, 3)} kg/hr`, 'hl');
    }
    if (o.sfc) {
      h += LF('⑤ อัตราการสิ้นเปลืองเชื้อเพลิงจำเพาะ', `s.f.c. = ${FR(MF, 'BHP')}`, `= ${FR(N(o.mh, 3), N(o.P / 1000, 3))}`, `= ${N(o.sfc, 3)} kg/kW·hr`, 'hl');
      h += LF('⑥ ประสิทธิภาพเชิงความร้อนเบรก', `η<sub>tb</sub> = ${FR('BHP', MF + '·C<sub>v</sub>')}`, `= ${FR(N(o.P, 1), `(${SCI(o.m, 2)})(${row.cv} × 10<sup>6</sup>)`)}`, `= ${N(o.eta, 2)} %`, 'hl');
    }
    out.innerHTML = h;
  }

  /* --- กราฟ --- */
  const CH = mode === '3.1'
    ? [['แรงบิด–รอบ', o => o.T, 'แรงบิด (N·m)', 'var(--torque)'], ['กำลังม้าเบรก–รอบ', o => o.P, 'กำลังม้าเบรก (W)', 'var(--power)']]
    : mode === '3.2'
      ? [['อัตราสิ้นเปลือง–รอบ', o => o.mh, 'อัตราสิ้นเปลืองเชื้อเพลิง (kg/hr)', 'var(--fuel)']]
      : [['แรงบิด', o => o.T, 'แรงบิด (N·m)', 'var(--torque)'], ['กำลังม้าเบรก', o => o.P, 'กำลังม้าเบรก (W)', 'var(--power)'],
        ['s.f.c.', o => o.sfc, 's.f.c. (kg/kW·hr)', 'var(--sfc)'], ['η<sub>tb</sub>', o => o.eta, 'ประสิทธิภาพเชิงความร้อนเบรก (%)', 'var(--eff)']];
  R('chTabs').innerHTML = CH.map((c, i) => `<button data-i="${i}" class="${i ? '' : 'on'}">${c[0]}</button>`).join('');
  R('chTabs').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    chartTab = +b.dataset.i; $$('button', R('chTabs')).forEach(x => x.classList.toggle('on', x === b)); renderChart();
  });
  function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(v))); const f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }
  function renderChart() {
    const c = CH[chartTab];
    const pts = RPMS.filter(r => rows[r]).map(r => [r, c[1](calc(rows[r]))]);
    const vals = pts.map(p => p[1]);
    let ymin = 0, ymax = vals.length ? niceMax(Math.max(...vals) * 1.15) : 10;
    if (vals.length && (chartTab >= 2 && mode === '3.3')) { // s.f.c. และ η ไม่ต้องเริ่มที่ศูนย์ จะได้เห็นรูปกราฟชัด
      const lo = Math.min(...vals), hi = Math.max(...vals), span = Math.max(hi - lo, hi * 0.1);
      ymin = Math.max(0, Math.floor((lo - span * 0.6) / (span / 2)) * (span / 2)); ymax = ymin + Math.ceil((hi + span * 0.6 - ymin) / (span / 2)) * (span / 2);
    }
    const step = (ymax - ymin) / 5;
    R('chart').innerHTML = lineChart({
      W: 620, H: 320, m: { l: 70, r: 18, t: 14, b: 44 },
      x: { min: 1500, max: 4500, step: 500, label: 'ความเร็วรอบของเครื่องยนต์ (rpm)' },
      y: { min: ymin, max: ymax, step, label: c[2], fmt: v => (Math.abs(v) >= 100 ? Math.round(v).toLocaleString('en-US') : +v.toFixed(3)) },
      series: [{ pts, color: c[3], dots: true }],
      empty: pts.length ? '' : 'บันทึกผลอย่างน้อย 2 รอบ เพื่อดูกราฟ'
    });
    const notes = {
      '3.1': 'สังเกต: แรงบิดสูงสุดที่รอบปานกลาง แต่กำลังม้าเบรกยังเพิ่มต่อไปถึงรอบที่สูงกว่า (หัวข้อ 3.5.2)',
      '3.2': 'สังเกต: เมื่อรอบสูงขึ้น เครื่องยนต์ใช้น้ำมันต่อวินาทีมากขึ้น เวลาที่น้ำมัน 5 ml หมดจึงสั้นลง',
      '3.3': 'สังเกต: s.f.c. ต่ำสุดตรงกับรอบที่ η<sub>tb</sub> สูงสุด เพราะใช้น้ำมันน้อยที่สุดต่อกำลังที่ได้'
    };
    R('chNote').innerHTML = pts.length >= 3 ? notes[mode] : '';
  }

  /* --- วนจำลองการทำงาน --- */
  let last = performance.now(), visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
  function tick(t) {
    let dt = Math.min(0.1, (t - last) / 1000); last = t;
    if (!visible && !s.running && !s.measuring) { requestAnimationFrame(tick); return; }
    // ช่วยปรับอัตโนมัติ
    if (s.auto && s.running && s.warm <= 0) {
      const go = (cur, to, rate) => cur + clamp(to - cur, -rate * dt, rate * dt);
      if (info.load) {
        // เพิ่มคันเร่งทีละน้อย พร้อมเพิ่มเบรกให้พอดีที่ทำให้รอบคงที่ (เหมือนผู้ทดลองที่ชำนาญ)
        if (Math.abs(s.rpm - s.target) < 150 || s.u > 0.5) setU(go(s.u, 1, 0.15));
        else setU(go(s.u, (s.target - 1400) / 6200, 0.3));
        const be = Math.max(0, ENG.bEq(s.u, s.target)) - (s.target - s.rpm) * 0.0001;
        setB(go(s.b, be, 0.4));
      } else setU(go(s.u, (s.target - 1400) / 6200, 0.2));
    }
    const sub = Math.ceil(dt / 0.008), h = dt / sub;
    for (let i = 0; i < sub; i++) {
      if (s.starting > 0) {
        s.starting -= h; s.rpm = Math.min(1400, s.rpm + h * 1800);
        if (s.starting <= 0) { s.running = true; s.warm = 3; s.rpm = Math.max(s.rpm, 1300); }
        continue;
      }
      const th = s.running ? ENG.th(s.u) : 0;
      let Ti = s.running ? ENG.TiFull(s.rpm) * th : 0;
      if (s.rpm > 4700) Ti = 0;                         // ตัวจำกัดรอบ
      const Tb = ENG.brake(s.b, s.rpm), Tf = ENG.Tfr(s.rpm) + ENG.Tp(s.rpm) * (1 - th);
      s.rpm = Math.max(0, s.rpm + (Ti - Tf - Tb) / ENG.J * h * 60 / TAU);
      s.Ti = Ti; s.th = th; s.Tb = Tb;
    }
    if (s.running && s.rpm < 900) {
      stopEngine('⚠️ เครื่องยนต์ดับ! แรงเบรกมากเกินไปสำหรับคันเร่งตอนนี้ — คลายเบรก แล้วสตาร์ตใหม่ (ในการทดลองจริงต้องค่อย ๆ เพิ่มเบรกพร้อมเร่งชดเชย)', 'bad');
    }
    if (s.running && s.warm > 0) { s.warm -= dt; if (s.warm <= 0) status('อุ่นเครื่องครบแล้ว เลือกรอบ แล้วปรับคันเร่ง' + (info.load ? ' และค่อย ๆ เพิ่มแรงเบรก' : ''), 'ok'); }
    s.angle = (s.angle + s.rpm / 60 * 360 * dt * 0.05) % 360;   // หมุนช้าลงให้ตามองทัน
    s.kg = s.Tb / (0.1 * G) || 0;
    s.kgShow = s.kg + (s.running && s.kg > 0.5 ? (Math.random() - .5) * 0.06 : 0);
    s.rpmShow = s.rpm + (s.running ? (Math.random() - .5) * 14 : 0);
    s.stableT = Math.abs(s.rpm - s.target) <= 50 ? s.stableT + dt : 0;

    // วัดน้ำมัน
    if (info.fuel) {
      if (s.measuring) {
        const mf = s.running ? s.Ti * (s.rpm * TAU / 60) / (ENG.etaTi(s.rpm, s.th) * FUELS[s.fuel].cv * 1e6) : 0;  // kg/s
        const mlps = mf / (s.sg * 1000) * 1e6;
        const step = Math.min(dt * s.speed, mlps > 0 ? (5 - s.used) / mlps : dt * s.speed);
        s.used += mlps * step; s.watch += step;
        if (Math.abs(s.rpm - s.measRpm) > 80 || (info.load && s.u < 0.98) || !s.running) s.measOk = false;
        if (s.used >= 5 - 1e-9) {
          s.measuring = false;
          if (s.measOk) { s.measDone = { rpm: s.measRpm, t: s.watch }; status(`น้ำมันลดลงครบ 5 ml ใช้เวลา <b>${N(s.watch, 2)} s</b> — กด "บันทึกค่า" ได้เลย แล้วเปิดวาล์ว`, 'ok'); }
          else status('การจับเวลาครั้งนี้ใช้ไม่ได้ เพราะรอบหรือคันเร่งไม่คงที่ระหว่างวัด เปิดวาล์วแล้ววัดใหม่', 'bad');
        }
      }
      const vb = R('valveBtn');
      vb.disabled = !(s.running && s.warm <= 0) && s.valveOpen;
      vb.textContent = s.valveOpen ? '🔒 ปิดวาล์ว เริ่มจับเวลา' : (s.measuring ? '🔓 เปิดวาล์ว (ยกเลิก)' : '🔓 เปิดวาล์ว เติมน้ำมันเข้าหลอดแก้ว');
      R('roW').textContent = N(s.watch, 2); R('roMl').textContent = N(s.used, 1);
    }
    // แสดงผล
    rigUpdate(svg, s, { fuel: info.fuel });
    R('roRpm').textContent = Math.round(s.rpmShow).toLocaleString('en-US');
    R('roKg').textContent = N(Math.max(0, s.kgShow), 1);
    R('roU').textContent = Math.round(s.u * 100);
    R('uTxt').textContent = Math.round(s.u * 100) + '%' + (s.u >= 0.98 ? ' (เปิดสุด)' : '');
    if (R('bTxt')) R('bTxt').textContent = Math.round(s.b * 100) + '%';
    if (R('roB')) R('roB').textContent = Math.round(s.b * 100);
    R('startBtn').textContent = s.running || s.starting > 0 ? '■ ดับเครื่องยนต์' : '▶ สตาร์ตเครื่องยนต์';
    R('startBtn').className = 'btn ' + (s.running || s.starting > 0 ? 'btn-line' : 'btn-go');
    const c = conditions();
    R('checks').innerHTML = c.map(x => `<li class="${x[1] ? 'ok' : ''}">${x[0]}</li>`).join('');
    R('recBtn').disabled = !c.every(x => x[1]);
    // คำแนะนำระหว่างทำ
    s.msgT = (s.msgT || 0) - dt;
    if (s.running && s.warm <= 0 && s.msgT <= 0 && !s.measuring) {
      const near = Math.abs(s.rpm - s.target) <= 50;
      let m = '';
      if (info.load && s.u < 0.98) m = s.rpm > s.target + 50 ? 'รอบสูงกว่าเป้าหมาย: เพิ่มแรงเบรกอีกนิด' : s.rpm < s.target - 50 ? 'รอบต่ำกว่าเป้าหมาย: เร่งเครื่องเพิ่ม' : 'รอบตรงแล้ว ค่อย ๆ เพิ่มเบรกอีก แล้วเร่งชดเชย จนคันเร่งเปิดสุด';
      else if (info.load && !near) m = s.rpm > s.target ? 'คันเร่งเปิดสุดแล้ว แต่รอบสูงไป: เพิ่มแรงเบรก' : 'คันเร่งเปิดสุดแล้ว แต่รอบต่ำไป: คลายเบรกลงเล็กน้อย';
      else if (!info.load && !near) m = s.rpm < s.target ? 'ค่อย ๆ เร่งเครื่องให้ได้รอบตามเป้าหมาย' : 'รอบสูงไป ผ่อนคันเร่งลงเล็กน้อย';
      else if (info.fuel && !(s.measDone && s.measDone.rpm === s.target)) m = s.valveOpen ? 'รอบคงที่แล้ว ปิดวาล์วเพื่อเริ่มจับเวลา' : '';
      else m = 'พร้อมแล้ว อ่านค่าเครื่องชั่ง/เวลา แล้วกด "บันทึกค่า"';
      if (m) { const el = R('status'); el.innerHTML = m; el.className = 'status' + (near ? ' ok' : ''); }
    } else if (s.measuring && s.msgT <= 0) {
      const el = R('status'); el.innerHTML = `⏱ กำลังจับเวลา… น้ำมันลดลงแล้ว ${N(s.used, 2)} ml (รักษารอบให้คงที่)`; el.className = 'status';
    }
    requestAnimationFrame(tick);
  }
  renderTable(); renderChart(); requestAnimationFrame(tick);
}
$$('[data-rig]').forEach(buildRig);

/* ===== 3.5 กราฟสมรรถนะแบบโต้ตอบ ===== */
const PERF = {
  gas: { name: 'แก๊สโซลีนรอบสูง (แบบรูป 3-14)', min: 1000, max: 10500, step: 1000, cv: 43.7,
    T: r => r < 5500 ? 145 - 1.5 * ((r - 5500) / 1000) ** 2 : 145 - 2.0 * ((r - 5500) / 1000) ** 2,
    sfc: r => r < 7000 ? 0.32 + 0.0033 * ((r - 7000) / 1000) ** 2 : 0.32 + 0.0139 * ((r - 7000) / 1000) ** 2 },
  dsl: { name: 'ดีเซลเทอร์โบ แรงบิดแบบ Flat Torque', min: 1000, max: 4400, step: 500, cv: 42.6,
    T: r => r < 1400 ? 190 + 60 * (1 - (1 - (r - 1000) / 400) ** 2) : r <= 2700 ? 250 : 250 - 75 * ((r - 2700) / 1700) ** 1.6,
    sfc: r => 0.215 + 0.012 * ((r - 2000) / 1000) ** 2 }
};
(function perfChart() {
  const box = $('#perf'); if (!box) return;
  let eng = 'gas', at = 0.5;
  const vis = { T: true, P: true, sfc: true, eta: true };
  box.innerHTML = `
    <div class="ch-head"><div class="tabs" data-r="eng" style="margin:0">${Object.entries(PERF).map(([k, e], i) => `<button data-k="${k}" class="${i ? '' : 'on'}">${e.name}</button>`).join('')}</div>
      <div class="perf-legend" data-r="leg">
        <button data-s="T"><i style="background:var(--torque)"></i>แรงบิด</button><button data-s="P"><i style="background:var(--power)"></i>กำลังม้า</button>
        <button data-s="sfc"><i style="background:var(--sfc)"></i>s.f.c.</button><button data-s="eta"><i style="background:var(--eff)"></i>ประสิทธิภาพ</button></div></div>
    <div class="chart-box"><svg viewBox="0 0 720 520" data-r="svg" style="touch-action:pan-y"></svg></div>
    <div class="slider-row"><span class="small muted">รอบ</span><input type="range" data-r="sl" min="0" max="1" step="0.002" value="0.5" aria-label="ความเร็วรอบ"><b data-r="rpm" style="min-width:90px;text-align:right"></b></div>
    <div class="perf-read" data-r="read"></div>
    <div class="note note-info perf-note" data-r="note"></div>`;
  const R = k => box.querySelector(`[data-r="${k}"]`);
  const W = 720, l = 70, r = 70, t1 = 20, b1 = 240, t2 = 290, b2 = 470;
  function draw() {
    const E = PERF[eng], X = v => l + (v - E.min) / (E.max - E.min) * (W - l - r);
    const rs = []; for (let v = E.min; v <= E.max; v += (E.max - E.min) / 120) rs.push(v);
    const data = rs.map(v => { const T = E.T(v), P = TAU * T * v / 60 / 1000, s = E.sfc(v); return { v, T, P, s, eta: 3.6 / (s * E.cv) * 100 }; });
    const maxT = data.reduce((a, d) => d.T > a.T ? d : a), maxP = data.reduce((a, d) => d.P > a.P ? d : a), minS = data.reduce((a, d) => d.s < a.s ? d : a);
    const Tmax = Math.ceil(maxT.T * 1.25 / 20) * 20, Pmax = Math.ceil(maxP.P * 1.2 / 20) * 20;
    const Smin = 0.1, Smax = 0.6, Emin = 0, Emax = 50;
    const Y1 = (v, mx) => b1 - v / mx * (b1 - t1), Y2 = (v, lo, hi) => b2 - (v - lo) / (hi - lo) * (b2 - t2);
    let s = '';
    for (let v = E.min; v <= E.max + 1; v += E.step) s += `<line class="ch-grid" x1="${X(v)}" x2="${X(v)}" y1="${t1}" y2="${b1}"/><line class="ch-grid" x1="${X(v)}" x2="${X(v)}" y1="${t2}" y2="${b2}"/><text class="ch-tick" x="${X(v)}" y="${b2 + 16}" text-anchor="middle">${v.toLocaleString('en-US')}</text>`;
    for (let k = 0; k <= 4; k++) {
      const y = b1 - k / 4 * (b1 - t1), y2 = b2 - k / 4 * (b2 - t2);
      s += `<line class="ch-grid" x1="${l}" x2="${W - r}" y1="${y}" y2="${y}"/><line class="ch-grid" x1="${l}" x2="${W - r}" y1="${y2}" y2="${y2}"/>`;
      s += `<text class="ch-tick" x="${l - 6}" y="${y + 4}" text-anchor="end" fill="var(--power)">${Math.round(Pmax * k / 4)}</text>`;
      s += `<text class="ch-tick" x="${W - r + 6}" y="${y + 4}" fill="var(--torque)">${Math.round(Tmax * k / 4)}</text>`;
      s += `<text class="ch-tick" x="${l - 6}" y="${y2 + 4}" text-anchor="end">${(Smin + (Smax - Smin) * k / 4).toFixed(3)}</text>`;
      s += `<text class="ch-tick" x="${W - r + 6}" y="${y2 + 4}">${Emin + (Emax - Emin) * k / 4}</text>`;
    }
    s += `<rect x="${l}" y="${t1}" width="${W - l - r}" height="${b1 - t1}" fill="none" class="ch-axis"/><rect x="${l}" y="${t2}" width="${W - l - r}" height="${b2 - t2}" fill="none" class="ch-axis"/>`;
    s += `<text class="ch-lab" transform="translate(16 ${(t1 + b1) / 2}) rotate(-90)" text-anchor="middle" fill="var(--power)">กำลังม้าเบรก (kW)</text>`;
    s += `<text class="ch-lab" transform="translate(${W - 14} ${(t1 + b1) / 2}) rotate(90)" text-anchor="middle" fill="var(--torque)">แรงบิด (N·m)</text>`;
    s += `<text class="ch-lab" transform="translate(16 ${(t2 + b2) / 2}) rotate(-90)" text-anchor="middle" fill="var(--sfc)">s.f.c. (kg/kW·hr)</text>`;
    s += `<text class="ch-lab" transform="translate(${W - 14} ${(t2 + b2) / 2}) rotate(90)" text-anchor="middle" fill="var(--eff)">ประสิทธิภาพเชิงความร้อน (%)</text>`;
    s += `<text class="ch-lab" x="${(l + W - r) / 2}" y="${b2 + 40}" text-anchor="middle">ความเร็วรอบ Revolution (rpm)</text>`;
    const path = (f, Y) => 'M' + data.map(d => `${X(d.v).toFixed(1)},${Y(f(d)).toFixed(1)}`).join(' L');
    if (vis.P) s += `<path class="ch-line" stroke="var(--power)" d="${path(d => d.P, v => Y1(v, Pmax))}"/>`;
    if (vis.T) s += `<path class="ch-line" stroke="var(--torque)" d="${path(d => d.T, v => Y1(v, Tmax))}"/>`;
    if (vis.sfc) s += `<path class="ch-line" stroke="var(--sfc)" d="${path(d => d.s, v => Y2(v, Smin, Smax))}"/>`;
    if (vis.eta) s += `<path class="ch-line" stroke="var(--eff)" d="${path(d => d.eta, v => Y2(v, Emin, Emax))}"/>`;
    const mark = (x, y, c, txt, dy = -10) => `<circle cx="${x}" cy="${y}" r="6" fill="${c}" stroke="var(--surface)" stroke-width="2"/><text x="${x}" y="${y + dy}" text-anchor="middle" font-size="11.5" font-weight="700" fill="${c}">${txt}</text>`;
    if (vis.T) s += mark(X(maxT.v), Y1(maxT.T, Tmax), 'var(--torque)', `แรงบิดสูงสุด ${Math.round(maxT.T)} N·m`, eng === 'dsl' ? -12 : -12);
    if (vis.P) s += mark(X(maxP.v), Y1(maxP.P, Pmax), 'var(--power)', `กำลังสูงสุด ${maxP.P.toFixed(0)} kW`, 18);
    if (vis.sfc) s += mark(X(minS.v), Y2(minS.s, Smin, Smax), 'var(--sfc)', `s.f.c. ต่ำสุด`, 18);
    // เส้นอ่านค่า
    const rv = E.min + at * (E.max - E.min), d = { v: rv, T: E.T(rv) }; d.P = TAU * d.T * rv / 60 / 1000; d.s = E.sfc(rv); d.eta = 3.6 / (d.s * E.cv) * 100;
    s += `<line x1="${X(rv)}" x2="${X(rv)}" y1="${t1}" y2="${b2}" stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 4"/>`;
    if (vis.P) s += `<circle cx="${X(rv)}" cy="${Y1(d.P, Pmax)}" r="5" fill="var(--power)"/>`;
    if (vis.T) s += `<circle cx="${X(rv)}" cy="${Y1(d.T, Tmax)}" r="5" fill="var(--torque)"/>`;
    if (vis.sfc) s += `<circle cx="${X(rv)}" cy="${Y2(d.s, Smin, Smax)}" r="5" fill="var(--sfc)"/>`;
    if (vis.eta) s += `<circle cx="${X(rv)}" cy="${Y2(d.eta, Emin, Emax)}" r="5" fill="var(--eff)"/>`;
    s += `<rect x="${l}" y="${t1}" width="${W - l - r}" height="${b2 - t1}" fill="transparent" data-r="hit" style="cursor:crosshair"/>`;
    R('svg').innerHTML = s;
    R('rpm').textContent = Math.round(rv).toLocaleString('en-US') + ' rpm';
    R('read').innerHTML = `<div class="ro">แรงบิด<b>${N(d.T, 1)}</b>N·m</div><div class="ro">กำลังม้าเบรก<b>${N(d.P, 1)}</b>kW = ${N(d.P * 1000 / 736, 0)} PS</div>
      <div class="ro alt">s.f.c.<b>${N(d.s, 3)}</b>kg/kW·hr</div><div class="ro alt">ประสิทธิภาพเชิงความร้อน<b>${N(d.eta, 1)}</b>%</div>`;
    const tq = rv < maxT.v - 150 ? 'แรงบิดกำลัง<b>เพิ่มขึ้น</b>ตามรอบ' : rv > maxT.v + 150 ? (eng === 'dsl' && rv <= 2700 ? 'อยู่ในช่วง <b>Flat Torque</b> แรงบิดคงที่' : 'แรงบิด<b>ลดลง</b>แล้วแม้รอบเพิ่ม') : 'อยู่ที่<b>แรงบิดสูงสุด</b>';
    const pw = rv < maxP.v - 150 ? 'กำลังม้ายัง<b>เพิ่มขึ้น</b>' : rv > maxP.v + 150 ? 'กำลังม้า<b>ลดลง</b>แล้ว' : 'อยู่ที่<b>กำลังม้าสูงสุด</b>';
    R('note').innerHTML = `<b>📖 อ่านกราฟที่ ${Math.round(rv).toLocaleString('en-US')} rpm:</b> ${tq} · ${pw} · ` +
      (Math.abs(rv - minS.v) < 250 ? 's.f.c. <b>ต่ำสุด</b> (ประหยัดที่สุด)' : rv < minS.v ? 's.f.c. กำลังลดลง' : 's.f.c. กำลังเพิ่มขึ้น') +
      `<br><span class="small">รอบกำลังสูงสุด (${Math.round(maxP.v).toLocaleString('en-US')} rpm) สูงกว่ารอบแรงบิดสูงสุด (${eng === 'dsl' ? '1,400–2,700' : Math.round(maxT.v).toLocaleString('en-US')} rpm) เสมอ เพราะ P = 2πT·n</span>`;
  }
  R('sl').addEventListener('input', e => { at = +e.target.value; draw(); });
  R('eng').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; eng = b.dataset.k; $$('button', R('eng')).forEach(x => x.classList.toggle('on', x === b)); draw(); });
  R('leg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; vis[b.dataset.s] = !vis[b.dataset.s]; b.classList.toggle('off', !vis[b.dataset.s]); draw(); });
  const svgEl = R('svg');
  const pick = e => {
    const p = svgEl.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(svgEl.getScreenCTM().inverse());
    at = clamp((q.x - l) / (W - l - r), 0, 1); R('sl').value = at; draw();
  };
  svgEl.addEventListener('pointerdown', e => { if (e.target.dataset.r === 'hit' || e.target.closest('svg')) { pick(e); svgEl.setPointerCapture(e.pointerId); } });
  svgEl.addEventListener('pointermove', e => { if (e.buttons) pick(e); });
  draw();
})();

/* ===== ฝึกอ่านกราฟ (แบบฝึกหัด 3.1 ตอนที่ 2) ===== */
(function readGraph() {
  const svg = $('#readSvg'), box = $('#readQ'); if (!svg) return;
  const E = PERF.gas, l = 50, r = 20, t = 20, b = 290, W = 470;
  const X = v => l + (v - 1000) / 9500 * (W - l - r);
  const curve = (f, lo, hi, y0, y1) => { const pts = []; for (let v = 1000; v <= 10500; v += 250) pts.push([X(v), y1 - (f(v) - lo) / (hi - lo) * (y1 - y0)]); return pts; };
  const T = curve(E.T, 60, 160, 30, 150), P = curve(v => TAU * E.T(v) * v / 60000, 0, 130, 60, 270), S = curve(E.sfc, 0.25, 0.75, 170, 280);
  const at = (pts, v) => pts[Math.round((v - 1000) / 250)];
  const lab = (p, txt, c, dx = 0, dy = -10) => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${c}" stroke="var(--surface)" stroke-width="1.5"/><text x="${p[0] + dx}" y="${p[1] + dy}" text-anchor="middle" font-weight="700" font-size="15" fill="${c}">${txt}</text>`;
  svg.innerHTML = `<line class="ch-axis" x1="${l}" y1="${t}" x2="${l}" y2="${b}"/><line class="ch-axis" x1="${l}" y1="${b}" x2="${W - r}" y2="${b}"/>
    <text class="ch-lab" x="${(l + W) / 2}" y="${b + 30}" text-anchor="middle">ความเร็วรอบ (rpm) →</text>
    <path class="ch-line" stroke="var(--torque)" d="${smoothPath(T)}"/><path class="ch-line" stroke="var(--power)" d="${smoothPath(P)}"/><path class="ch-line" stroke="var(--sfc)" d="${smoothPath(S)}"/>
    ${lab(at(T, 1500), 'A', 'var(--torque)')}${lab(at(T, 5500), 'B', 'var(--torque)')}${lab(at(T, 9500), 'C', 'var(--torque)', 0, -12)}
    ${lab(at(P, 2000), 'D', 'var(--power)', -12, -4)}${lab(at(P, 9000), 'E', 'var(--power)', 0, 20)}${lab(at(P, 10500), 'F', 'var(--power)', -12, 18)}
    ${lab(at(S, 1250), 'G', 'var(--sfc)', 12, -6)}${lab(at(S, 7000), 'H', 'var(--sfc)', 0, 20)}${lab(at(S, 10250), 'I', 'var(--sfc)', -14, 4)}
    <text x="${X(3200)}" y="${at(T, 3200)[1] - 10}" text-anchor="middle" font-size="11" fill="var(--torque)">แรงบิด</text>
    <text x="${X(7600)}" y="${at(P, 7600)[1] - 10}" text-anchor="end" font-size="11" fill="var(--power)">กำลังม้า</text>
    <text x="${X(3000)}" y="${at(S, 3000)[1] - 8}" font-size="11" fill="var(--sfc)">s.f.c.</text>`;
  const L = 'ABCDEFGHI'.split(''), UD = ['เพิ่มขึ้น', 'ลดลง', 'คงที่'];
  const sel = (ans, opts) => `<select data-a="${ans}"><option value="">เลือก</option>${opts.map(o => `<option>${o}</option>`).join('')}</select>`;
  const Q = [
    `1. จุด ${sel('E', L)} เป็นจุดที่เครื่องยนต์ให้กำลังม้าสูงสุด`,
    `2. จุดที่มีอัตราการสิ้นเปลืองเชื้อเพลิงจำเพาะต่ำสุดคือจุด ${sel('H', L)}`,
    `3. แรงบิดสูงสุดเกิดขึ้นที่จุด ${sel('B', L)}`,
    `4. s.f.c. มีค่า ${sel('ลดลง', UD)} ตามความเร็วรอบ แต่ถ้าความเร็วรอบสูงเกินไปจะมีค่า ${sel('เพิ่มขึ้น', UD)}`,
    `5. แรงบิดมีค่า ${sel('เพิ่มขึ้น', UD)} ตามความเร็วรอบ แต่ถ้าความเร็วรอบสูงเกินไปจะมีค่า ${sel('ลดลง', UD)}`,
    `6. กำลังม้ามีค่า ${sel('เพิ่มขึ้น', UD)} ตามความเร็วรอบ แต่ถ้าความเร็วรอบสูงเกินไปจะมีค่า ${sel('ลดลง', UD)}`,
    `7. ช่วงจุด ${sel('A', L)} ถึงจุด ${sel('B', L)} แรงบิดมีค่าเพิ่มขึ้นตามความเร็วรอบ`,
    `8. ช่วงจุด ${sel('E', L)} ถึงจุด ${sel('F', L)} แม้ความเร็วรอบจะเพิ่มขึ้น แต่กำลังม้ามีค่าลดลง`,
    `9. ช่วงจุด ${sel('B', L)} ถึงจุด ${sel('C', L)} แม้ความเร็วรอบจะเพิ่มขึ้น แต่แรงบิดมีค่าลดลง`,
    `10. ช่วงจุด ${sel('H', L)} ถึงจุด ${sel('I', L)} อัตราการสิ้นเปลืองเชื้อเพลิงจำเพาะเพิ่มขึ้นตามความเร็วรอบ`
  ];
  box.innerHTML = Q.map(q => `<div>${q}</div>`).join('') + '<div class="score" data-r="sc" style="text-align:center">ตอบถูก 0 / 17 ช่อง</div>';
  box.addEventListener('change', e => {
    const s = e.target; if (s.tagName !== 'SELECT') return;
    s.classList.toggle('right', s.value === s.dataset.a); s.classList.toggle('wrong', !!s.value && s.value !== s.dataset.a);
    box.querySelector('[data-r="sc"]').textContent = `ตอบถูก ${$$('select.right', box).length} / 17 ช่อง`;
  });
})();

/* ===== เครื่องคิดเลขทั้งหมด ===== */
$$('[data-ecalc]').forEach(box => {
  box.addEventListener('input', () => runCalc(box));
  box.addEventListener('change', () => runCalc(box));
  runCalc(box);
});

/* ===== แบบทดสอบ ===== */
const QUIZ = [
  { title: 'แรงบิดและกำลังม้า', qs: [
    { q: 'ผลของแรงที่พยายามทำให้วัตถุหมุน เรียกว่าอะไร', c: ['กำลังม้า', 'แรงบิด (ทอร์ก)', 'กำลังม้าเบรก', 'ความดันเฉลี่ย'], a: 1, e: 'แรงบิดหรือทอร์ก คือผลของแรงที่พยายามทำให้วัตถุหมุน T = F·r' },
    { q: 'การหาแรงบิดทำได้โดยวิธีใด', c: ['วัดความเร็วรอบแล้วคูณ 2π', 'วัดขนาดของแรง และระยะตั้งฉากจากจุดหมุนถึงแนวแรง แล้วคำนวณ T = F·r', 'วัดปริมาตรน้ำมันที่ใช้ไป', 'อ่านจากเกจวัดความดัน'], a: 1, e: 'ตามหัวข้อ 3.2: วัดแรง F และแขนของแรง r แล้วคูณกัน' },
    { q: 'ความสามารถทำให้วัตถุหนัก 550 lb เคลื่อนที่ได้ 1 ft ใน 1 s คือข้อใด', c: ['1 W', '1 PS', '1 HP', '1 kW'], a: 2, e: '1 HP (กำลังม้าอังกฤษ) = 550 ft·lb/s' },
    { q: 'ความสามารถทำให้วัตถุหนัก 75 kg เคลื่อนที่ได้ 1 m ใน 1 s คือข้อใด', c: ['1 PS', '1 HP', '1 W', '1 J'], a: 0, e: '1 PS (กำลังม้าเมตริก) = 75 kg·m/s ≈ 736 W' },
    { q: '746 W เท่ากับข้อใด', c: ['1 PS', '1 HP', '1 kW', '1 N·m'], a: 1, e: '1 HP = 746 W ส่วน 1 PS = 736 W' },
    { q: 'กำลังงานที่วัดได้จากเพลาข้อเหวี่ยง และพร้อมนำไปใช้งาน คือกำลังม้าชนิดใด', c: ['กำลังม้าอินดิเคต', 'กำลังม้าเบรก', 'กำลังม้าเสียดทาน', 'กำลังม้าเมตริก'], a: 1, e: 'กำลังม้าเบรก (BHP) หรือกำลังม้าเพลา วัดที่เพลาข้อเหวี่ยงหรือล้อช่วยแรง' },
    { q: 'กำลังงานที่ได้จากการระเบิดของไอดีในกระบอกสูบ คือข้อใด', c: ['IHP', 'BHP', 'FHP', 'PS'], a: 0, e: 'กำลังม้าอินดิเคต (IHP) คิดที่ลูกสูบเป็นหลัก' },
    { q: 'กำลังงานที่สูญเสียไปเพื่อเอาชนะแรงเสียดทาน คือข้อใด', c: ['IHP', 'BHP', 'FHP', 'imep'], a: 2, e: 'FHP = IHP − BHP' },
    { q: 'ข้อใดถูกต้องเสมอ', c: ['BHP > IHP', 'BHP = IHP', 'BHP < IHP', 'FHP > IHP'], a: 2, e: 'กำลังส่วนหนึ่งเสียให้ความเสียดทาน กำลังม้าเบรกจึงน้อยกว่ากำลังม้าอินดิเคตเสมอ' },
    { q: 'สูตร IHP ของเครื่องยนต์ 4 จังหวะ ต้องใช้ n/2 เพราะอะไร', c: ['เพราะมี 2 สูบ', 'เพราะทำงานครบ 1 กลวัตร เพลาหมุน 2 รอบ', 'เพราะต้องแปลง rpm เป็น rps', 'เพราะกำลังเสียไปครึ่งหนึ่ง'], a: 1, e: 'เครื่องยนต์ 4 จังหวะระเบิด 1 ครั้งทุก 2 รอบ' },
    { q: 'ใช้ทดสอบสมรรถนะโดยถอดเครื่องยนต์ออกจากตัวรถ แล้วนำมาติดตั้งกับเครื่องทดสอบ คือข้อใด', c: ['Chassis Dynamometer', 'Engine Dynamometer', 'Prony Brake', 'ไฮโดรมิเตอร์'], a: 1, e: 'Engine Dynamometer ทดสอบเครื่องยนต์ที่ไม่ได้ติดตั้งบนรถ' },
    { q: 'ใช้ทดสอบสมรรถนะได้โดยไม่ต้องถอดเครื่องยนต์ออกจากตัวรถ คือข้อใด', c: ['Engine Dynamometer', 'Chassis Dynamometer', 'Rope brake', 'หลอดแก้ววัดปริมาตร'], a: 1, e: 'Chassis Dynamometer นำรถไปจอดบนลูกกลิ้งได้เลย' },
    { q: 'ข้อใดเป็นชนิดของไดนาโมมิเตอร์ที่จำแนกตามกลไกการทำงาน', c: ['Engine Dynamometer', 'Chassis Dynamometer', 'Prony brake', 'Flat Torque'], a: 2, e: 'จำแนกตามกลไก 5 แบบ: rope brake, prony brake, water brake, electric brake, transmission' },
    { q: 'ไดนาโมมิเตอร์แขนยาว 0.10 m อ่านแรงได้ 7.8 kg แรงบิดเท่าใด', c: ['0.78 N·m', '7.65 N·m', '76.5 N·m', '78 N·m'], a: 1, e: 'T = (7.8 × 9.81)(0.10) = 7.65 N·m' },
    { q: 'แรงบิด 130 N·m ที่ 6,250 rpm กำลังม้าเบรกเท่าใด', c: ['13.54 kW', '85.08 kW', '812.5 kW', '5,105 kW'], a: 1, e: 'BHP = 2π(130)(6,250/60) = 85,084.8 W = 85.08 kW' },
    { q: 'เปรียบเทียบรอบที่ให้กำลังม้าสูงสุดกับรอบที่ให้แรงบิดสูงสุด ข้อใดถูก', c: ['รอบกำลังม้าสูงสุดต่ำกว่าเสมอ', 'รอบกำลังม้าสูงสุดสูงกว่าเสมอ', 'เป็นรอบเดียวกันเสมอ', 'ไม่มีความสัมพันธ์กัน'], a: 1, e: 'P = 2πT·n กำลังยังเพิ่มตามรอบแม้แรงบิดเริ่มลด' }
  ] },
  { title: 'อัตราสิ้นเปลืองเชื้อเพลิง', qs: [
    { q: 'ปริมาณเชื้อเพลิงที่ใช้ไปในหนึ่งหน่วยเวลา คือข้อใด', c: ['อัตราการสิ้นเปลืองเชื้อเพลิง', 'อัตราการสิ้นเปลืองเชื้อเพลิงจำเพาะ', 'ความหนาแน่น', 'ค่าความร้อน'], a: 0, e: 'ṁf = m/Δt' },
    { q: 'หน่วยของอัตราการสิ้นเปลืองเชื้อเพลิง คือข้อใด', c: ['kg/hr, kg/s', 'm³/kg, m³/N', 'kg/kW·hr', 'J/kg'], a: 0, e: 'kg/s หรือ kg/hr (นิยม kg/hr) ส่วน kg/kW·hr เป็นหน่วยของ s.f.c.' },
    { q: '"จับเวลาที่ปริมาตรเชื้อเพลิงถูกใช้ไป" คือข้อใด', c: ['วิธีการวัดอัตราการสิ้นเปลืองเชื้อเพลิง', 'วิธีวัดแรงบิด', 'วิธีวัดค่าความร้อน', 'วิธีวัดความถ่วงจำเพาะ'], a: 0, e: 'จับเวลาที่น้ำมันในหลอดแก้วลดลงตามปริมาตรที่กำหนด' },
    { q: 'อุปกรณ์ที่ใช้วัดปริมาตรเชื้อเพลิงที่ถูกใช้ไป คือข้อใด', c: ['ไฮโดรมิเตอร์', 'หลอดแก้ววัดปริมาตร', 'วาล์วปิด-เปิดน้ำมัน', 'เครื่องชั่งสปริง'], a: 1, e: 'หลอดแก้ววัดปริมาตร (มีขีดบนและขีดล่าง)' },
    { q: 'อุปกรณ์ที่ใช้วัดความถ่วงจำเพาะของน้ำมันเชื้อเพลิง คือข้อใด', c: ['ไฮโดรมิเตอร์', 'หลอดแก้ววัดปริมาตร', 'เทอร์โมมิเตอร์', 'ไดนาโมมิเตอร์'], a: 0, e: 'ไฮโดรมิเตอร์ชนิดเบากว่าน้ำ หย่อนลงในน้ำมันในกระบอกตวง 100 ml' },
    { q: 'น้ำมันมีความถ่วงจำเพาะ 0.82 มีความหนาแน่นเท่าใด', c: ['0.82 kg/m³', '82 kg/m³', '820 kg/m³', '8,200 kg/m³'], a: 2, e: 'ρ = (s.g.)(1,000) = 820 kg/m³' },
    { q: 'น้ำมัน 5 cc เท่ากับกี่ลูกบาศก์เมตร', c: ['5 × 10⁻³ m³', '5 × 10⁻⁶ m³', '5 × 10⁻⁹ m³', '0.5 m³'], a: 1, e: '1 cc = 1 cm³ = 10⁻⁶ m³' },
    { q: 'เปลี่ยน ṁf จาก kg/s เป็น kg/hr ต้องทำอย่างไร', c: ['หาร 60', 'คูณ 60', 'คูณ 3,600', 'หาร 3,600'], a: 2, e: '1 ชั่วโมง = 3,600 วินาที' },
    { q: 'ใช้น้ำมัน 5 cc ใน 4.29 s น้ำมัน s.g. 0.82 อัตราการสิ้นเปลืองเท่าใด', c: ['0.96 kg/hr', '3.44 kg/hr', '9.56 kg/hr', '34.4 kg/hr'], a: 1, e: 'ṁf = (5×10⁻⁶)(820)/4.29 = 9.56×10⁻⁴ kg/s × 3,600 = 3.44 kg/hr' },
    { q: 'ṁf = 3.44 kg/hr และ BHP = 9.5 kW อัตราสิ้นเปลืองเชื้อเพลิงจำเพาะเท่าใด', c: ['0.36 kg/kW·hr', '2.76 kg/kW·hr', '32.7 kg/kW·hr', '0.036 kg/kW·hr'], a: 0, e: 's.f.c. = 3.44/9.5 = 0.36 kg/kW·hr' },
    { q: 'หน่วยของอัตราการสิ้นเปลืองเชื้อเพลิงจำเพาะ คือข้อใด', c: ['kg/s', 'kg/hr', 'kg/kW·hr', 'kW/kg'], a: 2, e: 's.f.c. = ṁf (kg/hr) ÷ BHP (kW)' },
    { q: 'ในใบงาน 3.2 ขณะจับเวลา ต้องทำอย่างไรกับวาล์วของชุดทดลอง', c: ['เปิดวาล์ว', 'ปิดวาล์ว ให้เครื่องยนต์ดูดน้ำมันจากหลอดแก้ว', 'ถอดวาล์วออก', 'ไม่ต้องสนใจวาล์ว'], a: 1, e: 'ปิดวาล์ว แล้วจับเวลาที่น้ำมัน 5 ml ในหลอดแก้วถูกใช้ไป เสร็จแล้วเปิดวาล์วให้น้ำมันเติมเข้าหลอด' }
  ] },
  { title: 'ประสิทธิภาพ (ถูก/ผิด)', qs: [
    { q: 'อัตราส่วนระหว่างพลังงานที่ให้กับเครื่องยนต์ ต่อพลังงานที่เครื่องยนต์ผลิตได้ เรียกว่าประสิทธิภาพของเครื่องยนต์', c: ['✔ ถูก', '✘ ผิด'], a: 1, e: 'ผิด เพราะกลับเศษส่วน ที่ถูกคือ พลังงานที่ผลิตได้ ÷ พลังงานที่จ่ายให้' },
    { q: 'อัตราส่วนระหว่างกำลังงานที่กระบอกสูบ ต่อพลังงานความร้อนของเชื้อเพลิงที่ให้ในหนึ่งหน่วยเวลา เรียกว่าประสิทธิภาพเชิงความร้อนอินดิเคต', c: ['✔ ถูก', '✘ ผิด'], a: 0, e: 'ถูก ηti = IHP/(ṁf·Cv)' },
    { q: 'ประสิทธิภาพเชิงความร้อนเบรก คืออัตราส่วนระหว่างพลังงานความร้อนของเชื้อเพลิงต่อหน่วยเวลา ต่อกำลังงานที่เพลาข้อเหวี่ยง', c: ['✔ ถูก', '✘ ผิด'], a: 1, e: 'ผิด เพราะกลับเศษส่วน ที่ถูกคือ ηtb = BHP/(ṁf·Cv)' },
    { q: 'อัตราส่วนระหว่างกำลังงานที่กระบอกสูบ ต่อกำลังงานที่เพลาข้อเหวี่ยง เรียกว่าประสิทธิภาพเชิงกล', c: ['✔ ถูก', '✘ ผิด'], a: 1, e: 'ผิด ที่ถูกคือ ηm = BHP/IHP (กำลังที่เพลา ÷ กำลังที่กระบอกสูบ) ค่าจึงน้อยกว่า 1' },
    { q: 'การทดสอบประสิทธิภาพของเครื่องยนต์ ต้องทดสอบกำลังม้าและอัตราการสิ้นเปลืองเชื้อเพลิงไปพร้อม ๆ กัน', c: ['✔ ถูก', '✘ ผิด'], a: 0, e: 'ถูก เพราะ ηtb ต้องใช้ทั้ง BHP และ ṁf ที่สภาวะเดียวกัน (ใบงาน 3.3)' },
    { q: 'เครื่องยนต์ที่มีประสิทธิภาพเชิงความร้อนสูง เปลี่ยนพลังงานความร้อนของเชื้อเพลิงเป็นพลังงานกลได้มากกว่า', c: ['✔ ถูก', '✘ ผิด'], a: 0, e: 'ถูก ตามความหมายของประสิทธิภาพเชิงความร้อน' },
    { q: 'เครื่องยนต์ที่สูญเสียกำลังในการเอาชนะแรงเสียดทานมาก จะมีประสิทธิภาพเชิงกลมาก', c: ['✔ ถูก', '✘ ผิด'], a: 1, e: 'ผิด FHP มาก → BHP น้อยเมื่อเทียบ IHP → ηm น้อย' },
    { q: 'การทดสอบประสิทธิภาพ ต้องบันทึกแรงกระทำ ความเร็วรอบ และปริมาณเชื้อเพลิงที่ใช้ในหนึ่งหน่วยเวลา', c: ['✔ ถูก', '✘ ผิด'], a: 0, e: 'ถูก แรงและรอบใช้หา BHP ปริมาณน้ำมันต่อเวลาใช้หา ṁf' },
    { q: 'เครื่องยนต์ที่มีประสิทธิภาพเชิงกลสูง ผลต่างระหว่างกำลังม้าอินดิเคตกับกำลังม้าเบรกจะมีมาก', c: ['✔ ถูก', '✘ ผิด'], a: 1, e: 'ผิด ηm สูงแปลว่า BHP ใกล้ IHP ผลต่าง (FHP) จึงน้อย' },
    { q: 'ถ้าเครื่องยนต์มีความฝืดมาก จะส่งผลให้ประสิทธิภาพเชิงความร้อนเบรกน้อย', c: ['✔ ถูก', '✘ ผิด'], a: 0, e: 'ถูก ความฝืดทำให้ BHP ลดลง ηtb จึงลดลง' },
    { q: 'จากรูป 3-17 พลังงานความร้อนของเชื้อเพลิงเปลี่ยนเป็นกำลังของเครื่องยนต์ได้ประมาณเท่าใด', c: ['10%', '20%', '35%', '80%'], a: 1, e: 'ราว 20% ที่เหลือเสียไปกับไอเสีย 35% ระบายความร้อนและหล่อลื่น 35% ความเสียดทาน 10%' },
    { q: 'BHP 55.12 kW, ṁf 23 kg/hr, Cv 42 MJ/kg ประสิทธิภาพเชิงความร้อนเบรกเท่าใด', c: ['5.7%', '20.54%', '22.57%', '91%'], a: 1, e: 'ηtb = 55,120 / [(23/3,600)(42×10⁶)] = 0.2054' },
    { q: 'IHP 60.57 kW, BHP 55.12 kW ประสิทธิภาพเชิงกลเท่าใด', c: ['9%', '20.5%', '91%', '110%'], a: 2, e: 'ηm = 55.12/60.57 = 0.91' }
  ] }
];
(function quiz() {
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
})();

/* ===== สรุปสูตร ===== */
const FX = [
  { id: 'fx1', t: 'แรงบิด (Torque)', eq: 'T = F · r',
    o: 'แรงบิดคือผลของแรงที่พยายามทำให้วัตถุหมุน ขนาดขึ้นกับทั้งแรงและระยะจากจุดหมุน ยิ่งแรงมากหรือแขนยาว ยิ่งหมุนง่าย จึงเป็นผลคูณของทั้งสอง',
    v: [['T', 'แรงบิด หรือทอร์ก', 'N·m', 'คำนวณ'], ['F', 'แรงที่พยายามทำให้หมุน', 'N', 'วัดด้วยเครื่องชั่งสปริง (kg × 9.81)'], ['r', 'แขนของแรง: ระยะตั้งฉากจากจุดหมุนถึงแนวแรง', 'm', 'วัดด้วยตลับเมตร หรือดูจากรายละเอียดเครื่อง']],
    ex: 'F = 150 N, r = 0.3 m → T = <b>45 N·m</b>' },
  { id: 'fx2', t: 'หน่วยกำลังงาน', eq: '1 HP = 550 ft·lb/s ≈ 746 W · 1 PS = 75 kg·m/s ≈ 736 W · 1 W = 1 N·m/s = 1 J/s',
    o: 'กำลัง = งาน ÷ เวลา = แรง × ระยะทาง ÷ เวลา กำลังม้าแต่ละระบบกำหนดน้ำหนักและระยะทางมาตรฐานต่างกัน: HP ใช้ปอนด์และฟุต PS ใช้กิโลกรัมและเมตร',
    v: [['HP', 'กำลังม้าอังกฤษ', '–', '1 HP = 745.7 W (หนังสือใช้ 746)'], ['PS', 'กำลังม้าเมตริก', '–', '1 PS = 735.5 W (หนังสือใช้ 736)'], ['W', 'วัตต์ หน่วย SI', 'J/s', '1 kW = 1,000 W']],
    ex: '100 PS = 100 × 736 = <b>73,600 W = 73.6 kW</b>' },
  { id: 'fx3', t: 'กำลังม้าอินดิเคต (IHP)', eq: `IHP = imep · A · s · n · k <span class="eq-alt">เครื่องยนต์ 4 จังหวะ: IHP = imep · A · s · ${FR('n', '2')} · k</span>`,
    o: 'แรงดันแก๊สบนลูกสูบ = imep × A · งานต่อการระเบิด 1 ครั้ง = แรง × ระยะชัก = imep·A·s · จำนวนครั้งที่ระเบิดต่อวินาทีต่อสูบ = n (2 จังหวะ) หรือ n/2 (4 จังหวะ เพราะ 2 รอบระเบิด 1 ครั้ง) · คูณจำนวนสูบ k',
    v: [['imep', 'ความดันเฉลี่ยในกระบอกสูบ', 'N/m²', 'โจทย์ให้มา หรือวัดจากแผนภาพอินดิเคเตอร์ (1 bar = 10⁵ N/m²)'], ['A', 'พื้นที่หน้าตัดกระบอกสูบ = πd²/4', 'm²', 'คำนวณจากขนาดกระบอกสูบ d'], ['s', 'ระยะชัก', 'm', 'ข้อมูลเครื่องยนต์ (mm ÷ 1,000)'], ['n', 'ความเร็วรอบ', 'rps', 'rpm ÷ 60'], ['k', 'จำนวนสูบ', 'สูบ', 'ข้อมูลเครื่องยนต์']],
    ex: 'ตัวอย่าง 3.1: (7.97×10⁵)(π/4·0.079²)(0.081)(75/2)(6) = <b>71.20 kW</b>' },
  { id: 'fx4', t: 'กำลังม้าเบรก (BHP)', eq: 'BHP = 2π · T<sub>e</sub> · n',
    o: 'เพลาหมุน 1 รอบ จุดที่แรง F กระทำเคลื่อนที่ได้ระยะเส้นรอบวง 2πr งานต่อรอบ = F × 2πr = 2πT · หมุน n รอบต่อวินาที กำลัง = 2πT·n (หรือ P = T·ω เมื่อ ω = 2πn)',
    v: [['BHP', 'กำลังม้าเบรก (เขียนเป็น P<sub>e</sub> ในใบงาน)', 'W', 'คำนวณ'], ['T<sub>e</sub>', 'แรงบิดของเครื่องยนต์', 'N·m', 'จากไดนาโมมิเตอร์ T<sub>e</sub> = F·r'], ['n', 'ความเร็วรอบ', 'rps', 'อ่านเครื่องวัดรอบ (rpm) แล้วหาร 60']],
    ex: 'ตัวอย่าง 3.2: 2π(18.10)(3,500/60) = <b>6,634 W</b>' },
  { id: 'fx5', t: 'กำลังม้าเสียดทาน (FHP)', eq: 'FHP = IHP − BHP <span class="eq-alt">หรือ BHP = IHP − FHP</span>',
    o: 'กำลังจากกระบอกสูบ (IHP) ต้องเสียส่วนหนึ่งให้แรงเสียดทาน (FHP) ก่อนถึงเพลา ส่วนที่เหลือคือ BHP',
    v: [['FHP', 'กำลังม้าเสียดทาน', 'W', 'คำนวณ (เพิ่มตามรอบ)'], ['IHP', 'กำลังม้าอินดิเคต', 'W', 'สูตร IHP'], ['BHP', 'กำลังม้าเบรก', 'W', 'ไดนาโมมิเตอร์']],
    ex: 'ตัวอย่าง 3.1: 71.20 − 65.97 = <b>5.23 kW</b>' },
  { id: 'fx6', t: 'การวัดด้วยไดนาโมมิเตอร์', eq: 'T<sub>e</sub> = F · r · F (N) = ค่าที่เครื่องชั่ง (kg) × 9.81',
    o: 'เบรกฝืนล้อที่หมุน แรงเสียดทานพยายามหมุนแขนตามล้อ ปลายแขนจึงดึง/กดเครื่องชั่ง แรงที่อ่านได้ × ความยาวแขน = แรงบิดที่เครื่องยนต์ส่งออกมา',
    v: [['F', 'แรงที่อ่านจากเครื่องชั่ง', 'N', 'เครื่องชั่งสปริงอ่านเป็น kg ต้องคูณ 9.81'], ['r', 'ความยาวแขน (รัศมีแขนรับแรงบิด)', 'm', 'ชุดทดลองในใบงาน r = 0.1 m']],
    ex: 'ตัวอย่าง 3.5: (8.3 × 9.81)(0.10) = <b>8.14 N·m</b>' },
  { id: 'fx7', t: 'อัตราการสิ้นเปลืองเชื้อเพลิง', eq: `${MF} = ${FR('m', 'Δt')} = ${FR('V · ρ', 'Δt')} · ρ = (s.g.) · ρ<sub>w</sub>`,
    o: 'อัตรา = ปริมาณ ÷ เวลา วัดปริมาตรง่ายกว่าวัดมวล จึงวัด V แล้วแปลงเป็นมวลด้วย m = V·ρ ความหนาแน่นหาได้จากความถ่วงจำเพาะคูณความหนาแน่นของน้ำ',
    v: [[MF, 'อัตราการสิ้นเปลืองเชื้อเพลิง', 'kg/s (× 3,600 = kg/hr)', 'คำนวณ'], ['V', 'ปริมาตรน้ำมันที่ใช้ไป', 'm³', 'หลอดแก้ววัดปริมาตร (5 ml = 5 × 10⁻⁶ m³)'], ['Δt', 'เวลาที่ใช้น้ำมัน', 's', 'นาฬิกาจับเวลา'], ['s.g.', 'ความถ่วงจำเพาะ', '–', 'ไฮโดรมิเตอร์'], ['ρ<sub>w</sub>', 'ความหนาแน่นของน้ำ', 'kg/m³', 'ประมาณ 1,000']],
    ex: 'ตัวอย่าง 3.3: (5×10⁻⁶)(740)/6.48 = <b>5.71×10⁻⁴ kg/s = 2.06 kg/hr</b>' },
  { id: 'fx8', t: 'อัตราการสิ้นเปลืองเชื้อเพลิงจำเพาะ (s.f.c.)', eq: `s.f.c. = ${FR(MF, 'BHP')}`,
    o: 'เทียบน้ำมันที่ใช้ต่อ 1 หน่วยกำลังที่ได้ ทำให้เปรียบเทียบความประหยัดของเครื่องยนต์ต่างขนาดกันได้ ค่ายิ่งน้อยยิ่งประหยัด',
    v: [['s.f.c.', 'อัตราการสิ้นเปลืองเชื้อเพลิงจำเพาะ', 'kg/kW·hr', 'คำนวณ'], [MF, 'อัตราการสิ้นเปลืองเชื้อเพลิง', '<b>kg/hr</b>', 'สูตร ṁf'], ['BHP', 'กำลังม้าเบรก', '<b>kW</b>', 'ไดนาโมมิเตอร์']],
    ex: 'ตัวอย่าง 3.3: 2.06/5.04 = <b>0.41 kg/kW·hr</b>' },
  { id: 'fx9', t: 'ประสิทธิภาพเชิงความร้อน', eq: `η<sub>ti</sub> = ${FR('IHP', MF + ' · C<sub>v</sub>')} · η<sub>tb</sub> = ${FR('BHP', MF + ' · C<sub>v</sub>')}`,
    o: 'ประสิทธิภาพ = ผลที่ได้ ÷ สิ่งที่ให้ไป พลังงานความร้อนที่ให้ต่อวินาที = มวลน้ำมันต่อวินาที × พลังงานต่อกิโลกรัม (ṁf·Cv) หน่วยเป็น J/s = W เทียบกับกำลังได้โดยตรง',
    v: [['η<sub>ti</sub>, η<sub>tb</sub>', 'ประสิทธิภาพเชิงความร้อนอินดิเคต / เบรก', '– (× 100 = %)', 'คำนวณ'], [MF, 'อัตราการสิ้นเปลืองเชื้อเพลิง', '<b>kg/s</b>', 'สูตร ṁf'], ['C<sub>v</sub>', 'ค่าความร้อนของน้ำมัน', 'J/kg', 'ตาราง/โจทย์ (MJ/kg × 10⁶)']],
    ex: 'ตัวอย่าง 3.4: 4,730 / [(2.35/3,600)(41.7×10⁶)] = <b>17.38%</b>' },
  { id: 'fx10', t: 'ประสิทธิภาพเชิงกล', eq: `η<sub>m</sub> = ${FR('BHP', 'IHP')} <span class="eq-alt">และ η<sub>tb</sub> = η<sub>m</sub> × η<sub>ti</sub></span>`,
    o: 'บอกว่ากำลังจากกระบอกสูบส่งถึงเพลาได้กี่เปอร์เซ็นต์ ส่วนที่หายไปคือความเสียดทาน (FHP)',
    v: [['η<sub>m</sub>', 'ประสิทธิภาพเชิงกล', '–', 'คำนวณ'], ['BHP', 'กำลังม้าเบรก', 'W', 'ไดนาโมมิเตอร์'], ['IHP', 'กำลังม้าอินดิเคต', 'W', 'สูตร IHP หรือ BHP + FHP']],
    ex: 'ตัวอย่าง 3.4: 4.73/5.37 = <b>88.08%</b>' }
];
(function formulas() {
  const box = $('#fxList'); if (!box) return;
  box.innerHTML = FX.map((f, i) => `<div class="fx" id="${f.id}"><div class="fx-head"><span class="fx-no">${i + 1}</span><h4>${f.t}</h4></div>
    <div class="formula"><span class="eq">${f.eq}</span></div>
    <div class="origin"><b>ที่มา:</b> ${f.o}</div>
    <div class="table-wrap"><table class="vars"><thead><tr><th>ตัวแปร</th><th class="left">คืออะไร</th><th>หน่วย</th><th class="left">ได้ค่ามาจากไหน</th></tr></thead>
    <tbody>${f.v.map(r => `<tr><td>${r[0]}</td><td class="left">${r[1]}</td><td>${r[2]}</td><td class="left">${r[3]}</td></tr>`).join('')}</tbody></table></div>
    <p class="fx-ex">ตัวอย่าง: ${f.ex}</p></div>`).join('') + `
    <div class="fx" id="fxu"><div class="fx-head"><span class="fx-no">⇄</span><h4>ตารางแปลงหน่วยที่ใช้บ่อยในบทนี้</h4></div>
    <div class="table-wrap"><table class="vars units"><thead><tr><th>แปลง</th><th class="left">วิธี / เหตุผล</th></tr></thead><tbody>
      <tr><td>rpm → rps</td><td class="left">หาร 60 (1 นาที = 60 วินาที) · สูตร BHP และ IHP ใช้ rps</td></tr>
      <tr><td>kg (เครื่องชั่ง) → N</td><td class="left">คูณ 9.81 · เครื่องชั่งสปริงอ่านเป็นกิโลกรัมแรง</td></tr>
      <tr><td>bar → N/m²</td><td class="left">คูณ 10⁵ (1 bar = 100,000 Pa)</td></tr>
      <tr><td>mm → m</td><td class="left">หาร 1,000 · ใช้กับเส้นผ่าศูนย์กลางกระบอกสูบและระยะชัก</td></tr>
      <tr><td>cc = ml → m³</td><td class="left">คูณ 10⁻⁶ (1 cm³ = 10⁻⁶ m³)</td></tr>
      <tr><td>kg/s → kg/hr</td><td class="left">คูณ 3,600 · s.f.c. ใช้ kg/hr ส่วนสูตรประสิทธิภาพใช้ kg/s</td></tr>
      <tr><td>MJ/kg → J/kg</td><td class="left">คูณ 10⁶</td></tr>
      <tr><td>W → kW → HP, PS</td><td class="left">kW = W ÷ 1,000 · HP = W ÷ 746 · PS = W ÷ 736</td></tr>
    </tbody></table></div></div>`;
})();

/* ===== วิดีโอ YouTube (โหลดเมื่อกดเล่น) ===== */
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
