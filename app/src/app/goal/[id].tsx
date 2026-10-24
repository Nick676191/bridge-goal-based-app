// A goal's page: the full post with its three actions, then two threads.
//   Updates: progress from the author and everyone committed (can be tagged Setback)
//   Tips:    suggestions from anyone
// Anyone can reply to a tip or an update, or press the star on it; replies sit
// indented underneath. The author can also mark the goal achieved or dropped.

import React, { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeyboardLift } from '@/lib/keyboard';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/data/store';
import { REPLY_MAX, type GoalStatus, type Reply, type Tip, type Update } from '@/data/types';
import { EncourageButton } from '@/components/ActionBar';
import { GoalCard } from '@/components/GoalCard';
import { Avatar } from '@/components/Avatar';
import { TabButton, confirm } from '@/components/ProfileView';
import { Button, Chip, Divider, SetbackTag } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { colors, space } from '@/theme';

export default function GoalScreen() {
  const params = useLocalSearchParams<{ id: string; tab?: string; compose?: string }>();
  const store = useStore();
  const goal = store.goal(params.id);
  const [tab, setTab] = useState<'updates' | 'tips'>(params.tab === 'tips' ? 'tips' : 'updates');
  const [text, setText] = useState('');
  const [setback, setSetback] = useState(false);
  // Set when you tap Reply under a tip, update or reply: who and what you're answering.
  const [replyingTo, setReplyingTo] = useState<{ parentId: string; name: string } | null>(null);
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const keyboardLift = useKeyboardLift();

  if (!goal) return <Text style={styles.empty}>This goal was deleted.</Text>;

  const me = store.state.me;
  const isOwner = goal.author === me;
  const authorFirst = store.user(goal.author)?.name.split(' ')[0] ?? goal.author;
  const canUpdate = store.canPostUpdate(goal);
  const items =
    tab === 'updates'
      ? [...store.updatesFor(goal.id)].reverse()
      : [...store.tipsFor(goal.id)].reverse();

  const send = () => {
    const t = text.trim();
    if (!t) return;
    if (replyingTo) {
      store.dispatch({ type: 'addReply', parentId: replyingTo.parentId, text: t });
      setReplyingTo(null);
    } else if (tab === 'updates') store.dispatch({ type: 'addUpdate', goalId: goal.id, text: t, setback });
    else store.dispatch({ type: 'addTip', goalId: goal.id, text: t });
    setText('');
    setSetback(false);
  };

  const setStatus = (status: GoalStatus) => {
    store.dispatch({ type: 'setStatus', goalId: goal.id, status });
    // After marking it achieved or dropped, open Updates so you can say how it went.
    if (status !== 'active') switchTab('updates');
  };

  // Replying to a reply attaches to the same tip or update (one level deep).
  const startReply = (parentId: string, author: string) => {
    const name = author === me ? 'yourself' : store.user(author)?.name.split(' ')[0] ?? author;
    setReplyingTo({ parentId, name });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const switchTab = (t: 'updates' | 'tips') => {
    setTab(t);
    setReplyingTo(null);
  };

  const reportPost = () =>
    confirm('Report this post?', 'We review reports within 24 hours.', 'Report', () => {});

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () =>
            isOwner ? null : (
              <Pressable onPress={reportPost} hitSlop={10} accessibilityLabel="Report this post">
                <Ionicons name="flag-outline" size={22} color={colors.ink} />
              </Pressable>
            ),
        }}
      />
      {/* Everything above the keyboard. The bottom padding lifts the reply box
          so it sits just above the keyboard and its suggested-words row. */}
      <View style={{ flex: 1, paddingBottom: keyboardLift }}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <GoalCard goal={goal} full />

          {/* Only you see this on your own goals: mark it achieved or dropped. */}
          {isOwner && (
            <View style={styles.statusPanel}>
              <Text style={styles.statusTitle}>Where does this goal stand?</Text>
              <View style={styles.statusRow}>
                <Chip label="Still working on it" selected={goal.status === 'active'} onPress={() => setStatus('active')} />
                <Chip label="Achieved" selected={goal.status === 'achieved'} onPress={() => setStatus('achieved')} />
                <Chip label="Dropped" selected={goal.status === 'dropped'} onPress={() => setStatus('dropped')} />
              </View>
              <Text style={styles.statusHint}>
                {goal.status === 'achieved'
                  ? store.notifiedOf(goal.id).length
                    ? `Nice work. We let ${store
                        .notifiedOf(goal.id)
                        .map((u) => store.user(u)?.name.split(' ')[0] ?? u)
                        .join(' and ')} know. Post an update below to say how it went.`
                    : 'Nice work. Post an update below to tell everyone how it went.'
                  : goal.status === 'dropped'
                    ? 'Dropping a goal is fine. Post an update saying what you learned.'
                    : "Once a month we'll ask you this. You can change it any time."}
              </Text>
            </View>
          )}
          <Divider strong />

          <View style={styles.tabs}>
            {/* Tips on the left, Updates on the right, matching Reply (left)
                and Commit (center) on the post above. */}
            <TabButton label={`Tips ${store.tipsFor(goal.id).length}`} on={tab === 'tips'} onPress={() => switchTab('tips')} />
            <TabButton
              label={`Updates ${store.updatesFor(goal.id).length}`}
              on={tab === 'updates'}
              onPress={() => switchTab('updates')}
            />
          </View>
          <Divider />
          <Text style={styles.explainer}>
            {tab === 'updates'
              ? `Progress from ${isOwner ? 'you' : authorFirst} and everyone committed to this goal.`
              : 'Suggestions from anyone. Keep them specific.'}
          </Text>

          {items.length === 0 && (
            <Text style={styles.empty}>
              {tab === 'updates' ? 'No updates yet.' : 'No tips yet. Know something that helped you? Share it.'}
            </Text>
          )}
          {items.map((item) => (
            <View key={item.id}>
              <ThreadItem
                item={item}
                kind={tab === 'updates' ? 'update' : 'tip'}
                showAuthorBadge={tab === 'updates' && item.author === goal.author}
                onReply={() => startReply(item.id, item.author)}
              />
              {store.repliesFor(item.id).map((r) => (
                <ThreadItem key={r.id} item={r} kind="reply" onReply={() => startReply(item.id, r.author)} />
              ))}
            </View>
          ))}
        </ScrollView>

        {/* The composer at the bottom changes with the tab you're on. */}
        <View style={styles.composer}>
          {replyingTo ? (
            <View style={styles.replyingBar}>
              <Text style={styles.replyingText}>Replying to {replyingTo.name}</Text>
              <Pressable onPress={() => setReplyingTo(null)} hitSlop={10} accessibilityLabel="Cancel reply">
                <Ionicons name="close" size={18} color={colors.muted} />
              </Pressable>
            </View>
          ) : null}
          {tab === 'updates' && !canUpdate && !replyingTo ? (
            <View style={{ gap: space.sm }}>
              <Text style={styles.locked}>
                Only {authorFirst} and people committed to this goal post updates. Commit to train alongside them.
              </Text>
              <Button label="Commit to this goal" variant="accent" onPress={() => store.dispatch({ type: 'toggleCommit', goalId: goal.id })} />
            </View>
          ) : (
            <>
              {tab === 'updates' && !replyingTo && (
                <View style={styles.setbackRow}>
                  <Switch
                    value={setback}
                    onValueChange={setSetback}
                    trackColor={{ true: colors.setback, false: colors.hairline }}
                    thumbColor={colors.paper}
                    accessibilityLabel="Tag as setback"
                  />
                  <Text style={styles.setbackLabel}>
                    {setback ? 'Tagged as a setback. Say what you\'ll change.' : 'Tag as a setback'}
                  </Text>
                </View>
              )}
              {/* Character count appears once you start typing; it turns red
                  in the last 20 characters. */}
              {text.length > 0 ? (
                <Text style={[styles.charCount, text.length > REPLY_MAX - 20 && { color: colors.danger }]}>
                  {text.length}/{REPLY_MAX}
                </Text>
              ) : null}
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  value={text}
                  onChangeText={setText}
                  placeholder={
                    replyingTo
                      ? 'Write a reply'
                      : tab === 'updates'
                        ? 'How did it go?'
                        : `Share a tip with ${authorFirst}`
                  }
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  multiline
                  maxLength={REPLY_MAX}
                  autoFocus={params.compose === '1'}
                />
                <Pressable
                  onPress={send}
                  disabled={!text.trim()}
                  style={[styles.send, !text.trim() && { opacity: 0.3 }]}
                  accessibilityLabel={replyingTo ? 'Post reply' : tab === 'updates' ? 'Post update' : 'Post tip'}
                >
                  <Ionicons name="arrow-up" size={18} color={colors.paper} />
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// One tip, update or reply: avatar, name, time, text, then Reply and the star.
// Replies are drawn smaller and indented under the item they answer.
function ThreadItem({
  item,
  kind,
  showAuthorBadge = false,
  onReply,
}: {
  item: Tip | Update | Reply;
  kind: 'tip' | 'update' | 'reply';
  showAuthorBadge?: boolean;
  onReply: () => void;
}) {
  const store = useStore();
  const me = store.state.me;
  const author = store.user(item.author);
  const isSetback = 'setback' in item && item.setback === true;
  const isReply = kind === 'reply';
  return (
    <Pressable
      onLongPress={() =>
        item.author !== me && confirm('Report this reply?', 'We review reports within 24 hours.', 'Report', () => {})
      }
      style={[styles.item, isReply && styles.replyItem, isSetback && styles.itemSetback]}
    >
      <Pressable onPress={() => router.push({ pathname: '/user/[username]', params: { username: item.author } })}>
        <Avatar name={author?.name ?? item.author} uri={author?.avatarUri} size={isReply ? 24 : 30} />
      </Pressable>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.itemHead}>
          <Text style={[styles.itemName, isReply && { fontSize: 14 }]}>{item.author === me ? 'You' : author?.name}</Text>
          {showAuthorBadge && item.author !== me ? <Text style={styles.badge}>Author</Text> : null}
          <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        {isSetback && <SetbackTag />}
        <Text style={[styles.itemText, isReply && { fontSize: 14, lineHeight: 20 }]}>{item.text}</Text>
        <View style={styles.itemActions}>
          <Pressable onPress={onReply} hitSlop={8} accessibilityRole="button" accessibilityLabel="Reply">
            <Text style={styles.replyLink}>Reply</Text>
          </Pressable>
          <EncourageButton
            small
            encouraged={item.encouraged.includes(me)}
            count={item.encouraged.length}
            disabled={item.author === me}
            onPress={() => store.dispatch({ type: 'toggleItemEncourage', kind, id: item.id })}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  statusPanel: {
    marginHorizontal: space.lg,
    marginBottom: space.lg,
    padding: space.md,
    backgroundColor: colors.wash,
    borderRadius: 4,
    gap: space.sm,
  },
  statusTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  statusHint: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  tabs: { flexDirection: 'row', paddingHorizontal: space.lg, gap: space.xl },
  explainer: { fontSize: 13, color: colors.muted, paddingHorizontal: space.lg, paddingTop: space.md },
  empty: { padding: space.lg, fontSize: 15, color: colors.muted },
  item: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  itemSetback: { backgroundColor: colors.setbackWash },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  itemName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  badge: { fontSize: 11, fontWeight: '700', color: colors.muted, borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: 4, borderRadius: 3 },
  itemTime: { fontSize: 13, color: colors.muted, marginLeft: 'auto' },
  itemText: { fontSize: 15, lineHeight: 21, color: colors.ink },
  replyItem: { paddingLeft: space.lg + 42, paddingTop: 0 },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: 2 },
  replyLink: { fontSize: 13, fontWeight: '700', color: colors.muted },
  replyingBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  replyingText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.ink,
    paddingHorizontal: space.lg,
    paddingTop: 6,
    paddingBottom: 6,
    gap: 6,
    backgroundColor: colors.paper,
  },
  locked: { fontSize: 14, lineHeight: 20, color: colors.muted },
  charCount: { alignSelf: 'flex-end', fontSize: 12, color: colors.muted, fontVariant: ['tabular-nums'], marginBottom: -2 },
  setbackRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  setbackLabel: { fontSize: 14, color: colors.ink, flex: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  input: {
    flex: 1,
    backgroundColor: colors.wash,
    borderRadius: 4,
    paddingHorizontal: space.md,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 15,
    minHeight: 36,
    maxHeight: 110,
    color: colors.ink,
  },
  send: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
