import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { runOnJS, SharedValue, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../src/components/Icon';
import { MoveSheet } from '../src/components/MoveSheet';
import { BackCard, dirOf, strengthOf, SwipeCard } from '../src/components/SwipeCard';
import { Button, RoundButton } from '../src/components/ui';
import { fmtBytes } from '../src/format';
import { fileSize, loadDeck, localUri, MediaItem, moveToAlbum, Selection } from '../src/media';
import { selectionLabel, SessionKind, useStore } from '../src/store';
import { actionColor, colors, Direction, fonts } from '../src/theme';

type Hist = { item: MediaItem; kind: SessionKind; size: number; index: number; undoable: boolean };

function tagFor(item: MediaItem, prev?: MediaItem): string | undefined {
  const name = item.filename.toLowerCase();
  if (/screenshot|captura|screen_?shot|screen recording|grabaci/.test(name)) return 'Captura de pantalla';
  if (item.type === 'video' && item.duration > 0 && item.duration < 3) return 'Video muy corto';
  if (prev && prev.type === item.type && Math.abs(prev.creationTime - item.creationTime) < 3000 && prev.width === item.width && prev.height === item.height) {
    return 'Posible duplicado';
  }
  return undefined;
}

function ActionButton({ dir, icon, label, big, onPress, tx, ty, disabled }: {
  dir: Direction; icon: IconName; label: string; big?: boolean; onPress: () => void;
  tx: SharedValue<number>; ty: SharedValue<number>; disabled?: boolean;
}) {
  const size = big ? 68 : 52;
  const color = actionColor[dir];
  const fill = useAnimatedStyle(() => {
    const on = dirOf(tx.value, ty.value) === dir && strengthOf(tx.value, ty.value) > 0.15;
    return { opacity: on ? 1 : 0 };
  });
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.action, { width: big ? 76 : 64 }]}>
      <View style={[styles.actionCircle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Icon name={icon} size={big ? 28 : 22} color={color} stroke={big ? 2.5 : 2.2} />
        <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }, fill]}>
          <Icon name={icon} size={big ? 28 : 22} color="#FFFFFF" stroke={big ? 2.5 : 2.2} />
        </Animated.View>
      </View>
      <Text style={styles.actionLabel}>{label.split(' (')[0]}</Text>
    </Pressable>
  );
}

const COACH = [
  { dir: 'up' as Direction, text: '↑ Compartir', style: { top: 18, alignSelf: 'center' as const } },
  { dir: 'left' as Direction, text: '← Eliminar', style: { top: '42%' as const, left: 12 } },
  { dir: 'right' as Direction, text: 'Mantener →', style: { top: '42%' as const, right: 12 } },
  { dir: 'down' as Direction, text: '↓ Mover', style: { bottom: 110, alignSelf: 'center' as const } },
];

export default function Deslizar() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const store = useStore();
  const storeRef = useRef(store);
  storeRef.current = store;
  const sel = store.selection;

  const [deck, setDeck] = useState<MediaItem[] | null>(null);
  const [i, setI] = useState(0);
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; undo: boolean } | null>(null);
  const [areaH, setAreaH] = useState(0);
  const [coach, setCoach] = useState(!store.coachSeen);
  const history = useRef<Hist[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const cardW = width - 40;
  const cardH = Math.max(200, areaH - 12);
  const cur = deck?.[i];
  const next = deck?.[i + 1];

  const load = useCallback(async (s: Selection) => {
    const st = storeRef.current;
    setDeck(null);
    setI(0);
    history.current = [];
    tx.value = 0;
    ty.value = 0;
    const exclude: Record<string, 1> = { ...st.reviewed };
    st.trash.forEach((t) => { exclude[t.id] = 1; });
    let d: MediaItem[] = [];
    try {
      d = await loadDeck(s, exclude);
    } catch {
      d = [];
    }
    setDeck(d);
    st.startSession(selectionLabel(s));
  }, [tx, ty]);

  useEffect(() => {
    load(storeRef.current.selection);
  }, [load]);

  // Peso del archivo actual y del siguiente (para mostrarlo y para el resumen).
  useEffect(() => {
    [cur, next].forEach((m) => {
      if (m && sizes[m.id] === undefined) {
        fileSize(m.id).then((b) => setSizes((s) => ({ ...s, [m.id]: b })));
      }
    });
  }, [cur, next, sizes]);

  function showToast(msg: string, undo: boolean) {
    setToast({ msg, undo });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  function dismissCoach() {
    if (!coach) return;
    setCoach(false);
    store.setCoachSeen();
  }

  function snap() {
    tx.value = withSpring(0, { damping: 18, stiffness: 180 });
    ty.value = withSpring(0, { damping: 18, stiffness: 180 });
  }

  function advance() {
    setI((v) => v + 1);
    requestAnimationFrame(() => {
      tx.value = 0;
      ty.value = 0;
      setBusy(false);
    });
  }

  function fly(dir: Direction, after: () => void) {
    setBusy(true);
    const x = dir === 'left' ? -width * 1.6 : dir === 'right' ? width * 1.6 : 0;
    const y = dir === 'up' ? -height : dir === 'down' ? height : ty.value;
    tx.value = withTiming(x, { duration: 260 });
    ty.value = withTiming(y, { duration: 260 }, (finished) => {
      if (finished) runOnJS(after)();
    });
  }

  function commit(kind: SessionKind, item: MediaItem, size: number, msg: string, undoable = true) {
    history.current.push({ item, kind, size, index: i, undoable });
    store.record(kind, item, size);
    advance();
    showToast(msg, undoable);
  }

  async function doDelete() {
    if (!cur || busy) return;
    const item = cur;
    dismissCoach();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const size = sizes[item.id] ?? 0;
    fly('left', () => {
      store.addToTrash({ ...item, trashedAt: Date.now(), size });
      commit('del', item, size, 'Enviado a la papelera');
      if (!size) fileSize(item.id).then((b) => b && store.addToTrash({ ...item, trashedAt: Date.now(), size: b }));
    });
  }

  function doKeep() {
    if (!cur || busy) return;
    const item = cur;
    dismissCoach();
    Haptics.selectionAsync().catch(() => {});
    fly('right', () => {
      store.markReviewed(item.id);
      commit('keep', item, 0, 'Guardado');
    });
  }

  async function doShare() {
    if (!cur || busy) return;
    const item = cur;
    dismissCoach();
    snap();
    setBusy(true);
    try {
      const uri = await localUri(item.id);
      if (!uri || !(await Sharing.isAvailableAsync())) throw new Error('no-share');
      // Menú nativo de compartir del teléfono.
      await Sharing.shareAsync(uri, { dialogTitle: 'Compartir' });
    } catch {
      setBusy(false);
      Alert.alert('No se pudo compartir', 'Inténtalo de nuevo en un momento.');
      return;
    }
    fly('up', () => {
      store.markReviewed(item.id);
      commit('share', item, 0, 'Compartido');
    });
  }

  function openMove() {
    if (!cur || busy) return;
    dismissCoach();
    snap();
    setMoveOpen(true);
  }

  async function doMove(target: { id?: string; newName?: string; title: string }) {
    if (!cur) return;
    const item = cur;
    setMoveOpen(false);
    setBusy(true);
    try {
      await moveToAlbum(item.id, target, sel.kind === 'folder' ? sel.albumId : undefined);
    } catch {
      setBusy(false);
      Alert.alert('No se pudo mover', 'Revisa que Desliza tenga permiso para modificar tu galería.');
      return;
    }
    fly('down', () => {
      store.markReviewed(item.id);
      commit('move', item, 0, 'Movido a ' + target.title, false);
    });
  }

  function decide(dir: Direction | null) {
    if (!dir || !cur || busy) return snap();
    if (dir === 'left') return doDelete();
    if (dir === 'right') return doKeep();
    if (dir === 'up') return doShare();
    return openMove();
  }

  function undo() {
    const h = history.current[history.current.length - 1];
    if (!h || busy) return;
    if (!h.undoable) {
      showToast('Mover no se puede deshacer desde aquí', false);
      return;
    }
    history.current.pop();
    if (h.kind === 'del') store.restore([h.item.id]);
    else store.unmarkReviewed(h.item.id);
    store.unrecord(h.kind, h.item, h.size);
    tx.value = 0;
    ty.value = 0;
    setI(h.index);
    setToast(null);
  }

  function goHome() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  const total = deck?.length ?? 0;
  const ses = store.lastSession;
  const freed = ses ? ses.photoBytes + ses.videoBytes : 0;
  const mediaHead = sel.media === 'photo' ? 'Solo fotos' : sel.media === 'video' ? 'Solo videos' : 'Fotos y videos';
  const disabled = !cur || busy;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <View style={styles.headRow}>
          <RoundButton icon="back" label="Salir al inicio" onPress={goHome} />
          <View style={styles.pill}>
            <View style={styles.pillIcon}><Icon name={sel.kind === 'random' ? 'shuffle' : 'folder'} size={18} color="#FFFFFF" stroke={2} /></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.pillHead} numberOfLines={1}>{mediaHead}</Text>
              <Text style={styles.pillTitle} numberOfLines={1}>{selectionLabel(sel)}</Text>
            </View>
          </View>
          {sel.kind === 'random' ? <RoundButton icon="refresh" label="Mezclar otra tanda" onPress={() => load(sel)} /> : null}
          <RoundButton icon="undo" label="Deshacer última acción" onPress={undo} />
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${total ? (Math.min(i, total) / total) * 100 : 0}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.min(i + 1, total)}/{total}</Text>
          <Pressable accessibilityRole="link" accessibilityLabel={`Papelera, ${fmtBytes(freed)} para liberar`} onPress={() => router.navigate('/(tabs)/papelera')} style={styles.trashChip}>
            <Icon name="trash" size={13} color={colors.deleteInk} stroke={2.4} />
            <Text style={styles.trashChipText}>{fmtBytes(freed)}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.area} onLayout={(e) => setAreaH(e.nativeEvent.layout.height)}>
        {deck === null || areaH === 0 ? (
          <ActivityIndicator color={colors.ink} style={{ marginTop: 80 }} />
        ) : total === 0 ? (
          <View style={[styles.panel, { width: cardW, height: cardH }]}>
            <Text style={styles.panelTitle}>Nada que revisar aquí</Text>
            <Text style={styles.panelText}>No quedan {sel.media === 'photo' ? 'fotos' : sel.media === 'video' ? 'videos' : 'fotos ni videos'} sin revisar en esta selección.</Text>
            <Button label="Cambiar selección" onPress={goHome} />
          </View>
        ) : !cur ? (
          <View style={[styles.panel, { width: cardW, height: cardH }]}>
            <View style={styles.doneIcon}><Icon name="check" size={28} color={colors.keep} stroke={2.4} /></View>
            <Text style={styles.panelTitle}>Tanda terminada</Text>
            <Text style={styles.panelText}>Liberas {fmtBytes(freed)} al vaciar la papelera. Lo eliminado espera 30 días por si cambias de idea.</Text>
            <Button label="Ver resumen" onPress={() => router.replace('/(tabs)/resumen')} />
            <Button label="Otra tanda al azar" variant="light" height={48} onPress={() => {
              const s: Selection = { kind: 'random', n: 25, media: sel.media, heavy: sel.heavy };
              store.setSelection(s);
              load(s);
            }} />
          </View>
        ) : (
          <>
            {next ? <BackCard key={'b' + next.id} item={next} width={cardW} height={cardH} /> : null}
            <SwipeCard
              key={cur.id}
              item={cur}
              tx={tx}
              ty={ty}
              width={cardW}
              height={cardH}
              folderName={sel.kind === 'folder' ? sel.albumTitle : undefined}
              size={sizes[cur.id]}
              tag={tagFor(cur, deck[i - 1])}
              enabled={!busy && !moveOpen}
              onDecide={decide}
              onDragStart={dismissCoach}
            />
            {coach && i === 0 ? (
              <View pointerEvents="none" style={[styles.coach, { width: cardW, height: cardH }]}>
                {COACH.map((c) => (
                  <View key={c.dir} style={[styles.coachPill, { backgroundColor: actionColor[c.dir] }, c.style]}>
                    <Text style={styles.coachText}>{c.text}</Text>
                  </View>
                ))}
                <View style={styles.coachCenter}><Text style={styles.coachCenterText}>Arrastra la foto para decidir</Text></View>
              </View>
            ) : null}
          </>
        )}
      </View>

      <View style={[styles.nav, { paddingBottom: insets.bottom + 14 }]}>
        <ActionButton dir="left" icon="x" label="Eliminar (deslizar a la izquierda)" big onPress={doDelete} tx={tx} ty={ty} disabled={disabled} />
        <ActionButton dir="down" icon="folderDown" label="Mover (deslizar hacia abajo)" onPress={openMove} tx={tx} ty={ty} disabled={disabled} />
        <ActionButton dir="up" icon="share" label="Compartir (deslizar hacia arriba)" onPress={doShare} tx={tx} ty={ty} disabled={disabled} />
        <ActionButton dir="right" icon="check" label="Mantener (deslizar a la derecha)" big onPress={doKeep} tx={tx} ty={ty} disabled={disabled} />
      </View>

      {toast ? (
        <View accessibilityLiveRegion="polite" style={[styles.toast, { bottom: insets.bottom + 120 }]}>
          <Text style={styles.toastText} numberOfLines={1}>{toast.msg}</Text>
          {toast.undo ? (
            <Pressable accessibilityRole="button" onPress={undo} style={styles.toastBtn}>
              <Text style={styles.toastBtnText}>Deshacer</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <MoveSheet
        visible={moveOpen}
        excludeAlbumId={sel.kind === 'folder' ? sel.albumId : undefined}
        isVideo={cur?.type === 'video'}
        onClose={() => setMoveOpen(false)}
        onPick={doMove}
      />
    </View>
  );
}

const shadow = { shadowColor: '#111114', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 3 };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, gap: 14 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: {
    flex: 1, minWidth: 0, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingLeft: 6, paddingRight: 14,
  },
  pillIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  pillHead: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.subtle },
  pillTitle: { fontFamily: fonts.displaySemi, fontSize: 15, color: colors.ink },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.line, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.ink },
  progressText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink2 },
  trashChip: { height: 28, paddingHorizontal: 10, borderRadius: 14, backgroundColor: colors.deleteSoft, flexDirection: 'row', alignItems: 'center', gap: 5 },
  trashChipText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.deleteInk },
  area: { flex: 1, marginTop: 16, alignItems: 'center' },
  panel: { borderRadius: 32, backgroundColor: '#FFFFFF', padding: 28, justifyContent: 'center', gap: 16 },
  panelTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, letterSpacing: -0.5 },
  panelText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.muted },
  doneIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.keepSoft, alignItems: 'center', justifyContent: 'center' },
  coach: { position: 'absolute' },
  coachPill: { position: 'absolute', height: 36, paddingHorizontal: 12, borderRadius: 18, justifyContent: 'center', ...shadow },
  coachText: { color: '#FFFFFF', fontFamily: fonts.bodyBold, fontSize: 13 },
  coachCenter: {
    position: 'absolute', top: '58%', alignSelf: 'center', height: 40, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: 'rgba(17,17,20,0.82)', justifyContent: 'center',
  },
  coachCenterText: { color: '#FFFFFF', fontFamily: fonts.bodySemi, fontSize: 14 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 22, paddingTop: 14 },
  action: { alignItems: 'center', gap: 6 },
  actionCircle: { backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...shadow },
  actionLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink2 },
  toast: {
    position: 'absolute', left: 20, right: 20, height: 52, borderRadius: 26, backgroundColor: colors.dark,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 6, ...shadow,
  },
  toastText: { flex: 1, color: '#FFFFFF', fontFamily: fonts.bodyMedium, fontSize: 14 },
  toastBtn: { height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.darkSoft, justifyContent: 'center' },
  toastBtnText: { color: '#FFFFFF', fontFamily: fonts.bodyBold, fontSize: 14 },
});
