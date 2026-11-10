// Acá pasamos la fecha y la hora del selector a texto, sin cambiar el día por la zona horaria.
export type PropiedadesFechaHora = {
  entreFechaYHora?: import('react').ReactNode;
  date: string; time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
};
const pad = (value: number) => String(value).padStart(2, '0');
export const fechaLocalTexto = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const horaLocalTexto = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
// Arrancamos con la selección anterior o con la hora actual si todavía no elegiste.
export function valorSelector(date: string, time: string, now = new Date()) {
  const value = new Date(now);
  // Usamos la hora local para no mover la fecha elegida al convertirla.
  if (date) {
    const [year, month, day] = date.split('-').map(Number);
    value.setFullYear(year, month - 1, day);
  }
  if (time) {
    const [hour, minute] = time.split(':').map(Number);
    value.setHours(hour, minute, 0, 0);
  } else value.setSeconds(0, 0);
  return value;
}

