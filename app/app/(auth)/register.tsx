import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { register, Role } from "../../src/api";
import { Button } from "../../src/components/Button";
import { PhoneInput } from "../../src/components/PhoneInput";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { TextField } from "../../src/components/TextField";
import { useI18n } from "../../src/i18n";
import { spacing, typography, useTheme } from "../../src/theme";

export default function Register() {
  const { role } = useLocalSearchParams<{ role: Role }>();
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const router = useRouter();

  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+92");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roleLabel = role === "helper" ? t("im_helping") : t("im_learning");

  const onSubmit = async () => {
    setError("");
    if (!name.trim() || phone.length < 6 || password.length < 4) {
      setError(lang === "en" ? "Please fill every field correctly." : "Tamam fields theek se bharein.");
      return;
    }
    setLoading(true);
    try {
      const res = await register({ name, country_code: countryCode, phone, password, role: (role as Role) ?? "learner", language: lang });
      router.push({ pathname: "/(auth)/otp", params: { country_code: countryCode, phone, dev_otp: res.dev_otp ?? "" } });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader title={t("register")} />
      <Text style={[typography.bodyBold, { color: colors.primary, marginBottom: spacing.md }]}>{roleLabel}</Text>

      <TextField label={t("name")} value={name} onChangeText={setName} placeholder={t("name")} />

      <Text style={[typography.bodyBold, { color: colors.text, marginBottom: 6 }]}>{t("phone_number")}</Text>
      <View style={{ marginBottom: spacing.md }}>
        <PhoneInput countryCode={countryCode} onCountryChange={setCountryCode} phone={phone} onPhoneChange={setPhone} />
      </View>

      <TextField label={t("password")} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

      {error ? <Text style={{ color: colors.warning, marginBottom: spacing.sm }}>{error}</Text> : null}

      <Button label={t("register")} onPress={onSubmit} loading={loading} />
      <Button label={t("already_have_account")} variant="outline" onPress={() => router.push("/(auth)/login")} />
    </ScreenContainer>
  );
}
