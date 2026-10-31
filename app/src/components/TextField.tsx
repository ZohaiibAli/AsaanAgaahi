import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { spacing, touchTarget, typography, useTheme } from "../theme";

export function TextField({ label, style, ...rest }: TextInputProps & { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={[typography.bodyBold, { color: colors.text, marginBottom: 6 }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.field,
          typography.body,
          { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: touchTarget.minHeight,
    borderRadius: touchTarget.borderRadius,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
});
