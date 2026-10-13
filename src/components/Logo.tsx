import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';
import { colors } from '../theme';

/** Logo: tres tarjetas apiladas (eliminar, mantener y la foto al frente). Diseñado en una caja de 112. */
export function Logo({ size = 112 }: { size?: number }) {
  const s = size / 112;
  const card = { position: 'absolute' as const, width: 62 * s, height: 82 * s, borderRadius: 16 * s };
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[card, { left: 22 * s, top: 14 * s, backgroundColor: colors.delete, transform: [{ rotate: '-14deg' }] }]} />
      <View style={[card, { left: 30 * s, top: 12 * s, backgroundColor: colors.keep, transform: [{ rotate: '10deg' }] }]} />
      <View style={[card, { left: 25 * s, top: 16 * s, backgroundColor: '#FFFFFF', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12 * s, shadowOffset: { width: 0, height: 10 * s }, elevation: 8 }]}>
        <Svg width={62 * s} height={82 * s} viewBox="0 0 62 82">
          <Circle cx={41} cy={21} r={7} fill={colors.ink} />
          <Polygon points="0,62.2 21.7,42.4 37.2,57.8 49.6,49 62,60 62,82 0,82" fill={colors.ink} />
        </Svg>
      </View>
    </View>
  );
}
