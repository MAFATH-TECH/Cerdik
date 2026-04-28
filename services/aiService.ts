import { api } from "./api";

const CERDIK_SYSTEM_PROMPT = `Kamu adalah CERDIK AI, asisten keuangan personal untuk siswa SMA/MAN.
Bantu siswa mengelola keuangan dengan bahasa yang friendly, singkat, dan mudah dipahami remaja.
Berikan saran praktis yang relevan. Jangan gunakan istilah keuangan yang terlalu teknis.`;

export async function getCerdikAdvice(
  userMessage: string,
  financialContext: Record<string, unknown>,
): Promise<string> {
  try {
    const response = await api.post("/api/ai/chat", {
      systemPrompt: CERDIK_SYSTEM_PROMPT,
      message: userMessage,
      context: financialContext,
    });

    const text = response?.data?.reply as string | undefined;
    if (text && text.trim().length > 0) {
      return text;
    }
    throw new Error("AI response is empty");
  } catch {
    return "Maaf, CERDIK AI sedang sibuk. Coba lagi sebentar ya. Sementara itu, fokus kurangi pengeluaran yang paling sering muncul dulu.";
  }
}
