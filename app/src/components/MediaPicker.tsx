// Lets someone attach up to 4 photos and 1 video (60 seconds max) to a post.
// Uses the phone's own photo library picker.

import React from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MAX_PHOTOS, MAX_VIDEO_SECONDS, type Media } from '@/data/types';
import { colors, space } from '@/theme';
import { formatDuration } from './MediaStrip';

const notify = (title: string, message: string) =>
  Platform.OS === 'web' ? window.alert(`${title}\n\n${message}`) : Alert.alert(title, message);

// iOS asks for photo access once; after that the picker opens straight away.
export async function canUseLibrary() {
  if (Platform.OS === 'web') return true;
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!granted)
    notify('Photo access is off', 'To add photos or a video, allow TENET to use your photos in the iPhone Settings app.');
  return granted;
}

export function MediaPicker({ value, onChange }: { value: Media[]; onChange: (m: Media[]) => void }) {
  const photos = value.filter((m) => m.kind === 'photo');
  const video = value.find((m) => m.kind === 'video');
  const photosLeft = MAX_PHOTOS - photos.length;

  const addPhotos = async () => {
    if (photosLeft <= 0 || !(await canUseLibrary())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: photosLeft,
      quality: 0.8,
      orderedSelection: true,
    });
    if (result.canceled) return;
    const added: Media[] = result.assets.slice(0, photosLeft).map((a) => ({
      kind: 'photo',
      uri: a.uri,
      width: a.width,
      height: a.height,
    }));
    onChange([...value, ...added]);
  };

  const addVideo = async () => {
    if (video || !(await canUseLibrary())) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'videos', quality: 0.8 });
    if (result.canceled) return;
    const a = result.assets[0];
    const seconds = (a.duration ?? 0) / 1000; // the picker reports milliseconds
    if (seconds > MAX_VIDEO_SECONDS + 0.5) {
      notify(
        'That video is too long',
        `Videos can be up to ${MAX_VIDEO_SECONDS} seconds; this one is ${formatDuration(seconds)}. Trim it in the Photos app, then add it again.`
      );
      return;
    }
    onChange([...value, { kind: 'video', uri: a.uri, width: a.width, height: a.height, durationSec: seconds }]);
  };

  const remove = (uri: string) => onChange(value.filter((m) => m.uri !== uri));

  return (
    <View style={{ gap: space.sm }}>
      <Text style={styles.label}>Photos and video (optional)</Text>
      <Text style={styles.hint}>
        Show the plan: a training schedule, a route, your starting point. Up to {MAX_PHOTOS} photos and one video up to{' '}
        {MAX_VIDEO_SECONDS} seconds.
      </Text>

      {value.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {[...(video ? [video] : []), ...photos].map((m) => (
            <View key={m.uri} style={styles.thumb}>
              {m.kind === 'photo' ? (
                <Image source={{ uri: m.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.videoThumb]}>
                  <Ionicons name="videocam" size={26} color={colors.paper} />
                  {m.durationSec && m.durationSec >= 1 ? <Text style={styles.videoText}>{formatDuration(m.durationSec)}</Text> : null}
                </View>
              )}
              <Pressable
                onPress={() => remove(m.uri)}
                style={styles.remove}
                hitSlop={8}
                accessibilityLabel={m.kind === 'video' ? 'Remove video' : 'Remove photo'}
              >
                <Ionicons name="close" size={14} color={colors.paper} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.buttons}>
        <PickButton
          icon="images-outline"
          label={photos.length ? `Add photos (${photos.length}/${MAX_PHOTOS})` : 'Add photos'}
          disabled={photosLeft <= 0}
          onPress={addPhotos}
        />
        <PickButton icon="videocam-outline" label={video ? 'Video added' : 'Add video'} disabled={!!video} onPress={addVideo} />
      </View>
    </View>
  );
}

function PickButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [styles.pick, disabled && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icon} size={18} color={colors.ink} />
      <Text style={styles.pickText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '700', color: colors.ink },
  hint: { fontSize: 13, lineHeight: 18, color: colors.muted },
  thumb: { width: 84, height: 84, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.wash },
  videoThumb: { backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', gap: 2 },
  videoText: { color: colors.paper, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: { flexDirection: 'row', gap: space.sm },
  pick: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: 4,
    borderStyle: 'dashed',
  },
  pickText: { fontSize: 14, fontWeight: '600', color: colors.ink },
});
