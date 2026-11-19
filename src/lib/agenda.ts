import { minutesToTime, timeToMinutes, weekday } from './dates.ts';
import type { EstadoTurno, Turno } from '../state/types.ts';

export const APERTURA = '09:00';
export const CIERRE = '18:00';
export const DURACIONES = [30, 45, 60] as const;

/** Horarios de inicio posibles, cada 30 minutos. */
export const HORARIOS: string[] = (() => {
  const out: string[] = [];
  for (let m = timeToMinutes(APERTURA); m < timeToMinutes(CIERRE); m += 30) out.push(minutesToTime(m));
  return out;
})();

export const ESTADO_LABEL: Record<EstadoTurno, string> = {
  confirmado: 'Confirmado',
  en_sala: 'En sala',
  atendido: 'Atendido',
  cancelado: 'Cancelado',
};

const TRANSICIONES: Record<EstadoTurno, EstadoTurno[]> = {
  confirmado: ['en_sala', 'cancelado'],
  en_sala: ['atendido'],
  atendido: [],
  cancelado: [],
};

export function puedePasar(desde: EstadoTurno, hasta: EstadoTurno): boolean {
  return TRANSICIONES[desde].includes(hasta);
}

export function transiciones(desde: EstadoTurno): EstadoTurno[] {
  return TRANSICIONES[desde];
}

function rango(t: Pick<Turno, 'hora' | 'duracion'>): [number, number] {
  const inicio = timeToMinutes(t.hora);
  return [inicio, inicio + t.duracion];
}

export function seSolapan(a: Turno, b: Turno): boolean {
  if (a.fecha !== b.fecha || a.profesionalId !== b.profesionalId) return false;
  const [a0, a1] = rango(a);
  const [b0, b1] = rango(b);
  return a0 < b1 && b0 < a1;
}

/** Turno activo que choca con `nuevo` (los cancelados no ocupan lugar). */
export function buscarConflicto(nuevo: Turno, existentes: Turno[]): Turno | undefined {
  return existentes.find((t) => t.id !== nuevo.id && t.estado !== 'cancelado' && seSolapan(nuevo, t));
}

export function turnosDelDia(turnos: Turno[], fecha: string): Turno[] {
  return turnos
    .filter((t) => t.fecha === fecha)
    .sort((a, b) => timeToMinutes(a.hora) - timeToMinutes(b.hora) || a.id.localeCompare(b.id));
}

export function turnosActivos(turnos: Turno[]): Turno[] {
  return turnos.filter((t) => t.estado !== 'cancelado');
}

/** Devuelve el mensaje de error, o null si el turno se puede guardar. */
export function validarTurno(nuevo: Turno, existentes: Turno[], hoy: string): string | null {
  if (!nuevo.pacienteId) return 'Elegí un paciente.';
  if (!nuevo.profesionalId) return 'Elegí un profesional.';
  if (!nuevo.fecha) return 'Elegí una fecha.';
  if (nuevo.fecha < hoy) return 'No se pueden cargar turnos en fechas pasadas.';
  if (weekday(nuevo.fecha) === 0) return 'La clínica no atiende los domingos.';
  const inicio = timeToMinutes(nuevo.hora);
  if (Number.isNaN(inicio)) return 'Elegí un horario.';
  if (inicio < timeToMinutes(APERTURA) || inicio + nuevo.duracion > timeToMinutes(CIERRE)) {
    return `El turno tiene que terminar antes de las ${CIERRE}.`;
  }
  if (nuevo.motivo.trim().length < 3) return 'Escribí el motivo de la consulta.';
  const choque = buscarConflicto(nuevo, existentes);
  if (choque) return `Ese profesional ya tiene un turno a las ${choque.hora}.`;
  return null;
}
