import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme";

const FACES = ["😟", "🙁", "😐", "🙂", "😄"];

export function ConfidenceScale({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {FACES.map((face, i) => {
        const level = i + 1;
        const active = value === level;
        return (
          <Pressable
            key={level}
            onPress={() => onChange(level)}
            style={[
              styles.face,
              { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.surfaceAlt : "transparent" },
            ]}
          >
            <Text style={{ fontSize: 30 }}>{face}</Text>
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
