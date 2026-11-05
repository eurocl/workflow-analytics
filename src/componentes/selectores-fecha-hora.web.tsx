// Esta versión se usa en el navegador: calendario HTML y listas de horas y minutos en formato 24 horas.
import { Text, View } from 'react-native';
import { PropiedadesFechaHora, fechaLocalTexto } from '@/logica/fechas';
import { s } from './pantalla';
const style = { color: '#FFFFFF', backgroundColor: '#1A2042', border: '1px solid #30375F', borderRadius: 14, padding: 16, fontSize: 16, colorScheme: 'dark', minWidth: 0 };
// Mostramos los dos campos que se pueden tocar para elegir fecha y hora.
export function SelectoresFechaHora({ date, time, onDateChange, onTimeChange }: PropiedadesFechaHora) {
  const [hour, minute] = time.split(':');
  return <View style={{ gap: 18 }}>
    <View style={{ gap: 8 }}><Text style={s.label}>Fecha</Text>
      <input aria-label="Elegir fecha" type="date" value={date} min={fechaLocalTexto(new Date())} onChange={e => onDateChange(e.target.value)} style={style} />
    </View>
    <View style={{ gap: 8 }}><Text style={s.label}>Hora · formato 24 horas</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <select aria-label="Hora de 00 a 23" value={hour || ''} onChange={e => onTimeChange(e.target.value + ':' + (minute || '00'))} style={{ ...style, flex: 1 }}>
          <option value="" disabled>Hora</option>
          {Array.from({ length: 24 }, (_, n) => String(n).padStart(2, '0')).map(value => <option key={value} value={value}>{value}</option>)}
        </select>
        <select aria-label="Minutos de 00 a 59" value={minute || ''} onChange={e => onTimeChange((hour || '00') + ':' + e.target.value)} style={{ ...style, flex: 1 }}>
          <option value="" disabled>Minutos</option>
          {Array.from({ length: 60 }, (_, n) => String(n).padStart(2, '0')).map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </View>
    </View>
  </View>;
}

