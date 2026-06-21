// Aqui probamos que el AQI se clasifique bien y que encontremos el contaminante dominante.
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  obtenerNivelAqi,
  obtenerContaminanteDominante
} = require('../src/services/airQualityService');

// Probamos varios valores para confirmar que cada uno tenga el nivel correcto.
test('clasifica los rangos principales del AQI', () => {
  assert.equal(obtenerNivelAqi(40), 'Good');
  assert.equal(obtenerNivelAqi(75), 'Moderate');
  assert.equal(obtenerNivelAqi(175), 'Unhealthy');
});

// En este ejemplo ozone tiene el AQI mas alto, por eso debe salir como dominante.
test('elige el mayor componente AQI, no la mayor concentración cruda', () => {
  const actual = {
    us_aqi_pm2_5: 42,
    us_aqi_pm10: 35,
    us_aqi_ozone: 67,
    us_aqi_nitrogen_dioxide: 12
  };
  assert.equal(obtenerContaminanteDominante(actual), 'ozone');
});
