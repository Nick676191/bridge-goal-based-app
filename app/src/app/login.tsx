// Log in with the email and password you signed up with.

import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/data/store';
import { Button, Field } from '@/components/ui';
import { colors, fonts, space } from '@/theme';

export default function Login() {
  const store = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const ready = /^\S+@\S+\.\S+$/.test(email.trim()) && password.length > 0 && !busy;

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setError('');
    try {
      await store.logIn(email, password);
      // Close the welcome and login screens and land on Home.
      if (router.canDismiss()) router.dismissAll();
      router.replace('/');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Welcome back</Text>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            autoComplete="current-password"
            onSubmitEditing={submit}
            returnKeyType="go"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
        <View style={styles.footer}>
          <Button label={busy ? 'Logging in…' : 'Log in'} onPress={submit} disabled={!ready} />
          <Pressable onPress={() => router.replace('/onboarding')} hitSlop={8}>
            <Text style={styles.switch}>New to PYN? Create an account</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  topBar: { paddingHorizontal: space.lg, paddingVertical: space.sm },
  content: { padding: space.xl, gap: space.lg },
  title: { fontFamily: fonts.displayHeavy, fontSize: 40, lineHeight: 42, color: colors.ink },
  error: { fontSize: 15, lineHeight: 21, color: colors.danger },
  footer: {
    padding: space.lg,
    gap: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  switch: { textAlign: 'center', fontSize: 15, fontWeight: '600', color: colors.lane },
});
