import type { ReactNode } from 'react';

export function EmptyState({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty__title">{titulo}</p>
      {children && <div className="empty__body">{children}</div>}
    </div>
  );
}
