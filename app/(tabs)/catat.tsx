import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, ToastAndroid, View } from "react-native";

import CurrencyInput from "@/components/ui/CurrencyInput";
import { CERDIK_COLORS } from "../../constants/colors";
import { useTransactionStore } from "../../stores/useTransactionStore";

type TransactionType = "income" | "expense";

const EXPENSE_CATEGORIES = [
  { label: "Makan", emoji: "🍽️" },
  { label: "Transportasi", emoji: "🚌" },
  { label: "Jajan", emoji: "🍟" },
  { label: "Belanja", emoji: "🛍️" },
  { label: "Pulsa", emoji: "📱" },
  { label: "Hiburan", emoji: "🎮" },
  { label: "Buku", emoji: "📚" },
  { label: "Lainnya", emoji: "📦" },
] as const;

const INCOME_CATEGORIES = [
  { label: "Uang Saku", emoji: "💸" },
  { label: "Beasiswa", emoji: "🎓" },
  { label: "Hadiah", emoji: "🎁" },
  { label: "Kerja Sampingan", emoji: "💼" },
  { label: "Lainnya", emoji: "📦" },
] as const;

export default function CatatScreen() {
  const { addTransaction, isLoading } = useTransactionStore();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const categories = useMemo(
    () => (type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES),
    [type],
  );

  useEffect(() => {
    setSelectedCategory("");
  }, [type]);

  const saveButtonColor = type === "income" ? CERDIK_COLORS.secondary : CERDIK_COLORS.accent;
  const saveButtonLabel = type === "income" ? "Simpan Pemasukan" : "Simpan Pengeluaran";

  const showSuccessToast = () => {
    if (Platform.OS === "android") {
      ToastAndroid.show("Transaksi berhasil dicatat!", ToastAndroid.SHORT);
    }
  };

  const handleSave = async () => {
    const parsedAmount = Number(amount);
    if (!parsedAmount || !selectedCategory) return;

    await addTransaction({
      type,
      amount: parsedAmount,
      category: selectedCategory,
      note,
      date: selectedDate.toISOString(),
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    showSuccessToast();
    setAmount("");
    setSelectedCategory("");
    setNote("");
    setSelectedDate(new Date());
    router.replace("/(tabs)");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: CERDIK_COLORS.background }} contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
      <View
        style={{
          flexDirection: "row",
          borderRadius: 999,
          backgroundColor: "#E2E8F0",
          padding: 4,
          marginBottom: 18,
        }}
      >
        <Pressable
          onPress={() => setType("income")}
          style={{
            flex: 1,
            borderRadius: 999,
            paddingVertical: 10,
            backgroundColor: type === "income" ? CERDIK_COLORS.secondary : "transparent",
          }}
        >
          <Text style={{ textAlign: "center", fontWeight: "700", color: type === "income" ? "#FFFFFF" : CERDIK_COLORS.textSecondary }}>
            Pemasukan
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setType("expense")}
          style={{
            flex: 1,
            borderRadius: 999,
            paddingVertical: 10,
            backgroundColor: type === "expense" ? CERDIK_COLORS.accent : "transparent",
          }}
        >
          <Text style={{ textAlign: "center", fontWeight: "700", color: type === "expense" ? "#FFFFFF" : CERDIK_COLORS.textSecondary }}>
            Pengeluaran
          </Text>
        </Pressable>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ textAlign: "center", fontSize: 14, fontWeight: "600", color: CERDIK_COLORS.textSecondary }}>
          Nominal Transaksi
        </Text>
        <CurrencyInput label="" value={amount} onChange={setAmount} />
        <Text style={{ textAlign: "center", marginTop: -10, fontSize: 32, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
          {amount ? `Rp ${Number(amount).toLocaleString("id-ID")}` : "Rp 0"}
        </Text>
      </View>

      <Text style={{ marginBottom: 10, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
        Pilih Kategori
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
        {categories.map((category) => {
          const selected = selectedCategory === category.label;
          return (
            <Pressable
              key={category.label}
              onPress={() => setSelectedCategory(category.label)}
              style={{
                width: "25%",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: selected ? CERDIK_COLORS.primary : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: selected ? CERDIK_COLORS.primary : "#E2E8F0",
                }}
              >
                <Text style={{ fontSize: 22 }}>{category.emoji}</Text>
              </View>
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  textAlign: "center",
                  color: selected ? CERDIK_COLORS.primary : CERDIK_COLORS.textSecondary,
                  fontWeight: selected ? "700" : "500",
                }}
              >
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "600", color: CERDIK_COLORS.textPrimary }}>
        Catatan (Opsional)
      </Text>
      <TextInput
        value={note}
        onChangeText={(text) => setNote(text.slice(0, 100))}
        placeholder="Tambah catatan... (opsional)"
        multiline
        style={{
          minHeight: 90,
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          paddingHorizontal: 14,
          paddingVertical: 10,
          textAlignVertical: "top",
          marginBottom: 16,
        }}
      />
      <Text style={{ marginTop: -12, marginBottom: 12, textAlign: "right", color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>
        {note.length}/100
      </Text>

      <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "600", color: CERDIK_COLORS.textPrimary }}>
        Tanggal
      </Text>
      <Pressable
        onPress={() => setShowDatePicker(true)}
        style={{
          marginBottom: 20,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: CERDIK_COLORS.textPrimary }}>
          {selectedDate.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
        </Text>
        <Text style={{ fontSize: 18 }}>📅</Text>
      </Pressable>

      {showDatePicker ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      ) : null}

      <Pressable
        onPress={handleSave}
        disabled={isLoading || !amount || !selectedCategory}
        style={{
          marginTop: 6,
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: saveButtonColor,
          opacity: isLoading || !amount || !selectedCategory ? 0.6 : 1,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
          {isLoading ? "Menyimpan..." : saveButtonLabel}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
