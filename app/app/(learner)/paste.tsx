import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { explain } from "../../src/api";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { ReadAloudButton } from "../../src/components/ReadAloudButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { TextField } from "../../src/components/TextField";
import { useI18n } from "../../src/i18n";
import { spacing, typography, useTheme } from "../../src/theme";

const VERDICT_KEY: Record<string, "verdict_likely_scam" | "verdict_looks_safe" | "verdict_not_sure"> = {
  likely_scam: "verdict_likely_scam",
  looks_safe: "verdict_looks_safe",
  not_sure: "verdict_not_sure",
};
const VERDICT_COLOR = (c: any, v: string) => (v === "likely_scam" ? c.warning : v === "looks_safe" ? c.success : c.primary);
const VERDICT_ICON: Record<string, string> = { likely_scam: "⚠️", looks_safe: "✅", not_sure: "🤔" };

export default function Paste() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof explain>> | null>(null);

  const onCheck = async () => {
    setLoading(true);
    try {
      setResult(await explain({ message_text: text }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader title={t("paste_title")} />
      <TextField
        value={text}
        onChangeText={setText}
        placeholder={t("paste_placeholder")}
        multiline
        numberOfLines={5}
        style={{ minHeight: 120, textAlignVertical: "top" }}
      />
      <Button label={t("check_message")} onPress={onCheck} loading={loading} disabled={text.trim().length < 5} />

      {result && (
        <View style={{ marginTop: spacing.md }}>
          <Card style={{ borderColor: VERDICT_COLOR(colors, result.verdict), borderWidth: 2 }}>
            <Text style={[typography.heading, { color: VERDICT_COLOR(colors, result.verdict) }]}>
              {VERDICT_ICON[result.verdict] ?? "🤔"} {t(VERDICT_KEY[result.verdict] ?? "verdict_not_sure")}
            </Text>
            <ReadAloudButton
              text={[...(result.red_flags || []), result.what_to_do].join(". ")}
            />
          </Card>

          {result.red_flags?.length > 0 && (
            <Card>
              {result.red_flags.map((f, i) => (
                <Text key={i} style={[typography.body, { color: colors.text, marginBottom: 6 }]}>
                  🚩 {f}
                </Text>
              ))}
            </Card>
          )}

          <Card>
            <Text style={[typography.bodyBold, { color: colors.text }]}>{result.what_to_do}</Text>
          </Card>

          {result.practice_suggestion ? (
            <Card style={{ backgroundColor: colors.surfaceAlt }}>
              <Text style={[typography.body, { color: colors.primaryDark }]}>💡 {result.practice_suggestion}</Text>
            </Card>
          ) : null}
        </View>
      )}

      <Button label={t("home_progress")} variant="outline" onPress={() => router.push("/(learner)/progress")} />
    </ScreenContainer>
  );
}
