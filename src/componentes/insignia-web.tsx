// Esta insignia de la plantilla muestra el logo y la versión de Expo.
import { version } from 'expo/package.json';
import { Image } from 'expo-image';
import { useColorScheme, StyleSheet } from 'react-native';

import { TextoTematico } from './texto-tematico';
import { VistaTematica } from './vista-tematica';

import { Spacing } from '@/constantes/tema';

export function InsigniaWeb() {
  const scheme = useColorScheme();

  return (
    <VistaTematica style={styles.container}>
      <TextoTematico type="code" themeColor="textSecondary" style={styles.versionText}>
        v{version}
      </TextoTematico>
      <Image
        source={
          scheme === 'dark'
            ? require('@/assets/imagenes/expo-badge-white.png')
            : require('@/assets/imagenes/expo-badge.png')
        }
        style={styles.badgeImage}
      />
    </VistaTematica>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  versionText: {
    textAlign: 'center',
  },
  badgeImage: {
    width: 123,
    aspectRatio: 123 / 24,
  },
});
