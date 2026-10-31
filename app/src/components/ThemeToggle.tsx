import React from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "../theme";

export function ThemeToggle() {
  const { mode, toggleMode, colors } = useTheme();
  return (
    <Pressable
      onPress={toggleMode}
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
      <Text style={{ fontSize: 22 }}>{mode === "dark" ? "🌙" : "☀️"}</Text>
    </Pressable>
  );
}
