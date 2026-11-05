// Acá abrimos el calendario de Android con la actividad preparada. Vos confirmás el guardado allí.
import { Platform } from 'react-native';
import type { prepararEvento } from './evento';

// Mandamos el título y los horarios al editor de eventos de Android.

export async function abrirCalendarioCelular(event: ReturnType<typeof prepararEvento>) {
  if (Platform.OS !== 'android') throw new Error('El calendario del celular está disponible en Android. En esta plataforma podés usar Google Calendar.');
  const { startActivityAsync } = await import('expo-intent-launcher');
  try {
    await startActivityAsync('android.intent.action.INSERT', {
      data: 'content://com.android.calendar/events',
      type: 'vnd.android.cursor.dir/event',
      extra: {
        title: event.summary,
        beginTime: Date.parse(event.start),
        endTime: Date.parse(event.end),
      },
    });
  } catch {
    throw new Error('No se pudo abrir el calendario. Verificá que tengas una aplicación de calendario instalada y configurada.');
  }
  // El calendario no siempre informa si guardaste o cancelaste.
  // Por eso te preguntamos al volver: cerrar el editor no demuestra que guardaste.
}
