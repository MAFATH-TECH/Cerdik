import { supabase } from "./supabase";
import { formatPhone } from "../utils/phoneValidator";

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
    const { phone, fullName, password, kelas, sekolah } = data;
    const formattedPhone = formatPhone(phone);
    const syntheticEmail = phoneToEmail(formattedPhone);

    const { data: existing, error: existingError } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", formattedPhone)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      return {
        success: false,
        error: "Nomor HP ini sudah terdaftar. Gunakan nomor lain.",
      };
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

    if (authData.user) {
      await supabase.from("profiles").update({ phone: formattedPhone }).eq("id", authData.user.id);
    }

    return { success: true };
  } catch (error: any) {
    const message = String(error?.message || "");
    if (message.toLowerCase().includes("database error saving")) {
      return {
        success: false,
        error:
          "Registrasi gagal karena konfigurasi database belum sinkron (trigger profiles). Jalankan SQL perbaikan trigger terlebih dulu.",
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
    return {
      success: false,
      error: error?.message || "Login gagal. Coba lagi.",
    };
  }
}
