import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';
import { Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoadingScreen } from '../src/components/LoadingScreen';
import { StoreProvider, useStore } from '../src/store';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 300, fade: true });

function Gate() {
  const { hydrated, onboarded } = useStore();
  const [minTimeDone, setMinTimeDone] = useState(false);

  useEffect(() => {
    // La pantalla de carga solo se queda un momento; la primera vez un poco más para que se vea la marca.
    if (!hydrated) return;
    const t = setTimeout(() => setMinTimeDone(true), onboarded ? 0 : 900);
    return () => clearTimeout(t);
  }, [hydrated, onboarded]);

  if (!hydrated || !minTimeDone) return <LoadingScreen />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="bienvenida" options={{ animation: 'fade' }} />
      <Stack.Screen name="sin-permiso" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="deslizar" options={{ gestureEnabled: false, animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <StatusBar style="dark" />
          <Gate />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
