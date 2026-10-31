import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { resendOtp, verifyOtp } from "../../src/api";
import { Button } from "../../src/components/Button";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { TextField } from "../../src/components/TextField";
import { useAuth } from "../../src/hooks/useAuth";
import { useI18n } from "../../src/i18n";
import { spacing, typography, useTheme } from "../../src/theme";

export default function Otp() {
  const { country_code, phone, dev_otp } = useLocalSearchParams<{ country_code: string; phone: string; dev_otp?: string }>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { setSession } = useAuth();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [devOtp, setDevOtp] = useState(dev_otp || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await verifyOtp({ country_code, phone, code });
      await setSession(res.token, res.user);
      if (res.user.role === "helper") {
        router.replace("/(helper)/dashboard");
      } else {
        router.replace("/(auth)/pair-join");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError("");
    try {
      const res = await resendOtp({ country_code, phone });
      setDevOtp(res.dev_otp || "");
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader title={t("enter_otp_title")} />
      <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.lg }]}>{t("enter_otp_subtitle")}</Text>

      {devOtp ? (
        <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: 16, padding: spacing.md, marginBottom: spacing.lg }}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>{t("demo_otp_notice")}</Text>
          <Text style={[typography.title, { color: colors.primary, letterSpacing: 6, marginTop: 6 }]}>{devOtp}</Text>
        </View>
      ) : null}

      <TextField
        value={code}
        onChangeText={setCode}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        style={{ textAlign: "center", letterSpacing: 8, fontSize: 24 }}
      />

      {error ? <Text style={{ color: colors.warning, marginBottom: spacing.sm }}>{error}</Text> : null}

      <Button label={t("verify")} onPress={onVerify} loading={loading} disabled={code.length < 6} />
      <Button label={t("resend_code")} variant="outline" onPress={onResend} />
    </ScreenContainer>
  );
}
