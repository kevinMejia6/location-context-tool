// ==========================================================
// SERVIDOR HTTP
// Este archivo levanta una API con Express para probar desde
// navegador, Postman o desde el frontend incluido.
// Endpoint principal: GET /context?zip=80203
// ==========================================================

// Carga variables de entorno desde un archivo .env si existe.
require('dotenv').config();

// Importa Express, el framework usado para crear el servidor HTTP.
const express = require('express');

// Importa CORS para permitir llamadas desde otros origenes si se necesita.
const cors = require('cors');

// Importa path para construir rutas de archivos compatibles con Windows/Linux/Mac.
const path = require('path');

// Importa funciones principales desde locationContext.js.
const {
  // Obtiene contexto para un solo ZIP.
  obtenerContextoPorZip,

  // Obtiene contexto para varios ZIPs.
  obtenerContextoParaMultiplesZips,

  // Convierte texto separado por comas en una lista limpia de ZIPs.
  textoAListaDeZips
} = require('./locationContext');

// Crea la aplicacion de Express.
const app = express();

// Define el puerto: usa process.env.PORT o 3000 por defecto.
const PORT = process.env.PORT || 3000;

// Activa CORS salvo que ENABLE_CORS sea exactamente "false".
const ENABLE_CORS = process.env.ENABLE_CORS !== 'false';

// Si CORS esta habilitado, registra el middleware cors().
if (ENABLE_CORS) app.use(cors());

// Permite que Express entienda cuerpos JSON en solicitudes HTTP.
app.use(express.json());

// Sirve los archivos del frontend como contenido estatico.
// Asi http://localhost:3000 abre frontend/index.html.
app.use(express.static(path.join(__dirname, '../../frontend')));

// Ruta simple para verificar que el servidor esta vivo.
app.get('/health', (req, res) => {
  // Responde con un JSON pequeno de estado.
  res.json({ ok: true, message: 'Servidor funcionando' });
});

// Ruta principal que recibe uno o varios ZIPs por query string.
app.get('/context', async (req, res) => {
  // Lee req.query.zip y lo convierte en lista.
  const zips = textoAListaDeZips(req.query.zip);

  // Si no hay ZIPs, responde HTTP 400 con un error claro.
  if (zips.length === 0) {
    // return evita que la funcion continue despues de enviar el error.
    return res.status(400).json({
      ok: false,
      error: {
        code: 'ZIP_REQUIRED',
        message: 'Envia un ZIP. Ejemplo: /context?zip=80203'
      }
    });
  }

  // Si hay un ZIP llama a la funcion individual; si hay varios llama a la funcion multiple.
  const resultado = zips.length === 1
    ? await obtenerContextoPorZip(zips[0])
    : await obtenerContextoParaMultiplesZips(zips);

  // Envia el resultado al cliente como JSON.
  res.json(resultado);
});

// Inicia el servidor y queda escuchando solicitudes en el puerto configurado.
app.listen(PORT, () => {
  // Muestra en consola la URL base del servidor.
  console.log(`Servidor listo: http://localhost:${PORT}`);

  // Muestra en consola una URL de ejemplo para probar el endpoint.
  console.log(`Prueba: http://localhost:${PORT}/context?zip=80203`);
});
