// ==========================================================
// CLI
// Este archivo permite ejecutar la prueba desde consola.
// Ejemplo: node src/index.js 80203
// ==========================================================

// Carga variables de entorno desde un archivo .env
require('dotenv').config();

// Importa funciones desde locationContext.js.
const {
  // Obtiene contexto para un solo ZIP.
  obtenerContextoPorZip,

  // Obtiene contexto para varios ZIPs.
  obtenerContextoParaMultiplesZips,

  // Convierte texto separado por comas en una lista limpia de ZIPs.
  textoAListaDeZips
} = require('./locationContext');

// Funcion principal asincrona para poder usar await.
async function main() {
  // Lee argumentos enviados por consola despues de "node src/index.js".
  const argumentos = process.argv.slice(2);

  // Une los argumentos con coma para soportar "80203 90210" o "80203,90210".
  const textoArgumentos = argumentos.join(',');

  // Usa los argumentos si existen; si no, usa ZIP_CODE desde el .env.
  const textoZips = textoArgumentos || process.env.ZIP_CODE;

  // Convierte el texto recibido en un array de ZIPs sin espacios vacios.
  const zips = textoAListaDeZips(textoZips);

  // Si no hay ZIPs, muestra error en formato JSON y termina.
  if (zips.length === 0) {
    // Imprime el error como JSON legible con indentacion de 2 espacios.
    console.log(JSON.stringify({
      ok: false,
      error: {
        code: 'ZIP_REQUIRED',
        message: 'Debes enviar un ZIP. Ejemplo: node src/index.js 80203'
      }
    }, null, 2));

    // Marca el proceso como fallido sin cortar bruscamente la ejecucion.
    process.exitCode = 1;

    // Sale de main para no seguir consultando APIs.
    return;
  }

  // Si hay un ZIP llama a la funcion individual; si hay varios llama a la funcion multiple.
  const resultado = zips.length === 1
    ? await obtenerContextoPorZip(zips[0])
    : await obtenerContextoParaMultiplesZips(zips);

  // Imprime el resultado final como JSON bonito en consola.
  console.log(JSON.stringify(resultado, null, 2));
}

// Ejecuta la funcion principal.
main();
