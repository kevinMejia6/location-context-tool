// Convierte el código meteorológico numérico en una condición legible.
function mapearCondicion(weathercode) {
// El código meteorológico es un número entero que representa la condición climática actual según la API de Open-Meteo.  
  const codigo = Number(weathercode);

  // Los grupos se basan en los códigos WMO que devuelve Open-Meteo.
  if (codigo === 0) return "Despejado"; // Código 0 representa cielo despejado.
 
  if ([1, 2].includes(codigo)) return "Parcialmente nublado"; // Códigos 1 y 2 representan cielo parcialmente nublado.
 
  if (codigo === 3) return "Nublado";// Código 3 representa cielo completamente nublado.
 
  if ([45, 48].includes(codigo)) return "Niebla"; // Códigos 45 y 48 representan niebla o neblina.
 
  if ([51, 53, 55, 56, 57].includes(codigo)) return "Llovizna"; // Códigos 51, 53, 55 representan llovizna ligera, moderada y fuerte respectivamente. Códigos 56 y 57 representan llovizna congelada ligera y fuerte.
 
  if ([61, 63, 65, 66, 67].includes(codigo)) return "Lluvia"; // Códigos 61, 63, 65 representan lluvia ligera, moderada y fuerte respectivamente. Códigos 66 y 67 representan lluvia congelada ligera y fuerte.
 
  if ([71, 73, 75, 77].includes(codigo)) return "Nieve";// Códigos 71, 73, 75 representan nieve ligera, moderada y fuerte. El 77 representa granos de nieve.
 
  if ([80, 81, 82].includes(codigo)) return "Chubascos"; // Códigos 80, 81, 82 representan chubascos de lluvia ligera, moderada y fuerte respectivamente.
 
  if ([85, 86].includes(codigo)) return "Chubascos de nieve"; // Códigos 85 y 86 representan chubascos de nieve ligera y fuerte respectivamente.
 
  if ([95, 96, 99].includes(codigo)) return "Tormenta"; // El 95 representa tormenta; 96 y 99 representan tormenta con granizo ligero o fuerte.
 
  return "Condición desconocida";  // Si el código no coincide con ninguno de los casos anteriores, se devuelve esta cadena por defecto.
}

module.exports = { mapearCondicion };
