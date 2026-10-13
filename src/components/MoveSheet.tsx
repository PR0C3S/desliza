import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listAlbums } from '../media';
import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { Button } from './ui';

type Props = {
  visible: boolean;
  excludeAlbumId?: string;
  isVideo: boolean;
  onClose: () => void;
  onPick: (target: { id?: string; newName?: string; title: string }) => void;
};

export function MoveSheet({ visible, excludeAlbumId, isVideo, onClose, onPick }: Props) {
  const insets = useSafeAreaInsets();
  const [albums, setAlbums] = useState<MediaLibrary.Album[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!visible) return;
    setCreating(false);
    setName('');
    listAlbums().then(setAlbums).catch(() => setAlbums([]));
  }, [visible]);

  const list = (albums ?? []).filter((a) => a.id !== excludeAlbumId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Cerrar" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap} pointerEvents="box-none">
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <Text style={styles.title}>Mover a carpeta</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={styles.close}>
              <Icon name="x" size={18} color={colors.ink} />
            </Pressable>
          </View>
          <Text style={styles.sub}>¿A qué carpeta va {isVideo ? 'este video' : 'esta foto'}?</Text>

          {albums === null ? (
            <ActivityIndicator color={colors.ink} style={{ marginVertical: 24 }} />
          ) : (
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 8 }}>
              {list.map((a) => (
                <Pressable key={a.id} accessibilityRole="button" onPress={() => onPick({ id: a.id, title: a.title })} style={styles.row}>
                  <View style={styles.rowIcon}><Icon name="folder" size={20} color={colors.move} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{a.title}</Text>
                    <Text style={styles.rowSub}>{a.assetCount} elementos</Text>
                  </View>
                  <Icon name="chevronRight" size={18} color="#9A9AA2" stroke={2} />
                </Pressable>
              ))}
            </ScrollView>
          )}

          {creating ? (
            <View style={{ gap: 8 }}>
              <TextInput
                autoFocus
                value={name}
                onChangeText={setName}
                placeholder="Nombre de la carpeta"
                placeholderTextColor={colors.subtle}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={() => name.trim() && onPick({ newName: name.trim(), title: name.trim() })}
                accessibilityLabel="Nombre de la nueva carpeta"
              />
              <Button label="Crear y mover" disabled={!name.trim()} onPress={() => onPick({ newName: name.trim(), title: name.trim() })} />
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => setCreating(true)} style={styles.newBtn}>
              <Icon name="plus" size={18} color={colors.moveInk} stroke={2.4} />
              <Text style={styles.newText}>Nueva carpeta</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,17,20,0.42)' },
  wrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, gap: 14 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  row: { height: 64, borderRadius: 18, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 10, paddingRight: 14 },
  rowIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F6EBD9', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  rowSub: { fontFamily: fonts.body, fontSize: 12, color: colors.subtle },
  newBtn: { height: 56, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#CFCEC8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  newText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.moveInk },
  input: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, fontFamily: fonts.body, fontSize: 16, color: colors.ink },
});
