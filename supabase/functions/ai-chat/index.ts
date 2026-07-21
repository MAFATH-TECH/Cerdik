import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY belum diset pada Supabase Secrets.");
}

const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";

/**
 * Gunakan model yang ingin dipakai.
 *
 * Contoh:
 * gpt-5.6-luna
 * gpt-5-mini
 * gpt-4.1
 *
 * Tinggal ganti di sini kalau nanti ingin upgrade model.
 */
const OPENAI_MODEL = "gpt-5.4-mini";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIRequest {
  message: string;
  financialContext: unknown;
  chatHistory?: ChatMessage[];
}

/**
 * ======================================================================
 * CERDIK SYSTEM PROMPT
 * ======================================================================
 *
 * PASTE SELURUH SYSTEM PROMPT GEMINI YANG SEKARANG
 * TANPA DIUBAH SATU KATA PUN.
 *
 * Jangan diubah.
 * Jangan dipersingkat.
 * Jangan dioptimasi.
 *
 * OpenAI Responses API menggunakan "instructions",
 * sehingga prompt ini akan dipakai sebagai instructions.
 *
 * ======================================================================
 */


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

    function buildConversationInput(
      userMessage: string,
      history: ChatMessage[] = [],
    ) {
      const messages = history.map((item) => ({
        role: item.role,
        content: item.content,
      }));
    
      messages.push({
        role: "user",
        content: userMessage,
      });
    
      return messages;
    }

    function extractResponseText(response: any): string {
      if (!response?.output) {
        return "";
      }
    
      for (const item of response.output) {
        if (item.type !== "message") continue;
    
        for (const content of item.content ?? []) {
          if (
            content.type === "output_text" &&
            typeof content.text === "string"
          ) {
            return content.text.trim();
          }
        }
      }
    
      return "";
    }

    function getFriendlyError(status: number) {
      switch (status) {
        case 400:
          return "Permintaan tidak dapat diproses. Silakan coba lagi.";
    
        case 401:
          return "Layanan AI sedang mengalami masalah autentikasi.";
    
        case 403:
          return "Layanan AI tidak dapat diakses saat ini.";
    
        case 404:
          return "Layanan AI tidak tersedia.";
    
        case 429:
          return "CERDIK AI sedang melayani banyak pengguna. Silakan coba beberapa saat lagi.";
    
        case 500:
        case 502:
        case 503:
          return "CERDIK AI sedang mengalami gangguan. Silakan coba lagi nanti.";
    
        default:
          return "Terjadi kesalahan saat memproses permintaan.";
      }
    }

    async function generateOpenAIResponse(
      message: string,
      financialContext: unknown,
      chatHistory: ChatMessage[] = [],
    ): Promise<string> {
      const controller = new AbortController();
    
      const timeout = setTimeout(() => controller.abort(), 30000);
    
      try {
        /**
         * Tambahkan financial context ke prompt user.
         *
         * System Prompt tetap berada di "instructions".
         */
        const userPrompt = `
    DATA KEUANGAN PENGGUNA:
    
    ${JSON.stringify(financialContext ?? {}, null, 2)}
    
    ==================================================
    
    PERTANYAAN PENGGUNA:
    
    ${message}
    `.trim();
    
        const input = buildConversationInput(
          userPrompt,
          chatHistory,
        );
    
        const response = await fetch(OPENAI_ENDPOINT, {
          method: "POST",
    
          signal: controller.signal,
    
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
    
          body: JSON.stringify({
            model: OPENAI_MODEL,
    
            instructions: systemPrompt,
    
            input,
    
            store: false,
          }),
        });
    
        const body = await response.json();

        if (body.usage) {
          console.log(
            `Token Usage | Input: ${body.usage.input_tokens} | Output: ${body.usage.output_tokens} | Total: ${body.usage.total_tokens}`,
          );
        }

        if (!response.ok) {
          console.error("Responses API Error:", body);

          throw new Error(getFriendlyError(response.status));
        }
    
        const answer = extractResponseText(body);
    
        if (!answer) {
          throw new Error(
            "AI tidak mengembalikan jawaban.",
          );
        }
    
        return answer;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new Error(
            "Permintaan ke layanan AI melebihi batas waktu.",
          );
        }
    
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }

    serve(async (req) => {
      // Handle preflight request
      if (req.method === "OPTIONS") {
        return new Response("ok", {
          headers: corsHeaders,
        });
      }
    
      try {
        const {
          message,
          financialContext,
          chatHistory = [],
        }: AIRequest = await req.json();
    
        if (!message || typeof message !== "string") {
          return new Response(
            JSON.stringify({
              error: "Pesan tidak boleh kosong.",
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
    
        console.log("========== CERDIK AI ==========");
        console.log("Pesan diterima");
        console.log("History:", chatHistory.length);
        console.log("================================");
    
        const aiResponse = await generateOpenAIResponse(
          message,
          financialContext,
          chatHistory,
        );
    
        return new Response(
          JSON.stringify({
            message: aiResponse,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      } catch (error) {
        console.error("Edge Function Error:", error);
    
        return new Response(
          JSON.stringify({
            error:
              error instanceof Error
                ? error.message
                : "Terjadi kesalahan.",
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }
    });