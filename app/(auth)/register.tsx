import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";

import CerdikButton from "@/components/ui/CerdikButton";
import CerdikCard from "@/components/ui/CerdikCard";
import CerdikInput from "@/components/ui/CerdikInput";
import { CERDIK_COLORS } from "@/constants/colors";
import { useAuthStore } from "@/stores/useAuthStore";

const KELAS_OPTIONS = ["X", "XI", "XII"] as const;
const SEKOLAH_OPTIONS = ["MAN 1 Kendari", "MAN IC Kendari", "Lainnya"] as const;

export default function RegisterScreen() {
  const { register, isLoading } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [kelas, setKelas] = useState("");
  const [sekolah, setSekolah] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [kelasModalOpen, setKelasModalOpen] = useState(false);
  const [sekolahModalOpen, setSekolahModalOpen] = useState(false);

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);

  const validateForm = () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword || !kelas || !sekolah) {
      setError("Semua field wajib diisi.");
      return false;
    }
    if (!emailValid) {
      setError("Format email belum valid.");
      return false;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return false;
    }
    setError("");
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        kelas,
        sekolah,
      });
      router.replace("/(tabs)");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registrasi gagal. Coba lagi.";
      Alert.alert("Registrasi Gagal", message);
    }
  };

  const renderSelect = (label: string, value: string, onPress: () => void) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "600", color: CERDIK_COLORS.textPrimary }}>
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Text style={{ color: value ? CERDIK_COLORS.textPrimary : "#94A3B8" }}>{value || "Pilih salah satu"}</Text>
        <Ionicons name="chevron-down" size={18} color={CERDIK_COLORS.textSecondary} />
      </Pressable>
    </View>
  );

  const renderModalPicker = (
    visible: boolean,
    title: string,
    options: readonly string[],
    onClose: () => void,
    onChoose: (value: string) => void,
  ) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.4)",
          paddingHorizontal: 24,
        }}
      >
        <View style={{ width: "100%", borderRadius: 16, backgroundColor: "#FFFFFF", padding: 16 }}>
          <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
            {title}
          </Text>
          {options.map((option) => (
            <Pressable
              key={option}
              style={{
                marginBottom: 8,
                borderRadius: 12,
                backgroundColor: "#F8FAFC",
                paddingHorizontal: 12,
                paddingVertical: 12,
              }}
              onPress={() => {
                onChoose(option);
                onClose();
              }}
            >
              <Text style={{ color: CERDIK_COLORS.textPrimary }}>{option}</Text>
            </Pressable>
          ))}
          <CerdikButton title="Tutup" onPress={onClose} variant="secondary" />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, justifyContent: "center", backgroundColor: CERDIK_COLORS.background, paddingHorizontal: 24 }}>
      <View style={{ marginBottom: 16, alignItems: "center" }}>
        <Text style={{ fontSize: 30 }}>🎯</Text>
        <Text style={{ marginTop: 8, fontSize: 24, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
          Daftar CERDIK
        </Text>
        <Text style={{ marginTop: 4, fontSize: 14, color: CERDIK_COLORS.textSecondary }}>
          Mulai kebiasaan finansial sehat sejak SMA/MAN
        </Text>
      </View>

      <CerdikCard>
        <CerdikInput
          label="Nama Lengkap"
          placeholder="Nama lengkap"
          value={name}
          onChangeText={setName}
        />
        <CerdikInput
          label="Email"
          placeholder="contoh@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <CerdikInput
          label="Password"
          placeholder="Minimal 6 karakter"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          rightIcon={
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={CERDIK_COLORS.textSecondary}
            />
          }
          onRightIconPress={() => setShowPassword((prev) => !prev)}
        />
        <CerdikInput
          label="Konfirmasi Password"
          placeholder="Ulangi password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          rightIcon={
            <Ionicons
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={CERDIK_COLORS.textSecondary}
            />
          }
          onRightIconPress={() => setShowConfirmPassword((prev) => !prev)}
        />

        {renderSelect("Kelas", kelas, () => setKelasModalOpen(true))}
        {renderSelect("Asal Sekolah", sekolah, () => setSekolahModalOpen(true))}

        {error ? (
          <Text style={{ marginBottom: 12, fontSize: 14, color: CERDIK_COLORS.accent }}>{error}</Text>
        ) : null}

        <CerdikButton title="Daftar" onPress={handleRegister} loading={isLoading} />
      </CerdikCard>

      <Link
        href="/(auth)/login"
        style={{ marginTop: 20, textAlign: "center", fontWeight: "500", color: CERDIK_COLORS.primary }}
      >
        Sudah punya akun? Login
      </Link>

      {renderModalPicker(
        kelasModalOpen,
        "Pilih Kelas",
        KELAS_OPTIONS,
        () => setKelasModalOpen(false),
        setKelas,
      )}
      {renderModalPicker(
        sekolahModalOpen,
        "Pilih Asal Sekolah",
        SEKOLAH_OPTIONS,
        () => setSekolahModalOpen(false),
        setSekolah,
      )}
    </View>
  );
}
