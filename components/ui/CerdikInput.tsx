import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import { CERDIK_COLORS } from "@/constants/colors";

type CerdikInputProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: TextInputProps["keyboardType"];
  error?: string;
  secureTextEntry?: boolean;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
};

export default function CerdikInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  error,
  secureTextEntry = false,
  rightIcon,
  onRightIconPress,
}: CerdikInputProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "600", color: CERDIK_COLORS.textPrimary }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 16,
          borderWidth: 1,
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 16,
          borderColor: error ? CERDIK_COLORS.accent : "#E2E8F0",
        }}
      >
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          style={{ flex: 1, paddingVertical: 12, fontSize: 16, color: CERDIK_COLORS.textPrimary }}
          placeholderTextColor="#94A3B8"
        />
        {rightIcon ? (
          <Pressable onPress={onRightIconPress} hitSlop={8}>
            {rightIcon}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={{ marginTop: 4, fontSize: 12, color: CERDIK_COLORS.accent }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
