import { useMemo, useState } from 'react';
import { Badge } from '../components/Badge.tsx';
import { Dialog } from '../components/Dialog.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { EstadoVacunaBadge } from '../components/Estados.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { formatFull, formatShort } from '../lib/dates.ts';
import { plural } from '../lib/text.ts';
import { mensajeAviso, vacunasPendientes } from '../lib/vaccines.ts';
import type { EstadoVacuna, FilaVacuna } from '../lib/vaccines.ts';
import { rutas } from '../router.ts';
import { useApp } from '../state/store.tsx';

type Filtro = 'todas' | Exclude<EstadoVacuna, 'vigente'>;

const FILTROS: Array<[Filtro, string]> = [
  ['todas', 'Todas'],
  ['vencida', 'Vencidas'],
  ['por_vencer', 'Por vencer'],
  ['sin_registro', 'Sin registro'],
];

function AvisoDialog({ fila, tutor, onCerrar }: { fila: FilaVacuna | null; tutor: string; onCerrar: () => void }) {
  const { dispatch, hoy, avisar } = useApp();
  if (!fila) return <Dialog open={false} onClose={onCerrar} title="Avisar al tutor"><span /></Dialog>;
  const texto = mensajeAviso(fila, tutor);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      avisar('Mensaje copiado.');
    } catch {
      avisar('No se pudo copiar. Seleccioná el texto y copialo a mano.');
    }
  };

  return (
    <Dialog open onClose={onCerrar} title={`Avisar a ${tutor}`}>
      <p className="muted">Mensaje sugerido para {fila.paciente.nombre}:</p>
      <blockquote className="message">{texto}</blockquote>
      <p className="muted">En una versión real se enviaría por WhatsApp o mail. Acá solo se registra el aviso.</p>
      <div className="form__actions">
        <button type="button" className="btn btn--ghost" onClick={copiar}>Copiar mensaje</button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            dispatch({ type: 'vacuna/avisar', pacienteId: fila.paciente.id, vacunaId: fila.vacuna.id, fecha: hoy });
            avisar(`Aviso registrado para ${tutor}.`);
            onCerrar();
          }}
        >
          Marcar como avisado
        </button>
      </div>
    </Dialog>
  );
}

export function Vacunas() {
  const { data, hoy, dispatch, avisar } = useApp();
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [aviso, setAviso] = useState<FilaVacuna | null>(null);

  const todas = useMemo(() => vacunasPendientes(data.pacientes, data.vacunaciones, hoy), [data.pacientes, data.vacunaciones, hoy]);
  const filas = todas.filter((f) => filtro === 'todas' || f.estado === filtro);
  const cuenta = (f: Filtro) => (f === 'todas' ? todas.length : todas.filter((x) => x.estado === f).length);
  const tutorDe = (f: FilaVacuna) => data.tutores.find((t) => t.id === f.paciente.tutorId)?.nombre ?? 'el tutor';

  return (
    <>
      <PageHeader titulo="Vacunas" descripcion="Refuerzos vencidos, próximos a vencer y mascotas sin vacunas registradas." />

      <div className="chips" role="group" aria-label="Filtrar por estado">
        {FILTROS.map(([valor, etiqueta]) => (
          <button key={valor} type="button" className="chip" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}>
            {etiqueta} <span className="chip__count">{cuenta(valor)}</span>
          </button>
        ))}
      </div>

      <p className="sr-only" role="status" aria-live="polite">{plural(filas.length, 'resultado', 'resultados')}</p>

      {filas.length === 0 ? (
        <EmptyState titulo="Nada para revisar acá">No hay vacunas en este estado.</EmptyState>
      ) : (
        <div className="card card--flush">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Paciente</th>
                <th scope="col">Vacuna</th>
                <th scope="col">Última aplicación</th>
                <th scope="col">Vence</th>
                <th scope="col">Estado</th>
                <th scope="col"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const avisado = data.avisos[f.key];
                return (
                  <tr key={f.key}>
                    <td data-label="Paciente">
                      <a href={rutas.paciente(f.paciente.id)} className="strong-link">{f.paciente.nombre}</a>
                      <span className="muted block">{tutorDe(f)}</span>
                    </td>
                    <td data-label="Vacuna">{f.vacuna.nombre}</td>
                    <td data-label="Última aplicación">{f.aplicada ? formatFull(f.aplicada) : 'Sin registro'}</td>
                    <td data-label="Vence">{f.vence ? formatFull(f.vence) : '—'}</td>
                    <td data-label="Estado">
                      <EstadoVacunaBadge estado={f.estado} />
                      {avisado && <span className="block"><Badge tono="info">Avisado el {formatShort(avisado)}</Badge></span>}
                    </td>
                    <td data-label="Acciones">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          aria-label={`Avisar al tutor de ${f.paciente.nombre}: ${f.vacuna.nombre}`}
                          onClick={() => setAviso(f)}
                        >
                          {avisado ? 'Avisar de nuevo' : 'Avisar al tutor'}
                        </button>
                        <button
                          type="button"
                          className="btn btn--soft btn--sm"
                          aria-label={`Registrar aplicación de ${f.vacuna.nombre} a ${f.paciente.nombre}`}
                          onClick={() => {
                            dispatch({ type: 'vacuna/aplicar', pacienteId: f.paciente.id, vacunaId: f.vacuna.id, fecha: hoy });
                            avisar(`${f.vacuna.nombre} registrada para ${f.paciente.nombre}.`);
                          }}
                        >
                          Registrar aplicación
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AvisoDialog key={aviso?.key ?? 'cerrado'} fila={aviso} tutor={aviso ? tutorDe(aviso) : ''} onCerrar={() => setAviso(null)} />
    </>
  );
}
