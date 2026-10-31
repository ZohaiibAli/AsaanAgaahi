import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Text } from "react-native";
import { createAlert } from "../../src/api";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { TextField } from "../../src/components/TextField";
import { useI18n } from "../../src/i18n";
import { typography, useTheme } from "../../src/theme";

export default function Alert() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();

  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

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
      <Button label={t("alert_send")} onPress={onSend} loading={loading} disabled={text.trim().length < 5} />
    </ScreenContainer>
  );
}
