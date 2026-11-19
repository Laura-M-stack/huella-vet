import { EmptyState } from '../components/EmptyState.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { rutas } from '../router.ts';

export function NoEncontrada() {
  return (
    <>
      <PageHeader titulo="No encontramos esa página" />
      <EmptyState titulo="Esta dirección no existe o cambió de lugar">
        <p className="muted">Podés volver al panel o a la página de presentación.</p>
        <div className="row-actions">
          <a href={rutas.panel} className="btn btn--primary">Ir al panel</a>
          <a href={rutas.landing} className="btn btn--ghost">Ir al inicio</a>
        </div>
      </EmptyState>
    </>
  );
}
