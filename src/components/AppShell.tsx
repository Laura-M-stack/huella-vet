import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { formatLong } from '../lib/dates.ts';
import { rutas } from '../router.ts';
import type { Route } from '../router.ts';
import { useApp } from '../state/store.tsx';
import { Icon } from './Icon.tsx';
import type { IconName } from './Icon.tsx';
import { PawMark } from './Logo.tsx';

interface Item {
  nombre: string;
  href: string;
  icono: IconName;
  activa: (r: Route) => boolean;
}

const ITEMS: Item[] = [
  { nombre: 'Panel', href: rutas.panel, icono: 'panel', activa: (r) => r.name === 'panel' },
  {
    nombre: 'Pacientes',
    href: rutas.pacientes,
    icono: 'bed',
    activa: (r) => r.name === 'pacientes' || r.name === 'paciente',
  },
  { nombre: 'Agenda', href: rutas.agenda, icono: 'calendar', activa: (r) => r.name === 'agenda' },
  { nombre: 'Vacunas', href: rutas.vacunas, icono: 'syringe', activa: (r) => r.name === 'vacunas' },
  { nombre: 'Insumos', href: rutas.insumos, icono: 'box', activa: (r) => r.name === 'insumos' },
];

type Tema = 'auto' | 'claro' | 'oscuro';
const CLAVE_TEMA = 'huella-vet:tema';

function leerTema(): Tema {
  try {
    const v = localStorage.getItem(CLAVE_TEMA);
    return v === 'claro' || v === 'oscuro' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export function aplicarTemaGuardado(): void {
  const t = leerTema();
  if (t === 'auto') document.documentElement.removeAttribute('data-tema');
  else document.documentElement.setAttribute('data-tema', t);
}

function ToggleTema() {
  const [tema, setTema] = useState<Tema>(leerTema);
  const oscuroEfectivo =
    tema === 'oscuro' || (tema === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const cambiar = () => {
    const siguiente: Tema = oscuroEfectivo ? 'claro' : 'oscuro';
    setTema(siguiente);
    document.documentElement.setAttribute('data-tema', siguiente);
    try {
      localStorage.setItem(CLAVE_TEMA, siguiente);
    } catch {
      // Sin storage el tema vale solo para esta visita.
    }
  };

  return (
    <button type="button" className="icon-btn" onClick={cambiar} aria-label={oscuroEfectivo ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
      <Icon name={oscuroEfectivo ? 'sun' : 'moon'} />
    </button>
  );
}

export function AppShell({ route, children }: { route: Route; children: ReactNode }) {
  const { hoy, dispatch, avisar, mensaje } = useApp();

  // Al cambiar de pantalla, el foco va al titulo: asi el lector de pantalla anuncia donde esta.
  const clave = route.name === 'paciente' ? `paciente-${route.id}` : route.name;
  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>('[data-page-title]')?.focus({ preventScroll: true });
  }, [clave]);

  const reiniciar = () => {
    dispatch({ type: 'reiniciar', hoy });
    avisar('Datos de ejemplo restaurados.');
  };

  return (
    <div className="shell">
      <a href="#contenido" className="skip-link" onClick={(e) => { e.preventDefault(); document.querySelector<HTMLElement>('[data-page-title]')?.focus(); }}>
        Saltar al contenido
      </a>
      <aside className="shell__side">
        <a href={rutas.landing} className="brand" aria-label="Huella Vet, volver al inicio">
          <span className="brand__mark"><PawMark size={26} /></span>
          <span className="brand__name">Huella Vet</span>
        </a>
        <nav aria-label="Secciones" className="nav">
          {ITEMS.map((item) => (
            <a key={item.href} href={item.href} className="nav__link" aria-current={item.activa(route) ? 'page' : undefined}>
              <Icon name={item.icono} />
              <span>{item.nombre}</span>
            </a>
          ))}
        </nav>
        <div className="shell__side-foot">
          <p className="demo-note">
            Clínica ficticia con datos de ejemplo. Se regeneran cada día; lo que cargues queda en tu navegador.
          </p>
          <button type="button" className="btn btn--ghost btn--sm" onClick={reiniciar}>
            <Icon name="refresh" size={16} /> Restaurar datos
          </button>
        </div>
      </aside>
      <div className="shell__main">
        <header className="topbar">
          <a href={rutas.landing} className="brand brand--compact" aria-label="Huella Vet, volver al inicio">
            <span className="brand__mark"><PawMark size={22} /></span>
            <span className="brand__name">Huella Vet</span>
          </a>
          <p className="topbar__date">{formatLong(hoy)}</p>
          <ToggleTema />
        </header>
        <main id="contenido" className="content">
          {children}
        </main>
        <footer className="app-foot">
          Demo de software a medida diseñada y desarrollada por{' '}
          <a href="https://laura-moyano-web.pages.dev/es/portfolio" target="_blank" rel="noreferrer">
            Laura Moyano<span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>
          .
        </footer>
      </div>
      <nav aria-label="Secciones (móvil)" className="tabbar">
        {ITEMS.map((item) => (
          <a key={item.href} href={item.href} className="tabbar__link" aria-current={item.activa(route) ? 'page' : undefined}>
            <Icon name={item.icono} />
            <span>{item.nombre}</span>
          </a>
        ))}
      </nav>
      <div className="toast" role="status" aria-live="polite">
        {mensaje && <p className="toast__msg">{mensaje}</p>}
      </div>
    </div>
  );
}
