
// Aqui convertimos los codigos del clima que devuelve Open-Meteo en textos faciles de leer.
// Recibimos el codigo numerico y devolvemos una condicion como Lluvia, Nieve o Tormenta.

function mapearCondicion(weathercode) {
  const codigo = Number(weathercode);

  if (codigo === 0) return 'Despejado';
  if ([1, 2].includes(codigo)) return 'Parcialmente nublado';
  if (codigo === 3) return 'Nublado';
  if ([45, 48].includes(codigo)) return 'Niebla';
  if ([51, 53, 55, 56, 57].includes(codigo)) return 'Llovizna';
  if ([61, 63, 65, 66, 67].includes(codigo)) return 'Lluvia';
  if ([71, 73, 75, 77].includes(codigo)) return 'Nieve';
  if ([80, 81, 82].includes(codigo)) return 'Chubascos';
  if ([85, 86].includes(codigo)) return 'Chubascos de nieve';
  if ([95, 96, 99].includes(codigo)) return 'Tormenta';

  return 'Condición desconocida';
}

module.exports = { mapearCondicion };
