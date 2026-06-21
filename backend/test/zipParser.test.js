const test = require('node:test');
const assert = require('node:assert/strict');
const { textoAListaDeZips, esZipValido, buscarZipsInvalidos } = require('../src/utils/zipParser');

test('acepta ZIP separados por comas o espacios', () => {
  assert.deepEqual(textoAListaDeZips('80203 90210, 10001'), ['80203', '90210', '10001']);
});

test('valida ZIP de exactamente cinco dígitos', () => {
  assert.equal(esZipValido('80203'), true);
  assert.equal(esZipValido('1234'), false);
  assert.equal(esZipValido('ABCDE'), false);
  assert.deepEqual(buscarZipsInvalidos(['80203', 'ABC', '10001']), ['ABC']);
});
