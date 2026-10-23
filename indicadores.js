/* =====================================================================
   INDICADORES FINANCIEROS REALES (franja superior del tablero)

   - El dólar (TRM) se actualiza SOLO desde datos.gov.co (Superfinanciera).
   - Inflación y tasa del Banco de la República cambian una vez al mes:
     actualícelos aquí cuando salga el dato nuevo.
       · Inflación: DANE publica el IPC hacia el día 8 de cada mes.
       · Tasa BanRep: cambia solo en reuniones de la Junta Directiva.
   - "trmRespaldo" se muestra únicamente si datos.gov.co no responde.
   ===================================================================== */

window.INDICADORES = {
  inflacion: { valor: 6.29, periodo: 'sep 2026', fuente: 'DANE' },
  tasaBanRep: { valor: 12.25, desde: '30 sep 2026', fuente: 'Banco de la República' },
  trmRespaldo: { valor: 3191.47, fecha: '2026-10-22' }
};
