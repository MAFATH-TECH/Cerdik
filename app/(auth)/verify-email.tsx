import { Link } from "expo-router";
import { Text, View } from "react-native";

import CerdikCard from "@/components/ui/CerdikCard";
import { CERDIK_COLORS } from "@/constants/colors";

export default function VerifyEmailScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", backgroundColor: CERDIK_COLORS.background, paddingHorizontal: 24 }}>
      <CerdikCard>
        <Text style={{ fontSize: 24, fontWeight: "700", color: CERDIK_COLORS.textPrimary, textAlign: "center" }}>
          Cek Email Kamu
        </Text>
        <Text
          style={{
            marginTop: 12,
            fontSize: 15,
            lineHeight: 22,
            color: CERDIK_COLORS.textSecondary,
            textAlign: "center",
          }}
        >
          Kami sudah kirim link verifikasi ke email yang kamu daftarkan. Buka email itu lalu klik tombol verifikasi untuk
          mengaktifkan akun CERDIK.
        </Text>
        <Text
          style={{
            marginTop: 12,
            fontSize: 14,
            lineHeight: 20,
            color: CERDIK_COLORS.textSecondary,
            textAlign: "center",
          }}
        >
          Setelah verifikasi berhasil, kamu akan diarahkan kembali ke aplikasi atau bisa login manual dari halaman masuk.
        </Text>
      </CerdikCard>

      <Link
        href="/(auth)/login"
        style={{ marginTop: 20, textAlign: "center", fontWeight: "500", color: CERDIK_COLORS.primary }}
      >
        Kembali ke halaman login
      </Link>
    </View>
  );
}
