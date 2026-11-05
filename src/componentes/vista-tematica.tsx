// Este contenedor de la plantilla aplica el color de fondo del tema.
import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constantes/tema';
import { usarTema } from '@/funciones/usar-tema';

export type PropiedadesVistaTematica = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function VistaTematica({ style, lightColor, darkColor, type, ...otherProps }: PropiedadesVistaTematica) {
  const theme = usarTema();

  return <View style={[{ backgroundColor: theme[type ?? 'background'] }, style]} {...otherProps} />;
}
