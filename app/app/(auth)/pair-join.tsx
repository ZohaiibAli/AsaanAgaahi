import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { pairJoin } from "../../src/api";
import { Button } from "../../src/components/Button";
import { Icon } from "../../src/components/Icon";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { TextField } from "../../src/components/TextField";
import { useAuth } from "../../src/hooks/useAuth";
import { useI18n } from "../../src/i18n";
import { spacing, typography, useTheme } from "../../src/theme";

export default function PairJoin() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { user, setUser, logout } = useAuth();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onJoin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await pairJoin(code.trim().toUpperCase());
      if (user) setUser({ ...user, family_code: res.code });
      router.replace("/(learner)/home");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={{ alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.xl }}>
        <Icon.family size={48} color={colors.primary} />
        <Text style={[typography.title, { color: colors.primary, textAlign: "center", marginTop: spacing.md }]}>
          {t("pairing_join_title")}
        </Text>
        <Text style={[typography.body, { color: colors.textMuted, textAlign: "center", marginTop: spacing.sm }]}>
          {t("pairing_join_subtitle")}
        </Text>
      </View>

      <TextField
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase())}
        placeholder="ABC123"
        autoCapitalize="characters"
        maxLength={6}
        style={{ textAlign: "center", letterSpacing: 8, fontSize: 26 }}
      />

      {error ? <Text style={{ color: colors.warning, marginBottom: spacing.sm }}>{error}</Text> : null}

      <Button label={t("join")} onPress={onJoin} loading={loading} disabled={code.length < 6} />
      <Button label={t("logout")} variant="outline" onPress={() => logout().then(() => router.replace("/(auth)/welcome"))} />
    </ScreenContainer>
  );
}
