import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { explain } from "../../src/api";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Icon } from "../../src/components/Icon";
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
const VERDICT_ICON: Record<string, keyof typeof Icon> = { likely_scam: "warning", looks_safe: "checkmarkCircle", not_sure: "thinking" };

export default function Paste() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof explain>> | null>(null);
  const [error, setError] = useState("");

  const onCheck = async () => {
    setLoading(true);
    setError("");
    try {
      setResult(await explain({ message_text: text }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const VerdictIcon = result ? Icon[VERDICT_ICON[result.verdict] ?? "thinking"] : null;

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
      {error ? <Text style={{ color: colors.warning, marginTop: spacing.sm }}>{error}</Text> : null}

      {result && VerdictIcon && (
        <View style={{ marginTop: spacing.md }}>
          <Card style={{ borderColor: VERDICT_COLOR(colors, result.verdict), borderWidth: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <VerdictIcon size={22} color={VERDICT_COLOR(colors, result.verdict)} />
              <Text style={[typography.heading, { color: VERDICT_COLOR(colors, result.verdict) }]}>
                {t(VERDICT_KEY[result.verdict] ?? "verdict_not_sure")}
              </Text>
            </View>
            <ReadAloudButton
              text={[...(result.red_flags || []), result.what_to_do].join(". ")}
            />
          </Card>

          {result.red_flags?.length > 0 && (
            <Card>
              {result.red_flags.map((f, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <Icon.flag size={16} color={colors.warning} />
                  <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{f}</Text>
                </View>
              ))}
            </Card>
          )}

          <Card>
            <Text style={[typography.bodyBold, { color: colors.text }]}>{result.what_to_do}</Text>
          </Card>

          {result.practice_suggestion ? (
            <Card style={{ backgroundColor: colors.surfaceAlt, flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
              <Icon.bulb size={18} color={colors.primaryDark} />
              <Text style={[typography.body, { color: colors.primaryDark, flex: 1 }]}>{result.practice_suggestion}</Text>
            </Card>
          ) : null}
        </View>
      )}

      <Button label={t("home_progress")} variant="outline" onPress={() => router.push("/(learner)/progress")} />
    </ScreenContainer>
  );
}
