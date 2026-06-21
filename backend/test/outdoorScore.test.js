// Aqui probamos diferentes condiciones para revisar que el outdoor score se calcule bien.
const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularOutdoorScore } = require('../src/domain/outdoorScore');

// Con condiciones ideales no se debe restar ningun punto.
test('devuelve 10 para condiciones ideales', () => {
  const clima = { temperature_c: 23, windspeed_kmh: 10, condition: 'Despejado' };
  assert.equal(calcularOutdoorScore(clima, { aqi_us: 30 }), 10);
});

// Con varias condiciones malas comprobamos que el score nunca baje de 1.
test('aplica penalizaciones y nunca baja de 1', () => {
  const clima = { temperature_c: 42, windspeed_kmh: 70, condition: 'Tormenta' };
  assert.equal(calcularOutdoorScore(clima, { aqi_us: 350 }), 1);
});

// Si no tenemos AQI restamos un punto por precaucion.
test('penaliza la ausencia de AQI', () => {
  const clima = { temperature_c: 23, windspeed_kmh: 10, condition: 'Despejado' };
  assert.equal(calcularOutdoorScore(clima, { aqi_us: null }), 9);
});
