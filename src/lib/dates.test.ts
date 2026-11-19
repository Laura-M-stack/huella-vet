import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  ageLabel,
  diffDays,
  isValidISO,
  minutesToTime,
  monthOf,
  previousMonth,
  timeToMinutes,
  weekStart,
  weekday,
} from './dates.ts';

test('addDays cruza meses, años y bisiestos', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('diffDays es simetrica y no depende del horario de verano', () => {
  assert.equal(diffDays('2026-03-01', '2026-03-31'), 30);
  assert.equal(diffDays('2026-03-31', '2026-03-01'), -30);
  assert.equal(diffDays('2026-10-24', '2026-10-26'), 2);
});

test('isValidISO rechaza fechas imposibles', () => {
  assert.equal(isValidISO('2026-02-30'), false);
  assert.equal(isValidISO('2026-13-01'), false);
  assert.equal(isValidISO('26-01-01'), false);
  assert.equal(isValidISO('2028-02-29'), true);
});

test('weekStart devuelve el lunes, incluso desde domingo', () => {
  assert.equal(weekday('2026-11-19'), 4);
  assert.equal(weekStart('2026-11-19'), '2026-11-16');
  assert.equal(weekStart('2026-11-22'), '2026-11-16');
  assert.equal(weekStart('2026-11-16'), '2026-11-16');
});

test('mes anterior cruza el año', () => {
  assert.equal(monthOf('2026-11-19'), '2026-11');
  assert.equal(previousMonth('2026-01'), '2025-12');
  assert.equal(previousMonth('2026-11'), '2026-10');
});

test('horas: conversion y validacion', () => {
  assert.equal(timeToMinutes('09:30'), 570);
  assert.equal(minutesToTime(570), '09:30');
  assert.ok(Number.isNaN(timeToMinutes('25:00')));
  assert.ok(Number.isNaN(timeToMinutes('9:30')));
});

test('ageLabel cubre dias, meses y años', () => {
  assert.equal(ageLabel('2026-11-10', '2026-11-19'), '9 días');
  assert.equal(ageLabel('2026-09-19', '2026-11-19'), '2 meses');
  assert.equal(ageLabel('2025-12-20', '2026-11-19'), '10 meses');
  assert.equal(ageLabel('2021-11-20', '2026-11-19'), '4 años');
  assert.equal(ageLabel('2027-01-01', '2026-11-19'), 'sin datos');
});
