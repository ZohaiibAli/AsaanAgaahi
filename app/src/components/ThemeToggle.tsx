import React from "react";
import { Pressable } from "react-native";
import { useTheme } from "../theme";
import { Icon } from "./Icon";

export function ThemeToggle() {
  const { mode, toggleMode, colors } = useTheme();
  return (
    <Pressable
      onPress={toggleMode}
      accessibilityRole="button"
      accessibilityLabel={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {mode === "dark" ? <Icon.moon size={22} color={colors.primary} /> : <Icon.sunny size={22} color={colors.primary} />}
    </Pressable>
  );
}
