// base de todas las pantallas: sesión compartida, barra superior y navegacion
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ProveedorSesion } from '@/logica/sesion';
export default function Layout() {
  return <ProveedorSesion><StatusBar style="light" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#180F2B' } }} /></ProveedorSesion>;
}

