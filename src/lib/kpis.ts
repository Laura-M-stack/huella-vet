import { addDays, monthOf, previousMonth } from './dates.ts';
import { turnosActivos } from './agenda.ts';
import { requiereAtencion } from './stock.ts';
import { vacunasPendientes } from './vaccines.ts';
import type { AppData } from '../state/types.ts';

export interface PuntoIngreso {
  fecha: string;
  total: number;
}

export interface Kpis {
  turnosHoy: number;
  enSala: number;
  atendidosHoy: number;
  internados: number;
  vacunasARevisar: number;
  vacunasVencidas: number;
  insumosEnAlerta: number;
  ingresosMes: number;
  ingresosMesAnterior: number;
  /** Variacion porcentual contra el mes anterior, o null si no hay base de comparacion. */
  variacionMes: number | null;
  ultimosSieteDias: PuntoIngreso[];
}

export function sumarIngresos(data: AppData, desde: string, hasta: string): number {
  return data.consultas.reduce((acc, c) => (c.fecha >= desde && c.fecha <= hasta ? acc + c.importe : acc), 0);
}

export function ingresosDelMes(data: AppData, mes: string): number {
  return data.consultas.reduce((acc, c) => (monthOf(c.fecha) === mes ? acc + c.importe : acc), 0);
}

function diasDelMes(mes: string): number {
  const [y, m] = mes.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Ingresos del mes anterior hasta el mismo dia del mes que `hoy` (comparacion justa a mitad de mes). */
export function ingresosMesAnteriorMismoPeriodo(data: AppData, hoy: string): number {
  const anterior = previousMonth(monthOf(hoy));
  const dia = Math.min(Number(hoy.slice(8)), diasDelMes(anterior));
  return sumarIngresos(data, `${anterior}-01`, `${anterior}-${String(dia).padStart(2, '0')}`);
}

export function variacionPorcentual(actual: number, anterior: number): number | null {
  if (anterior <= 0) return null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

export function ultimosDias(data: AppData, hoy: string, cantidad = 7): PuntoIngreso[] {
  const out: PuntoIngreso[] = [];
  for (let i = cantidad - 1; i >= 0; i--) {
    const fecha = addDays(hoy, -i);
    out.push({ fecha, total: sumarIngresos(data, fecha, fecha) });
  }
  return out;
}

export function calcularKpis(data: AppData, hoy: string): Kpis {
  const deHoy = data.turnos.filter((t) => t.fecha === hoy);
  const pendientes = vacunasPendientes(data.pacientes, data.vacunaciones, hoy);
  const mes = monthOf(hoy);
  const ingresosMes = ingresosDelMes(data, mes);
  const ingresosMesAnterior = ingresosMesAnteriorMismoPeriodo(data, hoy);
  return {
    turnosHoy: turnosActivos(deHoy).length,
    enSala: deHoy.filter((t) => t.estado === 'en_sala').length,
    atendidosHoy: deHoy.filter((t) => t.estado === 'atendido').length,
    internados: data.pacientes.filter((p) => p.internado).length,
    vacunasARevisar: pendientes.length,
    vacunasVencidas: pendientes.filter((f) => f.estado === 'vencida').length,
    insumosEnAlerta: data.insumos.filter((i) => requiereAtencion(i, hoy)).length,
    ingresosMes,
    ingresosMesAnterior,
    variacionMes: variacionPorcentual(ingresosMes, ingresosMesAnterior),
    ultimosSieteDias: ultimosDias(data, hoy, 7),
  };
}
