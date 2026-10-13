import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { Logo } from './Logo';

export function LoadingScreen({ message = 'Preparando tus fotos y videos…' }: { message?: string }) {
  const bar = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loops: Animated.CompositeAnimation[] = [];
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      loops = [
        Animated.loop(Animated.timing(bar, { toValue: 1, duration: 1300, easing: Easing.bezier(0.45, 0, 0.2, 1), useNativeDriver: true })),
        Animated.loop(
          Animated.sequence([
            Animated.timing(float, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(float, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
        ),
      ];
      loops.forEach((l) => l.start());
    });
    return () => loops.forEach((l) => l.stop());
  }, [bar, float]);

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel={'Desliza. ' + message}>
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }}>
          <Logo />
        </Animated.View>
        <Text style={styles.name}>desliza</Text>
        <Text style={styles.tag}>Tu galería, en orden con un dedo</Text>
      </View>
      <View style={styles.bottom}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { transform: [{ translateX: bar.interpolate({ inputRange: [0, 1], outputRange: [-56, 140] }) }] }]} />
        </View>
        <Text style={styles.tag}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark, paddingHorizontal: 32, paddingBottom: 64 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  name: { fontFamily: fonts.display, fontSize: 44, letterSpacing: -1.8, color: '#FFFFFF', marginTop: 8 },
  tag: { fontFamily: fonts.body, fontSize: 14, color: '#B5B5BC' },
  bottom: { alignItems: 'center', gap: 14 },
  track: { width: 140, height: 4, borderRadius: 2, backgroundColor: colors.darkSoft, overflow: 'hidden' },
  fill: { width: 56, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF' },
});
