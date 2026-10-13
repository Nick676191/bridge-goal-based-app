// A round avatar showing initials. Real profile photos come in milestone 2.

import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '@/theme';

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: colors.paper, fontWeight: '700', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}
