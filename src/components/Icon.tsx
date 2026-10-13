import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'trash' | 'x' | 'check' | 'folder' | 'folderDown' | 'share' | 'undo' | 'shuffle' | 'refresh'
  | 'back' | 'chevronRight' | 'home' | 'chart' | 'lock' | 'plus' | 'play' | 'mute' | 'sound' | 'sortHeavy';

const PATHS: Record<IconName, React.ReactNode> = {
  trash: <Path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  x: <Path d="M6 6l12 12M18 6L6 18" />,
  check: <Path d="M5 12.5l4.5 4.5L19 7" />,
  folder: <Path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  folderDown: (
    <>
      <Path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Path d="M12 10.5v5M9.5 13L12 15.5 14.5 13" />
    </>
  ),
  share: (
    <>
      <Path d="M12 15V3M7 8l5-5 5 5" />
      <Path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </>
  ),
  undo: (
    <>
      <Path d="M9 14L4 9l5-5" />
      <Path d="M4 9h11a5 5 0 0 1 0 10h-3" />
    </>
  ),
  shuffle: (
    <>
      <Path d="M16 3h5v5" />
      <Path d="M4 20L21 3" />
      <Path d="M21 16v5h-5" />
      <Path d="M15 15l6 6" />
      <Path d="M4 4l5 5" />
    </>
  ),
  refresh: (
    <>
      <Path d="M21 12a9 9 0 1 1-3-6.7" />
      <Path d="M21 4v5h-5" />
    </>
  ),
  back: <Path d="M15 6l-6 6 6 6" />,
  chevronRight: <Path d="M9 6l6 6-6 6" />,
  home: (
    <>
      <Path d="M3 11l9-7 9 7" />
      <Path d="M5 10v10h5v-6h4v6h5V10" />
    </>
  ),
  chart: <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  lock: (
    <>
      <Rect x="5" y="11" width="14" height="10" rx="2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  plus: <Path d="M12 5v14M5 12h14" />,
  play: <Path d="M7 4.5v15l13-7.5z" />,
  mute: (
    <>
      <Path d="M11 5L6 9H3v6h3l5 4z" />
      <Path d="M22 9l-6 6M16 9l6 6" />
    </>
  ),
  sound: (
    <>
      <Path d="M11 5L6 9H3v6h3l5 4z" />
      <Path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  sortHeavy: (
    <>
      <Path d="M8 4v16M4 16l4 4 4-4" />
      <Path d="M14 6h7M14 11h5M14 16h3" />
    </>
  ),
};

export function Icon({ name, size = 22, color = '#111114', stroke = 2.2, filled = false }: {
  name: IconName; size?: number; color?: string; stroke?: number; filled?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={filled ? 'none' : color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </Svg>
  );
}

export function Dot({ size = 8, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={color} />
    </Svg>
  );
}
