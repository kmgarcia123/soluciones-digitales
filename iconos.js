/* =====================================================================
   ÍCONOS TEGGNAR · estilo "mini escenas" (opción A, aprobada 3 nov 2026)
   - Trazo de 2 px, relleno suave del mismo color (.duo) y la parte que
     se mueve en turquesa (.acc / .acc-f).
   - La animación se activa sola según el contexto (ver styles.css,
     sección "Íconos animados"): nodo del mapa seleccionado, paso activo
     del simulador, panel del mapa, actividad nueva del tablero.
   Uso: TGI('gerencia') devuelve el <svg> listo para insertar.
   ===================================================================== */
(function () {
  const P = {
    /* ---- Mapa de soluciones ---- */
    gerencia: '<rect class="duo" x="3" y="4" width="18" height="12" rx="2"/><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>' +
      '<rect class="acc-f a-bar" x="7" y="9" width="2.2" height="4" rx=".6"/><rect class="acc-f a-bar d2" x="10.9" y="7.5" width="2.2" height="5.5" rx=".6"/><rect class="acc-f a-bar d3" x="14.8" y="8.5" width="2.2" height="4.5" rx=".6"/>',
    comercial: '<path class="duo" d="M3 17l6-6 4 4 8-8v13H3z"/><path d="M3 21h18" opacity=".45"/><path class="acc a-draw" pathLength="1" d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    servicio: '<path class="duo" d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>' +
      '<circle class="acc-f a-blink" cx="9" cy="12" r="1.25"/><circle class="acc-f a-blink d2" cx="13" cy="12" r="1.25"/><circle class="acc-f a-blink d3" cx="17" cy="12" r="1.25"/>',
    finanzas: '<rect class="duo" x="2" y="9" width="20" height="12" rx="2"/><rect x="2" y="9" width="20" height="12" rx="2"/><path d="M2 13h20M6 17.5h4"/>' +
      '<g class="a-drop"><circle class="acc" cx="17" cy="4.5" r="2.6"/><path class="acc" d="M17 3.4v2.2" stroke-width="1.6"/></g>',
    operaciones: '<path class="duo" d="M4 21V9l8-5 8 5v12z"/><path d="M2 21h20M4 21V9l8-5 8 5v12"/>' +
      '<rect class="acc-f a-blink" x="7.5" y="10.5" width="3" height="3" rx=".5"/><rect class="acc-f a-blink d2" x="13.5" y="10.5" width="3" height="3" rx=".5"/><rect class="acc-f a-blink d3" x="7.5" y="15.5" width="3" height="3" rx=".5"/><path d="M13.5 21v-5h3v5"/>',
    compras: '<g class="a-move"><path class="duo" d="M3 6h11v10H3z"/><path d="M3 6h11v10H3zM14 9h4l3 3.5V16h-7"/><circle cx="7" cy="17.5" r="2" fill="currentColor" fill-opacity=".14"/><circle cx="17" cy="17.5" r="2" fill="currentColor" fill-opacity=".14"/></g>' +
      '<path class="acc a-dash" d="M1 22h22" stroke-dasharray="3 3"/>',
    talento: '<circle class="duo" cx="9" cy="8" r="3.5"/><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 11.5a3.5 3.5 0 0 0 1.4-.3M21.5 20a6.5 6.5 0 0 0-4-6" opacity=".55"/>' +
      '<g class="a-pop"><circle class="acc-f" cx="18.5" cy="6" r="3.4"/><path d="M18.5 4.6v2.8M17.1 6h2.8" stroke="#fff" stroke-width="1.6"/></g>',
    calidad: '<path class="duo" d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path class="acc a-draw" pathLength="1" d="M8.5 12l2.5 2.5 4.5-5"/>',

    /* ---- Simulador de automatización ---- */
    correo: '<rect class="duo" x="3" y="8" width="18" height="13" rx="2"/><rect x="3" y="8" width="18" height="13" rx="2"/><path d="m3 10 9 6 9-6"/>' +
      '<g class="a-drop"><path class="acc" d="M12 1.5v5M9.5 4.5 12 7l2.5-2.5"/></g>',
    validacion: '<rect class="duo" x="5" y="4" width="14" height="17" rx="2"/><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4"/><path class="acc a-draw" pathLength="1" d="M8.5 13l2.5 2.5 4.5-5"/>',
    consolidacion: '<path class="acc a-dash" d="M1 8.5h5M1 12.5h5M1 16.5h5" stroke-dasharray="2 2"/><path class="duo" d="M9 6v12c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6z"/>' +
      '<ellipse cx="15" cy="6" rx="6" ry="2.5"/><path d="M9 6v12c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6M9 12c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5"/>',
    aprobacion: '<path class="duo" d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path class="acc a-draw" pathLength="1" d="M8.5 12l2.5 2.5 4.5-5"/>',
    envio: '<path class="acc a-dash" d="M2 21l5-5" stroke-dasharray="2 2"/><g class="a-fly"><path class="duo" d="M22 2 15 22l-4-9-9-4z"/><path d="M22 2 15 22l-4-9-9-4zM22 2 11 13"/></g>',

    /* ---- Actividad del tablero ---- */
    pago: '<circle class="duo" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M14.6 9.4c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2s1.1 1.6 2.6 2 2.6.9 2.6 2.1-1.1 2-2.6 2c-1.1 0-2.1-.5-2.6-1.4M12 6v2M12 16.1V18"/>',
    factura: '<path class="duo" d="M6 3h8l4 4v14H6z"/><path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h4"/>',
    alerta: '<path class="duo" d="M12 3 2 20h20z"/><path d="M12 3 2 20h20zM12 10v4M12 17h.01"/>',
    listo: '<circle class="duo" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    sync: '<path d="M20.5 12a8.5 8.5 0 0 1-14.6 5.9M3.5 12A8.5 8.5 0 0 1 18.1 6.1"/><path d="M18.5 2v4.3h-4.3M5.5 22v-4.3h4.3"/>',
    global: '<circle class="duo" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3z"/>'
  };
  window.TGI = function (name, extra) {
    return '<svg class="tgi' + (extra ? ' ' + extra : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>';
  };
})();
