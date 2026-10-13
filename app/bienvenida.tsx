import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../src/components/Icon';
import { Logo } from '../src/components/Logo';
import { Body, Button, Card, Title, Wordmark } from '../src/components/ui';
import { requestPermission } from '../src/media';
import { useStore } from '../src/store';
import { colors, fonts } from '../src/theme';

export default function Bienvenida() {
  const insets = useSafeAreaInsets();
  const { setOnboarded } = useStore();
  const [asking, setAsking] = useState(false);

  async function allow() {
    setAsking(true);
    try {
      const res = await requestPermission();
      setOnboarded();
      const ok = res.granted || res.accessPrivileges === 'limited';
      router.replace(ok ? '/(tabs)' : '/sin-permiso');
    } finally {
      setAsking(false);
    }
  }

  function later() {
    setOnboarded();
    router.replace('/sin-permiso');
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Wordmark />
        <View style={styles.hero} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.pill, { left: 0, backgroundColor: colors.delete }]}><Text style={styles.pillText}>← Eliminar</Text></View>
          <Logo size={190} />
          <View style={[styles.pill, { right: 0, backgroundColor: colors.keep }]}><Text style={styles.pillText}>Mantener →</Text></View>
        </View>
        <View style={{ gap: 10 }}>
          <Title size={30}>Tu galería, en orden con un dedo.</Title>
          <Body>Para mostrarte tus fotos y videos uno a uno, Desliza necesita acceso a tu galería.</Body>
        </View>
        <Card style={{ gap: 12 }}>
          <View style={styles.row}>
            <Icon name="lock" size={20} color={colors.keep} />
            <Text style={styles.rowText}>Todo se queda en tu teléfono. No subimos nada.</Text>
          </View>
          <View style={styles.row}>
            <Icon name="undo" size={20} color={colors.keep} />
            <Text style={styles.rowText}>Nada se borra al momento: lo eliminado espera 30 días en la papelera.</Text>
          </View>
        </Card>
      </ScrollView>
      <View style={{ gap: 6, paddingHorizontal: 20 }}>
        <Button label="Permitir acceso a fotos y videos" onPress={allow} loading={asking} height={58} />
        <Button label="Ahora no" variant="ghost" height={48} onPress={later} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, gap: 22, paddingBottom: 16 },
  hero: { height: 280, alignItems: 'center', justifyContent: 'center' },
  pill: { position: 'absolute', top: 122, height: 34, paddingHorizontal: 12, borderRadius: 17, justifyContent: 'center', zIndex: 2 },
  pillText: { color: '#FFFFFF', fontFamily: fonts.bodyBold, fontSize: 13 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  rowText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.ink2 },
});
