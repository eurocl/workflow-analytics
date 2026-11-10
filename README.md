# WorkFlow Analytics

Aplicación móvil individual para organizar actividades, agendarlas y visualizar el tiempo planificado por categorI5a. Desarrollada con React Native, Expo y TypeScript; servidor Node.js para Google Calendar.

Repositorio: https://github.com/eurocl/workflow-analytics

## Funciones y límites

- Inicio con email para identificar un perfil local, o conexión mediante Google OAuth. El ingreso por email no verifica identidad ni usa contraseña.
- Actividades: texto, categoría, fecha, hora de 24 horas y duración. Atajos de 10, 30 y 60 minutos. lA configuración conserva otras duraciones.
- Android: abre el editor del calendario nativo y el usuario confirma el guardado. Google Calendar: el servidor crea el evento después de autorizar la cuenta.
- Mi tiempo: gráficos de tiempo planificado y registro local con AsyncStorage. No mide tiempo real trabajado ni sincroniza cambios hechos fuera de la app.
- Configuración de cuenta y duración predeterminada.
- Las sesiones OAuth están en memoria del servidor, duran como máximo una hora y se pierden al reiniciarlo. No hay base de datos remota de usuarios.
- El servidor está publicado en Render: https://workflow-analytics-emws.onrender.com

Google requiere Internet y que ese servicio responda. No requiere Cloudflare ni servidor local. 
En pruebas el ingreso funcionó tras configurar OAuth.



## Requisitos

- Node.js 22.16 o superior compatible, npm y Git.
- Android con Expo Go compatible con SDK 57. Expo Go SDK 58 no abre este proyecto SDK 57. Ver https://expo.dev/go.
- PC y teléfono en la misma red para Expo por LAN.
- Para Google: proyecto de Google Cloud, Calendar API habilitada, cliente OAuth de tipo aplicación web y usuario agregado como usuario de prueba si la aplicación está en modo prueba.
- Para usar el servidor publicado no se necesita instalar Cloudflare. Render aloja la API Node.js con HTTPS.

## Instalación

```powershell
git clone https://github.com/eurocl/workflow-analytics.git
cd workflow-analytics
npm.cmd ci
New-Item -ItemType File .env
Copy-Item server/.env.example server/.env
```

La creación de `.env` se hace solo la primera vez.No sobrescribir configuraciones existentes. `server/.env` solo es necesario para ejecutar la API localmente. En la carpeta original abrir la subcarpeta `workflow-analytics`, no la carpeta contenedora `workflow analytics`.

## Ejecución con Expo

Comando solicitado para iniciar el proyecto:

```sh
npx expo start
```

En PowerShell, si se bloquea `npx.ps1`, usar `npx.cmd expo start`. 
-También sirve `npm.cmd run iniciar`. Escanear el QR con Expo Go. Presionar `w` permite revisar las pantallas en el navegador, el calendario nativo solo funciona en Android. 
-La prueba de Google se realiza en el celular; la API actual no configura CORS para un frontend web de otro origen.

Para usar Google, seguir [el instructivo de Render](INSTRUCTIVO-GOOGLE.md). Mantener Expo abierto en la PC y comprobar que Render responda. No iniciar Cloudflare ni la API local.

## Configuración privada

En `.env`:

```dotenv
EXPO_PUBLIC_API_URL=https://workflow-analytics-emws.onrender.com
```

En Render > Environment, configurar estas variables como pares KEY / VALUE. Para desarrollo local se pueden guardar en `server/.env`:

```dotenv
PORT=3001
PUBLIC_URL=https://workflow-analytics-emws.onrender.com
GOOGLE_CLIENT_ID=TU_CLIENTE_WEB.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=TU_SECRETO
```

Reemplazar los ejemplos por valores propios. No publicamos `.env`, tokens, secretos ni el JSON descargado de Google. El ejemplo `server/.env_ejemplo` se entrega sin credenciales reales.

## Estructura

```text
src/app/                    Pantallas y navegación Expo Router
  index.tsx                 Inicio e ingreso
  actividades.tsx           Formulario, guardado y Mi tiempo
  configuracion.tsx         Cuenta y preferencias
  _layout.tsx               Proveedor de sesión y navegación
src/componentes/            Botones, campos, gráficos, fecha y hora
src/logica/                 Sesión, API, eventos, fechas y estadísticas
server/indice.mjs           OAuth y creación de eventos en Google
assets/                    Logo e imágenes
app.json                    Configuración Expo
package.json                Dependencias y comandos
package-lock.json           Versiones resueltas para instalación reproducible
server/.env.example         Ejemplo de configuración del servidor
INSTRUCTIVO-GOOGLE.md        Render, Google 
```



## Dependencias

Versiones declaradas: Expo `~57.0.20`, React `19.2.3`, React Native `0.86.3` y TypeScript `~6.0.3`.

- `expo-router`: navegación basada en archivos.
- `@react-native-async-storage/async-storage`: historial local por perfil.
- `react-native-svg`: gráficos.
- `@react-native-community/datetimepicker`: selección nativa de fecha y hora.
- `expo-intent-launcher`: editor del calendario Android.
- React Native Web y React DOM: vista web de las pantallas.
- Otras dependencias de Expo y navegación: consultar `package.json`; versiones exactas instalables en `package-lock.json`.
- El servidor usa módulos integrados de Node.js (`http`, `crypto`, `url`) y `fetch`. No requiere Express.

## Comprobación

```powershell
npm.cmd run tipos
node --check server/indice.mjs
npm.cmd run exportar-android
```

Prueba manual: entrar, crear una actividad futura, elegir categoría y duración, guardar en el calendario seleccionado y comprobar Mi tiempo. Para Google, verificar también el evento en la cuenta autorizada. Estos comandos son instrucciones de comprobación, no evidencia de una prueba remota completa.

## Declaración de uso de IA

Se utilizó OpenAI ChatGPT/Codex como asistencia para modificar código, resolver errores de Expo y OAuth, ajustar la interfaz, editar el fondo del logo, recibir guía en Canva para su armado y resolver la continuidad de la conexión con Google Calendar, consultando documentación oficial para conocer los límites del proyecto.

## Fuentes oficiales

- Expo, iniciar el desarrollo: https://docs.expo.dev/get-started/start-developing/
- Expo, incompatibilidad de versiones: https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/
- Render, servicios web: https://render.com/docs/web-services
- Render, límites gratuitos: https://render.com/docs/free
- Google OAuth para servidor web: https://developers.google.com/identity/protocols/oauth2/web-server

## Render y Google Calendar

## Tecnología y motivo del cambio

Render es un servicio de alojamiento en la nube: ejecuta nuestra API Node.js desde el repositorio GitHub y le asigna una dirección HTTPS estable. Reemplaza al túnel temporal de Cloudflare, cuya dirección podía cambiar al recrearlo. No reemplaza a Expo, GitHub ni Google Calendar.

Y el ingreso con Google funcionó después de configurar Render y OAuth. 

## Arquitectura actual

```text
GitHub -> despliegue del servidor Node.js en Render
PC con Expo -> QR / carga de la app -> Expo Go en Android
App -> HTTPS -> API en Render -> Google Calendar API
Google OAuth -> /auth/callback en Render -> sesión de la app
Historial y gráficos -> AsyncStorage en cada dispositivo
```


## Configuración del servicio

- Repositorio: https://github.com/eurocl/workflow-analytics
- Rama: main. Tipo: Web Service de Node.js.
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

En Render > Environment, configurar por separado KEY y VALUE:

- PUBLIC_URL: https://workflow-analytics-emws.onrender.com
- GOOGLE_CLIENT_ID: valor real del identificador del cliente web de Google.
- GOOGLE_CLIENT_SECRET: valor real del secreto de ese cliente.

No escribir server/.env como valor: es una ruta, no una credencial. Editar el archivo local no actualiza Render automáticamente. Guardar y desplegar desde el panel. El secreto queda en el servidor: no publicarlo en GitHub, EXPO_PUBLIC_* ni documentos.

## Configuración de Google

En Google Auth Platform > Clientes > cliente web, autorizar exactamente:

```text
https://workflow-analytics-emws.onrender.com/auth/callback
```

Habilitar Google Calendar API. Agregar la cuenta evaluadora como usuario de prueba en Público si OAuth sigue en modo prueba. El correo de contacto no concede acceso administrativo al proyecto.

No cambiar esta URI cada vez que inicia Expo: se conserva mientras exista el servicio con esa dirección.


## Límites de la solución:

En el plan gratuito render suspende el servicio tras 15 minutos sin trafico y puede tardar alrededor de un minuto en despertar. La app espera hasta 20 segundos por pedido: abrir /health antes del ingreso evita que esa primera demora interrumpa la prueba. Si hubo un timeout, esperar y reintentar. La URL no cambia al despertar.

Las sesiones OAuth están en memoria y duran como maximo una hora. Reinicios, despliegues o suspensiones pueden eliminarlas: hay que volver a conectar Google, no cambiar la URL. Esta implementación utiliza una sola instancia.

Los gráficos muestran tiempo planificado, no tiempo real trabajado. El historial queda en cada celular. No se sincroniza entre dispositivos. Los eventos sí quedan en la cuenta Google autorizada. La API no configura CORS para un frontend web de otro origen: la prueba de Google se realiza en Android.
