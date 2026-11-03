/* Tablero financiero en vivo (simulación con datos ficticios)
   - El dato de HOY se mueve en tiempo real (cada ~0,5 s).
   - Cada pocos segundos "cierra" un día y entra uno nuevo.
   - Se puede ver como gráfico o como tabla, por 7/14/30 días,
     y tocar cualquier indicador para ver su evolución. */
(function () {
  const root = document.getElementById('live-dash');
  if (!root) return;

  const C = { pos: '#1BA597', neg: '#D9703F', meta: '#8FA0B8', blue: '#6F8CF0', spark: '#20B7A9' };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LIVE_MS = reduce ? 2500 : 450;   // movimiento del dato de hoy
  const DAY_MS = reduce ? 9000 : 4200;   // cierre de un día simulado
  const MAXD = 45;                        // días guardados en memoria
  const NS = 'http://www.w3.org/2000/svg';
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const nf = (v, d) => v.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtM = (v) => (v < 0 ? '−' : '') + '$' + nf(Math.abs(v), Math.abs(v) >= 1000 ? 0 : 1) + ' M';
  const fmtP = (v) => nf(v, 1) + '%';
  const fmtD = (v) => Math.round(v) + ' días';
  const pct = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1) + '%';
  const $ = (id) => document.getElementById(id);

  /* ---------- Sectores ---------- */
  const SECT = {
    constructora: { name: 'Constructora demo', ing: 'Ingresos', ingD: 'Ingresos diarios', m: { label: 'Margen bruto', v: 33.4, base: 31.8, lo: 29, hi: 38 }, cart: 'Cartera vencida', buckets: ['Al día', '1–30 días', '31–60 días', '+60 días'],
      clientes: ['Constructora Andina', 'Inmobiliaria Los Cerros', 'Grupo Ladera', 'Urbanizadora Sabana', 'Proyecto Torre Norte', 'Conjunto Mirador'],
      alerta: 'Alerta: cuota vence hoy', sync: 'ERP + Excel de obra',
      n: { meta: 48, lo: 26, hi: 72, vol: 9, flow: [-22, 34], amp: 40, cart: [612, 184, 96, 58], k4: { label: 'Caja disponible', v: 1264, base: 1180, lo: 900, hi: 1600, money: true, goodUp: true }, pay: [4, 38], fac: [6, 52], alertAmt: [2, 15], usd: [4, 28] } },
    comercio: { name: 'Distribuidora demo', ing: 'Ventas', ingD: 'Ventas diarias', m: { label: 'Margen bruto', v: 22.1, base: 20.6, lo: 18, hi: 26 }, cart: 'Cartera vencida', buckets: ['Al día', '1–30 días', '31–60 días', '+60 días'],
      clientes: ['Tienda La 80', 'Supermercado El Prado', 'Droguería Central', 'Ferretería del Norte', 'Minimercado Suba', 'Almacén La Esquina'],
      alerta: 'Alerta: inventario bajo · Ref. ', sync: 'POS + inventario de bodega',
      n: { meta: 16, lo: 7, hi: 28, vol: 3.2, flow: [-7, 11], amp: 14, cart: [148, 62, 27, 14], k4: { label: 'Días de inventario', v: 38, base: 43, lo: 28, hi: 52, money: false, goodUp: false }, pay: [0.4, 6], fac: [0.8, 9], alertAmt: null, usd: [1, 9] } },
    salud: { name: 'IPS demo', ing: 'Facturación', ingD: 'Facturación diaria', m: { label: 'Ocupación de agenda', v: 84.2, base: 80.5, lo: 74, hi: 93 }, cart: 'Cuentas por cobrar EPS', buckets: ['Al día', '1–60 días', '61–90 días', '+90 días'],
      clientes: ['EPS Ejemplo Uno', 'EPS Ejemplo Dos', 'Póliza Ejemplo', 'Medicina prepagada demo', 'Particulares', 'Convenio empresarial demo'],
      alerta: 'Alerta: glosa por responder', sync: 'Agenda + facturación',
      n: { meta: 31, lo: 16, hi: 47, vol: 6, flow: [-16, 20], amp: 26, cart: [384, 262, 171, 128], k4: { label: 'Caja disponible', v: 728, base: 690, lo: 500, hi: 980, money: true, goodUp: true }, pay: [3, 46], fac: [0.2, 3.5], alertAmt: [1, 12], usd: [1, 6] } }
  };
  let S = SECT.constructora;

  /* ---------- Estado ---------- */
  // ingresos[i] / flujo[i]: un valor por día; el último es HOY (en curso)
  let META = 48, ingresos = [], flujo = [], cartera = [], base0 = [];
  const K = { ingresos: {}, margen: {}, cartera: {}, caja: {} };
  const MES = 22; // días hábiles que suma "del mes"
  const sumMes = () => ingresos.slice(-MES).reduce((a, b) => a + b, 0);

  function seed() {
    const n = S.n; META = n.meta;
    ingresos = []; let v = META;
    for (let i = 0; i < MAXD; i++) { v = clamp(v + rnd(-n.vol, n.vol) + (META - v) * 0.25 + n.meta * 0.004, n.lo, n.hi); ingresos.push(v); }
    flujo = []; for (let i = 0; i < MAXD; i++) flujo.push(rnd(n.flow[0], n.flow[1]));
    base0 = n.cart.slice();
    cartera = n.cart.map((c) => c * (1 + rnd(-0.05, 0.05)));
    const cv = () => cartera.slice(1).reduce((a, b) => a + b, 0);
    Object.assign(K.ingresos, { label: S.ing + ' del mes', fmt: fmtM, axis: (x) => '$' + nf(x, 0), goodUp: true, v: sumMes(), get: sumMes });
    K.ingresos.base = K.ingresos.v * rnd(0.88, 0.95);
    Object.assign(K.margen, { label: S.m.label, fmt: fmtP, axis: (x) => nf(x, 0) + '%', goodUp: true, v: S.m.v, base: S.m.base });
    Object.assign(K.cartera, { label: S.cart, fmt: fmtM, axis: (x) => '$' + nf(x, 0), goodUp: false, v: cv(), base: cv() * rnd(1.04, 1.1), get: cv });
    Object.assign(K.caja, { label: n.k4.label, fmt: n.k4.money ? fmtM : fmtD, axis: n.k4.money ? (x) => '$' + nf(x, 0) : (x) => nf(x, 0) + ' d', goodUp: n.k4.goodUp, v: n.k4.v, base: n.k4.base });
    // historia diaria de cada indicador (para "ver su evolución")
    Object.values(K).forEach((k) => {
      k.hist = []; let h = k.v;
      for (let i = 0; i < MAXD; i++) { h = h * (1 + rnd(-0.025, 0.025)) + (k.v - h) * 0.2; k.hist.push(h); }
      k.hist[MAXD - 1] = k.v; k.shown = k.v;
    });
  }
  seed();

  /* ---------- Fechas: el último punto siempre es HOY (nunca fechas futuras) ---------- */
  const HOY = new Date(); HOY.setHours(12, 0, 0, 0);
  const fechaDe = (iDesdeFinal) => new Date(HOY.getTime() - iDesdeFinal * 864e5);
  const dLabel = (iDesdeFinal) => iDesdeFinal === 0 ? 'Hoy' : fechaDe(iDesdeFinal).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '').replace(' de ', ' ');
  const dISO = (iDesdeFinal) => { const d = fechaDe(iDesdeFinal); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  /* ---------- KPIs (tocables: muestran su evolución) ---------- */
  const kpiWrap = $('ld-kpis');
  Object.entries(K).forEach(([id, k]) => {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'kpi'; el.dataset.k = id; el.setAttribute('aria-pressed', 'false');
    el.innerHTML = '<small>' + k.label + '</small><b>' + k.fmt(k.v) + '</b><span class="delta"><i></i><span></span></span>' +
      '<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path fill="none" stroke="' + C.spark + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
    el.addEventListener('click', () => setView(view === 'kpi' && kpiSel === id ? 'ingresos' : 'kpi', id));
    kpiWrap.appendChild(el);
    k.el = el;
  });
  function renderKpi(id, flash) {
    const k = K[id], el = k.el, b = el.querySelector('b');
    b.textContent = k.fmt(k.v);
    if (flash && !reduce) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
    const chg = (k.v - k.base) / k.base * 100;
    const good = k.goodUp ? chg >= 0 : chg <= 0;
    const d = el.querySelector('.delta');
    d.className = 'delta ' + (good ? 'good' : 'bad');
    d.querySelector('i').textContent = (chg >= 0 ? '▲ ' : '▼ ') + nf(Math.abs(chg), 1) + '%';
    d.querySelector('span').textContent = 'vs. mes anterior';
    const h = k.hist.slice(-20), mn = Math.min(...h), mx = Math.max(...h), r = mx - mn || 1;
    el.querySelector('.spark path').setAttribute('d', h.map((v, i) => (i ? 'L' : 'M') + (i / (h.length - 1) * 100).toFixed(1) + ' ' + (27 - (v - mn) / r * 24).toFixed(1)).join(' '));
    el.setAttribute('aria-label', k.label + ': ' + k.fmt(k.v) + '. Ver su evolución');
  }
  Object.keys(K).forEach((id) => renderKpi(id, false));

  /* ---------- Gráfico ---------- */
  const svg = $('ld-chart'), wrap = $('ld-wrap'), tip = $('ld-tip'), legend = $('ld-legend');
  const table = $('ld-table'), stats = $('ld-stats'), csvBtn = $('ld-csv');
  let view = 'ingresos', kpiSel = null, mode = 'chart', range = 30;
  let W = 600, H = 240, hoverIdx = null;
  const M = { l: 46, r: 22, t: 14, b: 24 };
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const a in attrs) n.setAttribute(a, attrs[a]); (parent || svg).appendChild(n); return n; };
  const txt = (x, y, s, attrs) => { const n = el('text', Object.assign({ x, y }, attrs || {})); n.textContent = s; return n; };
  function nice(lo, hi, n) {
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    const raw = (hi - lo) / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
    const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
    return { min: Math.floor(lo / step) * step, max: Math.ceil(hi / step) * step, step };
  }
  function yAxis(sc, fmt) {
    const ph = H - M.t - M.b;
    for (let v = sc.min; v <= sc.max + sc.step / 2; v += sc.step) {
      const y = M.t + ph - (v - sc.min) / (sc.max - sc.min) * ph;
      el('line', { x1: M.l, x2: W - M.r, y1: y, y2: y, class: Math.abs(v) < 1e-9 && sc.min < 0 ? 'base' : 'grid' });
      txt(M.l - 8, y + 4, fmt(v), { 'text-anchor': 'end' });
    }
  }
  function xLabels(n, X) {
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor((W - M.l - M.r) / 64))));
    for (let i = n - 1; i >= 0; i -= every) txt(X(i), H - 6, dLabel(n - 1 - i), { 'text-anchor': i === n - 1 ? 'end' : 'middle' });
  }
  const serie = () => view === 'kpi' ? K[kpiSel].hist.slice(-range) : view === 'flujo' ? flujo.slice(-range) : ingresos.slice(-range);

  function titulo() {
    if (view === 'kpi') return 'Evolución diaria de ' + K[kpiSel].label.toLowerCase();
    return { ingresos: S.ingD + ' frente a la meta', flujo: 'Flujo de caja neto por día', cartera: 'Cartera por edades' }[view];
  }
  function draw() {
    const showChart = mode === 'chart';
    wrap.hidden = !showChart; table.hidden = showChart; csvBtn.hidden = showChart;
    $('ld-range').hidden = view === 'cartera';
    legend.innerHTML = view === 'kpi'
      ? '<span><i style="background:' + C.spark + '"></i>Evolución diaria · ' + K[kpiSel].label + '</span>'
      : view === 'ingresos' ? '<span><i style="background:' + C.pos + '"></i>' + S.ingD + '</span><span><i class="ld-dash"></i>Meta</span>'
      : view === 'flujo' ? '<span><i class="sq" style="background:' + C.pos + '"></i>Entra más</span><span><i class="sq" style="background:' + C.neg + '"></i>Sale más</span>'
      : '<span><i class="sq" style="background:' + C.blue + '"></i>Saldo por tramo</span>';
    renderStats();
    if (!showChart) { renderTable(); return; }
    W = wrap.clientWidth; H = wrap.clientHeight;
    if (!W || !H) return;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('aria-label', 'Gráfico: ' + titulo());
    svg.innerHTML = '';
    if (view === 'flujo') drawFlow(); else if (view === 'cartera') drawCartera(); else drawLine();
    if (hoverIdx == null) tip.hidden = true;
  }
  let raf = 0;
  const requestDraw = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); };

  function drawLine() {
    const isK = view === 'kpi', k = isK ? K[kpiSel] : null, pts = serie(), n = pts.length;
    const color = isK ? C.spark : C.pos;
    const lo = isK ? Math.min(...pts) : Math.min(S.n.lo, ...pts), hi = isK ? Math.max(...pts) : Math.max(S.n.hi, ...pts);
    const pad = isK ? (hi - lo) * 0.15 : 0;
    const sc = nice(lo - pad, hi + pad, 4), pw = W - M.l - M.r, ph = H - M.t - M.b;
    const X = (i) => M.l + (n === 1 ? pw : i / (n - 1) * pw), Y = (v) => M.t + ph - (v - sc.min) / (sc.max - sc.min) * ph;
    yAxis(sc, isK ? k.axis : (v) => '$' + nf(v, 0));
    xLabels(n, X);
    if (!isK) {
      el('line', { x1: M.l, x2: W - M.r, y1: Y(META), y2: Y(META), stroke: C.meta, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
      txt(M.l + 6, Y(META) - 6, 'Meta ' + fmtM(META).replace(',0 M', ' M'));
    }
    const d = pts.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
    const grad = el('linearGradient', { id: 'ldg', x1: 0, x2: 0, y1: 0, y2: 1 }, el('defs', {}));
    el('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': 0.28 }, grad);
    el('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': 0 }, grad);
    el('path', { d: d + ' L' + X(n - 1) + ' ' + (M.t + ph) + ' L' + X(0) + ' ' + (M.t + ph) + 'Z', fill: 'url(#ldg)' });
    el('path', { d, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    const last = pts[n - 1];
    el('circle', { cx: X(n - 1), cy: Y(last), r: 9, fill: color, opacity: 0.25, class: 'pulse-pt' });
    el('circle', { cx: X(n - 1), cy: Y(last), r: 4.5, fill: color, stroke: '#22324A', 'stroke-width': 2 });
    txt(X(n - 1) - 10, Y(last) - 12, (isK ? k.fmt : fmtM)(last), { class: 'val', 'text-anchor': 'end' });
    if (hoverIdx != null && hoverIdx < n) {
      const v = pts[hoverIdx], x = X(hoverIdx);
      el('line', { x1: x, x2: x, y1: M.t, y2: M.t + ph, stroke: 'rgba(255,255,255,.35)', 'stroke-width': 1 });
      el('circle', { cx: x, cy: Y(v), r: 5, fill: color, stroke: '#22324A', 'stroke-width': 2 });
      const prev = pts[hoverIdx - 1];
      showTip(x, Y(v), '<div>' + dLabel(n - 1 - hoverIdx) + (hoverIdx === n - 1 ? ' · en curso' : '') + '</div>' +
        '<div><span class="sw" style="background:' + color + '"></span>' + (isK ? k.label : S.ing) + ' <b>' + (isK ? k.fmt : fmtM)(v) + '</b></div>' +
        (isK ? (prev != null ? '<div>' + pct((v - prev) / prev * 100) + ' vs. día anterior</div>' : '')
             : '<div><span class="sw" style="background:' + C.meta + '"></span>Meta <b>' + fmtM(META) + '</b> · ' + pct((v - META) / META * 100) + '</div>'));
    }
    svg.onpointermove = (e) => { const r = svg.getBoundingClientRect(); hoverIdx = clamp(Math.round((e.clientX - r.left - M.l) / pw * (n - 1)), 0, n - 1); requestDraw(); };
  }

  function drawFlow() {
    const pts = serie(), n = pts.length, amp = Math.max(S.n.amp, ...pts.map(Math.abs)), sc = nice(-amp, amp, 4);
    const pw = W - M.l - M.r, ph = H - M.t - M.b, bw = pw / n, Y = (v) => M.t + ph - (v - sc.min) / (sc.max - sc.min) * ph;
    yAxis(sc, (v) => (v > 0 ? '+' : '') + nf(v, 0));
    xLabels(n, (i) => M.l + i * bw + bw / 2);
    pts.forEach((v, i) => {
      const gap = bw > 10 ? 2 : 1, x = M.l + i * bw + gap / 2, w = Math.max(2, bw - gap), y0 = Y(0), y1 = Y(v);
      const top = Math.min(y0, y1), h = Math.max(2, Math.abs(y1 - y0)), r = Math.min(4, w / 2, h);
      const up = v >= 0;
      const dpath = up
        ? 'M' + x + ' ' + (top + h) + 'V' + (top + r) + 'Q' + x + ' ' + top + ' ' + (x + r) + ' ' + top + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + top + ' ' + (x + w) + ' ' + (top + r) + 'V' + (top + h) + 'Z'
        : 'M' + x + ' ' + top + 'V' + (top + h - r) + 'Q' + x + ' ' + (top + h) + ' ' + (x + r) + ' ' + (top + h) + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + (top + h) + ' ' + (x + w) + ' ' + (top + h - r) + 'V' + top + 'Z';
      el('path', { d: dpath, fill: up ? C.pos : C.neg, opacity: hoverIdx == null || hoverIdx === i ? (i === n - 1 ? 0.75 : 1) : 0.45 });
      if (i === n - 1) txt(x + w / 2, up ? top - 6 : top + h + 14, (up ? '+' : '−') + nf(Math.abs(v), 1), { class: 'val', 'text-anchor': 'end' });
      if (hoverIdx === i) showTip(x + w / 2, top, '<div>' + dLabel(n - 1 - i) + (i === n - 1 ? ' · en curso' : '') + '</div><div><span class="sw" style="background:' + (up ? C.pos : C.neg) + '"></span>Flujo neto <b>' + (up ? '+' : '') + fmtM(v) + '</b></div>');
    });
    el('line', { x1: M.l, x2: W - M.r, y1: Y(0), y2: Y(0), class: 'base' });
    svg.onpointermove = (e) => { const r = svg.getBoundingClientRect(); hoverIdx = clamp(Math.floor((e.clientX - r.left - M.l) / bw), 0, n - 1); requestDraw(); };
  }

  function drawCartera() {
    const total = cartera.reduce((a, b) => a + b, 0), max = Math.max(...cartera) * 1.18;
    const lw = 92, rw = 120, top = 10, rowH = (H - top - 6) / cartera.length, pw = W - lw - rw;
    cartera.forEach((v, i) => {
      const y = top + i * rowH, bh = Math.min(26, rowH * 0.55), by = y + (rowH - bh) / 2, w = Math.max(4, v / max * pw), r = Math.min(4, bh / 2);
      txt(lw - 10, by + bh / 2 + 4, S.buckets[i], { 'text-anchor': 'end' });
      el('rect', { x: lw, y: by, width: pw, height: bh, rx: r, fill: 'rgba(255,255,255,.05)' });
      el('path', { d: 'M' + lw + ' ' + by + 'H' + (lw + w - r) + 'Q' + (lw + w) + ' ' + by + ' ' + (lw + w) + ' ' + (by + r) + 'V' + (by + bh - r) + 'Q' + (lw + w) + ' ' + (by + bh) + ' ' + (lw + w - r) + ' ' + (by + bh) + 'H' + lw + 'Z', fill: C.blue, opacity: hoverIdx == null || hoverIdx === i ? 1 : 0.45 });
      txt(lw + w + 10, by + bh / 2 + 4, fmtM(v) + ' · ' + Math.round(v / total * 100) + '%', { class: 'val' });
      if (hoverIdx === i) showTip(lw + w / 2, by, '<div>' + S.buckets[i] + '</div><div><span class="sw" style="background:' + C.blue + '"></span>Saldo <b>' + fmtM(v) + '</b></div><div>' + nf(v / total * 100, 1) + '% del total</div>');
    });
    svg.onpointermove = (e) => { const r = svg.getBoundingClientRect(); hoverIdx = clamp(Math.floor((e.clientY - r.top - top) / rowH), 0, cartera.length - 1); requestDraw(); };
  }

  function showTip(x, y, html) {
    tip.innerHTML = html; tip.hidden = false;
    const tw = tip.offsetWidth / 2;
    tip.style.left = clamp(x, tw, W - tw) + 'px';
    tip.style.top = Math.max(y, 50) + 'px';
  }
  svg.addEventListener('pointerleave', () => { hoverIdx = null; tip.hidden = true; requestDraw(); });
  svg.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') svg.onpointermove && svg.onpointermove(e); });

  /* ---------- Estadísticas del período (comportamiento de los datos) ---------- */
  function renderStats() {
    let items;
    if (view === 'cartera') {
      const total = cartera.reduce((a, b) => a + b, 0), venc = total - cartera[0];
      items = [['Cartera total', fmtM(total)], ['Vencida', nf(venc / total * 100, 1) + '%'], [S.buckets[3], fmtM(cartera[3])], [S.buckets[0], nf(cartera[0] / total * 100, 1) + '%']];
    } else {
      const pts = serie(), n = pts.length, f = view === 'kpi' ? K[kpiSel].fmt : fmtM;
      const avg = pts.reduce((a, b) => a + b, 0) / n, mx = Math.max(...pts), mn = Math.min(...pts);
      const iMx = n - 1 - pts.lastIndexOf(mx), iMn = n - 1 - pts.lastIndexOf(mn);
      if (view === 'ingresos') items = [['Promedio diario', fmtM(avg)], ['Mejor día', fmtM(mx), dLabel(iMx)], ['Día más bajo', fmtM(mn), dLabel(iMn)], ['Días sobre la meta', pts.filter((v) => v >= META).length + ' de ' + n]];
      else if (view === 'flujo') { const sum = pts.reduce((a, b) => a + b, 0); items = [['Flujo neto del período', (sum >= 0 ? '+' : '') + fmtM(sum)], ['Días positivos', pts.filter((v) => v >= 0).length + ' de ' + n], ['Mejor día', '+' + fmtM(mx), dLabel(iMx)], ['Peor día', fmtM(mn), dLabel(iMn)]]; }
      else { const first = pts[0], cambio = (pts[n - 1] - first) / first * 100; items = [['Hoy', f(pts[n - 1])], ['Promedio', f(avg)], ['Rango', f(mn) + ' – ' + f(mx)], ['Cambio en ' + n + ' días', pct(cambio)]]; }
    }
    stats.innerHTML = items.map((it) => '<div><dt>' + it[0] + '</dt><dd>' + it[1] + (it[2] ? '<span>' + it[2] + '</span>' : '') + '</dd></div>').join('');
  }

  /* ---------- Vista de datos (tabla) ---------- */
  function filas() {
    if (view === 'cartera') {
      const total = cartera.reduce((a, b) => a + b, 0);
      return { cols: ['Tramo', 'Saldo', '% del total'], rows: cartera.map((v, i) => [S.buckets[i], fmtM(v), nf(v / total * 100, 1) + '%']), raw: cartera.map((v, i) => [S.buckets[i], v.toFixed(2), (v / total * 100).toFixed(2)]) };
    }
    const pts = serie(), n = pts.length, rows = [], raw = [];
    let acc = 0; const accs = pts.map((v) => (acc += v));
    for (let i = n - 1; i >= 0; i--) {
      const back = n - 1 - i, fecha = dLabel(back) + (back === 0 ? '<span class="hide-xs"> · en curso</span>' : ''), prev = pts[i - 1];
      if (view === 'ingresos') { rows.push([fecha, fmtM(pts[i]), fmtM(META), pct((pts[i] - META) / META * 100)]); raw.push([dISO(back), pts[i].toFixed(2), META.toFixed(2), ((pts[i] - META) / META * 100).toFixed(2)]); }
      else if (view === 'flujo') { rows.push([fecha, (pts[i] >= 0 ? '+' : '') + fmtM(pts[i]), fmtM(accs[i])]); raw.push([dISO(back), pts[i].toFixed(2), accs[i].toFixed(2)]); }
      else { const k = K[kpiSel]; rows.push([fecha, k.fmt(pts[i]), prev != null ? pct((pts[i] - prev) / prev * 100) : '—']); raw.push([dISO(back), pts[i].toFixed(2), prev != null ? ((pts[i] - prev) / prev * 100).toFixed(2) : '']); }
    }
    const cols = view === 'ingresos' ? ['Fecha', S.ing, 'Meta', 'vs. meta'] : view === 'flujo' ? ['Fecha', 'Flujo neto', 'Acumulado'] : ['Fecha', K[kpiSel].label, 'vs. día anterior'];
    return { cols, rows, raw };
  }
  let lastTableKey = '', flashRow = false;
  function renderTable() {
    const f = filas();
    const key = view + kpiSel + range + f.rows.length;
    const scroll = key === lastTableKey ? table.scrollTop : 0;
    table.innerHTML = '<table><caption class="sr-only">' + titulo() + '</caption><thead><tr>' + f.cols.map((c) => '<th scope="col">' + c + '</th>').join('') + '</tr></thead><tbody>' +
      f.rows.map((r, i) => '<tr' + (i === 0 && view !== 'cartera' ? ' class="hoy' + (flashRow ? ' flash-row' : '') + '"' : '') + '>' + r.map((c, j) => j ? '<td>' + c + '</td>' : '<th scope="row">' + c + '</th>').join('') + '</tr>').join('') + '</tbody></table>';
    table.scrollTop = scroll; lastTableKey = key; flashRow = false;
  }
  csvBtn.addEventListener('click', () => {
    const f = filas();
    const esc = (c) => /[;"\n]/.test(c) ? '"' + String(c).replace(/"/g, '""') + '"' : c;
    const dec = (c) => /^-?\d+\.\d+$/.test(c) ? c.replace('.', ',') : c;
    const csv = '\uFEFF' + [f.cols].concat(f.raw).map((r) => r.map((c) => esc(dec(String(c)))).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'teggnar-demo-' + (view === 'kpi' ? kpiSel : view) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  /* ---------- Controles ---------- */
  function setView(v, kid) {
    view = v; kpiSel = v === 'kpi' ? kid : null; hoverIdx = null; tip.hidden = true;
    root.querySelectorAll('.ld-tabs button').forEach((x) => x.setAttribute('aria-selected', x.dataset.view === view));
    Object.entries(K).forEach(([id, k]) => k.el.setAttribute('aria-pressed', id === kpiSel));
    draw();
  }
  root.querySelectorAll('.ld-tabs button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  root.querySelectorAll('#ld-range button').forEach((b) => b.addEventListener('click', () => {
    range = +b.dataset.range; hoverIdx = null;
    root.querySelectorAll('#ld-range button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    draw();
  }));
  root.querySelectorAll('#ld-mode button').forEach((b) => b.addEventListener('click', () => {
    mode = b.dataset.mode; hoverIdx = null; tip.hidden = true;
    root.querySelectorAll('#ld-mode button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    draw();
  }));
  if ('ResizeObserver' in window) new ResizeObserver(requestDraw).observe(wrap.parentElement); else window.addEventListener('resize', requestDraw);

  /* ---------- Actividad ---------- */
  const feed = $('ld-feed');
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const EV = [
    () => ({ ic: TGI('pago'), bg: '#6FD8CC', t: 'Pago recibido', m: pick(S.clientes), a: rnd(S.n.pay[0], S.n.pay[1]) }),
    () => ({ ic: TGI('pago'), bg: '#6FD8CC', t: 'Pago recibido', m: pick(S.clientes), a: rnd(S.n.pay[0], S.n.pay[1]) }),
    () => ({ ic: TGI('factura'), bg: '#A9BBF5', t: 'Factura emitida #' + Math.floor(rnd(4400, 4999)), m: pick(S.clientes), a: rnd(S.n.fac[0], S.n.fac[1]) }),
    () => ({ ic: TGI('alerta'), bg: '#F2A27B', t: S.alerta + (S === SECT.comercio ? Math.floor(rnd(2100, 2999)) : ''), m: (S === SECT.comercio ? 'Bodega principal · orden sugerida' : pick(S.clientes) + ' · aviso enviado'), a: S.n.alertAmt ? rnd(S.n.alertAmt[0], S.n.alertAmt[1]) : null }),
    () => ({ ic: TGI('listo'), bg: '#C8D2E0', t: 'Informe diario enviado', m: 'Gerencia · automático', a: null }),
    () => ({ ic: TGI('sync'), bg: '#C8D2E0', t: 'Datos sincronizados', m: S.sync, a: null }),
    () => { const usd = Math.round(rnd(S.n.usd[0], S.n.usd[1])) * 1000, trm = window.TRM_HOY; return trm ? { ic: TGI('global'), bg: '#A9BBF5', t: 'Compra importada USD ' + usd.toLocaleString('es-CO'), m: 'Convertida con la TRM real de hoy ($' + trm.toLocaleString('es-CO', { maximumFractionDigits: 0 }) + ')', a: usd * trm / 1e6 } : { ic: TGI('listo'), bg: '#C8D2E0', t: 'Informe diario enviado', m: 'Gerencia · automático', a: null }; }
  ];
  function addEvent(e, animate) {
    const li = document.createElement('li');
    if (animate) li.className = 'new';
    li.innerHTML = '<span class="ic" style="background:' + e.bg + '" aria-hidden="true">' + e.ic + '</span><span><span>' + e.t + (e.a ? ' · <span class="amt">' + fmtM(e.a) + '</span>' : '') + '</span><span class="meta">' + e.m + '</span></span>';
    feed.prepend(li);
    while (feed.children.length > 5) feed.lastElementChild.remove();
    return e;
  }
  for (let i = 0; i < 5; i++) addEvent(pick(EV)(), false);

  /* ---------- Bucle ---------- */
  let last = Date.now(), paused = false, visible = true, tLive = null, tDay = null, tEv = null;
  const N = () => S.n;
  // 1) El dato de HOY se mueve en tiempo real
  function live() {
    const n = N(), i = MAXD - 1;
    ingresos[i] = clamp(ingresos[i] + rnd(-n.vol * 0.22, n.vol * 0.24) + (META - ingresos[i]) * 0.02, n.lo, n.hi);
    flujo[i] = clamp(flujo[i] + rnd(-n.amp * 0.06, n.amp * 0.06), -n.amp * 0.95, n.amp * 0.95);
    cartera.forEach((c, j) => { cartera[j] = clamp(c + rnd(-1, 1) * base0[j] * 0.006, base0[j] * 0.6, base0[j] * 1.4); });
    K.ingresos.v = sumMes();
    K.margen.v = clamp(K.margen.v + rnd(-0.12, 0.13), S.m.lo, S.m.hi);
    K.cartera.v = K.cartera.get();
    K.caja.v = n.k4.money ? clamp(K.caja.v + rnd(-n.amp * 0.08, n.amp * 0.085), n.k4.lo, n.k4.hi) : clamp(K.caja.v + rnd(-0.15, 0.15), n.k4.lo, n.k4.hi);
    Object.entries(K).forEach(([id, k]) => { k.hist[MAXD - 1] = k.v; renderKpi(id, false); });
    last = Date.now();
    draw();
  }
  // 2) Cierra el día: entra un día nuevo
  function closeDay() {
    const n = N();
    ingresos.push(clamp(ingresos[MAXD - 1] * 0.35 + META * 0.65 + rnd(-n.vol, n.vol), n.lo, n.hi)); ingresos.shift();
    flujo.push(rnd(n.flow[0], n.flow[1]) * 0.5); flujo.shift();
    K.ingresos.v = sumMes();
    Object.entries(K).forEach(([id, k]) => { k.hist.push(k.v); k.hist.shift(); renderKpi(id, true); });
    flashRow = mode === 'table';
    draw();
  }
  // 3) Eventos a intervalos aleatorios
  function eventLoop() {
    const e = addEvent(pick(EV)(), !reduce);
    if (e.t === 'Pago recibido' && S.n.k4.money) { K.caja.v = clamp(K.caja.v + e.a, S.n.k4.lo, S.n.k4.hi); K.caja.hist[MAXD - 1] = K.caja.v; renderKpi('caja', true); }
    if (e.t.indexOf('Factura') === 0 || e.t === 'Pago recibido') { const i = MAXD - 1; ingresos[i] = clamp(ingresos[i] + e.a * 0.15, N().lo, N().hi); flujo[i] = clamp(flujo[i] + (e.t === 'Pago recibido' ? e.a * 0.3 : 0), -N().amp * 0.95, N().amp * 0.95); }
    tEv = setTimeout(eventLoop, reduce ? 6000 : rnd(900, 3200));
  }
  function schedule() {
    clearInterval(tLive); clearInterval(tDay); clearTimeout(tEv);
    if (!paused && visible) { tLive = setInterval(live, LIVE_MS); tDay = setInterval(closeDay, DAY_MS); tEv = setTimeout(eventLoop, rnd(600, 1500)); }
  }
  setInterval(() => {
    const s = Math.round((Date.now() - last) / 1000);
    $('ld-ago').textContent = paused ? 'en pausa' : (s < 2 ? 'ahora' : 'hace ' + s + ' s');
  }, 1000);

  const pauseBtn = $('ld-pause');
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', paused);
    pauseBtn.setAttribute('aria-label', paused ? 'Reanudar simulación' : 'Pausar simulación');
    pauseBtn.innerHTML = paused
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5l12 7-12 7z"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
    root.classList.toggle('paused', paused);
    schedule();
  });
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; schedule(); }).observe(root);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; schedule(); });

  /* ---------- Cambio de sector ---------- */
  function applySector(id) {
    S = SECT[id];
    seed();
    root.querySelector('.dash-title').textContent = 'Finanzas en vivo · ' + S.name;
    root.querySelector('.ld-tabs [data-view="ingresos"]').innerHTML = S.ing + '<span class="hide-xs"> vs. meta</span>';
    Object.entries(K).forEach(([kid, k]) => { k.el.querySelector('small').textContent = k.label; renderKpi(kid, false); });
    feed.innerHTML = '';
    for (let i = 0; i < 5; i++) addEvent(pick(EV)(), false);
    root.querySelectorAll('.ld-sector button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.sector === id));
    hoverIdx = null; tip.hidden = true; last = Date.now();
    draw();
  }
  root.querySelectorAll('.ld-sector button').forEach((b) => b.addEventListener('click', () => applySector(b.dataset.sector)));

  draw();
  schedule();
})();
