import { useEffect, useState } from 'react';

export type Route =
  | { name: 'landing' }
  | { name: 'panel' }
  | { name: 'pacientes' }
  | { name: 'paciente'; id: string }
  | { name: 'agenda' }
  | { name: 'vacunas' }
  | { name: 'insumos' }
  | { name: 'noEncontrada' };

/** Rutas por hash (#/app/agenda): funcionan en GitHub Pages sin configurar redirecciones. */
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/\/+$/, '') || '/';
  if (path === '/') return { name: 'landing' };
  // Un hash sin barra (#a-medida) es un ancla dentro de la landing, no una ruta.
  if (!path.startsWith('/')) return { name: 'landing' };
  const partes = path.split('/').filter(Boolean);
  if (partes[0] !== 'app') return { name: 'noEncontrada' };
  switch (partes[1]) {
    case undefined:
      return { name: 'panel' };
    case 'pacientes':
      if (partes.length === 2) return { name: 'pacientes' };
      if (partes.length === 3) return { name: 'paciente', id: decodeURIComponent(partes[2]) };
      return { name: 'noEncontrada' };
    case 'agenda':
      return partes.length === 2 ? { name: 'agenda' } : { name: 'noEncontrada' };
    case 'vacunas':
      return partes.length === 2 ? { name: 'vacunas' } : { name: 'noEncontrada' };
    case 'insumos':
      return partes.length === 2 ? { name: 'insumos' } : { name: 'noEncontrada' };
    default:
      return { name: 'noEncontrada' };
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const rutas = {
  landing: '#/',
  panel: '#/app',
  pacientes: '#/app/pacientes',
  paciente: (id: string) => `#/app/pacientes/${encodeURIComponent(id)}`,
  agenda: '#/app/agenda',
  vacunas: '#/app/vacunas',
  insumos: '#/app/insumos',
};
