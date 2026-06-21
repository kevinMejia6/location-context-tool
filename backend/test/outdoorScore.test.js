const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularOutdoorScore } = require('../src/domain/outdoorScore');

test('devuelve 10 para condiciones ideales', () => {
  const clima = { temperature_c: 23, windspeed_kmh: 10, condition: 'Despejado' };
  assert.equal(calcularOutdoorScore(clima, { aqi_us: 30 }), 10);
});

test('aplica penalizaciones y nunca baja de 1', () => {
  const clima = { temperature_c: 42, windspeed_kmh: 70, condition: 'Tormenta' };
  assert.equal(calcularOutdoorScore(clima, { aqi_us: 350 }), 1);
});

test('penaliza la ausencia de AQI', () => {
  const clima = { temperature_c: 23, windspeed_kmh: 10, condition: 'Despejado' };
  assert.equal(calcularOutdoorScore(clima, { aqi_us: null }), 9);
});
