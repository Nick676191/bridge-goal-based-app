// Followers and Following for one person, opened by tapping those numbers on
// a profile. Each row opens that person's profile and has a Follow button.

import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/data/store';
import { Avatar } from '@/components/Avatar';
import { TabButton } from '@/components/ProfileView';
import { Button, Divider } from '@/components/ui';
import { colors, space } from '@/theme';

export default function Connections() {
  const params = useLocalSearchParams<{ username: string; tab?: string }>();
  const store = useStore();
  const [tab, setTab] = useState<'followers' | 'following'>(params.tab === 'following' ? 'following' : 'followers');
  const user = store.user(params.username);
  if (!user) return <Text style={styles.empty}>{"This account doesn't exist."}</Text>;

  const me = store.state.me;
  const isMe = user.username === me;
  const hidden = (u: string) => store.state.blocked.includes(u);
  const followers = store.followers(user.username).filter((u) => !hidden(u.username));
  const following = user.following
    .map((u) => store.user(u))
    .filter((u): u is NonNullable<typeof u> => !!u && !hidden(u.username));
  const list = tab === 'followers' ? followers : following;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: isMe ? 'Your connections' : user.name }} />
      <View style={styles.tabs}>
        <TabButton label={`Followers ${followers.length}`} on={tab === 'followers'} onPress={() => setTab('followers')} />
        <TabButton label={`Following ${following.length}`} on={tab === 'following'} onPress={() => setTab('following')} />
      </View>
      <Divider strong />
      <FlatList
        data={list}
        keyExtractor={(u) => u.username}
        ItemSeparatorComponent={() => <Divider />}
        renderItem={({ item: u }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push({ pathname: '/user/[username]', params: { username: u.username } })}
            accessibilityRole="link"
          >
            <Avatar name={u.name} uri={u.avatarUri} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{u.username === me ? 'You' : u.name}</Text>
              <Text style={styles.handle}>@{u.username}</Text>
            </View>
            {u.username !== me ? (
              <Button
                label={store.isFollowing(u.username) ? 'Following' : 'Follow'}
                variant={store.isFollowing(u.username) ? 'secondary' : 'primary'}
                style={styles.follow}
                onPress={() => store.dispatch({ type: 'toggleFollow', username: u.username })}
              />
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {tab === 'followers'
              ? isMe
                ? 'No followers yet. Post a goal and people chasing something similar will find you.'
                : 'No followers yet.'
              : isMe
                ? 'You don’t follow anyone yet. Find people in Explore.'
                : 'Not following anyone yet.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  tabs: { flexDirection: 'row', paddingHorizontal: space.lg, gap: space.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  handle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  follow: { minHeight: 36, paddingHorizontal: space.lg },
  empty: { padding: space.xl, fontSize: 15, lineHeight: 21, color: colors.muted },
});
