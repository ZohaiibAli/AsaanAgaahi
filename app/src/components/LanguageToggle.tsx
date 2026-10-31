import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Language, useI18n } from "../i18n";
import { useTheme } from "../theme";

const OPTIONS: { key: Language; label: string }[] = [
  { key: "roman_ur", label: "Roman Urdu" },
  { key: "ur", label: "اردو" },
  { key: "en", label: "English" },
];

export function LanguageToggle() {
  const { colors } = useTheme();
  const { lang, setLang } = useI18n();

  return (
    <View style={[styles.row, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      {OPTIONS.map((opt) => {
        const active = opt.key === lang;
        return (
          <Pressable
            key={opt.key}
            onPress={() => setLang(opt.key)}
            style={[styles.option, active && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.label, { color: active ? colors.onPrimary : colors.text }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", borderRadius: 999, borderWidth: 1, padding: 4 },
  option: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center" },
  label: { fontSize: 15, fontWeight: "700" },
});
