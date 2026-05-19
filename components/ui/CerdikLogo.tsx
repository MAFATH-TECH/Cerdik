import { Image, StyleProp, View, ViewStyle } from "react-native";

const LOGO_SOURCE = require("@/assets/cerdik.jpeg");

type CerdikLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export default function CerdikLogo({ size = 72, style }: CerdikLogoProps) {
  return (
    <View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, style]}>
      <Image source={LOGO_SOURCE} style={{ width: size, height: size }} resizeMode="contain" accessibilityLabel="Logo CERDIK" />
    </View>
  );
}
