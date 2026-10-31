import React from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { Icon } from "../../src/components/Icon";
import { LanguageToggle } from "../../src/components/LanguageToggle";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ThemeToggle } from "../../src/components/ThemeToggle";
import { useI18n } from "../../src/i18n";
import { spacing, typography, useTheme } from "../../src/theme";

export default function Welcome() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();

  return (
    <ScreenContainer>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: spacing.md }}>
        <ThemeToggle />
      </View>

      <View style={{ alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.xl }}>
        <Icon.shield size={56} color={colors.primary} />
        <Text style={[typography.title, { color: colors.primary, textAlign: "center", marginTop: spacing.md }]}>
          {t("welcome_title")}
        </Text>
        <Text style={[typography.body, { color: colors.textMuted, textAlign: "center", marginTop: spacing.sm }]}>
          {t("welcome_subtitle")}
        </Text>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <LanguageToggle />
      </View>

      <Button
        label={t("im_learning")}
        icon={<Icon.learner size={20} color={colors.onPrimary} />}
        onPress={() => router.push({ pathname: "/(auth)/register", params: { role: "learner" } })}
      />
      <Button
        label={t("im_helping")}
        icon={<Icon.helper size={20} color={colors.primary} />}
        variant="secondary"
        onPress={() => router.push({ pathname: "/(auth)/register", params: { role: "helper" } })}
      />

      <View style={{ marginTop: spacing.lg, alignItems: "center" }}>
        <Button label={t("already_have_account")} variant="outline" onPress={() => router.push("/(auth)/login")} />
      </View>
    </ScreenContainer>
  );
}
