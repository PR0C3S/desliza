import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { colors, fonts } from '../theme';
import { Icon, IconName } from './Icon';

const ICONS: Record<string, IconName> = { index: 'home', papelera: 'trash', resumen: 'chart' };

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { trash } = useStore();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = descriptors[route.key].options.title ?? route.name;
        const color = focused ? colors.ink : colors.subtle;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        const badge = route.name === 'papelera' && trash.length > 0 ? trash.length : 0;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={badge ? `${label}, ${badge} elementos` : label}
            onPress={onPress}
            style={styles.item}
          >
            <View style={[styles.iconWrap, focused && styles.iconWrapOn]}>
              <Icon name={ICONS[route.name] ?? 'home'} size={22} color={color} stroke={focused ? 2.2 : 2} />
              {badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, { color, fontFamily: focused ? fonts.bodyBold : fonts.bodySemi }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.track, paddingTop: 8, paddingHorizontal: 20,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 48 },
  iconWrap: { width: 56, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  iconWrapOn: { backgroundColor: colors.bg },
  label: { fontSize: 11 },
  badge: {
    position: 'absolute', top: -1, right: 8, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9,
    backgroundColor: colors.delete, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontFamily: fonts.bodyBold, fontSize: 10 },
});
