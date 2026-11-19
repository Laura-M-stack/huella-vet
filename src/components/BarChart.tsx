import { formatMoney } from '../lib/text.ts';
import { formatShort, formatWeekday } from '../lib/dates.ts';
import type { PuntoIngreso } from '../lib/kpis.ts';

function corto(valor: number): string {
  if (valor >= 1_000_000) return `$${(valor / 1_000_000).toFixed(1).replace('.', ',')} M`;
  if (valor >= 1000) return `$${Math.round(valor / 1000)} mil`;
  return `$${valor}`;
}

/** Barras en SVG, con una tabla equivalente para lectores de pantalla. */
export function BarChart({ datos }: { datos: PuntoIngreso[] }) {
  const ancho = 560;
  const alto = 220;
  const margenInferior = 44;
  const margenSuperior = 24;
  const maximo = Math.max(...datos.map((d) => d.total), 1);
  const paso = ancho / datos.length;
  const barra = Math.min(48, paso * 0.56);
  const util = alto - margenInferior - margenSuperior;
  const resumen = datos.map((d) => `${formatWeekday(d.fecha)} ${formatShort(d.fecha)}: ${formatMoney(d.total)}`).join('. ');

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label={`Ingresos de los últimos 7 días. ${resumen}`}>
        <line x1="0" x2={ancho} y1={alto - margenInferior} y2={alto - margenInferior} className="chart__axis" />
        {datos.map((d, i) => {
          const h = d.total === 0 ? 2 : Math.max(4, (d.total / maximo) * util);
          const x = i * paso + (paso - barra) / 2;
          const y = alto - margenInferior - h;
          const esUltimo = i === datos.length - 1;
          return (
            <g key={d.fecha}>
              <rect x={x} y={y} width={barra} height={h} rx="6" className={esUltimo ? 'chart__bar chart__bar--hoy' : 'chart__bar'} />
              <text x={x + barra / 2} y={y - 8} textAnchor="middle" className="chart__value">
                {corto(d.total)}
              </text>
              <text x={x + barra / 2} y={alto - 22} textAnchor="middle" className="chart__label">
                {formatWeekday(d.fecha)}
              </text>
              <text x={x + barra / 2} y={alto - 6} textAnchor="middle" className="chart__sub">
                {formatShort(d.fecha)}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>Ingresos por día, últimos 7 días</caption>
        <thead>
          <tr>
            <th scope="col">Día</th>
            <th scope="col">Ingresos</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((d) => (
            <tr key={d.fecha}>
              <th scope="row">{`${formatWeekday(d.fecha)} ${formatShort(d.fecha)}`}</th>
              <td>{formatMoney(d.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
