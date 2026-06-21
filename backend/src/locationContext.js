//========================================================================================================================================================================
// AQUI SE ENCUENTRA LA LOGICA PRINCIPAL DEL PROYECTO, DONDE SE COORDINAN LAS LLAMADAS A LOS SERVICIOS EXTERNOS PARA OBTENER LA UBICACION, EL CLIMA Y LA CALIDAD DEL AIRE, 
// ASI COMO EL CALCULO DEL OUTDOOR SCORE Y LA CREACION DEL CONTEXTO PARA LOS AGENTES. 
// TAMBIEN SE IMPLEMENTA UN SISTEMA DE CACHE PARA EVITAR LLAMADAS REPETIDAS PARA EL MISMO ZIP DURANTE LA SESION lo que se me solicito en la prueba.
//========================================================================================================================================================================

//Mandamos a llamar las funciones necesarias para obtener la ubicacion y el clima, procesar los argumentos de entrada y manejar errores.

const { obtenerUbicacion } = require('./services/locationService'); //Importamos la función para obtener la ubicación, que se encarga de intentar obtener la ubicación por ZIP y usar la IP como respaldo si el ZIP falla.

const { obtenerClima } = require('./services/weatherService');//Importamos la función para obtener el clima, que consulta la API de Open-Meteo con las coordenadas obtenidas de la ubicación para obtener los datos principales del clima actual.

const { obtenerCalidadAire } = require('./services/airQualityService'); //Importamos la función para obtener la calidad del aire, que consulta la API de calidad del aire de Open-Meteo con las coordenadas obtenidas de la ubicación para obtener los datos principales de la calidad del aire actual.

const { calcularOutdoorScore } = require('./domain/outdoorScore'); //Importamos la función para calcular el outdoor score, que evalúa las condiciones climáticas y de calidad del aire para calcular un puntaje de salida al aire libre.

const { crearAgentContext } = require('./domain/agentContext'); //Importamos la función para crear el contexto del agente, que construye un objeto con toda la información relevante de ubicación, clima, calidad del aire y outdoor score que se puede utilizar para alimentar a los agentes en sus respuestas o acciones.

const { textoAListaDeZips } = require('./utils/zipParser'); //Importamos la función para convertir un texto de entrada en una lista de ZIPs, que se encarga de procesar el texto ingresado por el usuario, separar los posibles ZIPs por comas o espacios, eliminar espacios en blanco y devolver solo los ZIPs válidos para su posterior procesamiento.

const { mapearCondicion } = require('./domain/weatherCodes'); //Importamos la función para mapear el código meteorológico a una condición legible, que se utiliza para interpretar el código meteorológico devuelto por la API de Open-Meteo y obtener una descripción legible de la condición climática actual.

// Evita repetir llamadas externas para un ZIP ya consultado durante la sesión asi damos respuestas mas rapidas.
const cache = new Map();

// Construye un objeto de error con el mismo formato en todo el proyecto.
function crearError(codigo, mensaje, detalle) {
  return {
    ok: false,
    error: {
      code: codigo,
      message: mensaje,
      detail: detalle || null
    }
  };
}

// Coordina ubicación, clima, aire, score y caché para un ZIP.
async function obtenerContextoPorZip(zip) {
  const zipLimpio = String(zip).trim();

  if (cache.has(zipLimpio)) {
    const resultadoGuardado = cache.get(zipLimpio); // Si el resultado ya está en caché, lo devolvemos directamente para evitar llamadas externas repetidas y mejorar la velocidad de respuesta para el mismo ZIP durante la sesión.

    // La copia evita modificar el resultado original guardado en el caché.
    const copiaResultado = { ...resultadoGuardado }; // Creamos una copia superficial del resultado guardado en caché para evitar modificar el objeto original que está almacenado en el caché.

    copiaResultado.cache = { hit: true }; // Marcamos que esta respuesta fue un "hit" de caché para que el consumidor del resultado pueda saber que esta información proviene del caché y no de una consulta externa reciente.

    return copiaResultado; // Devolvemos la copia del resultado guardado en caché con la información de que fue un hit de caché.
  }

  try {

    // Primero intentamos obtener la ubicación por ZIP, y si falla, la función buscarUbicacionPorZip se encargará de intentar obtenerla por IP como respaldo.

    const ubicacion = await obtenerUbicacion(zipLimpio); 

    // Ninguna consulta depende de la otra, por eso se ejecutan en paralelo.
    const consultas = [
      obtenerClima(ubicacion.lat, ubicacion.lon),
      obtenerCalidadAire(ubicacion.lat, ubicacion.lon)
    ];
    const respuestas = await Promise.all(consultas);
    const clima = respuestas[0];
    const aire = respuestas[1];

    const outdoorScore = calcularOutdoorScore(clima, aire);

    // Creamos el contexto del agente con toda la información obtenida y calculada, que se puede utilizar para alimentar a los agentes en sus respuestas o acciones.

    const agentContext = crearAgentContext(
      
      ubicacion, //La información de ubicación obtenida, que incluye ciudad, estado, país, latitud, longitud y la fuente de la información (ZIP o IP).
      
      clima,//La información del clima actual obtenida, que incluye temperatura, velocidad del viento, código meteorológico y condición climática legible.
      
      aire,//La información de la calidad del aire actual obtenida, que incluye el índice de calidad del aire (AQI) y los principales contaminantes.
      
      outdoorScore//El puntaje de salida al aire libre calculado, que evalúa las condiciones climáticas y de calidad del aire para determinar qué tan favorable es salir al aire libre.
    );

    const resultado = { //Construimos el resultado final que se devolverá al usuario, incluyendo toda la información relevante de ubicación y en el formato solicitado., 
      ok: true,
      input: {
        zip: zipLimpio,
        source: ubicacion.source
      },
      location: {
        city: ubicacion.city,
        state: ubicacion.state,
        country: ubicacion.country,
        lat: ubicacion.lat,
        lon: ubicacion.lon
      },
      weather: clima,
      air_quality: aire,
      outdoor_score: outdoorScore,
      agent_context: agentContext,
      cache: { hit: false }
    };

    cache.set(zipLimpio, resultado);
    return resultado;
  } catch (error) {
    return crearError(
      'LOCATION_CONTEXT_FAILED',
      'No fue posible crear el contexto de ubicación.',
      error.message
    );
  }
}

// Consulta varios ZIP codes en paralelo y devuelve todos sus contextos. 
async function obtenerContextoParaMultiplesZips(zips) {
  const consultas = [];

  for (const zip of zips) {
    consultas.push(obtenerContextoPorZip(zip));
  }

  return Promise.all(consultas);
}

module.exports = {
  obtenerContextoPorZip,
  obtenerContextoParaMultiplesZips,
  textoAListaDeZips,
  mapearCondicion,
  calcularOutdoorScore,
  cache
};
