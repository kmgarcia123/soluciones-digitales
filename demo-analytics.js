/* Four self-contained BI interface demonstrations. All figures are fictional. */
(() => {
  'use strict';

  const names = ['Power BI', 'Looker Studio', 'Qlik Sense', 'Tableau'];
  const keys = ['powerbi', 'looker', 'qlik', 'tableau'];
  const state = {
    platform: 0,
    region: 'Todas',
    period: '6',
    month: 5,
    chartMode: 'line',
    order: ['trend', 'channels'],
    sheet: 'overview'
  };
  const regions = ['Todas', 'Bogotá', 'Medellín', 'Cali'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const baseSales = [34, 42, 38, 53, 58, 69];
  const channelData = [['Tienda directa', 48], ['E-commerce', 34], ['Distribuidores', 18]];

  function data() {
    const factor = { Todas: 1, Bogotá: 0.46, Medellín: 0.32, Cali: 0.22 }[state.region];
    const offset = state.period === '3' ? 3 : 0;
    const values = baseSales.slice(offset).map(value => +(value * factor).toFixed(1));
    const total = values.reduce((sum, value) => sum + value, 0);
    return {
      factor, offset, values, total,
      labels: months.slice(offset),
      selected: Math.max(0, Math.min(state.month - offset, values.length - 1)),
      orders: Math.round(total * 18),
      target: (state.period === '3' ? 190 : 310) * factor
    };
  }

  window.TeggnarDemos = window.TeggnarDemos || {};
  window.TeggnarDemos.analytics = {
    mount(host, ctx) {
      let destroyed = false;
      let paused = ctx.isPaused();
      let animations = [];
      let timeouts = [];
      const downloads = new Map();
      let transitionToken = 0;
      let draggedCard = null;
      let displayedPlatform = state.platform;
      const fmt = ctx.fmt;
      const money = ctx.money;
      const icon = ctx.icon;
      const announce = ctx.announce;
      const $ = selector => host.querySelector(selector);

      function later(callback, delay) {
        const id = window.setTimeout(() => {
          timeouts = timeouts.filter(timer => timer !== id);
          if (!destroyed) callback();
        }, delay);
        timeouts.push(id);
      }

      function cancelTransition() {
        transitionToken++;
        timeouts.forEach(window.clearTimeout);
        timeouts = [];
        animations.forEach(animation => animation.cancel());
        animations = [];
        const app = $('.bi-stage');
        if (app) app.removeAttribute('aria-busy');
      }

      function logo(platform) {
        const logos = [
          '<span class="bi-mark bi-mark-power"><i></i><i></i><i></i></span>',
          '<span class="bi-mark bi-mark-looker"><i></i><i></i><i></i></span>',
          '<span class="bi-mark bi-mark-qlik">Q</span>',
          '<span class="bi-mark bi-mark-tableau">✣</span>'
        ];
        return logos[platform];
      }

      function platformSelector() {
        return `<div class="bi-platform-picker" role="group" aria-label="Elegir plataforma de dashboard">
          ${names.map((name, i) => `<button type="button" class="bi-platform-button" data-bi-platform="${i}" aria-label="${name}" aria-pressed="${state.platform === i}">${logo(i)}<span>${name}</span></button>`).join('')}
        </div>`;
      }

      function regionFilter() {
        return `<label class="bi-filter"><span>Región</span><select data-bi-filter="region" aria-label="Filtrar dashboard por región">${regions.map(region => `<option${state.region === region ? ' selected' : ''}>${region}</option>`).join('')}</select></label>`;
      }

      function periodFilter() {
        return `<label class="bi-filter"><span>Período</span><select data-bi-filter="period" aria-label="Filtrar dashboard por período"><option value="6"${state.period === '6' ? ' selected' : ''}>Enero – Junio</option><option value="3"${state.period === '3' ? ' selected' : ''}>Abril – Junio</option></select></label>`;
      }

      function chartMode() {
        return `<div class="bi-chart-mode" role="group" aria-label="Tipo de visualización"><button type="button" data-bi-mode="line" aria-pressed="${state.chartMode === 'line'}">Línea</button><button type="button" data-bi-mode="bars" aria-pressed="${state.chartMode === 'bars'}">Barras</button></div>`;
      }

      function reorderButton(id, name) {
        return `<button type="button" class="bi-reorder" data-bi-reorder="${id}" aria-label="Cambiar posición de ${name}" title="Cambiar posición">${icon('grip')}</button>`;
      }

      function trend(d) {
        const maximum = Math.ceil(Math.max(...d.values) / 10) * 10;
        const points = d.values.map((value, i) => [50 + i * 470 / (d.values.length - 1), 176 - value / maximum * 140]);
        const path = points.map((point, i) => (i ? 'L' : 'M') + point.join(',')).join(' ');
        const grid = [0, 1, 2, 3, 4].map(i => {
          const y = 176 - i * 35;
          return `<path d="M50 ${y}H535"/><text x="39" y="${y + 4}" text-anchor="end">${fmt(maximum * i / 4)}</text>`;
        }).join('');
        const series = state.chartMode === 'bars'
          ? d.values.map((value, i) => `<rect class="bi-chart-bar" x="${58 + i * 470 / d.values.length}" y="${176 - value / maximum * 140}" width="${470 / d.values.length - 22}" height="${value / maximum * 140}" rx="${displayedPlatform === 3 ? 0 : 3}" opacity="${i === d.selected ? 1 : 0.55}"/>`).join('')
          : `${displayedPlatform !== 3 ? `<path class="bi-chart-area" d="${path} L520,176 L50,176Z"/>` : ''}<path class="bi-chart-line" d="${path}"/>${points.map((point, i) => `<circle class="bi-chart-point" cx="${point[0]}" cy="${point[1]}" r="${i === d.selected ? 6 : 3.5}"/>`).join('')}`;
        return `<article class="bi-viz bi-trend" draggable="true" data-bi-card="trend">
          <div class="bi-viz-heading"><div><span class="bi-caption">INGRESOS POR MES · MILLONES COP</span><h4>${displayedPlatform === 2 ? 'La evolución de sus ventas' : displayedPlatform === 3 ? 'Ventas por Mes' : 'Así crece su negocio'}</h4></div>${reorderButton('trend', 'gráfico de ventas')}</div>
          ${chartMode()}
          <div class="bi-chart"><svg viewBox="0 0 560 200" role="img" aria-label="Ventas simuladas en millones COP. ${d.labels.map((label, i) => label + ': ' + fmt(d.values[i])).join('; ')}"><g class="bi-chart-grid">${grid}</g>${series}</svg></div>
          <div class="bi-months" role="group" aria-label="Explorar ventas de un mes">${d.labels.map((label, i) => `<button type="button" data-bi-month="${i + d.offset}" aria-pressed="${i === d.selected}">${label}</button>`).join('')}</div>
          <div class="bi-selection-detail"><span>${d.labels[d.selected]} · ${state.region}</span><strong>${money(d.values[d.selected])}</strong><small>ventas del mes</small></div>
        </article>`;
      }

      function channels(d) {
        const colors = ['var(--bi-accent)', 'var(--bi-secondary)', 'var(--bi-tertiary)'];
        return `<article class="bi-viz bi-channels" draggable="true" data-bi-card="channels">
          <div class="bi-viz-heading"><div><span class="bi-caption">CONTRIBUCIÓN AL INGRESO</span><h4>${displayedPlatform === 3 ? 'Ventas por Canal' : 'Cada canal cuenta'}</h4></div>${reorderButton('channels', 'gráfico de canales')}</div>
          <div class="bi-channel-visual">
            <div class="bi-donut" role="img" aria-label="Participación: tienda directa 48%, e-commerce 34%, distribuidores 18%"><div><small>Ingreso total</small><strong>${money(d.total)}</strong></div></div>
            <div class="bi-channel-list">${channelData.map(([label, share], i) => `<div><span><i style="background:${colors[i]}"></i>${label}</span><strong>${share}%</strong><small>${money(d.total * share / 100)}</small></div>`).join('')}</div>
          </div>
          <div class="bi-channel-insight"><span>${icon('spark')}</span><p><strong>Una oportunidad en cada dato</strong>El canal digital aporta ${money(d.total * 0.34)}. Conecte ventas y campañas para descubrir su próximo paso.</p></div>
        </article>`;
      }

      function channelTable(d) {
        return `<div class="bi-detail-table"><div class="bi-viz-heading"><div><span class="bi-caption">DETALLE EXPLORABLE</span><h4>Los números detrás de cada canal</h4></div></div><table><caption class="sr-only">Ingresos de ejemplo por canal</caption><thead><tr><th scope="col">Canal</th><th scope="col">Ingresos</th><th scope="col">Participación</th></tr></thead><tbody>${channelData.map(([label, share]) => `<tr><th scope="row">${label}</th><td>${money(d.total * share / 100)}</td><td><span class="bi-table-meter"><i style="width:${share}%"></i></span>${share}%</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row">Total</th><td>${money(d.total)}</td><td>100%</td></tr></tfoot></table><p>Región: ${state.region} · ${state.period === '6' ? 'Enero a junio' : 'Abril a junio'}. Cambie los filtros para actualizar este detalle.</p></div>`;
      }

      function metrics(d) {
        const entries = [
          ['Ingresos', money(d.total), 'Millones COP', '↗'],
          ['Órdenes', fmt(d.orders), 'En el período', '▦'],
          ['Ticket promedio', '$' + fmt(Math.round(d.total * 1000000 / d.orders)), 'COP por orden', '◈'],
          ['Avance de meta', fmt(d.total / d.target * 100) + '%', 'Meta: ' + money(d.target), '◎']
        ];
        return `<div class="bi-metrics">${entries.map(([label, value, note, symbol], i) => `<div class="bi-metric${i === 0 ? ' bi-metric-primary' : ''}"><span class="bi-metric-label">${label}<i aria-hidden="true">${symbol}</i></span><strong>${value}</strong><small>${note}</small></div>`).join('')}</div>`;
      }

      function visualizations(d) {
        return state.sheet === 'detail' ? channelTable(d) : `<div class="bi-visualizations">${state.order.map(id => id === 'trend' ? trend(d) : channels(d)).join('')}</div>`;
      }

      function sheetButtons(position = '') {
        return `<div class="bi-sheets ${position}" role="group" aria-label="Páginas del reporte"><button type="button" data-bi-sheet="overview" aria-pressed="${state.sheet === 'overview'}">${displayedPlatform === 3 ? 'Dashboard 1' : 'Resumen de ventas'}</button><button type="button" data-bi-sheet="detail" aria-pressed="${state.sheet === 'detail'}">${displayedPlatform === 3 ? 'Detalle por canal' : 'Detalle de canales'}</button></div>`;
      }

      function exportButton() {
        return `<button type="button" class="bi-export" data-bi-export aria-label="Exportar datos de ejemplo en CSV">${icon('download')}<span>Exportar CSV</span></button>`;
      }

      function powerBI(d) {
        return `<div class="bi-appbar">${logo(0)}<strong>Power BI</strong><span class="bi-appbar-divider"></span><span>NOVA Commerce</span><span class="bi-appbar-spacer"></span><span class="bi-app-avatar">TG</span></div>
          <div class="bi-ribbon"><span class="bi-ribbon-active">Informe</span><span>Vista de lectura</span><span class="bi-ribbon-spacer"></span>${exportButton()}</div>
          <div class="bi-power-workspace"><div class="bi-iconrail" aria-hidden="true"><span class="is-current">${icon('chart')}</span><span>${icon('database')}</span><span>${icon('link')}</span></div>
          <div class="bi-report"><div class="bi-report-heading"><div><span class="bi-caption">NOVA COMMERCE</span><h3>Panorama comercial</h3><p>De sus datos a su próxima decisión.</p></div><span class="bi-report-tag">REPORTE DEMO</span></div>${metrics(d)}${visualizations(d)}${sheetButtons()}</div>
          <aside class="bi-filterpane"><h4>${icon('chart')}Filtros</h4><p>Filtros en esta página</p>${regionFilter()}${periodFilter()}<div class="bi-filter-info"><span>Fuente de datos</span><strong>NOVA · Ventas</strong><small>Conjunto de ejemplo<br>Actualización simulada</small></div><button type="button" class="bi-reset" data-bi-reset>Restablecer filtros</button></aside></div>`;
      }

      function looker(d) {
        return `<div class="bi-appbar">${logo(1)}<div class="bi-document-title"><strong>NOVA · Marketing & Sales</strong><small>Looker Studio <span>›</span> Informe de ejemplo</small></div><span class="bi-appbar-spacer"></span><span class="bi-cloud-check">${icon('cloud')}</span>${exportButton()}</div>
          <div class="bi-looker-nav">${sheetButtons()}<span class="bi-looker-view">Vista del informe</span></div>
          <div class="bi-report"><div class="bi-report-heading"><div><span class="bi-caption">N O V A / BUSINESS ANALYTICS</span><h3>Su negocio, en perspectiva.</h3><p>Lo que importa, a simple vista.</p></div><div class="bi-topfilters">${regionFilter()}${periodFilter()}</div></div>${metrics(d)}${visualizations(d)}<div class="bi-looker-footer"><span>Diseñado para conectar ideas y resultados.</span><span>TEGGNAR × NOVA</span></div></div>`;
      }

      function qlik(d) {
        return `<div class="bi-appbar">${logo(2)}<strong>Qlik Sense</strong><span class="bi-appbar-divider"></span><span>Sales performance</span><span class="bi-appbar-spacer"></span><span class="bi-qlik-sheet-label">Hoja de análisis</span></div>
          <div class="bi-selectionbar"><div class="bi-selection-count"><span>${state.region === 'Todas' ? '1' : '2'}</span> ${state.region === 'Todas' ? 'selección' : 'selecciones'}</div><span class="bi-qlik-chip">${state.region === 'Todas' ? 'Todas las regiones' : state.region}<small>Región</small></span><span class="bi-qlik-chip">${state.period === '6' ? 'Ene – Jun' : 'Abr – Jun'}<small>Período</small></span><button type="button" class="bi-reset" data-bi-reset>Limpiar selecciones</button></div>
          <div class="bi-report"><div class="bi-report-heading"><div><span class="bi-caption">NOVA COMMERCE / EXECUTIVE VIEW</span><h3>Explore. Relacione. Descubra.</h3><p>Una selección abre una nueva perspectiva.</p></div>${exportButton()}</div><div class="bi-qlik-filterrow">${regionFilter()}${periodFilter()}${sheetButtons()}</div>${metrics(d)}${visualizations(d)}</div>`;
      }

      function tableau(d) {
        return `<div class="bi-appbar">${logo(3)}<strong>Tableau</strong><span class="bi-appbar-divider"></span><span>NOVA - Sales workbook</span><span class="bi-appbar-spacer"></span>${exportButton()}</div>
          <div class="bi-tableau-menubar" aria-hidden="true"><span>Archivo</span><span>Datos</span><span>Hoja de trabajo</span><span>Dashboard</span><span>Análisis</span><span>Mapa</span></div>
          <div class="bi-tableau-workspace"><aside class="bi-datapane"><div class="bi-datapane-tabs"><strong>Datos</strong><span>Análisis</span></div><div class="bi-datasource">${icon('database')}NOVA Commerce</div><small>Dimensiones</small><p><i>Abc</i>Canal</p><p><i>Abc</i>Región</p><p><i>▦</i>Mes</p><hr><small>Medidas</small><p><i>#</i>Ingresos</p><p><i>#</i>Órdenes</p><p><i>#</i>Meta</p><div class="bi-tableau-marks"><strong>Marcas</strong><span>${state.chartMode === 'line' ? '╱ Línea' : '▥ Barra'}</span><div><span>◉ Color</span><span>▣ Tamaño</span><span>Abc Etiqueta</span></div></div></aside>
          <div class="bi-tableau-main"><div class="bi-shelf"><span>Columnas</span><b class="bi-shelf-dimension">MES (Fecha)</b></div><div class="bi-shelf"><span>Filas</span><b class="bi-shelf-measure">SUM (Ingresos)</b></div><div class="bi-report"><div class="bi-report-heading"><div><h3>NOVA | Sales overview</h3><p>Una historia de crecimiento, contada con datos.</p></div></div><div class="bi-tableau-filters">${regionFilter()}${periodFilter()}</div>${metrics(d)}${visualizations(d)}</div>${sheetButtons()}</div></div>`;
      }

      function drawApp() {
        if (destroyed) return;
        displayedPlatform = state.platform;
        const app = $('.bi-app');
        app.className = 'bi-app bi-' + keys[state.platform];
        app.setAttribute('aria-label', 'Réplica demostrativa de ' + names[state.platform]);
        app.innerHTML = [powerBI, looker, qlik, tableau][state.platform](data());
        host.querySelectorAll('[data-bi-platform]').forEach(button => {
          button.setAttribute('aria-pressed', String(+button.dataset.biPlatform === state.platform));
        });
      }

      function redraw(focusSelector) {
        cancelTransition();
        drawApp();
        if (focusSelector) $(focusSelector)?.focus({ preventScroll: true });
      }

      function switchPlatform(platform) {
        if (!Number.isInteger(platform) || platform < 0 || platform > 3 || platform === state.platform) return;
        cancelTransition();
        state.platform = platform;
        host.querySelectorAll('[data-bi-platform]').forEach(button => button.setAttribute('aria-pressed', String(+button.dataset.biPlatform === platform)));
        const stage = $('.bi-stage');
        announce('Vista demostrativa de ' + names[platform] + '.');
        if (paused || ctx.isPaused() || !stage.animate) { drawApp(); return; }
        const token = transitionToken;
        stage.setAttribute('aria-busy', 'true');
        animations.push(stage.animate([
          { transform: 'rotateY(0deg) scale(1)', opacity: 1, filter: 'brightness(1)' },
          { transform: 'rotateY(88deg) scale(.96)', opacity: .25, filter: 'brightness(.72)' }
        ], { duration: 230, easing: 'cubic-bezier(.55,.06,.68,.19)', fill: 'forwards' }));
        later(() => {
          if (token !== transitionToken) return;
          drawApp();
          animations.forEach(animation => animation.cancel());
          animations = [stage.animate([
            { transform: 'rotateY(-88deg) scale(.96)', opacity: .25, filter: 'brightness(.72)' },
            { transform: 'rotateY(0deg) scale(1)', opacity: 1, filter: 'brightness(1)' }
          ], { duration: 340, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'both' })];
          later(() => {
            animations.forEach(animation => animation.cancel());
            animations = [];
            stage.removeAttribute('aria-busy');
          }, 350);
        }, 240);
      }

      function download() {
        const d = data();
        const csv = '\uFEFFMes,Region,Ventas_COP\r\n' + d.labels.map((label, i) => [label, state.region, Math.round(d.values[i] * 1000000)].join(',')).join('\r\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'teggnar-' + keys[state.platform] + '-demo.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        const cleanup = window.setTimeout(() => {
          URL.revokeObjectURL(url);
          downloads.delete(url);
        }, 1000);
        downloads.set(url, cleanup);
        announce('Descarga iniciada: datos ficticios del dashboard, con los filtros actuales.');
      }

      function onClick(event) {
        const button = event.target.closest('button');
        if (!button || !host.contains(button)) return;
        const d = button.dataset;
        if (d.biPlatform !== undefined) switchPlatform(+d.biPlatform);
        else if (d.biMode) {
          state.chartMode = d.biMode;
          redraw(`[data-bi-mode="${state.chartMode}"]`);
          announce('Gráfico de ' + (state.chartMode === 'line' ? 'línea' : 'barras') + ' seleccionado.');
        } else if (d.biMonth !== undefined) {
          state.month = +d.biMonth;
          redraw(`[data-bi-month="${state.month}"]`);
          const current = data();
          announce(current.labels[current.selected] + ': ' + money(current.values[current.selected]) + ' en ventas de ejemplo.');
        } else if (d.biReorder) {
          state.order.reverse();
          redraw(`[data-bi-reorder="${d.biReorder}"]`);
          announce('Posición de los gráficos actualizada.');
        } else if (d.biSheet) {
          state.sheet = d.biSheet;
          redraw(`[data-bi-sheet="${state.sheet}"]`);
          announce(state.sheet === 'overview' ? 'Resumen de ventas seleccionado.' : 'Detalle por canal seleccionado.');
        } else if (button.hasAttribute('data-bi-export')) download();
        else if (button.hasAttribute('data-bi-reset')) {
          state.region = 'Todas'; state.period = '6'; state.month = 5;
          redraw('[data-bi-reset]'); announce('Filtros restablecidos.');
        }
      }

      function onChange(event) {
        const filter = event.target.dataset.biFilter;
        if (filter !== 'region' && filter !== 'period') return;
        if (filter === 'region' && !regions.includes(event.target.value)) return;
        if (filter === 'period' && !['3', '6'].includes(event.target.value)) return;
        state[filter] = event.target.value;
        if (state.period === '3') state.month = Math.max(3, state.month);
        redraw(`[data-bi-filter="${filter}"]`);
        announce('Dashboard actualizado: ' + state.region + ', ' + state.period + ' meses.');
      }

      function onDragStart(event) {
        const card = event.target.closest('[data-bi-card]');
        if (!card) return;
        if (event.target.closest('button, input, select')) { event.preventDefault(); return; }
        draggedCard = card.dataset.biCard;
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', draggedCard);
        }
      }

      function onDragOver(event) {
        if (draggedCard && event.target.closest('[data-bi-card]')) event.preventDefault();
      }

      function onDrop(event) {
        const card = event.target.closest('[data-bi-card]');
        if (draggedCard && card && card.dataset.biCard !== draggedCard) {
          event.preventDefault(); state.order.reverse(); redraw(); announce('Posición de los gráficos actualizada.');
        }
        draggedCard = null;
      }

      function onDragEnd() { draggedCard = null; }

      host.innerHTML = `<div class="bi-demo"><div class="bi-switcher-row"><div><span class="bi-eyebrow">UN NEGOCIO. CUATRO PERSPECTIVAS.</span><p>Elija su plataforma. Explore lo que puede hacer.</p></div><span class="bi-interactive-label"><i></i>Demo interactiva</span></div>${platformSelector()}<div class="bi-perspective"><div class="bi-stage"><div class="bi-app"></div></div></div><div class="bi-demo-footer"><p>Réplicas demostrativas con datos ficticios. No son aplicaciones nativas ni implican afiliación con sus fabricantes.</p><span>${icon('grip')}Reordene los gráficos</span></div></div>`;
      drawApp();
      host.addEventListener('click', onClick);
      host.addEventListener('change', onChange);
      host.addEventListener('dragstart', onDragStart);
      host.addEventListener('dragover', onDragOver);
      host.addEventListener('drop', onDrop);
      host.addEventListener('dragend', onDragEnd);

      return {
        destroy() {
          destroyed = true;
          cancelTransition();
          downloads.forEach((timer, url) => {
            window.clearTimeout(timer);
            URL.revokeObjectURL(url);
          });
          downloads.clear();
          host.removeEventListener('click', onClick);
          host.removeEventListener('change', onChange);
          host.removeEventListener('dragstart', onDragStart);
          host.removeEventListener('dragover', onDragOver);
          host.removeEventListener('drop', onDrop);
          host.removeEventListener('dragend', onDragEnd);
        },
        setPaused(value) {
          if (paused === value) return;
          paused = value;
          if (value && (animations.length || timeouts.length)) { cancelTransition(); drawApp(); }
        },
        getContext() { return 'Dashboards en ' + names[state.platform]; }
      };
    }
  };
})();
