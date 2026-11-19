import type { ReactNode } from 'react';

interface Props {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
}

export function PageHeader({ titulo, descripcion, acciones }: Props) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-header__title" tabIndex={-1} data-page-title>
          {titulo}
        </h1>
        {descripcion && <p className="page-header__desc">{descripcion}</p>}
      </div>
      {acciones && <div className="page-header__actions">{acciones}</div>}
    </div>
  );
}
