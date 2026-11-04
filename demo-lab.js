/* TEGGNAR Studio: interactive, browser-local demonstrations. No customer data or network calls. */
(() => {
  'use strict';
  const root = document.getElementById('demo-lab');
  if (!root) return;
  const panel = document.getElementById('lab-panel');
  const status = document.getElementById('lab-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tabs = [...root.querySelectorAll('[data-lab-tab]')];
  const views = {
    analytics: ['Sus datos. Una nueva perspectiva.', 'Explore las cifras, cambie de plataforma y encuentre la historia detrás de cada resultado.'],
    whatsapp: ['Una conversación. Muchas posibilidades.', 'De la primera pregunta a una oportunidad comercial: pruebe un asistente que acompaña al cliente.'],
    data: ['Todo conectado. Todo en su lugar.', 'Vea cómo transformamos fuentes dispersas en información preparada para tomar decisiones.'],
    automation: ['Menos tareas. Más tiempo para crecer.', 'Diseñe un escenario y descubra qué ocurre cuando sus procesos empiezan a trabajar juntos.'],
    crm: ['Cada oportunidad tiene un siguiente paso.', 'Organice su gestión comercial, avance oportunidades y vea cómo cambia su pipeline.']
  };
  const platforms = ['Power BI', 'Looker Studio', 'Qlik Sense', 'Tableau'];
  const platformNotes = ['Indicadores ejecutivos y análisis conectado con el ecosistema Microsoft.', 'Reportes de marketing, campañas y fuentes de Google en una misma vista.', 'Exploración asociativa para descubrir relaciones entre sus datos.', 'Análisis visual para explorar tendencias y contar historias con datos.'];
  const state = {
    view: 'analytics', platform: 0, region: 'Todas', period: '6', month: 5,
    order: ['revenue', 'channels'], chartMode: 'line', chat: [], chatBusy: false,
    pipeline: { volume: 12000, step: -1, running: false },
    automation: { scenario: 'facturas', volume: 160, step: -1, running: false },
    leads: [], motionPaused: reducedMotion.matches
  };
  const stages = ['Nuevo', 'En conversación', 'Propuesta', 'Ganado'];
  const scenarios = {
    facturas: { name: 'Aprobación de facturas', manual: 12, auto: 2, steps: ['Recibir factura', 'Validar campos', 'Solicitar aprobación', 'Registrar y notificar'] },
    reportes: { name: 'Reportes de gestión', manual: 25, auto: 4, steps: ['Recoger fuentes', 'Consolidar cifras', 'Validar indicadores', 'Distribuir reporte'] },
    soporte: { name: 'Solicitudes de soporte', manual: 15, auto: 3, steps: ['Recibir solicitud', 'Clasificar prioridad', 'Asignar responsable', 'Notificar y medir SLA'] }
  };
  let timers = [];
  let dragCard = null;
  let dragLead = null;
  const $ = (selector) => panel.querySelector(selector);
  const fmt = (number) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(number);
  const money = (number) => '$' + fmt(number) + ' M';
  const announce = (text) => { if (status) status.textContent = text; };
  const icon = (name) => {
    const paths = {
      chart: '<path d="M4 19h16M7 15v-5m5 5V5m5 10v-7"/>',
      cloud: '<path d="M7 18a5 5 0 1 1 1-9 6 6 0 0 1 11 3 3 3 0 0 1-1 6Z"/>',
      arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
      spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
      database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      link: '<path d="m10 13 4-4M9 16l-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 0 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/>',
      send: '<path d="m3 3 18 9-18 9 4-9-4-9Zm4 9h14"/>',
      bot: '<rect x="4" y="7" width="16" height="14" rx="5"/><path d="M12 7V3m-3 10h.01M15 13h.01M9 17h6"/>',
      grip: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/>',
      download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>'
    };
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.spark) + '</svg>';
  };
  function later(callback, delay) {
    const timer = window.setTimeout(() => {
      timers = timers.filter((item) => item !== timer);
      callback();
    }, delay);
    timers.push(timer);
  }
  function cancelTimers() {
    timers.forEach(window.clearTimeout);
    timers = [];
    state.chatBusy = false;
    for (const item of [state.pipeline, state.automation]) {
      if (item.running) { item.running = false; item.step = -1; }
    }
  }
  function resetLeads() {
    state.leads = [
      { id: 1, company: 'Norte Studio', initials: 'NS', service: 'Business Intelligence', value: 8.4, stage: 0 },
      { id: 2, company: 'Casa Verde', initials: 'CV', service: 'Asistente de WhatsApp', value: 4.8, stage: 0 },
      { id: 3, company: 'Andina Logística', initials: 'AL', service: 'Arquitectura de datos', value: 16, stage: 1 },
      { id: 4, company: 'Órbita Retail', initials: 'OR', service: 'Automatización', value: 6.2, stage: 2 },
      { id: 5, company: 'Marea Digital', initials: 'MD', service: 'CRM en la nube', value: 9.6, stage: 3 }
    ];
  }
  function resetChat() {
    state.chat = [{ role: 'bot', text: '¡Hola! Soy el asistente demo de TEGGNAR. ¿Exploramos una cotización, una cita o la atención de un asesor?' }];
  }
  resetLeads();
  resetChat();
  const kpi = (label, value, detail, cls = '') => '<div class="lab-kpi ' + cls + '"><small>' + label + '</small><strong>' + value + '</strong><span>' + detail + '</span></div>';
  function analyticsData() {
    const factor = { Todas: 1, Bogotá: 0.46, Medellín: 0.32, Cali: 0.22 }[state.region];
    const offset = state.period === '3' ? 3 : 0;
    const values = [34, 42, 38, 53, 58, 69].slice(offset).map((value) => +(value * factor).toFixed(1));
    const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'].slice(offset);
    const selected = Math.max(0, Math.min(state.month - offset, values.length - 1));
    const total = values.reduce((sum, value) => sum + value, 0);
    return { values, labels, selected, total, offset, factor };
  }
  function cardHead(title, subtitle, id) {
    return '<div class="lab-card-head"><div><span class="lab-overline">' + subtitle + '</span><h4>' + title + '</h4></div><button type="button" class="lab-reorder" data-reorder="' + id + '" aria-label="Cambiar posición de ' + title + '" title="Cambiar posición">' + icon('grip') + '</button></div>';
  }
  function renderAnalytics() {
    const d = analyticsData();
    const max = Math.max(...d.values) * 1.18;
    const points = d.values.map((v, i) => [26 + i * (530 / (d.values.length - 1)), 166 - v / max * 140]);
    const path = points.map((p, i) => (i ? 'L' : 'M') + p.join(',')).join(' ');
    const series = state.chartMode === 'bars'
      ? d.values.map((value, i) => '<rect class="lab-chart-bar" x="' + (40 + i * 520 / d.values.length) + '" y="' + (166 - value / max * 140) + '" width="' + (520 / d.values.length - 20) + '" height="' + (value / max * 140) + '" rx="7" fill="currentColor" opacity="' + (i === d.selected ? 1 : 0.55) + '"/>').join('')
      : '<path d="' + path + ' L556,176 L26,176Z" fill="url(#lab-area)"/><path class="lab-line" d="' + path + '" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>' + points.map((point, i) => '<circle cx="' + point[0] + '" cy="' + point[1] + '" r="' + (i === d.selected ? 6 : 3.5) + '" fill="currentColor"/>').join('');
    const revenue = '<article class="lab-card lab-revenue" data-card="revenue" draggable="true">' + cardHead('El crecimiento se ve.', 'VENTAS · MILLONES COP', 'revenue') +
      '<div class="lab-chart-modes" role="group" aria-label="Tipo de gráfico"><button type="button" class="lab-btn" data-chart-mode="line" aria-pressed="' + (state.chartMode === 'line') + '">Línea</button><button type="button" class="lab-btn" data-chart-mode="bars" aria-pressed="' + (state.chartMode === 'bars') + '">Barras</button></div><div class="lab-chart"><svg viewBox="0 0 580 190" role="img" aria-label="' + (state.chartMode === 'bars' ? 'Barras de ventas: ' : 'Tendencia de ventas: ') + d.labels.map((label, i) => label + ' ' + money(d.values[i])).join(', ') + '"><defs><linearGradient id="lab-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".24"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><g stroke="currentColor" opacity=".10"><path d="M26 30H556M26 75H556M26 120H556M26 166H556"/></g>' + series + '</svg></div>' +
      '<div class="lab-months" role="group" aria-label="Inspeccionar un mes">' + d.labels.map((label, i) => '<button type="button" data-month="' + (i + d.offset) + '" aria-pressed="' + (i === d.selected) + '">' + label + '</button>').join('') + '</div><div class="lab-chart-detail"><span>' + d.labels[d.selected] + ' · ' + state.region + '</span><strong>' + money(d.values[d.selected]) + '</strong><span>en ventas simuladas</span></div></article>';
    const channels = '<article class="lab-card lab-channels" data-card="channels" draggable="true">' + cardHead('¿De dónde vienen?', 'VENTAS POR CANAL', 'channels') +
      '<div class="lab-products">' + [['Directo', 48], ['Digital', 34], ['Aliados', 18]].map(([label, share], index) => '<div class="lab-product"><div><span><b class="lab-channel-dot lab-dot-' + index + '"></b>' + label + '</span><strong>' + money(d.total * share / 100) + '</strong></div><div class="lab-track"><i style="width:' + share + '%;--channel:' + index + '"></i></div><small>' + share + '% del total</small></div>').join('') + '</div><div class="lab-insight">' + icon('spark') + '<p><strong>Una señal para actuar</strong>El canal digital representa el 34% de sus ventas. Explore campañas y conversión en su próximo tablero.</p></div></article>';
    panel.innerHTML = '<div class="lab-toolbar"><div class="lab-platforms" role="group" aria-label="Plataforma de visualización">' + platforms.map((name, i) => '<button type="button" class="lab-platform" data-platform="' + i + '" aria-pressed="' + (state.platform === i) + '"><span class="lab-platform-icon">' + ['▥', '◈', '◉', '✣'][i] + '</span>' + name + '</button>').join('') + '</div><span class="lab-badge">' + icon('cloud') + 'Datos de ejemplo</span></div>' +
      '<div class="lab-workspace-heading"><div><span class="lab-overline">NOVA COMMERCE / RESUMEN EJECUTIVO</span><h3>Una visión completa del negocio.</h3></div><div class="lab-filters"><label>Región<select data-filter="region">' + ['Todas', 'Bogotá', 'Medellín', 'Cali'].map((name) => '<option' + (state.region === name ? ' selected' : '') + '>' + name + '</option>').join('') + '</select></label><label>Período<select data-filter="period"><option value="6"' + (state.period === '6' ? ' selected' : '') + '>Ene – Jun</option><option value="3"' + (state.period === '3' ? ' selected' : '') + '>Abr – Jun</option></select></label></div></div>' +
      '<div class="lab-kpis">' + kpi('Ingresos', money(d.total), 'COP · período seleccionado', 'lab-kpi-featured') + kpi('Órdenes', fmt(Math.round(d.total * 18)), 'Ventas confirmadas · ejemplo') + kpi('Ticket promedio', '$' + fmt(Math.round(d.total * 1000000 / Math.round(d.total * 18))), 'COP por orden') + kpi('Meta de ingresos', fmt(d.total / (state.period === '3' ? 190 : 310) / d.factor * 100) + '%', 'Avance del período') + '</div><div class="lab-grid">' + state.order.map((id) => id === 'revenue' ? revenue : channels).join('') + '</div>' +
      '<div class="lab-bottomline"><p class="lab-note">' + platformNotes[state.platform] + '<br>Vista conceptual de ' + platforms[state.platform] + '; no es un informe nativo. Arrastre las tarjetas o use ⠿ para reordenarlas.</p><button type="button" class="lab-btn" data-export>' + icon('download') + 'Exportar datos</button></div>';
  }
  function renderWhatsApp() {
    panel.innerHTML = '<div class="lab-split"><div class="lab-phone"><div class="lab-chat-header"><span class="lab-bot-avatar">' + icon('bot') + '</span><div><strong>TEGGNAR Assistant</strong><small><i></i>Asistente virtual · demo</small></div><button type="button" class="lab-btn" data-chat-reset aria-label="Reiniciar conversación">↻</button></div><div class="lab-messages" role="log" aria-live="polite" aria-label="Conversación de ejemplo"></div><div class="lab-quick" role="group" aria-label="Respuestas rápidas"><button type="button" data-chat="Quiero cotizar">Cotizar</button><button type="button" data-chat="Quiero agendar una cita">Agendar</button><button type="button" data-chat="Quiero hablar con un asesor">Asesor</button></div><form class="lab-chat-form"><label class="sr-only" for="lab-chat-input">Mensaje para el asistente demo</label><input id="lab-chat-input" maxlength="240" autocomplete="off" placeholder="Pruebe: quiero un dashboard…"><button type="submit" class="lab-btn lab-btn-primary" aria-label="Enviar mensaje">' + icon('send') + '</button></form><p class="lab-note lab-chat-disclaimer">Simulación local. No se envían mensajes a WhatsApp.</p></div><aside class="lab-aside"><span class="lab-overline">CONVERSACIONES QUE AVANZAN</span><h3>Su mejor primera impresión.<br>A cualquier hora.</h3><p>Un asistente diseñado alrededor de sus procesos: responde, orienta y entrega al equipo el contexto que necesita.</p><ol class="lab-benefits"><li><span>01</span><div><strong>Entiende la intención</strong><p>Ventas, soporte o una nueva solicitud.</p></div></li><li><span>02</span><div><strong>Conecta con su negocio</strong><p>Catálogo, agenda y seguimiento comercial.</p></div></li><li><span>03</span><div><strong>Trabaja con su equipo</strong><p>Transferencia a un asesor con contexto.</p></div></li></ol><div class="lab-insight">' + icon('link') + '<p><strong>De WhatsApp a su CRM</strong>Diseñamos la integración según sus canales y herramientas.</p></div></aside></div>';
    paintMessages();
  }
  function paintMessages() {
    const log = $('.lab-messages');
    if (!log) return;
    log.replaceChildren();
    state.chat.forEach((message) => {
      const bubble = document.createElement('div');
      bubble.className = 'lab-message' + (message.role === 'user' ? ' is-user' : '');
      const label = document.createElement('small');
      label.textContent = message.role === 'user' ? 'Usted' : 'Asistente demo';
      const text = document.createElement('p');
      text.textContent = message.text;
      bubble.append(label, text);
      log.appendChild(bubble);
    });
    if (state.chatBusy) {
      const waiting = document.createElement('div');
      waiting.className = 'lab-typing';
      waiting.textContent = 'Preparando respuesta…';
      log.appendChild(waiting);
    }
    panel.querySelectorAll('[data-chat], .lab-chat-form button').forEach((button) => { button.disabled = state.chatBusy; });
    log.scrollTop = log.scrollHeight;
  }
  function sendChat(text) {
    const message = text.trim().slice(0, 240);
    if (!message || state.chatBusy) return;
    state.chat.push({ role: 'user', text: message });
    state.chatBusy = true;
    paintMessages();
    const input = $('#lab-chat-input');
    if (input) input.value = '';
    const normalized = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let reply = 'En esta demo puedo mostrarle una cotización, una cita o el paso a un asesor. Pruebe una respuesta rápida para explorar cada recorrido.';
    if (/cotiz|precio|dashboard|reporte/.test(normalized)) reply = '¡Claro! Para un dashboard conectaríamos sus fuentes, definiríamos indicadores y diseñaríamos la visualización. En un proyecto real recogeríamos el alcance para preparar una propuesta. ¿Quiere agendar un diagnóstico?';
    else if (/agend|cita|diagnostico|si$/.test(normalized)) reply = 'Ejemplo de agenda: martes 10:00 a. m. o jueves 3:00 p. m. En la solución real consultaríamos disponibilidad y confirmaríamos la cita. Aquí no se reserva ningún espacio; use “Quiero esto para mi empresa” para contactarnos.';
    else if (/asesor|humano|persona/.test(normalized)) reply = 'Solicitud de asesor registrada en esta simulación. El equipo recibiría el historial y el motivo de contacto, sin hacerle repetir su consulta. En esta demo no se contacta a ninguna persona.';
    else if (/hola|buen/.test(normalized)) reply = '¡Hola! Bienvenido. Puedo orientarle sobre dashboards, automatización o atención a clientes. ¿Qué proceso le gustaría mejorar?';
    later(() => { state.chatBusy = false; state.chat.push({ role: 'bot', text: reply }); paintMessages(); }, state.motionPaused ? 0 : 650);
  }
  const pipelineNodes = [
    ['database', 'Sus fuentes', 'Excel · ERP · APIs', 'Fuentes recibidas'],
    ['link', 'Integración', 'Extraer · validar · limpiar', 'Datos validados'],
    ['cloud', 'Nube TEGGNAR', 'Modelo · permisos · trazabilidad', 'Modelo preparado'],
    ['chart', 'Decisiones', 'BI · CRM · automatizaciones', 'Vista actualizada']
  ];
  function renderData() {
    const keepRunFocus = document.activeElement?.matches('[data-pipeline-run]');
    const p = state.pipeline;
    const complete = p.step === 4;
    panel.innerHTML = '<div class="lab-workspace-heading"><div><span class="lab-overline">ARQUITECTURA DE DATOS / DEL ORIGEN AL VALOR</span><h3>Conecte las piezas de su negocio.</h3></div><span class="lab-badge">' + icon('cloud') + 'Diseñado para su nube</span></div><div class="lab-pipeline">' + pipelineNodes.map(([symbol, title, sub], i) => '<div class="lab-node ' + (p.step > i ? 'is-done' : p.step === i ? 'is-active' : '') + '"><span class="lab-node-number">0' + (i + 1) + '</span><span class="lab-node-icon">' + icon(p.step > i ? 'check' : symbol) + '</span><strong>' + title + '</strong><small>' + sub + '</small><span class="lab-node-state">' + (p.step > i ? 'Completado' : p.step === i ? 'Procesando…' : 'Listo para conectar') + '</span></div>').join('') + '</div><div class="lab-data-bottom"><div class="lab-card"><div class="lab-card-head"><div><span class="lab-overline">SU PRIMER FLUJO</span><h4>De archivos a información útil.</h4></div>' + icon('spark') + '</div><p>Elija un volumen de ejemplo y observe las etapas de una integración. Sin cargar archivos ni conectar sistemas reales.</p><div class="lab-toolbar"><label class="lab-field">Registros de ejemplo<select data-volume' + (p.running ? ' disabled' : '') + '><option value="12000"' + (p.volume === 12000 ? ' selected' : '') + '>12.000 registros</option><option value="48000"' + (p.volume === 48000 ? ' selected' : '') + '>48.000 registros</option><option value="120000"' + (p.volume === 120000 ? ' selected' : '') + '>120.000 registros</option></select></label><button type="button" class="lab-btn lab-btn-primary" data-pipeline-run aria-disabled="' + p.running + '">' + icon('arrow') + (p.running ? 'Ejecutando…' : complete ? 'Ejecutar de nuevo' : 'Ejecutar flujo') + '</button></div></div><div class="lab-log" role="status"><div><span class="lab-overline">MONITOR DEL FLUJO</span><span class="lab-badge">' + (p.running ? 'En ejecución' : complete ? 'Completado' : 'En espera') + '</span></div>' + (p.step < 0 ? '<p>Su información empieza aquí.<br>Ejecute el flujo para ver el recorrido.</p>' : pipelineNodes.map((item, i) => p.step > i ? '<p><span>✓</span> ' + item[3] + ' <strong>' + fmt(p.volume) + '</strong></p>' : '').join('')) + (complete ? '<p class="lab-log-success">Información lista para consultar. Ejecución simulada.</p>' : '') + '</div></div><p class="lab-note">Arquitectura ilustrativa. El alojamiento, las fuentes, la seguridad y la frecuencia de actualización se definen para cada proyecto.</p>';
    if (keepRunFocus) focusAfter('[data-pipeline-run]');
  }
  function runPipeline() {
    if (state.pipeline.running) return;
    state.pipeline.running = true;
    state.pipeline.step = 0;
    renderData();
    function step() {
      state.pipeline.step++;
      if (state.pipeline.step === 4) {
        state.pipeline.running = false;
        announce('Flujo completado: ' + fmt(state.pipeline.volume) + ' registros de ejemplo preparados.');
      }
      renderData();
      if (state.pipeline.running) later(step, state.motionPaused ? 0 : 650);
    }
    later(step, state.motionPaused ? 0 : 650);
  }
  function renderAutomation() {
    const keepRunFocus = document.activeElement?.matches('[data-automation-run]');
    const a = state.automation;
    const scenario = scenarios[a.scenario];
    const before = a.volume * scenario.manual / 60;
    const after = a.volume * scenario.auto / 60;
    const saving = before - after;
    panel.innerHTML = '<div class="lab-split lab-automation"><div class="lab-aside"><span class="lab-overline">SOLUCIONES TI / AUTOMATIZACIÓN</span><h3>Haga espacio para<br>lo que sí importa.</h3><p>Conecte herramientas, establezca reglas y mantenga a su equipo informado. Pruebe un proceso de ejemplo.</p><label class="lab-field">Proceso<select data-scenario' + (a.running ? ' disabled' : '') + '>' + Object.entries(scenarios).map(([key, value]) => '<option value="' + key + '"' + (a.scenario === key ? ' selected' : '') + '>' + value.name + '</option>').join('') + '</select></label><label class="lab-range" for="lab-volume">Operaciones al mes<strong id="lab-operations">' + fmt(a.volume) + '</strong><input id="lab-volume" data-operations type="range" min="20" max="500" step="20" value="' + a.volume + '"' + (a.running ? ' disabled' : '') + '><span><small>20 operaciones</small><small>500 operaciones</small></span></label><p class="lab-note">Supuesto de este escenario: ' + scenario.manual + ' min manuales frente a ' + scenario.auto + ' min con automatización por operación. Estimación ilustrativa, no ahorro garantizado.</p></div><div class="lab-card lab-automation-card"><div class="lab-card-head"><div><span class="lab-overline">EL IMPACTO EN SU EQUIPO</span><h4>Tiempo que vuelve a su negocio.</h4></div>' + icon('spark') + '</div><div class="lab-saving"><strong id="lab-saving">' + fmt(saving) + '<small> h</small></strong><span>liberadas al mes en este escenario</span></div><div class="lab-comparison"><div><span>Proceso manual</span><b id="lab-before">' + fmt(before) + ' h</b><i style="width:100%"></i></div><div><span>Con automatización</span><b id="lab-after">' + fmt(after) + ' h</b><i style="width:' + scenario.auto / scenario.manual * 100 + '%"></i></div></div><div class="lab-steps">' + scenario.steps.map((step, i) => '<div class="lab-flow-step ' + (a.step > i ? 'is-done' : a.step === i ? 'is-active' : '') + '"><span>' + (a.step > i ? '✓' : '0' + (i + 1)) + '</span><strong>' + step + '</strong><small>' + (a.step > i ? 'Listo' : a.step === i ? 'Procesando' : 'Pendiente') + '</small></div>').join('') + '</div><button type="button" class="lab-btn lab-btn-primary" data-automation-run aria-disabled="' + a.running + '">' + icon('arrow') + (a.running ? 'Proceso en marcha…' : a.step === 4 ? 'Volver a simular' : 'Simular este proceso') + '</button><p class="lab-note">' + (a.step === 4 ? '✓ Simulación completada. Cada paso queda registrado.' : 'Explore el recorrido de principio a fin.') + '</p></div></div>';
    if (keepRunFocus) focusAfter('[data-automation-run]');
  }
  function updateAutomationValues() {
    const a = state.automation, s = scenarios[a.scenario];
    $('#lab-operations').textContent = fmt(a.volume);
    $('#lab-saving').innerHTML = fmt(a.volume * (s.manual - s.auto) / 60) + '<small> h</small>';
    $('#lab-before').textContent = fmt(a.volume * s.manual / 60) + ' h';
    $('#lab-after').textContent = fmt(a.volume * s.auto / 60) + ' h';
  }
  function runAutomation() {
    const a = state.automation;
    if (a.running) return;
    a.running = true; a.step = 0; renderAutomation();
    function step() {
      a.step++;
      if (a.step === 4) { a.running = false; announce('Simulación de ' + scenarios[a.scenario].name + ' completada.'); }
      renderAutomation();
      if (a.running) later(step, state.motionPaused ? 0 : 550);
    }
    later(step, state.motionPaused ? 0 : 550);
  }
  function renderCRM() {
    const total = state.leads.reduce((sum, lead) => sum + lead.value, 0);
    const won = state.leads.filter((lead) => lead.stage === 3);
    const wonTotal = won.reduce((sum, lead) => sum + lead.value, 0);
    panel.innerHTML = '<div class="lab-workspace-heading"><div><span class="lab-overline">CRM / EQUIPO COMERCIAL</span><h3>El siguiente gran cliente está aquí.</h3></div><button type="button" class="lab-btn" data-crm-reset>↻ Reiniciar tablero</button></div><div class="lab-kpis">' + kpi('Valor total', money(total), 'COP · oportunidades de ejemplo') + kpi('Pipeline abierto', money(total - wonTotal), (state.leads.length - won.length) + ' oportunidades activas') + kpi('Negocios ganados', money(wonTotal), won.length + ' oportunidades ganadas', 'lab-kpi-featured') + kpi('Conversión', fmt(won.length / state.leads.length * 100) + '%', 'Ganados sobre el total') + '</div><div class="lab-kanban">' + stages.map((stage, i) => '<div class="lab-column" data-stage="' + i + '"><div class="lab-column-head"><h4><i></i>' + stage + '</h4><span>' + state.leads.filter((lead) => lead.stage === i).length + '</span></div>' + state.leads.filter((lead) => lead.stage === i).map((lead) => '<article class="lab-lead" data-lead="' + lead.id + '" draggable="true"><div class="lab-lead-meta"><span class="lab-avatar">' + lead.initials + '</span><span>EMPRESA DEMO</span></div><h5>' + lead.company + '</h5><p>' + lead.service + '</p><strong>' + money(lead.value) + '</strong><label class="lab-lead-stage">Etapa<select data-lead-stage="' + lead.id + '" aria-label="Etapa de ' + lead.company + '">' + stages.map((name, index) => '<option value="' + index + '"' + (lead.stage === index ? ' selected' : '') + '>' + name + '</option>').join('') + '</select></label>' + (i < 3 ? '<button type="button" class="lab-lead-next" data-lead-next="' + lead.id + '">Avanzar ' + icon('arrow') + '</button>' : '<span class="lab-won">' + icon('check') + 'Negocio ganado</span>') + '</article>').join('') + (state.leads.some((lead) => lead.stage === i) ? '' : '<div class="lab-empty">Arrastre una oportunidad aquí o cambie su etapa en la tarjeta.</div>') + '</div>').join('') + '</div><p class="lab-note">Arrastre oportunidades entre etapas o use el selector de cada tarjeta. Los cambios se conservan durante esta visita y se reinician al recargar. Empresas y valores ficticios.</p>';
  }
  function render() {
    panel.dataset.view = state.view;
    panel.dataset.platform = String(state.platform);
    panel.setAttribute('aria-labelledby', 'lab-tab-' + state.view);
    ({ analytics: renderAnalytics, whatsapp: renderWhatsApp, data: renderData, automation: renderAutomation, crm: renderCRM })[state.view]();
  }
  function activate(view, focusTab = false) {
    if (!views[view]) return;
    cancelTimers();
    state.view = view;
    tabs.forEach((tab) => {
      const active = tab.dataset.labTab === view;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focusTab) tab.focus();
    });
    const title = document.getElementById('lab-title');
    const description = document.getElementById('lab-description');
    if (title) title.textContent = views[view][0];
    if (description) description.textContent = views[view][1];
    render();
    if (!state.motionPaused && panel.animate) panel.animate([{ opacity: 0.4, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 280, easing: 'ease-out' });
    announce('Demo de ' + ({ analytics: 'dashboards', whatsapp: 'WhatsApp', data: 'arquitectura de datos', automation: 'automatización', crm: 'CRM' })[view] + ' seleccionada.');
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab.dataset.labTab));
    tab.addEventListener('keydown', (event) => {
      let target;
      if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') target = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = tabs.length - 1;
      if (target !== undefined) { event.preventDefault(); activate(tabs[target].dataset.labTab, true); }
    });
  });
  function focusAfter(selector) { const element = $(selector); if (element) element.focus({ preventScroll: true }); }
  function moveLead(id, stage, focusSelector) {
    const lead = state.leads.find((item) => item.id === id);
    if (!lead || stage < 0 || stage > 3 || !Number.isInteger(stage)) return;
    lead.stage = stage;
    renderCRM();
    announce(lead.company + ' movida a ' + stages[stage] + '. Indicadores actualizados.');
    focusAfter(focusSelector || '[data-lead-stage="' + id + '"]');
  }
  panel.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.hasAttribute('data-platform')) {
      state.platform = +button.dataset.platform;
      panel.dataset.platform = String(state.platform);
      renderAnalytics(); focusAfter('[data-platform="' + state.platform + '"]');
      announce('Vista conceptual de ' + platforms[state.platform] + ' seleccionada.');
    } else if (button.hasAttribute('data-chart-mode')) {
      state.chartMode = button.dataset.chartMode;
      renderAnalytics(); focusAfter('[data-chart-mode="' + state.chartMode + '"]');
      announce('Gráfico de ' + (state.chartMode === 'line' ? 'línea' : 'barras') + ' seleccionado.');
    } else if (button.hasAttribute('data-month')) {
      state.month = +button.dataset.month; renderAnalytics(); focusAfter('[data-month="' + state.month + '"]');
      const d = analyticsData(); announce(d.labels[d.selected] + ': ' + money(d.values[d.selected]) + ' en ventas simuladas.');
    } else if (button.hasAttribute('data-reorder')) {
      state.order.reverse(); renderAnalytics(); focusAfter('[data-reorder="' + button.dataset.reorder + '"]'); announce('Orden de las tarjetas actualizado.');
    } else if (button.hasAttribute('data-export')) {
      const d = analyticsData();
      const csv = '\uFEFFMes,Region,Ventas_COP\r\n' + d.labels.map((label, i) => [label, state.region, Math.round(d.values[i] * 1000000)].join(',')).join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = 'teggnar-ventas-demo.csv'; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      announce('Datos de ejemplo exportados en CSV.');
    } else if (button.hasAttribute('data-chat')) sendChat(button.dataset.chat);
    else if (button.hasAttribute('data-chat-reset')) { cancelTimers(); resetChat(); paintMessages(); announce('Conversación reiniciada.'); }
    else if (button.hasAttribute('data-pipeline-run')) runPipeline();
    else if (button.hasAttribute('data-automation-run')) runAutomation();
    else if (button.hasAttribute('data-crm-reset')) { resetLeads(); renderCRM(); focusAfter('[data-crm-reset]'); announce('Tablero CRM reiniciado.'); }
    else if (button.hasAttribute('data-lead-next')) { const id = +button.dataset.leadNext; const lead = state.leads.find((item) => item.id === id); if (lead) moveLead(id, lead.stage + 1); }
  });
  panel.addEventListener('change', (event) => {
    const field = event.target;
    if (field.dataset.filter) {
      state[field.dataset.filter] = field.value;
      if (state.period === '3') state.month = Math.max(3, state.month);
      renderAnalytics(); focusAfter('[data-filter="' + field.dataset.filter + '"]'); announce('Datos actualizados: ' + state.region + ', ' + state.period + ' meses.');
    } else if (field.hasAttribute('data-volume')) { state.pipeline.volume = +field.value; state.pipeline.step = -1; renderData(); focusAfter('[data-volume]'); }
    else if (field.hasAttribute('data-scenario')) { state.automation.scenario = field.value; state.automation.step = -1; renderAutomation(); focusAfter('[data-scenario]'); }
    else if (field.hasAttribute('data-lead-stage')) moveLead(+field.dataset.leadStage, +field.value);
  });
  panel.addEventListener('input', (event) => {
    if (event.target.hasAttribute('data-operations')) {
      state.automation.volume = +event.target.value;
      updateAutomationValues();
    }
  });
  panel.addEventListener('submit', (event) => {
    if (event.target.matches('.lab-chat-form')) { event.preventDefault(); sendChat($('#lab-chat-input').value); }
  });
  panel.addEventListener('dragstart', (event) => {
    const lead = event.target.closest('[data-lead]');
    const card = event.target.closest('[data-card]');
    if (event.target.closest('button, input, select')) { event.preventDefault(); return; }
    dragLead = lead ? +lead.dataset.lead : null;
    dragCard = card ? card.dataset.card : null;
    if (event.dataTransfer && (lead || card)) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', lead ? 'lead:' + dragLead : 'card:' + dragCard); }
  });
  panel.addEventListener('dragover', (event) => {
    const target = event.target.closest(dragLead !== null ? '[data-stage]' : '[data-card]');
    if (target && (dragLead !== null || dragCard !== null)) { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'; }
  });
  panel.addEventListener('drop', (event) => {
    const column = event.target.closest('[data-stage]');
    const card = event.target.closest('[data-card]');
    if (dragLead !== null && column) { event.preventDefault(); moveLead(dragLead, +column.dataset.stage); }
    else if (dragCard !== null && card && card.dataset.card !== dragCard) { event.preventDefault(); state.order.reverse(); renderAnalytics(); announce('Orden de tarjetas actualizado.'); }
    dragLead = null; dragCard = null;
  });
  panel.addEventListener('dragend', () => { dragLead = null; dragCard = null; });
  const motionButton = document.getElementById('lab-motion');
  function applyMotion() {
    root.classList.toggle('lab-motion-paused', state.motionPaused);
    if (motionButton) { motionButton.setAttribute('aria-pressed', String(state.motionPaused)); motionButton.textContent = state.motionPaused ? 'Activar animaciones' : 'Pausar animaciones'; motionButton.setAttribute('aria-label', motionButton.textContent + ' decorativas'); }
  }
  if (motionButton) motionButton.addEventListener('click', () => { state.motionPaused = !state.motionPaused; applyMotion(); });
  reducedMotion.addEventListener('change', (event) => { state.motionPaused = event.matches; applyMotion(); });
  const contact = document.getElementById('lab-contact');
  if (contact) contact.addEventListener('click', () => {
    const field = document.querySelector('#form-contacto textarea[name="mensaje"]');
    const names = { analytics: 'dashboards en ' + platforms[state.platform], whatsapp: 'un asistente de WhatsApp', data: 'arquitectura de datos', automation: 'automatización de ' + scenarios[state.automation.scenario].name.toLowerCase(), crm: 'un CRM en la nube' };
    const message = 'Exploré la demo de TEGGNAR y quiero conocer una solución de ' + names[state.view] + ' para mi empresa.';
    if (field && !field.value.includes(message)) field.value = field.value.trim() ? field.value.trim() + '\n\n' + message : message;
  });
  applyMotion();
  activate('analytics');
})();
