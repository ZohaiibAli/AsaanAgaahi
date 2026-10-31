import React, { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { COUNTRIES, Country } from "../countryCodes";
import { spacing, touchTarget, typography, useTheme } from "../theme";

type Props = {
  countryCode: string;
  onCountryChange: (dial: string) => void;
  phone: string;
  onPhoneChange: (digits: string) => void;
};

export function PhoneInput({ countryCode, onCountryChange, phone, onPhoneChange }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = COUNTRIES.find((c) => c.dial === countryCode) ?? COUNTRIES[0];

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.countryButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
      >
        <Text style={typography.body}>
          {selected.flag} {selected.dial}
        </Text>
      </Pressable>

      <TextInput
        value={phone}
        onChangeText={(v) => onPhoneChange(v.replace(/[^0-9]/g, ""))}
        placeholder="300 1234567"
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        style={[
          styles.phoneField,
          typography.body,
          { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text },
        ]}
      />

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.name}
              renderItem={({ item }: { item: Country }) => (
                <Pressable
                  onPress={() => {
                    onCountryChange(item.dial);
                    setOpen(false);
                  }}
                  style={[styles.countryRow, { borderBottomColor: colors.border }]}
                >
                  <Text style={typography.body}>
                    {item.flag}  {item.name} ({item.dial})
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm },
  countryButton: {
    minHeight: touchTarget.minHeight,
    borderRadius: touchTarget.borderRadius,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneField: {
    flex: 1,
    minHeight: touchTarget.minHeight,
    borderRadius: touchTarget.borderRadius,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  backdrop: { flex: 1, backgroundColor: "rgba(20,15,31,0.5)", justifyContent: "flex-end" },
  sheet: { maxHeight: "70%", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.md },
  countryRow: { paddingVertical: 14, borderBottomWidth: 1 },
});
