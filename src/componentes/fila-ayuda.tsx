// Esta fila de ejemplo muestra una sugerencia y un fragmento de texto de la plantilla.
import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { TextoTematico } from './texto-tematico';
import { VistaTematica } from './vista-tematica';

import { Spacing } from '@/constantes/tema';

type HintRowProps = {
  title?: string;
  hint?: ReactNode;
};

export function FilaAyuda({ title = 'Probá editar', hint = 'app/index.tsx' }: HintRowProps) {
  return (
    <View style={styles.stepRow}>
      <TextoTematico type="small">{title}</TextoTematico>
      <VistaTematica type="backgroundSelected" style={styles.codeSnippet}>
        <TextoTematico themeColor="textSecondary">{hint}</TextoTematico>
      </VistaTematica>
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeSnippet: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
});
