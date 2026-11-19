import { normalize } from '../lib/text.ts';
import { puedePasar, turnosActivos, validarTurno } from '../lib/agenda.ts';
import { nuevoId } from '../lib/id.ts';
import { ajustarStock } from '../lib/stock.ts';
import { crearDatosDemo } from '../lib/seed.ts';
import { vacunasPara } from '../lib/vaccines.ts';
import type {
  AppData,
  CategoriaInsumo,
  Consulta,
  Especie,
  EstadoTurno,
  Paciente,
  Sexo,
  Turno,
} from './types.ts';

export type Accion =
  | { type: 'turno/crear'; turno: Omit<Turno, 'id' | 'estado'>; hoy: string }
  | { type: 'turno/estado'; id: string; estado: EstadoTurno }
  | {
      type: 'paciente/crear';
      hoy: string;
      paciente: {
        nombre: string;
        especie: Especie;
        raza: string;
        sexo: Sexo;
        nacimiento: string;
        pesoKg: number;
      };
      tutor: { nombre: string; telefono: string };
    }
  | { type: 'paciente/internacion'; id: string; internado: boolean }
  | { type: 'consulta/crear'; consulta: Omit<Consulta, 'id'> }
  | { type: 'vacuna/aplicar'; pacienteId: string; vacunaId: string; fecha: string }
  | { type: 'vacuna/avisar'; pacienteId: string; vacunaId: string; fecha: string }
  | { type: 'insumo/ajustar'; id: string; delta: number }
  | {
      type: 'insumo/crear';
      insumo: {
        nombre: string;
        categoria: CategoriaInsumo;
        stock: number;
        minimo: number;
        unidad: string;
        vencimiento: string | null;
      };
    }
  | { type: 'reiniciar'; hoy: string };

export function reducer(data: AppData, accion: Accion): AppData {
  switch (accion.type) {
    case 'turno/crear': {
      const turno: Turno = { ...accion.turno, id: nuevoId('tn'), estado: 'confirmado' };
      // Defensa extra: la interfaz ya valida, pero el reducer no deja pasar un choque de horarios.
      if (validarTurno(turno, turnosActivos(data.turnos), accion.hoy)) return data;
      return { ...data, turnos: [...data.turnos, turno] };
    }
    case 'turno/estado': {
      const actual = data.turnos.find((t) => t.id === accion.id);
      if (!actual || !puedePasar(actual.estado, accion.estado)) return data;
      return {
        ...data,
        turnos: data.turnos.map((t) => (t.id === accion.id ? { ...t, estado: accion.estado } : t)),
      };
    }
    case 'paciente/crear': {
      const nombreTutor = accion.tutor.nombre.trim();
      const telefono = accion.tutor.telefono.trim();
      // Si el tutor ya existe (mismo nombre y telefono) se reutiliza en vez de duplicarlo.
      const existente = data.tutores.find(
        (t) => normalize(t.nombre) === normalize(nombreTutor) && t.telefono.replace(/\D/g, '') === telefono.replace(/\D/g, ''),
      );
      const tutor = existente ?? { id: nuevoId('tu'), nombre: nombreTutor, telefono };
      const paciente: Paciente = {
        id: nuevoId('pa'),
        nombre: accion.paciente.nombre.trim(),
        especie: accion.paciente.especie,
        raza: accion.paciente.raza.trim(),
        sexo: accion.paciente.sexo,
        nacimiento: accion.paciente.nacimiento,
        pesoKg: accion.paciente.pesoKg,
        tutorId: tutor.id,
        internado: false,
      };
      return {
        ...data,
        tutores: existente ? data.tutores : [...data.tutores, tutor],
        pacientes: [...data.pacientes, paciente],
      };
    }
    case 'paciente/internacion':
      return {
        ...data,
        pacientes: data.pacientes.map((p) => (p.id === accion.id ? { ...p, internado: accion.internado } : p)),
      };
    case 'consulta/crear':
      return { ...data, consultas: [...data.consultas, { ...accion.consulta, id: nuevoId('co') }] };
    case 'vacuna/aplicar': {
      const paciente = data.pacientes.find((p) => p.id === accion.pacienteId);
      if (!paciente || !vacunasPara(paciente.especie).some((v) => v.id === accion.vacunaId)) return data;
      // Aplicar dos veces el mismo dia no suma nada.
      const repetida = data.vacunaciones.some(
        (v) => v.pacienteId === accion.pacienteId && v.vacunaId === accion.vacunaId && v.fecha === accion.fecha,
      );
      if (repetida) return data;
      const key = `${accion.pacienteId}:${accion.vacunaId}`;
      const { [key]: _quitado, ...avisos } = data.avisos;
      return {
        ...data,
        vacunaciones: [
          ...data.vacunaciones,
          { id: nuevoId('va'), pacienteId: accion.pacienteId, vacunaId: accion.vacunaId, fecha: accion.fecha },
        ],
        avisos,
      };
    }
    case 'vacuna/avisar':
      return { ...data, avisos: { ...data.avisos, [`${accion.pacienteId}:${accion.vacunaId}`]: accion.fecha } };
    case 'insumo/ajustar':
      return {
        ...data,
        insumos: data.insumos.map((i) =>
          i.id === accion.id ? { ...i, stock: ajustarStock(i.stock, accion.delta) } : i,
        ),
      };
    case 'insumo/crear':
      return { ...data, insumos: [...data.insumos, { ...accion.insumo, id: nuevoId('in') }] };
    case 'reiniciar':
      return crearDatosDemo(accion.hoy);
  }
}
