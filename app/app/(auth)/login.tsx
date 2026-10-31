import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { login } from "../../src/api";
import { Button } from "../../src/components/Button";
import { PhoneInput } from "../../src/components/PhoneInput";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { TextField } from "../../src/components/TextField";
import { useAuth } from "../../src/hooks/useAuth";
import { useI18n } from "../../src/i18n";
import { spacing, typography, useTheme } from "../../src/theme";

export default function Login() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { setSession } = useAuth();
  const router = useRouter();

  const [countryCode, setCountryCode] = useState("+92");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await login({ country_code: countryCode, phone, password });
      await setSession(res.token, res.user);
      if (res.user.role === "helper") {
        router.replace("/(helper)/dashboard");
      } else if (!res.user.family_code) {
        router.replace("/(auth)/pair-join");
      } else {
        router.replace("/(learner)/home");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader title={t("login")} />

      <Text style={[typography.bodyBold, { color: colors.text, marginBottom: 6 }]}>{t("phone_number")}</Text>
      <View style={{ marginBottom: spacing.md }}>
        <PhoneInput countryCode={countryCode} onCountryChange={setCountryCode} phone={phone} onPhoneChange={setPhone} />
      </View>

      <TextField label={t("password")} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

      {error ? <Text style={{ color: colors.warning, marginBottom: spacing.sm }}>{error}</Text> : null}

      <Button label={t("login")} onPress={onSubmit} loading={loading} />
      <Button label={t("need_account")} variant="outline" onPress={() => router.push("/(auth)/welcome")} />
    </ScreenContainer>
  );
}
