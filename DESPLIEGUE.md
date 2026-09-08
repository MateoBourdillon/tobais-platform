# Despliegue: frontend en Hostinger + backend en Render

Esta app no es una web estática. Tiene dos mitades que se despliegan por separado:

| Parte | Qué es | Dónde va |
|---|---|---|
| Frontend | React compilado (`dist/public`) | Hostinger, en `public_html` |
| Backend | Express + PostgreSQL (`dist/index.js`) | Render (plan gratuito) |

El hosting compartido de Hostinger solo sirve archivos estáticos y PHP: **no puede
ejecutar Node.js**, por eso el backend va a Render.

La web y el backend se conectan a través de un archivo llamado `config.js` que
viaja dentro de `public_html`. Se edita a mano en hPanel, así que **no hay que
recompilar ni volver a subir nada** cuando cambie la dirección del backend.

---

## Paso 1 — Subir la web a Hostinger (ya puedes hacerlo)

Tienes el paquete listo en:

```
C:\Users\Mateo\Downloads\tobais-hostinger.zip
```

1. Entra a **hPanel → Archivos → Administrador de archivos**.
2. Abre `public_html` y **borra su contenido actual** (si hay una web anterior;
   si tiene algo que quieras conservar, descárgalo antes).
3. Sube `tobais-hostinger.zip` dentro de `public_html` y usa **Extraer**.
4. Borra el `.zip` una vez extraído.

Dentro de `public_html` debe quedar así:

```
public_html/
  index.html
  .htaccess
  config.js
  assets/
  images/
```

> El `.htaccess` es un archivo oculto. Si no lo ves, activa
> **Configuración → Mostrar archivos ocultos** en el Administrador de archivos.
> Es imprescindible: sin él, rutas como `tobais.com/services` dan error 404 al
> recargar.

**En este punto la web ya se ve online.** Lo que todavía no funciona: formularios,
login, pagos, panel de admin y facturas — todo eso necesita el backend del paso 3.

---

## Paso 2 — Dominio y SSL

1. En hPanel, asegúrate de que `tobais.com` apunta a este hosting.
2. Ve a **Seguridad → SSL** y activa el certificado gratuito. Es obligatorio:
   la sesión usa cookies `Secure` y sin HTTPS el login no funcionaría.
3. Si el dominio todavía apunta a Replit, cambia los DNS en tu registrador a los
   de Hostinger. La propagación tarda entre 1 y 24 horas.

---

## Paso 3 — Backend en Render

### Antes: recupera las claves de Replit

Varias claves estaban en los *Secrets* de Replit, no en el archivo `.env`. Entra a
tu Repl → panel **Secrets** (icono del candado) y copia al menos:

- `DATABASE_URL` (la base de datos Neon — **no la borres de Replit hasta terminar**)
- `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLIC_KEY`, `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `VITE_PAYPAL_CLIENT_ID`
- `SENDGRID_API_KEY`
- `RETELL_API_KEY`, `RETELL_AGENT_ID`

Las de OpenAI, Gmail y `SESSION_SECRET` ya están en tu `.env` local.

### Desplegar

1. Sube el proyecto a un repositorio de GitHub (privado está bien).
2. En [render.com](https://render.com) → **New → Blueprint** → conecta el
   repositorio. Render lee el archivo `render.yaml` incluido y te pedirá las
   claves marcadas como secretas.
3. Deja `ALLOWED_ORIGINS` con tus dominios reales, separados por coma y **sin
   barra final**:
   ```
   https://tobais.com,https://www.tobais.com
   ```
4. Despliega. Al terminar tendrás una URL tipo `https://tobais-api.onrender.com`.

> **Plan gratuito:** Render duerme el servicio tras 15 minutos sin tráfico y la
> primera petición después tarda ~50 segundos. La web en Hostinger carga rápido
> siempre; solo se nota al enviar un formulario o iniciar sesión tras un rato de
> inactividad. El plan de 7 USD/mes lo elimina.

---

## Paso 4 — Conectar las dos mitades

En hPanel → Administrador de archivos → `public_html` → abre **`config.js`** y
pega la URL de Render, sin barra final:

```js
window.TOBAIS_API_URL = "https://tobais-api.onrender.com";
```

Guarda. Recarga la web. Ya funcionan formularios, login, pagos y panel.

Eso es todo: no hay que recompilar ni volver a subir archivos.

---

## Paso 5 — Actualizar los webhooks externos

Estos servicios llaman al **backend**, así que apuntan a Render, no a Hostinger:

- **Stripe** → Dashboard → Developers → Webhooks → cambia la URL a
  `https://tobais-api.onrender.com/api/stripe/webhook`
- **PayPal** → Developer Dashboard → Webhooks → misma idea con tu ruta de PayPal.
- **Google OAuth** (Gmail API) → Cloud Console → Credenciales → añade los URI de
  redirección con el dominio nuevo.

---

## Cómo actualizar la web más adelante

- **Cambios de frontend:** `npm run build` y vuelve a subir el contenido de
  `dist/public` a `public_html`.
- **Cambios de backend:** haz `git push`; Render redespliega solo.
- **Cambiar de backend:** edita `config.js` en hPanel. Nada más.

### Sobre las claves de Stripe y PayPal en el frontend

Las claves públicas (`VITE_STRIPE_PUBLIC_KEY`, `VITE_PAYPAL_CLIENT_ID`) sí se
incrustan al compilar. Si vas a usar pagos, crea `.env.production` a partir de
`.env.production.example`, rellénalas y recompila antes de subir. Sin ellas la
web funciona, pero el botón de pago no se inicializa.

---

## Si algo falla

**La web carga pero los formularios y el login no funcionan.**
Abre la consola del navegador (F12 → Console). Si ves errores de CORS, revisa que
`ALLOWED_ORIGINS` en Render tenga exactamente tu dominio, con `https://` y sin
barra al final. Si ves errores 404 contra `tobais.com/api/...`, es que `config.js`
está vacío o mal escrito.

**Entro con usuario y contraseña pero me desloguea al instante.**
Es la cookie de sesión. Verifica que Hostinger tenga SSL activo (la web debe abrir
en `https://`) y que en Render `NODE_ENV` valga `production`.

**Error 404 al recargar en una página interna como /services.**
Falta el `.htaccess` en `public_html`, o no se subió por estar oculto.

**Edité config.js pero la web sigue igual.**
Recarga forzando caché con Ctrl+F5. El `.htaccess` ya pide que ese archivo no se
cachee, pero el navegador puede tener la versión vieja.

**La primera petición tarda muchísimo.**
Es el plan gratuito de Render despertando el servicio. Normal.
