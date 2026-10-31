import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useI18n } from "../i18n";
import { useReadAloud } from "../hooks/useReadAloud";
import { useTheme } from "../theme";

export function ReadAloudButton({ text }: { text: string }) {
  const { colors } = useTheme();
  const { lang, t } = useI18n();
  const { speak, stop, speaking } = useReadAloud();

  return (
    <Pressable
      onPress={() => (speaking ? stop() : speak(text, lang))}
      accessibilityRole="button"
      accessibilityLabel={t("listen")}
      style={[styles.pill, { backgroundColor: colors.surfaceAlt, borderColor: colors.primary }]}
    >
      <Text style={{ fontSize: 20 }}>{speaking ? "⏹️" : "🔊"}</Text>
      <Text style={[styles.label, { color: colors.primary }]}>{t("listen")}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    alignSelf: "flex-start",
  },
  label: { fontSize: 15, fontWeight: "700" },
});
