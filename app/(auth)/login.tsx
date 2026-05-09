import { Ionicons } from "@expo/vector-icons";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";

import CerdikButton from "@/components/ui/CerdikButton";
import CerdikCard from "@/components/ui/CerdikCard";
import { loginWithPhone } from "@/services/authService";
import { CERDIK_COLORS } from "@/constants/colors";
import { displayPhone, validatePhone } from "@/utils/phoneValidator";

export default function LoginScreen() {
  const params = useLocalSearchParams<{ registered?: string }>();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const phoneValid = useMemo(() => validatePhone(phone).valid, [phone]);
  const passwordValid = useMemo(() => password.trim().length >= 8, [password]);
  const canSubmit = phoneValid && passwordValid && !isLoading;

  const validateForm = () => {
    let isValid = true;
    setPhoneError("");
    setPasswordError("");
    setLoginError("");

    const phoneState = validatePhone(phone);
    if (!phoneState.valid) {
      setPhoneError(phoneState.message);
      isValid = false;
    }

    if (!passwordValid) {
      setPasswordError("Password minimal 8 karakter.");
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await loginWithPhone(phone, password);
      if (!result.success) {
        setLoginError(result.error ?? "Login gagal. Coba lagi.");
        return;
      }
      router.replace("/(tabs)");
    } catch (error: any) {
      setLoginError(error?.message ?? "Login gagal. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

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
      <View style={{ marginBottom: 24, alignItems: "center" }}>
        <View
          style={{
            marginBottom: 12,
            width: 64,
            height: 64,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 16,
            backgroundColor: `${CERDIK_COLORS.primary}1A`,
          }}
        >
          <Text style={{ fontSize: 30 }}>💸</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>CERDIK</Text>
        <Text style={{ marginTop: 4, fontSize: 14, color: CERDIK_COLORS.textSecondary }}>
          Kelola Uangmu, Raih Mimpimu
        </Text>
      </View>

      <CerdikCard>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "600", color: CERDIK_COLORS.textPrimary }}>Nomor HP</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 16,
              borderWidth: 1,
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 14,
              borderColor: phoneError ? CERDIK_COLORS.accent : "#E2E8F0",
            }}
          >
            <Text style={{ marginRight: 8, fontSize: 18 }}>🇮🇩</Text>
            <TextInput
              placeholder="Nomor HP yang didaftarkan"
              value={phone}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              onChangeText={(value) => {
                const digits = value.replace(/\D/g, "");
                setPhone(displayPhone(digits));
                if (phoneError) setPhoneError("");
                if (loginError) setLoginError("");
              }}
              style={{ flex: 1, paddingVertical: 12, fontSize: 16, color: CERDIK_COLORS.textPrimary }}
              placeholderTextColor="#94A3B8"
            />
          </View>
          {phoneError ? <Text style={{ marginTop: 4, fontSize: 12, color: CERDIK_COLORS.accent }}>{phoneError}</Text> : null}
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: "600", color: CERDIK_COLORS.textPrimary }}>Password</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 16,
              borderWidth: 1,
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 14,
              borderColor: passwordError ? CERDIK_COLORS.accent : "#E2E8F0",
            }}
          >
            <TextInput
              placeholder="Password kamu"
              value={password}
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              onChangeText={(value) => {
                setPassword(value);
                if (passwordError) setPasswordError("");
                if (loginError) setLoginError("");
              }}
              style={{ flex: 1, paddingVertical: 12, fontSize: 16, color: CERDIK_COLORS.textPrimary }}
              placeholderTextColor="#94A3B8"
            />
            <Pressable onPress={() => setShowPassword((prev) => !prev)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={CERDIK_COLORS.textSecondary} />
            </Pressable>
          </View>
          {passwordError ? <Text style={{ marginTop: 4, fontSize: 12, color: CERDIK_COLORS.accent }}>{passwordError}</Text> : null}
        </View>

        <CerdikButton title="Masuk" onPress={handleLogin} loading={isLoading} disabled={!canSubmit} />
        {loginError ? <Text style={{ marginTop: 10, fontSize: 12, color: CERDIK_COLORS.accent }}>{loginError}</Text> : null}
        {params.registered === "1" ? (
          <Text style={{ marginTop: 10, fontSize: 12, color: "#16A34A" }}>Pendaftaran berhasil! Silakan login.</Text>
        ) : null}
      </CerdikCard>

      <Link
        href="/(auth)/register"
        style={{ marginTop: 20, textAlign: "center", fontWeight: "500", color: CERDIK_COLORS.primary }}
      >
        Belum punya akun? Daftar sekarang
      </Link>
      </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
