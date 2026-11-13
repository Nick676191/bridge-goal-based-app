// Forgot password, in two screens' worth of steps on one page:
//   1. Enter your email; PYN emails you a code.
//   2. Enter the code and a new password; you're logged in with it.
// Everything happens in the app, so there's no link to open from the email.

import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/data/store';
import { sendResetCode } from '@/data/api';
import { Button, Field } from '@/components/ui';
import { colors, fonts, space } from '@/theme';

export default function ForgotPassword() {
  const store = useStore();
  // The login screen passes along the email if you'd already typed it.
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [verified, setVerified] = useState(false); // the code already worked once
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  // Supabase codes are 6 digits by default (up to 10 if changed in settings).
  const codeOk = verified || /^\d{6,10}$/.test(code.trim());
  const canReset = codeOk && password.length >= 8 && !busy;

  const send = async () => {
    if (!emailOk || busy) return;
    setBusy(true);
    setError('');
    try {
      await sendResetCode(email);
      setStep('code');
      // Same message whether or not the email has an account, so this screen
      // can't be used to find out who's on PYN.
      setNote(`If ${email.trim()} has a PYN account, a code is on its way. It can take a minute; check spam too.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!canReset) return;
    setBusy(true);
    setError('');
    try {
      await store.resetPassword(email, code, password, verified);
      if (router.canDismiss()) router.dismissAll();
      router.replace('/');
    } catch (e) {
      if ((e as { verified?: boolean }).verified) setVerified(true);
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
          <Text style={styles.title}>Reset your password</Text>

          {step === 'email' ? (
            <>
              <Text style={styles.body}>Enter the email you signed up with and we’ll send you a code.</Text>
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
                onSubmitEditing={send}
                returnKeyType="send"
              />
            </>
          ) : (
            <>
              <Text style={styles.body}>{note}</Text>
              {!verified && (
                <Field
                  label="Code from the email"
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  maxLength={10}
                  placeholder="123456"
                />
              )}
              <Field
                label="New password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
                placeholder="at least 8 characters"
                onSubmitEditing={reset}
                returnKeyType="go"
              />
              {!verified && (
                <Pressable onPress={send} disabled={busy} hitSlop={8}>
                  <Text style={styles.link}>Didn’t get it? Send a new code</Text>
                </Pressable>
              )}
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
        <View style={styles.footer}>
          {step === 'email' ? (
            <Button label={busy ? 'Sending…' : 'Send code'} onPress={send} disabled={!emailOk || busy} />
          ) : (
            <Button label={busy ? 'Saving…' : 'Save new password'} onPress={reset} disabled={!canReset} />
          )}
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
  body: { fontSize: 16, lineHeight: 22, color: colors.ink },
  link: { fontSize: 15, fontWeight: '600', color: colors.lane },
  error: { fontSize: 15, lineHeight: 21, color: colors.danger },
  footer: {
    padding: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
});
