import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import { Animated, ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
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
  const scale = useRef(new Animated.Value(1)).current;

  const bg = variant === "secondary" ? colors.surfaceAlt : "transparent";
  const textColor = variant === "primary" ? colors.onPrimary : colors.primary;
  const borderColor = variant === "outline" ? colors.primary : "transparent";

  const animateTo = (value: number) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 30, bounciness: 6 }).start();

  const content = loading ? (
    <ActivityIndicator color={textColor} />
  ) : (
    <Text style={[typography.button, { color: textColor }]}>
      {icon ? `${icon}  ` : ""}
      {label}
    </Text>
  );

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }]}
      >
        {variant === "primary" ? (
          <LinearGradient
            colors={colors.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.base}
          >
            {content}
          </LinearGradient>
        ) : (
          <Animated.View style={[styles.base, { backgroundColor: bg, borderColor, borderWidth: 2 }]}>{content}</Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.minHeight,
    borderRadius: touchTarget.borderRadius,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginVertical: 6,
  },
});
