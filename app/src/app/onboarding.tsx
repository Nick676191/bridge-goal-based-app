// Sign-up in three steps, then straight to writing your first goal.
//   1. Account: username, email, password (no phone number; see the plan doc)
//   2. About you: name and an optional short bio
//   3. Categories you care about, which seed your home feed

import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/data/store';
import { CATEGORIES, type Category } from '@/data/types';
import { Button, Chip, Field } from '@/components/ui';
import { colors, fonts, space } from '@/theme';

export default function Onboarding() {
  const store = useStore();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<Category[]>([]);

  const emailOk = /^\S+@\S+\.\S+$/.test(email);
  const canNext =
    step === 1 ? username.trim().length >= 3 && emailOk && password.length >= 8 : step === 2 ? name.trim().length > 0 : interests.length > 0;

  const next = () => {
    if (step < 3) return setStep(step + 1);
    store.dispatch({ type: 'signIn', name: name.trim(), bio: bio.trim() || undefined, interests });
    router.replace('/post');
  };

  const toggleInterest = (c: Category) =>
    setInterests((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]));

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => (step === 1 ? router.back() : setStep(step - 1))}
          hitSlop={10}
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <Text style={styles.stepText}>Step {step} of 3</Text>
      </View>
      <View style={styles.progress}>
        <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 1 && (
            <>
              <Text style={styles.title}>Create your account</Text>
              <Pressable style={styles.apple} accessibilityRole="button" onPress={() => setStep(2)}>
                <Ionicons name="logo-apple" size={20} color={colors.paper} />
                <Text style={styles.appleText}>Continue with Apple</Text>
              </Pressable>
              <Text style={styles.or}>or use email</Text>
              <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} placeholder="at least 3 characters" />
              <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
              <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="at least 8 characters" />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.title}>About you</Text>
              <Field label="Name" value={name} onChangeText={setName} placeholder="How people will see you" />
              <Field
                label="Bio (optional)"
                value={bio}
                onChangeText={setBio}
                multiline
                max={160}
                placeholder="What you're working toward, in a sentence or two"
              />
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.title}>What are you chasing now?</Text>
              <Text style={styles.hint}>Pick at least one. Your home feed starts with goals in these categories.</Text>
              <View style={styles.chips}>
                {CATEGORIES.map((c) => (
                  <Chip key={c} label={c} selected={interests.includes(c)} onPress={() => toggleInterest(c)} />
                ))}
              </View>
            </>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <Button label={step === 3 ? 'Write your first goal' : 'Continue'} onPress={next} disabled={!canNext} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.sm },
  stepText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  progress: { height: 3, backgroundColor: colors.hairline },
  progressFill: { height: 3, backgroundColor: colors.ink },
  content: { padding: space.xl, gap: space.lg },
  title: { fontFamily: fonts.displayHeavy, fontSize: 40, lineHeight: 42, color: colors.ink },
  apple: {
    minHeight: 48,
    borderRadius: 4,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  appleText: { color: colors.paper, fontSize: 16, fontWeight: '700' },
  or: { textAlign: 'center', color: colors.muted, fontSize: 14 },
  label: { fontSize: 14, fontWeight: '700', color: colors.ink },
  hint: { fontSize: 14, lineHeight: 20, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  footer: { padding: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline },
});
