import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useLearnerRealtime } from "../hooks/useLearnerRealtime";
import { useI18n } from "../i18n";
import { typography, useTheme } from "../theme";

type Props = { scenario_id?: string; scenario_title?: string; step?: string; hints_used?: number };

export function NeedHelpButton(ctx: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { sendNeedHelp } = useLearnerRealtime();
  const [sent, setSent] = useState(false);

  const onPress = () => {
    sendNeedHelp(ctx);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <Pressable onPress={onPress} style={[styles.button, { backgroundColor: colors.surfaceAlt, borderColor: colors.primary }]}>
      <Text style={{ fontSize: 20 }}>🙋</Text>
      <Text style={[typography.bodyBold, { color: colors.primary, marginLeft: 8 }]}>
        {sent ? t("help_sent") : t("need_help_button")}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: "dashed",
    marginTop: 12,
  },
});
