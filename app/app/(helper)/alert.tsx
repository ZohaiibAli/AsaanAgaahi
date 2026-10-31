import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { createAlert } from "../../src/api";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { TextField } from "../../src/components/TextField";
import { useI18n } from "../../src/i18n";
import { scanScreenshotText } from "../../src/ocrSim";
import { spacing, typography, useTheme } from "../../src/theme";

export default function Alert() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();

  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

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
    setScanning(true);
    try {
      const extracted = await scanScreenshotText();
      setText(extracted);
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
          <Text style={{ fontSize: 48 }}>📨</Text>
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

      <Button label={t("alert_pick_screenshot")} variant="secondary" onPress={onPickScreenshot} disabled={scanning} />

      {screenshotUri && (
        <Card>
          <Image source={{ uri: screenshotUri }} style={{ width: "100%", height: 160, borderRadius: 16 }} resizeMode="cover" />
          {scanning ? (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.sm }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[typography.caption, { color: colors.textMuted, marginLeft: spacing.sm }]}>
                {t("scanning_screenshot")}
              </Text>
            </View>
          ) : (
            <Text style={[typography.caption, { color: colors.success, marginTop: spacing.sm }]}>✓ {t("scan_done")}</Text>
          )}
        </Card>
      )}

      <Text style={[typography.caption, { color: colors.textMuted, textAlign: "center", marginVertical: spacing.sm }]}>
        {t("alert_or_screenshot")}
      </Text>

      <TextField
        label={t("alert_text_label")}
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={5}
        style={{ minHeight: 120, textAlignVertical: "top" }}
      />
      <TextField label={t("alert_note_label")} value={note} onChangeText={setNote} />
      {error ? <Text style={{ color: colors.warning, marginBottom: 8 }}>{error}</Text> : null}
      <Button label={t("alert_send")} onPress={onSend} loading={loading} disabled={text.trim().length < 5 || scanning} />
    </ScreenContainer>
  );
}
