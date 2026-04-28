import { StyleProp, TouchableOpacity, View, ViewStyle } from "react-native";
import { CERDIK_COLORS } from "@/constants/colors";

type CerdikCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export default function CerdikCard({ children, style, onPress }: CerdikCardProps) {
  const baseStyle: StyleProp<ViewStyle> = {
    borderRadius: 16,
    backgroundColor: CERDIK_COLORS.card,
    padding: 16,
  };
  const shadowStyle: StyleProp<ViewStyle> = {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[baseStyle, shadowStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[baseStyle, shadowStyle, style]}>
      {children}
    </View>
  );
}
