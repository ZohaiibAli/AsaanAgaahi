import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { useI18n } from "../i18n";
import { spacing, typography, useTheme } from "../theme";

const STEPS: Array<{ icon: keyof typeof Icon; titleKey: string; descKey: string }> = [
  { icon: "sparkles", titleKey: "how_to_use_practice_title", descKey: "how_to_use_practice_desc" },
  { icon: "search", titleKey: "how_to_use_paste_title", descKey: "how_to_use_paste_desc" },
  { icon: "translate", titleKey: "how_to_use_translate_title", descKey: "how_to_use_translate_desc" },
  { icon: "trending", titleKey: "how_to_use_progress_title", descKey: "how_to_use_progress_desc" },
  { icon: "help", titleKey: "how_to_use_help_title", descKey: "how_to_use_help_desc" },
  { icon: "moon", titleKey: "how_to_use_lang_title", descKey: "how_to_use_lang_desc" },
];

export function HowToUseModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.background }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <Icon.help size={22} color={colors.primary} />
              <Text style={[typography.heading, { color: colors.text }]}>{t("how_to_use")}</Text>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t("close")} hitSlop={10} testID="how-to-use-close">
              <Icon.close size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.sm }]}>{t("how_to_use_intro")}</Text>

            {STEPS.map((step) => {
              const StepIcon = Icon[step.icon];
              return (
                <Card key={step.titleKey} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: colors.surfaceAlt,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <StepIcon size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.text, marginBottom: 2 }]}>{t(step.titleKey as any)}</Text>
                    <Text style={[typography.body, { color: colors.textMuted }]}>{t(step.descKey as any)}</Text>
                  </View>
                </Card>
              );
            })}

            <Button label={t("got_it")} onPress={onClose} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(20,15,31,0.5)", justifyContent: "flex-end" },
  sheet: {
    maxHeight: "85%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
});
