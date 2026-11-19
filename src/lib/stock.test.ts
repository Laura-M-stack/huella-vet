import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ajustarStock, estadoInsumo, nivelStock, requiereAtencion, validarCantidad } from './stock.ts';
import type { Insumo } from '../state/types.ts';

const HOY = '2026-11-19';
const base: Insumo = {
  id: 'x',
  nombre: 'Prueba',
  categoria: 'Medicamentos',
  stock: 50,
  minimo: 10,
  unidad: 'frascos',
  vencimiento: null,
};

test('estados de insumo y su prioridad', () => {
  assert.equal(estadoInsumo(base, HOY), 'ok');
  assert.equal(estadoInsumo({ ...base, stock: 10 }, HOY), 'bajo');
  assert.equal(estadoInsumo({ ...base, stock: 0 }, HOY), 'agotado');
  assert.equal(estadoInsumo({ ...base, vencimiento: '2026-12-31' }, HOY), 'por_vencer');
  assert.equal(estadoInsumo({ ...base, vencimiento: '2027-06-01' }, HOY), 'ok');
  // Vencido gana sobre agotado, y agotado sobre bajo.
  assert.equal(estadoInsumo({ ...base, stock: 0, vencimiento: '2026-11-01' }, HOY), 'vencido');
  assert.equal(estadoInsumo({ ...base, stock: 0, minimo: 10 }, HOY), 'agotado');
});

test('vence hoy todavia no esta vencido', () => {
  assert.equal(estadoInsumo({ ...base, vencimiento: HOY }, HOY), 'por_vencer');
  assert.equal(estadoInsumo({ ...base, vencimiento: '2026-11-18' }, HOY), 'vencido');
});

test('el stock nunca queda negativo', () => {
  assert.equal(ajustarStock(5, -10), 0);
  assert.equal(ajustarStock(5, 3), 8);
  assert.equal(ajustarStock(0, 0), 0);
});

test('nivel de stock se mantiene entre 0 y 1, incluso con minimo cero', () => {
  assert.equal(nivelStock({ ...base, stock: 0 }), 0);
  assert.equal(nivelStock({ ...base, stock: 1000 }), 1);
  assert.equal(nivelStock({ ...base, stock: 10, minimo: 0 }), 1);
  assert.equal(nivelStock({ ...base, stock: 10, minimo: 10 }), 0.5);
});

test('validarCantidad rechaza ceros, negativos y decimales', () => {
  assert.equal(validarCantidad(3), null);
  assert.ok(validarCantidad(0));
  assert.ok(validarCantidad(-2));
  assert.ok(validarCantidad(1.5));
  assert.ok(validarCantidad(Number.NaN));
  assert.ok(validarCantidad(99999));
  assert.equal(requiereAtencion(base, HOY), false);
});
