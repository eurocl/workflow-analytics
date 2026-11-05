// Acá verificamos que la fecha y la hora elegidas lleguen al evento sin cambiarse.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fechaLocalTexto, horaLocalTexto, valorSelector } from '../src/logica/fechas.ts';
import { prepararEvento } from '../src/logica/evento.ts';
test('Conserva día local, medianoche y formato de 24 horas', () => {
  for (const time of ['00:00', '09:05', '12:00', '23:59']) {
    const date = valorSelector('2099-02-28', time);
    assert.equal(fechaLocalTexto(date), '2099-02-28');
    assert.equal(horaLocalTexto(date), time);
    const event = prepararEvento('Prueba', fechaLocalTexto(date), horaLocalTexto(date), 60);
    assert.equal(Date.parse(event.start), +date);
  }
});
test('Cambiar fecha desde un día 31 no desborda febrero', () => {
  const result = valorSelector('2099-02-01', '18:30', new Date(2099, 0, 31, 8));
  assert.equal(fechaLocalTexto(result), '2099-02-01');
  assert.equal(horaLocalTexto(result), '18:30');
});
test('Sin selección, inicia en hora local sin segundos', () => {
  const now = new Date(2099, 0, 10, 15, 27, 45);
  assert.equal(horaLocalTexto(valorSelector('', '', now)), '15:27');
  assert.equal(valorSelector('', '', now).getSeconds(), 0);
  assert.equal(now.getSeconds(), 45);
});

