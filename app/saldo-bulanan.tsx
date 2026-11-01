import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";

import CerdikCard from "@/components/ui/CerdikCard";
import { ScreenEmpty, ScreenError } from "@/components/ui/ScreenState";
import { CERDIK_COLORS } from "@/constants/colors";
import { transactionService, type MonthlyBalance } from "@/services/transactionService";

const formatRupiah = (amount: number) =>
  `${amount < 0 ? "-" : ""}Rp ${new Intl.NumberFormat("id-ID").format(Math.abs(amount))}`;

const formatMonth = (year: number, month: number) =>
  new Date(year, month - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

function Row({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 }}>
      <Text style={{ color: CERDIK_COLORS.textSecondary, fontSize: 13 }}>{label}</Text>
      <Text
        style={{
          color: color ?? CERDIK_COLORS.textPrimary,
          fontSize: bold ? 15 : 13,
          fontWeight: bold ? "700" : "600",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function SaldoBulananScreen() {
  const [list, setList] = useState<MonthlyBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setList(await transactionService.getMonthlyBalances());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat riwayat saldo.");
      setList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [load]),
  );

  if (error) {
    return <ScreenError description={error} onRetry={() => load().catch(() => undefined)} />;
  }

  if (!isLoading && list.length === 0) {
    return (
      <ScreenEmpty
        emoji="🗓️"
        title="Belum ada transaksi"
        description="Sisa saldo tiap bulan akan muncul di sini setelah kamu mencatat transaksi."
      />
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: CERDIK_COLORS.background }}
      data={isLoading && !refreshing ? [] : list}
      keyExtractor={(item) => `${item.year}-${item.month}`}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ padding: 20, paddingBottom: 80, gap: 12, flexGrow: 1 }}
      ListHeaderComponent={
        isLoading && !refreshing ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ height: 140, borderRadius: 16, backgroundColor: "#EEF2F7" }} />
            ))}
          </View>
        ) : undefined
      }
      renderItem={({ item, index }) => (
        <CerdikCard>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <Text style={{ color: CERDIK_COLORS.textPrimary, fontSize: 16, fontWeight: "700" }}>
              {formatMonth(item.year, item.month)}
            </Text>
            {index === 0 ? (
              <Text style={{ color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>Bulan ini (sementara)</Text>
            ) : null}
          </View>
          <Row label="Saldo awal" value={formatRupiah(item.opening)} />
          <Row label="Pemasukan" value={`+${formatRupiah(item.income)}`} color={CERDIK_COLORS.income} />
          <Row label="Pengeluaran" value={`-${formatRupiah(item.expense)}`} color={CERDIK_COLORS.danger} />
          <View style={{ height: 1, backgroundColor: CERDIK_COLORS.border, marginVertical: 6 }} />
          <Row
            label={index === 0 ? "Saldo saat ini" : "Sisa akhir bulan"}
            value={formatRupiah(item.closing)}
            color={item.closing < 0 ? CERDIK_COLORS.danger : CERDIK_COLORS.textPrimary}
            bold
          />
        </CerdikCard>
      )}
    />
  );
}
