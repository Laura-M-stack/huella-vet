import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearDatosDemo } from '../lib/seed.ts';
import { calcularKpis, variacionPorcentual, ingresosMesAnteriorMismoPeriodo } from '../lib/kpis.ts';
import { buscarConflicto, turnosActivos } from '../lib/agenda.ts';
import { cargarDatos, esDatosValidos, guardarDatos } from '../lib/storage.ts';
import { validarConsulta, validarInsumo, validarPaciente } from '../lib/validate.ts';
import { addDays } from '../lib/dates.ts';
import { reducer } from './reducer.ts';

const HOY = '2026-11-19';

test('los datos de ejemplo son consistentes y no tienen turnos superpuestos', () => {
  const d = crearDatosDemo(HOY);
  const ids = new Set(d.pacientes.map((p) => p.id));
  assert.ok(d.turnos.every((t) => ids.has(t.pacienteId)));
  assert.ok(d.vacunaciones.every((v) => ids.has(v.pacienteId)));
  assert.ok(d.pacientes.every((p) => d.tutores.some((t) => t.id === p.tutorId)));
  const activos = turnosActivos(d.turnos);
  for (const t of activos) assert.equal(buscarConflicto(t, activos), undefined, `choque en ${t.id}`);
  assert.deepEqual(crearDatosDemo(HOY), d, 'misma fecha, mismos datos');
});

test('indicadores del panel salen de los datos', () => {
  const d = crearDatosDemo(HOY);
  const k = calcularKpis(d, HOY);
  assert.equal(k.turnosHoy, 7);
  assert.equal(k.enSala, 1);
  assert.equal(k.atendidosHoy, 3);
  assert.equal(k.internados, 1);
  assert.ok(k.vacunasARevisar >= k.vacunasVencidas && k.vacunasVencidas > 0);
  assert.ok(k.insumosEnAlerta >= 4);
  assert.equal(k.ultimosSieteDias.length, 7);
  assert.equal(k.ultimosSieteDias[6].fecha, HOY);
  assert.ok(k.ingresosMes > 0);
});

test('variacion porcentual: sin base devuelve null, y compara el mismo periodo', () => {
  assert.equal(variacionPorcentual(100, 0), null);
  assert.equal(variacionPorcentual(150, 100), 50);
  assert.equal(variacionPorcentual(50, 100), -50);
  const d = crearDatosDemo('2026-11-01');
  // El 1 de noviembre se compara contra el 1 de octubre, no contra todo octubre.
  const anterior = ingresosMesAnteriorMismoPeriodo(d, '2026-11-01');
  const octubreCompleto = d.consultas.filter((c) => c.fecha.startsWith('2026-10')).reduce((a, c) => a + c.importe, 0);
  assert.ok(anterior <= octubreCompleto);
});

test('turno/crear rechaza choques y fechas pasadas aunque la interfaz falle', () => {
  const d = crearDatosDemo(HOY);
  const existente = d.turnos.find((t) => t.fecha === HOY && t.estado === 'confirmado')!;
  const choque = reducer(d, {
    type: 'turno/crear',
    hoy: HOY,
    turno: { ...existente, fecha: existente.fecha },
  });
  assert.equal(choque.turnos.length, d.turnos.length);
  const pasado = reducer(d, { type: 'turno/crear', hoy: HOY, turno: { ...existente, fecha: '2026-11-10' } });
  assert.equal(pasado.turnos.length, d.turnos.length);
  const ok = reducer(d, {
    type: 'turno/crear',
    hoy: HOY,
    turno: { ...existente, fecha: '2026-11-24', hora: '13:00' },
  });
  assert.equal(ok.turnos.length, d.turnos.length + 1);
  assert.equal(ok.turnos[ok.turnos.length - 1].estado, 'confirmado');
});

test('turno/estado respeta las transiciones', () => {
  const d = crearDatosDemo(HOY);
  const confirmado = d.turnos.find((t) => t.estado === 'confirmado')!;
  const salto = reducer(d, { type: 'turno/estado', id: confirmado.id, estado: 'atendido' });
  assert.equal(salto.turnos.find((t) => t.id === confirmado.id)!.estado, 'confirmado');
  const sala = reducer(d, { type: 'turno/estado', id: confirmado.id, estado: 'en_sala' });
  assert.equal(sala.turnos.find((t) => t.id === confirmado.id)!.estado, 'en_sala');
  const inexistente = reducer(d, { type: 'turno/estado', id: 'nada', estado: 'en_sala' });
  assert.equal(inexistente, d);
});

test('paciente/crear reutiliza un tutor existente en vez de duplicarlo', () => {
  const d = crearDatosDemo(HOY);
  const tutor = d.tutores[0];
  const nuevo = reducer(d, {
    type: 'paciente/crear',
    hoy: HOY,
    paciente: { nombre: ' Chispa ', especie: 'gato', raza: 'Mestizo', sexo: 'hembra', nacimiento: '2025-05-05', pesoKg: 3.2 },
    tutor: { nombre: tutor.nombre.toUpperCase(), telefono: tutor.telefono.replace(/\D/g, '') },
  });
  assert.equal(nuevo.tutores.length, d.tutores.length);
  const creado = nuevo.pacientes[nuevo.pacientes.length - 1];
  assert.equal(creado.nombre, 'Chispa');
  assert.equal(creado.tutorId, tutor.id);
  const otro = reducer(d, {
    type: 'paciente/crear',
    hoy: HOY,
    paciente: { nombre: 'Max', especie: 'perro', raza: 'Mestizo', sexo: 'macho', nacimiento: '2024-01-01', pesoKg: 10 },
    tutor: { nombre: 'Persona Nueva', telefono: '11 4444-5555' },
  });
  assert.equal(otro.tutores.length, d.tutores.length + 1);
});

test('vacuna/aplicar suma una aplicacion, limpia el aviso y evita duplicados del mismo dia', () => {
  let d = crearDatosDemo(HOY);
  const p = d.pacientes[2]; // Toby, perro
  d = reducer(d, { type: 'vacuna/avisar', pacienteId: p.id, vacunaId: 'quintuple', fecha: HOY });
  assert.equal(d.avisos[`${p.id}:quintuple`], HOY);
  const antes = d.vacunaciones.length;
  d = reducer(d, { type: 'vacuna/aplicar', pacienteId: p.id, vacunaId: 'quintuple', fecha: HOY });
  assert.equal(d.vacunaciones.length, antes + 1);
  assert.equal(d.avisos[`${p.id}:quintuple`], undefined);
  const repetida = reducer(d, { type: 'vacuna/aplicar', pacienteId: p.id, vacunaId: 'quintuple', fecha: HOY });
  assert.equal(repetida.vacunaciones.length, d.vacunaciones.length);
  // Una vacuna que no corresponde a la especie se ignora (triple felina en un perro).
  const incorrecta = reducer(d, { type: 'vacuna/aplicar', pacienteId: p.id, vacunaId: 'triple-felina', fecha: HOY });
  assert.equal(incorrecta.vacunaciones.length, d.vacunaciones.length);
});

test('insumo/ajustar no deja el stock en negativo', () => {
  const d = crearDatosDemo(HOY);
  const insumo = d.insumos[1];
  const bajo = reducer(d, { type: 'insumo/ajustar', id: insumo.id, delta: -9999 });
  assert.equal(bajo.insumos.find((i) => i.id === insumo.id)!.stock, 0);
  const alto = reducer(d, { type: 'insumo/ajustar', id: insumo.id, delta: 4 });
  assert.equal(alto.insumos.find((i) => i.id === insumo.id)!.stock, insumo.stock + 4);
});

test('reiniciar vuelve a los datos de ejemplo', () => {
  let d = crearDatosDemo(HOY);
  d = reducer(d, { type: 'paciente/internacion', id: d.pacientes[0].id, internado: true });
  assert.notDeepEqual(d, crearDatosDemo(HOY));
  assert.deepEqual(reducer(d, { type: 'reiniciar', hoy: HOY }), crearDatosDemo(HOY));
});

function fakeStorage(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: () => value,
    setItem: (_k: string, v: string) => {
      value = v;
    },
    peek: () => value,
  };
}

test('el guardado recupera los datos del mismo dia y descarta los de otro dia', () => {
  const s = fakeStorage();
  const d = reducer(crearDatosDemo(HOY), { type: 'paciente/internacion', id: 'pa1', internado: true });
  guardarDatos(d, s);
  assert.deepEqual(cargarDatos(HOY, s), d);
  assert.deepEqual(cargarDatos('2026-11-20', s), crearDatosDemo('2026-11-20'));
});

test('datos corruptos, vacios o sin storage no rompen la carga', () => {
  assert.deepEqual(cargarDatos(HOY, fakeStorage('{no es json')), crearDatosDemo(HOY));
  assert.deepEqual(cargarDatos(HOY, fakeStorage('{"version":2}')), crearDatosDemo(HOY));
  assert.deepEqual(cargarDatos(HOY, fakeStorage('null')), crearDatosDemo(HOY));
  assert.deepEqual(cargarDatos(HOY, null), crearDatosDemo(HOY));
  const roto = { getItem: () => { throw new Error('bloqueado'); } };
  assert.deepEqual(cargarDatos(HOY, roto), crearDatosDemo(HOY));
  assert.doesNotThrow(() => guardarDatos(crearDatosDemo(HOY), { setItem: () => { throw new Error('cuota'); } }));
  assert.equal(esDatosValidos({ ...crearDatosDemo(HOY), turnos: 'x' }), false);
});

test('validaciones de formularios', () => {
  const ok = { nombre: 'Max', especie: 'perro' as const, raza: 'Mestizo', nacimiento: '2024-01-01', pesoKg: 10, tutorNombre: 'Ana Gómez', tutorTelefono: '11 4444-5555' };
  assert.equal(validarPaciente(ok, HOY), null);
  assert.match(validarPaciente({ ...ok, nombre: 'M' }, HOY) ?? '', /nombre/);
  assert.match(validarPaciente({ ...ok, nacimiento: '2027-01-01' }, HOY) ?? '', /futura/);
  assert.match(validarPaciente({ ...ok, nacimiento: '1900-01-01' }, HOY) ?? '', /antigua/);
  assert.match(validarPaciente({ ...ok, nacimiento: '' }, HOY) ?? '', /nacimiento/);
  assert.match(validarPaciente({ ...ok, pesoKg: 0 }, HOY) ?? '', /peso/);
  assert.match(validarPaciente({ ...ok, especie: 'gato', pesoKg: 40 }, HOY) ?? '', /peso/);
  assert.match(validarPaciente({ ...ok, pesoKg: Number.NaN }, HOY) ?? '', /peso/);
  assert.match(validarPaciente({ ...ok, tutorTelefono: '123' }, HOY) ?? '', /teléfono/);
  assert.equal(validarConsulta('Control', 'Sin hallazgos', 0), null);
  assert.ok(validarConsulta('Control', 'Sin hallazgos', -1));
  assert.ok(validarConsulta('', 'Sin hallazgos', 100));
  assert.equal(validarInsumo('Gasas', 5, 2, 'paquetes'), null);
  assert.ok(validarInsumo('Gasas', -1, 2, 'paquetes'));
  assert.ok(validarInsumo('Gasas', 1.5, 2, 'paquetes'));
  assert.ok(validarInsumo('G', 1, 2, 'paquetes'));
});

test('los datos de ejemplo funcionan cualquier dia del año (sin choques, con alertas y turnos)', () => {
  let fecha = '2026-01-01';
  for (let i = 0; i < 400; i++) {
    const d = crearDatosDemo(fecha);
    const activos = turnosActivos(d.turnos);
    for (const t of activos) assert.equal(buscarConflicto(t, activos), undefined, `${fecha}: choque en ${t.id}`);
    const k = calcularKpis(d, fecha);
    assert.ok(k.turnosHoy > 0 && k.vacunasARevisar > 0 && k.insumosEnAlerta > 0, fecha);
    fecha = addDays(fecha, 1);
  }
});
