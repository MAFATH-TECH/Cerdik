import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Text, ToastAndroid, View } from "react-native";

import CerdikButton from "@/components/ui/CerdikButton";
import CerdikCard from "@/components/ui/CerdikCard";
import CerdikInput from "@/components/ui/CerdikInput";
import { CERDIK_COLORS } from "@/constants/colors";
import { useAuthStore } from "@/stores/useAuthStore";

export default function LoginScreen() {
  const showErrorToast = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
      return;
    }
    Alert.alert("Login Gagal", message);
  };

  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      setEmailError("Format email belum valid.");
      isValid = false;
    }

    if (password.trim().length < 6) {
      setPasswordError("Password minimal 6 karakter.");
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    try {
      await login({ email: email.trim(), password });
      router.replace("/(tabs)");
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Login gagal. Coba lagi.";
      const message =
        rawMessage === "Invalid login credentials"
          ? "Email atau password salah."
          : rawMessage === "Email not confirmed"
            ? "Email kamu belum diverifikasi. Cek inbox lalu coba login lagi."
            : rawMessage;
      showErrorToast(message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", backgroundColor: CERDIK_COLORS.background, paddingHorizontal: 24 }}>
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
        <CerdikInput
          label="Email"
          placeholder="contoh@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          error={emailError}
        />
        <CerdikInput
          label="Password"
          placeholder="Masukkan password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          error={passwordError}
          rightIcon={
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={CERDIK_COLORS.textSecondary}
            />
          }
          onRightIconPress={() => setShowPassword((prev) => !prev)}
        />

        <CerdikButton title="Masuk" onPress={handleLogin} loading={isLoading} />
        <Text style={{ marginTop: 12, fontSize: 12, lineHeight: 18, color: CERDIK_COLORS.textSecondary }}>
          Akun baru harus verifikasi email dulu sebelum bisa login.
        </Text>
      </CerdikCard>

      <Link
        href="/(auth)/register"
        style={{ marginTop: 20, textAlign: "center", fontWeight: "500", color: CERDIK_COLORS.primary }}
      >
        Belum punya akun? Daftar sekarang
      </Link>
    </View>
  );
}
