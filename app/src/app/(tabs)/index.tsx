// Home feed: posts from people you follow (and yours), then active posts in
// the categories you picked. Posts are separated by thin black bars.

import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '@/data/store';
import { rankFeed } from '@/lib/rank';
import { GoalCard } from '@/components/GoalCard';
import { Button, Divider, ScreenTitle } from '@/components/ui';
import { APP_NAME, colors, fonts, space } from '@/theme';
import type { Goal } from '@/data/types';

type Row = { kind: 'goal'; goal: Goal } | { kind: 'section'; label: string };

export default function Home() {
  const store = useStore();
  const { me, interests } = store.state;
  const feed = rankFeed(store.visibleGoals, me, store.meUser.following, interests);

  // Insert a small label where the feed switches from people you follow to
  // posts suggested from your categories, so the order makes sense.
  const rows: Row[] = [];
  let suggestedStarted = false;
  for (const g of feed) {
    const followed = g.author === me || store.meUser.following.includes(g.author);
    if (!followed && !suggestedStarted) {
      suggestedStarted = true;
      rows.push({ kind: 'section', label: `More in ${interests.join(', ')}` });
    }
    rows.push({ kind: 'goal', goal: g });
  }

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      {/* The app's name in the blue band, in place of a page title. */}
      <ScreenTitle size={38}>{APP_NAME}</ScreenTitle>
      <FlatList
        data={rows}
        keyExtractor={(r) => (r.kind === 'goal' ? r.goal.id : r.label)}
        renderItem={({ item }) =>
          item.kind === 'goal' ? (
            <GoalCard goal={item.goal} />
          ) : (
            <Text style={styles.section}>{item.label}</Text>
          )
        }
        ItemSeparatorComponent={() => <Divider strong />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Your feed is empty</Text>
            <Text style={styles.emptyText}>
              Post a goal, or follow people chasing something similar to fill it.
            </Text>
            <Button label="Post a goal" onPress={() => router.push('/post')} />
            <Button label="Find people in Explore" variant="secondary" onPress={() => router.push('/explore')} />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: space.lg, paddingTop: space.xs, paddingBottom: space.sm },
  wordmark: { fontFamily: fonts.displayHeavy, fontSize: 36, lineHeight: 38, letterSpacing: 1, color: colors.ink },
  section: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    backgroundColor: colors.wash,
  },
  empty: { padding: space.xl, gap: space.md },
  emptyTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  emptyText: { fontSize: 16, lineHeight: 22, color: colors.muted },
});
