import { useMemo } from 'react';
import { BarChart } from '../components/BarChart.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { EstadoInsumoBadge, EstadoTurnoBadge, EstadoVacunaBadge } from '../components/Estados.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { TurnoAcciones } from '../components/TurnoAcciones.tsx';
import { turnosDelDia } from '../lib/agenda.ts';
import { formatFull } from '../lib/dates.ts';
import { calcularKpis } from '../lib/kpis.ts';
import { estadoInsumo } from '../lib/stock.ts';
import { formatMoney, plural } from '../lib/text.ts';
import { vacunasPendientes } from '../lib/vaccines.ts';
import { rutas } from '../router.ts';
import { useApp } from '../state/store.tsx';

const GRAVEDAD = { vencido: 0, agotado: 1, bajo: 2, por_vencer: 3, ok: 4 } as const;

export function Panel() {
  const { data, hoy } = useApp();
  const k = useMemo(() => calcularKpis(data, hoy), [data, hoy]);
  const turnos = turnosDelDia(data.turnos, hoy);
  const pacientePorId = (id: string) => data.pacientes.find((p) => p.id === id);
  const profPorId = (id: string) => data.profesionales.find((p) => p.id === id);

  const pendientes = useMemo(
    () => vacunasPendientes(data.pacientes, data.vacunaciones, hoy).slice(0, 5),
    [data.pacientes, data.vacunaciones, hoy],
  );
  const criticos = useMemo(
    () =>
      data.insumos
        .map((i) => ({ insumo: i, estado: estadoInsumo(i, hoy) }))
        .filter((x) => x.estado !== 'ok')
        .sort((a, b) => GRAVEDAD[a.estado] - GRAVEDAD[b.estado])
        .slice(0, 5),
    [data.insumos, hoy],
  );

  const variacion =
    k.variacionMes === null
      ? 'Sin datos del mes anterior para comparar'
      : `${k.variacionMes >= 0 ? '+' : ''}${k.variacionMes}% contra el mismo período del mes anterior`;

  return (
    <>
      <PageHeader titulo="Panel" descripcion="Cómo viene el día en la clínica." />

      <section aria-label="Indicadores" className="kpis">
        <article className="kpi">
          <h2 className="kpi__label">Turnos de hoy</h2>
          <p className="kpi__value">{k.turnosHoy}</p>
          <p className="kpi__hint">
            {k.atendidosHoy} atendidos · {k.enSala} en sala
          </p>
        </article>
        <article className="kpi">
          <h2 className="kpi__label">Vacunas a revisar</h2>
          <p className="kpi__value">{k.vacunasARevisar}</p>
          <p className="kpi__hint">{plural(k.vacunasVencidas, 'vencida', 'vencidas')}</p>
        </article>
        <article className="kpi">
          <h2 className="kpi__label">Insumos en alerta</h2>
          <p className="kpi__value">{k.insumosEnAlerta}</p>
          <p className="kpi__hint">Bajo mínimo, agotados o por vencer</p>
        </article>
        <article className="kpi kpi--accent">
          <h2 className="kpi__label">Ingresos del mes</h2>
          <p className="kpi__value">{formatMoney(k.ingresosMes)}</p>
          <p className="kpi__hint">{variacion}</p>
        </article>
      </section>

      <div className="grid-panel">
        <section className="card card--wide" aria-labelledby="h-agenda">
          <div className="card__head">
            <h2 id="h-agenda" className="card__title">Agenda de hoy</h2>
            <a href={rutas.agenda} className="link-arrow">Ver agenda completa</a>
          </div>
          {turnos.length === 0 ? (
            <EmptyState titulo="No hay turnos para hoy">Cargá uno desde la agenda.</EmptyState>
          ) : (
            <ul className="list">
              {turnos.map((t) => {
                const p = pacientePorId(t.pacienteId);
                const nombre = p?.nombre ?? 'Paciente';
                return (
                  <li key={t.id} className="list__item list__item--turno">
                    <span className="list__time">{t.hora}</span>
                    <span className="list__main">
                      {p ? <a href={rutas.paciente(p.id)} className="strong-link">{nombre}</a> : nombre}
                      <span className="muted">{t.motivo} · {profPorId(t.profesionalId)?.nombre ?? ''}</span>
                    </span>
                    <EstadoTurnoBadge estado={t.estado} />
                    <TurnoAcciones turno={t} mascota={nombre} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="h-ingresos">
          <div className="card__head">
            <h2 id="h-ingresos" className="card__title">Ingresos, últimos 7 días</h2>
          </div>
          <BarChart datos={k.ultimosSieteDias} />
        </section>

        <section className="card" aria-labelledby="h-vacunas">
          <div className="card__head">
            <h2 id="h-vacunas" className="card__title">Vacunas que requieren aviso</h2>
            <a href={rutas.vacunas} className="link-arrow">Ver todas</a>
          </div>
          {pendientes.length === 0 ? (
            <EmptyState titulo="Todo al día">No hay vacunas vencidas ni próximas a vencer.</EmptyState>
          ) : (
            <ul className="list">
              {pendientes.map((f) => (
                <li key={f.key} className="list__item">
                  <span className="list__main">
                    <a href={rutas.paciente(f.paciente.id)} className="strong-link">{f.paciente.nombre}</a>
                    <span className="muted">
                      {f.vacuna.nombre}
                      {f.vence ? ` · vence ${formatFull(f.vence)}` : ''}
                    </span>
                  </span>
                  <EstadoVacunaBadge estado={f.estado} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="h-stock">
          <div className="card__head">
            <h2 id="h-stock" className="card__title">Stock crítico</h2>
            <a href={rutas.insumos} className="link-arrow">Ver insumos</a>
          </div>
          {criticos.length === 0 ? (
            <EmptyState titulo="Stock en orden">Ningún insumo necesita atención.</EmptyState>
          ) : (
            <ul className="list">
              {criticos.map(({ insumo, estado }) => (
                <li key={insumo.id} className="list__item">
                  <span className="list__main">
                    <span className="strong">{insumo.nombre}</span>
                    <span className="muted">{insumo.stock} {insumo.unidad} · mínimo {insumo.minimo}</span>
                  </span>
                  <EstadoInsumoBadge estado={estado} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
