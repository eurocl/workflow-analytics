// Acá compartimos la sesión y el historial entre pantallas. La sesión se borra al cerrar la app; el historial queda en el teléfono.
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Actividad, agregarActividad, leerHistorial } from './estadisticas';
type Sesion = { token: string; email: string; name: string; demo: boolean; local?: boolean };
let writes = Promise.resolve();
const Context = createContext<{
  sesion: Sesion | null; cambiarSesion: (value: Sesion | null) => void;
  duracion: number; cambiarDuracion: (value: number) => void;
  ultimaActividad: Actividad | null; registrarActividad: (value: Actividad | null) => void;
  actividades: Actividad[]; historialListo: boolean; errorHistorial: string;
}>({ sesion: null, cambiarSesion: () => {}, duracion: 60, cambiarDuracion: () => {}, ultimaActividad: null, registrarActividad: () => {}, actividades: [], historialListo: false, errorHistorial: '' });

// Acá armamos los datos que van a poder consultar todas las pantallas.

export function ProveedorSesion({ children }: React.PropsWithChildren) {
  const [sesion, cambiarSesion] = useState<Sesion | null>(null);
  const [duracion, cambiarDuracion] = useState(60);
  // Separamos Google por email. Sin Google, el historial es común a este teléfono.
  const key = !sesion ? '' : sesion.demo ? 'demo' : sesion.token
    ? 'workflow:history:v1:google:' + encodeURIComponent(sesion.email.toLowerCase())
    : 'workflow:history:v1:device';
  const [history, setHistory] = useState<{ key: string; items: Actividad[]; ready: boolean; writable: boolean }>({ key: '', items: [], ready: false, writable: false });
  const [errorHistorial, setHistoryError] = useState('');
  // Cuando cambia la cuenta, leemos su historial sin mezclarlo con el anterior.
  useEffect(() => {
    let active = true;
    setHistoryError('');
    if (!key || key === 'demo') {
      setHistory({ key, items: [], ready: true, writable: false });
      return;
    }
    // Esperamos los guardados pendientes antes de volver a leer la misma cuenta.
    writes.then(() => AsyncStorage.getItem(key)).then(raw => {
      if (active) setHistory({ key, items: leerHistorial(raw), ready: true, writable: true });
    }).catch(() => {
      if (active) {
        setHistory({ key, items: [], ready: true, writable: false });
        setHistoryError('No se pudo leer el historial. Los nuevos registros quedarán solo en esta sesión; reiniciá la app para volver a intentar.');
      }
    });
    return () => { active = false; };
  }, [key]);
  useEffect(() => {
    if (!key || history.key !== key || !history.ready || !history.writable) return;
    // Guardamos una copia completa; la cola evita que un guardado viejo pise al nuevo.
    const snapshot = JSON.stringify(history.items);
    writes = writes.then(() => AsyncStorage.setItem(key, snapshot)).catch(() => {
      setHistoryError('No se pudo guardar el historial en el teléfono. Los gráficos de esta sesión siguen disponibles.');
    });
  }, [key, history]);
  // Mientras carga otra cuenta, no mostramos registros de la sesión anterior.
  const historialListo = history.key === key && history.ready;
  const actividades = historialListo ? history.items : [];
  const registrarActividad = (value: Actividad | null) => {
    if (!value) return; // Cerrar sesión no borra el historial guardado.
    setHistory(previous => previous.key === key && previous.ready
      ? { ...previous, items: agregarActividad(previous.items, value) } : previous);
  };
  const ultimaActividad = actividades.length ? actividades[actividades.length - 1] : null;
  return <Context.Provider value={{ sesion, cambiarSesion, duracion, cambiarDuracion, ultimaActividad, registrarActividad, actividades, historialListo, errorHistorial }}>{children}</Context.Provider>;
}
export const usarSesion = () => useContext(Context);

