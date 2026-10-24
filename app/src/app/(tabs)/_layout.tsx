// The bottom tab bar: Home, Explore, Post, Activity (notifications), Profile.
// If nobody is signed in, send them to the welcome screen first.

import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Platform, StyleSheet, View, type ColorValue } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/data/store';
import { colors } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
// Filled icon when the tab is selected, outline when it isn't.
function icon(on: IconName, off: IconName) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? on : off} size={25} color={color as string} />;
  };
}

export default function TabsLayout() {
  const store = useStore();
  if (!store.state.signedIn) return <Redirect href="/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          borderTopColor: colors.navy,
          borderTopWidth: 2,
          backgroundColor: colors.paper,
          ...(Platform.OS === 'web' ? { height: 64, paddingBottom: 8 } : null),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: icon('search', 'search-outline') }} />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          // A maize button with a navy plus: the one bright spot in the tab bar.
          tabBarIcon: ({ focused }) => (
            <View style={[styles.postButton, focused && styles.postButtonOn]}>
              <Ionicons name="add" size={22} color={colors.navy} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Activity',
          tabBarIcon: icon('notifications', 'notifications-outline'),
          tabBarBadge: store.unreadCount > 0 ? store.unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.maize, color: colors.navy, fontSize: 11, fontWeight: '700' },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person', 'person-outline') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  postButton: {
    width: 34,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.maize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonOn: { borderWidth: 2, borderColor: colors.navy },
});
