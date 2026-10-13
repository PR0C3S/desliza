import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { LoadingScreen } from '../src/components/LoadingScreen';
import { getPermission } from '../src/media';
import { useStore } from '../src/store';

/** Decide a dónde va la app al abrirse: primera vez → bienvenida; ya la usó → Inicio (o Sin acceso si quitó el permiso). */
export default function Index() {
  const { onboarded } = useStore();
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!onboarded) return;
    getPermission()
      .then((p) => setGranted(p.granted || p.accessPrivileges === 'limited'))
      .catch(() => setGranted(false));
  }, [onboarded]);

  if (!onboarded) return <Redirect href="/bienvenida" />;
  if (granted === null) return <LoadingScreen />;
  return <Redirect href={granted ? '/(tabs)' : '/sin-permiso'} />;
}
