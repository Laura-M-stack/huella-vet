let contador = 0;

/** Id unico para registros creados en el navegador. */
export function nuevoId(prefijo: string): string {
  contador += 1;
  const azar = Math.random().toString(36).slice(2, 8);
  return `${prefijo}-${Date.now().toString(36)}${contador}${azar}`;
}
