// Acá dibujamos la torta mensual y las barras del día, usando el historial de tu sesión.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { resumirTiempo, formatearMinutos } from '@/logica/estadisticas';
import { usarSesion } from '@/logica/sesion';
import { s } from './pantalla';

// Estas flechas te llevan al período anterior o al siguiente.

function NavegacionPeriodo({ label, previous, next, reset }: { label: string; previous: () => void; next: () => void; reset: () => void }) {
  return <View style={{ gap: 10 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Período anterior" onPress={previous} style={{ padding: 14 }}><Text style={s.success}>←</Text></Pressable>
      <Text style={[s.label, { flex: 1, textAlign: 'center', textTransform: 'capitalize' }]}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Período siguiente" onPress={next} style={{ padding: 14 }}><Text style={s.success}>→</Text></Pressable>
    </View>
    <Pressable accessibilityRole="button" onPress={reset} style={{ padding: 8, alignSelf: 'center' }}><Text style={s.success}>Volver al período actual</Text></Pressable>
  </View>;
}
// Cada porción ocupa el porcentaje que representa esa categoría.
function Torta({ rows }: { rows: ReturnType<typeof resumirTiempo> }) {
  const positive = rows.filter(row => row.minutes > 0);
  const total = positive.reduce((sum, row) => sum + row.minutes, 0);
  // Empezamos arriba del círculo y avanzamos según el porcentaje de cada categoría.
  let angle = -Math.PI / 2;
  return <Svg width="100%" height={220} viewBox="0 0 220 220" accessible accessibilityLabel={'Distribución mensual: ' + positive.map(r => r.label + ' ' + formatearMinutos(r.minutes)).join(', ')}>
    {positive.length === 1 ? <Circle cx={110} cy={110} r={96} fill={positive[0].color} /> : positive.map(row => {
      const start = angle; angle += row.minutes / total * Math.PI * 2;
      // Este recorrido SVG dibuja una porción desde el centro hasta el borde.
      const d = `M 110 110 L ${110 + 96 * Math.cos(start)} ${110 + 96 * Math.sin(start)} A 96 96 0 ${angle - start > Math.PI ? 1 : 0} 1 ${110 + 96 * Math.cos(angle)} ${110 + 96 * Math.sin(angle)} Z`;
      return <Path key={row.id} d={d} fill={row.color} stroke="#2A1C42" strokeWidth={2} />;
    })}
  </Svg>;
}
// Elegimos el día y el mes a consultar y preparamos los totales.
export function GraficosTiempo() {
  const { actividades, historialListo, errorHistorial, sesion } = usarSesion();
  const [month, setMonth] = useState(() => new Date());
  const [day, setDay] = useState(() => new Date());
  const monthly = resumirTiempo(actividades, month, 'month');
  const daily = resumirTiempo(actividades, day, 'day');
  const monthTotal = monthly.reduce((n, row) => n + row.minutes, 0);
  const dayTotal = daily.reduce((n, row) => n + row.minutes, 0);
  // La barra más larga marca el máximo del día; nunca dividimos por cero.
  const max = Math.max(1, ...daily.map(row => row.minutes));
  const moveMonth = (offset: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));
  const moveDay = (offset: number) => setDay(new Date(day.getFullYear(), day.getMonth(), day.getDate() + offset));
  return <View style={{ gap: 22 }}>
    <Text style={s.title}>Tu tiempo</Text>
    <Text style={s.muted}>Tiempo agendado por categoría, no tiempo realizado. Solo incluye actividades registradas desde esta versión de WorkFlow.</Text>
    <Text style={s.muted}>{sesion?.ingreso === 'email' ? `Historial local de ${sesion.email}.` : 'Historial de esta cuenta guardado en este teléfono.'}</Text>
    {!!errorHistorial && <Text accessibilityRole="alert" style={s.error}>{errorHistorial}</Text>}
    {!historialListo ? <Text style={s.muted}>Cargando historial…</Text> : <>
      <View style={s.card}>
        <Text style={s.label}>Distribución mensual</Text>
        <NavegacionPeriodo label={month.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })} previous={() => moveMonth(-1)} next={() => moveMonth(1)} reset={() => setMonth(new Date())} />
        <Text style={s.success}>{formatearMinutos(monthTotal)} agendados</Text>
        {monthTotal > 0 ? <>
          <Torta rows={monthly} />
          {monthly.filter(row => row.minutes > 0).map(row => <View key={row.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: row.color }} />
            <Text style={[s.muted, { flex: 1 }]}>{row.label}</Text>
            <Text style={s.label}>{formatearMinutos(row.minutes)} · {Math.round(row.minutes / monthTotal * 100)}%</Text>
          </View>)}
        </> : <Text style={s.muted}>No hay actividades registradas para este mes. Agendá una actividad o cambiá de mes.</Text>}
      </View>
      <View style={s.card}>
        <Text style={s.label}>Distribución del día</Text>
        <NavegacionPeriodo label={day.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })} previous={() => moveDay(-1)} next={() => moveDay(1)} reset={() => setDay(new Date())} />
        <Text style={s.success}>{formatearMinutos(dayTotal)} agendados</Text>
        {dayTotal > 0 ? daily.map(row => <View key={row.id} accessible accessibilityLabel={row.label + ': ' + formatearMinutos(row.minutes)} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={s.muted}>{row.label}</Text><Text style={s.label}>{formatearMinutos(row.minutes)}</Text></View>
          <View style={{ backgroundColor: '#4A3568', height: 16, borderRadius: 8, overflow: 'hidden' }}><View style={{ height: 16, width: `${row.minutes / max * 100}%`, backgroundColor: row.color, borderRadius: 8 }} /></View>
        </View>) : <Text style={s.muted}>No hay actividades registradas para este día. Usá las flechas para ver otra fecha.</Text>}
      </View>
      <Text style={s.muted}>Los horarios superpuestos se suman. Los eventos que cruzan medianoche se reparten entre días. No se importan cambios hechos fuera de WorkFlow.</Text>
    </>}
  </View>;
}

