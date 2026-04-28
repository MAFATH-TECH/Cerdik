import { Text, TextInput, View } from "react-native";
import { CERDIK_COLORS } from "@/constants/colors";

type CurrencyInputProps = {
  label: string;
  value: string;
  onChange: (rawValue: string) => void;
};

const formatRupiah = (rawValue: string) => {
  if (!rawValue) return "";
  const numberValue = Number(rawValue);
  if (Number.isNaN(numberValue)) return "";
  return `Rp ${numberValue.toLocaleString("id-ID")}`;
};

export default function CurrencyInput({ label, value, onChange }: CurrencyInputProps) {
  const displayedValue = formatRupiah(value);

  return (
    <View style={{ marginBottom: 16 }}>
      {label ? (
        <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "600", color: CERDIK_COLORS.textPrimary }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        value={displayedValue}
        onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
        keyboardType="numeric"
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontSize: 16,
          color: CERDIK_COLORS.textPrimary,
        }}
        placeholder="Rp 0"
        placeholderTextColor="#94A3B8"
      />
    </View>
  );
}
