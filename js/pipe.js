/* ===== บทที่ 5 งานทดลองการสูญเสียพลังงานของการไหลในท่อ =====
   ต้องโหลด js/common.js ก่อน · ชุดทดลองเสมือน การสูญเสียรอง แบบทดสอบ และสรุปสูตรอยู่ใน js/pipe-lab.js (โหลดหลังไฟล์นี้)
   ค่า f ของการไหลแบบปั่นป่วนคำนวณจากสมการ Colebrook (สมการที่ใช้สร้าง Moody Chart) */

/* ---------- ฟิสิกส์พื้นฐาน ---------- */
const AREA = D => Math.PI / 4 * D * D;
function colebrook(Re, rr) {
  let f = 0.25 / Math.pow(Math.log10(rr / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
  for (let i = 0; i < 40; i++) f = Math.pow(-2 * Math.log10(rr / 3.7 + 2.51 / (Re * Math.sqrt(f))), -2);
  return f;
}
/* f สำหรับแบบจำลอง: ช่วงเปลี่ยนแปลงเชื่อมเส้นตรงระหว่างค่าที่ 2,000 กับ 4,000 */
function fOf(Re, rr) {
  if (Re <= 2000) return 64 / Re;
  if (Re >= 4000) return colebrook(Re, rr);
  return lerp(64 / 2000, colebrook(4000, rr), (Re - 2000) / 2000);
}
/* อ่าน Moody ย้อนทาง: รู้ f กับ Re หา ε/D */
const rrFrom = (f, Re) => 3.7 * (Math.pow(10, -1 / (2 * Math.sqrt(f))) - 2.51 / (Re * Math.sqrt(f)));
const NU_T = [[0, 1.75e-6], [10, 1.30e-6], [20, 1.02e-6], [30, 8.03e-7], [40, 6.56e-7], [50, 5.48e-7], [60, 4.67e-7], [70, 4.11e-7], [80, 3.60e-7], [90, 3.22e-7], [100, 2.94e-7]];
function nuWater(T) {
  for (let i = 0; i < NU_T.length - 1; i++) if (T <= NU_T[i + 1][0]) return lerp(NU_T[i][1], NU_T[i + 1][1], (T - NU_T[i][0]) / 10);
  return NU_T[NU_T.length - 1][1];
}
const regime = Re => Re <= 2000 ? { k: 'lam', t: 'ราบเรียบ (Laminar)' } : Re <= 4000 ? { k: 'trans', t: 'ช่วงเปลี่ยนแปลง' } : { k: 'turb', t: 'ปั่นป่วน (Turbulent)' };
const badge = Re => { const r = regime(Re); return `<span class="badge ${r.k}">${r.t}</span>`; };
const NR = Re => Re >= 1e5 ? SCI(Re, 2) : N(Re, Re < 100 ? 2 : 0);
const VH = v => v * v / (2 * G);

/* ตาราง 5-1 ความขรุขระของท่อใหม่ (mm) */
const ROUGH = [
  { k: 'riveted', name: 'ท่อเหล็ก (Riveted Steel)', e: 3.0, txt: '0.9–9.0', note: 'ตารางให้เป็นช่วง ในที่นี้ใช้ค่ากลาง 3.0 mm' },
  { k: 'concrete', name: 'ท่อคอนกรีต', e: 1.0, txt: '0.3–3.0', note: 'ตารางให้เป็นช่วง ในที่นี้ใช้ค่ากลาง 1.0 mm' },
  { k: 'wood', name: 'ท่อไม้ (Wood stave)', e: 0.4, txt: '0.18–0.9', note: 'ตารางให้เป็นช่วง ในที่นี้ใช้ค่ากลาง 0.4 mm' },
  { k: 'castiron', name: 'ท่อเหล็กหล่อ', e: 0.26, txt: '0.26' },
  { k: 'galv', name: 'ท่อเหล็กอาบสังกะสี', e: 0.15, txt: '0.15' },
  { k: 'wrought', name: 'ท่อเหล็กเหนียว (Wrought iron)', e: 0.045, txt: '0.045' },
  { k: 'drawn', name: 'ท่อรีด (Drawn tubing)', e: 0.0015, txt: '0.0015' },
  { k: 'pvc', name: 'ท่อพลาสติก ท่อพีวีซี ท่อแก้ว', e: 0, txt: '0.00 (ผิวเรียบ)' }
];

/* =====================================================================
   5.1 พิโซมิเตอร์ตามแนวท่อ (เห็นการสูญเสียพลังงาน)
   ===================================================================== */
(function hglDemo() {
  const svg = $('#hglSvg'); if (!svg) return;
  const H = 4, D = 0.02, L = 10, f = 0.025, kin = 0.5, px = 42, yAxis = 236, x0 = 112, x1 = 540;
  const yOf = h => yAxis - h * px;
  const taps = [0.12, 0.34, 0.56, 0.78, 0.96];
  function draw() {
    const o = +$('#hglR').value / 100;
    $('#hglTxt').textContent = Math.round(o * 100);
    const kv = o > 0 ? 0.15 + 2 * Math.pow(1 / o - 1, 2) : Infinity;
    const v = o > 0 ? Math.sqrt(2 * G * H / (1 + kin + f * L / D + kv)) : 0, vh = VH(v);
    const pAt = s => H - vh - kin * vh - f * (s * L / D) * vh;
    let h = `<defs><marker id="arH" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--water)"/></marker></defs>`;
    // ถัง
    h += `<rect x="10" y="${yOf(H) - 6}" width="100" height="${yAxis + 22 - yOf(H) + 6}" fill="none" stroke="var(--text)" stroke-width="2"/>`;
    h += `<rect x="12" y="${yOf(H)}" width="96" height="${yAxis + 20 - yOf(H)}" fill="var(--water)" opacity=".35"/>`;
    h += `<text x="60" y="${yOf(H) - 12}" text-anchor="middle" class="svg-m" style="font-size:11px">ถังน้ำ ระดับคงที่</text>`;
    // เส้นระดับถัง
    h += `<line x1="110" x2="590" y1="${yOf(H)}" y2="${yOf(H)}" stroke="var(--muted)" stroke-dasharray="4 4"/>`;
    h += `<text x="596" y="${yOf(H) - 20}" class="svg-m halo" style="font-size:11px" text-anchor="end">ระดับน้ำในถัง ${H} m</text>`;
    // ท่อ
    h += `<rect x="${x0 - 2}" y="${yAxis - 9}" width="${x1 - x0 + 30}" height="18" fill="var(--water-soft)" stroke="var(--text)" stroke-width="1.5"/>`;
    if (v > 0) h += `<path d="M${x0 + 6},${yAxis} L${x1 + 22},${yAxis}" stroke="var(--water)" stroke-width="2.5" class="flowline" style="animation-duration:${(1.4 / Math.max(.25, v)).toFixed(2)}s" marker-end="url(#arH)"/>`;
    // วาล์ว
    const vx = x1 + 12;
    h += `<polygon points="${vx - 9},${yAxis - 10} ${vx + 9},${yAxis + 10} ${vx + 9},${yAxis - 10} ${vx - 9},${yAxis + 10}" fill="${o > 0 ? 'var(--ok)' : 'var(--bad)'}" stroke="var(--text)"/><line x1="${vx}" x2="${vx}" y1="${yAxis - 10}" y2="${yAxis - 22}" stroke="var(--text)" stroke-width="2"/><line x1="${vx - 8}" x2="${vx + 8}" y1="${yAxis - 22}" y2="${yAxis - 22}" stroke="var(--text)" stroke-width="3"/>`;
    if (v > 0) h += `<path d="M${x1 + 28},${yAxis} q30,4 ${30 + v * 8},${30}" stroke="var(--water)" stroke-width="${3 + o * 4}" fill="none" opacity=".7"/>`;
    // หลอดพิโซมิเตอร์
    const lv = [];
    taps.forEach((s, i) => {
      const x = x0 + s * (x1 - x0 - 10), p = o > 0 ? pAt(s) : H, y = yOf(p);
      lv.push([x, y]);
      h += `<rect x="${x - 6}" y="${yOf(H) - 14}" width="12" height="${yAxis - 9 - (yOf(H) - 14)}" fill="var(--glass)" stroke="var(--text)" stroke-width="1"/>`;
      h += `<rect x="${x - 5}" y="${y}" width="10" height="${yAxis - 9 - y}" fill="var(--water)" opacity=".75"/>`;
      h += `<text x="${x}" y="${yAxis + 26}" text-anchor="middle" class="svg-m" style="font-size:11px">${i + 1}</text>`;
    });
    if (v > 0) {
      h += `<polyline points="${lv.map(p => p.join(',')).join(' ')}" fill="none" stroke="var(--hf)" stroke-width="2" stroke-dasharray="6 4"/>`;
      const dy = lv[lv.length - 1][1] - lv[0][1];
      if (dy > 8) h += `<line x1="${lv[lv.length - 1][0] + 14}" x2="${lv[lv.length - 1][0] + 14}" y1="${lv[0][1]}" y2="${lv[lv.length - 1][1]}" stroke="var(--hf)" stroke-width="2" marker-end="url(#arH)"/>`;
      h += `<text x="${(lv[0][0] + lv[lv.length - 1][0]) / 2}" y="${lv[2][1] - 10}" text-anchor="middle" class="svg-t halo" style="fill:var(--hf);font-size:12px;font-weight:700">ระดับลดลงตามระยะทาง</text>`;
    }
    h += `<text x="${x0 + 4}" y="${yAxis + 44}" class="svg-m" style="font-size:11px">ทางเข้าท่อ</text><text x="${vx}" y="${yAxis + 44}" text-anchor="middle" class="svg-m" style="font-size:11px">วาล์ว</text>`;
    svg.innerHTML = h;
    const hf = o > 0 ? pAt(taps[0]) - pAt(taps[4]) : 0;
    $('#hglOut').innerHTML = o > 0
      ? LF('ความเร็วน้ำในท่อ', 'v', 'จากสมการพลังงานของท่อนี้', `= ${N(v, 2)} m/s`) +
        LF('การสูญเสียระหว่างหลอดที่ 1 กับ 5', 'h<sub>f</sub> = ผลต่างระดับน้ำ', `= ${N(pAt(taps[0]), 2)} − ${N(pAt(taps[4]), 2)}`, `= ${N(hf, 2)} m`, 'hl') +
        LF('สูญเสียตรงทางเข้าท่อ (การสูญเสียรอง)', 'h<sub>m</sub> = k·v²/2g', `= (0.5)(${N(vh, 3)})`, `= ${N(kin * vh, 2)} m`)
      : LF('วาล์วปิด', 'v = 0', 'น้ำไม่ไหล', 'ไม่มีการสูญเสีย', 'wait');
  }
  $('#hglR').addEventListener('input', draw);
  draw();
})();

/* =====================================================================
   5.2.1 การทดลองของเรย์โนลด์ (หมึกสีในท่อแก้ว)
   ===================================================================== */
(function reynoldsSim() {
  const cv = $('#reyCanvas'); if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height, yT = 72, yB = 192, yc = (yT + yB) / 2, R = (yB - yT) / 2, xIn = 78, xEnd = W - 24;
  const st = { fluid: 'water', T: 20, D: 0.02, v: 0.1, Re: 0, t: 0 };
  const OIL_NU = 0.0814 / 869;   // น้ำมัน SAE 10 จากตัวอย่าง 5.2
  let parts = [], col = {};
  const readCol = () => { col = { dye: cssVar('--dye'), water: cssVar('--water'), glass: cssVar('--glass'), text: cssVar('--text'), muted: cssVar('--muted'), surf: cssVar('--surface'), oil: cssVar('--oil') }; };
  readCol(); document.addEventListener('themechange', readCol);
  const nu = () => st.fluid === 'water' ? nuWater(st.T) : OIL_NU;
  function update() {
    st.v = Math.pow(10, +$('#reyV').value); st.D = +$('#reyD').value / 1000; st.T = +$('#reyT').value;
    $('#reyVt').textContent = st.v < 0.1 ? st.v.toFixed(3) : st.v.toFixed(2);
    $('#reyDt').textContent = Math.round(st.D * 1000); $('#reyTt').textContent = st.T;
    $('#reyTwrap').hidden = st.fluid !== 'water';
    st.Re = st.D * st.v / nu();
    const n = nu();
    $('#reyOut').innerHTML =
      (st.fluid === 'water' ? LF('ความหนืดจลน์ของน้ำ (จากตาราง)', `υ ที่ ${st.T} °C`, '', `= ${SCI(n, 2)} m²/s`)
        : LF('ความหนืดจลน์ของน้ำมัน', `υ = ${FR('μ', 'ρ')}`, `= ${FR('0.0814', '869')}`, `= ${SCI(n, 2)} m²/s`)) +
      LF('เรย์โนลด์นัมเบอร์', `N<sub>R</sub> = ${FR('D v', 'υ')}`, `= ${FR(`(${N(st.D, 3)})(${st.v < 0.1 ? N(st.v, 3) : N(st.v, 2)})`, SCI(n, 2))}`, `= ${NR(st.Re)}`, 'hl') +
      `<div style="margin-top:4px">ชนิดการไหล: ${badge(st.Re)} ${st.Re <= 2000 ? 'หมึกไหลเป็นเส้นตรง ชั้นของน้ำเลื่อนผ่านกันอย่างเป็นระเบียบ' : st.Re <= 4000 ? 'เส้นหมึกเริ่มส่าย และขาดเป็นช่วง ๆ' : 'หมึกแตกกระจายผสมทั่วท่ออย่างรวดเร็ว'}</div>`;
    $$('#nuTable tr').forEach(tr => $$('td', tr).forEach((td, i) => td.classList.toggle('hl', st.fluid === 'water' && Math.abs(NU_T[i][0] - st.T) < 5)));
    drawProfile();
  }
  $('#nuTable').innerHTML = `<tbody><tr><th>T (°C)</th>${NU_T.map(r => `<td>${r[0]}</td>`).join('')}</tr><tr><th>υ (×10⁻⁷ m²/s)</th>${NU_T.map(r => `<td>${N(r[1] * 1e7, r[1] >= 1e-6 ? 1 : 2)}</td>`).join('')}</tr></tbody>`;
  $('#reyFluid').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    st.fluid = b.dataset.f; $$('#reyFluid button').forEach(x => x.classList.toggle('on', x === b));
    if (st.fluid === 'oil') { $('#reyV').value = 0; $('#reyD').value = 150; } // ตัวอย่าง 5.2 v = 1 m/s, D = 150 mm
    parts = []; update();
  });
  ['#reyV', '#reyD', '#reyT'].forEach(s => $(s).addEventListener('input', update));

  function drawProfile() {
    const s = $('#reyProf'); const top = 20, bot = 170, x0 = 40, Lmax = 200;
    const lam = r => 1 - r * r, turb = r => Math.pow(1 - Math.abs(r), 1 / 7);
    const w = clamp((st.Re - 2000) / 2000, 0, 1);
    const prof = r => lerp(lam(r), turb(r), w);
    const pts = fn => { const a = []; for (let i = 0; i <= 40; i++) { const r = -1 + i / 20; a.push([x0 + fn(r) * Lmax, (top + bot) / 2 + r * (bot - top) / 2]); } return a; };
    let h = `<defs><marker id="arP" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="var(--water)"/></marker></defs>`;
    h += `<line x1="${x0}" x2="${x0 + 240}" y1="${top}" y2="${top}" stroke="var(--text)" stroke-width="3"/><line x1="${x0}" x2="${x0 + 240}" y1="${bot}" y2="${bot}" stroke="var(--text)" stroke-width="3"/>`;
    h += `<line x1="${x0}" x2="${x0}" y1="${top}" y2="${bot}" stroke="var(--muted)" stroke-dasharray="3 3"/>`;
    for (let i = 1; i < 10; i++) { const r = -1 + i / 5, y = (top + bot) / 2 + r * (bot - top) / 2; h += `<line x1="${x0}" x2="${x0 + prof(r) * Lmax - 4}" y1="${y}" y2="${y}" stroke="var(--water)" stroke-width="1.8" marker-end="url(#arP)"/>`; }
    h += `<path d="M${pts(lam).map(p => p.join(',')).join(' L')}" fill="none" stroke="var(--lam)" stroke-width="${w < .5 ? 3 : 1.2}" opacity="${w < .5 ? 1 : .45}"/>`;
    h += `<path d="M${pts(turb).map(p => p.join(',')).join(' L')}" fill="none" stroke="var(--turb)" stroke-width="${w >= .5 ? 3 : 1.2}" opacity="${w >= .5 ? 1 : .45}" stroke-dasharray="${w >= .5 ? '' : '4 3'}"/>`;
    h += `<text x="${x0 + 6}" y="${top - 6}" class="svg-m" style="font-size:11px">ผนังท่อ (ความเร็ว = 0)</text>`;
    h += `<text x="${x0 + 214}" y="${top + 28}" class="halo" style="font-size:11px;fill:var(--lam);font-weight:700">ราบเรียบ</text><text x="${x0 + 214}" y="${bot - 18}" class="halo" style="font-size:11px;fill:var(--turb);font-weight:700">ปั่นป่วน</text>`;
    s.innerHTML = h;
  }

  let vis = false, running = false, last = performance.now();
  whenVisible(cv, v => { vis = v; if (v && !running) { running = true; last = performance.now(); requestAnimationFrame(tick); } });
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; st.t += dt;
    const Re = st.Re, sp = 70 + 160 * clamp((Math.log10(st.v) + 2.3) / 3, 0, 1);   // px/s ความเร็วบนจอ
    const trans = clamp((Re - 2000) / 2000, 0, 1);
    // ช่วงเปลี่ยนแปลง: ปั่นป่วนเป็นพัก ๆ
    const burst = Re > 4000 || (trans > 0 && (Math.sin(st.t * 0.9) + Math.sin(st.t * 2.3 + 1)) > 2 - 2.6 * trans);
    for (let i = 0; i < 5; i++) parts.push({ x: xIn + 6, y: yc + (Math.random() - .5) * 1.2, vy: 0, turb: burst && Re > 2000, ph: st.t });
    const mixLen = Re > 4000 ? clamp(900 - (Math.log10(Re) - 3.6) * 500, 120, 700) : 500;
    const I = Re > 4000 ? 1 : trans;
    parts.forEach(p => {
      const r = (p.y - yc) / R;
      const u = Re > 4000 ? Math.pow(Math.max(0, 1 - Math.abs(r)), 1 / 7) * 1.15 : 2 * (1 - r * r) * 0.8;
      p.x += u * sp * dt;
      if (p.turb) {
        const g = clamp((p.x - xIn) / mixLen, 0, 1.4);
        p.vy += (Math.random() - .5) * 260 * I * g * dt * 9;
        p.vy *= 0.9;
        p.y += p.vy * dt * 6;
        if (p.y < yT + 2) { p.y = yT + 2; p.vy = Math.abs(p.vy); }
        if (p.y > yB - 2) { p.y = yB - 2; p.vy = -Math.abs(p.vy); }
      }
    });
    parts = parts.filter(p => p.x < xEnd);
    if (parts.length > 3500) parts.splice(0, parts.length - 3500);
    // วาด
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = col.surf; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = st.fluid === 'water' ? col.glass : col.oil; ctx.globalAlpha = st.fluid === 'water' ? 1 : .25;
    ctx.fillRect(xIn, yT, xEnd - xIn, yB - yT); ctx.globalAlpha = 1;
    ctx.strokeStyle = col.text; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(30, yT - 30); ctx.quadraticCurveTo(xIn - 10, yT, xIn, yT); ctx.lineTo(xEnd, yT); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(30, yB + 30); ctx.quadraticCurveTo(xIn - 10, yB, xIn, yB); ctx.lineTo(xEnd, yB); ctx.stroke();
    // เข็มฉีดหมึก
    ctx.strokeStyle = col.muted; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xIn - 30, 18); ctx.lineTo(xIn - 30, yc - 6); ctx.quadraticCurveTo(xIn - 30, yc, xIn - 18, yc); ctx.lineTo(xIn + 6, yc); ctx.stroke();
    ctx.fillStyle = col.dye; ctx.fillRect(xIn - 40, 6, 20, 14);
    const wave = Re > 2000 && Re <= 4000 ? trans : 0;
    parts.forEach(p => {
      let y = p.y;
      if (wave && !p.turb) y += Math.sin((p.x - xIn) * 0.035 - st.t * 5) * 22 * wave * clamp((p.x - xIn) / 500, 0, 1);
      ctx.globalAlpha = p.turb ? 0.28 : 0.6;
      ctx.fillStyle = col.dye;
      ctx.beginPath(); ctx.arc(p.x, y, p.turb ? 2.6 : 1.8, 0, 6.283); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = col.text; ctx.font = '600 15px Sarabun, sans-serif';
    ctx.fillText('หมึกสี', xIn - 26, 34);
    ctx.fillText(`N_R = ${Re >= 1e5 ? Re.toExponential(2) : Math.round(Re).toLocaleString('en-US')}   ${regime(Re).t}`, xIn + 140, 40);
    ctx.fillStyle = col.muted; ctx.font = '13px Sarabun, sans-serif'; ctx.fillText('ทิศทางการไหล →', xEnd - 120, yB + 26);
    if (vis) requestAnimationFrame(tick); else running = false;
  }
  update();
})();

/* =====================================================================
   แผนภาพของ Moody (ใช้ทั้งหัวข้อ 5.2.2 และกราฟของใบงาน 5.2)
   ===================================================================== */
const MOODY_RR = [0, 1e-6, 5e-6, 1e-5, 5e-5, 1e-4, 2e-4, 4e-4, 6e-4, 8e-4, 1e-3, 2e-3, 4e-3, 6e-3, 8e-3, 0.01, 0.015, 0.02, 0.03, 0.04, 0.05];
const rrTxt = rr => rr === 0 ? '0 (ผิวเรียบ)' : rr >= 0.001 ? String(+rr.toFixed(4)) : rr.toExponential(0).replace('e-', '×10⁻').replace(/⁻(\d)/, (m, d) => '⁻' + '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
/* o = { W, H, pt:{Re,f,rr}, points:[{Re,f,color}], fits:[{rr,color,label}], hlRR } */
function moodySVG(o) {
  const W = o.W || 760, H = o.H || 470, m = { l: 72, r: 84, t: 14, b: 48 };
  const lx0 = Math.log10(600), lx1 = 8, ly0 = Math.log10(0.008), ly1 = Math.log10(0.1);
  const X = Re => m.l + (Math.log10(Re) - lx0) / (lx1 - lx0) * (W - m.l - m.r);
  const Y = f => H - m.b - (Math.log10(f) - ly0) / (ly1 - ly0) * (H - m.t - m.b);
  let s = `<defs><clipPath id="mClip${o.id || ''}"><rect x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}"/></clipPath></defs>`;
  s += `<rect x="${X(2000)}" y="${m.t}" width="${X(4000) - X(2000)}" height="${H - m.t - m.b}" fill="var(--trans)" opacity=".12"/>`;
  for (let e = 2; e <= 8; e++) for (let d = 1; d <= 9; d++) {
    const Re = d * Math.pow(10, e); if (Re < 600 || Re > 1e8) continue;
    s += `<line class="ch-grid" x1="${X(Re)}" x2="${X(Re)}" y1="${m.t}" y2="${H - m.b}" ${d === 1 ? 'style="stroke:var(--muted);opacity:.5"' : ''}/>`;
    if (d === 1) s += `<text class="ch-tick" x="${X(Re)}" y="${H - m.b + 16}" text-anchor="middle">10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[e]}</text>`;
    else if (d === 2 || d === 5) s += `<text class="ch-tick" x="${X(Re)}" y="${H - m.b + 14}" text-anchor="middle" style="font-size:9px">${d}</text>`;
  }
  [0.008, 0.009, 0.01, 0.015, 0.02, 0.025, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1].forEach(f => {
    s += `<line class="ch-grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(f)}" y2="${Y(f)}"/><text class="ch-tick" x="${m.l - 6}" y="${Y(f) + 4}" text-anchor="end">${f}</text>`;
  });
  s += `<g clip-path="url(#mClip${o.id || ''})">`;
  // เส้นราบเรียบ
  s += `<line x1="${X(600)}" y1="${Y(64 / 600)}" x2="${X(2300)}" y2="${Y(64 / 2300)}" stroke="var(--lam)" stroke-width="2.5"/>`;
  // เส้นปั่นป่วน
  MOODY_RR.forEach(rr => {
    const pts = [];
    for (let lg = Math.log10(4000); lg <= 8.0001; lg += 0.04) { const Re = Math.pow(10, lg); pts.push([X(Re), Y(colebrook(Re, rr))]); }
    const hl = o.hlRR != null && Math.abs(Math.log10((rr || 1e-7) / (o.hlRR || 1e-7))) < 0.02;
    s += `<path d="M${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L')}" fill="none" stroke="${rr === 0 ? 'var(--brand)' : 'var(--muted)'}" stroke-width="${rr === 0 ? 2 : 1.1}" opacity="${hl ? .25 : .85}"/>`;
  });
  // เส้นแบ่งปั่นป่วนสมบูรณ์ (Re·√f·ε/D = 200)
  const bd = MOODY_RR.filter(r => r >= 5e-5).map(rr => { const ff = Math.pow(-2 * Math.log10(rr / 3.7), -2); return [X(200 / (rr * Math.sqrt(ff))), Y(ff)]; }).filter(p => p[0] < W - m.r);
  s += `<path d="M${bd.map(p => p.join(',')).join(' L')}" fill="none" stroke="var(--turb)" stroke-width="1.5" stroke-dasharray="6 4"/>`;
  (o.fits || []).forEach(fi => {
    const pts = []; for (let lg = Math.log10(4000); lg <= 8.0001; lg += 0.04) { const Re = Math.pow(10, lg); pts.push([X(Re), Y(colebrook(Re, Math.max(0, fi.rr)))]); }
    s += `<path d="M${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L')}" fill="none" stroke="${fi.color}" stroke-width="3"/>`;
  });
  if (o.hlRR != null) {
    const pts = []; for (let lg = Math.log10(4000); lg <= 8.0001; lg += 0.04) { const Re = Math.pow(10, lg); pts.push([X(Re), Y(colebrook(Re, o.hlRR))]); }
    s += `<path d="M${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L')}" fill="none" stroke="var(--accent)" stroke-width="3.2"/>`;
  }
  (o.points || []).forEach(p => { s += `<circle cx="${X(p.Re)}" cy="${Y(p.f)}" r="5" fill="${p.color}" stroke="var(--surface)" stroke-width="1.5"/>`; });
  if (o.pt) {
    const px = X(o.pt.Re), py = Y(o.pt.f);
    s += `<line x1="${px}" x2="${px}" y1="${py}" y2="${H - m.b}" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="5 4"/><line x1="${m.l}" x2="${px}" y1="${py}" y2="${py}" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="5 4"/>`;
    s += `<circle cx="${px}" cy="${py}" r="7" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>`;
  }
  s += `</g>`;
  // ป้ายเส้น ε/D ทางขวา
  MOODY_RR.forEach((rr, i) => {
    if (rr === 0 || rr < 1e-5) return;
    if ([5e-5, 4e-4, 6e-4, 8e-4, 6e-3, 8e-3, 0.015, 0.03].includes(rr)) return;
    s += `<text class="ch-tick" x="${W - m.r + 4}" y="${Y(colebrook(1e8, rr)) + 4}" style="font-size:10px">${rr === 0 ? 'ผิวเรียบ' : rr}</text>`;
    void i;
  });
  if (o.pt) s += `<rect x="${m.l + 4}" y="${Y(o.pt.f) - 20}" width="50" height="18" rx="4" fill="var(--accent)"/><text x="${m.l + 29}" y="${Y(o.pt.f) - 7}" text-anchor="middle" style="fill:#fff;font-size:11px;font-weight:700">${o.pt.f < 0.1 ? o.pt.f.toFixed(4) : o.pt.f.toFixed(3)}</text>`;
  s += `<text class="ch-lab" x="${W - m.r + 4}" y="${m.t + 8}" style="font-size:11px">ε/D</text>`;
  s += `<text x="${X(1250)}" y="${Y(0.088)}" style="font-size:11px;fill:var(--lam);font-weight:700">ราบเรียบ</text><text x="${X(1250)}" y="${Y(0.088) + 13}" style="font-size:10px;fill:var(--lam)">f = 64/N_R</text>`;
  s += `<text x="${X(2050)}" y="${m.t + 12}" style="font-size:10px;fill:var(--muted)">ช่วงเปลี่ยน</text>`;
  s += `<text x="${X(3e6)}" y="${m.t + 12}" style="font-size:11px;fill:var(--turb)">ปั่นป่วนสมบูรณ์ (ท่อขรุขระ)</text>`;
  s += `<text x="${X(2e6)}" y="${Y(colebrook(2e6, 0)) + 16}" style="font-size:11px;fill:var(--brand)">ท่อผิวเรียบ</text>`;
  s += `<line class="ch-axis" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${H - m.b}"/><line class="ch-axis" x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/>`;
  s += `<text class="ch-lab" x="${(m.l + W - m.r) / 2}" y="${H - 8}" text-anchor="middle">เรย์โนลด์นัมเบอร์ N_R (สเกลลอการิทึม)</text>`;
  s += `<text class="ch-lab" transform="translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)" text-anchor="middle">แฟกเตอร์ของความเสียดทาน f</text>`;
  return s;
}

(function moodyInteractive() {
  const svg = $('#moodySvg'); if (!svg) return;
  const st = { fixedF: null, Re: null, rr: null };   // Re, rr = ค่าตรงจากปุ่มตัวอย่าง (แถบเลื่อนปัดเศษ)
  function draw() {
    const Re = st.Re ?? Math.pow(10, +$('#mRe').value);
    const lr = +$('#mRr').value, rr = st.rr ?? (lr <= -6.25 ? 0 : Math.pow(10, lr));
    let f, rrUse = rr, out = '';
    if (st.fixedF) {
      f = st.fixedF; rrUse = Math.max(0, rrFrom(f, Re));
      out = LF('อ่านกราฟย้อนทาง (รู้ f และ N<sub>R</sub>)', 'จุด (N<sub>R</sub>, f)', `= (${NR(Re)}, ${f})`, `อยู่บนเส้น ε/D ≈ ${N(rrUse, 4)}`, 'hl') +
        LF('ความขรุขระของท่อ', 'ε = (ε/D) × D', `= (${N(rrUse, 4)})(21 mm)`, `= ${N(rrUse * 21, 3)} mm`, 'hl');
    } else if (Re <= 2000) {
      f = 64 / Re;
      out = LF('การไหลแบบราบเรียบ ใช้สูตร', `f = ${FR('64', 'N<sub>R</sub>')}`, `= ${FR('64', NR(Re))}`, `= ${N(f, 4)}`, 'hl') + '<div class="small muted">แบบราบเรียบ ค่า ε/D ไม่มีผล</div>';
    } else {
      f = fOf(Re, rr);
      out = LF(Re < 4000 ? 'ช่วงเปลี่ยนแปลง (ค่าไม่แน่นอน ควรหลีกเลี่ยง)' : 'การไหลแบบปั่นป่วน อ่านจาก Moody Chart', 'f', `ที่ N<sub>R</sub> = ${NR(Re)}, ε/D = ${rrTxt(rr)}`, `≈ ${N(f, 4)}`, 'hl');
    }
    $('#mReT').innerHTML = NR(Re);
    $('#mRrT').innerHTML = rrTxt(rr);
    svg.innerHTML = moodySVG({ id: 'i', pt: { Re, f }, hlRR: Re > 2000 ? rrUse : null });
    $('#moodyOut').innerHTML = `<div>ชนิดการไหล: ${badge(Re)}</div>` + out;
  }
  $('#mRe').addEventListener('input', () => { st.fixedF = null; st.Re = null; draw(); });
  $('#mRr').addEventListener('input', () => { st.fixedF = null; st.rr = null; draw(); });
  $$('[data-re]', svg.parentElement).forEach(b => b.addEventListener('click', () => {
    st.fixedF = null; st.Re = +b.dataset.re; st.rr = +b.dataset.rr;
    $('#mRe').value = Math.log10(+b.dataset.re);
    $('#mRr').value = +b.dataset.rr === 0 ? -6.3 : Math.log10(+b.dataset.rr);
    draw();
  }));
  const ex = $('#ex55moody');
  if (ex) ex.addEventListener('click', () => {
    st.fixedF = 0.043; st.Re = 59364; st.rr = null; $('#mRe').value = Math.log10(59364); $('#mRr').value = Math.log10(0.013);
    draw(); svg.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  draw();
})();

/* =====================================================================
   ตาราง 5-1 ความขรุขระ
   ===================================================================== */
(function roughDemo() {
  const svg = $('#roughSvg'); if (!svg) return;
  let cur = 'castiron';
  $('#roughPick').innerHTML = ROUGH.map(r => `<button data-k="${r.k}" class="${r.k === cur ? 'on' : ''}">${r.name.replace(/ \(.*\)/, '')} <span class="small">${r.txt}</span></button>`).join('');
  function draw() {
    const r = ROUGH.find(x => x.k === cur), D = +$('#roughD').value;
    $('#roughDt').textContent = D;
    const hpx = r.e === 0 ? 0 : clamp(6 + Math.log10(r.e / 0.001) * 11, 2, 44);
    let h = `<rect x="10" y="30" width="190" height="130" fill="var(--water-soft)"/>`;
    let p = `M10,160 `;
    const n = 26;
    for (let i = 0; i <= n; i++) { const x = 10 + i * 190 / n, y = 160 - (i % 2 ? hpx * (0.6 + 0.4 * Math.abs(Math.sin(i * 1.7))) : 0); p += `L${x.toFixed(1)},${y.toFixed(1)} `; }
    h += `<path d="${p} L200,180 L10,180 Z" fill="var(--metal)" stroke="var(--text)" stroke-width="1"/>`;
    if (hpx > 0) h += `<line x1="196" x2="196" y1="160" y2="${160 - hpx}" stroke="var(--accent)" stroke-width="2"/><text x="150" y="${150 - hpx}" style="font-size:13px;fill:var(--accent);font-weight:700">ε</text>`;
    h += `<path d="M20,80 L180,80" stroke="var(--water)" stroke-width="2" class="flowline"/><text x="20" y="66" class="svg-m" style="font-size:11px">น้ำไหลผ่านผิวท่อ</text>`;
    h += `<text x="105" y="22" text-anchor="middle" class="svg-t" style="font-size:12px">ภาพขยายผิวท่อ</text>`;
    // หน้าตัดท่อ
    const R = 54, cx = 262, cy = 95, ring = r.e === 0 ? 0 : clamp(r.e / D * 400, 1, 14);
    h += `<circle cx="${cx}" cy="${cy}" r="${R + 6}" fill="var(--metal)" stroke="var(--text)"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="var(--water-soft)" stroke="${ring ? 'var(--accent)' : 'var(--text)'}" stroke-width="${Math.max(1, ring)}" stroke-dasharray="${ring ? '2 2' : ''}"/>`;
    h += `<line x1="${cx - R}" x2="${cx + R}" y1="${cy}" y2="${cy}" stroke="var(--text)"/><text x="${cx}" y="${cy - 6}" text-anchor="middle" class="svg-t" style="font-size:12px">D = ${D} mm</text>`;
    svg.innerHTML = h;
    $('#roughOut').innerHTML = LF(`ความขรุขระ ${r.name}`, 'ε (ตาราง 5-1)', r.note || '', `= ${r.txt} mm`) +
      LF('ความขรุขระสัมพัทธ์', `${FR('ε', 'D')}`, r.e === 0 ? '= 0 / ' + D : `= ${FR(r.e, D)}`, `= ${r.e === 0 ? '0 (ผิวเรียบ)' : N(r.e / D, 5)}`, 'hl') +
      `<div class="small muted">ε และ D ต้องเป็นหน่วยเดียวกัน (mm กับ mm) ผลลัพธ์จึงไม่มีหน่วย · ท่อขนาดเล็กจะมี ε/D มาก จึงฝืดกว่าท่อใหญ่ที่ทำจากวัสดุเดียวกัน</div>`;
  }
  $('#roughPick').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cur = b.dataset.k; $$('#roughPick button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  $('#roughD').addEventListener('input', draw);
  draw();
})();

/* =====================================================================
   5.2.3 การสูญเสียหลัก (ท่อตรง + หลอดแก้ว 2 จุด)
   ===================================================================== */
(function majorDemo() {
  const svg = $('#majorSvg'); if (!svg) return;
  let fluid = 'water';
  $('#mjMat').innerHTML = ROUGH.map(r => `<option value="${r.k}"${r.k === 'galv' ? ' selected' : ''}>${r.name} (ε = ${r.txt} mm)</option>`).join('');
  function draw() {
    const L = +$('#mjL').value, D = +$('#mjD').value / 1000, Q = +$('#mjQ').value / 1000;
    $('#mjLt').textContent = L; $('#mjDt').textContent = Math.round(D * 1000); $('#mjQt').textContent = N(Q * 1000, 2);
    const r = ROUGH.find(x => x.k === $('#mjMat').value);
    const A = AREA(D), v = Q / A, nu = fluid === 'water' ? 1.02e-6 : 0.20 / 840;
    const Re = D * v / nu, rr = r.e / 1000 / D, f = fOf(Re, rr), hf = f * L / D * VH(v);
    const ranges = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 5000];
    const rng = ranges.find(x => hf <= x * 0.92) || 1e4;
    const top = 46, base = 196, Hpx = base - 16 - top, x0 = 70, x1 = 480;
    const yLvl = top + 6, yLvl2 = top + 6 + hf / rng * Hpx;
    let h = `<defs><marker id="arM" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--water)"/></marker></defs>`;
    const dpx = clamp(D * 1000 * 0.32, 8, 34);
    h += `<rect x="${x0 - 30}" y="${base - dpx / 2}" width="${x1 - x0 + 60}" height="${dpx}" fill="var(--water-soft)" stroke="var(--text)" stroke-width="1.5"/>`;
    h += `<path d="M${x0 - 20},${base} L${x1 + 24},${base}" stroke="var(--water)" stroke-width="2" class="flowline" style="animation-duration:${(1.2 / clamp(v, .2, 6)).toFixed(2)}s" marker-end="url(#arM)"/>`;
    [[x0, yLvl], [x1, yLvl2]].forEach(([x, y], i) => {
      h += `<rect x="${x - 8}" y="${top - 6}" width="16" height="${base - dpx / 2 - top + 6}" fill="var(--glass)" stroke="var(--text)"/>`;
      h += `<rect x="${x - 7}" y="${Math.min(y, base - dpx / 2)}" width="14" height="${Math.max(0, base - dpx / 2 - y)}" fill="var(--water)" opacity=".8"/>`;
      h += `<text x="${x}" y="${base + dpx / 2 + 16}" text-anchor="middle" class="svg-m" style="font-size:11px">จุด ${i + 1}</text>`;
    });
    if (yLvl2 <= base) {
      h += `<line x1="${x0 + 10}" x2="${x1 - 10}" y1="${yLvl}" y2="${yLvl2}" stroke="var(--hf)" stroke-width="2" stroke-dasharray="6 4"/>`;
      h += `<line x1="${x1 + 20}" x2="${x1 + 20}" y1="${yLvl}" y2="${yLvl2}" stroke="var(--hf)" stroke-width="2.5"/><line x1="${x1 + 14}" x2="${x1 + 26}" y1="${yLvl}" y2="${yLvl}" stroke="var(--hf)" stroke-width="2"/><line x1="${x1 + 14}" x2="${x1 + 26}" y1="${yLvl2}" y2="${yLvl2}" stroke="var(--hf)" stroke-width="2"/>`;
      h += `<text x="${x1 + 30}" y="${(yLvl + yLvl2) / 2 + 4}" style="font-size:13px;fill:var(--hf);font-weight:700">h<tspan baseline-shift="sub" font-size="9">f</tspan></text>`;
    }
    h += `<line x1="${x0}" x2="${x1}" y1="${base + dpx / 2 + 26}" y2="${base + dpx / 2 + 26}" stroke="var(--muted)"/><text x="${(x0 + x1) / 2}" y="${base + dpx / 2 + 40}" text-anchor="middle" class="svg-m" style="font-size:11px">L = ${L} m · D = ${Math.round(D * 1000)} mm</text>`;
    h += `<text x="8" y="20" class="svg-m" style="font-size:11px">สเกลหลอดแก้ว 0–${rng} m (ปรับตามค่า h_f อัตโนมัติ)</text>`;
    svg.innerHTML = h;
    const fLine = Re <= 2000 ? LF('④ แฟกเตอร์ความเสียดทาน (ราบเรียบ)', `f = ${FR('64', 'N<sub>R</sub>')}`, `= ${FR('64', NR(Re))}`, `= ${N(f, 4)}`)
      : LF(`④ แฟกเตอร์ความเสียดทาน (${Re < 4000 ? 'ช่วงเปลี่ยน ค่าประมาณ' : 'ปั่นป่วน อ่าน Moody'})`, `ε/D = ${FR(r.e, Math.round(D * 1000))} = ${r.e === 0 ? '0' : N(rr, 5)}`, `Moody ที่ N<sub>R</sub> = ${NR(Re)}`, `f ≈ ${N(f, 4)}`);
    $('#mjOut').innerHTML =
      LF('① พื้นที่หน้าตัดท่อ', `A = ${FR('π D²', '4')}`, `= ${FR(`π (${N(D, 3)})²`, '4')}`, `= ${SCI(A, 3)} m²`) +
      LF('② ความเร็ว', `v = ${FR('Q', 'A')}`, `= ${FR(SCI(Q, 2), SCI(A, 3))}`, `= ${N(v, 3)} m/s`) +
      LF('③ เรย์โนลด์นัมเบอร์', `N<sub>R</sub> = ${FR('D v', 'υ')}`, `= ${FR(`(${N(D, 3)})(${N(v, 3)})`, SCI(nu, 2))}`, `= ${NR(Re)} ${badge(Re)}`) +
      fLine +
      LF('⑤ การสูญเสียหลัก', `h<sub>f</sub> = f ${FR('L', 'D')} ${FR('v²', '2g')}`, `= (${N(f, 4)})(${FR(L, N(D, 3))})(${FR(N(v, 3) + '²', '2(9.81)')})`, `= ${hf < 0.01 ? SCI(hf, 3) : N(hf, 3)} m`, 'hl');
  }
  $('#mjFluid').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    fluid = b.dataset.f; $$('#mjFluid button').forEach(x => x.classList.toggle('on', x === b));
    if (fluid === 'oil') { $('#mjL').value = 1; $('#mjD').value = 200; $('#mjQ').value = 1; }   // ตัวอย่าง 5.4
    draw();
  });
  ['#mjL', '#mjD', '#mjQ', '#mjMat'].forEach(s => $(s).addEventListener('input', draw));
  draw();
})();
