require('dotenv').config();


// Configuración de la aplicación, incluyendo URLs de APIs y puerto del servidor. 
// Se cargan desde variables de entorno para facilitar la configuración y evitar hardcodear valores sensibles o que puedan cambiar entre entornos (desarrollo, producción
// , etc.). Si no se proporcionan en las variables de entorno, se utilizan valores predeterminados.
module.exports = {
  
  PORT: process.env.PORT || 3000, //Puerto en el que el servidor escuchará las solicitudes. Se puede configurar a través de la variable de entorno PORT, o se usará el puerto 3000 por defecto.
   
  //URL base de zippopotamus, que es la API que utilizamos para obtener información de ubicación a partir de un código postal (ZIP).
  ZIPPOPOTAMUS_API_URL: process.env.ZIPPOPOTAMUS_API_URL || 'https://api.zippopotam.us',

  OPEN_METEO_WEATHER_API_URL: process.env.OPEN_METEO_WEATHER_API_URL || 'https://api.open-meteo.com/v1/forecast',

    //URL base de la API de calidad del aire de Open-Meteo.
  OPEN_METEO_AIR_API_URL: process.env.OPEN_METEO_AIR_API_URL || 'https://air-quality-api.open-meteo.com/v1/air-quality',

  IP_API_URL: process.env.IP_API_URL || 'http://ip-api.com/json' //URL api para obtener ubicacion aproximada por IP.
};
