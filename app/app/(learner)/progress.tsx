import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { myProgress } from "../../src/api";
import { Card } from "../../src/components/Card";
import { Icon } from "../../src/components/Icon";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { useI18n } from "../../src/i18n";
import { spacing, typography, useTheme } from "../../src/theme";

const GENTLE_MESSAGE = {
  roman_ur: (before: number, after: number) => `Pehle ${before} hints chahiye thay, ab sirf ${after}. Shabash, aap seekh rahe hain!`,
  ur: (before: number, after: number) => `پہلے ${before} ہنٹس چاہیے تھے، اب صرف ${after}۔ شاباش، آپ سیکھ رہے ہیں!`,
  en: (before: number, after: number) => `You used to need ${before} hints, now just ${after}. You're learning!`,
};

export default function Progress() {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    myProgress()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const firstHints = rows.length ? rows[0].hints_used : null;
  const lastHints = rows.length ? rows[rows.length - 1].hints_used : null;
  const maxScore = Math.max(100, ...rows.map((r) => r.independence_score));

  return (
    <ScreenContainer>
      <ScreenHeader title={t("progress_title")} />

      {!loading && rows.length >= 2 && firstHints !== null && lastHints !== null && lastHints < firstHints && (
        <Card style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.primary, borderWidth: 2, flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
          <Icon.leaf size={18} color={colors.primaryDark} />
          <Text style={[typography.bodyBold, { color: colors.primaryDark, flex: 1 }]}>
            {GENTLE_MESSAGE[lang](firstHints, lastHints)}
          </Text>
        </Card>
      )}

      {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />}
      {error ? <Text style={{ color: colors.warning, marginBottom: spacing.sm }}>{error}</Text> : null}

      {!loading && rows.length === 0 && !error && (
        <Card style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Icon.leaf size={18} color={colors.textMuted} />
          <Text style={[typography.body, { color: colors.textMuted, textAlign: "center" }]}>{t("progress_empty")}</Text>
        </Card>
      )}

      {rows.length > 0 && (
        <Card>
          <Text style={[typography.bodyBold, { color: colors.text, marginBottom: spacing.sm }]}>{t("independence_score")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10, height: 120 }}>
              {rows.map((r, i) => (
                <View key={i} style={{ alignItems: "center" }}>
                  <View
                    style={{
                      width: 28,
                      height: Math.max(8, (r.independence_score / maxScore) * 100),
                      backgroundColor: r.correct ? colors.success : colors.warning,
                      borderRadius: 6,
                    }}
                  />
                  <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>{r.independence_score}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </Card>
      )}

      {rows
        .slice()
        .reverse()
        .map((r, i) => (
          <Card key={i}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>{r.scenario_id}</Text>
              {r.correct ? <Icon.checkmarkCircle size={20} color={colors.success} /> : <Icon.heart size={20} color={colors.warning} />}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {t("independence_score")}: {r.independence_score} · {t("need_hint")}: {r.hints_used}/3 · {r.confidence_before}
              </Text>
              <Icon.arrowForward size={12} color={colors.textMuted} />
              <Text style={[typography.caption, { color: colors.textMuted }]}>{r.confidence_after}</Text>
            </View>
          </Card>
        ))}
    </ScreenContainer>
  );
}
