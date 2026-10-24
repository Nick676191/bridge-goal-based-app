// Small reusable pieces: buttons, chips, headers, text fields.
// Screens build on these so the whole app looks consistent.

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, space } from '@/theme';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  large,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'accent';
  disabled?: boolean;
  large?: boolean; // taller, fully rounded, bigger text (welcome screen)
  style?: StyleProp<ViewStyle>;
}) {
  // primary: maize with navy text (the main action on a screen)
  // accent: Carolina blue with navy text (e.g. Commit to this goal)
  // secondary: white with a navy outline; danger: white with a red outline
  const bg =
    variant === 'primary' ? colors.maize : variant === 'accent' ? colors.carolina : colors.paper;
  const fg = variant === 'danger' ? colors.danger : colors.navy;
  const border =
    variant === 'primary' ? colors.maize : variant === 'accent' ? colors.carolina : variant === 'danger' ? colors.danger : colors.navy;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: border },
        large && styles.buttonLarge,
        disabled && { opacity: 0.35 },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, large && styles.buttonTextLarge, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  dimmed,
  onPress,
}: {
  label: string;
  selected?: boolean;
  dimmed?: boolean; // shown faded, e.g. when the 3-category limit is reached
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected, dimmed && { opacity: 0.35 }]}
    >
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

// The burnt-orange tag on setback updates.
export function SetbackTag() {
  return (
    <View style={styles.setback}>
      <Text style={styles.setbackText}>Setback</Text>
    </View>
  );
}

export function StatusTag({ status }: { status: 'active' | 'achieved' | 'dropped' }) {
  if (status === 'active') return null;
  const achieved = status === 'achieved';
  return (
    <View
      style={[
        styles.status,
        achieved
          ? { backgroundColor: colors.achievedFill, borderColor: colors.achievedFill }
          : { borderColor: colors.muted },
      ]}
    >
      <Text style={[styles.statusText, { color: achieved ? colors.achieved : colors.muted }]}>
        {achieved ? 'Achieved' : 'Dropped'}
      </Text>
    </View>
  );
}

// The Carolina blue band at the top of each tab, with a big condensed title
// (e.g. "Explore"). It reaches up behind the clock and battery icons.
export function ScreenTitle({
  children,
  right,
  size = 40,
}: {
  children: string;
  right?: React.ReactNode;
  size?: number;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.titleBand, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { fontSize: size, lineHeight: size + 2 }]} accessibilityRole="header">
          {children}
        </Text>
        {right}
      </View>
    </View>
  );
}

export function Field({
  label,
  hint,
  max,
  value,
  ...props
}: TextInputProps & { label: string; hint?: string; max?: number; value: string }) {
  const over = max !== undefined && value.length > max;
  return (
    <View style={{ gap: space.xs }}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {max !== undefined && (
          <Text style={[styles.counter, over && { color: colors.danger }]}>
            {value.length}/{max}
          </Text>
        )}
      </View>
      <TextInput
        value={value}
        placeholderTextColor={colors.muted}
        style={[styles.input, props.multiline && { minHeight: 110, textAlignVertical: 'top' }]}
        {...props}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Divider({ strong }: { strong?: boolean }) {
  return (
    <View
      style={{
        height: strong ? 1.5 : StyleSheet.hairlineWidth,
        backgroundColor: strong ? colors.line : colors.hairline,
      }}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: space.xl,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  buttonLarge: { minHeight: 62, borderRadius: 999, borderWidth: 2 },
  buttonTextLarge: { fontSize: 19 },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.ink,
    backgroundColor: colors.paper,
  },
  chipSelected: { backgroundColor: colors.carolina, borderColor: colors.navy },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  setback: {
    alignSelf: 'flex-start',
    backgroundColor: colors.setbackWash,
    borderLeftWidth: 3,
    borderLeftColor: colors.setback,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  setbackText: { color: colors.setback, fontSize: 12, fontWeight: '700' },
  status: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 1, marginBottom: 2 },
  statusText: { fontSize: 12, fontWeight: '700' },
  titleBand: { backgroundColor: colors.carolina, borderBottomWidth: 2, borderBottomColor: colors.navy },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  title: { fontFamily: fonts.displayHeavy, fontSize: 40, lineHeight: 42, color: colors.ink },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: colors.ink },
  counter: { fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] },
  input: {
    backgroundColor: colors.wash,
    borderRadius: 4,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
    color: colors.ink,
  },
  hint: { fontSize: 13, color: colors.muted },
});
