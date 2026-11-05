// Acá están los elementos que repetimos: pantalla con desplazamiento, botón, campo de texto y colores.
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Evitamos los bordes del teléfono y permitimos bajar por el contenido.
export function Pantalla({ children }: React.PropsWithChildren) {
  return <SafeAreaView style={s.page}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>{children}</ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
// El mismo botón sirve para acciones principales y secundarias.
export function Boton({ title, onPress, disabled = false, secondary = false }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 }]}><Text style={s.buttonText}>{title}</Text></Pressable>;
}
// Juntamos la etiqueta y el campo para no repetirlos en cada pantalla.
export function Campo({ label, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) {
  return <View style={{ gap: 8 }}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor="#8B90A5" {...props} style={[s.input, props.style]} /></View>;
}
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0D1230' }, content: { padding: 26, gap: 22, width: '100%', maxWidth: 560, alignSelf: 'center', flexGrow: 1, paddingBottom: 44 },
  brand: { color: '#61E6D2', fontSize: 13, fontWeight: '700', letterSpacing: 3, marginTop: 18 },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', lineHeight: 39 },
  muted: { color: '#B9BED2', fontSize: 15, lineHeight: 23 },
  label: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  input: { backgroundColor: '#1A2042', borderWidth: 1, borderColor: '#30375F', borderRadius: 14, padding: 16, color: '#FFFFFF', fontSize: 16 },
  card: { backgroundColor: '#1A2042', borderRadius: 18, padding: 20, gap: 12, borderWidth: 1, borderColor: '#30375F' },
  button: { backgroundColor: '#536DFE', borderRadius: 14, minHeight: 52, padding: 15, justifyContent: 'center', alignItems: 'center' },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#424A75' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  error: { color: '#FFABB9', lineHeight: 22 }, success: { color: '#61E6D2', lineHeight: 22 },
});

