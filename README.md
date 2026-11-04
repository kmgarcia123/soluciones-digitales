# TEGGNAR · Página web

Página de presentación y portafolio de TEGGNAR: dashboards, automatización de procesos e integración de datos para pymes.

Publicada en Vercel. **Cada cambio en la rama `main` se publica solo** en uno o dos minutos.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Página principal |
| `privacidad.html` | Política de tratamiento de datos (borrador, revisar con abogado) |
| `styles.css` | Estilos y colores |
| `demo-lab.js` | Navegación y ciclo de vida de las cinco demos locales |
| `demo-lab.css` | Diseño glass y adaptación responsive del laboratorio |
| `demo-analytics.js`, `demo-analytics.css` | Cuatro interfaces BI y transición de giro 3D |
| `demo-journeys.js`, `demo-journeys.css` | Conversación de WhatsApp y mapa de arquitectura |
| `demo-operations.js`, `demo-operations.css` | Automatización con resultados y workspace CRM |
| `demo-orbit.js` | Decoración Three.js opcional con carga diferida |
| `favicon.svg`, `og-image.png` | Ícono y vista previa al compartir |
| `vercel.json` | Configuración de Vercel (URLs limpias) |
| `robots.txt`, `sitemap.xml` | Para que Google encuentre la página |

## Laboratorio interactivo (portafolio)

La sección `#portafolio` muestra cinco demos dentro de la página, sin ventanas emergentes:

- **Dashboards:** interfaces demostrativas distintas de Power BI (filtros y navegación lateral), Looker Studio (lienzo de informe), Qlik Sense (selecciones) y Tableau (estantes y panel de datos). Giro 3D al cambiar; filtros, líneas/barras, selección de mes, páginas de resumen/detalle, reordenamiento y CSV funcionan con los mismos datos de ejemplo.
- **WhatsApp:** historias automáticas de ventas, soporte y agenda sincronizadas con un flujo de cuatro pasos. Mensajes con aparición animada y tarjetas de contexto; el visitante puede pausar, avanzar o escribir para tomar el control. No usa WhatsApp ni IA real, ni reserva citas.
- **Arquitectura:** diagrama navegable de fuentes, integración, nube, calidad y consumo (dashboards, machine learning o apps). Azure, Google Cloud y AWS cambian los servicios del modelo. El recorrido resalta nodos y conexiones; en móvil el mapa se organiza verticalmente.
- **Automatización:** consolidación de Excel con deduplicación/CSV, extracción ilustrativa de PDF con revisión humana/JSON, app de pedidos filtrable inspirada en Streamlit y recorrido Bronze/Silver/Gold de Databricks. No ejecuta Python, OCR ni servicios cloud reales.
- **CRM:** workspace con cuatro etapas, detalles, actividad, responsables y métricas; mover oportunidades por selector, botón o arrastre y recorrer un lead ficticio desde WhatsApp hasta el cierre, sin duplicados.

Los datos se mantienen en memoria durante la visita y al cambiar de pestaña. Recargar reinicia la demo. Cada módulo libera temporizadores y eventos al salir. La llamada a contacto conserva cualquier mensaje que el visitante ya haya escrito y agrega el servicio explorado. Las interfaces BI son réplicas demostrativas, no aplicaciones nativas ni afiliaciones con sus fabricantes.

### Diseño y rendimiento

HTML/CSS/JavaScript nativo, sin compilación ni framework adicional. Three.js 0.180.0 se carga desde jsDelivr únicamente al entrar el laboratorio en pantalla, en escritorio y con movimiento habilitado. Pausa al salir de pantalla o esconder la pestaña. Si falla CDN/WebGL, queda una ilustración CSS y las demos siguen funcionando. No carga 3D en móvil (hasta 700 px) ni al preferir movimiento reducido. Si se agrega CSP, permitir https://cdn.jsdelivr.net en script-src o alojar localmente el módulo y su dependencia core.

El selector de servicios permite flechas, Home/End y Tab. Arrastre siempre tiene alternativa con controles. Los estilos incluyen 320 px, móvil, tableta y escritorio. Las historias se pausan fuera de pantalla, en pestañas ocultas y con movimiento reducido; se pueden recorrer manualmente. Las preferencias de movimiento reducido desactivan el giro y los efectos.

### Probar antes de publicar

Servir esta carpeta con un servidor HTTP estático y abrir /#portafolio. Comprobar giro y filtros persistentes entre plataformas, CSV, historias/chat/reinicio, cambio de nube y destino, aprobación PDF, consolidado Excel, filtros de app, movimientos del CRM, teclado y anchos 320/390/768/1440. Revisar consola, pausa global y cambio de pestaña durante una ejecución. Las demos no requieren backend ni credenciales.

Referencias de interfaz: [Power BI](https://learn.microsoft.com/en-us/power-bi/create-reports/service-the-report-editor-take-a-tour), [Looker Studio](https://support.google.com/looker-studio/answer/06292570?hl=en), [Qlik Sense](https://help.qlik.com/en-US/sense/May2025/Subsystems/Hub/Content/Sense_Hub/Sheets/sheet-view.htm) y [Tableau](https://help.tableau.com/current/pro/desktop/en-us/environment_workspace.htm).

### Referencias de diseño

Recorrido conversacional inspirado en [Atom](https://atomchat.io/); lenguaje de superficies y movimiento explorado en [React Bits](https://reactbits.dev/). No se copió código de esos sitios ni se añadió React. El detalle 3D sigue las recomendaciones de [renderizado bajo demanda de Three.js](https://threejs.org/manual/en/rendering-on-demand.html). Aura.js se evaluó pero no se añadió como dependencia.

## Datos de contacto y formulario

Al final de `index.html`, en el bloque `CONFIG`: número de WhatsApp, correo y `crm` (dirección del CRM).

## Formulario y CRM

- **Mientras `crm` esté vacío:** al enviar el formulario se abre WhatsApp (número de `CONFIG.whatsapp`) con los datos ya escritos. No se pierde ningún contacto.
- **Cuando el CRM exista:** pegue en `crm` la URL que recibe las solicitudes (ej. `https://crm.teggnar.com/api/leads`). El formulario envía un `POST` con `Content-Type: application/json`:

```json
{
  "nombre": "Ana Pérez",
  "empresa": "Constructora X",
  "correo": "ana@empresa.co",
  "telefono": "",
  "mensaje": "Quiero automatizar el informe de cartera",
  "autorizacion_datos": true,
  "autorizacion_fecha": "2026-11-03T20:13:57.006Z",
  "origen": "teggnar.com · formulario de contacto",
  "pagina": "https://teggnar.com/?utm_source=linkedin",
  "utm": { "source": "linkedin", "medium": "", "campaign": "" }
}
```

  Requisitos del CRM: responder `2xx` si guardó la solicitud (cualquier otro código muestra el mensaje de error) y permitir CORS desde `https://teggnar.com` y `https://www.teggnar.com` (incluida la petición `OPTIONS`). Guardar `autorizacion_fecha`: es la prueba de la autorización de datos que pide la Ley 1581.
- Los mensajes del diagnóstico rápido, el mapa y las demos llegan dentro de `mensaje`.
- El campo oculto `_gotcha` atrapa bots: si viene lleno, no se envía nada.

## Indicadores financieros reales (tablero de la portada)

- **Dólar (TRM):** se actualiza solo desde datos.gov.co (Superfinanciera). No hay que hacer nada.
- **Inflación y tasa del Banco de la República:** cambian una vez al mes. Actualízalas en `indicadores.js`:
  - Inflación: DANE publica el IPC hacia el día 8 de cada mes.
  - Tasa BanRep: cambia solo cuando la Junta Directiva lo decide.
- Si datos.gov.co no responde, el tablero muestra el último dato guardado y lo indica.
