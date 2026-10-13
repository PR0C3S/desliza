import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../src/components/Icon';
import { Button, Title, Wordmark } from '../../src/components/ui';
import { fmtBytes, fmtDate, fmtDuration } from '../../src/format';
import { useStore } from '../../src/store';
import { colors, fonts } from '../../src/theme';

const BAR = { del: '#E8644E', keep: '#3FBF86', share: '#5B8DEF', move: '#E0A030' };

export default function Resumen() {
  const insets = useSafeAreaInsets();
  const { lastSession: s, trash, totalFreed, selection, setSelection } = useStore();

  function anotherRandom() {
    setSelection({ kind: 'random', n: selection.kind === 'random' ? selection.n : 25, media: selection.media, heavy: selection.heavy });
    router.push('/deslizar');
  }

  if (!s || s.reviewed === 0) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 6 }]}>
        <View style={styles.pad}>
          <View style={styles.header}><Wordmark /></View>
          <Title size={30}>Resumen</Title>
        </View>
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Icon name="chart" size={28} color={colors.ink} /></View>
          <Text style={styles.emptyTitle}>Aún no hay sesiones</Text>
          <Text style={styles.sub}>Cuando revises tu primera tanda, verás aquí cuánto espacio liberas.</Text>
        </View>
        <View style={styles.footer}><Button label="Empezar ahora" icon="shuffle" onPress={anotherRandom} /></View>
      </View>
    );
  }

  const freed = s.photoBytes + s.videoBytes;
  const parts = (['del', 'keep', 'share', 'move'] as const).map((k) => ({ k, v: s[k] }));
  const total = Math.max(1, s.reviewed);
  const videoPct = freed ? (s.videoBytes / freed) * 100 : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6 }]}>
      <ScrollView contentContainerStyle={[styles.pad, { gap: 16, paddingBottom: 16 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Wordmark /></View>
        <View style={{ gap: 4 }}>
          <Title size={30}>Resumen</Title>
          <Text style={styles.sub}>Última sesión · {s.label} · {fmtDate(s.startedAt)}</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Espacio que recuperas</Text>
          <Text style={styles.heroNum}>{fmtBytes(freed)}</Text>
          <View style={styles.track}>
            <View style={{ width: `${videoPct}%`, backgroundColor: '#E8644E' }} />
            <View style={{ flex: 1, backgroundColor: freed ? '#F4B8AD' : colors.darkSoft }} />
          </View>
          <View style={styles.legend}>
            <Text style={styles.legendText}>● Videos · {fmtBytes(s.videoBytes)}</Text>
            <Text style={styles.legendText}>● Fotos · {fmtBytes(s.photoBytes)}</Text>
          </View>
          <View style={[styles.track, { marginTop: 4 }]}>
            {parts.map((p) => <View key={p.k} style={{ width: `${(p.v / total) * 100}%`, backgroundColor: BAR[p.k] }} />)}
          </View>
        </View>

        <View style={styles.stats}>
          {[
            { n: s.del, l: 'Eliminados', c: colors.delete },
            { n: s.keep, l: 'Guardados', c: colors.keep },
            { n: s.share, l: 'Enviados', c: colors.share },
            { n: s.move, l: 'Movidos', c: colors.move },
          ].map((x) => (
            <View key={x.l} style={styles.stat}>
              <Text style={[styles.statNum, { color: x.c }]}>{x.n}</Text>
              <Text style={styles.statLabel}>{x.l}</Text>
            </View>
          ))}
        </View>

        {trash.length > 0 ? (
          <View style={{ gap: 10 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.section}>En la papelera</Text>
              <Pressable accessibilityRole="link" onPress={() => router.navigate('/(tabs)/papelera')} hitSlop={10}>
                <Text style={styles.link}>Ver papelera</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {trash.slice(0, 3).map((t) => (
                <View key={t.id} style={styles.mini}>
                  <Image source={{ uri: t.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  {t.type === 'video' ? (
                    <View style={styles.dur}><Text style={styles.durText}>▶ {fmtDuration(t.duration)}</Text></View>
                  ) : null}
                  <View style={styles.size}><Text style={styles.sizeText}>{fmtBytes(t.size)}</Text></View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {totalFreed > 0 ? <Text style={styles.sub}>En total ya liberaste {fmtBytes(totalFreed)} con Desliza.</Text> : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Otra tanda al azar" icon="shuffle" onPress={anotherRandom} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: 20 },
  header: { height: 44, justifyContent: 'center', marginBottom: 12 },
  sub: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted },
  hero: { borderRadius: 28, backgroundColor: colors.dark, padding: 22, gap: 4 },
  heroLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.onDarkMuted },
  heroNum: { fontFamily: fonts.display, fontSize: 48, letterSpacing: -2, color: '#FFFFFF' },
  track: { marginTop: 10, height: 8, borderRadius: 4, backgroundColor: colors.darkSoft, flexDirection: 'row', overflow: 'hidden' },
  legend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendText: { fontFamily: fonts.body, fontSize: 13, color: colors.onDarkMuted },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, borderRadius: 18, backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 10, gap: 4 },
  statNum: { fontFamily: fonts.display, fontSize: 24 },
  statLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: '#4A4A52' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  section: { fontFamily: fonts.displaySemi, fontSize: 17, color: colors.ink },
  link: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.share },
  mini: { flex: 1, height: 110, borderRadius: 18, overflow: 'hidden', backgroundColor: '#D5D4CE' },
  dur: { position: 'absolute', right: 6, top: 6, height: 22, paddingHorizontal: 7, borderRadius: 11, backgroundColor: 'rgba(17,17,20,0.75)', justifyContent: 'center' },
  durText: { color: '#FFFFFF', fontFamily: fonts.bodyBold, fontSize: 11 },
  size: { position: 'absolute', left: 6, bottom: 6, height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: '#FFFFFF', justifyContent: 'center' },
  sizeText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.ink },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
});
