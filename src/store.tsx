import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { MediaItem, Selection } from './media';

export type TrashItem = MediaItem & { trashedAt: number; size: number };

export type Session = {
  label: string;
  startedAt: number;
  reviewed: number;
  del: number;
  keep: number;
  share: number;
  move: number;
  photoBytes: number;
  videoBytes: number;
};

type Persisted = {
  onboarded: boolean;
  coachSeen: boolean;
  selection: Selection;
  trash: TrashItem[];
  reviewed: Record<string, 1>;
  lastSession: Session | null;
  totalFreed: number;
};

const KEY = 'desliza:v1';
export const TRASH_DAYS = 30;

const initial: Persisted = {
  onboarded: false,
  coachSeen: false,
  selection: { kind: 'random', n: 25, media: 'all', heavy: false },
  trash: [],
  reviewed: {},
  lastSession: null,
  totalFreed: 0,
};

export type SessionKind = 'del' | 'keep' | 'share' | 'move';

type Store = Persisted & {
  hydrated: boolean;
  setOnboarded: () => void;
  setCoachSeen: () => void;
  setSelection: (s: Selection) => void;
  startSession: (label: string) => void;
  record: (kind: SessionKind, item: MediaItem, size?: number) => void;
  unrecord: (kind: SessionKind, item: MediaItem, size?: number) => void;
  addToTrash: (item: TrashItem) => void;
  restore: (ids: string[]) => void;
  purged: (ids: string[], freedBytes: number) => void;
  markReviewed: (id: string) => void;
  unmarkReviewed: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(initial);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ ...initial, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    }, 250);
  }, [state, hydrated]);

  const patch = useCallback((fn: (s: Persisted) => Partial<Persisted>) => {
    setState((s) => ({ ...s, ...fn(s) }));
  }, []);

  const bump = useCallback(
    (sign: 1 | -1, kind: SessionKind, item: MediaItem, size = 0) =>
      patch((s) => {
        if (!s.lastSession) return {};
        const ses = { ...s.lastSession };
        ses[kind] = Math.max(0, ses[kind] + sign);
        ses.reviewed = Math.max(0, ses.reviewed + sign);
        if (kind === 'del') {
          if (item.type === 'video') ses.videoBytes = Math.max(0, ses.videoBytes + sign * size);
          else ses.photoBytes = Math.max(0, ses.photoBytes + sign * size);
        }
        return { lastSession: ses };
      }),
    [patch],
  );

  const value = useMemo<Store>(
    () => ({
      ...state,
      hydrated,
      setOnboarded: () => patch(() => ({ onboarded: true })),
      setCoachSeen: () => patch(() => ({ coachSeen: true })),
      setSelection: (selection) => patch(() => ({ selection })),
      startSession: (label) =>
        patch(() => ({
          lastSession: { label, startedAt: Date.now(), reviewed: 0, del: 0, keep: 0, share: 0, move: 0, photoBytes: 0, videoBytes: 0 },
        })),
      record: (kind, item, size) => bump(1, kind, item, size),
      unrecord: (kind, item, size) => bump(-1, kind, item, size),
      addToTrash: (item) => patch((s) => ({ trash: [item, ...s.trash.filter((t) => t.id !== item.id)] })),
      restore: (ids) => patch((s) => ({ trash: s.trash.filter((t) => !ids.includes(t.id)) })),
      purged: (ids, freedBytes) =>
        patch((s) => ({ trash: s.trash.filter((t) => !ids.includes(t.id)), totalFreed: s.totalFreed + freedBytes })),
      markReviewed: (id) => patch((s) => ({ reviewed: { ...s.reviewed, [id]: 1 } })),
      unmarkReviewed: (id) =>
        patch((s) => {
          const r = { ...s.reviewed };
          delete r[id];
          return { reviewed: r };
        }),
    }),
    [state, hydrated, patch, bump],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore fuera de StoreProvider');
  return v;
}

export function daysLeft(t: TrashItem): number {
  const elapsed = (Date.now() - t.trashedAt) / 86400000;
  return Math.max(0, Math.ceil(TRASH_DAYS - elapsed));
}

export function selectionLabel(sel: Selection): string {
  const noun = sel.media === 'photo' ? ' fotos' : sel.media === 'video' ? ' videos' : '';
  if (sel.kind === 'random') return sel.n + noun + ' al azar';
  return sel.albumTitle;
}
