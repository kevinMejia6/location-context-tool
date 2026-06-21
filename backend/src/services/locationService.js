
// Este módulo se encarga de obtener la ubicación geográfica a partir de un código postal (ZIP) y, si eso falla, 
// intenta obtener una ubicación aproximada basada en la dirección IP observada por el servidor. Utiliza dos APIs externas: Zippopotam 
// para convertir el ZIP en ciudad y coordenadas, e ip-api como respaldo para obtener una ubicación aproximada por IP cuando no funciona el ZIP.

const { 
  ZIPPOPOTAMUS_API_URL,
  IP_API_URL
} = require('../config');

// Consulta Zippopotam para convertir un ZIP en ciudad y coordenadas.

//Zipopotam.us es una API gratuita que devuelve información geográfica basada en códigos postales de Estados Unidos.

async function buscarUbicacionPorZip(zip) {
  const respuesta = await fetch(`${ZIPPOPOTAMUS_API_URL}/us/${encodeURIComponent(zip)}`); // La API de Zippopotam.us requiere el país como parte de la URL, en este caso 'us' para Estados Unidos. El ZIP se codifica para asegurar que caracteres especiales no causen problemas en la URL.

  if (!respuesta.ok) { //En dado caso nos diera error, lanzamos un error con el codifo de estado HTTP para que el servicio pueda manejarlo y decidir usar la ubicación por IP como respaldo, lo que fue solicitado en la prueba.
    throw new Error(`zippopotam.us respondió con HTTP ${respuesta.status}`); 
  }

// Si la respuesta es exitosa, se procesa el JSON para extraer la información de ubicación. La API de Zippopotam.us devuelve un objeto con una propiedad 'places' que es un array de lugares asociados al ZIP. Normalmente, se toma el primer lugar del array para obtener la ciudad, estado y coordenadas.
  const datos = await respuesta.json();

  let lugar; // Inicializamos la variable lugar para almacenar la información del primer lugar encontrado en el array 'places'.

  if (datos.places && datos.places.length > 0) { // Verificamos que la propiedad 'places' exista y tenga al menos un elemento antes de intentar acceder a él para evitar errores en caso de que el ZIP no devuelva resultados.
    lugar = datos.places[0];
  }

  if (!lugar) {
    throw new Error('El ZIP no devolvió una ubicación.'); // Si no se encontró ningún lugar asociado al ZIP, lanzamos un error para que el servicio pueda manejarlo y decidir usar la ubicación por IP como respaldo.
  }

  return { // Devolvemos un objeto con la información de ubicacion obtenida del Zip,incluyendo que la fuente de la informacion proviene del ZIP y no de la IP.
    source: 'zip',
    zip,
    city: lugar['place name'],
    state: lugar.state,
    country: datos['country abbreviation'],
    lat: Number(lugar.latitude),
    lon: Number(lugar.longitude)
  };
}

// Obtiene una ubicación aproximada por IP cuando no funciona el ZIP.
async function buscarUbicacionPorIp(zipOriginal, motivoFalloZip) { //Si la funcion que busca por ZIP falla por x motivo, entra esta al rescate.
  const fields = 'status,message,countryCode,regionName,city,lat,lon,zip'; //La api nos permite seleccionar que campos deseamos, en este caso seleccionamos los siguintes: status (para verificar si la consulta fue exitosa), message (para obtener detalles en caso de error), countryCode (código del país), regionName (nombre de la región o estado), city (nombre de la ciudad), lat (latitud), lon (longitud) y zip (código postal aproximado basado en la IP, aunque no siempre estará disponible o será preciso).
  const respuesta = await fetch(`${IP_API_URL}?fields=${fields}`); //Consultamos la API con los campos con la informacion que necesitamos.

  if (!respuesta.ok) {
    throw new Error(`ip-api.com respondió con HTTP ${respuesta.status}`);
  }

  
  const datos = await respuesta.json();

  if (datos.status !== 'success') { //Si status es diferente de success, significa que la consulta no fue exitosa, por lo que lanzamos un error con el mensaje proporcionado por la API.
    throw new Error(datos.message || 'No se pudo detectar la ubicación por IP.');
  }

  //Devolvemos el objeto con la informacion y la estructura solicitada en la prueba.
  return {
    source: 'ip_fallback',
    zip: datos.zip || null,
    zip_original: zipOriginal,
    fallback_reason: motivoFalloZip,
    city: datos.city,
    state: datos.regionName,
    country: datos.countryCode,
    lat: Number(datos.lat),
    lon: Number(datos.lon)
  };
}

// Intenta obtener la ubicación por ZIP y usa la IP como segunda opción.

async function obtenerUbicacion(zip) {
  try {
    return await buscarUbicacionPorZip(zip);
  } catch (errorZip) {
    // La prueba solicita intentar una ubicación aproximada si falla el ZIP.
    return buscarUbicacionPorIp(zip, errorZip.message);
  }
}

module.exports = { obtenerUbicacion };
