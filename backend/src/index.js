
// Este archivo nos permite ejecutar el proyecto desde la consola.
// Recibimos uno o varios ZIP, los validamos y mostramos el resultado en formato JSON.

const {
  obtenerContextoPorZip,
  obtenerContextoParaMultiplesZips
} = require('./locationContext');

// Para limpiar y validar los ZIP usamos las funciones de zipParser, que se encargan.

const {
  textoAListaDeZips,
  buscarZipsInvalidos
} = require('./utils/zipParser');

// Aqui leemos los ZIP enviados desde la consola. Si no viene ninguno, intentamos
// usar ZIP_CODE del archivo .env. Luego decidimos si hacemos una consulta o varias.

async function main() {
  const argumentos = process.argv.slice(2);
  const textoEntrada = argumentos.join(',') || process.env.ZIP_CODE;
  const zips = textoAListaDeZips(textoEntrada);

  if (zips.length === 0) {
    mostrarError(
      'ZIP_REQUIRED',
      'Debes enviar un ZIP de cinco dígitos. Ejemplo: npm run cli -- 80203'
    );
    return;
  }

  const invalidos = buscarZipsInvalidos(zips); // Validamos los ZIP y buscamos cuales son invalidos para mostrar un error claro.

  if (invalidos.length > 0) { //Validamos si hay zip invalidos y si hay le mostramos el mensaje al usuario.
    mostrarError(
      'ZIP_INVALID',
      'Cada ZIP debe contener exactamente cinco dígitos.',
      invalidos
    );
    return;
  }


// Si llegamos hasta aca, todos los ZIP son validos. Si solo hay uno, hacemos una consulta simple, sino usamos la funcion para multiples consultas.

  const resultado = zips.length === 1
    ? await obtenerContextoPorZip(zips[0])
    : await obtenerContextoParaMultiplesZips(zips);

  console.log(JSON.stringify(resultado, null, 2));
}

// Recibimos el codigo y mensaje del error para mostrar siempre la misma estructura.
// Si hay valores invalidos tambien los agregamos para saber cuales causaron el problema.

function mostrarError(codigo, mensaje, valoresInvalidos) {
  const error = {
    ok: false,
    error: {
      code: codigo,
      message: mensaje
    }
  };

  if (valoresInvalidos) {
    error.error.invalid_values = valoresInvalidos;
  }

  console.error(JSON.stringify(error, null, 2));
  process.exitCode = 1;
}

// Si ocurre un error que no esperabamos, lo capturamos para no cerrar sin explicacion.

main().catch((error) => {
  mostrarError('UNEXPECTED_ERROR', error.message);
});
