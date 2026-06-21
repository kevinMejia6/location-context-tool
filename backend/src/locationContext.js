
// Aqui juntamos toda la informacion que necesitamos para crear el contexto final.
// Buscamos ubicacion, clima y aire, calculamos el score y guardamos el resultado en cache.


const { obtenerUbicacion } = require('./services/locationService');
const { obtenerClima } = require('./services/weatherService');
const { obtenerCalidadAire } = require('./services/airQualityService');
const { calcularOutdoorScore } = require('./domain/outdoorScore');
const { crearAgentContext } = require('./domain/agentContext');
const { textoAListaDeZips } = require('./utils/zipParser');
const { mapearCondicion } = require('./domain/weatherCodes');

// La caché evita repetir llamadas externas para un ZIP durante la sesión.
const cache = new Map();

// Creamos un objeto de error con el mismo formato para usarlo en todo el proyecto.
// Recibimos un codigo, un mensaje y un detalle opcional con la causa original.

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

// Recibimos un ZIP y devolvemos todo su contexto. Primero revisamos si ya esta en cache.
// Si no esta, buscamos la ubicacion, consultamos clima y aire al mismo tiempo,
// calculamos el outdoor score y creamos el resumen que usara el agente.

async function obtenerContextoPorZip(zip) {
  const zipLimpio = String(zip).trim();

  if (cache.has(zipLimpio)) {
    // Se copia el resultado para no modificar el objeto almacenado en caché.
    return {
      ...cache.get(zipLimpio),
      cache: { hit: true }
    };
  }

  try {
    const ubicacion = await obtenerUbicacion(zipLimpio); // Primero obtenemos la ubicacion para tener las coordenadas necesarias para las siguientes consultas.

    // Ambas consultas son independientes y pueden ejecutarse en paralelo  ya que no dependen entre sí solo necesitan las coordenadas.

    const [clima, aire] = await Promise.all([
      obtenerClima(ubicacion.lat, ubicacion.lon),
      obtenerCalidadAire(ubicacion.lat, ubicacion.lon)
    ]);

    const outdoorScore = calcularOutdoorScore(clima, aire); // Calculamos el outdoor score usando la logica de negocio que definimos en la carpeta domain.
    const agentContext = crearAgentContext( // Creamos el contexto resumido que usara el agente para entender la ubicacion y su entorno. Solo le damos lo esencial para que pueda tomar decisiones sin abrumarlo con datos innecesarios.
      ubicacion,
      clima,
      aire,
      outdoorScore
    );

    const resultado = { // Armamos el resultado final con toda la informacion relevante para ese ZIP. Este es el formato que se muestra en la consola y que puede usar el agente.
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

// Recibimos una lista de ZIP y consultamos todos al mismo tiempo.
// Promise.all mantiene los resultados en el mismo orden en que llegaron los ZIP.

async function obtenerContextoParaMultiplesZips(zips) {
  return Promise.all(zips.map(obtenerContextoPorZip));
}

module.exports = {
  obtenerContextoPorZip,
  obtenerContextoParaMultiplesZips,
  textoAListaDeZips,
  mapearCondicion,
  calcularOutdoorScore,
  cache
};
