// The Messages inbox: one row per person you've messaged, newest first.
// Goals you send someone from the Share screen land here too.

import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/data/store';
import { Avatar } from '@/components/Avatar';
import { Button, Divider } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { colors, space } from '@/theme';

export default function Inbox() {
  const store = useStore();
  const me = store.state.me;

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push('/messages/new')} hitSlop={10} accessibilityLabel="New message">
              <Ionicons name="create-outline" size={24} color={colors.navy} />
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={store.conversations}
        keyExtractor={(c) => c.with}
        ItemSeparatorComponent={() => <Divider />}
        renderItem={({ item }) => {
          const person = store.user(item.with);
          const name = person?.name ?? item.with;
          const last = item.last;
          // The preview line: the text, or what was shared if there's no text.
          const goal = last.goalId ? store.goal(last.goalId) : undefined;
          const body = last.text ?? (goal ? `Shared "${goal.subject}"` : '');
          const preview = `${last.from === me ? 'You: ' : ''}${last.goalId && last.text ? 'Shared a goal: ' : ''}${body}`;
          const unread = item.unread > 0;
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/messages/[username]', params: { username: item.with } })}
              style={[styles.row, unread && styles.unreadRow]}
              accessibilityRole="link"
              accessibilityLabel={`Conversation with ${name}${unread ? ', unread' : ''}`}
            >
              <Avatar name={name} uri={person?.avatarUri} size={48} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.topLine}>
                  <Text style={[styles.name, unread && { fontWeight: '800' }]} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.time}>{timeAgo(last.createdAt)}</Text>
                </View>
                <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={2}>
                  {preview}
                </Text>
              </View>
              {unread && <View style={styles.dot} />}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyText}>
              Share a goal with someone, or start a conversation with anyone you follow.
            </Text>
            <Button label="New message" onPress={() => router.push('/messages/new')} />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  unreadRow: { backgroundColor: colors.laneWash },
  topLine: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.ink },
  time: { fontSize: 13, color: colors.muted },
  preview: { fontSize: 14, lineHeight: 19, color: colors.muted },
  previewUnread: { color: colors.ink, fontWeight: '600' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.carolina },
  empty: { padding: space.xl, gap: space.md },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  emptyText: { fontSize: 16, lineHeight: 22, color: colors.muted },
});
