import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../src/components/Icon';
import { Button, Eyebrow, Title, Wordmark } from '../../src/components/ui';
import { FolderInfo, loadFolders, MediaFilter, Selection } from '../../src/media';
import { useStore } from '../../src/store';
import { colors, fonts } from '../../src/theme';

const SIZES = [10, 25, 50];
const MEDIA: { id: MediaFilter; label: string; noun: string }[] = [
  { id: 'all', label: 'Todo', noun: '' },
  { id: 'photo', label: 'Fotos', noun: 'fotos' },
  { id: 'video', label: 'Videos', noun: 'videos' },
];

function countLabel(f: FolderInfo, media: MediaFilter) {
  const p = `${f.photos} ${f.photos === 1 ? 'foto' : 'fotos'}`;
  const v = `${f.videos} ${f.videos === 1 ? 'video' : 'videos'}`;
  return media === 'photo' ? p : media === 'video' ? v : `${p} · ${v}`;
}

export default function Inicio() {
  const insets = useSafeAreaInsets();
  const { selection, setSelection, lastSession } = useStore();
  const returning = !!lastSession;

  const [media, setMedia] = useState<MediaFilter>(selection.media);
  const [heavy, setHeavy] = useState(selection.heavy);
  const [choice, setChoice] = useState<string>(selection.kind === 'folder' ? selection.albumId : 'random');
  const [n, setN] = useState(selection.kind === 'random' ? selection.n : 25);
  const [folders, setFolders] = useState<FolderInfo[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadFolders().then((f) => alive && setFolders(f)).catch(() => alive && setFolders([]));
      return () => {
        alive = false;
      };
    }, []),
  );

  const visibleFolders = (folders ?? []).filter((f) => (media === 'photo' ? f.photos : media === 'video' ? f.videos : f.photos + f.videos) > 0);
  const chosen = visibleFolders.find((f) => f.id === choice);
  const randomOn = choice === 'random' || !chosen;
  const noun = MEDIA.find((m) => m.id === media)!.noun;

  let cta = `Empezar · ${n}${noun ? ' ' + noun : ''} al azar`;
  if (!randomOn && chosen) {
    const same = selection.kind === 'folder' && selection.albumId === chosen.id;
    cta = (returning && same ? 'Seguir con ' : 'Empezar · ') + chosen.title;
  }

  function start() {
    const sel: Selection = randomOn || !chosen
      ? { kind: 'random', n, media, heavy }
      : { kind: 'folder', albumId: chosen.id, albumTitle: chosen.title, media, heavy };
    setSelection(sel);
    router.push('/deslizar');
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6 }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Wordmark /></View>

        <View style={{ gap: 6 }}>
          <Eyebrow color={returning ? colors.keep : colors.subtle}>{returning ? 'Hola de nuevo' : 'Para empezar'}</Eyebrow>
          <Title>¿Qué quieres revisar hoy?</Title>
          <Text style={styles.sub}>
            {returning ? 'Te dejamos marcado lo último que revisaste.' : 'Elige por dónde empezar. Puedes cambiarlo cuando quieras.'}
          </Text>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.segment} accessibilityRole="radiogroup" accessibilityLabel="Tipo de archivo">
            {MEDIA.map((m) => {
              const on = media === m.id;
              return (
                <Pressable key={m.id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setMedia(m.id)}
                  style={[styles.segBtn, on && styles.segBtnOn]}>
                  <Text style={styles.segText}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: heavy }} accessibilityLabel="Más pesados primero"
            onPress={() => setHeavy(!heavy)}
            style={[styles.heavy, heavy ? { backgroundColor: colors.dark, borderWidth: 0 } : null]}>
            <Icon name="sortHeavy" size={16} color={heavy ? '#FFFFFF' : colors.ink} />
            <Text style={[styles.heavyText, { color: heavy ? '#FFFFFF' : colors.ink }]}>Pesados primero</Text>
          </Pressable>
        </View>

        <Pressable accessibilityRole="radio" accessibilityState={{ checked: randomOn }} onPress={() => setChoice('random')}
          style={[styles.random, { borderColor: randomOn ? colors.dark : 'transparent' }]}>
          <View style={styles.randomRow}>
            <View style={styles.randomIcon}><Icon name="shuffle" size={20} color={colors.ink} /></View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.randomTitle}>Al azar</Text>
              <Text style={styles.randomSub}>Una tanda mezclada de toda tu galería</Text>
            </View>
            <View style={[styles.radio, randomOn ? { borderWidth: 7, borderColor: '#FFFFFF' } : { borderColor: colors.subtle }]} />
          </View>
          {randomOn ? (
            <View style={styles.sizes}>
              {SIZES.map((s) => {
                const on = n === s;
                return (
                  <Pressable key={s} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${s} elementos`}
                    onPress={() => { setN(s); setChoice('random'); }}
                    style={[styles.sizeBtn, { backgroundColor: on ? '#FFFFFF' : colors.darkSoft }]}>
                    <Text style={[styles.sizeText, { color: on ? colors.ink : '#FFFFFF' }]}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </Pressable>

        <Eyebrow>O una carpeta</Eyebrow>
        {folders === null ? (
          <ActivityIndicator color={colors.ink} style={{ marginVertical: 20 }} />
        ) : visibleFolders.length === 0 ? (
          <Text style={styles.sub}>No encontramos carpetas con {noun || 'fotos o videos'}.</Text>
        ) : (
          <View style={{ gap: 6 }}>
            {visibleFolders.map((f) => {
              const on = !randomOn && choice === f.id;
              return (
                <Pressable key={f.id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setChoice(f.id)}
                  style={[styles.folder, { borderColor: on ? colors.dark : colors.border, borderWidth: on ? 2 : 1 }]}>
                  {f.thumb ? <Image source={{ uri: f.thumb }} style={styles.thumb} contentFit="cover" /> : <View style={[styles.thumb, { backgroundColor: colors.surfaceAlt }]} />}
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={styles.folderName} numberOfLines={1}>{f.title}</Text>
                    <Text style={styles.folderCount} numberOfLines={1}>{countLabel(f, media)}</Text>
                  </View>
                  <View style={[styles.radio, on ? { borderWidth: 7, borderColor: colors.dark } : { borderColor: '#CFCEC8' }]} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button label={cta} iconRight="chevronRight" onPress={start} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  header: { height: 44, justifyContent: 'center' },
  sub: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  segment: { flex: 1, flexDirection: 'row', gap: 4, padding: 4, borderRadius: 22, backgroundColor: colors.track },
  segBtn: { flex: 1, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  segBtnOn: { backgroundColor: '#FFFFFF', shadowColor: '#111114', shadowOpacity: 0.14, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  segText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  heavy: {
    height: 46, paddingHorizontal: 12, borderRadius: 23, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF',
  },
  heavyText: { fontFamily: fonts.bodyBold, fontSize: 13 },
  random: { borderRadius: 20, borderWidth: 2, backgroundColor: colors.dark, padding: 14, paddingLeft: 16, gap: 12 },
  randomRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  randomIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  randomTitle: { fontFamily: fonts.display, fontSize: 17, color: '#FFFFFF' },
  randomSub: { fontFamily: fonts.body, fontSize: 13, color: colors.onDarkMuted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  sizes: { flexDirection: 'row', gap: 6 },
  sizeBtn: { flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sizeText: { fontFamily: fonts.bodyBold, fontSize: 14 },
  folder: { height: 58, borderRadius: 16, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 8, paddingRight: 14 },
  thumb: { width: 42, height: 42, borderRadius: 11 },
  folderName: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  folderCount: { fontFamily: fonts.body, fontSize: 12, color: colors.subtle },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, backgroundColor: colors.bg },
});
