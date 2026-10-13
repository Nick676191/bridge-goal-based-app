// Explore: search goals and people, the top 5 trending posts, and browse by
// category. Typing in the search box replaces the trending list with results.

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/data/store';
import { trending } from '@/lib/rank';
import { CATEGORIES, type Category } from '@/data/types';
import { Chip, Divider, ScreenTitle } from '@/components/ui';
import { Avatar } from '@/components/Avatar';
import { GoalCard } from '@/components/GoalCard';
import { colors, fonts, space } from '@/theme';
import { plural } from '@/lib/format';

export default function Explore() {
  const store = useStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const q = query.trim().toLowerCase();

  const goals = store.visibleGoals;
  const top = useMemo(() => trending(goals, store.state.updates), [goals, store.state.updates]);

  const people = q
    ? store.state.users.filter(
        (u) =>
          u.username !== store.state.me &&
          !store.state.blocked.includes(u.username) &&
          (u.name.toLowerCase().includes(q) || u.username.includes(q) || u.originSport?.toLowerCase().includes(q))
      )
    : [];
  const goalResults = q
    ? goals.filter((g) => `${g.subject} ${g.body} ${g.category}`.toLowerCase().includes(q))
    : [];
  const inCategory = category ? goals.filter((g) => g.category === category && g.status === 'active') : [];

  const countFor = (c: Category) => goals.filter((g) => g.category === c && g.status === 'active').length;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: space.xxl }}>
        <ScreenTitle>Explore</ScreenTitle>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search goals and people"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Search goals and people"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        {q ? (
          <>
            <Text style={styles.heading}>People</Text>
            {people.length === 0 && <Text style={styles.none}>{`No people match "${query}".`}</Text>}
            {people.map((u) => (
              <Pressable
                key={u.username}
                style={styles.person}
                onPress={() => router.push({ pathname: '/user/[username]', params: { username: u.username } })}
              >
                <Avatar name={u.name} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>{u.name}</Text>
                  <Text style={styles.personMeta}>@{u.username}</Text>
                </View>
              </Pressable>
            ))}
            <Text style={styles.heading}>Goals</Text>
            {goalResults.length === 0 && <Text style={styles.none}>{`No goals match "${query}".`}</Text>}
            {goalResults.map((g) => (
              <View key={g.id}>
                <Divider strong />
                <GoalCard goal={g} />
              </View>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.heading}>Categories</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  label={`${c} ${countFor(c)}`}
                  selected={category === c}
                  onPress={() => setCategory(category === c ? null : c)}
                />
              ))}
            </View>

            {category ? (
              <>
                <Text style={styles.heading}>
                  {category}, {plural(inCategory.length, 'active goal')}
                </Text>
                {inCategory.length === 0 && (
                  <Text style={styles.none}>Nobody has posted a {category.toLowerCase()} goal yet. Be the first.</Text>
                )}
                {inCategory.map((g) => (
                  <View key={g.id}>
                    <Divider strong />
                    <GoalCard goal={g} />
                  </View>
                ))}
              </>
            ) : (
              <>
                <Text style={styles.heading}>Trending this week</Text>
                {top.map((g, i) => (
                  <Pressable
                    key={g.id}
                    style={styles.trendRow}
                    onPress={() => router.push({ pathname: '/goal/[id]', params: { id: g.id } })}
                    accessibilityRole="link"
                  >
                    <Text style={styles.rank}>{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.trendSubject}>{g.subject}</Text>
                      <Text style={styles.personMeta}>
                        {store.user(g.author)?.name}, {g.category}. {plural(g.committed.length, 'commit')},{' '}
                        {plural(g.encouraged.length, 'encouragement')}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  searchBox: {
    marginHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.wash,
    borderRadius: 4,
    paddingHorizontal: space.md,
    minHeight: 44,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.ink, paddingVertical: space.sm },
  heading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    paddingHorizontal: space.lg,
    marginTop: space.xl,
    marginBottom: space.sm,
  },
  none: { paddingHorizontal: space.lg, color: colors.muted, fontSize: 15, marginBottom: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingHorizontal: space.lg },
  person: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm },
  personName: { fontSize: 16, fontWeight: '700', color: colors.ink },
  personMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  trendRow: {
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    alignItems: 'flex-start',
  },
  rank: { fontFamily: fonts.displayHeavy, fontSize: 40, lineHeight: 40, width: 28, color: colors.lane },
  trendSubject: { fontFamily: fonts.display, fontSize: 24, lineHeight: 26, color: colors.ink },
});
