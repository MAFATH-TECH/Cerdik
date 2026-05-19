import { Pressable, ScrollView, Text, View } from "react-native";

import { getChipLabel, type FilterChipItem } from "@/constants/edukasiPengetahuan";
import { EDUKASI_COLORS } from "@/constants/edukasiTheme";

type CategoryFilterChipsProps = {
  items: FilterChipItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  contentPaddingHorizontal?: number;
};

export default function CategoryFilterChips({
  items,
  activeKey,
  onSelect,
  contentPaddingHorizontal = 12,
}: CategoryFilterChipsProps) {
  const validItems = items.filter((item) => {
    const label = getChipLabel(item);
    return label !== "Kategori" && item.key?.trim().length > 0;
  });

  if (validItems.length === 0) {
    return null;
  }

  return (
    <View style={{ backgroundColor: EDUKASI_COLORS.bodyBg }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: contentPaddingHorizontal,
          paddingVertical: 12,
        }}
      >
        {validItems.map((item, index) => {
          const active = item.key === activeKey;
          const label = getChipLabel(item);
          const isLast = index === validItems.length - 1;

          return (
            <Pressable
              key={item.key}
              onPress={() => onSelect(item.key)}
              style={{
                flexShrink: 0,
                marginRight: isLast ? 0 : 8,
                paddingHorizontal: 14,
                paddingVertical: 8,
                minHeight: 36,
                justifyContent: "center",
                borderRadius: 999,
                backgroundColor: active ? EDUKASI_COLORS.primary : EDUKASI_COLORS.cardBg,
                borderWidth: active ? 0 : 1,
                borderColor: EDUKASI_COLORS.secondary,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: active ? "#FFFFFF" : EDUKASI_COLORS.primary,
                  includeFontPadding: false,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
