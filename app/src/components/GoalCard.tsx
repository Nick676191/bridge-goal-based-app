// One goal post as it appears in the feed, on profiles and in Explore.
// The subject is set large in the condensed display face; that's the one bold
// typographic choice in the app. Everything else stays quiet.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@/data/store';
import type { Goal } from '@/data/types';
import { colors, fonts, space } from '@/theme';
import { timeAgo } from '@/lib/format';
import { Avatar } from './Avatar';
import { ActionBar } from './ActionBar';
import { MediaStrip } from './MediaStrip';
import { SetbackTag, StatusTag } from './ui';

export function GoalCard({ goal, full = false }: { goal: Goal; full?: boolean }) {
  const store = useStore();
  const me = store.state.me;
  const author = store.user(goal.author);
  const tips = store.tipsFor(goal.id);
  const updates = store.updatesFor(goal.id);
  const latest = updates[updates.length - 1];
  const committedNames = goal.committed
    .map((u) => store.user(u)?.name.split(' ')[0])
    .filter(Boolean) as string[];

  const open = (tab?: 'tips' | 'updates') =>
    router.push({ pathname: '/goal/[id]', params: { id: goal.id, tab: tab ?? 'updates' } });

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => router.push({ pathname: '/user/[username]', params: { username: goal.author } })}
        style={styles.authorRow}
        accessibilityRole="link"
        accessibilityLabel={`${author?.name}'s profile`}
      >
        <Avatar name={author?.name ?? goal.author} size={32} />
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{author?.name}</Text>
          <Text style={styles.meta}>
            @{goal.author}, {timeAgo(goal.createdAt)}
          </Text>
        </View>
        <Text style={styles.category}>{goal.category}</Text>
      </Pressable>

      <Pressable onPress={full ? undefined : () => open()} disabled={full} accessibilityRole={full ? undefined : 'link'}>
        <View style={styles.subjectRow}>
          <Text style={[styles.subject, goal.status === 'dropped' && styles.dropped]}>{goal.subject}</Text>
        </View>
        <StatusTag status={goal.status} />
        <Text style={styles.body} numberOfLines={full ? undefined : 3}>
          {goal.body}
        </Text>
      </Pressable>

      {goal.media?.length ? <MediaStrip media={goal.media} full={full} onPress={() => open()} /> : null}

      <Pressable onPress={full ? undefined : () => open()} disabled={full} accessibilityRole={full ? undefined : 'link'}>
        {committedNames.length > 0 && (
          <Text style={styles.committedLine}>
            {committedNames.length === 1
              ? `${committedNames[0]} committed to this`
              : `${committedNames.slice(0, 2).join(' and ')}${committedNames.length > 2 ? ` and ${committedNames.length - 2} more` : ''} committed to this`}
          </Text>
        )}

        {!full && latest && (
          <View style={styles.latest}>
            <View style={styles.latestHead}>
              <Text style={styles.latestLabel}>
                Latest update from {latest.author === me ? 'you' : store.user(latest.author)?.name.split(' ')[0]}
              </Text>
              {latest.setback && <SetbackTag />}
            </View>
            <Text style={styles.latestText} numberOfLines={2}>
              {latest.text}
            </Text>
          </View>
        )}
      </Pressable>

      <ActionBar
        tipCount={tips.length}
        committedCount={goal.committed.length}
        encouragedCount={goal.encouraged.length}
        committed={goal.committed.includes(me)}
        encouraged={goal.encouraged.includes(me)}
        isOwn={goal.author === me}
        onReply={() => open('tips')}
        onCommit={() => store.dispatch({ type: 'toggleCommit', goalId: goal.id })}
        onEncourage={() => store.dispatch({ type: 'toggleEncourage', goalId: goal.id })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: space.lg, paddingVertical: space.lg, gap: space.sm, backgroundColor: colors.paper },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  authorName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted },
  category: { fontSize: 13, fontWeight: '600', color: colors.muted },
  subjectRow: { marginTop: space.xs },
  subject: { fontFamily: fonts.display, fontSize: 34, lineHeight: 36, color: colors.ink, marginBottom: space.xs },
  dropped: { textDecorationLine: 'line-through', color: colors.muted },
  body: { fontSize: 16, lineHeight: 22, color: colors.ink, marginTop: space.xs },
  committedLine: { fontSize: 13, color: colors.lane, fontWeight: '600', marginTop: space.sm },
  latest: {
    marginTop: space.md,
    paddingLeft: space.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.hairline,
    gap: 4,
  },
  latestHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  latestLabel: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  latestText: { fontSize: 15, lineHeight: 20, color: colors.ink },
});
