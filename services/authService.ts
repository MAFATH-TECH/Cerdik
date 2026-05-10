import { supabase } from "./supabase";
import { formatPhone } from "../utils/phoneValidator";
import { ensureSupabaseConfigured } from "./supabase";

function phoneToEmail(phone: string): string {
  const formatted = formatPhone(phone);
  return `${formatted}@cerdik.app`;
}

export async function registerWithPhone(data: {
  fullName: string;
  phone: string;
  password: string;
  kelas: string;
  sekolah: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    ensureSupabaseConfigured();
    const { phone, fullName, password, kelas, sekolah } = data;
    const formattedPhone = formatPhone(phone);
    const syntheticEmail = phoneToEmail(formattedPhone);

    // Pake RPC security definer — query langsung ke `profiles` sering gagal untuk anon karena RLS,
    // dan perilaku bisa beda per client (mis. Android vs iOS).
    const { data: regCheck, error: regCheckError } = await supabase.rpc("check_registration_availability", {
      p_email: syntheticEmail,
      p_phone: formattedPhone,
    });

    if (regCheckError) {
      const m = String(regCheckError.message || "").toLowerCase();
      const rpcMissing =
        m.includes("does not exist") ||
        m.includes("schema cache") ||
        regCheckError.code === "42883";
      if (!rpcMissing) throw regCheckError;
      // RPC belum di-deploy: lanjut ke signUp; bentrok unik akan tetap tertangkap oleh Auth/trigger.
    } else {
      const row = Array.isArray(regCheck) ? regCheck[0] : regCheck;
      if (row?.phone_taken || row?.email_taken) {
        return {
          success: false,
          error: row?.phone_taken
            ? "Nomor HP ini sudah terdaftar. Silakan login atau gunakan nomor lain."
            : "Akun dengan identitas ini sudah ada. Silakan login.",
        };
      }
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: syntheticEmail,
      password,
      options: {
        data: {
          name: fullName,
          full_name: fullName,
          phone: formattedPhone,
          kelas,
          sekolah,
        },
      },
    });

    if (authError) throw authError;

    // Phone + profil sudah diisi trigger `handle_new_user` dari user_metadata; hindari UPDATE
    // tepat setelah signUp (sesi belum aktif jika email confirmation menyala).

    return { success: true };
  } catch (error: any) {
    const message = String(error?.message || "");
    if (message.toLowerCase().includes("konfigurasi supabase belum diisi")) {
      return {
        success: false,
        error:
          "Konfigurasi Supabase belum ada di APK build. Tambahkan EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY di EAS Environment Variables (preview), lalu build ulang APK.",
      };
    }
    if (message.toLowerCase().includes("database error saving")) {
      return {
        success: false,
        error:
          "Registrasi gagal saat menyimpan profil (biasanya nomor HP sudah dipakai atau ada bentrok data). Coba login dengan nomor ini, atau gunakan nomor lain. Jika masih gagal, minta admin cek trigger `handle_new_user` di Supabase.",
      };
    }
    if (message.toLowerCase().includes("network request failed")) {
      return {
        success: false,
        error:
          "Network request failed. Biasanya ini karena Supabase URL/Key tidak ikut ke build APK. Set EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY di EAS (preview), lalu build ulang.",
      };
    }
    return {
      success: false,
      error: message || "Registrasi gagal. Coba lagi.",
    };
  }
}

export async function loginWithPhone(
  phone: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    ensureSupabaseConfigured();
    const formattedPhone = formatPhone(phone);
    const syntheticEmail = phoneToEmail(formattedPhone);

    const { error } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login")) {
        return {
          success: false,
          error: "Nomor HP atau password salah.",
        };
      }
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    const message = String(error?.message || "");
    if (message.toLowerCase().includes("konfigurasi supabase belum diisi")) {
      return {
        success: false,
        error:
          "Konfigurasi Supabase belum ada di APK build. Tambahkan EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY di EAS Environment Variables (preview), lalu build ulang APK.",
      };
    }
    if (message.toLowerCase().includes("network request failed")) {
      return {
        success: false,
        error:
          "Network request failed. Biasanya ini karena Supabase URL/Key tidak ikut ke build APK. Set EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY di EAS (preview), lalu build ulang.",
      };
    }
    return {
      success: false,
      error: message || "Login gagal. Coba lagi.",
    };
  }
}
