// Traduce el nivel de calidad del aire para mostrarlo en español.
function traducirNivelAire(nivel) {
  const traducciones = {
    Good: 'buena',
    Moderate: 'moderada',
    'Unhealthy for Sensitive Groups': 'poco saludable para grupos sensibles',
    Unhealthy: 'poco saludable',
    'Very Unhealthy': 'muy poco saludable',
    Hazardous: 'peligrosa',
    Unknown: 'desconocida'
  };

  return traducciones[nivel] || 'desconocida';
}

// Crea un resumen amigable y una recomendación listos para que los use un agente.
function crearAgentContext(ubicacion, clima, aire, outdoorScore) {
  let recomendacion;

  if (outdoorScore >= 8) {
    recomendacion =
      '¡Es un excelente momento para salir! Las condiciones son muy favorables para disfrutar al aire libre.';
  } else if (outdoorScore >= 6) {
    recomendacion =
      'Puedes salir con tranquilidad, aunque conviene revisar las condiciones antes de realizar una actividad larga.';
  } else {
    recomendacion =
      'Quizás sea mejor esperar un poco. Si necesitas salir, toma precauciones según el clima y la calidad del aire.';
  }

  const condicion = clima.condition.toLowerCase();
  const nivelAire = traducirNivelAire(aire.level);
  const resumen =
    `¡Aquí tienes el panorama! En ${ubicacion.city}, ${ubicacion.state}, ` +
    `el clima está ${condicion} y la temperatura es de ${clima.temperature_c} °C. ` +
    `El viento es de ${clima.windspeed_kmh} km/h y la calidad del aire es ` +
    `${nivelAire}, con un AQI de ${aire.aqi_us}.`;

  return {
    summary: resumen,
    recommendation: recomendacion,
    scoring_basis:
      'El puntaje comienza en 10 y resta puntos cuando la temperatura, el viento, el clima o la calidad del aire no son favorables.'
  };
}

module.exports = { crearAgentContext };
