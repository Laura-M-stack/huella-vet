import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { aplicarTemaGuardado } from './components/AppShell.tsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/app.css';
import './styles/landing.css';

aplicarTemaGuardado();

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Falta el elemento #root');
createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
