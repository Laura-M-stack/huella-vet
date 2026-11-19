import { diffDays } from './dates.ts';
import type { Insumo } from '../state/types.ts';

export const VENCIMIENTO_AVISO_DIAS = 60;

export type EstadoInsumo = 'ok' | 'por_vencer' | 'bajo' | 'agotado' | 'vencido';

/** Prioridad: lo mas grave gana cuando se dan varias condiciones a la vez. */
export function estadoInsumo(insumo: Insumo, hoy: string): EstadoInsumo {
  if (insumo.vencimiento && diffDays(hoy, insumo.vencimiento) < 0) return 'vencido';
  if (insumo.stock <= 0) return 'agotado';
  if (insumo.stock <= insumo.minimo) return 'bajo';
  if (insumo.vencimiento && diffDays(hoy, insumo.vencimiento) <= VENCIMIENTO_AVISO_DIAS) return 'por_vencer';
  return 'ok';
}

export function requiereAtencion(insumo: Insumo, hoy: string): boolean {
  return estadoInsumo(insumo, hoy) !== 'ok';
}

/** Nuevo stock tras una entrada (+) o salida (-). Nunca baja de cero. */
export function ajustarStock(actual: number, delta: number): number {
  return Math.max(0, actual + delta);
}

/** Cuanto del minimo recomendado hay (0 a 1), para la barra de progreso. */
export function nivelStock(insumo: Insumo): number {
  const objetivo = Math.max(insumo.minimo * 2, 1);
  return Math.min(1, Math.max(0, insumo.stock / objetivo));
}

export function validarCantidad(valor: number): string | null {
  if (!Number.isFinite(valor) || !Number.isInteger(valor)) return 'Ingresá un número entero.';
  if (valor <= 0) return 'La cantidad tiene que ser mayor a cero.';
  if (valor > 10_000) return 'La cantidad es demasiado grande.';
  return null;
}
