// Acá escribís la actividad, elegís cuándo hacerla, la revisás y decidís dónde guardarla.
import { useRef, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Boton, Campo, Pantalla, s } from '@/componentes/pantalla';
import { usarSesion } from '@/logica/sesion';
import { prepararEvento } from '@/logica/evento';
import { api } from '@/logica/cliente-api';
import { abrirCalendarioCelular } from '@/logica/calendario-celular';
import { categorias, Categoria } from '@/logica/estadisticas';
import { GraficosTiempo } from '@/componentes/graficos-tiempo';
import { SelectoresFechaHora } from '@/componentes/selectores-fecha-hora';

// Guardamos por separado el borrador, la vista previa y el destino elegido.

export default function Actividades() {
  const { sesion, duracion, ultimaActividad, registrarActividad, historialListo } = usarSesion();
  const [category, setCategory] = useState<Categoria>('otros');
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [destination, setDestination] = useState<'device' | 'google'>(Platform.OS === 'android' ? 'device' : 'google');
  const [vistaPrevia, cambiarVistaPrevia] = useState<ReturnType<typeof prepararEvento> | null>(null);
  const [esperandoConfirmacion, cambiarConfirmacion] = useState(false);
  const [error, cambiarError] = useState('');
  const [ocupado, cambiarOcupado] = useState(false);
  const bloqueo = useRef(false);
  // Si no elegiste cómo entrar, te mandamos al inicio.
  if (!sesion) return <Redirect href="/" />;

  // Acá armamos la vista previa. Todavía no estamos creando el evento.

  function revisarActividad() {
    cambiarError('');
    try { cambiarVistaPrevia(prepararEvento(text, date, time, duracion)); }
    catch (e) { cambiarError((e as Error).message); }
  }
  // Cuando terminamos, limpiamos el texto y la confirmación pendiente.
  function limpiarBorrador() {
    cambiarVistaPrevia(null); setText(''); cambiarConfirmacion(false);
  }
  // Guardamos por una sola vía: demo, calendario del celular o Google.
  async function guardarActividad() {
    if (!vistaPrevia || !sesion || bloqueo.current || !historialListo) return;
    // Bloqueamos otro toque mientras se guarda para no mandar dos pedidos.
    bloqueo.current = true; cambiarOcupado(true); cambiarError('');
    try {
      if (Date.parse(vistaPrevia.start) <= Date.now()) throw new Error('La hora elegida ya pasó. Editá la actividad.');
      // La demo solo registra la prueba; el calendario nativo espera tu confirmación al volver.
      if (sesion.demo) {
        registrarActividad({ ...vistaPrevia, category, destination: 'demo' }); limpiarBorrador();
      } else if (destination === 'device') {
        await abrirCalendarioCelular(vistaPrevia);
        cambiarConfirmacion(true);
      } else {
        if (!sesion.token) throw new Error('Conectá tu cuenta de Google desde Configuración.');
        // Google sí devuelve una respuesta de creación; recién después sumamos al historial.
        const result = await api('/events', vistaPrevia, sesion.token);
        registrarActividad({ ...result, end: vistaPrevia.end, category, destination: 'google' }); limpiarBorrador();
      }
    } catch (e) { cambiarError((e as Error).message); }
    finally { bloqueo.current = false; cambiarOcupado(false); }
  }

  // Desde acá dibujamos: actividad, categoría, fecha/hora, destino, resumen y gráficos.
  return <Pantalla>
    <Text style={s.brand}>TU ESPACIO</Text>
    <Text style={s.muted}>Hola, {sesion.name}</Text>
    <Text style={s.title}>¿Qué tenés{'\n'}que hacer?</Text>
    <Boton title="Configuración de cuenta" secondary disabled={ocupado || esperandoConfirmacion}
      onPress={() => { cambiarVistaPrevia(null); router.push('/configuracion'); }} />
    {sesion.demo && <Text style={s.success}>Modo demo · No se crea ningún evento real.</Text>}
    {!vistaPrevia ? <>
      <Campo label="Tu próxima actividad" multiline textAlignVertical="top" style={{ minHeight: 170 }}
        placeholder="Por ejemplo: estudiar SQL" value={text} onChangeText={setText} maxLength={1000} />
      <Text style={s.label}>Categoría para tus gráficos</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {categorias.map(item => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: category === item.id }}
          onPress={() => setCategory(item.id)} style={{ padding: 12, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: item.color, backgroundColor: category === item.id ? item.color : '#1A2042' }}>
          <Text style={{ color: category === item.id ? '#0D1230' : '#FFFFFF', fontWeight: '600' }}>{item.label}</Text>
        </Pressable>)}
      </View>
      <Text style={s.muted}>Elegí cuándo. Usamos la hora local de tu teléfono.</Text>
      <SelectoresFechaHora date={date} time={time} onDateChange={setDate} onTimeChange={setTime} />
      <Text style={s.muted}>Duración: {duracion} minutos · Cambiala en configuración.</Text>
      {!sesion.demo && <View style={s.card}>
        <Text style={s.label}>¿Dónde querés agendar?</Text>
        <Boton title={destination === 'device' ? '✓ Calendario del celular' : 'Calendario del celular'}
          secondary={destination !== 'device'} disabled={Platform.OS !== 'android'} onPress={() => setDestination('device')} />
        <Boton title={destination === 'google' ? '✓ Google Calendar' : 'Google Calendar'}
          secondary={destination !== 'google'} disabled={!sesion.token} onPress={() => setDestination('google')} />
        {!sesion.token && <Text style={s.muted}>Google es opcional. Para usarlo, conectá tu cuenta desde Configuración antes de preparar el evento.</Text>}
        {Platform.OS !== 'android' && <Text style={s.muted}>El calendario del celular está disponible en Android.</Text>}
      </View>}
      <Boton title="Revisar evento →" onPress={revisarActividad} />
    </> : esperandoConfirmacion ? <View style={s.card}>
      <Text style={s.label}>¿Guardaste el evento en el calendario?</Text>
      <Text style={s.muted}>El calendario no siempre informa si guardaste o cancelaste. Confirmá lo que hiciste para evitar duplicados.</Text>
      <Text style={s.muted}>El gráfico usará el horario preparado en WorkFlow. Si lo cambiaste en el calendario, ese cambio no se sincroniza.</Text>
      <Boton title="Sí, ya lo guardé" disabled={!historialListo} onPress={() => { registrarActividad({ ...vistaPrevia, category, destination: 'device' }); limpiarBorrador(); }} />
      <Boton title="No lo guardé, volver a editar" secondary onPress={() => { cambiarConfirmacion(false); cambiarVistaPrevia(null); }} />
    </View> : <View style={s.card}>
      <Text style={s.success}>LISTO PARA CONFIRMAR</Text>
      <Text style={s.label}>{vistaPrevia.summary}</Text>
      <Text style={s.muted}>{categorias.find(item => item.id === category)?.label}</Text>
      <Text style={s.muted}>{new Date(vistaPrevia.start).toLocaleString('es-AR')} · {duracion} min</Text>
      <Text style={s.muted}>{sesion.demo ? 'Prueba local' : destination === 'device' ? 'Calendario del celular · Elegí el calendario y tocá Guardar en la pantalla que se abre.' : `Calendario principal de ${sesion.email}`}</Text>
      {!sesion.demo && destination === 'device' && <Text style={s.muted}>Si elegís una cuenta de Google en el calendario del celular, puede sincronizarse con Google. No hace falta enviarlo otra vez.</Text>}
      {!historialListo && <Text style={s.muted}>Cargando historial…</Text>}
      <Boton title={ocupado ? 'Abriendo o agendando…' : sesion.demo ? 'Confirmar prueba' : destination === 'device' ? 'Abrir calendario del celular' : 'Confirmar en Google Calendar'} onPress={guardarActividad} disabled={ocupado || !historialListo} />
      <Boton title="Editar" secondary onPress={() => cambiarVistaPrevia(null)} disabled={ocupado} />
    </View>}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <View style={s.card}>
      <Text style={s.label}>Última actividad</Text>
      {ultimaActividad ? <>
        <Text style={s.success}>{ultimaActividad.destination === 'demo' ? '✓ Prueba guardada' : ultimaActividad.destination === 'device' ? '✓ Calendario del celular · Confirmado por vos' : '✓ Agendado en Google Calendar'}</Text>
        <Text style={s.label}>{ultimaActividad.summary}</Text>
        <Text style={s.muted}>{new Date(ultimaActividad.start).toLocaleString('es-AR')}</Text>
        {ultimaActividad.destination === 'google' && ultimaActividad.htmlLink && <Boton title="Ver en Google Calendar" secondary
          onPress={() => { Linking.openURL(ultimaActividad.htmlLink!).catch(() => cambiarError('No se pudo abrir el calendario.')); }} />}
      </> : <Text style={s.muted}>Todavía no hay actividades. Tu próximo paso empieza arriba.</Text>}
    </View>
    <GraficosTiempo />
  </Pantalla>;
}

