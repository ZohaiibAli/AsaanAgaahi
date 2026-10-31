/**
 * Calm, large-text, purple theme (light by default, full dark mode support).
 * Text/touch sizes are intentionally big — this app is for people who did not
 * grow up with touchscreens, so a normal 14px button is genuinely hard to use.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import * as SecureStore from "expo-secure-store";

export const lightColors = {
  background: "#F6F2FC",
  surface: "#FFFFFF",
  surfaceAlt: "#EDE4FB",
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  onPrimary: "#FFFFFF",
  text: "#241E33",
  textMuted: "#6B6380",
  border: "#E4DBF5",
  success: "#2F9E6E",
  warning: "#D97706",
  danger: "#D97706", // intentionally the same warm amber, not red — "no red error screens"
};

export const darkColors = {
  background: "#140F1F",
  surface: "#1F1830",
  surfaceAlt: "#2B2144",
  primary: "#A78BFA",
  primaryDark: "#C4B5FD",
  onPrimary: "#1A1127",
  text: "#F3EEFB",
  textMuted: "#B8AED1",
  border: "#342953",
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#FBBF24",
};

export type Colors = typeof lightColors;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const typography = {
  title: { fontSize: 28, fontWeight: "800" as const },
  heading: { fontSize: 22, fontWeight: "700" as const },
  body: { fontSize: 18, fontWeight: "400" as const },
  bodyBold: { fontSize: 18, fontWeight: "700" as const },
  caption: { fontSize: 15, fontWeight: "400" as const },
  button: { fontSize: 19, fontWeight: "700" as const },
};

export const touchTarget = { minHeight: 56, borderRadius: 18 };

type Mode = "light" | "dark";
type ThemeContextValue = { colors: Colors; mode: Mode; toggleMode: () => void };

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  mode: "light",
  toggleMode: () => {},
});

const STORAGE_KEY = "practice_mode_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((saved) => {
      if (saved === "light" || saved === "dark") {
        setMode(saved);
      } else {
        setMode(Appearance.getColorScheme() === "dark" ? "dark" : "light");
      }
    });
  }, []);

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  };

  const colors = mode === "dark" ? darkColors : lightColors;

  return <ThemeContext.Provider value={{ colors, mode, toggleMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
