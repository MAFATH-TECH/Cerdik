import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import { CERDIK_COLORS } from "@/constants/colors";

type CerdikInputProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: TextInputProps["keyboardType"];
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  returnKeyType?: TextInputProps["returnKeyType"];
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
  autoComplete,
  textContentType,
  autoCapitalize = "sentences",
  returnKeyType = "done",
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
          backgroundColor: CERDIK_COLORS.card,
          paddingHorizontal: 16,
          borderColor: error ? CERDIK_COLORS.danger : CERDIK_COLORS.border,
        }}
      >
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          textContentType={textContentType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          returnKeyType={returnKeyType}
          accessible
          accessibilityLabel={label}
          secureTextEntry={secureTextEntry}
          style={{ flex: 1, paddingVertical: 12, fontSize: 16, color: CERDIK_COLORS.textPrimary }}
          placeholderTextColor={CERDIK_COLORS.placeholder}
        />
        {rightIcon ? (
          <Pressable onPress={onRightIconPress} hitSlop={8}>
            {rightIcon}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={{ marginTop: 4, fontSize: 12, color: CERDIK_COLORS.danger }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
