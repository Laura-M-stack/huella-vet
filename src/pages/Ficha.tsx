import { useState } from 'react';
import type { FormEvent } from 'react';
import { Badge } from '../components/Badge.tsx';
import { Dialog } from '../components/Dialog.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { EstadoTurnoBadge, EstadoVacunaBadge } from '../components/Estados.tsx';
import { Field } from '../components/Field.tsx';
import { Icon } from '../components/Icon.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { ageLabel, formatFull } from '../lib/dates.ts';
import { formatMoney } from '../lib/text.ts';
import { validarConsulta } from '../lib/validate.ts';
import { estadoVacunasPaciente } from '../lib/vaccines.ts';
import { rutas } from '../router.ts';
import { useApp } from '../state/store.tsx';
import { ESPECIE_LABEL } from './Pacientes.tsx';

function NuevaConsulta({ pacienteId, abierto, onCerrar }: { pacienteId: string; abierto: boolean; onCerrar: () => void }) {
  const { data, dispatch, hoy, avisar } = useApp();
  const [motivo, setMotivo] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [importe, setImporte] = useState('');
  const [profesionalId, setProfesionalId] = useState(data.profesionales[0]?.id ?? '');
  const [error, setError] = useState('');

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const monto = importe.trim() === '' ? 0 : Number(importe.replace(/\./g, '').replace(',', '.'));
    const msg = validarConsulta(motivo, diagnostico, monto);
    if (msg) {
      setError(msg);
      return;
    }
    dispatch({
      type: 'consulta/crear',
      consulta: { pacienteId, fecha: hoy, motivo: motivo.trim(), diagnostico: diagnostico.trim(), profesionalId, importe: monto },
    });
    avisar('Consulta registrada.');
    onCerrar();
  };

  return (
    <Dialog open={abierto} onClose={onCerrar} title="Registrar consulta">
      <form onSubmit={enviar} noValidate className="form">
        <div className="form__grid">
          <Field label="Motivo">
            <input className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Profesional">
            <select className="input" value={profesionalId} onChange={(e) => setProfesionalId(e.target.value)}>
              {data.profesionales.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </Field>
          <Field label="Diagnóstico">
            <input className="input" value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Importe (ARS)" hint="Si no corresponde cobro, dejalo vacío.">
            <input className="input" inputMode="numeric" value={importe} onChange={(e) => setImporte(e.target.value)} autoComplete="off" />
          </Field>
        </div>
        {error && <p className="form__error" role="alert">{error}</p>}
        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn btn--primary">Guardar consulta</button>
        </div>
      </form>
    </Dialog>
  );
}

export function Ficha({ id }: { id: string }) {
  const { data, hoy, dispatch, avisar } = useApp();
  const [consulta, setConsulta] = useState(false);
  const paciente = data.pacientes.find((p) => p.id === id);

  if (!paciente) {
    return (
      <>
        <PageHeader titulo="Paciente no encontrado" />
        <EmptyState titulo="Ese paciente no existe">
          <a href={rutas.pacientes} className="link-arrow">Volver a pacientes</a>
        </EmptyState>
      </>
    );
  }

  const tutor = data.tutores.find((t) => t.id === paciente.tutorId);
  const vacunas = estadoVacunasPaciente(paciente, data.vacunaciones, hoy);
  const consultas = data.consultas.filter((c) => c.pacienteId === paciente.id).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const turnos = data.turnos
    .filter((t) => t.pacienteId === paciente.id && t.fecha >= hoy && t.estado !== 'cancelado')
    .sort((a, b) => (a.fecha + a.hora < b.fecha + b.hora ? -1 : 1));

  const alternarInternacion = () => {
    dispatch({ type: 'paciente/internacion', id: paciente.id, internado: !paciente.internado });
    avisar(paciente.internado ? `${paciente.nombre} recibió el alta.` : `${paciente.nombre} quedó internado.`);
  };

  return (
    <>
      <a href={rutas.pacientes} className="back-link"><Icon name="back" size={16} /> Pacientes</a>
      <PageHeader
        titulo={paciente.nombre}
        descripcion={`${ESPECIE_LABEL[paciente.especie]} · ${paciente.raza} · ${paciente.sexo === 'macho' ? 'Macho' : 'Hembra'}`}
        acciones={
          <>
            <button type="button" className="btn btn--soft" onClick={alternarInternacion}>
              {paciente.internado ? 'Dar el alta' : 'Internar'}
            </button>
            <button type="button" className="btn btn--primary" onClick={() => setConsulta(true)}>
              <Icon name="plus" size={18} /> Registrar consulta
            </button>
          </>
        }
      />
      {paciente.internado && <p className="notice"><Badge tono="warn">Internado</Badge> Este paciente está internado actualmente.</p>}

      <div className="grid-ficha">
        <section className="card" aria-labelledby="h-datos">
          <h2 id="h-datos" className="card__title">Datos</h2>
          <dl className="dl">
            <div><dt>Edad</dt><dd>{ageLabel(paciente.nacimiento, hoy)} ({formatFull(paciente.nacimiento)})</dd></div>
            <div><dt>Peso</dt><dd>{paciente.pesoKg} kg</dd></div>
            <div><dt>Tutor</dt><dd>{tutor?.nombre ?? '—'}</dd></div>
            <div><dt>Teléfono</dt><dd>{tutor?.telefono ?? '—'}</dd></div>
          </dl>
        </section>

        <section className="card" aria-labelledby="h-turnos">
          <h2 id="h-turnos" className="card__title">Próximos turnos</h2>
          {turnos.length === 0 ? (
            <EmptyState titulo="Sin turnos próximos">
              <a href={rutas.agenda} className="link-arrow">Ir a la agenda</a>
            </EmptyState>
          ) : (
            <ul className="list">
              {turnos.map((t) => (
                <li key={t.id} className="list__item">
                  <span className="list__main">
                    <span className="strong">{formatFull(t.fecha)} · {t.hora}</span>
                    <span className="muted">{t.motivo}</span>
                  </span>
                  <EstadoTurnoBadge estado={t.estado} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card card--wide" aria-labelledby="h-vac">
          <h2 id="h-vac" className="card__title">Vacunas</h2>
          {vacunas.length === 0 ? (
            <EmptyState titulo="No hay vacunas definidas para esta especie" />
          ) : (
            <table className="table table--plain">
              <thead>
                <tr>
                  <th scope="col">Vacuna</th>
                  <th scope="col">Última aplicación</th>
                  <th scope="col">Vence</th>
                  <th scope="col">Estado</th>
                  <th scope="col"><span className="sr-only">Acción</span></th>
                </tr>
              </thead>
              <tbody>
                {vacunas.map((f) => (
                  <tr key={f.key}>
                    <td data-label="Vacuna" className="strong">{f.vacuna.nombre}</td>
                    <td data-label="Última aplicación">{f.aplicada ? formatFull(f.aplicada) : 'Sin registro'}</td>
                    <td data-label="Vence">{f.vence ? formatFull(f.vence) : '—'}</td>
                    <td data-label="Estado"><EstadoVacunaBadge estado={f.estado} /></td>
                    <td data-label="Acción">
                      <button
                        type="button"
                        className="btn btn--soft btn--sm"
                        onClick={() => {
                          dispatch({ type: 'vacuna/aplicar', pacienteId: paciente.id, vacunaId: f.vacuna.id, fecha: hoy });
                          avisar(`${f.vacuna.nombre} registrada para ${paciente.nombre}.`);
                        }}
                      >
                        Registrar aplicación hoy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card card--wide" aria-labelledby="h-cons">
          <h2 id="h-cons" className="card__title">Historial de consultas</h2>
          {consultas.length === 0 ? (
            <EmptyState titulo="Todavía no hay consultas registradas" />
          ) : (
            <ul className="list">
              {consultas.slice(0, 12).map((c) => (
                <li key={c.id} className="list__item">
                  <span className="list__time list__time--date">{formatFull(c.fecha)}</span>
                  <span className="list__main">
                    <span className="strong">{c.motivo}</span>
                    <span className="muted">{c.diagnostico} · {data.profesionales.find((p) => p.id === c.profesionalId)?.nombre ?? ''}</span>
                  </span>
                  <span className="amount">{c.importe > 0 ? formatMoney(c.importe) : 'Sin cargo'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <NuevaConsulta key={String(consulta)} pacienteId={paciente.id} abierto={consulta} onCerrar={() => setConsulta(false)} />
    </>
  );
}
