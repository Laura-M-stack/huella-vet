export type Especie = 'perro' | 'gato' | 'conejo' | 'ave';
export type Sexo = 'macho' | 'hembra';
export type EstadoTurno = 'confirmado' | 'en_sala' | 'atendido' | 'cancelado';

export interface Tutor {
  id: string;
  nombre: string;
  telefono: string;
}

export interface Paciente {
  id: string;
  nombre: string;
  especie: Especie;
  raza: string;
  sexo: Sexo;
  nacimiento: string;
  pesoKg: number;
  tutorId: string;
  internado: boolean;
}

export interface Profesional {
  id: string;
  nombre: string;
  especialidad: string;
}

export interface Consulta {
  id: string;
  pacienteId: string;
  fecha: string;
  motivo: string;
  diagnostico: string;
  profesionalId: string;
  importe: number;
}

export interface Vacunacion {
  id: string;
  pacienteId: string;
  vacunaId: string;
  fecha: string;
}

export interface Turno {
  id: string;
  pacienteId: string;
  profesionalId: string;
  fecha: string;
  hora: string;
  duracion: number;
  motivo: string;
  estado: EstadoTurno;
}

export type CategoriaInsumo = 'Medicamentos' | 'Vacunas' | 'Descartables' | 'Alimento' | 'Higiene';

export interface Insumo {
  id: string;
  nombre: string;
  categoria: CategoriaInsumo;
  stock: number;
  minimo: number;
  unidad: string;
  vencimiento: string | null;
}

export interface AppData {
  version: 1;
  generadoEl: string;
  tutores: Tutor[];
  pacientes: Paciente[];
  profesionales: Profesional[];
  consultas: Consulta[];
  vacunaciones: Vacunacion[];
  turnos: Turno[];
  insumos: Insumo[];
  /** Clave "pacienteId:vacunaId" -> fecha en que se aviso al tutor. */
  avisos: Record<string, string>;
}
