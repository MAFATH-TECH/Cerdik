import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { CERDIK_COLORS } from "@/constants/colors";

type ButtonVariant = "primary" | "secondary" | "danger";

type CerdikButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
};

const buttonStyles: Record<ButtonVariant, { backgroundColor: string; borderWidth?: number; borderColor?: string; textColor: string }> = {
  primary: {
    backgroundColor: CERDIK_COLORS.primary,
    textColor: "#FFFFFF",
  },
  secondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: CERDIK_COLORS.primary,
    textColor: CERDIK_COLORS.primary,
  },
  danger: {
    backgroundColor: CERDIK_COLORS.danger,
    textColor: "#FFFFFF",
  },
};

export default function CerdikButton({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
}: CerdikButtonProps) {
  const currentStyle = buttonStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={isDisabled}
      onPress={onPress}
      style={{
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
        paddingHorizontal: 16,
        backgroundColor: currentStyle.backgroundColor,
        borderWidth: currentStyle.borderWidth,
        borderColor: currentStyle.borderColor,
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? CERDIK_COLORS.primary : "#FFFFFF"} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
          <Text style={{ fontSize: 16, fontWeight: "600", color: currentStyle.textColor }}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
