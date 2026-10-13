import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export type MediaFilter = 'all' | 'photo' | 'video';

export type Selection =
  | { kind: 'random'; n: number; media: MediaFilter; heavy: boolean }
  | { kind: 'folder'; albumId: string; albumTitle: string; media: MediaFilter; heavy: boolean };

export type MediaItem = {
  id: string;
  uri: string;
  type: 'photo' | 'video';
  duration: number;
  width: number;
  height: number;
  creationTime: number;
  filename: string;
};

export type FolderInfo = {
  id: string;
  title: string;
  photos: number;
  videos: number;
  thumb?: string;
};

const PERMS: MediaLibrary.GranularPermission[] = ['photo', 'video'];

export async function getPermission() {
  return MediaLibrary.getPermissionsAsync(false, PERMS);
}

export async function requestPermission() {
  return MediaLibrary.requestPermissionsAsync(false, PERMS);
}

function mediaTypes(filter: MediaFilter): MediaLibrary.MediaTypeValue[] {
  if (filter === 'photo') return [MediaLibrary.MediaType.photo];
  if (filter === 'video') return [MediaLibrary.MediaType.video];
  return [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video];
}

export function toItem(a: MediaLibrary.Asset): MediaItem {
  return {
    id: a.id,
    uri: a.uri,
    type: a.mediaType === MediaLibrary.MediaType.video ? 'video' : 'photo',
    duration: a.duration || 0,
    width: a.width,
    height: a.height,
    creationTime: a.creationTime,
    filename: a.filename,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Rough "weight" used for "más pesados primero" without reading every file. */
function weight(m: MediaItem): number {
  if (m.type === 'video') return 1e9 + m.duration * (m.width * m.height || 1e6);
  return m.width * m.height;
}

async function countOf(album: MediaLibrary.Album, type: MediaLibrary.MediaTypeValue) {
  const page = await MediaLibrary.getAssetsAsync({ album, mediaType: type, first: 1 });
  return { total: page.totalCount, first: page.assets[0] };
}

export async function loadFolders(): Promise<FolderInfo[]> {
  const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: false });
  const sorted = albums.filter((a) => a.assetCount > 0).sort((a, b) => b.assetCount - a.assetCount).slice(0, 20);
  const out: FolderInfo[] = [];
  for (const album of sorted) {
    const [p, v] = await Promise.all([
      countOf(album, MediaLibrary.MediaType.photo),
      countOf(album, MediaLibrary.MediaType.video),
    ]);
    if (p.total + v.total === 0) continue;
    out.push({ id: album.id, title: album.title, photos: p.total, videos: v.total, thumb: (p.first || v.first)?.uri });
  }
  return out;
}

export async function loadDeck(sel: Selection, exclude: Record<string, unknown>): Promise<MediaItem[]> {
  const base: MediaLibrary.AssetsOptions = {
    mediaType: mediaTypes(sel.media),
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
  };
  let pool: MediaItem[];
  if (sel.kind === 'folder') {
    const page = await MediaLibrary.getAssetsAsync({ ...base, album: sel.albumId, first: 400 });
    pool = page.assets.map(toItem).filter((m) => !exclude[m.id]);
  } else {
    const page = await MediaLibrary.getAssetsAsync({ ...base, first: 1200 });
    pool = shuffle(page.assets.map(toItem).filter((m) => !exclude[m.id])).slice(0, sel.n);
  }
  if (sel.heavy) pool = pool.slice().sort((a, b) => weight(b) - weight(a));
  return pool;
}

/** Playable/displayable local file uri (needed for ph:// assets on iOS and for sharing). */
export async function localUri(id: string): Promise<string | null> {
  try {
    const info = await MediaLibrary.getAssetInfoAsync(id, { shouldDownloadFromNetwork: true });
    return info.localUri ?? info.uri ?? null;
  } catch {
    return null;
  }
}

export async function fileSize(id: string): Promise<number> {
  const uri = await localUri(id);
  if (!uri) return 0;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && 'size' in info ? info.size ?? 0 : 0;
  } catch {
    return 0;
  }
}

export async function listAlbums(): Promise<MediaLibrary.Album[]> {
  const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: false });
  return albums.sort((a, b) => a.title.localeCompare(b.title));
}

export async function moveToAlbum(itemId: string, target: { id?: string; newName?: string }, sourceAlbumId?: string) {
  const asset = await MediaLibrary.getAssetInfoAsync(itemId);
  if (target.newName) {
    await MediaLibrary.createAlbumAsync(target.newName, asset, false);
  } else if (target.id) {
    await MediaLibrary.addAssetsToAlbumAsync([asset], target.id, false);
  }
  // En iOS los álbumes son referencias: quitamos la foto del álbum de origen para que sea un "mover".
  // En Android addAssetsToAlbumAsync(copy=false) ya mueve el archivo; NO llamamos a remove (allí borraría el archivo).
  if (sourceAlbumId && Platform.OS === 'ios') {
    try {
      await MediaLibrary.removeAssetsFromAlbumAsync([asset], sourceAlbumId);
    } catch {
      // Si no se puede quitar del álbum de origen, la foto queda en ambos; no es un error grave.
    }
  }
}

export async function deleteForever(ids: string[]): Promise<boolean> {
  if (!ids.length) return true;
  try {
    return await MediaLibrary.deleteAssetsAsync(ids);
  } catch {
    return false;
  }
}

/** Remove from the app's trash any item the user already deleted outside the app. */
export async function stillExists(id: string): Promise<boolean> {
  try {
    const info = await MediaLibrary.getAssetInfoAsync(id);
    return !!info;
  } catch {
    return false;
  }
}
