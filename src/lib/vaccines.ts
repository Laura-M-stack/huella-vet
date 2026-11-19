import { addDays, diffDays, formatFull } from './dates.ts';
import type { Especie, Paciente, Vacunacion } from '../state/types.ts';

export interface VacunaTipo {
  id: string;
  nombre: string;
  especies: Especie[];
  /** Cada cuantos dias se refuerza. */
  intervaloDias: number;
}

export const VACUNAS: VacunaTipo[] = [
  { id: 'quintuple', nombre: 'Quíntuple canina', especies: ['perro'], intervaloDias: 365 },
  { id: 'rabia', nombre: 'Antirrábica', especies: ['perro', 'gato'], intervaloDias: 365 },
  { id: 'triple-felina', nombre: 'Triple felina', especies: ['gato'], intervaloDias: 365 },
  { id: 'mixomatosis', nombre: 'Mixomatosis y VHD', especies: ['conejo'], intervaloDias: 365 },
];

/** Dias de anticipacion con los que una vacuna pasa a "por vencer". */
export const AVISO_DIAS = 30;
/** Un paciente muy chico todavia no entra en "sin registro". */
const EDAD_MIN_SIN_REGISTRO = 60;

export type EstadoVacuna = 'vigente' | 'por_vencer' | 'vencida' | 'sin_registro';

export function vacunaPorId(id: string): VacunaTipo | undefined {
  return VACUNAS.find((v) => v.id === id);
}

export function vacunasPara(especie: Especie): VacunaTipo[] {
  return VACUNAS.filter((v) => v.especies.includes(especie));
}

export function proximoVencimiento(aplicada: string, vacuna: VacunaTipo): string {
  return addDays(aplicada, vacuna.intervaloDias);
}

export function estadoVencimiento(vence: string, hoy: string): Exclude<EstadoVacuna, 'sin_registro'> {
  const dias = diffDays(hoy, vence);
  if (dias < 0) return 'vencida';
  if (dias <= AVISO_DIAS) return 'por_vencer';
  return 'vigente';
}

/** Ultima aplicacion de cada vacuna de un paciente (la de fecha mas reciente). */
export function ultimaAplicacion(
  pacienteId: string,
  vacunaId: string,
  vacunaciones: Vacunacion[],
): Vacunacion | undefined {
  let ultima: Vacunacion | undefined;
  for (const v of vacunaciones) {
    if (v.pacienteId !== pacienteId || v.vacunaId !== vacunaId) continue;
    if (!ultima || v.fecha > ultima.fecha) ultima = v;
  }
  return ultima;
}

export interface FilaVacuna {
  key: string;
  paciente: Paciente;
  vacuna: VacunaTipo;
  aplicada: string | null;
  vence: string | null;
  estado: EstadoVacuna;
}

/** Estado de todas las vacunas que le corresponden a un paciente. */
export function estadoVacunasPaciente(
  paciente: Paciente,
  vacunaciones: Vacunacion[],
  hoy: string,
): FilaVacuna[] {
  return vacunasPara(paciente.especie).map((vacuna) => {
    const ultima = ultimaAplicacion(paciente.id, vacuna.id, vacunaciones);
    const key = `${paciente.id}:${vacuna.id}`;
    if (!ultima) {
      const esJoven = diffDays(paciente.nacimiento, hoy) < EDAD_MIN_SIN_REGISTRO;
      return {
        key,
        paciente,
        vacuna,
        aplicada: null,
        vence: null,
        estado: esJoven ? 'vigente' : 'sin_registro',
      };
    }
    const vence = proximoVencimiento(ultima.fecha, vacuna);
    return { key, paciente, vacuna, aplicada: ultima.fecha, vence, estado: estadoVencimiento(vence, hoy) };
  });
}

const ORDEN: Record<EstadoVacuna, number> = { vencida: 0, por_vencer: 1, sin_registro: 2, vigente: 3 };

/** Vacunas que requieren accion: vencidas, por vencer o sin registro. Las mas urgentes primero. */
export function vacunasPendientes(
  pacientes: Paciente[],
  vacunaciones: Vacunacion[],
  hoy: string,
): FilaVacuna[] {
  const filas = pacientes.flatMap((p) => estadoVacunasPaciente(p, vacunaciones, hoy));
  return filas
    .filter((f) => f.estado !== 'vigente')
    .sort((a, b) => {
      if (ORDEN[a.estado] !== ORDEN[b.estado]) return ORDEN[a.estado] - ORDEN[b.estado];
      if (a.vence && b.vence && a.vence !== b.vence) return a.vence < b.vence ? -1 : 1;
      return a.paciente.nombre.localeCompare(b.paciente.nombre, 'es');
    });
}

/** Texto sugerido para avisarle al tutor. */
export function mensajeAviso(fila: FilaVacuna, tutorNombre: string): string {
  const mascota = fila.paciente.nombre;
  const nombre = tutorNombre.split(' ')[0];
  if (fila.estado === 'sin_registro') {
    return `Hola ${nombre}, desde Huella Vet: no tenemos registrada la vacuna ${fila.vacuna.nombre} de ${mascota}. ¿Te reservamos un turno para ponerla?`;
  }
  const cuando = fila.vence ? formatFull(fila.vence) : '';
  if (fila.estado === 'vencida') {
    return `Hola ${nombre}, desde Huella Vet: la vacuna ${fila.vacuna.nombre} de ${mascota} venció el ${cuando}. ¿Te reservamos un turno para el refuerzo?`;
  }
  return `Hola ${nombre}, desde Huella Vet: la vacuna ${fila.vacuna.nombre} de ${mascota} vence el ${cuando}. ¿Querés que te reservemos un turno?`;
}
