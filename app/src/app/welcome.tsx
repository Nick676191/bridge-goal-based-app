// The first screen a new person sees: the wordmark, the motto and its
// subtext, and two buttons.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '@/data/store';
import { Button } from '@/components/ui';
import { APP_NAME, colors, fonts, space } from '@/theme';

export default function Welcome() {
  const store = useStore();
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.wordmark}>{APP_NAME}</Text>
      </View>
      <View style={styles.middle}>
        <Text style={styles.motto} accessibilityRole="header">
          Go You
        </Text>
        <Text style={styles.subtext}>Steady Strides Towards Big Goals</Text>
      </View>
      <View style={styles.bottom}>
        <Button large label="Create account" onPress={() => router.push('/onboarding')} />
        <Button
          large
          label="Log in"
          variant="secondary"
          onPress={() => {
            // Prototype: logging in skips straight to the app as Nick.
            store.dispatch({ type: 'signIn' });
            router.replace('/');
          }}
        />
        <Text style={styles.note}>Prototype: nothing you enter is saved.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: space.xl },
  top: { paddingTop: space.lg },
  wordmark: { fontFamily: fonts.displayHeavy, fontSize: 64, lineHeight: 66, letterSpacing: 2, color: colors.ink },
  middle: { flex: 1, justifyContent: 'center', gap: space.md },
  // Two short words, so they can be very large and still fit on one line.
  motto: { fontFamily: fonts.displayHeavy, fontSize: 128, lineHeight: 120, color: colors.ink },
  subtext: { fontFamily: fonts.displayMedium, fontSize: 26, lineHeight: 30, color: colors.ink },
  bottom: { gap: space.md, paddingBottom: space.lg },
  note: { fontSize: 13, color: colors.muted, textAlign: 'center' },
});
