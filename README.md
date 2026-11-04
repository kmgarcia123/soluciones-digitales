# TEGGNAR · Página web

Página de presentación y portafolio de TEGGNAR: dashboards, automatización de procesos e integración de datos para pymes.

Publicada en Vercel. **Cada cambio en la rama `main` se publica solo** en uno o dos minutos.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Página principal |
| `privacidad.html` | Política de tratamiento de datos (borrador, revisar con abogado) |
| `styles.css` | Estilos y colores |
| `demo-lab.js` | Estado e interacciones de las cinco demos locales |
| `demo-lab.css` | Diseño glass y adaptación responsive del laboratorio |
| `demo-orbit.js` | Decoración Three.js opcional con carga diferida |
| `favicon.svg`, `og-image.png` | Ícono y vista previa al compartir |
| `vercel.json` | Configuración de Vercel (URLs limpias) |
| `robots.txt`, `sitemap.xml` | Para que Google encuentre la página |

## Laboratorio interactivo (portafolio)

La sección `#portafolio` muestra cinco demos dentro de la página, sin ventanas emergentes:

- **Dashboards:** cuatro plataformas conceptuales (Power BI, Looker Studio, Qlik Sense, Tableau), región/período, gráficos de líneas o barras, selección de mes, reordenamiento de tarjetas y exportación CSV.
- **WhatsApp:** conversación de ejemplo con respuestas guiadas. No usa WhatsApp ni un modelo de IA real; no envía mensajes ni guarda texto fuera del navegador.
- **Datos y nube:** flujo simulado de cuatro etapas con volumen seleccionable.
- **Automatización:** tres escenarios con volumen y estimación explícita de horas, más ejecución de pasos.
- **CRM:** oportunidades ficticias, cambios de etapa por selector, botón o arrastre; métricas recalculadas.

Los datos se mantienen en memoria durante la visita. Recargar reinicia la demo. La llamada a contacto conserva cualquier mensaje que el visitante ya haya escrito y agrega el servicio explorado. Las plataformas BI son vistas conceptuales propias, no embeds ni integraciones nativas.

### Diseño y rendimiento

HTML/CSS/JavaScript nativo, sin compilación ni framework adicional. Three.js 0.180.0 se carga desde jsDelivr únicamente al entrar el laboratorio en pantalla, en escritorio y con movimiento habilitado. Pausa al salir de pantalla o esconder la pestaña. Si falla CDN/WebGL, queda una ilustración CSS y las demos siguen funcionando. No carga 3D en móvil (hasta 700 px) ni al preferir movimiento reducido. Si se agrega CSP, permitir https://cdn.jsdelivr.net en script-src o alojar localmente el módulo y su dependencia core.

El selector de servicios permite flechas, Home/End y Tab. Arrastre siempre tiene alternativa con controles. Los estilos incluyen 320 px, móvil, tableta y escritorio, y respetan prefers-reduced-motion.

### Probar antes de publicar

Servir esta carpeta con un servidor HTTP estático y abrir /#portafolio. Comprobar filtros y CSV, conversación/reinicio, ejecución de datos/automatización, cambios del CRM, teclado y anchos 320/390/768/1440. Revisar la consola del navegador. Las demos no requieren backend ni credenciales.

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
