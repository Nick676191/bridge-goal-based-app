// A profile: photo, bio, followers and following, and two lists:
// goals they posted and goals they committed to. Used for your own Profile tab
// and for other people's profiles.

import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/data/store';
import { Avatar } from './Avatar';
import { GoalCard } from './GoalCard';
import { Button, Divider } from './ui';
import { colors, fonts, space } from '@/theme';

export function ProfileView({ username }: { username: string }) {
  const store = useStore();
  const [tab, setTab] = useState<'posted' | 'committed'>('posted');
  const user = store.user(username);
  if (!user) return <Text style={{ padding: space.xl }}>{"This account doesn't exist."}</Text>;

  const isMe = username === store.state.me;
  const blocked = store.state.blocked.includes(username);
  const posted = store.state.goals.filter((g) => g.author === username);
  const committed = store.state.goals.filter((g) => g.committed.includes(username));
  const list = tab === 'posted' ? posted : committed;
  const followers = store.followers(username).length;

  const moreMenu = () => {
    const report = () =>
      confirm('Report this account?', 'We review reports within 24 hours.', 'Report', () => {});
    const block = () =>
      confirm(
        `Block ${user.name}?`,
        "You won't see their goals, tips or updates, and they won't see yours.",
        'Block',
        () => store.dispatch({ type: 'block', username })
      );
    if (Platform.OS === 'web') {
      block();
      return;
    }
    Alert.alert(user.name, undefined, [
      { text: 'Report account', onPress: report },
      { text: 'Block', style: 'destructive', onPress: block },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
      <View style={styles.head}>
        <View style={styles.headTop}>
          <Pressable
            onPress={isMe ? () => router.push('/edit-profile') : undefined}
            disabled={!isMe}
            accessibilityLabel={isMe ? 'Change profile photo' : undefined}
          >
            <Avatar name={user.name} uri={user.avatarUri} size={72} />
          </Pressable>
          <View style={styles.stats}>
            <Stat n={posted.length} label="Goals" />
            <Stat n={followers} label="Followers" />
            <Stat n={user.following.length} label="Following" />
          </View>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.handle}>@{user.username}</Text>
        <Text style={styles.bio}>{user.bio}</Text>

        <View style={styles.buttons}>
          {isMe ? (
            <Button label="Edit profile" variant="secondary" style={{ flex: 1 }} onPress={() => router.push('/edit-profile')} />
          ) : blocked ? (
            <Button label="Unblock" variant="secondary" style={{ flex: 1 }} onPress={() => store.dispatch({ type: 'unblock', username })} />
          ) : (
            <>
              <Button
                label={store.isFollowing(username) ? 'Following' : 'Follow'}
                variant={store.isFollowing(username) ? 'secondary' : 'primary'}
                style={{ flex: 1 }}
                onPress={() => store.dispatch({ type: 'toggleFollow', username })}
              />
              <Pressable onPress={moreMenu} style={styles.more} accessibilityLabel="More options">
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.ink} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      {blocked ? (
        <Text style={styles.empty}>You blocked this account. Their goals are hidden.</Text>
      ) : (
        <>
          <View style={styles.tabs}>
            <TabButton label={`Posted ${posted.length}`} on={tab === 'posted'} onPress={() => setTab('posted')} />
            <TabButton label={`Committed ${committed.length}`} on={tab === 'committed'} onPress={() => setTab('committed')} />
          </View>
          <Divider strong />
          {list.length === 0 && (
            <Text style={styles.empty}>
              {tab === 'posted'
                ? isMe
                  ? 'Post your first goal from the Post tab.'
                  : 'No goals posted yet.'
                : isMe
                  ? 'Press Commit on someone\'s goal to join them. It will show here.'
                  : 'Not committed to any goals yet.'}
            </Text>
          )}
          {list.map((g, i) => (
            <View key={g.id}>
              {i > 0 && <Divider strong />}
              <GoalCard goal={g} />
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

// Alert.alert has no buttons on web, so the web preview uses the browser's
// confirm dialog instead.
export function confirm(title: string, message: string, action: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: action, style: 'destructive', onPress: onConfirm },
  ]);
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={{ alignItems: 'center', minWidth: 64 }}>
      <Text style={styles.statN}>{n}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function TabButton({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, on && styles.tabOn]}
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
    >
      <Text style={[styles.tabText, on && { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg, gap: 2 },
  headTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  stats: { flexDirection: 'row', gap: space.sm },
  statN: { fontFamily: fonts.display, fontSize: 26, lineHeight: 28, color: colors.ink },
  statLabel: { fontSize: 12, color: colors.muted },
  name: { fontFamily: fonts.display, fontSize: 30, lineHeight: 32, color: colors.ink },
  handle: { fontSize: 14, color: colors.muted },
  bio: { fontSize: 15, lineHeight: 21, color: colors.ink, marginTop: space.sm },
  buttons: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  more: {
    width: 48,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: { flexDirection: 'row', paddingHorizontal: space.lg, gap: space.xl },
  tab: { paddingVertical: space.md, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: colors.ink },
  tabText: { fontSize: 15, fontWeight: '700', color: colors.muted },
  empty: { padding: space.xl, fontSize: 15, lineHeight: 21, color: colors.muted },
});
