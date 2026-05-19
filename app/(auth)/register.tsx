import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";

import CerdikButton from "@/components/ui/CerdikButton";
import CerdikCard from "@/components/ui/CerdikCard";
import CerdikInput from "@/components/ui/CerdikInput";
import CerdikLogo from "@/components/ui/CerdikLogo";
import { CERDIK_COLORS } from "@/constants/colors";
import { registerWithPhone } from "@/services/authService";
import { displayPhone, formatPhone, validatePhone } from "@/utils/phoneValidator";

const KELAS_OPTIONS = ["X", "XI", "XII"] as const;

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [kelas, setKelas] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [kelasError, setKelasError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [kelasModalOpen, setKelasModalOpen] = useState(false);

  const phoneValidation = useMemo(() => validatePhone(phone), [phone]);
  const phoneValid = phoneValidation.valid;
  const passwordValid = useMemo(() => password.trim().length >= 8, [password]);
  const confirmPasswordValid = useMemo(() => confirmPassword.length > 0 && password === confirmPassword, [confirmPassword, password]);
  const canSubmit =
    fullName.trim().length >= 3 &&
    phoneValid &&
    passwordValid &&
    confirmPasswordValid &&
    Boolean(kelas) &&
    !isLoading;

  const validateForm = () => {
    let isValid = true;
    setFullNameError("");
    setPhoneError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setKelasError("");

    if (fullName.trim().length < 3) {
      setFullNameError("Nama minimal 3 karakter.");
      isValid = false;
    }
    if (!phoneValid) {
      setPhoneError(phoneValidation.message);
      isValid = false;
    }
    if (!passwordValid) {
      setPasswordError("Password minimal 8 karakter.");
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

    setIsLoading(true);
    try {
      const result = await registerWithPhone({
        fullName: fullName.trim(),
        phone: formatPhone(phone),
        password,
        kelas,
        sekolah: "Belum diisi",
      });

      if (!result.success) {
        Alert.alert("Registrasi Gagal", result.error ?? "Registrasi gagal. Coba lagi.");
        return;
      }

      router.replace({
        pathname: "/(auth)/login",
        params: { registered: "1" },
      });
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Registrasi gagal. Coba lagi.";
      Alert.alert("Registrasi Gagal", rawMessage);
    } finally {
      setIsLoading(false);
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: CERDIK_COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 24 }}
      >
      <View style={{ marginBottom: 16, alignItems: "center" }}>
        <CerdikLogo size={88} style={{ marginBottom: 8 }} />
        <Text style={{ fontSize: 24, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
          Daftar CERDIK
        </Text>
        <Text style={{ marginTop: 4, fontSize: 14, color: CERDIK_COLORS.textSecondary }}>
          Mulai kebiasaan finansial sehat sejak SMA/MAN
        </Text>
      </View>

      <CerdikCard>
        <CerdikInput
          label="Nama Lengkap"
          placeholder="Nama lengkap kamu"
          value={fullName}
          onChangeText={(value) => {
            setFullName(value);
            if (fullNameError) setFullNameError("");
          }}
          error={fullNameError}
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
        />
        <View style={{ marginBottom: 16 }}>
          <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "600", color: CERDIK_COLORS.textPrimary }}>
            Nomor HP
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 16,
              borderWidth: 1,
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 14,
              borderColor: phoneError ? CERDIK_COLORS.danger : "#E2E8F0",
            }}
          >
            <Text style={{ marginRight: 8, fontSize: 18 }}>🇮🇩</Text>
            <TextInput
              placeholder="08xx-xxxx-xxxx"
              value={phone}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              onBlur={() => {
                setPhoneTouched(true);
                if (!phoneValid) setPhoneError(phoneValidation.message);
              }}
              onChangeText={(value) => {
                const digits = value.replace(/\D/g, "");
                setPhone(displayPhone(digits));
                if (phoneError) setPhoneError("");
              }}
              style={{ flex: 1, paddingVertical: 12, fontSize: 16, color: CERDIK_COLORS.textPrimary }}
              placeholderTextColor="#94A3B8"
            />
            {phoneTouched && phoneValid ? <Ionicons name="checkmark-circle" size={18} color={CERDIK_COLORS.success} /> : null}
          </View>
          {phoneError ? <Text style={{ marginTop: 4, fontSize: 12, color: CERDIK_COLORS.danger }}>{phoneError}</Text> : null}
        </View>
        <CerdikInput
          label="Password"
          placeholder="Buat password (min. 8 karakter)"
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
        <View style={{ marginBottom: 16 }}>
          <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "600", color: CERDIK_COLORS.textPrimary }}>
            Konfirmasi Password
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 16,
              borderWidth: 1,
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 14,
              borderColor: confirmPasswordError ? CERDIK_COLORS.danger : "#E2E8F0",
            }}
          >
            <TextInput
              placeholder="Ulangi password"
              value={confirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoComplete="new-password"
              textContentType="newPassword"
              onChangeText={(value) => {
                setConfirmPassword(value);
                if (confirmPasswordError) setConfirmPasswordError("");
              }}
              style={{ flex: 1, paddingVertical: 12, fontSize: 16, color: CERDIK_COLORS.textPrimary }}
              placeholderTextColor="#94A3B8"
            />
            {confirmPassword.length > 0 ? (
              <Ionicons
                name={confirmPasswordValid ? "checkmark-circle" : "close-circle"}
                size={18}
                color={confirmPasswordValid ? CERDIK_COLORS.success : CERDIK_COLORS.danger}
              />
            ) : null}
            <Pressable onPress={() => setShowConfirmPassword((prev) => !prev)} style={{ marginLeft: 8 }}>
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={CERDIK_COLORS.textSecondary}
              />
            </Pressable>
          </View>
          {confirmPasswordError ? (
            <Text style={{ marginTop: 4, fontSize: 12, color: CERDIK_COLORS.danger }}>{confirmPasswordError}</Text>
          ) : null}
        </View>

        {renderSelect("Kelas", kelas, () => setKelasModalOpen(true))}
        {kelasError ? <Text style={{ marginTop: -8, marginBottom: 12, fontSize: 12, color: CERDIK_COLORS.danger }}>{kelasError}</Text> : null}

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
      </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
