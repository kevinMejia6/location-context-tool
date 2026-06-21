
// Este archivo busca la ubicacion del usuario. Primero usamos el ZIP y, si falla,
// intentamos obtener una ubicacion aproximada usando la IP como respaldo.

const {
  ZIPPOPOTAMUS_API_URL,
  IP_API_URL
} = require('../config');

// Recibimos un ZIP, lo buscamos en Zippopotam y devolvemos ciudad, estado, pais
// y coordenadas. Si la API falla o no encuentra lugares, lanzamos un error.

async function buscarUbicacionPorZip(zip) {
  const respuesta = await fetch(
    `${ZIPPOPOTAMUS_API_URL}/us/${encodeURIComponent(zip)}`
  ); // Hacemos la petición a Zippopotam usando el ZIP proporcionado, asegurándonos de codificarlo correctamente para la URL.

  if (!respuesta.ok) {
    throw new Error(`zippopotam.us respondió con HTTP ${respuesta.status}`); //
  }

  const datos = await respuesta.json();
  const lugar = datos.places?.[0];

  if (!lugar) {
    throw new Error('El ZIP no devolvió una ubicación.');
  }

  return {
    source: 'zip',
    zip,
    city: lugar['place name'],
    state: lugar.state,
    country: datos['country abbreviation'],
    lat: Number(lugar.latitude),
    lon: Number(lugar.longitude)
  };
}

// Esta funcion entra cuando no pudimos resolver el ZIP. Recibimos el ZIP original
// y el motivo del error, consultamos ip-api y devolvemos una ubicacion aproximada.

async function buscarUbicacionPorIp(zipOriginal, motivoFalloZip) {
  const fields = 'status,message,countryCode,regionName,city,lat,lon,zip';
  const respuesta = await fetch(`${IP_API_URL}?fields=${fields}`);

  if (!respuesta.ok) {
    throw new Error(`ip-api.com respondió con HTTP ${respuesta.status}`);
  }

  const datos = await respuesta.json();

  if (datos.status !== 'success') {
    throw new Error(datos.message || 'No se pudo detectar la ubicación por IP.');
  }

  return { // Aunque la ubicación por IP es menos precisa, devolvemos la información disponible junto con el motivo del fallo del ZIP para transparencia.
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

// Aqui controlamos el orden de busqueda. Primero intentamos por ZIP y si ocurre
// cualquier error usamos la funcion de ubicacion por IP como segunda opcion.

async function obtenerUbicacion(zip) {
  try {
    return await buscarUbicacionPorZip(zip);
  } catch (errorZip) {
    // El fallback mantiene el servicio disponible si el ZIP no puede resolverse.
    return buscarUbicacionPorIp(zip, errorZip.message);
  }
}

module.exports = { obtenerUbicacion };
