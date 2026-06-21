// Calcula un puntaje del 1 al 10 usando clima, viento y calidad del aire.
function calcularOutdoorScore(clima, aire) {
  // Empieza en 10 y resta puntos cuando una condición hace menos recomendable salir.
  let score = 10;

  //clima.temperature_c sale de la API de Open-Meteo como un número en grados Celsius.
  //clima.windspeed_kmh sale de la API de Open-Meteo como un número en km/h.
  //clima.condition es una cadena legible que se obtiene al mapear el weathercode.
  //aire.aqi_us sale de la API de Open-Meteo Air Quality como un número entero.

  const temperatura = clima.temperature_c;
  const viento = clima.windspeed_kmh;
  const condicion = clima.condition;
  const aqi = aire.aqi_us;

  if (temperatura < 5 || temperatura > 38) {
    score = score - 3; // Temperaturas extremas.
  } else if (temperatura < 12 || temperatura > 32) {
    score = score - 2; // Temperaturas poco ideales.
  } else if (temperatura < 18 || temperatura > 27) {
    score = score - 1; // Temperaturas menos cómodas pero aún aceptables para salir.
  }

  if (viento > 50) {
    score = score - 3; // Viento muy fuerte.
  } else if (viento > 35) {
    score = score - 2; // Viento fuerte.
  } else if (viento > 20) {
    score = score - 1;// Viento molesto pero no peligroso.
  }

  if (condicion === 'Tormenta') {
    score = score - 4; // Condiciones peligrosas.
  } else if (['Lluvia', 'Chubascos', 'Nieve', 'Chubascos de nieve'].includes(condicion)) {
    score = score - 3; // Condiciones incómodas para la mayoría de actividades al aire libre.
  } else if (condicion === 'Llovizna') {
    score = score - 2;// Condición molesta pero no tan mala como lluvia fuerte.
  } else if (['Nublado', 'Niebla', 'Condición desconocida'].includes(condicion)) {
    score = score - 1;// Condiciones menos ideales pero aún aceptables para salir.
  }

// AQI se interpreta con una escala donde valores más altos indican peor calidad del aire.

  if (aqi === null || aqi === undefined) {
    score = score - 1; // AQI no disponible.
  } else if (aqi > 200) {
    score = score - 4; // AQI muy alto.
  } else if (aqi > 150) {
    score = score - 3; // AQI alto. 
  } else if (aqi > 100) {
    score = score - 2; // AQI moderadamente alto.
  } else if (aqi > 50) {
    score = score - 1; // AQI moderado.
  }

  // La prueba solicita que el resultado siempre esté entre 1 y 10.
  if (score < 1) {
    score = 1; // Condiciones tan malas que el puntaje mínimo es 1.
  }

  return score; // El resultado final es un número entero entre 1 y 10 que refleja qué tan recomendable es salir al aire libre dadas las condiciones actuales.
}

module.exports = { calcularOutdoorScore }; // Exportamos la función para que pueda ser usada en otros módulos del proyecto.
