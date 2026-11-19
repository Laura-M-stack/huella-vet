import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearDatosDemo } from './seed.ts';
import {
  estadoVacunasPaciente,
  estadoVencimiento,
  mensajeAviso,
  ultimaAplicacion,
  vacunasPara,
  vacunasPendientes,
} from './vaccines.ts';

const HOY = '2026-11-19';

test('estado por fecha de vencimiento: vencida, por vencer (30 dias) y vigente', () => {
  assert.equal(estadoVencimiento('2026-11-18', HOY), 'vencida');
  assert.equal(estadoVencimiento('2026-11-19', HOY), 'por_vencer');
  assert.equal(estadoVencimiento('2026-12-19', HOY), 'por_vencer');
  assert.equal(estadoVencimiento('2026-12-20', HOY), 'vigente');
});

test('cada especie recibe solo sus vacunas', () => {
  assert.deepEqual(vacunasPara('perro').map((v) => v.id), ['quintuple', 'rabia']);
  assert.deepEqual(vacunasPara('gato').map((v) => v.id), ['rabia', 'triple-felina']);
  assert.deepEqual(vacunasPara('ave'), []);
});

test('ultimaAplicacion toma la mas reciente aunque no este ordenada', () => {
  const lista = [
    { id: '1', pacienteId: 'a', vacunaId: 'rabia', fecha: '2025-01-01' },
    { id: '2', pacienteId: 'a', vacunaId: 'rabia', fecha: '2026-02-01' },
    { id: '3', pacienteId: 'a', vacunaId: 'rabia', fecha: '2024-05-01' },
    { id: '4', pacienteId: 'b', vacunaId: 'rabia', fecha: '2026-10-01' },
  ];
  assert.equal(ultimaAplicacion('a', 'rabia', lista)?.fecha, '2026-02-01');
  assert.equal(ultimaAplicacion('c', 'rabia', lista), undefined);
});

test('un cachorro muy chico sin vacunas todavia no figura como "sin registro"', () => {
  const datos = crearDatosDemo(HOY);
  const cachorro = { ...datos.pacientes[13], nacimiento: '2026-11-01' };
  const filas = estadoVacunasPaciente(cachorro, [], HOY);
  assert.ok(filas.every((f) => f.estado === 'vigente'));
  const adulto = { ...datos.pacientes[13], nacimiento: '2025-01-01' };
  assert.ok(estadoVacunasPaciente(adulto, [], HOY).every((f) => f.estado === 'sin_registro'));
});

test('pendientes: orden vencidas, por vencer, sin registro y nunca incluye vigentes', () => {
  const datos = crearDatosDemo(HOY);
  const pendientes = vacunasPendientes(datos.pacientes, datos.vacunaciones, HOY);
  assert.ok(pendientes.length > 0);
  assert.ok(pendientes.every((f) => f.estado !== 'vigente'));
  const orden = { vencida: 0, por_vencer: 1, sin_registro: 2, vigente: 3 };
  for (let i = 1; i < pendientes.length; i++) {
    assert.ok(orden[pendientes[i - 1].estado] <= orden[pendientes[i].estado]);
  }
  // Los datos de ejemplo cubren los tres estados para que la demo se vea completa.
  const estados = new Set(pendientes.map((f) => f.estado));
  assert.ok(estados.has('vencida') && estados.has('por_vencer') && estados.has('sin_registro'));
});

test('el mensaje de aviso menciona mascota, vacuna y usa solo el primer nombre del tutor', () => {
  const datos = crearDatosDemo(HOY);
  const fila = vacunasPendientes(datos.pacientes, datos.vacunaciones, HOY)[0];
  const msg = mensajeAviso(fila, 'Marcela Ibarra');
  assert.ok(msg.includes('Marcela'));
  assert.ok(!msg.includes('Ibarra'));
  assert.ok(msg.includes(fila.paciente.nombre));
  assert.ok(msg.includes(fila.vacuna.nombre));
});
