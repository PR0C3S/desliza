import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { colors, fonts } from '../theme';
import { Icon, IconName } from './Icon';

export function Wordmark({ color = colors.ink }: { color?: string }) {
  return <Text style={[styles.wordmark, { color }]}>desliza</Text>;
}

export function Eyebrow({ children, color = colors.subtle }: { children: React.ReactNode; color?: string }) {
  return <Text style={[styles.eyebrow, { color }]}>{children}</Text>;
}

export function Title({ children, size = 28, style }: { children: React.ReactNode; size?: number; style?: TextStyle }) {
  return <Text accessibilityRole="header" style={[styles.title, { fontSize: size, lineHeight: size * 1.1 }, style]}>{children}</Text>;
}

export function Body({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

type BtnProps = {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  iconRight?: IconName;
  variant?: 'dark' | 'light' | 'danger' | 'ghost';
  height?: number;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, icon, iconRight, variant = 'dark', height = 56, disabled, loading, style }: BtnProps) {
  const bg = { dark: colors.dark, light: colors.surface, danger: colors.delete, ghost: 'transparent' }[variant];
  const fg = variant === 'light' || variant === 'ghost' ? colors.ink : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { height, borderRadius: height / 2, backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={fg} /> : null}
          <Text style={[styles.btnText, { color: fg }]} numberOfLines={1}>{label}</Text>
          {iconRight ? <Icon name={iconRight} size={18} color={fg} stroke={2.4} /> : null}
        </>
      )}
    </Pressable>
  );
}

export function RoundButton({ icon, onPress, label, size = 48, bg = colors.surface, color = colors.ink }: {
  icon: IconName; onPress?: () => void; label: string; size?: number; bg?: string; color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.round, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, opacity: pressed ? 0.8 : 1 }]}
    >
      <Icon name={icon} size={20} color={color} />
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  wordmark: { fontFamily: fonts.display, fontSize: 20, letterSpacing: -0.4 },
  eyebrow: { fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { fontFamily: fonts.display, color: colors.ink, letterSpacing: -0.9 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.muted },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20 },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 16 },
  round: {
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#111114', shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 16 },
});
