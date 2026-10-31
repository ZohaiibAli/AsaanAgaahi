/**
 * Calm, large-text, purple theme (light by default, full dark mode support).
 * Text/touch sizes are intentionally big — this app is for people who did not
 * grow up with touchscreens, so a normal 14px button is genuinely hard to use.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import { storageGet, storageSet } from "./storage";

// Palette matched to the "Calmly" reference UI: near-black violet backgrounds, vivid
// purple→magenta accent gradient, soft lavender-gray body text.
type Gradient = readonly [string, string];

export const lightColors = {
  background: "#F6F2FC",
  surface: "#FFFFFF",
  surfaceAlt: "#ECE2FB",
  primary: "#8B5CF6",
  primaryDark: "#6D28D9",
  accent: "#C026D3",
  onPrimary: "#FFFFFF",
  text: "#1E1733",
  textMuted: "#6B6380",
  border: "#E4DBF5",
  success: "#2F9E6E",
  warning: "#D97706",
  danger: "#D97706", // intentionally the same warm amber, not red — "no red error screens"
  heroGradient: ["#EDE1FC", "#F6F2FC"] as Gradient,
  buttonGradient: ["#9B6EF3", "#7C3AED"] as Gradient,
};

export const darkColors = {
  background: "#120B20",
  surface: "#1E1733",
  surfaceAlt: "#2A2049",
  primary: "#9B6EF3",
  primaryDark: "#C4B5FD",
  accent: "#D946EF",
  onPrimary: "#FFFFFF",
  text: "#F5F2FC",
  textMuted: "#A99FC4",
  border: "#2F2550",
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#FBBF24",
  heroGradient: ["#241A42", "#120B20"] as Gradient,
  buttonGradient: ["#9B6EF3", "#7C3AED"] as Gradient,
};

export type Colors = typeof lightColors;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const typography = {
  title: { fontSize: 23, fontWeight: "800" as const },
  heading: { fontSize: 18, fontWeight: "700" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  bodyBold: { fontSize: 15, fontWeight: "700" as const },
  caption: { fontSize: 13, fontWeight: "400" as const },
  button: { fontSize: 16, fontWeight: "700" as const },
};

export const touchTarget = { minHeight: 56, borderRadius: 22 };

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
    storageGet(STORAGE_KEY).then((saved) => {
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
      storageSet(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  };

  const colors = mode === "dark" ? darkColors : lightColors;

  return <ThemeContext.Provider value={{ colors, mode, toggleMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
