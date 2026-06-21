
// Aqui tenemos las funciones que limpian y validan los ZIP ingresados por el usuario.
// Recibimos todo el texto ingresado, lo separamos por comas o espacios y devolvemos
// una lista limpia. En esta funcion solo separamos los valores, todavia no los validamos.

function textoAListaDeZips(texto) {
  if (!texto) {
    return [];
  }

  return String(texto)
    .split(/[\s,]+/)
    .map((zip) => zip.trim())
    .filter(Boolean);
}

// Revisamos un ZIP y devolvemos true solamente si contiene exactamente cinco numeros.
function esZipValido(zip) {
  return /^\d{5}$/.test(String(zip));
}

// Recorremos la lista de ZIP y devolvemos solamente los que tienen un formato incorrecto.
function buscarZipsInvalidos(zips) {
  return zips.filter((zip) => !esZipValido(zip));
}

module.exports = {
  textoAListaDeZips,
  esZipValido,
  buscarZipsInvalidos
};
