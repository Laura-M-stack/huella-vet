import { addDays, weekday } from './dates.ts';
import type {
  AppData,
  Consulta,
  Especie,
  Insumo,
  Paciente,
  Profesional,
  Sexo,
  Turno,
  Tutor,
  Vacunacion,
} from '../state/types.ts';
import type { CategoriaInsumo, EstadoTurno } from '../state/types.ts';

/** Generador pseudoaleatorio con semilla: la misma semilla da siempre los mismos datos. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TUTORES: Array<[string, string]> = [
  ['Marcela Ibarra', '11 5555-0101'],
  ['Julián Ferreyra', '11 5555-0102'],
  ['Lucía Domínguez', '11 5555-0103'],
  ['Sergio Benítez', '11 5555-0104'],
  ['Carolina Paz', '11 5555-0105'],
  ['Matías Giménez', '11 5555-0106'],
  ['Florencia Ortiz', '11 5555-0107'],
  ['Ricardo Sosa', '11 5555-0108'],
  ['Valeria Acosta', '11 5555-0109'],
  ['Nicolás Herrera', '11 5555-0110'],
];

const PROFESIONALES: Array<[string, string]> = [
  ['Dra. Camila Rey', 'Clínica general'],
  ['Dr. Tomás Aguirre', 'Cirugía'],
  ['Dra. Inés Sandoval', 'Medicina felina'],
];

type FilaPaciente = [string, Especie, string, Sexo, number, number, number, boolean];
// nombre, especie, raza, sexo, edad en dias, peso (kg), indice de tutor, internado
const PACIENTES: FilaPaciente[] = [
  ['Bruno', 'perro', 'Labrador', 'macho', 1500, 31.5, 0, false],
  ['Luna', 'gato', 'Siamés', 'hembra', 1100, 4.1, 1, false],
  ['Toby', 'perro', 'Caniche', 'macho', 3300, 6.8, 2, false],
  ['Mía', 'gato', 'Común europeo', 'hembra', 400, 3.6, 3, false],
  ['Simón', 'perro', 'Mestizo', 'macho', 760, 18.2, 4, false],
  ['Canela', 'perro', 'Golden Retriever', 'hembra', 2200, 28, 5, false],
  ['Oliver', 'gato', 'Persa', 'macho', 1850, 5.2, 6, true],
  ['Pelusa', 'conejo', 'Cabeza de león', 'hembra', 730, 1.4, 7, false],
  ['Kira', 'perro', 'Border Collie', 'hembra', 1100, 17, 8, false],
  ['Fito', 'ave', 'Cacatúa ninfa', 'macho', 1460, 0.09, 9, false],
  ['Zeus', 'perro', 'Ovejero Alemán', 'macho', 2550, 36, 0, false],
  ['Nala', 'gato', 'Bengalí', 'hembra', 730, 4.4, 1, false],
  ['Tango', 'perro', 'Beagle', 'macho', 1830, 12.6, 2, false],
  ['Rocco', 'perro', 'Bulldog Francés', 'macho', 120, 6.1, 4, false],
];

// indice de paciente, vacuna, dias desde la ultima aplicacion
const VACUNACIONES: Array<[number, string, number]> = [
  [0, 'quintuple', 200], [0, 'rabia', 200],
  [1, 'triple-felina', 200], [1, 'rabia', 200],
  [2, 'quintuple', 380], [2, 'rabia', 340],
  [3, 'triple-felina', 345], [3, 'rabia', 345],
  [4, 'quintuple', 350],
  [5, 'quintuple', 120], [5, 'rabia', 120],
  [6, 'triple-felina', 100], [6, 'rabia', 100],
  [7, 'mixomatosis', 340],
  [8, 'quintuple', 370], [8, 'rabia', 90],
  [10, 'quintuple', 500], [10, 'rabia', 500],
  [11, 'triple-felina', 400],
  [12, 'quintuple', 60], [12, 'rabia', 60],
  [13, 'quintuple', 60], [13, 'rabia', 10],
];

type FilaInsumo = [string, CategoriaInsumo, number, number, string, number | null];
// nombre, categoria, stock, minimo, unidad, dias hasta el vencimiento
const INSUMOS: FilaInsumo[] = [
  ['Amoxicilina 250 mg', 'Medicamentos', 48, 20, 'comprimidos', 200],
  ['Meloxicam inyectable', 'Medicamentos', 6, 8, 'frascos', 120],
  ['Ivermectina 1%', 'Medicamentos', 15, 10, 'frascos', 45],
  ['Suero fisiológico 500 ml', 'Medicamentos', 30, 12, 'bolsas', -10],
  ['Vacuna quíntuple canina', 'Vacunas', 22, 10, 'dosis', 90],
  ['Vacuna antirrábica', 'Vacunas', 0, 10, 'dosis', 60],
  ['Vacuna triple felina', 'Vacunas', 14, 8, 'dosis', 75],
  ['Jeringas 3 ml', 'Descartables', 240, 100, 'unidades', null],
  ['Guantes de látex', 'Descartables', 35, 50, 'pares', null],
  ['Gasas estériles', 'Descartables', 120, 60, 'paquetes', 400],
  ['Alimento hipoalergénico', 'Alimento', 9, 6, 'bolsas', 180],
  ['Shampoo dermatológico', 'Higiene', 12, 5, 'frascos', 300],
];

const MOTIVOS = [
  'Control anual',
  'Vacunación',
  'Dermatitis',
  'Control post operatorio',
  'Vómitos',
  'Cojera',
  'Desparasitación',
  'Control de peso',
  'Limpieza dental',
  'Otitis',
];

const DIAGNOSTICOS = [
  'Sin hallazgos',
  'Alergia estacional',
  'Gastroenteritis leve',
  'Esguince leve',
  'Otitis externa',
  'Sarro grado 2',
  'Parásitos intestinales',
  'Sobrepeso',
];

const IMPORTES = [18000, 25000, 32000, 45000, 60000, 85000];

/** Si `fecha` cae domingo (la clinica cierra), pasa al lunes. */
function diaHabil(fecha: string): string {
  return weekday(fecha) === 0 ? addDays(fecha, 1) : fecha;
}

/**
 * Datos de ejemplo siempre relativos a `hoy`, asi el panel muestra turnos "de hoy"
 * y vencimientos cercanos sin importar cuando se abra la demo.
 */
export function crearDatosDemo(hoy: string): AppData {
  const azar = mulberry32(2026);
  const elegir = <T>(lista: T[]): T => lista[Math.floor(azar() * lista.length)];

  const tutores: Tutor[] = TUTORES.map(([nombre, telefono], i) => ({ id: `tu${i + 1}`, nombre, telefono }));
  const profesionales: Profesional[] = PROFESIONALES.map(([nombre, especialidad], i) => ({
    id: `pr${i + 1}`,
    nombre,
    especialidad,
  }));
  const pacientes: Paciente[] = PACIENTES.map(([nombre, especie, raza, sexo, dias, pesoKg, tutor, internado], i) => ({
    id: `pa${i + 1}`,
    nombre,
    especie,
    raza,
    sexo,
    nacimiento: addDays(hoy, -dias),
    pesoKg,
    tutorId: tutores[tutor].id,
    internado,
  }));

  const vacunaciones: Vacunacion[] = VACUNACIONES.map(([idx, vacunaId, atras], i) => ({
    id: `va${i + 1}`,
    pacienteId: pacientes[idx].id,
    vacunaId,
    fecha: addDays(hoy, -atras),
  }));

  const insumos: Insumo[] = INSUMOS.map(([nombre, categoria, stock, minimo, unidad, venc], i) => ({
    id: `in${i + 1}`,
    nombre,
    categoria,
    stock,
    minimo,
    unidad,
    vencimiento: venc === null ? null : addDays(hoy, venc),
  }));

  // Turnos: hoy, y los proximos dias habiles.
  const turnos: Turno[] = [];
  let nTurno = 0;
  const agregarTurno = (
    fecha: string,
    hora: string,
    pacienteIdx: number,
    profIdx: number,
    motivo: string,
    estado: EstadoTurno,
    duracion = 30,
  ) => {
    nTurno += 1;
    turnos.push({
      id: `tn${nTurno}`,
      pacienteId: pacientes[pacienteIdx].id,
      profesionalId: profesionales[profIdx].id,
      fecha,
      hora,
      duracion,
      motivo,
      estado,
    });
  };

  agregarTurno(hoy, '09:00', 0, 0, 'Control anual', 'atendido');
  agregarTurno(hoy, '09:30', 1, 2, 'Control de peso', 'atendido');
  agregarTurno(hoy, '10:00', 2, 1, 'Limpieza dental', 'atendido', 60);
  agregarTurno(hoy, '10:30', 3, 2, 'Vacunación', 'en_sala');
  agregarTurno(hoy, '11:00', 4, 0, 'Cojera', 'confirmado');
  agregarTurno(hoy, '11:30', 11, 2, 'Control de piel', 'confirmado');
  agregarTurno(hoy, '15:00', 8, 0, 'Refuerzo de vacuna', 'confirmado');
  agregarTurno(hoy, '16:00', 12, 1, 'Control post operatorio', 'cancelado');

  const manana = diaHabil(addDays(hoy, 1));
  agregarTurno(manana, '09:30', 5, 0, 'Control anual', 'confirmado');
  agregarTurno(manana, '10:00', 7, 2, 'Control general', 'confirmado');
  agregarTurno(manana, '11:30', 13, 0, 'Vacunación', 'confirmado');
  agregarTurno(manana, '16:30', 9, 0, 'Revisión de plumaje', 'confirmado');

  const pasado = diaHabil(addDays(hoy, 2));
  agregarTurno(pasado, '09:00', 10, 1, 'Cirugía programada', 'confirmado', 60);
  agregarTurno(pasado, '14:00', 6, 2, 'Control de internación', 'confirmado');

  const tercero = diaHabil(addDays(hoy, 3));
  agregarTurno(tercero, '10:30', 2, 0, 'Vacuna antirrábica', 'confirmado');

  // Consultas: historial de los ultimos 45 dias y las de hoy (turnos ya atendidos).
  const consultas: Consulta[] = [];
  let nConsulta = 0;
  const agregarConsulta = (fecha: string, pacienteIdx: number, profIdx: number, motivo: string, diag: string) => {
    nConsulta += 1;
    consultas.push({
      id: `co${nConsulta}`,
      pacienteId: pacientes[pacienteIdx].id,
      fecha,
      motivo,
      diagnostico: diag,
      profesionalId: profesionales[profIdx].id,
      importe: elegir(IMPORTES),
    });
  };

  for (let atras = 45; atras >= 1; atras--) {
    const fecha = addDays(hoy, -atras);
    if (weekday(fecha) === 0) continue;
    const cantidad = 2 + Math.floor(azar() * 3);
    for (let k = 0; k < cantidad; k++) {
      agregarConsulta(
        fecha,
        Math.floor(azar() * pacientes.length),
        Math.floor(azar() * profesionales.length),
        elegir(MOTIVOS),
        elegir(DIAGNOSTICOS),
      );
    }
  }
  for (const t of turnos) {
    if (t.fecha === hoy && t.estado === 'atendido') {
      const idx = pacientes.findIndex((p) => p.id === t.pacienteId);
      const prof = profesionales.findIndex((p) => p.id === t.profesionalId);
      agregarConsulta(hoy, idx, prof, t.motivo, elegir(DIAGNOSTICOS));
    }
  }

  return {
    version: 1,
    generadoEl: hoy,
    tutores,
    pacientes,
    profesionales,
    consultas,
    vacunaciones,
    turnos,
    insumos,
    avisos: {},
  };
}
