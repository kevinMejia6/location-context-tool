// ==========================================================
// LOCATION CONTEXT TOOL
// Aqui vive la logica principal de la prueba tecnica.
// Este archivo resuelve ubicacion, clima, calidad del aire,
// outdoor score y contexto listo para un agente.
// ==========================================================

//==============================================================================================================================

// Carga variables de entorno desde .env

require("dotenv").config();

// URL base de zippopotam.us tomada desde .env o valor por defecto.
const ZIPPOPOTAMUS_API_URL =
  process.env.ZIPPOPOTAMUS_API_URL || "https://api.zippopotam.us";

// URL base de Open-Meteo Weather tomada desde .env o valor por defecto.
const OPEN_METEO_WEATHER_API_URL =
  process.env.OPEN_METEO_WEATHER_API_URL ||
  "https://api.open-meteo.com/v1/forecast";

// URL base de Open-Meteo Air Quality tomada desde .env o valor por defecto.
const OPEN_METEO_AIR_API_URL =
  process.env.OPEN_METEO_AIR_API_URL ||
  "https://air-quality-api.open-meteo.com/v1/air-quality";

// URL base de ip-api tomada desde .env o valor por defecto.
const IP_API_URL = process.env.IP_API_URL || "http://ip-api.com/json";

//==============================================================================================================================

// Cache simple en memoria para no repetir llamadas al mismo ZIP durante la misma ejecucion en dado caso ya se consulto el mismo zip anteriormente.
const cache = new Map();

// Funcion para unir una URL base con parametros query.
// Ejemplo: crearUrl('https://api.com/test', { zip: 80203 })
function crearUrl(urlBase, parametros = {}) {
  // Crea un objeto URL para manipular parametros de forma segura.
  const url = new URL(urlBase);

  // Recorre cada par nombre/valor del objeto de parametros.
  for (const [nombre, valor] of Object.entries(parametros)) {
    // Solo agrega parametros que realmente tengan valor.
    if (valor !== undefined && valor !== null) {
      // Agrega o reemplaza el parametro query dentro de la URL.
      url.searchParams.set(nombre, valor);
    }
  }

  // Devuelve la URL final como texto.
  return url.toString();
}

// Funcion pequeña para consumir cualquier API y devolver JSON.

async function pedirJson(url, nombreApi) {
  // Hace la peticion HTTP usando fetch.
  const respuesta = await fetch(url);

  // Si la API responde con error HTTP, se lanza una excepcion.
  if (!respuesta.ok) {
    // Incluye el nombre de la API y el status para facilitar depuracion.
    throw new Error(`${nombreApi} respondio con HTTP ${respuesta.status}`);
  }

  // Convierte el cuerpo de la respuesta a JSON y lo devuelve.
  return respuesta.json();
}

// 1) Buscar ubicacion por ZIP usando zippopotam.us.

async function buscarUbicacionPorZip(zip) {
  // Construye la URL de zippopotam.us para ZIP codes de Estados Unidos.
  const url = `${ZIPPOPOTAMUS_API_URL}/us/${encodeURIComponent(zip)}`;

  // Pide el JSON de ubicacion a zippopotam.us.
  const datos = await pedirJson(url, "zippopotam.us");

  // Toma el primer lugar devuelto por la API.
  const lugar = datos.places?.[0];

  // Si no hay lugar, significa que el ZIP no pudo resolverse.
  if (!lugar) {
    // Lanza error para que el flujo use fallback por IP.
    throw new Error("El ZIP no existe o no devolvio ubicacion.");
  }

  // Devuelve una ubicacion normalizada con nombres faciles de usar.
  return {
    // Indica que la ubicacion salio del ZIP.
    source: "zip",

    // Guarda el ZIP consultado.
    zip,

    // Ciudad devuelta por zippopotam.us.
    city: lugar["place name"],

    // Estado devuelto por zippopotam.us.
    state: lugar.state,

    // Pais en formato abreviado, por ejemplo US.
    country: datos["country abbreviation"],

    // Latitud convertida a numero.
    lat: Number(lugar.latitude),

    // Longitud convertida a numero.
    lon: Number(lugar.longitude),
  };
}

// 2) Fallback: si falla el ZIP, detectar ubicacion por IP.
async function buscarUbicacionPorIp(zipOriginal, motivoFalloZip) {
  // Lista de campos que se le piden a ip-api.com.
  const campos = "status,message,countryCode,regionName,city,lat,lon,zip";

  // Construye la URL incluyendo el parametro fields.
  const url = crearUrl(IP_API_URL, { fields: campos });

  // Pide el JSON de ubicacion por IP.
  const datos = await pedirJson(url, "ip-api.com");

  // ip-api responde status success cuando pudo detectar la ubicacion.
  if (datos.status !== "success") {
    // Si falla, se lanza el mensaje de la API o un mensaje generico.
    throw new Error(
      datos.message || "ip-api.com no pudo detectar la ubicacion.",
    );
  }

  // Devuelve una ubicacion normalizada que es el formato que se me solciita en la prueba usando los datos de la IP.
  return {
    // Indica que se uso fallback por IP.
    source: "ip_fallback",

    // ZIP detectado por IP si la API lo devuelve.
    zip: datos.zip || null,

    // ZIP que el usuario habia intentado consultar originalmente.
    zip_original: zipOriginal,

    // Motivo por el que fallo la busqueda por ZIP.
    fallback_reason: motivoFalloZip,

    // Ciudad detectada por IP.
    city: datos.city,

    // Region/estado detectado por IP.
    state: datos.regionName,

    // Pais detectado por IP.
    country: datos.countryCode,

    // Latitud convertida a numero.
    lat: Number(datos.lat),

    // Longitud convertida a numero.
    lon: Number(datos.lon),
  };
}

// 3) Primero intenta ZIP. Si falla, intenta IP.
async function obtenerUbicacion(zip) {
  // try/catch permite intentar una estrategia y caer a otra si falla.
  try {
    // Intenta resolver la ubicacion usando el ZIP recibido.
    return await buscarUbicacionPorZip(zip);
  } catch (errorZip) {
    // Si el ZIP falla, usa la IP como fallback automatico.
    return buscarUbicacionPorIp(zip, errorZip.message);
  }
}

// 4) Mapear weathercode WMO a una condicion entendible.
function mapearCondicion(weathercode) {
  // Convierte el codigo recibido a numero para comparar de forma segura.
  const codigo = Number(weathercode);

  // Codigo 0 significa cielo despejado.
  if (codigo === 0) return "Despejado";

  // Codigos 1 y 2 significan parcialmente nublado.
  if ([1, 2].includes(codigo)) return "Parcialmente nublado";

  // Codigo 3 significa nublado.
  if (codigo === 3) return "Nublado";

  // Codigos 45 y 48 significan niebla.
  if ([45, 48].includes(codigo)) return "Niebla";

  // Codigos 51 a 57 representan llovizna.
  if ([51, 53, 55, 56, 57].includes(codigo)) return "Llovizna";

  // Codigos 61 a 67 representan lluvia.
  if ([61, 63, 65, 66, 67].includes(codigo)) return "Lluvia";

  // Codigos 71, 73, 75 y 77 representan nieve.
  if ([71, 73, 75, 77].includes(codigo)) return "Nieve";

  // Codigos 80, 81 y 82 representan chubascos.
  if ([80, 81, 82].includes(codigo)) return "Chubascos";

  // Codigos 85 y 86 representan chubascos de nieve.
  if ([85, 86].includes(codigo)) return "Chubascos de nieve";

  // Codigos 95, 96 y 99 representan tormenta.
  if ([95, 96, 99].includes(codigo)) return "Tormenta";

  // Si no se reconoce el codigo, devuelve una condicion generica.
  return "Condicion desconocida";
}

// 5) Consultar clima actual en Open-Meteo.
async function obtenerClima(lat, lon) {
  // Construye la URL de clima usando coordenadas y unidades deseadas.
  const url = crearUrl(OPEN_METEO_WEATHER_API_URL, {
    // Latitud de la ubicacion.
    latitude: lat,

    // Longitud de la ubicacion.
    longitude: lon,

    // Pide a Open-Meteo el clima actual.
    current_weather: true,

    // Pide temperatura en grados Celsius.
    temperature_unit: "celsius",

    // Pide viento en kilometros por hora.
    windspeed_unit: "kmh",
  });

  // Pide el JSON de clima a Open-Meteo.
  const datos = await pedirJson(url, "Open-Meteo Weather");

  // Extrae la seccion current_weather de la respuesta.
  const actual = datos.current_weather;

  // Si no existe clima actual, la respuesta no sirve para esta herramienta.
  if (!actual) {
    // Lanza un error claro para que la funcion principal lo capture.
    throw new Error("Open-Meteo no devolvio clima actual.");
  }

  // Devuelve un objeto de clima simplificado.
  return {
    // Temperatura actual en Celsius.
    temperature_c: actual.temperature,

    // Velocidad del viento en km/h.
    windspeed_kmh: actual.windspeed,

    // Codigo WMO original de Open-Meteo.
    weathercode: actual.weathercode,

    // Texto entendible calculado desde weathercode.
    condition: mapearCondicion(actual.weathercode),
  };
}

// Convierte un AQI numerico en una etiqueta entendible.
function obtenerNivelAqi(aqi) {
  // Si no hay AQI, se devuelve Unknown.
  if (aqi === null || aqi === undefined) return "Unknown";

  // 0 a 50 se considera bueno.
  if (aqi <= 50) return "Good";

  // 51 a 100 se considera moderado.
  if (aqi <= 100) return "Moderate";

  // 101 a 150 afecta principalmente a grupos sensibles.
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";

  // 151 a 200 se considera no saludable.
  if (aqi <= 200) return "Unhealthy";

  // 201 a 300 se considera muy no saludable.
  if (aqi <= 300) return "Very Unhealthy";

  // Mas de 300 se considera peligroso.
  return "Hazardous";
}

// Detecta cual contaminante tiene el valor numerico mas alto.
function obtenerContaminanteDominante(actual) {
  // Agrupa los contaminantes que devuelve Open-Meteo Air Quality.
  const contaminantes = {
    // Particulas finas.
    pm2_5: actual.pm2_5,

    // Particulas respirables mas grandes.
    pm10: actual.pm10,

    // Ozono.
    ozone: actual.ozone,

    // Dioxido de nitrogeno.
    nitrogen_dioxide: actual.nitrogen_dioxide,

    // Dioxido de azufre.
    sulphur_dioxide: actual.sulphur_dioxide,

    // Monoxido de carbono.
    carbon_monoxide: actual.carbon_monoxide,
  };

  // Nombre inicial por si ningun contaminante tiene valor numerico.
  let nombreMayor = "unknown";

  // Valor inicial bajo para que cualquier numero real sea mayor.
  let valorMayor = -1;

  // Recorre cada contaminante y su valor.
  for (const [nombre, valor] of Object.entries(contaminantes)) {
    // Solo compara valores numericos y conserva el mayor encontrado.
    if (typeof valor === "number" && valor > valorMayor) {
      // Guarda el nombre del contaminante con mayor valor.
      nombreMayor = nombre;

      // Guarda el valor mas alto encontrado hasta ahora.
      valorMayor = valor;
    }
  }

  // Devuelve el nombre del contaminante dominante.
  return nombreMayor;
}

// 6) Consultar calidad del aire en Open-Meteo Air Quality.
async function obtenerCalidadAire(lat, lon) {
  // Lista de variables de calidad de aire que queremos recibir.
  const variables =
    "us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide";

  // Construye la URL de calidad de aire usando coordenadas y variables.
  const url = crearUrl(OPEN_METEO_AIR_API_URL, {
    // Latitud de la ubicacion.
    latitude: lat,

    // Longitud de la ubicacion.
    longitude: lon,

    // Variables actuales que se piden a la API.
    current: variables,
  });

  // Pide el JSON de calidad de aire a Open-Meteo.
  const datos = await pedirJson(url, "Open-Meteo Air Quality");

  // Extrae la seccion current de la respuesta.
  const actual = datos.current;

  // Si no existe current, la respuesta no trae datos utiles.
  if (!actual) {
    // Lanza un error claro para que la funcion principal lo capture.
    throw new Error("Open-Meteo no devolvio calidad del aire actual.");
  }

  // Devuelve un objeto simplificado de calidad de aire.
  return {
    // AQI de Estados Unidos; si no existe usa null.
    aqi_us: actual.us_aqi ?? null,

    // Nivel textual calculado desde el AQI.
    level: obtenerNivelAqi(actual.us_aqi),

    // Contaminante con mayor valor numerico entre los disponibles.
    dominant_pollutant: obtenerContaminanteDominante(actual),

    // Detalle adicional de algunos contaminantes principales.
    details: {
      // PM2.5 o null si no viene en la respuesta.
      pm2_5: actual.pm2_5 ?? null,

      // PM10 o null si no viene en la respuesta.
      pm10: actual.pm10 ?? null,

      // Ozono o null si no viene en la respuesta.
      ozone: actual.ozone ?? null,
    },
  };
}

// 7) Calcular outdoor_score del 1 al 10.
// Empezamos en 10 y restamos puntos por clima incomodo.
function calcularOutdoorScore(clima, aire) {
  // Puntaje inicial perfecto.
  let score = 10;

  // Temperatura actual tomada del objeto clima.
  const temp = clima.temperature_c;

  // Velocidad del viento tomada del objeto clima.
  const viento = clima.windspeed_kmh;

  // Condicion textual tomada del objeto clima.
  const condicion = clima.condition;

  // AQI tomado del objeto de calidad de aire.
  const aqi = aire.aqi_us;

  // Temperatura: lo mas comodo es entre 18 y 27 grados.
  if (temp < 5 || temp > 38) score -= 3;
  else if (temp < 12 || temp > 32) score -= 2;
  else if (temp < 18 || temp > 27) score -= 1;

  // Viento: entre mas fuerte, menos comodo para salir.
  if (viento > 50) score -= 3;
  else if (viento > 35) score -= 2;
  else if (viento > 20) score -= 1;

  // Tormenta penaliza mas porque suele ser mala condicion para actividades al aire libre.
  if (["Tormenta"].includes(condicion)) score -= 4;
  // Lluvia, chubascos o nieve penalizan bastante.
  else if (
    ["Lluvia", "Chubascos", "Nieve", "Chubascos de nieve"].includes(condicion)
  )
    score -= 3;
  // Llovizna penaliza de forma media.
  else if (["Llovizna"].includes(condicion)) score -= 2;
  // Nublado, niebla o condicion desconocida penalizan poco.
  else if (["Nublado", "Niebla", "Condicion desconocida"].includes(condicion))
    score -= 1;

  // Si no hay AQI, se resta un punto por incertidumbre.
  if (aqi === null || aqi === undefined) score -= 1;
  // AQI mayor a 200 penaliza mucho.
  else if (aqi > 200) score -= 4;
  // AQI entre 151 y 200 penaliza 3 puntos.
  else if (aqi > 150) score -= 3;
  // AQI entre 101 y 150 penaliza 2 puntos.
  else if (aqi > 100) score -= 2;
  // AQI entre 51 y 100 penaliza 1 punto.
  else if (aqi > 50) score -= 1;

  // Limita el resultado entre 1 y 10 y redondea por seguridad.
  return Math.max(1, Math.min(10, Math.round(score)));
}

// 8) Crear texto/contexto listo para un agente o bot.
function crearAgentContext(ubicacion, clima, aire, outdoorScore) {
  // Define recomendacion segun el score final.
  const recomendacion =
    outdoorScore >= 7
      ? "Buenas condiciones para actividades al aire libre."
      : "Condiciones no ideales; revisa clima, viento y calidad del aire antes de salir.";

  // Devuelve un objeto con resumen, recomendacion y explicacion del score.
  return {
    // Resumen corto con datos principales para que un agente lo pueda leer directo.
    summary: `Estas en ${ubicacion.city}, ${ubicacion.state}. Temperatura ${clima.temperature_c}°C, condicion ${clima.condition}, viento ${clima.windspeed_kmh} km/h y AQI ${aire.aqi_us}.`,

    // Recomendacion final basada en el outdoor score.
    recommendation: recomendacion,

    // Explica que variables se usaron para calcular el score.
    scoring_basis:
      "El outdoor_score considera temperatura, viento, condicion climatica y AQI US.",
  };
}

// Crea un objeto de error con formato consistente.
function crearError(code, message, detail = null) {
  // Devuelve una respuesta de error normalizada.
  return {
    // ok false indica que la operacion fallo.
    ok: false,

    // Objeto con codigo, mensaje y detalle tecnico opcional.
    error: { code, message, detail },
  };
}

// 9) Funcion principal: une ubicacion + clima + aire + score.
async function obtenerContextoPorZip(zip) {
  // Crea una llave de cache normalizada para evitar duplicados por mayusculas o espacios.
  const llaveCache = String(zip || "ip")
    .trim()
    .toLowerCase();

  // Si ya existe un resultado para esa llave, lo devuelve desde cache.
  if (cache.has(llaveCache)) {
    // Copia el resultado cacheado y marca cache.hit en true.
    return { ...cache.get(llaveCache), cache: { hit: true } };
  }

  // Captura cualquier error del flujo completo para devolver JSON controlado.
  try {
    // Obtiene ubicacion por ZIP o por IP si el ZIP falla.
    const ubicacion = await obtenerUbicacion(zip);

    // La prueba pide clima y aire en paralelo. Por eso usamos Promise.all.
    const [clima, aire] = await Promise.all([
      // Consulta clima con latitud y longitud.
      obtenerClima(ubicacion.lat, ubicacion.lon),

      // Consulta calidad del aire con latitud y longitud.
      obtenerCalidadAire(ubicacion.lat, ubicacion.lon),
    ]);

    // Calcula el score final usando clima y calidad del aire.
    const outdoorScore = calcularOutdoorScore(clima, aire);

    // Construye la respuesta final de exito.
    const resultado = {
      // ok true indica que se pudo crear el contexto.
      ok: true,

      // Datos de entrada y origen de la ubicacion.
      input: {
        // ZIP solicitado por el usuario.
        zip,

        // Fuente real usada: zip o ip_fallback.
        source: ubicacion.source,
      },

      // Ubicacion normalizada.
      location: {
        // Ciudad encontrada.
        city: ubicacion.city,

        // Estado o region encontrada.
        state: ubicacion.state,

        // Pais encontrado.
        country: ubicacion.country,

        // Latitud usada para clima y aire.
        lat: ubicacion.lat,

        // Longitud usada para clima y aire.
        lon: ubicacion.lon,
      },

      // Clima actual normalizado.
      weather: clima,

      // Calidad del aire normalizada.
      air_quality: aire,

      // Puntaje del 1 al 10 para actividades al aire libre.
      outdoor_score: outdoorScore,

      // Contexto listo para que lo use un agente o bot.
      agent_context: crearAgentContext(ubicacion, clima, aire, outdoorScore),

      // Indica que esta respuesta no salio del cache porque se acaba de calcular.
      cache: { hit: false },
    };

    // Guarda el resultado en cache para futuras consultas del mismo ZIP.
    cache.set(llaveCache, resultado);

    // Devuelve la respuesta final.
    return resultado;
  } catch (error) {
    // Si algo falla, devuelve un error controlado en vez de romper el servidor.
    return crearError(
      // Codigo tecnico del error.
      "LOCATION_CONTEXT_FAILED",

      // Mensaje amigable para el cliente.
      "No fue posible crear el contexto de ubicacion.",

      // Detalle tecnico para depurar.
      error.message,
    );
  }
}

// Obtiene contexto para varios ZIPs al mismo tiempo.
async function obtenerContextoParaMultiplesZips(zips) {
  // Ejecuta obtenerContextoPorZip para cada ZIP y espera todos los resultados.
  return Promise.all(zips.map((zip) => obtenerContextoPorZip(zip)));
}

// Convierte texto separado por comas en una lista de ZIPs limpios.
function textoAListaDeZips(texto) {
  // Convierte null/undefined a texto vacio para evitar errores.
  return (
    String(texto || "")
      // Divide el texto cada vez que encuentra una coma.
      .split(",")
      // Quita espacios al inicio y final de cada ZIP.
      .map((zip) => zip.trim())
      // Elimina valores vacios.
      .filter(Boolean)
  );
}

// Exporta funciones para que index.js, server.js o pruebas puedan usarlas.
module.exports = {
  // Funcion principal para un ZIP.
  obtenerContextoPorZip,

  // Funcion principal para varios ZIPs.
  obtenerContextoParaMultiplesZips,

  // Helper para convertir texto a lista de ZIPs.
  textoAListaDeZips,

  // Helper exportado para poder probar el mapeo de condiciones.
  mapearCondicion,

  // Helper exportado para poder probar el calculo de score.
  calcularOutdoorScore,

  // Cache exportado por si se quiere inspeccionar o limpiar en pruebas.
  cache,
};
