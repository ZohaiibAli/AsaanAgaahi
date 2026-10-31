import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { assignScenario, dashboard as fetchDashboard, listScenarios, pairCreate, Scenario } from "../../src/api";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { LanguageToggle } from "../../src/components/LanguageToggle";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ThemeToggle } from "../../src/components/ThemeToggle";
import { useAuth } from "../../src/hooks/useAuth";
import { pickLang, useI18n } from "../../src/i18n";
import { spacing, typography, useTheme } from "../../src/theme";
import { useFamilySocket } from "../../src/ws";

const NUDGE_PRESETS = {
  roman_ur: ["Ruk jao, mujhe call karo", "Yeh sahi nahi, ignore kar dein", "Shabash, aap theek kar rahe hain"],
  ur: ["رک جاؤ، مجھے کال کرو", "یہ صحیح نہیں، اگنور کر دیں", "شاباش، آپ ٹھیک کر رہے ہیں"],
  en: ["Wait, call me", "That's not right, ignore it", "Well done, you're doing great"],
};

export default function Dashboard() {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const { user, logout } = useAuth();
  const router = useRouter();

  const [code, setCode] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [showAssign, setShowAssign] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { code } = await pairCreate();
      setCode(code);
      const d = await fetchDashboard(code);
      setData(d);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      listScenarios()
        .then(setScenarios)
        .catch(() => {});
    }, [load])
  );

  const { send: sendWsEvent } = useFamilySocket(code, "helper", user?.id ?? null, (event) => {
    if (event.type === "need_help" || event.type === "progress_update") load();
  });

  const onAssign = async (scenarioId: string) => {
    if (!data?.learners?.length) return;
    await Promise.all(data.learners.map((l: any) => assignScenario({ learner_id: l.learner_id, scenario_id: scenarioId })));
    setShowAssign(false);
  };

  const sendNudge = (learnerId: string, message: string) => {
    sendWsEvent({ type: "nudge", learner_id: learnerId, message });
  };

  if (!data) {
    return (
      <ScreenContainer>
        {error ? <Text style={{ color: colors.warning }}>{error}</Text> : <ActivityIndicator color={colors.primary} />}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
        <Text style={[typography.title, { color: colors.primary }]}>{t("dashboard_title")}</Text>
        <ThemeToggle />
      </View>
      <View style={{ marginBottom: spacing.md }}>
        <LanguageToggle />
      </View>

      <LinearGradient
        colors={colors.buttonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: spacing.md, alignItems: "center", marginVertical: spacing.sm }}
      >
        <Text style={[typography.caption, { color: "rgba(255,255,255,0.85)" }]}>{t("pairing_create_subtitle")}</Text>
        <Text style={[typography.title, { color: colors.onPrimary, letterSpacing: 6, marginTop: 6 }]}>{code}</Text>
      </LinearGradient>

      <Button label={t("assign_scenario")} onPress={() => setShowAssign((v) => !v)} />
      {showAssign && (
        <Card>
          {scenarios.map((s) => (
            <Pressable key={s.id} onPress={() => onAssign(s.id)} style={{ paddingVertical: 8 }}>
              <Text style={[typography.body, { color: colors.text }]}>• {pickLang(s.title, lang)}</Text>
            </Pressable>
          ))}
        </Card>
      )}
      <Button label={t("send_alert")} variant="secondary" onPress={() => router.push("/(helper)/alert")} />
      <Button label={t("record_voice")} variant="outline" onPress={() => router.push("/(helper)/voice")} />

      {data.help_requests?.length > 0 && (
        <>
          <Text style={[typography.heading, { color: colors.text, marginTop: spacing.lg }]}>🙋 {t("need_help_button")}</Text>
          {data.help_requests.slice(0, 5).map((h: any, i: number) => (
            <Card key={i} style={{ borderColor: colors.warning, borderWidth: 2 }}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>{h.learner_name}</Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>{h.scenario_title || h.scenario_id}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {NUDGE_PRESETS[lang].map((msg, mi) => (
                    <Pressable
                      key={mi}
                      onPress={() => sendNudge(h.learner_id, msg)}
                      style={{ backgroundColor: colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}
                    >
                      <Text style={{ color: colors.primaryDark }}>{msg}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </Card>
          ))}
        </>
      )}

      <Text style={[typography.heading, { color: colors.text, marginTop: spacing.lg }]}>👪 {t("progress_title")}</Text>
      {data.learners?.length === 0 && <Text style={{ color: colors.textMuted }}>{t("pairing_create_subtitle")}</Text>}
      {data.learners?.map((l: any) => (
        <Card key={l.learner_id}>
          <Text style={[typography.bodyBold, { color: colors.text }]}>{l.name}</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
            {t("home_practice")}: {l.scenarios_completed} · {t("independence_score")}: {l.latest_independence_score ?? "—"}
          </Text>
        </Card>
      ))}

      <Pressable onPress={() => logout().then(() => router.replace("/(auth)/welcome"))} style={{ marginTop: spacing.lg, alignItems: "center" }}>
        <Text style={{ color: colors.textMuted }}>{t("logout")}</Text>
      </Pressable>
    </ScreenContainer>
  );
}
