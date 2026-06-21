# Location Context Tool

Este proyecto lo realicé como solución para la prueba técnica de **Integrador IA Agents**.

La herramienta recibe uno o varios ZIP codes de Estados Unidos, que aquí en El Salvador conocemos como códigos postales, y devuelve un JSON con la ubicación, el clima actual, la calidad del aire, un `outdoor_score` y un contexto preparado para que lo pueda usar un agente o bot.

## Funcionalidades

- Ejecución desde consola.
- API HTTP con Express.
- Frontend visual que agregué como extra para probar la API y entender mejor los resultados.
- Soporte para uno o varios ZIP codes.
- Validación de ZIP de exactamente cinco dígitos.
- Ubicación mediante Zippopotam.
- Fallback aproximado por IP mediante ip-api.
- Clima y calidad del aire mediante Open-Meteo.
- Consultas de clima y aire en paralelo con `Promise.all`.
- Conversión de códigos WMO a condiciones legibles.
- Cálculo de `outdoor_score` entre 1 y 10.
- Caché en memoria.
- Errores estructurados en JSON.
- Pruebas unitarias con el test runner de Node.js.

## Estructura actual

```text
location-context-tool/
├── backend/
│   ├── src/
│   │   ├── domain/
│   │   │   ├── agentContext.js       # Resumen y recomendación para el agente
│   │   │   ├── outdoorScore.js       # Cálculo del outdoor_score
│   │   │   └── weatherCodes.js       # Conversión de códigos WMO
│   │   ├── services/
│   │   │   ├── airQualityService.js  # Consulta de calidad del aire
│   │   │   ├── locationService.js    # Ubicación por ZIP y fallback por IP
│   │   │   └── weatherService.js     # Consulta del clima actual
│   │   ├── utils/
│   │   │   └── zipParser.js          # Separación y validación de ZIPs
│   │   ├── config.js                 # Variables de entorno y URLs
│   │   ├── index.js                  # Entrada para ejecutar desde consola
│   │   ├── locationContext.js        # Flujo principal y caché
│   │   └── server.js                 # Servidor Express y endpoints
│   ├── test/                         # Pruebas en cada archivo
│   │   ├── airQuality.test.js
│   │   ├── outdoorScore.test.js
│   │   ├── weatherCodes.test.js
│   │   └── zipParser.test.js
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── index.html
│   └── script.js                     # Consulta la API y muestra los resultados
└── README.md
```

### Responsabilidad de cada carpeta

- `domain`: reglas propias del proyecto que no realizan peticiones externas.
- `services`: funciones que consultan y transforman respuestas de APIs externas.
- `utils`: funciones pequeñas para procesar y validar la entrada.
- `test`: pruebas de las reglas que pueden verificarse sin depender de internet.
- `frontend`: interfaz opcional para consultar ZIPs desde el navegador.

`locationContext.js` coordina todas las partes y construye el JSON final.

## Requisitos

- Node.js 18 o superior.
- NPM.
- Conexión a internet.

Las APIs utilizadas son gratuitas y no requieren API key.

## Instalación

Desde la raíz del proyecto:

```bash
cd backend
npm install
```

Copia `.env.example` como `.env`.

En Consola:

```powershell
Copy-Item .env.example .env
```

## Variables de entorno

```env
PORT=3000
ZIP_CODE=80203
ZIPPOPOTAMUS_API_URL=https://api.zippopotam.us
OPEN_METEO_WEATHER_API_URL=https://api.open-meteo.com/v1/forecast
OPEN_METEO_AIR_API_URL=https://air-quality-api.open-meteo.com/v1/air-quality
IP_API_URL=http://ip-api.com/json
```

- `PORT`: puerto del servidor HTTP.
- `ZIP_CODE`: ZIP usado por la CLI cuando no se envía un argumento.
- Las demás variables contienen las URLs base de las APIs externas.

## Uso desde consola

Los siguientes comandos deben ejecutarse dentro de `backend`.

Un ZIP:

```bash
npm run cli -- 80203
```

Varios ZIP separados por espacios:

```bash
npm run cli -- 80203 90210 10001
```

Varios ZIP separados por comas:

```bash
npm run cli -- 80203,90210,10001
```

Sin argumentos se utiliza `ZIP_CODE` del archivo `.env`:

```bash
npm run cli
```

## Servidor HTTP y frontend (Extra)

Para iniciar el servidor:

```bash
npm start
```

Después abre:

```text
http://localhost:3000
```

Endpoints disponibles:

```text
GET /health
GET /context?zip=80203
GET /context?zip=80203,90210,10001
```

También se puede utilizar Postman o curl:

```bash
curl "http://localhost:3000/context?zip=80203"
```

## Flujo principal

1. La CLI o el servidor recibe uno o varios ZIP codes.
2. `zipParser.js` separa y valida los valores.
3. `locationService.js` consulta Zippopotam para obtener ciudad y coordenadas.
4. Si Zippopotam falla, se intenta una ubicación aproximada mediante ip-api.
5. Con las coordenadas se consulta el clima y la calidad del aire al mismo tiempo con `Promise.all`.
6. `weatherCodes.js` transforma el código WMO en una condición legible.
7. `outdoorScore.js` calcula el puntaje.
8. `agentContext.js` crea el resumen y la recomendación.
9. `locationContext.js` construye el JSON final y lo guarda en caché.

## Consultas en paralelo

Después de obtener la latitud y longitud necesito consultar dos servicios: el clima y la calidad del aire. Ninguna de estas consultas depende de la otra, porque ambas solamente necesitan las coordenadas.

Por eso decidí ejecutarlas al mismo tiempo con `Promise.all`:

```js
const [clima, aire] = await Promise.all([
  obtenerClima(ubicacion.lat, ubicacion.lon),
  obtenerCalidadAire(ubicacion.lat, ubicacion.lon)
]);
```

De esta manera no tengo que esperar que termine la consulta del clima para comenzar la consulta del aire. Cuando las dos terminan, guardo cada resultado en su variable y continúo con el cálculo del `outdoor_score`.

Si cualquiera de las dos consultas falla, el error pasa al `catch` de `obtenerContextoPorZip` y se devuelve un error con la misma estructura que utilizo en el resto del proyecto.

## Mapeo de condiciones WMO

Open-Meteo devuelve un número en `weathercode`. En el proyecto lo agrupé así:

| Código             | Condición            |
| ------------------ | -------------------- |
| 0                  | Despejado            |
| 1, 2               | Parcialmente nublado |
| 3                  | Nublado              |
| 45, 48             | Niebla               |
| 51, 53, 55, 56, 57 | Llovizna             |
| 61, 63, 65, 66, 67 | Lluvia               |
| 71, 73, 75, 77     | Nieve                |
| 80, 81, 82         | Chubascos            |
| 85, 86             | Chubascos de nieve   |
| 95, 96, 99         | Tormenta             |

Los códigos que no pertenecen a un grupo se muestran como `Condición desconocida`.

## Calidad del aire y contaminante dominante

Open-Meteo devuelve el AQI general y también un componente AQI para cada contaminante. Para encontrar el contaminante dominante comparo esos componentes y selecciono el que tenga el valor más alto.

No comparo directamente las concentraciones de PM2.5, PM10, ozono y los demás contaminantes porque utilizan escalas o unidades diferentes. Comparar sus componentes AQI me permite usar una misma escala.

En el JSON mantengo nombres técnicos como `pm2_5`, `pm10` u `ozone`. En el frontend los convierto a nombres más fáciles de entender:

| Valor del JSON       | Nombre mostrado en el frontend       |
| -------------------- | ------------------------------------- |
| `pm2_5`              | Partículas finas (PM2.5)              |
| `pm10`               | Partículas inhalables (PM10)          |
| `ozone`              | Ozono (O₃)                            |
| `nitrogen_dioxide`   | Dióxido de nitrógeno (NO₂)            |
| `sulphur_dioxide`    | Dióxido de azufre (SO₂)               |
| `carbon_monoxide`    | Monóxido de carbono (CO)              |

Esta traducción solamente cambia la forma en que se muestra el dato. El valor original del backend se conserva dentro del JSON.

## Lógica del outdoor score

La prueba no proporciona una fórmula específica para calcular el `outdoor_score`, por lo que opté por utilizar un sistema sencillo de penalizaciones.

El puntaje comienza en **10**, que representa condiciones ideales para realizar actividades al aire libre. Después se restan puntos según cuatro factores:

- **Temperatura:** resta entre 0 y 3 puntos.
- **Velocidad del viento:** resta entre 0 y 3 puntos.
- **Condición climática:** resta entre 0 y 4 puntos.
- **Calidad del aire (AQI):** resta entre 0 y 4 puntos.

Las condiciones más desfavorables reciben una penalización mayor. Por ejemplo, una tormenta resta más puntos que un cielo nublado, y una temperatura extrema resta más que una temperatura ligeramente fuera del rango ideal.

Ejemplo:

```text
Puntaje inicial:        10
Temperatura incómoda:   -2
Viento moderado:        -1
Lluvia:                 -3
AQI bueno:               0
Resultado final:         4
```

El resultado mínimo es **1** y el máximo es **10**. Si las penalizaciones hacen que el puntaje sea menor que 1, el sistema lo ajusta automáticamente a 1.

Esta fórmula es una regla propia, sencilla y explicable; no representa un índice meteorológico oficial.

## Fallback por IP

Si la consulta por ZIP falla, `locationService.js` intenta obtener una ubicación mediante ip-api. El resultado indica qué fuente se utilizó:

```json
"source": "zip"
```

o:

```json
"source": "ip_fallback"
```

La IP observada corresponde al equipo o servidor que ejecuta el backend, por lo que puede no representar al usuario final en un despliegue remoto.

## Caché

El caché utiliza un `Map` en memoria. Si se consulta nuevamente el mismo ZIP durante la sesión, se devuelve el resultado guardado:

```json
"cache": { "hit": true }
```

El caché se elimina cuando se reinicia el proceso.

## Pruebas

Para ejecutar las pruebas:

```bash
npm test
```

Las pruebas cubren:

- Separación y validación de ZIP codes.
- Conversión de códigos WMO.
- Reglas principales del `outdoor_score`.
- Clasificación del AQI y contaminante dominante.

## Comandos disponibles

| Comando                | Descripción                                       |
| ---------------------- | ------------------------------------------------- |
| `npm start`            | Inicia el servidor y el frontend                  |
| `npm run dev`          | Inicia el servidor y reinicia al detectar cambios |
| `npm run cli -- 80203` | Ejecuta una consulta desde consola                |
| `npm test`             | Ejecuta las pruebas unitarias                     |

## Problemas comunes

### El puerto 3000 está ocupado

Si aparece `EADDRINUSE`, significa que otro proceso ya utiliza el puerto. Puedo detener el servidor anterior con `Ctrl + C` o utilizar temporalmente otro puerto:

```powershell
$env:PORT=3001
npm start
```

Después puedo abrir `http://localhost:3001`.

### Todos los resultados muestran fallback por IP

Primero compruebo que esta variable exista en `.env`:

```env
ZIPPOPOTAMUS_API_URL=https://api.zippopotam.us
```

También verifico que `config.js` exporte `ZIPPOPOTAMUS_API_URL`.

## Limitaciones conocidas

- El resultado depende de la disponibilidad de APIs externas.
- El fallback por IP es aproximado.
- El caché solo existe dentro del proceso actual.
- Tailwind CSS y Lucide Icons se cargan desde CDN en el frontend.
