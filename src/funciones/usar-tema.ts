// Acá elegimos los colores claros u oscuros de la plantilla según el sistema.
/**
 * Acá está la documentación del modo claro y oscuro:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constantes/tema';
import { useColorScheme } from '@/funciones/esquema-colores';

export function usarTema() {
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;

  return Colors[theme];
}
