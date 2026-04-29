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
const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
};

export default function RegisterScreen() {
  const { register, isLoading } = useAuthStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [kelas, setKelas] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [kelasError, setKelasError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [kelasModalOpen, setKelasModalOpen] = useState(false);

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone]);
  const phoneValid = useMemo(() => /^628\d{7,11}$/.test(normalizedPhone), [normalizedPhone]);
  const passwordValid = useMemo(
    () => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password),
    [password],
  );
  const confirmPasswordValid = useMemo(() => confirmPassword.length > 0 && password === confirmPassword, [confirmPassword, password]);
  const canSubmit =
    name.trim().length >= 3 &&
    phoneValid &&
    emailValid &&
    passwordValid &&
    confirmPasswordValid &&
    Boolean(kelas) &&
    !isLoading;

  const validateForm = () => {
    let isValid = true;
    setNameError("");
    setPhoneError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setKelasError("");

    if (name.trim().length < 3) {
      setNameError("Nama minimal 3 karakter.");
      isValid = false;
    }
    if (!phoneValid) {
      setPhoneError("Nomor HP belum valid (contoh: 0812xxxx).");
      isValid = false;
    }
    if (!emailValid) {
      setEmailError("Format email belum valid.");
      isValid = false;
    }
    if (!passwordValid) {
      setPasswordError("Password min. 8 karakter dan harus ada huruf besar, kecil, angka, simbol.");
      isValid = false;
    }
    if (!confirmPasswordValid) {
      setConfirmPasswordError("Konfirmasi password tidak sama.");
      isValid = false;
    }
    if (!kelas) {
      setKelasError("Kelas wajib dipilih.");
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    try {
      await register({
        name: name.trim(),
        phone: normalizedPhone,
        email: email.trim(),
        password,
        kelas,
      });
      router.replace("/(auth)/verify-email");
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Registrasi gagal. Coba lagi.";
      const normalizedError = rawMessage.toLowerCase();
      const emailAlreadyUsed =
        rawMessage === "EMAIL_ALREADY_USED" ||
        normalizedError.includes("already registered") ||
        normalizedError.includes("already been registered") ||
        normalizedError.includes("already exists") ||
        normalizedError.includes("duplicate key");
      const phoneAlreadyUsed =
        rawMessage === "PHONE_ALREADY_USED" ||
        normalizedError.includes("phone") && normalizedError.includes("duplicate");
      const message = emailAlreadyUsed
        ? "Email ini sudah terdaftar. Silakan login."
        : phoneAlreadyUsed
          ? "Nomor HP ini sudah dipakai akun lain."
          : rawMessage;
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
        <Text style={{ marginTop: 8, fontSize: 12, textAlign: "center", color: CERDIK_COLORS.textSecondary }}>
          Setelah daftar, akun akan aktif setelah kamu verifikasi email.
        </Text>
      </View>

      <CerdikCard>
        <CerdikInput
          label="Nama Lengkap"
          placeholder="Nama lengkap"
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (nameError) setNameError("");
          }}
          error={nameError}
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
        />
        <CerdikInput
          label="Nomor HP"
          placeholder="08xxxxxxxxxx"
          value={phone}
          onChangeText={(value) => {
            setPhone(normalizePhone(value));
            if (phoneError) setPhoneError("");
          }}
          keyboardType="phone-pad"
          error={phoneError}
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="next"
        />
        <CerdikInput
          label="Email"
          placeholder="contoh@email.com"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (emailError) setEmailError("");
          }}
          keyboardType="email-address"
          error={emailError}
          autoComplete="email"
          textContentType="emailAddress"
          autoCapitalize="none"
          returnKeyType="next"
        />
        <CerdikInput
          label="Password"
          placeholder="Min. 8 karakter + Ab1!"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (passwordError) setPasswordError("");
          }}
          secureTextEntry={!showPassword}
          error={passwordError}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
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
          onChangeText={(value) => {
            setConfirmPassword(value);
            if (confirmPasswordError) setConfirmPasswordError("");
          }}
          secureTextEntry={!showConfirmPassword}
          error={confirmPasswordError}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
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
        {kelasError ? <Text style={{ marginTop: -8, marginBottom: 12, fontSize: 12, color: CERDIK_COLORS.accent }}>{kelasError}</Text> : null}

        <CerdikButton title="Daftar" onPress={handleRegister} loading={isLoading} disabled={!canSubmit} />
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
    </View>
  );
}
