const {
  obtenerContextoPorZip,
  obtenerContextoParaMultiplesZips
} = require('./locationContext');

// Este es el punto de entrada principal para la ejecución desde la línea de comandos. Lee los argumentos, valida los ZIPs y muestra el resultado o errores en formato JSON.
//  Se encarga de manejar la interacción con el usuario a través de la consola, mientras que la lógica de negocio se delega a los servicios y utilidades correspondientes.

const {
  textoAListaDeZips,
  buscarZipsInvalidos
} = require('./utils/zipParser'); // Importamos las funciones de utilidad para procesar el texto de entrada y validar los ZIPs.

// Lee los argumentos de la consola, los valida y ejecuta la consulta.

async function main() {
  const argumentos = process.argv.slice(2); //Obtenemos los argumentos ingresados por el usaurio al ejecutar la pruebas desde la consola, ignorando los dos primeros elementos que corresponden a la ruta de Node.js y la ruta del script.
  let textoEntrada = argumentos.join(','); //Unimos los argumentos en un solo string, separados por comas, para facilitar su procesamiento posterior. Esto permite que el usuario ingrese múltiples ZIPs separados por espacios o comas, y el programa los procesará correctamente.

  if (textoEntrada === '') { //Si el usuario no ingresó ningún argumento, intentamos obtener un ZIP de las variables de entorno que deje quemada en el .env.
    textoEntrada = process.env.ZIP_CODE; 
  }

  const zips = textoAListaDeZips(textoEntrada); // Separa la entrada por comas o espacios; después se valida cada valor.

  if (zips.length === 0) { //Si despues de procesar el texto no se obtiene un zip valido, mostramos un error que necesitamos un zip valido.
    mostrarError(
      'ZIP_REQUIRED',
      'Debes enviar un ZIP de cinco dígitos. Ejemplo: npm run cli -- 80203'
    );
    return;
  }

  const invalidos = buscarZipsInvalidos(zips); //Buscamos los zips que no tienen formato valido, para vaidar que si cumplan con el formato de 5 digitos.

  if (invalidos.length > 0) {
    mostrarError(
      'ZIP_INVALID',
      'Cada ZIP debe contener exactamente cinco dígitos.',
      invalidos
    );
    return;
  }

  let resultado;

  if (zips.length === 1) { //Si solo se ingresa un valor de zip ejecutamos la funcion para obtener el resultado para un solo zip.
    resultado = await obtenerContextoPorZip(zips[0]);
  } else {
    resultado = await obtenerContextoParaMultiplesZips(zips);//Si se ingresa mas de uno es la ejecucion multiples zips, que devuelve un array con los resultados para cada zip ingresado.
  }

  console.log(JSON.stringify(resultado, null, 2)); //Imprimimos el resultado en formato JSON con una indentación de 2 espacios para que sea legible en la consola.s
}

// Imprime un error en JSON y marca la ejecución como fallida.
function mostrarError(codigo, mensaje, valoresInvalidos) {
  const error = { //Estructuramos el error en un formato JSON consistente, incluyendo un código de error, un mensaje descriptivo y opcionalmente una lista de valores inválidos que causaron el error. Esto facilita la comprensión del error para el usuario y permite una mejor depuración.
    ok: false,
    error: {
      code: codigo,
      message: mensaje
    }
  };

  if (valoresInvalidos) { //Si se proporcionan valores inválidos, los agregamos al objeto de error para que el usuario pueda identificar qué entradas causaron el problema.
    error.error.invalid_values = valoresInvalidos;
  }

  console.error(JSON.stringify(error, null, 2)); //Imprimimos el error en formato JSON con una indentación de 2 espacios para que sea legible en la consola.
  process.exitCode = 1;
}

// Captura cualquier error inesperado que no fue manejado dentro de main.
main().catch(function (error) {
  mostrarError('UNEXPECTED_ERROR', error.message);
});
