import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHash, rutas } from './router.ts';

test('rutas conocidas', () => {
  assert.deepEqual(parseHash(''), { name: 'landing' });
  assert.deepEqual(parseHash('#/'), { name: 'landing' });
  assert.deepEqual(parseHash('#/app'), { name: 'panel' });
  assert.deepEqual(parseHash('#/app/'), { name: 'panel' });
  assert.deepEqual(parseHash('#/app/agenda'), { name: 'agenda' });
  assert.deepEqual(parseHash('#/app/vacunas'), { name: 'vacunas' });
  assert.deepEqual(parseHash('#/app/insumos'), { name: 'insumos' });
  assert.deepEqual(parseHash('#/app/pacientes'), { name: 'pacientes' });
  assert.deepEqual(parseHash('#/app/pacientes/pa3'), { name: 'paciente', id: 'pa3' });
});

test('rutas inexistentes caen en "no encontrada"', () => {
  assert.deepEqual(parseHash('#/otra'), { name: 'noEncontrada' });
  assert.deepEqual(parseHash('#/app/nada'), { name: 'noEncontrada' });
  assert.deepEqual(parseHash('#/app/agenda/extra'), { name: 'noEncontrada' });
  assert.deepEqual(parseHash('#/app/pacientes/a/b'), { name: 'noEncontrada' });
});

test('los ids con caracteres raros ida y vuelta', () => {
  const id = 'tn-a/b c';
  assert.deepEqual(parseHash(rutas.paciente(id)), { name: 'paciente', id });
});
