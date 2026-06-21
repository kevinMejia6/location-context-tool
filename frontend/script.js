// Este archivo controla lo que pasa en la pagina cuando el usuario consulta un ZIP.
// Leemos el formulario, llamamos al backend y mostramos los resultados o errores.

const formularioZip = document.getElementById('formularioZip');
const inputZip = document.getElementById('inputZip');
const estadoCarga = document.getElementById('estadoCarga');
const contenedorResultados = document.getElementById('contenedorResultados');

// Recibimos cualquier valor que venga de las APIs y reemplazamos los caracteres
// especiales para evitar que se interpreten como etiquetas o scripts.

function escaparHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
// Recibimos true o false para mostrar u ocultar el mensaje de carga.

function mostrarCarga(mostrar) {
  estadoCarga.classList.toggle('hidden', !mostrar);
}
// Recibimos uno o varios ZIP, los enviamos al endpoint /context y devolvemos
// el JSON que responde el backend.

async function consultarZip(zip) {
  const respuesta = await fetch(`/context?zip=${encodeURIComponent(zip)}`);
  return respuesta.json();
}
// Como el backend puede devolver un objeto o una lista, aqui nos aseguramos de
// trabajar siempre con una lista para poder mostrar los resultados de la misma forma.

function normalizarALista(resultado) {
  return Array.isArray(resultado) ? resultado : [resultado];
}
// Recibimos un error y devolvemos el HTML de una tarjeta con su mensaje y detalle.
function tarjetaError(error) {
  return `
    <article class="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
      <div class="flex items-start gap-3">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <i data-lucide="alert-triangle" class="h-5 w-5"></i>
        </div>

        <div>
          <h2 class="text-xl font-black">No se pudo consultar</h2>
          <p class="mt-1 text-sm leading-6">
            ${escaparHtml(error?.message || error?.detail || 'Error desconocido')}
          </p>
        </div>
      </div>

      <details class="mt-4">
        <summary class="cursor-pointer text-sm font-bold text-red-700">
          Ver detalle del error
        </summary>

        <pre class="mt-3 overflow-auto rounded-2xl bg-red-950 p-4 text-sm text-red-100">${escaparHtml(JSON.stringify(error, null, 2))}</pre>
      </details>
    </article>
  `;
}
// Recibimos el icono, titulo y valor para crear una tarjeta pequeña de una metrica.
function metrica(icono, titulo, valor) {
  return `
    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div class="mb-2 flex items-center gap-2 text-sm font-bold text-slate-600">
        <i data-lucide="${icono}" class="h-4 w-4 text-blue-600"></i>
        ${escaparHtml(titulo)}
      </div>

      <p class="text-2xl font-black text-slate-950">
        ${escaparHtml(valor)}
      </p>
    </div>
  `;
}
// Recibimos el outdoor score y devolvemos las clases de color que le corresponden.
function claseOutdoorScore(score) {
  if (score >= 8) return 'bg-emerald-600 shadow-emerald-600/20';
  if (score >= 5) return 'bg-blue-600 shadow-blue-600/20';
  if (score >= 3) return 'bg-amber-500 shadow-amber-500/20';
  return 'bg-red-600 shadow-red-600/20';
}

// Recibimos el nombre tecnico del contaminante y devolvemos un texto mas facil de entender.
function nombreContaminante(contaminante) {
  const nombres = {
    pm2_5: 'Partículas finas (PM2.5)',
    pm10: 'Partículas inhalables (PM10)',
    ozone: 'Ozono (O₃)',
    nitrogen_dioxide: 'Dióxido de nitrógeno (NO₂)',
    sulphur_dioxide: 'Dióxido de azufre (SO₂)',
    carbon_monoxide: 'Monóxido de carbono (CO)',
    unknown: 'No disponible'
  };

  return nombres[contaminante] || contaminante || 'No disponible';
}

// Recibimos todo el contexto de un ZIP y devolvemos el HTML de la tarjeta principal.
// Si el contexto trae un error, usamos tarjetaError en lugar de mostrar las metricas.
function tarjetaContexto(contexto) {
  if (!contexto.ok) {
    return tarjetaError(contexto.error);
  }
  const origen = contexto.input?.source === 'zip'
    ? 'Encontrado por ZIP'
    : 'Fallback por IP';
  const ciudad = contexto.location?.city || 'Ciudad no disponible';
  const estado = contexto.location?.state || '';
  const pais = contexto.location?.country || '';
  const lat = contexto.location?.lat ?? '-';
  const lon = contexto.location?.lon ?? '-';
  const temperatura = contexto.weather?.temperature_c ?? '-';
  const viento = contexto.weather?.windspeed_kmh ?? '-';
  const condicion = contexto.weather?.condition || '-';
  const aqi = contexto.air_quality?.aqi_us ?? '-';
  const nivelAire = contexto.air_quality?.level || '-';
  const contaminante = nombreContaminante(
    contexto.air_quality?.dominant_pollutant
  );
  const score = contexto.outdoor_score ?? '-';
  const agentContext = typeof contexto.agent_context === 'string'
    ? contexto.agent_context
    : contexto.agent_context?.summary || 'Sin contexto disponible.';
  const recomendacion = typeof contexto.agent_context === 'object'
    ? contexto.agent_context?.recommendation || ''
    : '';
  const json = escaparHtml(JSON.stringify(contexto, null, 2));
  return `
    <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">

      <div class="grid gap-5 border-b border-slate-200 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <span class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
            <i data-lucide="map-pin" class="h-3.5 w-3.5"></i>
            ${origen}
          </span>

          <h2 class="mt-4 text-3xl font-black text-slate-950">
            ${escaparHtml(ciudad)}${estado ? `, ${escaparHtml(estado)}` : ''}
          </h2>

          <p class="mt-1 text-sm text-slate-500">
            ${escaparHtml(pais)} · Lat ${escaparHtml(lat)} · Lon ${escaparHtml(lon)}
          </p>
        </div>

        <div class="rounded-3xl ${claseOutdoorScore(Number(score))} p-5 text-center text-white shadow-lg">
          <p class="text-xs font-bold uppercase tracking-wide text-white/70">
            Outdoor Score
          </p>

          <p class="text-5xl font-black">
            ${escaparHtml(score)}
            <span class="text-xl text-white/60">/10</span>
          </p>
        </div>
      </div>

      <div class="grid gap-4 p-6 md:grid-cols-4">
        ${metrica('thermometer', 'Temperatura', `${temperatura} °C`)}
        ${metrica('wind', 'Viento', `${viento} km/h`)}
        ${metrica('cloud-sun', 'Condición', condicion)}
        ${metrica('leaf', 'AQI US', `${aqi} · ${nivelAire}`)}
      </div>

      <div class="px-6 pb-6">
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div class="mb-3 flex items-center gap-2 font-bold text-slate-800">
            <i data-lucide="bot" class="h-5 w-5 text-blue-600"></i>
            Contexto para agente
          </div>

          <p class="text-sm leading-6 text-slate-600">
            ${escaparHtml(agentContext)}
          </p>

          ${
            recomendacion
              ? `<p class="mt-3 font-bold text-slate-950">${escaparHtml(recomendacion)}</p>`
              : ''
          }

          <div class="mt-4 rounded-2xl bg-white p-4">
            <p class="text-sm text-slate-500">
              Contaminante dominante:
              <span class="font-black text-slate-900">${escaparHtml(contaminante)}</span>
            </p>
          </div>
        </div>
      </div>

      <details class="border-t border-slate-200 p-6">
        <summary class="cursor-pointer font-bold text-slate-700">
          Ver JSON completo
        </summary>

        <pre class="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">${json}</pre>
      </details>
    </article>
  `;
}
// Cuando enviamos el formulario evitamos que la pagina se recargue, validamos el ZIP,
// mostramos la carga, consultamos el backend y colocamos las tarjetas en la pagina.
formularioZip.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const zip = inputZip.value.trim();
  contenedorResultados.innerHTML = '';
  if (!zip) {
    contenedorResultados.innerHTML = tarjetaError({
      message: 'Escribe un ZIP. Ejemplo: 80203'
    });
    lucide.createIcons();
    return;
  }
  mostrarCarga(true);

  try {
    const resultado = await consultarZip(zip);
    contenedorResultados.innerHTML = normalizarALista(resultado)
      .map(tarjetaContexto)
      .join('');
    lucide.createIcons();
  } catch (error) {
    contenedorResultados.innerHTML = tarjetaError({
      message: error.message
    });
    lucide.createIcons();
  } finally {
    mostrarCarga(false);
  }
});
// Recorremos todos los botones de ejemplo para agregarles su evento de clic.
document.querySelectorAll('.zip-rapido').forEach((boton) => {
  // Al hacer clic copiamos el ZIP del boton al input y dejamos el campo seleccionado.
  boton.addEventListener('click', () => {
    inputZip.value = boton.dataset.zip;
    inputZip.focus();
  });
});
// Convierte los marcadores data-lucide iniciales en iconos SVG.
lucide.createIcons();
