// Your own profile, with a gear button that opens Settings.

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/data/store';
import { ProfileView } from '@/components/ProfileView';
import { ScreenTitle } from '@/components/ui';
import { colors } from '@/theme';

export default function Profile() {
  const store = useStore();
  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <ScreenTitle
        right={
          <Pressable onPress={() => router.push('/settings')} hitSlop={10} accessibilityLabel="Settings">
            <Ionicons name="settings-outline" size={26} color={colors.ink} />
          </Pressable>
        }
      >
        Profile
      </ScreenTitle>
      <ProfileView username={store.state.me} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.paper } });
