// A goal's page: the full post with its three actions, then two threads.
//   Updates: progress from the author and everyone committed (can be tagged Setback)
//   Tips:    suggestions from anyone
// The author can also mark the goal achieved or dropped.

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/data/store';
import type { GoalStatus } from '@/data/types';
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
  const [statusOpen, setStatusOpen] = useState(false);

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
    if (tab === 'updates') store.dispatch({ type: 'addUpdate', goalId: goal.id, text: t, setback });
    else store.dispatch({ type: 'addTip', goalId: goal.id, text: t });
    setText('');
    setSetback(false);
  };

  const setStatus = (status: GoalStatus) => {
    store.dispatch({ type: 'setStatus', goalId: goal.id, status });
    setStatusOpen(false);
  };

  const reportPost = () =>
    confirm('Report this post?', 'We review reports within 24 hours.', 'Report', () => {});

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () =>
            isOwner ? (
              <Pressable onPress={() => setStatusOpen((o) => !o)} hitSlop={10} accessibilityLabel="Update status">
                <Text style={styles.headerAction}>Status</Text>
              </Pressable>
            ) : (
              <Pressable onPress={reportPost} hitSlop={10} accessibilityLabel="Report this post">
                <Ionicons name="flag-outline" size={22} color={colors.ink} />
              </Pressable>
            ),
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          {statusOpen && (
            <View style={styles.statusPanel}>
              <Text style={styles.statusTitle}>Where does this goal stand?</Text>
              <View style={styles.statusRow}>
                <Chip label="Still working on it" selected={goal.status === 'active'} onPress={() => setStatus('active')} />
                <Chip label="Achieved" selected={goal.status === 'achieved'} onPress={() => setStatus('achieved')} />
                <Chip label="Dropped" selected={goal.status === 'dropped'} onPress={() => setStatus('dropped')} />
              </View>
              <Text style={styles.statusHint}>
                {"Once a month we'll ask you this. Dropping a goal is fine; post an update saying what you learned."}
              </Text>
            </View>
          )}

          <GoalCard goal={goal} full />
          <Divider strong />

          <View style={styles.tabs}>
            <TabButton
              label={`Updates ${store.updatesFor(goal.id).length}`}
              on={tab === 'updates'}
              onPress={() => setTab('updates')}
            />
            <TabButton label={`Tips ${store.tipsFor(goal.id).length}`} on={tab === 'tips'} onPress={() => setTab('tips')} />
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
          {items.map((item) => {
            const author = store.user(item.author);
            const isSetback = 'setback' in item && item.setback === true;
            return (
              <Pressable
                key={item.id}
                onLongPress={() => item.author !== me && confirm('Report this reply?', 'We review reports within 24 hours.', 'Report', () => {})}
                style={[styles.item, isSetback && styles.itemSetback]}
              >
                <Pressable onPress={() => router.push({ pathname: '/user/[username]', params: { username: item.author } })}>
                  <Avatar name={author?.name ?? item.author} size={30} />
                </Pressable>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.itemHead}>
                    <Text style={styles.itemName}>{item.author === me ? 'You' : author?.name}</Text>
                    {item.author === goal.author && tab === 'updates' && item.author !== me ? (
                      <Text style={styles.badge}>Author</Text>
                    ) : null}
                    <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  {isSetback && <SetbackTag />}
                  <Text style={styles.itemText}>{item.text}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* The composer at the bottom changes with the tab you're on. */}
        <View style={styles.composer}>
          {tab === 'updates' && !canUpdate ? (
            <View style={{ gap: space.sm }}>
              <Text style={styles.locked}>
                Only {authorFirst} and people committed to this goal post updates. Commit to train alongside them.
              </Text>
              <Button label="Commit to this goal" variant="accent" onPress={() => store.dispatch({ type: 'toggleCommit', goalId: goal.id })} />
            </View>
          ) : (
            <>
              {tab === 'updates' && (
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
              <View style={styles.inputRow}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder={tab === 'updates' ? 'How did it go?' : `Share a tip with ${authorFirst}`}
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  multiline
                  maxLength={500}
                  autoFocus={params.compose === '1'}
                />
                <Pressable
                  onPress={send}
                  disabled={!text.trim()}
                  style={[styles.send, !text.trim() && { opacity: 0.3 }]}
                  accessibilityLabel={tab === 'updates' ? 'Post update' : 'Post tip'}
                >
                  <Ionicons name="arrow-up" size={20} color={colors.paper} />
                </Pressable>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  headerAction: { fontSize: 16, fontWeight: '700', color: colors.lane },
  statusPanel: { margin: space.lg, padding: space.md, backgroundColor: colors.wash, borderRadius: 4, gap: space.sm },
  statusTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  statusHint: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  tabs: { flexDirection: 'row', paddingHorizontal: space.lg, gap: space.xl },
  explainer: { fontSize: 13, color: colors.muted, paddingHorizontal: space.lg, paddingTop: space.md },
  empty: { padding: space.lg, fontSize: 15, color: colors.muted },
  item: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  itemSetback: { backgroundColor: '#FFFAF2' },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  itemName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  badge: { fontSize: 11, fontWeight: '700', color: colors.muted, borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: 4, borderRadius: 3 },
  itemTime: { fontSize: 13, color: colors.muted, marginLeft: 'auto' },
  itemText: { fontSize: 15, lineHeight: 21, color: colors.ink },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.ink,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    gap: space.sm,
    backgroundColor: colors.paper,
  },
  locked: { fontSize: 14, lineHeight: 20, color: colors.muted },
  setbackRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  setbackLabel: { fontSize: 14, color: colors.ink, flex: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  input: {
    flex: 1,
    backgroundColor: colors.wash,
    borderRadius: 4,
    paddingHorizontal: space.md,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    maxHeight: 120,
    color: colors.ink,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
