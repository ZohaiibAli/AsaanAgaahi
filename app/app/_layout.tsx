import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/hooks/useAuth";
import { I18nProvider } from "../src/i18n";
import { ThemeProvider, useTheme } from "../src/theme";

function Navigation() {
  const { mode, colors } = useTheme();
  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <Navigation />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
