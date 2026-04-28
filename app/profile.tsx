import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Switch, Text, TextInput, View } from "react-native";

import CerdikButton from "@/components/ui/CerdikButton";
import CerdikCard from "@/components/ui/CerdikCard";
import { CERDIK_COLORS } from "@/constants/colors";
import { useAuthStore } from "@/stores/useAuthStore";

const SETTINGS_STORAGE_KEY = "cerdik_settings_v1";

type SettingsState = {
  dailyNotificationsEnabled: boolean;
};

export default function ProfileScreen() {
  const { user, updateProfile, logout, isLoading } = useAuthStore();
  const [name, setName] = useState(user?.name ?? "");
  const [kelas, setKelas] = useState(user?.kelas ?? "");
  const [sekolah, setSekolah] = useState(user?.sekolah ?? "");
  const [dailyNotificationsEnabled, setDailyNotificationsEnabled] = useState(true);

  useEffect(() => {
    setName(user?.name ?? "");
    setKelas(user?.kelas ?? "");
    setSekolah(user?.sekolah ?? "");
  }, [user?.name, user?.kelas, user?.sekolah]);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as SettingsState;
        setDailyNotificationsEnabled(Boolean(parsed.dailyNotificationsEnabled));
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
    await updateProfile({ name: name.trim(), kelas: kelas.trim(), sekolah: sekolah.trim() });
    Alert.alert("Tersimpan", "Profil kamu berhasil diperbarui.");
  };

  const toggleDailyNotif = async (value: boolean) => {
    setDailyNotificationsEnabled(value);
    const next: SettingsState = { dailyNotificationsEnabled: value };
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  };

  const exportData = () => {
    Alert.alert("Export Data", "Coming soon");
  };

  const handleLogout = () => {
    Alert.alert("Keluar Akun", "Yakin ingin logout dari CERDIK?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.dismissAll();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: CERDIK_COLORS.background, padding: 20 }}>
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${CERDIK_COLORS.primary}22`,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 28, color: CERDIK_COLORS.primary, fontWeight: "700" }}>
            {(user?.name ?? "S").slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: "800", color: CERDIK_COLORS.textPrimary }}>Pengaturan</Text>
        <Text style={{ marginTop: 4, color: CERDIK_COLORS.textSecondary }}>CERDIK v1.0.0</Text>
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

      <CerdikButton title="Logout" onPress={handleLogout} variant="danger" />
    </View>
  );
}
