/* ===== บทที่ 4 งานทดสอบคุณสมบัติของของไหล =====
   ต้องโหลด js/common.js ก่อนไฟล์นี้ (ใช้ $, $$, N, FR, SCI, LF, initCalcs, initQuiz, initFormulas ฯลฯ)
   ค่าความหนาแน่นของของเหลวเป็นค่าโดยประมาณที่อุณหภูมิห้อง */

const RHO_W = 1000, GAM_W = 9810;
const apiOf = sg => 141.5 / sg - 131.5;
const sgOfApi = a => 141.5 / (a + 131.5);
const beOf = sg => 140 / sg - 130;          // องศาโบเม่ (ของเหลวเบากว่าน้ำ) ตรงกับสเกล 度 70–10 บนไฮโดรมิเตอร์จีนของจริง
const sgOfBe = b => 140 / (b + 130);

/* ของเหลวที่ใช้ในห้องทดลองเสมือน (sg = ความถ่วงจำเพาะโดยประมาณ) */
const LIQ = {
  gasohol: { name: 'น้ำมันแก๊สโซฮอล์ 95', sg: 0.745, color: '#f08a24', cname: 'ส้ม', op: .75 },
  alcohol: { name: 'แอลกอฮอล์ (เอทานอล 95%)', sg: 0.810, color: '#d9ecf5', cname: 'ใส ไม่มีสี', op: .55 },
  kerosene: { name: 'น้ำมันก๊าด', sg: 0.795, color: '#bcdcef', cname: 'ใส อมฟ้าเล็กน้อย', op: .6 },
  diesel: { name: 'น้ำมันดีเซล', sg: 0.835, color: '#e6d25a', cname: 'เหลืองอ่อน', op: .75 },
  engine: { name: 'น้ำมันเครื่อง SAE 40', sg: 0.880, color: '#a8661c', cname: 'น้ำตาลอำพัน', op: .9 },
  palm: { name: 'น้ำมันพืช (ปาล์ม)', sg: 0.910, color: '#f2c230', cname: 'เหลืองทอง', op: .85 },
  water: { name: 'น้ำ', sg: 0.998, color: '#8cc6f0', cname: 'ใส ไม่มีสี', op: .5 },
  brine: { name: 'น้ำเกลือเข้มข้น', sg: 1.150, color: '#a9dde3', cname: 'ใส', op: .55 },
  glycerin: { name: 'กลีเซอรีน', sg: 1.260, color: '#efe9c9', cname: 'ใส หนืด', op: .7 }
};

/* =====================================================================
   4.1 ของแข็ง vs ของไหล เมื่อมีแรงเฉือน
   ===================================================================== */
(function shearDemo() {
  const svg = $('#shearSvg'); if (!svg) return;
  const s = { force: false, sOff: 0, fOff: 0, sVel: 0 };
  const P = [{ x: 20, title: 'ของแข็ง (ยางก้อน)' }, { x: 300, title: 'ของไหล (น้ำมัน)' }];
  const W = 240, yT = 70, yB = 170, H = yB - yT;
  const plate = (x, y, w, fill) => `<rect x="${x}" y="${y}" width="${w}" height="14" rx="3" fill="${fill}" stroke="var(--text)" stroke-width="1.2"/>`;
  function draw() {
    let h = `<defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="var(--muted)" stroke-width="2"/></pattern>
      <clipPath id="clipF"><rect x="${P[1].x}" y="${yT}" width="${W}" height="${H}"/></clipPath></defs>`;
    P.forEach((p, i) => {
      h += `<text x="${p.x + W / 2}" y="22" text-anchor="middle" class="svg-b">${p.title}</text>`;
      h += `<rect x="${p.x}" y="${yB}" width="${W}" height="16" fill="url(#hatch)" stroke="var(--text)"/>`;
      h += `<text x="${p.x + W / 2}" y="${yB + 34}" text-anchor="middle" class="svg-m">แผ่นล่างยึดอยู่กับที่</text>`;
    });
    // ของแข็ง
    const x0 = P[0].x + 40, w = 160, o = s.sOff;
    h += `<polygon points="${x0},${yB} ${x0 + w},${yB} ${x0 + w + o},${yT} ${x0 + o},${yT}" fill="#d6a35c" stroke="#8a5a1c" stroke-width="1.5" opacity=".9"/>`;
    h += `<line x1="${x0 + w / 2}" y1="${yB}" x2="${x0 + w / 2 + o}" y2="${yT}" stroke="var(--dye)" stroke-width="4" stroke-linecap="round"/>`;
    h += plate(x0 - 10 + o, yT - 14, w + 20, 'var(--metal)');
    // ของไหล
    const xf = P[1].x;
    h += `<rect x="${xf}" y="${yT}" width="${W}" height="${H}" fill="var(--oil)" opacity=".35"/>`;
    h += `<g clip-path="url(#clipF)">`;
    [0.25, 0.5, 0.75].forEach(k => {
      const xm = xf + W * k - 40;
      h += `<line x1="${xm}" y1="${yB}" x2="${xm + s.fOff}" y2="${yT}" stroke="var(--dye)" stroke-width="${k === 0.5 ? 4 : 2}" stroke-linecap="round" opacity="${k === 0.5 ? 1 : .45}"/>`;
    });
    if (s.force) for (let j = 1; j <= 4; j++) {
      const y = yB - j * H / 5, L = 70 * j / 5;
      h += `<line x1="${xf + 12}" y1="${y}" x2="${xf + 12 + L}" y2="${y}" stroke="var(--brand)" stroke-width="2" marker-end="url(#arF)"/>`;
    }
    h += `</g><defs><marker id="arF" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--brand)"/></marker>
      <marker id="arK" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--accent)"/></marker></defs>`;
    // แผ่นบนของไหล: ยาวกว่าช่อง ใช้ลายขีดเลื่อนให้เห็นว่าเคลื่อนที่
    h += `<rect x="${xf - 6}" y="${yT - 14}" width="${W + 12}" height="14" rx="3" fill="var(--metal)" stroke="var(--text)" stroke-width="1.2"/>`;
    for (let k = 0; k < 9; k++) {
      const xx = xf + ((k * 30 + s.fOff) % (W + 12)) - 6;
      h += `<line x1="${xx}" y1="${yT - 12}" x2="${xx}" y2="${yT - 2}" stroke="var(--surface)" stroke-width="2" opacity=".7"/>`;
    }
    if (s.force) {
      h += `<line x1="${x0 + o - 52}" y1="${yT - 7}" x2="${x0 + o - 14}" y2="${yT - 7}" stroke="var(--accent)" stroke-width="4" marker-end="url(#arK)"/><text x="${x0 + o - 50}" y="${yT - 18}" class="svg-b" fill="var(--accent)">F</text>`;
      h += `<line x1="${xf - 46}" y1="${yT - 7}" x2="${xf - 10}" y2="${yT - 7}" stroke="var(--accent)" stroke-width="4" marker-end="url(#arK)"/><text x="${xf - 44}" y="${yT - 18}" class="svg-b" fill="var(--accent)">F</text>`;
    }
    const aS = Math.atan(s.sOff / H) * 180 / Math.PI, aF = Math.atan(s.fOff / H) * 180 / Math.PI;
    h += `<text x="${P[0].x + W / 2}" y="${yB + 54}" text-anchor="middle" class="svg-t">มุมเอียงของเส้นชมพู ${aS.toFixed(0)}°</text>`;
    h += `<text x="${P[1].x + W / 2}" y="${yB + 54}" text-anchor="middle" class="svg-t">มุมเอียงของเส้นชมพู ${aF.toFixed(0)}°${aF > 80 ? ' (ไหลต่อไปเรื่อย ๆ)' : ''}</text>`;
    svg.innerHTML = h;
    $('#shearOut').innerHTML =
      LF('ของแข็ง', s.force ? 'มีแรง F' : 'ไม่มีแรง', s.force ? 'เสียรูปไปนิดหนึ่ง แล้วหยุดนิ่ง' : (s.sOff > 1 ? 'กำลังเด้งกลับรูปเดิม' : 'อยู่ในรูปเดิม'), s.force ? 'หยุดที่มุมคงที่' : 'กลับรูปเดิม', s.force ? '' : 'wait') +
      LF('ของไหล', s.force ? 'มีแรง F' : 'ไม่มีแรง', s.force ? 'ชั้นบนเคลื่อนเร็ว ชั้นล่างเคลื่อนช้า (ลูกศรน้ำเงิน)' : (s.fOff > 0 ? 'หยุดไหล แต่ไม่เด้งกลับ' : 'ยังไม่ไหล'), s.force ? 'เสียรูปต่อเนื่อง = ไหล' : 'คงรูปที่เสียไปแล้ว', 'hl');
  }
  let last = performance.now(), vis = false, running = false;
  whenVisible(svg, v => { vis = v; if (v && !running) { running = true; last = performance.now(); requestAnimationFrame(tick); } });
  function tick(t) {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    const target = s.force ? 34 : 0;
    s.sVel += ((target - s.sOff) * 60 - s.sVel * 9) * dt;   // สปริง+หน่วง ให้เด้งนิด ๆ
    s.sOff += s.sVel * dt;
    if (s.force) s.fOff = Math.min(s.fOff + 32 * dt, 1200);
    draw();
    if (vis) requestAnimationFrame(tick); else running = false;
  }
  $('#shearGo').addEventListener('click', () => { s.force = true; });
  $('#shearStop').addEventListener('click', () => { s.force = false; });
  $('#shearReset').addEventListener('click', () => { s.force = false; s.sOff = 0; s.sVel = 0; s.fOff = 0; });
  draw();
})();

/* =====================================================================
   4.1 ของเหลว vs แก๊ส เมื่อถูกอัด (กระบอกฉีดยา)
   ===================================================================== */
(function syringeDemo() {
  const svg = $('#syrSvg'); if (!svg) return;
  const r = $('#syrR');
  const dots = Array.from({ length: 46 }, (_, i) => [Math.random(), Math.random()]);
  function syr(y, L, fill, label, isGas, p) {
    const x0 = 70, xEnd = x0 + L;
    let h = `<text x="20" y="${y - 30}" class="svg-b">${label}</text>`;
    h += `<rect x="${x0 - 22}" y="${y - 6}" width="22" height="12" rx="2" fill="var(--muted)"/><text x="${x0 - 30}" y="${y + 28}" class="svg-m" text-anchor="middle">อุดปลาย</text>`;
    h += `<rect x="${x0}" y="${y - 22}" width="370" height="44" rx="4" fill="var(--glass)" stroke="var(--text)" stroke-width="1.5"/>`;
    h += `<rect x="${x0 + 1}" y="${y - 21}" width="${L - 1}" height="42" fill="${fill}" opacity="${isGas ? .18 : .6}"/>`;
    if (isGas) dots.forEach(d => { h += `<circle cx="${x0 + 4 + d[0] * (L - 8)}" cy="${y - 17 + d[1] * 34}" r="2.4" fill="var(--brand)" opacity=".75"/>`; });
    for (let k = 1; k < 10; k++) h += `<line x1="${x0 + k * 37}" y1="${y - 22}" x2="${x0 + k * 37}" y2="${y - 14}" stroke="var(--muted)" stroke-width="1"/>`;
    h += `<rect x="${xEnd}" y="${y - 21}" width="8" height="42" fill="#555"/><rect x="${xEnd + 8}" y="${y - 4}" width="${440 - xEnd + 40}" height="8" fill="var(--metal)"/>`;
    h += `<rect x="${488}" y="${y - 20}" width="8" height="40" rx="2" fill="var(--metal)"/>`;
    const fw = 14 + (p - 1) * 9;
    h += `<line x1="${548}" y1="${y}" x2="${502}" y2="${y}" stroke="var(--accent)" stroke-width="${3 + (p - 1)}" marker-end="url(#arS)"/>`;
    h += `<text x="${x0 + L / 2}" y="${y + 40}" text-anchor="middle" class="svg-t">ปริมาตร ${N(isGas ? 100 / p : 100 * (1 - 4.6e-10 * (p - 1) * 101325), isGas ? 0 : 3)}%</text>`;
    void fw;
    return h;
  }
  function draw() {
    const p = +r.value;
    $('#syrP').textContent = p.toFixed(1);
    const L0 = 330;
    let h = `<defs><marker id="arS" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--accent)"/></marker></defs>`;
    h += syr(58, L0 * (1 - 4.6e-10 * (p - 1) * 101325), 'var(--water)', '💧 น้ำ (ของเหลว)', false, p);
    h += syr(168, L0 / p, 'var(--water-soft)', '💨 อากาศ (แก๊ส)', true, p);
    svg.innerHTML = h;
    const dW = 4.6e-10 * (p - 1) * 101325 * 100;
    $('#syrOut').innerHTML =
      LF('อากาศ (แก๊ส) ปริมาตรลดเหลือ', `V ∝ ${FR('1', 'p')}`, `= ${FR('100%', p.toFixed(1))}`, `= ${N(100 / p, 1)}% ของเดิม`, 'hl') +
      LF('น้ำ (ของเหลว) ปริมาตรลดลงเพียง', 'ลดลง', p > 1 ? `ประมาณ ${N(dW, 4)}%` : '0%', 'มองไม่เห็นด้วยตา') +
      `<div class="small muted">ของเหลวจึงถือว่า<b>ไม่ยุบตัวตามความดัน</b> ส่วนแก๊ส<b>ยุบตัวตามความดัน</b> (หลักนี้ทำให้ระบบเบรกและแม่แรงใช้น้ำมันไฮดรอลิก ไม่ใช้อากาศ)</div>`;
  }
  r.addEventListener('input', draw);
  draw();
})();

/* =====================================================================
   4.2 หอคอยของเหลว
   ===================================================================== */
(function densityTower() {
  const svg = $('#towerSvg'); if (!svg) return;
  const TL = {
    honey: { name: 'น้ำผึ้ง', rho: 1420, color: '#d4900f' },
    syrup: { name: 'น้ำเชื่อมเข้มข้น (ผสมสีแดง)', rho: 1330, color: '#d6336c' },
    soap: { name: 'น้ำยาล้างจาน', rho: 1060, color: '#2fa84f' },
    water: { name: 'น้ำ (ผสมสีฟ้า)', rho: 1000, color: '#2f86d6' },
    oil: { name: 'น้ำมันพืช', rho: 920, color: '#f2c230' },
    alc: { name: 'แอลกอฮอล์ (ผสมสีม่วง)', rho: 790, color: '#8b46c9' }
  };
  const TO = {
    steel: { name: 'ลูกเหล็ก', rho: 7850, color: '#8a96a6', r: 7 },
    grape: { name: 'องุ่น', rho: 1100, color: '#6b2a7a', r: 9 },
    bead: { name: 'ลูกปัดพลาสติก', rho: 900, color: '#f5f5f5', r: 6 },
    pong: { name: 'ลูกปิงปอง', rho: 80, color: '#ff8a2a', r: 11 }
  };
  const gx = 70, gw = 120, gTop = 30, gBot = 310, LH = 40;
  let layers = [], objs = [];
  $('#towerLiq').innerHTML = Object.entries(TL).map(([k, l]) => `<button data-k="${k}"><i class="sw" style="background:${l.color}"></i>${l.name.replace(/ \(.*\)/, '')} ${l.rho.toLocaleString('en-US')}</button>`).join('');
  $('#towerObj').innerHTML = Object.entries(TO).map(([k, o]) => `<button data-k="${k}"><i class="sw" style="background:${o.color}"></i>${o.name} ${o.rho.toLocaleString('en-US')}</button>`).join('');
  function targets() {
    const sorted = [...layers].sort((a, b) => b.rho - a.rho);
    sorted.forEach((l, i) => { l.ty = gBot - (i + 1) * LH; });
    const surf = layers.length ? gBot - layers.length * LH : gBot;
    objs.forEach(o => {
      // วัตถุจมลงจนเจอชั้นที่หนาแน่นกว่ามัน แล้วลอยอยู่ที่ผิวบนของชั้นนั้น
      const below = sorted.filter(l => l.rho > o.rho);
      if (!layers.length) o.ty = gBot - o.r;
      else if (!below.length) o.ty = gBot - o.r;
      else {
        const top = below[below.length - 1];
        o.ty = top.ty;   // อยู่ที่รอยต่อ
        if (top === sorted[sorted.length - 1]) o.ty = surf - o.r * (o.rho / top.rho) + o.r * 0.9 - o.r; // ลอยที่ผิวบนสุด
      }
    });
  }
  function msgFor(l) {
    const sorted = [...layers].sort((a, b) => b.rho - a.rho), i = sorted.indexOf(l);
    const below = sorted[i - 1], above = sorted[i + 1];
    let m = `<b>${l.name}</b> (ρ ≈ ${l.rho.toLocaleString('en-US')} kg/m³) `;
    if (layers.length === 1) return m + 'อยู่ในแก้วชนิดเดียว ลองเทชนิดอื่นเพิ่ม';
    if (!below) m += 'หนาแน่นที่สุด จึงจมลงไปอยู่<b>ล่างสุด</b>';
    else if (!above) m += 'หนาแน่นน้อยที่สุด จึงลอยอยู่<b>บนสุด</b>';
    else m += `อยู่ระหว่าง ${above.name.replace(/ \(.*\)/, '')} กับ ${below.name.replace(/ \(.*\)/, '')} เพราะหนาแน่นกว่าชั้นบน แต่น้อยกว่าชั้นล่าง`;
    return m;
  }
  function draw() {
    let h = `<defs><clipPath id="glassClip"><rect x="${gx}" y="${gTop}" width="${gw}" height="${gBot - gTop}" rx="6"/></clipPath>
      <linearGradient id="gShine" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".25" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
    h += `<g clip-path="url(#glassClip)">`;
    layers.forEach(l => { h += `<rect x="${gx}" y="${l.y}" width="${gw}" height="${LH + 1}" fill="${l.color}" opacity="${l.y < l.ty - 2 ? .55 : .88}"/>`; });
    objs.forEach(o => {
      h += `<circle cx="${o.x}" cy="${o.y}" r="${o.r}" fill="${o.color}" stroke="#333" stroke-width="1"/>`;
      if (o.k === 'steel') h += `<circle cx="${o.x - 2}" cy="${o.y - 2}" r="2" fill="#fff" opacity=".7"/>`;
    });
    h += `</g>`;
    h += `<rect x="${gx}" y="${gTop}" width="${gw}" height="${gBot - gTop}" rx="6" fill="url(#gShine)" stroke="var(--text)" stroke-width="2"/>`;
    h += `<rect x="${gx - 10}" y="${gBot}" width="${gw + 20}" height="8" rx="3" fill="var(--muted)"/>`;
    [...layers].sort((a, b) => b.rho - a.rho).forEach(l => {
      if (Math.abs(l.y - l.ty) > 3) return;
      h += `<line x1="${gx + gw + 4}" x2="${gx + gw + 14}" y1="${l.ty + LH / 2}" y2="${l.ty + LH / 2}" stroke="var(--muted)"/>`;
      h += `<text x="${gx + gw + 18}" y="${l.ty + LH / 2 - 2}" class="svg-t" style="font-size:12px">${l.name.replace(/ \(.*\)/, '')}</text><text x="${gx + gw + 18}" y="${l.ty + LH / 2 + 12}" class="svg-m" style="font-size:11px">${l.rho.toLocaleString('en-US')} kg/m³</text>`;
    });
    if (!layers.length) h += `<text x="${gx + gw / 2}" y="${(gTop + gBot) / 2}" text-anchor="middle" class="svg-m">แก้วว่าง</text>`;
    h += `<text x="${gx - 8}" y="${gTop + 12}" text-anchor="end" class="svg-m" style="font-size:11px">เบา ↑</text><text x="${gx - 8}" y="${gBot - 4}" text-anchor="end" class="svg-m" style="font-size:11px">หนัก ↓</text>`;
    svg.innerHTML = h;
  }
  let raf = null;
  function animate() {
    if (raf) return;
    const step = () => {
      let moving = false;
      layers.forEach(l => { const d = l.ty - l.y; if (Math.abs(d) > 0.5) { l.y += d * 0.12; moving = true; } else l.y = l.ty; });
      objs.forEach(o => { const d = o.ty - o.y; if (Math.abs(d) > 0.5) { o.y += Math.sign(d) * Math.min(Math.abs(d), 1.5 + Math.abs(d) * 0.06); moving = true; } else o.y = o.ty; });
      draw();
      raf = moving ? requestAnimationFrame(step) : null;
    };
    raf = requestAnimationFrame(step);
  }
  function addLiq(k) {
    if (layers.some(l => l.k === k)) { $('#towerMsg').innerHTML = `${TL[k].name} อยู่ในแก้วแล้ว ลองชนิดอื่น`; $('#towerMsg').className = 'status warn'; return; }
    const l = { k, ...TL[k], y: gTop - LH };
    layers.push(l); targets(); animate();
    $('#towerMsg').innerHTML = msgFor(l); $('#towerMsg').className = 'status ok';
    $$('#towerLiq button').forEach(b => b.classList.toggle('done', layers.some(x => x.k === b.dataset.k)));
  }
  $('#towerLiq').addEventListener('click', e => { const b = e.target.closest('button'); if (b) addLiq(b.dataset.k); });
  $('#towerObj').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const k = b.dataset.k;
    if (objs.some(o => o.k === k)) return;
    const o = { k, ...TO[k], x: gx + 22 + objs.length * 26, y: gTop + 6 };
    objs.push(o); targets(); animate();
    const sorted = [...layers].sort((a, c) => c.rho - a.rho);
    const below = sorted.filter(l => l.rho > o.rho);
    let m = `<b>${o.name}</b> (ρ ≈ ${o.rho.toLocaleString('en-US')} kg/m³) `;
    if (!layers.length) m += 'ตกลงก้นแก้ว เพราะแก้วยังว่าง';
    else if (!below.length) m += 'หนาแน่นกว่าของเหลวทุกชั้น จึง<b>จมถึงก้นแก้ว</b>';
    else if (below.length === sorted.length) m += `เบากว่าของเหลวทุกชั้น จึง<b>ลอยอยู่บนผิวบนสุด</b> (บน${sorted[sorted.length - 1].name.replace(/ \(.*\)/, '')})`;
    else m +=`จมผ่านชั้นที่เบากว่ามัน แล้ว<b>ลอยค้างอยู่บน${below[below.length - 1].name.replace(/ \(.*\)/, '')}</b> ซึ่งหนาแน่นกว่ามัน`;
    $('#towerMsg').innerHTML = m; $('#towerMsg').className = 'status ok';
    b.classList.add('done');
  });
  $('#towerReset').addEventListener('click', () => {
    layers = []; objs = []; draw();
    $$('#towerLiq button, #towerObj button').forEach(b => b.classList.remove('done'));
    $('#towerMsg').innerHTML = 'แก้วยังว่างอยู่ ลองเทของเหลวชนิดใดก็ได้'; $('#towerMsg').className = 'status';
  });
  $('#towerAll').addEventListener('click', () => {
    ['water', 'oil', 'honey', 'alc', 'soap', 'syrup'].forEach((k, i) => setTimeout(() => { if (!layers.some(l => l.k === k)) addLiq(k); }, i * 350));
  });
  draw();
})();

/* =====================================================================
   4.3 น้ำหนักจำเพาะ: ชั่งของเหลว 1 m³
   ===================================================================== */
(function gammaDemo() {
  const svg = $('#gammaSvg'); if (!svg) return;
  const GL = {
    water: { name: 'น้ำ', rho: 1000, color: '#2f86d6' },
    gasohol: { name: 'แก๊สโซฮอล์ 95', rho: 745, color: '#f08a24' },
    diesel: { name: 'ดีเซล', rho: 835, color: '#e6d25a' },
    engine: { name: 'น้ำมันเครื่อง', rho: 880, color: '#a8661c' },
    sea: { name: 'น้ำทะเล', rho: 1025, color: '#1f8a8a' },
    mercury: { name: 'ปรอท', rho: 13600, color: '#b7bec8' }
  };
  let cur = 'water', g = 9.81;
  $('#gammaLiq').innerHTML = Object.entries(GL).map(([k, l], i) => `<button data-k="${k}" class="${i ? '' : 'on'}"><i class="sw" style="background:${l.color}"></i>${l.name}</button>`).join('');
  function draw() {
    const l = GL[cur], m = l.rho * 1, w = m * g, moon = g < 5;
    let h = moon ? `<rect x="0" y="0" width="520" height="260" fill="#1b2230" opacity=".12"/><circle cx="470" cy="40" r="22" fill="#d8d8d0" stroke="#999"/>` : `<circle cx="470" cy="40" r="22" fill="#4aa3df"/><path d="M455,35 q8,-10 16,0 q6,8 14,2" stroke="#3a9a4a" stroke-width="5" fill="none"/>`;
    // ถัง 1 m³ แบบ 3 มิติ
    const x = 110, y = 60, s = 120, d = 40;
    h += `<polygon points="${x},${y} ${x + d},${y - d * .6} ${x + s + d},${y - d * .6} ${x + s},${y}" fill="var(--glass)" stroke="var(--text)"/>`;
    h += `<polygon points="${x + s},${y} ${x + s + d},${y - d * .6} ${x + s + d},${y + s - d * .6} ${x + s},${y + s}" fill="${l.color}" opacity=".55" stroke="var(--text)"/>`;
    h += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${l.color}" opacity=".8" stroke="var(--text)"/>`;
    h += `<text x="${x + s / 2}" y="${y + s / 2}" text-anchor="middle" class="svg-b" fill="#fff" style="fill:#fff">1 m³</text><text x="${x + s / 2}" y="${y + s / 2 + 18}" text-anchor="middle" style="fill:#fff;font-size:12px">${l.name}</text>`;
    h += `<text x="${x + s / 2}" y="${y + s + 14}" text-anchor="middle" class="svg-m" style="font-size:11px">1 m × 1 m × 1 m</text>`;
    // เครื่องชั่ง
    h += `<rect x="60" y="${y + s + 20}" width="260" height="14" rx="3" fill="var(--metal)"/><rect x="80" y="${y + s + 34}" width="220" height="36" rx="6" fill="#2a3340"/>`;
    h += `<rect x="150" y="${y + s + 40}" width="140" height="24" rx="3" fill="#0d1a12"/><text x="284" y="${y + s + 58}" text-anchor="end" style="fill:#7dff9b;font-size:16px;font-weight:700;font-variant-numeric:tabular-nums">${N(w, 1)} N</text>`;
    h += `<text x="90" y="${y + s + 57}" style="fill:#a8b3c2;font-size:11px">น้ำหนัก</text>`;
    // คำอธิบาย
    h += `<text x="350" y="110" class="svg-t">มวล m = ${N(m, 0)} kg</text><text x="350" y="132" class="svg-t">g = ${g} m/s² (${moon ? 'ดวงจันทร์' : 'โลก'})</text>`;
    h += `<text x="350" y="160" class="svg-b" style="fill:var(--accent)">γ = ${N(w, 1)} N/m³</text><text x="350" y="182" class="svg-t">ρ = ${N(l.rho, 0)} kg/m³ (เท่าเดิม)</text>`;
    svg.innerHTML = h;
    $('#gammaOut').innerHTML =
      LF('มวลของของเหลว 1 m³', 'm = ρ · V', `= (${N(l.rho, 0)})(1)`, `= ${N(m, 0)} kg`) +
      LF('น้ำหนัก', 'w = m · g', `= (${N(m, 0)})(${g})`, `= ${N(w, 1)} N`) +
      LF('น้ำหนักจำเพาะ', `γ = ${FR('w', 'V')} = ρ · g`, `= ${FR(N(w, 1), '1')} = (${N(l.rho, 0)})(${g})`, `= ${N(w, 1)} N/m³`, 'hl');
  }
  $('#gammaLiq').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cur = b.dataset.k; $$('#gammaLiq button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  $('#gammaPlace').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; g = +b.dataset.g; $$('#gammaPlace button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  draw();
})();

/* =====================================================================
   4.4 ปริมาตรจำเพาะ: สาร 1 kg กินที่เท่าไร
   ===================================================================== */
(function vsDemo() {
  const svg = $('#vsSvg'); if (!svg) return;
  const VL = [
    { k: 'mercury', name: 'ปรอท', rho: 13600, color: '#b7bec8' },
    { k: 'water', name: 'น้ำ', rho: 1000, color: '#2f86d6' },
    { k: 'engine', name: 'น้ำมันเครื่อง', rho: 880, color: '#a8661c' },
    { k: 'gasohol', name: 'แก๊สโซฮอล์ 95', rho: 745, color: '#f08a24' },
    { k: 'air', name: 'อากาศ', rho: 1.2, color: '#9fd0f5' }
  ];
  let cur = 'water';
  $('#vsPick').innerHTML = VL.map(v => `<button data-k="${v.k}" class="${v.k === cur ? 'on' : ''}"><i class="sw" style="background:${v.color}"></i>${v.name}</button>`).join('');
  function draw() {
    const S0 = 62;   // ด้านกล่องของน้ำ 1 ลิตร (px)
    let h = '', x = 24;
    const base = 200;
    VL.forEach(v => {
      const L = 1000 / v.rho;   // ลิตร
      const on = v.k === cur;
      if (v.k === 'air') {
        h += `<rect x="${x}" y="8" width="150" height="${base - 8}" fill="${v.color}" opacity="${on ? .45 : .2}" stroke="var(--brand)" stroke-dasharray="6 4" stroke-width="${on ? 2.5 : 1.2}"/>`;
        h += `<text x="${x + 75}" y="80" text-anchor="middle" class="svg-b">อากาศ 1 kg</text><text x="${x + 75}" y="100" text-anchor="middle" class="svg-t">≈ ${N(L, 0)} ลิตร</text>`;
        h += `<text x="${x + 75}" y="120" text-anchor="middle" class="svg-m" style="font-size:11px">กล่องจริงกว้าง ${N(Math.cbrt(L / 1000) * 100, 0)} cm</text><text x="${x + 75}" y="136" text-anchor="middle" class="svg-m" style="font-size:11px">ใหญ่จนล้นภาพ!</text>`;
        return;
      }
      const s = S0 * Math.cbrt(L), d = s * 0.35;
      h += `<g opacity="${on ? 1 : .55}"><polygon points="${x},${base - s} ${x + d},${base - s - d * .6} ${x + s + d},${base - s - d * .6} ${x + s},${base - s}" fill="${v.color}" opacity=".6" stroke="var(--text)"/>`;
      h += `<polygon points="${x + s},${base - s} ${x + s + d},${base - s - d * .6} ${x + s + d},${base - d * .6} ${x + s},${base}" fill="${v.color}" opacity=".45" stroke="var(--text)"/>`;
      h += `<rect x="${x}" y="${base - s}" width="${s}" height="${s}" fill="${v.color}" opacity=".85" stroke="${on ? 'var(--accent)' : 'var(--text)'}" stroke-width="${on ? 3 : 1}"/></g>`;
      h += `<text x="${x + s / 2}" y="${base + 18}" text-anchor="middle" class="svg-t" style="font-size:12px">${v.name}</text><text x="${x + s / 2}" y="${base + 33}" text-anchor="middle" class="svg-m" style="font-size:11px">${N(L, L < 1 ? 3 : 2)} L</text>`;
      x += s + d + 26;
    });
    h += `<line x1="10" x2="${x - 10}" y1="${base}" y2="${base}" stroke="var(--muted)"/>`;
    svg.innerHTML = h;
    const v = VL.find(q => q.k === cur), vs = 1 / v.rho;
    $('#vsOut').innerHTML =
      LF(`ปริมาตรจำเพาะของ${v.name}`, `V<sub>S</sub> = ${FR('1', 'ρ')}`, `= ${FR('1', N(v.rho, v.rho < 10 ? 1 : 0))}`, `= ${SCI(vs, 3)} m³/kg`, 'hl') +
      LF('แปลงเป็นลิตรต่อกิโลกรัม', 'm³ × 1,000 = ลิตร', `= (${SCI(vs, 3)})(1,000)`, `= ${N(vs * 1000, vs * 1000 < 1 ? 4 : 2)} L/kg`) +
      `<div class="small muted">ยิ่งหนาแน่นมาก (ρ มาก) สาร 1 kg ยิ่งกินที่น้อย (V<sub>S</sub> น้อย) เพราะเป็นส่วนกลับกัน</div>`;
  }
  $('#vsPick').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cur = b.dataset.k; $$('#vsPick button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  draw();
})();

/* =====================================================================
   4.5 เทของเหลวลงน้ำ ลอยหรือจม
   ===================================================================== */
(function sgDemo() {
  const svg = $('#sgSvg'); if (!svg) return;
  const SL = {
    gasohol: { name: 'แก๊สโซฮอล์ 95', sg: 0.745, color: '#f08a24' },
    diesel: { name: 'ดีเซล', sg: 0.835, color: '#e6d25a' },
    engine: { name: 'น้ำมันเครื่อง', sg: 0.88, color: '#a8661c' },
    palm: { name: 'น้ำมันพืช', sg: 0.91, color: '#f2c230' },
    alcohol: { name: 'แอลกอฮอล์', sg: 0.79, color: '#c9a0ff', mix: true },
    brine: { name: 'น้ำเกลือเข้มข้น (ผสมสีแดง)', sg: 1.15, color: '#d6336c' },
    glycerin: { name: 'กลีเซอรีน', sg: 1.26, color: '#c9b46a' },
    mercury: { name: 'ปรอท', sg: 13.6, color: '#b7bec8' }
  };
  let cur = 'engine', t = 1;
  $('#sgPick').innerHTML = Object.entries(SL).map(([k, l]) => `<button data-k="${k}" class="${k === cur ? 'on' : ''}"><i class="sw" style="background:${l.color}"></i>${l.name.replace(/ \(.*\)/, '')}</button>`).join('');
  function draw() {
    const l = SL[cur];
    const bx = 70, bw = 170, bTop = 50, bBot = 230, wTop = 130;
    const lh = 40;
    let h = `<defs><clipPath id="bkClip"><rect x="${bx}" y="${bTop}" width="${bw}" height="${bBot - bTop}"/></clipPath></defs><g clip-path="url(#bkClip)">`;
    if (l.mix) {
      const c = t;   // ค่อย ๆ ผสม
      h += `<rect x="${bx}" y="${wTop - lh * c}" width="${bw}" height="${bBot - wTop + lh * c}" fill="#2f86d6" opacity=".45"/>`;
      h += `<rect x="${bx}" y="${wTop - lh * c}" width="${bw}" height="${bBot - wTop + lh * c}" fill="${l.color}" opacity="${.45 * c}"/>`;
    } else if (l.sg < 1) {
      h += `<rect x="${bx}" y="${wTop}" width="${bw}" height="${bBot - wTop}" fill="#2f86d6" opacity=".55"/>`;
      h += `<rect x="${bx}" y="${lerp(bTop - 30, wTop - lh, t)}" width="${bw}" height="${lh}" fill="${l.color}" opacity=".85"/>`;
    } else {
      const yy = lerp(bTop - 30, bBot - lh, t);
      const wTop2 = wTop - lh * Math.min(1, t * 1.2);
      h += `<rect x="${bx}" y="${wTop2}" width="${bw}" height="${bBot - wTop2}" fill="#2f86d6" opacity=".55"/>`;
      h += `<rect x="${bx}" y="${yy}" width="${bw}" height="${lh}" fill="${l.color}" opacity=".9"/>`;
    }
    h += `</g><path d="M${bx},${bTop - 8} L${bx},${bBot} L${bx + bw},${bBot} L${bx + bw},${bTop - 8}" fill="none" stroke="var(--text)" stroke-width="2.5"/>`;
    h += `<text x="${bx + bw / 2}" y="${bBot + 22}" text-anchor="middle" class="svg-t">บีกเกอร์ใส่น้ำ แล้วเท${l.name.replace(/ \(.*\)/, '')}ลงไป</text>`;
    // เกจ s.g.
    const gx = 330, gTop = 40, gBot = 220, smin = 0.6, smax = 1.4;
    const Y = s => gBot - (clamp(s, smin, smax) - smin) / (smax - smin) * (gBot - gTop);
    h += `<rect x="${gx}" y="${gTop}" width="22" height="${gBot - gTop}" rx="4" fill="var(--surface-2)" stroke="var(--line)"/>`;
    h += `<rect x="${gx}" y="${Y(1)}" width="22" height="${gBot - Y(1)}" fill="var(--bad)" opacity=".18"/><rect x="${gx}" y="${gTop}" width="22" height="${Y(1) - gTop}" fill="var(--oil)" opacity=".2"/>`;
    for (let s = smin; s <= smax + 1e-9; s += 0.1) h += `<line x1="${gx + 22}" x2="${gx + 30}" y1="${Y(s)}" y2="${Y(s)}" stroke="var(--muted)"/><text x="${gx + 34}" y="${Y(s) + 4}" class="svg-m" style="font-size:11px">${s.toFixed(1)}</text>`;
    h += `<line x1="${gx - 10}" x2="${gx + 32}" y1="${Y(1)}" y2="${Y(1)}" stroke="#2f86d6" stroke-width="2.5"/><text x="${gx + 64}" y="${Y(1) + 4}" class="svg-t" style="fill:#2f86d6;font-weight:700">น้ำ = 1.0</text>`;
    h += `<polygon points="${gx - 4},${Y(l.sg)} ${gx - 16},${Y(l.sg) - 7} ${gx - 16},${Y(l.sg) + 7}" fill="var(--accent)"/><text x="${gx - 20}" y="${Y(l.sg) + 4}" text-anchor="end" class="svg-b" style="font-size:13px;fill:var(--accent)">${l.sg}${l.sg > smax ? ' ↓' : ''}</text>`;
    h += `<text x="${gx + 11}" y="${gTop - 10}" text-anchor="middle" class="svg-m" style="font-size:11px">s.g.</text>`;
    h += `<text x="${gx + 90}" y="${(gTop + Y(1)) / 2}" class="svg-m" style="font-size:12px">ลอย</text><text x="${gx + 90}" y="${(gBot + Y(1)) / 2}" class="svg-m" style="font-size:12px">จม</text>`;
    svg.innerHTML = h;
    const rho = l.sg * RHO_W;
    $('#sgOut').innerHTML =
      LF(`ความถ่วงจำเพาะของ${l.name.replace(/ \(.*\)/, '')}`, `s.g. = ${FR('ρ<sub>f</sub>', 'ρ<sub>w</sub>')}`, `= ${FR(N(rho, 0), '1,000')}`, `= ${l.sg}`, 'hl') +
      `<div class="status ${l.mix ? 'warn' : 'ok'}">${l.mix ? '⚠️ แอลกอฮอล์เบากว่าน้ำ (s.g. 0.79) แต่<b>ละลายผสมเป็นเนื้อเดียวกับน้ำ</b> จึงไม่แยกชั้น — s.g. บอกว่าหนักหรือเบา แต่ไม่ได้บอกว่าจะผสมกันหรือไม่'
        : l.sg < 1 ? `s.g. = ${l.sg} น้อยกว่า 1 → <b>เบากว่าน้ำ ลอยอยู่ข้างบน</b>${cur !== 'palm' ? ' (เหตุผลที่ห้ามใช้น้ำดับไฟที่เกิดจากน้ำมัน เพราะน้ำมันจะลอยไฟลุกต่อบนผิวน้ำ)' : ''}`
          : `s.g. = ${l.sg} มากกว่า 1 → <b>หนักกว่าน้ำ จมลงก้นบีกเกอร์</b>`}</div>`;
  }
  let raf = null;
  function pour() {
    t = 0; cancelAnimationFrame(raf);
    const t0 = performance.now();
    const step = now => { t = Math.min(1, (now - t0) / 1100); t = 1 - Math.pow(1 - t, 3); draw(); if (t < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  }
  $('#sgPick').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cur = b.dataset.k; $$('#sgPick button').forEach(x => x.classList.toggle('on', x === b)); pour(); });
  draw();
})();

/* =====================================================================
   เครื่องคิดเลข
   ===================================================================== */
const CALC = {
  density(v) {
    const mkg = v.mu === 'g' ? v.m / 1000 : v.m;
    const fV = { L: 1e-3, ml: 1e-6, cc: 1e-6, cm3: 1e-6, m3: 1 }[v.Vu];
    const uName = { L: 'Litre', ml: 'ml', cc: 'cc', cm3: 'cm³', m3: 'm³' }[v.Vu];
    const V = v.V * fV, rho = mkg / V;
    let o = '';
    if (v.mu === 'g') o += LF('แปลงมวลเป็น kg', 'g ÷ 1,000', `= ${v.m} ÷ 1,000`, `= ${NUM(mkg, 4)} kg`);
    if (v.Vu !== 'm3') o += LF('แปลงปริมาตรเป็น m³', v.Vu === 'L' ? 'Litre × 10<sup>−3</sup>' : `${uName} × 10<sup>−6</sup>`, `= ${v.V} × ${v.Vu === 'L' ? '10<sup>−3</sup>' : '10<sup>−6</sup>'}`, `= ${NUM(V, 4)} m³`);
    o += LF('ความหนาแน่น', `ρ = ${FR('m', 'V')}`, `= ${FR(NUM(mkg, 4), NUM(V, 4))}`, `= ${N(rho, rho < 100 ? 3 : 1)} kg/m³`, 'hl');
    o += LF('ความถ่วงจำเพาะ (หัวข้อ 4.5)', `s.g. = ${FR('ρ', 'ρ<sub>w</sub>')}`, `= ${FR(N(rho, 1), '1,000')}`, `= ${N(rho / 1000, 3)} → ${rho < 1000 ? 'เบากว่าน้ำ' : rho > 1000 ? 'หนักกว่าน้ำ' : 'เท่าน้ำ'}`);
    return o;
  },
  api(v) {
    const sg = v.sg, api = apiOf(sg);
    const bar = $('#apiBar');
    if (bar) {
      const lo = -5, hi = 75, P = a => (clamp(a, lo, hi) - lo) / (hi - lo) * 100;
      const zone = (a, b, c, t) => `<div class="zone" style="left:${P(a)}%;width:${P(b) - P(a)}%;background:${c}">${t}</div>`;
      bar.innerHTML = zone(lo, 10, '#7a4a1c', 'หนักกว่าน้ำ') + zone(10, 22.3, '#a8661c', 'หนัก') + zone(22.3, 31.1, '#d99a1e', 'ปานกลาง') + zone(31.1, hi, '#e9b949', 'เบา') +
        [0, 10, 20, 30, 40, 50, 60, 70].map(a => `<span class="tick" style="left:${P(a)}%">${a}</span>`).join('') +
        `<span class="pin" style="left:${P(10)}%;color:#2f86d6">น้ำ</span><span class="pin" style="left:${P(api)}%;color:var(--accent)">${N(api, 1)}</span>`;
    }
    return LF('ความถ่วง API', `API Gr. = ${FR('141.5', 's.g.')} − 131.5`, `= ${FR('141.5', sg)} − 131.5`, `= ${N(api, 2)}`, 'hl') +
      LF('ย้อนกลับจาก API เป็น s.g.', `s.g. = ${FR('141.5', 'API + 131.5')}`, `= ${FR('141.5', N(api, 2) + ' + 131.5')}`, `= ${N(sgOfApi(api), 3)}`) +
      `<div class="small muted">${sg < 1 ? `s.g. น้อยกว่าน้ำ → API มากกว่า 10` : sg > 1 ? 's.g. มากกว่าน้ำ → API น้อยกว่า 10 (ติดลบได้ถ้าหนักมาก)' : 'น้ำ s.g. = 1.000 → API = 10'}</div>`;
  },
  props(v) {
    const x = v.x; let sg, rho;
    if (v.kind === 'sg') { sg = x; rho = sg * RHO_W; }
    else if (v.kind === 'rho') { rho = x; sg = rho / RHO_W; }
    else if (v.kind === 'gam') { rho = x / G; sg = x / GAM_W; }
    else if (v.kind === 'vs') { rho = 1 / x; sg = rho / RHO_W; }
    else { sg = sgOfApi(x); rho = sg * RHO_W; }
    const gam = rho * G, vs = 1 / rho, api = apiOf(sg);
    const L = [];
    const sgS = N(sg, 3), rhoS = N(rho, 1);
    if (v.kind === 'sg') {
      L.push(LF('ความหนาแน่น', 'ρ<sub>f</sub> = (s.g.)ρ<sub>w</sub>', `= (${x})(1,000)`, `= ${rhoS} kg/m³`, 'hl'));
      L.push(LF('น้ำหนักจำเพาะ', 'γ<sub>f</sub> = (s.g.)γ<sub>w</sub>', `= (${x})(9,810)`, `= ${N(gam, 1)} N/m³`, 'hl'));
    } else if (v.kind === 'api') {
      L.push(LF('ความถ่วงจำเพาะ', `s.g. = ${FR('141.5', 'API + 131.5')}`, `= ${FR('141.5', x + ' + 131.5')}`, `= ${sgS}`, 'hl'));
      L.push(LF('ความหนาแน่น', 'ρ<sub>f</sub> = (s.g.)ρ<sub>w</sub>', `= (${sgS})(1,000)`, `= ${rhoS} kg/m³`, 'hl'));
      L.push(LF('น้ำหนักจำเพาะ', 'γ<sub>f</sub> = (s.g.)γ<sub>w</sub>', `= (${sgS})(9,810)`, `= ${N(gam, 1)} N/m³`, 'hl'));
    } else {
      if (v.kind === 'gam') L.push(LF('ความหนาแน่น', `ρ = ${FR('γ', 'g')}`, `= ${FR(x, '9.81')}`, `= ${rhoS} kg/m³`, 'hl'));
      if (v.kind === 'vs') L.push(LF('ความหนาแน่น', `ρ = ${FR('1', 'V<sub>S</sub>')}`, `= ${FR('1', x)}`, `= ${rhoS} kg/m³`, 'hl'));
      L.push(LF('ความถ่วงจำเพาะ', `s.g. = ${FR('ρ<sub>f</sub>', 'ρ<sub>w</sub>')}`, `= ${FR(rhoS, '1,000')}`, `= ${sgS}`, 'hl'));
      if (v.kind !== 'gam') L.push(LF('น้ำหนักจำเพาะ', 'γ = ρ · g', `= (${rhoS})(9.81)`, `= ${N(gam, 1)} N/m³`, 'hl'));
    }
    if (v.kind !== 'vs') L.push(LF('ปริมาตรจำเพาะ', `V<sub>S</sub> = ${FR('1', 'ρ')}`, `= ${FR('1', rhoS)}`, `= ${SCI(vs, 3)} m³/kg`, 'hl'));
    if (v.kind !== 'api') L.push(LF('ความถ่วง API', `API = ${FR('141.5', 's.g.')} − 131.5`, `= ${FR('141.5', sgS)} − 131.5`, `= ${N(api, 2)}`, 'hl'));
    return L.join('');
  }
};
initCalcs(CALC);

/* =====================================================================
   ห้องทดลองเสมือน ใบงาน 4
   ===================================================================== */
const liqOptions = (sel, filter = () => true) => Object.entries(LIQ).filter(([k, l]) => filter(k, l)).map(([k, l]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${l.name}</option>`).join('');
const sw = l => `<i class="sw" style="background:${l.color};width:12px;height:12px;border-radius:50%;display:inline-block;border:1px solid rgba(0,0,0,.3);vertical-align:-1px"></i>`;

function barChart(o) {
  // o = { W, H, items:[{label, v, color}], ref:{v,label}, yLabel }
  const { W, H } = o, m = { l: 62, r: 14, t: 16, b: 50 };
  const vals = o.items.map(i => i.v).concat(o.ref ? [o.ref.v] : []);
  const ymax = niceMax(Math.max(...vals, 1) * 1.15), step = ymax / 5;
  const Y = v => H - m.b - v / ymax * (H - m.t - m.b);
  let s = '';
  for (let v = 0; v <= ymax + 1e-9; v += step) s += `<line class="ch-grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ch-tick" x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end">${Math.round(v).toLocaleString('en-US')}</text>`;
  const n = Math.max(o.items.length, 1), bw = Math.min(90, (W - m.l - m.r) / n * 0.55);
  o.items.forEach((it, i) => {
    const cx = m.l + (i + 0.5) * (W - m.l - m.r) / n;
    s += `<rect x="${cx - bw / 2}" y="${Y(it.v)}" width="${bw}" height="${H - m.b - Y(it.v)}" fill="${it.color}" stroke="var(--text)" stroke-width="1" rx="3"/>`;
    s += `<text class="ch-lab" x="${cx}" y="${Y(it.v) - 6}" text-anchor="middle">${N(it.v, 1)}</text>`;
    s += `<text class="ch-tick" x="${cx}" y="${H - m.b + 16}" text-anchor="middle">${it.label}</text>`;
    if (it.sub) s += `<text class="ch-tick" x="${cx}" y="${H - m.b + 30}" text-anchor="middle">${it.sub}</text>`;
  });
  if (o.ref) s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(o.ref.v)}" y2="${Y(o.ref.v)}" stroke="#2f86d6" stroke-width="2" stroke-dasharray="7 5"/><text x="${W - m.r - 4}" y="${Y(o.ref.v) - 6}" text-anchor="end" class="ch-lab" style="fill:#2f86d6">${o.ref.label}</text>`;
  s += `<line class="ch-axis" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${H - m.b}"/><line class="ch-axis" x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/>`;
  s += `<text class="ch-lab" transform="translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)" text-anchor="middle">${o.yLabel}</text>`;
  if (!o.items.length) s += `<text class="ch-tick" x="${(m.l + W - m.r) / 2}" y="${H / 2}" text-anchor="middle">${o.empty || 'ยังไม่มีข้อมูล'}</text>`;
  return s;
}

/* ---------- ตอนที่ 1: ชั่งและตวง ---------- */
function buildScaleLab(host) {
  host.innerHTML = `
  <div class="lab">
    <div class="lab-top"><h3>🧪 ห้องทดลองเสมือน: ใบงาน 4 ตอนที่ 1 การชั่งและการตวง</h3><span class="lab-sub">จุดประสงค์: ศึกษาความหนาแน่น ความถ่วงจำเพาะ น้ำหนักจำเพาะ และปริมาตรจำเพาะ ของของไหล 3 ชนิด</span></div>
    <div class="lab-body">
      <div class="lab-panel"><p class="lab-step"><span class="n">?</span>ขั้นตอนตามใบงาน</p>
        <ol style="margin:0;padding-left:1.3em;font-size:.93rem">
          <li>เลือกของไหลชนิดที่ทดลอง แล้ว<b>วางกระบอกตวงลงบนเครื่องชั่ง</b></li>
          <li><b>เปิดเครื่องชั่ง</b> (กดปุ่ม ON) รอจนแสดงค่าศูนย์ (ถ้าไม่เป็นศูนย์ให้กด TARE)</li>
          <li>ค่อย ๆ <b>เทของเหลวลงกระบอกตวง</b>จนได้ 50 ml พอใกล้ขีดให้ใช้ "เทช้า ๆ" ดูจากภาพขยายด้านขวา</li>
          <li>อ่านค่าบนหน้าปัดเครื่องชั่ง แล้วกด <b>"บันทึกค่า"</b></li>
          <li>เปลี่ยนกระบอกตวงใบใหม่ แล้วทำซ้ำกับของไหลชนิดที่ 2 และ 3 ระบบคำนวณ ρ, V<sub>S</sub>, γ, s.g., API ให้ในตาราง</li>
        </ol></div>
      <div class="bench">
        <div><svg data-r="scene" viewBox="0 0 440 300" aria-label="เครื่องชั่งดิจิตอล กระบอกตวง และบีกเกอร์"></svg>
          <div class="zoom-box" style="margin-top:8px"><svg data-r="zoom" viewBox="0 0 220 200" aria-label="ภาพขยายขีดสเกลกระบอกตวง"></svg><span class="small muted">🔍 ภาพขยายขีด 45–55 ml (ตาอยู่ระดับเดียวกับผิวของเหลว)</span></div></div>
        <div class="rig-ctrl">
          <div class="ctl"><div class="ctl-h">ของไหลชนิดที่ <b data-r="rowNo">1</b> <span class="small">เลือกของเหลวในบีกเกอร์</span></div>
            <select data-r="liq" style="margin-top:4px;font:inherit;color:var(--text);background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:6px 10px;width:100%">${liqOptions('gasohol')}</select></div>
          <div class="btn-row"><button class="btn btn-line btn-sm" data-r="place">⬇ วางกระบอกตวงบนเครื่องชั่ง</button><button class="btn btn-go btn-sm" data-r="power">⏻ ON</button><button class="btn btn-line btn-sm" data-r="tare">TARE (ตั้งศูนย์)</button></div>
          <div class="ctl"><div class="ctl-h">เทของเหลว <span class="small">กดค้างไว้</span></div>
            <div class="pour-ctl" style="margin-top:4px"><button data-r="pourFast">🫗 เทเร็ว</button><button data-r="pourSlow">💧 เทช้า ๆ</button><button data-r="suck">🧪 ดูดออกด้วยหลอดหยด</button></div></div>
          <ul class="check-list" data-r="checks"></ul>
          <div class="btn-row"><button class="btn btn-accent" data-r="rec" disabled>📝 บันทึกค่า</button><button class="btn btn-line" data-r="newCyl">🔄 เปลี่ยนกระบอกตวงใบใหม่</button><button class="btn btn-line btn-sm" data-r="clear">↺ ล้างตาราง</button></div>
          <div class="status" data-r="status">เริ่มจากวางกระบอกตวงบนเครื่องชั่ง</div>
        </div>
      </div>
      <div class="lab-panel"><p class="lab-step"><span class="n">✓</span>บันทึกผลการทดลอง <span class="small muted" style="font-weight:400">(กดแถวเพื่อดูตัวอย่างการคำนวณ)</span></p>
        <div class="table-wrap"><table class="rig-table" data-r="table"></table></div>
        <div class="lf-list" data-r="rowCalc"></div></div>
      <div class="lab-panel"><p class="lab-step"><span class="n">📊</span>เปรียบเทียบความหนาแน่นของของไหลทั้ง 3 ชนิด และสรุปผล</p>
        <div class="chart-box"><svg viewBox="0 0 620 300" data-r="chart"></svg></div>
        <div data-r="conclude"></div></div>
    </div>
  </div>`;
  const R = k => host.querySelector(`[data-r="${k}"]`);
  const s = { cylOn: false, power: false, tare: 0, vol: 0, liq: 'gasohol', cylMass: 72.4, pouring: 0, shown: 0, lastG: 0, settle: 0 };
  const rows = [null, null, null];
  let rowIdx = 0, sel = null;
  const gross = () => (s.cylOn ? s.cylMass + s.vol * LIQ[s.liq].sg : 0);
  const reading = () => s.power ? Math.round((gross() - s.tare) * 10) / 10 : null;

  function status(t, c = '') { const el = R('status'); el.innerHTML = t; el.className = 'status ' + c; s.msgT = 2.5; }
  R('liq').addEventListener('change', e => {
    if (s.vol > 0.05) { e.target.value = s.liq; status('กระบอกตวงนี้มีของเหลวอยู่แล้ว กด "เปลี่ยนกระบอกตวงใบใหม่" ก่อนเปลี่ยนชนิด', 'warn'); return; }
    s.liq = e.target.value; drawScene();
  });
  R('place').addEventListener('click', () => {
    s.cylOn = !s.cylOn;
    R('place').textContent = s.cylOn ? '⬆ ยกกระบอกตวงออก' : '⬇ วางกระบอกตวงบนเครื่องชั่ง';
    if (s.cylOn && !s.power) status('วางแล้ว ต่อไปกด ON เปิดเครื่องชั่ง', 'ok');
    else if (s.cylOn && s.power && Math.abs(s.tare - s.cylMass) > 0.05 && s.vol < 0.05) status('เครื่องชั่งเปิดอยู่ก่อนวางกระบอกตวง ค่าที่เห็นจึงเป็นมวลของกระบอกตวง ให้กด TARE เพื่อตั้งศูนย์', 'warn');
  });
  R('power').addEventListener('click', () => {
    s.power = !s.power;
    if (s.power) {
      s.tare = gross(); s.settle = 1;
      if (!s.cylOn) status('เปิดเครื่องแล้ว แต่ยังไม่ได้วางกระบอกตวง (ถ้าวางทีหลัง ต้องกด TARE ตั้งศูนย์อีกครั้ง)', 'warn');
      else if (s.vol < 0.05) status('เครื่องชั่งตั้งศูนย์พร้อมกระบอกตวงแล้ว (0.0 g) เริ่มเทของเหลวได้', 'ok');
      else status('⚠️ เปิดเครื่องตอนที่มีของเหลวอยู่แล้ว ค่าที่อ่านจะไม่รวมของเหลวที่เทไปก่อน ควรเปลี่ยนกระบอกตวงใบใหม่แล้วเริ่มใหม่', 'bad');
    }
    R('power').textContent = s.power ? '⏻ OFF' : '⏻ ON';
    R('power').className = 'btn btn-sm ' + (s.power ? 'btn-line' : 'btn-go');
  });
  R('tare').addEventListener('click', () => {
    if (!s.power) { status('เปิดเครื่องชั่งก่อน', 'warn'); return; }
    s.tare = gross(); s.settle = 1;
    status(s.cylOn && s.vol < 0.05 ? 'ตั้งศูนย์แล้ว ค่าที่อ่านต่อจากนี้คือมวลของเหลวอย่างเดียว' : s.vol >= 0.05 ? '⚠️ ตั้งศูนย์ตอนที่มีของเหลวอยู่ ค่าที่อ่านจะขาดมวลของเหลวส่วนนั้นไป' : 'ตั้งศูนย์แล้ว (ยังไม่มีกระบอกตวง)', s.cylOn && s.vol < 0.05 ? 'ok' : 'warn');
  });
  const pour = rate => () => {
    if (!s.cylOn) { status('วางกระบอกตวงบนเครื่องชั่งก่อน แล้วค่อยเทของเหลวลงไป', 'warn'); return; }
    s.vol = clamp(s.vol + rate, 0, 60); s.pouring = 0.25; s.settle = 0.6;
    if (s.vol >= 59.9) status('ล้นขีดแล้ว ใช้หลอดหยดดูดออก', 'bad');
  };
  hold(R('pourFast'), pour(0.9));
  hold(R('pourSlow'), pour(0.1));
  hold(R('suck'), () => { if (s.vol <= 0) return; s.vol = Math.max(0, s.vol - 0.2); s.settle = 0.6; });
  R('newCyl').addEventListener('click', () => {
    s.vol = 0; s.cylOn = false; s.cylMass = 70 + Math.round(Math.random() * 40) / 10;
    R('place').textContent = '⬇ วางกระบอกตวงบนเครื่องชั่ง';
    status('ได้กระบอกตวงใบใหม่ (มวลไม่เท่าใบเดิม) วางบนเครื่องชั่ง แล้ว<b>กด TARE</b> ให้เป็นศูนย์ก่อนเท', '');
  });
  R('clear').addEventListener('click', () => { if (rows.some(Boolean) && !confirm('ล้างตารางผลการทดลองทั้งหมด?')) return; rows.fill(null); rowIdx = 0; sel = null; render(); });

  function conds() {
    return [
      ['วางกระบอกตวงบนเครื่องชั่ง', s.cylOn],
      ['เปิดเครื่องชั่ง และตั้งศูนย์ตอนกระบอกตวงยังว่าง', s.power && s.cylOn && Math.abs(s.tare - s.cylMass) < 0.05],
      ['ตวงของเหลวได้ 50 ml พอดี (อ่านที่ท้องโค้ง)', Math.abs(s.vol - 50) <= 0.3],
      ['ค่าบนเครื่องชั่งนิ่งแล้ว', s.settle <= 0]
    ];
  }
  R('rec').addEventListener('click', () => {
    const c = conds();
    if (!c.every(x => x[1])) { status('ยังบันทึกไม่ได้: ' + c.filter(x => !x[1]).map(x => x[0]).join(' · '), 'warn'); return; }
    if (rows.filter(Boolean).some(r => r.liq === s.liq)) { if (!confirm(`${LIQ[s.liq].name} ทดลองไปแล้ว ต้องการบันทึกซ้ำหรือไม่?`)) return; }
    rows[rowIdx] = { liq: s.liq, V: 50, g: reading(), vTrue: s.vol };
    sel = rowIdx;
    const next = rows.findIndex(r => !r);
    status(`บันทึกของไหลชนิดที่ ${rowIdx + 1} แล้ว ✔ ` + (next >= 0 ? `ต่อไป: กด "เปลี่ยนกระบอกตวงใบใหม่" เลือกของไหลชนิดที่ ${next + 1}` : 'ครบ 3 ชนิดแล้ว ดูตารางและกราฟด้านล่าง'), 'ok');
    if (next >= 0) rowIdx = next;
    render();
  });
  R('table').addEventListener('click', e => { const tr = e.target.closest('tr[data-i]'); if (!tr || !rows[+tr.dataset.i]) return; sel = +tr.dataset.i; render(); });

  const calc = r => { const m = r.g / 1000, V = r.V * 1e-6, rho = m / V; return { m, V, rho, vs: V / m, gam: m * G / V, sg: rho / RHO_W, api: apiOf(rho / RHO_W) }; };
  function render() {
    R('rowNo').textContent = rowIdx + 1;
    R('table').innerHTML = `<thead><tr><th>ของไหล<br>ชนิดที่</th><th>สีของ<br>ของไหล</th><th>ปริมาตร<br>(ml)</th><th>มวล<br>(kg)</th><th>ความหนาแน่น<br>(kg/m³)</th><th>ปริมาตรจำเพาะ<br>(m³/kg)</th><th>น้ำหนักจำเพาะ<br>(N/m³)</th><th>ความถ่วง<br>จำเพาะ</th><th>ความถ่วง<br>API</th></tr></thead><tbody>` +
      rows.map((r, i) => {
        if (!r) return `<tr data-i="${i}"><td>${i + 1}</td>${'<td class="miss">–</td>'.repeat(8)}</tr>`;
        const o = calc(r), l = LIQ[r.liq];
        return `<tr data-i="${i}"${i === sel ? ' class="sel"' : ''}><td>${i + 1}</td><td style="white-space:nowrap">${sw(l)} ${l.cname}<div class="small muted">${l.name}</div></td><td>50</td><td>${N(o.m, 4)}</td><td>${N(o.rho, 0)}</td><td>${SCI(o.vs, 3)}</td><td>${N(o.gam, 0)}</td><td>${N(o.sg, 3)}</td><td>${N(o.api, 1)}</td></tr>`;
      }).join('') + '</tbody>';
    const out = R('rowCalc');
    if (sel == null || !rows[sel]) out.innerHTML = '<div class="small muted">ยังไม่มีข้อมูล — บันทึกค่าอย่างน้อย 1 ชนิด แล้วตัวอย่างการคำนวณจะขึ้นที่นี่</div>';
    else {
      const r = rows[sel], o = calc(r), l = LIQ[r.liq], err = (o.sg - l.sg) / l.sg * 100;
      out.innerHTML = `<div class="small" style="font-weight:600">ตัวอย่างการคำนวณ ของไหลชนิดที่ ${sel + 1} (${l.name}) · มวลที่อ่านได้ ${N(r.g, 1)} g = ${N(o.m, 4)} kg · V = 50 ml = 50 × 10<sup>−6</sup> m³</div>` +
        LF('1. ความหนาแน่น', `ρ = ${FR('m', 'V')}`, `= ${FR(N(o.m, 4), '50 × 10<sup>−6</sup>')}`, `= ${N(o.rho, 0)} kg/m³`, 'hl') +
        LF('2. ปริมาตรจำเพาะ', `v = ${FR('V', 'm')} หรือ ${FR('1', 'ρ')}`, `= ${FR('1', N(o.rho, 0))}`, `= ${SCI(o.vs, 3)} m³/kg`, 'hl') +
        LF('3. น้ำหนักจำเพาะ', `γ = ${FR('w', 'V')} = ρ·g`, `= (${N(o.rho, 0)})(9.81)`, `= ${N(o.gam, 1)} N/m³`, 'hl') +
        LF('4. ความถ่วงจำเพาะ', `s.g. = ${FR('ρ<sub>f</sub>', 'ρ<sub>w</sub>')}`, `= ${FR(N(o.rho, 0), '1,000')}`, `= ${N(o.sg, 3)}`, 'hl') +
        LF('5. ความถ่วง API', `API Gr. = ${FR('141.5', 's.g.')} − 131.5`, `= ${FR('141.5', N(o.sg, 3))} − 131.5`, `= ${N(o.api, 1)}`, 'hl') +
        `<div class="small muted">เทียบค่าอ้างอิงของ${l.name} s.g. ≈ ${l.sg} → คลาดเคลื่อน ${N(err, 1)}% (มาจากการตวงไม่ตรง 50.0 ml พอดี ซึ่งตวงได้จริง ${N(r.vTrue, 1)} ml และความละเอียดของเครื่องชั่ง)</div>`;
    }
    const done = rows.map((r, i) => r && { i, r, o: calc(r) }).filter(Boolean);
    R('chart').innerHTML = barChart({ W: 620, H: 300, yLabel: 'ความหนาแน่น (kg/m³)', ref: { v: 1000, label: 'น้ำ 1,000' },
      items: done.map(d => ({ label: `ชนิดที่ ${d.i + 1}`, sub: LIQ[d.r.liq].name.replace(/ \(.*\)/, ''), v: d.o.rho, color: LIQ[d.r.liq].color })), empty: 'บันทึกผลแล้วกราฟจะขึ้นที่นี่' });
    if (done.length >= 2) {
      const srt = [...done].sort((a, b) => b.o.rho - a.o.rho), light = done.filter(d => d.o.sg < 1).map(d => LIQ[d.r.liq].name);
      R('conclude').innerHTML = `<div class="conclude-box"><b>ตัวช่วยสรุปผล:</b> ของไหลที่หนาแน่นที่สุดคือ ${LIQ[srt[0].r.liq].name} (${N(srt[0].o.rho, 0)} kg/m³) น้อยที่สุดคือ ${LIQ[srt[srt.length - 1].r.liq].name} (${N(srt[srt.length - 1].o.rho, 0)} kg/m³)
        ${light.length ? ` · ของไหลที่เบากว่าน้ำ (s.g. &lt; 1) ได้แก่ ${light.join(', ')}` : ''} · สังเกตว่าของไหลที่หนาแน่นมากกว่า จะมีปริมาตรจำเพาะน้อยกว่า (เป็นส่วนกลับกัน) และมีความถ่วง API น้อยกว่า</div>`;
    } else R('conclude').innerHTML = '';
  }

  /* --- ภาพฉาก --- */
  function drawScene() {
    const l = LIQ[s.liq];
    const cx = s.cylOn ? 150 : 290, base = s.cylOn ? 226 : 268;
    const tubeTop = base - 176, inBot = base - 10;
    const yOf = ml => inBot - ml / 50 * 130;
    let h = '';
    h += `<rect x="0" y="268" width="440" height="32" fill="var(--surface-2)"/><line x1="0" x2="440" y1="268" y2="268" stroke="var(--muted)"/>`;
    // เครื่องชั่ง
    h += `<rect x="50" y="232" width="200" height="36" rx="6" fill="#2a3340"/><rect x="62" y="226" width="176" height="8" rx="2" fill="var(--metal)"/>`;
    h += `<rect x="105" y="240" width="96" height="22" rx="3" fill="${s.power ? '#0d1a12' : '#20262e'}"/>`;
    const rd = reading();
    const shown = rd == null ? '' : (s.settle > 0 ? rd + (Math.random() - .5) * 0.6 : rd);
    h += `<text x="196" y="257" text-anchor="end" style="fill:${s.power ? '#7dff9b' : '#55606d'};font-size:15px;font-weight:700;font-variant-numeric:tabular-nums">${rd == null ? 'OFF' : N(shown, 1) + ' g'}</text>`;
    h += `<circle cx="222" cy="251" r="7" fill="${s.power ? '#2fbf5f' : '#555'}"/><text x="222" y="255" text-anchor="middle" style="fill:#fff;font-size:8px">ON</text>`;
    h += `<rect x="66" y="245" width="26" height="12" rx="3" fill="#4a5664"/><text x="79" y="254" text-anchor="middle" style="fill:#fff;font-size:7px">TARE</text>`;
    h += `<text x="150" y="292" text-anchor="middle" class="svg-m" style="font-size:11px">เครื่องชั่งดิจิตอล (ละเอียด 0.1 g)</text>`;
    // กระบอกตวง
    h += `<rect x="${cx - 26}" y="${base - 4}" width="52" height="6" rx="2" fill="var(--glass)" stroke="var(--text)"/>`;
    h += `<rect x="${cx - 14}" y="${tubeTop}" width="28" height="${base - 4 - tubeTop}" fill="var(--glass)" stroke="var(--text)" stroke-width="1.5" opacity=".9"/>`;
    if (s.vol > 0) {
      const ys = yOf(s.vol);
      h += `<path d="M${cx - 13},${ys - 3} Q${cx},${ys + 3} ${cx + 13},${ys - 3} L${cx + 13},${inBot} L${cx - 13},${inBot} Z" fill="${l.color}" opacity="${l.op}"/>`;
    }
    for (let ml = 0; ml <= 50; ml += 5) {
      const y = yOf(ml);
      h += `<line x1="${cx - 14}" x2="${cx - (ml % 10 ? 7 : 3)}" y1="${y}" y2="${y}" stroke="var(--text)" stroke-width="1"/>`;
      if (ml % 10 === 0) h += `<text x="${cx + 18}" y="${y + 3}" style="font-size:8px;fill:var(--muted)">${ml}</text>`;
    }
    h += `<text x="${cx}" y="${tubeTop - 6}" text-anchor="middle" style="font-size:9px;fill:var(--muted)">50 ml</text>`;
    // บีกเกอร์ (เอียงตอนเท)
    const pouring = s.pouring > 0 && s.cylOn;
    const bxForm = pouring ? `translate(${cx + 30} ${tubeTop - 22}) rotate(-62)` : 'translate(385 214)';
    h += `<g transform="${bxForm}"><rect x="-28" y="0" width="56" height="54" fill="var(--glass)" stroke="var(--text)" stroke-width="1.5"/><rect x="-27" y="${pouring ? 26 : 16}" width="54" height="${pouring ? 27 : 37}" fill="${l.color}" opacity="${l.op}"/><text x="0" y="66" text-anchor="middle" style="font-size:9px;fill:var(--muted)">${pouring ? '' : 'บีกเกอร์ 100 ml'}</text></g>`;
    if (pouring) h += `<path d="M${cx + 6},${tubeTop - 6} Q${cx + 2},${tubeTop + 30} ${cx + 1},${yOf(s.vol) - 2}" stroke="${l.color}" stroke-width="${s.pouring > 0.2 ? 3 : 2}" fill="none" opacity=".85"/>`;
    if (!pouring) h += `<text x="385" y="296" text-anchor="middle" style="font-size:10px;fill:var(--text)">${l.name.replace(/ \(.*\)/, '')}</text>`;
    R('scene').innerHTML = h;
    // ภาพขยาย
    const Z = 16, mid = 100, ysZ = ml => mid - (ml - 50) * Z;
    let z = `<rect x="40" y="0" width="140" height="200" fill="var(--glass)" stroke="var(--text)"/>`;
    if (s.vol > 0) {
      const ys = ysZ(s.vol);
      z += `<path d="M41,${ys - 11} Q110,${ys + 6} 179,${ys - 11} L179,200 L41,200 Z" fill="${l.color}" opacity="${Math.min(.85, l.op + .1)}"/>`;
      z += `<path d="M41,${ys - 11} Q110,${ys + 6} 179,${ys - 11}" stroke="var(--text)" stroke-width="1" fill="none" opacity=".6"/>`;
    }
    for (let ml = 44; ml <= 56; ml += 0.5) {
      const y = ysZ(ml); if (y < 2 || y > 198) continue;
      const major = Math.abs(ml % 5) < 1e-6, mid1 = Math.abs(ml % 1) < 1e-6;
      z += `<line x1="40" x2="${major ? 110 : mid1 ? 90 : 70}" y1="${y}" y2="${y}" stroke="var(--text)" stroke-width="${major ? 2 : 1}"/>`;
      if (mid1) z += `<text x="${major ? 114 : 94}" y="${y + 4}" style="font-size:${major ? 13 : 10}px;fill:var(--text);font-weight:${major ? 700 : 400}">${ml}</text>`;
    }
    z += `<text x="196" y="${mid + 4}" style="font-size:16px">👁</text><line x1="180" x2="192" y1="${mid}" y2="${mid}" stroke="var(--accent)" stroke-dasharray="2 2"/>`;
    R('zoom').innerHTML = z;
  }

  let last = performance.now(), vis = false, running = false;
  whenVisible(host, v => { vis = v; if (v && !running) { running = true; last = performance.now(); requestAnimationFrame(tick); } });
  function tick(t) {
    const dt = Math.min(0.1, (t - last) / 1000); last = t;
    s.pouring = Math.max(0, s.pouring - dt); s.settle = Math.max(0, s.settle - dt);
    drawScene();
    const c = conds();
    R('checks').innerHTML = c.map(x => `<li class="${x[1] ? 'ok' : ''}">${x[0]}</li>`).join('');
    R('rec').disabled = !c.every(x => x[1]);
    s.msgT = (s.msgT || 0) - dt;
    if (s.msgT <= 0 && s.cylOn && s.power && Math.abs(s.tare - s.cylMass) < 0.05) {
      const d = s.vol - 50, el = R('status');
      if (s.vol < 0.05) { el.innerHTML = 'พร้อมแล้ว เทของเหลวลงกระบอกตวง (กดค้าง)'; el.className = 'status'; }
      else if (d < -3) { el.innerHTML = 'เทต่อไปอีก…'; el.className = 'status'; }
      else if (d < -0.3) { el.innerHTML = 'ใกล้ถึง 50 ml แล้ว เปลี่ยนเป็น "เทช้า ๆ"'; el.className = 'status warn'; }
      else if (d > 0.3) { el.innerHTML = 'เกิน 50 ml แล้ว ใช้หลอดหยดดูดออกเล็กน้อย'; el.className = 'status warn'; }
      else if (s.settle > 0) { el.innerHTML = 'รอให้ค่าบนเครื่องชั่งนิ่ง…'; el.className = 'status'; }
      else { el.innerHTML = `ได้ 50 ml พอดี อ่านค่าเครื่องชั่ง ${N(reading(), 1)} g แล้วกด "บันทึกค่า"`; el.className = 'status ok'; }
    }
    if (vis) requestAnimationFrame(tick); else running = false;
  }
  render(); drawScene();
}

/* ---------- ตอนที่ 2: ไฮโดรมิเตอร์ ---------- */
function buildHydroLab(host) {
  host.innerHTML = `
  <div class="lab">
    <div class="lab-top"><h3>🧪 ห้องทดลองเสมือน: ใบงาน 4 ตอนที่ 2 การใช้ไฮโดรมิเตอร์</h3><span class="lab-sub">จุดประสงค์: ศึกษาความหนาแน่น ความถ่วงจำเพาะ น้ำหนักจำเพาะ และปริมาตรจำเพาะ โดยใช้ไฮโดรมิเตอร์</span></div>
    <div class="lab-body">
      <div class="lab-panel"><p class="lab-step"><span class="n">?</span>ขั้นตอนตามใบงาน</p>
        <ol style="margin:0;padding-left:1.3em;font-size:.93rem">
          <li>เลือกของเหลว 3 ชนิด แล้ว<b>เทลงกระบอกตวงอันที่ 1, 2, 3</b> ให้ได้ 100 ml</li>
          <li>เลือกกระบอกตวง แล้วกด <b>"ค่อย ๆ จุ่มไฮโดรมิเตอร์"</b> ปล่อยให้ลอยอย่างอิสระ ไม่แตะผนัง</li>
          <li><b>อ่านค่าจากสเกลทั้ง 2 อัน</b> ในภาพขยาย (ผิวของเหลวตัดกับก้านตรงไหน): สเกล <b>比重</b> = ความถ่วงจำเพาะ และสเกล <b>度</b> = องศาโบเม่ (°Bé) กรอกลงช่อง แล้วกด "ตรวจค่าที่อ่าน"</li>
          <li>กด "บันทึกค่า" ยกไฮโดรมิเตอร์ออก เช็ดให้สะอาด แล้วทำกับกระบอกตวงอันถัดไป ส่วนความถ่วง API ให้<b>คำนวณจาก s.g.</b> ด้วยสูตร (ไฮโดรมิเตอร์รุ่นนี้ไม่มีสเกล API)</li>
        </ol></div>
      <div class="bench">
        <div><svg data-r="scene" viewBox="0 -46 440 348" aria-label="กระบอกตวง 3 ใบกับไฮโดรมิเตอร์"></svg>
          <div class="zoom-box" style="margin-top:8px"><svg data-r="zoom" viewBox="0 0 240 230" aria-label="ภาพขยายก้านไฮโดรมิเตอร์ที่ผิวของเหลว"></svg><span class="small muted">🔍 ภาพขยายก้านไฮโดรมิเตอร์ตรงผิวของเหลว · ซ้าย 比重 = ความถ่วงจำเพาะ 0.700–1.000 · ขวา 度 = องศาโบเม่ 70–10</span></div></div>
        <div class="rig-ctrl">
          <div class="ctl"><div class="ctl-h">ของเหลวในกระบอกตวงแต่ละอัน</div>
            ${[0, 1, 2].map(i => `<label class="small" style="display:flex;gap:6px;align-items:center;margin-top:4px">อันที่ ${i + 1}<select data-r="liq${i}" style="flex:1;font:inherit;color:var(--text);background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:4px 8px">${liqOptions(['gasohol', 'diesel', 'engine'][i])}</select></label>`).join('')}
            <div class="btn-row" style="margin-top:6px"><button class="btn btn-line btn-sm" data-r="fill">🫗 เทของเหลวลงกระบอกตวงทั้ง 3 อัน (100 ml)</button></div></div>
          <div class="ctl"><div class="ctl-h">เลือกกระบอกตวง</div>
            <div class="chips" data-r="cylPick">${[0, 1, 2].map(i => `<button data-i="${i}" class="${i ? '' : 'on'}">อันที่ ${i + 1}</button>`).join('')}</div>
            <div class="btn-row"><button class="btn btn-accent btn-sm" data-r="dip">⬇ ค่อย ๆ จุ่มไฮโดรมิเตอร์</button><button class="btn btn-line btn-sm" data-r="lift">⬆ ยกออก</button></div></div>
          <div class="read-box"><label>ความถ่วงจำเพาะที่อ่านได้<input type="number" step="0.001" data-r="inSg" placeholder="0.000"></label><label>องศา 度 (°Bé) ที่อ่านได้<input type="number" step="0.5" data-r="inApi" placeholder="00.0"></label></div>
          <div class="btn-row"><button class="btn btn-line btn-sm" data-r="check">✔ ตรวจค่าที่อ่าน</button><button class="btn btn-line btn-sm" data-r="help">💡 ช่วยอ่านให้</button><button class="btn btn-accent" data-r="rec" disabled>📝 บันทึกค่า</button><button class="btn btn-line btn-sm" data-r="clear">↺ ล้างตาราง</button></div>
          <div class="status" data-r="status">เริ่มจากเลือกของเหลว แล้วเทลงกระบอกตวงทั้ง 3 อัน</div>
        </div>
      </div>
      <div class="lab-panel"><p class="lab-step"><span class="n">✓</span>บันทึกผลการทดลอง <span class="small muted" style="font-weight:400">(กดแถวเพื่อดูตัวอย่างการคำนวณ)</span></p>
        <div class="table-wrap"><table class="rig-table" data-r="table"></table></div>
        <div class="lf-list" data-r="rowCalc"></div></div>
      <div class="lab-panel"><p class="lab-step"><span class="n">📈</span>ความสัมพันธ์ระหว่างความถ่วงจำเพาะกับองศาโบเม่ และความถ่วง API</p>
        <div class="chart-box"><svg viewBox="0 0 620 300" data-r="chart"></svg></div>
        <div class="small muted" style="margin-top:6px">เส้นทึบสีแดงคือสเกล 度 บนก้าน (°Bé = 140/s.g. − 130) จุดคือค่าที่อ่านได้ จุดควรอยู่บนเส้นทึบ เพราะสเกลสร้างจากสูตรนี้ · เส้นประคือความถ่วง API = 141.5/s.g. − 131.5 ไว้เทียบ จะเห็นว่าสองค่าใกล้กันมาก (ต่างกันไม่ถึง 1 องศา) แต่<b>ไม่ใช่ค่าเดียวกัน</b></div></div>
    </div>
  </div>`;
  const R = k => host.querySelector(`[data-r="${k}"]`);
  const s = { filled: false, liqs: ['gasohol', 'diesel', 'engine'], cyl: 0, dipped: null, anim: 0, checked: false };
  const rows = [null, null, null];
  let sel = null;
  const SGMIN = 0.700, SGMAX = 1.000, STEM = 110;
  const uOf = sg => STEM * (1 / sg - 1) / (1 / SGMIN - 1);   // ตำแหน่งขีดบนก้าน นับจากโคนก้าน (px)
  function status(t, c = '') { const el = R('status'); el.innerHTML = t; el.className = 'status ' + c; }
  [0, 1, 2].forEach(i => R('liq' + i).addEventListener('change', e => {
    if (s.filled) { e.target.value = s.liqs[i]; status('เทของเหลวไปแล้ว ถ้าจะเปลี่ยนให้กด "ล้างตาราง" เพื่อเริ่มใหม่', 'warn'); return; }
    s.liqs[i] = e.target.value; draw();
  }));
  R('fill').addEventListener('click', () => {
    if (new Set(s.liqs).size < 3) { status('ควรเลือกของเหลว 3 ชนิดที่ไม่ซ้ำกัน', 'warn'); return; }
    s.filled = true; status('เทเรียบร้อย กระบอกละ 100 ml เลือกกระบอกตวงแล้วจุ่มไฮโดรมิเตอร์', 'ok'); draw();
  });
  R('cylPick').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (s.dipped != null && s.dipped !== +b.dataset.i) { status('ยกไฮโดรมิเตอร์ออกจากกระบอกเดิมก่อน', 'warn'); return; }
    s.cyl = +b.dataset.i; $$('button', R('cylPick')).forEach(x => x.classList.toggle('on', x === b)); draw();
  });
  R('dip').addEventListener('click', () => {
    if (!s.filled) { status('ยังไม่มีของเหลวในกระบอกตวง กดเทของเหลวก่อน', 'warn'); return; }
    s.dipped = s.cyl; s.anim = 1.6; s.checked = false; R('inSg').value = ''; R('inApi').value = '';
    R('inSg').className = ''; R('inApi').className = '';
    const sg = LIQ[s.liqs[s.cyl]].sg;
    if (sg > SGMAX + 0.002) status(`⚠️ ไฮโดรมิเตอร์<b>ลอยสูงเกินสเกล</b> เพราะ${LIQ[s.liqs[s.cyl]].name}หนักกว่าน้ำ (s.g. มากกว่า 1) ไฮโดรมิเตอร์ชนิดเบากว่าน้ำวัดไม่ได้ ต้องใช้ชนิดหนักกว่าน้ำ`, 'bad');
    else if (sg < SGMIN) status('⚠️ ไฮโดรมิเตอร์จมเกินสเกล อ่านค่าไม่ได้', 'bad');
    else status('ไฮโดรมิเตอร์กำลังลอยตัว รอให้นิ่ง แล้วอ่านค่าจากภาพขยาย', '');
    draw();
  });
  R('lift').addEventListener('click', () => { s.dipped = null; s.checked = false; status('ยกออกแล้ว เช็ดให้สะอาดก่อนจุ่มกระบอกถัดไป', ''); draw(); });
  function truth() { const sg = LIQ[s.liqs[s.dipped]].sg; return { sg, api: beOf(sg) }; }
  R('check').addEventListener('click', () => {
    if (s.dipped == null) { status('จุ่มไฮโดรมิเตอร์ก่อน', 'warn'); return; }
    const t = truth();
    if (t.sg > SGMAX + 0.002 || t.sg < SGMIN) { status('ของเหลวนี้อยู่นอกช่วงสเกล อ่านค่าไม่ได้ ลองของเหลวที่เบากว่าน้ำ', 'bad'); return; }
    const a = parseFloat(R('inSg').value), b = parseFloat(R('inApi').value);
    const okA = Math.abs(a - t.sg) <= 0.003, okB = Math.abs(b - t.api) <= 0.8;
    R('inSg').className = isFinite(a) ? (okA ? 'right' : 'wrong') : ''; R('inApi').className = isFinite(b) ? (okB ? 'right' : 'wrong') : '';
    s.checked = okA && okB;
    R('rec').disabled = !s.checked;
    status(s.checked ? 'อ่านค่าถูกต้อง ✔ กด "บันทึกค่า" ได้เลย' : `ยังไม่ถูก: ${!okA ? 's.g. ' : ''}${!okA && !okB ? 'และ ' : ''}${!okB ? 'องศา 度 ' : ''}ลองดูภาพขยายอีกครั้ง (อ่านที่ระดับผิวของเหลว สเกล 比重 ตัวเลขมากอยู่ข้างล่าง ส่วนสเกล 度 ตัวเลขมากอยู่ข้างบน)`, s.checked ? 'ok' : 'warn');
  });
  R('help').addEventListener('click', () => {
    if (s.dipped == null) { status('จุ่มไฮโดรมิเตอร์ก่อน', 'warn'); return; }
    const t = truth(); if (t.sg > SGMAX + 0.002 || t.sg < SGMIN) return;
    R('inSg').value = t.sg.toFixed(3); R('inApi').value = t.api.toFixed(1); R('check').click();
  });
  R('rec').addEventListener('click', () => {
    if (!s.checked || s.dipped == null) return;
    rows[s.dipped] = { liq: s.liqs[s.dipped], sg: parseFloat(R('inSg').value), be: parseFloat(R('inApi').value) };
    sel = s.dipped; s.checked = false;
    const next = rows.findIndex(r => !r);
    status(`บันทึกกระบอกตวงอันที่ ${s.dipped + 1} แล้ว ✔ ` + (next >= 0 ? `ยกไฮโดรมิเตอร์ออก แล้วทำอันที่ ${next + 1}` : 'ครบ 3 อันแล้ว'), 'ok');
    render(); draw();
  });
  R('clear').addEventListener('click', () => { if (rows.some(Boolean) && !confirm('ล้างตารางและเริ่มใหม่?')) return; rows.fill(null); sel = null; s.filled = false; s.dipped = null; render(); draw(); status('เริ่มใหม่: เลือกของเหลว แล้วเทลงกระบอกตวง', ''); });
  R('table').addEventListener('click', e => { const tr = e.target.closest('tr[data-i]'); if (!tr || !rows[+tr.dataset.i]) return; sel = +tr.dataset.i; render(); });

  function hydroBody(x, stemBottomY, scaleSg) {
    // ไฮโดรมิเตอร์: ก้าน + กระเปาะ + ลูกตุ้มถ่วง
    let h = `<rect x="${x - 4}" y="${stemBottomY - STEM - 14}" width="8" height="${STEM + 16}" rx="3" fill="#fbfbf7" stroke="#333" stroke-width="1"/>`;
    h += `<path d="M${x - 4},${stemBottomY} C${x - 4},${stemBottomY + 10} ${x - 13},${stemBottomY + 14} ${x - 13},${stemBottomY + 28} L${x - 13},${stemBottomY + 62} Q${x},${stemBottomY + 80} ${x + 13},${stemBottomY + 62} L${x + 13},${stemBottomY + 28} C${x + 13},${stemBottomY + 14} ${x + 4},${stemBottomY + 10} ${x + 4},${stemBottomY} Z" fill="#fbfbf7" stroke="#333" stroke-width="1"/>`;
    h += `<ellipse cx="${x}" cy="${stemBottomY + 62}" rx="9" ry="7" fill="#6b6f76"/>`;
    if (scaleSg) {
      for (let sg = 0.70; sg <= 1.0001; sg += 0.05) { const y = stemBottomY - uOf(sg); h += `<line x1="${x - 4}" x2="${x - 1}" y1="${y}" y2="${y}" stroke="#222" stroke-width="1"/>`; }
      for (let b = 10; b <= 70; b += 10) { const y = stemBottomY - uOf(sgOfBe(b)); h += `<line x1="${x + 1}" x2="${x + 4}" y1="${y}" y2="${y}" stroke="#c0392b" stroke-width="1"/>`; }
    }
    return h;
  }
  function draw() {
    const X = [90, 220, 350], surf = 30, inBot = 262;
    let h = `<rect x="0" y="270" width="440" height="20" fill="var(--surface-2)"/>`;
    X.forEach((x, i) => {
      const l = LIQ[s.liqs[i]];
      if (s.filled) h += `<path d="M${x - 21},${surf - 3} Q${x},${surf + 4} ${x + 21},${surf - 3} L${x + 21},${inBot} L${x - 21},${inBot} Z" fill="${l.color}" opacity="${l.op}"/>`;
      if (s.dipped === i) {
        const sg = l.sg;
        let sb;
        if (sg > SGMAX + 0.002) sb = surf - 8 - (sg - 1) * 60;           // ลอยสูง กระเปาะโผล่
        else if (sg < SGMIN) sb = surf + STEM + 4;                        // จม
        else sb = surf + uOf(sg);
        const bobY = s.anim > 0 ? Math.sin(s.anim * 9) * 10 * s.anim / 1.6 : 0;
        h += hydroBody(x, sb + bobY, true);
      }
      h += `<rect x="${x - 22}" y="${surf - 40}" width="44" height="${inBot - surf + 42}" fill="none" stroke="var(--text)" stroke-width="1.6"/>`;
      h += `<rect x="${x - 34}" y="${inBot + 2}" width="68" height="6" rx="2" fill="var(--glass)" stroke="var(--text)"/>`;
      h += `<line x1="${x - 22}" x2="${x - 12}" y1="${surf}" y2="${surf}" stroke="var(--text)"/><text x="${x - 26}" y="${surf + 4}" text-anchor="end" style="font-size:8px;fill:var(--muted)">100</text>`;
      h += `<text x="${x}" y="283" text-anchor="middle" style="font-size:11px;fill:${s.cyl === i ? 'var(--accent)' : 'var(--text)'};font-weight:${s.cyl === i ? 700 : 400}">${s.cyl === i ? '▶ ' : ''}อันที่ ${i + 1}${rows[i] ? ' ✓' : ''}</text>`;
      h += `<text x="${x}" y="296" text-anchor="middle" style="font-size:9px;fill:var(--muted)">${s.filled ? l.name.replace(/ \(.*\)/, '').replace('น้ำมัน', '') : 'ว่าง'}</text>`;
    });
    if (s.dipped == null && s.filled) h += hydroBody(410, 60, false).replace(/(<rect|<path|<ellipse)/g, '$1 transform="rotate(8 410 100)"');
    R('scene').innerHTML = h;
    // ภาพขยาย
    let z = `<rect x="0" y="0" width="240" height="230" fill="var(--surface)"/>`;
    if (s.dipped == null) z += `<text x="120" y="118" text-anchor="middle" class="svg-m">จุ่มไฮโดรมิเตอร์ก่อน</text>`;
    else {
      const l = LIQ[s.liqs[s.dipped]], sg = l.sg, mid = 115, Z = 9;
      const inRange = sg <= SGMAX + 0.002 && sg >= SGMIN;
      const bob = s.anim > 0 ? Math.sin(s.anim * 9) * 26 * s.anim / 1.6 : 0;
      const u0 = inRange ? uOf(sg) : (sg > 1 ? -6 : STEM + 4);
      const Yu = u => mid - (u - u0) * Z + bob;
      z += `<rect x="0" y="${mid}" width="240" height="${230 - mid}" fill="${l.color}" opacity="${l.op}"/>`;
      z += `<rect x="94" y="0" width="52" height="230" fill="#fbfbf7" stroke="#333"/>`;
      if (sg > 1 && !inRange) z += `<rect x="70" y="${Yu(0)}" width="100" height="${230 - Yu(0)}" fill="#fbfbf7" stroke="#333"/>`;
      for (let v = 0.690; v <= 1.0005; v += 0.002) {
        const y = Yu(uOf(v)); if (y < -10 || y > 240) continue;
        const k = Math.round(v * 1000), major = k % 10 === 0, half = k % 5 === 0;
        z += `<line x1="94" x2="${94 + (major ? 22 : half ? 15 : 9)}" y1="${y}" y2="${y}" stroke="#222" stroke-width="${major ? 1.6 : 1}"/>`;
        if (major) z += `<text x="${118}" y="${y + 4}" style="font-size:11px;fill:#222;font-weight:700">${(k / 1000).toFixed(2)}</text>`;
      }
      for (let a = 10; a <= 70; a += 1) {            // สเกล 度 (องศาโบเม่) 10–70 ตามของจริง ตัวเลขมากอยู่บน
        const y = Yu(uOf(sgOfBe(a))); if (y < -10 || y > 240) continue;
        const major = a % 5 === 0;
        z += `<line x1="${146 - (major ? 14 : 7)}" x2="146" y1="${y}" y2="${y}" stroke="#c0392b" stroke-width="${major ? 1.6 : 1}"/>`;
        if (major) z += `<text x="${148}" y="${y + 4}" style="font-size:11px;fill:#c0392b;font-weight:700">${a}</text>`;
      }
      z += `<path d="M0,${mid} L88,${mid} Q93,${mid - 5} 94,${mid - 8} M146,${mid - 8} Q147,${mid - 5} 152,${mid} L240,${mid}" stroke="var(--text)" stroke-width="1.5" fill="none"/>`;
      z += `<text x="6" y="${mid - 6}" style="font-size:10px;fill:var(--muted)">ผิวของเหลว</text><text x="234" y="16" text-anchor="end" style="font-size:13px;fill:#c0392b;font-weight:700">度</text><text x="234" y="28" text-anchor="end" style="font-size:9px;fill:#c0392b">°Bé</text><text x="6" y="16" style="font-size:13px;fill:#222;font-weight:700">比重</text><text x="6" y="28" style="font-size:9px;fill:#222">s.g.</text>`;
      z += `<text x="226" y="${mid + 4}" style="font-size:14px">👁</text>`;
      if (!inRange) z += `<rect x="10" y="80" width="220" height="40" rx="6" fill="var(--bad-soft)" stroke="var(--bad)"/><text x="120" y="105" text-anchor="middle" style="font-size:12px;fill:var(--bad);font-weight:700">${sg > 1 ? 'ลอยสูงเกินสเกล อ่านไม่ได้' : 'จมเกินสเกล อ่านไม่ได้'}</text>`;
    }
    R('zoom').innerHTML = z;
    $$('button', R('cylPick')).forEach(b => b.classList.toggle('done', !!rows[+b.dataset.i]));
    R('rec').disabled = !s.checked;
  }
  function render() {
    const calc = r => ({ gam: r.sg * GAM_W, rho: r.sg * RHO_W, vs: 1 / (r.sg * RHO_W) });
    R('table').innerHTML = `<thead><tr><th>กระบอกตวง<br>อันที่</th><th>สีของ<br>ของไหล</th><th>ความถ่วงจำเพาะ<br>(比重 อ่านได้)</th><th>องศา °Bé<br>(度 อ่านได้)</th><th>ความถ่วง API<br>(คำนวณ)</th><th>น้ำหนักจำเพาะ<br>(N/m³)</th><th>ความหนาแน่น<br>(kg/m³)</th><th>ปริมาตรจำเพาะ<br>(m³/kg)</th></tr></thead><tbody>` +
      rows.map((r, i) => {
        if (!r) return `<tr data-i="${i}"><td>${i + 1}</td>${'<td class="miss">–</td>'.repeat(7)}</tr>`;
        const o = calc(r), l = LIQ[r.liq];
        return `<tr data-i="${i}"${i === sel ? ' class="sel"' : ''}><td>${i + 1}</td><td style="white-space:nowrap">${sw(l)} ${l.cname}<div class="small muted">${l.name}</div></td><td>${r.sg.toFixed(3)}</td><td>${r.be.toFixed(1)}</td><td>${N(apiOf(r.sg), 1)}</td><td>${N(o.gam, 1)}</td><td>${N(o.rho, 0)}</td><td>${SCI(o.vs, 3)}</td></tr>`;
      }).join('') + '</tbody>';
    const out = R('rowCalc');
    if (sel == null || !rows[sel]) out.innerHTML = '<div class="small muted">ยังไม่มีข้อมูล — อ่านค่าและบันทึกอย่างน้อย 1 อัน</div>';
    else {
      const r = rows[sel], o = calc(r);
      out.innerHTML = `<div class="small" style="font-weight:600">ตัวอย่างการคำนวณ กระบอกตวงอันที่ ${sel + 1} (${LIQ[r.liq].name}) · อ่านได้ s.g. = ${r.sg.toFixed(3)}, °Bé = ${r.be.toFixed(1)}</div>` +
        LF('1. น้ำหนักจำเพาะ', `s.g. = ${FR('γ<sub>f</sub>', 'γ<sub>w</sub>')} → γ<sub>f</sub> = (s.g.)(γ<sub>w</sub>)`, `= (${r.sg.toFixed(3)})(9,810)`, `= ${N(o.gam, 1)} N/m³`, 'hl') +
        LF('2. ความหนาแน่น', `s.g. = ${FR('ρ<sub>f</sub>', 'ρ<sub>w</sub>')} → ρ<sub>f</sub> = (s.g.)(ρ<sub>w</sub>)`, `= (${r.sg.toFixed(3)})(1,000)`, `= ${N(o.rho, 0)} kg/m³`, 'hl') +
        LF('3. ปริมาตรจำเพาะ', `v = ${FR('1', 'ρ<sub>f</sub>')}`, `= ${FR('1', N(o.rho, 0))}`, `= ${SCI(o.vs, 3)} m³/kg`, 'hl') +
        LF('4. ความถ่วง API (คำนวณจาก s.g. เพราะสเกล 度 บนก้านไม่ใช่ API)', `API Gr. = ${FR('141.5', 's.g.')} − 131.5`, `= ${FR('141.5', r.sg.toFixed(3))} − 131.5`, `= ${N(apiOf(r.sg), 1)}`, 'hl') +
        LF('ตรวจสอบองศาโบเม่ที่อ่านได้ด้วยสูตร', `°Bé = ${FR('140', 's.g.')} − 130`, `= ${FR('140', r.sg.toFixed(3))} − 130`, `= ${N(beOf(r.sg), 1)} (อ่านได้ ${r.be.toFixed(1)})`);
    }
    const curve = [], curveApi = []; for (let x = 0.70; x <= 1.0001; x += 0.01) { curve.push([x, beOf(x)]); curveApi.push([x, apiOf(x)]); }
    R('chart').innerHTML = lineChart({ W: 620, H: 300, m: { l: 60, r: 18, t: 14, b: 44 },
      x: { min: 0.70, max: 1.00, step: 0.05, label: 'ความถ่วงจำเพาะ (s.g.)', fmt: v => v.toFixed(2) },
      y: { min: 0, max: 80, step: 10, label: 'องศา °Bé / API', fmt: v => v.toFixed(0) },
      series: [{ pts: curve, color: '#c0392b', smooth: true }, { pts: curveApi, color: 'var(--muted)', smooth: true, dash: true }].concat(rows.filter(Boolean).map(r => ({ pts: [[r.sg, r.be]], color: LIQ[r.liq].color, dots: true }))) });
  }
  let last = performance.now(), vis = false, running = false;
  whenVisible(host, v => { vis = v; if (v && !running) { running = true; last = performance.now(); requestAnimationFrame(tick); } });
  function tick(t) {
    const dt = Math.min(0.1, (t - last) / 1000); last = t;
    if (s.anim > 0) { s.anim = Math.max(0, s.anim - dt); draw(); }
    if (vis) requestAnimationFrame(tick); else running = false;
  }
  render(); draw();
}
$$('[data-flab="scale"]').forEach(buildScaleLab);
$$('[data-flab="hydro"]').forEach(buildHydroLab);

/* =====================================================================
   แบบทดสอบ
   ===================================================================== */
initQuiz([
  { title: 'ความหมายและแนวคิด', qs: [
    { q: 'ของไหล (Fluid) หมายถึงข้อใด', c: ['สสารที่มีน้ำหนักเบากว่าน้ำ', 'สสารที่เมื่อมีความเค้นเฉือนมากระทำ จะเสียรูปร่างอย่างต่อเนื่อง', 'สสารที่มีความหนาแน่นมากกว่า 1,000 kg/m³', 'สสารที่ไม่มีมวล'], a: 1, e: 'ของไหลเสียรูปร่างอย่างต่อเนื่องเมื่อมีความเค้นเฉือน เรียกว่าการไหล' },
    { q: 'สสารในสถานะใดเป็นของไหล', c: ['ของแข็งเท่านั้น', 'ของเหลวเท่านั้น', 'ของเหลวและแก๊ส', 'ของแข็งและแก๊ส'], a: 2, e: 'ของเหลวและแก๊สไหลได้ จึงเป็นของไหล ของแข็งไหลไม่ได้' },
    { q: 'ของไหลที่ "ไม่ยุบตัวตามความดัน" คือข้อใด', c: ['ของเหลว', 'แก๊ส', 'ไอน้ำ', 'อากาศ'], a: 0, e: 'ของเหลวยุบตัวน้อยมากจนถือว่าไม่ยุบตัว ส่วนแก๊สยุบตัวได้มาก' },
    { q: 'ความหนาแน่น หมายถึงข้อใด', c: ['น้ำหนักต่อหน่วยปริมาตร', 'มวลต่อหน่วยปริมาตร', 'ปริมาตรต่อหน่วยมวล', 'ความหนาแน่นของสารเทียบกับน้ำ'], a: 1, e: 'ρ = m/V' },
    { q: 'น้ำหนักจำเพาะ หมายถึงข้อใด', c: ['น้ำหนักต่อหน่วยปริมาตร', 'มวลต่อหน่วยปริมาตร', 'ปริมาตรต่อหน่วยน้ำหนัก', 'น้ำหนักต่อหน่วยมวล'], a: 0, e: 'γ = w/V หน่วย N/m³' },
    { q: 'ปริมาตรจำเพาะ หมายถึงข้อใด', c: ['ปริมาตรต่อหน่วยน้ำหนัก', 'มวลต่อหน่วยปริมาตร', 'ปริมาตรต่อหน่วยมวล', 'ปริมาตรของน้ำ 1 kg'], a: 2, e: 'V<sub>S</sub> = V/m หน่วย m³/kg' },
    { q: 'ความถ่วงจำเพาะ หมายถึงข้อใด', c: ['ความหนาแน่นของสารคูณความหนาแน่นของน้ำ', 'อัตราส่วนระหว่างความหนาแน่นของสาร กับความหนาแน่นของน้ำ', 'น้ำหนักของสาร 1 ลิตร', 'อัตราส่วนระหว่างมวลกับน้ำหนัก'], a: 1, e: 's.g. = ρf/ρw หรือ γf/γw' },
    { q: 'สถาบันปิโตรเลียมของอเมริกา กำหนดความถ่วงที่ใช้กับปิโตรเลียมโดยเฉพาะ เรียกว่าอะไร', c: ['ความถ่วงจำเพาะ', 'ความถ่วงเอพีไอ (API Gravity)', 'ความถ่วงโบเม่', 'น้ำหนักจำเพาะ'], a: 1, e: 'API Gr. = 141.5/s.g. − 131.5' },
    { q: 'ปริมาตรจำเพาะกับความหนาแน่น มีความสัมพันธ์กันอย่างไร', c: ['เท่ากันเสมอ', 'เป็นส่วนกลับซึ่งกันและกัน', 'ต่างกัน 9.81 เท่า', 'ไม่เกี่ยวข้องกัน'], a: 1, e: 'V<sub>S</sub> = 1/ρ' },
    { q: 'หน่วยของน้ำหนักจำเพาะคือข้อใด', c: ['kg/m³', 'N/m³', 'm³/kg', 'ไม่มีหน่วย'], a: 1, e: 'น้ำหนัก (N) ÷ ปริมาตร (m³)' },
    { q: 'ความถ่วงจำเพาะมีหน่วยเป็นอะไร', c: ['kg/m³', 'N/m³', 'ไม่มีหน่วย', 'm³/kg'], a: 2, e: 'เป็นอัตราส่วนของปริมาณชนิดเดียวกัน หน่วยตัดกันหมด' },
    { q: 'ความถ่วง API ของน้ำมีค่าเท่าใด', c: ['0', '1', '10', '100'], a: 2, e: 'API = 141.5/1 − 131.5 = 10' },
    { q: 'น้ำมันชนิดหนึ่งมีความถ่วง API สูงมาก แปลว่าอะไร', c: ['น้ำมันหนักมาก', 'น้ำมันเบามาก (s.g. ต่ำ)', 'น้ำมันหนืดมาก', 'น้ำมันมีอุณหภูมิสูง'], a: 1, e: 's.g. อยู่ในส่วนของสูตร API มาก → s.g. น้อย → เบา' },
    { q: 'นำของเหลวไปชั่งบนดวงจันทร์ ข้อใดถูก', c: ['ρ ลดลง γ ลดลง', 'ρ เท่าเดิม γ ลดลง', 'ρ ลดลง γ เท่าเดิม', 'ทั้งคู่เท่าเดิม'], a: 1, e: 'มวลไม่เปลี่ยน ρ จึงเท่าเดิม แต่ g ลดลง γ = ρg จึงลดลง' },
    { q: 'บนก้านไฮโดรมิเตอร์ ตัวเลข s.g. เรียงอย่างไร', c: ['ค่ามากอยู่ด้านบน', 'ค่ามากอยู่ด้านล่าง (ใกล้กระเปาะ)', 'ค่าเท่ากันทุกขีด', 'ไม่มีตัวเลข'], a: 1, e: 'ของเหลวหนาแน่นมาก ไฮโดรมิเตอร์ลอยสูง ผิวของเหลวจึงตัดก้านที่ตำแหน่งต่ำ ขีดค่ามากจึงอยู่ล่าง' },
    { q: 'ไฮโดรมิเตอร์ชนิดเบากว่าน้ำ ใช้วัดของเหลวแบบใด', c: ['ของเหลวที่ s.g. น้อยกว่า 1 เช่น น้ำมัน', 'ของเหลวที่ s.g. มากกว่า 1 เช่น น้ำกรด', 'ของแข็ง', 'แก๊ส'], a: 0, e: 'สเกลประมาณ 0.700–1.000 ถ้าของเหลวหนักกว่าน้ำ ไฮโดรมิเตอร์จะลอยสูงเกินสเกล' },
    { q: 'การอ่านปริมาตรในกระบอกตวง ควรอ่านอย่างไร', c: ['อ่านที่ขอบบนของผิวโค้ง มองจากด้านบน', 'อ่านที่ท้องโค้ง (เมนิสคัส) สายตาอยู่ระดับเดียวกับผิวของเหลว', 'อ่านที่ก้นกระบอกตวง', 'อ่านค่าจากเครื่องชั่ง'], a: 1, e: 'มองระดับเดียวกันเพื่อลดความคลาดเคลื่อนจากมุมมอง (parallax)' }
  ] },
  { title: 'คำนวณ', qs: [
    { q: '500 Litre เท่ากับกี่ลูกบาศก์เมตร', c: ['0.05 m³', '0.5 m³', '5 m³', '500,000 m³'], a: 1, e: '1 m³ = 1,000 L → 500/1,000 = 0.5 m³' },
    { q: '50 ml เท่ากับกี่ลูกบาศก์เมตร', c: ['5 × 10⁻² m³', '5 × 10⁻³ m³', '5 × 10⁻⁵ m³', '5 × 10⁻⁸ m³'], a: 2, e: '50 × 10⁻⁶ = 5 × 10⁻⁵ m³' },
    { q: 'น้ำมันหล่อลื่น 460 kg ปริมาตร 500 L มีความหนาแน่นเท่าใด', c: ['0.92 kg/m³', '92 kg/m³', '920 kg/m³', '9,025 kg/m³'], a: 2, e: 'ρ = 460/0.5 = 920 kg/m³ (ตัวอย่าง 4.1)' },
    { q: 'น้ำมันมวล 170 kg ปริมาตร 200 L มีความถ่วงจำเพาะเท่าใด', c: ['0.085', '0.85', '1.18', '850'], a: 1, e: 'ρ = 170/0.2 = 850 → s.g. = 850/1,000 = 0.85' },
    { q: 'ของเหลว 50 ml มีมวล 75 g ความหนาแน่นเท่าใด', c: ['1.5 kg/m³', '150 kg/m³', '667 kg/m³', '1,500 kg/m³'], a: 3, e: '(75×10⁻³)/(50×10⁻⁶) = 1,500 kg/m³' },
    { q: 'ความหนาแน่น 1,500 kg/m³ มีน้ำหนักจำเพาะเท่าใด', c: ['152.9 N/m³', '1,509.8 N/m³', '14,715 N/m³', '147,150 N/m³'], a: 2, e: 'γ = ρg = 1,500 × 9.81 = 14,715 N/m³' },
    { q: 'น้ำมัน s.g. = 0.81 มีความหนาแน่นเท่าใด', c: ['0.81 kg/m³', '81 kg/m³', '810 kg/m³', '7,946 kg/m³'], a: 2, e: 'ρ = (0.81)(1,000) = 810 kg/m³' },
    { q: 'น้ำมัน s.g. = 0.71 มีน้ำหนักจำเพาะเท่าใด', c: ['710 N/m³', '6,965.1 N/m³', '9,810 N/m³', '13,817 N/m³'], a: 1, e: 'γ = (0.71)(9,810) = 6,965.1 N/m³ (ตัวอย่าง 4.2)' },
    { q: 'ความหนาแน่น 710 kg/m³ มีปริมาตรจำเพาะเท่าใด', c: ['1.41 × 10⁻³ m³/kg', '7.10 × 10⁻³ m³/kg', '0.71 m³/kg', '710 m³/kg'], a: 0, e: 'V<sub>S</sub> = 1/710 = 1.41 × 10⁻³ m³/kg' },
    { q: 'น้ำมัน s.g. = 0.85 มีความถ่วง API เท่าใด', c: ['10.0', '22.3', '34.97', '166.5'], a: 2, e: '141.5/0.85 − 131.5 = 34.97' },
    { q: 'ตวงของเหลว 50 ml ชั่งได้ 41.8 g ความถ่วงจำเพาะเท่าใด', c: ['0.418', '0.836', '1.196', '8.36'], a: 1, e: 'ρ = 0.0418/(50×10⁻⁶) = 836 kg/m³ → s.g. = 0.836 (น่าจะเป็นน้ำมันดีเซล)' }
  ] }
]);

/* =====================================================================
   สรุปสูตร
   ===================================================================== */
initFormulas([
  { id: 'fx1', t: 'ความหนาแน่น (Density)', eq: `ρ = ${FR('m', 'V')}`,
    o: 'นิยามตรง ๆ ว่าในปริมาตร 1 หน่วย มีมวลอยู่เท่าไร จึงเอามวลหารด้วยปริมาตร',
    v: [['ρ', 'ความหนาแน่น', 'kg/m³', 'คำนวณ'], ['m', 'มวลของสาร', 'kg', 'ชั่งด้วยเครื่องชั่ง (g ÷ 1,000)'], ['V', 'ปริมาตรของสาร', 'm³', 'ตวงด้วยกระบอกตวง (ml × 10⁻⁶) หรือโจทย์ให้มา (L × 10⁻³)']],
    ex: 'ตัวอย่าง 4.1: 460 / (500 × 10⁻³) = <b>920 kg/m³</b>' },
  { id: 'fx2', t: 'น้ำหนักจำเพาะ (Specific Weight)', eq: `γ = ${FR('w', 'V')} = ρ · g`,
    o: 'นิยามคือน้ำหนักต่อปริมาตร และเพราะน้ำหนัก w = m·g จึงได้ γ = (m/V)·g = ρ·g',
    v: [['γ', 'น้ำหนักจำเพาะ', 'N/m³', 'คำนวณ'], ['w', 'น้ำหนักของสาร = m·g', 'N', 'มวล (kg) × 9.81'], ['V', 'ปริมาตร', 'm³', 'กระบอกตวง / โจทย์'], ['g', 'ความเร่งเนื่องจากแรงโน้มถ่วงของโลก', 'm/s²', 'ใช้ 9.81']],
    ex: 'ตัวอย่าง 4.1: (460 × 9.81) / (500 × 10⁻³) = <b>9,025.2 N/m³</b>' },
  { id: 'fx3', t: 'ปริมาตรจำเพาะ (Specific Volume)', eq: `V<sub>S</sub> = ${FR('V', 'm')} = ${FR('1', 'ρ')}`,
    o: 'นิยามคือปริมาตรต่อมวล 1 หน่วย ซึ่งเป็นเศษส่วนกลับของความหนาแน่นพอดี',
    v: [['V<sub>S</sub> (หรือ v)', 'ปริมาตรจำเพาะ', 'm³/kg', 'คำนวณ'], ['V', 'ปริมาตร', 'm³', 'กระบอกตวง / โจทย์'], ['m', 'มวล', 'kg', 'เครื่องชั่ง'], ['ρ', 'ความหนาแน่น', 'kg/m³', 'สูตร ρ = m/V']],
    ex: 'ตัวอย่าง 4.2: 1/710 = <b>1.41 × 10⁻³ m³/kg</b>' },
  { id: 'fx4', t: 'ความถ่วงจำเพาะ (Specific Gravity)', eq: `s.g. = ${FR('ρ<sub>f</sub>', 'ρ<sub>w</sub>')} = ${FR('γ<sub>f</sub>', 'γ<sub>w</sub>')} <span class="eq-alt">จัดรูปใหม่: ρ<sub>f</sub> = (s.g.)ρ<sub>w</sub> · γ<sub>f</sub> = (s.g.)γ<sub>w</sub></span>`,
    o: 'เทียบสารกับน้ำ (ตัวมาตรฐาน) ว่าหนักกี่เท่า ใช้ได้ทั้งความหนาแน่นและน้ำหนักจำเพาะ เพราะ g ตัดกันหมด',
    v: [['s.g.', 'ความถ่วงจำเพาะ (ถ.พ.)', 'ไม่มีหน่วย', 'คำนวณ หรืออ่านจากไฮโดรมิเตอร์'], ['ρ<sub>f</sub>, γ<sub>f</sub>', 'ความหนาแน่น / น้ำหนักจำเพาะของสาร', 'kg/m³, N/m³', 'คำนวณจากการชั่ง-ตวง'], ['ρ<sub>w</sub>', 'ความหนาแน่นของน้ำ', 'kg/m³', 'ใช้ 1,000'], ['γ<sub>w</sub>', 'น้ำหนักจำเพาะของน้ำ', 'N/m³', 'ใช้ 9,810']],
    ex: 'ตัวอย่าง 4.1: 920/1,000 = <b>0.92</b> · ตัวอย่าง 4.2: γ = (0.71)(9,810) = <b>6,965.1 N/m³</b>' },
  { id: 'fx5', t: 'ความถ่วง API (API Gravity)', eq: `API Gr. = ${FR('141.5', 's.g.')} − 131.5 <span class="eq-alt">ย้อนกลับ: s.g. = ${FR('141.5', 'API + 131.5')}</span>`,
    o: 'สถาบันปิโตรเลียมของอเมริกากำหนดให้น้ำมี API = 10 และให้น้ำมันที่เบากว่ามีตัวเลขมากขึ้น สูตรจึงมี s.g. อยู่ในส่วน',
    v: [['API Gr.', 'ความถ่วง API', 'องศา API (ไม่มีหน่วย)', 'คำนวณ หรืออ่านจากไฮโดรมิเตอร์'], ['s.g.', 'ความถ่วงจำเพาะที่ 60 °F', 'ไม่มีหน่วย', 'การชั่ง-ตวง หรือไฮโดรมิเตอร์']],
    ex: 's.g. 0.85 → 141.5/0.85 − 131.5 = <b>34.97</b> · น้ำ s.g. 1.000 → <b>10</b>' }
], [
  ['Litre → m³', 'คูณ 10⁻³ (1 m³ = 1,000 L)'],
  ['ml = cc = cm³ → m³', 'คูณ 10⁻⁶ (1 L = 1,000 cc)'],
  ['g → kg', 'หาร 1,000'],
  ['kg → N (น้ำหนัก)', 'คูณ 9.81 (w = m·g)'],
  ['m³/kg → L/kg', 'คูณ 1,000']
]);
