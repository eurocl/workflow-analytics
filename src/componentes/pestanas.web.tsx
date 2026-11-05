// Son las pestañas de la plantilla para navegador; no forman parte de la navegación actual.
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, useColorScheme, View, StyleSheet } from 'react-native';

import { EnlaceExterno } from './enlace-externo';
import { TextoTematico } from './texto-tematico';
import { VistaTematica } from './vista-tematica';

import { Colors, MaxContentWidth, Spacing } from '@/constantes/tema';

export default function Pestanas() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <ListaPestanas>
          <TabTrigger name="home" href="/" asChild>
            <BotonPestana>Inicio</BotonPestana>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <BotonPestana>Explorar</BotonPestana>
          </TabTrigger>
        </ListaPestanas>
      </TabList>
    </Tabs>
  );
}

export function BotonPestana({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <VistaTematica
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <TextoTematico type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </TextoTematico>
      </VistaTematica>
    </Pressable>
  );
}

export function ListaPestanas(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <View {...props} style={styles.tabListContainer}>
      <VistaTematica type="backgroundElement" style={styles.innerContainer}>
        <TextoTematico type="smallBold" style={styles.brandText}>
          Plantilla Expo
        </TextoTematico>

        {props.children}

        <EnlaceExterno href="https://docs.expo.dev" asChild>
          <Pressable style={styles.externalPressable}>
            <TextoTematico type="link">Documentación</TextoTematico>
            <SymbolView
              tintColor={colors.text}
              name={{ ios: 'arrow.up.right.square', web: 'link' }}
              size={12}
            />
          </Pressable>
        </EnlaceExterno>
      </VistaTematica>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  externalPressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
    marginLeft: Spacing.three,
  },
});
