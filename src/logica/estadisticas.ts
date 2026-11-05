// Acá hacemos las cuentas de los gráficos. Sumamos tiempo agendado, no tiempo realmente trabajado.
export const categorias = [
  { id: 'trabajo', label: 'Trabajo', color: '#8395FF' },
  { id: 'estudio', label: 'Estudio', color: '#61E6D2' },
  { id: 'salud', label: 'Salud', color: '#FFAB91' },
  { id: 'personal', label: 'Personal', color: '#E4ACFF' },
  { id: 'ocio', label: 'Ocio', color: '#FFD778' },
  { id: 'otros', label: 'Otros', color: '#AAB6CC' },
] as const;
export type Categoria = typeof categorias[number]['id'];
export type Actividad = {
  summary: string; start: string; end: string; category: Categoria;
  destination: 'device' | 'google' | 'demo'; htmlLink?: string;
};
// Esta combinación nos permite reconocer el mismo evento si se vuelve a enviar.
export function claveActividad(a: Actividad) {
  return JSON.stringify([a.destination, a.summary, a.start, a.end]);
}
// Si ya estaba el mismo evento, lo reemplazamos en lugar de contarlo dos veces.
export function agregarActividad(items: Actividad[], activity: Actividad) {
  return [...items.filter(item => claveActividad(item) !== claveActividad(activity)), activity];
}
// Leemos lo guardado y comprobamos que tenga la forma que esperamos.
export function leerHistorial(raw: string | null): Actividad[] {
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every(esActividad)) throw new Error('Historial inválido');
  return value;
}
// No damos por válido un dato guardado hasta revisar sus campos.
function esActividad(a: any): a is Actividad {
  return a && typeof a.summary === 'string' && typeof a.start === 'string' &&
    typeof a.end === 'string' && Number.isFinite(Date.parse(a.start)) &&
    Number.isFinite(Date.parse(a.end)) && Date.parse(a.end) > Date.parse(a.start) &&
    categorias.some(c => c.id === a.category) &&
    ['device', 'google', 'demo'].includes(a.destination) &&
    (a.htmlLink === undefined || typeof a.htmlLink === 'string');
}
// Calculamos dónde empieza y termina el día o mes en la hora del teléfono.
export function limitesPeriodo(date: Date, unit: 'day' | 'month') {
  const y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
  return unit === 'month'
    ? [new Date(y, m, 1), new Date(y, m + 1, 1)]
    : [new Date(y, m, d), new Date(y, m, d + 1)];
}
// A cada categoría le sumamos solo los minutos que caen dentro del período.
export function resumirTiempo(items: Actividad[], date: Date, unit: 'day' | 'month') {
  const [start, end] = limitesPeriodo(date, unit);
  return categorias.map(category => ({
    ...category,
    minutes: items.filter(item => item.category === category.id).reduce((sum, item) =>
      sum + Math.max(0, Math.min(Date.parse(item.end), +end) - Math.max(Date.parse(item.start), +start)) / 60000, 0),
  }));
}
// Mostramos los minutos de una forma más cómoda: por ejemplo, 1 h 30 min.
export function formatearMinutos(value: number) {
  const total = Math.round(value), hours = Math.floor(total / 60), minutes = total % 60;
  return hours ? `${hours} h${minutes ? ` ${minutes} min` : ''}` : `${minutes} min`;
}

