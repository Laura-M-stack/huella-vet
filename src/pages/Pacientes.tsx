import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Dialog } from '../components/Dialog.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { EstadoVacunaBadge } from '../components/Estados.tsx';
import { Badge } from '../components/Badge.tsx';
import { Field } from '../components/Field.tsx';
import { Icon } from '../components/Icon.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { ageLabel } from '../lib/dates.ts';
import { matchesQuery, plural } from '../lib/text.ts';
import { validarPaciente } from '../lib/validate.ts';
import { estadoVacunasPaciente } from '../lib/vaccines.ts';
import type { EstadoVacuna } from '../lib/vaccines.ts';
import { rutas } from '../router.ts';
import { useApp } from '../state/store.tsx';
import type { Especie, Sexo } from '../state/types.ts';

export const ESPECIE_LABEL: Record<Especie, string> = {
  perro: 'Perro',
  gato: 'Gato',
  conejo: 'Conejo',
  ave: 'Ave',
};

const PEOR: EstadoVacuna[] = ['vencida', 'sin_registro', 'por_vencer', 'vigente'];

function NuevoPaciente({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const { dispatch, hoy, avisar } = useApp();
  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState<Especie>('perro');
  const [raza, setRaza] = useState('');
  const [sexo, setSexo] = useState<Sexo>('macho');
  const [nacimiento, setNacimiento] = useState('');
  const [peso, setPeso] = useState('');
  const [tutorNombre, setTutorNombre] = useState('');
  const [tutorTelefono, setTutorTelefono] = useState('');
  const [error, setError] = useState('');

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const pesoKg = Number(peso.replace(',', '.'));
    const msg = validarPaciente({ nombre, especie, raza, nacimiento, pesoKg, tutorNombre, tutorTelefono }, hoy);
    if (msg) {
      setError(msg);
      return;
    }
    dispatch({
      type: 'paciente/crear',
      hoy,
      paciente: { nombre, especie, raza, sexo, nacimiento, pesoKg },
      tutor: { nombre: tutorNombre, telefono: tutorTelefono },
    });
    avisar(`Se agregó a ${nombre.trim()}.`);
    onCerrar();
  };

  return (
    <Dialog open={abierto} onClose={onCerrar} title="Nuevo paciente">
      <form onSubmit={enviar} noValidate className="form">
        <div className="form__grid">
          <Field label="Nombre de la mascota">
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Especie">
            <select className="input" value={especie} onChange={(e) => setEspecie(e.target.value as Especie)}>
              {Object.entries(ESPECIE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Raza">
            <input className="input" value={raza} onChange={(e) => setRaza(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Sexo">
            <select className="input" value={sexo} onChange={(e) => setSexo(e.target.value as Sexo)}>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </Field>
          <Field label="Fecha de nacimiento">
            <input className="input" type="date" max={hoy} value={nacimiento} onChange={(e) => setNacimiento(e.target.value)} />
          </Field>
          <Field label="Peso (kg)" hint="Podés usar coma o punto.">
            <input className="input" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Nombre del tutor">
            <input className="input" value={tutorNombre} onChange={(e) => setTutorNombre(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Teléfono del tutor">
            <input className="input" type="tel" value={tutorTelefono} onChange={(e) => setTutorTelefono(e.target.value)} autoComplete="off" />
          </Field>
        </div>
        {error && <p className="form__error" role="alert">{error}</p>}
        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn btn--primary">Guardar paciente</button>
        </div>
      </form>
    </Dialog>
  );
}

export function Pacientes() {
  const { data, hoy } = useApp();
  const [q, setQ] = useState('');
  const [especie, setEspecie] = useState<'todas' | Especie>('todas');
  const [nuevo, setNuevo] = useState(false);

  const filas = useMemo(() => {
    return data.pacientes
      .map((p) => {
        const tutor = data.tutores.find((t) => t.id === p.tutorId);
        const estados = estadoVacunasPaciente(p, data.vacunaciones, hoy).map((f) => f.estado);
        const peor = PEOR.find((e) => estados.includes(e)) ?? null;
        return { p, tutor, peor };
      })
      .filter(({ p, tutor }) => (especie === 'todas' || p.especie === especie) && matchesQuery(q, p.nombre, p.raza, tutor?.nombre))
      .sort((a, b) => a.p.nombre.localeCompare(b.p.nombre, 'es'));
  }, [data, hoy, q, especie]);

  return (
    <>
      <PageHeader
        titulo="Pacientes"
        descripcion={`${plural(data.pacientes.length, 'paciente registrado', 'pacientes registrados')}.`}
        acciones={
          <button type="button" className="btn btn--primary" onClick={() => setNuevo(true)}>
            <Icon name="plus" size={18} /> Nuevo paciente
          </button>
        }
      />

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={18} />
          <input
            className="input input--search"
            type="search"
            placeholder="Buscar por mascota, raza o tutor"
            aria-label="Buscar pacientes"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="input input--auto" aria-label="Filtrar por especie" value={especie} onChange={(e) => setEspecie(e.target.value as 'todas' | Especie)}>
          <option value="todas">Todas las especies</option>
          {Object.entries(ESPECIE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <p className="sr-only" role="status" aria-live="polite">{plural(filas.length, 'resultado', 'resultados')}</p>

      {filas.length === 0 ? (
        <EmptyState titulo="No encontramos pacientes">Probá con otro nombre o limpiá los filtros.</EmptyState>
      ) : (
        <div className="card card--flush">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Paciente</th>
                <th scope="col">Especie</th>
                <th scope="col">Tutor</th>
                <th scope="col">Edad</th>
                <th scope="col">Peso</th>
                <th scope="col">Vacunas</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ p, tutor, peor }) => (
                <tr key={p.id}>
                  <td data-label="Paciente">
                    <a href={rutas.paciente(p.id)} className="strong-link">{p.nombre}</a>
                    <span className="muted block">{p.raza}</span>
                    {p.internado && <Badge tono="warn">Internado</Badge>}
                  </td>
                  <td data-label="Especie">{ESPECIE_LABEL[p.especie]}</td>
                  <td data-label="Tutor">{tutor?.nombre ?? '—'}</td>
                  <td data-label="Edad">{ageLabel(p.nacimiento, hoy)}</td>
                  <td data-label="Peso">{p.pesoKg} kg</td>
                  <td data-label="Vacunas">{peor ? <EstadoVacunaBadge estado={peor} /> : <span className="muted">No aplica</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NuevoPaciente key={String(nuevo)} abierto={nuevo} onCerrar={() => setNuevo(false)} />
    </>
  );
}
