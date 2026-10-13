import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../src/components/Icon';
import { Button, Title, Wordmark } from '../../src/components/ui';
import { fmtBytes, fmtDuration, plural } from '../../src/format';
import { deleteForever } from '../../src/media';
import { daysLeft, TrashItem, TRASH_DAYS, useStore } from '../../src/store';
import { colors, fonts } from '../../src/theme';

export default function Papelera() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { trash, restore, purged, totalFreed } = useStore();
  const [selecting, setSelecting] = useState(false);
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const tile = (width - 40 - 16) / 3;
  const chosen = trash.filter((t) => sel[t.id]);
  const target = selecting && chosen.length ? chosen : trash;
  const total = useMemo(() => trash.reduce((a, t) => a + t.size, 0), [trash]);
  const targetBytes = target.reduce((a, t) => a + t.size, 0);
  const expired = trash.filter((t) => daysLeft(t) === 0);

  function toggle(item: TrashItem) {
    if (!selecting) {
      setSelecting(true);
      setSel({ [item.id]: true });
      return;
    }
    setSel((s) => ({ ...s, [item.id]: !s[item.id] }));
  }

  function doRestore() {
    restore(target.map((t) => t.id));
    setSel({});
    setSelecting(false);
  }

  async function doDelete(items: TrashItem[]) {
    setBusy(true);
    // El sistema muestra su propia confirmación (Android 11+ y iOS).
    const ok = await deleteForever(items.map((t) => t.id));
    setBusy(false);
    if (!ok) return;
    purged(items.map((t) => t.id), items.reduce((a, t) => a + t.size, 0));
    setSel({});
    setSelecting(false);
  }

  function confirmDelete() {
    // iOS y Android 11+ ya muestran su propia confirmación del sistema; solo preguntamos en Android antiguo.
    const systemConfirms = Platform.OS === 'ios' || (typeof Platform.Version === 'number' && Platform.Version >= 30);
    if (systemConfirms) return doDelete(target);
    const n = target.length;
    Alert.alert(
      selecting && chosen.length ? `Eliminar ${plural(n, 'elemento', 'elementos')}` : 'Vaciar papelera',
      `Se borrarán de tu teléfono y liberarás ${fmtBytes(targetBytes)}. No se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => doDelete(target) },
      ],
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6 }]}>
      <View style={styles.header}>
        <Wordmark />
        {trash.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => { setSelecting(!selecting); setSel({}); }} style={styles.selectBtn}>
            <Text style={styles.selectText}>{selecting ? 'Listo' : 'Seleccionar'}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={{ gap: 6, paddingHorizontal: 20, marginBottom: 14 }}>
        <Title size={30}>Papelera</Title>
        <Text style={styles.sub}>
          {trash.length
            ? `${plural(trash.length, 'elemento', 'elementos')} · ${fmtBytes(total)}. Se borran solos a los ${TRASH_DAYS} días.`
            : 'Aquí llega lo que deslizas a la izquierda.'}
        </Text>
      </View>

      {expired.length > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => doDelete(expired)} style={styles.expired}>
          <Text style={styles.expiredText}>{plural(expired.length, 'elemento cumplió', 'elementos cumplieron')} {TRASH_DAYS} días</Text>
          <Text style={styles.expiredAction}>Borrar ahora</Text>
        </Pressable>
      ) : null}

      {trash.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Icon name="check" size={30} color={colors.keep} stroke={2.4} /></View>
          <Text style={styles.emptyTitle}>Papelera vacía</Text>
          <Text style={styles.sub}>{totalFreed > 0 ? `Llevas ${fmtBytes(totalFreed)} liberados.` : 'Nada por aquí todavía.'}</Text>
        </View>
      ) : (
        <FlatList
          data={trash}
          keyExtractor={(t) => t.id}
          numColumns={3}
          columnWrapperStyle={{ gap: 8 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 16 }}
          renderItem={({ item }) => {
            const on = !!sel[item.id];
            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${item.type === 'video' ? 'Video' : 'Foto'}, ${fmtBytes(item.size)}, quedan ${daysLeft(item)} días`}
                onPress={() => toggle(item)}
                style={[styles.tile, { width: tile, height: tile * 1.3, borderColor: on ? colors.dark : 'transparent' }]}
              >
                <Image source={{ uri: item.uri }} style={[StyleSheet.absoluteFill, { opacity: selecting && !on ? 0.75 : 1 }]} contentFit="cover" />
                {item.type === 'video' ? (
                  <View style={styles.dur}>
                    <Icon name="play" size={9} color="#FFFFFF" filled />
                    <Text style={styles.durText}>{fmtDuration(item.duration)}</Text>
                  </View>
                ) : null}
                {selecting ? (
                  <View style={[styles.check, { backgroundColor: on ? colors.dark : 'rgba(17,17,20,0.25)' }]}>
                    <Icon name="check" size={12} color="#FFFFFF" stroke={3.4} />
                  </View>
                ) : null}
                <View style={styles.meta}>
                  <Text style={styles.metaText}>{daysLeft(item)} d</Text>
                  <Text style={[styles.metaText, { color: item.size >= 100 * 1048576 ? colors.deleteInk : colors.ink2 }]}>{fmtBytes(item.size)}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {trash.length > 0 ? (
        <View style={styles.footer}>
          <Button
            label={selecting && chosen.length ? `Recuperar ${chosen.length}` : 'Recuperar todo'}
            icon="undo" variant="light" height={52} onPress={doRestore}
          />
          <Button
            label={`${selecting && chosen.length ? `Eliminar ${chosen.length} ya` : 'Vaciar papelera'} · ${fmtBytes(targetBytes)}`}
            variant="danger" onPress={confirmDelete} loading={busy}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { height: 44, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  selectBtn: { height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center' },
  selectText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted },
  expired: {
    marginHorizontal: 20, marginBottom: 12, padding: 14, borderRadius: 16, backgroundColor: colors.deleteSoft,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  expiredText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.deleteInk, flex: 1 },
  expiredAction: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.deleteInk },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.keepSoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  tile: { borderRadius: 18, overflow: 'hidden', backgroundColor: '#D5D4CE', borderWidth: 3 },
  dur: {
    position: 'absolute', right: 6, top: 6, height: 22, paddingHorizontal: 7, borderRadius: 11,
    backgroundColor: 'rgba(17,17,20,0.75)', flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  durText: { color: '#FFFFFF', fontFamily: fonts.bodyBold, fontSize: 11 },
  check: {
    position: 'absolute', left: 6, top: 6, width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  meta: {
    position: 'absolute', left: 6, right: 6, bottom: 6, height: 24, borderRadius: 12, paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.94)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  metaText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.ink },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 10 },
});
