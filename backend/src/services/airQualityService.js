
// Este archivo consulta la calidad del aire y prepara los datos que usa el proyecto.

const { OPEN_METEO_AIR_API_URL } = require('../config');

// Recibimos el numero del AQI y devolvemos el nivel al que pertenece.
// Si el valor no viene en la respuesta, devolvemos Unknown.

function obtenerNivelAqi(aqi) {
  if (aqi === null || aqi === undefined) return 'Unknown';
  if (aqi <= 50) return 'Good'; // AQI de 0 a 50 se considera buena calidad del aire.
  if (aqi <= 100) return 'Moderate'; // AQI de 51 a 100 se considera calidad del aire moderada.
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups'; // AQI de 101 a 150 se considera poco saludable para grupos sensibles.
  if (aqi <= 200) return 'Unhealthy'; // AQI de 151 a 200 se considera poco saludable para la población general.
  if (aqi <= 300) return 'Very Unhealthy'; // AQI de 201 a 300 se considera muy poco saludable para la salud.
  return 'Hazardous'; // AQI mayor a 300 se considera peligrosa para la salud.
}

// Recibimos los componentes AQI de cada contaminante, los comparamos y devolvemos
// el nombre del que tenga el valor mas alto. Si no hay datos devolvemos unknown.

function obtenerContaminanteDominante(datosAire) {
  // Se comparan componentes AQI, no concentraciones con unidades diferentes.
  const componentesAqi = {
    pm2_5: datosAire.us_aqi_pm2_5,
    pm10: datosAire.us_aqi_pm10,
    ozone: datosAire.us_aqi_ozone,
    nitrogen_dioxide: datosAire.us_aqi_nitrogen_dioxide,
    sulphur_dioxide: datosAire.us_aqi_sulphur_dioxide,
    carbon_monoxide: datosAire.us_aqi_carbon_monoxide
  };

  let nombreMayor = 'unknown';
  let valorMayor = -1;

  for (const [nombre, valor] of Object.entries(componentesAqi)) {
    if (typeof valor === 'number' && valor > valorMayor) {
      nombreMayor = nombre;
      valorMayor = valor;
    }
  }

  return nombreMayor; // Devolvemos el nombre del contaminante dominante o 'unknown' si no hay datos válidos.
}

// Recibimos latitud y longitud, pedimos a Open-Meteo el AQI y sus componentes,
// y devolvemos el nivel, el contaminante dominante y los detalles principales.

async function obtenerCalidadAire(lat, lon) {
  const variables = [
    'us_aqi',
    'pm2_5',
    'pm10',
    'ozone',
    'us_aqi_pm2_5',
    'us_aqi_pm10',
    'us_aqi_ozone',
    'us_aqi_nitrogen_dioxide',
    'us_aqi_sulphur_dioxide',
    'us_aqi_carbon_monoxide'
  ].join(',');

  const url = new URL(OPEN_METEO_AIR_API_URL);
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', variables);

  const respuesta = await fetch(url); // Hacemos la petición a Open-Meteo Air Quality API con los parámetros adecuados.

  if (!respuesta.ok) {
    throw new Error(
      `Open-Meteo Air Quality respondió con HTTP ${respuesta.status}` // Si la respuesta no es exitosa, lanzamos un error con el código de estado para facilitar el diagnóstico.
    );
  }

  const datos = await respuesta.json(); // Parseamos la respuesta JSON para obtener los datos de calidad del aire.
  const actual = datos.current;

  if (!actual) {
    throw new Error('Open-Meteo no devolvió calidad del aire actual.'); // Si no hay datos actuales, lanzamos un error indicando que la información no está disponible.
  }

  // Preparamos un objeto con la información relevante para el proyecto, incluyendo el AQI, el nivel, el contaminante dominante y los detalles principales.
  return {
    aqi_us: actual.us_aqi, 
    level: obtenerNivelAqi(actual.us_aqi),
    dominant_pollutant: obtenerContaminanteDominante(actual),
    details: {
      pm2_5: actual.pm2_5,
      pm10: actual.pm10,
      ozone: actual.ozone
    }
  };
}

module.exports = {
  obtenerCalidadAire,
  obtenerNivelAqi,
  obtenerContaminanteDominante
};
