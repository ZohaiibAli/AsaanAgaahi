import React from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { spacing, typography, useTheme } from "../theme";

export function ScreenHeader({ title, showBack = true }: { title: string; showBack?: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.row}>
      {showBack && router.canGoBack() ? (
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <Text style={{ fontSize: 24, color: colors.primary }}>←</Text>
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      <Text style={[typography.heading, { color: colors.text, flex: 1 }]} numberOfLines={2}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  back: { width: 36 },
});
