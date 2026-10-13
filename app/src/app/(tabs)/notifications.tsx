// Notifications: encouragements, commits, replies, updates from people
// committed to your goals, new followers, and reminders to post an update.
// In the real app, reminders arrive every 24-72 hours as push notifications,
// capped at one a day (see Settings).

import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/data/store';
import type { AppNotification } from '@/data/types';
import { Divider, ScreenTitle } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { colors, space } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function Notifications() {
  const store = useStore();
  const list = store.state.notifications.filter((n) => !n.actor || !store.state.blocked.includes(n.actor));

  // Mark everything read when you leave the screen, so unread items stay
  // highlighted while you're looking at them.
  useFocusEffect(
    React.useCallback(() => {
      return () => store.dispatch({ type: 'markAllRead' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const describe = (n: AppNotification): { icon: IconName; color: string; text: string } => {
    const who = n.actor ? store.user(n.actor)?.name ?? n.actor : '';
    const subject = n.goalId ? store.goal(n.goalId)?.subject : '';
    switch (n.kind) {
      case 'reminder':
        return { icon: 'time-outline', color: colors.lane, text: `Time for an update on "${subject}". How did this week go?` };
      case 'encourage':
        return { icon: 'arrow-forward-circle', color: colors.lane, text: `${who} encouraged "${subject}"` };
      case 'commit':
        return { icon: 'close', color: colors.ink, text: `${who} committed to "${subject}"` };
      case 'tip':
        return { icon: 'chatbubble-outline', color: colors.ink, text: `${who} left a tip on "${subject}"` };
      case 'update':
        return { icon: 'flag-outline', color: colors.ink, text: `${who} posted an update on "${subject}"` };
      case 'follow':
        return { icon: 'person-add-outline', color: colors.ink, text: `${who} followed you` };
    }
  };

  const open = (n: AppNotification) => {
    if (n.goalId)
      router.push({
        pathname: '/goal/[id]',
        params: { id: n.goalId, tab: n.kind === 'tip' ? 'tips' : 'updates', compose: n.kind === 'reminder' ? '1' : undefined },
      });
    else if (n.actor) router.push({ pathname: '/user/[username]', params: { username: n.actor } });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenTitle>Activity</ScreenTitle>
      <Divider strong />
      <FlatList
        data={list}
        keyExtractor={(n) => n.id}
        ItemSeparatorComponent={() => <Divider />}
        renderItem={({ item }) => {
          const d = describe(item);
          return (
            <Pressable
              onPress={() => open(item)}
              style={[styles.row, !item.read && styles.unread]}
              accessibilityRole="link"
            >
              <View style={styles.icon}>
                <Ionicons name={d.icon} size={20} color={d.color} />
              </View>
              <Text style={[styles.text, !item.read && { fontWeight: '600' }]}>{d.text}</Text>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Nothing yet. Post a goal and people will find it.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, padding: space.lg },
  unread: { backgroundColor: colors.laneWash },
  icon: { width: 24, alignItems: 'center', paddingTop: 1 },
  text: { flex: 1, fontSize: 15, lineHeight: 21, color: colors.ink },
  time: { fontSize: 13, color: colors.muted },
  empty: { padding: space.xl, fontSize: 16, color: colors.muted },
});
