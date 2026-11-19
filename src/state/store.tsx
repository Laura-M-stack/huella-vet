import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Dispatch, ReactNode } from 'react';
import { todayISO } from '../lib/dates.ts';
import { cargarDatos, guardarDatos } from '../lib/storage.ts';
import { reducer } from './reducer.ts';
import type { Accion } from './reducer.ts';
import type { AppData } from './types.ts';

interface Contexto {
  data: AppData;
  hoy: string;
  dispatch: Dispatch<Accion>;
  avisar: (mensaje: string) => void;
  mensaje: string;
}

const AppContext = createContext<Contexto | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [hoy, setHoy] = useState(() => todayISO());
  const [data, dispatch] = useReducer(reducer, hoy, (h) => cargarDatos(h));
  const [mensaje, setMensaje] = useState('');
  const temporizador = useRef<number | undefined>(undefined);

  // Guardar cada cambio para que la demo recuerde lo que se hizo al recargar.
  useEffect(() => {
    guardarDatos(data);
  }, [data]);

  // Si la demo queda abierta pasada la medianoche, se regeneran los datos para el dia nuevo.
  useEffect(() => {
    const revisar = () => {
      const actual = todayISO();
      setHoy((previo) => {
        if (previo !== actual) dispatch({ type: 'reiniciar', hoy: actual });
        return actual;
      });
    };
    const intervalo = window.setInterval(revisar, 60_000);
    document.addEventListener('visibilitychange', revisar);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', revisar);
    };
  }, []);

  const avisar = useCallback((texto: string) => {
    window.clearTimeout(temporizador.current);
    // Se vacia primero para que el lector de pantalla vuelva a anunciar un mensaje repetido.
    setMensaje('');
    window.setTimeout(() => setMensaje(texto), 30);
    temporizador.current = window.setTimeout(() => setMensaje(''), 5000);
  }, []);

  const valor = useMemo(() => ({ data, hoy, dispatch, avisar, mensaje }), [data, hoy, avisar, mensaje]);
  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}

export function useApp(): Contexto {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp se usa dentro de AppProvider');
  return ctx;
}
