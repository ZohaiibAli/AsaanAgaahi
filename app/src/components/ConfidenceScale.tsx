import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../theme";
import { Icon } from "./Icon";

const FACES = [Icon.face1, Icon.face2, Icon.face3, Icon.face4, Icon.face5];

export function ConfidenceScale({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {FACES.map((Face, i) => {
        const level = i + 1;
        const active = value === level;
        return (
          <Pressable
            key={level}
            onPress={() => onChange(level)}
            accessibilityRole="radio"
            accessibilityLabel={`${level} / 5`}
            accessibilityState={{ selected: active }}
            style={[
              styles.face,
              { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.surfaceAlt : "transparent" },
            ]}
          >
            <Face size={28} color={active ? colors.primary : colors.textMuted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between" },
  face: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: "center", justifyContent: "center" },
});
