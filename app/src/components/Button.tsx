import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { touchTarget, typography, useTheme } from "../theme";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
};

export function Button({ label, onPress, variant = "primary", disabled, loading, icon }: Props) {
  const { colors } = useTheme();

  const bg = variant === "primary" ? colors.primary : variant === "secondary" ? colors.surfaceAlt : "transparent";
  const textColor = variant === "primary" ? colors.onPrimary : colors.primary;
  const borderColor = variant === "outline" ? colors.primary : "transparent";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[typography.button, { color: textColor }]}>
          {icon ? `${icon}  ` : ""}
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.minHeight,
    borderRadius: touchTarget.borderRadius,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginVertical: 6,
  },
});
