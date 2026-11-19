// Todas las fechas de la app son cadenas ISO locales "YYYY-MM-DD" y las horas "HH:MM".
// La aritmetica se hace en UTC sobre el calendario para no depender del horario de verano.

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidISO(value: string): boolean {
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

function toUTC(iso: string): Date {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`Fecha invalida: ${iso}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function fromUTC(date: Date): string {
  const y = String(date.getUTCFullYear()).padStart(4, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Fecha de hoy en hora local del navegador. */
export function todayISO(now: Date = new Date()): string {
  const y = String(now.getFullYear()).padStart(4, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const date = toUTC(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUTC(date);
}

/** Cantidad de dias desde `from` hasta `to` (negativa si `to` es anterior). */
export function diffDays(from: string, to: string): number {
  return Math.round((toUTC(to).getTime() - toUTC(from).getTime()) / 86_400_000);
}

/** 0 = domingo ... 6 = sabado. */
export function weekday(iso: string): number {
  return toUTC(iso).getUTCDay();
}

/** Lunes de la semana de `iso`. */
export function weekStart(iso: string): string {
  const dow = weekday(iso);
  return addDays(iso, dow === 0 ? -6 : 1 - dow);
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

const longFmt = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});
const shortFmt = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
const dayFmt = new Intl.DateTimeFormat('es-AR', { weekday: 'short', timeZone: 'UTC' });
const fullFmt = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

export const formatLong = (iso: string) => longFmt.format(toUTC(iso));
export const formatShort = (iso: string) => shortFmt.format(toUTC(iso));
export const formatFull = (iso: string) => fullFmt.format(toUTC(iso));
export const formatWeekday = (iso: string) => dayFmt.format(toUTC(iso)).replace('.', '');

export function timeToMinutes(time: string): number {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return NaN;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return NaN;
  return h * 60 + min;
}

export function minutesToTime(total: number): string {
  const h = String(Math.floor(total / 60)).padStart(2, '0');
  const m = String(total % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/** Edad legible a partir de la fecha de nacimiento: "3 años", "8 meses" o "20 dias". */
export function ageLabel(birth: string, today: string): string {
  const days = diffDays(birth, today);
  if (days < 0) return 'sin datos';
  if (days < 60) return `${days} ${days === 1 ? 'día' : 'días'}`;
  const [by, bm, bd] = birth.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  let months = (ty - by) * 12 + (tm - bm);
  if (td < bd) months -= 1;
  if (months < 24) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  const years = Math.floor(months / 12);
  return `${years} años`;
}
