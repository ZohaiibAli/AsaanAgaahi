import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Icon } from "../../src/components/Icon";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { pickLang, useI18n } from "../../src/i18n";
import { PortalScanResult, scanPortalScreen } from "../../src/portalScanSim";
import { spacing, typography, useTheme } from "../../src/theme";

const CATEGORY_ICON: Record<PortalScanResult["category"], keyof typeof Icon> = {
  bank_transfer: "bank",
  mobile_wallet: "wallet",
  gov_portal: "idCard",
};

export default function Translate() {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const router = useRouter();

  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<PortalScanResult | null>(null);
  const [error, setError] = useState("");

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
    setResult(null);
    setScanning(true);
    try {
      setResult(await scanPortalScreen());
    } finally {
      setScanning(false);
    }
  };

  const CategoryIcon = result ? Icon[CATEGORY_ICON[result.category]] : null;

  return (
    <ScreenContainer>
      <ScreenHeader title={t("translate_title")} />

      {!screenshotUri ? (
        <>
          <Card style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
            <Icon.translate size={22} color={colors.primary} />
            <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{t("translate_intro")}</Text>
          </Card>

          <Pressable onPress={onPickScreenshot}>
            <Card style={{ alignItems: "center", paddingVertical: spacing.xl, borderStyle: "dashed", borderWidth: 2, borderColor: colors.primary }}>
              <Icon.camera size={40} color={colors.primary} />
              <Text style={[typography.bodyBold, { color: colors.primary, marginTop: spacing.sm }]}>{t("pick_screenshot")}</Text>
              <Text style={[typography.caption, { color: colors.textMuted, textAlign: "center", marginTop: spacing.sm }]}>
                {t("translate_pick_screenshot_hint")}
              </Text>
            </Card>
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: spacing.sm }}>
            <Icon.lockClosed size={16} color={colors.textMuted} />
            <Text style={[typography.caption, { color: colors.textMuted, flex: 1 }]}>{t("translate_privacy_note")}</Text>
          </View>

          {error ? <Text style={{ color: colors.warning, marginTop: spacing.sm }}>{error}</Text> : null}
        </>
      ) : (
        <>
          <Card>
            <Image source={{ uri: screenshotUri }} style={{ width: "100%", height: 180, borderRadius: 16 }} resizeMode="cover" />
            {scanning ? (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[typography.body, { color: colors.textMuted, marginLeft: spacing.sm }]}>{t("scanning_screenshot")}</Text>
              </View>
            ) : (
              <Pressable onPress={onPickScreenshot} style={{ marginTop: spacing.sm, alignItems: "center" }}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>{t("pick_another")}</Text>
              </Pressable>
            )}
          </Card>

          {result && CategoryIcon && (
            <>
              <Card style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" }}
                >
                  <CategoryIcon size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>{t("translate_category_label")}</Text>
                  <Text style={[typography.bodyBold, { color: colors.text }]}>{pickLang(result.categoryLabel, lang)}</Text>
                </View>
              </Card>

              <Card style={{ backgroundColor: colors.surfaceAlt }}>
                <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>{t("translate_summary_label")}</Text>
                <Text style={[typography.body, { color: colors.text }]}>{pickLang(result.screenSummary, lang)}</Text>
              </Card>

              <Text style={[typography.heading, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
                {t("translate_jargon_heading")}
              </Text>
              <Card>
                {result.jargon.map((j, i) => (
                  <View key={i} style={{ marginBottom: i === result.jargon.length - 1 ? 0 : spacing.sm }}>
                    <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>{j.term}</Text>
                    <Text style={[typography.body, { color: colors.text }]}>{pickLang(j.simple, lang)}</Text>
                  </View>
                ))}
              </Card>

              <Text style={[typography.heading, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
                {t("translate_steps_heading")}
              </Text>
              <Card>
                {result.steps.map((s, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: i === result.steps.length - 1 ? 0 : spacing.sm }}>
                    <Text style={[typography.bodyBold, { color: colors.primary }]}>{i + 1}.</Text>
                    <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{pickLang(s, lang)}</Text>
                  </View>
                ))}
              </Card>

              <Text style={[typography.heading, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
                {t("translate_security_heading")}
              </Text>
              <Card>
                {result.securityTips.map((s, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: i === result.securityTips.length - 1 ? 0 : spacing.sm }}>
                    <Icon.shield size={16} color={colors.success} />
                    <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{pickLang(s, lang)}</Text>
                  </View>
                ))}
              </Card>
            </>
          )}
        </>
      )}

      <Button label={t("back")} variant="outline" onPress={() => router.back()} />
    </ScreenContainer>
  );
}
