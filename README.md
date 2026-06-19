# Location Context Tool

Solución para la prueba técnica de **Integrador IA Agents**.

Esta herramienta recibe un **ZIP code de Estados Unidos** y devuelve un JSON enriquecido con contexto útil sobre esa ubicación. La idea es que este JSON pueda ser consumido directamente por un agente de IA, bot o sistema externo.

---

## ¿Qué hace esta herramienta?

A partir de un ZIP code (ES CONOCIDO POR NOSOTROS EN EL SALVADOR COMO CODIOGO POSTAL), el sistema devuelve información como:

- Ubicación: ciudad, estado, país, latitud y longitud.
- Clima actual usando Open-Meteo.
- Calidad del aire usando Open-Meteo Air Quality.
- Fallback por IP usando ip-api.com si el ZIP falla.
- Condición climática legible a partir del `weathercode` WMO.
- `outdoor_score` del 1 al 10.
- `agent_context` listo para ser usado por un agente o bot.

También se agregaron algunos puntos plus de la prueba:

- Servidor HTTP con endpoint `/context`.
- Soporte para consultar múltiples ZIP codes.
- Caché en memoria para no repetir consultas ya realizadas durante la misma sesión.
- Frontend visual para probar la herramienta desde el navegador.

---

## Requisitos

Antes de ejecutar el proyecto necesitamos tener instalado:

- Node.js 18 o superior.
- NPM.
- Conexión a internet, porque el sistema consulta APIs externas.

Las APIs utilizadas son gratuitas y no requieren API key.

---

## Estructura del proyecto

```text
location-context-tool-simple/
├── backend/
│   ├── src/
│   │   ├── index.js              # Ejecuta la herramienta desde consola
│   │   ├── server.js             # Levanta el servidor HTTP que fue solicitado como punto extra
│   │   └── locationContext.js    # Contiene la lógica principal del proyecto
│   ├── package.json
│   ├── .env.example              # .ENV el cual podemos copiar o renombrar para dejarlo asi .env, ya que de ahi se manda a llamar los url de las api y otras variables
│   └── .env
├── frontend/                     # ESTO LO HICE OPCIONAL COMO UN PLUS DE LA PRUEBAS PARA TENER MEJOR VISUALIZACION DEL RESULTADO SOLICITADO
│   ├── index.html                # Visualizacion
│   └── script.js                 # Script necesario para visualizacion del sitio
└── README.md
```

---

## Instalación

### Paso 1: Entrar a la carpeta del backend

Desde la raíz del proyecto, entrar a la carpeta `backend` y ejecutar este comando desde la consola de visual o el editor o cmd:

```bash
cd backend
```

### Paso 2: Instalar dependencias necesarias para el buen funcionamiento

Ejecutar en consola:

```bash
npm install
```

Esto instalará las dependencias necesarias para que el proyecto funcione.

---

## Configuración del archivo `.env`

El proyecto usa un archivo `.env` para guardar configuraciones, como el puerto del servidor y las URLs de las APIs, lo hice de esta manera para mayor seguridad y orden.

El proyecto ya incluye un archivo llamado `.env.example`.

Puedes crear tu archivo `.env` copiando el ejemplo con el sigueinte comando:

```bash
cp .env.example .env
```


### Contenido recomendado del archivo `.env`

```env
PORT=3000
ENABLE_CORS=true
ZIP_CODE=80203

# Apis necesarias y solicitas en la prueba tecnica
ZIPPOPOTAMUS_API_URL=https://api.zippopotam.us
OPEN_METEO_WEATHER_API_URL=https://api.open-meteo.com/v1/forecast
OPEN_METEO_AIR_API_URL=https://air-quality-api.open-meteo.com/v1/air-quality
IP_API_URL=http://ip-api.com/json
```

Estas variables se leen dentro del archivo:

```text
src/locationContext.js
```

Por ejemplo:

```js
const ZIPPOPOTAMUS_API_URL = process.env.ZIPPOPOTAMUS_API_URL || 'https://api.zippopotam.us';
```

Esto significa que el sistema primero intenta usar la URL del `.env`. Si no la encuentra, usa una URL por defecto para evitar que el proyecto falle.

---

## Ejecución en consola

### Ejecutar como script por consola

Desde la carpeta `backend`, puedes ejecutar:

```bash
node src/index.js 80203
```

Esto consulta el ZIP `80203` y muestra el resultado en formato JSON en la terminal.

---

### Ejecutar usando el ZIP del `.env`

Si no se envía un ZIP manualmente, el sistema puede usar el ZIP configurado en el archivo `.env`.

Ejemplo:

```bash
node src/index.js
```

En este caso usará que es el que he dejado por defecto en .env:

```env
ZIP_CODE=80203
```

---

## Ejecución masiva

### Consultar múltiples ZIP codes

También se puede consultar varios ZIP codes separados por coma:

```bash
node src/index.js 80203,90210,10001
```

El sistema devolverá un arreglo con el contexto de cada ZIP.

---

## Requerimiento extra: servidor HTTP

### Ejecutar como servidor HTTP

Para levantar el servidor, ejecutar en consola recordar estar en backend:

```bash
npm start
```

Al ejecutar el comando anteriro nos dara una url la cual luego se podra abrir en el navegador o probar en Postman el zip=80203 puede ser modificado por otro ejemplo: zip=90210

```text
http://localhost:3000/context?zip=80203
```

---

## Múltiples consultas desde servidor HTTP

### Consultar múltiples ZIP codes desde HTTP

También se podra enviar varios ZIP codes separados por coma:

```text
http://localhost:3000/context?zip=80203,90210,10001
```

---

## Frontend agregado como extra para mejor visualización de los resultados

### Usar el frontend visual

El proyecto inclui una vista web para probar la herramienta de forma más visual.

Después de ejecutar:

```bash
npm start
```

Abre en tu navegador:

```text
http://localhost:3000
```

Desde ahí se puede escribir un ZIP code masivo o individual y ver el resultado en tarjetas visuales.

---

## Flujo general de la lógica

El flujo principal del sistema es el siguiente:

1. El usuario envía un ZIP code por consola o por el endpoint `/context`.
2. El sistema intenta resolver la ubicación usando zippopotam.us.
3. Si el ZIP es válido, obtiene ciudad, estado, país, latitud y longitud.
4. Si el ZIP falla o no existe, el sistema usa ip-api.com como fallback para obtener mi direcion por medio de mi ip.
5. El fallback intenta detectar una ubicación aproximada usando la IP del cliente o del servidor.
6. Con la latitud y longitud obtenidas, el sistema consulta dos APIs en paralelo usando `Promise.all`:
   - Open-Meteo para el clima actual.
   - Open-Meteo Air Quality para la calidad del aire.
7. El sistema convierte el `weathercode` en una condición legible.
8. Calcula el `outdoor_score`.
9. Construye y devuelve un único JSON estructurado.

---

## APIs utilizadas

### zippopotam.us

Se usa para resolver un ZIP code de Estados Unidos y obtener:

- Ciudad.
- Estado.
- País.
- Latitud.
- Longitud.

Ejemplo de uso interno:

```text
https://api.zippopotam.us/us/80203
```

---

### Open-Meteo Weather

Se usa para obtener el clima actual con base en latitud y longitud.

Devuelve datos como:

- Temperatura actual.
- Velocidad del viento.
- Weathercode.

---

### Open-Meteo Air Quality

Se usa para obtener información sobre calidad del aire.

Devuelve datos como:

- AQI US.
- Nivel de calidad del aire.
- Contaminante dominante.

---

### ip-api.com

Se usa como fallback cuando el ZIP no se puede resolver.

Esto permite obtener una ubicación aproximada por IP y evitar que el proceso se caiga.

---

## Fallback por IP

Si el ZIP no existe o zippopotam.us falla, el sistema intenta obtener una ubicación aproximada usando ip-api.com.

El JSON de respuesta indica de dónde salió la ubicación usando el campo `source`.

Ejemplo cuando el ZIP funciona:

```json
"source": "zip"
```

Ejemplo cuando se usa fallback por IP:

```json
"source": "ip_fallback"
```

Si tanto el ZIP como el fallback por IP fallan, el sistema devuelve un error estructurado en JSON. No se detiene el proceso ni se produce un crash.

---

## Agrupación de weathercodes WMO

Open-Meteo devuelve un número llamado `weathercode`.

Ese número representa una condición climática según el estándar WMO. Para que el resultado sea más fácil de leer, el sistema transforma ese número en texto.

La función encargada de esto es:

```text
mapearCondicion()
```

La agrupación usada es la siguiente:

| Weathercode        | Condición             |
| ------------------ | --------------------- |
| 0                  | Despejado             |
| 1, 2               | Parcialmente nublado  |
| 3                  | Nublado               |
| 45, 48             | Niebla                |
| 51, 53, 55, 56, 57 | Llovizna              |
| 61, 63, 65, 66, 67 | Lluvia                |
| 71, 73, 75, 77     | Nieve                 |
| 80, 81, 82         | Chubascos             |
| 85, 86             | Chubascos de nieve    |
| 95, 96, 99         | Tormenta              |
| Otro código        | Condición desconocida |

No existe una única clasificación correcta. Esta agrupación se hizo simple, coherente y fácil de explicar.

---

## Lógica del outdoor_score

El `outdoor_score` es un número del 1 al 10 que indica qué tan buenas son las condiciones para estar al aire libre.

La función encargada de calcularlo es:

```text
calcularOutdoorScore()
```

La lógica inicia con 10 puntos y va restando puntos según las condiciones actuales.

Al final, el resultado se limita entre 1 y 10.

---

### Temperatura

| Temperatura                | Penalización |
| -------------------------- | ------------ |
| 18°C a 27°C                | No resta     |
| 12°C a 17°C o 28°C a 32°C  | Resta 1      |
| 5°C a 11°C o 33°C a 38°C   | Resta 2      |
| Menor a 5°C o mayor a 38°C | Resta 3      |

La temperatura ideal para estar al aire libre se considera entre 18°C y 27°C.

---

### Velocidad del viento

| Viento         | Penalización |
| -------------- | ------------ |
| Hasta 20 km/h  | No resta     |
| 21 a 35 km/h   | Resta 1      |
| 36 a 50 km/h   | Resta 2      |
| Más de 50 km/h | Resta 3      |

La prueba no define una fórmula exacta para el outdoor_score.
Por eso elegi una lógica de penalización: el puntaje inicia en 10, que representa condiciones ideales, y se restan puntos cuando algún factor reduce la comodidad o seguridad para estar al aire libre, como viento fuerte, lluvia, temperaturas extremas o mala calidad del aire.

---

### Condición climática

| Condición                        | Penalización |
| -------------------------------- | ------------ |
| Despejado o parcialmente nublado | No resta     |
| Nublado, niebla o desconocido    | Resta 1      |
| Llovizna                         | Resta 2      |
| Lluvia, chubascos o nieve        | Resta 3      |
| Tormenta                         | Resta 4      |

Las tormentas tienen la mayor penalización porque pueden representar riesgo para actividades al aire libre.

---

### Calidad del aire AQI US

| AQI US      | Penalización |
| ----------- | ------------ |
| 0 a 50      | No resta     |
| 51 a 100    | Resta 1      |
| 101 a 150   | Resta 2      |
| 151 a 200   | Resta 3      |
| Mayor a 200 | Resta 4      |

Una mala calidad del aire reduce el puntaje porque puede afectar la salud, especialmente en actividades al aire libre.

---

## Ejemplo de salida

Ejemplo de respuesta para el ZIP `80203`:

```json
{
  "ok": true,
  "input": {
    "zip": "80203",
    "source": "zip"
  },
  "location": {
    "city": "Denver",
    "state": "Colorado",
    "country": "US",
    "lat": 39.7313,
    "lon": -104.9829
  },
  "weather": {
    "temperature_c": 14.5,
    "windspeed_kmh": 18.2,
    "weathercode": 2,
    "condition": "Parcialmente nublado"
  },
  "air_quality": {
    "aqi_us": 38,
    "level": "Good",
    "dominant_pollutant": "pm2_5"
  },
  "outdoor_score": 7,
  "agent_context": {
    "summary": "Estas en Denver, Colorado. Temperatura 14.5°C, viento de 18.2 km/h y condición parcialmente nublada.",
    "recommendation": "Buenas condiciones para actividades al aire libre.",
    "scoring_basis": "El outdoor_score considera temperatura, viento, condición climática y AQI US."
  }
}
```

---

## Ejemplo de error estructurado

Si ocurre un error, el sistema devuelve un JSON controlado.

Ejemplo:

```json
{
  "ok": false,
  "error": {
    "message": "No se pudo obtener la ubicación",
    "detail": "El ZIP no fue encontrado y el fallback por IP también falló."
  }
}
```

Esto cumple con el requisito de no hacer crash del proceso que se me solicita en la prueba tecnica.

---

## Caché en memoria

El proyecto incluye un caché simple en memoria.

Esto significa que si consultas el mismo ZIP varias veces durante la misma sesión, el sistema puede devolver la información guardada sin volver a consultar todas las APIs.

Esto ayuda a:

- Reducir llamadas repetidas.
- Mejorar el tiempo de respuesta.
- Evitar uso innecesario de APIs externas.

El caché se reinicia cuando se detiene el servidor.

---

## Resumen

Este proyecto cumple con los requisitos principales de la prueba técnica:

- Recibe ZIP por consola o variable.
- Resuelve ubicación con zippopotam.us.
- Usa fallback por IP con ip-api.com.
- Consulta clima y calidad del aire con Open-Meteo.
- Usa `Promise.all` para llamadas en paralelo.
- Devuelve un único JSON estructurado.
- Incluye `condition`.
- Calcula `outdoor_score`.
- Incluye `agent_context`.
- Maneja errores sin romper el proceso.
- Incluye README con explicación.
- Se puede ejecutar con un ZIP real de Estados Unidos.

También incluye los puntos plus:

- Servidor HTTP.
- Endpoint `/context`.
- Soporte para múltiples ZIP codes.
