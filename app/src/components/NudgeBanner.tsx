import React from "react";
import { useAudioPlayer } from "expo-audio";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { voiceUrl } from "../api";
import { useAuth } from "../hooks/useAuth";
import { useLearnerRealtime } from "../hooks/useLearnerRealtime";
import { useI18n } from "../i18n";
import { spacing, typography, useTheme } from "../theme";
import { Icon } from "./Icon";

export function NudgeBanner() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();
  const { nudge, dismissNudge } = useLearnerRealtime();
  const player = useAudioPlayer(nudge?.voice_id && user?.family_code ? voiceUrl(user.family_code, nudge.voice_id) : null);

  if (!nudge) return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.primary }]}>
      <Icon.sms size={22} color={colors.onPrimary} />
      <View style={{ flex: 1, marginHorizontal: spacing.sm }}>
        <Text style={[typography.bodyBold, { color: colors.onPrimary }]}>{t("message_from_family")}</Text>
        {nudge.message ? <Text style={{ color: colors.onPrimary, marginTop: 2 }}>{nudge.message}</Text> : null}
        {nudge.voice_id ? (
          <Pressable onPress={() => player.play()} style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
            <Icon.playCircle size={18} color={colors.onPrimary} />
            <Text style={{ color: colors.onPrimary, fontWeight: "700", marginLeft: 4 }}>{t("play")}</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable onPress={dismissNudge} hitSlop={10}>
        <Icon.close size={20} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
  },
});
