// Share a goal. Two ways:
//   1. Send to people on TENET: pick people, add a note; they get it in Activity.
//   2. Share outside TENET: the iPhone share sheet (Messages, copy link,
//      AirDrop, other apps), with a ready-made message and link.

import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/data/store';
import { Avatar } from '@/components/Avatar';
import { Button, Divider } from '@/components/ui';
import { shareText } from '@/lib/share';
import { colors, fonts, space } from '@/theme';

const notify = (title: string, message: string) =>
  Platform.OS === 'web' ? window.alert(`${title}\n\n${message}`) : Alert.alert(title, message);

export default function ShareGoal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const goal = store.goal(id);
  const [note, setNote] = useState('');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string[]>([]);

  // People you're connected to (following or followers), excluding you and
  // anyone blocked. People you follow come first.
  const people = useMemo(() => {
    const me = store.state.me;
    const following = store.meUser.following;
    const followers = store.followers(me).map((u) => u.username);
    const names = [...new Set([...following, ...followers])].filter(
      (u) => u !== me && !store.state.blocked.includes(u)
    );
    return names.map((u) => store.user(u)).filter((u): u is NonNullable<typeof u> => !!u);
  }, [store]);

  if (!goal) return <Text style={styles.empty}>This goal was deleted.</Text>;
  const author = store.user(goal.author);

  const q = query.trim().toLowerCase();
  const shown = q ? people.filter((u) => u.name.toLowerCase().includes(q) || u.username.includes(q)) : people;
  const toggle = (u: string) => setPicked((p) => (p.includes(u) ? p.filter((x) => x !== u) : [...p, u]));

  const sendInApp = () => {
    store.dispatch({ type: 'shareGoal', goalId: goal.id, to: picked, message: note });
    const names = picked.map((u) => store.user(u)?.name.split(' ')[0] ?? u);
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
    notify('Sent', `${list} will see it in their Activity tab.`);
    router.back();
  };

  const moreOptions = () => Share.share({ message: shareText(goal, author, note, store.state.me) });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* What you're sharing */}
      <View style={styles.preview}>
        <Text style={styles.previewWho}>{author?.name}</Text>
        <Text style={styles.previewSubject}>{goal.subject}</Text>
      </View>

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Add a note (optional)"
        placeholderTextColor={colors.muted}
        style={styles.note}
        multiline
        maxLength={200}
        accessibilityLabel="Note to include"
      />

      <Text style={styles.heading}>Send to people on TENET</Text>
      <View style={styles.search}>
        <Ionicons name="search" size={16} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search people you follow"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <View style={styles.list}>
        {shown.length === 0 && <Text style={styles.none}>No one matches. Follow people from Explore to share with them.</Text>}
        {shown.map((u, i) => {
          const on = picked.includes(u.username);
          return (
            <View key={u.username}>
              {i > 0 && <Divider />}
              <Pressable
                onPress={() => toggle(u.username)}
                style={styles.person}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
              >
                <Avatar name={u.name} uri={u.avatarUri} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>{u.name}</Text>
                  <Text style={styles.personHandle}>@{u.username}</Text>
                </View>
                <Ionicons
                  name={on ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={on ? colors.lane : colors.hairline}
                />
              </Pressable>
            </View>
          );
        })}
      </View>
      <Button
        label={picked.length ? `Send to ${picked.length} ${picked.length === 1 ? 'person' : 'people'}` : 'Pick people to send to'}
        onPress={sendInApp}
        disabled={picked.length === 0}
      />

      {/* Everything outside the app goes through the iPhone share sheet,
          which includes Messages, so a text is one tap away. */}
      <Text style={[styles.heading, { marginTop: space.lg }]}>Share outside TENET</Text>
      <Pressable
        onPress={moreOptions}
        style={({ pressed }) => [styles.more, pressed && { opacity: 0.8 }]}
        accessibilityRole="button"
        accessibilityLabel="More options: Messages, copy link, AirDrop, other apps"
      >
        <View style={styles.moreIcon}>
          <Ionicons name="share-outline" size={26} color={colors.navy} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.moreTitle}>More options</Text>
          <Text style={styles.moreSub}>Messages, copy link, AirDrop, other apps</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.navy} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: space.lg, gap: space.md, paddingBottom: 64 },
  empty: { padding: space.xl, fontSize: 15, color: colors.muted },
  preview: {
    backgroundColor: colors.carolinaWash,
    borderLeftWidth: 4,
    borderLeftColor: colors.carolina,
    padding: space.md,
    borderRadius: 4,
    gap: 2,
  },
  previewWho: { fontSize: 13, fontWeight: '700', color: colors.muted },
  previewSubject: { fontFamily: fonts.display, fontSize: 26, lineHeight: 28, color: colors.navy },
  note: {
    backgroundColor: colors.wash,
    borderRadius: 4,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
    minHeight: 64,
    color: colors.ink,
  },
  heading: { fontSize: 16, fontWeight: '800', color: colors.navy, marginTop: space.sm },
  hint: { fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: -space.xs },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.wash,
    borderRadius: 4,
    paddingHorizontal: space.md,
    minHeight: 40,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.ink, paddingVertical: space.sm },
  list: { borderWidth: 1, borderColor: colors.hairline, borderRadius: 4 },
  none: { padding: space.md, fontSize: 14, color: colors.muted },
  person: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: 10 },
  personName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  personHandle: { fontSize: 13, color: colors.muted },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 72,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: colors.carolina,
    borderRadius: 12,
  },
  moreIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreTitle: { fontSize: 19, fontWeight: '800', color: colors.navy },
  moreSub: { fontSize: 14, color: colors.navy, marginTop: 2 },
});
