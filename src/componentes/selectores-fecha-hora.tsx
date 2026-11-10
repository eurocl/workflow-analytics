// Acá abrimos el calendario y el selector de hora del celular. Cancelar conserva lo que ya elegiste.
import { useRef, useState } from 'react';
import { Keyboard, Modal, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { PropiedadesFechaHora, fechaLocalTexto, horaLocalTexto, valorSelector } from '@/logica/fechas';
import { Boton, s } from './pantalla';

// Mostramos los dos campos que se pueden tocar para elegir fecha y hora.

export function SelectoresFechaHora({ date, time, onDateChange, onTimeChange, entreFechaYHora }: PropiedadesFechaHora) {
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const [draft, setDraft] = useState(new Date());
  const [error, setError] = useState('');
  const opening = useRef(false);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const commit = (kind: 'date' | 'time', value: Date) => {
    if (kind === 'date') onDateChange(fechaLocalTexto(value));
    else onTimeChange(horaLocalTexto(value));
  };
  // Abrimos un solo selector a la vez para evitar ventanas superpuestas.
  function open(kind: 'date' | 'time') {
    if (opening.current) return;
    Keyboard.dismiss(); setError('');
    let value = valorSelector(date, time);
    if (kind === 'date' && value < today) value = today;
    if (Platform.OS === 'android') {
      opening.current = true;
      try {
        DateTimePickerAndroid.open({
          value, mode: kind, display: kind === 'date' ? 'calendar' : 'spinner',
          // En Android forzamos las 24 horas y no dejamos elegir días anteriores a hoy.
          is24Hour: true, minimumDate: kind === 'date' ? today : undefined,
          positiveButton: { label: 'Elegir' }, negativeButton: { label: 'Cancelar' },
          onChange: (event, selected) => {
            opening.current = false;
            // Cancelar no toca la selección anterior.
            if (event.type === 'set' && selected) commit(kind, selected);
          },
          onError: () => { opening.current = false; setError('No se pudo abrir el selector. Intentá nuevamente.'); },
        });
      } catch {
        opening.current = false; setError('No se pudo abrir el selector. Recargá el proyecto en Expo Go.');
      }
    } else { setDraft(value); setMode(kind); }
  }
  // Lo mostramos como día/mes/año, aunque por dentro conservamos año-mes-día.
  const dateLabel = date ? date.split('-').reverse().join('/') : 'Elegir fecha';
  return <View style={{ gap: 18 }}>
    <View style={{ gap: 8 }}>
      <Text style={s.label}>Fecha</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={'Elegir fecha: ' + dateLabel} onPress={() => open('date')} style={[s.input, { flexDirection: 'row', justifyContent: 'space-between' }]}>
        <Text style={s.label}>{dateLabel}</Text><Text style={s.success}>▾</Text>
      </Pressable>
    </View>
    {entreFechaYHora}
    <View style={{ gap: 8 }}>
      <Text style={s.label}>Hora · formato 24 horas</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={'Elegir hora: ' + (time || 'sin elegir')} onPress={() => open('time')} style={[s.input, { flexDirection: 'row', justifyContent: 'space-between' }]}>
        <Text style={s.label}>{time || 'Elegir hora'}</Text><Text style={s.success}>▾</Text>
      </Pressable>
    </View>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    {Platform.OS === 'ios' && mode && <Modal transparent animationType="slide" onRequestClose={() => setMode(null)}>
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#00000099', padding: 24 }}>
        <View style={s.card}>
          <Text style={s.label}>{mode === 'date' ? 'Elegí la fecha' : 'Elegí la hora'}</Text>
          <DateTimePicker value={draft} mode={mode} display="spinner" locale="es_ES" themeVariant="dark"
            minimumDate={mode === 'date' ? today : undefined}
            onChange={(_, selected) => { if (selected) setDraft(selected); }} />
          <Boton title="Elegir" onPress={() => { commit(mode, draft); setMode(null); }} />
          <Boton title="Cancelar" secondary onPress={() => setMode(null)} />
        </View>
      </View>
    </Modal>}
  </View>;
}

