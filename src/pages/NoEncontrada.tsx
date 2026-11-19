import { EmptyState } from '../components/EmptyState.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { rutas } from '../router.ts';

export function NoEncontrada() {
  return (
    <>
      <PageHeader titulo="Página no encontrada" />
      <EmptyState titulo="Esa pantalla no existe">
        <a href={rutas.panel} className="link-arrow">Ir al panel</a>
      </EmptyState>
    </>
  );
}
