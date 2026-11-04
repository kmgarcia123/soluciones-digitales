/* Service lifecycle, keyboard navigation and motion preferences. */
(() => {
  'use strict';
  const root = document.getElementById('demo-lab');
  if (!root) return;
  const panel = document.getElementById('lab-panel');
  const tabs = [...root.querySelectorAll('[data-lab-tab]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = document.getElementById('lab-motion');
  const views = {
    analytics: ['Cuatro plataformas. Su próxima gran decisión.', 'Explore cada interfaz, filtre los datos y descubra cómo se vería su información.'],
    whatsapp: ['Una conversación que pone todo en marcha.', 'Observe cómo un mensaje recorre su negocio. O tome el control y pruebe el asistente.'],
    data: ['La arquitectura detrás de cada posibilidad.', 'De sus fuentes a la nube y de la nube a las decisiones. Recorra el camino de un dato.'],
    automation: ['Ese trabajo manual tiene otra forma de hacerse.', 'Excel, documentos, aplicaciones y datos: ejecute un proceso y vea qué entrega.'],
    crm: ['De un primer hola a una relación que crece.', 'Siga cada oportunidad, active el recorrido comercial y vea qué ocurre en cada etapa.']
  };
  let active = 'analytics', instance, userPaused = reduced.matches, inView = false;
  const fmt = value => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(value);
  const announce = message => { document.getElementById('lab-status').textContent = message; };
  const paths = {
    chart: '<path d="M4 19h16M7 15v-5m5 5V5m5 10v-7"/>',
    cloud: '<path d="M7 18a5 5 0 1 1 1-9 6 6 0 0 1 11 3 3 3 0 0 1-1 6Z"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    link: '<path d="m9 15 6-6M8 16l-2 2a4 4 0 0 1-4-7l4-4a4 4 0 0 1 6 0m0 1 2-2a4 4 0 0 1 7 4l-4 4a4 4 0 0 1-6 0"/>',
    send: '<path d="m3 3 18 9-18 9 4-9-4-9Zm4 9h14"/>',
    bot: '<rect x="4" y="7" width="16" height="14" rx="5"/><path d="M12 7V3m-3 10h.01M15 13h.01M9 17h6"/>',
    grip: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/>',
    download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
    file: '<path d="M14 3H5v18h14V8zM14 3v5h5M8 12h8M8 16h6"/>',
    code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };
  const isPaused = () => userPaused || reduced.matches || !inView || document.hidden;
  const context = {
    fmt, money: value => '$' + fmt(value) + ' M', announce, isPaused,
    icon: name => '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.spark) + '</svg>'
  };
  function syncMotion() {
    root.classList.toggle('lab-motion-paused', userPaused || reduced.matches);
    root.classList.toggle('lab-away', !inView || document.hidden);
    motionButton.setAttribute('aria-pressed', String(userPaused || reduced.matches));
    motionButton.textContent = userPaused || reduced.matches ? 'Activar animaciones' : 'Pausar animaciones';
    motionButton.disabled = reduced.matches;
    if (reduced.matches) motionButton.textContent = 'Movimiento reducido';
    motionButton.setAttribute('aria-label', motionButton.textContent);
    instance?.setPaused?.(isPaused());
  }
  function activate(name, focus = false) {
    if (!views[name]) return;
    instance?.destroy?.();
    active = name;
    tabs.forEach(tab => {
      const selected = tab.dataset.labTab === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus({ preventScroll: true });
    });
    panel.dataset.view = name;
    panel.removeAttribute('data-platform');
    panel.setAttribute('aria-labelledby', 'lab-tab-' + name);
    document.getElementById('lab-title').textContent = views[name][0];
    document.getElementById('lab-description').textContent = views[name][1];
    panel.innerHTML = '';
    const module = window.TeggnarDemos?.[name];
    if (module) instance = module.mount(panel, context);
    else { instance = null; panel.textContent = 'Esta demo no pudo cargar. Recargue la página para volver a intentarlo.'; }
    syncMotion();
    announce('Demo de ' + tabs.find(tab => tab.dataset.labTab === name).textContent.trim().replace(/\s+/g, ' ') + ' seleccionada.');
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => { if (active !== tab.dataset.labTab) activate(tab.dataset.labTab); });
    tab.addEventListener('keydown', event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : undefined;
      if (next === undefined) return;
      event.preventDefault();
      activate(tabs[next].dataset.labTab, true);
      tabs[next].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    });
  });
  motionButton.addEventListener('click', () => { userPaused = !userPaused; syncMotion(); });
  reduced.addEventListener('change', event => { userPaused = event.matches; syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    syncMotion();
  }, { threshold: 0.08 }).observe(panel);
  else inView = true;
  document.getElementById('lab-contact').addEventListener('click', () => {
    const field = document.querySelector('#form-contacto textarea[name="mensaje"]');
    const selection = instance?.getContext?.() || views[active][0];
    const message = 'Exploré la demo de TEGGNAR y quiero conocer una solución de ' + selection + ' para mi empresa.';
    if (field && !field.value.includes(message)) field.value = field.value.trim() ? field.value.trim() + '\n\n' + message : message;
  });
  activate(active);
})();
