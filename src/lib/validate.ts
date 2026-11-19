import { diffDays, isValidISO } from './dates.ts';
import type { Especie } from '../state/types.ts';

export interface DatosPaciente {
  nombre: string;
  especie: Especie;
  raza: string;
  nacimiento: string;
  pesoKg: number;
  tutorNombre: string;
  tutorTelefono: string;
}

const MAX_EDAD_DIAS = 40 * 365;

function pesoMaximo(especie: Especie): number {
  if (especie === 'ave') return 5;
  if (especie === 'conejo') return 10;
  if (especie === 'gato') return 15;
  return 120;
}

/** Mensaje de error, o null si los datos se pueden guardar. */
export function validarPaciente(d: DatosPaciente, hoy: string): string | null {
  if (d.nombre.trim().length < 2) return 'Escribí el nombre de la mascota.';
  if (d.raza.trim().length < 2) return 'Escribí la raza (o "Mestizo").';
  if (!isValidISO(d.nacimiento)) return 'Elegí la fecha de nacimiento.';
  const dias = diffDays(d.nacimiento, hoy);
  if (dias < 0) return 'La fecha de nacimiento no puede ser futura.';
  if (dias > MAX_EDAD_DIAS) return 'Revisá la fecha de nacimiento: es demasiado antigua.';
  if (!Number.isFinite(d.pesoKg) || d.pesoKg <= 0) return 'Ingresá un peso mayor a cero.';
  if (d.pesoKg > pesoMaximo(d.especie)) return 'El peso parece demasiado alto para esa especie.';
  if (d.tutorNombre.trim().length < 3) return 'Escribí el nombre del tutor.';
  if (d.tutorTelefono.replace(/\D/g, '').length < 8) return 'El teléfono tiene que tener al menos 8 dígitos.';
  return null;
}

export function validarConsulta(motivo: string, diagnostico: string, importe: number): string | null {
  if (motivo.trim().length < 3) return 'Escribí el motivo de la consulta.';
  if (diagnostico.trim().length < 3) return 'Escribí el diagnóstico o "Sin hallazgos".';
  if (!Number.isFinite(importe) || importe < 0) return 'El importe no puede ser negativo.';
  if (importe > 5_000_000) return 'El importe es demasiado alto.';
  return null;
}

export function validarInsumo(nombre: string, stock: number, minimo: number, unidad: string): string | null {
  if (nombre.trim().length < 3) return 'Escribí el nombre del insumo.';
  if (unidad.trim().length < 2) return 'Indicá la unidad (frascos, dosis, bolsas...).';
  if (!Number.isInteger(stock) || stock < 0) return 'El stock tiene que ser un número entero, desde cero.';
  if (!Number.isInteger(minimo) || minimo < 0) return 'El mínimo tiene que ser un número entero, desde cero.';
  return null;
}
