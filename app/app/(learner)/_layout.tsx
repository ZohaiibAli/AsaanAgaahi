import React from "react";
import { Stack } from "expo-router";
import { NudgeBanner } from "../../src/components/NudgeBanner";
import { LearnerRealtimeProvider } from "../../src/hooks/useLearnerRealtime";

export default function LearnerLayout() {
  return (
    <LearnerRealtimeProvider>
      <NudgeBanner />
      <Stack screenOptions={{ headerShown: false }} />
    </LearnerRealtimeProvider>
  );
}
