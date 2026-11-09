/* ===== บทที่ 5 (ต่อ): ชุดทดลองท่อเสมือน ใบงาน 5.1–5.3 · การสูญเสียรอง · แบบทดสอบ · สรุปสูตร =====
   ต้องโหลด js/common.js และ js/pipe.js ก่อน (ใช้ AREA, fOf, rrFrom, colebrook, moodySVG, VH, NR, badge)
   ค่าในชุดทดลองเสมือนเป็น "ค่าจำลอง": ε ของท่อ, k จริงของวาล์ว/ข้อต่อ, เฮดของปั๊ม ตั้งให้ใกล้ตัวอย่าง 5.5 และ 5.9 ในหนังสือ */

const NU30 = 8.03e-7;   // ความหนืดจลน์ของน้ำ 30 °C (ตัวอย่าง 5.5)

/* ---------- ตำแหน่งในแผนผังชุดทดลอง (viewBox 760 × 420) ---------- */
const RY = { L1: 44, L2: 84, L3: 124, L4: 164, L5: 212, RET: 304 };
const PT = {
  1: [16, 26], 2: [47, 12], 3: [36, 348], 4: [58, 348], 5: [178, 336], 6: [112, 290], 7: [150, 44], 8: [150, 64],
  10: [198, 44], 11: [226, 44], 12: [664, 44], 13: [198, 84], 14: [226, 84], 15: [664, 84],
  16: [198, 124], 17: [226, 124], 18: [664, 124], 19: [198, 164], 20: [226, 164], 21: [335.5, 164], 22: [445, 164], 23: [554.5, 164], 24: [664, 164],
  25: [186, 212], 26: [206, 212], 27: [226, 212], 28: [270, 212], 29: [290, 212], 30: [310, 212], 31: [354, 212], 32: [374, 212], 33: [394, 212],
  34: [438, 212], 35: [458, 212], 36: [478, 212], 37: [530, 212], 38: [580, 240], 39: [580, 274], 40: [700, 238], 41: [672, 292], 42: [580, 304],
  43: [542, 304], 44: [490, 262], 45: [436, 304], 46: [396, 304], 47: [352, 304]
};
const VALVES = { 5: 'h', 6: 'v', 10: 'h', 13: 'h', 16: 'h', 19: 'h', 26: 'h', 29: 'h', 32: 'h', 35: 'h' };
const TAPS = [11, 12, 14, 15, 17, 18, 20, 21, 22, 23, 24, 25, 27, 28, 30, 31, 33, 34, 36, 37, 38, 40, 41, 43, 44, 45, 46, 47];
const RET_PATH = [[672, 304], [542, 304], [525, 304], [525, 262], [455, 262], [455, 304], [262, 304], [262, 346]];
const FLOW_PATH = {
  L1: [[700, 44], [700, 250], [672, 278], [672, 304]],
  L2: [[700, 84], [700, 250], [672, 278], [672, 304]],
  L3: [[700, 124], [700, 250], [672, 278], [672, 304]],
  L4: [[700, 164], [700, 250], [672, 278], [672, 304]],
  L5: [[580, 212], [580, 304], [542, 304]]
};
const LINE_INFO = {
  L1: { name: 'ท่อ 1 นิ้ว', D: 0.025, eps: 0.20e-3, valve: 10 },
  L2: { name: 'ท่อ 3/4 นิ้ว', D: 0.021, eps: 0.27e-3, valve: 13 },
  L3: { name: 'ท่อ PVC 1/2 นิ้ว', D: 0.018, eps: 0.005e-3, valve: 16 },
  L4: { name: 'ท่อเหล็กอาบสังกะสี 1/2 นิ้ว', D: 0.018, eps: 0.20e-3, valve: 19 },
  L5: { name: 'แนววาล์ว (ท่อ 3/4 นิ้ว)', D: 0.021, eps: 0.27e-3, valve: null }
};
/* วาล์วที่ต้องเปิด/ปิดของแต่ละแนวท่อ (ตามใบงาน) */
const VALVE_SET = {
  L1: { open: [10], close: [13, 16, 19, 32] }, L2: { open: [13], close: [10, 16, 19, 32] },
  L3: { open: [16], close: [10, 13, 19, 32] }, L4: { open: [19], close: [10, 13, 16, 32] },
  L5: { open: [26, 29, 32, 35], close: [10, 13, 16, 19] }
};

const PIPE_PARTS = {
  mano: { r: [6, 4, 70, 352], t: 'มาโนมิเตอร์: หลอดแก้ว 2 หลอดต่อกันด้านบน (ตัว U กลับหัว) จุด 1 ต่อสูบลม จุด 2 วาล์วปล่อยลม จุด 3 และ 4 ต่อสายยางไปยังจุดวัดความดัน ผลต่างระดับน้ำ = การสูญเสียระหว่าง 2 จุด' },
  pump: { r: [122, 326, 226, 86], t: 'ปั๊มน้ำดูดน้ำจากถัง ส่งขึ้นท่อแนวตั้ง (ผ่านวาล์ว 6) ไปยังแผงท่อทดสอบ แล้วไหลกลับลงถัง ใช้น้ำวนซ้ำ' },
  v5: { r: [160, 322, 38, 28], t: 'วาล์ว 5 อยู่บนท่อไหลกลับเข้าถัง (ทางลัด/บายพาส) หมุนตามเข็มนาฬิกา = ปิดทางลัด น้ำถูกบังคับเข้าท่อทดสอบมากขึ้น อัตราการไหลจึงเพิ่มขึ้น' },
  meter: { r: [296, 288, 34, 34], t: 'มาตรวัดน้ำ (Water Meter) อ่านปริมาตรน้ำที่ไหลผ่าน ใช้คู่กับนาฬิกาจับเวลา หาอัตราการไหล Q = V/t' },
  L1: { r: [180, 34, 530, 20], t: 'ท่อ 1 นิ้ว (เส้นผ่านศูนย์กลางภายใน 25 mm) วาล์ว 10 เปิด-ปิดแนวท่อ จุดวัดความดัน 11 และ 12 ห่างกัน 1.25 m' },
  L2: { r: [180, 74, 530, 20], t: 'ท่อ 3/4 นิ้ว (21 mm) วาล์ว 13 · จุดวัด 14 และ 15 ห่างกัน 1.25 m · ใช้ในใบงาน 5.1 ตอนที่ 2 และ 3' },
  L3: { r: [180, 114, 530, 20], t: 'ท่อ PVC 1/2 นิ้ว (18 mm) ผิวเรียบ วาล์ว 16 · จุดวัด 17 และ 18 ห่างกัน 1.25 m · ใช้ในใบงาน 5.1 ตอนที่ 2 และใบงาน 5.2' },
  L4: { r: [180, 154, 530, 20], t: 'ท่อเหล็กอาบสังกะสี 1/2 นิ้ว (18 mm) วาล์ว 19 · จุดวัด 20, 21, 22, 23, 24 ห่างกันจุดละ 0.35 m · ใช้ในใบงาน 5.1 ตอนที่ 1 และใบงาน 5.2' },
  L5: { r: [176, 198, 316, 28], t: 'แนววาล์ว: Globe Valve (26), Gate Valve (29), Ball Valve (32), Check Valve (35) แต่ละตัวมีจุดวัดความดันด้านหน้าและด้านหลัง ใช้ในใบงาน 5.3 ตอนที่ 1' },
  fit: { r: [338, 224, 376, 96], t: 'ข้องอ 90° (37–38) · ข้องอ 45° 2 ตัว (40–41) · ข้อโค้ง 90° รัศมีสั้น 2 ตัว (43–44) · ข้อโค้ง 90° รัศมียาว 2 ตัว (44–45) · ท่อเพิ่มขนาดฉับพลัน (45–46) · ท่อลดขนาดฉับพลัน (46–47) ใช้ในใบงาน 5.3 ตอนที่ 2 และ 3' }
};

/* ---------- วาดแผนผังชุดทดลอง ---------- */
function rigFigSVG(s = {}) {
  const open = n => (s.open || []).includes(n);
  const poly = pts => pts.map(p => p.join(',')).join(' ');
  let h = `<defs><marker id="arR" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="var(--water)"/></marker></defs>`;
  const pipe = (pts, w = 5, c = 'var(--metal)') => `<polyline points="${poly(pts)}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/>`;
  // ถังและปั๊ม
  h += `<rect x="200" y="346" width="140" height="58" rx="4" fill="var(--water)" opacity=".25" stroke="var(--text)" stroke-width="1.5"/><text x="300" y="396" text-anchor="middle" class="svg-m" style="font-size:11px">ถังน้ำ</text>`;
  h += pipe([[200, 396], [163, 390]]) + pipe([[137, 388], [112, 388], [112, 44], [150, 44]]) + pipe([[150, 44], [150, 212]]);
  h += `<circle cx="150" cy="388" r="13" fill="var(--surface)" stroke="var(--text)" stroke-width="1.5"/><path d="M144,394 L150,380 L156,394" fill="none" stroke="var(--text)"/><text x="150" y="414" text-anchor="middle" class="svg-m" style="font-size:10px">ปั๊มน้ำ</text>`;
  h += pipe([[112, 336], [232, 336], [232, 346]]);
  // แนวท่อ
  ['L1', 'L2', 'L3', 'L4'].forEach(k => { h += pipe([[150, RY[k]], [700, RY[k]]], k === 'L1' ? 7 : k === 'L2' ? 6 : 5, k === 'L3' ? 'var(--pvc)' : 'var(--metal)'); });
  h += pipe([[700, 44], [700, 250], [672, 278], [672, 304], [542, 304]], 6) + pipe([[542, 304], [525, 304], [525, 262], [455, 262], [455, 304]], 6) + pipe([[455, 304], [262, 304], [262, 346]], 6);
  h += pipe([[150, 212], [580, 212], [580, 304]], 6);
  h += `<rect x="372" y="295" width="48" height="18" rx="3" fill="var(--metal)" stroke="var(--text)"/>`;   // ท่อใหญ่ 46
  h += `<circle cx="312" cy="304" r="12" fill="var(--surface)" stroke="var(--text)" stroke-width="1.5"/><line x1="312" y1="304" x2="${312 + 7 * Math.cos(s.meterAng || 0)}" y2="${304 + 7 * Math.sin(s.meterAng || 0)}" stroke="var(--bad)" stroke-width="2"/><text x="312" y="330" text-anchor="middle" class="svg-m" style="font-size:9px">Water Meter</text>`;
  // การไหล
  if (s.flowLine) {
    const dur = (1.3 / clamp(s.v || 1, .3, 4)).toFixed(2);
    const main = s.flowLine === 'L5' ? [[150, 388], [112, 388], [112, 44], [150, 44], [150, 212], [580, 212], [580, 304], ...RET_PATH.slice(1)]
      : [[150, 388], [112, 388], [112, 44], [150, 44], [150, RY[s.flowLine]], ...FLOW_PATH[s.flowLine], ...RET_PATH.slice(1)];
    h += `<polyline points="${poly(main)}" fill="none" stroke="var(--water)" stroke-width="2.5" class="flowline" style="animation-duration:${dur}s"/>`;
  }
  if (s.pump) h += `<polyline points="${poly([[112, 336], [232, 336], [232, 346]])}" fill="none" stroke="var(--water)" stroke-width="2" class="flowline" style="animation-duration:${(0.6 + (s.turns || 0) * 0.25).toFixed(2)}s;opacity:${(1 - (s.turns || 0) / 11).toFixed(2)}"/>`;
  // มาโนมิเตอร์
  const yC = cm => 330 - cm / 100 * 290;
  h += `<polyline points="36,338 36,26 58,26 58,338" fill="none" stroke="var(--text)" stroke-width="7"/><polyline points="36,338 36,26 58,26 58,338" fill="none" stroke="var(--glass)" stroke-width="5"/>`;
  const lv = s.mano;
  if (lv) { [[36, lv[0]], [58, lv[1]]].forEach(([x, cm]) => { const y = clamp(yC(cm), 26, 338); h += `<line x1="${x}" x2="${x}" y1="${y}" y2="338" stroke="var(--water)" stroke-width="5"/>`; }); }
  h += `<line x1="16" x2="36" y1="26" y2="26" stroke="var(--text)" stroke-width="2"/><circle cx="16" cy="26" r="3" fill="var(--text)"/><text x="12" y="18" class="svg-m" style="font-size:10px">1</text>`;
  h += `<circle cx="47" cy="14" r="5" fill="${s.v2open ? 'var(--ok)' : 'var(--bad)'}" stroke="var(--text)"/><text x="56" y="12" class="svg-m" style="font-size:10px">2</text>`;
  h += `<text x="30" y="362" class="svg-m" style="font-size:10px">3</text><text x="56" y="362" class="svg-m" style="font-size:10px">4</text>`;
  h += `<text x="47" y="${200}" transform="rotate(-90 47 200)" text-anchor="middle" class="svg-m" style="font-size:10px">Manometer</text>`;
  // สายยาง
  [[s.hose3, 36, 'var(--accent)'], [s.hose4, 58, 'var(--hm)']].forEach(([t, x, c]) => {
    if (!t || !PT[t]) return;
    const [tx, ty] = PT[t];
    h += `<path d="M${x},344 C${x},392 ${tx},${ty + 150} ${tx},${ty + 4}" fill="none" stroke="${c}" stroke-width="2.5" opacity=".85"/>`;
  });
  // วาล์วทั้งหมด
  Object.entries(VALVES).forEach(([n, o]) => {
    const [x, y] = PT[n]; n = +n;
    const isOpen = n === 5 ? true : n === 6 ? true : open(n);
    const c = n === 5 ? 'var(--accent)' : isOpen ? 'var(--ok)' : 'var(--bad)';
    h += o === 'h' ? `<polygon points="${x - 7},${y - 7} ${x + 7},${y + 7} ${x + 7},${y - 7} ${x - 7},${y + 7}" fill="${c}" stroke="var(--text)" stroke-width="1"/>`
      : `<polygon points="${x - 7},${y - 7} ${x + 7},${y + 7} ${x - 7},${y + 7} ${x + 7},${y - 7}" fill="${c}" stroke="var(--text)" stroke-width="1"/>`;
    h += `<text x="${o === 'h' ? x : x - 12}" y="${o === 'h' ? y - 10 : y + 4}" text-anchor="middle" style="font-size:10px;fill:var(--text);font-weight:700">${n}</text>`;
  });
  // จุดวัดความดัน
  TAPS.forEach(n => {
    const [x, y] = PT[n], on = (s.taps || []).includes(n);
    h += `<circle cx="${x}" cy="${y}" r="${on ? 5 : 3.6}" fill="${on ? 'var(--accent)' : 'var(--surface)'}" stroke="var(--text)" stroke-width="1.2"/>`;
    const below = y >= 230 || [37].includes(n);
    h += `<text x="${x}" y="${below ? y + 15 : y - 7}" text-anchor="middle" style="font-size:9px;fill:${on ? 'var(--accent)' : 'var(--muted)'};font-weight:${on ? 700 : 400}">${n}</text>`;
  });
  h += `<text x="152" y="${RY.L1 - 18}" style="font-size:10px;fill:var(--muted)">7</text>`;
  ['L1', 'L2', 'L3', 'L4'].forEach(k => { h += `<text x="712" y="${RY[k] + 4}" style="font-size:10px;fill:var(--muted)">${{ L1: '1"', L2: '3/4"', L3: 'PVC ½"', L4: 'GI ½"' }[k]}</text>`; });
  if (s.part && PIPE_PARTS[s.part]) { const r = PIPE_PARTS[s.part].r; h += `<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" rx="8" fill="var(--accent)" opacity=".15" stroke="var(--accent)" stroke-width="2.5"/>`; }
  return h;
}

(function rigFigure() {
  const svg = $('#rigFig'); if (!svg) return;
  svg.innerHTML = rigFigSVG({});
  $('#rigParts').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('#rigParts button').forEach(x => x.classList.toggle('on', x === b));
    svg.innerHTML = rigFigSVG({ part: b.dataset.p });
    $('#rigPartTxt').textContent = PIPE_PARTS[b.dataset.p].t;
  });
})();

/* =====================================================================
   ชุดทดลองเสมือน ใบงาน 5.1 / 5.2 / 5.3
   ===================================================================== */
const PLAB = {
  '5.1': { title: 'ใบงาน 5.1 งานทดลองการสูญเสียหลัก', parts: [
    { key: 'p1', name: 'ตอนที่ 1 ความยาวท่อ', type: 'L', fixedTurns: 5,
      aim: 'ศึกษาความสัมพันธ์ระหว่างความยาวท่อ กับการสูญเสียหลัก',
      steps: ['ต่อสายยางจุด 3 เข้ากับจุด 20 และจุด 4 เข้ากับจุด 21', 'ตั้งวาล์ว: ปิด 10, 13, 16, 32 เปิด 19 และเปิดวาล์วจุดวัดความดัน', 'หมุนวาล์ว 5 ตามเข็มนาฬิกา 5 รอบ เปิดปั๊ม ปิดวาล์ว 2 แล้วสูบลมจนอ่านระดับน้ำได้', 'อ่านระดับน้ำทั้ง 2 หลอด บันทึก', 'ย้ายสายยางจุด 4 ไปที่จุด 22, 23, 24 ตามลำดับ (จุดละ 0.35 m)'],
      items: [20, 21, 22, 23].map((b, i) => ({ id: 'L' + (i + 1), label: `จุด 20 กับจุด ${b + 1}`, taps: [20, b + 1], line: 'L4', kind: 'pipe', L: +(0.35 * (i + 1)).toFixed(2) })) },
    { key: 'p2', name: 'ตอนที่ 2 ขนาดท่อ', type: 'D', fixedTurns: 5,
      aim: 'ศึกษาความสัมพันธ์ระหว่างขนาดเส้นผ่านศูนย์กลางท่อ กับการสูญเสียหลัก',
      steps: ['ทดสอบท่อ 1/2 นิ้ว (18 mm) ใช้จุด 17 กับ 18 เปิดวาล์ว 16', 'ทดสอบท่อ 3/4 นิ้ว (21 mm) ใช้จุด 14 กับ 15 เปิดวาล์ว 13', 'ทดสอบท่อ 1 นิ้ว (25 mm) ใช้จุด 11 กับ 12 เปิดวาล์ว 10', 'วาล์ว 5 หมุนไว้ 5 รอบเท่ากันทุกท่อ อ่านระดับน้ำ บันทึก'],
      items: [{ id: 'D18', label: 'จุด 17 กับจุด 18 (18 mm)', taps: [17, 18], line: 'L3', kind: 'pipe', L: 1.25 }, { id: 'D21', label: 'จุด 14 กับจุด 15 (21 mm)', taps: [14, 15], line: 'L2', kind: 'pipe', L: 1.25 }, { id: 'D25', label: 'จุด 11 กับจุด 12 (25 mm)', taps: [11, 12], line: 'L1', kind: 'pipe', L: 1.25 }] },
    { key: 'p3', name: 'ตอนที่ 3 ความเร็วการไหล', type: 'V', startTurns: 2, step: 5, trials: 5,
      aim: 'ศึกษาความสัมพันธ์ระหว่างความเร็วในการไหล กับการสูญเสียหลัก',
      steps: ['ต่อสายยางจุด 3 → 14, จุด 4 → 15 เปิดวาล์ว 13 (ปิด 10, 16, 19, 32)', 'หมุนวาล์ว 5 ตามเข็ม 2 รอบ เปิดปั๊ม ปิดวาล์ว 2 สูบลมจนอ่านได้', 'ครั้งที่ 1: ค่อย ๆ หมุนวาล์ว 5 จนผลต่างระดับน้ำประมาณ 5 cm', 'จับเวลาน้ำไหล 10 ลิตรจากมาตรวัดน้ำ อ่านระดับน้ำ บันทึก', 'ครั้งที่ 2–5: เพิ่มผลต่างครั้งละประมาณ 5 cm'],
      items: [{ id: 'V', label: 'จุด 14 กับจุด 15 (3/4 นิ้ว)', taps: [14, 15], line: 'L2', kind: 'pipe', L: 1.25 }] }
  ] },
  '5.2': { title: 'ใบงาน 5.2 งานทดลองความขรุขระของท่อ', parts: [
    { key: 'p1', name: 'ท่อ PVC เทียบท่อเหล็กอาบสังกะสี', type: 'R', step: 5, trials: 10, startTurns: 0,
      aim: 'ศึกษาและเปรียบเทียบความขรุขระของท่อ PVC กับท่อเหล็กอาบสังกะสี',
      steps: ['ท่อ PVC 1/2 นิ้ว: จุด 3 → 17, จุด 4 → 18 เปิดวาล์ว 16 · ท่อเหล็กอาบสังกะสี 1/2 นิ้ว: จุด 3 → 20, จุด 4 → 24 เปิดวาล์ว 19', 'เปิดปั๊ม ปิดวาล์ว 2 สูบลมจนระดับน้ำทั้งสองหลอดอยู่ใกล้ 50 cm', 'ครั้งที่ 1: หมุนวาล์ว 5 จนผลต่างระดับน้ำประมาณ 5 cm จับเวลาน้ำ 10 ลิตร อ่านระดับน้ำ บันทึก', 'ครั้งต่อไปเพิ่มผลต่างครั้งละประมาณ 5 cm (ทำได้มากสุด 10 ครั้ง อย่างน้อย 4 ครั้ง)', 'ระบบคำนวณ f, N<sub>R</sub> และหา ε/D จาก Moody Chart ให้ เทียบกับตาราง 5-1'],
      items: [{ id: 'pvc', label: 'ท่อ PVC 1/2 นิ้ว (จุด 17–18, L = 1.25 m)', taps: [17, 18], line: 'L3', kind: 'pipe', L: 1.25, color: 'var(--brand)' },
        { id: 'galv', label: 'ท่อเหล็กอาบสังกะสี 1/2 นิ้ว (จุด 20–24, L = 1.40 m)', taps: [20, 24], line: 'L4', kind: 'pipe', L: 1.40, color: 'var(--hf)' }] }
  ] },
  '5.3': { title: 'ใบงาน 5.3 งานทดลองการสูญเสียรอง', parts: [
    { key: 'p1', name: 'ตอนที่ 1 วาล์ว 4 ชนิด', type: 'K', step: 10, trials: 5, startTurns: 0,
      aim: 'ศึกษาและเปรียบเทียบค่าสัมประสิทธิ์การสูญเสียรองของวาล์วแบบต่าง ๆ',
      steps: ['ต่อสายยางเข้ากับจุดวัดหน้า–หลังวาล์ว (Globe 25–27, Gate 28–30, Ball 31–33, Check 34–36)', 'ตั้งวาล์ว: ปิด 10, 13, 16, 19 เปิด 26, 29, 32 (และ Check Valve 35) จนสุด', 'เปิดปั๊ม ปิดวาล์ว 2 สูบลมจนระดับน้ำใกล้ 50 cm', 'ครั้งที่ 1: หมุนวาล์ว 5 จนผลต่างประมาณ 10 cm จับเวลาน้ำ 10 ลิตร บันทึก', 'ครั้งที่ 2–5: เพิ่มผลต่างครั้งละประมาณ 10 cm (วาล์วที่สูญเสียน้อยอาจทำไม่ถึง ให้ปรับเท่าที่ได้)'],
      items: [{ id: 'globe', label: 'Globe Valve (25–27)', taps: [25, 27], line: 'L5', kind: 'fit', k: 8.6, n: 1, book: 10.0 },
        { id: 'gate', label: 'Gate Valve (28–30)', taps: [28, 30], line: 'L5', kind: 'fit', k: 0.93, n: 1, book: 0.19 },
        { id: 'ball', label: 'Ball Valve (31–33)', taps: [31, 33], line: 'L5', kind: 'fit', k: 0.18, n: 1, book: 0.05 },
        { id: 'check', label: 'Check Valve (34–36)', taps: [34, 36], line: 'L5', kind: 'fit', k: 2.6, n: 1, book: 2.0 }] },
    { key: 'p2', name: 'ตอนที่ 2 ข้องอและข้อโค้ง', type: 'K', step: 10, trials: 5, startTurns: 0,
      aim: 'ศึกษาและเปรียบเทียบค่าสัมประสิทธิ์การสูญเสียรองของข้อต่อท่อแบบต่าง ๆ',
      steps: ['ข้องอ 90°: จุด 37–38 เปิดแนววาล์ว (26, 29, 32) · ข้องอ 45°, ข้อโค้งรัศมีสั้น, รัศมียาว: เปิดวาล์ว 10 ปิด 13, 16, 19, 32', 'เปิดปั๊ม ปิดวาล์ว 2 สูบลมจนอ่านได้', 'ครั้งที่ 1–5: ปรับวาล์ว 5 ให้ผลต่างเพิ่มครั้งละประมาณ 10 cm จับเวลาน้ำ 10 ลิตรทุกครั้ง', 'ข้องอ 45° และข้อโค้งมีอุปกรณ์ 2 ตัวระหว่างจุดวัด ค่า k ที่คำนวณได้ต้อง<b>หาร 2</b> เพื่อให้ได้ค่าของ 1 ตัว'],
      items: [{ id: 'e90', label: 'ข้องอ 90° (37–38)', taps: [37, 38], line: 'L5', kind: 'fit', k: 0.95, n: 1, book: 0.9 },
        { id: 'e45', label: 'ข้องอ 45° × 2 (40–41)', taps: [40, 41], line: 'L1', kind: 'fit', k: 0.45, n: 2, book: 0.42 },
        { id: 'bs', label: 'ข้อโค้ง 90° รัศมีสั้น × 2 (43–44)', taps: [43, 44], line: 'L1', kind: 'fit', k: 0.66, n: 2, book: 0.75 },
        { id: 'bl', label: 'ข้อโค้ง 90° รัศมียาว × 2 (44–45)', taps: [44, 45], line: 'L1', kind: 'fit', k: 0.42, n: 2, book: 0.6 }] },
    { key: 'p3', name: 'ตอนที่ 3 ท่อเปลี่ยนขนาดฉับพลัน', type: 'X', step: 10, trials: 5, startTurns: 0,
      aim: 'ศึกษาค่าสัมประสิทธิ์การสูญเสียรองของท่อเปลี่ยนขนาดแบบฉับพลัน',
      steps: ['ท่อเพิ่มขนาดฉับพลัน: จุด 3 → 45, จุด 4 → 46 · ท่อลดขนาดฉับพลัน: จุด 3 → 46, จุด 4 → 47', 'เปิดวาล์ว 10 ปิด 13, 16, 19, 32 เปิดปั๊ม ปิดวาล์ว 2 สูบลมจนอ่านได้', 'ปรับวาล์ว 5 ให้ผลต่างประมาณ 10, 20, 30… cm จับเวลาน้ำ 10 ลิตร บันทึก', 'ในแบบจำลองกำหนดท่อเล็ก 21 mm ท่อใหญ่ 42 mm (d<sub>2</sub>/d<sub>1</sub> = 0.5)'],
      items: [{ id: 'exp', label: 'ท่อเพิ่มขนาดฉับพลัน (45–46)', taps: [45, 46], line: 'L1', kind: 'exp', ds: 0.021, dl: 0.042, k: 1.0, book: 1.0 },
        { id: 'con', label: 'ท่อลดขนาดฉับพลัน (46–47)', taps: [46, 47], line: 'L1', kind: 'con', ds: 0.021, dl: 0.042, k: 0.33, book: 0.33 }] }
  ] }
};
const H_PUMP = 16;   // เฮดสูงสุดที่ปั๊มส่งให้ท่อทดสอบเมื่อปิดทางลัดสุด (m) ค่าจำลอง
const testD = it => it.kind === 'pipe' ? LINE_INFO[it.line].D : 0.021;
/* ความเร็วในท่อที่จุดวัด จากเฮดที่ได้ (ขึ้นกับวาล์ว 5) และความต้านทานทั้งเส้นทาง */
function flowV(it, turns) {
  const Hh = H_PUMP * Math.pow(turns / 10, 2); if (Hh <= 0) return 0;
  const ln = LINE_INFO[it.line], D = testD(it);
  let Kfix = 6, Lp = 5;
  if (it.line === 'L5') { Kfix += 8.6 + 0.93 + 0.18 + 2.6 + 0.95; Lp = 6; }
  if (it.line === 'L1') Kfix += 0.9 + 1.32 + 0.84 + 0.6 + 0.35;
  let v = 1;
  for (let i = 0; i < 6; i++) { const f = fOf(Math.max(500, D * v / NU30), ln.eps / D); v = Math.sqrt(2 * G * Hh / (f * Lp / D + Kfix)); }
  return v;
}
/* ผลต่างระดับน้ำจริงในมาโนมิเตอร์ (m): บวก = หลอดซ้าย (จุด 3 ต้นทาง) สูงกว่า */
function manoDh(it, v) {
  if (v <= 0) return 0;
  if (it.kind === 'pipe') { const ln = LINE_INFO[it.line], D = ln.D, Re = D * v / NU30; return fOf(Re, ln.eps / D) * it.L / D * VH(v); }
  if (it.kind === 'fit') return it.n * it.k * VH(v) * (1 + 0.04 * Math.log10(6e4 / Math.max(1e4, 0.021 * v / NU30)));
  const r = (it.ds / it.dl) ** 2;
  if (it.kind === 'exp') { const v1 = v, v2 = v * r; return VH(v1 - v2) * it.k - (VH(v1) - VH(v2)); }   // ความดันหลังท่อขยายสูงขึ้น → ค่าติดลบ
  const vs = v, vl = v * r; return it.k * VH(vs) + (VH(vs) - VH(vl));
}

function buildPipeLab(host) {
  const mode = host.dataset.plab, cfg = PLAB[mode];
  const uid = 'pl' + mode.replace('.', '');
  host.innerHTML = `
  <div class="lab" id="${uid}">
    <div class="lab-top"><h3>🔧 ชุดทดลองเสมือน: ${cfg.title}</h3><span class="lab-sub" data-r="aim"></span></div>
    <div class="lab-body">
      ${cfg.parts.length > 1 ? `<div class="tabs" data-r="partTabs" style="margin:0">${cfg.parts.map((p, i) => `<button data-i="${i}" class="${i ? '' : 'on'}">${p.name}</button>`).join('')}</div>` : ''}
      <div class="lab-panel"><p class="lab-step"><span class="n">?</span>ขั้นตอนตามใบงาน</p><ol data-r="steps" style="margin:0;padding-left:1.3em;font-size:.93rem"></ol></div>
      <div class="lab-panel" style="padding:8px"><div class="ctl-h small muted" style="margin:0 4px 4px">เลือกจุดทดสอบ / อุปกรณ์</div><div class="chips" data-r="items" style="margin:0 0 6px"></div>
        <svg class="rig-svg" data-r="rig" viewBox="0 0 760 420" aria-label="แผนผังชุดทดลอง" style="width:100%;height:auto;display:block;background:var(--surface);border-radius:10px"></svg></div>
      <div class="bench">
        <div>
          <div class="zoom-box"><svg data-r="mano" viewBox="0 0 260 300" aria-label="มาโนมิเตอร์ ภาพขยาย"></svg><span class="small muted">🔍 มาโนมิเตอร์ (ภาพขยาย) สเกลหน่วย cm</span></div>
          <div class="readouts" style="margin-top:8px">
            <div class="ro">หลอดซ้าย (จุด 3)<b data-r="roL">–</b>cm</div>
            <div class="ro">หลอดขวา (จุด 4)<b data-r="roR">–</b>cm</div>
            <div class="ro alt">มาตรวัดน้ำ<b data-r="roMeter">0.00</b>ลิตร</div>
            <div class="ro alt">นาฬิกาจับเวลา<b data-r="roWatch">0.00</b>s</div>
          </div>
        </div>
        <div class="rig-ctrl">
          <div class="ctl"><div class="ctl-h">① ต่อสายยางจากมาโนมิเตอร์</div>
            <div class="read-box" style="margin-top:2px"><label>จุด 3 ต่อกับ<select data-r="h3"><option value="">–</option>${TAPS.map(t => `<option value="${t}">จุด ${t}</option>`).join('')}</select></label>
              <label>จุด 4 ต่อกับ<select data-r="h4"><option value="">–</option>${TAPS.map(t => `<option value="${t}">จุด ${t}</option>`).join('')}</select></label></div></div>
          <div class="ctl"><div class="ctl-h">② วาล์วและปั๊ม</div>
            <div class="btn-row" style="margin-top:4px"><button class="btn btn-line btn-sm" data-r="setV">🔧 ตั้งวาล์วตามใบงาน</button><button class="btn btn-go btn-sm" data-r="pump">▶ เปิดปั๊มน้ำ</button></div>
            <div class="small muted" data-r="vTxt" style="margin-top:4px"></div></div>
          <div class="ctl"><div class="ctl-h">③ มาโนมิเตอร์ <span class="small">ไล่น้ำให้เต็ม แล้วสูบลมกดระดับลง</span></div>
            <div class="pour-ctl" style="margin-top:4px"><button data-r="v2">วาล์ว 2: เปิด</button><button data-r="air">💨 สูบลม (จุด 1) กดค้าง</button><button data-r="bleed">↥ ปล่อยลมเล็กน้อย</button></div></div>
          <div class="ctl"><div class="ctl-h">④ วาล์ว 5 (ปรับอัตราการไหล) <b data-r="tTxt">0.0 รอบ</b></div>
            <div class="ctl-r"><button data-r="tMinus" aria-label="หมุนทวนเข็ม">−</button><input type="range" data-r="turns" min="0" max="10" step="0.05" value="0" aria-label="จำนวนรอบที่หมุนวาล์ว 5"><button data-r="tPlus" aria-label="หมุนตามเข็ม">+</button></div>
            <div class="small muted" data-r="hint"></div></div>
          <div class="ctl" data-r="timeBox"><div class="ctl-h">⑤ จับเวลาน้ำไหล 10 ลิตร</div>
            <div class="btn-row" style="margin-top:4px"><button class="btn btn-line btn-sm" data-r="time">⏱ เริ่มจับเวลา</button>
              <span class="speed">ความเร็ว: <button data-sp="1" class="on">×1</button><button data-sp="5">×5</button><button data-sp="20">×20</button></span></div></div>
          <ul class="check-list" data-r="checks"></ul>
          <div class="btn-row"><button class="btn btn-accent" data-r="rec" disabled>📝 บันทึกค่า</button><button class="btn btn-line btn-sm" data-r="auto" title="ต่อสายยาง ตั้งวาล์ว เปิดปั๊ม และสูบลมให้อัตโนมัติ">🤖 ช่วยเตรียมเครื่อง</button><button class="btn btn-line btn-sm" data-r="clear">↺ ล้างตาราง</button></div>
          <div class="status" data-r="status">เริ่มจากต่อสายยางจากมาโนมิเตอร์เข้ากับจุดวัดความดัน</div>
        </div>
      </div>
      <div class="lab-panel"><p class="lab-step"><span class="n">✓</span>บันทึกผลการทดลอง <span class="small muted" style="font-weight:400">(กดแถวเพื่อดูตัวอย่างการคำนวณ)</span></p>
        <div data-r="tables"></div><div class="lf-list" data-r="rowCalc"></div></div>
      <div class="lab-panel"><p class="lab-step"><span class="n">📈</span><span data-r="chTitle">กราฟจากผลการทดลอง</span></p>
        <div class="chart-box"><svg viewBox="0 0 640 330" data-r="chart"></svg></div>
        <div data-r="chNote" class="small" style="margin-top:6px"></div></div>
    </div>
  </div>`;
  const R = k => host.querySelector(`[data-r="${k}"]`);
  const s = { part: 0, item: 0, h3: null, h4: null, valves: null, pump: false, v2open: true, M: 110, turns: 0, settle: 0, meter: 0, timing: false, watch: 0, timeDone: null, speed: 1, ang: 0, noise: 0, msgT: 0 };
  const data = {};   // data[partKey][itemId] = [rows]
  cfg.parts.forEach(p => { data[p.key] = {}; p.items.forEach(it => { data[p.key][it.id] = []; }); });
  let sel = null;   // {itemId, i}
  const P = () => cfg.parts[s.part], IT = () => P().items[s.item];
  const rows = (it = IT()) => data[P().key][it.id];
  const isTrial = () => ['V', 'R', 'K', 'X'].includes(P().type);
  const maxTrials = () => P().trials || 1;
  const status = (t, c = '') => { const el = R('status'); el.innerHTML = t; el.className = 'status ' + c; s.msgT = 3; };
  /* เป้าหมายผลต่างระดับน้ำ (cm) ของครั้งที่ n ถ้าอุปกรณ์สูญเสียน้อยจนทำไม่ถึง ให้แบ่งช่วงที่ทำได้เท่า ๆ กัน */
  const targetDh = (it, n) => { const mx = Math.abs(manoDh(it, flowV(it, 10))) * 100 * 0.92; return Math.min(P().step * n, 90, mx * n / maxTrials()); };

  function loadPart(i) {
    s.part = i; s.item = 0; sel = null;
    if (R('partTabs')) $$('button', R('partTabs')).forEach((b, j) => b.classList.toggle('on', j === i));
    R('aim').textContent = 'จุดประสงค์: ' + P().aim;
    R('steps').innerHTML = P().steps.map(t => `<li>${t}</li>`).join('');
    R('timeBox').hidden = !isTrial();
    renderItems(); renderTables(); renderChart();
  }
  function renderItems() {
    R('items').innerHTML = P().items.map((it, j) => {
      const n = rows(it).length, full = isTrial() ? n >= maxTrials() : n >= 1;
      return `<button data-j="${j}" class="${j === s.item ? 'on' : ''}${full ? ' done' : ''}">${it.label}${isTrial() && n ? ` (${n})` : ''}</button>`;
    }).join('');
  }
  if (R('partTabs')) R('partTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) loadPart(+b.dataset.i); });
  R('items').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    s.item = +b.dataset.j; s.timeDone = null; s.timing = false; renderItems(); renderTables(); renderChart();
    const it = IT();
    status(`เลือก ${it.label} แล้ว ต่อสายยางจุด 3 → ${it.taps[0]} และจุด 4 → ${it.taps[1]}${s.valves !== it.line ? ' แล้วตั้งวาล์วให้ตรงแนวท่อนี้' : ''}`, '');
  });
  R('h3').addEventListener('change', e => { s.h3 = +e.target.value || null; s.settle = 1; });
  R('h4').addEventListener('change', e => { s.h4 = +e.target.value || null; s.settle = 1; });
  R('setV').addEventListener('click', () => {
    const it = IT(); s.valves = it.line; s.settle = 1.2; s.timeDone = null;
    const vs = VALVE_SET[it.line];
    status(`ตั้งวาล์วแล้ว: เปิด ${vs.open.join(', ')} · ปิด ${vs.close.join(', ')} · เปิดวาล์วจุดวัด ${it.taps.join(' และ ')}`, 'ok');
  });
  R('pump').addEventListener('click', () => {
    s.pump = !s.pump; s.settle = 1.5; s.timeDone = null; s.timing = false;
    status(s.pump ? (s.v2open ? 'ปั๊มทำงาน น้ำไหลเข้าหลอดมาโนมิเตอร์จนเต็ม ต่อไป: ปิดวาล์ว 2 แล้วสูบลม' : 'ปั๊มทำงานแล้ว') : 'ปิดปั๊มแล้ว', s.pump ? 'ok' : '');
  });
  R('v2').addEventListener('click', () => { s.v2open = !s.v2open; });
  hold(R('air'), () => { if (s.v2open) { status('ปิดวาล์ว 2 ก่อน ไม่อย่างนั้นลมที่สูบจะรั่วออกหมด', 'warn'); return; } s.M = Math.max(-40, s.M - 1.6); });
  hold(R('bleed'), () => { s.M = Math.min(110, s.M + 0.8); });
  const setT = v => { s.turns = clamp(Math.round(v * 20) / 20, 0, 10); R('turns').value = s.turns; s.settle = 1.5; if (s.timing) { s.timing = false; status('เปลี่ยนอัตราการไหลระหว่างจับเวลา การจับเวลาครั้งนี้ยกเลิก', 'warn'); } s.timeDone = null; };
  R('turns').addEventListener('input', e => setT(+e.target.value));
  hold(R('tMinus'), () => setT(s.turns - 0.05)); hold(R('tPlus'), () => setT(s.turns + 0.05));
  R('time').addEventListener('click', () => {
    if (s.timing) { s.timing = false; status('ยกเลิกการจับเวลา', ''); return; }
    if (!(cur().v > 0)) { status('ยังไม่มีน้ำไหลผ่านท่อทดสอบ (ตรวจวาล์วและปั๊ม)', 'warn'); return; }
    s.timing = true; s.meter = 0; s.watch = 0; s.timeDone = null; s.timeTurns = s.turns;
    status('⏱ กำลังจับเวลา อ่านมาตรวัดน้ำจนครบ 10 ลิตร…', '');
  });
  $$('.speed button', host).forEach(b => b.addEventListener('click', () => { s.speed = +b.dataset.sp; $$('.speed button', host).forEach(x => x.classList.toggle('on', x === b)); }));
  R('clear').addEventListener('click', () => {
    if (!confirm('ล้างผลการทดลองของตอนนี้ทั้งหมด?')) return;
    P().items.forEach(it => { data[P().key][it.id] = []; }); sel = null; renderItems(); renderTables(); renderChart();
  });
  R('auto').addEventListener('click', () => {
    const it = IT();
    s.h3 = it.taps[0]; s.h4 = it.taps[1]; R('h3').value = s.h3; R('h4').value = s.h4;
    s.valves = it.line; s.pump = true; s.v2open = false;
    if (P().fixedTurns) setT(P().fixedTurns);
    else if (isTrial()) {
      const target = targetDh(it, rows().length + 1) / 100;
      let lo = 0, hi = 10;
      for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (Math.abs(manoDh(it, flowV(it, m))) < target) lo = m; else hi = m; }
      setT(lo);
    }
    const dh = Math.abs(manoDh(it, flowV(it, s.turns))) * 100;
    s.M = clamp(52, dh / 2 + 6, 100 - dh / 2 - 6);
    status('ระบบเตรียมเครื่องให้แล้ว (ในการทดลองจริงต้องทำเองทีละขั้น)' + (isTrial() ? ' ต่อไป: จับเวลาน้ำ 10 ลิตร แล้วบันทึก' : ' อ่านระดับน้ำแล้วบันทึก'), 'ok');
  });

  /* --- สถานะปัจจุบัน --- */
  function cur() {
    const it = IT();
    const flowing = s.pump && s.valves === it.line;
    const v = flowing ? flowV(it, s.turns) : 0;
    const dh = manoDh(it, v);   // m
    const hosesOk = s.h3 === it.taps[0] && s.h4 === it.taps[1];
    const swapped = s.h3 === it.taps[1] && s.h4 === it.taps[0];
    let d = (hosesOk ? dh : swapped ? -dh : 0) * 100;
    const L = s.M + d / 2 + s.noise, Rr = s.M - d / 2 - s.noise * 0.7;
    const full = s.M >= 99 || Math.max(L, Rr) > 100, low = Math.min(L, Rr) < 0;
    return { it, v, dh, flowing, hosesOk, swapped, L, R: Rr, readable: s.pump && !full && !low && (hosesOk || swapped), full, low };
  }
  function conds(c) {
    const it = c.it, list = [
      [`ต่อสายยาง จุด 3 → ${it.taps[0]} และจุด 4 → ${it.taps[1]}`, c.hosesOk],
      ['ตั้งวาล์วตามใบงานของแนวท่อนี้', s.valves === it.line],
      ['เปิดปั๊ม ปิดวาล์ว 2 และสูบลมจนอ่านระดับน้ำได้ทั้ง 2 หลอด', c.readable && !s.v2open]
    ];
    if (P().fixedTurns) list.push([`วาล์ว 5 หมุนตามเข็ม ${P().fixedTurns} รอบ (ตามใบงาน)`, Math.abs(s.turns - P().fixedTurns) <= 0.1]);
    if (isTrial()) {
      list.push(['มีน้ำไหลผ่านท่อทดสอบ', c.v > 0.05]);
      list.push(['จับเวลาน้ำ 10 ลิตรครบ ที่อัตราการไหลนี้', !!s.timeDone]);
      const prev = rows().map(r => Math.abs(r.right - r.left));
      list.push(['อัตราการไหลต่างจากครั้งก่อน (ผลต่างระดับน้ำต่างกันอย่างน้อย 1 cm)', !prev.some(p => Math.abs(p - Math.abs(c.L - c.R)) < 1)]);
      list.push([`ยังทำไม่ครบ ${maxTrials()} ครั้ง`, rows().length < maxTrials()]);
    }
    list.push(['ระดับน้ำนิ่งแล้ว', s.settle <= 0]);
    return list;
  }
  R('rec').addEventListener('click', () => {
    const c = cur(), cs = conds(c);
    if (!cs.every(x => x[1])) { status('ยังบันทึกไม่ได้: ' + cs.filter(x => !x[1]).map(x => x[0]).join(' · '), 'warn'); return; }
    const r5 = x => Math.round(x * 2) / 2;
    const row = { left: r5(c.L), right: r5(c.R), turns: s.turns };
    if (isTrial()) { row.V = 10; row.t = Math.round(s.timeDone.t * 100) / 100; }
    if (!isTrial()) data[P().key][c.it.id] = [row]; else rows().push(row);
    sel = { id: c.it.id, i: rows().length - 1 };
    s.timeDone = null;
    renderItems(); renderTables(); renderChart();
    let nx = '';
    if (!isTrial()) { const nj = P().items.findIndex(it => !rows(it).length); nx = nj >= 0 ? `ต่อไป: ${P().items[nj].label}` : 'ครบทุกจุดแล้ว ดูกราฟด้านล่าง'; if (nj >= 0) { s.item = nj; renderItems(); } }
    else nx = rows().length < maxTrials() ? `ต่อไป: ครั้งที่ ${rows().length + 1} ปรับวาล์ว 5 ให้ผลต่างประมาณ ${N(targetDh(c.it, rows().length + 1), 0)} cm แล้วจับเวลาใหม่` : 'ครบแล้ว เลือกอุปกรณ์/ท่อถัดไป';
    status('บันทึกแล้ว ✔ ' + nx, 'ok');
  });

  /* --- คำนวณผลแต่ละแถว --- */
  function calc(it, r) {
    const o = { h: Math.abs(r.right - r.left) / 100 };
    if (r.t) { o.Q = r.V * 1e-3 / r.t; }
    const D = testD(it);
    if (o.Q) o.v = o.Q / AREA(D);
    if (P().type === 'R') { o.f = o.h * D * 2 * G / (it.L * o.v * o.v); o.Re = D * o.v / NU30; o.rr = rrFrom(o.f, o.Re); o.eps = o.rr * D * 1000; }
    if (P().type === 'K') { o.k = o.h * 2 * G / (o.v * o.v); o.k1 = o.k / it.n; }
    if (P().type === 'X') {
      const As = AREA(it.ds), Al = AREA(it.dl);
      o.dh = (r.left - r.right) / 100;   // บวก = ต้นทางสูงกว่า
      if (it.kind === 'exp') { o.v1 = o.Q / As; o.v2 = o.Q / Al; o.hm = VH(o.v1) - VH(o.v2) + o.dh; o.k = o.hm * 2 * G / Math.pow(o.v1 - o.v2, 2); }
      else { o.v1 = o.Q / Al; o.v2 = o.Q / As; o.hm = o.dh - (VH(o.v2) - VH(o.v1)); o.k = o.hm * 2 * G / (o.v2 * o.v2); }
    }
    return o;
  }
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  function renderTables() {
    const p = P(), T = p.type;
    let h = '';
    if (T === 'L' || T === 'D') {
      h = `<div class="table-wrap"><table class="rig-table"><thead><tr><th>จุดวัดความแตกต่าง<br>ของความดัน</th><th>${T === 'L' ? 'ความยาวท่อ<br>(m)' : 'ขนาดเส้นผ่าน<br>ศูนย์กลางท่อ (mm)'}</th><th>ด้านซ้าย<br>(cm)</th><th>ด้านขวา<br>(cm)</th><th>การสูญเสียหลัก<br>(m)</th></tr></thead><tbody>` +
        p.items.map(it => { const r = rows(it)[0]; const on = sel && sel.id === it.id; return `<tr data-id="${it.id}" data-i="0"${on ? ' class="sel"' : ''}><td>${it.label.replace(/ \(.*\)/, '')}</td><td>${T === 'L' ? it.L.toFixed(2) : Math.round(testD(it) * 1000)}</td>${r ? `<td>${r.left.toFixed(1)}</td><td>${r.right.toFixed(1)}</td><td>${N(calc(it, r).h, 3)}</td>` : '<td class="miss">–</td>'.repeat(3)}</tr>`; }).join('') + '</tbody></table></div>';
      if (T === 'L') h += '<p class="small muted" style="margin:4px 0 0">ความยาวท่อ = ระยะระหว่างจุดวัด 2 จุด จุด 20, 21, 22, 23, 24 ห่างกันจุดละ 0.35 m</p>';
    } else {
      const showItems = T === 'R' ? p.items : [IT()];
      showItems.forEach(it => {
        const rs = rows(it), n = maxTrials();
        let head = `<tr><th rowspan="2">ครั้ง<br>ที่</th><th rowspan="2">V<br>(Litre)</th><th rowspan="2">t<br>(s)</th><th colspan="2">ระดับน้ำในมาโนมิเตอร์</th>`;
        let head2 = '<tr><th>ซ้าย (cm)</th><th>ขวา (cm)</th>';
        if (T === 'V') { head += '<th rowspan="2">h<sub>f</sub><br>(m)</th><th rowspan="2">Q<br>(m³/s)</th><th rowspan="2">v<br>(m/s)</th>'; }
        if (T === 'R') { head += '<th rowspan="2">h<sub>f</sub><br>(m)</th><th rowspan="2">Q<br>(m³/s)</th><th rowspan="2">v<br>(m/s)</th><th rowspan="2">f</th><th rowspan="2">N<sub>R</sub></th><th rowspan="2">ε/D</th><th rowspan="2">ε<br>(mm)</th>'; }
        if (T === 'K') { head += '<th rowspan="2">h<sub>m</sub><br>(m)</th><th rowspan="2">Q<br>(m³/s)</th><th rowspan="2">v<br>(m/s)</th><th rowspan="2">k</th>'; }
        if (T === 'X') { head += '<th rowspan="2">h<sub>m</sub><br>(m)</th><th rowspan="2">Q<br>(m³/s)</th><th rowspan="2">v<sub>1</sub><br>(m/s)</th><th rowspan="2">v<sub>2</sub><br>(m/s)</th><th rowspan="2">k</th>'; }
        head += '</tr>'; head2 += '</tr>';
        let body = '';
        for (let i = 0; i < n; i++) {
          const r = rs[i];
          const on = sel && sel.id === it.id && sel.i === i;
          if (!r) { const nc = { V: 3, R: 7, K: 4, X: 5 }[T]; body += `<tr><td>${i + 1}</td><td>10</td>${'<td class="miss">–</td>'.repeat(3 + nc)}</tr>`; continue; }
          const o = calc(it, r);
          body += `<tr data-id="${it.id}" data-i="${i}"${on ? ' class="sel"' : ''}><td>${i + 1}</td><td>10</td><td>${N(r.t, 2)}</td><td>${r.left.toFixed(1)}</td><td>${r.right.toFixed(1)}</td>`;
          if (T === 'V') body += `<td>${N(o.h, 3)}</td><td>${SCI(o.Q, 2)}</td><td>${N(o.v, 2)}</td>`;
          if (T === 'R') body += `<td>${N(o.h, 3)}</td><td>${SCI(o.Q, 2)}</td><td>${N(o.v, 2)}</td><td>${N(o.f, 4)}</td><td>${SCI(o.Re, 2)}</td><td>${o.rr > 0 ? N(o.rr, 4) : '≈ 0'}</td><td>${o.rr > 0 ? N(o.eps, 3) : '≈ 0'}</td>`;
          if (T === 'K') body += `<td>${N(o.h, 3)}</td><td>${SCI(o.Q, 2)}</td><td>${N(o.v, 2)}</td><td>${N(o.k, 2)}</td>`;
          if (T === 'X') body += `<td>${N(o.hm, 3)}</td><td>${SCI(o.Q, 2)}</td><td>${N(o.v1, 2)}</td><td>${N(o.v2, 2)}</td><td>${N(o.k, 2)}</td>`;
          body += '</tr>';
        }
        if ((T === 'K' || T === 'X') && rs.length) {
          const ks = rs.map(r => calc(it, r).k), cs = T === 'K' ? 9 : 10;
          if (T === 'K' && it.n === 2) body += `<tr><td colspan="${cs - 1}" style="text-align:right">เฉลี่ย (2 ตัว)</td><td><b>${N(avg(ks), 2)}</b></td></tr><tr><td colspan="${cs - 1}" style="text-align:right">เฉลี่ย (1 ตัว) = เฉลี่ย ÷ 2</td><td><b>${N(avg(ks) / 2, 2)}</b></td></tr>`;
          else body += `<tr><td colspan="${cs - 1}" style="text-align:right">เฉลี่ย</td><td><b>${N(avg(ks), 2)}</b></td></tr>`;
        }
        if (T === 'R' && rs.length) {
          const good = rs.map(r => calc(it, r)).filter(o => o.rr > 0);
          body += `<tr><td colspan="11" style="text-align:right">ε เฉลี่ย</td><td><b>${good.length ? N(avg(good.map(o => o.eps)), 3) : '≈ 0'}</b></td></tr>`;
        }
        h += `<div class="small" style="font-weight:700;margin:8px 0 4px">ตาราง: ${it.label} · ท่อ Ø ${Math.round(testD(it) * 1000)} mm${it.L ? ` · L = ${it.L} m` : ''}</div><div class="table-wrap"><table class="rig-table"><thead>${head}${head2}</thead><tbody>${body}</tbody></table></div>`;
      });
      if (T === 'K' || T === 'X') {
        h += `<div class="small" style="font-weight:700;margin:12px 0 4px">สรุปค่า k เฉลี่ยของทุกอุปกรณ์ในตอนนี้ เทียบกับตารางในหนังสือ</div><div class="table-wrap"><table class="rig-table"><thead><tr><th>อุปกรณ์</th><th>จำนวนครั้ง</th><th>k เฉลี่ย (1 ตัว)</th><th>k จากหนังสือ</th></tr></thead><tbody>` +
          p.items.map(it => { const rs = rows(it); const k = rs.length ? avg(rs.map(r => calc(it, r).k)) / (it.n || 1) : null; return `<tr><td>${it.label}</td><td>${rs.length}</td><td>${k == null ? '–' : N(k, 2)}</td><td>${it.book}</td></tr>`; }).join('') + '</tbody></table></div>';
      }
    }
    R('tables').innerHTML = h;
    renderRowCalc();
  }
  R('tables').addEventListener('click', e => {
    const tr = e.target.closest('tr[data-id]'); if (!tr) return;
    const it = P().items.find(x => x.id === tr.dataset.id); if (!rows(it)[+tr.dataset.i]) return;
    sel = { id: tr.dataset.id, i: +tr.dataset.i }; renderTables();
  });
  function renderRowCalc() {
    const out = R('rowCalc');
    const it = sel && P().items.find(x => x.id === sel.id), r = it && rows(it)[sel.i];
    if (!r) { out.innerHTML = '<div class="small muted">ยังไม่มีข้อมูล — บันทึกค่าอย่างน้อย 1 ครั้ง แล้วตัวอย่างการคำนวณจะขึ้นที่นี่</div>'; return; }
    const o = calc(it, r), D = testD(it), T = P().type;
    const big = Math.max(r.left, r.right), small = Math.min(r.left, r.right);
    let h = `<div class="small" style="font-weight:600">ตัวอย่างการคำนวณ: ${it.label}${isTrial() ? ` ครั้งที่ ${sel.i + 1}` : ''}</div>`;
    const hName = T === 'K' ? 'h<sub>m</sub>' : 'h<sub>f</sub>';
    if (T !== 'X') h += LF(`① ${T === 'K' ? 'การสูญเสียรอง' : 'การสูญเสียหลัก'} = ผลต่างระดับน้ำ`, `${hName} = ${N(big, 1)} − ${N(small, 1)}`, `= ${N(big - small, 1)} cm`, `= ${N(o.h, 3)} m`, 'hl');
    if (T === 'X') h += LF('① ผลต่างระดับน้ำ (ความดัน)', `Δh = ซ้าย − ขวา`, `= ${N(r.left, 1)} − ${N(r.right, 1)} cm`, `= ${N(o.dh, 3)} m`);
    if (o.Q) {
      h += LF('② อัตราการไหล', `Q = ${FR('V', 't')}`, `= ${FR('10 × 10<sup>−3</sup>', N(r.t, 2))}`, `= ${SCI(o.Q, 3)} m³/s`);
      if (T !== 'X') h += LF('③ ความเร็วในการไหล', `v = ${FR('Q', 'A')} = ${FR('Q', 'πD²/4')}`, `= ${FR(SCI(o.Q, 3), `(π/4)(${N(D, 3)})²`)}`, `= ${N(o.v, 3)} m/s`);
    }
    if (T === 'R') {
      h += LF('④ แฟกเตอร์ของความเสียดทาน (จัดรูปจาก h<sub>f</sub> = f(L/D)(v²/2g))', `f = ${FR('h<sub>f</sub> · D · 2g', 'L · v²')}`, `= ${FR(`(${N(o.h, 3)})(${N(D, 3)})(2)(9.81)`, `(${it.L})(${N(o.v, 3)})²`)}`, `= ${N(o.f, 4)}`, 'hl');
      h += LF('⑤ เรย์โนลด์นัมเบอร์ (น้ำ 30 °C)', `N<sub>R</sub> = ${FR('D v', 'υ')}`, `= ${FR(`(${N(D, 3)})(${N(o.v, 3)})`, '8.03 × 10<sup>−7</sup>')}`, `= ${SCI(o.Re, 2)} ${badge(o.Re)}`);
      h += LF('⑥ อ่าน Moody Chart ย้อนทาง', `ที่ f = ${N(o.f, 4)}, N<sub>R</sub> = ${SCI(o.Re, 2)}`, 'จุดตกบนเส้น', o.rr > 0 ? `ε/D ≈ ${N(o.rr, 4)}` : 'ต่ำกว่าเส้นผิวเรียบ → ε/D ≈ 0', 'hl');
      if (o.rr > 0) h += LF('⑦ ความขรุขระของท่อ', 'ε = (ε/D) · D', `= (${N(o.rr, 4)})(${Math.round(D * 1000)} mm)`, `= ${N(o.eps, 3)} mm`, 'hl');
      else h += '<div class="small muted">จุดอยู่ใต้เส้นท่อผิวเรียบเล็กน้อย เพราะความคลาดเคลื่อนในการอ่านระดับน้ำและจับเวลา แปลว่าท่อนี้ผิวเรียบมาก (ε ≈ 0) ตรงกับตาราง 5-1 ของท่อพลาสติก/พีวีซี</div>';
    }
    if (T === 'K') {
      h += LF('④ สัมประสิทธิ์การสูญเสียรอง (จัดรูปจาก h<sub>m</sub> = k·v²/2g)', `k = ${FR('h<sub>m</sub> · 2g', 'v²')}`, `= ${FR(`(${N(o.h, 3)})(2)(9.81)`, `(${N(o.v, 3)})²`)}`, `= ${N(o.k, 3)}`, 'hl');
      if (it.n === 2) h += LF('⑤ ระหว่างจุดวัดมีอุปกรณ์ 2 ตัว', `k (1 ตัว) = ${FR('k', '2')}`, `= ${FR(N(o.k, 3), '2')}`, `= ${N(o.k1, 3)}`, 'hl');
    }
    if (T === 'X') {
      const exp = it.kind === 'exp';
      h += LF('③ ความเร็วในท่อทั้งสองขนาด', exp ? 'v<sub>1</sub> (ท่อเล็ก 21 mm), v<sub>2</sub> (ท่อใหญ่ 42 mm)' : 'v<sub>1</sub> (ท่อใหญ่ 42 mm), v<sub>2</sub> (ท่อเล็ก 21 mm)', `= Q/A`, `v<sub>1</sub> = ${N(o.v1, 3)}, v<sub>2</sub> = ${N(o.v2, 3)} m/s`);
      if (exp) {
        h += LF('④ การสูญเสียรอง (สมการพลังงาน)', `h<sub>m</sub> = ${FR('v<sub>1</sub>² − v<sub>2</sub>²', '2g')} + Δh`, `= ${FR(`${N(o.v1, 3)}² − ${N(o.v2, 3)}²`, '2(9.81)')} + (${N(o.dh, 3)})`, `= ${N(o.hm, 3)} m`, 'hl');
        h += LF('⑤ สัมประสิทธิ์ (หัวข้อ 5.3.3.1)', `k = ${FR('h<sub>m</sub> · 2g', '(v<sub>1</sub> − v<sub>2</sub>)²')}`, `= ${FR(`(${N(o.hm, 3)})(2)(9.81)`, `(${N(o.v1, 3)} − ${N(o.v2, 3)})²`)}`, `= ${N(o.k, 3)}`, 'hl');
        h += '<div class="small muted">ท่อขยาย น้ำช้าลง พลังงานจลน์ส่วนหนึ่งกลับมาเป็นความดัน หลอดขวา (ท่อใหญ่) จึงสูงกว่าหลอดซ้าย จึงต้องใช้สมการพลังงานหา h<sub>m</sub> แทนการอ่านผลต่างตรง ๆ</div>';
      } else {
        h += LF('④ การสูญเสียรอง (สมการพลังงาน)', `h<sub>m</sub> = Δh − ${FR('v<sub>2</sub>² − v<sub>1</sub>²', '2g')}`, `= ${N(o.dh, 3)} − ${FR(`${N(o.v2, 3)}² − ${N(o.v1, 3)}²`, '2(9.81)')}`, `= ${N(o.hm, 3)} m`, 'hl');
        h += LF('⑤ สัมประสิทธิ์ (หัวข้อ 5.3.3.3 ใช้ความเร็วในท่อเล็ก)', `k = ${FR('h<sub>m</sub> · 2g', 'v<sub>2</sub>²')}`, `= ${FR(`(${N(o.hm, 3)})(2)(9.81)`, `(${N(o.v2, 3)})²`)}`, `= ${N(o.k, 3)} (ตาราง 5-3 ที่ d₂/d₁ = 0.5 → 0.33)`, 'hl');
        h += '<div class="small muted">ท่อลดขนาด น้ำเร่งความเร็ว ความดันส่วนหนึ่งเปลี่ยนเป็นพลังงานจลน์ ผลต่างระดับน้ำจึงมากกว่าการสูญเสียจริง ต้องหักส่วนที่เปลี่ยนเป็นความเร็วออกก่อน</div>';
      }
    }
    out.innerHTML = h;
  }

  /* --- กราฟ --- */
  function renderChart() {
    const p = P(), T = p.type, ch = R('chart');
    let note = '';
    if (T === 'L' || T === 'D') {
      const pts = p.items.filter(it => rows(it).length).map(it => [T === 'L' ? it.L : testD(it) * 1000, calc(it, rows(it)[0]).h]);
      const ymax = niceMax(Math.max(0.2, ...pts.map(q => q[1])) * 1.15);
      R('chTitle').textContent = T === 'L' ? 'กราฟความสัมพันธ์ระหว่างความยาวท่อกับการสูญเสียหลัก' : 'กราฟความสัมพันธ์ระหว่างขนาดเส้นผ่านศูนย์กลางท่อกับการสูญเสียหลัก';
      const series = [{ pts, color: 'var(--hf)', dots: true }];
      if (T === 'L' && pts.length >= 2) { const k = pts.reduce((a, q) => a + q[0] * q[1], 0) / pts.reduce((a, q) => a + q[0] * q[0], 0); series.push({ pts: [[0, 0], [1.5, 1.5 * k]], color: 'var(--muted)', dash: true }); }
      ch.innerHTML = lineChart({ W: 640, H: 330, m: { l: 64, r: 18, t: 14, b: 46 },
        x: T === 'L' ? { min: 0, max: 1.5, step: 0.25, label: 'ความยาวท่อ L (m)', fmt: v => v.toFixed(2) } : { min: 15, max: 27, step: 1, label: 'ขนาดเส้นผ่านศูนย์กลางท่อ D (mm)', fmt: v => v.toFixed(0) },
        y: { min: 0, max: ymax, step: ymax / 5, label: 'การสูญเสียหลัก h_f (m)', fmt: v => +v.toFixed(3) },
        series: pts.length ? series : [], empty: pts.length ? '' : 'บันทึกผลแล้วกราฟจะขึ้นที่นี่' });
      if (pts.length >= 3) note = T === 'L' ? '<b>สรุป:</b> จุดเรียงเกือบเป็นเส้นตรงผ่านจุดกำเนิด แสดงว่า<b>การสูญเสียหลักแปรผันตรงกับความยาวท่อ</b> (ท่อยาวขึ้น 2 เท่า สูญเสีย 2 เท่า) ตรงกับสมการ h<sub>f</sub> = f(L/D)(v²/2g)'
        : '<b>สรุป:</b> ท่อขนาดเล็กมีการสูญเสียหลักมากกว่าท่อขนาดใหญ่ แม้จะเปิดวาล์ว 5 เท่ากัน เพราะ D อยู่ในส่วนของสมการ และท่อเล็กมีพื้นที่ผิวท่อเทียบกับปริมาณน้ำมากกว่า (หมายเหตุ: ท่อ 18 mm ในใบงานนี้เป็นท่อ PVC ผิวเรียบ ส่วนท่อ 21 และ 25 mm เป็นท่อเหล็ก)';
    } else if (T === 'V') {
      const it = p.items[0], pts = rows(it).map(r => { const o = calc(it, r); return [o.v, o.h]; }).sort((a, b) => a[0] - b[0]);
      R('chTitle').textContent = 'กราฟความสัมพันธ์ระหว่างความเร็วในการไหลกับการสูญเสียหลัก';
      const ymax = niceMax(Math.max(0.2, ...pts.map(q => q[1])) * 1.15), xmax = Math.max(1, Math.ceil(Math.max(0, ...pts.map(q => q[0])) * 1.2 * 2) / 2);
      ch.innerHTML = lineChart({ W: 640, H: 330, m: { l: 64, r: 18, t: 14, b: 46 },
        x: { min: 0, max: xmax, step: xmax / 5, label: 'ความเร็วในการไหล v (m/s)', fmt: v => v.toFixed(1) },
        y: { min: 0, max: ymax, step: ymax / 5, label: 'การสูญเสียหลัก h_f (m)', fmt: v => +v.toFixed(3) },
        series: pts.length ? [{ pts: [[0, 0], ...pts], color: 'var(--hf)', dots: false, smooth: true }, { pts, color: 'var(--hf)', dots: true }] : [], empty: pts.length ? '' : 'บันทึกผลแล้วกราฟจะขึ้นที่นี่' });
      if (pts.length >= 3) note = '<b>สรุป:</b> กราฟโค้งหงายขึ้น เมื่อไหลเร็วขึ้น การสูญเสียหลักเพิ่มขึ้นเร็วกว่าเส้นตรง (ประมาณ v²) ไหลเร็วขึ้น 2 เท่า สูญเสียเพิ่มราว 4 เท่า';
    } else if (T === 'R') {
      R('chTitle').textContent = 'กราฟความสัมพันธ์ระหว่าง Friction Factor กับ Reynolds Number เทียบกับ Moody Diagram';
      const pts = [], fits = [];
      p.items.forEach(it => {
        const os = rows(it).map(r => calc(it, r));
        os.forEach(o => pts.push({ Re: o.Re, f: o.f, color: it.color }));
        if (os.length >= 2) { const rr = os.map(o => Math.max(0, o.rr)).sort((a, b) => a - b)[Math.floor(os.length / 2)]; fits.push({ rr, color: it.color }); }
      });
      ch.setAttribute('viewBox', '0 0 760 470');
      ch.innerHTML = moodySVG({ id: uid, points: pts, fits });
      note = p.items.map(it => { const os = rows(it).map(r => calc(it, r)); if (!os.length) return ''; const g = os.filter(o => o.rr > 0); const e = g.length ? avg(g.map(o => o.eps)) : 0;
        return `<span style="color:${it.color};font-weight:700">●</span> ${it.label}: ε เฉลี่ย ≈ <b>${g.length ? N(e, 3) : '0'}</b> mm${it.id === 'pvc' ? ' (ตาราง 5-1: ท่อพีวีซี ≈ 0 ผิวเรียบ)' : ' (ตาราง 5-1: ท่อเหล็กอาบสังกะสีใหม่ 0.15 mm ท่อที่ใช้งานมานานมักขรุขระกว่านี้)'}`; }).filter(Boolean).join('<br>') +
        (rows(p.items[0]).length && rows(p.items[1]).length ? '<br><b>สรุป:</b> จุดของท่อ PVC อยู่ใกล้เส้นท่อผิวเรียบ (f น้อย) ส่วนจุดของท่อเหล็กอาบสังกะสีอยู่สูงกว่า แสดงว่าท่อเหล็กขรุขระกว่าและเสียพลังงานมากกว่าที่ความเร็วเท่ากัน' : '');
    } else {
      R('chTitle').textContent = 'เปรียบเทียบค่าสัมประสิทธิ์การสูญเสียรอง k (ค่าเฉลี่ยของ 1 ตัว)';
      ch.setAttribute('viewBox', '0 0 640 330');
      const items = p.items.filter(it => rows(it).length).map(it => ({ it, k: avg(rows(it).map(r => calc(it, r).k)) / (it.n || 1) }));
      const W = 640, H = 330, m = { l: 60, r: 14, t: 16, b: 58 }, ymax = niceMax(Math.max(0.5, ...p.items.map(i => i.book), ...items.map(i => i.k)) * 1.15);
      const Y = v => H - m.b - v / ymax * (H - m.t - m.b), n = p.items.length, bw = Math.min(70, (W - m.l - m.r) / n * 0.45);
      let g = '';
      for (let v = 0; v <= ymax + 1e-9; v += ymax / 5) g += `<line class="ch-grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ch-tick" x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end">${+v.toFixed(2)}</text>`;
      p.items.forEach((it, i) => {
        const cx = m.l + (i + 0.5) * (W - m.l - m.r) / n, got = items.find(q => q.it === it);
        if (got) g += `<rect x="${cx - bw / 2}" y="${Y(got.k)}" width="${bw}" height="${H - m.b - Y(got.k)}" fill="var(--hm)" opacity=".85" rx="3"/><text class="ch-lab" x="${cx}" y="${Y(got.k) - 6}" text-anchor="middle">${N(got.k, 2)}</text>`;
        g += `<line x1="${cx - bw / 2 - 6}" x2="${cx + bw / 2 + 6}" y1="${Y(it.book)}" y2="${Y(it.book)}" stroke="var(--accent)" stroke-width="3"/><text x="${cx + bw / 2 + 8}" y="${Y(it.book) + 4}" style="font-size:10px;fill:var(--accent)">${it.book}</text>`;
        g += `<text class="ch-tick" x="${cx}" y="${H - m.b + 16}" text-anchor="middle">${it.label.replace(/ \(.*\)/, '').replace(' × 2', '')}</text>`;
      });
      g += `<line class="ch-axis" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${H - m.b}"/><line class="ch-axis" x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/>`;
      g += `<text class="ch-lab" transform="translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)" text-anchor="middle">สัมประสิทธิ์ k</text>`;
      g += `<rect x="${m.l + 8}" y="${H - 22}" width="14" height="10" fill="var(--hm)"/><text x="${m.l + 26}" y="${H - 13}" class="ch-tick">จากการทดลอง</text><line x1="${m.l + 120}" x2="${m.l + 140}" y1="${H - 17}" y2="${H - 17}" stroke="var(--accent)" stroke-width="3"/><text x="${m.l + 146}" y="${H - 13}" class="ch-tick">ค่าในหนังสือ (ตาราง)</text>`;
      ch.innerHTML = g;
      if (items.length >= 2) note = p.key === 'p1' ? '<b>สรุป:</b> Globe Valve มีค่า k สูงที่สุด เพราะน้ำต้องไหลวกวนผ่านบ่าวาล์ว ส่วน Ball Valve และ Gate Valve เปิดเต็มที่แล้วช่องทางเกือบตรงเท่าท่อ ค่า k จึงต่ำ ค่าจากการทดลองต่างจากตารางได้ เพราะวาล์วขนาดเล็กแบบเกลียวมีรูปร่างภายในต่างจากวาล์วที่ใช้ทำตาราง'
        : p.key === 'p2' ? '<b>สรุป:</b> ข้องอ 90° (หักมุม) สูญเสียมากกว่าข้อโค้งรัศมียาว และข้องอ 45° สูญเสียน้อยกว่าข้องอ 90° ยิ่งเลี้ยวนุ่มนวล ยิ่งสูญเสียน้อย'
          : '<b>สรุป:</b> ท่อเพิ่มขนาดฉับพลันได้ k ใกล้ 1.0 ตามทฤษฎี และท่อลดขนาดฉับพลันได้ k ใกล้ค่าในตาราง 5-3';
    }
    R('chNote').innerHTML = note;
  }

  /* --- วาดมาโนมิเตอร์ภาพขยาย --- */
  function drawMano(c) {
    const y = cm => 280 - cm / 100 * 256;
    let h = `<rect x="0" y="0" width="260" height="300" fill="var(--surface)"/>`;
    h += `<rect x="70" y="6" width="120" height="282" rx="4" fill="var(--surface-2)" stroke="var(--line)"/>`;
    for (let cm = 0; cm <= 100; cm += 1) {
      const yy = y(cm), major = cm % 10 === 0, half = cm % 5 === 0;
      h += `<line x1="${120 - (major ? 12 : half ? 8 : 4)}" x2="${120 + (major ? 12 : half ? 8 : 4)}" y1="${yy}" y2="${yy}" stroke="var(--muted)" stroke-width="${major ? 1.4 : .8}"/>`;
      if (major) h += `<text x="130" y="${yy + 4}" style="font-size:10px;fill:var(--text)">${cm}</text>`;
    }
    const tube = (x, lvl, lab) => {
      let t = `<rect x="${x - 9}" y="12" width="18" height="276" rx="4" fill="var(--glass)" stroke="var(--text)" stroke-width="1.4"/>`;
      if (s.pump || s.M < 109) { const yy = clamp(y(lvl), 12, 288); t += `<rect x="${x - 7}" y="${yy}" width="14" height="${288 - yy}" fill="var(--water)" opacity=".8"/><path d="M${x - 7},${yy} Q${x},${yy + 4} ${x + 7},${yy}" fill="none" stroke="var(--text)" stroke-width=".8"/>`; }
      t += `<text x="${x}" y="298" text-anchor="middle" style="font-size:10px;fill:var(--muted)">${lab}</text>`;
      return t;
    };
    h += tube(90, c.L, 'จุด 3') + tube(170, c.R, 'จุด 4');
    h += `<path d="M90,12 L90,6 L170,6 L170,12" fill="none" stroke="var(--text)" stroke-width="2"/>`;
    if (c.readable) {
      const a = y(c.L), b = y(c.R);
      h += `<line x1="200" x2="200" y1="${a}" y2="${b}" stroke="var(--hf)" stroke-width="2.5"/><line x1="194" x2="206" y1="${a}" y2="${a}" stroke="var(--hf)" stroke-width="2"/><line x1="194" x2="206" y1="${b}" y2="${b}" stroke="var(--hf)" stroke-width="2"/>`;
      h += `<text x="210" y="${(a + b) / 2 + 4}" style="font-size:12px;fill:var(--hf);font-weight:700">${N(Math.abs(c.L - c.R), 1)} cm</text>`;
    }
    if (c.full && s.pump) h += `<rect x="20" y="120" width="220" height="44" rx="6" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="130" y="140" text-anchor="middle" style="font-size:12px;fill:var(--text)">น้ำเต็มหลอด อ่านค่าไม่ได้</text><text x="130" y="156" text-anchor="middle" style="font-size:11px;fill:var(--muted)">ปิดวาล์ว 2 แล้วสูบลมกดระดับลง</text>`;
    if (c.low) h += `<rect x="20" y="120" width="220" height="44" rx="6" fill="var(--bad-soft)" stroke="var(--bad)"/><text x="130" y="140" text-anchor="middle" style="font-size:12px;fill:var(--bad)">ลมมากไป ระดับน้ำต่ำกว่าสเกล</text><text x="130" y="156" text-anchor="middle" style="font-size:11px;fill:var(--muted)">กด "ปล่อยลมเล็กน้อย"</text>`;
    if (!s.pump && s.M >= 109) h += `<text x="130" y="150" text-anchor="middle" style="font-size:12px;fill:var(--muted)">ยังไม่เปิดปั๊ม</text>`;
    R('mano').innerHTML = h;
  }

  /* --- วนจำลอง --- */
  let last = performance.now(), vis = false, running = false;
  whenVisible(host, v => { vis = v; if (v && !running) { running = true; last = performance.now(); requestAnimationFrame(tick); } });
  function tick(t) {
    const dt = Math.min(0.1, (t - last) / 1000); last = t;
    s.settle = Math.max(0, s.settle - dt);
    if (s.pump && s.v2open) s.M = Math.min(110, s.M + 40 * dt);
    s.noise = lerp(s.noise, (Math.random() - .5) * (s.settle > 0 ? 3 : 0.35), 0.2);
    const c = cur();
    if (s.timing) {
      const add = c.v * AREA(testD(c.it)) * 1000 * dt * s.speed;   // ลิตร
      s.meter += add; s.watch += dt * s.speed;
      if (s.meter >= 10) {
        const over = (s.meter - 10) / (c.v * AREA(testD(c.it)) * 1000);
        s.watch -= over; s.meter = 10; s.timing = false;
        s.timeDone = { t: s.watch };
        status(`น้ำไหลครบ 10 ลิตร ใช้เวลา <b>${N(s.watch, 2)} s</b> อ่านระดับน้ำแล้วกด "บันทึกค่า"`, 'ok');
      }
    }
    s.ang += c.v * dt * 4;
    R('rig').innerHTML = rigFigSVG({ pump: s.pump, open: s.valves ? VALVE_SET[s.valves].open : [], flowLine: c.flowing && c.v > 0.02 ? c.it.line : null, v: c.v, turns: s.turns,
      hose3: s.h3, hose4: s.h4, taps: c.it.taps, v2open: s.v2open, mano: s.pump || s.M < 109 ? [clamp(c.L, -5, 110), clamp(c.R, -5, 110)] : null, meterAng: s.ang });
    drawMano(c);
    R('roL').textContent = c.readable ? N(c.L, 1) : '–';
    R('roR').textContent = c.readable ? N(c.R, 1) : '–';
    R('roMeter').textContent = N(s.meter, 2); R('roWatch').textContent = N(s.watch, 2);
    R('tTxt').textContent = `${N(s.turns, 2)} รอบ`;
    R('v2').textContent = `วาล์ว 2: ${s.v2open ? 'เปิด (กดเพื่อปิด)' : 'ปิด (กดเพื่อเปิด)'}`;
    R('pump').textContent = s.pump ? '■ ปิดปั๊มน้ำ' : '▶ เปิดปั๊มน้ำ'; R('pump').className = 'btn btn-sm ' + (s.pump ? 'btn-line' : 'btn-go');
    R('time').textContent = s.timing ? '■ ยกเลิก' : '⏱ เริ่มจับเวลา';
    const vs = s.valves ? VALVE_SET[s.valves] : null;
    R('vTxt').innerHTML = vs ? `ตอนนี้: เปิด ${vs.open.join(', ')} · ปิด ${vs.close.join(', ')}${s.valves !== c.it.line ? ' <b style="color:var(--bad)">(ไม่ตรงกับท่อที่เลือก)</b>' : ''}` : 'ยังไม่ได้ตั้งวาล์ว';
    const p = P();
    R('hint').innerHTML = p.fixedTurns ? `ใบงานให้หมุน ${p.fixedTurns} รอบ` : isTrial() && rows().length < maxTrials() ? `ครั้งที่ ${rows().length + 1}: ปรับให้ผลต่างระดับน้ำประมาณ ${N(targetDh(c.it, rows().length + 1), 0)} cm (ตอนนี้ ${c.readable ? N(Math.abs(c.L - c.R), 1) : '–'} cm)${targetDh(c.it, maxTrials()) < p.step * maxTrials() - 1 ? ' · อุปกรณ์นี้สูญเสียน้อย ทำผลต่างได้ไม่มาก เป้าหมายจึงลดลง' : ''}` : '';
    const cs = conds(c);
    R('checks').innerHTML = cs.map(x => `<li class="${x[1] ? 'ok' : ''}">${x[0]}</li>`).join('');
    R('rec').disabled = !cs.every(x => x[1]);
    s.msgT -= dt;
    if (s.msgT <= 0 && !s.timing) {
      const el = R('status'); let m = '', cl = '';
      if (!c.hosesOk && !c.swapped) m = `ต่อสายยาง จุด 3 → ${c.it.taps[0]} และจุด 4 → ${c.it.taps[1]}`;
      else if (c.swapped) { m = 'ต่อสายยางสลับกัน (จุด 3 ควรต่อกับจุดต้นทาง) แก้ให้ถูกก่อนบันทึก'; cl = 'warn'; }
      else if (s.valves !== c.it.line) m = 'กด "ตั้งวาล์วตามใบงาน"';
      else if (!s.pump) m = 'เปิดปั๊มน้ำ';
      else if (s.v2open) m = 'น้ำเต็มหลอดแล้ว ปิดวาล์ว 2';
      else if (c.full) m = 'กดค้างปุ่ม "สูบลม" จนระดับน้ำลงมาอยู่ในสเกล (ใกล้ 50 cm)';
      else if (c.low) { m = 'ลมมากเกินไป กด "ปล่อยลมเล็กน้อย"'; cl = 'warn'; }
      else if (p.fixedTurns && Math.abs(s.turns - p.fixedTurns) > 0.1) m = `ปรับวาล์ว 5 ให้หมุนไว้ ${p.fixedTurns} รอบ`;
      else if (isTrial() && !s.timeDone) m = c.v > 0.05 ? 'ปรับอัตราการไหลได้ตามเป้า แล้วกด "เริ่มจับเวลา"' : 'หมุนวาล์ว 5 ตามเข็มเพื่อให้น้ำไหลผ่านท่อทดสอบ';
      else if (s.settle > 0) m = 'รอให้ระดับน้ำนิ่ง…';
      else { m = 'พร้อมแล้ว กด "บันทึกค่า"'; cl = 'ok'; }
      el.innerHTML = m; el.className = 'status ' + cl;
    }
    if (vis || s.timing) requestAnimationFrame(tick); else running = false;   // จับเวลาต่อแม้เลื่อนจอไปดูตาราง
  }
  loadPart(0);
  drawMano(cur());
}
$$('[data-plab]').forEach(buildPipeLab);

/* =====================================================================
   5.3 การสูญเสียรอง: แกลเลอรีอุปกรณ์
   ===================================================================== */
const T52_R = [1.2, 1.4, 1.6, 1.8, 2.0, 2.5, 3.0, 4.0, 5.0], T52_C = [4, 10, 15, 20, 30, 50, 60];
const T52 = [[0.02, 0.04, 0.09, 0.16, 0.25, 0.35, 0.37], [0.03, 0.06, 0.12, 0.23, 0.36, 0.50, 0.53], [0.03, 0.07, 0.14, 0.26, 0.42, 0.57, 0.61], [0.04, 0.07, 0.15, 0.28, 0.44, 0.61, 0.65],
  [0.04, 0.07, 0.16, 0.29, 0.46, 0.63, 0.68], [0.04, 0.08, 0.16, 0.30, 0.48, 0.65, 0.70], [0.04, 0.08, 0.16, 0.31, 0.48, 0.66, 0.71], [0.04, 0.08, 0.16, 0.31, 0.49, 0.67, 0.72], [0.04, 0.08, 0.16, 0.31, 0.50, 0.67, 0.72]];
const T53 = [0.50, 0.45, 0.42, 0.39, 0.36, 0.33, 0.28, 0.22, 0.15, 0.06, 0.00];
const t53k = r => { const i = Math.min(9, Math.floor(r * 10)), fr = r * 10 - i; return lerp(T53[i], T53[i + 1], fr); };

const FD = '<defs><marker id="fa" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="var(--water)"/></marker><marker id="ea" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="var(--hm)"/></marker></defs>';
const PW = (p, d, join = 'round') => `<path d="${p}" fill="none" stroke="var(--text)" stroke-width="${d + 5}" stroke-linejoin="${join}"/><path d="${p}" fill="none" stroke="var(--water-soft)" stroke-width="${d}" stroke-linejoin="${join}"/>`;
const FLW = (p, w = 2) => `<path d="${p}" fill="none" stroke="var(--water)" stroke-width="${w}" class="flowline" marker-end="url(#fa)"/>`;
const EDY = (cx, cy, r, rev) => `<g class="eddy${rev ? ' rev' : ''}" style="transform-box:view-box;transform-origin:${cx}px ${cy}px"><path d="M${cx + r},${cy} A${r},${r} 0 1,1 ${cx},${cy - r}" fill="none" stroke="var(--hm)" stroke-width="1.8" marker-end="url(#ea)"/></g>`;
const TANK_L = (open1, open2) => `<rect x="0" y="0" width="70" height="130" fill="var(--water-soft)"/><path d="M70,0 L70,${open1} M70,${open2} L70,130" stroke="var(--text)" stroke-width="4"/>`;
const VALVE_BODY = (inner) => `${PW('M0,70 L240,70', 26)}<rect x="92" y="40" width="56" height="60" rx="14" fill="var(--metal)" stroke="var(--text)" stroke-width="1.5"/>${inner}`;
const FITS = {
  inlet: { tab: 'ทางเข้าท่อ', items: {
    reent: { name: 'ท่อต่อยื่นเข้าไปในถัง', k: 0.8, why: 'น้ำต้องอ้อมขอบท่อที่ยื่นเข้ามา เกิดวังวนใหญ่ในปากท่อ', svg: () => `<rect x="0" y="0" width="70" height="130" fill="var(--water-soft)"/><path d="M70,0 L70,46 M70,84 L70,130" stroke="var(--text)" stroke-width="4"/>${PW('M36,65 L240,65', 30, 'miter')}${FLW('M10,15 Q50,30 28,48 Q40,64 120,64')}${FLW('M10,115 Q50,100 28,82 Q40,66 120,66')}${EDY(64, 56, 6)}${EDY(64, 75, 6, 1)}` },
    sharp: { name: 'ท่อต่อเป็นมุมฉาก', k: 0.5, why: 'ขอบคมทำให้กระแสหดตัว (vena contracta) แล้วขยายกลับ เกิดวังวนที่ผนัง', svg: () => `${TANK_L(48, 82)}${PW('M70,65 L240,65', 30, 'miter')}${FLW('M10,20 Q60,40 120,64')}${FLW('M10,110 Q60,92 120,66')}${EDY(86, 56, 6)}${EDY(86, 75, 6, 1)}` },
    round: { name: 'ท่อต่อแบบลบมุมโค้ง', k: 0.2, why: 'ขอบโค้งเล็กน้อย กระแสหดตัวน้อยลง วังวนเล็กลง', svg: () => `<rect x="0" y="0" width="70" height="130" fill="var(--water-soft)"/><path d="M70,0 L70,38 Q70,50 82,50 L240,50 M70,130 L70,92 Q70,80 82,80 L240,80" fill="none" stroke="var(--text)" stroke-width="4"/><rect x="82" y="52" width="158" height="26" fill="var(--water-soft)"/>${FLW('M10,25 Q60,45 130,64')}${FLW('M10,105 Q60,86 130,66')}${EDY(92, 58, 4)}` },
    bell: { name: 'ท่อต่อแบบลบมุมโค้งมาก (ปากแตร)', k: 0.04, why: 'ปากท่อบานเป็นรูปแตร น้ำไหลเข้าเรียบ แทบไม่มีวังวน', svg: () => `<rect x="0" y="0" width="70" height="130" fill="var(--water-soft)"/><path d="M70,0 L70,14 Q70,50 110,50 L240,50 M70,130 L70,116 Q70,80 110,80 L240,80" fill="none" stroke="var(--text)" stroke-width="4"/><rect x="100" y="52" width="140" height="26" fill="var(--water-soft)"/>${FLW('M10,30 Q70,40 140,64')}${FLW('M10,100 Q70,90 140,66')}` }
  } },
  outlet: { tab: 'ทางออกท่อ', items: {
    exit: { name: 'ทางออกท่อเข้าถัง', k: 1.0, why: 'พลังงานจลน์ทั้งหมดของน้ำที่พุ่งออกจากท่อ สลายไปเป็นวังวนในถัง k = 1.0 เสมอ ไม่ว่ารอยต่อจะเป็นแบบใด', svg: () => `${PW('M0,65 L150,65', 30, 'miter')}<rect x="150" y="0" width="90" height="130" fill="var(--water-soft)"/><path d="M150,0 L150,48 M150,82 L150,130" stroke="var(--text)" stroke-width="4"/>${FLW('M10,65 L200,65')}${EDY(178, 40, 9)}${EDY(178, 90, 9, 1)}${EDY(212, 62, 7)}` }
  } },
  change: { tab: 'ท่อเปลี่ยนขนาด', items: {
    sexp: { name: 'ท่อเพิ่มขนาดฉับพลัน', k: 1.0, f2: true, why: 'น้ำพุ่งจากท่อเล็กเข้าท่อใหญ่เป็นลำ เกิดวังวนใหญ่ที่มุม h<sub>m</sub> = k(v<sub>1</sub> − v<sub>2</sub>)²/2g, k = 1', svg: () => `${PW('M0,65 L112,65', 28, 'miter')}<rect x="110" y="28" width="130" height="74" fill="var(--water-soft)"/><path d="M110,51 L110,28 L240,28 M110,79 L110,102 L240,102" fill="none" stroke="var(--text)" stroke-width="4"/>${FLW('M10,65 L220,65')}${FLW('M120,60 Q170,46 225,40', 1.4)}${FLW('M120,70 Q170,84 225,90', 1.4)}${EDY(128, 40, 7)}${EDY(128, 90, 7, 1)}` },
    gexp: { name: 'ท่อค่อย ๆ เพิ่มขนาด', k: null, f2: true, table: '52', why: 'ผนังค่อย ๆ บานออก วังวนน้อยกว่าขยายฉับพลัน ค่า k ดูจากตาราง 5-2 (ขึ้นกับ d₂/d₁ และมุมกรวย θ)', svg: () => `<path d="M0,52 L90,52 L150,30 L240,30 L240,100 L150,100 L90,78 L0,78 Z" fill="var(--water-soft)"/><path d="M0,52 L90,52 L150,30 L240,30 M0,78 L90,78 L150,100 L240,100" fill="none" stroke="var(--text)" stroke-width="4" stroke-linejoin="miter"/>${FLW('M10,65 L225,65')}<path d="M90,65 L150,30" stroke="var(--muted)" stroke-dasharray="3 3"/><text x="104" y="58" style="font-size:12px;fill:var(--accent)">θ</text>` },
    scon: { name: 'ท่อลดขนาดทันที', k: null, table: '53', why: 'น้ำบีบเข้าท่อเล็ก กระแสหดตัวแล้วขยาย เกิดวังวนทั้งที่มุมหน้าและหลังทางเข้า ค่า k ดูจากตาราง 5-3 ใช้ v ในท่อเล็ก', svg: () => `<rect x="0" y="28" width="122" height="74" fill="var(--water-soft)"/><path d="M0,28 L122,28 L122,51 L240,51 M0,102 L122,102 L122,79 L240,79" fill="none" stroke="var(--text)" stroke-width="4"/><rect x="120" y="53" width="120" height="24" fill="var(--water-soft)"/>${FLW('M10,40 Q100,44 200,62', 1.4)}${FLW('M10,90 Q100,86 200,68', 1.4)}${EDY(110, 38, 6)}${EDY(110, 92, 6, 1)}${EDY(138, 58, 4)}${EDY(138, 72, 4, 1)}` },
    gcon: { name: 'ท่อค่อย ๆ ลดขนาด', k: 0.1, why: 'มุมกรวย 20–40° มีค่า k ประมาณ 0.1 ถ้ามุมมากกว่า 40° ค่า k จะมากขึ้น ใช้ v ในท่อเล็ก', svg: () => `<path d="M0,30 L90,30 L150,52 L240,52 L240,78 L150,78 L90,100 L0,100 Z" fill="var(--water-soft)"/><path d="M0,30 L90,30 L150,52 L240,52 M0,100 L90,100 L150,78 L240,78" fill="none" stroke="var(--text)" stroke-width="4"/>${FLW('M10,65 L225,65')}${FLW('M10,45 Q120,50 220,60', 1.4)}${FLW('M10,85 Q120,80 220,70', 1.4)}` }
  } },
  valve: { tab: 'วาล์ว', items: {
    globe: { name: 'Globe Valve เปิดเต็มที่', k: 10.0, why: 'น้ำต้องไหลขึ้น–ลงผ่านบ่าวาล์วเป็นรูปตัว S สูญเสียมากที่สุด แต่ปรับอัตราการไหลได้ละเอียด', svg: () => `${PW('M0,70 L240,70', 26)}<circle cx="120" cy="70" r="34" fill="var(--metal)" stroke="var(--text)" stroke-width="1.5"/><path d="M96,70 L96,86 Q120,92 120,70 L120,58 Q120,48 144,54 L144,70" fill="var(--water-soft)" stroke="var(--text)" stroke-width="1.5"/><rect x="110" y="30" width="20" height="10" fill="var(--text)"/><line x1="120" y1="30" x2="120" y2="8" stroke="var(--text)" stroke-width="3"/><ellipse cx="120" cy="8" rx="20" ry="5" fill="var(--bad)"/>${FLW('M5,70 L92,70 Q104,92 116,80 Q124,46 140,58 L150,70 L232,70')}` },
    angle: { name: 'Angle Valve เปิดเต็มที่', k: 5.0, why: 'น้ำเข้าด้านล่างแล้วเลี้ยวออกด้านข้าง 90° ภายในตัววาล์ว', svg: () => `${PW('M120,130 L120,70 L240,70', 26, 'miter')}<circle cx="120" cy="70" r="30" fill="var(--metal)" stroke="var(--text)" stroke-width="1.5"/><rect x="106" y="54" width="28" height="28" rx="6" fill="var(--water-soft)"/><line x1="120" y1="40" x2="120" y2="10" stroke="var(--text)" stroke-width="3"/><ellipse cx="120" cy="10" rx="18" ry="5" fill="var(--bad)"/>${FLW('M120,125 L120,72 L232,70')}` },
    gate: { name: 'Gate Valve เปิดเต็มที่', k: 0.19, why: 'ลิ่มประตูยกขึ้นพ้นทางน้ำ ช่องทางตรงเกือบเท่าท่อ สูญเสียน้อย (ใช้เปิด-ปิดสุด ไม่เหมาะหรี่น้ำ)', svg: () => `${VALVE_BODY('<rect x="104" y="57" width="32" height="26" fill="var(--water-soft)"/><rect x="108" y="6" width="24" height="36" rx="3" fill="var(--metal)" stroke="var(--text)"/><rect x="112" y="10" width="16" height="28" fill="var(--galv)" stroke="var(--text)"/><line x1="120" y1="6" x2="120" y2="0" stroke="var(--text)" stroke-width="3"/>')}${FLW('M5,70 L232,70')}` },
    ball: { name: 'Ball Valve เปิดเต็มที่', k: 0.05, why: 'ลูกบอลมีรูทะลุขนาดเท่าท่อ เปิดสุดแล้วน้ำไหลผ่านตรง ๆ สูญเสียน้อยที่สุด', svg: () => `${VALVE_BODY('<circle cx="120" cy="70" r="27" fill="var(--galv)" stroke="var(--text)"/><rect x="93" y="58" width="54" height="24" fill="var(--water-soft)"/><rect x="116" y="18" width="8" height="26" fill="var(--text)"/><rect x="116" y="14" width="70" height="8" rx="3" fill="var(--bad)"/>')}${FLW('M5,70 L232,70')}` },
    check: { name: 'Swing Check Valve (ไหลตามทิศ)', k: 2.0, why: 'แผ่นลิ้นถูกน้ำดันให้เปิด ยอมให้ไหลทางเดียว กันน้ำไหลย้อน ลิ้นที่ขวางอยู่ทำให้สูญเสียพอสมควร', svg: () => `${VALVE_BODY('<rect x="98" y="54" width="44" height="32" fill="var(--water-soft)"/><circle cx="104" cy="50" r="3" fill="var(--text)"/><line x1="104" y1="50" x2="136" y2="62" stroke="var(--galv)" stroke-width="6" stroke-linecap="round"/>')}${FLW('M5,72 L100,74 Q118,82 140,74 L232,70')}` }
  } },
  fitting: { tab: 'ข้อต่อ/ข้องอ', items: {
    e90: { name: 'ข้องอ 90° (short radius elbow)', k: 0.9, why: 'เลี้ยวหักมุมทันที น้ำแยกตัวจากผนังด้านในโค้ง เกิดวังวนหลังมุม', svg: () => `${PW('M0,38 L130,38 L130,130', 26, 'miter')}${FLW('M5,38 L122,38 Q130,38 130,48 L130,124')}${EDY(116, 62, 7)}` },
    e90m: { name: 'ข้อโค้ง 90° รัศมีปานกลาง', k: 0.75, why: 'โค้งนุ่มขึ้น วังวนเล็กลง', svg: () => `${PW('M0,38 L95,38 Q130,38 130,73 L130,130', 26)}${FLW('M5,38 L95,38 Q130,38 130,73 L130,124')}${EDY(113, 72, 5)}` },
    e90l: { name: 'ข้อโค้ง 90° รัศมียาว', k: 0.6, why: 'โค้งกว้าง น้ำเลี้ยวได้นุ่มนวล สูญเสียน้อยกว่าข้องอ', svg: () => `${PW('M0,30 L70,30 A60,60 0 0 1 130,90 L130,130', 26)}${FLW('M5,30 L70,30 A60,60 0 0 1 130,90 L130,124')}` },
    e45: { name: 'ข้องอ 45°', k: 0.42, why: 'เลี้ยวเพียงครึ่งมุมฉาก สูญเสียน้อยกว่าข้องอ 90° ราวครึ่งหนึ่ง', svg: () => `${PW('M0,100 L110,100 L180,30 L200,10', 26, 'miter')}${FLW('M5,100 L106,100 L190,18')}${EDY(124, 104, 5)}` },
    ret: { name: 'ข้องอกลับ (Close-return bend)', k: 2.2, why: 'เลี้ยวกลับ 180° น้ำเปลี่ยนทิศมาก วังวนสองช่วง', svg: () => `${PW('M0,32 L150,32 A33,33 0 0 1 150,98 L0,98', 24)}${FLW('M5,32 L150,32 A33,33 0 0 1 150,98 L10,98')}${EDY(140, 80, 6)}` },
    teeB: { name: 'ข้อต่อสามทาง ไหลทางแยก', k: 2.0, why: 'น้ำเข้าทางตรงแล้วเลี้ยวลงทางแยก 90° ปลายอีกด้านปิด เกิดวังวนที่ปลายตัน', svg: () => `${PW('M0,40 L240,40', 26)}${PW('M120,40 L120,130', 26)}<rect x="232" y="24" width="8" height="32" fill="var(--text)"/>${FLW('M5,40 L114,40 Q120,40 120,48 L120,124')}${EDY(190, 40, 7)}` },
    teeL: { name: 'ข้อต่อสามทาง ไหลทางตรง', k: 0.9, why: 'น้ำไหลผ่านทางตรง แต่ช่องทางแยกที่ปิดไว้ทำให้เกิดวังวนเล็ก ๆ', svg: () => `${PW('M0,40 L240,40', 26)}${PW('M120,40 L120,115', 26)}<rect x="104" y="112" width="32" height="8" fill="var(--text)"/>${FLW('M5,40 L232,40')}${EDY(120, 78, 7)}` }
  } },
  bend: { tab: 'ท่อโค้งงอ', items: {
    bendNo: { name: 'ท่อโค้งงอ ไม่มีลิ้นช่วย', k: 1.1, why: 'น้ำเบียดไปด้านนอกโค้ง แยกตัวด้านใน เกิดวังวนหลังโค้ง', svg: () => `${PW('M0,30 L70,30 L130,30 L130,130', 40, 'miter')}${FLW('M5,24 L118,24 Q136,24 136,40 L136,124')}${EDY(116, 58, 9)}` },
    bendVane: { name: 'ท่อโค้งงอ มีลิ้นช่วย (แผ่นครีบ)', k: 0.2, why: 'แผ่นครีบโค้งภายในช่วยนำน้ำเลี้ยว ไม่ให้แยกตัว ลดการสูญเสียจาก 1.1 เหลือ 0.2', svg: () => `${PW('M0,30 L70,30 L130,30 L130,130', 40, 'miter')}<path d="M98,14 Q140,14 146,44 M90,24 Q130,26 136,52 M84,36 Q118,38 122,60" fill="none" stroke="var(--galv)" stroke-width="3"/>${FLW('M5,30 L104,30 Q130,30 130,56 L130,124')}` }
  } }
};

(function fitGallery() {
  const grid = $('#fitGrid'); if (!grid) return;
  let tab = 'inlet', cur = 'reent', t52 = { r: 4, c: 3 }, t53 = 0.5;
  $('#fitTabs').innerHTML = Object.entries(FITS).map(([k, g]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${g.tab}</button>`).join('');
  const item = () => { for (const g of Object.values(FITS)) if (g.items[cur]) return g.items[cur]; return null; };
  const kOf = it => it.table === '52' ? T52[t52.r][t52.c] : it.table === '53' ? t53k(t53) : it.k;
  function renderGrid() {
    grid.innerHTML = Object.entries(FITS[tab].items).map(([k, it]) => `<button class="fit-card${k === cur ? ' on' : ''}" data-k="${k}"><svg viewBox="0 0 240 130">${FD}${it.svg()}</svg><b>${it.name}</b><span class="k">${it.table ? 'k ดูตาราง 5-' + (it.table === '52' ? '2' : '3') : (it.k === 0.1 ? 'k ≈ 0.1' : 'k = ' + it.k)}</span></button>`).join('');
  }
  function renderDetail() {
    const it = item(); if (!it) return;
    $('#fitBig').innerHTML = FD + it.svg();
    $('#fitCap').innerHTML = `<b>${it.name}</b> — ${it.why}`;
    $('#fitTitle').textContent = `คำนวณการสูญเสียรอง: ${it.name}`;
    $('#fitV2w').style.display = it.f2 ? '' : 'none';
    $('#fitVlab').innerHTML = it.f2 ? 'ความเร็วในท่อเล็ก v<sub>1</sub> (m/s)' : (it.table === '53' || cur === 'gcon') ? 'ความเร็วในท่อเล็ก v (m/s)' : 'ความเร็วในท่อ v (m/s)';
    const v = +$('#fitV').value || 0, v2 = +$('#fitV2').value || 0, k = kOf(it);
    let o = '';
    if (it.table === '52') o += LF('ค่า k จากตาราง 5-2', `d₂/d₁ = ${T52_R[t52.r]}, θ = ${T52_C[t52.c]}°`, '(เลือกในตารางด้านล่าง)', `k = ${k}`);
    if (it.table === '53') o += LF('ค่า k จากตาราง 5-3', `d₂/d₁ = ${t53.toFixed(2)}`, '(เลื่อนในตารางด้านล่าง)', `k = ${N(k, 3)}`);
    if (it.f2) o += LF('การสูญเสียรอง', `h<sub>m</sub> = k ${FR('(v₁ − v₂)²', '2g')}`, `= (${N(k, 2)})${FR(`(${v} − ${v2})²`, '2(9.81)')}`, `= ${N(k * VH(v - v2), 3)} m`, 'hl');
    else o += LF('การสูญเสียรอง', `h<sub>m</sub> = k ${FR('v²', '2g')}`, `= (${N(k, 2)})${FR(`(${v})²`, '2(9.81)')}`, `= ${N(k * VH(v), 3)} m`, 'hl');
    if (it.table === '53' || cur === 'gcon') o += '<div class="small muted">ท่อลดขนาด: v คือความเร็วใน<b>ท่อเล็ก</b></div>';
    if (it.f2) o += '<div class="small muted">v₁ = ความเร็วในท่อเล็ก (ก่อนขยาย) · v₂ = ความเร็วในท่อใหญ่</div>';
    $('#fitOut').innerHTML = o;
  }
  $('#fitTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; tab = b.dataset.t; cur = Object.keys(FITS[tab].items)[0]; $$('#fitTabs button').forEach(x => x.classList.toggle('on', x === b)); renderGrid(); renderDetail(); });
  grid.addEventListener('click', e => { const b = e.target.closest('.fit-card'); if (!b) return; cur = b.dataset.k; renderGrid(); renderDetail(); });
  ['#fitV', '#fitV2'].forEach(s => $(s).addEventListener('input', renderDetail));
  // ตาราง 5-2
  $('#t52r').innerHTML = T52_R.map((r, i) => `<option value="${i}"${i === t52.r ? ' selected' : ''}>${r}</option>`).join('');
  $('#t52c').innerHTML = T52_C.map((c, i) => `<option value="${i}"${i === t52.c ? ' selected' : ''}>${c}°</option>`).join('');
  function render52() {
    $('#t52').innerHTML = `<thead><tr><th rowspan="2">d₂/d₁</th><th colspan="7">มุมกรวย θ</th></tr><tr>${T52_C.map((c, j) => `<th class="${j === t52.c ? 'hl' : ''}">${c}°</th>`).join('')}</tr></thead><tbody>` +
      T52.map((row, i) => `<tr class="${i === t52.r ? 'hl' : ''}"><th>${T52_R[i]}</th>${row.map((v, j) => `<td class="${i === t52.r && j === t52.c ? 'hit' : ''}">${v.toFixed(2)}</td>`).join('')}</tr>`).join('') + '</tbody>';
    $('#t52note').innerHTML = `ที่ d₂/d₁ = ${T52_R[t52.r]} และมุมกรวย ${T52_C[t52.c]}° → <b>k = ${T52[t52.r][t52.c]}</b> · สังเกต: มุมกรวยยิ่งกว้าง k ยิ่งมาก (มุม 4–10° ดีที่สุด)`;
  }
  ['#t52r', '#t52c'].forEach(s => $(s).addEventListener('change', () => { t52 = { r: +$('#t52r').value, c: +$('#t52c').value }; render52(); if (item().table === '52') renderDetail(); }));
  // ตาราง 5-3
  function render53() {
    $('#t53t').textContent = t53.toFixed(2);
    const i = Math.min(9, Math.floor(t53 * 10 + 1e-9)), exact = Math.abs(t53 * 10 - Math.round(t53 * 10)) < 1e-6;
    $('#t53').innerHTML = `<tbody><tr><th>d₂/d₁</th>${T53.map((_, j) => `<td class="${exact ? (j === Math.round(t53 * 10) ? 'hit' : '') : (j === i || j === i + 1 ? 'near' : '')}">${(j / 10).toFixed(1)}</td>`).join('')}</tr><tr><th>k</th>${T53.map((v, j) => `<td class="${exact ? (j === Math.round(t53 * 10) ? 'hit' : '') : (j === i || j === i + 1 ? 'near' : '')}">${v.toFixed(2)}</td>`).join('')}</tr></tbody>`;
    const k = t53k(t53);
    $('#t53out').innerHTML = exact ? LF('อ่านจากตารางได้ตรง ๆ', `d₂/d₁ = ${t53.toFixed(1)}`, '', `k = ${T53[Math.round(t53 * 10)].toFixed(2)}`, 'hl')
      : LF('อยู่ระหว่าง 2 ช่อง เทียบสัดส่วน (interpolate)', `k = k₁ + ${FR('x − x₁', 'x₂ − x₁')}(k₂ − k₁)`, `= ${T53[i]} + ${FR(`${t53.toFixed(2)} − ${(i / 10).toFixed(1)}`, '0.1')}(${T53[i + 1]} − ${T53[i]})`, `= ${N(k, 3)}`, 'hl');
  }
  $('#t53r').addEventListener('input', () => { t53 = +$('#t53r').value; render53(); if (item().table === '53') renderDetail(); });
  renderGrid(); renderDetail(); render52(); render53();
})();

/* =====================================================================
   ระบบท่อของฉัน (ตัวอย่าง 5.8)
   ===================================================================== */
(function systemBuilder() {
  const box = $('#sysList'); if (!box) return;
  const LIST = [
    ['inRe', 'ทางเข้า: ท่อยื่นเข้าไปในถัง', 0.8], ['inSq', 'ทางเข้า: มุมฉาก', 0.5], ['inRd', 'ทางเข้า: ลบมุมโค้ง', 0.2], ['inBl', 'ทางเข้า: ปากแตร', 0.04],
    ['globe', 'Globe valve เปิดเต็มที่', 10.0], ['angle', 'Angle valve เปิดเต็มที่', 5.0], ['gate', 'Gate valve เปิดเต็มที่', 0.19], ['ball', 'Ball valve เปิดเต็มที่', 0.05], ['check', 'Swing check valve', 2.0],
    ['e90', 'ข้องอ 90°', 0.9], ['e90m', 'ข้อโค้ง 90° รัศมีปานกลาง', 0.75], ['e90l', 'ข้อโค้ง 90° รัศมียาว', 0.6], ['e45', 'ข้องอ 45°', 0.42], ['ret', 'ข้องอกลับ', 2.2],
    ['teeB', 'สามทาง ไหลทางแยก', 2.0], ['teeL', 'สามทาง ไหลทางตรง', 0.9], ['bendNo', 'ท่อโค้งงอ ไม่มีลิ้น', 1.1], ['bendV', 'ท่อโค้งงอ มีลิ้น', 0.2], ['exit', 'ทางออกท่อเข้าถัง', 1.0]
  ];
  const cnt = {};
  const PRE58 = { inRe: 1, ball: 1, e90: 1, e45: 2, exit: 1 };
  function set(o) { LIST.forEach(([k]) => { cnt[k] = o[k] || 0; }); render(); }
  function render() {
    box.innerHTML = `<div class="sys-grid">` +
      LIST.map(([k, n, kv]) => `<div class="sys-it${cnt[k] ? ' on' : ''}"><span>${n} <span class="small muted">k = ${kv}</span></span><span class="cnt"><button data-m="${k}" aria-label="ลด">−</button><b>${cnt[k]}</b><button data-p="${k}" aria-label="เพิ่ม">+</button></span></div>`).join('') + '</div>';
    calc();
  }
  function calc() {
    const Q = +$('#sysQ').value, D = +$('#sysD').value / 1000;
    if (!(Q > 0 && D > 0)) { $('#sysOut').innerHTML = '<div class="calc-err">กรอก Q และ D ให้ถูกต้อง</div>'; return; }
    const v = Q / AREA(D), used = LIST.filter(([k]) => cnt[k]);
    const sum = used.reduce((a, [k, , kv]) => a + kv * cnt[k], 0);
    const sumTxt = used.map(([k, , kv]) => cnt[k] > 1 ? `${cnt[k]}(${kv})` : kv).join(' + ') || '0';
    $('#sysOut').innerHTML = LF('ความเร็วในท่อ', `v = ${FR('Q', 'πD²/4')}`, `= ${FR(Q, `(π/4)(${D})²`)}`, `= ${N(v, 2)} m/s`) +
      LF('รวมค่า k ทุกตัว', 'Σk', `= ${sumTxt}`, `= ${N(sum, 2)}`) +
      LF('การสูญเสียรองทั้งระบบ', `h<sub>m</sub> = (Σk)${FR('v²', '2g')}`, `= (${N(sum, 2)})${FR(`(${N(v, 2)})²`, '2(9.81)')}`, `= ${N(sum * VH(v), 2)} m`, 'hl');
  }
  box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.p) cnt[b.dataset.p]++; if (b.dataset.m) cnt[b.dataset.m] = Math.max(0, cnt[b.dataset.m] - 1);
    render();
  });
  ['#sysQ', '#sysD'].forEach(s => $(s).addEventListener('input', calc));
  $('#sys58').addEventListener('click', () => { $('#sysQ').value = 0.02; $('#sysD').value = 50; set(PRE58); });
  $('#sysClr').addEventListener('click', () => set({}));
  // รูปตัวอย่าง 5.8
  let h = FD + `<rect x="10" y="20" width="110" height="80" fill="var(--water-soft)" stroke="var(--text)" stroke-width="2"/><text x="65" y="60" text-anchor="middle" class="svg-b">ถัง A</text>`;
  h += `<rect x="380" y="140" width="120" height="80" fill="var(--water-soft)" stroke="var(--text)" stroke-width="2"/><text x="440" y="185" text-anchor="middle" class="svg-b">ถัง B</text>`;
  h += PW('M100,80 L230,80 L230,110 L300,190 L380,190', 10, 'round');
  h += `<path d="M110,80 L222,80 Q230,80 230,90 L230,110 L300,190 L372,190" fill="none" stroke="var(--water)" stroke-width="2" class="flowline" marker-end="url(#fa)"/>`;
  h += `<circle cx="170" cy="80" r="8" fill="var(--galv)" stroke="var(--text)"/><text x="170" y="66" text-anchor="middle" style="font-size:11px;fill:var(--text)">Ball valve 0.05</text>`;
  h += `<text x="240" y="78" style="font-size:11px;fill:var(--text)">ข้องอ 90° 0.9</text><text x="140" y="132" style="font-size:11px;fill:var(--text)">ข้องอ 45° 0.42</text><text x="284" y="214" style="font-size:11px;fill:var(--text)">ข้องอ 45° 0.42</text>`;
  h += `<text x="104" y="114" style="font-size:11px;fill:var(--text)">ท่อยื่นเข้าไปในถัง 0.8</text><text x="388" y="134" style="font-size:11px;fill:var(--text)">ทางออกเข้าถัง 1.0</text>`;
  h += `<text x="260" y="240" text-anchor="middle" class="svg-m" style="font-size:11px">Σk = 0.8 + 0.05 + 0.9 + 0.42 + 0.42 + 1.0 = 3.59</text>`;
  $('#sysSvg').innerHTML = h;
  set(PRE58);
})();

/* =====================================================================
   แบบทดสอบ
   ===================================================================== */
initQuiz([
  { title: 'การสูญเสียหลัก', qs: [
    { q: 'การสูญเสียพลังงานกรณีไหลผ่านท่อตรงที่มีขนาดคงที่ เรียกว่าอะไร', c: ['การสูญเสียรอง', 'การสูญเสียหลัก หรือการสูญเสียพลังงานอันเนื่องมาจากความเสียดทาน', 'การสูญเสียที่ทางเข้า', 'การสูญเสียความดันสถิต'], a: 1, e: 'การสูญเสียหลัก (Major Loss) เกิดจากความเสียดทานในท่อตรง' },
    { q: 'เรย์โนลด์นัมเบอร์ หมายถึงข้อใด', c: ['อัตราส่วนของแรงเฉื่อยต่อแรงหนืด', 'อัตราส่วนของความดันต่อความเร็ว', 'ผลคูณของความหนาแน่นกับความเร็ว', 'ความขรุขระของท่อ'], a: 0, e: 'N<sub>R</sub> = Dvρ/μ = แรงเฉื่อย/แรงหนืด' },
    { q: 'N<sub>R</sub> น้อยกว่าหรือเท่ากับ 2,000 แสดงว่าเป็นการไหลแบบใด', c: ['ปั่นป่วน', 'ราบเรียบ (Laminar)', 'ช่วงเปลี่ยนแปลง', 'ไหลย้อนกลับ'], a: 1, e: 'N<sub>R</sub> ≤ 2,000 = ราบเรียบ' },
    { q: 'N<sub>R</sub> มากกว่า 4,000 แสดงว่าเป็นการไหลแบบใด', c: ['ราบเรียบ', 'ช่วงเปลี่ยนแปลง', 'ปั่นป่วน (Turbulent)', 'ไม่ไหล'], a: 2, e: 'N<sub>R</sub> > 4,000 = ปั่นป่วน' },
    { q: 'การหาแฟกเตอร์ความเสียดทานด้วยสูตร f = 64/N<sub>R</sub> ใช้กับการไหลแบบใด', c: ['ราบเรียบ', 'ปั่นป่วน', 'ทุกแบบ', 'ช่วงเปลี่ยนแปลง'], a: 0, e: 'ใช้เฉพาะการไหลแบบราบเรียบ' },
    { q: 'การหาแฟกเตอร์ความเสียดทานด้วย Moody Chart ใช้กับการไหลแบบใด', c: ['ราบเรียบ', 'ปั่นป่วน', 'ไม่ไหล', 'ใช้ไม่ได้เลย'], a: 1, e: 'ปั่นป่วนไม่มีสูตรตายตัว ต้องอ่านจากกราฟ' },
    { q: 'ค่าที่ใช้อ่าน f จาก Moody Chart คือข้อใด', c: ['ความยาวท่อและความเร็ว', 'เรย์โนลด์นัมเบอร์ และความขรุขระสัมพัทธ์ (ε/D)', 'ความดันและอุณหภูมิ', 'อัตราการไหลและเวลา'], a: 1, e: 'แกนนอน N<sub>R</sub> และเส้นโค้ง ε/D' },
    { q: 'เรย์โนลด์นัมเบอร์มีหน่วยเป็นอะไร', c: ['m/s', 'N·s/m²', 'ไม่มีหน่วย', 'm²/s'], a: 2, e: 'หน่วยตัดกันหมด (Dv/υ = m·m/s ÷ m²/s)' },
    { q: 'ความหนืดจลน์ (υ) มีหน่วยเป็นอะไร', c: ['N·s/m²', 'm²/s', 'kg/m³', 'ไม่มีหน่วย'], a: 1, e: 'υ = μ/ρ หน่วย m²/s' },
    { q: 'น้ำอุ่นขึ้นจาก 20 °C เป็น 60 °C ในท่อและความเร็วเดิม N<sub>R</sub> จะเป็นอย่างไร', c: ['ลดลง', 'เพิ่มขึ้น เพราะความหนืดลดลง', 'เท่าเดิม', 'เป็นศูนย์'], a: 1, e: 'υ ลดจาก 1.02×10⁻⁶ เหลือ 4.67×10⁻⁷ N<sub>R</sub> จึงเพิ่มขึ้นราว 2 เท่า' },
    { q: 'ถ้าท่อยาวขึ้นเป็น 2 เท่า (ปัจจัยอื่นเท่าเดิม) การสูญเสียหลักจะเป็นอย่างไร', c: ['เท่าเดิม', 'เพิ่มเป็น 2 เท่า', 'เพิ่มเป็น 4 เท่า', 'ลดลงครึ่งหนึ่ง'], a: 1, e: 'h<sub>f</sub> แปรผันตรงกับ L (ใบงาน 5.1 ตอนที่ 1)' },
    { q: 'ถ้าความเร็วเพิ่มเป็น 2 เท่า การสูญเสียหลักจะเพิ่มประมาณกี่เท่า', c: ['2 เท่า', '4 เท่า', '8 เท่า', 'เท่าเดิม'], a: 1, e: 'h<sub>f</sub> แปรผันกับ v² (ใบงาน 5.1 ตอนที่ 3)' },
    { q: 'การไหลแบบราบเรียบ ความขรุขระของท่อมีผลต่อค่า f หรือไม่', c: ['มีผลมาก', 'ไม่มีผล', 'มีผลเฉพาะท่อเหล็ก', 'มีผลเฉพาะท่อเล็ก'], a: 1, e: 'f = 64/N<sub>R</sub> ไม่มี ε อยู่ในสูตร' },
    { q: 'ในชุดทดลอง การสูญเสียหลักระหว่าง 2 จุดหาได้จากอะไร', c: ['มาตรวัดน้ำ', 'ผลต่างของระดับน้ำในมาโนมิเตอร์', 'นาฬิกาจับเวลา', 'จำนวนรอบของวาล์ว 5'], a: 1, e: 'ผลต่างระดับน้ำ (m) = h<sub>f</sub>' },
    { q: 'ตาราง 5-1 ท่อเหล็กอาบสังกะสีใหม่ มีความขรุขระเท่าใด', c: ['0.0015 mm', '0.045 mm', '0.15 mm', '0.26 mm'], a: 2, e: 'ε = 0.15 mm' }
  ] },
  { title: 'การสูญเสียรอง', qs: [
    { q: 'การสูญเสียรอง คือข้อใด', c: ['การสูญเสียในท่อตรงยาว ๆ', 'การสูญเสียเมื่อไหลผ่านข้อต่อท่อ วาล์ว ท่อโค้ง ท่อเปลี่ยนขนาด ทางเข้าและทางออกของท่อ', 'การสูญเสียน้ำจากรอยรั่ว', 'การสูญเสียความร้อน'], a: 1, e: 'Minor Loss เกิดที่อุปกรณ์ที่ทำให้การไหลเปลี่ยนทิศหรือเปลี่ยนความเร็ว' },
    { q: 'การสูญเสียรองมีค่ามากหรือน้อย ขึ้นอยู่กับข้อใด', c: ['สัมประสิทธิ์การสูญเสียรอง ความเร็วการไหล และ g', 'ความยาวท่อเท่านั้น', 'สีของท่อ', 'ความหนาของผนังท่อ'], a: 0, e: 'h<sub>m</sub> = k·v²/2g' },
    { q: 'k ของการไหลจากถังขนาดใหญ่เข้าสู่ท่อ ขึ้นอยู่กับอะไร', c: ['ลักษณะรอยต่อที่ทางเข้าท่อ', 'ขนาดของถัง', 'ความยาวท่อ', 'อุณหภูมิน้ำ'], a: 0, e: 'ยื่นเข้าไป 0.8 · มุมฉาก 0.5 · ลบมุม 0.2 · โค้งมาก 0.04' },
    { q: 'k ของท่อค่อย ๆ เพิ่มขนาด ขึ้นอยู่กับอะไร', c: ['ความยาวท่อ', 'อัตราส่วน d₂/d₁ และมุมกรวย', 'ความเร็วอย่างเดียว', 'วัสดุท่อ'], a: 1, e: 'ดูตาราง 5-2' },
    { q: 'k ของท่อลดขนาดทันที ขึ้นอยู่กับอะไร', c: ['มุมกรวย', 'อัตราส่วนขนาดท่อเล็กต่อท่อใหญ่ (d₂/d₁)', 'ความยาวท่อเล็ก', 'ชนิดของเหลว'], a: 1, e: 'ดูตาราง 5-3' },
    { q: 'k ของทางออกท่อเข้าสู่ถังขนาดใหญ่ มีค่าเท่าใด', c: ['0.5', '0.8', '1.0 เสมอ', 'ขึ้นกับรอยต่อ'], a: 2, e: 'พลังงานจลน์ทั้งหมดสูญเสียไปในถัง k = 1.0 ไม่ว่ารอยต่อเป็นแบบใด' },
    { q: 'ทางเข้าท่อแบบใดสูญเสียน้อยที่สุด', c: ['ท่อยื่นเข้าไปในถัง', 'ท่อต่อเป็นมุมฉาก', 'ท่อต่อแบบลบมุมโค้ง', 'ท่อต่อแบบลบมุมโค้งมาก (ปากแตร)'], a: 3, e: 'k = 0.04' },
    { q: 'วาล์วชนิดใด (เปิดเต็มที่) มีค่า k สูงที่สุด', c: ['Gate valve', 'Ball valve', 'Globe valve', 'Angle valve'], a: 2, e: 'Globe valve k = 10.0 น้ำไหลวกวนเป็นรูปตัว S' },
    { q: 'วาล์วชนิดใด (เปิดเต็มที่) มีค่า k ต่ำที่สุดตามตาราง 5-4', c: ['Ball valve', 'Globe valve', 'Swing check valve', 'Angle valve'], a: 0, e: 'Ball valve k = 0.05' },
    { q: 'ท่อโค้งงอที่ใส่ลิ้นช่วยภายใน มีค่า k เท่าใด', c: ['1.1', '0.6', '0.2', '2.2'], a: 2, e: 'ลดจาก 1.1 (ไม่มีลิ้น) เหลือ 0.2' },
    { q: 'การคำนวณการสูญเสียรองของท่อลดขนาดทันที ต้องใช้ความเร็วในท่อใด', c: ['ท่อใหญ่', 'ท่อเล็ก', 'ค่าเฉลี่ยของสองท่อ', 'ไม่ต้องใช้ความเร็ว'], a: 1, e: 'ตามหัวข้อ 5.3.3.3 v คือความเร็วในท่อเล็ก' },
    { q: 'ท่อขนาดเดียวกันตลอดระบบ มีอุปกรณ์หลายตัว คำนวณการสูญเสียรองรวมอย่างไรได้ง่ายที่สุด', c: ['รวมค่า k ทุกตัวก่อน แล้วคูณ v²/2g', 'คูณค่า k ทุกตัว', 'ใช้ค่า k ตัวที่มากที่สุด', 'เฉลี่ยค่า k'], a: 0, e: 'ความเร็วเท่ากันทุกจุด h<sub>m</sub> = (Σk)v²/2g (ตัวอย่าง 5.8)' },
    { q: 'ในการทดลองข้องอ 45° ระหว่างจุดวัดมีข้องอ 2 ตัว ต้องทำอย่างไรกับค่า k ที่คำนวณได้', c: ['คูณ 2', 'หาร 2', 'ใช้ค่าเดิม', 'บวก 1'], a: 1, e: 'ค่าที่วัดได้เป็นของ 2 ตัวรวมกัน ต้องหาร 2 เป็นค่าของ 1 ตัว' },
    { q: 'k ของ Gate Valve จากการทดลอง (0.94) ต่างจากตาราง (0.19) มาก เพราะอะไร', c: ['คำนวณผิดแน่นอน', 'วาล์วจริงในชุดทดลองมีขนาดและรูปร่างภายในต่างจากวาล์วที่ใช้ทำตาราง', 'มาโนมิเตอร์เสีย', 'น้ำร้อนเกินไป'], a: 1, e: 'วาล์วเกลียวขนาดเล็กมีค่า k สูงกว่าค่าในตาราง ค่าจากการทดลองจริงจึงสำคัญ' }
  ] },
  { title: 'คำนวณ', qs: [
    { q: 'น้ำ υ = 1.30 × 10⁻⁶ m²/s ในท่อ 150 mm ความเร็ว 5.5 m/s มี N<sub>R</sub> เท่าใด และไหลแบบใด', c: ['634.6 ราบเรียบ', '6,346 ช่วงเปลี่ยน', '634,615 ปั่นป่วน', '6.3 × 10⁸ ปั่นป่วน'], a: 2, e: '(0.15)(5.5)/(1.30×10⁻⁶) = 634,615 (ตัวอย่าง 5.1)' },
    { q: 'N<sub>R</sub> = 1,601 แฟกเตอร์ความเสียดทานเท่าใด', c: ['0.004', '0.04', '0.4', '25'], a: 1, e: 'f = 64/1,601 = 0.04 (ตัวอย่าง 5.2)' },
    { q: 'น้ำ 10 Litre ไหลผ่านมาตรวัดน้ำใน 12.74 s อัตราการไหลเท่าใด', c: ['7.85 × 10⁻⁴ m³/s', '7.85 × 10⁻² m³/s', '0.785 m³/s', '127.4 m³/s'], a: 0, e: 'Q = (10×10⁻³)/12.74 = 7.85×10⁻⁴ m³/s' },
    { q: 'Q = 7.85 × 10⁻⁴ m³/s ในท่อ 21 mm ความเร็วเท่าใด', c: ['0.23 m/s', '2.27 m/s', '22.7 m/s', '0.037 m/s'], a: 1, e: 'v = Q/(πD²/4) = 7.85×10⁻⁴ / 3.46×10⁻⁴ = 2.27 m/s' },
    { q: 'f = 0.0164, L = 100 m, D = 0.15 m, v = 2.52 m/s การสูญเสียหลักเท่าใด', c: ['0.35 m', '3.54 m', '35.4 m', '0.0035 m'], a: 1, e: '(0.0164)(100/0.15)(2.52²/19.62) = 3.54 m (ตัวอย่าง 5.5)' },
    { q: 'h<sub>m</sub> = 0.25 m, v = 2.29 m/s ค่า k เท่าใด', c: ['0.094', '0.94', '9.4', '0.24'], a: 1, e: 'k = (0.25)(2)(9.81)/2.29² = 0.94 (ตัวอย่าง 5.9)' },
    { q: 'Σk = 3.59 และ v = 10.19 m/s การสูญเสียรองรวมเท่าใด', c: ['1.9 m', '19.0 m', '36.6 m', '190 m'], a: 1, e: '(3.59)(10.19²/19.62) = 19.0 m (ตัวอย่าง 5.8)' },
    { q: 'ท่อเหล็กหล่อ ε = 0.26 mm ขนาด 150 mm มีความขรุขระสัมพัทธ์เท่าใด', c: ['0.0173', '0.00173', '0.039', '577'], a: 1, e: 'ε/D = 0.26/150 = 0.00173 (หน่วย mm ตัดกัน)' },
    { q: '75 Litre/s ไหลในท่อ 150 mm มีความเร็วเท่าใด', c: ['0.42 m/s', '4.24 m/s', '42.4 m/s', '3.33 m/s'], a: 1, e: 'v = 0.075/0.01767 = 4.24 m/s' }
  ] }
]);

/* =====================================================================
   สรุปสูตร
   ===================================================================== */
initFormulas([
  { id: 'fx1', t: 'อัตราการไหล (จากการทดลอง)', eq: `Q = ${FR('V', 't')}`,
    o: 'อัตราการไหล = ปริมาตรที่ไหลผ่าน ÷ เวลา ในการทดลองอ่านปริมาตรจากมาตรวัดน้ำ และจับเวลาด้วยนาฬิกา',
    v: [['Q', 'อัตราการไหล', 'm³/s', 'คำนวณ'], ['V', 'ปริมาณการไหล (ปริมาตร)', 'm³', 'มาตรวัดน้ำ (10 Litre = 10 × 10⁻³ m³)'], ['t', 'เวลาที่ใช้ในการไหล', 's', 'นาฬิกาจับเวลา']],
    ex: '(10 × 10⁻³)/12.74 = <b>7.85 × 10⁻⁴ m³/s</b>' },
  { id: 'fx2', t: 'ความเร็วในการไหล', eq: `Q = A · v → v = ${FR('Q', 'A')} · A = ${FR('π D²', '4')}`,
    o: 'น้ำปริมาตร Q ต่อวินาทีไหลผ่านหน้าตัด A ได้ระยะทาง v ต่อวินาที ปริมาตร = พื้นที่ × ระยะทาง จึงได้ Q = A·v',
    v: [['v', 'ความเร็วเฉลี่ยในท่อ', 'm/s', 'คำนวณ'], ['Q', 'อัตราการไหล', 'm³/s', 'สูตร Q = V/t หรือโจทย์ (L/s × 10⁻³)'], ['A', 'พื้นที่หน้าตัดภายในท่อ', 'm²', 'πD²/4'], ['D', 'เส้นผ่านศูนย์กลางภายในท่อ', 'm', 'mm ÷ 1,000']],
    ex: '(7.85 × 10⁻⁴)/[(π/4)(0.021)²] = <b>2.27 m/s</b>' },
  { id: 'fx3', t: 'เรย์โนลด์นัมเบอร์ (Reynolds Number)', eq: `N<sub>R</sub> = ${FR('D v ρ', 'μ')} = ${FR('D v', 'υ')}`,
    o: 'เทียบแรงเฉื่อย (ขึ้นกับ ρ, v, D) กับแรงหนืด (ขึ้นกับ μ) เพราะ υ = μ/ρ จึงเขียนได้สองแบบ ใช้บอกชนิดการไหล: ≤ 2,000 ราบเรียบ, 2,000–4,000 ช่วงเปลี่ยน, > 4,000 ปั่นป่วน',
    v: [['N<sub>R</sub>', 'เรย์โนลด์นัมเบอร์', 'ไม่มีหน่วย', 'คำนวณ'], ['D', 'เส้นผ่านศูนย์กลางท่อ', 'm', 'ข้อมูลท่อ'], ['v', 'ความเร็วการไหล', 'm/s', 'v = Q/A'], ['ρ', 'ความหนาแน่น', 'kg/m³', 'บทที่ 4 / โจทย์'], ['μ', 'ความหนืดสัมบูรณ์', 'N·s/m²', 'โจทย์ / ตาราง'], ['υ', 'ความหนืดจลน์ = μ/ρ', 'm²/s', 'ตารางคุณสมบัติของน้ำตามอุณหภูมิ']],
    ex: 'ตัวอย่าง 5.1: (0.15)(5.5)/(1.30 × 10⁻⁶) = <b>634,615 ปั่นป่วน</b>' },
  { id: 'fx4', t: 'แฟกเตอร์ความเสียดทาน: ไหลแบบราบเรียบ', eq: `f = ${FR('64', 'N<sub>R</sub>')}`,
    o: 'การไหลแบบราบเรียบมีรูปร่างความเร็วเป็นพาราโบลาที่คำนวณได้แน่นอนด้วยทฤษฎี (สมการ Hagen–Poiseuille) จัดรูปให้อยู่ในแบบสมการดาร์ซีได้ f = 64/N<sub>R</sub> ไม่ขึ้นกับความขรุขระ',
    v: [['f', 'แฟกเตอร์ความเสียดทาน', 'ไม่มีหน่วย', 'คำนวณ'], ['N<sub>R</sub>', 'เรย์โนลด์นัมเบอร์ (ต้อง ≤ 2,000)', 'ไม่มีหน่วย', 'สูตร N<sub>R</sub>']],
    ex: 'ตัวอย่าง 5.2: 64/1,601 = <b>0.04</b>' },
  { id: 'fx5', t: 'แฟกเตอร์ความเสียดทาน: ไหลแบบปั่นป่วน (Moody Chart)', eq: `อ่าน f จาก Moody Chart ที่ N<sub>R</sub> และ ${FR('ε', 'D')} <span class="eq-alt">เส้นในกราฟมาจากสมการโคลบรูก: ${FR('1', '√f')} = −2 log(${FR('ε/D', '3.7')} + ${FR('2.51', 'N<sub>R</sub>√f')}) (ไม่ต้องจำ)</span>`,
    o: 'การไหลปั่นป่วนไม่มีสูตรตรง ๆ จากทฤษฎี นักวิจัยทดลองแล้วสรุปเป็นสมการโคลบรูก ซึ่งแก้ยาก มูดี้ (L. F. Moody) จึงวาดเป็นกราฟให้อ่านง่าย',
    v: [['ε', 'ความขรุขระของผิวท่อ', 'mm', 'ตาราง 5-1'], ['D', 'เส้นผ่านศูนย์กลางท่อ', 'mm', 'ใช้หน่วยเดียวกับ ε'], ['ε/D', 'ความขรุขระสัมพัทธ์', 'ไม่มีหน่วย', 'คำนวณ']],
    ex: 'ตัวอย่าง 5.3: N<sub>R</sub> = 6.18 × 10⁵, ε/D = 0.00173 → <b>f ≈ 0.0226</b>' },
  { id: 'fx6', t: 'การสูญเสียหลัก (สมการดาร์ซี–ไวสบาค)', eq: `h<sub>f</sub> = f · ${FR('L', 'D')} · ${FR('v²', '2g')}`,
    o: 'การสูญเสียเพิ่มตามความยาวท่อ (L) และพลังงานจลน์ของน้ำต่อหน่วยน้ำหนัก (v²/2g) ท่อเล็กเสียมากกว่า (D อยู่ในส่วน) และ f บอกความฝืดของท่อ',
    v: [['h<sub>f</sub>', 'การสูญเสียหลัก', 'm', 'คำนวณ หรือวัดจากผลต่างระดับน้ำในมาโนมิเตอร์'], ['f', 'แฟกเตอร์ความเสียดทาน', 'ไม่มีหน่วย', '64/N<sub>R</sub> หรือ Moody'], ['L', 'ความยาวท่อ', 'm', 'วัด / โจทย์'], ['D', 'เส้นผ่านศูนย์กลางท่อ', 'm', 'ข้อมูลท่อ'], ['v', 'ความเร็ว', 'm/s', 'v = Q/A'], ['g', 'ความเร่งเนื่องจากแรงโน้มถ่วง', 'm/s²', '9.81']],
    ex: 'ตัวอย่าง 5.4: (2.393)(1.0/0.2)(0.03183²/19.62) = <b>0.618 mm</b>' },
  { id: 'fx7', t: 'หาค่า f และความขรุขระจากการทดลอง', eq: `f = ${FR('h<sub>f</sub> · D · 2g', 'L · v²')} → อ่าน ε/D จาก Moody → ε = (ε/D) · D`,
    o: 'จัดรูปสมการดาร์ซีย้อนกลับ เพราะการทดลองวัด h<sub>f</sub> ได้ แล้วนำ f กับ N<sub>R</sub> ไปหาจุดบน Moody Chart ว่าตกบนเส้น ε/D เส้นไหน',
    v: [['h<sub>f</sub>', 'ผลต่างระดับน้ำ', 'm', 'มาโนมิเตอร์ (cm ÷ 100)'], ['L', 'ระยะระหว่างจุดวัด', 'm', 'ชุดทดลอง (1.25 m)'], ['v', 'ความเร็ว', 'm/s', 'Q = V/t แล้ว v = Q/A']],
    ex: 'ตัวอย่าง 5.5: f = (0.665)(0.021)(2)(9.81)/[(1.25)(2.27)²] = 0.043 → ε/D = 0.013 → <b>ε = 0.273 mm</b>' },
  { id: 'fx8', t: 'การสูญเสียรอง', eq: `h<sub>m</sub> = k · ${FR('v²', '2g')} <span class="eq-alt">หลายอุปกรณ์ในท่อขนาดเดียวกัน: h<sub>m</sub> = (Σk) · ${FR('v²', '2g')}</span>`,
    o: 'การสูญเสียที่อุปกรณ์เป็นสัดส่วนกับพลังงานจลน์ v²/2g โดยมี k เป็นตัวคูณที่ขึ้นกับรูปร่างอุปกรณ์ ได้มาจากการทดลอง',
    v: [['h<sub>m</sub>', 'การสูญเสียรอง', 'm', 'คำนวณ / มาโนมิเตอร์'], ['k', 'สัมประสิทธิ์การสูญเสียรอง', 'ไม่มีหน่วย', 'รูป 5-2, ตาราง 5-2, 5-3, 5-4 หรือจากการทดลอง'], ['v', 'ความเร็ว (ท่อลดขนาดใช้ v ในท่อเล็ก)', 'm/s', 'v = Q/A']],
    ex: 'ตัวอย่าง 5.8: (3.59)(10.19²/19.62) = <b>19.0 m</b>' },
  { id: 'fx9', t: 'ท่อเพิ่มขนาด (ฉับพลัน / ค่อย ๆ เพิ่ม)', eq: `h<sub>m</sub> = k · ${FR('(v₁ − v₂)²', '2g')} <span class="eq-alt">เพิ่มขนาดฉับพลัน k = 1 → h<sub>m</sub> = ${FR('(v₁ − v₂)²', '2g')}</span>`,
    o: 'น้ำจากท่อเล็กพุ่งเข้าท่อใหญ่ ความเร็วที่ "หายไป" (v₁ − v₂) สลายเป็นวังวน การสูญเสียจึงขึ้นกับผลต่างความเร็ว',
    v: [['v₁', 'ความเร็วในท่อเล็ก', 'm/s', 'Q/A₁'], ['v₂', 'ความเร็วในท่อใหญ่', 'm/s', 'Q/A₂'], ['k', 'ค่อย ๆ เพิ่มขนาดดูตาราง 5-2', 'ไม่มีหน่วย', 'd₂/d₁ และมุมกรวย']],
    ex: 'v₁ = 3 m/s, v₂ = 0.75 m/s → (3 − 0.75)²/19.62 = <b>0.26 m</b>' },
  { id: 'fx10', t: 'หาค่า k จากการทดลอง', eq: `k = ${FR('h<sub>m</sub> · 2g', 'v²')}`,
    o: 'จัดรูปจาก h<sub>m</sub> = k·v²/2g วัด h<sub>m</sub> จากมาโนมิเตอร์ และหา v จาก Q = V/t แล้ว v = Q/A ทำหลายครั้งแล้วหาค่าเฉลี่ย (ถ้ามีอุปกรณ์ n ตัวระหว่างจุดวัด ให้หาร n)',
    v: [['h<sub>m</sub>', 'ผลต่างระดับน้ำ', 'm', 'มาโนมิเตอร์'], ['v', 'ความเร็ว', 'm/s', 'Q/A']],
    ex: 'ตัวอย่าง 5.9: (0.25)(2)(9.81)/2.29² = <b>0.94</b>' }
], [
  ['Litre → m³', 'คูณ 10⁻³ (1 m³ = 1,000 L)'],
  ['Litre/s → m³/s', 'คูณ 10⁻³'],
  ['mm → m', 'หาร 1,000 (D ในสูตร h<sub>f</sub> และ N<sub>R</sub> ใช้หน่วย m)'],
  ['cm (มาโนมิเตอร์) → m', 'หาร 100'],
  ['ε/D', 'ใช้ ε และ D หน่วยเดียวกัน (mm/mm) ไม่ต้องแปลงเป็น m'],
  ['μ → υ', 'υ = μ/ρ (N·s/m² ÷ kg/m³ = m²/s)']
]);
