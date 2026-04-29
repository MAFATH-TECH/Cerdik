// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CategorySummary = { category?: string; total?: number };

function createFallbackAdvice(input: {
  message: string;
  financialContext?: {
    total_pemasukan?: number;
    total_pengeluaran?: number;
    sisa?: number;
    persentase_tabungan?: number;
    pengeluaran_per_kategori?: CategorySummary[];
    jumlah_transaksi?: number;
  };
}) {
  const message = (input.message || "").toLowerCase();
  const context = input.financialContext ?? {};
  const income = Number(context.total_pemasukan ?? 0);
  const expense = Number(context.total_pengeluaran ?? 0);
  const balance = Number(context.sisa ?? income - expense);
  const savingPct = Number(
    context.persentase_tabungan ??
      (income > 0 ? Math.round(((income - expense) / income) * 100) : 0),
  );
  const txCount = Number(context.jumlah_transaksi ?? 0);
  const categories = Array.isArray(context.pengeluaran_per_kategori)
    ? [...context.pengeluaran_per_kategori]
        .filter((c) => typeof c?.category === "string")
        .sort((a, b) => Number(b?.total ?? 0) - Number(a?.total ?? 0))
    : [];
  const topCategory = categories[0];
  const topCategoryName = String(topCategory?.category ?? "belum terdeteksi");
  const topCategoryAmount = Number(topCategory?.total ?? 0);

  if (txCount === 0) {
    return "Data transaksimu masih kosong. Mulai dari catat pemasukan dan 3 pengeluaran harian dulu, lalu aku bantu evaluasi pola borosmu dengan lebih akurat.";
  }

  if (message.includes("terboros") || message.includes("boros") || message.includes("kategori")) {
    if (!topCategory || topCategoryAmount <= 0) {
      return "Belum terlihat kategori pengeluaran utama. Coba catat transaksi dengan kategori yang konsisten selama 1 minggu agar analisis lebih tajam.";
    }
    return `Pengeluaran terbesarmu saat ini ada di kategori ${topCategoryName} sekitar Rp ${topCategoryAmount.toLocaleString("id-ID")}. Coba tetapkan batas mingguan untuk kategori ini agar sisa uangmu lebih aman.`;
  }

  if (message.includes("hemat")) {
    return "Tips hemat cepat: pakai aturan 24 jam sebelum beli barang non-prioritas, batasi jajan harian dengan nominal tetap, dan catat semua pengeluaran kecil agar kebocoran uang terlihat.";
  }

  if (message.includes("menabung") || message.includes("tabung") || message.includes("rencana")) {
    const targetPct = 20;
    const targetNominal = Math.max(0, Math.round((income * targetPct) / 100));
    return `Rencana menabung sederhana: targetkan minimal ${targetPct}% pemasukan (sekitar Rp ${targetNominal.toLocaleString("id-ID")}), simpan di awal saat menerima pemasukan, lalu gunakan sisa uang untuk kebutuhan harian.`;
  }

  if (income <= 0) {
    return "Kondisi keuanganmu belum bisa dihitung karena data pemasukan masih nol. Coba catat pemasukan rutin dulu, lalu kita susun strategi hemat dan tabungan yang realistis.";
  }

  if (balance < 0) {
    return `Pengeluaranmu melebihi pemasukan sebesar Rp ${Math.abs(balance).toLocaleString("id-ID")}. Prioritaskan kebutuhan wajib dulu dan pangkas 1-2 kategori pengeluaran tertinggi minggu ini.`;
  }

  if (savingPct >= 20) {
    return `Kondisi keuanganmu cukup sehat: tabunganmu sekitar ${savingPct}% dari pemasukan. Pertahankan pola ini dan evaluasi kategori ${topCategoryName} agar progres makin cepat.`;
  }

  return `Kondisi keuanganmu cukup stabil, tapi tabungan baru ${savingPct}%. Naikkan perlahan ke target 20% dengan mengurangi pengeluaran di kategori ${topCategoryName} dan tetapkan batas mingguan.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, financialContext, chatHistory } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Missing `message` in request body." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Kamu adalah CERDIK AI, asisten keuangan 
personal untuk siswa SMA/MAN.

Kepribadianmu:
- Friendly dan supportif seperti kakak yang peduli
- Bahasa Indonesia yang santai tapi informatif
- Jawaban singkat, max 3-4 kalimat per respons
- Hindari istilah keuangan yang terlalu teknis

Konteks keuangan siswa bulan ini:
${JSON.stringify(financialContext ?? {}, null, 2)}

Aturan:
- Jangan sarankan investasi berisiko
- Sesuaikan saran dengan kondisi keuangan siswa
- Jika tidak ada data, minta siswa mulai mencatat`;

    const messages = [
      ...(Array.isArray(chatHistory) ? chatHistory.slice(-10) : []),
      { role: "user", content: message },
    ];

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    const canUseAnthropic = anthropicKey.startsWith("sk-ant-");

    if (!canUseAnthropic) {
      const fallback = createFallbackAdvice({ message, financialContext });
      return new Response(JSON.stringify({ message: fallback, source: "fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-latest",
        max_tokens: 500,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const anthropicMessage =
        data?.error?.message ??
        data?.error?.type ??
        `Anthropic request failed with status ${response.status}`;
      // Fallback otomatis jika API eksternal belum siap / gagal.
      const fallback = createFallbackAdvice({ message, financialContext });
      return new Response(
        JSON.stringify({
          message: fallback,
          source: "fallback",
          note: `Anthropic unavailable: ${anthropicMessage}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const aiMessage = data?.content?.[0]?.text;

    if (typeof aiMessage !== "string" || !aiMessage.trim()) {
      return new Response(JSON.stringify({ error: "Anthropic response missing text." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
