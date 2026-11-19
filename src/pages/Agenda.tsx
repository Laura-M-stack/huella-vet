import { useState } from 'react';
import type { FormEvent } from 'react';
import { Dialog } from '../components/Dialog.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { EstadoTurnoBadge } from '../components/Estados.tsx';
import { Field } from '../components/Field.tsx';
import { Icon } from '../components/Icon.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { DURACIONES, HORARIOS, turnosActivos, turnosDelDia, validarTurno } from '../lib/agenda.ts';
import { addDays, formatLong, formatShort, formatWeekday, weekStart, weekday } from '../lib/dates.ts';
import { plural } from '../lib/text.ts';
import { rutas } from '../router.ts';
import { TurnoAcciones } from '../components/TurnoAcciones.tsx';
import { useApp } from '../state/store.tsx';
import type { Turno } from '../state/types.ts';

function NuevoTurno({ abierto, onCerrar, fechaInicial, alCrear }: { abierto: boolean; onCerrar: () => void; fechaInicial: string; alCrear: (fecha: string) => void }) {
  const { data, hoy, dispatch, avisar } = useApp();
  const pacientes = [...data.pacientes].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const [pacienteId, setPacienteId] = useState('');
  const [profesionalId, setProfesionalId] = useState(data.profesionales[0]?.id ?? '');
  const [fecha, setFecha] = useState(fechaInicial);
  const [hora, setHora] = useState('');
  const [duracion, setDuracion] = useState<number>(30);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const candidato: Turno = { id: 'nuevo', pacienteId, profesionalId, fecha, hora, duracion, motivo, estado: 'confirmado' };
    const msg = validarTurno(candidato, turnosActivos(data.turnos), hoy);
    if (msg) {
      setError(msg);
      return;
    }
    dispatch({ type: 'turno/crear', hoy, turno: { pacienteId, profesionalId, fecha, hora, duracion, motivo: motivo.trim() } });
    avisar(`Turno cargado para el ${formatShort(fecha)} a las ${hora}.`);
    alCrear(fecha);
    onCerrar();
  };

  return (
    <Dialog open={abierto} onClose={onCerrar} title="Nuevo turno">
      <form onSubmit={enviar} noValidate className="form">
        <div className="form__grid">
          <Field label="Paciente">
            <select className="input" value={pacienteId} onChange={(e) => setPacienteId(e.target.value)}>
              <option value="">Elegí un paciente</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · {data.tutores.find((t) => t.id === p.tutorId)?.nombre ?? ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Profesional">
            <select className="input" value={profesionalId} onChange={(e) => setProfesionalId(e.target.value)}>
              {data.profesionales.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} · {p.especialidad}</option>
              ))}
            </select>
          </Field>
          <Field label="Fecha" hint="La clínica atiende de lunes a sábado.">
            <input className="input" type="date" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Field>
          <Field label="Hora">
            <select className="input" value={hora} onChange={(e) => setHora(e.target.value)}>
              <option value="">Elegí un horario</option>
              {HORARIOS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </Field>
          <Field label="Duración">
            <select className="input" value={duracion} onChange={(e) => setDuracion(Number(e.target.value))}>
              {DURACIONES.map((d) => (
                <option key={d} value={d}>{d} minutos</option>
              ))}
            </select>
          </Field>
          <Field label="Motivo">
            <input className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} autoComplete="off" />
          </Field>
        </div>
        {error && <p className="form__error" role="alert">{error}</p>}
        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn btn--primary">Guardar turno</button>
        </div>
      </form>
    </Dialog>
  );
}

/** Mueve la fecha un dia, salteando los domingos (la clinica cierra). */
function mover(fecha: string, dir: 1 | -1): string {
  const sig = addDays(fecha, dir);
  return weekday(sig) === 0 ? addDays(sig, dir) : sig;
}

export function Agenda() {
  const { data, hoy } = useApp();
  const [fecha, setFecha] = useState(hoy);
  const [profesional, setProfesional] = useState('todos');
  const [nuevo, setNuevo] = useState(false);

  const turnos = turnosDelDia(data.turnos, fecha).filter((t) => profesional === 'todos' || t.profesionalId === profesional);
  const inicioSemana = weekStart(fecha);
  const semana = Array.from({ length: 6 }, (_, i) => addDays(inicioSemana, i));
  const cuenta = (f: string) => turnosActivos(data.turnos.filter((t) => t.fecha === f)).length;

  return (
    <>
      <PageHeader
        titulo="Agenda"
        descripcion={formatLong(fecha)}
        acciones={
          <button type="button" className="btn btn--primary" onClick={() => setNuevo(true)}>
            <Icon name="plus" size={18} /> Nuevo turno
          </button>
        }
      />

      <div className="toolbar">
        <div className="seg" role="group" aria-label="Navegar por días">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFecha(mover(fecha, -1))}>
            <Icon name="back" size={16} /> Anterior
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFecha(hoy)} disabled={fecha === hoy}>Hoy</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFecha(mover(fecha, 1))}>
            Siguiente <Icon name="arrow" size={16} />
          </button>
        </div>
        <select className="input input--auto" aria-label="Filtrar por profesional" value={profesional} onChange={(e) => setProfesional(e.target.value)}>
          <option value="todos">Todos los profesionales</option>
          {data.profesionales.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>

      <nav aria-label="Semana" className="week">
        {semana.map((f) => (
          <button
            key={f}
            type="button"
            className="week__day"
            aria-pressed={f === fecha}
            aria-label={`${formatLong(f)}, ${plural(cuenta(f), 'turno', 'turnos')}`}
            onClick={() => setFecha(f)}
          >
            <span className="week__name">{formatWeekday(f)}</span>
            <span className="week__num">{formatShort(f)}</span>
            <span className="week__count">{cuenta(f)}</span>
          </button>
        ))}
      </nav>

      {turnos.length === 0 ? (
        <EmptyState titulo="No hay turnos para este día">
          {weekday(fecha) === 0 ? 'La clínica está cerrada los domingos.' : 'Cargá uno con el botón "Nuevo turno".'}
        </EmptyState>
      ) : (
        <div className="card card--flush">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Hora</th>
                <th scope="col">Paciente</th>
                <th scope="col">Motivo</th>
                <th scope="col">Profesional</th>
                <th scope="col">Estado</th>
                <th scope="col"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {turnos.map((t) => {
                const p = data.pacientes.find((x) => x.id === t.pacienteId);
                return (
                  <tr key={t.id}>
                    <td data-label="Hora" className="strong">{t.hora}<span className="muted block">{t.duracion} min</span></td>
                    <td data-label="Paciente">
                      {p ? <a href={rutas.paciente(p.id)} className="strong-link">{p.nombre}</a> : '—'}
                      <span className="muted block">{data.tutores.find((x) => x.id === p?.tutorId)?.nombre ?? ''}</span>
                    </td>
                    <td data-label="Motivo">{t.motivo}</td>
                    <td data-label="Profesional">{data.profesionales.find((x) => x.id === t.profesionalId)?.nombre ?? '—'}</td>
                    <td data-label="Estado"><EstadoTurnoBadge estado={t.estado} /></td>
                    <td data-label="Acciones"><TurnoAcciones turno={t} mascota={p?.nombre ?? 'paciente'} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <NuevoTurno key={String(nuevo) + fecha} abierto={nuevo} onCerrar={() => setNuevo(false)} fechaInicial={fecha < hoy ? hoy : fecha} alCrear={setFecha} />
    </>
  );
}
