import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { createAlert } from "../../src/api";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Icon } from "../../src/components/Icon";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { TextField } from "../../src/components/TextField";
import { useI18n } from "../../src/i18n";
import { scanScreenshotText } from "../../src/ocrSim";
import { spacing, typography, useTheme } from "../../src/theme";

type Tab = "type" | "screenshot";

export default function Alert() {
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

  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const text = tab === "type" ? typedText : extractedText;

  const onPickScreenshot = async () => {
    setError("");
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Screenshot access ki ijazat nahi mili.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (result.canceled || !result.assets?.[0]) return;

    setScreenshotUri(result.assets[0].uri);
    setExtractedText("");
    setScanning(true);
    try {
      const read = await scanScreenshotText();
      setExtractedText(read);
    } finally {
      setScanning(false);
    }
  };

  const onSend = async () => {
    setLoading(true);
    setError("");
    try {
      await createAlert({ text, note: note || undefined });
      setSent(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <ScreenContainer>
        <Card style={{ alignItems: "center", marginTop: 40 }}>
          <Icon.mail size={48} color={colors.success} />
          <Text style={[typography.heading, { color: colors.success, marginTop: 12, textAlign: "center" }]}>
            {t("alert_send")}
          </Text>
        </Card>
        <Button label={t("continue_")} onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title={t("alert_title")} />

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
                  {t(key === "type" ? "alert_tab_type" : "alert_tab_screenshot")}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {tab === "type" ? (
        <TextField
          label={t("alert_text_label")}
          value={typedText}
          onChangeText={setTypedText}
          multiline
          numberOfLines={5}
          style={{ minHeight: 120, textAlignVertical: "top" }}
        />
      ) : !screenshotUri ? (
        <Pressable onPress={onPickScreenshot}>
          <Card style={{ alignItems: "center", paddingVertical: spacing.xl, borderStyle: "dashed", borderWidth: 2, borderColor: colors.primary }}>
            <Icon.camera size={40} color={colors.primary} />
            <Text style={[typography.bodyBold, { color: colors.primary, marginTop: spacing.sm }]}>{t("alert_pick_screenshot")}</Text>
            <Text style={[typography.caption, { color: colors.textMuted, textAlign: "center", marginTop: spacing.sm }]}>
              {t("alert_pick_screenshot_hint")}
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
                <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>{t("alert_extracted_label")}</Text>
                <Text style={[typography.body, { color: colors.text }]}>{extractedText}</Text>
              </View>
              <Pressable onPress={onPickScreenshot} style={{ marginTop: spacing.sm, alignItems: "center" }}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>{t("alert_pick_another")}</Text>
              </Pressable>
            </>
          )}
        </Card>
      )}

      <TextField label={t("alert_note_label")} value={note} onChangeText={setNote} />
      {error ? <Text style={{ color: colors.warning, marginBottom: 8 }}>{error}</Text> : null}
      <Button label={t("alert_send")} onPress={onSend} loading={loading} disabled={text.trim().length < 5 || scanning} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", borderRadius: 999, borderWidth: 1, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center" },
});
