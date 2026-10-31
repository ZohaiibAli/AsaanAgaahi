import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "../src/hooks/useAuth";
import { useI18n } from "../src/i18n";
import { typography, useTheme } from "../src/theme";

export default function Index() {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/(auth)/welcome");
    } else if (user.role === "helper") {
      router.replace("/(helper)/dashboard");
    } else if (!user.family_code) {
      router.replace("/(auth)/pair-join");
    } else {
      router.replace("/(learner)/home");
    }
  }, [ready, user]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, gap: 16 }}>
      <Text style={[typography.title, { color: colors.primary }]}>{t("app_name")}</Text>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
