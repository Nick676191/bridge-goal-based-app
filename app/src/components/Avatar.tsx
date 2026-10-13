// A round profile photo. Shows the person's initials until they add a photo.

import React from 'react';
import { Image, Text, View } from 'react-native';
import { colors } from '@/theme';

export function Avatar({ name, uri, size = 36 }: { name: string; uri?: string; size?: number }) {
  const circle = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[circle, { backgroundColor: colors.wash }]}
        accessibilityIgnoresInvertColors
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    );
  }
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
      style={[circle, { backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }]}
    >
      <Text style={{ color: colors.paper, fontWeight: '700', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}
