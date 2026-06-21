
// Servicio para obtener la calidad del aire usando la API de Open-Meteo.

const { OPEN_METEO_AIR_API_URL } = require('../config');

// Convierte el AQI numérico en una categoría fácil de entender.

//aqi es un número entero que representa el Índice de Calidad del Aire según la API de Open-Meteo Air Quality.

function obtenerNivelAqi(aqi) {

  if (aqi === null || aqi === undefined) return 'Unknown';
  
  if (aqi <= 50) return 'Good'; // AQI de 0 a 50 se considera buena calidad del aire.
  
  if (aqi <= 100) return 'Moderate'; // AQI de 51 a 100 se considera calidad del aire moderada.
  
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups'; // AQI de 101 a 150 se considera no saludable para grupos sensibles.
  
  if (aqi <= 200) return 'Unhealthy'; // AQI de 151 a 200 se considera no saludable para la población general.
  
  if (aqi <= 300) return 'Very Unhealthy';// AQI de 201 a 300 se considera muy no saludable.
  
  return 'Hazardous'; // AQI de 301 en adelante se considera peligroso.
}

// Encuentra el contaminante que tiene el componente AQI más alto.

function obtenerContaminanteDominante(datosAire) {

  // Se comparan componentes AQI y no concentraciones crudas con escalas diferentes.
  
  const componentesAqi = { // Estos campos salen de la API de Open-Meteo Air Quality y representan el AQI específico para cada contaminante.
   
    pm2_5: datosAire.us_aqi_pm2_5, // PM2.5 es material particulado fino con un diámetro de 2.5 micrómetros o menos.
   
    pm10: datosAire.us_aqi_pm10, // PM10 es material particulado con un diámetro de 10 micrómetros o menos.
   
    ozone: datosAire.us_aqi_ozone, // Ozone es el ozono a nivel del suelo, un contaminante que puede afectar la salud respiratoria.
   
    nitrogen_dioxide: datosAire.us_aqi_nitrogen_dioxide, // Dióxido de nitrógeno es un contaminante que puede afectar la salud respiratoria.
   
    sulphur_dioxide: datosAire.us_aqi_sulphur_dioxide, // Dióxido de azufre es un contaminante que puede afectar la salud respiratoria.
   
    carbon_monoxide: datosAire.us_aqi_carbon_monoxide // Monóxido de carbono es un contaminante que puede afectar la salud respiratoria.
  };

  let nombreMayor = 'unknown'; // Si no hay datos válidos, se devuelve 'unknown' como contaminante dominante.

  let valorMayor = -1; // Se inicia en -1 para asegurar que cualquier valor de AQI válido (0 o más) lo supere.

  for (const nombre in componentesAqi) {// Se itera sobre cada componente AQI para encontrar cuál tiene el valor más alto, lo que indica el contaminante dominante en ese momento.

    const valor = componentesAqi[nombre];// Se verifica que el valor sea un número válido antes de compararlo.

    if (typeof valor === 'number' && valor > valorMayor) {// Si el valor es un número y es mayor que el valorMayor actual, se actualizan nombreMayor y valorMayor para reflejar el nuevo contaminante dominante encontrado.
  
      nombreMayor = nombre; // El nombre del contaminante con el AQI más alto se guarda en nombreMayor.

      valorMayor = valor; // El valor del AQI más alto encontrado se guarda en valorMayor para futuras comparaciones.

    }
  }

  return nombreMayor; // Se devuelve el nombre del contaminante que tiene el componente AQI más alto, o 'unknown' si no se encontraron datos válidos.
}

// Consulta Open-Meteo y devuelve la calidad del aire de una ubicación.

async function obtenerCalidadAire(lat, lon) { 
  const variables = [// Estos son los parámetros que se solicitan a la API de Open-Meteo Air Quality para obtener tanto el AQI general como los componentes específicos que contribuyen al AQI.
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
  ].join(','); // Se unen los nombres de las variables con comas para formar la cadena que se pasará como parámetro en la consulta a la API de Open-Meteo Air Quality.

  // Se crea un objeto URL a partir de la constante OPEN_METEO_AIR_API_URL, que contiene la URL base de la API de Open-Meteo Air Quality. 
  // Esto facilita la construcción de la URL final con los parámetros necesarios para la consulta.
 
  const url = new URL(OPEN_METEO_AIR_API_URL);
  url.searchParams.set('latitude', lat); //
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', variables);

  const respuesta = await fetch(url); //Consultamos la API de Open-Meteo Air Quality usando fetch, pasando la URL construida con los parámetros solicitados por esta.
 
  if (!respuesta.ok) { // Si la respuesta de la API no es exitosa (código de estado HTTP no en el rango 200-299), se lanza un error con un mensaje que incluye el código de estado HTTP recibido, lo que ayuda a identificar problemas con la consulta a la API.
 
    throw new Error(`Open-Meteo Air Quality respondió con HTTP ${respuesta.status}`); // Si la respuesta es exitosa, se continúa con el procesamiento de los datos recibidos de la API de Open-Meteo Air Quality para extraer la información relevante sobre la calidad del aire.
 
  }

  const datos = await respuesta.json(); // Se espera a que la respuesta se convierta a formato JSON, lo que permite acceder a los datos estructurados que la API de Open-Meteo Air Quality devuelve sobre la calidad del aire en la ubicación especificada por latitud y longitud.
  const actual = datos.current; // Se extrae la sección 'current' del JSON, que contiene los datos actuales de calidad del aire, incluyendo el AQI general y los componentes específicos que contribuyen al AQI. Si esta sección no está presente, se lanza un error indicando que la API no devolvió la información esperada sobre la calidad del aire actual.

  if (!actual) { // Si la sección 'current' no está presente en los datos recibidos se lanza un error el cual puede ser personalizado.
    throw new Error('Open-Meteo no devolvió calidad del aire actual.');
  }

  //Devolvemos un objeto con el AQi general con los siguientes campos:
  //aqi_us: el valor numérico del AQI general según la API de Open-Meteo Air Quality.
  //level: la categoría de calidad del aire correspondiente al valor de AQI, obtenida mediante la función obtenerNivelAqi.
  //dominant_pollutant: el nombre del contaminante que tiene el componente AQI más alto, obtenido mediante la función obtenerContaminanteDominante.
  //details: un objeto que incluye los valores específicos de PM2.5, PM10 y ozono, que son componentes clave para evaluar la calidad del aire y entender qué contaminantes están presentes en la ubicación consultada.
 
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

//Exportamos las funciones para ser utilizados en otros modulos o componentes.
module.exports = {
  obtenerCalidadAire,
  obtenerNivelAqi,
  obtenerContaminanteDominante
};
