// Shows the photos and video attached to a goal post.
//   compact (feed, profiles): a row of square tiles you can swipe through.
//     The video shows its first frame with a play badge; tapping opens the goal.
//   full (goal page): everything at full width, and the video plays with
//     the phone's own controls.

import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Media } from '@/data/types';
import { colors, space } from '@/theme';

// Video first, then photos in the order they were added.
const ordered = (media: Media[]) => [...media.filter((m) => m.kind === 'video'), ...media.filter((m) => m.kind === 'photo')];

export function formatDuration(sec = 0) {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function MediaStrip({
  media,
  full = false,
  onPress,
}: {
  media: Media[];
  full?: boolean;
  onPress?: () => void;
}) {
  const { width } = useWindowDimensions();
  if (!media.length) return null;
  const items = ordered(media);

  if (full) {
    const w = width - space.lg * 2;
    return (
      <View style={{ gap: space.sm, marginTop: space.sm }}>
        {items.map((m) => {
          // Keep each item's shape, but never taller than it is wide plus a bit.
          const ratio = m.width && m.height ? m.height / m.width : 0.75;
          const h = Math.min(w * ratio, w * 1.25);
          return m.kind === 'video' ? (
            <FullVideo key={m.uri} uri={m.uri} width={w} height={h} />
          ) : (
            <Image
              key={m.uri}
              source={{ uri: m.uri }}
              style={{ width: w, height: h, borderRadius: 4, backgroundColor: colors.wash }}
              resizeMode="cover"
              accessibilityLabel="Photo attached to this goal"
            />
          );
        })}
      </View>
    );
  }

  // One item gets the full card width; several become a swipeable row.
  const single = items.length === 1;
  const tile = single ? width - space.lg * 2 : 200;
  const tileH = single ? tile * 0.66 : 200;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: space.sm, marginHorizontal: -space.lg }}
      contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.lg }}
    >
      {items.map((m) => (
        <Pressable
          key={m.uri}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={m.kind === 'video' ? 'Video. Open goal to play' : 'Photo. Open goal'}
        >
          {m.kind === 'video' ? (
            <VideoTile uri={m.uri} width={tile} height={tileH} durationSec={m.durationSec} />
          ) : (
            <Image source={{ uri: m.uri }} style={[styles.tile, { width: tile, height: tileH }]} resizeMode="cover" />
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}

// First frame of the video, muted and paused, with a play badge on top.
function VideoTile({ uri, width, height, durationSec }: { uri: string; width: number; height: number; durationSec?: number }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
  });
  return (
    <View style={[styles.tile, { width, height }]}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} pointerEvents="none" />
      <View style={styles.badge} pointerEvents="none">
        <Ionicons name="play" size={14} color={colors.paper} />
        {durationSec && durationSec >= 1 ? <Text style={styles.badgeText}>{formatDuration(durationSec)}</Text> : null}
      </View>
    </View>
  );
}

function FullVideo({ uri, width, height }: { uri: string; width: number; height: number }) {
  const player = useVideoPlayer(uri);
  return (
    <VideoView
      player={player}
      style={{ width, height, borderRadius: 4, backgroundColor: colors.ink }}
      contentFit="contain"
      nativeControls
      fullscreenOptions={{ enable: true }}
    />
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: 4, overflow: 'hidden', backgroundColor: colors.ink },
  badge: {
    position: 'absolute',
    left: space.sm,
    bottom: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeText: { color: colors.paper, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
