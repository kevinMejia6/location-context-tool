// Crea un resumen y una recomendación listos para que los use un agente.
function crearAgentContext(ubicacion, clima, aire, outdoorScore) {
  let recomendacion;

  //outdoorScore es un número entre 1 y 10, donde 10 es ideal para salir al aire libre.
  if (outdoorScore >= 7) {
    recomendacion = 'Buenas condiciones para actividades al aire libre.';
  } else {
    recomendacion = 'Condiciones no ideales; revisa clima, viento y calidad del aire antes de salir.';
  }

  
  const resumen =
    `Estás en ${ubicacion.city}, ${ubicacion.state}. ` +
    `Temperatura ${clima.temperature_c} °C, condición ${clima.condition}, ` +
    `viento ${clima.windspeed_kmh} km/h y AQI ${aire.aqi_us}.`; 

  return {
    summary: resumen,
    recommendation: recomendacion,
    scoring_basis: 'El outdoor_score considera temperatura, viento, condición climática y AQI US.'
  };
}

module.exports = { crearAgentContext };
