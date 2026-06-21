const test = require('node:test');
const assert = require('node:assert/strict');
const {
  obtenerNivelAqi,
  obtenerContaminanteDominante
} = require('../src/services/airQualityService');

test('clasifica los rangos principales del AQI', () => {
  assert.equal(obtenerNivelAqi(40), 'Good');
  assert.equal(obtenerNivelAqi(75), 'Moderate');
  assert.equal(obtenerNivelAqi(175), 'Unhealthy');
});

test('elige el mayor componente AQI, no la mayor concentración cruda', () => {
  const actual = {
    us_aqi_pm2_5: 42,
    us_aqi_pm10: 35,
    us_aqi_ozone: 67,
    us_aqi_nitrogen_dioxide: 12
  };
  assert.equal(obtenerContaminanteDominante(actual), 'ozone');
});
