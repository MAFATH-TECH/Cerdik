import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  ToastAndroid,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import CurrencyInput from "@/components/ui/CurrencyInput";
import { CERDIK_COLORS } from "@/constants/colors";
import { transactionService } from "@/services/transactionService";
import { useTransactionStore } from "@/stores/useTransactionStore";

type TransactionType = "income" | "expense";

const EXPENSE_CATEGORIES = [
  { label: "Menabung", emoji: "💰" },
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
  { label: "Tabungan", emoji: "💵" },
  { label: "Uang Saku", emoji: "💸" },
  { label: "Beasiswa", emoji: "🎓" },
  { label: "Hadiah", emoji: "🎁" },
  { label: "Kerja Sampingan", emoji: "💼" },
  { label: "Lainnya", emoji: "📦" },
] as const;

export default function EditTransactionScreen() {
  const params = useLocalSearchParams<{ transactionId?: string | string[] }>();
  const transactionId = Array.isArray(params.transactionId) ? params.transactionId[0] : params.transactionId;
  const { editTransaction, removeTransaction, isLoading } = useTransactionStore();

  const [loadingTx, setLoadingTx] = useState(true);
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
    let cancelled = false;

    const load = async () => {
      if (!transactionId || typeof transactionId !== "string") {
        Alert.alert("Error", "Transaksi tidak valid.", [{ text: "OK", onPress: () => router.back() }]);
        return;
      }
      setLoadingTx(true);
      try {
        const tx = await transactionService.getTransactionById(transactionId);
        if (cancelled) return;
        if (!tx) {
          Alert.alert("Tidak ditemukan", "Transaksi ini tidak ada atau sudah dihapus.", [
            { text: "OK", onPress: () => router.back() },
          ]);
          return;
        }
        setType(tx.type);
        setAmount(String(Math.round(tx.amount)));
        setSelectedCategory(tx.category);
        setNote(tx.note ?? "");
        setSelectedDate(tx.date ? new Date(tx.date + "T12:00:00") : new Date());
      } catch {
        if (!cancelled) {
          Alert.alert("Gagal", "Tidak bisa memuat transaksi.", [{ text: "OK", onPress: () => router.back() }]);
        }
      } finally {
        if (!cancelled) setLoadingTx(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [transactionId]);

  useEffect(() => {
    if (!categories.some((c) => c.label === selectedCategory) && selectedCategory) {
      setSelectedCategory("");
    }
  }, [type, categories, selectedCategory]);

  const saveButtonColor = type === "income" ? CERDIK_COLORS.secondary : CERDIK_COLORS.accent;

  const showSuccessToast = () => {
    if (Platform.OS === "android") {
      ToastAndroid.show("Transaksi berhasil diupdate!", ToastAndroid.SHORT);
      return;
    }
    Alert.alert("Berhasil", "Transaksi berhasil diupdate!");
  };

  const handleSave = async () => {
    if (!transactionId || typeof transactionId !== "string") return;
    const parsedAmount = Number(amount);
    if (!(parsedAmount > 0) || !selectedCategory.trim()) return;
    if (isLoading) return;

    try {
      await editTransaction(transactionId, {
        type,
        amount: parsedAmount,
        category: selectedCategory,
        note: note.trim() || undefined,
        date: selectedDate.toISOString(),
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      showSuccessToast();
      router.back();
    } catch {
      Alert.alert("Gagal", "Update transaksi gagal. Coba lagi.");
    }
  };

  const confirmDelete = () => {
    if (!transactionId || typeof transactionId !== "string") return;
    Alert.alert("Hapus Transaksi", "Yakin mau hapus transaksi ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await removeTransaction(transactionId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
            router.back();
          } catch {
            Alert.alert("Gagal", "Hapus transaksi gagal.");
          }
        },
      },
    ]);
  };

  if (loadingTx) {
    return (
      <View style={{ flex: 1, backgroundColor: CERDIK_COLORS.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={CERDIK_COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: CERDIK_COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          style={{ flex: 1, backgroundColor: CERDIK_COLORS.background }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        >
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
              disabled={isLoading}
              style={{
                flex: 1,
                borderRadius: 999,
                paddingVertical: 10,
                backgroundColor: type === "income" ? CERDIK_COLORS.secondary : "transparent",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "700",
                  color: type === "income" ? "#FFFFFF" : CERDIK_COLORS.textSecondary,
                }}
              >
                Pemasukan
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setType("expense")}
              disabled={isLoading}
              style={{
                flex: 1,
                borderRadius: 999,
                paddingVertical: 10,
                backgroundColor: type === "expense" ? CERDIK_COLORS.accent : "transparent",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "700",
                  color: type === "expense" ? "#FFFFFF" : CERDIK_COLORS.textSecondary,
                }}
              >
                Pengeluaran
              </Text>
            </Pressable>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ textAlign: "center", fontSize: 14, fontWeight: "600", color: CERDIK_COLORS.textSecondary }}>
              Nominal Transaksi
            </Text>
            <CurrencyInput label="" value={amount} onChange={setAmount} disabled={isLoading} />
            <Text style={{ textAlign: "center", marginTop: -10, fontSize: 32, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
              {amount ? `Rp ${Number(amount).toLocaleString("id-ID")}` : "Rp 0"}
            </Text>
          </View>

          <Text style={{ marginBottom: 10, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>Pilih Kategori</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
            {categories.map((category) => {
              const selected = selectedCategory === category.label;
              return (
                <Pressable
                  key={category.label}
                  onPress={() => setSelectedCategory(category.label)}
                  disabled={isLoading}
                  style={{
                    width: "25%",
                    alignItems: "center",
                    marginBottom: 14,
                    opacity: isLoading ? 0.6 : 1,
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
            editable={!isLoading}
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
              opacity: isLoading ? 0.6 : 1,
            }}
          />
          <Text style={{ marginTop: -12, marginBottom: 12, textAlign: "right", color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>
            {note.length}/100
          </Text>

          <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "600", color: CERDIK_COLORS.textPrimary }}>Tanggal</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            disabled={isLoading}
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
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            <Text style={{ color: CERDIK_COLORS.textPrimary }}>
              {selectedDate.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
            </Text>
            <Text style={{ fontSize: 18 }}>📅</Text>
          </Pressable>

          {showDatePicker && !isLoading ? (
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
            {isLoading ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Menyimpan...</Text>
              </View>
            ) : (
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Simpan Perubahan</Text>
            )}
          </Pressable>

          <Pressable
            onPress={confirmDelete}
            disabled={isLoading}
            style={{
              marginTop: 14,
              borderRadius: 16,
              paddingVertical: 14,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#DC2626",
              backgroundColor: "#FFFFFF",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            <Text style={{ color: "#DC2626", fontSize: 16, fontWeight: "700" }}>Hapus Transaksi</Text>
          </Pressable>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
