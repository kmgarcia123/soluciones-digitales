/* Tablero financiero en vivo (simulación con datos ficticios) */
(function () {
  const root = document.getElementById('live-dash');
  if (!root) return;

  const C = { pos: '#1BA597', neg: '#D9703F', meta: '#8FA0B8', blue: '#6F8CF0', spark: '#20B7A9' };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TICK = reduce ? 4000 : 1800;
  const NS = 'http://www.w3.org/2000/svg';
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmtM = (v) => '$' + v.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' M';
  const fmtP = (v) => v.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';

  /* ---------- Sectores ---------- */
  const SECT = {
    constructora: { name: 'Constructora demo', ing: 'Ingresos', ingD: 'Ingresos diarios', m: { label: 'Margen bruto', v: 33.4, base: 31.8, lo: 29, hi: 38 }, cart: 'Cartera vencida', buckets: ['Al día', '1–30 días', '31–60 días', '+60 días'],
      clientes: ['Constructora Andina', 'Inmobiliaria Los Cerros', 'Grupo Ladera', 'Urbanizadora Sabana', 'Proyecto Torre Norte', 'Conjunto Mirador'],
      alerta: 'Alerta: cuota vence hoy', sync: 'ERP + Excel de obra' },
    comercio: { name: 'Distribuidora demo', ing: 'Ventas', ingD: 'Ventas diarias', m: { label: 'Margen bruto', v: 22.1, base: 20.6, lo: 18, hi: 26 }, cart: 'Cartera vencida', buckets: ['Al día', '1–30 días', '31–60 días', '+60 días'],
      clientes: ['Tienda La 80', 'Supermercado El Prado', 'Droguería Central', 'Ferretería del Norte', 'Minimercado Suba', 'Almacén La Esquina'],
      alerta: 'Alerta: inventario bajo · Ref. ' , sync: 'POS + inventario de bodega' },
    salud: { name: 'IPS demo', ing: 'Facturación', ingD: 'Facturación diaria', m: { label: 'Ocupación de agenda', v: 84.2, base: 80.5, lo: 74, hi: 93 }, cart: 'Cuentas por cobrar EPS', buckets: ['Al día', '1–60 días', '61–90 días', '+90 días'],
      clientes: ['EPS Ejemplo Uno', 'EPS Ejemplo Dos', 'Póliza Ejemplo', 'Medicina prepagada demo', 'Particulares', 'Convenio empresarial demo'],
      alerta: 'Alerta: glosa por responder', sync: 'Agenda + facturación' }
  };
  let S = SECT.constructora;

  /* ---------- Estado ---------- */
  const META = 48;                      // meta diaria de ingresos (M)
  let day = 30;
  const ingresos = [];                  // {d, v}
  for (let i = 1; i <= 30; i++) ingresos.push({ d: i, v: clamp(META + rnd(-14, 14) + i * 0.25, 26, 72) });
  const flujo = [];
  for (let i = 17; i <= 30; i++) flujo.push({ d: i, v: rnd(-22, 34) });
  const cartera = [
    { k: S.buckets[0], v: 612 }, { k: S.buckets[1], v: 184 }, { k: S.buckets[2], v: 96 }, { k: S.buckets[3], v: 58 }
  ];
  const K = {
    ingresos: { label: S.ing + ' del mes', v: ingresos.slice(-22).reduce((a, b) => a + b.v, 0), base: 0, fmt: fmtM, goodUp: true, hist: [] },
    margen:   { label: S.m.label, v: S.m.v, base: S.m.base, fmt: fmtP, goodUp: true, hist: [] },
    cartera:  { label: 'Cartera vencida', v: 338, base: 362, fmt: fmtM, goodUp: false, hist: [] },
    caja:     { label: 'Caja disponible', v: 1264, base: 1180, fmt: fmtM, goodUp: true, hist: [] }
  };
  K.ingresos.base = K.ingresos.v * 0.93;
  Object.values(K).forEach((k) => { for (let i = 0; i < 20; i++) k.hist.push(k.v * (1 + rnd(-0.03, 0.03))); k.shown = k.v; });

  /* ---------- KPIs ---------- */
  const kpiWrap = document.getElementById('ld-kpis');
  Object.entries(K).forEach(([id, k]) => {
    const el = document.createElement('div');
    el.className = 'kpi'; el.dataset.k = id;
    el.innerHTML = '<small>' + k.label + '</small><b>' + k.fmt(k.v) + '</b><span class="delta"><i></i><span></span></span>' +
      '<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path fill="none" stroke="' + C.spark + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
    kpiWrap.appendChild(el);
    k.el = el;
  });
  function renderKpi(id, animate) {
    const k = K[id], el = k.el;
    const from = k.shown, to = k.v, b = el.querySelector('b');
    if (animate && !reduce) {
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - p, 3);
        b.textContent = k.fmt(from + (to - from) * e);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    } else b.textContent = k.fmt(to);
    k.shown = to;
    const chg = (k.v - k.base) / k.base * 100;
    const good = k.goodUp ? chg >= 0 : chg <= 0;
    const d = el.querySelector('.delta');
    d.className = 'delta ' + (good ? 'good' : 'bad');
    d.querySelector('i').textContent = (chg >= 0 ? '▲ ' : '▼ ') + Math.abs(chg).toFixed(1) + '%';
    d.querySelector('span').textContent = 'vs. mes anterior';
    const h = k.hist, mn = Math.min(...h), mx = Math.max(...h), r = mx - mn || 1;
    el.querySelector('.spark path').setAttribute('d', h.map((v, i) => (i ? 'L' : 'M') + (i / (h.length - 1) * 100).toFixed(1) + ' ' + (27 - (v - mn) / r * 24).toFixed(1)).join(' '));
  }
  Object.keys(K).forEach((id) => renderKpi(id, false));

  /* ---------- Gráfico ---------- */
  const svg = document.getElementById('ld-chart');
  const wrap = document.getElementById('ld-wrap');
  const tip = document.getElementById('ld-tip');
  const legend = document.getElementById('ld-legend');
  let view = 'ingresos', W = 600, H = 240, hoverIdx = null;
  const M = { l: 40, r: 22, t: 14, b: 24 };
  const T0 = Date.now() - 30 * 864e5;
  const dLabel = (d) => new Date(T0 + d * 864e5).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '');
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const a in attrs) n.setAttribute(a, attrs[a]); (parent || svg).appendChild(n); return n; };
  const txt = (x, y, s, attrs) => { const n = el('text', Object.assign({ x, y }, attrs || {})); n.textContent = s; return n; };

  const LEG = {
    get ingresos() { return '<span><i style="background:' + C.pos + '"></i>' + S.ingD + '</span><span><i class="ld-dash"></i>Meta</span>'; },
    flujo: '<span><i class="sq" style="background:' + C.pos + '"></i>Entra más</span><span><i class="sq" style="background:' + C.neg + '"></i>Sale más</span>',
    cartera: ''
  };
  const LABEL = { ingresos: 'Gráfico de ingresos diarios frente a la meta', flujo: 'Gráfico de flujo de caja neto por día', cartera: 'Gráfico de cartera por edades' };

  function draw() {
    W = wrap.clientWidth; H = wrap.clientHeight;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = '';
    legend.innerHTML = LEG[view];
    svg.setAttribute('aria-label', LABEL[view]);
    if (view === 'ingresos') drawLine(); else if (view === 'flujo') drawFlow(); else drawCartera();
  }

  function yAxis(min, max, ticks, fmt) {
    const pw = H - M.t - M.b;
    for (let i = 0; i <= ticks; i++) {
      const v = min + (max - min) * i / ticks, y = M.t + pw - (v - min) / (max - min) * pw;
      el('line', { x1: M.l, x2: W - M.r, y1: y, y2: y, class: v === 0 && min < 0 ? 'base' : 'grid' });
      txt(M.l - 8, y + 4, fmt(v), { 'text-anchor': 'end' });
    }
  }

  function drawLine() {
    const pts = ingresos.slice(-20), n = pts.length;
    const min = 20, max = 80, pw = W - M.l - M.r, ph = H - M.t - M.b;
    const X = (i) => M.l + i / (n - 1) * pw, Y = (v) => M.t + ph - (v - min) / (max - min) * ph;
    yAxis(min, max, 3, (v) => '$' + Math.round(v));
    pts.forEach((p, i) => { if ((n - 1 - i) % (W < 520 ? 7 : 4) === 0) txt(X(i), H - 6, dLabel(p.d), { 'text-anchor': i === n - 1 ? 'end' : 'middle' }); });
    el('line', { x1: M.l, x2: W - M.r, y1: Y(META), y2: Y(META), stroke: C.meta, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
    txt(M.l + 6, Y(META) - 6, 'Meta $' + META + ' M');
    const d = pts.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1)).join(' ');
    const grad = el('linearGradient', { id: 'ldg', x1: 0, x2: 0, y1: 0, y2: 1 }, el('defs', {}));
    el('stop', { offset: '0%', 'stop-color': C.pos, 'stop-opacity': 0.28 }, grad);
    el('stop', { offset: '100%', 'stop-color': C.pos, 'stop-opacity': 0 }, grad);
    el('path', { d: d + ' L' + X(n - 1) + ' ' + (M.t + ph) + ' L' + X(0) + ' ' + (M.t + ph) + 'Z', fill: 'url(#ldg)' });
    el('path', { d, fill: 'none', stroke: C.pos, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    const last = pts[n - 1];
    el('circle', { cx: X(n - 1), cy: Y(last.v), r: 9, fill: C.pos, opacity: 0.25 }).classList.add('pulse-pt');
    el('circle', { cx: X(n - 1), cy: Y(last.v), r: 4.5, fill: C.pos, stroke: '#22324A', 'stroke-width': 2 });
    txt(X(n - 1) - 10, Y(last.v) - 12, fmtM(last.v), { class: 'val', 'text-anchor': 'end' });
    if (hoverIdx != null && hoverIdx < n) {
      const p = pts[hoverIdx], x = X(hoverIdx);
      el('line', { x1: x, x2: x, y1: M.t, y2: M.t + ph, stroke: 'rgba(255,255,255,.35)', 'stroke-width': 1 });
      el('circle', { cx: x, cy: Y(p.v), r: 5, fill: C.pos, stroke: '#22324A', 'stroke-width': 2 });
      showTip(x, Y(p.v), '<div>' + dLabel(p.d) + '</div><div><span class="sw" style="background:' + C.pos + '"></span>Ingresos <b>' + fmtM(p.v) + '</b></div><div><span class="sw" style="background:' + C.meta + '"></span>Meta <b>' + fmtM(META) + '</b></div>');
    }
    svg.onpointermove = (e) => { const r = svg.getBoundingClientRect(); hoverIdx = clamp(Math.round((e.clientX - r.left - M.l) / pw * (n - 1)), 0, n - 1); draw(); };
  }

  function drawFlow() {
    const pts = flujo.slice(-14), n = pts.length, min = -40, max = 40;
    const pw = W - M.l - M.r, ph = H - M.t - M.b, bw = pw / n, Y = (v) => M.t + ph - (v - min) / (max - min) * ph;
    yAxis(min, max, 4, (v) => (v > 0 ? '+' : '') + Math.round(v));
    pts.forEach((p, i) => {
      const x = M.l + i * bw + 1, w = Math.max(4, bw - 2), y0 = Y(0), y1 = Y(p.v);
      const top = Math.min(y0, y1), h = Math.max(2, Math.abs(y1 - y0)), r = Math.min(4, w / 2, h);
      const up = p.v >= 0;
      const dpath = up
        ? 'M' + x + ' ' + (top + h) + 'V' + (top + r) + 'Q' + x + ' ' + top + ' ' + (x + r) + ' ' + top + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + top + ' ' + (x + w) + ' ' + (top + r) + 'V' + (top + h) + 'Z'
        : 'M' + x + ' ' + top + 'V' + (top + h - r) + 'Q' + x + ' ' + (top + h) + ' ' + (x + r) + ' ' + (top + h) + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + (top + h) + ' ' + (x + w) + ' ' + (top + h - r) + 'V' + top + 'Z';
      const bar = el('path', { d: dpath, fill: up ? C.pos : C.neg, opacity: hoverIdx == null || hoverIdx === i ? 1 : 0.45 });
      if ((n - 1 - i) % (W < 520 ? 5 : 3) === 0) txt(x + w / 2, H - 6, dLabel(p.d), { 'text-anchor': 'middle' });
      if (i === n - 1) txt(x + w / 2, up ? top - 6 : top + h + 14, (up ? '+' : '') + p.v.toFixed(1), { class: 'val', 'text-anchor': 'middle' });
      if (hoverIdx === i) showTip(x + w / 2, top, '<div>' + dLabel(p.d) + '</div><div><span class="sw" style="background:' + (up ? C.pos : C.neg) + '"></span>Flujo neto <b>' + (up ? '+' : '−') + fmtM(Math.abs(p.v)) + '</b></div>');
      bar.style.transition = 'opacity .2s';
    });
    el('line', { x1: M.l, x2: W - M.r, y1: Y(0), y2: Y(0), class: 'base' });
    svg.onpointermove = (e) => { const r = svg.getBoundingClientRect(); hoverIdx = clamp(Math.floor((e.clientX - r.left - M.l) / bw), 0, n - 1); draw(); };
  }

  function drawCartera() {
    const total = cartera.reduce((a, b) => a + b.v, 0), max = 700;
    const lw = 92, rw = 120, top = 10, rowH = (H - top - 6) / cartera.length, pw = W - lw - rw;
    cartera.forEach((c, i) => {
      const y = top + i * rowH, bh = Math.min(26, rowH * 0.55), by = y + (rowH - bh) / 2, w = Math.max(4, c.v / max * pw), r = Math.min(4, bh / 2);
      txt(lw - 10, by + bh / 2 + 4, c.k, { 'text-anchor': 'end' });
      el('rect', { x: lw, y: by, width: pw, height: bh, rx: r, fill: 'rgba(255,255,255,.05)' });
      const bar = el('path', { d: 'M' + lw + ' ' + by + 'H' + (lw + w - r) + 'Q' + (lw + w) + ' ' + by + ' ' + (lw + w) + ' ' + (by + r) + 'V' + (by + bh - r) + 'Q' + (lw + w) + ' ' + (by + bh) + ' ' + (lw + w - r) + ' ' + (by + bh) + 'H' + lw + 'Z', fill: C.blue, opacity: hoverIdx == null || hoverIdx === i ? 1 : 0.45 });
      bar.style.transition = 'opacity .2s';
      txt(lw + w + 10, by + bh / 2 + 4, fmtM(c.v) + ' · ' + Math.round(c.v / total * 100) + '%', { class: 'val' });
      if (hoverIdx === i) showTip(lw + w / 2, by, '<div>' + c.k + '</div><div><span class="sw" style="background:' + C.blue + '"></span>Saldo <b>' + fmtM(c.v) + '</b></div><div>' + (c.v / total * 100).toFixed(1) + '% del total</div>');
    });
    svg.onpointermove = (e) => { const r = svg.getBoundingClientRect(); hoverIdx = clamp(Math.floor((e.clientY - r.top - top) / rowH), 0, cartera.length - 1); draw(); };
  }

  function showTip(x, y, html) {
    tip.innerHTML = html; tip.hidden = false;
    const tw = tip.offsetWidth / 2;
    tip.style.left = clamp(x, tw, W - tw) + 'px';
    tip.style.top = Math.max(y, 50) + 'px';
  }
  svg.addEventListener('pointerleave', () => { hoverIdx = null; tip.hidden = true; draw(); });
  svg.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') svg.onpointermove && svg.onpointermove(e); });

  root.querySelectorAll('.ld-tabs button').forEach((b) => b.addEventListener('click', () => {
    view = b.dataset.view; hoverIdx = null; tip.hidden = true;
    root.querySelectorAll('.ld-tabs button').forEach((x) => x.setAttribute('aria-selected', x === b));
    draw();
  }));
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(wrap); else window.addEventListener('resize', draw);

  /* ---------- Actividad ---------- */
  const feed = document.getElementById('ld-feed');
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const EV = [
    () => ({ ic: '$', bg: '#6FD8CC', t: 'Pago recibido', m: pick(S.clientes), a: rnd(4, 38) }),
    () => ({ ic: '$', bg: '#6FD8CC', t: 'Pago recibido', m: pick(S.clientes), a: rnd(4, 38) }),
    () => ({ ic: 'F', bg: '#A9BBF5', t: 'Factura emitida #' + Math.floor(rnd(4400, 4999)), m: pick(S.clientes), a: rnd(6, 52) }),
    () => ({ ic: '!', bg: '#F2A27B', t: S.alerta + (S === SECT.comercio ? Math.floor(rnd(2100, 2999)) : ''), m: pick(S.clientes) + ' · aviso enviado', a: rnd(2, 15) }),
    () => ({ ic: '✓', bg: '#C8D2E0', t: 'Informe diario enviado', m: 'Gerencia · automático', a: null }),
    () => ({ ic: '↻', bg: '#C8D2E0', t: 'Datos sincronizados', m: S.sync, a: null })
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
  let last = Date.now(), n = 0, paused = false, visible = true, timer = null;
  function tick() {
    n++; last = Date.now();
    day++;
    const prev = ingresos[ingresos.length - 1].v;
    const v = clamp(prev + rnd(-9, 9.5) + (META - prev) * 0.15, 24, 76);
    ingresos.push({ d: day, v }); if (ingresos.length > 40) ingresos.shift();
    flujo.push({ d: day, v: clamp(rnd(-24, 36), -38, 38) }); if (flujo.length > 30) flujo.shift();
    cartera.forEach((c, i) => { c.v = clamp(c.v + rnd(-14, 14) * (i ? 0.6 : 1), 20, 690); });

    K.ingresos.v += v; K.margen.v = clamp(K.margen.v + rnd(-0.5, 0.55), S.m.lo, S.m.hi);
    K.cartera.v = cartera.slice(1).reduce((a, b) => a + b.v, 0);
    K.caja.v = clamp(K.caja.v + flujo[flujo.length - 1].v, 900, 1600);
    if (day % 30 === 0) { K.ingresos.base = K.ingresos.v; K.ingresos.v = v; }
    Object.entries(K).forEach(([id, k]) => { k.hist.push(k.v); if (k.hist.length > 20) k.hist.shift(); renderKpi(id, true); });

    if (n % 2 === 0 || reduce) {
      const e = addEvent(pick(EV)(), !reduce);
      if (e.t === 'Pago recibido') { K.caja.v += e.a; }
    }
    draw();
  }
  function schedule() {
    clearInterval(timer);
    if (!paused && visible) timer = setInterval(tick, TICK);
  }
  setInterval(() => {
    const s = Math.round((Date.now() - last) / 1000);
    document.getElementById('ld-ago').textContent = paused ? 'en pausa' : (s < 2 ? 'ahora' : 'hace ' + s + ' s');
  }, 1000);

  const pauseBtn = document.getElementById('ld-pause');
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
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; schedule(); }).observe(root);
  }
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; schedule(); });

  /* ---------- Cambio de sector ---------- */
  function applySector(id) {
    S = SECT[id];
    root.querySelector('.dash-title').textContent = 'Finanzas en vivo · ' + S.name;
    root.querySelector('.ld-tabs [data-view="ingresos"]').textContent = S.ing + ' vs. meta';
    K.ingresos.label = S.ing + ' del mes';
    K.margen.label = S.m.label; K.margen.v = S.m.v; K.margen.base = S.m.base; K.margen.shown = S.m.v;
    K.margen.hist = []; for (let i = 0; i < 20; i++) K.margen.hist.push(S.m.v * (1 + rnd(-0.02, 0.02)));
    K.cartera.label = S.cart;
    cartera.forEach((c, i) => { c.k = S.buckets[i]; });
    Object.entries(K).forEach(([kid, k]) => { k.el.querySelector('small').textContent = k.label; renderKpi(kid, false); });
    feed.innerHTML = '';
    for (let i = 0; i < 5; i++) addEvent(pick(EV)(), false);
    root.querySelectorAll('.ld-sector button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.sector === id));
    hoverIdx = null; tip.hidden = true;
    draw();
  }
  root.querySelectorAll('.ld-sector button').forEach((b) => b.addEventListener('click', () => applySector(b.dataset.sector)));
  K.cartera.label = S.cart; K.cartera.el.querySelector('small').textContent = S.cart;

  draw();
  schedule();
})();
