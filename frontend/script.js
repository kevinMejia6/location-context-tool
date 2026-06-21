// ==========================================================
// FRONTEND
// Este archivo controla la parte visual de la aplicacion.
// Lee el ZIP, llama al backend y muestra los resultados.
// ==========================================================

// Busca en el HTML el formulario donde el usuario escribe el ZIP.
const formularioZip = document.getElementById('formularioZip');

// Busca en el HTML el input donde se escribe uno o varios ZIP codes.
const inputZip = document.getElementById('inputZip');

// Busca en el HTML el bloque que muestra el mensaje de carga.
const estadoCarga = document.getElementById('estadoCarga');

// Busca en el HTML el contenedor donde se insertan las tarjetas de resultado.
const contenedorResultados = document.getElementById('contenedorResultados');

/**
 * Evita que texto externo rompa el HTML.
 * Tambien previene que una respuesta externa inserte HTML peligroso.
 */
function escaparHtml(valor) {
  // Convierte cualquier valor recibido a texto; si viene null/undefined usa texto vacio.
  return String(valor ?? '')
    // Reemplaza & para que no se interprete como parte de una entidad HTML.
    .replaceAll('&', '&amp;')
    // Reemplaza < para que no se pueda abrir una etiqueta HTML.
    .replaceAll('<', '&lt;')
    // Reemplaza > para que no se pueda cerrar una etiqueta HTML.
    .replaceAll('>', '&gt;')
    // Reemplaza comillas dobles para que no rompan atributos HTML.
    .replaceAll('"', '&quot;')
    // Reemplaza comillas simples para que no rompan atributos HTML.
    .replaceAll("'", '&#039;');
}

/**
 * Muestra u oculta el mensaje de carga.
 */
function mostrarCarga(mostrar) {
  // Si mostrar es false agrega la clase hidden; si mostrar es true la quita.
  estadoCarga.classList.toggle('hidden', !mostrar);
}

/**
 * Llama al backend enviando el ZIP.
 */
async function consultarZip(zip) {
  // Hace una peticion GET al endpoint /context y protege el ZIP con encodeURIComponent.
  const respuesta = await fetch(`/context?zip=${encodeURIComponent(zip)}`);

  // El backend devuelve JSON tanto para respuestas exitosas como para errores controlados.
  return respuesta.json();
}

/**
 * Convierte el resultado en lista.
 * Esto sirve porque el backend puede devolver:
 * - Un objeto si consultas un ZIP.
 * - Un array si consultas varios ZIPs.
 */
function normalizarALista(resultado) {
  // Si ya es un array lo devuelve igual; si es un objeto lo mete dentro de un array.
  return Array.isArray(resultado) ? resultado : [resultado];
}

/**
 * Tarjeta visual para errores.
 */
function tarjetaError(error) {
  // Devuelve un bloque HTML como texto para mostrar un error amigable en pantalla.
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

/**
 * Pequena tarjeta de metrica.
 */
function metrica(icono, titulo, valor) {
  // Devuelve una tarjeta pequena con icono, titulo y valor.
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

/**
 * Devuelve un color visual segun el outdoor score.
 */
function claseOutdoorScore(score) {
  // Score alto: usa color verde.
  if (score >= 8) return 'bg-emerald-600 shadow-emerald-600/20';

  // Score medio-alto: usa color azul.
  if (score >= 5) return 'bg-blue-600 shadow-blue-600/20';

  // Score bajo-medio: usa color amarillo.
  if (score >= 3) return 'bg-amber-500 shadow-amber-500/20';

  // Score muy bajo: usa color rojo.
  return 'bg-red-600 shadow-red-600/20';
}

/**
 * Tarjeta principal de contexto.
 */
function tarjetaContexto(contexto) {
  // Si el backend dice que no fue exitoso, se muestra una tarjeta de error.
  if (!contexto.ok) {
    return tarjetaError(contexto.error);
  }

  // Define el texto que indica si la ubicacion salio del ZIP o del fallback por IP.
  const origen = contexto.input?.source === 'zip'
    ? 'Encontrado por ZIP'
    : 'Fallback por IP';

  // Obtiene la ciudad desde la respuesta; si no existe, usa un texto por defecto.
  const ciudad = contexto.location?.city || 'Ciudad no disponible';

  // Obtiene el estado desde la respuesta; si no existe, usa texto vacio.
  const estado = contexto.location?.state || '';

  // Obtiene el pais desde la respuesta; si no existe, usa texto vacio.
  const pais = contexto.location?.country || '';

  // Obtiene la latitud; si no existe, muestra un guion.
  const lat = contexto.location?.lat ?? '-';

  // Obtiene la longitud; si no existe, muestra un guion.
  const lon = contexto.location?.lon ?? '-';

  // Obtiene la temperatura en Celsius; si no existe, muestra un guion.
  const temperatura = contexto.weather?.temperature_c ?? '-';

  // Obtiene la velocidad del viento; si no existe, muestra un guion.
  const viento = contexto.weather?.windspeed_kmh ?? '-';

  // Obtiene la condicion del clima; si no existe, muestra un guion.
  const condicion = contexto.weather?.condition || '-';

  // Obtiene el AQI US; si no existe, muestra un guion.
  const aqi = contexto.air_quality?.aqi_us ?? '-';

  // Obtiene el nivel textual de calidad del aire.
  const nivelAire = contexto.air_quality?.level || '-';

  // Obtiene el contaminante dominante calculado por el backend.
  const contaminante = contexto.air_quality?.dominant_pollutant || '-';

  // Obtiene el outdoor score; si no existe, muestra un guion.
  const score = contexto.outdoor_score ?? '-';

  // Si agent_context viene como texto, lo usa directamente.
  // Si viene como objeto, toma la propiedad summary.
  const agentContext = typeof contexto.agent_context === 'string'
    ? contexto.agent_context
    : contexto.agent_context?.summary || 'Sin contexto disponible.';

  // Si agent_context es un objeto, toma la recomendacion.
  const recomendacion = typeof contexto.agent_context === 'object'
    ? contexto.agent_context?.recommendation || ''
    : '';

  // Convierte todo el contexto a JSON formateado para mostrarlo en el detalle.
  const json = escaparHtml(JSON.stringify(contexto, null, 2));

  // Devuelve toda la tarjeta HTML del resultado.
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

/**
 * Evento principal del formulario.
 */
formularioZip.addEventListener('submit', async (evento) => {
  // Evita que el navegador recargue la pagina al enviar el formulario.
  evento.preventDefault();

  // Lee el ZIP escrito por el usuario y quita espacios al inicio/final.
  const zip = inputZip.value.trim();

  // Limpia resultados anteriores antes de hacer una nueva consulta.
  contenedorResultados.innerHTML = '';

  // Si el usuario no escribio ZIP, muestra error y detiene el flujo.
  if (!zip) {
    // Inserta una tarjeta de error en el contenedor de resultados.
    contenedorResultados.innerHTML = tarjetaError({
      message: 'Escribe un ZIP. Ejemplo: 80203'
    });

    // Vuelve a crear los iconos porque se inserto HTML nuevo.
    lucide.createIcons();

    // Termina la funcion para no llamar al backend sin ZIP.
    return;
  }

  // Muestra el bloque de carga mientras se consulta el backend.
  mostrarCarga(true);

  try {
    // Llama al backend con el ZIP ingresado.
    const resultado = await consultarZip(zip);

    // Convierte el resultado a lista, crea una tarjeta por item y une el HTML.
    contenedorResultados.innerHTML = normalizarALista(resultado)
      .map(tarjetaContexto)
      .join('');

    // Activa los iconos Lucide que fueron agregados dentro del HTML nuevo.
    lucide.createIcons();
  } catch (error) {
    // Si falla fetch u ocurre un error inesperado, muestra una tarjeta de error.
    contenedorResultados.innerHTML = tarjetaError({
      message: error.message
    });

    // Activa los iconos Lucide dentro de la tarjeta de error.
    lucide.createIcons();
  } finally {
    // Oculta el bloque de carga sin importar si hubo exito o error.
    mostrarCarga(false);
  }
});

/**
 * Botones rapidos.
 */
document.querySelectorAll('.zip-rapido').forEach((boton) => {
  // A cada boton rapido se le agrega un evento click.
  boton.addEventListener('click', () => {
    // Copia el ZIP del atributo data-zip al input.
    inputZip.value = boton.dataset.zip;

    // Enfoca el input para que el usuario pueda editar o enviar rapido.
    inputZip.focus();
  });
});

/**
 * Carga los iconos de Lucide.
 */
// Reemplaza todos los <i data-lucide="..."> iniciales por iconos SVG.
lucide.createIcons();
