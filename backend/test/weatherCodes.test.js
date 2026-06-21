const test = require('node:test');
const assert = require('node:assert/strict');
const { mapearCondicion } = require('../src/domain/weatherCodes');

test('mapea códigos WMO conocidos', () => {
  assert.equal(mapearCondicion(0), 'Despejado');
  assert.equal(mapearCondicion(63), 'Lluvia');
  assert.equal(mapearCondicion(95), 'Tormenta');
});

test('maneja códigos desconocidos', () => {
  assert.equal(mapearCondicion(999), 'Condición desconocida');
});
