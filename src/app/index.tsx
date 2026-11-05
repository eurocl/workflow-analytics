// Esta es la entrada: podés usar el calendario del celular, conectar Google o probar la demo.
import { useState } from 'react';
import { Text, View, Linking } from 'react-native';
import { Redirect } from 'expo-router';
import { Boton, Pantalla, s } from '@/componentes/pantalla';
import { api } from '@/logica/cliente-api';
import { usarSesion } from '@/logica/sesion';
// Guardamos el estado del ingreso: si está conectando, si falta autorizar o si hubo un error.
export default function Inicio() {
  const { sesion, cambiarSesion } = usarSesion();
  const [pendiente, cambiarPendiente] = useState('');
  const [ocupado, cambiarOcupado] = useState(false);
  const [error, cambiarError] = useState('');
  if (sesion) return <Redirect href="/actividades" />;
  // Pedimos un intento de acceso y abrimos el navegador para que autorices Google.
  async function conectarGoogle() {
    cambiarOcupado(true); cambiarError('');
    try {
      const result = await api('/auth/start', {});
      cambiarPendiente(result.pollToken);
      await Linking.openURL(result.url);
    } catch (e) { cambiarError((e as Error).message); }
    finally { cambiarOcupado(false); }
  }
  // Al volver del navegador, buscamos la sesión usando el código privado de ese intento.
  async function terminarIngreso() {
    cambiarOcupado(true); cambiarError('');
    try {
      const result = await api('/auth/finish', { pollToken: pendiente });
      if (result.pending) { cambiarError('Terminá la autorización en el navegador y volvé a tocar este botón.'); return; }
      cambiarSesion({ ...result, demo: false });
    } catch (e) { cambiarError((e as Error).message); }
    finally { cambiarOcupado(false); }
  }
  return <Pantalla>
    <Text style={s.brand}>WORKFLOW / ANALYTICS</Text>
    <View style={{ marginTop: 54, gap: 18 }}><Text style={[s.title, { fontSize: 42, lineHeight: 48 }]}>Menos vueltas.{'\n'}Más tiempo.</Text><Text style={s.muted}>Escribí lo que tenés que hacer y encontrale un lugar en tu agenda.</Text></View>
    <Boton title="Usar calendario del celular" onPress={() => cambiarSesion({ token: '', name: 'Invitado', email: 'Sin cuenta de Google conectada', demo: false, local: true })} disabled={ocupado} />
    <View style={[s.card, { marginTop: 18 }]}><Text style={s.label}>Google Calendar · Opcional</Text><Text style={s.muted}>Conectá Google si también querés poder guardar directamente en tu calendario principal.</Text><Boton title={ocupado ? 'Conectando…' : 'Continuar con Google'} onPress={conectarGoogle} disabled={ocupado} />
      {!!pendiente && <><Text style={s.muted}>Autorizá en el navegador y volvé a la app.</Text><Boton title="Ya autoricé, continuar" onPress={terminarIngreso} disabled={ocupado} secondary /></>}
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    </View>
    <Boton title="Explorar en modo demo" secondary onPress={() => cambiarSesion({ token: '', name: 'Invitado', email: 'Modo demo', demo: true })} disabled={ocupado} />
    <Text style={[s.muted, { textAlign: 'center', fontSize: 12 }]}>Vos confirmás cada evento antes de agendarlo.</Text>
  </Pantalla>;
}

