import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { explain } from "../../src/api";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Icon } from "../../src/components/Icon";
import { ReadAloudButton } from "../../src/components/ReadAloudButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { TextField } from "../../src/components/TextField";
import { useI18n } from "../../src/i18n";
import { scanScreenshotText } from "../../src/ocrSim";
import { spacing, typography, useTheme } from "../../src/theme";

type Tab = "type" | "screenshot";

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

  const [tab, setTab] = useState<Tab>("type");

  // "Type it" tab
  const [typedText, setTypedText] = useState("");

  // "From screenshot" tab — fully hands-off: no text box, system reads it and that's it.
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [extractedText, setExtractedText] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof explain>> | null>(null);
  const [error, setError] = useState("");

  const text = tab === "type" ? typedText : extractedText;

  const onPickScreenshot = async () => {
    setError("");
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Screenshot access ki ijazat nahi mili.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (picked.canceled || !picked.assets?.[0]) return;

    setScreenshotUri(picked.assets[0].uri);
    setExtractedText("");
    setResult(null);
    setScanning(true);
    try {
      const read = await scanScreenshotText();
      setExtractedText(read);
    } finally {
      setScanning(false);
    }
  };

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

      <View style={[styles.tabs, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        {(["type", "screenshot"] as Tab[]).map((key) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tab, active && { backgroundColor: colors.primary }]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {key === "type" ? (
                  <Icon.pencil size={16} color={active ? colors.onPrimary : colors.text} />
                ) : (
                  <Icon.camera size={16} color={active ? colors.onPrimary : colors.text} />
                )}
                <Text style={[typography.bodyBold, { color: active ? colors.onPrimary : colors.text }]}>
                  {t(key === "type" ? "tab_type_message" : "tab_screenshot_message")}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {tab === "type" ? (
        <TextField
          value={typedText}
          onChangeText={setTypedText}
          placeholder={t("paste_placeholder")}
          multiline
          numberOfLines={5}
          style={{ minHeight: 120, textAlignVertical: "top" }}
        />
      ) : !screenshotUri ? (
        <Pressable onPress={onPickScreenshot}>
          <Card style={{ alignItems: "center", paddingVertical: spacing.xl, borderStyle: "dashed", borderWidth: 2, borderColor: colors.primary }}>
            <Icon.camera size={40} color={colors.primary} />
            <Text style={[typography.bodyBold, { color: colors.primary, marginTop: spacing.sm }]}>{t("pick_screenshot")}</Text>
            <Text style={[typography.caption, { color: colors.textMuted, textAlign: "center", marginTop: spacing.sm }]}>
              {t("paste_pick_screenshot_hint")}
            </Text>
          </Card>
        </Pressable>
      ) : (
        <Card>
          <Image source={{ uri: screenshotUri }} style={{ width: "100%", height: 180, borderRadius: 16 }} resizeMode="cover" />
          {scanning ? (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[typography.body, { color: colors.textMuted, marginLeft: spacing.sm }]}>{t("scanning_screenshot")}</Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md, gap: 6 }}>
                <Icon.checkmarkCircle size={16} color={colors.success} />
                <Text style={[typography.caption, { color: colors.success }]}>{t("scan_done")}</Text>
              </View>
              <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: 16, padding: spacing.md, marginTop: spacing.sm }}>
                <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>{t("extracted_label")}</Text>
                <Text style={[typography.body, { color: colors.text }]}>{extractedText}</Text>
              </View>
              <Pressable onPress={onPickScreenshot} style={{ marginTop: spacing.sm, alignItems: "center" }}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>{t("pick_another")}</Text>
              </Pressable>
            </>
          )}
        </Card>
      )}

      <Button label={t("check_message")} onPress={onCheck} loading={loading} disabled={text.trim().length < 5 || scanning} />
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
              text={[...(result.red_flags_ur ?? result.red_flags ?? []), result.what_to_do_ur ?? result.what_to_do].join(". ")}
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

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", borderRadius: 999, borderWidth: 1, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center" },
});
