// Convierte el texto recibido en una lista limpia de ZIP codes.
function textoAListaDeZips(texto) {
  if (!texto) {
    return [];
  }

  // Separa por comas o espacios. Ejemplo: "80203, 90210".
  const partes = String(texto).split(/[\s,]+/);
  const zips = [];

  for (const parte of partes) { // Recorremos cada parte obtenida al separar el texto por comas o espacios.

    const zipLimpio = parte.trim(); // Elimina espacios en blanco al inicio y al final de cada parte.

    if (zipLimpio !== '') { // Solo agregamos partes que no estén vacías después de limpiar.

      zips.push(zipLimpio);// Agrega el ZIP limpio a la lista de zips.
    }
  }

  return zips;
}

// Comprueba que un ZIP contenga exactamente cinco números.
function esZipValido(zip) {
  const formatoZip = /^\d{5}$/;
  return formatoZip.test(String(zip));
}

// Devuelve los valores de una lista que no tienen formato de ZIP válido.
function buscarZipsInvalidos(zips) {
  const invalidos = [];

  for (const zip of zips) { // Recorremos cada ZIP en la lista y verificamos si es válido utilizando la función esZipValido. Si no es válido, lo agregamos a la lista de inválidos.
    if (!esZipValido(zip)) {
      invalidos.push(zip);
    }
  }

  return invalidos;
}

module.exports = {
  textoAListaDeZips,
  esZipValido,
  buscarZipsInvalidos
};
