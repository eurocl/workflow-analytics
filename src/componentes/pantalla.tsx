// Acá están los elementos que repetimos: pantalla con desplazamiento, botón, campo de texto y colores.
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Evitamos los bordes del teléfono y permitimos bajar por el contenido.
export function Pantalla({ children, clara = false }: React.PropsWithChildren<{ clara?: boolean }>) {
  return <SafeAreaView style={[s.page, clara && { backgroundColor: '#F7F2FC' }]}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, clara && { maxWidth: 512, paddingTop: 0, gap: 12 }]}>{children}</ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
// El mismo botón sirve para acciones principales y secundarias.
export function Boton({ title, onPress, disabled = false, secondary = false, verde = false }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean; verde?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, verde && { backgroundColor: '#176648' }, secondary && s.secondary, { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 }]}><Text style={s.buttonText}>{title}</Text></Pressable>;
}
// Juntamos la etiqueta y el campo para no repetirlos en cada pantalla.
export function Campo({ label, centrado = false, ocultarEtiqueta = false, ...props }: React.ComponentProps<typeof TextInput> & { label: string; centrado?: boolean; ocultarEtiqueta?: boolean }) {
  return <View style={{ gap: 8 }}>{!ocultarEtiqueta && <Text style={[s.label, centrado && { textAlign: 'center' }]}>{label}</Text>}<TextInput accessibilityLabel={label} placeholderTextColor="#AD9DBF" {...props} style={[s.input, centrado && { textAlign: 'center' }, props.style]} /></View>;
}
export const s = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#70558E', justifyContent: 'center', backgroundColor: '#2A1C42' },
  chipElegido: { backgroundColor: '#7540C8', borderColor: '#B89AFA' },
  page: { flex: 1, backgroundColor: '#180F2B' }, content: { padding: 26, gap: 22, width: '100%', maxWidth: 560, alignSelf: 'center', flexGrow: 1, paddingBottom: 44 },
  brand: { color: '#70E0AD', fontSize: 13, fontWeight: '700', letterSpacing: 3, marginTop: 18 },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', lineHeight: 39 },
  muted: { color: '#CEC1DD', fontSize: 15, lineHeight: 23 },
  label: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  input: { backgroundColor: '#2A1C42', borderWidth: 1, borderColor: '#4A3568', borderRadius: 14, padding: 16, color: '#FFFFFF', fontSize: 16 },
  card: { backgroundColor: '#2A1C42', borderRadius: 18, padding: 20, gap: 12, borderWidth: 1, borderColor: '#4A3568' },
  button: { backgroundColor: '#7540C8', borderRadius: 14, minHeight: 52, padding: 15, justifyContent: 'center', alignItems: 'center' },
  secondary: { backgroundColor: '#176648', borderWidth: 1, borderColor: '#70E0AD' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  error: { color: '#FFABB9', lineHeight: 22 }, success: { color: '#70E0AD', lineHeight: 22 },
});

