/* Animated conversations and architecture. All examples stay in this browser. */
(() => {
  'use strict';
  const demos = window.TeggnarDemos = window.TeggnarDemos || {};
  const chatState = { scenario: 'ventas', index: 0, messages: [], stage: 0, playing: true, manual: false, pending: null };
  const stories = {
    ventas: [
      ['bot', '¡Hola! 👋 Soy el asistente de TEGGNAR. Cuéntame qué tarea le está quitando tiempo a tu equipo.', 0],
      ['user', 'Cada lunes unimos 8 Excel para saber cómo van las ventas. Queremos dejar de hacerlo a mano.', 0],
      ['bot', 'Eso tiene solución ✨ Podemos conectar tus archivos, ordenar las cifras y convertirlas en un tablero que tu equipo pueda explorar.', 1],
      ['card', 'Tu siguiente paso, más claro', 2],
      ['user', '¡Eso buscamos! ¿También podemos ver las ventas por ciudad?', 2],
      ['bot', 'Claro: ciudad, producto, vendedor y período. Todo parte de las fuentes y reglas que definamos contigo. 📊', 2],
      ['user', 'Me gustaría conocer una propuesta.', 3],
      ['bot', '¡Listo! Dejé preparado el contexto de esta conversación para un asesor: fuentes en Excel, tablero comercial y análisis por ciudad. Así no tendrás que contar todo otra vez. 🤝', 3]
    ],
    soporte: [
      ['bot', '¡Hola! 👋 Cuéntame qué necesitas y busquemos el siguiente paso.', 0],
      ['user', 'Necesito consultar el estado de mi solicitud de soporte.', 0],
      ['bot', 'Voy a revisar una solicitud de ejemplo en nuestro CRM de demostración. 🔎', 1],
      ['ticket', 'Solicitud DEMO-1042', 1],
      ['user', 'Quisiera hablar con una persona para dar más detalles.', 2],
      ['bot', 'Por supuesto. Preparé el resumen y la referencia de tu caso para el equipo de soporte. Tu conversación continúa con contexto. 🤝', 3]
    ],
    agenda: [
      ['bot', '¡Hola! 👋 ¿Buscas una forma de automatizar tus informes?', 0],
      ['user', 'Sí. Quiero conversar con alguien sobre mi proceso.', 0],
      ['bot', 'Perfecto. En una sesión revisamos tus fuentes, el trabajo manual y lo que quieres mejorar. Esta sería una solicitud de diagnóstico. 🗓️', 1],
      ['appointment', 'Una conversación para empezar', 2],
      ['user', 'Nos interesa revisar cartera y recaudo.', 2],
      ['bot', '¡Anotado en esta demo! Cartera, recaudo e informes manuales. Conectado a tu agenda real, el asistente podría consultar disponibilidad y preparar la cita. ✅', 3]
    ]
  };
  const flowSteps = [
    ['Entiende la intención', 'Identifica qué necesita la persona.', 'Mensaje recibido'],
    ['Consulta el contexto', 'Conecta catálogo, agenda o CRM.', 'Fuentes del negocio'],
    ['Propone el siguiente paso', 'Responde con opciones útiles.', 'Respuesta preparada'],
    ['Entrega a su equipo', 'Un asesor recibe el historial.', 'Contexto completo']
  ];
  demos.whatsapp = {
    mount(host, ctx) {
      let timer = 0, replyTimer = 0, paused = ctx.isPaused(), destroyed = false;
      let typing = false;
      const s = chatState;
      host.innerHTML = '<div class="wa-workspace"><div class="wa-phone"><div class="wa-phone-top"><span>WhatsApp Business</span><span>TEGGNAR · DEMO</span></div>' +
        '<div class="wa-profile"><span class="wa-avatar">' + ctx.icon('bot') + '</span><div><strong>TEGGNAR Assistant <span class="wa-verified">✓</span></strong><small data-wa-presence>Asistente de demostración</small></div><span class="wa-profile-symbols" aria-hidden="true">◉ ···</span></div>' +
        '<div class="wa-chat" role="log" aria-label="Conversación de ejemplo" aria-live="off"><div class="wa-day">HOY · CONVERSACIÓN SIMULADA</div><div data-wa-messages></div><div class="wa-typing" hidden><i></i><i></i><i></i><span>Preparando respuesta</span></div></div>' +
        '<div class="wa-quick" aria-label="Pruebe una respuesta"><button type="button" data-wa-quick="Quiero automatizar mis informes">Mis informes 📊</button><button type="button" data-wa-quick="Quiero una cita">Agendar 🗓️</button><button type="button" data-wa-quick="Quiero un asesor">Un asesor 💬</button></div>' +
        '<form class="wa-composer"><label class="sr-only" for="wa-input">Escriba un mensaje de prueba</label><input id="wa-input" maxlength="300" autocomplete="off" placeholder="Escriba y tome el control…"><button type="submit" aria-label="Enviar mensaje de prueba">' + ctx.icon('send') + '</button></form>' +
        '<p class="wa-footnote">Simulación local. No envía mensajes ni reserva citas reales.</p></div>' +
        '<aside class="wa-journey"><p class="journey-eyebrow">DE UN MENSAJE A UNA ACCIÓN</p><h3>Su mejor primera impresión.<br>A cualquier hora.</h3><p class="journey-copy">Mire la conversación y lo que pasa detrás. El asistente orienta; su equipo conserva el control.</p>' +
        '<div class="wa-scenarios" role="group" aria-label="Historia de WhatsApp"><button type="button" data-wa-story="ventas">Ventas</button><button type="button" data-wa-story="soporte">Soporte</button><button type="button" data-wa-story="agenda">Agenda</button></div>' +
        '<ol class="wa-flow">' + flowSteps.map((f, i) => '<li data-wa-stage="' + i + '"><span class="wa-flow-icon">' + ctx.icon(['bot','database','spark','user'][i]) + '</span><div><span class="wa-step-no">0' + (i+1) + '</span><strong>' + f[0] + '</strong><p>' + f[1] + '</p><small>' + f[2] + '</small></div><span class="wa-step-check" aria-hidden="true">✓</span></li>').join('') + '</ol>' +
        '<div class="wa-journey-controls"><button type="button" data-wa-play class="lab-btn">Pausar historia</button><button type="button" data-wa-next class="lab-btn">Siguiente paso →</button><button type="button" data-wa-reset class="wa-reset" aria-label="Reiniciar conversación">↻</button></div>' +
        '<div class="wa-outcome"><span>' + ctx.icon('link') + '</span><div><strong data-wa-result>Una conversación. Un recorrido conectado.</strong><p data-wa-result-detail>WhatsApp → fuentes del negocio → equipo comercial</p></div></div></aside></div>';
      const q = selector => host.querySelector(selector);
      const box = q('[data-wa-messages]');
      const chat = q('.wa-chat');
      function appendBubble(message, initial = false) {
        const bubble = document.createElement('div');
        bubble.className = 'wa-bubble ' + (message.role === 'user' ? 'wa-outgoing' : 'wa-incoming') + (initial ? ' wa-existing' : '');
        if (['card', 'ticket', 'appointment'].includes(message.role)) {
          const cards = {
            card: '<div class="wa-rich-icon">' + ctx.icon('chart') + '</div><strong>Una vista para todo su equipo</strong><p>Sus ventas, sin perseguir archivos.</p><div class="wa-rich-grid"><span><b>8</b> archivos</span><span><b>1</b> tablero</span><span><b>3</b> ciudades</span></div><small>Ejemplo de solución · alcance por definir</small>',
            ticket: '<div class="wa-rich-icon">' + ctx.icon('file') + '</div><strong>Solicitud DEMO-1042</strong><p>Integración de datos · En revisión</p><div class="wa-ticket-progress"><i></i><i></i><i></i></div><small>Recibido → asignado → revisión</small>',
            appointment: '<div class="wa-rich-icon">' + ctx.icon('clock') + '</div><strong>Diagnóstico de procesos</strong><p>30 min · sesión con su equipo</p><div class="wa-agenda-tags"><span>Fuentes</span><span>Procesos</span><span>Prioridades</span></div><small>Ejemplo de solicitud, sin reserva real</small>'
          };
          bubble.classList.add('wa-rich');
          bubble.innerHTML = cards[message.role];
        } else {
          const p = document.createElement('p');
          p.textContent = message.text;
          bubble.append(p);
        }
        const time = document.createElement('span');
        time.className = 'wa-message-time';
        time.textContent = 'Ahora' + (message.role === 'user' ? ' ✓✓' : '');
        bubble.append(time);
        box.append(bubble);
        if (!initial) chat.scrollTo({ top: chat.scrollHeight, behavior: paused ? 'instant' : 'smooth' });
      }
      function paintFlow() {
        host.querySelectorAll('[data-wa-stage]').forEach((item, i) => {
          item.classList.toggle('is-active', i === s.stage);
          item.classList.toggle('is-done', i < s.stage);
          item.setAttribute('aria-current', i === s.stage ? 'step' : 'false');
        });
        host.querySelectorAll('[data-wa-story]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.waStory === s.scenario)));
        const done = s.index >= stories[s.scenario].length;
        q('[data-wa-play]').textContent = done ? 'Repetir historia' : s.playing && !s.manual ? 'Pausar historia' : 'Reproducir historia';
        q('[data-wa-play]').setAttribute('aria-pressed', String(s.playing && !s.manual));
        q('[data-wa-next]').disabled = done;
        q('[data-wa-result]').textContent = s.stage === 3 ? 'Su equipo recibe una oportunidad con contexto.' : flowSteps[s.stage][2];
        q('[data-wa-result-detail]').textContent = s.stage === 3 ? 'Necesidad + fuentes + conversación, listas para continuar.' : 'WhatsApp → fuentes del negocio → equipo comercial';
        q('[data-wa-presence]').textContent = typing ? 'Escribiendo…' : s.manual ? 'Usted tiene el control' : 'Asistente de demostración';
        q('.wa-typing').hidden = !typing;
      }
      function stop() { clearTimeout(timer); timer = 0; typing = false; }
      function schedule() {
        stop();
        if (destroyed || paused || !s.playing || s.manual || s.index >= stories[s.scenario].length) { paintFlow(); return; }
        const next = stories[s.scenario][s.index];
        typing = next[0] !== 'user';
        paintFlow();
        timer = setTimeout(() => { timer = 0; advance(); }, s.index === 0 ? 650 : next[0] === 'user' ? 2300 : 3000);
      }
      function advance() {
        stop();
        const entry = stories[s.scenario][s.index++];
        if (!entry) { s.index = stories[s.scenario].length; paintFlow(); return; }
        const message = { role: entry[0], text: entry[1] };
        s.stage = entry[2]; s.messages.push(message);
        appendBubble(message);
        paintFlow();
        schedule();
      }
      function reset(scenario = s.scenario) {
        stop(); clearTimeout(replyTimer); replyTimer = 0;
        s.scenario = scenario; s.index = 0; s.messages = []; s.stage = 0; s.manual = false; s.playing = true; s.pending = null;
        box.replaceChildren(); q('#wa-input').value = ''; q('.wa-composer button').disabled = false;
        paintFlow();
        if (paused) advance(); else schedule();
      }
      function send(text) {
        text = text.trim().slice(0,300);
        if (!text || replyTimer) return;
        stop(); s.manual = true; s.playing = false;
        const message = { role: 'user', text };
        s.messages.push(message); appendBubble(message); q('#wa-input').value = '';
        const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        let reply;
        if (/asesor|persona|humano/.test(normalized)) {
          s.stage = 3; reply = '¡Por supuesto! 🤝 En una integración real, un asesor recibiría esta conversación y el resumen de tu necesidad. Aquí puedes seguir explorando sin enviar tus datos.';
        } else if (/cita|agenda|reunion/.test(normalized)) {
          s.stage = 2; reply = 'Una sesión de 30 minutos es un buen inicio 🗓️ Revisaríamos tus fuentes, tareas manuales y prioridades. El botón «Quiero esto para mi empresa» te lleva al contacto para solicitarla.';
        } else if (/pdf|factura|excel|informe|automat/.test(normalized)) {
          s.stage = 2; reply = '¡Podemos explorar ese proceso! ✨ Imagina reunir los Excel, extraer campos de documentos, validar excepciones y entregar un reporte. Prueba la pestaña Automatización para verlo paso a paso.';
        } else if (/dashboard|ventas|power|tablero/.test(normalized)) {
          s.stage = 2; reply = '📊 Un tablero puede reunir ventas, metas y regiones en una sola vista. Prueba Dashboards y cambia entre Power BI, Looker Studio, Qlik Sense y Tableau. ¿De dónde salen tus datos hoy?';
        } else {
          s.stage = 1; reply = 'Gracias por contármelo 🙌 Esta demo responde sobre dashboards, automatización, agenda y atención con asesor. Puedes probar uno de esos temas o mirar cómo avanza la historia de ejemplo.';
        }
        s.pending = { role: 'bot', text: reply };
        typing = true; paintFlow(); q('.wa-composer button').disabled = true;
        replyTimer = setTimeout(() => {
          replyTimer = 0; if (destroyed) return;
          typing = false;
          const bot = s.pending; s.pending = null; s.messages.push(bot); appendBubble(bot);
          q('.wa-composer button').disabled = false; paintFlow();
          ctx.announce('El asistente de demostración respondió a su mensaje.');
        }, paused ? 0 : 900);
      }
      function click(event) {
        const button = event.target.closest('button'); if (!button) return;
        if (button.hasAttribute('data-wa-story')) reset(button.dataset.waStory);
        else if (button.hasAttribute('data-wa-quick')) send(button.dataset.waQuick);
        else if (button.hasAttribute('data-wa-reset')) reset();
        else if (button.hasAttribute('data-wa-next')) { s.playing = false; s.manual = false; advance(); }
        else if (button.hasAttribute('data-wa-play')) {
          if (s.index >= stories[s.scenario].length || s.manual) reset();
          else { s.playing = !s.playing; schedule(); }
        }
      }
      function submit(event) { event.preventDefault(); send(q('#wa-input').value); }
      host.addEventListener('click', click); q('.wa-composer').addEventListener('submit', submit);
      if (s.pending) { s.messages.push(s.pending); s.pending = null; }
      if (!s.messages.length && s.index === 0) {
        const first = stories[s.scenario][s.index++];
        s.messages.push({ role: first[0], text: first[1] });
      }
      s.messages.forEach(message => appendBubble(message, true));
      chat.scrollTop = chat.scrollHeight;
      paintFlow(); schedule();
      return {
        destroy() {
          destroyed = true; stop(); clearTimeout(replyTimer);
          host.removeEventListener('click', click);
          q('.wa-composer')?.removeEventListener('submit', submit);
        },
        setPaused(value) { if (paused === value) return; paused = value; schedule(); },
        getContext() { return 'un asistente de WhatsApp para ' + s.scenario; }
      };
    }
  };

  const archState = { cloud: 'azure', output: 'bi', step: -1, selected: 'sources', running: false, first: true };
  const clouds = {
    azure: { name: 'Microsoft Azure', mark: 'A', lake: 'Data Lake Storage', compute: 'Data Factory · Databricks', warehouse: 'Synapse / Fabric', color: '#087cce' },
    gcp: { name: 'Google Cloud', mark: 'G', lake: 'Cloud Storage', compute: 'Dataflow · Dataproc', warehouse: 'BigQuery', color: '#4285f4' },
    aws: { name: 'Amazon Web Services', mark: 'aws', lake: 'Amazon S3', compute: 'AWS Glue · EMR', warehouse: 'Amazon Redshift', color: '#d17b05' }
  };
  const outputs = {
    bi: ['Dashboards', 'Indicadores que su equipo puede explorar.', 'Power BI · Looker · Tableau', 'chart'],
    ml: ['Machine learning', 'Modelos para estimar demanda y detectar patrones.', 'Entrenar · evaluar · monitorear', 'spark'],
    apps: ['Apps de negocio', 'Datos útiles en herramientas para su operación.', 'Streamlit · API · aplicaciones', 'code']
  };
  const descriptions = {
    sources: ['01 / FUENTES', 'La información que ya tiene.', 'Archivos Excel, su ERP y su CRM. Definimos qué se necesita, quién lo administra y cómo llega cada dato.', 'Entrada', 'Archivos y registros de ejemplo'],
    integration: ['02 / INTEGRACIÓN', 'Un mismo lenguaje para sus datos.', 'Conectores, APIs y Python reciben la información. Se normalizan fechas, nombres y claves antes de consolidar.', 'Transformación', 'Fuentes conectadas y formatos consistentes'],
    cloud: ['03 / NUBE', 'Una base preparada para crecer.', 'Los datos se organizan en capas: originales, limpios y listos para consumo. La plataforma se elige con su empresa.', 'Almacenamiento', 'Bronze → Silver → Gold'],
    quality: ['04 / DECISIÓN', '¿Los datos cumplen las reglas?', 'Validamos campos requeridos, duplicados y consistencia. Las excepciones vuelven a revisión antes de alimentar decisiones.', 'Regla de ejemplo', 'Pedido con ID, fecha e importe válido'],
    bi: ['05 / CONSUMO', 'De los datos a las decisiones.', 'Un modelo de negocio alimenta dashboards y métricas consistentes para ventas, finanzas y operaciones.', 'Salida', 'Tablero actualizado'],
    ml: ['05 / CONSUMO', 'De los datos a nuevas señales.', 'El historial preparado permite entrenar y evaluar modelos. Las predicciones se monitorean antes de usarlas en la operación.', 'Salida', 'Estimación de demanda de ejemplo'],
    apps: ['05 / CONSUMO', 'De los datos a herramientas útiles.', 'Una aplicación convierte la información en una consulta, una carga de archivos o una tarea guiada para su equipo.', 'Salida', 'Aplicación conectada al modelo']
  };
  demos.data = {
    mount(host, ctx) {
      const s = archState;
      let timer = 0, paused = ctx.isPaused(), destroyed = false, resizeObserver;
      host.innerHTML = '<div class="arch-workspace"><div class="arch-toolbar"><div><p class="journey-eyebrow">BLUEPRINT / ARQUITECTURA DE DATOS</p><h3>Así viaja la información.</h3></div><div class="arch-clouds" role="group" aria-label="Plataforma de nube">' +
        Object.entries(clouds).map(([key,c]) => '<button type="button" data-cloud="' + key + '" aria-pressed="' + (s.cloud === key) + '"><span class="arch-cloud-mark arch-' + key + '">' + c.mark + '</span>' + (key === 'azure' ? 'Azure' : key === 'gcp' ? 'Google Cloud' : 'AWS') + '</button>').join('') + '</div></div>' +
        '<div class="arch-signal"><span><i></i> Arquitectura de ejemplo</span><span data-arch-status>Un registro. Del origen a una decisión.</span><button type="button" class="lab-btn" data-arch-run>Recorrer arquitectura ' + ctx.icon('arrow') + '</button></div>' +
        '<div class="arch-board"><svg class="arch-wires" aria-hidden="true"><defs><marker id="arch-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="currentColor"/></marker></defs><g data-arch-wires></g></svg>' +
        '<div class="arch-lane arch-sources-lane"><span class="arch-lane-label">01 / FUENTES</span><button type="button" class="arch-node arch-sources" data-node="sources"><span class="arch-node-icon">' + ctx.icon('file') + '</span><strong>Su operación</strong><small>Lo que ya tiene</small><span class="arch-source-list"><span><i class="arch-excel">X</i> Excel</span><span><i>ERP</i> Finanzas y operación</span><span><i>CRM</i> Clientes y ventas</span></span><em>Pedido #1042</em></button></div>' +
        '<div class="arch-lane arch-integration-lane"><span class="arch-lane-label">02 / INTEGRACIÓN</span><button type="button" class="arch-node" data-node="integration"><span class="arch-node-icon">' + ctx.icon('code') + '</span><strong>Conectar y preparar</strong><small>APIs · Python · SQL</small><span class="arch-mini-tags"><span>Extraer</span><span>Transformar</span><span>Cargar</span></span></button></div>' +
        '<div class="arch-lane arch-cloud-lane"><span class="arch-lane-label">03 / SU NUBE</span><button type="button" class="arch-node arch-cloud-node" data-node="cloud"><span class="arch-cloud-brand" data-cloud-brand></span><strong data-cloud-name></strong><small data-cloud-storage></small><span class="arch-layers"><span>Bronze<small>Original</small></span><span>Silver<small>Limpio</small></span><span>Gold<small>Negocio</small></span></span><span class="arch-compute" data-cloud-compute></span></button></div>' +
        '<div class="arch-lane arch-quality-lane"><span class="arch-lane-label">04 / CALIDAD</span><button type="button" class="arch-node arch-decision" data-node="quality"><span class="arch-diamond"><span>✓</span></span><strong>¿Datos confiables?</strong><small>Validar · revisar</small><span class="arch-rule">Sí → habilitar consumo</span></button><span class="arch-rework">Si hay errores: revisar ↶</span></div>' +
        '<div class="arch-lane arch-outputs-lane"><span class="arch-lane-label">05 / POSIBILIDADES</span>' + Object.entries(outputs).map(([key,o]) => '<button type="button" class="arch-node arch-output" data-node="' + key + '"><span class="arch-node-icon">' + ctx.icon(o[3]) + '</span><span><strong>' + o[0] + '</strong><small>' + o[2] + '</small></span></button>').join('') + '</div></div>' +
        '<div class="arch-inspector" aria-live="polite"><div><p class="journey-eyebrow" data-detail-step></p><h4 data-detail-title></h4><p data-detail-copy></p></div><div class="arch-delivery"><small data-detail-label></small><strong data-detail-value></strong></div></div>' +
        '<div class="arch-caption"><span>Toque un nodo para entender su función.</span><span>Diagrama interactivo · sin conexión a servicios reales</span></div></div>';
      const q = selector => host.querySelector(selector);
      function paintCloud() {
        const cloud = clouds[s.cloud];
        q('.arch-workspace').style.setProperty('--arch-cloud', cloud.color);
        q('[data-cloud-brand]').textContent = cloud.mark;
        q('[data-cloud-name]').textContent = cloud.name;
        q('[data-cloud-storage]').textContent = cloud.lake;
        q('[data-cloud-compute]').textContent = cloud.compute + ' / ' + cloud.warehouse;
        host.querySelectorAll('[data-cloud]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cloud === s.cloud)));
      }
      function inspect(id) {
        s.selected = id;
        const d = descriptions[id];
        ['step','title','copy','label','value'].forEach((key,i) => { q('[data-detail-' + key + ']').textContent = d[i]; });
        host.querySelectorAll('[data-node]').forEach(n => n.setAttribute('aria-pressed', String(n.dataset.node === id)));
      }
      function drawWires() {
        const board = q('.arch-board'); if (!board || destroyed) return;
        const base = board.getBoundingClientRect();
        const horizontal = getComputedStyle(board).gridTemplateColumns.split(' ').length > 1;
        const routes = [['sources','integration'],['integration','cloud'],['cloud','quality'],['quality','bi'],['quality','ml'],['quality','apps']];
        q('.arch-wires').setAttribute('viewBox', '0 0 ' + base.width + ' ' + base.height);
        q('[data-arch-wires]').innerHTML = routes.map(([from,to],i) => {
          const a=q('[data-node="' + from + '"]').getBoundingClientRect();
          const b=q('[data-node="' + to + '"]').getBoundingClientRect();
          let x1,y1,x2,y2,d;
          if (horizontal) {
            x1=a.right-base.left; y1=a.top+a.height/2-base.top;
            x2=b.left-base.left; y2=b.top+b.height/2-base.top;
            const middle=(x1+x2)/2;
            d='M'+x1+','+y1+' H'+middle+' V'+y2+' H'+x2;
          } else {
            x1=a.left+a.width/2-base.left; y1=a.bottom-base.top;
            x2=b.left+b.width/2-base.left; y2=b.top-base.top;
            if (i > 2) {
              const first=q('[data-node="bi"]').getBoundingClientRect();
              const busY=first.top-base.top-13;
              d='M'+x1+','+y1+' V'+busY+' H8 V'+(b.top+b.height/2-base.top)+' H'+(b.left-base.left);
            }
            else d='M'+x1+','+y1+' V'+((y1+y2)/2)+' H'+x2+' V'+y2;
          }
          return '<path class="arch-wire" data-route="' + i + '" data-destination="' + to + '" d="' + d + '" marker-end="url(#arch-arrow)"/>';
        }).join('');
        paintProgress();
      }
      function paintProgress() {
        const nodes = ['sources','integration','cloud','quality',s.output];
        host.querySelectorAll('[data-node]').forEach(node => {
          const index = nodes.indexOf(node.dataset.node);
          node.classList.toggle('is-flowing', index === s.step);
          node.classList.toggle('is-complete', index >= 0 && index < s.step);
          node.classList.toggle('is-chosen', node.dataset.node === s.output);
        });
        host.querySelectorAll('[data-route]').forEach(path => {
          const index = +path.dataset.route;
          const selected = index < 3 || path.dataset.destination === s.output;
          path.classList.toggle('is-traveling', selected && ((index < 3 && s.step === index+1) || (index >= 3 && s.step === 4)));
          path.classList.toggle('is-traveled', selected && (index < 3 ? s.step > index+1 : s.step > 4));
        });
        q('[data-arch-run]').innerHTML = s.running ? 'Pausar recorrido' : s.step >= 4 ? 'Repetir recorrido ' + ctx.icon('arrow') : s.step >= 0 ? 'Continuar recorrido ' + ctx.icon('arrow') : 'Recorrer arquitectura ' + ctx.icon('arrow');
        const labels = ['Recibimos el pedido #1042 desde las fuentes.','Normalizamos y conectamos la información.','Organizamos el dato en ' + clouds[s.cloud].name + '.','Validamos ID, fecha e importe.','Entregamos información a ' + outputs[s.output][0] + '.'];
        q('[data-arch-status]').textContent = s.step >= 0 ? labels[Math.min(s.step,4)] : 'Un registro. Del origen a una decisión.';
      }
      function schedule() {
        clearTimeout(timer); timer=0;
        if (!s.running || paused || destroyed) return;
        timer=setTimeout(() => {
          s.step++; inspect(['sources','integration','cloud','quality',s.output][Math.min(s.step,4)]);
          if (s.step >= 4) s.running=false;
          paintProgress(); schedule();
        }, 1500);
      }
      function start() {
        if (s.running) { s.running=false; schedule(); paintProgress(); return; }
        if (s.step >= 4 || s.step < 0) s.step=0;
        s.running=true;
        if (paused) { s.step=Math.min(4,s.step+1); s.running=false; }
        inspect(['sources','integration','cloud','quality',s.output][s.step]);
        paintProgress(); schedule();
      }
      function click(event) {
        const b=event.target.closest('button'); if(!b) return;
        if(b.hasAttribute('data-cloud')) { s.cloud=b.dataset.cloud; s.step=-1; s.running=false; schedule(); paintCloud(); inspect('cloud'); drawWires(); }
        else if(b.hasAttribute('data-node')) {
          inspect(b.dataset.node);
          if(outputs[b.dataset.node]) { s.output=b.dataset.node; paintProgress(); }
        } else if(b.hasAttribute('data-arch-run')) start();
      }
      host.addEventListener('click',click);
      paintCloud(); inspect(s.selected); drawWires(); paintProgress();
      if ('ResizeObserver' in window) { resizeObserver=new ResizeObserver(drawWires); resizeObserver.observe(q('.arch-board')); }
      if(s.first) { s.first=false; s.step=0; s.running=true; paintProgress(); }
      schedule();
      return {
        destroy() { destroyed=true; clearTimeout(timer); resizeObserver?.disconnect(); host.removeEventListener('click',click); },
        setPaused(value) { if (paused === value) return; paused=value; schedule(); },
        getContext() { return 'arquitectura en ' + clouds[s.cloud].name + ' para ' + outputs[s.output][0].toLowerCase(); }
      };
    }
  };
})();
