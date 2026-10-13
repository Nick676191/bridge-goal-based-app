// Settings: edit profile, notification limits, blocked accounts, legal links,
// log out and delete account. Apple requires in-app account deletion and a
// privacy policy link (see "App Store requirements" in the plan doc).

import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@/data/store';
import { confirm } from '@/components/ProfileView';
import { Button, Divider, Field } from '@/components/ui';
import { colors, space } from '@/theme';

export default function Settings() {
  const store = useStore();
  const me = store.meUser;
  const [name, setName] = useState(me.name);
  const [bio, setBio] = useState(me.bio);
  const [sport, setSport] = useState(me.originSport ?? '');
  const [saved, setSaved] = useState(false);
  const { settings, blocked } = store.state;

  const save = () => {
    store.dispatch({ type: 'updateProfile', name: name.trim() || me.name, bio: bio.trim(), originSport: sport.trim() });
    setSaved(true);
  };

  const signOut = () => {
    store.dispatch({ type: 'signOut' });
    if (router.canDismiss()) router.dismissAll();
    router.replace('/welcome');
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.section}>Profile</Text>
      <Field label="Name" value={name} onChangeText={(v) => { setName(v); setSaved(false); }} />
      <Field label="Bio" value={bio} onChangeText={(v) => { setBio(v); setSaved(false); }} multiline max={160} />
      <Field
        label="Sport you came from (optional)"
        value={sport}
        onChangeText={(v) => { setSport(v); setSaved(false); }}
        placeholder="Soccer"
      />
      <Button label={saved ? 'Saved' : 'Save profile'} onPress={save} disabled={saved} />

      <Divider />
      <Text style={styles.section}>Notifications</Text>
      <Toggle
        label="At most one reminder a day"
        detail="Reminders to post an update arrive every 1 to 3 days per goal. This caps them at one a day across all your goals."
        value={settings.dailyReminderCap}
        onChange={(v) => store.dispatch({ type: 'setSetting', key: 'dailyReminderCap', value: v })}
      />
      <Toggle
        label="Quiet hours, 10pm to 7am"
        detail="No notifications overnight."
        value={settings.quietHours}
        onChange={(v) => store.dispatch({ type: 'setSetting', key: 'quietHours', value: v })}
      />

      <Divider />
      <Text style={styles.section}>Blocked accounts</Text>
      {blocked.length === 0 ? (
        <Text style={styles.detail}>{"You haven't blocked anyone. Block someone from the menu on their profile."}</Text>
      ) : (
        blocked.map((u) => (
          <View key={u} style={styles.row}>
            <Text style={styles.label}>@{u}</Text>
            <Pressable onPress={() => store.dispatch({ type: 'unblock', username: u })}>
              <Text style={styles.link}>Unblock</Text>
            </Pressable>
          </View>
        ))
      )}

      <Divider />
      <Text style={styles.section}>About</Text>
      <Pressable onPress={() => Linking.openURL('https://nick676191.github.io/bridge-goal-based-app/')}>
        <Text style={styles.link}>Privacy policy</Text>
      </Pressable>
      <Pressable onPress={() => Linking.openURL('https://nick676191.github.io/bridge-goal-based-app/')}>
        <Text style={styles.link}>Terms of use</Text>
      </Pressable>
      <Text style={styles.detail}>Questions or a report to follow up on? Email support (address coming in milestone 4).</Text>

      <Divider />
      <Button label="Log out" variant="secondary" onPress={signOut} />
      <Button
        label="Delete account"
        variant="danger"
        onPress={() =>
          confirm(
            'Delete your account?',
            'This permanently removes your profile, goals, tips and updates. It cannot be undone.',
            'Delete',
            signOut
          )
        }
      />
    </ScrollView>
  );
}

function Toggle({ label, detail, value, onChange }: { label: string; detail: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.lane, false: colors.hairline }}
        thumbColor={colors.paper} accessibilityLabel={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: 64, backgroundColor: colors.paper },
  section: { fontSize: 20, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, justifyContent: 'space-between' },
  label: { fontSize: 16, fontWeight: '600', color: colors.ink },
  detail: { fontSize: 13, lineHeight: 18, color: colors.muted },
  link: { fontSize: 16, fontWeight: '600', color: colors.lane },
});
