import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewProps } from "react-native";
import { spacing, useTheme } from "../theme";

export function Card({ style, ...rest }: ViewProps) {
  const { colors, mode } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [anim]);

  return (
    <Animated.View
      {...rest}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: mode === "dark" ? colors.surfaceAlt : colors.border,
          shadowOpacity: mode === "dark" ? 0.35 : 0.08,
          shadowColor: mode === "dark" ? colors.primary : "#4C1D95",
        },
        { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.md,
    marginVertical: spacing.sm,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 2,
  },
});
