/* Calculadora de ahorro, simulador de automatización y diagnóstico rápido */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const money = (v) => '$' + Math.round(v).toLocaleString('es-CO');
  const moneyShort = (v) => v >= 1e6
    ? '$' + (v / 1e6).toLocaleString('es-CO', { maximumFractionDigits: v >= 1e8 ? 0 : 1 }) + ' M'
    : money(v);
  const num = (v) => Math.round(v).toLocaleString('es-CO');
  const msg = () => document.querySelector('#form-contacto textarea[name="mensaje"]');
  const goContact = (text) => {
    const m = msg(); if (m) m.value = text;
    $('contacto').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => { const n = document.querySelector('#form-contacto input[name="nombre"]'); n && n.focus({ preventScroll: true }); }, 700);
  };
  function tween(el, to, fmt) {
    const from = parseFloat(el.dataset.v || 0);
    el.dataset.v = to;
    if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 450), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ================= 1. Calculadora ================= */
  if ($('c-personas')) {
    const ins = ['personas', 'horas', 'costo', 'auto'].map((k) => $('c-' + k));
    let last = {};
    function calc() {
      const [p, h, c, a] = ins.map((i) => +i.value);
      $('o-personas').textContent = p;
      $('o-horas').textContent = h + ' h';
      $('o-costo').textContent = money(c);
      $('o-auto').textContent = a + '%';
      ins.forEach((i) => i.style.setProperty('--fill', ((i.value - i.min) / (i.max - i.min) * 100) + '%'));
      const horas = p * h * 48 * a / 100;
      const ahorro = horas * c;
      tween($('r-ahorro'), ahorro, moneyShort);
      tween($('r-horas'), horas, num);
      tween($('r-dias'), horas / 8, num);
      tween($('r-mes'), ahorro / 12, moneyShort);
      $('r-bar').style.width = a + '%';
      last = { p, h, c, a, horas, ahorro };
    }
    ins.forEach((i) => i.addEventListener('input', calc));
    calc();
    $('calc-cta').addEventListener('click', () => goContact(
      'Usé la calculadora: ' + last.p + ' personas, ' + last.h + ' h/semana cada una, hora a ' + money(last.c) +
      ', ' + last.a + '% automatizable. Estimado: ' + num(last.horas) + ' horas y ' + moneyShort(last.ahorro) + ' al año. Quiero validarlo.'));
  }

  /* ================= 2. Simulador de automatización ================= */
  if ($('flow-steps')) {
    const ICON = (d) => '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
    const STEPS = [
      { t: 'Llegan los Excel', d: '8 archivos de cartera por correo', man: 20, auto: 3, icon: ICON('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>') },
      { t: 'Validación', d: 'Formatos, fechas y duplicados', man: 45, auto: 6, icon: ICON('<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>') },
      { t: 'Consolidación', d: 'Todo en una sola tabla en SharePoint', man: 60, auto: 9, icon: ICON('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>') },
      { t: 'Aprobación', d: 'El jefe financiero aprueba en Teams', man: 30, auto: 12, icon: ICON('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>') },
      { t: 'Informe enviado', d: 'PDF a gerencia y alertas a cobranza', man: 35, auto: 8, icon: ICON('<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>') }
    ];
    const list = $('flow-steps');
    STEPS.forEach((s, i) => {
      const li = document.createElement('li');
      li.className = 'fstep';
      li.innerHTML = '<span class="fstep-ic">' + s.icon + '</span><span class="fstep-n">Paso ' + (i + 1) + '</span><b>' + s.t + '</b><span class="fstep-d">' + s.d + '</span>' +
        '<span class="fstep-t"><span class="tm">A mano: ' + s.man + ' min</span><span class="ta">Auto: ' + s.auto + ' s</span></span>';
      list.appendChild(li);
    });
    const totalMan = STEPS.reduce((a, s) => a + s.man, 0);
    const totalAuto = STEPS.reduce((a, s) => a + s.auto, 0);
    const fmtMan = (m) => Math.floor(m / 60) + ' h ' + String(Math.round(m % 60)).padStart(2, '0') + ' min';
    const run = $('flow-run');
    let running = false;
    run.addEventListener('click', async () => {
      if (running) return;
      running = true; run.disabled = true;
      const items = [...list.children];
      items.forEach((li) => li.classList.remove('active', 'done'));
      $('flow-result').textContent = 'Ejecutando flujo…';
      $('flow-result').classList.remove('ok');
      let man = 0, auto = 0;
      const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
      for (let i = 0; i < STEPS.length; i++) {
        const s = STEPS[i], li = items[i];
        li.classList.add('active');
        const frames = reduce ? 1 : 20;
        for (let f = 1; f <= frames; f++) {
          $('flow-manual').textContent = fmtMan(man + s.man * f / frames);
          $('flow-auto').textContent = Math.round(auto + s.auto * f / frames) + ' s';
          await wait(45);
        }
        man += s.man; auto += s.auto;
        li.classList.remove('active'); li.classList.add('done');
      }
      const ahorro = Math.floor((1 - totalAuto / (totalMan * 60)) * 100);
      $('flow-result').innerHTML = '<b>Listo.</b> El mismo informe: <b>' + fmtMan(totalMan) + '</b> a mano vs. <b>' + totalAuto + ' segundos</b> automático. ' + ahorro + '% menos tiempo, cada semana.';
      $('flow-result').classList.add('ok');
      run.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>Repetir';
      running = false; run.disabled = false;
    });
  }

  /* ================= 3. Diagnóstico rápido ================= */
  if ($('quiz-body')) {
    const Q = [
      { q: '¿Dónde está hoy la información de su empresa?', o: ['En archivos de Excel sueltos', 'En Excel compartidos o en la nube', 'En un sistema (ERP o CRM) pero desconectado de lo demás', 'En sistemas conectados entre sí'],
        rec: 'Unificar sus fuentes en un modelo de datos central, para dejar de copiar y pegar entre archivos.' },
      { q: '¿Cuánto tardan en tener listo el informe del mes?', o: ['Más de una semana', 'Entre 3 y 5 días', '1 o 2 días', 'Se actualiza solo'],
        rec: 'Automatizar el informe mensual con un dashboard que se actualice solo.' },
      { q: '¿Cómo se aprueban compras, pagos o permisos?', o: ['En papel o por WhatsApp', 'Por correo electrónico', 'Con un formulario', 'Con un flujo automático y trazable'],
        rec: 'Digitalizar las aprobaciones con flujos en Power Automate y Teams, con registro de quién aprobó y cuándo.' },
      { q: '¿Las cifras de las distintas áreas coinciden entre sí?', o: ['Casi nunca', 'A veces', 'Casi siempre', 'Siempre'],
        rec: 'Definir indicadores únicos y validar la calidad de los datos, para que todos hablen con la misma cifra.' },
      { q: '¿Cuántas horas a la semana se van en tareas repetitivas?', o: ['Más de 20 horas', 'Entre 10 y 20 horas', 'Entre 5 y 10 horas', 'Menos de 5 horas'],
        rec: 'Identificar las 2 o 3 tareas repetitivas que más tiempo consumen y automatizarlas primero.' }
    ];
    const LEVELS = [
      { max: 5, name: 'Inicial', text: 'Hay mucho tiempo invertido en tareas manuales. La buena noticia: es donde una primera automatización se nota más rápido.' },
      { max: 10, name: 'En desarrollo', text: 'Ya tienen bases. Conectar la información y automatizar los procesos clave puede liberar varias horas por semana.' },
      { max: 15, name: 'Avanzado', text: 'Sus datos están bien encaminados. El siguiente paso es sacarles más valor con análisis y alertas automáticas.' }
    ];
    const body = $('quiz-body'), bar = $('quiz-bar');
    let idx = 0, ans = [];
    function render() {
      bar.style.width = (idx / Q.length * 100) + '%';
      bar.parentElement.style.visibility = idx >= Q.length ? 'hidden' : 'visible';
      if (idx >= Q.length) return result();
      const q = Q[idx];
      body.innerHTML = '<p class="quiz-step">Pregunta ' + (idx + 1) + ' de ' + Q.length + '</p><h3 class="quiz-q" tabindex="-1">' + q.q + '</h3>' +
        '<div class="quiz-opts" role="group" aria-label="Opciones">' + q.o.map((o, i) => '<button type="button" class="quiz-opt' + (ans[idx] === i ? ' sel' : '') + '" data-i="' + i + '"><span class="qdot"></span>' + o + '</button>').join('') + '</div>' +
        (idx > 0 ? '<button type="button" class="quiz-back">‹ Anterior</button>' : '');
      body.classList.remove('swap'); void body.offsetWidth; body.classList.add('swap');
      body.querySelectorAll('.quiz-opt').forEach((b) => b.addEventListener('click', () => {
        ans[idx] = +b.dataset.i;
        b.classList.add('sel');
        setTimeout(() => { idx++; render(); body.querySelector('.quiz-q, .quiz-level')?.focus({ preventScroll: true }); }, reduce ? 0 : 220);
      }));
      const back = body.querySelector('.quiz-back');
      if (back) back.addEventListener('click', () => { idx--; render(); });
    }
    function result() {
      const score = ans.reduce((a, b) => a + b, 0);
      const lvl = LEVELS.find((l) => score <= l.max);
      const pct = Math.round(score / 15 * 100);
      const recs = ans.map((a, i) => ({ a, i })).sort((x, y) => x.a - y.a).slice(0, 3).map((x) => Q[x.i].rec);
      body.innerHTML =
        '<div class="quiz-result">' +
          '<div class="gauge" style="--p:' + pct + '"><div><b>' + score + '</b><span>de 15</span></div></div>' +
          '<div class="quiz-res-text"><p class="quiz-step">Su nivel de madurez de datos</p><h3 class="quiz-level" tabindex="-1">' + lvl.name + '</h3><p class="quiz-lvl-text">' + lvl.text + '</p></div>' +
        '</div>' +
        '<p class="quiz-recs-title">Le recomendamos empezar por</p><ol class="quiz-recs">' + recs.map((r) => '<li>' + r + '</li>').join('') + '</ol>' +
        '<div class="quiz-actions"><button type="button" class="btn btn-primary btn-lg" id="quiz-cta">Recibir mi diagnóstico completo</button><button type="button" class="btn btn-soft btn-lg" id="quiz-again">Volver a empezar</button></div>' +
        '<p class="quiz-note">Resultado orientativo. El diagnóstico completo revisa sus datos y procesos reales.</p>';
      body.classList.remove('swap'); void body.offsetWidth; body.classList.add('swap');
      $('quiz-cta').addEventListener('click', () => goContact(
        'Hice el diagnóstico rápido: nivel ' + lvl.name + ' (' + score + '/15). Respuestas: ' +
        Q.map((q, i) => (i + 1) + ') ' + q.o[ans[i]]).join(' · ') + '. Quiero el diagnóstico completo.'));
      $('quiz-again').addEventListener('click', () => { idx = 0; ans = []; render(); });
    }
    render();
  }
})();
