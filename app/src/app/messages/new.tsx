// Start a new conversation: pick someone you follow or who follows you.

import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/data/store';
import { Avatar } from '@/components/Avatar';
import { Divider } from '@/components/ui';
import { colors, space } from '@/theme';

export default function NewMessage() {
  const store = useStore();
  const [query, setQuery] = useState('');

  // Same list as the Share screen: people you follow first, then followers.
  const people = useMemo(() => {
    const me = store.state.me;
    const followers = store.followers(me).map((u) => u.username);
    const names = [...new Set([...store.meUser.following, ...followers])].filter(
      (u) => u !== me && !store.state.blocked.includes(u)
    );
    return names.map((u) => store.user(u)).filter((u): u is NonNullable<typeof u> => !!u);
  }, [store]);

  const q = query.trim().toLowerCase();
  const shown = q ? people.filter((u) => u.name.toLowerCase().includes(q) || u.username.includes(q)) : people;

  return (
    <View style={styles.screen}>
      <View style={styles.search}>
        <Ionicons name="search" size={16} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search people"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
      </View>
      <FlatList
        data={shown}
        keyExtractor={(u) => u.username}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <Divider />}
        renderItem={({ item }) => (
          <Pressable
            // replace, not push: Back from the conversation returns to the inbox.
            onPress={() => router.replace({ pathname: '/messages/[username]', params: { username: item.username } })}
            style={styles.person}
            accessibilityRole="link"
          >
            <Avatar name={item.name} uri={item.avatarUri} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.personName}>{item.name}</Text>
              <Text style={styles.personHandle}>@{item.username}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.none}>No one matches. Follow people from Explore to message them.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.wash,
    borderRadius: 4,
    paddingHorizontal: space.md,
    minHeight: 40,
    margin: space.lg,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.ink, paddingVertical: space.sm },
  person: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: 10 },
  personName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  personHandle: { fontSize: 13, color: colors.muted },
  none: { padding: space.lg, fontSize: 14, color: colors.muted },
});
