import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";

import { ScreenEmpty, ScreenError } from "@/components/ui/ScreenState";
import { CERDIK_COLORS } from "@/constants/colors";
import { transactionService, type Transaction } from "@/services/transactionService";

const formatRupiah = (amount: number) => `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const mapCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
  if (category === "Transportasi") return "car-outline";
  if (category === "Makan") return "restaurant-outline";
  if (category === "Tabungan") return "wallet-outline";
  if (category === "Beasiswa") return "school-outline";
  if (category === "Uang Saku") return "cash-outline";
  if (category === "Hadiah") return "gift-outline";
  return "ellipsis-horizontal-circle-outline";
};

export default function TransactionsScreen() {
  const [list, setList] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await transactionService.getTransactions();
      setList(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat semua transaksi.");
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
        emoji="🧾"
        title="Belum ada transaksi"
        description="Semua transaksi kamu akan muncul di sini."
      />
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: CERDIK_COLORS.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
    >
      {isLoading ? (
        <View style={{ gap: 10 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={{ height: 56, borderRadius: 14, backgroundColor: "#EEF2F7" }} />
          ))}
        </View>
      ) : (
        list.map((tx, idx) => {
          const isExpense = tx.type === "expense";
          const isLast = idx === list.length - 1;
          return (
            <View
              key={tx.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 12,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: "#E2E8F0",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 12 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isExpense ? "#FEE2E2" : "#DCFCE7",
                  }}
                >
                  <Ionicons name={mapCategoryIcon(tx.category)} size={16} color={isExpense ? "#B91C1C" : "#166534"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "700" }}>{tx.note || tx.category}</Text>
                  <Text style={{ color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>
                    {tx.category} • {formatDate(tx.date)}
                  </Text>
                </View>
              </View>
              <Text style={{ color: isExpense ? "#DC2626" : "#16A34A", fontWeight: "700" }}>
                {isExpense ? "-" : "+"}
                {formatRupiah(tx.amount)}
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
