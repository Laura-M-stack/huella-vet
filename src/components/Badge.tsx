import type { ReactNode } from 'react';

export type Tono = 'ok' | 'warn' | 'danger' | 'info' | 'neutral';

/** El estado siempre se dice con texto; el color solo lo refuerza. */
export function Badge({ tono, children }: { tono: Tono; children: ReactNode }) {
  return <span className={`badge badge--${tono}`}>{children}</span>;
}
