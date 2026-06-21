// Aqui probamos que los codigos de Open-Meteo se conviertan en la condicion correcta.
const test = require('node:test');
const assert = require('node:assert/strict');
const { mapearCondicion } = require('../src/domain/weatherCodes');

// Probamos algunos codigos conocidos como despejado, lluvia y tormenta.
test('mapea códigos WMO conocidos', () => {
  assert.equal(mapearCondicion(0), 'Despejado');
  assert.equal(mapearCondicion(63), 'Lluvia');
  assert.equal(mapearCondicion(95), 'Tormenta');
});

// Si el codigo no existe debemos devolver Condicion desconocida.
test('maneja códigos desconocidos', () => {
  assert.equal(mapearCondicion(999), 'Condición desconocida');
});
