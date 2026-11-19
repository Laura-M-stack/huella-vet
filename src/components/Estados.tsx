import { ESTADO_LABEL } from '../lib/agenda.ts';
import type { EstadoInsumo } from '../lib/stock.ts';
import type { EstadoVacuna } from '../lib/vaccines.ts';
import type { EstadoTurno } from '../state/types.ts';
import { Badge } from './Badge.tsx';
import type { Tono } from './Badge.tsx';

const TONO_TURNO: Record<EstadoTurno, Tono> = {
  confirmado: 'info',
  en_sala: 'warn',
  atendido: 'ok',
  cancelado: 'neutral',
};

export function EstadoTurnoBadge({ estado }: { estado: EstadoTurno }) {
  return <Badge tono={TONO_TURNO[estado]}>{ESTADO_LABEL[estado]}</Badge>;
}

const VACUNA: Record<EstadoVacuna, [Tono, string]> = {
  vigente: ['ok', 'Al día'],
  por_vencer: ['warn', 'Por vencer'],
  vencida: ['danger', 'Vencida'],
  sin_registro: ['danger', 'Sin registro'],
};

export function EstadoVacunaBadge({ estado }: { estado: EstadoVacuna }) {
  const [tono, texto] = VACUNA[estado];
  return <Badge tono={tono}>{texto}</Badge>;
}

const INSUMO: Record<EstadoInsumo, [Tono, string]> = {
  ok: ['ok', 'En orden'],
  por_vencer: ['warn', 'Por vencer'],
  bajo: ['warn', 'Stock bajo'],
  agotado: ['danger', 'Agotado'],
  vencido: ['danger', 'Vencido'],
};

export function EstadoInsumoBadge({ estado }: { estado: EstadoInsumo }) {
  const [tono, texto] = INSUMO[estado];
  return <Badge tono={tono}>{texto}</Badge>;
}
