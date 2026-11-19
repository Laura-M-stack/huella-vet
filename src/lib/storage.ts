import { crearDatosDemo } from './seed.ts';
import type { AppData } from '../state/types.ts';

const KEY = 'huella-vet:v1';
const ARRAYS = ['tutores', 'pacientes', 'profesionales', 'consultas', 'vacunaciones', 'turnos', 'insumos'] as const;

/** Chequeo estructural minimo: alcanza para descartar datos viejos o corruptos. */
export function esDatosValidos(valor: unknown): valor is AppData {
  if (typeof valor !== 'object' || valor === null) return false;
  const v = valor as Record<string, unknown>;
  if (v.version !== 1 || typeof v.generadoEl !== 'string') return false;
  if (typeof v.avisos !== 'object' || v.avisos === null || Array.isArray(v.avisos)) return false;
  return ARRAYS.every((k) => Array.isArray(v[k]));
}

/** Devuelve los datos guardados, o datos de ejemplo nuevos si no hay, estan rotos o son de otro dia. */
export function cargarDatos(hoy: string, storage: Pick<Storage, 'getItem'> | null = safeStorage()): AppData {
  try {
    const crudo = storage?.getItem(KEY);
    if (crudo) {
      const parsed: unknown = JSON.parse(crudo);
      if (esDatosValidos(parsed) && parsed.generadoEl === hoy) return parsed;
    }
  } catch {
    // JSON roto o storage bloqueado: se cae a los datos de ejemplo.
  }
  return crearDatosDemo(hoy);
}

export function guardarDatos(data: AppData, storage: Pick<Storage, 'setItem'> | null = safeStorage()): void {
  try {
    storage?.setItem(KEY, JSON.stringify(data));
  } catch {
    // Modo privado o cuota llena: la demo sigue funcionando en memoria.
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
