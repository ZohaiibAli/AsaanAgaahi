import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { listScenarios, Scenario } from "../../src/api";
import { Card } from "../../src/components/Card";
import { LanguageToggle } from "../../src/components/LanguageToggle";
import { NeedHelpButton } from "../../src/components/NeedHelpButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ThemeToggle } from "../../src/components/ThemeToggle";
import { useAuth } from "../../src/hooks/useAuth";
import { useLearnerRealtime } from "../../src/hooks/useLearnerRealtime";
import { pickLang, useI18n } from "../../src/i18n";
import { spacing, typography, useTheme } from "../../src/theme";

const CHANNEL_ICON: Record<string, string> = { sms: "💬", whatsapp: "🟢", call: "📞" };

export default function LearnerHome() {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const { user, logout } = useAuth();
  const { latestAssignment, latestAlert } = useLearnerRealtime();
  const router = useRouter();

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    listScenarios()
      .then(setScenarios)
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  return (
    <ScreenContainer>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
        <Text style={[typography.title, { color: colors.primary }]}>{t("app_name")}</Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <ThemeToggle />
        </View>
      </View>
      <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.md }]}>
        {user?.name ? `${t("im_learning")} — ${user.name}` : t("im_learning")}
      </Text>

      <View style={{ marginBottom: spacing.md }}>
        <LanguageToggle />
      </View>

      {(latestAssignment || latestAlert) && (
        <Card style={{ borderColor: colors.primary, borderWidth: 2 }}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>
            {latestAlert ? t("from_a_real_message") : "✨ " + t("home_practice")}
          </Text>
          <Pressable
            onPress={() => router.push({ pathname: "/(learner)/play", params: { id: (latestAlert ?? latestAssignment)!.scenario_id } })}
          >
            <Text style={[typography.body, { color: colors.text, marginTop: 4 }]}>
              {pickLang((latestAlert ?? latestAssignment)!.title, lang)} →
            </Text>
          </Pressable>
        </Card>
      )}

      <Pressable onPress={() => router.push("/(learner)/paste")}>
        <Card>
          <Text style={typography.heading}>🔍 {t("home_paste")}</Text>
        </Card>
      </Pressable>
      <Pressable onPress={() => router.push("/(learner)/progress")}>
        <Card>
          <Text style={typography.heading}>📈 {t("home_progress")}</Text>
        </Card>
      </Pressable>

      <Text style={[typography.heading, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
        {t("home_practice")}
      </Text>

      {scenarios.map((s) => (
        <Pressable key={s.id} onPress={() => router.push({ pathname: "/(learner)/play", params: { id: s.id } })}>
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 26, marginRight: spacing.sm }}>{CHANNEL_ICON[s.channel] ?? "💬"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.text }]}>{pickLang(s.title, lang)}</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>{s.sender}</Text>
              </View>
              {s.is_custom ? (
                <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>Family</Text>
                </View>
              ) : null}
            </View>
          </Card>
        </Pressable>
      ))}

      <NeedHelpButton />

      <Pressable onPress={() => logout().then(() => router.replace("/(auth)/welcome"))} style={{ marginTop: spacing.lg, alignItems: "center" }}>
        <Text style={{ color: colors.textMuted }}>{t("logout")}</Text>
      </Pressable>
    </ScreenContainer>
  );
}
