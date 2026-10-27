/* ===== ห้องทดลองเสมือน: จำลองใบงาน 2.1–2.7 ให้นักศึกษาลองทดสอบเองในเว็บ =====
   ค่าคุณสมบัติวัสดุเป็นค่าโดยประมาณจากตำรา และสุ่มคลาดเคลื่อนเล็กน้อยทุกครั้งที่ทดสอบ เหมือนชิ้นงานจริง */
(function labs() {
  const G = 9.81;
  const N = (x, dp = 2) => Number(x).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  const FR = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
  const LF = (k, eq, sub, ans, cls = '') =>
    `<div class="lf ${cls}"><div class="lf-k">${k}</div><div class="lf-row"><span class="lf-eq">${eq}</span><span class="lf-sub">${sub}</span><span class="lf-ans">${ans}</span></div></div>`;
  const SCI = (v, dp = 3) => {
    const [m, e] = v.toExponential(dp).split('e');
    return `${m} × 10<sup>${Number(e)}</sup>`;
  };
  const jitter = s => 1 + (Math.random() * 2 - 1) * s;
  const niceStep = x => {
    const p = Math.pow(10, Math.floor(Math.log10(x)));
    const f = x / p;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  };
  const tick = v => Number(v.toFixed(6)).toLocaleString('en-US', { maximumFractionDigits: 3 });
  const mmss = sec => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

  /* ---------- วัสดุ (ค่าโดยประมาณ) ----------
     E, G = GN/m² · ความเค้น = MN/m² · eu, ef = ความเครียดที่แรงสูงสุดและที่ขาด */
  const MATS = {
    steel: { name: 'เหล็กกล้าละมุน', c: '#a7b1bd', d: '#5d6876', line: '#3b7dd8',
      E: 205, sy: 300, su: 440, eu: 0.20, ef: 0.30, sfr: 0.78, drop: true,
      csy: 300, cn: 0.22, ce0: 0.01, tauS: 330, sh: [0.9, 1.5],
      Gm: 80, ty: 175, tu: 280, g0: 0.05, gf: 0.42,
      HB: 126, HV: 132, HRB: 71, HRC: -8, hardSurf: true,
      note: 'วัสดุเหนียว ใช้ทำโครงสร้าง เพลา น็อต · มีจุดครากชัดเจน' },
    al: { name: 'อะลูมิเนียม', c: '#d7dde3', d: '#8c97a3', line: '#23a393',
      E: 69, sy: 275, su: 310, eu: 0.08, ef: 0.13, sfr: 0.86,
      csy: 275, cn: 0.08, ce0: 0.005, tauS: 205, sh: [0.6, 1.0],
      Gm: 26, ty: 155, tu: 195, g0: 0.03, gf: 0.28,
      HB: 95, HV: 107, HRB: 60, HRC: -30, hardSurf: false,
      note: 'เบา ไม่เป็นสนิม · ไม่มีจุดครากชัดเจน (ต้องใช้วิธี 0.2% offset)' },
    brass: { name: 'ทองเหลือง', c: '#e0b64e', d: '#9a7417', line: '#d4a017',
      E: 100, sy: 250, su: 380, eu: 0.22, ef: 0.30, sfr: 0.8,
      csy: 250, cn: 0.35, ce0: 0.02, tauS: 250, sh: [0.8, 1.3],
      Gm: 37, ty: 140, tu: 250, g0: 0.12, gf: 0.45,
      HB: 110, HV: 116, HRB: 70, HRC: -15, hardSurf: false,
      note: 'กลึงง่าย ใช้ทำข้อต่อ วาล์ว บูช' },
    cu: { name: 'ทองแดง', c: '#d27c45', d: '#8e4520', line: '#e06c3c',
      E: 117, sy: 70, su: 220, eu: 0.35, ef: 0.47, sfr: 0.6,
      csy: 70, cn: 0.44, ce0: 0.02, tauS: 150, sh: [1.3, 2.2],
      Gm: 44, ty: 40, tu: 160, g0: 0.25, gf: 0.85,
      HB: 45, HV: 50, HRB: -20, HRC: -60, hardSurf: false,
      note: 'นิ่มและเหนียวมาก ยืดได้เกือบครึ่งหนึ่งของความยาวเดิม' },
    ci: { name: 'เหล็กหล่อเทา', c: '#7a7d80', d: '#3d3f42', line: '#8a8f96', brittle: true,
      E: 100, su: 210, ef: 0.006, suc: 760, efc: 0.04, tauS: 240, sh: [0.25, 0.25],
      Gm: 40, tauR: 230,
      HB: 210, HV: 220, HRB: 95, HRC: 12, hardSurf: true,
      note: 'วัสดุเปราะ รับแรงอัดได้ดีมาก แต่รับแรงดึงได้น้อย ขาดโดยแทบไม่ยืด' },
    ss: { name: 'สแตนเลส 304', c: '#c5ccd4', d: '#78838f', line: '#9b5fd6',
      E: 193, sy: 215, su: 505, eu: 0.45, ef: 0.55, sfr: 0.7,
      csy: 215, cn: 0.45, ce0: 0.02, tauS: 380, sh: [1.1, 1.8],
      Gm: 77, ty: 125, tu: 380, g0: 0.3, gf: 0.9,
      HB: 170, HV: 180, HRB: 87, HRC: 2, hardSurf: true,
      note: 'ไม่เป็นสนิม เหนียวมาก ยิ่งยืดยิ่งแข็งแรงขึ้น' },
    hard: { name: 'เหล็กกล้าชุบแข็ง', c: '#6c737c', d: '#30353b', line: '#c2c8cf',
      HB: 600, HV: 700, HRB: 121, HRC: 60, hardSurf: true,
      note: 'ผ่านการชุบแข็ง ใช้ทำแม่พิมพ์ ใบมีด เฟือง' }
  };

  /* ---------- ลายไล่สีที่ใช้ร่วมกันทุกภาพ (ใส่ไว้ที่เดียว เพื่อให้ภาพในแท็บที่ซ่อนอยู่ยังมีสี) ---------- */
  (function defs() {
    let g = '';
    const lg = (id, h, stops) => `<linearGradient id="${id}" ${h ? 'x1="0" y1="0" x2="1" y2="0"' : 'x1="0" y1="0" x2="0" y2="1"'}>${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
    g += lg('gCol', 1, [[0, '#7d8898'], [0.45, '#eef2f6'], [1, '#7d8898']]);
    g += lg('gBlue', 0, [[0, '#4f8fdc'], [1, '#1f4f8f']]);
    g += lg('gOr', 1, [[0, '#b5441a'], [0.45, '#f39a5f'], [1, '#b5441a']]);
    g += lg('gDark', 1, [[0, '#353b45'], [0.5, '#727b88'], [1, '#353b45']]);
    g += lg('gGreen', 0, [[0, '#4cc06a'], [1, '#2a8a43']]);
    g += lg('gYel', 1, [[0, '#d9a400'], [0.45, '#ffe27a'], [1, '#d9a400']]);
    g += lg('gTeal', 1, [[0, '#2d8fa6'], [0.45, '#8fd8ea'], [1, '#2d8fa6']]);
    g += lg('gCream', 1, [[0, '#d7d0bf'], [0.4, '#f7f3ea'], [1, '#cfc7b4']]);
    g += lg('gPeach', 1, [[0, '#c46b2c'], [0.45, '#f7b57e'], [1, '#c46b2c']]);
    for (const [k, m] of Object.entries(MATS)) {
      g += lg(`gm-${k}-h`, 1, [[0, m.d], [0.42, m.c], [0.6, '#ffffff'], [0.75, m.c], [1, m.d]]);
      g += lg(`gm-${k}-v`, 0, [[0, m.d], [0.3, m.c], [0.45, '#ffffff'], [0.62, m.c], [1, m.d]]);
    }
    g += '<radialGradient id="gDent" cx=".45" cy=".42" r=".6"><stop offset="0" stop-color="#5a5f66"/><stop offset=".75" stop-color="#9aa0a8"/><stop offset="1" stop-color="#3d4148"/></radialGradient>';
    for (const [id, c] of [['mArr', 'var(--brand)'], ['mArrT', 'var(--tension)'], ['mArrA', 'var(--accent)']]) {
      g += `<marker id="${id}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" style="fill:${c}"/></marker>`;
    }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    svg.innerHTML = `<defs>${g}</defs>`;
    document.body.prepend(svg);
  })();

  /* ---------- กราฟ ---------- */
  function makeChart(svg) {
    const W = 520, H = 300, L = 62, R = 16, T = 16, B = 46;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    return function draw({ xmax, ymax, xlab, ylab, series = [], dots = [], pick, peak }) {
      const xs = niceStep((xmax || 1) / 5), ys = niceStep((ymax || 1) / 5);
      const X = Math.max(xs, Math.ceil((xmax || 1) / xs - 1e-9) * xs), Y = Math.max(ys, Math.ceil((ymax || 1) / ys - 1e-9) * ys);
      const px = x => L + x / X * (W - L - R), py = y => H - B - y / Y * (H - T - B);
      let g = '';
      for (let x = 0; x <= X + 1e-9; x += xs) g += `<line class="ch-grid" x1="${px(x)}" y1="${T}" x2="${px(x)}" y2="${H - B}"/><text class="ch-tick" x="${px(x)}" y="${H - B + 15}" text-anchor="middle">${tick(x)}</text>`;
      for (let y = 0; y <= Y + 1e-9; y += ys) g += `<line class="ch-grid" x1="${L}" y1="${py(y)}" x2="${W - R}" y2="${py(y)}"/><text class="ch-tick" x="${L - 6}" y="${py(y) + 4}" text-anchor="end">${tick(y)}</text>`;
      g += `<line class="ch-axis" x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}"/><line class="ch-axis" x1="${L}" y1="${T}" x2="${L}" y2="${H - B}"/>`;
      g += `<text class="ch-lab" x="${(L + W - R) / 2}" y="${H - 8}" text-anchor="middle">${xlab}</text>`;
      g += `<text class="ch-lab" x="14" y="${(T + H - B) / 2}" text-anchor="middle" transform="rotate(-90 14 ${(T + H - B) / 2})">${ylab}</text>`;
      series.forEach(s => {
        if (!s.pts.length) return;
        const step = Math.max(1, Math.floor(s.pts.length / 700));
        let p = '';
        for (let i = 0; i < s.pts.length; i += step) p += `${px(s.pts[i][0]).toFixed(1)},${py(s.pts[i][1]).toFixed(1)} `;
        const lastP = s.pts[s.pts.length - 1];
        p += `${px(lastP[0]).toFixed(1)},${py(lastP[1]).toFixed(1)}`;
        g += `<polyline class="${s.cls || 'ch-line'}" stroke="${s.color}" points="${p}"/>`;
      });
      dots.forEach(d => { g += `<circle class="ch-dot" cx="${px(d[0])}" cy="${py(d[1])}" r="3.2" fill="${d[2] || 'var(--accent)'}"/>`; });
      if (peak) g += `<circle cx="${px(peak[0])}" cy="${py(peak[1])}" r="6" fill="none" stroke="var(--bad)" stroke-width="2"/><text x="${px(peak[0])}" y="${py(peak[1]) - 10}" text-anchor="middle" font-size="11" fill="var(--bad)" font-weight="700">${peak[2] || 'สูงสุด'}</text>`;
      if (pick) g += `<circle class="ch-pick" cx="${px(pick[0])}" cy="${py(pick[1])}" r="8"/>`;
      svg.innerHTML = g;
    };
  }

  /* ---------- ตารางบันทึกผล ---------- */
  function makeTable(wrap, cols) {
    const thead = wrap.querySelector('thead'), tbody = wrap.querySelector('tbody'), empty = wrap.querySelector('.rec-empty');
    thead.innerHTML = `<tr>${cols.map(c => `<th>${c.h}</th>`).join('')}</tr>`;
    return {
      clear() { tbody.innerHTML = ''; empty.hidden = false; },
      add(r, i, cls = '') {
        empty.hidden = true;
        const tr = document.createElement('tr');
        tr.dataset.i = i;
        tr.className = `new ${cls}`;
        tr.innerHTML = cols.map(c => `<td>${c.f(r, i)}</td>`).join('');
        tbody.appendChild(tr);
        wrap.scrollTop = wrap.scrollHeight;
        return tr;
      },
      mark(i, cls, on = true) { const tr = tbody.querySelector(`tr[data-i="${i}"]`); if (tr) tr.classList.toggle(cls, on); },
      unmarkAll(cls) { tbody.querySelectorAll(`tr.${cls}`).forEach(tr => tr.classList.remove(cls)); }
    };
  }

  function downloadCSV(name, head, rows) {
    const esc = v => `"${String(v).replace(/"/g, '""')}"`;
    const csv = '﻿' + [head, ...rows].map(r => r.map(esc).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function matButtons(box, keys, onPick) {
    box.innerHTML = keys.map(k => `<button type="button" data-m="${k}"><i style="background:${MATS[k].c}"></i>${MATS[k].name}</button>`).join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('button[data-m]');
      if (b && !b.disabled) onPick(b.dataset.m);
    });
    return k => box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.m === k));
  }

  /* =====================================================================
     เครื่องทดสอบอเนกประสงค์ (Universal Testing Machine) แบบรุ่น WP311
     ===================================================================== */
  const UTM_YC = { tension: 158, compression: 200, shear: 170 };
  function utmSVG(jig, labels = false) {
    const YC = UTM_YC[jig];
    let upper = '', lower = '';
    if (jig === 'tension') {
      upper = `<rect x="124" y="${YC + 16}" width="48" height="46" rx="4" fill="url(#gDark)"/>
        <rect x="134" y="${YC + 20}" width="28" height="38" rx="2" fill="#262b33"/>
        <line x1="172" y1="${YC + 40}" x2="188" y2="${YC + 30}" stroke="#262b33" stroke-width="4" stroke-linecap="round"/><circle cx="190" cy="${YC + 29}" r="6" fill="#1b1e23"/>`;
      lower = `<rect x="124" y="296" width="48" height="46" rx="4" fill="url(#gDark)"/>
        <rect x="134" y="300" width="28" height="38" rx="2" fill="#262b33"/>
        <line x1="172" y1="318" x2="188" y2="308" stroke="#262b33" stroke-width="4" stroke-linecap="round"/><circle cx="190" cy="307" r="6" fill="#1b1e23"/>`;
    } else if (jig === 'compression') {
      upper = `<rect x="138" y="${YC + 16}" width="20" height="16" fill="url(#gCol)"/><rect x="112" y="${YC + 30}" width="72" height="16" rx="3" fill="url(#gCol)" stroke="#6d7785"/>`;
      lower = `<rect x="112" y="322" width="72" height="20" rx="3" fill="url(#gCol)" stroke="#6d7785"/>`;
    } else {
      upper = `<rect x="134" y="${YC + 16}" width="28" height="${312 - YC - 16}" rx="3" fill="url(#gPeach)" stroke="#9a4f1f"/>
        <circle cx="148" cy="290" r="7" fill="#7a3a12" opacity=".35"/>`;
      lower = `<path d="M108 262 h28 v56 h24 v-56 h28 v80 h-80z" fill="url(#gTeal)" stroke="#1f6c7e"/>`;
    }
    const lab = (x, y, t, lx, ly, anchor = 'end') =>
      `<line class="mach-line" x1="${lx}" y1="${ly}" x2="${x + (anchor === 'end' ? 4 : -4)}" y2="${y - 4}"/><text class="mach-label" x="${x}" y="${y}" text-anchor="${anchor}">${t}</text>`;
    const labelsSVG = !labels ? '' : `
      ${lab(32, 52, 'กระบอกสูบไฮดรอลิกส์', 118, 52)}
      ${lab(32, 108, 'แท่นยึดด้านบน (คงที่)', 40, 104)}
      ${lab(32, YC + 12, 'แท่นขวางบน (เลื่อนได้)', 44, YC + 8)}
      ${lab(32, YC + 46, 'หัวจับยึดชิ้นทดสอบ', 124, YC + 40)}
      ${lab(32, 266, 'ชิ้นทดสอบ', 141, 258)}
      ${lab(32, 352, 'เซลล์วัดแรง', 128, 350)}
      ${lab(32, 382, 'แท่นขวางล่าง', 44, 370)}
      ${lab(282, 132, 'เซนเซอร์ตรวจจับระยะ', 246, 136, 'start')}
      ${lab(282, 222, 'ตู้ควบคุม', 320, 236, 'start')}`;
    return `<svg viewBox="${labels ? '-150 0 550 450' : '0 0 400 450'}" role="img" aria-label="เครื่องทดสอบอเนกประสงค์">
      <rect x="24" y="424" width="252" height="16" rx="3" fill="#5d6876"/>
      <rect x="30" y="438" width="22" height="8" fill="#3b434e"/><rect x="248" y="438" width="22" height="8" fill="#3b434e"/>
      <rect x="56" y="100" width="12" height="326" fill="url(#gCol)"/><rect x="228" y="100" width="12" height="326" fill="url(#gCol)"/>
      ${[384, 392, 400, 408, 416].map(y => `<line x1="56" y1="${y}" x2="68" y2="${y + 3}" stroke="#6b7685"/><line x1="228" y1="${y}" x2="240" y2="${y + 3}" stroke="#6b7685"/>`).join('')}
      ${jig === 'shear' ? '' : '<g class="m-spec"></g>'}
      <g class="m-move">
        <rect x="141" y="40" width="14" height="${YC - 40}" fill="url(#gCol)"/>
        <rect x="243" y="${YC - 44}" width="4" height="46" fill="#c9ced6"/>
        <rect x="44" y="${YC}" width="208" height="16" rx="3" fill="url(#gBlue)"/>
        <rect x="50" y="${YC - 3}" width="24" height="22" rx="3" fill="#24548f"/><rect x="222" y="${YC - 3}" width="24" height="22" rx="3" fill="#24548f"/>
        ${upper}
      </g>
      <rect x="40" y="96" width="216" height="18" rx="3" fill="url(#gBlue)"/>
      <rect x="112" y="12" width="72" height="12" rx="3" fill="#8a3412"/>
      <rect x="118" y="22" width="60" height="76" rx="4" fill="url(#gOr)"/>
      <line x1="118" y1="44" x2="178" y2="44" stroke="#8a3412"/><line x1="118" y1="76" x2="178" y2="76" stroke="#8a3412"/>
      <path d="M178 34 C 230 34, 268 40, 268 80 L268 300 L282 300" fill="none" stroke="#262b33" stroke-width="3"/>
      <rect x="239" y="114" width="12" height="40" rx="2" fill="#30353d"/>
      <rect x="44" y="360" width="208" height="16" rx="3" fill="url(#gBlue)"/>
      <rect x="50" y="357" width="24" height="22" rx="3" fill="#24548f"/><rect x="222" y="357" width="24" height="22" rx="3" fill="#24548f"/>
      <rect x="128" y="342" width="40" height="18" rx="3" fill="#f2b705" stroke="#b38600"/>
      <path d="M168 351 C 200 351, 220 400, 300 400" fill="none" stroke="#262b33" stroke-width="2"/>
      ${lower}
      ${jig === 'shear' ? '<g class="m-spec"></g>' : ''}
      <rect x="282" y="236" width="110" height="184" rx="6" fill="#d8dde4" stroke="#8a95a3"/>
      <rect x="282" y="236" width="110" height="14" rx="6" fill="#2f6db5"/>
      <text x="337" y="247" text-anchor="middle" font-size="9" fill="#fff" font-weight="700">WP 311</text>
      <rect class="lcd" x="292" y="258" width="90" height="30" rx="3"/><text class="lcd-u" x="296" y="267">FORCE kN</text>
      <text class="lcd-t m-F" x="378" y="284" text-anchor="end">0.00</text>
      <rect class="lcd" x="292" y="294" width="90" height="30" rx="3"/><text class="lcd-u" x="296" y="303">DISPL. mm</text>
      <text class="lcd-t m-D" x="378" y="320" text-anchor="end">0.000</text>
      <circle cx="302" cy="340" r="5" fill="#4a5260"/><circle cx="318" cy="340" r="5" fill="#4a5260"/><circle cx="334" cy="340" r="5" class="m-led" fill="#4a5260"/>
      <circle cx="368" cy="345" r="12" fill="#d62828" stroke="#7a1010" stroke-width="2"/><text x="368" y="364" text-anchor="middle" font-size="6.5" fill="#333">EMERGENCY</text>
      <circle cx="302" cy="392" r="9" fill="#2a2f36"/><circle cx="328" cy="392" r="9" fill="#2a2f36"/>
      <rect x="350" y="380" width="26" height="22" rx="3" fill="#1b1e23"/><rect x="356" y="384" width="14" height="8" fill="#e9ecef"/>
      ${labelsSVG}
    </svg>`;
  }

  /* ---------- วาดชิ้นทดสอบในเครื่อง ---------- */
  function specTension(mk, v, neck, broken, brittle) {
    // v = ระยะที่แท่นขวางบนเลื่อนขึ้น (px), neck = 0..1
    const cx = 148, YC = UTM_YC.tension;
    const top = YC + 22 - v, sh1 = YC + 62 - v, sh2 = 296, bot = 338;
    const we = 22, wr = 11;
    const mid = (sh1 + sh2) / 2;
    const wn = wr * (1 - 0.45 * neck);
    const fill = `url(#gm-${mk}-h)`, stroke = MATS[mk].d;
    const side = (s) => {
      // ขอบด้านหนึ่งของชิ้นงาน (s = -1 ซ้าย, +1 ขวา)
      const xe = cx + s * we / 2, xr = cx + s * wr / 2, xn = cx + s * wn / 2;
      return { xe, xr, xn };
    };
    const L = side(-1), Rr = side(1);
    const body = (y0, y1, part) => {
      // part: 'all' | 'top' | 'bot'
      let d = '';
      if (part !== 'bot') d += `M${L.xe} ${top} L${Rr.xe} ${top} L${Rr.xe} ${sh1} Q${Rr.xr} ${sh1} ${Rr.xr} ${sh1 + 8}`;
      if (part === 'all') {
        d += ` L${Rr.xr} ${mid - 16} Q${Rr.xn} ${mid} ${Rr.xr} ${mid + 16} L${Rr.xr} ${sh2 - 8} Q${Rr.xr} ${sh2} ${Rr.xe} ${sh2} L${Rr.xe} ${bot} L${L.xe} ${bot} L${L.xe} ${sh2} Q${L.xr} ${sh2} ${L.xr} ${sh2 - 8} L${L.xr} ${mid + 16} Q${L.xn} ${mid} ${L.xr} ${mid - 16} L${L.xr} ${sh1 + 8} Q${L.xr} ${sh1} ${L.xe} ${sh1} Z`;
      } else if (part === 'top') {
        d += ` L${Rr.xr} ${mid - 16} Q${Rr.xn} ${mid - 3} ${Rr.xn} ${mid - 2}` + (brittle ? ` L${cx + 2} ${mid} L${L.xn} ${mid - 3}` : ` L${cx + 3} ${mid + 2} L${cx - 1} ${mid - 3} L${L.xn} ${mid - 1}`) + ` Q${L.xr} ${mid - 6} ${L.xr} ${mid - 16} L${L.xr} ${sh1 + 8} Q${L.xr} ${sh1} ${L.xe} ${sh1} Z`;
      } else {
        const o = 0;
        d += `M${L.xe} ${bot} L${Rr.xe} ${bot} L${Rr.xe} ${sh2} Q${Rr.xr} ${sh2} ${Rr.xr} ${sh2 - 8} L${Rr.xr} ${mid + 16} Q${Rr.xn} ${mid + 3 + o} ${Rr.xn} ${mid + 2}` + (brittle ? ` L${cx + 2} ${mid + 1} L${L.xn} ${mid + 4}` : ` L${cx + 3} ${mid + 6} L${cx - 1} ${mid + 1} L${L.xn} ${mid + 3}`) + ` Q${L.xr} ${mid + 6} ${L.xr} ${mid + 16} L${L.xr} ${sh2 - 8} Q${L.xr} ${sh2} ${L.xe} ${sh2} Z`;
      }
      return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`;
    };
    const gm1 = sh1 + 12 + (mid - sh1 - 12) * 0.15, gm2 = sh2 - 12 - (sh2 - mid - 12) * 0.15;
    const marks = (a, b) => `<line x1="${cx - 9}" y1="${a}" x2="${cx + 9}" y2="${a}" stroke="var(--accent)" stroke-width="2"/><line x1="${cx - 9}" y1="${b}" x2="${cx + 9}" y2="${b}" stroke="var(--accent)" stroke-width="2"/>`;
    if (!broken) return body(0, 0, 'all') + marks(gm1, gm2);
    // ขาดแล้ว: ท่อนบนลอยขึ้นตามหัวจับ
    return `<g transform="translate(0 -5)">${body(0, 0, 'top')}<line x1="${cx - 9}" y1="${gm1}" x2="${cx + 9}" y2="${gm1}" stroke="var(--accent)" stroke-width="2"/></g>`
      + body(0, 0, 'bot') + `<line x1="${cx - 9}" y1="${gm2}" x2="${cx + 9}" y2="${gm2}" stroke="var(--accent)" stroke-width="2"/>`;
  }

  function specCompression(mk, e, cracked, h0, d0) {
    const cx = 148, base = 322, hp = 76, sc = hp / h0;
    const w0 = Math.min(64, d0 * sc), h = hp * (1 - e);
    const k = 1 / Math.sqrt(Math.max(0.2, 1 - e));
    const brittle = !!MATS[mk].brittle;
    const wm = w0 * k * (brittle ? 1 : 1 + 0.22 * e), we = w0 * k * (brittle ? 1 : 1 - 0.2 * e);
    const top = base - h, mid = base - h / 2;
    const cL = cx - wm + we / 2, cR = cx + wm - we / 2;
    const d = `M${cx - we / 2} ${top} L${cx + we / 2} ${top} Q${cR} ${mid} ${cx + we / 2} ${base} L${cx - we / 2} ${base} Q${cL} ${mid} ${cx - we / 2} ${top} Z`;
    let s = `<path d="${d}" fill="url(#gm-${mk}-h)" stroke="${MATS[mk].d}" stroke-width="1.2"/>`;
    s += `<ellipse cx="${cx}" cy="${top}" rx="${we / 2}" ry="2.5" fill="${MATS[mk].c}" stroke="${MATS[mk].d}" stroke-width=".8"/>`;
    if (cracked) {
      s += `<path d="M${cx - we / 2 + 2} ${top + 4} L${cx + we / 2 - 3} ${base - 5}" stroke="#111" stroke-width="2.2"/><path d="M${cx - we / 2 + 5} ${top + 2} L${cx + 2} ${mid}" stroke="#111" stroke-width="1"/>`;
    }
    // เส้นบอกความสูง h
    const xd = 200;
    s += `<line x1="${xd}" y1="${top}" x2="${xd}" y2="${base}" stroke="var(--brand)" stroke-width="1.5" marker-start="url(#mArr)" marker-end="url(#mArr)"/>`;
    s += `<text x="${xd + 6}" y="${mid + 4}" font-size="12" font-weight="700" fill="var(--brand)">h</text>`;
    return s;
  }

  function specShear(mk, v, broken) {
    // หมุดชิ้นทดสอบวางแนวนอนผ่านแท่นรองรับ 2 ข้าง (ซ้าย/ขวา) และตัวกลางที่ถูกดึงขึ้น
    const y = 290, r = 6, x0 = 100, x1 = 136, x2 = 160, x3 = 196;
    const fill = `url(#gm-${mk}-v)`, st = MATS[mk].d;
    if (!broken) {
      const d = `M${x0} ${y - r} L${x1 - 1} ${y - r} L${x1 + 2} ${y - r - v} L${x2 - 2} ${y - r - v} L${x2 + 1} ${y - r} L${x3} ${y - r}
        A3 ${r} 0 0 1 ${x3} ${y + r} L${x2 + 1} ${y + r} L${x2 - 2} ${y + r - v} L${x1 + 2} ${y + r - v} L${x1 - 1} ${y + r} L${x0} ${y + r} A3 ${r} 0 0 1 ${x0} ${y - r} Z`;
      return `<path d="${d}" fill="${fill}" stroke="${st}" stroke-width="1.2"/>`;
    }
    const piece = (a, b, dy) => `<rect x="${a}" y="${y - r + dy}" width="${b - a}" height="${2 * r}" rx="3" fill="${fill}" stroke="${st}" stroke-width="1.2"/>`;
    return piece(x0, x1 - 1, 0) + piece(x1 + 2, x2 - 2, -v - 6) + piece(x2 + 1, x3, 0)
      + `<text x="148" y="${y + 24}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--bad)">ขาด 2 รอย!</text>`;
  }

  /* ---------- ภาพขยายชิ้นทดสอบแรงดึง (แนวนอน) ---------- */
  function zoomTension(svg, mk, eps, Lo, neck, broken) {
    const x0 = 20, xg = 95, G0 = 330, G = G0 * (1 + eps), xe = xg + G, xr = xe + 75, xm = (xg + xe) / 2;
    const top = 34 + neck * 7, bot = 56 - neck * 7;
    const fill = `url(#gm-${mk}-v)`, st = MATS[mk].d;
    const d = `M${x0} 23 L${x0 + 60} 23 Q${x0 + 68} 34 ${xg} 34 L${xm - 34} 34 Q${xm} ${top} ${xm + 34} 34 L${xe} 34 Q${xe + 7} 34 ${xe + 15} 23 L${xr} 23
      L${xr} 67 L${xe + 15} 67 Q${xe + 7} 56 ${xe} 56 L${xm + 34} 56 Q${xm} ${bot} ${xm - 34} 56 L${xg} 56 Q${x0 + 68} 56 ${x0 + 60} 67 L${x0} 67 Z`;
    const m1 = xg + 25, m2 = xe - 25;
    let s = `<path d="${d}" fill="${fill}" stroke="${st}" stroke-width="1.3"/>`;
    if (broken) s += `<rect x="${xm - 4}" y="18" width="8" height="54" fill="var(--surface)"/><path d="M${xm - 4} ${top} l3 4 -3 4 3 4 -3 4" fill="none" stroke="${st}"/><path d="M${xm + 4} ${top} l-3 4 3 4 -3 4 3 4" fill="none" stroke="${st}"/>`;
    s += `<line x1="${m1}" y1="29" x2="${m1}" y2="61" stroke="var(--accent)" stroke-width="2.5"/><line x1="${m2}" y1="29" x2="${m2}" y2="61" stroke="var(--accent)" stroke-width="2.5"/>`;
    s += `<line x1="${m1}" y1="82" x2="${m2}" y2="82" stroke="var(--brand)" stroke-width="1.5" marker-start="url(#mArr)" marker-end="url(#mArr)"/>`;
    const Lnow = Lo * (1 + eps);
    s += `<text x="${(m1 + m2) / 2}" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="var(--brand)">${eps > 0 ? `L = ${N(Lnow, 2)} mm (เดิม L<tspan dy="3" font-size="9">o</tspan><tspan dy="-3"> = ${N(Lo, 2)} mm)</tspan>` : `ความยาวพิกัด L<tspan dy="3" font-size="9">o</tspan><tspan dy="-3"> = ${N(Lo, 2)} mm</tspan>`}</text>`;
    svg.setAttribute('viewBox', '0 0 720 108');
    svg.innerHTML = s;
  }

  /* ===================================================================
     ตัวสร้างห้องทดลองที่ใช้เครื่องทดสอบอเนกประสงค์ (ดึง / อัด / เฉือนตรง)
     =================================================================== */
  function utmLab(root, K) {
    const st = { mat: K.mats[0], runs: [], recs: [], pick: -1, sp: 16, phase: 'setup' };
    root.innerHTML = `
      <div class="lab-top"><h3>🔬 ${K.title}</h3><span class="lab-sub">${K.sub}</span></div>
      <div class="lab-body">
        <div class="lab-panel">
          <p class="lab-step"><span class="n">1</span>เลือกวัสดุ และเตรียมชิ้นทดสอบ</p>
          <div class="mat-pick"></div><p class="mat-note"></p>
          <div class="lab-inputs setup-in">${K.inputs}</div>
          <div class="lf-list setup-lf"></div>
        </div>
        <div class="lab-panel">
          <p class="lab-step"><span class="n">2</span>ตั้งค่าเครื่องทดสอบอเนกประสงค์ (ตามใบงานข้อ 6–7)</p>
          <div class="lab-inputs">
            <label>แรงสูงสุดที่ตั้งไว้ (หมุนปุ่มหมายเลข 5)<select name="fmax">${K.fmax.map(f => `<option value="${f[0]}"${f[2] ? ' selected' : ''}>${f[1]}</option>`).join('')}</select></label>
            <label>ความเร็วในการทดสอบ (ปุ่มหมายเลข 4)<input value="2 mm/min" disabled></label>
          </div>
          <div class="lf-list fmax-lf"></div>
        </div>
        <div class="lab-row r-machine">
          <div class="mach-box">${utmSVG(K.jig)}${K.zoom ? '<svg class="spec-zoom" viewBox="0 0 720 108" aria-label="ภาพขยายชิ้นทดสอบ"></svg>' : ''}</div>
          <div>
            <p class="lab-step"><span class="n">3</span>${K.runStep}</p>
            <div class="readouts">
              <div class="ro">${K.fLabel} (kN)<b class="r-F">0.00</b></div>
              <div class="ro">${K.dLabel} (mm)<b class="r-D">0.000</b></div>
              <div class="ro alt">เวลาทดสอบจริง (นาที:วินาที)<b class="r-T">0:00</b></div>
              <div class="ro alt">${K.fLabel}สูงสุด (kN)<b class="r-P">0.00</b></div>
            </div>
            <div class="lf-list live-lf"></div>
            <div class="ctrl">
              <button type="button" class="btn btn-go b-start">▶ ${K.startText}</button>
              <button type="button" class="btn btn-line b-pause" disabled>⏸ หยุดชั่วคราว</button>
              <button type="button" class="btn btn-line b-mark" disabled>📌 บันทึกค่าตอนนี้</button>
              <button type="button" class="btn btn-line b-reset">↺ เริ่มใหม่</button>
            </div>
            <div class="speed">ความเร็วจำลอง: <button type="button" data-sp="40">ช้า</button><button type="button" class="on" data-sp="16">ปกติ</button><button type="button" data-sp="6">เร็ว</button></div>
            <div class="status">เลือกวัสดุและขนาดชิ้นทดสอบ แล้วกดปุ่ม “${K.startText}”</div>
          </div>
        </div>
        <div class="lab-row">
          <div>
            <p class="lab-step"><span class="n">4</span>กราฟที่เครื่องพิมพ์ออกมา</p>
            <div class="chart-box">
              <div class="ch-head"><div class="tabs ch-mode">${K.charts.map((c, i) => `<button type="button" data-c="${i}"${i ? '' : ' class="on"'}>${c.name}</button>`).join('')}</div>
                <button type="button" class="btn btn-line btn-sm b-clear" hidden>ล้างเส้นกราฟเก่า</button></div>
              <svg class="chart" role="img" aria-label="กราฟผลการทดสอบ"></svg>
              <div class="legend"></div>
            </div>
          </div>
          <div>
            <p class="lab-step"><span class="n">5</span>ตารางบันทึกผลการทดลอง</p>
            <div class="rec-wrap"><table><thead></thead><tbody></tbody></table><div class="rec-empty">กดเริ่มทดสอบ แล้วค่าจะถูกบันทึกลงตารางให้อัตโนมัติ</div></div>
            <div class="rec-tools"><span class="rec-note"></span><button type="button" class="btn btn-line btn-sm b-csv" disabled>⬇ ดาวน์โหลดตาราง (เปิดด้วย Excel)</button></div>
          </div>
        </div>
        <div class="lab-panel">
          <p class="lab-step"><span class="n">6</span>คำนวณผลการทดลอง (แทนค่าในสูตรให้ดูทุกขั้น)</p>
          <div class="res"><p class="muted" style="margin:0">ทดสอบให้เสร็จก่อน ผลการคำนวณจะแสดงที่นี่</p></div>
        </div>
      </div>`;

    const q = s => root.querySelector(s);
    const svgMove = q('.m-move'), svgSpec = q('.m-spec'), lcdF = q('.m-F'), lcdD = q('.m-D'), led = q('.m-led');
    const zoom = q('.spec-zoom');
    const chartDraw = makeChart(q('.chart'));
    const table = makeTable(q('.rec-wrap'), K.cols);
    const status = (t, cls = '') => { const s = q('.status'); s.className = `status ${cls}`; s.innerHTML = t; };
    let chartMode = 0;

    const setMat = matButtons(q('.mat-pick'), K.mats, k => { if (st.phase !== 'setup') return; st.mat = k; refreshSetup(); });

    function readDims() {
      const v = {};
      root.querySelectorAll('.setup-in input, .setup-in select').forEach(i => { v[i.name] = i.tagName === 'SELECT' ? i.value : parseFloat(i.value); });
      v.fmax = parseFloat(q('select[name=fmax]').value);
      return v;
    }
    function refreshSetup() {
      setMat(st.mat);
      q('.mat-note').textContent = `${MATS[st.mat].name}: ${MATS[st.mat].note}`;
      const v = readDims();
      const r = K.setup(v, MATS[st.mat], root);
      q('.setup-lf').innerHTML = r.html;
      q('.fmax-lf').innerHTML = r.fmaxHtml || '';
      st.dims = r.dims;
      st.valid = r.ok;
      q('.b-start').disabled = !r.ok || st.phase === 'done';
      drawIdle();
    }
    root.querySelector('.setup-in').addEventListener('input', e => { if (K.onInput) K.onInput(e, root); refreshSetup(); });
    root.querySelector('.setup-in').addEventListener('change', e => { if (K.onInput) K.onInput(e, root); refreshSetup(); });
    q('select[name=fmax]').addEventListener('change', refreshSetup);
    q('.speed').addEventListener('click', e => {
      const b = e.target.closest('button[data-sp]'); if (!b) return;
      st.sp = +b.dataset.sp;
      q('.speed').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    });
    q('.ch-mode').addEventListener('click', e => {
      const b = e.target.closest('button[data-c]'); if (!b) return;
      chartMode = +b.dataset.c;
      q('.ch-mode').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      redrawChart();
    });
    q('.b-clear').addEventListener('click', () => { st.runs = []; q('.b-clear').hidden = true; redrawChart(); });

    function lockSetup(on) {
      root.querySelectorAll('.setup-in input, .setup-in select, select[name=fmax]').forEach(i => { i.disabled = on; });
      q('.mat-pick').querySelectorAll('button').forEach(b => { b.disabled = on; });
    }

    function drawIdle() {
      if (st.phase !== 'setup') return;
      const z = K.visual(st, 0, null);
      svgMove.setAttribute('transform', `translate(0 ${z.move})`);
      svgSpec.innerHTML = z.spec;
      if (zoom && z.zoom) z.zoom(zoom);
      lcdF.textContent = '0.00'; lcdD.textContent = '0.000';
      q('.live-lf').innerHTML = K.live(st, 0, 0);
      redrawChart();
    }

    /* ---- เตรียมเส้นกราฟและวิ่งการทดสอบ ---- */
    function prepare() {
      const m = MATS[st.mat];
      const k = { s: jitter(0.03), d: jitter(0.08), E: jitter(0.02) };
      const c = K.curve(m, k, st.dims);
      // ตัดเมื่อถึงแรงสูงสุดที่ตั้งไว้
      const fmax = readDims().fmax;
      c.stop = c.end;
      for (let i = 1; i < c.y.length; i++) {
        if (c.y[i] >= fmax) {
          const t = (fmax - c.y[i - 1]) / (c.y[i] - c.y[i - 1]);
          c.x[i] = c.x[i - 1] + t * (c.x[i] - c.x[i - 1]);
          c.y[i] = fmax;
          if (c.e) c.e[i] = c.e[i - 1] + t * (c.e[i] - c.e[i - 1]);
          c.x.length = c.y.length = c.ph.length = i + 1;
          if (c.e) c.e.length = i + 1;
          c.stop = 'limit';
          break;
        }
      }
      const n = c.x.length;
      const xm = Math.max(...c.x) || 1, ym = Math.max(...c.y) || 1;
      c.S = new Float64Array(n);
      for (let i = 1; i < n; i++) c.S[i] = c.S[i - 1] + Math.hypot((c.x[i] - c.x[i - 1]) / xm, (c.y[i] - c.y[i - 1]) / ym);
      c.fmaxSet = fmax;
      c.recStep = Math.max(0.5, niceStep(ym / 28));
      c.dxRec = Math.max(0.05, niceStep(xm / 25));
      st.c = c; st.s = 0; st.i = 0; st.peak = 0; st.peakX = 0; st.recs = []; st.pick = -1;
      st.lastRecY = 0; st.lastRecX = 0;
      table.clear();
      q('.rec-note').textContent = `บันทึกอัตโนมัติทุกครั้งที่แรงเปลี่ยน ${tick(c.recStep)} kN หรือระยะเพิ่ม ${tick(c.dxRec)} mm`;
    }

    function at(fi) {
      const c = st.c;
      fi = Math.max(0, Math.min(c.x.length - 1, fi));
      const i = Math.floor(fi), t = fi - i, j = Math.min(c.x.length - 1, i + 1);
      return { x: c.x[i] + (c.x[j] - c.x[i]) * t, y: c.y[i] + (c.y[j] - c.y[i]) * t, ph: c.ph[i], e: c.e ? c.e[i] + (c.e[j] - c.e[i]) * t : 0, i };
    }
    function idxAtS(s) {
      const S = st.c.S;
      let lo = 0, hi = S.length - 1;
      if (s >= S[hi]) return hi;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (S[mid] <= s) lo = mid; else hi = mid; }
      return lo + (s - S[lo]) / ((S[hi] - S[lo]) || 1);
    }
    function record(x, y, cls = '') {
      if (st.recs.length > 400) return;
      const r = K.row(st, x, y);
      st.recs.push(r);
      table.add(r, st.recs.length - 1, cls);
      st.lastRecY = y; st.lastRecX = x;
    }
    function scanRecords(fromI, toFi) {
      const c = st.c, step = c.recStep;
      const end = Math.floor(toFi);
      for (let i = Math.max(1, fromI); i <= end; i++) {
        const y0 = c.y[i - 1], y1 = c.y[i];
        const lo = Math.min(y0, y1), hi = Math.max(y0, y1);
        const levels = [];
        for (let L = Math.ceil(lo / step - 1e-9) * step; L <= hi + 1e-9; L += step) {
          if (L > 0 && Math.abs(L - st.lastRecY) > 1e-6 && L > lo - 1e-9 && L < hi + 1e-9 && !(L === lo && y0 === lo)) levels.push(L);
        }
        if (y1 < y0) levels.reverse();
        for (const L of levels) {
          const t = (L - y0) / ((y1 - y0) || 1);
          record(c.x[i - 1] + t * (c.x[i] - c.x[i - 1]), L);
        }
        if (c.x[i] - st.lastRecX >= c.dxRec) record(c.x[i], c.y[i]);
      }
    }

    let raf = 0, last = 0;
    function frame(t) {
      if (st.phase !== 'run') return;
      const dt = Math.max(0, Math.min(0.05, (t - last) / 1000)); last = t;
      const S = st.c.S[st.c.S.length - 1];
      st.s = Math.min(S, st.s + dt / st.sp * S);
      const fi = idxAtS(st.s);
      scanRecords(st.i + 1, fi);
      st.i = Math.floor(fi);
      show(at(fi));
      if (st.s >= S) return finish();
      raf = requestAnimationFrame(frame);
    }

    function show(p, broken = false) {
      if (p.y > st.peak) { st.peak = p.y; st.peakX = p.x; }
      st.cur = p;
      const z = K.visual(st, p, broken);
      svgMove.setAttribute('transform', `translate(0 ${z.move})`);
      svgSpec.innerHTML = z.spec;
      if (zoom && z.zoom) z.zoom(zoom);
      lcdF.textContent = N(broken ? 0 : p.y, 2);
      lcdD.textContent = N(p.x, 3);
      q('.r-F').textContent = N(broken ? 0 : p.y, 2);
      q('.r-D').textContent = N(p.x, 3);
      q('.r-T').textContent = mmss(p.x / 2 * 60);
      q('.r-P').textContent = N(st.peak, 2);
      q('.live-lf').innerHTML = K.live(st, broken ? 0 : p.y, p.x);
      if (!broken) status(K.phaseText(p.ph, st), p.ph === 'neck' || p.ph === 'tear' ? 'warn' : '');
      redrawChart();
    }

    function chartData() {
      const C = K.charts[chartMode];
      const series = [], legend = [];
      st.runs.forEach(r => {
        series.push({ pts: r.x.map((x, i) => C.f(x, r.y[i], r.dims)), color: MATS[r.mat].line, cls: 'ch-old' });
        legend.push(`<span><i style="background:${MATS[r.mat].line}"></i>${MATS[r.mat].name} (ครั้งก่อน)</span>`);
      });
      let xmax = 0, ymax = 0;
      const cur = [];
      if (st.c && st.phase !== 'setup') {
        for (let i = 0; i <= Math.min(st.i, st.c.x.length - 1); i++) cur.push(C.f(st.c.x[i], st.c.y[i], st.dims));
        if (st.cur) cur.push(C.f(st.cur.x, st.cur.y, st.dims));
        series.push({ pts: cur, color: MATS[st.mat].line });
        legend.push(`<span><i style="background:${MATS[st.mat].line}"></i>${MATS[st.mat].name} (ครั้งนี้)</span>`);
        st.c.x.forEach((x, i) => { const p = C.f(x, st.c.y[i], st.dims); xmax = Math.max(xmax, p[0]); ymax = Math.max(ymax, p[1]); });
      }
      st.runs.forEach(r => r.x.forEach((x, i) => { const p = C.f(x, r.y[i], r.dims); xmax = Math.max(xmax, p[0]); ymax = Math.max(ymax, p[1]); }));
      if (!xmax) { const g = K.guess(st); const p = C.f(g[0], g[1], st.dims || {}); xmax = p[0]; ymax = p[1]; }
      const dots = st.recs.map(r => [...C.f(r.x, r.y, st.dims), MATS[st.mat].line]);
      const pick = st.pick >= 0 && st.recs[st.pick] ? C.f(st.recs[st.pick].x, st.recs[st.pick].y, st.dims) : null;
      const peak = st.phase === 'done' && st.peak > 0 ? [...C.f(st.peakX, st.peak, st.dims), K.peakName] : null;
      return { xmax: xmax * 1.04, ymax: ymax * 1.08, xlab: C.x, ylab: C.y, series, dots, pick, peak, legend };
    }
    function redrawChart() {
      const d = chartData();
      chartDraw(d);
      q('.legend').innerHTML = d.legend.join('');
    }

    function finish() {
      st.phase = 'done';
      cancelAnimationFrame(raf);
      const c = st.c, p = at(c.x.length - 1);
      const broken = c.stop !== 'limit' && K.breaks(c.stop);
      record(p.x, p.y, broken ? 'brk' : '');
      // เน้นแถวแรงสูงสุดในตาราง
      let pk = 0; st.recs.forEach((r, i) => { if (r.y > st.recs[pk].y) pk = i; });
      table.mark(pk, 'peak');
      show(p, broken);
      q('.b-pause').disabled = true; q('.b-mark').disabled = true; q('.b-start').disabled = true;
      q('.b-csv').disabled = false;
      led.setAttribute('fill', '#4a5260');
      status(K.endText(c.stop, st), c.stop === 'limit' ? 'warn' : 'ok');
      // หน้าจอแสดง PEA สลับกับค่าแรงสูงสุด (เหมือนกดปุ่ม P ที่เครื่องจริง)
      let flip = 0;
      clearInterval(st.peaTimer);
      st.peaTimer = setInterval(() => {
        if (st.phase !== 'done') return clearInterval(st.peaTimer);
        lcdF.textContent = (flip++ % 2) ? N(st.peak, 2) : 'PEA';
      }, 700);
      if (K.autoPick) st.pick = K.autoPick(st);
      if (st.pick >= 0) table.mark(st.pick, 'pick');
      q('.rec-wrap').classList.toggle('clickable', !!K.pickable);
      renderResults();
      redrawChart();
    }

    function renderResults() { q('.res').innerHTML = K.results(st); }
    q('.res').addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      st[b.dataset.act] = true;
      renderResults();
    });
    q('.rec-wrap').addEventListener('click', e => {
      if (!K.pickable || st.phase !== 'done') return;
      const tr = e.target.closest('tbody tr'); if (!tr) return;
      const i = +tr.dataset.i;
      if (!(st.recs[i] && st.recs[i].y > 0 && st.recs[i].x > 0)) return;
      table.unmarkAll('pick');
      st.pick = i; table.mark(i, 'pick');
      renderResults(); redrawChart();
    });

    q('.b-start').addEventListener('click', () => {
      if (st.phase === 'setup') {
        if (!st.valid) return;
        prepare();
        lockSetup(true);
      } else if (st.phase !== 'pause') return;
      st.phase = 'run';
      led.setAttribute('fill', '#3ddc84');
      q('.b-start').disabled = true; q('.b-pause').disabled = false; q('.b-mark').disabled = false;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    });
    q('.b-pause').addEventListener('click', () => {
      if (st.phase !== 'run') return;
      st.phase = 'pause'; cancelAnimationFrame(raf);
      q('.b-start').disabled = false; q('.b-start').textContent = '▶ ทดสอบต่อ';
      q('.b-pause').disabled = true;
      led.setAttribute('fill', '#ffb703');
      status('หยุดชั่วคราว (ปล่อยปุ่มที่เครื่อง) อ่านค่าบนหน้าจอได้ กด “ทดสอบต่อ” เพื่อเดินเครื่องต่อ', 'warn');
    });
    q('.b-mark').addEventListener('click', () => { if (st.cur && st.phase !== 'setup') record(st.cur.x, st.cur.y); });
    q('.b-reset').addEventListener('click', () => {
      cancelAnimationFrame(raf); clearInterval(st.peaTimer);
      if (st.phase === 'done' && st.c) {
        st.runs.push({ mat: st.mat, x: st.c.x.slice(), y: st.c.y.slice(), dims: st.dims });
        if (st.runs.length > 4) st.runs.shift();
        q('.b-clear').hidden = false;
      }
      st.phase = 'setup'; st.c = null; st.cur = null; st.recs = []; st.pick = -1; st.peak = 0;
      K.resetFlags && K.resetFlags(st);
      table.clear(); lockSetup(false);
      q('.b-start').textContent = `▶ ${K.startText}`;
      q('.b-pause').disabled = true; q('.b-mark').disabled = true; q('.b-csv').disabled = true;
      q('.r-F').textContent = '0.00'; q('.r-D').textContent = '0.000'; q('.r-T').textContent = '0:00'; q('.r-P').textContent = '0.00';
      q('.res').innerHTML = '<p class="muted" style="margin:0">ทดสอบให้เสร็จก่อน ผลการคำนวณจะแสดงที่นี่</p>';
      q('.rec-note').textContent = '';
      led.setAttribute('fill', '#4a5260');
      status(st.runs.length ? 'เส้นกราฟครั้งก่อนเก็บไว้ให้เปรียบเทียบแล้ว ลองเปลี่ยนวัสดุหรือขนาด แล้วกดเริ่มทดสอบอีกครั้ง' : `เลือกวัสดุและขนาดชิ้นทดสอบ แล้วกดปุ่ม “${K.startText}”`);
      refreshSetup();
    });
    q('.b-csv').addEventListener('click', () => {
      downloadCSV(`${K.file}-${MATS[st.mat].name}.csv`, K.cols.map(c => c.h.replace(/<[^>]+>/g, '')), st.recs.map((r, i) => K.cols.map(c => c.f(r, i).replace(/<[^>]+>/g, '').replace(/,/g, ''))));
    });

    if (K.init) K.init(root);
    refreshSetup();
  }

  /* ---------- ตาราง 2-1 ขนาดชิ้นทดสอบภาคตัดวงกลม ---------- */
  const T21 = [[12.5, 3.99, 20], [25, 5.64, 28], [50, 7.98, 40], [100, 11.28, 56], [150, 13.82, 69], [200, 15.96, 80], [400, 22.56, 113]];
  const T22 = [[3, 12], [6, 24], [12.5, 50], [25, 100]];

  /* ===== ใบงาน 2.1 งานทดสอบแรงดึง ===== */
  function tensileCurve(m, k) {
    const E = m.E * 1000 * k.E;
    const e = [], s = [], ph = [];
    const push = (a, b, p) => { e.push(a); s.push(b); ph.push(p); };
    if (m.brittle) {
      const su = m.su * k.s, ef = m.ef * k.d, t = Math.tanh(E * ef / su);
      for (let i = 0; i <= 500; i++) { const a = ef * i / 500; push(a, su * Math.tanh(E * a / su) / t, 'brit'); }
      return { e, s, ph, E, su, ef, sf: su, brittle: true };
    }
    const sy = m.sy * k.s, su = Math.max(m.su * k.s, sy * 1.03), eu = m.eu * k.d, ef = Math.max(m.ef * k.d, eu * 1.1), sf = m.sfr * su;
    if (m.drop) {
      const sUY = 1.07 * sy, e1 = sUY / E, eL = 0.018;
      for (let i = 0; i <= 120; i++) { const a = e1 * i / 120; push(a, E * a, a <= 0.85 * sy / E ? 'el' : 'el2'); }
      for (let i = 1; i <= 20; i++) { const t = i / 20; push(e1 + 0.0015 * t, sUY - (sUY - sy) * t, 'yield'); }
      for (let i = 1; i <= 80; i++) { const t = i / 80, a = e1 + 0.0015 + (eL - e1 - 0.0015) * t; push(a, sy * (1 + 0.006 * Math.sin(t * Math.PI * 7)), 'yield'); }
      for (let i = 1; i <= 500; i++) { const t = i / 500; push(eL + (eu - eL) * t, sy + (su - sy) * (1 - Math.pow(1 - t, 2.2)), 'hard'); }
    } else {
      const sp = 0.85 * sy, ep = sp / E;
      for (let i = 0; i <= 120; i++) { const a = ep * i / 120; push(a, E * a, 'el'); }
      const p = E * (eu - ep) / (su - sp);
      for (let i = 1; i <= 700; i++) {
        const t = Math.pow(i / 700, 2), a = ep + (eu - ep) * t;
        push(a, sp + (su - sp) * (1 - Math.pow(1 - t, p)), a < sy / E + 0.003 ? 'el2' : 'hard');
      }
    }
    for (let i = 1; i <= 400; i++) { const t = i / 400; push(eu + (ef - eu) * t, su - (su - sf) * Math.pow(t, 1.6), 'neck'); }
    return { e, s, ph, E, sy, su, eu, ef, sf };
  }

  function tensileLab(root) {
    const PH = {
      el: '<b>ช่วงยืดหยุ่น (0–a)</b> แรงกับระยะยืดเพิ่มขึ้นเป็นเส้นตรง (กฎของฮุก) ถ้าปล่อยแรงตอนนี้ ชิ้นงานจะกลับมายาวเท่าเดิม',
      el2: '<b>ใกล้พิกัดความยืดหยุ่น (a–b)</b> กราฟเริ่มไม่เป็นเส้นตรง ชิ้นงานกำลังจะเริ่มยืดแบบถาวร',
      yield: '<b>จุดคราก (c)</b> ชิ้นงานยืดออกได้เองโดยแรงแทบไม่เพิ่ม ตั้งแต่ตรงนี้ ปล่อยแรงแล้วชิ้นงานจะไม่กลับมายาวเท่าเดิม',
      hard: '<b>ช่วง c–d</b> ต้องเพิ่มแรงจึงจะยืดต่อได้ ชิ้นงานยืดออกเท่า ๆ กันตลอดความยาวพิกัด',
      neck: '<b>ช่วง d–e เกิดคอคอด!</b> เลยแรงสูงสุดแล้ว ชิ้นงานคอดลงเฉพาะจุดเดียว แรงที่อ่านได้ลดลง ใกล้ขาดแล้ว',
      brit: '<b>วัสดุเปราะ</b> ยืดได้น้อยมาก ไม่มีจุดครากและไม่เกิดคอคอดให้เห็น'
    };
    utmLab(root, {
      title: 'ห้องทดลองเสมือน · ใบงาน 2.1 งานทดสอบแรงดึง',
      sub: 'จุดประสงค์: ศึกษาความแข็งแรงดึง เปอร์เซ็นต์ความยืด และความสัมพันธ์ระหว่างแรงดึงกับระยะยืด',
      jig: 'tension', zoom: true, file: 'ใบงาน2.1-แรงดึง',
      mats: ['steel', 'al', 'brass', 'cu', 'ci', 'ss'],
      fLabel: 'แรงดึง', dLabel: 'ระยะยืด', peakName: 'Fu',
      runStep: 'ทดสอบ: กดปุ่ม ▲ (หมายเลข 6) ค้างไว้ เครื่องจะดึงชิ้นงานจนขาด',
      startText: 'เริ่มดึงชิ้นทดสอบ',
      fmax: [[20, '20 kN'], [40, '40 kN (ตามใบงาน)', 1], [50, '50 kN (เต็มพิกัดเครื่อง)'], [250, '250 kN (เครื่องขนาดใหญ่)']],
      inputs: `
        <label>รูปหน้าตัดชิ้นทดสอบ<select name="shape"><option value="round">วงกลม (ตาราง 2-1)</option><option value="rect">สี่เหลี่ยม (ตาราง 2-2 / ใบงาน)</option></select></label>
        <label class="in-round">ขนาดตามตาราง 2-1<select name="row">${T21.map((r, i) => `<option value="${i}"${i === 1 ? ' selected' : ''}>So = ${r[0]} mm² (d = ${r[1]} mm)</option>`).join('')}<option value="c">กำหนดเอง</option></select></label>
        <label class="in-round">เส้นผ่าศูนย์กลาง d (mm)<input type="number" name="d" step="0.01" min="1" max="30" value="5.64"></label>
        <label class="in-rect" hidden>ความกว้าง b (mm)<input type="number" name="b" step="0.1" min="1" max="30" value="3"></label>
        <label class="in-rect" hidden>ความหนา t (mm)<input type="number" name="t" step="0.1" min="0.5" max="30" value="3"></label>
        <label>ความยาวพิกัดเดิม L<sub>o</sub> (mm)<input type="number" name="Lo" step="0.1" min="5" max="200" value="28"></label>`,
      onInput(e, root) {
        const f = n => root.querySelector(`[name=${n}]`);
        const shape = f('shape').value;
        root.querySelectorAll('.in-round').forEach(x => { x.hidden = shape !== 'round'; });
        root.querySelectorAll('.in-rect').forEach(x => { x.hidden = shape !== 'rect'; });
        if (e.target.name === 'row' && f('row').value !== 'c') { const r = T21[+f('row').value]; f('d').value = r[1]; f('Lo').value = r[2]; }
        if (e.target.name === 'd') f('row').value = 'c';
        if (e.target.name === 'shape' && shape === 'rect') { const r = T22.find(x => x[0] === +f('b').value); if (r) f('Lo').value = r[1]; }
        if (e.target.name === 'shape' && shape === 'round') { f('row').dispatchEvent(new Event('change', { bubbles: true })); }
        if (e.target.name === 'b') { const r = T22.find(x => x[0] === +f('b').value); if (r) f('Lo').value = r[1]; }
      },
      setup(v) {
        const round = v.shape === 'round';
        const ok = round ? v.d > 0 && v.Lo > 0 : v.b > 0 && v.t > 0 && v.Lo > 0;
        if (!ok) return { ok: false, html: '<div class="calc-err">⚠️ กรอกขนาดชิ้นทดสอบให้ครบ และต้องมากกว่า 0</div>' };
        const So = round ? Math.PI * v.d ** 2 / 4 : v.b * v.t;
        const Lr = 5.65 * Math.sqrt(So);
        let html = round
          ? LF('พื้นที่หน้าตัดก่อนทดสอบ', `S<sub>O</sub> = ${FR('π d²', '4')}`, `= ${FR(`π × ${v.d}²`, '4')}`, `= ${N(So)} mm²`, 'hl')
          : LF('พื้นที่หน้าตัดก่อนทดสอบ', 'S<sub>O</sub> = b × t', `= ${v.b} × ${v.t}`, `= ${N(So)} mm²`, 'hl');
        html += LF('ความยาวพิกัดตามมาตรฐาน (ใช้เมื่อขนาดไม่ตรงตาราง)', 'L<sub>o</sub> = 5.65 √S<sub>O</sub>', `= 5.65 × √${N(So)}`, `= ${N(Lr)} mm`);
        html += `<p class="small muted" style="margin:4px 0 0">ใบงานข้อ 2: ทำเครื่องหมาย 2 จุด ห่างจากกึ่งกลางชิ้นงานข้างละ ${N(v.Lo / 2, 1)} mm → ความยาวพิกัด L<sub>o</sub> = ${N(v.Lo, 1)} mm</p>`;
        return { ok: true, html, dims: { So, Lo: v.Lo, round, d: v.d, b: v.b, t: v.t } };
      },
      curve(m, k, D) {
        const c = tensileCurve(m, k);
        const x = c.e.map(e => e * D.Lo), y = c.s.map(s => s * D.So / 1000);
        return { x, y, ph: c.ph, e: c.e.slice(), meta: c, end: 'break' };
      },
      breaks: () => true,
      guess: st => { const m = MATS[st.mat]; return [(m.ef || 0.3) * (st.dims ? st.dims.Lo : 28), (m.su || 400) * (st.dims ? st.dims.So : 25) / 1000]; },
      visual(st, p, broken) {
        const D = st.dims || { Lo: 28 }, eps = p ? p.x / D.Lo : 0, M = st.c ? st.c.meta : null;
        let neck = 0;
        if (p && M && !M.brittle && p.ph === 'neck') neck = (eps - M.eu) / (M.ef - M.eu) * (st.mat === 'al' ? 0.7 : 1);
        const v = Math.min(eps, 0.6) * 76 * 0.8;
        return {
          move: -v,
          spec: specTension(st.mat, v, neck, broken, MATS[st.mat].brittle),
          zoom: svg => zoomTension(svg, st.mat, eps, D.Lo, neck, broken)
        };
      },
      live(st, F, x) {
        const D = st.dims; if (!D) return '';
        const s = F * 1000 / D.So, e = x / D.Lo;
        return LF('ความเค้นขณะนี้', `σ = ${FR('F', 'S<sub>O</sub>')}`, `= ${FR(`${N(F * 1000, 0)} N`, `${N(D.So)} mm²`)}`, `= ${N(s, 1)} MN/m²`)
          + LF('ความเครียดขณะนี้', `ε = ${FR('δ', 'L<sub>o</sub>')}`, `= ${FR(`${N(x, 3)} mm`, `${N(D.Lo, 2)} mm`)}`, `= ${N(e, 5)} (${N(e * 100, 2)} %)`);
      },
      phaseText: p => PH[p] || '',
      endText: (stop, st) => stop === 'limit'
        ? `⚠️ ถึงแรงสูงสุดที่ตั้งไว้ (${st.c.fmaxSet} kN) เครื่องหยุดเพื่อความปลอดภัย แต่ชิ้นงาน<b>ยังไม่ขาด</b> ลองเลือกชิ้นทดสอบที่เล็กลงหรือตั้งแรงสูงสุดให้มากขึ้น`
        : `✅ ชิ้นทดสอบขาดแล้ว! ${MATS[st.mat].brittle ? 'รอยขาดเรียบ ไม่มีคอคอด (วัสดุเปราะ)' : 'เกิดคอคอดก่อนขาด (วัสดุเหนียว)'} · หน้าจอแสดง “PEA” สลับกับแรงดึงสูงสุด`,
      row: (st, x, y) => ({ x, y }),
      cols: [
        { h: 'ครั้งที่', f: (r, i) => i + 1 },
        { h: 'แรงดึง (kN)', f: r => N(r.y, 2) },
        { h: 'ระยะยืด (mm)', f: r => N(r.x, 3) }
      ],
      charts: [
        { name: 'แรงดึง–ระยะยืด', x: 'ระยะยืด δ (mm)', y: 'แรงดึง F (kN)', f: (x, y) => [x, y] },
        { name: 'ความเค้น–ความเครียด', x: 'ความเครียด ε', y: 'ความเค้น σ (MN/m²)', f: (x, y, D) => [x / D.Lo, y * 1000 / D.So] }
      ],
      pickable: true,
      autoPick(st) {
        // เลือกแถวสุดท้ายที่ยังอยู่ในช่วงเส้นตรง สำหรับคำนวณ E
        const M = st.c.meta, lim = M.brittle ? 0.35 * M.su : 0.8 * M.sy;
        let best = -1;
        st.recs.forEach((r, i) => { if (r.x > 0 && r.y * 1000 / st.dims.So <= lim) best = i; });
        return best >= 0 ? best : (st.recs.length ? 0 : -1);
      },
      resetFlags: st => { st.measured = false; },
      results(st) {
        const D = st.dims, M = st.c.meta, m = MATS[st.mat];
        const Fu = st.peak, su = Fu * 1000 / D.So;
        const done = st.c.stop !== 'limit';
        let h = '<div class="result-grid"><div>';
        h += LF('1) ความแข็งแรงดึงสูงสุด', `σ<sub>u</sub> = ${FR('F<sub>u</sub>', 'S<sub>O</sub>')}`, `= ${FR(`${N(Fu * 1000, 0)} N`, `${N(D.So)} mm²`)}`, `= ${N(su, 1)} MN/m²`, 'hl');
        h += `<p class="small muted" style="margin:4px 2px 10px">= ${N(su * 1e6, 0)} N/m² · F<sub>u</sub> คือแรงดึงสูงสุด (แถวสีส้มในตาราง)${done ? '' : ' — ชิ้นงานยังไม่ขาด ค่านี้จึงยังไม่ใช่ความแข็งแรงสูงสุดจริง'}</p>`;
        if (done) {
          const Lu = D.Lo * (1 + M.ef - (M.brittle ? M.su : M.sf) / M.E);
          if (!st.measured) {
            h += `<div class="lf wait"><div class="lf-k">2) เปอร์เซ็นต์ความยืด (ใบงานข้อ 17)</div><div class="lf-row"><span class="lf-eq">ε<sub>t</sub> = ${FR('L<sub>u</sub> − L<sub>o</sub>', 'L<sub>o</sub>')} × 100</span>
              <button type="button" class="btn btn-accent btn-sm" data-act="measured">📏 นำชิ้นงาน 2 ท่อนมาต่อกันแล้ววัด L<sub>u</sub></button></div></div>`;
          } else {
            h += LF('ความยาวพิกัดหลังทดสอบ (วัดระยะระหว่างเครื่องหมาย)', 'L<sub>u</sub>', '', `= ${N(Lu, 2)} mm`);
            h += LF('2) เปอร์เซ็นต์ความยืด', `ε<sub>t</sub> = ${FR('L<sub>u</sub> − L<sub>o</sub>', 'L<sub>o</sub>')} × 100`, `= ${FR(`${N(Lu, 2)} − ${N(D.Lo, 2)}`, N(D.Lo, 2))} × 100`, `= ${N((Lu - D.Lo) / D.Lo * 100, 2)} %`, 'hl');
          }
        }
        h += '</div><div>';
        const r = st.recs[st.pick];
        if (r) {
          const s = r.y * 1000 / D.So, e = r.x / D.Lo, E = s / e;
          h += `<p class="small" style="margin:0 0 6px"><b>3) มอดุลัสของความยืดหยุ่น</b> ใช้แถวที่ ${st.pick + 1} ในตาราง (กรอบสีเขียว) <span class="muted">— แตะแถวอื่นที่ยังอยู่ช่วงเส้นตรงเพื่อเปลี่ยนได้</span></p>`;
          h += LF('ความเค้น ณ จุดนั้น', `σ = ${FR('F', 'S<sub>O</sub>')}`, `= ${FR(`${N(r.y * 1000, 0)}`, N(D.So))}`, `= ${N(s, 1)} MN/m²`);
          h += LF('ความเครียด ณ จุดนั้น', `ε = ${FR('δ', 'L<sub>o</sub>')}`, `= ${FR(N(r.x, 3), N(D.Lo, 2))}`, `= ${N(e, 5)}`);
          h += LF('มอดุลัสของความยืดหยุ่น', `E = ${FR('σ', 'ε')}`, `= ${FR(N(s, 1), N(e, 5))}`, `= ${N(E / 1000, 1)} GN/m²`, 'hl');
          const inLin = s <= (M.brittle ? 0.4 * M.su : 0.86 * M.sy);
          if (!inLin) h += '<div class="note note-warn" style="margin:8px 0 0"><b>⚠️</b>แถวที่เลือกเลยช่วงเส้นตรงไปแล้ว ค่า E ที่ได้จะต่ำกว่าความจริง ให้เลือกแถวที่แรงยังน้อยกว่าจุดคราก</div>';
        }
        h += '</div></div>';
        // สรุปผลและเทียบค่าอ้างอิง
        const ref = m.brittle ? `σ<sub>u</sub> ≈ ${m.su} MN/m² · ความยืด < 1 % · E ≈ ${m.E} GN/m²` : `σ<sub>u</sub> ≈ ${m.su} MN/m² · ความยืด ≈ ${Math.round(m.ef * 100)} % · E ≈ ${m.E} GN/m²`;
        h += `<div class="conclude"><b>📝 สรุปผล:</b>${m.name} ${done ? `มีความแข็งแรงดึงสูงสุด ${N(su, 1)} MN/m²` : 'ยังทดสอบไม่จบ'}
          ${done && st.measured ? `และยืดได้ ${N((D.Lo * (M.ef - (M.brittle ? M.su : M.sf) / M.E)) / D.Lo * 100, 1)} % ` : ''}
          ${m.brittle ? 'ขาดโดยแทบไม่ยืด ไม่มีจุดคราก จึงเป็น<b>วัสดุเปราะ</b>' : 'มีช่วงยืดแบบถาวรยาวและเกิดคอคอดก่อนขาด จึงเป็น<b>วัสดุเหนียว</b>'}
          <br><span class="small muted">ค่าอ้างอิงในตำรา: ${ref} (ผลแต่ละครั้งต่างกันเล็กน้อยเหมือนชิ้นงานจริง)</span>
          <br><span class="small muted">หมายเหตุ: เครื่องจริงวัดระยะจากการเลื่อนของหัวจับ ซึ่งรวมการยืดของเครื่องและการลื่นในหัวจับด้วย ค่า E จากห้องแล็บจริงจึงมักต่ำกว่าค่าในตำรา (เช่นตัวอย่าง 2.1)</span></div>`;
        return h;
      }
    });
  }

  /* ===== ใบงาน 2.2 งานทดสอบการอัด ===== */
  function compressionLab(root) {
    const PH = {
      el: '<b>ช่วงยืดหยุ่น</b> ชิ้นงานหดสั้นลงเล็กน้อย ถ้าปล่อยแรงจะคืนรูปเดิม',
      plastic: '<b>เกินพิกัดความยืดหยุ่น</b> ชิ้นงานเริ่มยุบตัวอย่างถาวร',
      barrel: '<b>ชิ้นงานป่องออกด้านข้าง</b> พื้นที่หน้าตัดเพิ่มขึ้น จึงต้องใช้แรงมากขึ้นเรื่อย ๆ กราฟไม่โค้งลงเหมือนการดึง',
      brit: '<b>วัสดุเปราะ</b> แทบไม่ยุบตัว รับแรงได้สูงจนกว่าจะแตก'
    };
    utmLab(root, {
      title: 'ห้องทดลองเสมือน · ใบงาน 2.2 งานทดสอบการอัด',
      sub: 'จุดประสงค์: ศึกษาความเค้นแรงอัดสูงสุด เปอร์เซ็นต์การยุบตัว และความสัมพันธ์ระหว่างแรงอัดกับระยะยุบ',
      jig: 'compression', zoom: false, file: 'ใบงาน2.2-แรงอัด',
      mats: ['cu', 'al', 'brass', 'steel', 'ci'],
      fLabel: 'แรงอัด', dLabel: 'ระยะยุบ', peakName: 'FB',
      runStep: 'ทดสอบ: กดปุ่ม ▼ (หมายเลข 7) ค้างไว้ แท่นขวางบนจะกดชิ้นงานลง',
      startText: 'เริ่มอัดชิ้นทดสอบ',
      fmax: [[40, '40 kN (ตามใบงาน)', 1], [100, '100 kN'], [300, '300 kN'], [1000, '1,000 kN (เครื่องขนาดใหญ่)']],
      inputs: `
        <label>ขนาดชิ้นทดสอบสำเร็จรูป<select name="pre"><option value="20,40" selected>⌀20 × 40 mm (ตามใบงาน)</option><option value="10,20">⌀10 × 20 mm (h = 2d)</option><option value="30,27">⌀30 × 27 mm (ASTM ขนาดสั้น)</option><option value="13,39">⌀13 × 39 mm (ASTM ขนาดกลาง)</option><option value="c">กำหนดเอง</option></select></label>
        <label>เส้นผ่าศูนย์กลาง d (mm)<input type="number" name="d" step="0.1" min="3" max="40" value="20"></label>
        <label>ความยาวก่อนทดสอบ h<sub>O</sub> (mm)<input type="number" name="h0" step="0.1" min="3" max="120" value="40"></label>`,
      onInput(e, root) {
        const f = n => root.querySelector(`[name=${n}]`);
        if (e.target.name === 'pre' && f('pre').value !== 'c') { const [d, h] = f('pre').value.split(','); f('d').value = d; f('h0').value = h; }
        if (e.target.name === 'd' || e.target.name === 'h0') f('pre').value = 'c';
      },
      setup(v, m) {
        if (!(v.d > 0 && v.h0 > 0)) return { ok: false, html: '<div class="calc-err">⚠️ กรอกขนาดชิ้นทดสอบให้ครบ และต้องมากกว่า 0</div>' };
        const So = Math.PI * v.d ** 2 / 4, ratio = v.h0 / v.d;
        const kind = ratio < 1.5 ? 'ขนาดสั้น (เหมาะกับโลหะแบริ่ง)' : ratio <= 4 ? 'ขนาดกลาง (ใช้ทั่วไป)' : 'ขนาดยาว (ใช้หามอดุลัส แต่ระวังโก่งงอ)';
        let html = LF('พื้นที่หน้าตัดก่อนทดสอบ', `S<sub>O</sub> = ${FR('π d²', '4')}`, `= ${FR(`π × ${v.d}²`, '4')}`, `= ${N(So)} mm²`, 'hl');
        html += LF('สัดส่วนความสูงต่อเส้นผ่าศูนย์กลาง (ตาราง 2-3)', `${FR('h<sub>O</sub>', 'd')}`, `= ${FR(v.h0, v.d)}`, `= ${N(ratio, 2)} → ${kind}`);
        const fmax = v.fmax;
        let fh = '';
        if (m.brittle) {
          const Fb = m.suc * So / 1000;
          fh = LF('แรงอัดที่คาดว่าจะทำให้ชิ้นงานแตก', `F ≈ σ<sub>c</sub> × S<sub>O</sub>`, `≈ ${m.suc} × ${N(So)}`, `≈ ${N(Fb, 1)} kN`);
          fh += `<p class="small ${Fb > fmax ? '' : 'muted'}" style="margin:4px 2px 0">${Fb > fmax ? `⚠️ มากกว่าแรงสูงสุดที่ตั้งไว้ ${fmax} kN เครื่องจะหยุดก่อนชิ้นงานแตก` : '✅ เครื่องมีแรงพอที่จะอัดจนชิ้นงานแตก'}</p>`;
        } else {
          const Fy = m.csy * So / 1000;
          fh = LF('แรงอัดที่ทำให้ชิ้นงานเริ่มยุบตัวถาวร', `F<sub>y</sub> ≈ σ<sub>y</sub> × S<sub>O</sub>`, `≈ ${m.csy} × ${N(So)}`, `≈ ${N(Fy, 1)} kN`);
          fh += `<p class="small" style="margin:4px 2px 0">${Fy > fmax ? `⚠️ มากกว่าแรงสูงสุดที่ตั้งไว้ ${fmax} kN → ชิ้นงานจะ<b>ไม่ยุบตัวถาวร</b> ลองเลือกชิ้นงานที่เล็กลง วัสดุที่นิ่มกว่า หรือเครื่องที่ใหญ่ขึ้น` : `เครื่องตั้งไว้ ${fmax} kN มากกว่าแรงนี้ ชิ้นงานจะยุบตัวได้ (อัดจนสูงเหลือ ⅓ หรือจนถึงแรงที่ตั้งไว้)`}</p>`;
        }
        return { ok: true, html, fmaxHtml: fh, dims: { So, h0: v.h0, d: v.d } };
      },
      curve(m, k, D) {
        const E = m.E * 1000 * k.E;
        const x = [], y = [], ph = [], e = [];
        if (m.brittle) {
          const su = m.suc * k.s, ef = m.efc * k.d, t = Math.tanh(E * ef / su);
          for (let i = 0; i <= 500; i++) { const a = ef * i / 500; e.push(a); x.push(a * D.h0); y.push(su * Math.tanh(E * a / su) / t * D.So / 1000); ph.push('brit'); }
          return { x, y, ph, e, meta: { E, brittle: true }, end: 'crack' };
        }
        const sy = m.csy * k.s, ey = sy / E, n = m.cn, e0 = m.ce0;
        for (let i = 0; i <= 900; i++) {
          const a = (2 / 3) * Math.pow(i / 900, 2.2);
          const et = -Math.log(1 - a);
          const s = et <= ey ? E * et : sy * Math.pow(1 + (et - ey) / e0, n);
          e.push(a); x.push(a * D.h0); y.push(s * D.So / (1 - a) / 1000);
          ph.push(et <= ey ? 'el' : a < 0.08 ? 'plastic' : 'barrel');
        }
        return { x, y, ph, e, meta: { E }, end: 'third' };
      },
      breaks: stop => stop === 'crack',
      guess: st => { const m = MATS[st.mat]; const D = st.dims || { h0: 40, So: 314 }; return m.brittle ? [m.efc * D.h0, m.suc * D.So / 1000] : [D.h0 * 0.67, Math.min(readFmax(root), m.csy * 3 * D.So / 1000)]; },
      visual(st, p, broken) {
        const D = st.dims || { h0: 40, d: 20 };
        const e = p ? p.x / D.h0 : 0;
        return { move: 76 * e, spec: specCompression(st.mat, e, broken, D.h0, D.d) };
      },
      live(st, F, x) {
        const D = st.dims; if (!D) return '';
        return LF('ความเค้นอัดขณะนี้', `σ<sub>c</sub> = ${FR('F', 'S<sub>O</sub>')}`, `= ${FR(`${N(F * 1000, 0)} N`, `${N(D.So)} mm²`)}`, `= ${N(F * 1000 / D.So, 1)} MN/m²`)
          + LF('ความสูงขณะนี้ และเปอร์เซ็นต์ที่ยุบ (ขณะมีแรงกด)', `h = h<sub>O</sub> − ระยะยุบ`, `= ${N(D.h0, 2)} − ${N(x, 3)} = ${N(D.h0 - x, 2)} mm`, `→ ${N(x / D.h0 * 100, 2)} %`);
      },
      phaseText: p => PH[p] || '',
      endText: (stop, st) => stop === 'limit' ? `⚠️ ถึงแรงสูงสุดที่ตั้งไว้ (${st.c.fmaxSet} kN) เครื่องหยุดเพื่อความปลอดภัย`
        : stop === 'crack' ? '✅ ชิ้นงานแตกเป็นแนวเฉียง (วัสดุเปราะ) หยุดการทดสอบ'
          : '✅ ชิ้นงานยุบตัวจนสูงเหลือ ⅓ ของความสูงเดิมแล้ว (วัสดุเหนียว) หยุดการทดสอบ',
      row: (st, x, y) => ({ x, y }),
      cols: [
        { h: 'ครั้งที่', f: (r, i) => i + 1 },
        { h: 'แรงอัด (kN)', f: r => N(r.y, 2) },
        { h: 'ระยะยุบ (mm)', f: r => N(r.x, 3) }
      ],
      charts: [
        { name: 'แรงอัด–ระยะยุบ', x: 'ระยะยุบ (mm)', y: 'แรงอัด F (kN)', f: (x, y) => [x, y] },
        { name: 'ความเค้นอัด–% การยุบตัว', x: 'เปอร์เซ็นต์การยุบตัว (%)', y: 'ความเค้นอัด σc (MN/m²)', f: (x, y, D) => [x / D.h0 * 100, y * 1000 / D.So] }
      ],
      resetFlags: st => { st.measured = false; },
      results(st) {
        const D = st.dims, c = st.c, m = MATS[st.mat];
        const FB = st.peak, sc = FB * 1000 / D.So;
        const eEnd = c.e[c.e.length - 1], hEnd = D.h0 * (1 - eEnd);
        const Aend = D.So / (1 - eEnd), rec = (c.y[c.y.length - 1] * 1000 / Aend) / c.meta.E * hEnd;
        const hL = m.brittle ? D.h0 * (1 - eEnd) + rec : Math.min(D.h0, hEnd + rec);
        let h = '<div class="result-grid"><div>';
        h += LF('1) ความเค้นแรงอัดสูงสุด', `σ<sub>c</sub> = ${FR('F<sub>B</sub>', 'S<sub>O</sub>')}`, `= ${FR(`${N(FB * 1000, 0)} N`, `${N(D.So)} mm²`)}`, `= ${N(sc, 1)} MN/m²`, 'hl');
        h += `<p class="small muted" style="margin:4px 2px 10px">= ${N(sc * 1e6, 0)} N/m² · F<sub>B</sub> = ${c.stop === 'crack' ? 'แรงอัดสูงสุดก่อนแตก' : c.stop === 'third' ? 'แรงอัดเมื่อชิ้นงานสูงเหลือ ⅓' : `แรงที่เครื่องหยุด (${c.fmaxSet} kN) — ยังไม่ใช่ค่าสูงสุดจริงของวัสดุ`}</p>`;
        h += '</div><div>';
        if (!st.measured) {
          h += `<div class="lf wait"><div class="lf-k">2) เปอร์เซ็นต์การยุบตัว (ใบงานข้อ 17)</div><div class="lf-row"><span class="lf-eq">ε<sub>c</sub> = ${FR('h<sub>O</sub> − h<sub>L</sub>', 'h<sub>O</sub>')} × 100</span>
            <button type="button" class="btn btn-accent btn-sm" data-act="measured">📏 ถอดชิ้นงานออกมาวัดความยาว h<sub>L</sub></button></div></div>`;
        } else {
          h += LF('ความยาวชิ้นงานหลังทดสอบ (วัดหลังปล่อยแรงแล้ว)', 'h<sub>L</sub>', '', `= ${N(hL, 2)} mm`);
          h += LF('2) เปอร์เซ็นต์การยุบตัว', `ε<sub>c</sub> = ${FR('h<sub>O</sub> − h<sub>L</sub>', 'h<sub>O</sub>')} × 100`, `= ${FR(`${N(D.h0, 2)} − ${N(hL, 2)}`, N(D.h0, 2))} × 100`, `= ${N((D.h0 - hL) / D.h0 * 100, 2)} %`, 'hl');
          if (hL > hEnd + 0.005) h += `<p class="small muted" style="margin:4px 2px 0">ระหว่างกดชิ้นงานสูง ${N(hEnd, 2)} mm แต่หลังปล่อยแรงคืนตัวขึ้นมา ${N(hL - hEnd, 3)} mm (ส่วนที่ยืดหยุ่น)</p>`;
        }
        h += '</div></div>';
        h += `<div class="conclude"><b>📝 สรุปผล:</b>${m.name} ${c.stop === 'crack' ? `แตกที่ความเค้นอัด ${N(sc, 0)} MN/m² ซึ่งสูงกว่าความแข็งแรงดึงหลายเท่า (≈ ${m.su} MN/m²) วัสดุเปราะจึงเหมาะกับงานรับแรงอัด เช่น ฐานเครื่องจักร`
          : c.stop === 'third' ? 'ยุบตัวและป่องออกด้านข้างโดยไม่แตก กราฟไม่โค้งลงเหมือนการดึง เพราะพื้นที่หน้าตัดเพิ่มขึ้นเรื่อย ๆ'
            : 'ถูกอัดจนถึงแรงที่ตั้งไว้ ถ้าต้องการเห็นจนจบการทดสอบ ให้ใช้ชิ้นงานที่เล็กลงหรือเครื่องที่ใหญ่ขึ้น'}</div>`;
        return h;
      }
    });
    function readFmax(r) { return parseFloat(r.querySelector('select[name=fmax]').value); }
  }

  /* ===== ใบงาน 2.3 งานทดสอบวัสดุโดยการเฉือนตรง ===== */
  function shearLab(root) {
    const PH = {
      el: '<b>ช่วงแรก</b> หมุดเริ่มรับแรงเฉือนที่ 2 หน้าตัด (รอยต่อระหว่างตัวกลางกับแท่นรองรับ 2 ข้าง)',
      plastic: '<b>หมุดเริ่มเสียรูป</b> เนื้อวัสดุตรงรอยเฉือนเลื่อนไถลออกจากกัน',
      tear: '<b>เลยแรงสูงสุดแล้ว</b> รอยเฉือนเริ่มขาด แรงลดลงอย่างรวดเร็ว'
    };
    utmLab(root, {
      title: 'ห้องทดลองเสมือน · ใบงาน 2.3 งานทดสอบวัสดุโดยการเฉือนตรง',
      sub: 'จุดประสงค์: ศึกษาความเค้นแรงเฉือนสูงสุดของวัสดุ (อุปกรณ์เฉือนคู่ที่ใช้กับเครื่องทดสอบอเนกประสงค์)',
      jig: 'shear', zoom: false, file: 'ใบงาน2.3-เฉือนตรง',
      mats: ['steel', 'al', 'brass', 'cu', 'ci'],
      fLabel: 'แรงเฉือน', dLabel: 'ระยะเลื่อน', peakName: 'F',
      runStep: 'ทดสอบ: กดปุ่ม ▲ (หมายเลข 6) ค้างไว้ จนชิ้นทดสอบขาดออกจากกัน',
      startText: 'เริ่มเฉือนชิ้นทดสอบ',
      fmax: [[40, '40 kN (ตามใบงาน)', 1], [50, '50 kN (เต็มพิกัดเครื่อง)'], [250, '250 kN (เครื่องขนาดใหญ่)']],
      inputs: `
        <label>เส้นผ่าศูนย์กลางชิ้นทดสอบ d (mm)<input type="number" name="d" step="0.1" min="2" max="20" value="6"></label>
        <label>ความยาวชิ้นทดสอบ (mm)<input type="number" name="L" step="1" min="30" max="80" value="50"></label>
        <label>ลักษณะการเฉือน<select name="mode"><option value="2">เฉือนคู่ (อุปกรณ์ของเครื่อง)</option></select></label>`,
      setup(v, m) {
        if (!(v.d > 0)) return { ok: false, html: '<div class="calc-err">⚠️ กรอกเส้นผ่าศูนย์กลางให้ถูกต้อง</div>' };
        const A = Math.PI * v.d ** 2 / 4;
        let html = LF('ขนาดพื้นที่หน้าตัดของชิ้นทดสอบ (1 หน้าตัด)', `A = ${FR('π d²', '4')}`, `= ${FR(`π × ${v.d}²`, '4')}`, `= ${N(A)} mm² = ${SCI(A * 1e-6)} m²`, 'hl');
        html += LF('เฉือนคู่ ชิ้นงานถูกตัดพร้อมกัน 2 รอย จึงรับแรงด้วยพื้นที่', '2A', `= 2 × ${N(A)}`, `= ${N(2 * A)} mm²`);
        const Fp = 2 * A * m.tauS / 1000;
        const fh = Fp > v.fmax ? `<p class="small" style="margin:4px 2px 0">⚠️ ชิ้นงานขนาดนี้น่าจะต้องใช้แรงมากกว่า ${v.fmax} kN ลองลดขนาด d</p>` : '';
        return { ok: true, html, fmaxHtml: fh, dims: { A, d: v.d } };
      },
      curve(m, k, D) {
        const Fp = 2 * D.A * m.tauS * k.s / 1000;
        const du = m.sh[0] * k.d, df = m.sh[1] * k.d;
        const x = [], y = [], ph = [];
        if (m.brittle) {
          for (let i = 0; i <= 300; i++) { const t = i / 300; x.push(du * t); y.push(Fp * Math.pow(t, 0.85)); ph.push(t < 0.6 ? 'el' : 'plastic'); }
        } else {
          for (let i = 0; i <= 500; i++) { const t = i / 500; x.push(du * t); y.push(Fp * (1 - Math.pow(1 - t, 3))); ph.push(t < 0.3 ? 'el' : 'plastic'); }
          for (let i = 1; i <= 250; i++) { const t = i / 250; x.push(du + (df - du) * t); y.push(Fp * (1 - 0.75 * t * t)); ph.push('tear'); }
        }
        return { x, y, ph, meta: { Fp }, end: 'cut' };
      },
      breaks: () => true,
      guess: st => { const m = MATS[st.mat]; const A = st.dims ? st.dims.A : 28; return [m.sh[1], 2 * A * m.tauS / 1000]; },
      visual(st, p, broken) { const v = p ? p.x * 8 : 0; return { move: -v, spec: specShear(st.mat, v, broken) }; },
      live(st, F) {
        const D = st.dims; if (!D) return '';
        return LF('ความเค้นเฉือนขณะนี้ (เฉือนคู่)', `τ = ${FR('F', '2A')}`, `= ${FR(`${N(F * 1000, 0)} N`, `2 × ${N(D.A)} mm²`)}`, `= ${N(F * 1000 / (2 * D.A), 1)} MN/m²`);
      },
      phaseText: p => PH[p] || '',
      endText: (stop, st) => stop === 'limit' ? `⚠️ ถึงแรงสูงสุดที่ตั้งไว้ (${st.c.fmaxSet} kN) ชิ้นงานยังไม่ขาด`
        : '✅ ชิ้นทดสอบขาดเป็น 3 ท่อน (ถูกเฉือน 2 รอย) · กดปุ่ม P หน้าจอแสดง “PEA” สลับกับแรงเฉือนสูงสุด (ใบงานข้อ 16)',
      row: (st, x, y) => ({ x, y }),
      cols: [
        { h: 'ครั้งที่', f: (r, i) => i + 1 },
        { h: 'แรงเฉือน (kN)', f: r => N(r.y, 2) },
        { h: 'ระยะเลื่อน (mm)', f: r => N(r.x, 3) }
      ],
      charts: [{ name: 'แรงเฉือน–ระยะเลื่อน', x: 'ระยะเลื่อนของหัวจับ (mm)', y: 'แรงเฉือน F (kN)', f: (x, y) => [x, y] }],
      results(st) {
        const D = st.dims, m = MATS[st.mat], F = st.peak * 1000, tau = F / (2 * D.A);
        let h = '<div class="table-wrap" style="margin-top:0"><table><caption>บันทึกผลการทดลอง (ตามแบบในใบงาน)</caption><tbody>'
          + `<tr><td class="left">ชนิดวัสดุ</td><td>${m.name}</td></tr>`
          + `<tr><td class="left">ขนาดเส้นผ่าศูนย์กลางของชิ้นทดสอบ</td><td>${N(D.d / 1000, 4)} m</td></tr>`
          + `<tr><td class="left">ขนาดพื้นที่หน้าตัดของชิ้นทดสอบ</td><td>${SCI(D.A * 1e-6)} m²</td></tr>`
          + `<tr><td class="left">แรงเฉือนสูงสุด</td><td>${N(F, 0)} N</td></tr>`
          + `<tr><td class="left">ความเค้นแรงเฉือนสูงสุด</td><td><b>${N(tau * 1e6, 0)} N/m² = ${N(tau, 2)} MN/m²</b></td></tr></tbody></table></div>`;
        h += '<div class="result-grid">';
        h += LF('1) ขนาดพื้นที่หน้าตัดของชิ้นทดสอบ', `A = ${FR('π d²', '4')}`, `= ${FR(`π × (${N(D.d / 1000, 4)})²`, '4')}`, `= ${SCI(D.A * 1e-6)} m²`);
        h += LF('2) ความเค้นแรงเฉือนสูงสุด (เฉือนคู่)', `τ = ${FR('F', '2A')}`, `= ${FR(N(F, 0), `2 × ${SCI(D.A * 1e-6)}`)}`, `= ${N(tau * 1e6, 0)} N/m² = ${N(tau, 2)} MN/m²`, 'hl');
        h += '</div>';
        h += `<div class="conclude"><b>📝 สรุปผล:</b>${m.name} มีความเค้นแรงเฉือนสูงสุด ${N(tau, 1)} MN/m²
          ${m.brittle ? 'ขาดทันทีโดยแทบไม่เสียรูป (วัสดุเปราะ)' : `ประมาณ ${N(m.tauS / m.su * 100, 0)} % ของความแข็งแรงดึง (วัสดุเหนียวส่วนใหญ่รับแรงเฉือนได้ราว 60–80 % ของแรงดึง)`}
          <br><span class="small muted">ถ้าเป็นเฉือนเดี่ยว (อุปกรณ์แบบ Johnson ตัด 1 รอย) จะใช้ τ = F/A แทน</span></div>`;
        return h;
      }
    });
  }

  /* =====================================================================
     ใบงาน 2.4 งานทดสอบโดยการเฉือนบิด (ชุดทดลองการเฉือนบิด)
     ===================================================================== */
  function torsionLab(root) {
    const R = 0.15;
    const st = { mat: 'steel', phase: 'setup', th: 0, Tnow: 0, Fbal: 0, rows: [], runs: [], pick: -1, leveled: true, busy: false };
    root.innerHTML = `
      <div class="lab-top"><h3>🔬 ห้องทดลองเสมือน · ใบงาน 2.4 งานทดสอบโดยการเฉือนบิด</h3><span class="lab-sub">จุดประสงค์: ศึกษาความแข็งแรงเฉือนบิดสูงสุดของวัสดุ ด้วยชุดทดลองการเฉือนบิด (รัศมีคานโมเมนต์ 0.15 m)</span></div>
      <div class="lab-body">
        <div class="lab-panel">
          <p class="lab-step"><span class="n">1</span>เลือกวัสดุ และวัดขนาดชิ้นทดสอบ (ใบงานข้อ 1–2)</p>
          <div class="mat-pick"></div><p class="mat-note"></p>
          <div class="lab-inputs setup-in">
            <label>เส้นผ่าศูนย์กลางช่วงทดสอบ d (mm)<input type="number" name="d" step="0.1" min="2" max="8" value="4"></label>
            <label>ความยาวช่วงทดสอบ L (mm)<input type="number" name="L" step="1" min="20" max="120" value="54"></label>
            <label>บิดครั้งละ (องศา)<select name="step"><option value="10" selected>10° (ตามใบงาน)</option><option value="5">5°</option><option value="2">2°</option><option value="1">1° (ละเอียด เหมาะกับวัสดุเปราะ)</option></select></label>
          </div>
          <div class="lf-list setup-lf"></div>
        </div>
        <div class="mach-box"><svg class="tor-svg" viewBox="0 0 780 330" role="img" aria-label="ชุดทดลองการเฉือนบิด"></svg></div>
        <div class="lab-row">
          <div>
            <p class="lab-step"><span class="n">2</span>ทดสอบ (ใบงานข้อ 12–15)</p>
            <div class="readouts">
              <div class="ro">มุมบิดรวม (องศา)<b class="r-th">0</b></div>
              <div class="ro">เครื่องชั่งสปริง (kg)<b class="r-kg">0.0</b></div>
              <div class="ro alt">แรงบิด T (N·m)<b class="r-T">0.00</b></div>
              <div class="ro alt">มุมบิดที่อ่านจากจานวัดมุม<b class="r-dial">0°</b></div>
            </div>
            <div class="ctrl">
              <button type="button" class="btn btn-go b-twist">↻ บิดชิ้นทดสอบ +10°</button>
              <button type="button" class="btn btn-accent b-level" disabled>⚖ ปรับระดับคานโมเมนต์ แล้วอ่านค่า</button>
            </div>
            <div class="ctrl" style="margin-top:0">
              <button type="button" class="btn btn-line b-auto">⏩ ทำอัตโนมัติจนชิ้นงานขาด</button>
              <button type="button" class="btn btn-line b-reset">↺ เริ่มใหม่</button>
            </div>
            <div class="status">หมุนด้ามปรับแรงบิดตามเข็มนาฬิกาครั้งละ 10° แล้วปรับระดับคานโมเมนต์ให้ได้ระดับ จึงอ่านค่าจากเครื่องชั่งสปริง</div>
            <div class="lf-list live-lf"></div>
          </div>
          <div>
            <p class="lab-step"><span class="n">3</span>ตารางบันทึกผลการทดลอง</p>
            <div class="rec-wrap"><table><thead></thead><tbody></tbody></table><div class="rec-empty">บิดแล้วปรับระดับคาน ค่าจะถูกบันทึกลงตาราง</div></div>
            <div class="rec-tools"><span class="small">แตะแถวในช่วงแรกเพื่อคำนวณมอดุลัสความแกร่ง G</span><button type="button" class="btn btn-line btn-sm b-csv" disabled>⬇ ดาวน์โหลดตาราง</button></div>
          </div>
        </div>
        <div>
          <p class="lab-step"><span class="n">4</span>กราฟความสัมพันธ์ระหว่างแรงบิดกับมุมบิด (ใบงานข้อ 17)</p>
          <div class="chart-box"><div class="ch-head"><span></span><button type="button" class="btn btn-line btn-sm b-clear" hidden>ล้างเส้นกราฟเก่า</button></div><svg class="chart" role="img" aria-label="กราฟแรงบิดกับมุมบิด"></svg><div class="legend"></div></div>
        </div>
        <div class="lab-panel">
          <p class="lab-step"><span class="n">5</span>คำนวณผลการทดลอง (ใบงานข้อ 16)</p>
          <div class="res"><p class="muted" style="margin:0">บิดชิ้นทดสอบจนขาดก่อน ผลการคำนวณจะแสดงที่นี่</p></div>
        </div>
      </div>`;
    const q = s => root.querySelector(s);
    const svg = q('.tor-svg');
    const chartDraw = makeChart(q('.chart'));
    const table = makeTable(q('.rec-wrap'), [
      { h: 'ครั้งที่', f: (r, i) => i + 1 },
      { h: 'มุมบิดรวม (องศา)', f: r => tick(r.th) },
      { h: 'มุมบิดที่อ่านจากจานวัดมุม (องศา)', f: r => tick(((r.th % 360) + 360) % 360) },
      { h: 'แรงดึง (kg)', f: r => N(r.kg, 1) },
      { h: 'แรงดึง (N)', f: r => N(r.kg * G, 2) },
      { h: 'แรงบิด (N·m)', f: r => N(r.kg * G * R, 3) }
    ]);
    const status = (t, cls = '') => { const s = q('.status'); s.className = `status ${cls}`; s.innerHTML = t; };
    const setMat = matButtons(q('.mat-pick'), ['steel', 'al', 'brass', 'cu', 'ci'], k => { if (st.phase !== 'setup') return; st.mat = k; refresh(); });

    function dims() {
      const d = parseFloat(q('[name=d]').value), L = parseFloat(q('[name=L]').value), step = parseFloat(q('[name=step]').value);
      return { d, L, step };
    }
    function refresh() {
      setMat(st.mat);
      q('.mat-note').textContent = `${MATS[st.mat].name}: ${MATS[st.mat].note}`;
      const D = dims();
      const ok = D.d > 0 && D.L > 0;
      if (ok) {
        const dm = D.d / 1000, J = Math.PI * dm ** 4 / 32;
        st.D = { ...D, J, r: dm / 2 };
        q('.setup-lf').innerHTML = LF('รัศมีของชิ้นทดสอบ', `r = ${FR('d', '2')}`, `= ${FR(N(dm, 4) + ' m', '2')}`, `= ${N(dm / 2, 4)} m`)
          + LF('โมเมนต์เฉื่อยเชิงขั้ว (เพลากลมตัน)', `J = ${FR('π d⁴', '32')}`, `= ${FR(`π × (${N(dm, 4)})⁴`, '32')}`, `= ${SCI(J)} m⁴`, 'hl')
          + `<p class="small muted" style="margin:4px 2px 0">ชิ้นทดสอบตามใบงาน: ยาวทั้งหมด 130 mm ปลายจับ ⌀12 ยาวข้างละ 38 mm → ช่วงทดสอบยาวประมาณ 130 − 2×38 = 54 mm</p>`;
      } else q('.setup-lf').innerHTML = '<div class="calc-err">⚠️ กรอกขนาดชิ้นทดสอบให้ถูกต้อง</div>';
      q('.b-twist').textContent = `↻ บิดชิ้นทดสอบ +${D.step}°`;
      q('.b-twist').disabled = !ok || st.phase === 'done';
      draw();
      drawChart();
    }
    q('.setup-in').addEventListener('input', () => { if (st.phase === 'setup') refresh(); });
    q('.setup-in').addEventListener('change', () => { if (st.phase === 'setup') refresh(); else { q('.b-twist').textContent = `↻ บิดชิ้นทดสอบ +${dims().step}°`; } });

    function tauOf(m, g) {
      if (m.brittle) return m.Gm * 1000 * g;
      const Gm = m.Gm * 1000 * st.k.E, ty = m.ty * st.k.s, tu = m.tu * st.k.s, gy = ty / Gm;
      return g <= gy ? Gm * g : ty + (tu - ty) * (1 - Math.exp(-(g - gy) / m.g0));
    }
    function torque(thDeg) {
      // แรงบิดในชิ้นทดสอบ (N·m) จากการรวมความเค้นเฉือนทีละชั้นของหน้าตัด
      const m = MATS[st.mat], D = st.D, Rr = D.d / 2, th = thDeg * Math.PI / 180, n = 40;
      let T = 0;
      for (let i = 0; i < n; i++) { const r = (i + 0.5) / n * Rr; T += tauOf(m, r * th / D.L) * 2 * Math.PI * r * r * (Rr / n); }
      return T / 1000;
    }
    function breakDeg() {
      const m = MATS[st.mat], D = st.D;
      const gf = m.brittle ? m.tauR * st.k.s / (m.Gm * 1000) : m.gf * st.k.d;
      return gf * D.L / (D.d / 2) * 180 / Math.PI;
    }

    function stripes(x0, x1, y, rad, thDeg, broken, xb) {
      // เส้นบนผิวชิ้นทดสอบ: เมื่อบิดจะกลายเป็นเกลียว
      let s = '';
      const th = thDeg * Math.PI / 180;
      for (let k = 0; k < 3; k++) {
        const ph0 = k * 2 * Math.PI / 3 + 0.4;
        let seg = '', open = false;
        for (let i = 0; i <= 120; i++) {
          const x = x0 + (x1 - x0) * i / 120;
          if (broken && Math.abs(x - xb) < 2) { open = false; continue; }
          const tw = broken ? (x < xb ? 0 : 0) : th * (x - x0) / (x1 - x0);
          const a = ph0 + tw;
          const vis = Math.cos(a) > 0;
          const yy = y - rad * Math.sin(a) * 0.95;
          if (vis) { seg += `${open ? 'L' : 'M'}${x.toFixed(1)} ${yy.toFixed(1)} `; open = true; } else open = false;
        }
        if (seg) s += `<path d="${seg}" fill="none" stroke="${k ? 'rgba(0,0,0,.35)' : 'var(--accent)'}" stroke-width="${k ? 1 : 1.8}"/>`;
      }
      return s;
    }

    function draw(alpha = st.alpha || 0, broken = st.phase === 'done' && st.broken) {
      const m = MATS[st.mat], dial = ((st.th % 360) + 360) % 360;
      const P = { x: 206, y: 236 };
      const a = alpha * Math.PI / 180;
      const rot = (x, y) => ({ x: P.x + (x - P.x) * Math.cos(a) - (y - P.y) * Math.sin(a), y: P.y + (x - P.x) * Math.sin(a) + (y - P.y) * Math.cos(a) });
      const hook = rot(88, 230);
      const kg = st.Fbal / G;
      const spr = Math.min(1, kg / 20);
      const rad = Math.max(3, Math.min(8, (st.D ? st.D.d : 4) * 1.25));
      const xb = 333;
      let s = '';
      // ราง ฐาน และโครง
      s += `<rect x="20" y="290" width="530" height="16" rx="3" fill="url(#gGreen)"/><rect x="250" y="283" width="215" height="7" fill="#22743a"/>
        <rect x="30" y="306" width="24" height="10" rx="2" fill="#555"/><rect x="510" y="306" width="24" height="10" rx="2" fill="#555"/>
        <rect x="40" y="40" width="14" height="250" fill="url(#gGreen)"/><rect x="176" y="40" width="14" height="250" fill="url(#gGreen)"/><rect x="40" y="36" width="150" height="16" rx="3" fill="url(#gGreen)"/>`;
      // ด้ามหมุนปรับระดับคานโมเมนต์ + เครื่องชั่งสปริง
      s += `<line x1="88" y1="18" x2="88" y2="${66 - spr * 4}" stroke="#777" stroke-width="4"/><line x1="72" y1="20" x2="104" y2="16" stroke="#d62828" stroke-width="4" stroke-linecap="round"/>
        <rect x="74" y="${66 - spr * 4}" width="28" height="104" rx="8" fill="url(#gYel)" stroke="#a77f00"/>
        ${[0, 1, 2, 3, 4].map(i => `<line x1="80" y1="${84 + i * 16}" x2="88" y2="${84 + i * 16}" stroke="#7a5b00"/>`).join('')}
        <rect x="84" y="${80 + spr * 60}" width="8" height="4" fill="#d62828"/>
        <line x1="88" y1="${170 - spr * 4}" x2="${hook.x}" y2="${hook.y}" stroke="#555" stroke-width="2.5"/>`;
      // ขาตั้งจุดหมุนของคานโมเมนต์
      s += `<path d="M186 290 L206 238 L226 290 Z" fill="#e67e22" stroke="#a6540f"/>`;
      // คานโมเมนต์ (หมุนรอบจุด P) + ระดับน้ำ + หัวจับซ้าย
      const bub = Math.max(-16, Math.min(16, -alpha * 6));
      s += `<g transform="rotate(${alpha} ${P.x} ${P.y})">
          <path d="M66 226 L240 228 L240 244 L66 238 Z" fill="url(#gPeach)" stroke="#8a4a1d"/>
          <circle cx="88" cy="232" r="3" fill="#333"/><circle cx="${P.x}" cy="${P.y}" r="5" fill="#333"/>
          <rect x="112" y="214" width="56" height="12" rx="3" fill="#2a8a43" stroke="#145227"/><rect x="118" y="216" width="44" height="8" rx="3" fill="#b6f2c4"/>
          <ellipse cx="${140 + bub}" cy="220" rx="6" ry="3" fill="#fff" stroke="#6bbf82"/><line x1="134" y1="216" x2="134" y2="224" stroke="#145227"/><line x1="146" y1="216" x2="146" y2="224" stroke="#145227"/>
          <rect x="214" y="222" width="34" height="28" rx="4" fill="url(#gDark)"/>${[0, 1, 2, 3].map(i => `<line x1="${218 + i * 8}" y1="222" x2="${218 + i * 8}" y2="250" stroke="#22262c"/>`).join('')}
        </g>`;
      // ชิ้นทดสอบ
      const sx0 = 248, sx1 = 420;
      const sf = `url(#gm-${st.mat}-v)`;
      if (!broken) {
        s += `<rect x="${sx0}" y="${236 - rad}" width="${sx1 - sx0}" height="${2 * rad}" fill="${sf}" stroke="${m.d}"/>`;
        s += stripes(sx0, sx1, 236, rad, st.th, false, 0);
      } else {
        s += `<rect x="${sx0}" y="${236 - rad}" width="${xb - 3 - sx0}" height="${2 * rad}" fill="${sf}" stroke="${m.d}"/>`;
        s += `<rect x="${xb + 5}" y="${236 - rad}" width="${sx1 - xb - 5}" height="${2 * rad}" fill="${sf}" stroke="${m.d}"/>`;
        s += m.brittle ? `<path d="M${xb - 3} ${236 - rad} L${xb + 3} ${236 + rad}" stroke="${m.d}" stroke-width="2"/>` : '';
        s += `<text x="${xb + 1}" y="${236 - rad - 10}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bad)">ขาด!</text>`;
      }
      // หัวจับขวา + จานวัดมุม + ชุดเฟืองทด
      s += `<rect x="420" y="222" width="36" height="28" rx="4" fill="url(#gDark)"/>${[0, 1, 2, 3].map(i => `<line x1="${424 + i * 8}" y1="222" x2="${424 + i * 8}" y2="250" stroke="#22262c"/>`).join('')}
        <ellipse cx="462" cy="236" rx="6" ry="48" fill="#f1f3f5" stroke="#8a95a3"/>
        <rect x="468" y="178" width="72" height="112" rx="6" fill="#1c7ed6" stroke="#145a9a"/><rect x="476" y="196" width="56" height="34" rx="4" fill="#3d93e0"/>
        <rect x="540" y="226" width="12" height="8" fill="#777"/><line x1="552" y1="230" x2="552" y2="${206 + 24 * Math.cos(st.th * Math.PI / 30)}" stroke="#222" stroke-width="4" stroke-linecap="round"/>
        <circle cx="552" cy="${206 + 24 * Math.cos(st.th * Math.PI / 30)}" r="5" fill="#f2b705" stroke="#8a6800"/>`;
      // ป้ายชื่อชิ้นส่วน
      s += `<g font-size="11.5" fill="var(--text)">
        <text x="106" y="112">เครื่องชั่งสปริง</text><text x="110" y="24">ด้ามหมุนปรับระดับคานโมเมนต์</text>
        <text x="62" y="268">คานโมเมนต์ (R = 0.15 m)</text><text x="120" y="208">ระดับน้ำ</text>
        <text x="286" y="${236 + rad + 18}">ชิ้นทดสอบ</text><text x="414" y="174">จานวัดมุม</text><text x="480" y="170">ชุดเฟืองทด</text>
        <text x="500" y="324">ด้ามหมุนปรับแรงบิด ↻</text></g>`;
      // ภาพขยาย: จานวัดมุม
      const cx = 662, cy = 92, rr = 62;
      let dialS = `<circle cx="${cx}" cy="${cy}" r="${rr + 6}" fill="var(--surface)" stroke="var(--line)"/><g transform="rotate(${-dial} ${cx} ${cy})">
        <circle cx="${cx}" cy="${cy}" r="${rr}" fill="#f8f9fa" stroke="#8a95a3"/>`;
      for (let d = 0; d < 360; d += 5) {
        const L = d % 30 === 0 ? 10 : d % 10 === 0 ? 6 : 3, A = (d - 90) * Math.PI / 180;
        dialS += `<line x1="${cx + rr * Math.cos(A)}" y1="${cy + rr * Math.sin(A)}" x2="${cx + (rr - L) * Math.cos(A)}" y2="${cy + (rr - L) * Math.sin(A)}" stroke="#333" stroke-width="${d % 30 ? 0.8 : 1.4}"/>`;
        if (d % 30 === 0) dialS += `<text x="${cx + (rr - 19) * Math.cos(A)}" y="${cy + (rr - 19) * Math.sin(A) + 4}" text-anchor="middle" font-size="9" fill="#333">${d}</text>`;
      }
      dialS += `<circle cx="${cx}" cy="${cy}" r="14" fill="url(#gDark)"/></g><path d="M${cx - 7} ${cy - rr - 12} L${cx + 7} ${cy - rr - 12} L${cx} ${cy - rr + 2} Z" fill="var(--bad)"/>`;
      s += dialS + `<text x="${cx}" y="${cy + rr + 22}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text)">จานวัดมุม: ${tick(dial)}°</text>`;
      // ภาพขยาย: สเกลเครื่องชั่งสปริง
      const gx = 594, gy = 228, gw = 168;
      s += `<rect x="${gx - 8}" y="${gy - 26}" width="${gw + 16}" height="76" rx="8" fill="var(--surface)" stroke="var(--line)"/><text x="${gx}" y="${gy - 10}" font-size="11.5" font-weight="700" fill="var(--text)">เครื่องชั่งสปริง (kg)</text>
        <rect x="${gx}" y="${gy}" width="${gw}" height="20" fill="url(#gYel)" stroke="#a77f00"/>`;
      for (let k = 0; k <= 20; k++) s += `<line x1="${gx + gw * k / 20}" y1="${gy + 20}" x2="${gx + gw * k / 20}" y2="${gy + (k % 5 ? 13 : 7)}" stroke="#5c4500"/>` + (k % 5 ? '' : `<text x="${gx + gw * k / 20}" y="${gy + 34}" text-anchor="middle" font-size="10" fill="var(--text)">${k}</text>`);
      s += `<path d="M${gx + gw * spr} ${gy - 2} l-5 -8 h10 z" fill="var(--bad)"/><text x="${gx + gw}" y="${gy - 10}" text-anchor="end" font-size="13" font-weight="700" fill="var(--bad)">${N(kg, 1)} kg</text>`;
      svg.innerHTML = s;
    }

    function live() {
      const D = st.D; if (!D) return;
      const kg = Math.round(st.Fbal / G * 10) / 10, F = kg * G, T = F * R;
      q('.r-th').textContent = tick(st.th);
      q('.r-kg').textContent = N(kg, 1);
      q('.r-T').textContent = N(T, 3);
      q('.r-dial').textContent = `${tick(((st.th % 360) + 360) % 360)}°`;
      q('.live-lf').innerHTML = LF('แรงที่ปลายคาน', 'F = kg × 9.81', `= ${N(kg, 1)} × 9.81`, `= ${N(F, 2)} N`)
        + LF('แรงบิด', 'T = F × R', `= ${N(F, 2)} × 0.15`, `= ${N(T, 3)} N·m`)
        + LF('ความเค้นเฉือนบิดที่ผิวชิ้นงาน', `τ = ${FR('T · r', 'J')}`, `= ${FR(`${N(T, 3)} × ${N(D.r, 4)}`, SCI(D.J, 2))}`, `= ${N(T * D.r / D.J / 1e6, 1)} MN/m²`);
    }

    function drawChart() {
      const series = [], legend = [];
      let xmax = 0, ymax = 0;
      st.runs.forEach(r => {
        series.push({ pts: r.pts, color: MATS[r.mat].line, cls: 'ch-old' });
        legend.push(`<span><i style="background:${MATS[r.mat].line}"></i>${MATS[r.mat].name} (ครั้งก่อน)</span>`);
        r.pts.forEach(p => { xmax = Math.max(xmax, p[0]); ymax = Math.max(ymax, p[1]); });
      });
      const pts = [[0, 0], ...st.rows.map(r => [r.th, r.kg * G * R])];
      if (st.rows.length) {
        series.push({ pts, color: MATS[st.mat].line });
        legend.push(`<span><i style="background:${MATS[st.mat].line}"></i>${MATS[st.mat].name} (ครั้งนี้)</span>`);
        pts.forEach(p => { xmax = Math.max(xmax, p[0]); ymax = Math.max(ymax, p[1]); });
      }
      if (!xmax) { xmax = 360; ymax = 5; }
      const pk = st.rows[st.pick];
      chartDraw({ xmax: Math.max(xmax * 1.05, 40), ymax: ymax * 1.15 || 1, xlab: 'มุมบิด θ (องศา)', ylab: 'แรงบิด T (N·m)', series, dots: pts.slice(1).map(p => [...p, MATS[st.mat].line]), pick: pk ? [pk.th, pk.kg * G * R] : null });
      q('.legend').innerHTML = legend.join('');
    }

    const anim = (dur, fn) => new Promise(res => {
      const t0 = performance.now();
      const f = t => { const u = Math.min(1, (t - t0) / dur); fn(u); if (u < 1) requestAnimationFrame(f); else res(); };
      requestAnimationFrame(f);
    });

    async function twist() {
      if (st.busy || st.phase === 'done' || !st.D) return;
      if (!st.leveled) { status('⚠️ ต้องปรับระดับคานโมเมนต์และอ่านค่าก่อน จึงบิดครั้งต่อไปได้ (ใบงานข้อ 13–14)', 'warn'); return; }
      if (st.phase === 'setup') {
        st.phase = 'run'; st.k = { s: jitter(0.03), d: jitter(0.08), E: jitter(0.03) }; st.thB = breakDeg();
        q('.setup-in').querySelectorAll('input').forEach(i => { i.disabled = true; });
        q('.mat-pick').querySelectorAll('button').forEach(b => { b.disabled = true; });
      }
      st.busy = true; st.leveled = false;
      const step = dims().step, th0 = st.th, th1 = th0 + step;
      const brk = th1 >= st.thB;
      const thEnd = brk ? st.thB : th1;
      await anim(st.auto ? 90 : Math.max(250, 500 * (thEnd - th0) / 10), u => {
        st.th = th0 + (thEnd - th0) * u;
        st.Tnow = torque(st.th);
        st.alpha = Math.max(-14, Math.min(14, (st.Tnow - st.Fbal * R) / Math.max(0.3, st.Tnow) * 10));
        draw(); live();
      });
      if (brk) return broke();
      st.busy = false;
      q('.b-level').disabled = false; q('.b-twist').disabled = true;
      status(`บิดไปแล้ว ${tick(st.th)}° คานโมเมนต์เอียง (ดูฟองอากาศในระดับน้ำ) → หมุนด้ามปรับระดับคานโมเมนต์ให้ได้ระดับ แล้วอ่านค่าเครื่องชั่งสปริง`, 'warn');
    }
    async function level() {
      if (st.busy || st.leveled || st.phase !== 'run') return;
      st.busy = true;
      const F0 = st.Fbal, F1 = st.Tnow / R, a0 = st.alpha;
      await anim(st.auto ? 70 : 450, u => { st.Fbal = F0 + (F1 - F0) * u; st.alpha = a0 * (1 - u); draw(); live(); });
      st.alpha = 0;
      const kg = Math.round(st.Fbal / G * 10) / 10;
      if (kg > 20) { status('⚠️ แรงเกินพิกัดเครื่องชั่งสปริง (20 kg) ให้ใช้ชิ้นทดสอบที่เล็กลง', 'bad'); }
      st.rows.push({ th: st.th, kg });
      table.add(st.rows[st.rows.length - 1], st.rows.length - 1);
      st.leveled = true; st.busy = false;
      q('.b-level').disabled = true; q('.b-twist').disabled = false; q('.b-csv').disabled = false;
      status(`อ่านค่าได้ ${N(kg, 1)} kg บันทึกลงตารางแล้ว (ครั้งที่ ${st.rows.length}) → บิดครั้งต่อไป`, 'ok');
      drawChart();
    }
    function broke() {
      st.phase = 'done'; st.broken = true; st.busy = false; st.auto = false;
      st.Fbal = 0; st.alpha = 0; st.Tnow = 0;
      draw(); live();
      q('.b-level').disabled = true; q('.b-twist').disabled = true; q('.b-auto').disabled = true;
      const m = MATS[st.mat];
      status(st.rows.length ? `✅ ชิ้นทดสอบขาดที่มุมบิดประมาณ ${tick(Math.round(st.th))}° ${m.brittle ? '(วัสดุเปราะ ขาดเป็นแนวเฉียง 45° แทบไม่บิดตัว)' : '(วัสดุเหนียว บิดได้หลายรอบก่อนขาด ผิวขาดเรียบตั้งฉากกับแกน)'}`
        : `⚠️ ชิ้นทดสอบขาดก่อนบิดครบ ${dims().step}° จึงไม่มีค่าบันทึก ลองกดเริ่มใหม่แล้วเลือกบิดครั้งละ 1°`, st.rows.length ? 'ok' : 'warn');
      if (st.rows.length) { st.pick = 0; table.mark(0, 'pick'); }
      q('.rec-wrap').classList.add('clickable');
      results(); drawChart();
    }
    function results() {
      const D = st.D, m = MATS[st.mat];
      if (!st.rows.length) { q('.res').innerHTML = '<p class="muted" style="margin:0">ไม่มีค่าที่บันทึกได้</p>'; return; }
      let mx = st.rows[0]; st.rows.forEach(r => { if (r.kg > mx.kg) mx = r; });
      const F = mx.kg * G, T = F * R, tau = T * D.r / D.J;
      let h = '<div class="result-grid"><div>';
      h += LF('แรงสูงสุดจากเครื่องชั่งสปริง (ค่ามากที่สุดในตาราง)', 'F = kg × 9.81', `= ${N(mx.kg, 1)} × 9.81`, `= ${N(F, 2)} N`);
      h += LF('1) แรงบิดสูงสุด', 'T = F · R', `= ${N(F, 2)} × 0.15`, `= ${N(T, 3)} N·m`, 'hl');
      h += LF('โมเมนต์เฉื่อยเชิงขั้ว', `J = ${FR('π d⁴', '32')}`, `= ${FR(`π (${N(D.d / 1000, 4)})⁴`, '32')}`, `= ${SCI(D.J)} m⁴`);
      h += LF('2) ความเค้นเฉือนบิดสูงสุด', `τ = ${FR('T · r', 'J')}`, `= ${FR(`${N(T, 3)} × ${N(D.r, 4)}`, SCI(D.J))}`, `= ${N(tau, 0)} N/m² = ${N(tau / 1e6, 2)} MN/m²`, 'hl');
      h += '</div><div>';
      const r = st.rows[st.pick];
      if (r) {
        const Tr = r.kg * G * R, th = r.th * Math.PI / 180, Gm = Tr * (D.L / 1000) / (D.J * th);
        h += `<p class="small" style="margin:0 0 6px"><b>เสริม: มอดุลัสความแกร่ง G</b> จากแถวที่ ${st.pick + 1} (กรอบสีเขียว) <span class="muted">— แตะแถวอื่นเพื่อเปลี่ยน</span></p>`;
        h += LF('แปลงมุมบิดเป็นเรเดียน', 'θ = องศา × π/180', `= ${tick(r.th)} × π/180`, `= ${N(th, 4)} rad`);
        h += LF('จากสมการการบิด T/J = Gθ/L', `G = ${FR('T · L', 'J · θ')}`, `= ${FR(`${N(Tr, 3)} × ${N(D.L / 1000, 3)}`, `${SCI(D.J, 2)} × ${N(th, 4)}`)}`, `= ${N(Gm / 1e9, 1)} GN/m²`, 'hl');
        const gy = (m.brittle ? 1e9 : m.ty / (m.Gm * 1000)) * D.L / (D.d / 2) * 180 / Math.PI;
        if (!m.brittle && r.th > gy) h += `<div class="note note-warn" style="margin:8px 0 0"><b>⚠️</b>ชิ้นงานเริ่มเสียรูปถาวรตั้งแต่ประมาณ ${N(gy, 1)}° แถวนี้เลยช่วงยืดหยุ่นแล้ว ค่า G จึงต่ำกว่าความจริง (≈ ${m.Gm} GN/m²) ถ้าต้องการหา G ให้บิดครั้งละ 1° ในช่วงแรก</div>`;
      }
      h += '</div></div>';
      h += `<div class="conclude"><b>📝 สรุปผล:</b>${m.name} มีความเค้นเฉือนบิดสูงสุด ${N(tau / 1e6, 1)} MN/m² ขาดที่มุมบิดประมาณ ${tick(Math.round(st.th))}°
        ${m.brittle ? '— วัสดุเปราะขาดทันทีโดยแทบไม่บิดตัว จึงไม่นิยมทดสอบเฉือนบิดกับวัสดุเปราะ' : '— วัสดุเหนียวบิดได้หลายรอบก่อนขาด เหมาะกับงานเพลาส่งกำลัง'}</div>`;
      q('.res').innerHTML = h;
    }

    q('.b-twist').addEventListener('click', twist);
    q('.b-level').addEventListener('click', level);
    q('.b-auto').addEventListener('click', async () => {
      if (st.phase === 'done' || st.auto) return;
      st.auto = true; q('.b-auto').disabled = true;
      while (st.auto && st.phase !== 'done') {
        if (!st.leveled) await level();
        if (st.phase === 'done' || !st.auto) break;
        await twist();
        if (st.phase === 'done') break;
        await new Promise(r => setTimeout(r, 30));
      }
    });
    q('.b-reset').addEventListener('click', () => {
      if (st.busy || st.auto) { st.auto = false; status('กำลังหยุดการทดสอบอัตโนมัติ กด “เริ่มใหม่” อีกครั้ง', 'warn'); q('.b-auto').disabled = false; return; }
      if (st.rows.length && st.phase === 'done') {
        st.runs.push({ mat: st.mat, pts: [[0, 0], ...st.rows.map(r => [r.th, r.kg * G * R])] });
        if (st.runs.length > 4) st.runs.shift();
        q('.b-clear').hidden = false;
      }
      Object.assign(st, { phase: 'setup', th: 0, Tnow: 0, Fbal: 0, rows: [], pick: -1, leveled: true, busy: false, broken: false, alpha: 0 });
      table.clear();
      q('.setup-in').querySelectorAll('input').forEach(i => { i.disabled = false; });
      q('.mat-pick').querySelectorAll('button').forEach(b => { b.disabled = false; });
      q('.b-level').disabled = true; q('.b-auto').disabled = false; q('.b-csv').disabled = true;
      q('.rec-wrap').classList.remove('clickable');
      q('.res').innerHTML = '<p class="muted" style="margin:0">บิดชิ้นทดสอบจนขาดก่อน ผลการคำนวณจะแสดงที่นี่</p>';
      status('หมุนด้ามปรับแรงบิดตามเข็มนาฬิกาครั้งละ 10° แล้วปรับระดับคานโมเมนต์ให้ได้ระดับ จึงอ่านค่าจากเครื่องชั่งสปริง');
      live(); refresh();
    });
    q('.b-clear').addEventListener('click', () => { st.runs = []; q('.b-clear').hidden = true; drawChart(); });
    q('.rec-wrap').addEventListener('click', e => {
      if (st.phase !== 'done') return;
      const tr = e.target.closest('tbody tr'); if (!tr) return;
      table.unmarkAll('pick'); st.pick = +tr.dataset.i; table.mark(st.pick, 'pick');
      results(); drawChart();
    });
    q('.b-csv').addEventListener('click', () => {
      downloadCSV(`ใบงาน2.4-เฉือนบิด-${MATS[st.mat].name}.csv`, ['ครั้งที่', 'มุมบิดรวม (องศา)', 'มุมบิดที่อ่านจากจานวัดมุม (องศา)', 'แรงดึง (kg)', 'แรงดึง (N)', 'แรงบิด (N·m)'],
        st.rows.map((r, i) => [i + 1, r.th, ((r.th % 360) + 360) % 360, r.kg.toFixed(1), (r.kg * G).toFixed(2), (r.kg * G * R).toFixed(3)]));
    });
    refresh(); live();
  }

  /* =====================================================================
     ใบงาน 2.5–2.7 งานทดสอบความแข็ง (เครื่องทดสอบความแข็งยูนิเวอร์แซล)
     ===================================================================== */
  function testerSVG() {
    return `<svg viewBox="0 0 360 420" role="img" aria-label="เครื่องทดสอบความแข็งยูนิเวอร์แซล">
      <rect x="26" y="332" width="300" height="80" rx="6" fill="url(#gCream)" stroke="#9a927f"/>
      <rect x="40" y="350" width="60" height="44" rx="4" fill="none" stroke="#9a927f"/>
      <path d="M26 332 L26 70 Q26 40 56 40 L200 40 L200 132 L112 132 L112 332 Z" fill="url(#gCream)" stroke="#9a927f"/>
      <rect x="190" y="82" width="104" height="168" rx="8" fill="#23272e" stroke="#111"/>
      <text x="242" y="100" text-anchor="middle" font-size="11" font-weight="700" fill="#e9ecef">AFFRI</text>
      <rect class="lcd" x="202" y="108" width="80" height="30" rx="3"/><text class="lcd-t h-lcd" x="276" y="129" text-anchor="end">----</text>
      ${[0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<rect x="${204 + c * 19}" y="${150 + r * 16}" width="15" height="11" rx="2" fill="#4a5260"/>`).join('')).join('')}
      <rect x="208" y="10" width="54" height="74" rx="6" fill="#f4f4f1" stroke="#9a927f"/>
      <rect x="216" y="30" width="14" height="40" fill="#fff" stroke="#999"/><rect class="h-wsel" x="216" y="58" width="14" height="4" fill="#d62828"/>
      <path d="M220 10 l-14 -6 M235 10 v-9 M250 10 l14 -6" stroke="#888" stroke-width="3" stroke-linecap="round"/>
      <g class="h-lever"><line x1="300" y1="170" x2="300" y2="112" stroke="#30353b" stroke-width="6" stroke-linecap="round"/><rect x="293" y="96" width="14" height="22" rx="5" fill="#1b1e23"/></g>
      <circle cx="300" cy="170" r="12" fill="#2a2f36"/><circle cx="300" cy="170" r="4" fill="#999"/>
      <rect x="226" y="250" width="22" height="12" fill="url(#gCol)"/>
      <g class="h-ind"><rect x="231" y="262" width="12" height="10" fill="url(#gCol)"/><path class="h-tip" d="M233 272 L241 272 L237 280 Z" fill="#555"/></g>
      <g class="h-anvil">
        <rect class="h-spec" x="214" y="296" width="46" height="14" rx="2" fill="url(#gm-steel-h)" stroke="#555"/>
        <rect x="206" y="310" width="62" height="10" rx="3" fill="url(#gCol)" stroke="#6d7785"/>
        <rect x="226" y="320" width="22" height="6" fill="url(#gCol)"/>
      </g>
      <path class="h-bellow" d="" fill="#1d1f23"/>
      <ellipse cx="237" cy="334" rx="40" ry="7" fill="#2a2f36"/>
      <line x1="200" y1="334" x2="170" y2="352" stroke="#2a2f36" stroke-width="5" stroke-linecap="round"/><line x1="274" y1="334" x2="304" y2="352" stroke="#2a2f36" stroke-width="5" stroke-linecap="round"/>
      <g font-size="11" fill="var(--text)">
        <text x="270" y="22">น้ำหนักกด</text><text x="312" y="128">คานโยก</text>
        <text x="252" y="278">หัวกด</text><text x="272" y="306">ชิ้นทดสอบ</text><text x="272" y="320">แท่นรองรับ</text>
        <text x="128" y="384">ด้ามหมุนปรับแท่นรองรับ ↻</text>
      </g>
    </svg>`;
  }

  function hardnessLab(root) {
    const MODES = {
      HB: { ws: '2.5', name: 'บริเนลล์', title: 'งานทดสอบความแข็งแบบบริเนลล์', sym: 'HB', obj: 'เพื่อศึกษาความแข็งผิวของวัสดุ ตามวิธีแบบบริเนลล์ (Brinell)',
        ind: 'ball25', loads: [[187.5, '187.5 kp (วัสดุผิวแข็ง)'], [62.5, '62.5 kp (วัสดุผิวอ่อน)']], scope: true },
      HR: { ws: '2.6', name: 'รอคเวลล์', title: 'งานทดสอบความแข็งแบบรอคเวลล์', sym: 'HR', obj: 'เพื่อศึกษาความแข็งผิวของวัสดุ ตามวิธีแบบรอคเวลล์ (Rockwell)',
        ind: null, loads: [[100, 'สเกล B (HRB): 100 kgf · ลูกบอล 1/16 นิ้ว'], [150, 'สเกล C (HRC): 150 kgf · เพชรกรวย 120°']], scope: false },
      HV: { ws: '2.7', name: 'วิคเกอร์ส', title: 'งานทดสอบความแข็งแบบวิคเกอร์ส', sym: 'HV', obj: 'เพื่อศึกษาความแข็งผิวของวัสดุ ตามวิธีแบบวิคเกอร์ส (Vickers)',
        ind: 'pyr', loads: [[187.5, '187.5 kp (วัสดุผิวแข็ง)'], [62.5, '62.5 kp (วัสดุผิวอ่อน)'], [30, '30 kp (HV30 ที่นิยมทั่วไป)']], scope: true }
    };
    const IND = { ball25: 'ลูกบอลเหล็ก ⌀ 2.5 mm', ball16: 'ลูกบอลเหล็ก ⌀ 1/16 นิ้ว', cone: 'หัวเพชรรูปกรวย 120°', pyr: 'หัวเพชรพีระมิด 136°' };
    const hm = { mode: 'HB', mat: 'steel', step: 0, dents: [], cmp: { HB: {}, HR: {}, HV: {} } };
    root.innerHTML = `
      <div class="lab-top"><h3>🔬 ห้องทดลองเสมือน · ใบงาน 2.5–2.7 งานทดสอบความแข็ง</h3><span class="lab-sub">เครื่องทดสอบความแข็งยูนิเวอร์แซล ทดสอบได้ทั้ง 3 วิธี เลือกใบงานด้านล่าง</span></div>
      <div class="lab-body">
        <div class="tabs h-tabs">${Object.entries(MODES).map(([k, m]) => `<button type="button" data-mode="${k}"${k === 'HB' ? ' class="on"' : ''}>ใบงาน ${m.ws} ${m.name}</button>`).join('')}</div>
        <p class="h-obj muted" style="margin:-6px 0 0"></p>
        <div class="lab-panel">
          <p class="lab-step"><span class="n">1</span>เลือกชิ้นทดสอบ (เพลากลม ⌀ 25 mm)</p>
          <div class="mat-pick"></div><p class="mat-note"></p>
        </div>
        <div class="lab-row r-machine">
          <div class="mach-box">${testerSVG()}</div>
          <div>
            <p class="lab-step"><span class="n">2</span>ทำตามขั้นตอนในใบงาน</p>
            <ol class="proc"></ol>
            <div class="status">ทำทีละขั้นจากบนลงล่าง</div>
          </div>
        </div>
        <div class="lab-row">
          <div class="h-view"></div>
          <div>
            <p class="lab-step"><span class="n">3</span>บันทึกผลการทดลอง</p>
            <div class="rec-wrap" style="max-height:none"><table><thead></thead><tbody></tbody></table><div class="rec-empty">ยังไม่มีรอยกด</div></div>
            <div class="lf-list h-calc"></div>
          </div>
        </div>
        <div class="lab-panel">
          <p class="lab-step"><span class="n">4</span>เปรียบเทียบความแข็งของวัสดุที่ทดสอบแล้ว</p>
          <div class="compare-bar"><p class="muted small" style="margin:0">ทดสอบครบ 3 รอยแล้ว ค่าเฉลี่ยของแต่ละวัสดุจะขึ้นที่นี่ ลองทดสอบหลาย ๆ วัสดุแล้วเปรียบเทียบกัน</p></div>
        </div>
      </div>`;
    const q = s => root.querySelector(s);
    const status = (t, cls = '') => { const s = q('.status'); s.className = `status ${cls}`; s.innerHTML = t; };
    const setMat = matButtons(q('.mat-pick'), ['steel', 'al', 'brass', 'cu', 'ci', 'ss', 'hard'], k => { if (hm.busy) return; hm.mat = k; newTest(); });
    const lcd = q('.h-lcd'), lever = q('.h-lever'), anvil = q('.h-anvil'), ind = q('.h-ind'), tip = q('.h-tip'), spec = q('.h-spec'), bellow = q('.h-bellow'), wsel = q('.h-wsel');
    let tbl;

    function setAnvil(up) {
      // up = 0 (ลงสุด) .. 1 (ผิวชิ้นงานแตะหัวกด)
      const y = (1 - up) * 14;
      anvil.setAttribute('transform', `translate(0 ${y - 16})`);
      const top = 326 + y - 16, bot = 332;
      let d = `M224 ${top} `;
      const n = 6, hh = (bot - top) / n;
      for (let i = 0; i <= n; i++) d += `L${i % 2 ? 218 : 224} ${top + i * hh} `;
      d += `L250 ${bot} `;
      for (let i = n; i >= 0; i--) d += `L${i % 2 ? 256 : 250} ${top + i * hh} `;
      bellow.setAttribute('d', d + 'Z');
    }
    function setLever(a) { lever.setAttribute('transform', `rotate(${a} 300 170)`); }
    function setTip() {
      const t = hm.ind;
      tip.setAttribute('d', t === 'ball25' || t === 'ball16' ? 'M233 272 L241 272 A4 4 0 0 1 233 272 Z' : t === 'cone' ? 'M232 272 L242 272 L237 281 Z' : 'M233 272 L241 272 L237 279 Z');
      tip.setAttribute('fill', t === 'cone' || t === 'pyr' ? '#a5d8ff' : '#6b7280');
    }

    const anim = (dur, fn) => new Promise(res => {
      const t0 = performance.now();
      const f = t => { const u = Math.min(1, (t - t0) / dur); fn(u); if (u < 1) requestAnimationFrame(f); else res(); };
      requestAnimationFrame(f);
    });
    const beep = () => {
      try {
        const A = new (window.AudioContext || window.webkitAudioContext)(), o = A.createOscillator(), g = A.createGain();
        o.frequency.value = 1500; g.gain.value = 0.05; o.connect(g); g.connect(A.destination); o.start(); setTimeout(() => { o.stop(); A.close(); }, 180);
      } catch { /* ไม่มีเสียงก็ได้ */ }
    };

    /* ---- ค่าความแข็งจริงของชิ้นงาน และขนาดรอยกด ---- */
    function truth() {
      const m = MATS[hm.mat], M = hm.mode, F = hm.load;
      const k = hm.k * (hm.polished ? jitter(0.015) : jitter(0.07));
      if (M === 'HB') {
        const HB = m.HB * k, D = 2.5, h2 = 2 * F / (Math.PI * D * HB);
        const d = h2 >= D ? D * 0.98 : Math.sqrt(D * D - (D - h2) ** 2);
        return { val: HB, d1: d * jitter(0.008), d2: d * jitter(0.008), D };
      }
      if (M === 'HV') {
        const HV = m.HV * k, d = Math.sqrt(1.8544 * F / HV), a = 1 + Math.random() * 0.012;
        return { val: HV, d1: d * a, d2: d / a };
      }
      const scaleB = hm.load === 100;
      const HR = (scaleB ? m.HRB : m.HRC) + (k - 1) * 40;
      const Nn = scaleB ? 130 : 100;
      return { val: HR, h: (Nn - HR) * 0.002, scaleB };
    }

    /* ---- ขั้นตอนตามใบงาน ---- */
    function steps() {
      const M = MODES[hm.mode];
      const s = [
        { t: '<b>ขัดผิวชิ้นทดสอบ</b> ให้เรียบเป็นเงามัน ด้วยกระดาษทรายน้ำเบอร์ 320, 400, 600 และ 800 ตามลำดับ', b: '🧽 ขัดผิว', go: polish },
        { t: '<b>เลือกแท่นรองรับชิ้นงาน</b> ให้เหมาะกับผิวของชิ้นงาน (ผิวด้านที่ทดสอบเป็นหน้าตัดเรียบของเพลา)', ch: [['flat', 'แท่นผิวราบ'], ['vee', 'แท่นผิวโค้ง (ร่องวี)']], go: pickAnvil },
        { t: '<b>เลือกหัวกด</b>' + (hm.mode === 'HR' ? ' (สเกล B ใช้ลูกบอล 1/16 นิ้ว · สเกล C ใช้หัวเพชรกรวย 120°)' : ''), ch: Object.entries(IND), go: pickInd },
        { t: '<b>เลือกน้ำหนักกด</b>' + (hm.mode === 'HR' ? ' และสเกล' : ' — วัสดุผิวแข็ง เช่น เหล็กกล้า เหล็กหล่อ ใช้ 187.5 kp · วัสดุผิวอ่อน เช่น ทองแดง ทองเหลือง อะลูมิเนียม ใช้ 62.5 kp'), ch: M.loads.map(l => [l[0], l[1]]), go: pickLoad },
        { t: '<b>ตั้งเวลากดแช่</b> 3 วินาที (วัสดุผิวแข็ง) หรือ 6 วินาที (วัสดุผิวอ่อน) แล้วกดปุ่ม ON และ SCALE SEL. จนหน้าจอแสดง ' + (hm.mode === 'HB' ? '“hb30” หรือ “hb10”' : hm.mode === 'HV' ? '“hv”' : '“hrb” หรือ “hrc”'), ch: [[3, '3 วินาที'], [6, '6 วินาที']], go: pickTime },
        { t: '<b>หมุนปรับแท่นขึ้น</b> ให้ผิวชิ้นงานสัมผัสหัวกด หน้าจอนับ 9 → 0 (ชิ้นงานรับแรงกดเริ่มต้น 10 kg)', b: '⤴ หมุนแท่นขึ้น', go: raise },
        { t: '<b>โยกคานโยก</b>ตามเข็มนาฬิกา รอเสียงสัญญาณ แล้วโยกกลับมาตั้งฉากดังเดิม', b: '⤵ โยกคานโยก', go: press },
        { t: hm.mode === 'HR' ? '<b>อ่านค่าความแข็งบนหน้าจอ</b> แล้วบันทึกลงตาราง' : '<b>วัดขนาดรอยกด</b>ด้วยกล้องไมโครสโคปสเกล (เลื่อนเส้นเล็งให้ตรงขอบรอย) แล้วบันทึกลงตาราง', b: '✍ บันทึกผล', go: save },
        { t: '<b>หมุนแท่นลง</b> แล้วเลื่อนชิ้นงานไปกดตำแหน่งใหม่ ห่างจากรอยเดิมอย่างน้อย 3 เท่าของขนาดรอย ทำซ้ำจนได้อย่างน้อย 3 รอย', b: '➡ กดตำแหน่งใหม่', go: nextDent }
      ];
      return s;
    }
    function renderProc() {
      const S = steps();
      q('.proc').innerHTML = S.map((x, i) => {
        const cls = i < hm.step ? 'done' : i === hm.step ? 'now' : '';
        let ctl = '';
        if (i === hm.step && !hm.busy) {
          if (x.b) ctl = `<button type="button" class="btn btn-sm btn-accent" data-go="${i}">${x.b}</button>`;
          if (x.ch) ctl = `<div class="tabs" style="margin:6px 0 0">${x.ch.map(c => `<button type="button" data-go="${i}" data-v="${c[0]}">${c[1]}</button>`).join('')}</div>`;
        }
        if (i === hm.step && hm.warn) ctl += `<div class="note note-warn" style="margin:8px 0 0">${hm.warn}</div>`;
        if (i < hm.step && hm.pickTxt && hm.pickTxt[i]) ctl = `<div class="small muted">✔ ${hm.pickTxt[i]}</div>`;
        return `<li class="${cls}"><span class="ck">✓</span><div class="proc-t">${i + 1}. ${x.t}${ctl}</div></li>`;
      }).join('');
    }
    q('.proc').addEventListener('click', e => {
      const b = e.target.closest('[data-go]'); if (!b || hm.busy) return;
      const S = steps();
      S[+b.dataset.go].go(b.dataset.v, b.textContent);
    });
    // แจ้งเตือนเมื่อเลือกผิด ให้ขึ้นใต้ขั้นตอนที่กำลังทำ (บนมือถือกล่องสถานะอยู่ไกลจนมองไม่เห็น)
    const bad = msg => { hm.warn = msg; renderProc(); status(msg, 'warn'); };
    const done = (txt, msg, cls = 'ok') => { hm.warn = null; hm.pickTxt = hm.pickTxt || []; hm.pickTxt[hm.step] = txt; hm.step++; renderProc(); if (msg) status(msg, cls); };

    async function polish() {
      hm.busy = true; renderProc();
      for (const g of [320, 400, 600, 800]) { status(`กำลังขัดด้วยกระดาษทรายเบอร์ ${g} …`); await new Promise(r => setTimeout(r, 380)); }
      hm.polished = true; hm.busy = false;
      spec.setAttribute('stroke', '#fff');
      done('ขัดผิวเรียบเป็นเงามันแล้ว', 'ผิวชิ้นงานเรียบแล้ว ทำให้อ่านขนาดรอยกดได้แม่นยำ');
      drawView();
    }
    function pickAnvil(v, t) {
      if (v !== 'flat') return bad('⚠️ ผิวที่ทดสอบเป็นหน้าตัดเรียบของเพลา ต้องใช้<b>แท่นรองรับผิวราบ</b> (แท่นผิวโค้งใช้กับการกดบนผิวโค้งของเพลา)');
      done(t, 'ประกอบแท่นรองรับผิวราบเข้ากับเครื่องแล้ว');
    }
    function pickInd(v, t) {
      const M = MODES[hm.mode];
      if (hm.mode === 'HR') { if (v !== 'ball16' && v !== 'cone') return bad('⚠️ รอคเวลล์สเกล B ใช้ลูกบอล 1/16 นิ้ว ส่วนสเกล C ใช้หัวเพชรกรวย 120°'); }
      else if (v !== M.ind) return bad(`⚠️ การทดสอบแบบ${M.name}ต้องใช้<b>${IND[M.ind]}</b>`);
      hm.ind = v; setTip();
      done(t, `ประกอบ${t}เข้ากับเครื่องแล้ว`);
    }
    function pickLoad(v, t) {
      v = +v;
      if (hm.mode === 'HR') {
        if ((v === 100) !== (hm.ind === 'ball16')) return bad('⚠️ สเกลต้องตรงกับหัวกด: ลูกบอล 1/16 นิ้ว → สเกล B (100 kgf) · หัวเพชรกรวย → สเกล C (150 kgf)');
      }
      hm.load = v;
      wsel.setAttribute('y', v >= 150 ? 36 : v >= 100 ? 46 : v >= 62 ? 54 : 62);
      const m = MATS[hm.mat];
      let note = '';
      if (hm.mode !== 'HR' && v !== 30) {
        const want = m.hardSurf ? 187.5 : 62.5;
        if (v !== want) note = ` (ใบงานแนะนำ ${want} kp สำหรับ${m.name} ลองดูว่าผลต่างกันอย่างไร)`;
      }
      done(t, `เลือกน้ำหนักกด ${t}${note}`, note ? 'warn' : 'ok');
    }
    function pickTime(v, t) {
      hm.time = +v;
      const m = MATS[hm.mat];
      lcd.textContent = hm.mode === 'HB' ? (hm.load >= 187.5 ? 'hb30' : 'hb10') : hm.mode === 'HV' ? 'hv' : (hm.load === 100 ? 'hrb' : 'hrc');
      const want = m.hardSurf ? 3 : 6;
      done(t, `ตั้งเวลา ${t} แล้ว${want !== hm.time ? ` (ใบงานแนะนำ ${want} วินาทีสำหรับ${m.name})` : ''} · หน้าจอแสดง “${lcd.textContent}”`);
    }
    async function raise() {
      hm.busy = true; renderProc();
      await anim(900, u => { setAnvil(u); lcd.textContent = u > 0.6 ? String(Math.max(0, 9 - Math.floor((u - 0.6) / 0.4 * 10))) : lcd.textContent; });
      lcd.textContent = '0';
      hm.busy = false;
      done('ผิวชิ้นงานสัมผัสหัวกด แรงกดเริ่มต้น 10 kg', 'หน้าจอแสดง 0 = ชิ้นงานรับแรงกดเริ่มต้น 10 kg แล้ว');
    }
    async function press() {
      hm.busy = true; renderProc();
      hm.cur = truth();
      await anim(500, u => { setLever(70 * u); ind.setAttribute('transform', `translate(0 ${u * 2})`); });
      for (let t = hm.time; t > 0; t--) { status(`⏱ กำลังกดแช่ … ${t} วินาที`); lcd.textContent = `t ${t}`; await new Promise(r => setTimeout(r, 420)); }
      beep();
      await anim(450, u => { setLever(70 * (1 - u)); ind.setAttribute('transform', `translate(0 ${(1 - u) * 2})`); });
      hm.busy = false;
      const c = hm.cur, M = hm.mode;
      if (M === 'HR') {
        const bad = c.scaleB ? (c.val > 100 ? 'over' : c.val < 0 ? 'under' : '') : (c.val < 20 ? 'under' : '');
        lcd.textContent = bad === 'over' ? 'Err' : bad === 'under' ? 'Lo' : N(c.val, 1);
        c.bad = bad;
      } else lcd.textContent = N(c.val, 0);
      hm.scopeD = [hm.cur.d1 ? Math.round(hm.cur.d1 * 0.75 * 200) / 200 : 0, hm.cur.d2 ? Math.round(hm.cur.d2 * 1.25 * 200) / 200 : 0];
      done('เสียงสัญญาณดัง โยกคานกลับแล้ว', M === 'HR' ? `หน้าจอแสดงค่าความแข็ง ${lcd.textContent} ${c.scaleB ? 'HRB' : 'HRC'}` : 'เกิดรอยกดบนผิวชิ้นงานแล้ว ส่องกล้องไมโครสโคปสเกลด้านล่าง แล้วเลื่อนเส้นเล็งให้ตรงขอบรอย');
      drawView();
    }
    function save() {
      const c = hm.cur, M = hm.mode;
      const r = { val: c.val, screen: c.val };
      if (M !== 'HR') {
        const [m1, m2] = hm.scopeD, e1 = Math.abs(m1 - c.d1) / c.d1, e2 = Math.abs(m2 - c.d2) / c.d2;
        if (e1 > SC_TOL || e2 > SC_TOL) {
          const msg = `⚠️ เส้นเล็ง${e1 > SC_TOL && e2 > SC_TOL ? 'ทั้ง d₁ และ d₂' : e1 > SC_TOL ? ' d₁ (แนวนอน)' : ' d₂ (แนวตั้ง)'}ยังไม่ตรงขอบรอยกด เลื่อนแถบหรือกดปุ่ม − / + ที่กล้องไมโครสโคปจนเส้นเป็น<b style="color:var(--ok)">สีเขียว</b> แล้วกดบันทึกผลอีกครั้ง`;
          const w = q('.sc-msg'); if (w) { w.innerHTML = msg; w.hidden = false; q('.scope').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          return bad(msg);
        }
        r.d1 = m1; r.d2 = m2; r.d = (m1 + m2) / 2;
        r.val = M === 'HB' ? hbOf(hm.load, 2.5, r.d) : 1.8544 * hm.load / r.d ** 2;
        r.ratio = M === 'HB' ? r.d / 2.5 : null;
      } else { r.h = c.h; r.scaleB = c.scaleB; r.bad = c.bad; }
      hm.dents.push(r);
      tbl.add(r, hm.dents.length - 1);
      calc();
      if (hm.dents.length >= 3) {
        hm.step = 99; renderProc();
        finishMat();
        status('✅ ทดสอบครบ 3 รอยแล้ว ดูค่าเฉลี่ยด้านล่าง เลือกวัสดุอื่นเพื่อทดสอบต่อได้เลย', 'ok');
      } else done(`บันทึกรอยกดที่ ${hm.dents.length} แล้ว`, `บันทึกรอยกดที่ ${hm.dents.length} แล้ว ทำต่อจนครบ 3 รอย`);
      drawView();
    }
    async function nextDent() {
      hm.busy = true; renderProc();
      await anim(600, u => setAnvil(1 - u));
      hm.busy = false;
      hm.step = 5; hm.cur = null; hm.warn = null; hm.pickTxt.length = 5;
      lcd.textContent = hm.mode === 'HB' ? (hm.load >= 187.5 ? 'hb30' : 'hb10') : hm.mode === 'HV' ? 'hv' : (hm.load === 100 ? 'hrb' : 'hrc');
      renderProc(); drawView();
      status(`เลื่อนชิ้นงานไปตำแหน่งที่ ${hm.dents.length + 1} แล้ว (ห่างจากรอยเดิมพอสมควร)`);
    }
    const SC_TOL = 0.04; // วัดคลาดได้ไม่เกิน 4% ถือว่าเส้นเล็งตรงขอบรอย
    const hbOf = (F, D, d) => 2 * F / (Math.PI * D * (D - Math.sqrt(D * D - d * d)));

    /* ---- กล้องไมโครสโคป / ภาพรอยกด ---- */
    function drawView() {
      const box = q('.h-view'), M = hm.mode, c = hm.cur;
      // มุมมองด้านบนของชิ้นงาน แสดงตำแหน่งรอยกดที่ทำไปแล้ว
      const top = `<svg viewBox="0 0 220 120" style="width:100%;max-width:300px;display:block;margin:0 auto">
          <circle cx="60" cy="60" r="50" fill="url(#gm-${hm.mat}-v)" stroke="${MATS[hm.mat].d}"/>
          ${hm.polished ? '<path d="M28 34 Q60 18 92 34" stroke="#fff" stroke-width="3" opacity=".55" fill="none"/>' : '<g stroke="rgba(0,0,0,.35)">' + [20, 34, 48, 62, 76, 90].map(y => `<line x1="18" y1="${y}" x2="102" y2="${y + 6}"/>`).join('') + '</g>'}
          ${hm.dents.map((d, i) => { const p = [[42, 46], [78, 46], [60, 80]][i]; return M === 'HV' ? `<rect x="${p[0] - 4}" y="${p[1] - 4}" width="8" height="8" transform="rotate(45 ${p[0]} ${p[1]})" fill="#333"/>` : `<circle cx="${p[0]}" cy="${p[1]}" r="${M === 'HR' ? 2.5 : 5}" fill="#333"/>`; }).join('')}
          <text x="122" y="40" font-size="12" fill="var(--text)" font-weight="700">${MATS[hm.mat].name}</text>
          <text x="122" y="58" font-size="11" fill="var(--muted)">เพลากลม ⌀ 25 mm</text>
          <text x="122" y="76" font-size="11" fill="var(--muted)">รอยกด ${hm.dents.length} / 3</text>
          <text x="122" y="94" font-size="11" fill="var(--muted)">${hm.polished ? 'ผิวขัดเงาแล้ว' : 'ผิวยังไม่ขัด'}</text></svg>`;
      if (M === 'HR') {
        let s = `<p class="lab-step" style="margin-top:0"><span class="n">🔍</span>ภาพตัดขยาย: หัวกดจมลงในผิวชิ้นงาน</p>`;
        if (c) {
          const depthPx = Math.min(70, c.h / 0.002 * 0.55 + 6);
          const cone = hm.ind === 'cone';
          s += `<svg viewBox="0 0 300 200" style="width:100%;max-width:340px;display:block;margin:0 auto">
            <rect x="10" y="80" width="190" height="110" fill="url(#gm-${hm.mat}-v)" stroke="${MATS[hm.mat].d}"/><g transform="translate(-45 0)">
            ${cone ? `<path d="M120 ${80 + depthPx} L150 ${80 + depthPx + 6} L180 ${80 + depthPx}" fill="none" stroke="#111" stroke-width="1"/><path d="M110 80 L150 ${80 + depthPx + 6} L190 80" fill="var(--surface)" stroke="#111"/>`
            : `<path d="M112 80 A40 ${depthPx} 0 0 0 188 80" fill="var(--surface)" stroke="#111"/>`}
            </g><line x1="160" y1="80" x2="160" y2="${80 + depthPx + (cone ? 6 : 0)}" stroke="var(--accent)" stroke-width="2" marker-start="url(#mArrA)" marker-end="url(#mArrA)"/>
            <line x1="140" y1="80" x2="214" y2="80" stroke="var(--accent)" stroke-dasharray="3 2"/><text x="214" y="${86 + depthPx / 2}" font-size="14" font-weight="700" fill="var(--accent)">h = ${N(c.h, 3)} mm</text>
            <text x="150" y="40" text-anchor="middle" font-size="12" fill="var(--muted)">(ขยายความลึกให้เห็นชัด)</text></svg>`;
          s += LF('ความลึกถาวรของรอยกด → ค่าความแข็ง', c.scaleB ? `HRB = 130 − ${FR('h', '0.002')}` : `HRC = 100 − ${FR('h', '0.002')}`, `= ${c.scaleB ? 130 : 100} − ${FR(N(c.h, 3), '0.002')}`, c.bad ? `= ${N(c.val, 1)} → ${c.bad === 'over' ? 'เกิน 100 ใช้สเกลนี้ไม่ได้' : 'ต่ำกว่าช่วงใช้งาน'}` : `= ${N(c.val, 1)} ${c.scaleB ? 'HRB' : 'HRC'}`, 'hl');
          if (c.bad === 'over') s += '<div class="note note-warn"><b>⚠️</b>วัสดุแข็งเกินสเกล B ให้เปลี่ยนเป็นสเกล C (หัวเพชรกรวย 150 kgf)</div>';
          if (c.bad === 'under') s += `<div class="note note-warn"><b>⚠️</b>${c.scaleB ? 'วัสดุนิ่มเกินสเกล B' : 'ค่าต่ำกว่า 20 HRC ไม่ควรใช้สเกล C ให้ใช้สเกล B (ลูกบอล 100 kgf)'}</div>`;
        } else s += top;
        box.innerHTML = s;
        return;
      }
      if (!c) { box.innerHTML = `<p class="lab-step" style="margin-top:0"><span class="n">🔍</span>ชิ้นทดสอบ</p>${top}`; return; }
      const dMax = Math.max(c.d1, c.d2);
      const fov = Math.ceil(dMax * 1.7 * 10) / 10, ts = niceStep(fov / 25);
      const [m1, m2] = hm.scopeD;
      box.innerHTML = `<p class="lab-step" style="margin-top:0"><span class="n">🔍</span>กล้องไมโครสโคปสเกล (ช่องมองกว้าง ${tick(fov)} mm)</p>
        <div class="scope"><svg viewBox="0 0 300 300" class="sc-svg"></svg></div>
        <div class="scope-ctl">
          <label><span class="sc-lb">d₁ (แนวนอน)</span><button type="button" class="btn btn-sm sc-fine" data-s="sc1" data-d="-1" aria-label="ลด d₁">−</button><input type="range" class="sc1" min="0" max="${fov}" step="${fov / 600}" value="${m1}"><button type="button" class="btn btn-sm sc-fine" data-s="sc1" data-d="1" aria-label="เพิ่ม d₁">+</button><output class="o1"></output></label>
          <label><span class="sc-lb">d₂ (แนวตั้ง)</span><button type="button" class="btn btn-sm sc-fine" data-s="sc2" data-d="-1" aria-label="ลด d₂">−</button><input type="range" class="sc2" min="0" max="${fov}" step="${fov / 600}" value="${m2}"><button type="button" class="btn btn-sm sc-fine" data-s="sc2" data-d="1" aria-label="เพิ่ม d₂">+</button><output class="o2"></output></label>
        </div>
        <div class="note note-warn sc-msg" hidden></div>
        <div class="lf-list sc-lf"></div>
        <p class="small muted" style="margin:6px 0 0">เลื่อนแถบให้เส้นเล็งแตะขอบรอยกดพอดี เส้นจะเปลี่ยนเป็น<b style="color:var(--ok)">สีเขียว</b> · หน้าจอเครื่องแสดง ${N(c.val, 0)} ${M}</p>`;
      const svgS = box.querySelector('.sc-svg'), lf = box.querySelector('.sc-lf');
      const sc = 300 / fov, cx = 150, cy = 150;
      let base = '';
      if (!hm.polished) for (let i = 0; i < 18; i++) base += `<line x1="0" y1="${i * 18}" x2="300" y2="${i * 18 + 30}" stroke="rgba(0,0,0,.18)" stroke-width="2"/>`;
      if (M === 'HB') base += `<ellipse cx="${cx}" cy="${cy}" rx="${c.d1 * sc / 2}" ry="${c.d2 * sc / 2}" fill="url(#gDent)" stroke="#222" stroke-width="1.5"/>`;
      else base += `<path d="M${cx - c.d1 * sc / 2} ${cy} L${cx} ${cy - c.d2 * sc / 2} L${cx + c.d1 * sc / 2} ${cy} L${cx} ${cy + c.d2 * sc / 2} Z" fill="#7c828a" stroke="#222" stroke-width="1.5"/><path d="M${cx - c.d1 * sc / 2} ${cy} L${cx + c.d1 * sc / 2} ${cy} M${cx} ${cy - c.d2 * sc / 2} L${cx} ${cy + c.d2 * sc / 2}" stroke="#444" stroke-width="1"/>`;
      for (let t = 0, i = 0; t <= fov + 1e-9; t += ts, i++) {
        const x = t * sc, big = i % 5 === 0;
        base += `<line x1="${x}" y1="266" x2="${x}" y2="${266 - (big ? 12 : 6)}" stroke="#1a1a1a" stroke-width="1"/>`;
        if (big) base += `<text x="${x}" y="282" text-anchor="middle" font-size="10" fill="#1a1a1a">${tick(t)}</text>`;
      }
      const upd = () => {
        const a = +box.querySelector('.sc1').value, b = +box.querySelector('.sc2').value;
        hm.scopeD = [a, b];
        const ok1 = Math.abs(a - c.d1) / c.d1 <= SC_TOL, ok2 = Math.abs(b - c.d2) / c.d2 <= SC_TOL;
        if (ok1 && ok2) box.querySelector('.sc-msg').hidden = true;
        const c1 = ok1 ? '#1d7a46' : '#d62828', c2 = ok2 ? '#1d7a46' : '#d62828';
        svgS.innerHTML = base
          + `<line x1="${cx - a * sc / 2}" y1="20" x2="${cx - a * sc / 2}" y2="250" stroke="${c1}" stroke-width="2"/><line x1="${cx + a * sc / 2}" y1="20" x2="${cx + a * sc / 2}" y2="250" stroke="${c1}" stroke-width="2"/>`
          + `<line x1="20" y1="${cy - b * sc / 2}" x2="280" y2="${cy - b * sc / 2}" stroke="${c2}" stroke-width="2" stroke-dasharray="6 3"/><line x1="20" y1="${cy + b * sc / 2}" x2="280" y2="${cy + b * sc / 2}" stroke="${c2}" stroke-width="2" stroke-dasharray="6 3"/>`;
        box.querySelector('.o1').textContent = `${N(a, 3)} mm`;
        box.querySelector('.o2').textContent = `${N(b, 3)} mm`;
        const dm = (a + b) / 2;
        let h = LF(M === 'HB' ? 'ขนาดรอยกดเฉลี่ย' : 'เส้นทแยงมุมเฉลี่ย', `d = ${FR('d₁ + d₂', '2')}`, `= ${FR(`${N(a, 3)} + ${N(b, 3)}`, '2')}`, `= ${N(dm, 3)} mm`);
        if (M === 'HB' && dm > 0 && dm < 2.5) h += LF('ความแข็งบริเนลล์จากขนาดรอยที่วัดได้', `HB = ${FR('2F', 'πD (D − √(D² − d²))')}`, `= ${FR(`2 × ${hm.load}`, `π × 2.5 (2.5 − √(2.5² − ${N(dm, 3)}²))`)}`, `= ${N(hbOf(hm.load, 2.5, dm), 0)} HB`, 'hl');
        if (M === 'HV' && dm > 0) h += LF('ความแข็งวิคเกอร์สจากขนาดรอยที่วัดได้', `HV = ${FR('1.8544 F', 'd²')}`, `= ${FR(`1.8544 × ${hm.load}`, `${N(dm, 3)}²`)}`, `= ${N(1.8544 * hm.load / dm ** 2, 0)} HV`, 'hl');
        lf.innerHTML = h;
      };
      box.querySelector('.sc1').addEventListener('input', upd);
      box.querySelector('.sc2').addEventListener('input', upd);
      // ปุ่ม − / + ปรับละเอียดครั้งละ 0.01 mm (กดค้างได้)
      box.querySelectorAll('.sc-fine').forEach(btn => {
        let tm;
        const nudge = () => { const r = box.querySelector('.' + btn.dataset.s); r.value = Math.min(fov, Math.max(0, +r.value + btn.dataset.d * 0.01)); upd(); };
        const stop = () => clearTimeout(tm);
        btn.addEventListener('pointerdown', e => { e.preventDefault(); nudge(); const rep = (d) => { tm = setTimeout(() => { nudge(); rep(60); }, d); }; rep(400); });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, stop));
        btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nudge(); } });
      });
      upd();
    }

    /* ---- ตารางและการคำนวณค่าเฉลี่ย ---- */
    function makeTbl() {
      const M = hm.mode;
      const cols = M === 'HR'
        ? [{ h: 'รอยกดที่', f: (r, i) => i + 1 }, { h: 'ความลึก h (mm)', f: r => N(r.h, 3) }, { h: 'ค่าความแข็ง', f: r => r.bad ? `<span style="color:var(--bad)">${r.bad === 'over' ? 'เกินสเกล' : 'ต่ำเกินสเกล'}</span>` : `${N(r.val, 1)} ${r.scaleB ? 'HRB' : 'HRC'}` }]
        : [{ h: 'รอยกดที่', f: (r, i) => i + 1 }, { h: 'd₁ (mm)', f: r => N(r.d1, 3) }, { h: 'd₂ (mm)', f: r => N(r.d2, 3) }, { h: 'd เฉลี่ย (mm)', f: r => N(r.d, 3) }, { h: `${M} (คำนวณ)`, f: r => N(r.val, 0) }, { h: `${M} (หน้าจอ)`, f: r => N(r.screen, 0) }];
      tbl = makeTable(q('.rec-wrap'), cols);
      tbl.clear();
    }
    function calc() {
      const ds = hm.dents, M = hm.mode;
      if (!ds.length) { q('.h-calc').innerHTML = ''; return; }
      const good = ds.filter(d => !d.bad);
      const sym = M === 'HR' ? (hm.load === 100 ? 'HRB' : 'HRC') : M;
      let h = '';
      if (good.length) {
        const avg = good.reduce((a, d) => a + d.val, 0) / good.length;
        h += LF(`ค่าความแข็งเฉลี่ย (รอยกด ${good.length} รอย)`, `${sym}<sub>เฉลี่ย</sub> = ${FR('ผลรวม', 'จำนวนรอย')}`, `= ${FR(good.map(d => N(d.val, M === 'HR' ? 1 : 0)).join(' + '), good.length)}`, `= ${N(avg, M === 'HR' ? 1 : 0)} ${sym}`, 'hl');
        hm.avg = avg;
      }
      if (M === 'HB' && ds[ds.length - 1].ratio) {
        const r = ds[ds.length - 1].ratio;
        if (r < 0.24 || r > 0.6) h += `<div class="note note-warn"><b>⚠️</b>ขนาดรอยกด d/D = ${N(r, 2)} อยู่นอกช่วงที่เชื่อถือได้ (0.24–0.6) ${r > 0.6 ? 'รอยใหญ่เกินไป ควรลดน้ำหนักกดเป็น 62.5 kp' : 'รอยเล็กเกินไป ควรเพิ่มน้ำหนักกดเป็น 187.5 kp'}</div>`;
        else h += `<p class="small muted" style="margin:4px 2px 0">ตรวจสอบ: d/D = ${N(r, 2)} อยู่ในช่วง 0.24–0.6 ✔ เลือกน้ำหนักกดเหมาะสม</p>`;
      }
      if (M === 'HB' && hm.mat === 'hard') h += '<p class="small muted" style="margin:4px 2px 0">วัสดุที่แข็งกว่า 450 HB ควรใช้ลูกบอลทังสเตนคาร์ไบด์ (สัญลักษณ์ HBW) เพราะลูกบอลเหล็กอาจยุบตัวเอง</p>';
      q('.h-calc').innerHTML = h;
    }
    function finishMat() {
      const M = hm.mode, sym = M === 'HR' ? (hm.load === 100 ? 'HRB' : 'HRC') : M;
      if (hm.avg == null || hm.dents.every(d => d.bad)) return;
      hm.cmp[M][`${hm.mat}|${sym}`] = { mat: hm.mat, v: hm.avg, sym };
      drawCmp();
    }
    function drawCmp() {
      const list = Object.values(hm.cmp[hm.mode]);
      const box = q('.compare-bar');
      if (!list.length) { box.innerHTML = '<p class="muted small" style="margin:0">ทดสอบครบ 3 รอยแล้ว ค่าเฉลี่ยของแต่ละวัสดุจะขึ้นที่นี่ ลองทดสอบหลาย ๆ วัสดุแล้วเปรียบเทียบกัน</p>'; return; }
      const max = Math.max(...list.map(x => x.v));
      box.innerHTML = list.sort((a, b) => b.v - a.v).map(x => `<div class="cb"><span>${MATS[x.mat].name}</span><div class="cb-track"><div class="cb-fill" style="width:${Math.max(3, x.v / max * 100)}%;background:${MATS[x.mat].line}"></div></div><span class="cb-v">${N(x.v, x.sym.startsWith('HR') ? 1 : 0)} ${x.sym}</span></div>`).join('')
        + '<p class="small muted" style="margin:6px 0 0">ยิ่งค่ามาก วัสดุยิ่งแข็ง (รอยกดยิ่งเล็กหรือยิ่งตื้น) · ค่าคนละวิธี (HB, HV, HR) เทียบกันตรง ๆ ไม่ได้</p>';
    }

    function newTest() {
      setMat(hm.mat);
      q('.mat-note').textContent = `${MATS[hm.mat].name}: ${MATS[hm.mat].note}`;
      Object.assign(hm, { step: 0, warn: null, dents: [], cur: null, polished: false, ind: null, load: null, time: null, busy: false, pickTxt: [], avg: null, k: jitter(0.03) });
      spec.setAttribute('fill', `url(#gm-${hm.mat}-h)`); spec.setAttribute('stroke', '#555');
      lcd.textContent = '----'; setAnvil(0); setLever(0); setTip(); wsel.setAttribute('y', 62);
      makeTbl(); calc(); renderProc(); drawView(); drawCmp();
      status('ทำทีละขั้นจากบนลงล่าง');
    }
    q('.h-tabs').addEventListener('click', e => {
      const b = e.target.closest('button[data-mode]'); if (!b || hm.busy) return;
      hm.mode = b.dataset.mode;
      q('.h-tabs').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      setTitle(); newTest();
    });
    function setTitle() {
      const M = MODES[hm.mode];
      q('.lab-top h3').textContent = `🔬 ห้องทดลองเสมือน · ใบงาน ${M.ws} ${M.title}`;
      q('.h-obj').innerHTML = `<b>จุดประสงค์:</b> ${M.obj}`;
    }
    hm.selectMode = mode => q(`.h-tabs [data-mode="${mode}"]`).click();
    root.hardness = hm;
    setTitle(); newTest();
  }

  /* ===== ภาพประกอบ: ความเค้นคือแรงเล็ก ๆ จำนวนมากบนหน้าตัด (รูป 2-1) ===== */
  function stressPlay(root) {
    root.innerHTML = `<div class="stress-play">
      <div class="svg-fig"><svg viewBox="0 0 360 230" class="sp-svg" role="img" aria-label="ความเค้นบนหน้าตัด"></svg></div>
      <div>
        <label class="small muted">แรงดึง F = <b class="sp-fv"></b> kN<input type="range" class="sp-f" min="1" max="200" step="1" value="10"></label>
        <label class="small muted">เส้นผ่าศูนย์กลาง d = <b class="sp-dv"></b> mm<input type="range" class="sp-d" min="4" max="50" step="0.5" value="10"></label>
        <div class="lf-list sp-lf"></div>
        <p class="small muted" style="margin:6px 0 0">ลองดู: แรงเท่าเดิม แต่ชิ้นงานใหญ่ขึ้น ลูกศรแต่ละอันจะสั้นลง (ความเค้นลดลง)</p>
        <div class="note note-info sp-unit" style="margin-top:10px"><b>📏 แปลงหน่วย mm → m ทำยังไง?</b>
          <div>1 m = 1,000 mm → ความยาว: เอา mm <b>÷ 1,000</b> ได้ m</div>
          <div>พื้นที่เป็น "ยาว × กว้าง" จึงต้องหาร 1,000 <b>สองครั้ง</b>: 1 m² = 1,000 × 1,000 = 1,000,000 mm² → เอา mm² <b>÷ 1,000,000</b> (หรือ × 10⁻⁶) ได้ m²</div>
          <div>แรง: 1 kN = 1,000 N → เอา kN <b>× 1,000</b> ได้ N</div>
          <div>ผลหาร N/m² ได้ตัวเลขยาวมาก จึงหารด้วย 1,000,000 (= 10⁶) ให้เป็น MN/m² · ทางลัด: <b>N ÷ mm² ได้ MN/m² ทันที</b></div>
        </div>
      </div></div>`;
    const svg = root.querySelector('.sp-svg');
    const draw = () => {
      const F = +root.querySelector('.sp-f').value, d = +root.querySelector('.sp-d').value;
      const A = Math.PI * d * d / 4, s = F * 1000 / A;
      root.querySelector('.sp-fv').textContent = N(F, 1);
      root.querySelector('.sp-dv').textContent = N(d, 1);
      const w = 30 + d * 2.4, cx = 70;
      const len = Math.min(40, 6 + s / 12);
      let g = `<rect x="${cx - w / 4}" y="10" width="${w / 2}" height="16" fill="#8a95a3"/><path d="M${cx - w / 4 - 10} 10 h${w / 2 + 20}" stroke="#555" stroke-width="3"/>
        <rect x="${cx - 9}" y="26" width="18" height="150" fill="url(#gm-steel-h)" stroke="#5d6876"/>
        <line x1="${cx}" y1="176" x2="${cx}" y2="210" stroke="var(--tension)" stroke-width="4" marker-end="url(#mArrT)"/>
        <text x="${cx + 10}" y="206" font-size="13" font-weight="700" fill="var(--tension)">F</text>
        <line x1="${cx - 22}" y1="100" x2="${cx + 22}" y2="100" stroke="var(--accent)" stroke-dasharray="4 3" stroke-width="2"/>
        <text x="${cx - 26}" y="104" text-anchor="end" font-size="12" fill="var(--accent)">ภาคตัด</text>
        <line x1="${cx + 24}" y1="100" x2="180" y2="${120}" stroke="var(--muted)"/>`;
      // ภาคตัดแบบสามมิติ และลูกศรแรงเล็ก ๆ จำนวนมาก
      // ขนาดภาพหน้าตัดโตตาม d แต่ไม่ล้นกรอบ (d สูงสุด 50 mm)
      const ox = 255, oy = 150, rx = 25 + d * 1.5, ry = rx * 0.36;
      g += `<ellipse cx="${ox}" cy="${oy}" rx="${rx}" ry="${ry}" fill="url(#gm-steel-v)" stroke="#5d6876" stroke-width="1.5"/>
        <path d="M${ox - rx} ${oy} v24 A${rx} ${ry} 0 0 0 ${ox + rx} ${oy + 24} v-24" fill="#8f99a6" stroke="#5d6876"/>`;
      for (let j = -1; j <= 1; j++) for (let i = -3; i <= 3; i++) {
        const x = ox + (i + (j === 0 ? 0.5 : 0)) * rx / 3.8, y = oy + j * ry / 1.8;
        if (((x - ox) / rx) ** 2 + ((y - oy) / ry) ** 2 > 0.8) continue;
        g += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - len}" stroke="var(--tension)" stroke-width="1.8" marker-end="url(#mArrT)"/>`;
      }
      g += `<text x="262" y="${oy + ry + 44}" text-anchor="middle" font-size="11" fill="var(--muted)">แรงเล็ก ๆ ต่อหนึ่งหน่วยพื้นที่ = ความเค้น</text>`;
      svg.innerHTML = g;
      const Am = A / 1e6, sPa = F * 1000 / Am;
      root.querySelector('.sp-lf').innerHTML = LF('① แปลงแรง kN → N (× 1,000)', `F = ${N(F, 1)} kN`, `= ${N(F, 1)} × 1,000`, `= ${N(F * 1000, 0)} N`)
        + LF('② พื้นที่หน้าตัด (คิดเป็น mm² ก่อน)', `A = ${FR('π d²', '4')}`, `= ${FR(`π × ${N(d, 1)}²`, '4')}`, `= ${N(A)} mm²`)
        + LF('③ แปลงพื้นที่ mm² → m² (÷ 1,000,000)', `A = ${N(A)} mm²`, `= ${FR(N(A), '1,000,000')}`, `= ${SCI(Am)} m²`)
        + LF('④ ความเค้น (หน่วย SI: N/m²)', `σ = ${FR('F', 'A')}`, `= ${FR(`${N(F * 1000, 0)} N`, `${SCI(Am)} m²`)}`, `= ${N(sPa, 0)} N/m²`)
        + LF('⑤ ทำให้ตัวเลขสั้นลง: N/m² → MN/m² (÷ 1,000,000)', `σ = ${FR(N(sPa, 0), '1,000,000')}`, '', `= ${N(s, 1)} MN/m²`, 'hl')
        + LF('✔ ทางลัด: ใช้ N กับ mm² ได้ MN/m² ทันที', `σ = ${FR(`${N(F * 1000, 0)} N`, `${N(A)} mm²`)}`, '', `= ${N(s, 1)} N/mm² = ${N(s, 1)} MN/m²`);
    };
    root.addEventListener('input', draw);
    draw();
  }

  /* ===== สร้างห้องทดลองทั้งหมดในหน้า ===== */
  const BUILD = { tensile: tensileLab, compression: compressionLab, shear: shearLab, torsion: torsionLab, hardness: hardnessLab, stress: stressPlay };
  document.querySelectorAll('[data-lab]').forEach(el => BUILD[el.dataset.lab] && BUILD[el.dataset.lab](el));
  // ข้อความในป้ายกำกับที่มีตัวห้อย ต้องรวมไว้ในกล่องเดียว ไม่อย่างนั้นจะถูกแยกบรรทัด
  document.querySelectorAll('.lab label').forEach(l => {
    const sp = document.createElement('span');
    while (l.firstChild && !/^(INPUT|SELECT|OUTPUT)$/.test(l.firstChild.nodeName)) sp.appendChild(l.firstChild);
    l.prepend(sp);
  });
  document.querySelectorAll('[data-utm-fig]').forEach(el => {
    el.innerHTML = utmSVG(el.dataset.utmFig, true);
    el.querySelector('.m-spec').innerHTML = specTension('steel', 0, 0, false, false);
  });
  document.querySelectorAll('[data-tester-fig]').forEach(el => {
    el.innerHTML = testerSVG().replace('</svg>', '<g font-size="11" fill="var(--text)"><text x="118" y="124">จอแสดงผล →</text><text x="128" y="176">คีย์บอร์ด →</text></g></svg>');
  });

  /* ===== ลิงก์ไปห้องทดลองที่อยู่ในแท็บที่ซ่อนอยู่ ให้เปิดแท็บนั้นก่อน ===== */
  function openFor(hash) {
    const t = hash && document.getElementById(hash.slice(1));
    if (!t) return;
    const panel = t.closest('.tab-panel');
    if (panel && panel.hidden) {
      const btn = document.querySelector(`[data-tabs] button[data-tab="${panel.dataset.panel}"]`);
      if (btn) btn.click();
    }
    const mode = t.dataset.mode;
    if (mode) { const lab = t.closest('[data-lab="hardness"]') || t; if (lab.hardness) lab.hardness.selectMode(mode); }
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const t = document.getElementById(id.slice(1));
    if (!t) return;
    if (a.dataset.mode) t.dataset.mode = a.dataset.mode; else delete t.dataset.mode;
    openFor(id);
  });
  if (location.hash) openFor(location.hash);
})();
