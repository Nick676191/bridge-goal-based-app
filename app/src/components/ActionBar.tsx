// The three actions at the bottom of every goal post, placed as described in
// the business plan:
//   bottom left   Reply      opens the post's Tips thread
//   center        Commit (X) join this goal
//   bottom right  Encourage  a star (no label) that turns into a right arrow:
//                            "keep pushing". The same star appears on tips,
//                            updates and replies.

import React, { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { colors, space } from '@/theme';

const native = Platform.OS !== 'web';
const tap = () => {
  if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

type Props = {
  tipCount: number;
  committedCount: number;
  encouragedCount: number;
  committed: boolean;
  encouraged: boolean;
  isOwn: boolean; // you can't commit to or encourage your own goal
  onReply: () => void;
  onCommit: () => void;
  onEncourage: () => void;
};

export function ActionBar(p: Props) {
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={p.onReply}
        hitSlop={8}
        style={styles.action}
        accessibilityRole="button"
        accessibilityLabel={`Reply. ${p.tipCount} tips`}
      >
        <Ionicons name="chatbubble-outline" size={20} color={colors.ink} />
        <Text style={styles.label}>Reply</Text>
        <Text style={styles.count}>{p.tipCount}</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          tap();
          p.onCommit();
        }}
        disabled={p.isOwn}
        hitSlop={8}
        style={[styles.action, p.isOwn && { opacity: 0.4 }]}
        accessibilityRole="button"
        accessibilityState={{ selected: p.committed, disabled: p.isOwn }}
        accessibilityLabel={`${p.committed ? 'Committed' : 'Commit'}. ${p.committedCount} committed`}
      >
        <View style={[styles.commitBox, p.committed && styles.commitBoxOn]}>
          <Ionicons name="close" size={18} color={p.committed ? colors.paper : colors.ink} />
        </View>
        <Text style={[styles.label, p.committed && { color: colors.lane }]}>
          {p.committed ? 'Committed' : 'Commit'}
        </Text>
        <Text style={styles.count}>{p.committedCount}</Text>
      </Pressable>

      <EncourageButton
        encouraged={p.encouraged}
        count={p.encouragedCount}
        disabled={p.isOwn}
        onPress={p.onEncourage}
      />
    </View>
  );
}

// The star rotates and shrinks away while an arrow springs in, pointing
// forward. Pressing again reverses it. `small` is the size used on tips,
// updates and replies.
export function EncourageButton({
  encouraged,
  count,
  disabled = false,
  small = false,
  onPress,
}: {
  encouraged: boolean;
  count: number;
  disabled?: boolean;
  small?: boolean;
  onPress: () => void;
}) {
  const star = small ? 17 : 21;
  const box = small ? 20 : 24;
  // useState with a function creates the animated value once and keeps it.
  const [progress] = useState(() => new Animated.Value(encouraged ? 1 : 0));
  useEffect(() => {
    Animated.spring(progress, {
      toValue: encouraged ? 1 : 0,
      useNativeDriver: native,
      friction: 6,
      tension: 120,
    }).start();
  }, [encouraged, progress]);

  const starStyle = {
    opacity: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.3, 0] }),
    transform: [
      { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '144deg'] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.2] }) },
    ],
  };
  const arrowStyle = {
    opacity: progress,
    transform: [
      { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
    ],
  };

  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      disabled={disabled}
      hitSlop={8}
      style={[styles.action, small && styles.actionSmall, disabled && { opacity: 0.4 }]}
      accessibilityRole="button"
      accessibilityState={{ selected: encouraged, disabled }}
      accessibilityLabel={`${encouraged ? 'Encouraged' : 'Encourage'}. ${count} encouragements`}
    >
      <View style={{ width: box, height: box }}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, starStyle]}>
          <Ionicons name="star-outline" size={star} color={small ? colors.muted : colors.ink} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, arrowStyle]}>
          <Ionicons name="arrow-forward-circle" size={star + 2} color={colors.lane} />
        </Animated.View>
      </View>
      {count > 0 || !small ? (
        <Text style={[styles.count, small && styles.countSmall, encouraged && { color: colors.lane }]}>{count}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: space.md,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
  count: { fontSize: 14, color: colors.muted, fontVariant: ['tabular-nums'] },
  commitBox: {
    width: 22,
    height: 22,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commitBoxOn: { backgroundColor: colors.lane, borderColor: colors.lane },
  actionSmall: { minHeight: 28, gap: 4 },
  countSmall: { fontSize: 13 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
