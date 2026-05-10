import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";

import { CERDIK_COLORS } from "@/constants/colors";

type SummaryCardProps = {
  title: string;
  amountValue: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  /** Jika false, baris tren disembunyikan (mis. Beranda pakai ringkasan bulan terpisah). */
  showTrend?: boolean;
  trend?: string;
  /** true = hijau & panah naik (baik untuk kartu ini); false = merah & panah turun */
  trendUp?: boolean;
  /** Bulan lalu tidak ada data pembanding — tampil "—" netral */
  trendNeutral?: boolean;
  trendIsNewData?: boolean;
};

const rupiahFormatter = new Intl.NumberFormat("id-ID");
const formatRupiah = (amount: number) => `Rp ${rupiahFormatter.format(Math.round(amount))}`;

export default function SummaryCard({
  title,
  amountValue,
  icon,
  color,
  showTrend = true,
  trend = "",
  trendUp,
  trendNeutral,
  trendIsNewData,
}: SummaryCardProps) {
  const neutralRow =
    trendNeutral === true || trend.trim() === "—" || trendIsNewData === true || trend.trim() === "Data baru";
  const up = trendUp ?? trend.trim().startsWith("+");
  const trendColor = neutralRow ? CERDIK_COLORS.textSecondary : up ? "#16A34A" : "#EF4444";
  const trendIcon: keyof typeof Ionicons.glyphMap = neutralRow
    ? "analytics-outline"
    : up
      ? "trending-up"
      : "trending-down";

  const animated = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animated.setValue(0);
    const anim = Animated.timing(animated, {
      toValue: 1,
      duration: 700,
      useNativeDriver: false,
    });
    anim.start();
    const id = animated.addListener(({ value }) => {
      setDisplayValue(value * amountValue);
    });
    return () => {
      animated.removeListener(id);
      anim.stop();
    };
  }, [amountValue, animated]);

  const formatted = useMemo(() => formatRupiah(displayValue), [displayValue]);

  return (
    <View
      style={{
        borderRadius: 16,
        backgroundColor: CERDIK_COLORS.card,
        padding: 14,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View style={{ marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 12, color: CERDIK_COLORS.textSecondary, fontWeight: "700" }}>{title}</Text>
        <View style={{ borderRadius: 12, padding: 8, backgroundColor: `${color}20` }}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
      </View>

      <Text style={{ fontSize: 18, fontWeight: "900", color: CERDIK_COLORS.textPrimary }}>{formatted}</Text>

      {showTrend ? (
        <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}>
          <Ionicons name={trendIcon} size={14} color={trendColor} />
          <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: "800", color: trendColor }}>
            {trend}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
