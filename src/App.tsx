import { AppShell } from './components/AppShell.tsx';
import { Agenda } from './pages/Agenda.tsx';
import { Ficha } from './pages/Ficha.tsx';
import { Insumos } from './pages/Insumos.tsx';
import { Landing } from './pages/Landing.tsx';
import { NoEncontrada } from './pages/NoEncontrada.tsx';
import { Pacientes } from './pages/Pacientes.tsx';
import { Panel } from './pages/Panel.tsx';
import { Vacunas } from './pages/Vacunas.tsx';
import { useRoute } from './router.ts';
import type { Route } from './router.ts';
import { AppProvider } from './state/store.tsx';

function Pantalla({ route }: { route: Route }) {
  switch (route.name) {
    case 'panel':
      return <Panel />;
    case 'pacientes':
      return <Pacientes />;
    case 'paciente':
      return <Ficha id={route.id} />;
    case 'agenda':
      return <Agenda />;
    case 'vacunas':
      return <Vacunas />;
    case 'insumos':
      return <Insumos />;
    case 'landing':
    case 'noEncontrada':
      return <NoEncontrada />;
  }
}

export function App() {
  const route = useRoute();
  if (route.name === 'landing') return <Landing />;
  return (
    <AppProvider>
      <AppShell route={route}>
        <Pantalla route={route} />
      </AppShell>
    </AppProvider>
  );
}
