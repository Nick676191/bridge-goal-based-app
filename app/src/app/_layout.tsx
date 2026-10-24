// The root of the app. Every file in src/app/ is a screen, and this file wraps
// all of them: it loads fonts, provides the shared store, and sets up the
// "stack" navigator that slides screens in from the right.

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
} from '@expo-google-fonts/barlow-condensed';
import { StoreProvider } from '@/data/store';
import { colors } from '@/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
  });
  if (!fontsLoaded) return null;

  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.navy,
          headerStyle: { backgroundColor: colors.carolina },
          // On iOS 26+ (SDK 58) headers are see-through by default and content
          // slides underneath; keep them solid blue with content below.
          headerTransparent: false,
          headerShadowVisible: false,
          headerBackTitle: 'Back',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.paper },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="goal/[id]" options={{ title: 'Goal' }} />
        <Stack.Screen name="user/[username]" options={{ title: '' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="edit-profile" options={{ title: 'Edit profile' }} />
        <Stack.Screen name="connections/[username]" options={{ title: '' }} />
        <Stack.Screen name="share/[id]" options={{ title: 'Share goal', presentation: 'modal' }} />
      </Stack>
    </StoreProvider>
  );
}
