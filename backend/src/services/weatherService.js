
// Este archivo se encarga de consultar el clima actual en Open-Meteo.

const { OPEN_METEO_WEATHER_API_URL } = require('../config');
const { mapearCondicion } = require('../domain/weatherCodes');

// Recibimos la latitud y longitud, armamos la URL con las unidades que necesitamos
// y devolvemos temperatura, viento, codigo meteorologico y la condicion ya traducida.
// Si la API falla o no devuelve clima actual, lanzamos un error.

async function obtenerClima(lat, lon) { //Armamos la url con los parametros necesarios por api open-mateo
  const url = new URL(OPEN_METEO_WEATHER_API_URL);
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current_weather', 'true');// Solicitamos el clima actual.
  url.searchParams.set('temperature_unit', 'celsius');// Queremos la temperatura en grados Celsius.
  url.searchParams.set('windspeed_unit', 'kmh');// Queremos la velocidad del viento en kilómetros por hora.

  const respuesta = await fetch(url); // Hacemos la petición a Open-Meteo Weather API con los parámetros adecuados.

  if (!respuesta.ok) {
    throw new Error(`Open-Meteo Weather respondió con HTTP ${respuesta.status}`);
  }

  const datos = await respuesta.json();// Parseamos la respuesta JSON para obtener los datos de clima.
  const actual = datos.current_weather; // Extraemos el clima actual de la respuesta.

  if (!actual) {
    throw new Error('Open-Meteo no devolvió clima actual.');
  }

  // Preparamos un objeto con la información relevante para el proyecto, incluyendo la temperatura, el viento, el código meteorológico y la condición traducida a texto amigable.
  return {
    temperature_c: actual.temperature,
    windspeed_kmh: actual.windspeed,
    weathercode: actual.weathercode,
    condition: mapearCondicion(actual.weathercode)
  };
}

module.exports = { obtenerClima };
