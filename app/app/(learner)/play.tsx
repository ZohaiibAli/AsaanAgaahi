import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { getScenario, Scenario, submitProgress, teachback as teachbackApi } from "../../src/api";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { ConfidenceScale } from "../../src/components/ConfidenceScale";
import { NeedHelpButton } from "../../src/components/NeedHelpButton";
import { ReadAloudButton } from "../../src/components/ReadAloudButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { TextField } from "../../src/components/TextField";
import { pickLang, useI18n } from "../../src/i18n";
import { spacing, typography, useTheme } from "../../src/theme";

type Step = "confidence_before" | "read" | "result" | "teachback" | "confidence_after" | "done";

export default function Play() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const router = useRouter();

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [step, setStep] = useState<Step>("confidence_before");
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [decision, setDecision] = useState<"scam" | "safe" | null>(null);
  const [confidenceBefore, setConfidenceBefore] = useState<number | null>(null);
  const [confidenceAfter, setConfidenceAfter] = useState<number | null>(null);
  const [teachbackText, setTeachbackText] = useState("");
  const [teachbackResult, setTeachbackResult] = useState<{ understood: boolean; feedback: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [independenceScore, setIndependenceScore] = useState<number | null>(null);

  useEffect(() => {
    getScenario(id).then(setScenario);
  }, [id]);

  if (!scenario) {
    return (
      <ScreenContainer>
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const correct = decision ? (decision === "scam") === scenario.is_scam : null;
  const fullMessageText = scenario.segments.map((s) => s.text).join(" ");

  const toggleFlag = (i: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const onDecide = (d: "scam" | "safe") => {
    setDecision(d);
    setStep("result");
  };

  const onHint = () => {
    if (hintsUsed < 3) setHintsUsed(hintsUsed + 1);
  };

  const onSubmitTeachback = async () => {
    setSubmitting(true);
    try {
      const res = await teachbackApi({ scenario_id: scenario.id, answer_text: teachbackText });
      setTeachbackResult(res);
    } catch {
      setTeachbackResult({ understood: false, feedback: "" });
    } finally {
      setSubmitting(false);
      setStep("confidence_after");
    }
  };

  const onFinish = async () => {
    setSubmitting(true);
    const wrongTaps = [...flagged].filter((i) => !scenario.segments[i].is_red_flag).length;
    try {
      const res = await submitProgress({
        scenario_id: scenario.id,
        hints_used: hintsUsed,
        wrong_taps: wrongTaps,
        correct: !!correct,
        confidence_before: confidenceBefore ?? 3,
        confidence_after: confidenceAfter ?? 3,
        teachback_ok: teachbackResult?.understood ?? null,
      });
      setIndependenceScore(res.independence_score);
    } catch {
      setIndependenceScore(null);
    } finally {
      setSubmitting(false);
      setStep("done");
    }
  };

  // ---------- step: confidence before ----------
  if (step === "confidence_before") {
    return (
      <ScreenContainer>
        <ScreenHeader title={pickLang(scenario.title, lang)} />
        <Card>
          <Text style={[typography.bodyBold, { color: colors.text, marginBottom: spacing.md }]}>{t("confidence_before")}</Text>
          <ConfidenceScale value={confidenceBefore} onChange={setConfidenceBefore} />
        </Card>
        <Button label={t("continue_")} disabled={!confidenceBefore} onPress={() => setStep("read")} />
      </ScreenContainer>
    );
  }

  // ---------- step: read + decide ----------
  if (step === "read") {
    return (
      <ScreenContainer>
        <ScreenHeader title={pickLang(scenario.title, lang)} />
        <ReadAloudButton text={fullMessageText} />

        <View style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
          <Text style={[typography.caption, { color: colors.warning, fontWeight: "700" }]}>{t("simulated_label")}</Text>
        </View>

        <Card style={{ backgroundColor: colors.surfaceAlt }}>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 6 }]}>
            {scenario.channel.toUpperCase()} · {scenario.sender}
          </Text>
          {scenario.segments.map((seg, i) => (
            <Pressable key={i} onPress={() => toggleFlag(i)}>
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.text,
                    backgroundColor: flagged.has(i) ? colors.primary + "33" : "transparent",
                    textDecorationLine: flagged.has(i) ? "underline" : "none",
                    marginBottom: 6,
                    padding: 4,
                    borderRadius: 8,
                  },
                ]}
              >
                {seg.text}
              </Text>
            </Pressable>
          ))}
        </Card>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>{t("tap_suspicious")}</Text>

        {hintsUsed > 0 && (
          <Card>
            {scenario.hints.slice(0, hintsUsed).map((h, i) => (
              <Text key={i} style={[typography.body, { color: colors.primaryDark, marginBottom: 6 }]}>
                💡 {pickLang(h, lang)}
              </Text>
            ))}
          </Card>
        )}
        <Button label={`${t("need_hint")} (${hintsUsed}/3)`} variant="outline" onPress={onHint} disabled={hintsUsed >= 3} />

        <View style={{ marginTop: spacing.lg }}>
          <Button label={t("mark_scam")} onPress={() => onDecide("scam")} />
          <Button label={t("mark_safe")} variant="secondary" onPress={() => onDecide("safe")} />
        </View>

        <NeedHelpButton scenario_id={scenario.id} scenario_title={pickLang(scenario.title, lang)} step="read" hints_used={hintsUsed} />
      </ScreenContainer>
    );
  }

  // ---------- step: result / consequence ----------
  if (step === "result") {
    return (
      <ScreenContainer>
        <View style={{ alignItems: "center", marginTop: spacing.lg, marginBottom: spacing.md }}>
          <Text style={{ fontSize: 56 }}>{correct ? "🎉" : "🤗"}</Text>
          <Text style={[typography.title, { color: correct ? colors.success : colors.warning, marginTop: spacing.sm }]}>
            {correct ? t("correct_title") : t("oops_title")}
          </Text>
          {!correct && <Text style={[typography.body, { color: colors.textMuted }]}>{t("oops_subtitle")}</Text>}
        </View>

        <Card>
          <Text style={[typography.bodyBold, { color: colors.text, marginBottom: spacing.sm }]}>
            {correct ? "✅" : "⚠️"} {pickLang(scenario.consequence, lang)}
          </Text>
        </Card>

        <Card>
          <Text style={[typography.bodyBold, { color: colors.text, marginBottom: spacing.sm }]}>🚩</Text>
          {scenario.segments
            .map((seg, i) => ({ seg, i }))
            .filter(({ seg }) => seg.is_red_flag)
            .map(({ seg, i }) => (
              <View key={i} style={{ marginBottom: spacing.sm, flexDirection: "row" }}>
                <Text style={{ fontSize: 16 }}>{flagged.has(i) ? "✅ " : "➡️ "}</Text>
                <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{pickLang(seg.why, lang)}</Text>
              </View>
            ))}
        </Card>

        <Button label={t("continue_")} onPress={() => setStep("teachback")} />
      </ScreenContainer>
    );
  }

  // ---------- step: teachback ----------
  if (step === "teachback") {
    return (
      <ScreenContainer>
        <ScreenHeader title={t("teachback_prompt")} showBack={false} />
        <TextField
          value={teachbackText}
          onChangeText={setTeachbackText}
          placeholder={t("teachback_prompt")}
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
        <Button label={t("submit")} onPress={onSubmitTeachback} loading={submitting} disabled={teachbackText.trim().length < 2} />
      </ScreenContainer>
    );
  }

  // ---------- step: confidence after ----------
  if (step === "confidence_after") {
    return (
      <ScreenContainer>
        {teachbackResult?.feedback ? (
          <Card style={{ borderColor: colors.primary, borderWidth: 2, marginBottom: spacing.md }}>
            <Text style={[typography.body, { color: colors.text }]}>{teachbackResult.feedback}</Text>
          </Card>
        ) : null}
        <Card>
          <Text style={[typography.bodyBold, { color: colors.text, marginBottom: spacing.md }]}>{t("confidence_after")}</Text>
          <ConfidenceScale value={confidenceAfter} onChange={setConfidenceAfter} />
        </Card>
        <Button label={t("submit")} disabled={!confidenceAfter} loading={submitting} onPress={onFinish} />
      </ScreenContainer>
    );
  }

  // ---------- step: done ----------
  return (
    <ScreenContainer>
      <View style={{ alignItems: "center", marginTop: spacing.xl }}>
        <Text style={{ fontSize: 64 }}>🏆</Text>
        <Text style={[typography.title, { color: colors.primary, marginTop: spacing.md }]}>{t("independence_score")}</Text>
        <Text style={[typography.title, { color: colors.success, fontSize: 48 }]}>{independenceScore ?? "—"}</Text>
      </View>
      <Button label={t("continue_")} onPress={() => router.replace("/(learner)/home")} />
    </ScreenContainer>
  );
}
