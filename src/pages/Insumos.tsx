import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Dialog } from '../components/Dialog.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { EstadoInsumoBadge } from '../components/Estados.tsx';
import { Field } from '../components/Field.tsx';
import { Icon } from '../components/Icon.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { formatFull } from '../lib/dates.ts';
import { estadoInsumo, nivelStock, validarCantidad } from '../lib/stock.ts';
import { matchesQuery, plural } from '../lib/text.ts';
import { validarInsumo } from '../lib/validate.ts';
import { useApp } from '../state/store.tsx';
import type { CategoriaInsumo, Insumo } from '../state/types.ts';

const CATEGORIAS: CategoriaInsumo[] = ['Medicamentos', 'Vacunas', 'Descartables', 'Alimento', 'Higiene'];

function AjusteDialog({ insumo, onCerrar }: { insumo: Insumo; onCerrar: () => void }) {
  const { dispatch, avisar } = useApp();
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [cantidad, setCantidad] = useState('');
  const [error, setError] = useState('');

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(cantidad);
    const msg = validarCantidad(n);
    if (msg) {
      setError(msg);
      return;
    }
    if (tipo === 'salida' && n > insumo.stock) {
      setError(`Solo hay ${insumo.stock} ${insumo.unidad} en stock.`);
      return;
    }
    dispatch({ type: 'insumo/ajustar', id: insumo.id, delta: tipo === 'entrada' ? n : -n });
    avisar(`${insumo.nombre}: ${tipo === 'entrada' ? 'entraron' : 'salieron'} ${n} ${insumo.unidad}.`);
    onCerrar();
  };

  return (
    <Dialog open onClose={onCerrar} title={`Ajustar stock: ${insumo.nombre}`}>
      <form onSubmit={enviar} noValidate className="form">
        <p className="muted">Stock actual: {insumo.stock} {insumo.unidad}</p>
        <fieldset className="radios">
          <legend className="field__label">Tipo de movimiento</legend>
          <label className="radio"><input type="radio" name="tipo" checked={tipo === 'entrada'} onChange={() => setTipo('entrada')} /> Entrada</label>
          <label className="radio"><input type="radio" name="tipo" checked={tipo === 'salida'} onChange={() => setTipo('salida')} /> Salida</label>
        </fieldset>
        <Field label="Cantidad">
          <input className="input" inputMode="numeric" value={cantidad} onChange={(e) => setCantidad(e.target.value)} autoComplete="off" />
        </Field>
        {error && <p className="form__error" role="alert">{error}</p>}
        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn btn--primary">Guardar movimiento</button>
        </div>
      </form>
    </Dialog>
  );
}

function NuevoInsumo({ onCerrar }: { onCerrar: () => void }) {
  const { dispatch, avisar } = useApp();
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<CategoriaInsumo>('Medicamentos');
  const [stock, setStock] = useState('');
  const [minimo, setMinimo] = useState('');
  const [unidad, setUnidad] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [error, setError] = useState('');

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const s = Number(stock);
    const m = Number(minimo);
    const msg = validarInsumo(nombre, s, m, unidad);
    if (msg) {
      setError(msg);
      return;
    }
    dispatch({
      type: 'insumo/crear',
      insumo: { nombre: nombre.trim(), categoria, stock: s, minimo: m, unidad: unidad.trim(), vencimiento: vencimiento || null },
    });
    avisar(`Se agregó ${nombre.trim()}.`);
    onCerrar();
  };

  return (
    <Dialog open onClose={onCerrar} title="Nuevo insumo">
      <form onSubmit={enviar} noValidate className="form">
        <div className="form__grid">
          <Field label="Nombre">
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Categoría">
            <select className="input" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaInsumo)}>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Stock inicial">
            <input className="input" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Stock mínimo" hint="Por debajo de este número se marca como bajo.">
            <input className="input" inputMode="numeric" value={minimo} onChange={(e) => setMinimo(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Unidad" hint="Por ejemplo: frascos, dosis, bolsas.">
            <input className="input" value={unidad} onChange={(e) => setUnidad(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Vencimiento (opcional)">
            <input className="input" type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} />
          </Field>
        </div>
        {error && <p className="form__error" role="alert">{error}</p>}
        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn btn--primary">Guardar insumo</button>
        </div>
      </form>
    </Dialog>
  );
}

export function Insumos() {
  const { data, hoy } = useApp();
  const [q, setQ] = useState('');
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [ajuste, setAjuste] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);

  const filas = useMemo(
    () =>
      data.insumos
        .map((i) => ({ i, estado: estadoInsumo(i, hoy) }))
        .filter(({ i, estado }) => (!soloAlertas || estado !== 'ok') && matchesQuery(q, i.nombre, i.categoria))
        .sort((a, b) => a.i.nombre.localeCompare(b.i.nombre, 'es')),
    [data.insumos, hoy, q, soloAlertas],
  );
  const conAlerta = data.insumos.filter((i) => estadoInsumo(i, hoy) !== 'ok').length;
  const seleccionado = data.insumos.find((i) => i.id === ajuste);

  return (
    <>
      <PageHeader
        titulo="Insumos"
        descripcion={`${plural(data.insumos.length, 'insumo', 'insumos')} · ${plural(conAlerta, 'con alerta', 'con alerta')}.`}
        acciones={
          <button type="button" className="btn btn--primary" onClick={() => setNuevo(true)}>
            <Icon name="plus" size={18} /> Nuevo insumo
          </button>
        }
      />

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={18} />
          <input className="input input--search" type="search" placeholder="Buscar insumo o categoría" aria-label="Buscar insumos" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="chips" role="group" aria-label="Filtrar">
          <button type="button" className="chip" aria-pressed={!soloAlertas} onClick={() => setSoloAlertas(false)}>Todos</button>
          <button type="button" className="chip" aria-pressed={soloAlertas} onClick={() => setSoloAlertas(true)}>
            Con alerta <span className="chip__count">{conAlerta}</span>
          </button>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">{plural(filas.length, 'resultado', 'resultados')}</p>

      {filas.length === 0 ? (
        <EmptyState titulo="No hay insumos para mostrar">Probá con otra búsqueda.</EmptyState>
      ) : (
        <div className="card card--flush">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Insumo</th>
                <th scope="col">Stock</th>
                <th scope="col">Vence</th>
                <th scope="col">Estado</th>
                <th scope="col"><span className="sr-only">Acción</span></th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ i, estado }) => (
                <tr key={i.id}>
                  <td data-label="Insumo">
                    <span className="strong">{i.nombre}</span>
                    <span className="muted block">{i.categoria}</span>
                  </td>
                  <td data-label="Stock">
                    <span className="strong">{i.stock} {i.unidad}</span>
                    <span className="muted block">mínimo {i.minimo}</span>
                    <span className="meter" aria-hidden="true"><span className={`meter__bar meter__bar--${estado}`} style={{ width: `${Math.round(nivelStock(i) * 100)}%` }} /></span>
                  </td>
                  <td data-label="Vence">{i.vencimiento ? formatFull(i.vencimiento) : '—'}</td>
                  <td data-label="Estado"><EstadoInsumoBadge estado={estado} /></td>
                  <td data-label="Acción">
                    <button type="button" className="btn btn--soft btn--sm" aria-label={`Ajustar stock de ${i.nombre}`} onClick={() => setAjuste(i.id)}>
                      Ajustar stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {seleccionado && <AjusteDialog key={seleccionado.id} insumo={seleccionado} onCerrar={() => setAjuste(null)} />}
      {nuevo && <NuevoInsumo onCerrar={() => setNuevo(false)} />}
    </>
  );
}
