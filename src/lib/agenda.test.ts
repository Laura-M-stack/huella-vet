import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buscarConflicto,
  puedePasar,
  seSolapan,
  turnosActivos,
  turnosDelDia,
  validarTurno,
  HORARIOS,
} from './agenda.ts';
import type { Turno } from '../state/types.ts';

const HOY = '2026-11-19'; // jueves

function turno(parcial: Partial<Turno>): Turno {
  return {
    id: 't',
    pacienteId: 'pa1',
    profesionalId: 'pr1',
    fecha: HOY,
    hora: '10:00',
    duracion: 30,
    motivo: 'Control',
    estado: 'confirmado',
    ...parcial,
  };
}

test('los turnos que se tocan en el borde no se solapan', () => {
  const a = turno({ id: 'a', hora: '10:00', duracion: 30 });
  assert.equal(seSolapan(a, turno({ id: 'b', hora: '10:30' })), false);
  assert.equal(seSolapan(a, turno({ id: 'b', hora: '10:15' })), true);
  assert.equal(seSolapan(turno({ id: 'a', hora: '10:00', duracion: 60 }), turno({ id: 'b', hora: '10:30' })), true);
});

test('distinto profesional o distinto dia nunca chocan', () => {
  const a = turno({ id: 'a' });
  assert.equal(seSolapan(a, turno({ id: 'b', profesionalId: 'pr2' })), false);
  assert.equal(seSolapan(a, turno({ id: 'b', fecha: '2026-11-20' })), false);
});

test('un turno cancelado libera el horario', () => {
  const nuevo = turno({ id: 'n' });
  const cancelado = turno({ id: 'c', estado: 'cancelado' });
  assert.equal(buscarConflicto(nuevo, [cancelado]), undefined);
  const activo = turno({ id: 'c' });
  assert.equal(buscarConflicto(nuevo, [activo])?.id, 'c');
  assert.equal(buscarConflicto(activo, [activo]), undefined);
});

test('transiciones de estado permitidas', () => {
  assert.equal(puedePasar('confirmado', 'en_sala'), true);
  assert.equal(puedePasar('confirmado', 'atendido'), false);
  assert.equal(puedePasar('en_sala', 'atendido'), true);
  assert.equal(puedePasar('en_sala', 'cancelado'), false);
  assert.equal(puedePasar('atendido', 'confirmado'), false);
  assert.equal(puedePasar('cancelado', 'en_sala'), false);
});

test('validarTurno: casos de error y caso valido', () => {
  const existentes = [turno({ id: 'e', hora: '11:00' })];
  assert.equal(validarTurno(turno({ id: 'n', hora: '10:00' }), existentes, HOY), null);
  assert.match(validarTurno(turno({ fecha: '2026-11-18' }), [], HOY) ?? '', /pasadas/);
  assert.match(validarTurno(turno({ fecha: '2026-11-22' }), [], HOY) ?? '', /domingos/);
  assert.match(validarTurno(turno({ hora: '17:45', duracion: 30 }), [], HOY) ?? '', /terminar/);
  assert.match(validarTurno(turno({ hora: '08:30' }), [], HOY) ?? '', /terminar/);
  assert.match(validarTurno(turno({ motivo: ' a ' }), [], HOY) ?? '', /motivo/);
  assert.match(validarTurno(turno({ id: 'n', hora: '11:00' }), existentes, HOY) ?? '', /ya tiene un turno/);
  assert.match(validarTurno(turno({ pacienteId: '' }), [], HOY) ?? '', /paciente/);
});

test('el ultimo horario valido de 30 minutos termina justo al cierre', () => {
  assert.equal(HORARIOS[0], '09:00');
  assert.equal(HORARIOS[HORARIOS.length - 1], '17:30');
  assert.equal(validarTurno(turno({ hora: '17:30', duracion: 30 }), [], HOY), null);
  assert.ok(validarTurno(turno({ hora: '17:30', duracion: 45 }), [], HOY));
});

test('turnosDelDia ordena por hora y turnosActivos descarta cancelados', () => {
  const lista = [
    turno({ id: 'b', hora: '11:00' }),
    turno({ id: 'a', hora: '09:30' }),
    turno({ id: 'c', hora: '09:30', estado: 'cancelado' }),
    turno({ id: 'd', fecha: '2026-11-20' }),
  ];
  assert.deepEqual(turnosDelDia(lista, HOY).map((t) => t.id), ['a', 'c', 'b']);
  assert.equal(turnosActivos(lista).length, 3);
});
