
// Aqui calculamos que tan buenas son las condiciones para salir al aire libre.
// Recibimos el clima y la calidad del aire, empezamos con 10 puntos y vamos restando
// segun la temperatura, el viento, la condicion del clima y el valor del AQI.

function calcularOutdoorScore(clima, aire) {
  let score = 10;
  const temperatura = clima.temperature_c;
  const viento = clima.windspeed_kmh;
  const condicion = clima.condition;
  const aqi = aire.aqi_us;

  if (temperatura < 5 || temperatura > 38) {
    score -= 3;
  } else if (temperatura < 12 || temperatura > 32) {
    score -= 2;
  } else if (temperatura < 18 || temperatura > 27) {
    score -= 1;
  }

  if (viento > 50) {
    score -= 3;
  } else if (viento > 35) {
    score -= 2;
  } else if (viento > 20) {
    score -= 1;
  }

  if (condicion === 'Tormenta') {
    score -= 4;
  } else if (['Lluvia', 'Chubascos', 'Nieve', 'Chubascos de nieve'].includes(condicion)) {
    score -= 3;
  } else if (condicion === 'Llovizna') {
    score -= 2;
  } else if (['Nublado', 'Niebla', 'Condición desconocida'].includes(condicion)) {
    score -= 1;
  }

  // En la escala US AQI un numero mas alto significa que la calidad del aire es peor.
  if (aqi === null || aqi === undefined) {
    score -= 1;
  } else if (aqi > 200) {
    score -= 4;
  } else if (aqi > 150) {
    score -= 3;
  } else if (aqi > 100) {
    score -= 2;
  } else if (aqi > 50) {
    score -= 1;
  }

  return Math.max(score, 1);
}

module.exports = { calcularOutdoorScore };
