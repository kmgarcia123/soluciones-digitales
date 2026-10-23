/* Franja de indicadores reales: TRM en vivo + inflación y tasa BanRep (indicadores.js) */
(function () {
  const box = document.getElementById('real-ind');
  if (!box) return;
  const CFG = window.INDICADORES || {};
  const API = 'https://www.datos.gov.co/resource/32sa-8pi3.json?$select=valor,vigenciadesde&$order=vigenciadesde%20DESC&$limit=320';
  const CACHE_KEY = 'trm-cache-v1', CACHE_MS = 60 * 60 * 1000;
  const nf = (v, d) => v.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });
  const fecha = (iso, opt) => new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CO', opt || { day: 'numeric', month: 'short' }).replace('.', '');
  const $ = (id) => document.getElementById(id);

  /* Inflación y tasa (mensuales, del archivo de configuración) */
  if (CFG.inflacion) {
    $('ri-inf').textContent = nf(CFG.inflacion.valor, 2) + '%';
    $('ri-inf-src').textContent = CFG.inflacion.fuente + ' · ' + CFG.inflacion.periodo;
  }
  if (CFG.tasaBanRep) {
    $('ri-tasa').textContent = nf(CFG.tasaBanRep.valor, 2) + '%';
    let txt = 'Desde ' + CFG.tasaBanRep.desde;
    if (CFG.inflacion) {
      const real = ((1 + CFG.tasaBanRep.valor / 100) / (1 + CFG.inflacion.valor / 100) - 1) * 100;
      $('ri-real').textContent = 'Tasa real ≈ ' + nf(real, 1) + '%';
    }
    $('ri-tasa-src').textContent = txt;
  }

  /* TRM */
  function render(rows, origen) {
    const pts = rows.map((r) => ({ v: parseFloat(r.valor), d: r.vigenciadesde })).filter((p) => !isNaN(p.v));
    if (!pts.length) return fallback();
    const hoy = pts[0];
    const prev = pts.find((p) => p.v !== hoy.v) || pts[1] || hoy;
    const chg = (hoy.v - prev.v) / prev.v * 100;
    $('ri-trm').textContent = '$' + nf(hoy.v, 2);
    const d = $('ri-trm-d');
    d.className = 'ri-delta ' + (chg > 0 ? 'up' : chg < 0 ? 'down' : '');
    d.textContent = pts.length < 2 ? 'Dato de respaldo' : (chg > 0 ? '▲ ' : chg < 0 ? '▼ ' : '') + nf(Math.abs(chg), 2) + '% vs. anterior';
    $('ri-trm-src').textContent = 'Superfinanciera · vigente ' + fecha(hoy.d);
    // tendencia 30 días
    const last30 = pts.slice(0, 30).reverse();
    const mn = Math.min(...last30.map((p) => p.v)), mx = Math.max(...last30.map((p) => p.v)), r = mx - mn || 1;
    const path = last30.map((p, i) => (i ? 'L' : 'M') + (i / (last30.length - 1) * 100).toFixed(1) + ' ' + (27 - (p.v - mn) / r * 24).toFixed(1)).join(' ');
    $('ri-trm-spark').setAttribute('d', path);
    $('ri-trm-spark-wrap').setAttribute('aria-label', 'Tendencia de la TRM en 30 días: mínimo $' + nf(mn, 0) + ', máximo $' + nf(mx, 0));
    // variación del año
    const y = hoy.d.slice(0, 4);
    const enAnio = pts.filter((p) => p.d.slice(0, 4) === y);
    const ini = enAnio[enAnio.length - 1];
    if (ini && ini !== hoy) {
      const ytd = (hoy.v - ini.v) / ini.v * 100;
      $('ri-ytd').textContent = (ytd > 0 ? '+' : '') + nf(ytd, 1) + '%';
      $('ri-ytd-label').textContent = 'Dólar en ' + y;
      $('ri-ytd-src').textContent = 'Desde $' + nf(ini.v, 0) + ' el ' + fecha(ini.d, { day: 'numeric', month: 'short' });
    }
    window.TRM_HOY = hoy.v;
    document.dispatchEvent(new CustomEvent('trm', { detail: hoy.v }));
    $('ri-status').textContent = origen === 'red' ? 'Actualizado ' + new Date().toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : 'Último dato disponible';
    box.classList.add('ready');
  }
  function fallback() {
    const f = CFG.trmRespaldo;
    if (f) render([{ valor: String(f.valor), vigenciadesde: f.fecha + 'T00:00:00.000' }], 'respaldo');
    $('ri-status').textContent = 'Sin conexión con la fuente · último dato conocido';
  }
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { cached = null; }
  if (cached && Date.now() - cached.t < CACHE_MS && Array.isArray(cached.rows)) {
    render(cached.rows, 'red');
  } else {
    const ctrl = 'AbortController' in window ? new AbortController() : null;
    const to = setTimeout(() => ctrl && ctrl.abort(), 8000);
    fetch(API, { signal: ctrl ? ctrl.signal : undefined })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((rows) => {
        clearTimeout(to);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), rows })); } catch (e) {}
        render(rows, 'red');
      })
      .catch(() => {
        clearTimeout(to);
        if (cached && Array.isArray(cached.rows)) { render(cached.rows, 'cache'); $('ri-status').textContent = 'Último dato guardado'; }
        else fallback();
      });
  }
})();
