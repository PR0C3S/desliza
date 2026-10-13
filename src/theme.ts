export const colors = {
  bg: '#EEEDE8',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F0EB',
  track: '#E2E1DB',
  line: '#DAD9D3',
  border: '#E6E5E0',
  ink: '#111114',
  ink2: '#3A3A40',
  muted: '#55555C',
  subtle: '#6A6A72',
  dark: '#111114',
  darkSoft: '#2A2A30',
  onDarkMuted: '#C8C8CE',
  delete: '#D9412A',
  deleteSoft: '#FBE3DE',
  deleteInk: '#A8301C',
  keep: '#0F8A57',
  keepSoft: '#DDF3E8',
  share: '#2A62D9',
  move: '#B86E00',
  moveInk: '#8A5200',
  warn: '#E8590C',
};

export const fonts = {
  display: 'Sora_700Bold',
  displaySemi: 'Sora_600SemiBold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemi: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
};

export type Direction = 'left' | 'right' | 'up' | 'down';

export const actionColor: Record<Direction, string> = {
  left: colors.delete,
  right: colors.keep,
  up: colors.share,
  down: colors.move,
};
