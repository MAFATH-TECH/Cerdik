import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";

import CerdikButton from "@/components/ui/CerdikButton";
import CerdikCard from "@/components/ui/CerdikCard";
import CerdikLogo from "@/components/ui/CerdikLogo";
import { CERDIK_COLORS } from "@/constants/colors";
import { userSettingsService } from "@/services/userSettingsService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGoalStore } from "@/stores/useGoalStore";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { displayPhone } from "@/utils/phoneValidator";

export default function ProfileScreen() {
  const { user, updateProfile, logout, isLoading } = useAuthStore();
  const resetTransactionState = useTransactionStore((s) => s.resetState);
  const resetTransactions = useTransactionStore((s) => s.resetTransactions);
  const resetGoalState = useGoalStore((s) => s.resetState);
  const [resettingTx, setResettingTx] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [kelas, setKelas] = useState(user?.kelas ?? "");
  const [sekolah, setSekolah] = useState(user?.sekolah ?? "");
  const [dailyNotificationsEnabled, setDailyNotificationsEnabled] = useState(true);
  const [weeklyExpenseLimit, setWeeklyExpenseLimit] = useState("0");

  useEffect(() => {
    setName(user?.name ?? "");
    setKelas(user?.kelas ?? "");
    setSekolah(user?.sekolah ?? "");
  }, [user?.name, user?.kelas, user?.sekolah]);

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await userSettingsService.getSettings();
        setDailyNotificationsEnabled(Boolean(settings.dailyNotificationsEnabled));
        setWeeklyExpenseLimit(String(settings.weeklyExpenseLimit));
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const canSave = useMemo(() => {
    return name.trim().length >= 2 && kelas.trim().length > 0 && sekolah.trim().length > 0;
  }, [name, kelas, sekolah]);

  const saveSettings = async () => {
    if (!canSave) {
      Alert.alert("Lengkapi Profil", "Nama, kelas, dan sekolah wajib diisi.");
      return;
    }
    try {
      const parsedWeeklyLimit = Math.max(0, Math.round(Number(weeklyExpenseLimit || "0")));
      if (!Number.isFinite(parsedWeeklyLimit)) {
        Alert.alert("Input tidak valid", "Batas pengeluaran mingguan harus berupa angka.");
        return;
      }

      await updateProfile({ name: name.trim(), kelas: kelas.trim(), sekolah: sekolah.trim() });
      await userSettingsService.saveSettings({
        dailyNotificationsEnabled,
        weeklyExpenseLimit: parsedWeeklyLimit,
      });
      Alert.alert("Tersimpan", "Profil kamu berhasil diperbarui.");
    } catch (error) {
      Alert.alert("Gagal Menyimpan", error instanceof Error ? error.message : "Coba lagi sebentar.");
    }
  };

  const toggleDailyNotif = async (value: boolean) => {
    setDailyNotificationsEnabled(value);
    await userSettingsService.saveSettings({ dailyNotificationsEnabled: value });
  };

  const exportData = () => {
    Alert.alert("Export Data", "Coming soon");
  };

  const showSecondConfirmation = () => {
    Alert.alert(
      "🗑️ Konfirmasi Terakhir",
      "Kamu yakin ingin menghapus SEMUA transaksi?\n\nTindakan ini tidak dapat dibatalkan.",
      [
        { text: "Tidak, Batalkan", style: "cancel" },
        {
          text: "Ya, Hapus Semua",
          style: "destructive",
          onPress: () => {
            void handleReset();
          },
        },
      ],
    );
  };

  const handleReset = async () => {
    try {
      setResettingTx(true);
      await resetTransactions();
      Alert.alert(
        "✅ Berhasil",
        "Semua transaksi berhasil direset. Saldo kamu sekarang Rp 0.",
        [{ text: "OK" }],
      );
    } catch {
      Alert.alert("Gagal", "Reset transaksi gagal. Coba lagi.", [{ text: "OK" }]);
    } finally {
      setResettingTx(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Keluar Akun", "Yakin ingin logout dari CERDIK?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          resetTransactionState();
          resetGoalState();
          router.dismissAll();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

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
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <CerdikLogo size={80} style={{ marginBottom: 8 }} />
        <Text style={{ fontSize: 18, fontWeight: "800", color: CERDIK_COLORS.textPrimary }}>Pengaturan</Text>
        <Text style={{ marginTop: 4, color: CERDIK_COLORS.textSecondary }}>CERDIK v1.0.0</Text>
        <Text style={{ marginTop: 4, color: CERDIK_COLORS.textSecondary }}>{user?.email ?? "-"}</Text>
        {user?.phone ? (
          <Text style={{ marginTop: 4, color: CERDIK_COLORS.textSecondary }}>
            HP: {displayPhone(user.phone)}
          </Text>
        ) : null}
      </View>

      <CerdikCard style={{ marginBottom: 12 }}>
        <Text style={{ color: CERDIK_COLORS.textSecondary, marginBottom: 6 }}>Nama</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nama lengkap"
          placeholderTextColor="#94A3B8"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: CERDIK_COLORS.textPrimary,
          }}
        />
      </CerdikCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <CerdikCard style={{ marginBottom: 12 }}>
            <Text style={{ color: CERDIK_COLORS.textSecondary, marginBottom: 6 }}>Kelas</Text>
            <TextInput
              value={kelas}
              onChangeText={setKelas}
              placeholder="X / XI / XII"
              placeholderTextColor="#94A3B8"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: CERDIK_COLORS.textPrimary,
              }}
            />
          </CerdikCard>
        </View>
        <View style={{ flex: 1 }}>
          <CerdikCard style={{ marginBottom: 12 }}>
            <Text style={{ color: CERDIK_COLORS.textSecondary, marginBottom: 6 }}>Sekolah</Text>
            <TextInput
              value={sekolah}
              onChangeText={setSekolah}
              placeholder="MAN 1 Kendari"
              placeholderTextColor="#94A3B8"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: CERDIK_COLORS.textPrimary,
              }}
            />
          </CerdikCard>
        </View>
      </View>

      <CerdikCard style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "800" }}>Notifikasi harian</Text>
            <Text style={{ marginTop: 4, color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>
              Pengingat ringan untuk catat transaksi.
            </Text>
          </View>
          <Switch
            value={dailyNotificationsEnabled}
            onValueChange={toggleDailyNotif}
            trackColor={{ true: `${CERDIK_COLORS.primary}99`, false: "#CBD5E1" }}
            thumbColor={dailyNotificationsEnabled ? CERDIK_COLORS.primary : "#F1F5F9"}
          />
        </View>
      </CerdikCard>

      <CerdikCard style={{ marginBottom: 12 }}>
        <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "800", marginBottom: 6 }}>
          Batas Pengeluaran Mingguan (Rp)
        </Text>
        <TextInput
          value={weeklyExpenseLimit}
          onChangeText={(text) => setWeeklyExpenseLimit(text.replace(/[^\d]/g, ""))}
          placeholder="Contoh: 200000"
          keyboardType="numeric"
          placeholderTextColor="#94A3B8"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: CERDIK_COLORS.textPrimary,
          }}
        />
        <Text style={{ marginTop: 6, color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>
          Isi 0 jika tidak ingin membatasi pengeluaran mingguan.
        </Text>
      </CerdikCard>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
        <View style={{ flex: 1 }}>
          <Pressable
            onPress={exportData}
            style={{
              height: 50,
              borderRadius: 16,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontWeight: "900", color: CERDIK_COLORS.textPrimary }}>Export Data</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          <CerdikButton
            title={isLoading ? "Menyimpan..." : "Simpan Profil"}
            onPress={saveSettings}
            disabled={!canSave || isLoading}
          />
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: "#E2E8F0", marginVertical: 18 }} />

      <Pressable
        onPress={() =>
          Alert.alert(
            "⚠️ Reset Semua Transaksi",
            "Semua data transaksi kamu akan dihapus dan saldo akan kembali ke Rp 0.\n\nData yang dihapus tidak bisa dikembalikan!",
            [
              { text: "Batal", style: "cancel" },
              {
                text: "Lanjutkan",
                style: "destructive",
                onPress: () => showSecondConfirmation(),
              },
            ],
          )
        }
        disabled={resettingTx}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          height: 52,
          borderRadius: 16,
          marginBottom: 12,
          borderWidth: 1.5,
          borderColor: CERDIK_COLORS.danger,
          backgroundColor: "#FFFFFF",
          opacity: resettingTx ? 0.65 : 1,
        }}
      >
        {resettingTx ? (
          <ActivityIndicator color={CERDIK_COLORS.danger} />
        ) : (
          <Ionicons name="refresh-outline" size={22} color={CERDIK_COLORS.danger} />
        )}
        <Text style={{ fontWeight: "900", color: CERDIK_COLORS.danger, fontSize: 15 }}>Reset Semua Transaksi</Text>
      </Pressable>

      <CerdikButton title="Logout" onPress={handleLogout} variant="danger" />
    </ScrollView>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
