import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../src/components/Icon';
import { Body, Button, Title, Wordmark } from '../src/components/ui';
import { getPermission, requestPermission } from '../src/media';
import { colors, fonts } from '../src/theme';

const STEPS = Platform.OS === 'ios'
  ? ['Abre Ajustes › Desliza', 'Toca Fotos', 'Elige “Acceso total”']
  : ['Abre Ajustes › Aplicaciones › Desliza', 'Toca Permisos › Fotos y videos', 'Elige “Permitir siempre todo”'];

export default function SinPermiso() {
  const insets = useSafeAreaInsets();

  const check = useCallback(async () => {
    const p = await getPermission();
    if (p.granted || p.accessPrivileges === 'limited') router.replace('/(tabs)');
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => sub.remove();
  }, [check]);

  async function openSettings() {
    const p = await getPermission();
    if (p.canAskAgain && !p.granted) {
      const res = await requestPermission();
      if (res.granted || res.accessPrivileges === 'limited') return router.replace('/(tabs)');
    }
    Linking.openSettings();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <Wordmark />
      <View style={styles.center}>
        <View style={styles.badge}>
          <Icon name="lock" size={40} color={colors.subtle} stroke={1.8} />
        </View>
        <View style={{ gap: 10, alignItems: 'center' }}>
          <Title size={26} style={{ textAlign: 'center' }}>Sin acceso a tus fotos</Title>
          <Body style={{ textAlign: 'center', maxWidth: 300 }}>
            Desliza no puede mostrarte nada para revisar. Puedes activarlo cuando quieras en Ajustes.
          </Body>
        </View>
        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.step}>
              <View style={styles.num}><Text style={styles.numText}>{i + 1}</Text></View>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}
        </View>
      </View>
      <Button label="Abrir Ajustes" onPress={openSettings} height={58} />
      <Text style={styles.foot}>Todo se queda en tu teléfono. No subimos nada.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, gap: 16 },
  center: { flex: 1, justifyContent: 'center', gap: 22 },
  badge: {
    alignSelf: 'center', width: 96, height: 120, borderRadius: 20, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#111114', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 12 }, elevation: 4,
  },
  steps: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, gap: 12 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  stepText: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink2 },
  foot: { textAlign: 'center', fontFamily: fonts.body, fontSize: 13, color: colors.subtle },
});
