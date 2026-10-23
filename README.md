# Soluciones TI · Página web

Página de presentación y portafolio de Soluciones TI: dashboards, automatización de procesos e integración de datos para pymes.

Publicada en Vercel. **Cada cambio en la rama `main` se publica solo** en uno o dos minutos.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Página principal |
| `privacidad.html` | Política de tratamiento de datos (borrador, revisar con abogado) |
| `styles.css` | Estilos y colores |
| `demos.js` | **Enlaces de las demos del portafolio** |
| `favicon.svg`, `og-image.png` | Ícono y vista previa al compartir |
| `vercel.json` | Configuración de Vercel (URLs limpias) |

## Cómo publicar una demo (para Juan)

1. **Publica el dashboard** con datos ficticios:
   - **Power BI:** en Power BI Service abre el informe → *Archivo → Insertar informe → Publicar en la web (público)* → copia el enlace (`https://app.powerbi.com/view?r=...`).
   - **Looker Studio:** *Compartir → Insertar informe* → activa la inserción → copia la URL de inserción.
   - **Video** (YouTube, Vimeo o Loom): copia el enlace normal del video.
2. En GitHub abre `demos.js` → lápiz ✏️.
3. Pega el enlace en `url` de la demo que corresponda. Usa `tipo: 'video'` para videos y `tipo: 'enlace'` si debe abrir en otra pestaña.
4. *Commit changes*. En un par de minutos la tarjeta muestra **Demo disponible** y el botón **Ver demo** abre el dashboard dentro de la página.

> Los enlaces "Publicar en la web" son públicos. Nunca uses datos reales de clientes o empleadores.

## Datos de contacto y formulario

Al final de `index.html`, en el bloque `CONFIG`: número de WhatsApp, correo e ID de Formspree.

## Indicadores financieros reales (tablero de la portada)

- **Dólar (TRM):** se actualiza solo desde datos.gov.co (Superfinanciera). No hay que hacer nada.
- **Inflación y tasa del Banco de la República:** cambian una vez al mes. Actualízalas en `indicadores.js`:
  - Inflación: DANE publica el IPC hacia el día 8 de cada mes.
  - Tasa BanRep: cambia solo cuando la Junta Directiva lo decide.
- Si datos.gov.co no responde, el tablero muestra el último dato guardado y lo indica.
