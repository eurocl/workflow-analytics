// Para entrar, escribís un email o conectás tu cuenta de Google.
import { useState } from 'react';
import { Text, View, Linking, Image } from 'react-native';
import { Redirect } from 'expo-router';
import { Boton, Campo, Pantalla, s } from '@/componentes/pantalla';
import { api } from '@/logica/cliente-api';
import { usarSesion } from '@/logica/sesion';
// Guardamos el estado del ingreso: si está conectando, si falta autorizar o si hubo un error.
export default function Inicio() {
  const { sesion, cambiarSesion } = usarSesion();
  const [pendiente, cambiarPendiente] = useState('');
  const [ocupado, cambiarOcupado] = useState(false);
  const [error, cambiarError] = useState('');
  const [email, cambiarEmail] = useState('');
  if (sesion) return <Redirect href="/actividades" />;
  // El correo identifica el perfil local. No pedimos contraseña ni verificamos su dueño.
  function ingresarConEmail() {
    const correo = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 254) {
      cambiarError('Escribí un email válido, por ejemplo nombre@gmail.com.');
      return;
    }
    cambiarError('');
    cambiarSesion({ token: '', name: correo.split('@')[0], email: correo, ingreso: 'email' });
  }
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
      cambiarSesion(result);
    } catch (e) { cambiarError((e as Error).message); }
    finally { cambiarOcupado(false); }
  }
  return <Pantalla clara>
    {/* Centramos el logo y conservamos sus proporciones en cualquier pantalla. */}
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Image source={require('../../assets/imagenes/logo-workflow.png')} accessibilityLabel="WorkFlow Analytics. Analizá tu tiempo. Viví mejor."
        resizeMode="contain" style={{ width: 280, height: 240, maxWidth: '100%' }} />
    </View>
    <View style={[s.card, { backgroundColor: '#FFFFFF', borderColor: '#DECFF0' }]}>
      <Text style={[s.label, { textAlign: 'center', color: '#35204D', fontSize: 14 }]}>Ingresar con email</Text>
      <Campo centrado ocultarEtiqueta label="Email" placeholder="nombre@gmail.com" value={email} onChangeText={cambiarEmail}
        keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
        autoComplete="email" editable={!ocupado} placeholderTextColor="#756383"
        style={{ backgroundColor: '#F7F2FC', borderColor: '#DECFF0', color: '#35204D' }} />
      <Boton title="Entrar" onPress={ingresarConEmail} disabled={ocupado} />
    </View>
    <View style={[s.card, { marginTop: 20, gap: 32, backgroundColor: '#FFFFFF', borderColor: '#DECFF0' }]}><Text style={[s.label, { textAlign: 'center', color: '#35204D', fontSize: 14 }]}>Google Calendar</Text><Boton verde title={ocupado ? 'Conectando…' : 'Continuar con Google'} onPress={conectarGoogle} disabled={ocupado} />
      {!!pendiente && <><Text style={[s.muted, { textAlign: 'center', color: '#756383' }]}>Autorizá en el navegador y volvé a la app.</Text><Boton title="Ya autoricé, continuar" onPress={terminarIngreso} disabled={ocupado} /></>}
    </View>
    {!!error && <Text accessibilityRole="alert" style={[s.error, { textAlign: 'center', color: '#B42335' }]}>{error}</Text>}
  </Pantalla>;
}

