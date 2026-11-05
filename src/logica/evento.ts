// Acá revisamos que la actividad tenga datos válidos antes de enviarla al calendario.
// Si falta algo o la fecha ya pasó, avisamos antes de guardar.
export function prepararEvento(summary: string, date: string, time: string, duration: number) {
  if (!summary.trim()) throw new Error('Escribí qué tenés que hacer.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error('Usá fecha AAAA-MM-DD y hora HH:MM.');
  // Separamos los números de la fecha y de la hora que elegiste.
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  // JavaScript cuenta los meses desde cero, por eso restamos uno.
  const start = new Date(year, month - 1, day, hour, minute);
  // Esto detecta fechas imposibles que JavaScript acomodaría automáticamente.
  if (start.getFullYear() !== year || start.getMonth() !== month - 1 || start.getDate() !== day || start.getHours() !== hour || start.getMinutes() !== minute) throw new Error('La fecha o la hora no es válida.');
  if (start.getTime() <= Date.now()) throw new Error('Elegí una fecha y hora futura.');
  if (![30, 60, 90, 120].includes(duration)) throw new Error('Duración no válida.');
  // Guardamos inicio y fin como instantes UTC; la pantalla los vuelve a mostrar en hora local.
  return { summary: summary.trim(), start: start.toISOString(), end: new Date(start.getTime() + duration * 60000).toISOString() };
}

