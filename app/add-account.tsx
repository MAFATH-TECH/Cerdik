import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";

import CerdikButton from "@/components/ui/CerdikButton";
import CerdikCard from "@/components/ui/CerdikCard";
import { CERDIK_COLORS } from "@/constants/colors";
import { MAX_ACCOUNTS } from "@/services/accountStorage";
import { useAccountStore } from "@/stores/useAccountStore";
import { displayPhone, validatePhone } from "@/utils/phoneValidator";

export default function AddAccountScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const accountCount = useAccountStore((s) => s.accounts.length);
  const addAccount = useAccountStore((s) => s.addAccount);
  const [phone, setPhone] = useState(params.phone ? displayPhone(params.phone) : "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [formError, setFormError] = useState("");
  const phoneValid = useMemo(() => validatePhone(phone).valid, [phone]);
  const passwordValid = password.trim().length >= 8;
  const isReauth = Boolean(params.phone);
  const canSubmit = phoneValid && passwordValid && !isLoading;

  const handleSubmit = async () => {
    const phoneState = validatePhone(phone);
    if (!phoneState.valid) {
      setPhoneError(phoneState.message);
      return;
    }

    setIsLoading(true);
    setFormError("");
    // Jika berhasil, store akun otomatis pindah ke akun baru dan menutup layar ini.
    const result = await addAccount(phone, password);
    if (!result.ok) {
      setFormError(result.error ?? "Gagal menambah akun. Coba lagi.");
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
          <View style={{ marginBottom: 20, alignItems: "center" }}>
            <Ionicons name="people-circle-outline" size={64} color={CERDIK_COLORS.primary} />
            <Text style={{ marginTop: 8, fontSize: 20, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
              {isReauth ? "Login Ulang" : "Tambah Akun"}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 13, textAlign: "center", lineHeight: 20, color: CERDIK_COLORS.textSecondary }}>
              {isReauth
                ? "Masukkan password untuk melanjutkan ke akun ini."
                : `Masuk dengan akun lain untuk berpindah dengan cepat. Tersimpan ${accountCount} dari ${MAX_ACCOUNTS} akun.`}
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
                  backgroundColor: isReauth ? CERDIK_COLORS.muted : "#FFFFFF",
                  paddingHorizontal: 14,
                  borderColor: phoneError ? CERDIK_COLORS.danger : "#E2E8F0",
                }}
              >
                <Text style={{ marginRight: 8, fontSize: 18 }}>🇮🇩</Text>
                <TextInput
                  placeholder="Nomor HP akun yang ingin ditambahkan"
                  value={phone}
                  editable={!isReauth}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  onChangeText={(value) => {
                    setPhone(displayPhone(value.replace(/\D/g, "")));
                    if (phoneError) setPhoneError("");
                    if (formError) setFormError("");
                  }}
                  style={{ flex: 1, paddingVertical: 12, fontSize: 16, color: CERDIK_COLORS.textPrimary }}
                  placeholderTextColor="#94A3B8"
                />
              </View>
              {phoneError ? <Text style={{ marginTop: 4, fontSize: 12, color: CERDIK_COLORS.danger }}>{phoneError}</Text> : null}
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
                  borderColor: "#E2E8F0",
                }}
              >
                <TextInput
                  placeholder="Password akun tersebut"
                  value={password}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  onChangeText={(value) => {
                    setPassword(value);
                    if (formError) setFormError("");
                  }}
                  style={{ flex: 1, paddingVertical: 12, fontSize: 16, color: CERDIK_COLORS.textPrimary }}
                  placeholderTextColor="#94A3B8"
                />
                <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={CERDIK_COLORS.textSecondary} />
                </Pressable>
              </View>
            </View>

            <CerdikButton
              title={isReauth ? "Masuk" : "Tambah & Pindah"}
              onPress={handleSubmit}
              loading={isLoading}
              disabled={!canSubmit}
            />
            {formError ? <Text style={{ marginTop: 10, fontSize: 12, color: CERDIK_COLORS.danger }}>{formError}</Text> : null}
          </CerdikCard>

          <Text style={{ marginTop: 16, fontSize: 12, textAlign: "center", color: CERDIK_COLORS.textSecondary }}>
            Password tidak disimpan di perangkat ini.
          </Text>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
