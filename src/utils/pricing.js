// src/utils/pricing.js

// Lista de feriados de Chile (ajustados para 2026).
const FERIADOS_CHILE = [
  '2026-01-01', '2026-04-03', '2026-04-04', '2026-05-01', 
  '2026-05-21', '2026-06-21', '2026-06-29', '2026-07-16', 
  '2026-08-15', '2026-09-18', '2026-09-19', '2026-10-12', 
  '2026-10-31', '2026-11-01', '2026-12-08', '2026-12-25'
];

/**
 * Calcula el costo total de un servicio dividiendo el tiempo hora por hora
 * para aplicar la tarifa correspondiente (Base, Fin de Semana, Feriado).
 * 
 * @param {Date} fechaInicio 
 * @param {Date} fechaFin 
 * @param {Object} tarifas Objeto {baseHora, finDeSemanaHora, festivoHora}
 * @returns {Object} { total: number, desglose: string, horas: number }
 */
export function calcularCostoServicio(fechaInicio, fechaFin, tarifas) {
  let totalCost = 0;
  let currentHour = new Date(fechaInicio);
  
  const duracionMs = fechaFin.getTime() - fechaInicio.getTime();
  const horasTotales = duracionMs / (1000 * 60 * 60);

  let hrsBase = 0;
  let hrsFinde = 0;
  let hrsFestivo = 0;

  const tBase = tarifas?.baseHora || 0;
  const tFinde = tarifas?.finDeSemanaHora || tBase; 
  const tFest = tarifas?.festivoHora || tFinde;

  while (currentHour < fechaFin) {
    let nextHour = new Date(currentHour);
    nextHour.setHours(currentHour.getHours() + 1, 0, 0, 0);
    
    if (nextHour > fechaFin) nextHour = new Date(fechaFin);

    const fraccionHora = (nextHour.getTime() - currentHour.getTime()) / (1000 * 60 * 60);
    
    const dayOfWeek = currentHour.getDay(); // 0 (Dom) a 6 (Sab)
    const dateString = currentHour.toISOString().split('T')[0];
    
    const esFeriado = FERIADOS_CHILE.includes(dateString);
    const esFinDeSemana = (dayOfWeek === 0 || dayOfWeek === 6);

    if (esFeriado) {
      totalCost += fraccionHora * tFest;
      hrsFestivo += fraccionHora;
    } else if (esFinDeSemana) {
      totalCost += fraccionHora * tFinde;
      hrsFinde += fraccionHora;
    } else {
      totalCost += fraccionHora * tBase;
      hrsBase += fraccionHora;
    }

    currentHour = nextHour;
  }

  let desglose = `Duración total: ${horasTotales.toFixed(1)} hrs. `;
  if (hrsBase > 0) desglose += `(${hrsBase.toFixed(1)} hrs Base) `;
  if (hrsFinde > 0) desglose += `(${hrsFinde.toFixed(1)} hrs Fin de Semana) `;
  if (hrsFestivo > 0) desglose += `(${hrsFestivo.toFixed(1)} hrs Festivo) `;

  return {
    total: Math.round(totalCost),
    desglose: desglose.trim(),
    horas: horasTotales
  };
}