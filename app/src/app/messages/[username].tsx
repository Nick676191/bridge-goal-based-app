// One conversation with one person. Your messages sit on the right in
// Carolina blue; theirs on the left in grey. A shared goal shows as a small
// card you can tap to open the goal.

import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/data/store';
import { MESSAGE_MAX, type Message } from '@/data/types';
import { Avatar } from '@/components/Avatar';
import { useKeyboardLift } from '@/lib/keyboard';
import { colors, fonts, space } from '@/theme';

// "Today 3:42 PM", "Yesterday 9:10 AM", "Mon, Nov 2 9:10 AM": shown above a
// message when more than an hour passed since the one before it.
function stamp(ms: number) {
  const d = new Date(ms);
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return `Today ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} ${time}`;
}

export default function Conversation() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const store = useStore();
  const me = store.state.me;
  const person = store.user(username);
  const blocked = store.state.blocked.includes(username);
  const messages = store.messagesWith(username);
  const [text, setText] = useState('');
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const keyboardLift = useKeyboardLift();

  // Mark their messages read when you open the conversation, and again when
  // a new one arrives while you're looking at it.
  const unread = messages.filter((m) => m.from === username && !m.read).length;
  useEffect(() => {
    if (unread > 0) store.dispatch({ type: 'readConversation', with: username });
  }, [unread, username, store]);

  const send = () => {
    if (!text.trim()) return;
    store.dispatch({ type: 'sendMessage', to: username, text });
    setText('');
  };

  const firstName = person?.name.split(' ')[0] ?? username;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      {/* The header shows who you're talking to; tap it to open their profile. */}
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable
              onPress={() => router.push({ pathname: '/user/[username]', params: { username } })}
              style={styles.headerWho}
              accessibilityRole="link"
              accessibilityLabel={`${person?.name ?? username}'s profile`}
            >
              <Avatar name={person?.name ?? username} uri={person?.avatarUri} size={28} />
              <Text style={styles.headerName} numberOfLines={1}>
                {person?.name ?? username}
              </Text>
            </Pressable>
          ),
        }}
      />
      <View style={{ flex: 1, paddingBottom: keyboardLift }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.thread}
          keyboardShouldPersistTaps="handled"
          // Start at the newest message and stay there as new ones come in.
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 && (
            <Text style={styles.empty}>
              This is the start of your conversation with {firstName}. Messages here are only between the two of you.
            </Text>
          )}
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const showStamp = !prev || m.createdAt - prev.createdAt > 60 * 60 * 1000;
            return (
              <View key={m.id}>
                {showStamp && <Text style={styles.stamp}>{stamp(m.createdAt)}</Text>}
                <Bubble message={m} mine={m.from === me} />
              </View>
            );
          })}
          {/* "Seen" under your last message once they've opened it. */}
          {messages.length > 0 && messages[messages.length - 1].from === me && messages[messages.length - 1].read && (
            <Text style={styles.seen}>Seen</Text>
          )}
        </ScrollView>

        <View style={styles.composer}>
          {blocked ? (
            <Text style={styles.blocked}>You blocked {firstName}. Unblock them from their profile to message again.</Text>
          ) : (
            <View style={styles.inputRow}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={`Message ${firstName}`}
                placeholderTextColor={colors.muted}
                style={styles.input}
                multiline
                maxLength={MESSAGE_MAX}
                accessibilityLabel={`Message ${firstName}`}
              />
              <Pressable
                onPress={send}
                disabled={!text.trim()}
                style={[styles.send, !text.trim() && { opacity: 0.3 }]}
                accessibilityLabel="Send message"
              >
                <Ionicons name="arrow-up" size={18} color={colors.onAccent} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// One message: an optional shared-goal card, then the text.
function Bubble({ message, mine }: { message: Message; mine: boolean }) {
  const store = useStore();
  const goal = message.goalId ? store.goal(message.goalId) : undefined;
  const author = goal ? store.user(goal.author) : undefined;
  return (
    <View style={[styles.bubbleWrap, mine ? styles.right : styles.left]}>
      {message.goalId && (
        <Pressable
          onPress={goal ? () => router.push({ pathname: '/goal/[id]', params: { id: goal.id } }) : undefined}
          disabled={!goal}
          style={[styles.goalCard, mine && styles.goalCardMine]}
          accessibilityRole="link"
          accessibilityLabel={goal ? `Shared goal: ${goal.subject}` : 'Shared goal, deleted'}
        >
          <Text style={styles.goalLabel}>
            {goal ? `${mine ? 'You shared' : 'Shared'} ${author?.name ?? goal.author}'s goal` : 'Shared goal'}
          </Text>
          <Text style={styles.goalSubject}>{goal ? goal.subject : 'This goal was deleted.'}</Text>
          {goal && (
            <View style={styles.goalOpen}>
              <Text style={styles.goalOpenText}>Open goal</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.lane} />
            </View>
          )}
        </Pressable>
      )}
      {message.text ? (
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={styles.bubbleText}>{message.text}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  headerWho: { flexDirection: 'row', alignItems: 'center', gap: space.sm, maxWidth: 240 },
  headerName: { fontSize: 17, fontWeight: '700', color: colors.navy },
  thread: { padding: space.lg, gap: space.sm, flexGrow: 1, justifyContent: 'flex-end' },
  empty: { fontSize: 15, lineHeight: 21, color: colors.muted, textAlign: 'center', paddingHorizontal: space.lg },
  stamp: { textAlign: 'center', fontSize: 12, color: colors.muted, marginVertical: space.sm },
  seen: { alignSelf: 'flex-end', fontSize: 12, color: colors.muted, marginTop: -2 },
  bubbleWrap: { maxWidth: '80%', gap: 4 },
  left: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  right: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
  bubbleMine: { backgroundColor: colors.carolina, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.wash, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 16, lineHeight: 21, color: colors.ink },
  goalCard: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderLeftWidth: 4,
    borderLeftColor: colors.carolina,
    borderRadius: 8,
    padding: space.md,
    gap: 2,
    minWidth: 220,
  },
  goalCardMine: { borderLeftColor: colors.navy },
  goalLabel: { fontSize: 12, fontWeight: '700', color: colors.muted },
  goalSubject: { fontFamily: fonts.display, fontSize: 22, lineHeight: 24, color: colors.navy },
  goalOpen: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  goalOpenText: { fontSize: 13, fontWeight: '700', color: colors.lane },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.ink,
    paddingHorizontal: space.lg,
    paddingVertical: 6,
    backgroundColor: colors.paper,
  },
  blocked: { fontSize: 14, lineHeight: 20, color: colors.muted, paddingVertical: space.sm },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  input: {
    flex: 1,
    backgroundColor: colors.wash,
    borderRadius: 18,
    paddingHorizontal: space.md,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 16,
    minHeight: 36,
    maxHeight: 120,
    color: colors.ink,
  },
  send: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
