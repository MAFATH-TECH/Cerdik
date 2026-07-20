export type TipHarian = {
  id: number;
  /** Isi lengkap (modal / detail) */
  tips: string;
  /** Pratinjau singkat di kartu & daftar; jika kosong dipakai `tips` */
  ringkas?: string;
  kategori: string;
  emoji: string;
};

/** Teks pratinjau di kartu / daftar — ringkas jika ada agar hemat ruang */
export function getTipPreview(tip: TipHarian): string {
  const r = tip.ringkas?.trim();
  if (r) return r;
  return tip.tips?.trim() ?? "";
}

export type TopikKuis = {
  id: string;
  judul: string;
  emoji: string;
  jumlahSoal: number;
  poin: number;
};

export type ArtikelBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "bullet"; items: string[] }
  | { type: "highlight"; text: string };

export type ArtikelEkonomi = {
  id: string;
  emoji: string;
  tag: string;
  durasi: string;
  judul: string;
  ringkasan: string;
  isi: ArtikelBlock[];
};

export const TIPS_HARIAN: TipHarian[] = [
  {
    id: 1,
    tips: "Catat SEMUA pengeluaran hari ini, sekecil apapun. Mulai dari parkir, jajan, sampai ongkos.",
    kategori: "Pencatatan",
    emoji: "📝",
  },
  {
    id: 2,
    tips: "Sebelum beli sesuatu, tanya: 'Apakah aku masih bisa hidup bahagia tanpa ini?'",
    kategori: "Mindset",
    emoji: "🤔",
  },
  {
    id: 3,
    tips: "Bawa bekal dari rumah minimal 2x seminggu. Bisa hemat 20-30% pengeluaran makan.",
    kategori: "Hemat",
    emoji: "🍱",
  },
  {
    id: 4,
    tips: "Aktifkan notifikasi saldo di aplikasi bank. Aware sama saldo = lebih hemat.",
    kategori: "Teknologi",
    emoji: "🔔",
  },
  {
    id: 5,
    tips: "Pisahkan uang tabungan di amplop berbeda begitu dapat uang saku.",
    kategori: "Menabung",
    emoji: "💰",
  },
  {
    id: 6,
    tips: "Manfaatkan kartu pelajar untuk diskon di bioskop, toko buku, dan restoran tertentu.",
    kategori: "Cerdas",
    emoji: "🎫",
  },
  {
    id: 7,
    tips: "Sebelum top-up game, pikir: 'Ini setara berapa porsi makan?'",
    kategori: "Mindset",
    emoji: "🎮",
  },
  {
    id: 8,
    tips: "Target tabungan konkret: 'Nabung Rp 5.000/hari = Rp 150.000/bulan'.",
    kategori: "Menabung",
    emoji: "🎯",
  },
  {
    id: 9,
    tips: "Catat transaksi langsung setelah bayar di CERDIK, jangan ditunda!",
    kategori: "Pencatatan",
    emoji: "⚡",
  },
  {
    id: 10,
    tips: "Jika teman ajak nongkrong tapi budget tipis, sarankan tempat lebih terjangkau. Teman baik mengerti!",
    kategori: "Sosial",
    emoji: "👥",
  },
  {
    id: 11,
    tips: "Beli alat tulis di awal semester sekaligus, biasanya lebih murah daripada beli satuan.",
    kategori: "Hemat",
    emoji: "✏️",
  },
  {
    id: 12,
    tips: "Review pengeluaran minggu ini setiap Minggu malam. 5 menit saja, tapi sangat berharga.",
    kategori: "Evaluasi",
    emoji: "📊",
  },
  {
    id: 13,
    tips: "Hindari belanja saat lapar atau sedang emosi — keputusan finansial terburuk lahir di sana.",
    kategori: "Mindset",
    emoji: "😤",
  },
  {
    id: 14,
    ringkas: "Cashback kartu debit — untuk belanja terencana saja.",
    tips:
      "Manfaatkan promo cashback kartu debit hanya untuk pembelian yang sudah direncanakan.\n\nJangan jadikan promo alasan belanja impulsif: kalau belum ada di daftar kebutuhan, tunda dulu.",
    kategori: "Cerdas",
    emoji: "💳",
  },
];

export const TOPIK_KUIS: TopikKuis[] = [
  { id: "1", judul: "Perbankan", emoji: "🏦", jumlahSoal: 5, poin: 50 },
  { id: "2", judul: "IKNB", emoji: "🏢", jumlahSoal: 5, poin: 50 },
  { id: "3", judul: "Literasi Keuangan", emoji: "📚", jumlahSoal: 5, poin: 50 },
  { id: "4", judul: "Inflasi", emoji: "📈", jumlahSoal: 5, poin: 50 },
  { id: "5", judul: "Instrumen Investasi", emoji: "📊", jumlahSoal: 5, poin: 50 },
  { id: "6", judul: "Profil Risiko", emoji: "⚖️", jumlahSoal: 5, poin: 50 },
  { id: "7", judul: "OJK & LJK", emoji: "🛡️", jumlahSoal: 5, poin: 50 },
  { id: "8", judul: "Skala Prioritas", emoji: "🎯", jumlahSoal: 5, poin: 50 },
];

export const ARTIKEL_EKONOMI: ArtikelEkonomi[] = [
  {
    id: "1",
    emoji: "🏦",
    tag: "Perbankan",
    durasi: "7 menit",
    judul: "Perbankan: Cara Bank Bekerja dan Manfaatnya buat Pelajar",
    ringkasan: "Pahami apa itu bank, jenis produknya, dan cara pakai rekening dengan aman sejak SMA.",
    isi: [
      {
        type: "paragraph",
        text: "Bank adalah lembaga keuangan yang menerima simpanan masyarakat, lalu menyalurkannya kembali dalam bentuk kredit atau pembiayaan. Sederhananya: bank jadi “perantara” antara orang yang punya uang lebih (penabung) dan orang yang butuh uang (peminjam).",
      },
      {
        type: "paragraph",
        text: "Di Indonesia, bank diawasi ketat. Bank umum dan BPR (Bank Perkreditan Rakyat) berbeda skala, tapi prinsip dasarnya sama: menjaga uang nasabah, memberikan jasa pembayaran, dan membantu perekonomian berputar.",
      },
      { type: "heading", text: "Fungsi Utama Bank" },
      {
        type: "bullet",
        items: [
          "Menghimpun dana: tabungan, giro, deposito",
          "Menyalurkan dana: kredit pendidikan, KPR, modal usaha, dll.",
          "Jasa pembayaran: transfer, QRIS, kartu debit, mobile banking",
          "Menjaga keamanan uang: lebih aman dibanding menyimpan tunai di rumah",
        ],
      },
      { type: "heading", text: "Jenis Rekening yang Perlu Kamu Tahu" },
      {
        type: "bullet",
        items: [
          "Tabungan: paling umum untuk pelajar. Bisa setor-tarik, dapat bunga kecil, biasanya ada aplikasi mobile banking.",
          "Giro: lebih untuk transaksi bisnis/besar; sering pakai cek atau bilyet giro.",
          "Deposito: uang “dikunci” dalam jangka waktu tertentu (misalnya 1–12 bulan) agar bunganya lebih tinggi.",
        ],
      },
      { type: "heading", text: "Bunga Bank — dalam Bahasa Sederhana" },
      {
        type: "paragraph",
        text: "Kalau kamu menabung, bank membayar bunga (imbal hasil kecil) karena bank memakai uangmu untuk disalurkan. Sebaliknya, kalau kamu meminjam, kamu yang membayar bunga kepada bank. Besaran bunga dipengaruhi kebijakan Bank Indonesia dan kondisi ekonomi.",
      },
      {
        type: "highlight",
        text: "Contoh: Bunga tabungan sering lebih rendah dari inflasi. Itu sebabnya menabung saja penting, tapi untuk jangka panjang banyak orang belajar investasi agar nilai uang tidak “tergerus”.",
      },
      { type: "heading", text: "LPS: Pelindung Simpananmu" },
      {
        type: "paragraph",
        text: "Simpanan di bank dijamin Lembaga Penjamin Simpanan (LPS) sampai batas tertentu (cek info terkini di situs LPS). Syarat umumnya: bank peserta LPS, produk yang dijamin, dan suku bunga tidak melebihi ketentuan LPS. Jadi, pilih bank resmi — jangan tergiur “bunga gila-gilaan” di tempat tidak jelas.",
      },
      { type: "heading", text: "Tips Praktis buat Siswa SMA" },
      {
        type: "bullet",
        items: [
          "Punya rekening atas nama sendiri (dengan izin orang tua jika perlu) lebih baik daripada selalu minta transfer lewat orang lain.",
          "Aktifkan notifikasi saldo agar sadar setiap kali uang keluar.",
          "Jangan bagikan PIN, OTP, atau password ke siapa pun — termasuk “teman baik” atau “petugas bank” yang menelepon mendadak.",
          "Pisahkan rekening jajan dan rekening tabungan jika memungkinkan.",
          "Cek biaya admin bulanan dan pilih produk pelajar yang lebih ringan biayanya.",
        ],
      },
      {
        type: "highlight",
        text: "Intinya: bank adalah teman keuangan sehari-hari. Mulai dari rekening tabungan yang tertib, baru pelajari produk lain. Keamanan digital sama pentingnya dengan menabung!",
      },
    ],
  },
  {
    id: "2",
    emoji: "🏢",
    tag: "IKNB",
    durasi: "7 menit",
    judul: "Industri Keuangan Non-Bank (IKNB): Selain Bank Ada Apa Saja?",
    ringkasan: "Asuransi, pembiayaan, fintech, pegadaian, dan lembaga lain di luar bank — dijelaskan ringkas untuk SMA.",
    isi: [
      {
        type: "paragraph",
        text: "Industri Keuangan Non-Bank (IKNB) adalah lembaga jasa keuangan yang bukan bank, tapi tetap berperan penting di sistem keuangan. Mereka juga diawasi OJK. Kalau bank fokus simpan-pinjam, IKNB lebih beragam: proteksi risiko, pembiayaan barang, investasi kolektif, sampai layanan digital.",
      },
      { type: "heading", text: "Contoh Lembaga IKNB yang Sering Kamu Temui" },
      {
        type: "bullet",
        items: [
          "Asuransi: melindungi dari risiko (sakit, kecelakaan, kerugian). Kamu bayar premi, perusahaan asuransi menanggung klaim sesuai polis.",
          "Perusahaan pembiayaan (multifinance): membantu cicilan motor, elektronik, atau kebutuhan lain — bedakan dengan bank.",
          "Dana pensiun: mengelola dana untuk masa pensiun (lebih relevan nanti saat kerja).",
          "Perusahaan efek / manajer investasi: terkait pasar modal (saham, obligasi, reksa dana).",
          "Pegadaian: pinjaman dengan jaminan barang.",
          "Fintech lending / P2P: platform pinjam-meminjam digital (wajib berizin OJK!).",
          "Fintech payment / e-wallet: Dompet digital untuk bayar (juga ada aturan OJK/BI).",
        ],
      },
      { type: "heading", text: "Bank vs IKNB — Apa Bedanya?" },
      {
        type: "bullet",
        items: [
          "Bank: bisa menghimpun dana masyarakat secara luas (tabungan/giro/deposito) dan menyalurkan kredit.",
          "IKNB: biasanya fokus pada layanan spesifik (proteksi, pembiayaan, investasi, gadai, dll.).",
          "Keduanya penting: bank untuk transaksi harian; IKNB untuk proteksi dan kebutuhan khusus.",
        ],
      },
      { type: "heading", text: "Kenapa Pelajar Perlu Tahu IKNB?" },
      {
        type: "paragraph",
        text: "Karena banyak iklan pinjaman online, asuransi, dan “investasi” muncul di HP. Kalau kamu paham mana lembaga resmi dan mana yang berbahaya, kamu lebih sulit ditipu. Selalu cek status perizinan di situs OJK sebelum daftar atau transfer uang.",
      },
      {
        type: "highlight",
        text: "Waspada: pinjaman online ilegal sering minta akses kontak, bunga sangat tinggi, dan menagih kasar. Lembaga legal punya izin dan aturan main yang jelas.",
      },
      { type: "heading", text: "Contoh Situasi Sehari-hari" },
      {
        type: "bullet",
        items: [
          "Bayar jajan pakai e-wallet → layanan pembayaran digital (tetap jaga PIN).",
          "Orang tua beli asuransi kesehatan keluarga → contoh proteksi IKNB.",
          "Cicilan gadget lewat perusahaan pembiayaan → baca bunga & denda teliti.",
          "Nabung lewat reksa dana di aplikasi sekuritas berizin → masuk ranah pasar modal / manajer investasi.",
        ],
      },
      {
        type: "highlight",
        text: "Kesimpulan: dunia keuangan tidak hanya bank. IKNB melengkapi kebutuhan proteksi, pembiayaan, dan investasi — tapi selalu pilih yang berizin dan transparan.",
      },
    ],
  },
  {
    id: "3",
    emoji: "📚",
    tag: "Literasi",
    durasi: "8 menit",
    judul: "Literasi Keuangan: Skill Hidup yang Harus Dimiliki Generasi SMA",
    ringkasan: "Apa itu literasi keuangan, kenapa penting, dan 5 kemampuan dasar agar uangmu terkendali.",
    isi: [
      {
        type: "paragraph",
        text: "Literasi keuangan adalah kemampuan memahami konsep keuangan dan menerapkannya dalam keputusan sehari-hari: menabung, berbelanja, berutang, berinvestasi, dan melindungi diri dari risiko. Bukan hanya “pintar matematika uang”, tapi juga bijak secara perilaku.",
      },
      {
        type: "paragraph",
        text: "Menurut kerangka umum literasi keuangan, seseorang dianggap literat jika paham pengetahuan dasar, punya keterampilan mengelola uang, dan menunjukkan sikap/perilaku yang sehat (misalnya tidak konsumtif berlebihan).",
      },
      { type: "heading", text: "5 Pilar Literasi Keuangan untuk Pelajar" },
      {
        type: "bullet",
        items: [
          "1) Pengetahuan: tahu beda kebutuhan vs keinginan, inflasi, bunga, risiko.",
          "2) Perencanaan: punya tujuan uang (misal beli buku, kursus, HP) dan anggaran.",
          "3) Pengelolaan: catat pemasukan-pengeluaran, kontrol jajan.",
          "4) Perlindungan: waspada penipuan, jaga data pribadi, pahami asuransi dasar.",
          "5) Investasi dasar: paham konsep “uang bekerja” dengan risiko yang sesuai umur.",
        ],
      },
      { type: "heading", text: "Kebutuhan vs Keinginan" },
      {
        type: "paragraph",
        text: "Kebutuhan = hal yang menunjang hidup dan sekolah (makan, ongkos, alat tulis). Keinginan = hal yang menyenangkan tapi bisa ditunda (snack branded, skin game, nonton tiap minggu). Literasi dimulai dari kejujuran membedakan keduanya.",
      },
      { type: "heading", text: "Anggaran Sederhana untuk Uang Saku" },
      {
        type: "bullet",
        items: [
          "Rumus populer 50/30/20: 50% kebutuhan, 30% keinginan, 20% tabungan.",
          "Alternatif pelajar: 60% kebutuhan sekolah, 20% keinginan, 20% tabungan tujuan.",
          "Kunci sukses: sisihkan tabungan DULU, jangan dari “sisa” di akhir bulan.",
        ],
      },
      {
        type: "highlight",
        text: "Contoh: uang saku Rp 600.000 → tabungan Rp 120.000 dulu. Sisanya baru untuk ongkos, makan, dan hiburan. Dalam 10 bulan kamu punya Rp 1.200.000 tanpa “merasa dipaksa”.",
      },
      { type: "heading", text: "Perilaku yang Menunjukkan Literasi Baik" },
      {
        type: "bullet",
        items: [
          "Mencatat pengeluaran (meski singkat) setiap hari/minggu",
          "Membandingkan harga sebelum beli",
          "Tidak mudah tergoda “diskon palsu” atau FOMO",
          "Bertanya dulu ke orang tua/guru sebelum utang atau investasi",
          "Menolak ajakan judi online / skema get-rich-quick",
        ],
      },
      {
        type: "highlight",
        text: "Literasi keuangan = bebas finansial lebih awal. Semakin cepat kamu latihan mengelola uang saku, semakin siap kamu menghadapi kuliah dan kerja nanti.",
      },
    ],
  },
  {
    id: "4",
    emoji: "📈",
    tag: "Inflasi",
    durasi: "7 menit",
    judul: "Inflasi: Kenapa Harga Naik dan Apa Artinya buat Uang Sakumu?",
    ringkasan: "Pahami penyebab inflasi, cara mengukurnya, dampaknya ke pelajar, dan cara menghadapinya.",
    isi: [
      {
        type: "paragraph",
        text: "Inflasi adalah kenaikan harga barang dan jasa secara umum dalam jangka waktu tertentu. Akibatnya, daya beli uang menurun: Rp 20.000 hari ini mungkin tidak cukup untuk membeli sebanyak tahun lalu.",
      },
      {
        type: "paragraph",
        text: "Inflasi diukur antara lain lewat Indeks Harga Konsumen (IHK). Pemerintah dan Bank Indonesia memantau inflasi agar perekonomian stabil — terlalu tinggi merugikan masyarakat, terlalu rendah juga bisa jadi sinyal ekonomi lesu.",
      },
      { type: "heading", text: "Penyebab Inflasi (Versi Mudah)" },
      {
        type: "bullet",
        items: [
          "Demand-pull: permintaan naik lebih cepat dari pasokan (banyak orang belanja, barang terbatas).",
          "Cost-push: biaya produksi naik (BBM, bahan baku, upah) sehingga harga jual ikut naik.",
          "Uang beredar terlalu banyak: daya beli meningkat cepat, harga ikut melonjak.",
          "Faktor impor: pelemahan nilai tukar membuat barang impor lebih mahal.",
        ],
      },
      { type: "heading", text: "Dampak bagi Siswa SMA" },
      {
        type: "bullet",
        items: [
          "Harga jajan, fotokopi, dan transport naik → uang saku terasa “lebih kecil”.",
          "Tabungan tunai tanpa bunga memadai lambat laun berkurang daya belinya.",
          "Orang tua mungkin lebih ketat mengatur anggaran rumah tangga.",
        ],
      },
      {
        type: "highlight",
        text: "Ilustrasi: Inflasi 5%/tahun. Uang Rp 1.000.000 yang “diam” setahun daya belinya kira-kira setara Rp 950.000 di harga hari ini. Itu kenapa hanya menyimpan uang tanpa strategi bisa kalah dari inflasi.",
      },
      { type: "heading", text: "Siapa yang Mengendalikan Inflasi?" },
      {
        type: "paragraph",
        text: "Bank Indonesia bisa menaikkan suku bunga acuan untuk menahan laju inflasi (kredit jadi lebih mahal, orang cenderung mengurangi belanja berlebih). Pemerintah juga menjaga pasokan pangan dan energi agar harga tidak melonjak liar.",
      },
      { type: "heading", text: "Cara Pelajar Menghadapi Inflasi" },
      {
        type: "bullet",
        items: [
          "Catat pengeluaran agar tahu pos mana yang paling kena dampak kenaikan harga.",
          "Prioritaskan kebutuhan, tunda keinginan yang tidak mendesak.",
          "Mulai menabung rutin; pelajari investasi berisiko rendah untuk jangka panjang (dengan izin orang tua).",
          "Bandingkan harga dan manfaatkan promo yang benar-benar dibutuhkan — bukan FOMO.",
        ],
      },
      {
        type: "highlight",
        text: "Pesan penting: Inflasi normal itu wajar. Yang berbahaya adalah tidak sadar dampaknya. Literasi + menabung + investasi bijak = cara melindungi masa depan uangmu.",
      },
    ],
  },
  {
    id: "5",
    emoji: "📊",
    tag: "Investasi",
    durasi: "9 menit",
    judul: "Instrumen Investasi: Saham, Obligasi, dan Reksa Dana",
    ringkasan: "Kenali tiga instrumen dasar pasar modal: cara kerja, risiko, dan mana yang cocok untuk pemula.",
    isi: [
      {
        type: "paragraph",
        text: "Investasi artinya menempatkan uang pada suatu aset dengan harapan mendapat hasil di masa depan. Di pasar modal, tiga instrumen yang paling sering dipelajari pemula adalah saham, obligasi, dan reksa dana. Semuanya diatur dan diawasi — jangan dicampur dengan judi atau skema ilegal.",
      },
      { type: "heading", text: "1) Saham" },
      {
        type: "paragraph",
        text: "Saham adalah tanda kepemilikan sebagian kecil perusahaan. Kalau perusahaan tumbuh, harga saham berpotensi naik (capital gain). Beberapa perusahaan juga membagikan dividen. Tapi harga saham bisa turun — bahkan tajam — dalam waktu singkat.",
      },
      {
        type: "bullet",
        items: [
          "Potensi imbal hasil: relatif tinggi jangka panjang",
          "Risiko: tinggi (harga fluktuatif)",
          "Cocok untuk: yang sudah paham dasar analisis & siap menahan naik-turun",
          "Untuk pelajar: lebih baik belajar dulu, jangan FOMO “saham viral”",
        ],
      },
      { type: "heading", text: "2) Obligasi" },
      {
        type: "paragraph",
        text: "Obligasi adalah surat utang. Kamu “meminjamkan” uang ke penerbit (pemerintah atau perusahaan). Sebagai imbalan, kamu dapat kupon/bunga berkala, dan pokok biasanya dikembalikan saat jatuh tempo. Obligasi pemerintah (misalnya SBN ritel) umumnya dianggap lebih aman daripada saham, tapi tetap ada risiko (misalnya suku bunga pasar berubah).",
      },
      {
        type: "bullet",
        items: [
          "Potensi imbal hasil: sedang, cenderung lebih stabil dari saham",
          "Risiko: lebih rendah dari saham (tergantung penerbit)",
          "Cocok untuk: tujuan menengah dengan profil risiko lebih tenang",
        ],
      },
      { type: "heading", text: "3) Reksa Dana" },
      {
        type: "paragraph",
        text: "Reksa dana mengumpulkan uang banyak investor, lalu dikelola manajer investasi ke portofolio (pasar uang, obligasi, saham, atau campuran). Kamu tidak perlu pilih saham satu per satu. Modal awal sering bisa sangat kecil.",
      },
      {
        type: "bullet",
        items: [
          "Reksa dana pasar uang: risiko relatif rendah, cocok parkir dana jangka pendek",
          "Reksa dana pendapatan tetap: fokus obligasi",
          "Reksa dana saham: berpotensi tinggi, risiko lebih tinggi",
          "Reksa dana campuran: kombinasi beberapa aset",
        ],
      },
      {
        type: "highlight",
        text: "Untuk banyak pelajar pemula, reksa dana pasar uang sering jadi pintu masuk paling masuk akal: mudah dipahami, risiko lebih terkendali, dan melatih disiplin investasi.",
      },
      { type: "heading", text: "Prinsip Emas sebelum Investasi" },
      {
        type: "bullet",
        items: [
          "Punya dana darurat / tabungan tujuan dulu (jangan investasikan uang yang sebentar lagi dipakai).",
          "Investasi ≠ judi. Hindari janji “untung pasti” dan tekanan transfer cepat.",
          "Diversifikasi: jangan taruh semua uang di satu tempat.",
          "Pakai platform berizin OJK; pelajari biaya dan risiko produk.",
          "Diskusikan dengan orang tua — terutama jika masih di bawah umur / belum mandiri secara hukum.",
        ],
      },
      {
        type: "highlight",
        text: "Ringkas: Saham = kepemilikan (risiko tinggi). Obligasi = utang berbunga (risiko sedang-rendah). Reksa dana = investasi kolektif dikelola profesional (pilihan bertingkat risiko). Pahami dulu, baru mulai kecil.",
      },
    ],
  },
  {
    id: "6",
    emoji: "⚖️",
    tag: "Risiko",
    durasi: "7 menit",
    judul: "Profil Risiko: Kenali Diri sebelum Memilih Investasi",
    ringkasan: "Konservatif, moderat, atau agresif? Pelajari cara menyesuaikan produk dengan kenyamananmu.",
    isi: [
      {
        type: "paragraph",
        text: "Profil risiko adalah gambaran seberapa besar kamu mampu dan mau menghadapi kemungkinan kerugian saat berinvestasi. Dua orang dengan uang sama bisa pilih produk berbeda, karena toleransi risikonya berbeda.",
      },
      {
        type: "paragraph",
        text: "Di aplikasi investasi, biasanya ada kuesioner profil risiko. Jawabannya membantu menyarankan produk yang lebih cocok — bukan untuk “menebak nasib”, tapi agar kamu tidak stres saat harga naik-turun.",
      },
      { type: "heading", text: "Tiga Profil Umum" },
      {
        type: "bullet",
        items: [
          "Konservatif: mengutamakan keamanan dana. Tidak nyaman jika nilai investasi turun. Cocok ke tabungan/deposito/reksa dana pasar uang.",
          "Moderat: siap fluktuasi ringan demi potensi hasil lebih baik. Cocok campuran (obligasi + sebagian saham / reksa dana campuran).",
          "Agresif: siap naik-turun tajam demi potensi jangka panjang lebih tinggi. Lebih ke saham / reksa dana saham — dengan pemahaman matang.",
        ],
      },
      { type: "heading", text: "Faktor yang Membentuk Profil Risiko" },
      {
        type: "bullet",
        items: [
          "Usia & tanggung jawab: pelajar biasanya punya horizon panjang, tapi modal terbatas.",
          "Tujuan keuangan: beli HP 6 bulan lagi ≠ dana kuliah 5 tahun lagi.",
          "Pengetahuan: semakin paham instrumen, semakin siap mengelola risiko.",
          "Kondisi emosional: jika panik jual saat turun, berarti risiko terlalu tinggi untukmu.",
          "Kebutuhan likuiditas: seberapa cepat uang harus bisa dicairkan.",
        ],
      },
      {
        type: "highlight",
        text: "Aturan praktis: semakin dekat tujuan (misal 3 bulan lagi bayar kursus), semakin rendah risiko yang boleh diambil. Semakin jauh tujuan, semakin longgar ruang untuk aset berfluktuasi.",
      },
      { type: "heading", text: "Hubungan Risiko dan Imbal Hasil" },
      {
        type: "paragraph",
        text: "Umumnya: potensi untung tinggi datang bersama risiko tinggi. Tidak ada investasi legal yang “untung besar tanpa risiko”. Kalau ada yang menjanjikan itu, waspada penipuan.",
      },
      { type: "heading", text: "Contoh untuk Siswa SMA" },
      {
        type: "bullet",
        items: [
          "Uang jajan minggu ini → jangan diinvestasikan di saham.",
          "Tabungan beli laptop tahun depan → pilih instrumen relatif aman & likuid.",
          "Tabungan jangka panjang (dengan izin orang tua) → bisa pelajari reksa dana sesuai profil.",
        ],
      },
      {
        type: "highlight",
        text: "Profil risiko bisa berubah seiring usia, penghasilan, dan pengalaman. Review berkala. Investasi yang baik adalah yang kamu pahami dan mampu tahan fluktuasinya.",
      },
    ],
  },
  {
    id: "7",
    emoji: "🛡️",
    tag: "OJK",
    durasi: "8 menit",
    judul: "OJK dan Lembaga Jasa Keuangan: Siapa Melindungi Konsumen?",
    ringkasan: "Pahami peran OJK, BI, LPS, dan cara cek lembaga resmi agar tidak tertipu.",
    isi: [
      {
        type: "paragraph",
        text: "Sistem keuangan Indonesia punya beberapa lembaga penting. Yang paling sering disebut konsumen adalah OJK (Otoritas Jasa Keuangan). OJK mengatur dan mengawasi lembaga jasa keuangan di sektor perbankan, pasar modal, dan IKNB, serta melindungi konsumen.",
      },
      { type: "heading", text: "Apa Tugas OJK?" },
      {
        type: "bullet",
        items: [
          "Memberi izin usaha kepada lembaga jasa keuangan",
          "Mengawasi perilaku industri agar sehat dan transparan",
          "Melindungi konsumen (edukasi, pengaduan, penindakan praktik merugikan)",
          "Mendorong literasi dan inklusi keuangan masyarakat",
        ],
      },
      { type: "heading", text: "Lembaga Lain yang Perlu Dikenal" },
      {
        type: "bullet",
        items: [
          "Bank Indonesia (BI): bank sentral — kebijakan moneter, rupiah, sistem pembayaran (termasuk QRIS).",
          "LPS (Lembaga Penjamin Simpanan): menjamin simpanan nasabah bank sesuai ketentuan.",
          "Kementerian Keuangan / pemerintah: kebijakan fiskal, SBN, dll.",
          "Bursa & lembaga pasar modal: infrastruktur perdagangan efek (dengan pengawasan OJK).",
        ],
      },
      { type: "heading", text: "Apa Itu Lembaga Jasa Keuangan (LJK)?" },
      {
        type: "paragraph",
        text: "LJK adalah pelaku yang menyediakan jasa keuangan: bank, asuransi, perusahaan efek, manajer investasi, pembiayaan, fintech berizin, dan lainnya. Kalau kamu menabung, bayar premi, atau beli reksa dana, kamu sedang berurusan dengan LJK.",
      },
      { type: "heading", text: "Cara Melindungi Diri (Checklist Pelajar)" },
      {
        type: "bullet",
        items: [
          "Cek nama perusahaan di kanal resmi OJK (status berizin / terdaftar).",
          "Curigai iming-iming “untung pasti”, “tanpa risiko”, atau “dobel uang sekejap”.",
          "Jangan serahkan OTP, PIN, atau foto KTP sembarangan.",
          "Simpan bukti transaksi dan baca syarat produk sebelum klik setuju.",
          "Laporkan dugaan ilegal lewat kanal pengaduan yang sah (OJK / pihak berwenang).",
        ],
      },
      {
        type: "highlight",
        text: "Ingat: OJK tidak menjual produk investasi pribadi lewat DM. Petugas resmi tidak meminta transfer ke rekening pribadi. Jika ragu, hentikan komunikasi dan konfirmasi lewat kanal resmi.",
      },
      { type: "heading", text: "Hak Konsumen Keuangan" },
      {
        type: "bullet",
        items: [
          "Hak mendapat informasi yang jelas dan tidak menyesatkan",
          "Hak memilih produk sesuai kebutuhan",
          "Hak mendapat layanan yang adil",
          "Hak menyampaikan pengaduan dan mendapat penyelesaian",
        ],
      },
      {
        type: "highlight",
        text: "Kesimpulan: OJK dan lembaga terkait menjaga agar industri keuangan berjalan sehat. Tugasmu: jadi konsumen cerdas — cek izin, paham produk, jaga data pribadi.",
      },
    ],
  },
  {
    id: "8",
    emoji: "🎯",
    tag: "Prioritas",
    durasi: "7 menit",
    judul: "Skala Prioritas Keuangan: Atur Uang dari yang Paling Penting",
    ringkasan: "Belajar menyusun prioritas kebutuhan, keinginan, dan tujuan agar uang saku tidak kacau.",
    isi: [
      {
        type: "paragraph",
        text: "Skala prioritas keuangan adalah cara menyusun urutan pengeluaran dan tujuan dari yang paling penting sampai yang bisa ditunda. Tanpa prioritas, uang saku cepat habis untuk hal kecil, sementara kebutuhan penting terabaikan.",
      },
      { type: "heading", text: "Kerangka Prioritas Sederhana" },
      {
        type: "bullet",
        items: [
          "Prioritas 1 — Wajib hidup & sekolah: makan, ongkos, alat belajar, kewajiban yang tidak bisa ditunda.",
          "Prioritas 2 — Tabungan tujuan: dana untuk target jelas (buku, kursus, HP, kuliah).",
          "Prioritas 3 — Keamanan: sedikit cadangan untuk keadaan mendadak (uang “jaga-jaga”).",
          "Prioritas 4 — Keinginan: hiburan, jajan tambahan, barang tren.",
          "Prioritas 5 — Investasi (opsional, setelah 1–3 aman): mulai kecil sesuai profil risiko & izin orang tua.",
        ],
      },
      {
        type: "highlight",
        text: "Urutan emas: Bayar kebutuhan → sisihkan tabungan → baru hiburan. Kalau dibalik (hiburan dulu), tabungan hampir selalu kalah.",
      },
      { type: "heading", text: "Matriks Mendesak vs Penting" },
      {
        type: "paragraph",
        text: "Tidak semua yang mendesak itu penting, dan tidak semua yang penting terasa mendesak hari ini. Contoh: notifikasi flash sale terasa mendesak, tapi sering tidak penting. Sebaliknya, menabung untuk daftar ulang tahun depan penting, walau tidak “mendesak” hari ini.",
      },
      {
        type: "bullet",
        items: [
          "Penting + mendesak: bayar tugas/print yang deadline-nya besok.",
          "Penting + tidak mendesak: nabung tujuan, belajar literasi, rawat kesehatan.",
          "Tidak penting + mendesak: diskon barang yang tidak kamu butuhkan.",
          "Tidak penting + tidak mendesak: scroll belanja tanpa tujuan.",
        ],
      },
      { type: "heading", text: "Latihan Praktis Minggu Ini" },
      {
        type: "bullet",
        items: [
          "Tulis 5 pengeluaran terbesar minggu lalu.",
          "Tandai masing-masing: kebutuhan / keinginan / impuls.",
          "Tentukan 1 tujuan tabungan (nominal + tanggal target).",
          "Potong 1 pengeluaran keinginan yang paling boros, alihkan ke tabungan.",
        ],
      },
      { type: "heading", text: "Contoh Keputusan Sehari-hari" },
      {
        type: "paragraph",
        text: "Teman ajak nongkrong mahal, sementara minggu ini ada biaya fotokopi ujian. Prioritas bilang: kurangi porsi nongkrong atau pilih tempat lebih murah. Bukan berarti tidak boleh senang — tapi senang setelah kewajiban terpenuhi.",
      },
      {
        type: "highlight",
        text: "Skala prioritas melatih kedewasaan finansial. Semakin konsisten kamu mengurutkan “penting dulu”, semakin tenang mengelola uang — sekarang maupun nanti.",
      },
    ],
  },
];

export type SoalKuis = {
  soal: string;
  pilihan: string[];
  jawaban: number;
  penjelasan: string;
};

export const SOAL_KUIS: Record<string, SoalKuis[]> = {
  // Perbankan — 4 sulit + 1 sedang (#3)
  "1": [
    {
      soal:
        "Seorang pelajar memilih produk deposito berbunga sangat tinggi di lembaga yang mengaku “bank digital baru”, tapi tidak terdaftar sebagai bank dan bunganya jauh di atas batas LPS. Keputusan paling tepat?",
      pilihan: [
        "Ambil saja karena bunganya menguntungkan",
        "Hindari; indikasi produk/lembaga tidak aman dan berisiko gagal bayar",
        "Pindahkan semua tabungan ke sana agar cepat kaya",
        "Cukup minta surat perjanjian dari teman yang merekomendasikan",
      ],
      jawaban: 1,
      penjelasan:
        "Bunga ekstrem + lembaga tidak jelas adalah sinyal bahaya. Simpanan aman biasanya di bank resmi peserta LPS dengan ketentuan yang wajar.",
    },
    {
      soal:
        "Fungsi bank sebagai financial intermediary paling tepat digambarkan sebagai…",
      pilihan: [
        "Mencetak uang kertas untuk masyarakat",
        "Menyalurkan pajak langsung ke pemerintah daerah",
        "Menghubungkan pihak yang punya kelebihan dana dengan pihak yang membutuhkan dana",
        "Menetapkan harga barang di pasar tradisional",
      ],
      jawaban: 2,
      penjelasan:
        "Bank menghimpun simpanan lalu menyalurkannya sebagai kredit/pembiayaan — itulah peran perantara keuangan.",
    },
    {
      soal: "Produk bank yang paling umum dipakai pelajar untuk menyimpan uang sehari-hari adalah…",
      pilihan: ["Deposito jangka panjang", "Tabungan", "Obligasi korporasi", "Saham blue chip"],
      jawaban: 1,
      penjelasan: "Tabungan fleksibel untuk setor-tarik dan transaksi harian pelajar.",
    },
    {
      soal:
        "Jika suku bunga acuan Bank Indonesia naik, dampak yang paling mungkin terjadi pada kredit bank adalah…",
      pilihan: [
        "Kredit otomatis dihapus untuk semua nasabah",
        "Bunga kredit cenderung naik sehingga pinjaman menjadi lebih mahal",
        "Semua tabungan berubah menjadi deposito",
        "Nilai tukar rupiah pasti tidak terpengaruh sama sekali",
      ],
      jawaban: 1,
      penjelasan:
        "Kenaikan suku bunga acuan biasanya mendorong bunga kredit naik, sehingga biaya pinjaman lebih mahal.",
    },
    {
      soal:
        "Mana pernyataan yang PALING BENAR tentang keamanan rekening bank?",
      pilihan: [
        "OTP boleh dibagikan ke “customer service” yang menelepon duluan",
        "PIN dan OTP bersifat rahasia; petugas bank resmi tidak meminta OTP via telepon",
        "Screenshot saldo boleh diposting publik agar terlihat kaya",
        "Rekening atas nama orang lain lebih aman daripada rekening sendiri",
      ],
      jawaban: 1,
      penjelasan:
        "OTP/PIN adalah kunci akses. Bank resmi tidak meminta OTP melalui telepon yang tidak diminta nasabah.",
    },
  ],

  // IKNB — 4 sulit + 1 sedang (#2)
  "2": [
    {
      soal:
        "Perbedaan mendasar bank dan perusahaan pembiayaan (multifinance) adalah…",
      pilihan: [
        "Keduanya sama-sama boleh menghimpun tabungan masyarakat secara luas",
        "Bank menghimpun dana masyarakat (mis. tabungan); pembiayaan fokus menyalurkan pembiayaan/cicilan tanpa fungsi tabungan seperti bank",
        "Pembiayaan bisa mencetak uang, bank tidak",
        "Bank hanya melayani perusahaan besar, pembiayaan hanya pelajar",
      ],
      jawaban: 1,
      penjelasan:
        "Bank punya fungsi menghimpun dana masyarakat; IKNB seperti multifinance fokus layanan pembiayaan tertentu.",
    },
    {
      soal: "Contoh lembaga yang termasuk Industri Keuangan Non-Bank (IKNB) adalah…",
      pilihan: ["Bank umum saja", "Asuransi dan pegadaian", "Pasar tradisional", "Kantor pos tanpa layanan keuangan"],
      jawaban: 1,
      penjelasan: "Asuransi, pegadaian, pembiayaan, dan banyak fintech berizin masuk kategori IKNB.",
    },
    {
      soal:
        "Platform pinjaman online yang meminta akses seluruh kontak HP, bunga sangat tinggi, dan tidak berizin OJK paling tepat dikategorikan sebagai…",
      pilihan: [
        "Layanan bank digital resmi",
        "Produk asuransi jiwa",
        "Pinjaman ilegal / berisiko tinggi yang harus dihindari",
        "Reksa dana pasar uang",
      ],
      jawaban: 2,
      penjelasan:
        "Ciri pinjol ilegal: tanpa izin, bunga ekstrem, akses data berlebihan, dan praktik penagihan yang merugikan.",
    },
    {
      soal:
        "Premi asuransi dibayar nasabah. Fungsi utama premi dalam konteks proteksi adalah…",
      pilihan: [
        "Membeli saham perusahaan asuransi setiap bulan",
        "Membayar iuran agar risiko tertentu dialihkan sesuai polis jika terjadi klaim",
        "Menjamin untung investasi pasti 100%",
        "Mengganti semua utang pribadi secara otomatis",
      ],
      jawaban: 1,
      penjelasan:
        "Premi adalah biaya proteksi. Klaim dibayar sesuai syarat polis, bukan jaminan untung investasi.",
    },
    {
      soal:
        "Manajer investasi yang mengelola reksa dana berada dalam ekosistem…",
      pilihan: [
        "Hanya koperasi sekolah",
        "Pasar modal / IKNB terkait investasi kolektif yang diawasi OJK",
        "Bank sentral yang mencetak uang",
        "Lembaga penjamin simpanan untuk semua jenis aset digital",
      ],
      jawaban: 1,
      penjelasan:
        "Manajer investasi mengelola dana kolektif (reksa dana) di bawah pengawasan OJK di sektor jasa keuangan/pasar modal.",
    },
  ],

  // Literasi Keuangan — 4 sulit + 1 mudah (#1)
  "3": [
    {
      soal: "Literasi keuangan paling tepat diartikan sebagai…",
      pilihan: [
        "Kemampuan menghafal rumus matematika saja",
        "Kemampuan memahami konsep keuangan dan menerapkannya dalam keputusan sehari-hari",
        "Kemampuan membelanjakan semua uang saku dalam sehari",
        "Kemampuan menebak harga saham besok",
      ],
      jawaban: 1,
      penjelasan:
        "Literasi = pengetahuan + keterampilan + perilaku mengelola uang dengan bijak.",
    },
    {
      soal:
        "Seorang siswa menabung hanya dari “sisa” uang saku di akhir bulan, dan hampir selalu tidak ada sisa. Kelemahan utamanya menurut prinsip literasi adalah…",
      pilihan: [
        "Ia terlalu sering mencatat pengeluaran",
        "Ia tidak memprioritaskan tabungan di awal (pay yourself first)",
        "Ia memakai rumus 50/30/20 dengan terlalu ketat",
        "Ia membedakan kebutuhan dan keinginan terlalu jelas",
      ],
      jawaban: 1,
      penjelasan:
        "Menabung dari sisa biasanya gagal. Lebih baik sisihkan tabungan dulu sebelum belanja.",
    },
    {
      soal:
        "Mana yang termasuk indikator perilaku literat secara keuangan?",
      pilihan: [
        "Membeli barang hanya karena FOMO flash sale",
        "Membagikan OTP ke teman agar dibantu transfer",
        "Membandingkan harga dan menolak skema “untung pasti”",
        "Mengambil pinjaman online ilegal untuk gaya hidup",
      ],
      jawaban: 2,
      penjelasan:
        "Perilaku literat: kritis, hati-hati, dan tidak mudah tergoda janji palsu atau tekanan sosial belanja.",
    },
    {
      soal:
        "Dalam kerangka literasi, “perlindungan” mencakup kemampuan…",
      pilihan: [
        "Mengabaikan risiko penipuan karena sudah punya banyak uang",
        "Menjaga data pribadi, waspada fraud, dan memahami proteksi dasar",
        "Menginvestasikan seluruh uang di satu aset spekulatif",
        "Menghapus semua catatan pengeluaran agar tidak stres",
      ],
      jawaban: 1,
      penjelasan:
        "Pilar perlindungan fokus pada keamanan data, anti-penipuan, dan pemahaman proteksi risiko.",
    },
    {
      soal:
        "Uang saku Rp 800.000. Siswa memakai skema 50/30/20. Alokasi tabungan yang sesuai adalah…",
      pilihan: ["Rp 80.000", "Rp 160.000", "Rp 240.000", "Rp 400.000"],
      jawaban: 1,
      penjelasan: "20% dari Rp 800.000 = Rp 160.000 untuk tabungan.",
    },
  ],

  // Inflasi — 4 sulit + 1 sedang (#4)
  "4": [
    {
      soal:
        "Jika inflasi tahunan 6% sementara bunga tabungan efektif hanya 2%, makna paling akurat bagi daya beli tabungan adalah…",
      pilihan: [
        "Daya beli tabungan naik 8%",
        "Daya beli riil cenderung turun karena inflasi lebih tinggi dari bunga",
        "Tabungan otomatis digandakan pemerintah",
        "Inflasi tidak memengaruhi uang di bank",
      ],
      jawaban: 1,
      penjelasan:
        "Jika imbal hasil < inflasi, nilai riil (daya beli) uang cenderung tergerus.",
    },
    {
      soal:
        "Inflasi jenis cost-push paling dekat dijelaskan oleh situasi…",
      pilihan: [
        "Semua orang tiba-tiba menabung dan tidak belanja",
        "Biaya BBM dan bahan baku naik sehingga produsen menaikkan harga jual",
        "Pemerintah memotong pajak tanpa alasan",
        "Harga turun karena oversupply barang",
      ],
      jawaban: 1,
      penjelasan:
        "Cost-push: tekanan dari sisi biaya produksi yang mendorong harga naik.",
    },
    {
      soal:
        "Bank Indonesia menaikkan suku bunga acuan untuk mengendalikan inflasi. Mekanisme yang paling masuk akal adalah…",
      pilihan: [
        "Kredit jadi lebih mahal → belanja berlebih cenderung berkurang → tekanan harga mereda",
        "Semua harga barang langsung ditetapkan turun 50%",
        "Uang tunai di rumah otomatis bertambah",
        "Bank dilarang menerima tabungan",
      ],
      jawaban: 0,
      penjelasan:
        "Suku bunga naik menahan permintaan agregat lewat kredit yang lebih mahal, membantu menekan inflasi.",
    },
    {
      soal: "Indeks yang sering dipakai untuk mengukur inflasi harga konsumen adalah…",
      pilihan: ["IHK (Indeks Harga Konsumen)", "IHSG saja", "Nilai tukar kripto", "Jumlah follower medsos"],
      jawaban: 0,
      penjelasan: "IHK mengukur perubahan harga sekelompok barang/jasa konsumsi masyarakat.",
    },
    {
      soal:
        "Bagi siswa SMA, dampak inflasi yang paling langsung terasa biasanya…",
      pilihan: [
        "Harga jajan, ongkos, dan alat tulis naik sehingga uang saku terasa lebih kecil",
        "Semua utang otomatis lunas",
        "Gaji tetap naik dua kali lipat setiap minggu",
        "Tabungan tunai selalu lebih berharga tanpa strategi apa pun",
      ],
      jawaban: 0,
      penjelasan:
        "Inflasi menaikkan harga kebutuhan sehari-hari pelajar dan mengurangi daya beli uang saku.",
    },
  ],

  // Instrumen Investasi — 4 sulit + 1 sedang (#3)
  "5": [
    {
      soal:
        "Perbedaan paling tepat antara saham dan obligasi adalah…",
      pilihan: [
        "Saham = kepemilikan perusahaan; obligasi = surat utang dengan potensi kupon",
        "Saham selalu tanpa risiko; obligasi selalu rugi",
        "Obligasi = kepemilikan perusahaan; saham = pinjaman ke teman",
        "Keduanya identik dan tidak bisa dibedakan",
      ],
      jawaban: 0,
      penjelasan:
        "Saham menandai kepemilikan; obligasi adalah instrumen utang yang memberi kupon/bunga.",
    },
    {
      soal:
        "Reksa dana disebut cocok untuk banyak pemula karena…",
      pilihan: [
        "Dikelola manajer investasi secara kolektif sehingga tidak harus pilih saham satu per satu",
        "Menjamin keuntungan pasti tanpa risiko",
        "Tidak diawasi lembaga mana pun",
        "Hanya bisa dibeli dengan modal miliaran",
      ],
      jawaban: 0,
      penjelasan:
        "Reksa dana adalah investasi kolektif yang dikelola profesional, dengan berbagai tingkat risiko.",
    },
    {
      soal: "Instrumen yang umumnya paling berfluktuasi di antara pilihan berikut adalah…",
      pilihan: ["Deposito bank", "Saham", "Uang tunai di bawah bantal", "Tabungan biasa tanpa investasi"],
      jawaban: 1,
      penjelasan: "Harga saham bisa naik-turun tajam dalam waktu singkat dibanding deposito atau tabungan.",
    },
    {
      soal:
        "Seseorang butuh uang untuk bayar kursus 2 bulan lagi. Alasan menaruh hampir semua dana itu di saham individual berisiko tinggi kurang tepat karena…",
      pilihan: [
        "Saham tidak pernah bisa dijual",
        "Horizon waktu pendek tidak cocok dengan aset berfluktuasi tinggi",
        "Saham selalu lebih aman dari tabungan",
        "Kursus tidak boleh dibiayai dari uang sendiri",
      ],
      jawaban: 1,
      penjelasan:
        "Tujuan jangka pendek membutuhkan likuiditas dan stabilitas lebih tinggi, bukan fluktuasi saham.",
    },
    {
      soal:
        "Janji “investasi legal, untung 30% per bulan tanpa risiko” paling tepat direspons dengan…",
      pilihan: [
        "Segera transfer agar tidak kehabisan kuota",
        "Waspada penipuan; investasi legal selalu punya risiko dan tidak menjanjikan kepastian seperti itu",
        "Percaya karena banyak testimoni di grup chat",
        "Pinjam uang teman untuk ikut sebanyak-banyaknya",
      ],
      jawaban: 1,
      penjelasan:
        "Imbal hasil ekstrem + tanpa risiko adalah ciri tipikal skema ilegal/penipuan.",
    },
  ],

  // Profil Risiko — 4 sulit + 1 sedang (#1)
  "6": [
    {
      soal: "Profil risiko investasi menggambarkan…",
      pilihan: [
        "Seberapa besar seseorang mampu dan mau menghadapi kemungkinan kerugian",
        "Jumlah follower di aplikasi trading",
        "Nama bank tempat menabung saja",
        "Harga emas dunia hari ini",
      ],
      jawaban: 0,
      penjelasan:
        "Profil risiko = toleransi dan kapasitas menghadapi fluktuasi/kerugian investasi.",
    },
    {
      soal:
        "Investor konservatif yang panik setiap nilai portofolio turun 2% sebaiknya…",
      pilihan: [
        "Memindahkan hampir semua dana ke aset berfluktuasi tinggi agar “cepat balik modal”",
        "Memilih instrumen lebih stabil sesuai kenyamanannya (mis. pasar uang/deposito) dan review tujuan",
        "Mengabaikan sama sekali prinsip diversifikasi",
        "Mengikuti tip saham viral tanpa riset",
      ],
      jawaban: 1,
      penjelasan:
        "Produk harus selaras dengan toleransi risiko. Jika mudah panik, turunkan eksposur fluktuasi.",
    },
    {
      soal:
        "Hubungan umum antara risiko dan imbal hasil yang paling benar adalah…",
      pilihan: [
        "Risiko tinggi selalu menjamin untung besar tanpa kemungkinan rugi",
        "Potensi imbal hasil tinggi biasanya datang bersama risiko yang lebih tinggi",
        "Risiko dan imbal hasil tidak pernah berhubungan",
        "Semakin aman aset, semakin tinggi jaminan keuntungan spekulatif",
      ],
      jawaban: 1,
      penjelasan:
        "Trade-off klasik: potensi return tinggi beriringan dengan risiko lebih besar.",
    },
    {
      soal:
        "Siswa A butuh dana 4 bulan lagi; Siswa B menabung untuk 6 tahun ke depan. Pernyataan paling tepat?",
      pilihan: [
        "Keduanya wajib 100% saham agresif",
        "Siswa A sebaiknya lebih konservatif; Siswa B punya ruang lebih besar untuk aset berfluktuasi (sesuai profil)",
        "Siswa B tidak boleh investasi apa pun",
        "Horizon waktu tidak relevan dalam memilih instrumen",
      ],
      jawaban: 1,
      penjelasan:
        "Semakin dekat tujuan, semakin penting stabilitas. Horizon panjang memberi ruang fluktuasi.",
    },
    {
      soal:
        "Kuesioner profil risiko di aplikasi investasi utamanya bertujuan…",
      pilihan: [
        "Memaksa semua orang beli produk paling berisiko",
        "Membantu menyelaraskan rekomendasi produk dengan kenyamanan dan kapasitas risiko investor",
        "Menggantikan peran OJK sepenuhnya",
        "Menjamin tidak ada kerugian selamanya",
      ],
      jawaban: 1,
      penjelasan:
        "Hasil kuesioner membantu kecocokan produk dengan profil, bukan menghapus risiko.",
    },
  ],

  // OJK & LJK — 4 sulit + 1 sedang (#5)
  "7": [
    {
      soal:
        "Peran utama OJK dalam sistem keuangan Indonesia mencakup…",
      pilihan: [
        "Mencetak uang kertas setiap hari",
        "Mengatur, mengawasi LJK, serta melindungi konsumen jasa keuangan",
        "Menetapkan harga sembako di pasar",
        "Mengelola semua rekening pribadi warga secara otomatis",
      ],
      jawaban: 1,
      penjelasan:
        "OJK fokus regulasi & pengawasan lembaga jasa keuangan serta perlindungan konsumen.",
    },
    {
      soal:
        "Seseorang mengaku petugas OJK via chat dan meminta transfer “biaya aktivasi” ke rekening pribadi. Tindakan benar?",
      pilihan: [
        "Transfer sebagian dulu sebagai tanda jadi",
        "Hentikan; OJK tidak meminta transfer ke rekening pribadi seperti itu — verifikasi lewat kanal resmi",
        "Kirim foto KTP + OTP agar proses cepat",
        "Ajak teman ikut transfer supaya dapat bonus",
      ],
      jawaban: 1,
      penjelasan:
        "Modus penipuan sering menyamar lembaga resmi. Jangan transfer ke rekening pribadi dan jangan bagikan OTP.",
    },
    {
      soal:
        "Bank Indonesia paling tepat dikaitkan dengan tugas…",
      pilihan: [
        "Mengawasi semua perusahaan asuransi secara tunggal tanpa OJK",
        "Kebijakan moneter, kestabilan rupiah, dan sistem pembayaran",
        "Menjamin semua investasi saham bebas risiko",
        "Menjual produk reksa dana ke pelajar",
      ],
      jawaban: 1,
      penjelasan:
        "BI adalah bank sentral: moneter, rupiah, dan sistem pembayaran (mis. QRIS).",
    },
    {
      soal:
        "LPS berperan penting karena…",
      pilihan: [
        "Menjamin simpanan nasabah bank sesuai ketentuan yang berlaku",
        "Menjamin semua trading crypto",
        "Menghapus inflasi setiap tahun",
        "Memberi kredit tanpa bunga kepada semua warga",
      ],
      jawaban: 0,
      penjelasan:
        "LPS menjamin simpanan di bank peserta sesuai aturan (batas & syarat tertentu).",
    },
    {
      soal: "Lembaga Jasa Keuangan (LJK) contohnya adalah…",
      pilihan: ["Warung kelontong", "Bank dan perusahaan asuransi berizin", "Komunitas game online", "Kelas olahraga sekolah"],
      jawaban: 1,
      penjelasan: "LJK menyediakan jasa keuangan resmi seperti bank, asuransi, sekuritas, dll.",
    },
  ],

  // Skala Prioritas — 4 sulit + 1 mudah (#2)
  "8": [
    {
      soal:
        "Urutan prioritas keuangan yang paling sehat untuk pelajar umumnya…",
      pilihan: [
        "Hiburan dulu → utang gaya hidup → baru kebutuhan",
        "Kebutuhan wajib → tabungan tujuan → baru keinginan/hiburan",
        "Investasi spekulatif dulu dengan seluruh uang saku",
        "Keinginan viral dulu agar tidak ketinggalan tren",
      ],
      jawaban: 1,
      penjelasan:
        "Prioritas sehat: penuhi yang wajib, sisihkan tujuan, baru hiburan.",
    },
    {
      soal: "Membeli alat tulis untuk ujian minggu depan paling tepat masuk kategori…",
      pilihan: ["Keinginan murni", "Kebutuhan/prioritas tinggi terkait sekolah", "Investasi saham", "Biaya yang harus dihindari"],
      jawaban: 1,
      penjelasan: "Keperluan sekolah yang mendesak adalah prioritas kebutuhan.",
    },
    {
      soal:
        "Notifikasi “flash sale sisa 2 menit” untuk barang yang tidak dibutuhkan adalah contoh…",
      pilihan: [
        "Penting dan mendesak secara objektif",
        "Terasa mendesak tetapi sering tidak penting — jebakan impuls",
        "Kewajiban keuangan yang wajib dibayar",
        "Dana darurat yang harus dicairkan",
      ],
      jawaban: 1,
      penjelasan:
        "Banyak promo membuat kesan mendesak padahal tidak penting bagi keuanganmu.",
    },
    {
      soal:
        "Siswa punya target nabung laptop 10 bulan lagi, tapi tiap minggu menghabiskan uang untuk snack branded. Evaluasi skala prioritas yang tepat?",
      pilihan: [
        "Sudah optimal karena snack adalah investasi",
        "Perlu menaikkan porsi tabungan tujuan dan memangkas keinginan yang berulang",
        "Hapus semua kebutuhan makan agar tabungan naik",
        "Ambil pinjol ilegal agar laptop bisa dibeli minggu ini",
      ],
      jawaban: 1,
      penjelasan:
        "Keinginan berulang menggerus tujuan. Sesuaikan anggaran: naikkan tabungan, kurangi impuls.",
    },
    {
      soal:
        "Dalam matriks penting vs mendesak, menabung untuk daftar ulang tahun depan biasanya…",
      pilihan: [
        "Tidak penting dan tidak mendesak",
        "Penting tetapi sering tidak terasa mendesak hari ini — justru harus dijadwalkan",
        "Hanya mendesak jika ada diskon medsos",
        "Boleh diabaikan selama masih SMA",
      ],
      jawaban: 1,
      penjelasan:
        "Tujuan penting jangka menengah mudah tertunda; harus masuk prioritas terjadwal.",
    },
  ],
};
