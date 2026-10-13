// The first screen a new person sees.

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
        <Text style={styles.headline}>You left the team. Keep the training partners.</Text>
        <Text style={styles.sub}>
          {"Post a fitness goal in public. People chasing the same thing commit to it with you, and you all post updates, setbacks included, until it's done."}
        </Text>
      </View>
      <View style={styles.bottom}>
        <Button label="Create account" onPress={() => router.push('/onboarding')} />
        <Button
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
  middle: { flex: 1, justifyContent: 'center', gap: space.lg },
  headline: { fontFamily: fonts.displayHeavy, fontSize: 58, lineHeight: 56, color: colors.ink },
  sub: { fontSize: 17, lineHeight: 24, color: colors.ink },
  bottom: { gap: space.md, paddingBottom: space.lg },
  note: { fontSize: 13, color: colors.muted, textAlign: 'center' },
});
