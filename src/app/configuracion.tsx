// Acá mostramos tu cuenta y te dejamos cambiar la duración o cerrar sesión.
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Boton, Pantalla, s } from '@/componentes/pantalla';
import { usarSesion } from '@/logica/sesion';
import { api } from '@/logica/cliente-api';
// Leemos la cuenta activa y los ajustes que se pueden cambiar.
export default function Configuracion() {
  const { sesion, cambiarSesion, duracion, cambiarDuracion } = usarSesion();
  const [error, cambiarError] = useState('');
  const [ocupado, cambiarOcupado] = useState(false);
  if (!sesion) return <Redirect href="/" />;
  // Cerramos la sesión y volvemos al inicio; el historial guardado no se borra.
  async function cerrarSesion() {
    cambiarOcupado(true); cambiarError('');
    try {
      if (sesion!.token) await api('/auth/logout', {}, sesion!.token);
      cambiarSesion(null); cambiarDuracion(60); router.replace('/');
    } catch (e) { cambiarError((e as Error).message); }
    finally { cambiarOcupado(false); }
  }
  return <Pantalla><Boton title="← Volver a mi actividad" secondary onPress={() => router.replace('/actividades')} /><Text style={s.brand}>A TU MANERA</Text><Text style={s.title}>Configuración{'\n'}de cuenta</Text><View style={s.card}><Text style={s.label}>{sesion.name}</Text><Text style={s.muted}>{sesion.email}</Text></View><View style={s.card}><Text style={s.label}>Google Calendar</Text><Text style={sesion.token ? s.success : s.muted}>{sesion.token ? 'Conectado · Calendario principal' : 'Sin conectar · Opcional'}</Text>{!sesion.token && <Boton title="Conectar mi cuenta de Google" onPress={() => { cambiarSesion(null); router.replace('/'); }} />}</View><View style={s.card}><Text style={s.label}>Duración predeterminada</Text>{[30, 60, 90, 120].map(value => <Boton key={value} title={`${duracion === value ? '✓ ' : ''}${value} minutos`} secondary={duracion !== value} onPress={() => cambiarDuracion(value)} />)}</View><Text style={s.muted}>Los ajustes y la sesión se conservan mientras la app está abierta.</Text>{!!error && <Text style={s.error}>{error}</Text>}<Boton title={ocupado ? 'Cerrando…' : 'Cerrar sesión'} secondary onPress={cerrarSesion} disabled={ocupado} /></Pantalla>;
}


