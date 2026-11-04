/* Local-only operations playground. No uploads, APIs, messages or customer data. */
(() => {
  'use strict';
  const demos = window.TeggnarDemos = window.TeggnarDemos || {};
  const stages = ['Nuevo', 'Calificado', 'Propuesta', 'Ganado'];
  const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const format = (value) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(value);
  const cash = (value) => '$' + format(value) + ' M';
  const recipes = {
    excel: {
      name: 'Excel conectado', chip: 'XLSX → INFORMACIÓN', symbol: '▦', color: 'green',
      title: 'Tres archivos. Una sola verdad.',
      description: 'Unifique ventas de varias sedes, normalice las columnas y entregue un consolidado listo para analizar.',
      files: ['Bogotá.xlsx', 'Medellín.xlsx', 'Cali.xlsx'],
      steps: ['Leer archivos', 'Unificar columnas', 'Validar registros', 'Crear consolidado'],
      notes: ['Se reciben 3 hojas de ejemplo.', 'Fecha, sede e importe usan el mismo formato.', 'Se detecta y elimina 1 fila duplicada.', 'El consolidado tiene 6 registros válidos.'],
      result: 'ventas_consolidadas.csv', tools: 'Python · pandas · Excel',
      caption: 'La consolidación de estos registros de ejemplo ocurre aquí, en su navegador.'
    },
    pdf: {
      name: 'Documentos inteligentes', chip: 'PDF → DATOS', symbol: '▤', color: 'rose',
      title: 'De un documento a una decisión.',
      description: 'Extraiga los campos que importan, marque las dudas y dé al equipo el control antes de registrar una factura.',
      files: ['Factura_demo.pdf'],
      steps: ['Recibir documento', 'Extraer campos', 'Revisión humana', 'Registrar factura'],
      notes: ['Factura ficticia recibida en la bandeja.', 'Proveedor, número y total preparados.', 'Confirme el número de factura antes de continuar.', 'Documento validado y registro de ejemplo creado.'],
      result: 'factura_validada.json', tools: 'Python · extracción documental · aprobación',
      caption: 'Extracción ilustrativa de campos precargados. Esta demo no ejecuta OCR ni lee archivos reales.'
    },
    streamlit: {
      name: 'Apps a la medida', chip: 'IDEA → APLICACIÓN', symbol: '◈', color: 'violet',
      title: 'Su proceso, convertido en una app.',
      description: 'Transforme una hoja de pedidos en una herramienta interna: filtros, indicadores y una vista que su equipo puede usar.',
      files: ['Pedidos.csv', 'Reglas del negocio'],
      steps: ['Definir entradas', 'Preparar lógica', 'Construir interfaz', 'Probar aplicación'],
      notes: ['Se cargan 6 pedidos y sus estados.', 'Se calculan importes y prioridades.', 'Se preparan filtros y métricas operativas.', 'La vista interactiva de pedidos está disponible.'],
      result: 'app_pedidos · vista previa', tools: 'Python · Streamlit · aplicaciones internas',
      caption: 'Prototipo funcional en el navegador, inspirado en una app Streamlit. No ejecuta un servidor Python.'
    },
    databricks: {
      name: 'Datos a escala', chip: 'FUENTES → LAKEHOUSE', symbol: '◇', color: 'blue',
      title: 'Datos confiables, capa por capa.',
      description: 'Explore un flujo de ingeniería de datos: ingesta, limpieza y un modelo de negocio preparado para sus dashboards.',
      files: ['ERP · pedidos', 'CRM · clientes', 'API · productos'],
      steps: ['Ingesta Bronze', 'Limpiar Silver', 'Modelar Gold', 'Servir al negocio'],
      notes: ['12.000 registros de ejemplo ingresan a Bronze.', 'Se separan 24 registros para revisión.', '11.976 registros válidos alimentan el modelo.', 'Ventas, clientes y productos quedan relacionados.'],
      result: 'gold.ventas_diarias', tools: 'Databricks · Python · SQL · Delta Lake',
      caption: 'Recorrido ilustrativo. No se conecta a un workspace Databricks ni procesa datos en la nube.'
    }
  };
  const sourceRows = [
    { id: 'V-101', city: 'Bogotá', product: 'Licencias', value: 2400000 },
    { id: 'V-102', city: 'Bogotá', product: 'Consultoría', value: 1800000 },
    { id: 'V-103', city: 'Medellín', product: 'Licencias', value: 3200000 },
    { id: 'V-104', city: 'Medellín', product: 'Soporte', value: 900000 },
    { id: 'V-104', city: 'Medellín', product: 'Soporte', value: 900000 },
    { id: 'V-105', city: 'Cali', product: 'Consultoría', value: 2100000 },
    { id: 'V-106', city: 'Cali', product: 'Soporte', value: 600000 }
  ];
  const consolidatedRows = [...new Map(sourceRows.map((row) => [row.id, row])).values()];
  const orders = [
    { id: 'P-481', city: 'Bogotá', state: 'Pendiente', value: 2.4 },
    { id: 'P-482', city: 'Medellín', state: 'Entregado', value: 3.2 },
    { id: 'P-483', city: 'Cali', state: 'Pendiente', value: 2.1 },
    { id: 'P-484', city: 'Bogotá', state: 'Entregado', value: 1.8 },
    { id: 'P-485', city: 'Medellín', state: 'En proceso', value: 0.9 },
    { id: 'P-486', city: 'Cali', state: 'En proceso', value: 0.6 }
  ];
  const opState = { recipe: 'excel', step: -1, running: false, paused: false, approved: false, appFilter: 'Todos' };

  function exportLocal(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  demos.automation = {
    mount(host, ctx) {
      let timer = 0;
      let destroyed = false;
      let paused = Boolean(ctx.isPaused());
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      const canPlay = () => !destroyed && !paused && !opState.paused && !reduced.matches && !document.hidden;
      const stopTimer = () => { window.clearTimeout(timer); timer = 0; };
      const isReview = () => opState.recipe === 'pdf' && opState.step === 2 && !opState.approved;
      const announce = (text) => ctx.announce(text);
      const resultTable = (rows, headings, map) => `<div class="op-table-wrap"><table><thead><tr>${headings.map((heading) => `<th scope="col">${heading}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${map(row).map((value) => `<td>${value}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

      function output() {
        const { recipe, step } = opState;
        if (recipe === 'excel') {
          const rows = step >= 2 ? consolidatedRows : sourceRows.slice(0, 4);
          return `<div class="op-result-head"><div><span class="op-eyebrow">${step >= 2 ? 'CONSOLIDADO · SIN DUPLICADOS' : 'VISTA DE LOS ARCHIVOS ORIGINALES'}</span><h4>${step >= 2 ? 'Sus ventas, en una sola tabla.' : 'Mismas ventas. Distintos archivos.'}</h4></div><span class="op-pill">${step >= 2 ? '6 válidos' : '7 entradas'}</span></div>${resultTable(rows, ['Registro', 'Sede', 'Venta COP'], (row) => [row.id, row.city, '$' + format(row.value)])}<div class="op-result-summary"><span>${step >= 2 ? '✓ 1 duplicado eliminado' : '↳ Ejecute para unificar y validar'}</span><strong>${step >= 2 ? '$' + format(consolidatedRows.reduce((sum, row) => sum + row.value, 0)) : '3 sedes conectables'}</strong></div>`;
        }
        if (recipe === 'pdf') {
          return `<div class="op-result-head"><div><span class="op-eyebrow">REVISIÓN DOCUMENTAL</span><h4>Lo importante deja de estar escondido.</h4></div><span class="op-pill ${opState.approved ? 'is-green' : ''}">${opState.approved ? 'Aprobado' : 'Vista previa'}</span></div><div class="op-pdf"><div class="op-paper" aria-label="Factura ficticia"><span>FACTURA DEMO</span><b>NOVA / SERVICIOS</b><p>FV–2048</p><i></i><i></i><i></i><div><small>Total COP</small><strong>$2.856.000</strong></div></div><dl class="op-fields"><div><dt>Proveedor</dt><dd>Nova Servicios S.A.S.</dd></div><div class="${!opState.approved ? 'needs-review' : ''}"><dt>Número de factura</dt><dd>FV–2048 <span>${opState.approved ? '✓ Confirmado' : 'Requiere revisión'}</span></dd></div><div><dt>Subtotal</dt><dd>$2.400.000</dd></div><div><dt>IVA · 19%</dt><dd>$456.000</dd></div></dl></div>${isReview() ? '<div class="op-review"><div><strong>Una persona toma la decisión.</strong><p>Verifique que el número leído coincide con la factura de ejemplo.</p></div><button type="button" class="op-button is-primary" data-op="approve">Confirmar FV–2048</button></div>' : '<p class="op-footnote">' + (opState.approved ? '✓ La aprobación queda incluida en el registro de ejemplo.' : 'El flujo se detendrá en revisión humana antes de registrar.') + '</p>'}`;
        }
        if (recipe === 'streamlit') {
          const rows = orders.filter((order) => opState.appFilter === 'Todos' || order.state === opState.appFilter);
          return `<div class="op-result-head"><div><span class="op-eyebrow">APP INTERNA / VISTA FUNCIONAL</span><h4>Mi operación, bajo control.</h4></div><span class="op-app-icon">S</span></div><div class="op-app-toolbar"><label>Estado del pedido<select data-op-filter aria-label="Filtrar pedidos por estado">${['Todos', 'Pendiente', 'En proceso', 'Entregado'].map((value) => `<option${value === opState.appFilter ? ' selected' : ''}>${value}</option>`).join('')}</select></label><div><small>Pedidos visibles</small><strong>${rows.length}</strong></div><div><small>Valor COP</small><strong>${cash(rows.reduce((sum, row) => sum + row.value, 0))}</strong></div></div>${resultTable(rows, ['Pedido', 'Sede', 'Estado'], (order) => [order.id, order.city, `<span class="op-order-state">${order.state}</span>`])}<p class="op-footnote">Pruebe el filtro. La tabla y los indicadores cambian con sus decisiones.</p>`;
        }
        return `<div class="op-result-head"><div><span class="op-eyebrow">LAKEHOUSE / MEDALLION</span><h4>De lo que llega a lo que aporta.</h4></div><span class="op-pill">Python + SQL</span></div><div class="op-layers">${[['Bronze', 'Datos originales', '12.000', '01'], ['Silver', 'Registros validados', '11.976', '02'], ['Gold', 'Modelo de negocio', '3 tablas', '03']].map((layer, index) => `<div class="op-layer layer-${index} ${step >= index ? 'is-ready' : ''}"><span>${layer[3]}</span><div><strong>${layer[0]}</strong><small>${layer[1]}</small></div><b>${step >= index ? layer[2] : '—'}</b></div>`).join('')}</div><div class="op-code"><span>CONSULTA DE EJEMPLO</span><code>SELECT sede, SUM(venta)<br>FROM gold.ventas_diarias<br>GROUP BY sede;</code></div><p class="op-footnote">${step >= 1 ? '24 registros quedan separados para corregirlos, sin contaminar los indicadores.' : 'Ejecute el ejemplo para seguir el camino de los datos.'}</p>`;
      }

      function render(focusAction) {
        if (destroyed) return;
        const active = host.contains(document.activeElement) ? document.activeElement : null;
        const restoreFocus = focusAction || (active?.dataset.op ? '[data-op="' + active.dataset.op + '"]:not(:disabled)' : active?.dataset.opRecipe ? '[data-op-recipe="' + active.dataset.opRecipe + '"]' : active?.hasAttribute('data-op-filter') ? '[data-op-filter]' : null);
        const recipe = recipes[opState.recipe];
        const complete = opState.step >= 4;
        const waiting = isReview();
        const playing = opState.running && canPlay() && !waiting;
        const progress = Math.max(0, Math.min(4, opState.step)) * 25;
        host.innerHTML = `<div class="op-workspace ${playing ? 'is-playing' : ''}" data-tone="${recipe.color}">
          <div class="op-recipe-tabs" role="group" aria-label="Ejemplos de automatización">${Object.entries(recipes).map(([key, item]) => `<button type="button" data-op-recipe="${key}" aria-pressed="${key === opState.recipe}"><span>${item.symbol}</span><div><b>${item.name}</b><small>${item.chip}</small></div></button>`).join('')}</div>
          <div class="op-heading"><div><span class="op-eyebrow">AUTOMATIZACIÓN QUE SE PUEDE EXPLORAR</span><h3>${recipe.title}</h3><p>${recipe.description}</p></div><span class="op-tool-label">${recipe.tools}</span></div>
          <div class="op-command-bar"><div class="op-run-status"><i></i><span>${complete ? 'Ejemplo completado' : waiting ? 'Esperando revisión humana' : playing ? 'Procesando ejemplo…' : opState.step < 0 ? 'Listo para ejecutar' : 'Pausado · avance a su ritmo'}</span></div><div class="op-controls"><button type="button" class="op-button is-primary" data-op="run">${complete ? 'Volver a ejecutar' : opState.running ? (playing ? 'Pausar recorrido' : 'Continuar recorrido') : 'Ejecutar ejemplo'} <span aria-hidden="true">${playing ? 'Ⅱ' : '▶'}</span></button><button type="button" class="op-button" data-op="step" ${complete || waiting ? 'disabled' : ''}>Siguiente paso →</button><button type="button" class="op-button op-reset" data-op="reset" aria-label="Reiniciar ejemplo">↻</button></div></div>
          <div class="op-flow" aria-label="Pasos del proceso"><div class="op-connection" aria-hidden="true"><i style="width:${progress}%"></i><b></b></div>${recipe.steps.map((step, index) => `<div class="op-step ${opState.step > index ? 'is-done' : opState.step === index ? 'is-current' : ''}"><span class="op-step-icon">${opState.step > index ? '✓' : ['▤', '⌘', '◇', '↗'][index]}</span><small>0${index + 1}</small><strong>${step}</strong><em>${opState.step > index ? 'Completado' : opState.step === index ? (waiting ? 'Su aprobación' : playing ? 'En curso' : 'En pausa') : 'Pendiente'}</em></div>`).join('')}</div>
          <div class="op-scene-grid"><div class="op-console"><div class="op-console-title"><span>ENTRADA → TRANSFORMACIÓN → SALIDA</span><i>LOCAL DEMO</i></div><div class="op-file-stack">${recipe.files.map((file, index) => `<div class="op-file" style="--file-index:${index}"><span>${recipe.symbol}</span><div><b>${file}</b><small>${opState.step < 0 ? 'Preparado' : 'Recibido ✓'}</small></div></div>`).join('')}</div><div class="op-processing"><div class="op-processing-line"></div><span>${ctx.icon('spark')}</span><div class="op-processing-line"></div></div><div class="op-file op-output ${complete ? 'is-ready' : ''}"><span>${complete ? '✓' : '↗'}</span><div><b>${recipe.result}</b><small>${complete ? 'Resultado preparado' : 'Esperando transformación'}</small></div></div><div class="op-event-log" aria-live="polite"><b>${complete ? 'RECORRIDO COMPLETO' : 'AHORA OCURRE ESTO'}</b><p>${opState.step < 0 ? 'Pulse Ejecutar ejemplo para descubrir el proceso, o avance paso a paso.' : recipe.notes[Math.min(opState.step, 3)]}</p></div></div><div class="op-result">${output()}</div></div>
          <div class="op-footer"><p>${recipe.caption}</p>${complete && ['excel', 'pdf'].includes(opState.recipe) ? '<button type="button" class="op-button" data-op="download">Descargar resultado ↓</button>' : '<span>Sin archivos reales · sin conexiones externas</span>'}</div>
        </div>`;
        if (restoreFocus) host.querySelector(restoreFocus)?.focus({ preventScroll: true });
      }

      function schedule() {
        stopTimer();
        if (opState.running && canPlay() && !isReview() && opState.step < 4) timer = window.setTimeout(() => { advance(false); }, 1250);
      }
      function advance(manual) {
        stopTimer();
        if (isReview() || opState.step >= 4) return;
        opState.step++;
        if (opState.step >= 4) {
          opState.running = false;
          announce('Ejemplo de ' + recipes[opState.recipe].name + ' completado. Puede explorar el resultado.');
        } else if (isReview()) announce('Revise y confirme el número de la factura de ejemplo para continuar.');
        render(manual ? (isReview() ? '[data-op="approve"]' : opState.step >= 4 ? '[data-op="run"]' : '[data-op="step"]') : null);
        schedule();
      }
      function reset() {
        stopTimer();
        opState.step = -1;
        opState.running = false;
        opState.paused = false;
        opState.approved = false;
      }
      function click(event) {
        const recipeButton = event.target.closest('[data-op-recipe]');
        if (recipeButton) {
          reset();
          opState.recipe = recipeButton.dataset.opRecipe;
          render('[data-op-recipe="' + opState.recipe + '"]');
          announce(recipes[opState.recipe].name + ' seleccionado.');
          return;
        }
        const button = event.target.closest('[data-op]');
        if (!button || button.disabled) return;
        const action = button.dataset.op;
        if (action === 'reset') { reset(); render('[data-op="run"]'); announce('Ejemplo reiniciado.'); }
        if (action === 'run') {
          if (opState.step === 4) reset();
          if (opState.running) opState.paused = !opState.paused;
          else { opState.running = true; opState.paused = false; if (opState.step < 0) opState.step = 0; }
          render('[data-op="run"]'); schedule();
        }
        if (action === 'step') {
          opState.paused = true;
          advance(true);
        }
        if (action === 'approve') {
          opState.approved = true;
          announce('Número de factura confirmado. Aprobación de ejemplo registrada.');
          advance(true);
        }
        if (action === 'download') {
          if (opState.recipe === 'excel') {
            const csv = '\uFEFFRegistro,Sede,Producto,Venta_COP\r\n' + consolidatedRows.map((row) => [row.id, row.city, row.product, row.value].join(',')).join('\r\n');
            exportLocal('ventas_consolidadas_demo.csv', csv, 'text/csv;charset=utf-8');
          } else exportLocal('factura_validada_demo.json', JSON.stringify({ demo: true, numero: 'FV-2048', proveedor: 'Nova Servicios S.A.S.', subtotal: 2400000, iva: 456000, total: 2856000, revision_humana: true }, null, 2), 'application/json');
          announce('Resultado de ejemplo descargado.');
        }
      }
      function change(event) {
        if (event.target.hasAttribute('data-op-filter')) {
          opState.appFilter = event.target.value;
          render('[data-op-filter]');
          announce('Pedidos filtrados: ' + opState.appFilter + '.');
        }
      }
      function visibility() { if (document.hidden) stopTimer(); else { render(); schedule(); } }
      function motion() { render(); schedule(); }
      host.addEventListener('click', click);
      host.addEventListener('change', change);
      document.addEventListener('visibilitychange', visibility);
      reduced.addEventListener('change', motion);
      render(); schedule();
      return {
        destroy() { destroyed = true; stopTimer(); host.removeEventListener('click', click); host.removeEventListener('change', change); document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', motion); },
        setPaused(value) {
          const nextPaused = Boolean(value);
          if (nextPaused === paused) return;
          paused = nextPaused;
          render(); schedule();
        },
        getContext() { return 'automatización de ' + recipes[opState.recipe].name.toLowerCase(); }
      };
    }
  };

  function baseLeads() {
    return [
      { id: 'norte', name: 'Norte Studio', initials: 'NS', service: 'Business Intelligence', value: 8.4, stage: 0, owner: 'Laura', channel: 'Formulario web', activity: ['Solicitud recibida desde la web.', 'Interés: unificar reportes de ventas.'] },
      { id: 'andina', name: 'Andina Logística', initials: 'AL', service: 'Arquitectura de datos', value: 16, stage: 1, owner: 'Carlos', channel: 'Referido', activity: ['Diagnóstico inicial completado.', 'Fuentes identificadas: ERP y Excel.'] },
      { id: 'orbita', name: 'Órbita Retail', initials: 'OR', service: 'Automatización', value: 6.2, stage: 2, owner: 'Laura', channel: 'WhatsApp', activity: ['Necesidad: consolidar inventarios.', 'Propuesta de alcance preparada.'] },
      { id: 'marea', name: 'Marea Digital', initials: 'MD', service: 'CRM en la nube', value: 9.6, stage: 3, owner: 'Carlos', channel: 'Formulario web', activity: ['Propuesta aceptada en el ejemplo.', 'Próximo paso: sesión de inicio.'] }
    ];
  }
  const crmState = { leads: baseLeads(), selected: 'norte', step: -1, running: false, paused: false, toast: '', filter: 'Todos' };
  const flowSteps = ['Captura', 'Calificación', 'Seguimiento', 'Cierre'];
  const journey = [
    'Nuevo contacto de WhatsApp recibido. Se crea una sola oportunidad, con su conversación.',
    'Interés identificado: dashboard comercial. Responsable asignado: Laura.',
    'Propuesta de ejemplo preparada. Seguimiento agregado a la línea de actividad.',
    'El cliente acepta en este recorrido ficticio. Se prepara el inicio del proyecto.'
  ];

  demos.crm = {
    mount(host, ctx) {
      let timer = 0;
      let destroyed = false;
      let paused = Boolean(ctx.isPaused());
      let dragged = null;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      const canPlay = () => !destroyed && !paused && !crmState.paused && !reduced.matches && !document.hidden;
      const stop = () => { window.clearTimeout(timer); timer = 0; };
      const announce = (text) => { crmState.toast = text; ctx.announce(text); };
      function capture({ reveal = true } = {}) {
        let lead = crmState.leads.find((item) => item.id === 'whatsapp-demo');
        if (!lead) {
          lead = { id: 'whatsapp-demo', name: 'Casa Verde', initials: 'CV', service: 'Dashboard comercial', value: 7.2, stage: 0, owner: 'Laura', channel: 'WhatsApp · demo', activity: [journey[0]] };
          crmState.leads.push(lead);
          announce('Casa Verde llegó desde WhatsApp. Oportunidad creada sin duplicados.');
        } else announce('Casa Verde ya existe. Abrimos su oportunidad sin duplicarla.');
        if (reveal) {
          crmState.selected = lead.id;
          crmState.filter = 'Todos';
        }
        return lead;
      }
      function focusTarget(element) {
        if (!element) return null;
        const data = element.dataset;
        const scope = element.closest('.crm-detail') ? '.crm-detail ' : '.crm-card ';
        if (data.crmStage) return scope + '[data-crm-stage="' + data.crmStage + '"]';
        if (data.crmNext) return scope + '[data-crm-next="' + data.crmNext + '"]:not(:disabled)';
        if (data.crmSelect) return '[data-crm-select="' + data.crmSelect + '"]';
        if (data.crm) return '[data-crm="' + data.crm + '"]:not(:disabled)';
        if (element.hasAttribute('data-crm-filter')) return '[data-crm-filter]';
        return null;
      }
      function pauseForInteraction(event) {
        const control = event.target.closest('[data-crm-stage], [data-crm-filter], [data-crm-next], [data-crm-select]');
        if (!control || !host.contains(control)) return;
        crmState.paused = true;
        stop();
        // Keep native select menus and the current focus intact while pausing.
        host.querySelector('.crm-workspace')?.classList.remove('is-playing');
        host.querySelectorAll('.crm-journey-steps .is-current').forEach((item) => item.classList.remove('is-current'));
        const journeyButton = host.querySelector('[data-crm="journey"]');
        if (journeyButton) journeyButton.textContent = crmState.step >= 3 ? 'Repetir recorrido' : 'Ver recorrido ▶';
      }
      function move(id, stage, source = 'Cambio manual de etapa') {
        const lead = crmState.leads.find((item) => item.id === id);
        if (!lead || !Number.isInteger(stage) || stage < 0 || stage > 3) return;
        if (lead.stage === stage) return;
        lead.stage = stage;
        lead.activity.push(source + ': ' + stages[stage] + '.');
        if (lead.activity.length > 12) lead.activity.shift();
        crmState.selected = id;
        announce(lead.name + ' → ' + stages[stage] + '. Pipeline actualizado.');
      }
      function detail(lead) {
        return `<aside class="crm-detail" aria-label="Detalle de la oportunidad"><div class="crm-detail-top"><span class="crm-eyebrow">OPORTUNIDAD SELECCIONADA</span><span class="crm-stage-label">${stages[lead.stage]}</span></div><div class="crm-identity"><span class="crm-avatar">${lead.initials}</span><div><h4>${lead.name}</h4><p>${lead.service}</p></div></div><dl class="crm-facts"><div><dt>Valor estimado</dt><dd>${cash(lead.value)}</dd></div><div><dt>Responsable</dt><dd>${lead.owner}</dd></div><div><dt>Origen</dt><dd>${lead.channel}</dd></div><div><dt>Próximo paso</dt><dd>${['Entender la necesidad', 'Preparar alcance', 'Revisar propuesta', 'Iniciar proyecto'][lead.stage]}</dd></div></dl><div class="crm-detail-controls"><label>Etapa de ${lead.name}<select data-crm-stage="${lead.id}">${stages.map((stage, index) => `<option value="${index}"${index === lead.stage ? ' selected' : ''}>${stage}</option>`).join('')}</select></label><button type="button" class="crm-button is-primary" data-crm-next="${lead.id}" ${lead.stage === 3 ? 'disabled' : ''}>${lead.stage === 3 ? 'Negocio ganado ✓' : 'Avanzar oportunidad →'}</button></div><div class="crm-timeline"><h5>Una historia, sin perder el contexto.</h5><ol>${lead.activity.slice().reverse().map((text, index) => `<li><i></i><div><small>${index === 0 ? 'Última actividad' : 'Actividad anterior'}</small><p>${escape(text)}</p></div></li>`).join('')}</ol></div></aside>`;
      }
      function render(focusSelector) {
        if (destroyed) return;
        const active = host.contains(document.activeElement) ? document.activeElement : null;
        const restoreFocus = focusSelector || focusTarget(active);
        const total = crmState.leads.reduce((sum, lead) => sum + lead.value, 0);
        const won = crmState.leads.filter((lead) => lead.stage === 3);
        const wonTotal = won.reduce((sum, lead) => sum + lead.value, 0);
        const visible = crmState.leads.filter((lead) => crmState.filter === 'Todos' || lead.owner === crmState.filter);
        const selected = crmState.leads.find((lead) => lead.id === crmState.selected) || crmState.leads[0];
        const playing = crmState.running && canPlay();
        host.innerHTML = `<div class="crm-workspace ${playing ? 'is-playing' : ''}"><div class="crm-heading"><div><span class="crm-eyebrow">TEGGNAR CRM / WORKSPACE COMERCIAL</span><h3>La conversación se convierte en crecimiento.</h3><p>Seleccione una oportunidad y acompañe cada paso hasta el cierre.</p></div><button type="button" class="crm-button" data-crm="reset">↻ Reiniciar demo</button></div><div class="crm-metrics"><div><small>Pipeline abierto</small><strong>${cash(total - wonTotal)}</strong><span>${crmState.leads.length - won.length} oportunidades activas</span></div><div><small>Negocios ganados</small><strong>${cash(wonTotal)}</strong><span>${won.length} cierres de ejemplo</span></div><div><small>Conversión</small><strong>${format(won.length / crmState.leads.length * 100)}%</strong><span>Ganados / total</span></div><div class="crm-metric-accent"><small>Contexto compartido</small><strong>${crmState.leads.length}</strong><span>Historias en un mismo lugar</span></div></div><div class="crm-journey"><div class="crm-journey-title"><span>${ctx.icon('bot')}</span><div><strong>De WhatsApp al cierre.</strong><small>Un recorrido ficticio que puede controlar.</small></div></div><div class="crm-journey-steps">${flowSteps.map((label, index) => `<div class="${crmState.step >= index ? 'is-done' : ''} ${crmState.step === index && playing ? 'is-current' : ''}"><i>${crmState.step >= index ? '✓' : index + 1}</i><span>${label}</span></div>`).join('')}</div><div class="crm-journey-actions"><button type="button" class="crm-button is-primary" data-crm="capture">+ Simular lead de WhatsApp</button><button type="button" class="crm-button" data-crm="journey">${playing ? 'Pausar' : crmState.step >= 3 ? 'Repetir recorrido' : 'Ver recorrido ▶'}</button><button type="button" class="crm-button" data-crm="step" ${crmState.step >= 3 ? 'disabled' : ''}>Paso →</button></div></div><div class="crm-notification" role="status"><span>${ctx.icon('spark')}</span><p>${crmState.toast || 'Todo listo. Mueva una tarjeta o simule la llegada de un cliente.'}</p><small>SOLO EN ESTA DEMO</small></div><div class="crm-board-toolbar"><div><b>Pipeline comercial</b><span>Vista de equipo</span></div><label>Responsable<select data-crm-filter><option value="Todos"${crmState.filter === 'Todos' ? ' selected' : ''}>Todos</option><option${crmState.filter === 'Laura' ? ' selected' : ''}>Laura</option><option${crmState.filter === 'Carlos' ? ' selected' : ''}>Carlos</option></select></label></div><div class="crm-main"><div class="crm-board">${stages.map((stage, index) => {
          const leads = visible.filter((lead) => lead.stage === index);
          return `<div class="crm-column" data-crm-drop="${index}"><div class="crm-column-heading"><h4><i></i>${stage}</h4><span>${leads.length}</span></div><span class="crm-column-total">${cash(leads.reduce((sum, lead) => sum + lead.value, 0))}</span>${leads.map((lead) => `<article class="crm-card ${lead.id === crmState.selected ? 'is-selected' : ''}" data-crm-card="${lead.id}" draggable="true"><button type="button" class="crm-card-open" data-crm-select="${lead.id}" aria-label="Ver detalle de ${lead.name}" aria-pressed="${lead.id === crmState.selected}"><span class="crm-card-line"><span class="crm-avatar">${lead.initials}</span><span class="crm-origin">${lead.channel.includes('WhatsApp') ? 'WhatsApp' : 'Web / referido'}</span></span><b>${lead.name}</b><span class="crm-service">${lead.service}</span><strong>${cash(lead.value)}</strong><span class="crm-card-owner"><i>${lead.owner[0]}</i>${lead.owner}<span>Ver detalle ↗</span></span></button><label class="crm-card-stage">Mover a<select data-crm-stage="${lead.id}" aria-label="Mover ${lead.name} a otra etapa">${stages.map((name, value) => `<option value="${value}"${value === lead.stage ? ' selected' : ''}>${name}</option>`).join('')}</select></label>${lead.stage < 3 ? `<button type="button" class="crm-advance" data-crm-next="${lead.id}" aria-label="Avanzar ${lead.name}">Avanzar →</button>` : '<span class="crm-closed">✓ Negocio ganado</span>'}</article>`).join('') || '<div class="crm-empty">El próximo paso<br>empieza aquí.</div>'}</div>`;
        }).join('')}</div>${detail(selected)}</div><p class="crm-footnote">Empresas, conversaciones y valores ficticios. Los cambios permanecen al explorar otras demos, pero se reinician al recargar. No se envían mensajes ni notificaciones reales.</p></div>`;
        if (restoreFocus) host.querySelector(restoreFocus)?.focus({ preventScroll: true });
      }
      function schedule() {
        stop();
        if (crmState.running && canPlay() && crmState.step < 3) timer = window.setTimeout(() => {
          if (crmState.running && canPlay()) next(false);
        }, 1800);
      }
      function next(manual) {
        stop();
        const lead = crmState.leads.find((item) => item.id === 'whatsapp-demo') || capture({ reveal: false });
        if (crmState.step < 0) crmState.selected = lead.id;
        crmState.step = Math.min(3, crmState.step + 1);
        const step = crmState.step;
        lead.stage = step;
        if (!lead.activity.includes(journey[step])) lead.activity.push(journey[step]);
        announce(journey[step]);
        if (step === 3) crmState.running = false;
        render(manual ? (step === 3 ? '[data-crm="journey"]' : '[data-crm="step"]') : null);
        schedule();
      }
      function click(event) {
        const selected = event.target.closest('[data-crm-select]');
        if (selected) { crmState.selected = selected.dataset.crmSelect; render('[data-crm-select="' + crmState.selected + '"]'); return; }
        const advance = event.target.closest('[data-crm-next]');
        if (advance && !advance.disabled) {
          const lead = crmState.leads.find((item) => item.id === advance.dataset.crmNext);
          if (lead) {
            const scope = advance.closest('.crm-detail') ? '.crm-detail ' : '.crm-card ';
            stop(); crmState.running = false; crmState.paused = true;
            move(lead.id, lead.stage + 1);
            render(scope + (lead.stage === 3 ? '[data-crm-stage="' + lead.id + '"]' : '[data-crm-next="' + lead.id + '"]'));
          }
          return;
        }
        const button = event.target.closest('[data-crm]');
        if (!button || button.disabled) return;
        if (button.dataset.crm === 'capture') { capture(); render('[data-crm="capture"]'); }
        if (button.dataset.crm === 'reset') {
          stop(); crmState.leads = baseLeads(); crmState.selected = 'norte'; crmState.step = -1; crmState.running = false; crmState.paused = false; crmState.filter = 'Todos';
          announce('Workspace restaurado. Puede comenzar un nuevo recorrido.'); render('[data-crm="reset"]');
        }
        if (button.dataset.crm === 'journey') {
          if (crmState.running && canPlay()) { crmState.paused = true; stop(); render('[data-crm="journey"]'); }
          else {
            if (crmState.step >= 3) crmState.step = -1;
            crmState.running = true; crmState.paused = false;
            if (crmState.step < 0) next(false); else { render('[data-crm="journey"]'); schedule(); }
          }
        }
        if (button.dataset.crm === 'step') { crmState.paused = true; next(true); }
      }
      function change(event) {
        if (event.target.hasAttribute('data-crm-stage')) {
          const focus = focusTarget(event.target);
          stop(); crmState.running = false; crmState.paused = true;
          move(event.target.dataset.crmStage, Number(event.target.value));
          render(focus);
        }
        if (event.target.hasAttribute('data-crm-filter')) {
          stop(); crmState.paused = true;
          crmState.filter = event.target.value;
          render('[data-crm-filter]');
        }
      }
      function dragStart(event) {
        const card = event.target.closest('[data-crm-card]');
        if (!card) return;
        dragged = card.dataset.crmCard;
        card.classList.add('is-dragging');
        if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', dragged); }
      }
      function dragOver(event) {
        if (!dragged) return;
        const column = event.target.closest('[data-crm-drop]');
        if (column) { event.preventDefault(); host.querySelectorAll('.is-drop-target').forEach((item) => item.classList.remove('is-drop-target')); column.classList.add('is-drop-target'); }
      }
      function dragEnd() {
        dragged = null;
        host.querySelectorAll('.is-dragging, .is-drop-target').forEach((item) => item.classList.remove('is-dragging', 'is-drop-target'));
      }
      function drop(event) {
        const column = event.target.closest('[data-crm-drop]');
        if (!column || !dragged) return;
        event.preventDefault(); stop(); crmState.running = false;
        const id = dragged; move(id, Number(column.dataset.crmDrop)); dragEnd(); render('[data-crm-select="' + id + '"]');
      }
      function visibility() { if (document.hidden) stop(); else { render(); schedule(); } }
      function motion() { render(); schedule(); }
      const events = { click, change, focusin: pauseForInteraction, pointerdown: pauseForInteraction, dragstart: dragStart, dragover: dragOver, dragend: dragEnd, drop };
      Object.entries(events).forEach(([name, listener]) => host.addEventListener(name, listener));
      document.addEventListener('visibilitychange', visibility);
      reduced.addEventListener('change', motion);
      render(); schedule();
      return {
        destroy() { destroyed = true; stop(); Object.entries(events).forEach(([name, listener]) => host.removeEventListener(name, listener)); document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', motion); },
        setPaused(value) {
          const nextPaused = Boolean(value);
          if (nextPaused === paused) return;
          paused = nextPaused;
          render(); schedule();
        },
        getContext() { return 'un CRM con pipeline comercial y automatización de seguimiento'; }
      };
    }
  };
})();
