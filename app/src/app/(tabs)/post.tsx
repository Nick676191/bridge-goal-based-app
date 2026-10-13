// New goal post: a subject (the goal, up to 40 characters) and a body (the
// plan to start, up to 500). The checklist nudges toward a SMART goal but
// never blocks posting.

import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { newId, useStore } from '@/data/store';
import { CATEGORIES, type Category } from '@/data/types';
import { Button, Chip, Field, ScreenTitle } from '@/components/ui';
import { smartChecks } from '@/lib/format';
import { colors, fonts, space } from '@/theme';

const SUBJECT_MAX = 40;
const BODY_MAX = 500;

export default function Post() {
  const store = useStore();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<Category | null>(null);

  const checks = smartChecks(subject, body);
  const ready =
    subject.trim().length > 0 && subject.length <= SUBJECT_MAX && body.length <= BODY_MAX && category !== null;

  const publish = () => {
    if (!ready || !category) return;
    const id = newId('g');
    store.dispatch({
      type: 'addGoal',
      goal: {
        id,
        author: store.state.me,
        subject: subject.trim(),
        body: body.trim(),
        category,
        status: 'active',
        createdAt: Date.now(),
        committed: [],
        encouraged: [],
      },
    });
    setSubject('');
    setBody('');
    setCategory(null);
    router.push({ pathname: '/goal/[id]', params: { id } });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <ScreenTitle>New goal</ScreenTitle>
          <View style={styles.form}>
            <Field
              label="Goal"
              max={SUBJECT_MAX}
              value={subject}
              onChangeText={setSubject}
              placeholder="Run a sub-4 hour marathon"
              hint="State the goal itself. Your old sport goes on your profile, not here."
            />

            {/* Live preview in the same type the feed uses, so the subject
                reads like a headline as you write it. */}
            {subject.trim() ? <Text style={styles.preview}>{subject}</Text> : null}

            <Field
              label="Your plan to start"
              max={BODY_MAX}
              value={body}
              onChangeText={setBody}
              multiline
              placeholder="What you'll do first, how often, and by when."
            />

            <View style={{ gap: space.sm }}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.chips}>
                {CATEGORIES.map((c) => (
                  <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
                ))}
              </View>
            </View>

            <View style={styles.smart}>
              <Text style={styles.label}>Make it SMART</Text>
              <Check ok={checks.specific} text="Specific: say exactly what you'll do" />
              <Check ok={checks.measurable} text="Measurable: put a number in the goal" />
              <Check ok={checks.timely} text="Timely: say when, like a date or a number of weeks" />
              <Check ok={checks.plan} text="A first step: describe how you'll start" />
            </View>

            <Button label="Post goal" onPress={publish} disabled={!ready} />
            {!category && subject.trim() ? (
              <Text style={styles.why}>Pick a category to post.</Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Check({ ok, text }: { ok: boolean; text: string }) {
  return (
    <View style={styles.check}>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={ok ? colors.lane : colors.muted}
      />
      <Text style={[styles.checkText, ok && { color: colors.ink }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: 48 },
  form: { paddingHorizontal: space.lg, gap: space.xl },
  preview: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 36,
    color: colors.ink,
    marginTop: -space.sm,
  },
  label: { fontSize: 14, fontWeight: '700', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  smart: { gap: space.sm, padding: space.md, backgroundColor: colors.wash, borderRadius: 4 },
  check: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  checkText: { fontSize: 14, color: colors.muted, flex: 1 },
  why: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: -space.md },
});
