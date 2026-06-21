
// En este archivo creamos el servidor con Express, muestra el frontend y recibe las
// consultas de uno o varios ZIP desde el navegador o cualquier cliente HTTP.

const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORT } = require('./config');

const {
  obtenerContextoPorZip,
  obtenerContextoParaMultiplesZips
} = require('./locationContext');

const {
  textoAListaDeZips,
  buscarZipsInvalidos
} = require('./utils/zipParser');

const app = express();//Creamos la aplicación de Express para configurar el servidor y las rutas.

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend')));

// Esta ruta solo confirma que el servidor esta funcionando, sin consultar APIs externas.

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Servidor funcionando' });
});

// En esta ruta recibimos el ZIP desde la URL, lo validamos y devolvemos su contexto.
// Si viene vacio o tiene un formato incorrecto respondemos con un error 400.

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

  const invalidos = buscarZipsInvalidos(zips);// Validamos los ZIP y buscamos cuales son invalidos para mostrar un error claro.

  if (invalidos.length > 0) { //Validamos si hay zip invalidos y si hay le mostramos el mensaje al usuario.
    return res.status(400).json({
      ok: false,
      error: {
        code: 'ZIP_INVALID',
        message: 'Cada ZIP debe contener exactamente cinco dígitos.',
        invalid_values: invalidos
      }
    });
  }

  const resultado = zips.length === 1 // Si solo hay un ZIP, hacemos una consulta simple, sino usamos la función para múltiples consultas.
    ? await obtenerContextoPorZip(zips[0])
    : await obtenerContextoParaMultiplesZips(zips);

  return res.json(resultado);
});

// Iniciamos el servidor en el puerto configurado y mostramos las URLs para probarlo.
app.listen(PORT, () => {
  console.log(`Servidor listo: http://localhost:${PORT}`);
  console.log(`Prueba: http://localhost:${PORT}/context?zip=80203`);
});
