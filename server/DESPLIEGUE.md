# Despliegue vigente

El servidor está alojado en https://workflow-analytics-emws.onrender.com.
La configuración manual y los pasos de ejecución están en ../INSTRUCTIVO-GOOGLE.md.
Render ejecuta node indice.mjs desde server/ y recibe GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y PUBLIC_URL mediante Environment. No subir .env.
El archivo render.yaml es una alternativa para crear un servicio; no es necesario crear otro para usar el existente.
