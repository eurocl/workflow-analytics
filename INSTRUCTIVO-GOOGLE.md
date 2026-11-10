# Render y Google Calendar (extracto de readme enfocado en google)

## Tecnología y motivo del cambio

Render es un servicio de alojamiento en la nube: ejecuta nuestra API Node.js desde el repositorio GitHub y le asigna una dirección HTTPS estable entonces reemplaza al túnel temporal de cloudflare, cuya dirección podia cambiar al recrearlo. No reemplaza a Expo, GitHub ni Google Calendar.

El ingreso con Google funcionó despues de configurar render y OAuth. Es una prueba funcional puntual, no una garantía de disponibilidad permanente.

## Arquitectura actual

```text
gitHub -> despliegue del servidor Node.js en render
PC con Expo -> QR / carga de la app -> Expo Go en Android
App -> HTTPS -> API en Render -> Google Calendar API
Google OAuth -> /auth/callback en Render -> sesión de la app
Historial y gráficos -> AsyncStorage en cada dispositivo
```



## Configuración del servicio

- Repositorio: https://github.com/eurocl/workflow-analytics
- Rama: main. Tipo: Web Service de node.js.
- Root Directory: server/
- Build Command: node --check indice.mjs
- Start Command: node indice.mjs
- URL: https://workflow-analytics-emws.onrender.com
- Salud: https://workflow-analytics-emws.onrender.com/health

Render asigna el puerto mediante PORT. El código escucha en 0.0.0.0. No se instala Expo en Render: la API usa módulos integrados de Node.js. El comando de compilación verifica sintaxis, no el flujo OAuth completo.

## Variables de entorno

En el .env principal de Expo:

```dotenv
EXPO_PUBLIC_API_URL=https://workflow-analytics-emws.onrender.com
```

En render > Environment, configurar por separado KEY y VALUE:

- PUBLIC_URL: https://workflow-analytics-emws.onrender.com
- GOOGLE_CLIENT_ID: valor real del identificador del cliente web de Google.
- GOOGLE_CLIENT_SECRET: valor real del secreto de ese cliente.

No escribir server/.env como valor: es una ruta, no una credencial. Editar el archivo local no actualiza Render automáticamente. Guardar y desplegar desde el panel. El secreto queda en el servidor: no publicarlo en GitHub, EXPO_PUBLIC_* ni documentos.

## Configuración de Google

En Google Auth Platform > Clientes > cliente web, autorizar exactamente:

```text
https://workflow-analytics-emws.onrender.com/auth/callback
```

Habilitar Google Calendar API. Agregamos la cuenta evaluadora como usuario de prueba en Publico si OAuth sigue en modo prueba. El correo de contacto no concede acceso administrativo al proyecto.

No cambiar esta URI cada vez que inicia Expo: se conserva mientras exista el servicio con esa dirección.

## Preparación para presentar RENDER::

1. Abrir /health con anticipación y esperar si Render estaba suspendido. Debe responder ok: true y googleConfigured: true.
https://workflow-analytics-emws.onrender.com/health

2. Abrir la carpeta workflow-analytics en Visual studio Code. Verificar que .env use Render.
3. Iniciar Expo:

```powershell
npx.cmd expo start --clear
```

El comando general es npx expo start,
 .cmd evita el bloqueo de scripts de PowerShell. --clear ayuda a descartar una URL anterior, pero no es obligatorio en cada inicio.

4. Conectar PC y Android al mismo Wi-Fi. Escanear el QR con Expo Go compatible con SDK 57.
5. Tocar Continuar con Google, autorizar con una cuenta admitida y volver a la app. Tocar Ya autoricé, continuar.
6. Guardar una actividad futura y comprobar el evento en Google Calendar. Mostrar los gráficos de Mi tiempo.
7. Dejar Expo abierto. No iniciar Cloudflare ni npm.cmd run servidor para el flujo remoto.

Probar antes de la defensa. Esta guía no programa un inicio automático para el jueves.

## Límites de la solucion:

En el plan gratuito render suspende el servicio tras 15 minutos sin trafico y puede tardar alrededor de un minuto en despertar. La app espera hasta 20 segundos por pedido: abrir /health antes del ingreso evita que esa primera demora interrumpa la prueba. Si hubo un timeout, esperar y reintentar. La URL no cambia al despertar.

Las sesiones OAuth están en memoria y duran como maximo una hora. Reinicios, despliegues o suspensiones pueden eliminarlas: hay que volver a conectar Google, no cambiar la URL. Esta implementación utiliza una sola instancia.

Los gráficos muestran tiempo planificado, no tiempo real trabajado. El historial queda en cada celular,d no se sincroniza entre dispositivos. Los eventos sí quedan en la cuenta Google autorizada. La API no configura CORS para un frontend web de otro origen: la prueba de Google se realiza en Android.

## Diagnostico rápido:

- googleConfigured: false: faltan variables o URL HTTPS válida en Render. Un valor true no verifica por sí solo las credenciales.
- redirect_uri_mismatch: comparar PUBLIC_URL y la URI autorizada exacta.
- 403 access_denied: revisar mensaje de Google y cuenta de prueba.
- UnknownHostException con trycloudflare.com: quedó una dirección antigua en la app; corregir .env y reiniciar Expo.
- Timeout: abrir /health, esperar el arranque y reintentar.
- Sesión vencida: ingresar nuevamente.


## Fuentes oficiales

- https://render.com/docs/web-services
- https://render.com/docs/free
- https://render.com/docs/configure-environment-variables
- https://developers.google.com/identity/protocols/oauth2/web-server
- https://docs.expo.dev/get-started/start-developing/
