// New goal post: a subject (the goal, up to 40 characters) and a body (the
// plan to start, up to 500). The checklist nudges toward a SMART goal but
// never blocks posting. Photos and a video are optional.

import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { newId, useStore } from '@/data/store';
import { CATEGORY_MAX, MAX_CATEGORIES_PER_GOAL, type Category, type Media } from '@/data/types';
import { MediaPicker } from '@/components/MediaPicker';
import { Button, Chip, Field, ScreenTitle } from '@/components/ui';
import { smartChecks } from '@/lib/format';
import { colors, fonts, space } from '@/theme';

const SUBJECT_MAX = 40;
const BODY_MAX = 500;

export default function Post() {
  const store = useStore();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  // Categories this goal belongs to, in the order picked (first = main one).
  const [categories, setCategories] = useState<Category[]>([]);
  const full = categories.length >= MAX_CATEGORIES_PER_GOAL;
  const toggleCategory = (c: Category) =>
    setCategories((list) =>
      list.includes(c) ? list.filter((x) => x !== c) : list.length >= MAX_CATEGORIES_PER_GOAL ? list : [...list, c]
    );
  const [media, setMedia] = useState<Media[]>([]);
  const [creating, setCreating] = useState(false); // the "New category" field is open
  const [newCategory, setNewCategory] = useState('');
  // Attainable and Relevant can't be checked automatically, so you tick them.
  const [attainable, setAttainable] = useState(false);
  const [relevant, setRelevant] = useState(false);

  // Adds the typed category (or picks the existing one if it's a duplicate).
  const createCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    const existing = store.findCategory(name);
    if (!existing) store.dispatch({ type: 'addCategory', name });
    const picked = existing ?? name;
    setCategories((list) => (list.includes(picked) || list.length >= MAX_CATEGORIES_PER_GOAL ? list : [...list, picked]));
    setNewCategory('');
    setCreating(false);
  };

  const checks = smartChecks(subject, body);
  const ready =
    subject.trim().length > 0 && subject.length <= SUBJECT_MAX && body.length <= BODY_MAX && categories.length > 0;

  const publish = () => {
    if (!ready) return;
    const id = newId('g');
    store.dispatch({
      type: 'addGoal',
      goal: {
        id,
        author: store.state.me,
        subject: subject.trim(),
        body: body.trim(),
        categories,
        status: 'active',
        createdAt: Date.now(),
        committed: [],
        encouraged: [],
        media,
      },
    });
    setSubject('');
    setBody('');
    setCategories([]);
    setMedia([]);
    setAttainable(false);
    setRelevant(false);
    router.push({ pathname: '/goal/[id]', params: { id } });
  };

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <ScreenTitle>New goal</ScreenTitle>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.form}>
            <Field
              label="Goal"
              max={SUBJECT_MAX}
              value={subject}
              onChangeText={setSubject}
              placeholder="Run a sub-4 hour marathon"
              hint="State the goal itself, like a headline."
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

            <MediaPicker value={media} onChange={setMedia} />

            <View style={{ gap: space.sm }}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Categories</Text>
                <Text style={styles.counter}>
                  {categories.length}/{MAX_CATEGORIES_PER_GOAL}
                </Text>
              </View>
              <Text style={styles.hintSmall}>Pick up to {MAX_CATEGORIES_PER_GOAL}. The first one you pick shows first.</Text>
              <View style={styles.chips}>
                {store.allCategories.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    selected={categories.includes(c)}
                    // Once 3 are picked, the others wait until you unpick one.
                    dimmed={full && !categories.includes(c)}
                    onPress={() => toggleCategory(c)}
                  />
                ))}
                {!creating && !full && (
                  <Pressable
                    onPress={() => setCreating(true)}
                    style={styles.newChip}
                    accessibilityRole="button"
                    accessibilityLabel="Create a new category"
                  >
                    <Ionicons name="add" size={16} color={colors.ink} />
                    <Text style={styles.newChipText}>New category</Text>
                  </Pressable>
                )}
              </View>
              {creating && (
                <View style={styles.newRow}>
                  <TextInput
                    value={newCategory}
                    onChangeText={setNewCategory}
                    placeholder="e.g. Hiking, Pickleball, Rowing"
                    placeholderTextColor={colors.muted}
                    maxLength={CATEGORY_MAX}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={createCategory}
                    style={styles.newInput}
                    accessibilityLabel="New category name"
                  />
                  <Button label="Add" onPress={createCategory} disabled={!newCategory.trim()} style={styles.newAdd} />
                  <Pressable onPress={() => { setCreating(false); setNewCategory(''); }} hitSlop={8} accessibilityLabel="Cancel new category">
                    <Ionicons name="close" size={22} color={colors.muted} />
                  </Pressable>
                </View>
              )}
              {creating ? (
                <Text style={styles.hintSmall}>
                  Others can pick your category once you post. Up to {CATEGORY_MAX} characters.
                </Text>
              ) : null}
            </View>

            <View style={styles.smart}>
              <Text style={styles.label}>SMART Principles</Text>
              <Check ok={checks.plan} text="A first step: describe how you'll start." />
              <Check ok={checks.specific} text="Specific: say exactly what you'll do." />
              <Check ok={checks.measurable} text="Measurable: quantify your goal. Put a number to it that makes it more objective." />
              <Check
                ok={attainable}
                onPress={() => setAttainable((v) => !v)}
                text="Attainable: set a goal that is realistic."
              />
              <Check
                ok={relevant}
                onPress={() => setRelevant((v) => !v)}
                text="Relevant: ensure your goal is relevant to your life and overall interests."
              />
              <Check
                ok={checks.timely}
                text="Timely: state when, either a date or number of weeks until you will accomplish this goal."
              />
              <Text style={styles.hintSmall}>
                {"The others check themselves as you write. Tap Attainable and Relevant once you're sure."}
              </Text>
            </View>

            <Button label="Post goal" onPress={publish} disabled={!ready} />
            {categories.length === 0 && subject.trim() ? (
              <Text style={styles.why}>Pick at least one category to post.</Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// One SMART principle. With onPress it's a box you tick yourself; without it,
// it fills in automatically when the goal text meets it.
function Check({ ok, text, onPress }: { ok: boolean; text: string; onPress?: () => void }) {
  const Row = onPress ? Pressable : View;
  return (
    <Row
      style={styles.check}
      {...(onPress
        ? { onPress, accessibilityRole: 'checkbox' as const, accessibilityState: { checked: ok }, hitSlop: 4 }
        : {})}
    >
      <Ionicons
        name={ok ? 'checkmark-circle' : onPress ? 'square-outline' : 'ellipse-outline'}
        size={18}
        color={ok ? colors.lane : colors.muted}
      />
      <Text style={[styles.checkText, ok && { color: colors.ink }]}>{text}</Text>
    </Row>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: 48 },
  form: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.xl },
  preview: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 36,
    color: colors.ink,
    marginTop: -space.sm,
  },
  label: { fontSize: 14, fontWeight: '700', color: colors.ink },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  counter: { fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  smart: { gap: space.sm, padding: space.md, backgroundColor: colors.wash, borderRadius: 4 },
  check: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  newChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink,
  },
  newChipText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  newRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  newInput: {
    flex: 1,
    backgroundColor: colors.wash,
    borderRadius: 4,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
    color: colors.ink,
  },
  newAdd: { minHeight: 44, paddingHorizontal: space.lg },
  hintSmall: { fontSize: 13, lineHeight: 18, color: colors.muted },
  checkText: { fontSize: 14, lineHeight: 19, color: colors.muted, flex: 1 },
  why: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: -space.md },
});
