
// Aqui cargamos las variables del .env y dejamos valores por defecto para el puerto
// y para las URLs de las APIs que usamos en el proyecto.

require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  ZIPPOPOTAMUS_API_URL:
    process.env.ZIPPOPOTAMUS_API_URL || 'https://api.zippopotam.us',
  OPEN_METEO_WEATHER_API_URL:
    process.env.OPEN_METEO_WEATHER_API_URL || 'https://api.open-meteo.com/v1/forecast',
  OPEN_METEO_AIR_API_URL:
    process.env.OPEN_METEO_AIR_API_URL || 'https://air-quality-api.open-meteo.com/v1/air-quality',
  IP_API_URL: process.env.IP_API_URL || 'http://ip-api.com/json'
};
