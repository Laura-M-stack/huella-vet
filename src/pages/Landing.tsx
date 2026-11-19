import { Icon } from '../components/Icon.tsx';
import type { IconName } from '../components/Icon.tsx';
import { PawMark } from '../components/Logo.tsx';
import { rutas } from '../router.ts';

const CONTACTO = 'https://laura-moyano-web.pages.dev/es#contacto';
const PORTFOLIO = 'https://laura-moyano-web.pages.dev/es/portfolio';

const MODULOS: Array<{ icono: IconName; titulo: string; texto: string }> = [
  { icono: 'panel', titulo: 'Panel del día', texto: 'Turnos, vacunas por vencer, stock crítico e ingresos, todo en una sola pantalla.' },
  { icono: 'bed', titulo: 'Pacientes y tutores', texto: 'Ficha de cada mascota con datos, historial de consultas, vacunas e internación.' },
  { icono: 'calendar', titulo: 'Agenda sin choques', texto: 'Turnos por profesional, con aviso si el horario ya está ocupado y estados de la visita.' },
  { icono: 'syringe', titulo: 'Vacunas y avisos', texto: 'Qué refuerzos vencieron o vencen pronto, con el mensaje listo para avisar al tutor.' },
  { icono: 'box', titulo: 'Insumos', texto: 'Stock con mínimos y vencimientos, y alertas antes de quedarte sin algo importante.' },
];

export function Landing() {
  return (
    <div className="landing">
      <p className="demo-banner">
        Sitio de demostración: Huella Vet es una clínica ficticia. Diseñado y desarrollado por Laura Moyano.
      </p>
      <header className="l-header">
        <a href={rutas.landing} className="brand" aria-label="Huella Vet, inicio">
          <span className="brand__mark"><PawMark size={26} /></span>
          <span className="brand__name">Huella Vet</span>
        </a>
        <nav aria-label="Principal" className="l-nav">
          <a href="#modulos">Qué incluye</a>
          <a href="#a-medida">A medida</a>
        </nav>
      </header>

      <main id="contenido">
        <section className="l-hero">
          <div className="l-hero__text">
            <p className="eyebrow">Demo de software de gestión para tu negocio</p>
            <h1 className="l-hero__title">La clínica en orden, sin planillas ni papeles.</h1>
            <p className="l-hero__lead">
              Turnos, fichas, vacunas e insumos en un solo lugar. Probalo con datos de ejemplo: todo funciona y no hay nada que instalar.
            </p>
            <div className="l-hero__cta">
              <a href={rutas.panel} className="btn btn--primary btn--lg">
                Probar el panel <Icon name="arrow" size={18} />
              </a>
            </div>
            <p className="l-hero__note">Los datos son de ejemplo y se guardan solo en tu navegador.</p>
          </div>

          <div className="l-hero__visual" aria-hidden="true">
            <div className="mini">
              <div className="mini__bar"><span /><span /><span /></div>
              <div className="mini__kpis">
                <div className="mini__kpi"><small>Turnos hoy</small><strong>7</strong></div>
                <div className="mini__kpi"><small>Vacunas</small><strong>9</strong></div>
                <div className="mini__kpi mini__kpi--accent"><small>Ingresos</small><strong>$1,2 M</strong></div>
              </div>
              <ul className="mini__list">
                <li><span>09:30</span><b>Luna</b><i className="mini__tag mini__tag--ok">Atendido</i></li>
                <li><span>10:30</span><b>Mía</b><i className="mini__tag mini__tag--warn">En sala</i></li>
                <li><span>11:00</span><b>Simón</b><i className="mini__tag">Confirmado</i></li>
                <li><span>11:30</span><b>Nala</b><i className="mini__tag">Confirmado</i></li>
              </ul>
            </div>
          </div>
        </section>

        <section id="modulos" className="l-section" aria-labelledby="h-modulos">
          <p className="eyebrow">Qué incluye</p>
          <h2 id="h-modulos" className="l-section__title">Lo que pasa todos los días en una veterinaria</h2>
          <ul className="l-grid">
            {MODULOS.map((m) => (
              <li key={m.titulo} className="l-card">
                <span className="l-card__icon"><Icon name={m.icono} size={22} /></span>
                <h3 className="l-card__title">{m.titulo}</h3>
                <p className="l-card__text">{m.texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="a-medida" className="l-section l-cta" aria-labelledby="h-medida">
          <div>
            <p className="eyebrow">Software a medida</p>
            <h2 id="h-medida" className="l-section__title">Esto es un ejemplo. El tuyo se arma con tu forma de trabajar.</h2>
            <p className="l-cta__text">
              Huella Vet muestra cómo puede verse un sistema interno hecho para un negocio concreto. Si tenés un comercio, un consultorio o un taller y hoy llevás todo en planillas o cuadernos, lo conversamos y lo armamos con tus propios datos y procesos.
            </p>
          </div>
          <div className="l-cta__actions">
            <a href={CONTACTO} className="btn btn--primary btn--lg" target="_blank" rel="noreferrer">
              Quiero algo así para mi negocio <span className="sr-only">(se abre en una pestaña nueva)</span>
            </a>
            <a href={PORTFOLIO} className="link-arrow" target="_blank" rel="noreferrer">
              Ver otros proyectos <span className="sr-only">(se abre en una pestaña nueva)</span>
            </a>
          </div>
        </section>
      </main>

      <footer className="l-footer">
        <p>Huella Vet es una clínica ficticia creada como demostración. Los pacientes, tutores y datos son inventados.</p>
      </footer>
    </div>
  );
}
