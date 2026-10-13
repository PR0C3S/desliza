# Desliza — app nativa (Expo / React Native)

Limpia tu galería con gestos: izquierda elimina, derecha mantiene, arriba comparte (menú nativo del teléfono) y abajo mueve a una carpeta. Funciona en Android y iOS.

## Cómo correrla

Necesitas Node 20 o superior.

```bash
npm install
npx expo install --fix      # alinea las versiones de las librerías con tu SDK de Expo
```

La app usa acceso completo a la galería, borrar y mover archivos. **Expo Go no permite eso en Android**, así que se prueba con un *development build*:

```bash
# Android (con Android Studio o un teléfono conectado por USB)
npx expo run:android

# iOS (requiere Mac con Xcode)
npx expo run:ios
```

O en la nube con EAS (sin instalar Android Studio ni Xcode):

```bash
npm install -g eas-cli
eas build --profile development --platform android   # o ios
npx expo start --dev-client
```

Para generar un APK que puedas instalar directo: `eas build --profile preview --platform android`.

## Estructura

```
app/
  _layout.tsx        fuentes, pantalla de carga y navegación
  index.tsx          decide: primera vez → bienvenida; si ya la usó → Inicio
  bienvenida.tsx     bienvenida + pedir permiso
  sin-permiso.tsx    si se niega el acceso (abre Ajustes)
  (tabs)/            barra de abajo
    index.tsx        Inicio: ¿Qué quieres revisar hoy? (al azar o carpeta, fotos/videos, pesados primero)
    papelera.tsx     Papelera: recuperar o vaciar
    resumen.tsx      Resumen de la última sesión
  deslizar.tsx       pantalla de gestos (pantalla completa, sin barra)
src/
  components/        tarjeta deslizable, hoja de carpetas, logo, iconos, barra de pestañas
  media.ts           acceso a la galería (expo-media-library)
  store.tsx          estado guardado en el teléfono (AsyncStorage)
  theme.ts           colores y tipografías del diseño
```

## Cómo se comporta

- **Eliminar** no borra al instante: va a la papelera de Desliza durante 30 días. Al vaciarla, el sistema pide confirmación. En iOS lo borrado pasa además por “Eliminado recientemente” de Fotos.
- **Compartir** abre el menú nativo de compartir del teléfono.
- **Mover**: en Android mueve el archivo a la carpeta elegida. En iOS lo añade al álbum y lo quita del álbum de origen, si estabas revisando una carpeta.
- **Primera vez**: carga → bienvenida + permiso → Inicio → al deslizar aparecen ayudas en la primera foto.
- **Siguientes veces**: abre en Inicio con la última selección marcada.
- Lo que ya mantuviste, compartiste o moviste no vuelve a aparecer en tandas futuras.
- “Más pesados primero” ordena por una estimación (videos largos y fotos de mayor resolución primero) para no tener que leer cada archivo.
- Las etiquetas “Captura de pantalla”, “Posible duplicado” y “Video muy corto” se detectan por nombre de archivo, hora y duración.

## Pendiente de probar

El código no se ha ejecutado todavía en un teléfono real. Prueba los gestos, el video y el mover en Android y en iOS antes de publicar.
