/**
 * One themed icon component for the whole app, backed by @expo/vector-icons (ships
 * with Expo Go, no native build needed). Replaces raw emoji glyphs — which render as
 * whatever colorful system font the OS ships — with line icons that pick up the app's
 * own purple theme color and scale cleanly at any size.
 */
import React from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];
type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

type Props = { size?: number; color?: string };

function themed(Component: typeof Ionicons | typeof MaterialCommunityIcons, name: string) {
  return function ThemedIcon({ size = 20, color }: Props) {
    const { colors } = useTheme();
    return <Component name={name as any} size={size} color={color ?? colors.text} />;
  };
}

export const Icon = {
  shield: themed(Ionicons, "shield-checkmark" satisfies IoniconName),
  learner: themed(Ionicons, "school" satisfies IoniconName),
  helper: themed(MaterialCommunityIcons, "handshake-outline" satisfies MCIName),
  family: themed(Ionicons, "people" satisfies IoniconName),
  sparkles: themed(Ionicons, "sparkles" satisfies IoniconName),
  search: themed(Ionicons, "search" satisfies IoniconName),
  trending: themed(Ionicons, "trending-up" satisfies IoniconName),
  sms: themed(Ionicons, "chatbubble-ellipses" satisfies IoniconName),
  whatsapp: themed(MaterialCommunityIcons, "whatsapp" satisfies MCIName),
  call: themed(Ionicons, "call" satisfies IoniconName),
  arrowForward: themed(Ionicons, "arrow-forward" satisfies IoniconName),
  back: themed(Ionicons, "arrow-back" satisfies IoniconName),
  close: themed(Ionicons, "close" satisfies IoniconName),
  help: themed(Ionicons, "help-circle" satisfies IoniconName),
  moon: themed(Ionicons, "moon" satisfies IoniconName),
  sunny: themed(Ionicons, "sunny" satisfies IoniconName),
  volumeHigh: themed(Ionicons, "volume-high" satisfies IoniconName),
  stopCircle: themed(Ionicons, "stop-circle" satisfies IoniconName),
  leaf: themed(Ionicons, "leaf" satisfies IoniconName),
  heart: themed(Ionicons, "heart" satisfies IoniconName),
  checkmarkCircle: themed(Ionicons, "checkmark-circle" satisfies IoniconName),
  checkmark: themed(Ionicons, "checkmark" satisfies IoniconName),
  warning: themed(Ionicons, "warning" satisfies IoniconName),
  trophy: themed(Ionicons, "trophy" satisfies IoniconName),
  flag: themed(Ionicons, "flag" satisfies IoniconName),
  bulb: themed(Ionicons, "bulb" satisfies IoniconName),
  thinking: themed(Ionicons, "help-circle-outline" satisfies IoniconName),
  ribbon: themed(Ionicons, "ribbon" satisfies IoniconName),
  mic: themed(Ionicons, "mic" satisfies IoniconName),
  recordDot: themed(Ionicons, "radio-button-on" satisfies IoniconName),
  playCircle: themed(Ionicons, "play-circle" satisfies IoniconName),
  mail: themed(Ionicons, "paper-plane" satisfies IoniconName),
  camera: themed(Ionicons, "camera" satisfies IoniconName),
  pencil: themed(Ionicons, "pencil" satisfies IoniconName),
  translate: themed(Ionicons, "language" satisfies IoniconName),
  bank: themed(MaterialCommunityIcons, "bank" satisfies MCIName),
  wallet: themed(Ionicons, "wallet" satisfies IoniconName),
  idCard: themed(MaterialCommunityIcons, "card-account-details-outline" satisfies MCIName),
  lockClosed: themed(Ionicons, "lock-closed" satisfies IoniconName),
  listNumbers: themed(MaterialCommunityIcons, "format-list-numbered" satisfies MCIName),
  globe: themed(Ionicons, "globe-outline" satisfies IoniconName),
  link: themed(Ionicons, "link" satisfies IoniconName),
  // Confidence scale, 1 → 5 (facial-expression line icons instead of emoji faces)
  face1: themed(MaterialCommunityIcons, "emoticon-sad-outline" satisfies MCIName),
  face2: themed(MaterialCommunityIcons, "emoticon-confused-outline" satisfies MCIName),
  face3: themed(MaterialCommunityIcons, "emoticon-neutral-outline" satisfies MCIName),
  face4: themed(MaterialCommunityIcons, "emoticon-happy-outline" satisfies MCIName),
  face5: themed(MaterialCommunityIcons, "emoticon-excited-outline" satisfies MCIName),
};
