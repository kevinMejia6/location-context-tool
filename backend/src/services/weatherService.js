const { OPEN_METEO_WEATHER_API_URL } = require('../config');

const { mapearCondicion } = require('../domain/weatherCodes');

// Consulta Open-Meteo y devuelve los datos principales del clima actual.

// La función obtiene el clima actual para las coordenadas dadas utilizando la API de Open-Meteo.

async function obtenerClima(lat, lon) { //La api solicita dos parámetros: latitud y longitud, que se obtienen del servicio de ubicación.
 
  const url = new URL(OPEN_METEO_WEATHER_API_URL); // Mandamos a llamar la url base desde el .env o el config.js.
  
  url.searchParams.set('latitude', lat); //Agregamos la latitud a los parámetros de búsqueda de la URL.
  
  url.searchParams.set('longitude', lon); //Agregamos la longitud a los parámetros de búsqueda de la URL.
  
  url.searchParams.set('current_weather', 'true'); //Solicitamos solo el clima actual para optimizar la consulta y obtener solo lo necesario para el cálculo del puntaje de salida al aire libre.
  
  url.searchParams.set('temperature_unit', 'celsius');//Solicitamos la temperatura en grados Celsius, que es la unidad que utilizamos para evaluar las condiciones climáticas en nuestro cálculo de puntaje.
  
  url.searchParams.set('windspeed_unit', 'kmh');//Solicitamos la velocidad del viento en kilómetros por hora, que es la unidad que utilizamos para evaluar las condiciones climáticas en nuestro cálculo de puntaje.

  const respuesta = await fetch(url); //Realizamos la consulta a la API de Open-Meteo con los parámetros configurados en la URL.

  if (!respuesta.ok) {//Si la respuesta no es exitosa (código HTTP diferente de 200), lanzamos un error con el código de estado para que el servicio pueda manejarlo adecuadamente.
   
    throw new Error(`Open-Meteo Weather respondió con HTTP ${respuesta.status}`); //Lanzamos el error con el mensaje incluyendo el estado http.
  }

  const datos = await respuesta.json(); //Parseamos la respuesta JSON para obtener los datos del clima actual.

  const actual = datos.current_weather; //Extraemos la información del clima actual del objeto de datos devuelto por la API. Esta información incluye temperatura, velocidad del viento, código meteorológico, etc. que utilizaremos para calcular el puntaje de salida al aire libre.

  if (!actual) throw new Error('Open-Meteo no devolvió clima actual.'); //Si la API no devuelve información sobre el clima actual, lanzamos un error para que el servicio pueda manejarlo adecuadamente.


//Devolvemos un objeto con la informacion del clima actual con los siguientes campos
   return {
   
    temperature_c: actual.temperature, //La temperatura actual en grados Celsius, que se utiliza para evaluar las condiciones climáticas en nuestro cálculo de puntaje de salida al aire libre.
   
    windspeed_kmh: actual.windspeed, //La velocidad del viento actual en kilómetros por hora, que se utiliza para evaluar las condiciones climáticas en nuestro cálculo de puntaje de salida al aire libre.
   
    weathercode: actual.weathercode, //El código meteorológico actual, que es un número entero que representa la condición climática actual según la API de Open-Meteo. Este código se mapea a una condición legible utilizando la función mapearCondicion para evaluar las condiciones climáticas en nuestro cálculo de puntaje de salida al aire libre.
   
    condition: mapearCondicion(actual.weathercode) //La condición climática actual en formato legible, que se obtiene al mapear el código meteorológico utilizando la función mapearCondicion. Esta condición se utiliza para evaluar las condiciones climáticas en nuestro cálculo de puntaje de salida al aire libre.
  };
}

module.exports = { obtenerClima };
