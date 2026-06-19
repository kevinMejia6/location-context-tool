@'
# Location Context Tool

Solución para la prueba técnica de **Integrador IA Agents**.

Esta herramienta recibe uno o varios **ZIP codes de Estados Unidos** y devuelve un JSON enriquecido con información útil sobre ubicación, clima, calidad del aire y contexto listo para ser consumido por un agente de IA, bot o sistema externo.

---

## ¿Qué hace esta herramienta?

A partir de un ZIP code, el sistema devuelve información como:

- Ubicación: ciudad, estado, país, latitud y longitud.
- Clima actual usando Open-Meteo.
- Calidad del aire usando Open-Meteo Air Quality.
- Fallback por IP usando ip-api.com si el ZIP falla.
- Condición climática legible a partir del `weathercode` WMO.
- `outdoor_score` del 1 al 10.
- `agent_context` listo para ser usado por un agente o bot.

---

## Puntos extra agregados

- Servidor HTTP con endpoint `/context`.
- Soporte para consultar múltiples ZIP codes.
- Caché en memoria para evitar repetir consultas.
- Frontend visual para probar la herramienta desde el navegador.
- Variables de entorno con `.env`.

---

## Estructura del proyecto

```txt
location-context-tool-simple/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── server.js
│   │   └── locationContext.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── index.html
│   └── script.js
└── README.md
```

---

## Requisitos

- Node.js
- npm
- Git

---

## Instalación

Entrar a la carpeta del backend:

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

Crear el archivo `.env` tomando como base `.env.example`.

Ejemplo:

```env
PORT=3000
```

---

## Ejecutar el servidor

Desde la carpeta `backend`, ejecutar:

```bash
npm start
```

El servidor quedará disponible en:

```txt
http://localhost:3000
```

---

## Endpoint principal

```http
GET /context?zip=90210
```

Ejemplo:

```txt
http://localhost:3000/context?zip=90210
```

---

## Consulta de múltiples ZIP codes

```txt
http://localhost:3000/context?zip=90210,10001,33101
```

---

## Frontend visual

El proyecto incluye una interfaz visual en:

```txt
frontend/index.html
```

Desde ahí se pueden probar los ZIP codes desde el navegador.

---

## Tecnologías usadas

- Node.js
- JavaScript
- HTML
- Tailwind CSS
- Open-Meteo API
- Open-Meteo Air Quality API
- Zippopotam API
- ip-api.com

---

## Autor

Desarrollado por **Kevin Eduardo**.
'@ | Set-Content README.md -Encoding UTF8
