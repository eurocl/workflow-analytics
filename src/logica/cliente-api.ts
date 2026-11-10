// Este archivo lleva los pedidos de la app a nuestro servidor y devuelve las respuestas.
// Esta URL es pública; las credenciales de Google están solamente en el servidor.
const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
export async function api(path: string, body?: unknown, token?: string) {
  if (!base) throw new Error('Falta configurar EXPO_PUBLIC_API_URL con la dirección del servidor.');
  // Si hay datos para enviar usamos POST; si no, usamos GET.
  const response = await fetch(`${base}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  // Convertimos la respuesta a datos y mostramos el error que mandó la API si falló.
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'No se pudo conectar. Intentá nuevamente.');
  return result;
}

