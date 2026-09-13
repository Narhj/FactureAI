# FactureAI - Backend (Render.com)

**Autor:** Moises David Florez Olivero
**Evidencia:** GA8-220501096-AA1-EV02 (Módulos integrados)

## Por qué existe esta carpeta

FactureAI sigue, desde su ficha técnica inicial, una filosofía de **cero costo**
para el cliente final. Firebase Cloud Functions habría sido la opción más
directa (es la misma tecnología documentada en evidencias anteriores), pero
desde 2020 Google exige tener el plan de pago **Blaze** (con tarjeta
registrada) para desplegar cualquier función pública, incluso si su uso real
nunca genera cobro. Por coherencia con la filosofía del proyecto, se decidió
mover el **hosting del backend** a Render.com, que sí ofrece un plan gratuito
sin tarjeta.

**Lo que NO cambia:** la base de datos sigue siendo Firestore, el mismo
proyecto de Firebase (`practicefactureia`), con la misma estructura de datos
ya validada en el emulador. **Lo que sí cambia:** dónde corre el código de
Express — antes en una Cloud Function, ahora en un servicio normal de Node en
Render.

Este backend es funcionalmente idéntico al de `functions/index.js` (mismos
endpoints, misma lógica); `functions/index.js` se conserva para seguir
probando localmente con el emulador de Firebase.

## Requisito: una cuenta de servicio de Firebase

Como este servidor ya no corre dentro de la infraestructura de Google, necesita
credenciales explícitas para conectarse a Firestore:

1. Ve a la [consola de Firebase](https://console.firebase.google.com/) → tu
   proyecto → ⚙️ Configuración del proyecto → pestaña "Cuentas de servicio".
2. Clic en "Generar nueva clave privada". Se descarga un archivo `.json`.
3. **No subas ese archivo a GitHub.** Su contenido completo se pega como texto
   en la variable de entorno `FIREBASE_SERVICE_ACCOUNT` en Render (ver abajo).

## Desplegar en Render

1. Crea una cuenta gratuita en [render.com](https://render.com).
2. "New +" → "Web Service".
3. Conecta tu repositorio de GitHub (o sube este código a un repo si aún no
   lo has hecho).
4. Configuración del servicio:
   - **Root Directory:** `render-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. En "Environment Variables", agrega:
   - `FIREBASE_SERVICE_ACCOUNT` → pega el contenido completo del JSON descargado (todo en una sola línea está bien).
6. Clic en "Create Web Service". El primer despliegue tarda unos minutos.

Al terminar, Render te da una URL pública como
`https://factureai-backend.onrender.com`. Esa es la URL que va en
`VITE_API_BASE_URL` en el frontend.

## Importante: el servicio "duerme"

En el plan gratuito, Render apaga el servicio tras 15 minutos sin tráfico. La
primera petición después de eso tarda unos 30 segundos en responder mientras
"despierta". Esto es exactamente igual al comportamiento ya documentado para
n8n en el resto del proyecto — no es un error, es una característica conocida
del nivel gratuito. El frontend ya muestra mensajes de espera con contexto
mientras esto ocurre, para que no parezca que el sistema está colgado.
