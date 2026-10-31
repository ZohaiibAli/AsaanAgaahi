import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, useTheme } from "../theme";

export function ScreenContainer({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const { colors } = useTheme();
  const Inner = scroll ? ScrollView : View;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Inner
          style={styles.flex}
          contentContainerStyle={scroll ? styles.content : undefined}
          keyboardShouldPersistTaps="handled"
        >
          {!scroll ? <View style={styles.content}>{children}</View> : children}
        </Inner>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2, flexGrow: 1 },
});
