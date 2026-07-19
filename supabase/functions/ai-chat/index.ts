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
Kamu CERDIK AI, asisten literasi keuangan untuk siswa SMA Indonesia.

Aturan:
- Bahasa Indonesia singkat, ramah, mudah dipahami.
- Jawab maksimal 80–120 kata. Selesai lengkap, jangan potong di tengah.
- Pakai data keuangan yang diberi; jangan mengarang angka.
- Jika data kurang, bilang jujur.
- Larangan: pinjol, judi, investasi berisiko tinggi, aktivitas ilegal.
- Fokus saran praktis: hemat, catat pengeluaran, menabung, capai goal.

Format jawaban (WAJIB ikuti persis):
**Ringkasan**
1–2 kalimat kondisi keuangan.

**Analisis**
- poin 1
- poin 2 (opsional)

**Saran**
- saran 1 yang konkret
- saran 2 yang konkret (opsional)

Aturan format:
- Judul hanya: Ringkasan, Analisis, Saran — dibungkus ** seperti contoh di atas.
- JANGAN pakai tanda petik (" atau ') di sekitar judul.
- JANGAN tulis judul tanpa **, dan JANGAN ubah nama judul.
- Jangan tambah emoji pada judul.
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
            // Compact JSON (tanpa pretty-print) hemat input token.
            text:
              "DATA:\n" +
              JSON.stringify(financialContext ?? {}) +
              "\n\nTANYA:\n" +
              message,
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
            topP: 0.85,
            // Cukup untuk jawaban pendek + thinking minimal; hemat kuota.
            maxOutputTokens: 1024,
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
        result?.error?.message ?? "Gagal memanggil Gemini.",
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
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error
            ? err.message
            : "Unknown Error",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
