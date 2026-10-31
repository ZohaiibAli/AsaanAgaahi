import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { Pressable, ScrollView, Text, View } from "react-native";
import { listScenarios, pairCreate, Scenario, uploadVoice } from "../../src/api";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { pickLang, useI18n } from "../../src/i18n";
import { spacing, typography, useTheme } from "../../src/theme";

export default function VoiceHint() {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const router = useRouter();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const player = useAudioPlayer(recordedUri);

  const [code, setCode] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioId, setScenarioId] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    pairCreate().then((r) => setCode(r.code));
    listScenarios().then(setScenarios);
    AudioModule.requestRecordingPermissionsAsync();
    setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
  }, []);

  const onRecord = async () => {
    setDone(false);
    setRecordedUri(null);
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const onStop = async () => {
    await recorder.stop();
    setRecordedUri(recorder.uri);
  };

  const onUpload = async () => {
    if (!code || !recordedUri) return;
    setUploading(true);
    try {
      await uploadVoice(code, recordedUri, scenarioId);
      setDone(true);
      setRecordedUri(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader title={t("voice_title")} />

      <Card>
        <Text style={[typography.bodyBold, { color: colors.text, marginBottom: spacing.sm }]}>{t("assign_scenario")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => setScenarioId(undefined)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: !scenarioId ? colors.primary : colors.surfaceAlt,
              }}
            >
              <Text style={{ color: !scenarioId ? colors.onPrimary : colors.text }}>General</Text>
            </Pressable>
            {scenarios.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setScenarioId(s.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: scenarioId === s.id ? colors.primary : colors.surfaceAlt,
                }}
              >
                <Text style={{ color: scenarioId === s.id ? colors.onPrimary : colors.text }}>{pickLang(s.title, lang)}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </Card>

      <View style={{ alignItems: "center", marginVertical: spacing.xl }}>
        <Text style={{ fontSize: 64 }}>{recorderState.isRecording ? "🔴" : "🎙️"}</Text>
        {!recorderState.isRecording ? (
          <Button label={t("record")} onPress={onRecord} />
        ) : (
          <Button label={t("stop")} variant="secondary" onPress={onStop} />
        )}
      </View>

      {recordedUri && (
        <Card style={{ alignItems: "center" }}>
          <Button label={`▶️ ${t("play")}`} variant="outline" onPress={() => player.play()} />
          <Button label={t("upload")} onPress={onUpload} loading={uploading} />
        </Card>
      )}

      {done && (
        <Card style={{ borderColor: colors.success, borderWidth: 2 }}>
          <Text style={{ color: colors.success, fontWeight: "700" }}>✅ {t("upload")}</Text>
        </Card>
      )}

      <Button label={t("back")} variant="outline" onPress={() => router.back()} />
    </ScreenContainer>
  );
}
