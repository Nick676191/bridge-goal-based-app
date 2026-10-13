// Edit profile: photo, name and bio. Opened from "Edit profile" on your
// profile, from tapping your own photo, or from Settings.
// The photo changes right away; name and bio save with the button.

import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/data/store';
import { Avatar } from '@/components/Avatar';
import { canUseLibrary } from '@/components/MediaPicker';
import { Button, Field } from '@/components/ui';
import { colors, space } from '@/theme';

export default function EditProfile() {
  const store = useStore();
  const me = store.meUser;
  const [name, setName] = useState(me.name);
  const [bio, setBio] = useState(me.bio);

  const choosePhoto = async () => {
    if (!(await canUseLibrary())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true, // lets you crop to a square before saving
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    store.dispatch({ type: 'setAvatar', uri: result.assets[0].uri });
  };

  const save = () => {
    store.dispatch({ type: 'updateProfile', name: name.trim() || me.name, bio: bio.trim() });
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.photoBlock}>
        <Pressable onPress={choosePhoto} accessibilityRole="button" accessibilityLabel="Change profile photo">
          <Avatar name={name || me.name} uri={me.avatarUri} size={112} />
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={18} color={colors.paper} />
          </View>
        </Pressable>
        <View style={styles.photoButtons}>
          <Pressable onPress={choosePhoto} hitSlop={6}>
            <Text style={styles.link}>{me.avatarUri ? 'Change photo' : 'Add photo'}</Text>
          </Pressable>
          {me.avatarUri ? (
            <Pressable onPress={() => store.dispatch({ type: 'setAvatar', uri: undefined })} hitSlop={6}>
              <Text style={[styles.link, { color: colors.danger }]}>Remove photo</Text>
            </Pressable>
          ) : null}
        </View>
        {Platform.OS !== 'web' ? (
          <Text style={styles.hint}>{"You'll be able to crop it to a square."}</Text>
        ) : null}
      </View>

      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="Bio" value={bio} onChangeText={setBio} multiline max={160} />
      <Button label="Save" onPress={save} disabled={bio.length > 160} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: 64, backgroundColor: colors.paper },
  photoBlock: { alignItems: 'center', gap: space.sm, paddingVertical: space.md },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.lane,
    borderWidth: 3,
    borderColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtons: { flexDirection: 'row', gap: space.xl },
  link: { fontSize: 16, fontWeight: '700', color: colors.lane },
  hint: { fontSize: 13, color: colors.muted },
});
