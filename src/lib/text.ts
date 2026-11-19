/** Minusculas y sin acentos, para buscar sin que importen tildes ni mayusculas. */
export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Todas las palabras de la consulta tienen que aparecer en alguno de los campos. */
export function matchesQuery(query: string, ...fields: Array<string | undefined>): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalize(fields.filter(Boolean).join(' '));
  return words.every((w) => haystack.includes(w));
}

const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export const formatMoney = (value: number) => money.format(value);

/** "1 turno" / "3 turnos". */
export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
