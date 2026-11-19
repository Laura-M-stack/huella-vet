import { ESTADO_LABEL, transiciones } from '../lib/agenda.ts';
import { useApp } from '../state/store.tsx';
import type { Turno } from '../state/types.ts';

const ETIQUETA: Record<string, string> = {
  en_sala: 'Llegó',
  atendido: 'Atendido',
  cancelado: 'Cancelar',
};

export function TurnoAcciones({ turno, mascota }: { turno: Turno; mascota: string }) {
  const { dispatch, avisar } = useApp();
  const opciones = transiciones(turno.estado);
  if (opciones.length === 0) return <span className="muted">—</span>;
  return (
    <div className="row-actions">
      {opciones.map((estado) => (
        <button
          key={estado}
          type="button"
          className={estado === 'cancelado' ? 'btn btn--ghost btn--sm' : 'btn btn--soft btn--sm'}
          aria-label={`${ETIQUETA[estado]}: turno de ${mascota} a las ${turno.hora}`}
          onClick={() => {
            dispatch({ type: 'turno/estado', id: turno.id, estado });
            avisar(`Turno de ${mascota}: ${ESTADO_LABEL[estado].toLowerCase()}.`);
          }}
        >
          {ETIQUETA[estado]}
        </button>
      ))}
    </div>
  );
}
