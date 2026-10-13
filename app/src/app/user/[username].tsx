// Someone else's profile, opened by tapping their name anywhere in the app.
// The [username] in the file name means the screen receives it as a parameter.

import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ProfileView } from '@/components/ProfileView';

export default function UserScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return (
    <>
      <Stack.Screen options={{ title: `@${username}` }} />
      <ProfileView username={username} />
    </>
  );
}
