import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-3.5-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ChatTurn = {
  role?: string;
  content?: string;
};

/** Ambil teks jawaban final; abaikan thought parts. */
function extractAnswerText(candidate: {
  content?: { parts?: Array<{ text?: string; thought?: boolean }> };
}): string {
  const parts = candidate?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return "";

  return parts
    .filter((part) => typeof part?.text === "string" && !part.thought)
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

/** Rapikan judul format: hilangkan petik, pastikan **bold**. */
function normalizeAnswerFormat(text: string): string {
  return text
    .replace(/["'“”‘’]\s*\*\*(Ringkasan|Analisis|Saran)\*\*\s*["'“”‘’]/gi, "**$1**")
    .replace(/["'“”‘’]\s*(Ringkasan|Analisis|Saran)\s*["'“”‘’]/gi, "**$1**")
    .replace(
      /(^|\n)\s*(?:📊|💡|🎯)?\s*(Ringkasan|Analisis|Saran)\s*:?\s*(?=\n|$)/gi,
      (_match, prefix: string, title: string) => `${prefix}**${title}**\n`,
    )
    .trim();
}
function getFriendlyGeminiError(
  message: string,
): { status: number; message: string } {
  let text = message;

try {
  const parsed = JSON.parse(message);

  text =
    `${parsed.status ?? ""} ${parsed.code ?? ""} ${parsed.message ?? ""}`;
} catch {
  // bukan JSON
}

text = text.toLowerCase();

  // Free Tier / Quota
  if (
    text.includes("resource_exhausted") ||
    text.includes("quota exceeded") ||
    text.includes("generate_content_free_tier_requests") ||
    text.includes("429")
  ) {
    return {
      status: 429,
      message:
        "CERDIK AI sedang menerima banyak permintaan.\nSilakan coba lagi beberapa saat.",
    };
  }

  // Invalid API Key
  if (
    text.includes("api key not valid") ||
    text.includes("api_key_invalid") ||
    text.includes("permission denied")
  ) {
    return {
      status: 401,
      message:
        "Konfigurasi layanan AI tidak valid. Silakan hubungi administrator.",
    };
  }

  // Model tidak ditemukan
  if (
    text.includes("model not found") ||
    text.includes("404")
  ) {
    return {
      status: 404,
      message:
        "Model AI tidak tersedia saat ini.",
    };
  }

  // Safety Block
  if (
    text.includes("blocked") ||
    text.includes("blockreason")
  ) {
    return {
      status: 400,
      message:
        "Permintaan tidak dapat diproses karena melanggar kebijakan keamanan AI.",
    };
  }

  // Timeout
  if (
    text.includes("deadline exceeded") ||
    text.includes("timeout")
  ) {
    return {
      status: 504,
      message:
        "Waktu pemrosesan AI terlalu lama. Silakan coba lagi.",
    };
  }

  return {
    status: 400,
    message,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY belum diset.");
    }

    const {
      message,
      financialContext,
      chatHistory,
    } = await req.json();

    if (!message || typeof message !== "string") {
      throw new Error("Pesan tidak valid.");
    }

    // Prompt pendek = hemat input token. Target jawaban ~80–120 kata.
    const systemPrompt = `
    Kamu adalah CERDIK AI, asisten literasi keuangan pribadi untuk siswa SMA di Indonesia.
    
    Tugasmu membantu pengguna memahami kondisi keuangan mereka berdasarkan data yang diberikan, lalu memberikan penjelasan dan saran yang mudah dipahami.
    
    Pedoman menjawab:
    - Gunakan Bahasa Indonesia yang ramah, natural, dan mudah dipahami siswa SMA.
    - Jawab dengan jelas, tidak bertele-tele, dan langsung pada inti pertanyaan.
    - Panjang jawaban sekitar 80–150 kata, atau lebih singkat jika pertanyaan sederhana.
    - Gunakan hanya data keuangan yang diberikan sebagai dasar analisis.
    - Jangan mengarang angka, transaksi, maupun informasi yang tidak tersedia.
    - Jika data belum cukup, jelaskan dengan jujur serta sebutkan data apa yang masih dibutuhkan.
    - Fokus pada edukasi literasi keuangan seperti mengatur pengeluaran, menabung, membuat prioritas kebutuhan, mencapai target keuangan, dan membangun kebiasaan finansial yang sehat.
    - Berikan saran yang realistis, sederhana, dan dapat langsung diterapkan.
    - Hindari menyarankan pinjaman online, judi, investasi berisiko tinggi, aktivitas ilegal, ataupun tindakan yang dapat merugikan pengguna.
    - Bersikap positif, suportif, dan tidak menghakimi pengguna.
    
    Gaya jawaban:
    - Variasikan struktur jawaban agar tidak selalu memiliki pola yang sama.
    - Gunakan paragraf, poin-poin, atau kombinasi keduanya sesuai kebutuhan.
    - Tidak perlu selalu menggunakan judul seperti "Ringkasan", "Analisis", atau "Saran".
    - Jangan mengulang kalimat yang sama pada setiap jawaban.
    - Hindari gaya bahasa yang terdengar seperti template.
    - Jika pengguna meminta analisis, berikan penjelasan yang lebih lengkap.
    - Jika pengguna hanya bertanya singkat, berikan jawaban yang singkat dan langsung.
    
    Prioritas analisis:
    - Utamakan membahas pola keuangan yang paling menonjol berdasarkan data yang diberikan.
    - Jika terdapat pengeluaran terbesar, perubahan saldo, progres target tabungan, atau kondisi keuangan tertentu, bahas hal tersebut terlebih dahulu sebelum memberikan saran umum.
    
    Tujuan utama:
    Membantu pengguna memahami kondisi keuangannya dan membangun kebiasaan finansial yang sehat berdasarkan data yang tersedia.
    `.trim();

    const history = Array.isArray(chatHistory) ? (chatHistory as ChatTurn[]) : [];

    // Hindari duplikasi pesan user terakhir (client kadang ikut mengirimkannya di history).
    // Hanya 4 turn terakhir (≈2 Q&A) agar input token hemat.
    const sanitizedHistory = history
      .filter((chat, index) => {
        if (
          index === history.length - 1 &&
          chat?.role === "user" &&
          chat?.content === message
        ) {
          return false;
        }
        return typeof chat?.content === "string" && chat.content.trim().length > 0;
      })
      .slice(-4);

      const contents = [
        ...sanitizedHistory.map((chat) => ({
          role: chat.role === "assistant" ? "model" : "user",
          parts: [{ text: String(chat.content) }],
        })),
      
        {
          role: "user",
          parts: [
            {
              text:
                "KONDISI KEUANGAN PENGGUNA\n" +
                JSON.stringify(financialContext ?? {}) +
                "\n\nPERTANYAAN PENGGUNA\n" +
                message +
                "\n\nJawablah berdasarkan data di atas. Jika data belum cukup, jelaskan dengan jujur tanpa mengarang informasi.",
            },
          ],
        },
      ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.5,
            topP: 0.9,
            maxOutputTokens: 300,

            thinkingConfig: {
              thinkingLevel: "minimal",
            },
          },
        }),
      },
    );

    const result = await response.json();

    console.log("===== GEMINI RESPONSE =====");
    console.log(JSON.stringify(result, null, 2));
    console.log("===========================");

    if (!response.ok) {
      console.error(result);
    
      throw new Error(
        JSON.stringify({
          status: result?.error?.status,
          code: result?.error?.code,
          message: result?.error?.message,
        }),
      );
    }

    const candidate = result?.candidates?.[0];
    const finishReason = candidate?.finishReason as string | undefined;
    const aiMessage = normalizeAnswerFormat(extractAnswerText(candidate));

    if (!aiMessage) {
      const blockReason = result?.promptFeedback?.blockReason;
      throw new Error(
        blockReason
          ? `Jawaban AI diblokir (${blockReason}).`
          : finishReason
            ? `Jawaban AI kosong (finishReason: ${finishReason}).`
            : "Maaf, saya belum dapat memberikan jawaban.",
      );
    }

    if (finishReason === "MAX_TOKENS") {
      console.warn(
        "Gemini finishReason=MAX_TOKENS — jawaban mungkin masih terpotong.",
      );
    }

    return new Response(
      JSON.stringify({
        message: aiMessage,
        finishReason: finishReason ?? null,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (err) {
    const detailMessage =
      err instanceof Error
        ? err.message
        : String(err);
  
    console.error("===== GEMINI ERROR =====");
    console.error(detailMessage);
    console.error("========================");
  
    const friendlyError =
      getFriendlyGeminiError(detailMessage);
  
    return new Response(
      JSON.stringify({
        error: friendlyError.message,
      }),
      {
        status: friendlyError.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
