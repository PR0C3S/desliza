import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation, interpolate, runOnJS, SharedValue, useAnimatedStyle, useSharedValue,
} from 'react-native-reanimated';
import { fmtBytes, fmtDate, fmtDuration } from '../format';
import { localUri, MediaItem } from '../media';
import { actionColor, colors, Direction, fonts } from '../theme';
import { Icon } from './Icon';

export const THRESHOLD = 110;

export function dirOf(x: number, y: number): Direction | null {
  'worklet';
  if (Math.abs(x) < 8 && Math.abs(y) < 8) return null;
  if (Math.abs(x) >= Math.abs(y)) return x < 0 ? 'left' : 'right';
  return y < 0 ? 'up' : 'down';
}

export function strengthOf(x: number, y: number): number {
  'worklet';
  return Math.min(1, Math.max(Math.abs(x), Math.abs(y)) / THRESHOLD);
}

type Props = {
  item: MediaItem;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  width: number;
  height: number;
  folderName?: string;
  size?: number;
  tag?: string;
  enabled: boolean;
  /** Dirección elegida al soltar, o null si no llegó al umbral (la tarjeta debe volver al centro). */
  onDecide: (dir: Direction | null) => void;
  onDragStart?: () => void;
};

const STAMPS: { dir: Direction; arrow: string; label: string }[] = [
  { dir: 'left', arrow: '←', label: 'Eliminar' },
  { dir: 'right', arrow: '→', label: 'Mantener' },
  { dir: 'up', arrow: '↑', label: 'Compartir' },
  { dir: 'down', arrow: '↓', label: 'Mover' },
];

function Stamp({ dir, arrow, label, tx, ty }: { dir: Direction; arrow: string; label: string; tx: SharedValue<number>; ty: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const on = dirOf(tx.value, ty.value) === dir;
    const s = on ? strengthOf(tx.value, ty.value) : 0;
    return { opacity: s, transform: [{ scale: 0.85 + 0.15 * s }] };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.stamp, { backgroundColor: actionColor[dir] }, style]}>
      <Text style={styles.stampText}>{arrow}  {label}</Text>
    </Animated.View>
  );
}

function VideoLayer({ uri, playerRef, onProgress }: {
  uri: string; playerRef: React.MutableRefObject<VideoPlayer | null>; onProgress: (f: number) => void;
}) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });
  const { currentTime } = useEvent(player, 'timeUpdate', { currentTime: 0, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0 });
  useEffect(() => {
    playerRef.current = player;
    return () => {
      playerRef.current = null;
    };
  }, [player, playerRef]);
  useEffect(() => {
    if (player.duration > 0) onProgress(currentTime / player.duration);
  }, [currentTime, player, onProgress]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

export function SwipeCard({ item, tx, ty, width, height, folderName, size, tag, enabled, onDecide, onDragStart }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const playerRef = useRef<VideoPlayer | null>(null);
  const barWidth = useSharedValue(1);
  const isVideo = item.type === 'video';

  useEffect(() => {
    let alive = true;
    localUri(item.id).then((u) => alive && setSrc(u));
    return () => {
      alive = false;
    };
  }, [item.id]);

  function seek(f: number) {
    const p = playerRef.current;
    if (p && p.duration > 0) {
      p.currentTime = f * p.duration;
      setProgress(f);
    }
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (playerRef.current) playerRef.current.muted = next;
  }

  const scrub = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      runOnJS(seek)(Math.max(0, Math.min(1, e.x / barWidth.value)));
    })
    .onUpdate((e) => {
      runOnJS(seek)(Math.max(0, Math.min(1, e.x / barWidth.value)));
    });

  const pan = Gesture.Pan()
    .enabled(enabled)
    .requireExternalGestureToFail(scrub)
    .onStart(() => {
      if (onDragStart) runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd((e) => {
      const d = dirOf(tx.value, ty.value);
      const fast = Math.abs(e.velocityX) > 900 || Math.abs(e.velocityY) > 900;
      const far = strengthOf(tx.value, ty.value) >= 1 || (fast && strengthOf(tx.value, ty.value) > 0.4);
      runOnJS(onDecide)(d && far ? d : null);
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: interpolate(tx.value, [-300, 0, 300], [-15, 0, 15], Extrapolation.CLAMP) + 'deg' },
    ],
  }));

  const display = src ?? item.uri;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessible
        accessibilityLabel={`${isVideo ? 'Video' : 'Foto'} del ${fmtDate(item.creationTime)}${folderName ? ', ' + folderName : ''}`}
        accessibilityHint="Desliza a la izquierda para eliminar, a la derecha para mantener, arriba para compartir y abajo para mover"
        style={[styles.card, { width, height }, cardStyle]}
      >
        {isVideo && src ? (
          <VideoLayer uri={src} playerRef={playerRef} onProgress={setProgress} />
        ) : (
          <Image source={{ uri: display }} style={StyleSheet.absoluteFill} contentFit="cover" transition={120} />
        )}

        {tag ? (
          <View style={styles.tag}>
            <View style={styles.tagDot} />
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ) : null}

        {isVideo ? (
          <View style={styles.videoTop}>
            <View style={styles.chip}>
              <Icon name="play" size={11} color="#FFFFFF" filled />
              <Text style={styles.chipText}>{fmtDuration(item.duration)}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={muted ? 'Activar sonido' : 'Silenciar'} onPress={toggleMute} hitSlop={8} style={styles.muteBtn}>
              <Icon name={muted ? 'mute' : 'sound'} size={16} color="#FFFFFF" stroke={2} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.stampWrap} pointerEvents="none">
          {STAMPS.map((s) => <Stamp key={s.dir} {...s} tx={tx} ty={ty} />)}
        </View>

        <View style={styles.info}>
          {isVideo ? (
            <GestureDetector gesture={scrub}>
              <View
                style={styles.scrubArea}
                onLayout={(e) => { barWidth.value = Math.max(1, e.nativeEvent.layout.width); }}
                accessibilityRole="adjustable"
                accessibilityLabel="Avanzar en el video"
                accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
              >
                <View style={styles.scrubTrack}>
                  <View style={[styles.scrubFill, { width: `${progress * 100}%` }]} />
                  <View style={[styles.scrubKnob, { left: `${progress * 100}%` }]} />
                </View>
              </View>
            </GestureDetector>
          ) : null}
          <View style={styles.infoRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.infoTitle} numberOfLines={1}>{fmtDate(item.creationTime)}</Text>
              <Text style={styles.infoSub} numberOfLines={1}>{folderName || item.filename}</Text>
            </View>
            {size ? (
              <View style={[styles.size, size >= 100 * 1048576 && { backgroundColor: colors.deleteSoft }]}>
                <Text style={[styles.sizeText, size >= 100 * 1048576 && { color: colors.deleteInk }]}>{fmtBytes(size)}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export function BackCard({ item, width, height }: { item: MediaItem; width: number; height: number }) {
  return (
    <View pointerEvents="none" style={[styles.card, styles.back, { width, height }]}>
      <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute', borderRadius: 32, overflow: 'hidden', backgroundColor: '#1A1A1E',
    shadowColor: '#111114', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 8,
  },
  back: { transform: [{ scale: 0.93 }, { translateY: 22 }], opacity: 0.6, elevation: 2 },
  tag: {
    position: 'absolute', top: 16, left: 16, height: 32, paddingLeft: 10, paddingRight: 12, borderRadius: 16,
    backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  tagDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warn },
  tagText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
  videoTop: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 6 },
  chip: { height: 32, paddingHorizontal: 10, borderRadius: 16, backgroundColor: 'rgba(17,17,20,0.72)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { color: '#FFFFFF', fontFamily: fonts.bodyBold, fontSize: 12 },
  muteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(17,17,20,0.72)', alignItems: 'center', justifyContent: 'center' },
  stampWrap: { position: 'absolute', top: 64, left: 0, right: 0, alignItems: 'center' },
  stamp: {
    position: 'absolute', height: 44, paddingHorizontal: 18, borderRadius: 22, justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 8 },
  },
  stampText: { color: '#FFFFFF', fontFamily: fonts.display, fontSize: 16 },
  info: { position: 'absolute', left: 12, right: 12, bottom: 12, padding: 12, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.94)', gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoTitle: { fontFamily: fonts.displaySemi, fontSize: 15, color: colors.ink },
  infoSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  size: { height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: colors.surfaceAlt, justifyContent: 'center' },
  sizeText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink2 },
  scrubArea: { height: 24, justifyContent: 'center' },
  scrubTrack: { height: 4, borderRadius: 2, backgroundColor: colors.line },
  scrubFill: { position: 'absolute', left: 0, top: 0, height: 4, borderRadius: 2, backgroundColor: colors.ink },
  scrubKnob: { position: 'absolute', top: -5, width: 14, height: 14, marginLeft: -7, borderRadius: 7, backgroundColor: colors.ink },
});
