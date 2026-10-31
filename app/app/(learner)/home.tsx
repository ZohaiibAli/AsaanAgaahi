import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { listScenarios, myAssignments, Scenario } from "../../src/api";
import { Card } from "../../src/components/Card";
import { Icon } from "../../src/components/Icon";
import { LanguageToggle } from "../../src/components/LanguageToggle";
import { NeedHelpButton } from "../../src/components/NeedHelpButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ThemeToggle } from "../../src/components/ThemeToggle";
import { useAuth } from "../../src/hooks/useAuth";
import { useLearnerRealtime } from "../../src/hooks/useLearnerRealtime";
import { pickLang, useI18n } from "../../src/i18n";
import { spacing, typography, useTheme } from "../../src/theme";

const CHANNEL_ICON: Record<string, keyof typeof Icon> = { sms: "sms", whatsapp: "whatsapp", call: "call" };

export default function LearnerHome() {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const { user, logout } = useAuth();
  const { latestAssignment, latestAlert } = useLearnerRealtime();
  const router = useRouter();

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    listScenarios()
      .then(setScenarios)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // Covers an assignment the Helper sent while this app wasn't open to receive the
    // live WS push — the pushed one (latestAssignment) still wins if both arrive.
    myAssignments()
      .then((rows) => setPendingAssignmentId(rows[0]?.scenario_id ?? null))
      .catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  const pendingAssignment = pendingAssignmentId ? scenarios.find((s) => s.id === pendingAssignmentId) ?? null : null;
  const assignmentBanner = latestAssignment ?? (pendingAssignment ? { scenario_id: pendingAssignment.id, title: pendingAssignment.title } : null);

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

      {(assignmentBanner || latestAlert) && (
        <Card style={{ borderColor: colors.primary, borderWidth: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {latestAlert ? null : <Icon.sparkles size={16} color={colors.primary} />}
            <Text style={[typography.bodyBold, { color: colors.primary }]}>
              {latestAlert ? t("from_a_real_message") : t("home_practice")}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push({ pathname: "/(learner)/play", params: { id: (latestAlert ?? assignmentBanner)!.scenario_id } })}
            style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}
          >
            <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{pickLang((latestAlert ?? assignmentBanner)!.title, lang)}</Text>
            <Icon.arrowForward size={18} color={colors.text} />
          </Pressable>
        </Card>
      )}

      <Pressable onPress={() => router.push("/(learner)/paste")}>
        <Card style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Icon.search size={20} color={colors.text} />
          <Text style={typography.heading}>{t("home_paste")}</Text>
        </Card>
      </Pressable>
      <Pressable onPress={() => router.push("/(learner)/progress")}>
        <Card style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Icon.trending size={20} color={colors.text} />
          <Text style={typography.heading}>{t("home_progress")}</Text>
        </Card>
      </Pressable>

      <Text style={[typography.heading, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
        {t("home_practice")}
      </Text>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />}
      {error ? <Text style={{ color: colors.warning, marginBottom: spacing.sm }}>{error}</Text> : null}

      {scenarios.map((s) => {
        const ChannelIcon = Icon[CHANNEL_ICON[s.channel] ?? "sms"];
        return (
          <Pressable key={s.id} onPress={() => router.push({ pathname: "/(learner)/play", params: { id: s.id } })}>
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.surfaceAlt,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: spacing.sm,
                  }}
                >
                  <ChannelIcon size={22} color={colors.primary} />
                </View>
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
        );
      })}

      <NeedHelpButton />

      <Pressable onPress={() => logout().then(() => router.replace("/(auth)/welcome"))} style={{ marginTop: spacing.lg, alignItems: "center" }}>
        <Text style={{ color: colors.textMuted }}>{t("logout")}</Text>
      </Pressable>
    </ScreenContainer>
  );
}
