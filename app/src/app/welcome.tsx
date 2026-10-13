// The first screen a new person sees: the wordmark, the motto, and two buttons.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '@/data/store';
import { Button } from '@/components/ui';
import { colors, fonts, space } from '@/theme';

export default function Welcome() {
  const store = useStore();
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.wordmark}>BRIDGE</Text>
      </View>
      <View style={styles.middle}>
        <Text style={styles.motto} accessibilityRole="header">
          Scroll less. Dream more.
        </Text>
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
  wordmark: { fontFamily: fonts.displayHeavy, fontSize: 40, letterSpacing: 1, color: colors.ink },
  middle: { flex: 1, justifyContent: 'center' },
  // Big enough that each sentence takes about two lines on an iPhone.
  motto: { fontFamily: fonts.displayHeavy, fontSize: 92, lineHeight: 86, color: colors.ink },
  bottom: { gap: space.md, paddingBottom: space.lg },
  note: { fontSize: 13, color: colors.muted, textAlign: 'center' },
});
