// Este archivo configura y arranca el servidor HTTP usando Express.
//  Define las rutas para manejar las solicitudes de contexto basadas en ZIP codes y sirve los archivos estáticos del frontend.

const express = require('express'); // Importamos el framework Express para crear el servidor HTTP y manejar las rutas y solicitudes.
const cors = require('cors'); // Importamos el middleware CORS para permitir solicitudes desde el frontend que puede estar en un origen diferente al del backend.
const path = require('path'); // Importamos el módulo path para manejar rutas de archivos y directorios de manera segura y compatible con diferentes sistemas operativos.
const { PORT } = require('./config'); // Importamos la configuración del puerto desde el archivo config.js, que carga las variables de entorno y proporciona valores predeterminados.

const {
  obtenerContextoPorZip,
  obtenerContextoParaMultiplesZips
} = require('./locationContext'); // Importamos las funciones principales para obtener el contexto de ubicación a partir de uno o varios ZIP codes, que se encargan de la lógica de negocio para procesar las solicitudes y devolver la información requerida.

const {
  textoAListaDeZips,
  buscarZipsInvalidos
} = require('./utils/zipParser'); // Importamos las funciones de utilidad para procesar el texto de entrada y validar los ZIPs, que se utilizan para manejar las solicitudes entrantes y asegurar que los datos sean correctos antes de procesarlos.

const app = express(); // Creamos una instancia de la aplicación Express, que será nuestro servidor HTTP para manejar las solicitudes y respuestas.

app.use(cors()); // Habilitamos CORS para permitir que el frontend pueda hacer solicitudes a este servidor desde un origen diferente.

app.use(express.json()); // Habilitamos el middleware para parsear el cuerpo de las solicitudes en formato JSON, lo que facilita la recepción de datos estructurados desde el frontend o clientes que consuman la API.

app.use(express.static(path.join(__dirname, '../../frontend'))); // Servimos los archivos estáticos del frontend desde el directorio especificado, lo que permite que el frontend se cargue correctamente cuando se accede al servidor a través de un navegador. La ruta se construye utilizando path.join para asegurar la compatibilidad entre sistemas operativos y evitar problemas con las rutas relativas.

// Permite comprobar rápidamente que el servidor está funcionando.
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Servidor funcionando' });
});

// Recibe uno o varios ZIP codes y devuelve su contexto en JSON.
app.get('/context', async (req, res) => {
  const zips = textoAListaDeZips(req.query.zip);

  if (zips.length === 0) {
    return res.status(400).json({
      ok: false,
      error: {
        code: 'ZIP_REQUIRED',
        message: 'Envía un ZIP. Ejemplo: /context?zip=80203'
      }
    });
  }

// Validamos que cada ZIP tenga el formato correcto de cinco dígitos. Si hay ZIPs inválidos, respondemos con un error detallando cuáles son.  
  const invalidos = buscarZipsInvalidos(zips);
  if (invalidos.length > 0) {
    return res.status(400).json({
      ok: false,
      error: {
        code: 'ZIP_INVALID',
        message: 'Cada ZIP debe contener exactamente cinco dígitos.',
        invalid_values: invalidos
      }
    });
  }

  let resultado;

  if (zips.length === 1) {
    resultado = await obtenerContextoPorZip(zips[0]);
  } else {
    resultado = await obtenerContextoParaMultiplesZips(zips);
  }

  return res.json(resultado);
});

// Inicia el servidor HTTP en el puerto configurado.
app.listen(PORT, () => {
  console.log(`Servidor listo: http://localhost:${PORT}`);
  console.log(`Prueba: http://localhost:${PORT}/context?zip=80203`);
});
