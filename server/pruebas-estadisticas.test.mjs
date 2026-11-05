// Acá verificamos los minutos de los gráficos, los cambios de día y los registros repetidos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agregarActividad, resumirTiempo, leerHistorial, formatearMinutos } from '../src/logica/estadisticas.ts';

const event = (start, end, category = 'trabajo') => ({
  summary: 'Actividad', start: new Date(...start).toISOString(), end: new Date(...end).toISOString(), category, destination: 'device',
});
const total = rows => rows.reduce((sum, row) => sum + row.minutes, 0);
test('Distribuye un evento entre días y meses sin perder minutos', () => {
  const item = event([2026, 9, 31, 23, 30], [2026, 10, 1, 0, 30]);
  assert.equal(total(resumirTiempo([item], new Date(2026, 9, 31), 'day')), 30);
  assert.equal(total(resumirTiempo([item], new Date(2026, 10, 1), 'day')), 30);
  assert.equal(total(resumirTiempo([item], new Date(2026, 9, 1), 'month')), 30);
  assert.equal(total(resumirTiempo([item], new Date(2026, 10, 1), 'month')), 30);
});
test('Agrupa categorías y excluye eventos fuera del período', () => {
  const items = [
    event([2026, 9, 25, 10], [2026, 9, 25, 11]),
    event([2026, 9, 25, 12], [2026, 9, 25, 12, 30], 'estudio'),
    event([2026, 9, 26, 10], [2026, 9, 26, 11]),
  ];
  const rows = resumirTiempo(items, new Date(2026, 9, 25), 'day');
  assert.equal(rows.find(r => r.id === 'trabajo').minutes, 60);
  assert.equal(rows.find(r => r.id === 'estudio').minutes, 30);
  assert.equal(total(rows), 90);
});
test('Medianoche pertenece solo al período siguiente', () => {
  const item = event([2026, 9, 25, 23], [2026, 9, 26, 0]);
  assert.equal(total(resumirTiempo([item], new Date(2026, 9, 26), 'day')), 0);
});
test('Reintentos idénticos no duplican el historial y permiten corregir categoría', () => {
  const item = event([2026, 9, 25, 10], [2026, 9, 25, 11]);
  const items = agregarActividad(agregarActividad([], item), { ...item, category: 'estudio' });
  assert.equal(items.length, 1);
  assert.equal(items[0].category, 'estudio');
});
test('Historial persistido válido y datos corruptos', () => {
  const item = event([2026, 9, 25, 10], [2026, 9, 25, 11]);
  assert.deepEqual(leerHistorial(JSON.stringify([item])), [item]);
  assert.deepEqual(leerHistorial(null), []);
  assert.throws(() => leerHistorial('invalid'));
  assert.throws(() => leerHistorial(JSON.stringify([{ ...item, end: 'invalid' }])));
  assert.throws(() => leerHistorial(JSON.stringify([{ ...item, category: 'inventada' }])));
  assert.equal(total(resumirTiempo([], new Date(), 'month')), 0);
  assert.equal(formatearMinutos(90), '1 h 30 min');
});
test('Duraciones superpuestas se suman como tiempo agendado', () => {
  const a = event([2026, 9, 25, 10], [2026, 9, 25, 11]);
  const b = event([2026, 9, 25, 10, 30], [2026, 9, 25, 11, 30], 'estudio');
  assert.equal(total(resumirTiempo([a, b], new Date(2026, 9, 25), 'day')), 120);
});

