// en estaparte escribiamos la actividad, cuando se hace y la guardabamos
import { useRef, useState } from 'react';
import { Keyboard, Linking, Platform, Pressable, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Boton, Campo, Pantalla, s } from '@/componentes/pantalla';
import { usarSesion } from '@/logica/sesion';
import { prepararEvento } from '@/logica/evento';
import { api } from '@/logica/cliente-api';
import { abrirCalendarioCelular } from '@/logica/calendario-celular';
import { categorias, Categoria } from '@/logica/estadisticas';
import { GraficosTiempo } from '@/componentes/graficos-tiempo';
import { SelectoresFechaHora } from '@/componentes/selectores-fecha-hora';
import { fechaLocalTexto } from '@/logica/fechas';

// Conservamos el evento enviado a android hasta que se confirma que la guardamos

export default function Actividades() {
  const { sesion, duracion, cambiarDuracion, ultimaActividad, registrarActividad, historialListo } = usarSesion();
  const [seccion, cambiarSeccion] = useState<'crear' | 'tiempo'>('crear');
  const [mensaje, cambiarMensaje] = useState('');
  const [category, setCategory] = useState<Categoria>('otros');
  const [text, setText] = useState('');
  const [date, setDate] = useState(() => fechaLocalTexto(new Date()));
  const [time, setTime] = useState('');
  const [destination, setDestination] = useState<'device' | 'google'>(sesion?.token || Platform.OS !== 'android' ? 'google' : 'device');
  const [vistaPrevia, cambiarVistaPrevia] = useState<ReturnType<typeof prepararEvento> | null>(null);
  const [esperandoConfirmacion, cambiarConfirmacion] = useState(false);
  const [error, cambiarError] = useState('');
  const [ocupado, cambiarOcupado] = useState(false);
  const bloqueo = useRef(false);
  // Si no elegimos como entrar, te mandamos al inicio
  if (!sesion) return <Redirect href="/" />;

  // Cuando terminamos, limpiamos el texto y la confirmación pendiente
  function limpiarBorrador() {
    cambiarVistaPrevia(null); setText(''); cambiarConfirmacion(false);
    cambiarMensaje('Actividad registrada. Podés verla en Mi tiempo.');
  }
  // Guardamos por una sola vía: calendario del celular o Google.
  async function guardarActividad() {
    if (!sesion || bloqueo.current || !historialListo) return;
    // Bloqueamos otro toque mientras se guarda para no mandar dos pedidos.
    bloqueo.current = true; cambiarOcupado(true); cambiarError(''); cambiarMensaje('');
    try {
      // Validamos al guardar. Los datos quedan congelados durante el envío.
      const evento = prepararEvento(text, date, time, duracion);
      Keyboard.dismiss();
      // El calendario nativo espera tu confirmación al volver.
      if (destination === 'device') {
        await abrirCalendarioCelular(evento);
        cambiarVistaPrevia(evento);
        cambiarConfirmacion(true);
      } else {
        if (!sesion.token) throw new Error('Conectá tu cuenta de Google desde Configuración.');
        // Google sí devuelve una respuesta de creación; recién después sumamos al historial.
        const result = await api('/events', evento, sesion.token);
        registrarActividad({ ...result, end: evento.end, category, destination: 'google' }); limpiarBorrador();
      }
    } catch (e) { cambiarError((e as Error).message); }
    finally { bloqueo.current = false; cambiarOcupado(false); }
  }

  // Desde acá dibujamos el formulario, la confirmación de Android y los gráficos.
  return <Pantalla key={`${seccion}-${vistaPrevia ? 'revision' : 'formulario'}-${esperandoConfirmacion}`}>
    <View style={s.encabezado}>
      <View style={{ flex: 1 }}>
        <Text style={s.brand}>WORKFLOW</Text>
        <Text style={s.muted}>Hola, {sesion.name}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir configuración de cuenta"
        disabled={ocupado || esperandoConfirmacion}
        onPress={() => { cambiarVistaPrevia(null); router.push('/configuracion'); }}
        style={s.chip}>
        <Text style={s.label}>Mi cuenta</Text>
      </Pressable>
    </View>
    <View style={[s.opciones, { justifyContent: 'space-between' }]}>
      <Opcion texto="＋ Nueva actividad" elegida={seccion === 'crear'}
        deshabilitada={ocupado || esperandoConfirmacion} alTocar={() => cambiarSeccion('crear')} />
      <Opcion texto="Mi tiempo" elegida={seccion === 'tiempo'}
        deshabilitada={ocupado || esperandoConfirmacion} alTocar={() => { Keyboard.dismiss(); cambiarSeccion('tiempo'); }} />
    </View>
    {!!mensaje && <View style={s.card}>
      <Text accessibilityLiveRegion="polite" style={s.success}>✓ {mensaje}</Text>
      {seccion === 'crear' && <Boton title="Ver mi tiempo" secondary onPress={() => cambiarSeccion('tiempo')} />}
    </View>}
    {seccion === 'crear' && <>
    <Text style={s.title}>{esperandoConfirmacion ? 'Terminá de guardar' : '¿Qué vas a hacer?'}</Text>
    {!esperandoConfirmacion ? <View pointerEvents={ocupado ? 'none' : 'auto'} style={{ gap: 18 }}>
      <Campo label="Actividad" editable={!ocupado} multiline textAlignVertical="top" style={{ minHeight: 88 }}
        placeholder="Por ejemplo: estudiar SQL" value={text} onChangeText={setText} maxLength={1000} />
      <Text style={s.label}>¿De qué se trata?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {categorias.map(item => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: category === item.id }}
          onPress={() => setCategory(item.id)} style={{ padding: 12, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: item.color, backgroundColor: category === item.id ? item.color : '#2A1C42' }}>
          <Text style={{ color: category === item.id ? '#180F2B' : '#FFFFFF', fontWeight: '600' }}>{item.label}</Text>
        </Pressable>)}
      </View>
      <Text style={s.label}>¿Cuándo?</Text>
      <SelectoresFechaHora date={date} time={time} onDateChange={setDate} onTimeChange={setTime}
        entreFechaYHora={<View style={{ gap: 12, paddingVertical: 12 }}>
          <Text style={s.muted}>Tiempo</Text>
          <View style={[s.opciones, { justifyContent: 'space-around' }]}>
            {[60, 30, 10].map(minutos => <Pressable key={minutos} accessibilityRole="radio"
              accessibilityState={{ checked: duracion === minutos }} onPress={() => cambiarDuracion(minutos)}
              style={[s.chip, { backgroundColor: 'transparent', borderColor: '#CEC1DD' }, duracion === minutos && s.chipElegido]}>
              <Text style={s.label}>{minutos === 60 ? '1 hora' : minutos + ' minutos'}</Text>
            </Pressable>)}
          </View>
        </View>} />
      <View style={s.card}>
        <Text style={s.label}>¿Dónde querés agendar?</Text>
        <View style={s.opciones}>
          {Platform.OS === 'android' && <Opcion texto="Mi celular" elegida={destination === 'device'} alTocar={() => setDestination('device')} />}
          {!!sesion.token && <Opcion texto="Google Calendar" elegida={destination === 'google'} alTocar={() => setDestination('google')} />}
        </View>
        {!sesion.token && <Text style={s.muted}>Podés conectar Google desde Mi cuenta.</Text>}
        {Platform.OS !== 'android' && <Text style={s.muted}>El calendario del celular está disponible en Android.</Text>}
      </View>
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      {!historialListo && <Text style={s.muted}>Cargando tu historial…</Text>}
      <Text style={s.muted}>{destination === 'device' ? 'Se abrirá el calendario de tu celular para guardar el evento.' : 'Se guardará en el calendario principal de tu cuenta de Google.'}</Text>
      <Boton title={ocupado ? 'Guardando…' : 'Guardar actividad'} onPress={guardarActividad} disabled={ocupado || !historialListo} />
    </View> : vistaPrevia && <View style={s.card}>
      <Text style={s.label}>¿Guardaste el evento en el calendario?</Text>
      <Text style={s.muted}>El calendario no siempre informa si guardaste o cancelaste. Confirmá lo que hiciste para evitar duplicados.</Text>
      <Text style={s.muted}>El gráfico usará el horario preparado en WorkFlow. Si lo cambiaste en el calendario, ese cambio no se sincroniza.</Text>
      <Boton title="Sí, ya lo guardé" disabled={!historialListo} onPress={() => { registrarActividad({ ...vistaPrevia, category, destination: 'device' }); limpiarBorrador(); }} />
      <Boton title="No lo guardé, volver a editar" secondary onPress={() => { cambiarConfirmacion(false); cambiarVistaPrevia(null); }} />
    </View>}
    {!!error && !!vistaPrevia && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    </>}
    {seccion === 'tiempo' && <>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <View style={s.card}>
      <Text style={s.label}>Última actividad</Text>
      {ultimaActividad ? <>
        <Text style={s.success}>{ultimaActividad.destination === 'device' ? '✓ Calendario del celular · Confirmado por vos' : '✓ Agendado en Google Calendar'}</Text>
        <Text style={s.label}>{ultimaActividad.summary}</Text>
        <Text style={s.muted}>{new Date(ultimaActividad.start).toLocaleString('es-AR')}</Text>
        {ultimaActividad.destination === 'google' && ultimaActividad.htmlLink && <Boton title="Ver en Google Calendar" secondary
          onPress={() => { Linking.openURL(ultimaActividad.htmlLink!).catch(() => cambiarError('No se pudo abrir el calendario.')); }} />}
      </> : <Text style={s.muted}>Todavía no hay actividades. Tu próximo paso empieza arriba.</Text>}
    </View>
    <GraficosTiempo />
    <Boton title="＋ Agendar otra actividad" onPress={() => cambiarSeccion('crear')} />
    </>}
  </Pantalla>;
}

// Una opción compacta deja claro qué elegiste y responde visualmente al toque.
function Opcion({ texto, elegida = false, deshabilitada = false, alTocar }: {
  texto: string;
  elegida?: boolean;
  deshabilitada?: boolean;
  alTocar: () => void;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: elegida, disabled: deshabilitada }}
    disabled={deshabilitada} onPress={alTocar}
    style={({ pressed }) => [s.chip, elegida && s.chipElegido, { opacity: deshabilitada ? 0.45 : pressed ? 0.65 : 1 }]}>
    <Text style={s.label}>{texto}</Text>
  </Pressable>;
}

