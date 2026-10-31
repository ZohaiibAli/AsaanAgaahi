import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { spacing, useTheme } from "../theme";

export function Card({ style, ...rest }: ViewProps) {
  const { colors, mode } = useTheme();
  return (
    <View
      {...rest}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, shadowOpacity: mode === "dark" ? 0 : 0.08 },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.md,
    marginVertical: spacing.sm,
    shadowColor: "#4C1D95",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
});
