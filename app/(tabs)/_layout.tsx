import { Tabs } from 'expo-router';
import React from 'react';
import { TabBar } from '../../src/components/TabBar';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="papelera" options={{ title: 'Papelera' }} />
      <Tabs.Screen name="resumen" options={{ title: 'Resumen' }} />
    </Tabs>
  );
}
