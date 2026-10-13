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
import { colors, fonts, space } from '@/theme';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'accent';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg =
    variant === 'primary' ? colors.ink : variant === 'accent' ? colors.lane : colors.paper;
  const fg =
    variant === 'secondary' ? colors.ink : variant === 'danger' ? colors.danger : colors.paper;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: variant === 'danger' ? colors.danger : variant === 'accent' ? colors.lane : colors.ink },
        disabled && { opacity: 0.35 },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && { color: colors.paper }]}>{label}</Text>
    </Pressable>
  );
}

// The amber tag on setback updates.
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
    <View style={[styles.status, { borderColor: achieved ? colors.achieved : colors.muted }]}>
      <Text style={[styles.statusText, { color: achieved ? colors.achieved : colors.muted }]}>
        {achieved ? 'Achieved' : 'Dropped'}
      </Text>
    </View>
  );
}

// Big condensed title at the top of each tab, e.g. "Explore".
export function ScreenTitle({ children, right }: { children: string; right?: React.ReactNode }) {
  return (
    <View style={styles.titleRow}>
      <Text style={styles.title} accessibilityRole="header">
        {children}
      </Text>
      {right}
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
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.ink,
    backgroundColor: colors.paper,
  },
  chipSelected: { backgroundColor: colors.ink },
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
  status: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 1 },
  statusText: { fontSize: 12, fontWeight: '700' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
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
