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
  { id: "1", judul: "Dasar Keuangan", emoji: "💡", jumlahSoal: 5, poin: 50 },
  { id: "2", judul: "Menabung & Budgeting", emoji: "💰", jumlahSoal: 5, poin: 50 },
  { id: "3", judul: "Inflasi & Ekonomi", emoji: "📈", jumlahSoal: 5, poin: 50 },
  { id: "4", judul: "Investasi Pemula", emoji: "📊", jumlahSoal: 5, poin: 50 },
  { id: "5", judul: "Belanja Cerdas", emoji: "🛍️", jumlahSoal: 5, poin: 50 },
];

export const ARTIKEL_EKONOMI: ArtikelEkonomi[] = [
  {
    id: "1",
    emoji: "📈",
    tag: "Inflasi",
    durasi: "3 menit",
    judul: "Apa Itu Inflasi dan Kenapa Harga Terus Naik?",
    ringkasan: "Inflasi membuat nilai uangmu berkurang setiap tahun. Pelajari cara menghadapinya.",
    isi: [
      {
        type: "paragraph",
        text: "Inflasi adalah kondisi ketika harga barang dan jasa secara umum naik terus-menerus dalam jangka waktu tertentu. Ini berarti nilai uang berkurang — uang Rp 10.000 hari ini tidak bisa beli sebanyak 5 tahun lalu.",
      },
      { type: "heading", text: "Kenapa Inflasi Terjadi?" },
      {
        type: "bullet",
        items: [
          "Terlalu banyak uang beredar di masyarakat",
          "Permintaan barang lebih tinggi dari pasokan",
          "Naiknya biaya produksi (BBM, bahan baku)",
        ],
      },
      {
        type: "highlight",
        text: "Dampak bagi pelajar: Uang sakumu yang nilainya tetap tapi harga jajan naik = daya belimu berkurang. Solusinya? Mulai menabung dan investasi sejak sekarang!",
      },
    ],
  },
  {
    id: "2",
    emoji: "💰",
    tag: "Menabung",
    durasi: "4 menit",
    judul: "Rumus 50/30/20 untuk Atur Uang Saku",
    ringkasan: "Cara paling mudah membagi uang saku agar tidak boros setiap bulan.",
    isi: [
      {
        type: "paragraph",
        text: "Rumus 50/30/20 adalah cara sederhana membagi pendapatan yang dikenal luas di dunia perencanaan keuangan.",
      },
      { type: "heading", text: "Pembagiannya:" },
      {
        type: "bullet",
        items: [
          "50% untuk KEBUTUHAN: makan, ongkos, fotokopi",
          "30% untuk KEINGINAN: jajan, nonton, game",
          "20% untuk TABUNGAN: simpan sebelum dipakai!",
        ],
      },
      {
        type: "highlight",
        text: "Contoh uang saku Rp 500.000/bulan: Kebutuhan Rp 250.000 | Keinginan Rp 150.000 | Tabungan Rp 100.000",
      },
      {
        type: "paragraph",
        text: "Tips terpenting: Langsung pisahkan 20% begitu dapat uang saku, bukan menabung dari sisanya!",
      },
    ],
  },
  {
    id: "3",
    emoji: "🤔",
    tag: "Dasar",
    durasi: "2 menit",
    judul: "Bedanya Kebutuhan dan Keinginan",
    ringkasan: "Kenali perbedaan needs vs wants agar tidak kalap belanja.",
    isi: [
      {
        type: "paragraph",
        text: "KEBUTUHAN adalah hal yang harus dipenuhi untuk bertahan hidup dan sekolah: makan, ongkos, alat tulis.",
      },
      {
        type: "paragraph",
        text: "KEINGINAN adalah hal yang diinginkan tapi bisa ditunda: bubble tea, outfit baru, game terbaru.",
      },
      { type: "heading", text: "Trik Sederhana Sebelum Beli:" },
      {
        type: "highlight",
        text: 'Tanyakan: "Apakah hidupku terganggu jika tidak membeli ini?" Jika TIDAK → keinginan, pikir dua kali. Jika YA → kebutuhan, boleh beli.',
      },
      {
        type: "paragraph",
        text: "Latihan 24 jam: Kalau mau beli sesuatu yang mahal, tunggu 24 jam. Kalau masih mau beli, baru beli.",
      },
    ],
  },
  {
    id: "4",
    emoji: "🏦",
    tag: "Menabung",
    durasi: "5 menit",
    judul: "Mengenal Rekening Tabungan Pelajar",
    ringkasan: "Panduan membuka tabungan pertama dan memilih bank yang tepat.",
    isi: [
      {
        type: "paragraph",
        text: "Punya rekening tabungan sendiri adalah langkah pertama menuju kebebasan finansial.",
      },
      { type: "heading", text: "Tabungan SimPel (Simpanan Pelajar):" },
      {
        type: "bullet",
        items: [
          "Setoran awal sangat kecil (Rp 5.000 - Rp 50.000)",
          "Tanpa biaya administrasi bulanan",
          "Bisa dibuka hanya dengan kartu pelajar",
        ],
      },
      { type: "heading", text: "Cara Memilih Bank:" },
      {
        type: "bullet",
        items: [
          "Lokasi ATM terdekat dari sekolah/rumah",
          "Ada aplikasi mobile banking yang mudah",
          "Biaya transfer yang terjangkau",
        ],
      },
      {
        type: "highlight",
        text: "Tips: Buat rekening terpisah untuk tabungan tujuan tertentu agar tidak tergoda menggunakannya.",
      },
    ],
  },
  {
    id: "5",
    emoji: "📊",
    tag: "Investasi",
    durasi: "6 menit",
    judul: "Apa Itu Investasi? Apakah Cocok untuk Pelajar?",
    ringkasan: "Kenalan dengan dunia investasi yang aman untuk pemula.",
    isi: [
      {
        type: "paragraph",
        text: "Investasi adalah menempatkan uang agar nilainya bertumbuh seiring waktu. Berbeda dengan menabung, investasi punya potensi keuntungan lebih besar tapi juga ada risiko.",
      },
      { type: "heading", text: "Investasi Aman untuk Pelajar:" },
      {
        type: "bullet",
        items: [
          "Reksa Dana Pasar Uang — risiko rendah, mulai Rp 10.000 (Bibit, Bareksa)",
          "Tabungan Emas — beli emas digital mulai Rp 10.000 (Pegadaian Digital)",
          "Obligasi Negara (ORI/SBR) — dijamin pemerintah, minimal Rp 1.000.000",
        ],
      },
      {
        type: "highlight",
        text: "⚠️ HINDARI: Trading saham individual, crypto, dan investasi dengan janji untung pasti — kemungkinan besar penipuan!",
      },
    ],
  },
  {
    id: "6",
    emoji: "🛍️",
    tag: "Belanja Cerdas",
    durasi: "3 menit",
    judul: "Cara Belanja Cerdas Tanpa Kalap",
    ringkasan: "Strategi anti-boros saat belanja online maupun offline.",
    isi: [
      { type: "heading", text: "Sebelum Belanja Online:" },
      {
        type: "bullet",
        items: [
          "Buat wishlist, tunggu minimal 3 hari",
          "Bandingkan harga di minimal 3 toko",
          "Hitung total termasuk ongkir sebelum checkout",
        ],
      },
      { type: "heading", text: "Jebakan Psikologis yang Perlu Diwaspadai:" },
      {
        type: "bullet",
        items: [
          'Anchoring: Harga coret yang dibuat-buat tinggi',
          'FOMO: "Sisa 3 barang!" (padahal selalu ada)',
          'Bundle: Dipaksa beli lebih banyak untuk "hemat"',
        ],
      },
      {
        type: "highlight",
        text: "Ingat: diskon bukan alasan untuk beli sesuatu yang tidak dibutuhkan. Hemat 50% tapi tetap keluar uang = bukan penghematan!",
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
  "1": [
    {
      soal: "Apa perbedaan utama antara kebutuhan dan keinginan?",
      pilihan: [
        "Kebutuhan lebih mahal dari keinginan",
        "Kebutuhan harus dipenuhi, keinginan bisa ditunda",
        "Keinginan lebih penting",
        "Keduanya sama",
      ],
      jawaban: 1,
      penjelasan:
        "Kebutuhan adalah hal esensial untuk hidup, keinginan bisa ditunda tanpa mengganggu kelangsungan hidup.",
    },
    {
      soal: "Rumus 50/30/20 membagi uang untuk?",
      pilihan: ["Tabungan/Investasi/Hiburan", "Kebutuhan/Keinginan/Tabungan", "Makanan/Transportasi/Lainnya", "Online/Offline/Cash"],
      jawaban: 1,
      penjelasan: "50% kebutuhan, 30% keinginan, 20% wajib ditabung.",
    },
    {
      soal: "Mana yang termasuk kebutuhan pelajar?",
      pilihan: ["Boba tea", "Ongkos sekolah", "Game online", "Baju baru"],
      jawaban: 1,
      penjelasan: "Ongkos sekolah adalah kebutuhan karena tanpanya kamu tidak bisa pergi ke sekolah.",
    },
    {
      soal: "Tujuan utama mencatat pengeluaran setiap hari?",
      pilihan: [
        "Pamer ke teman",
        "Syarat beasiswa",
        "Mengetahui ke mana uang pergi & mengontrol pengeluaran",
        "Tugas sekolah",
      ],
      jawaban: 2,
      penjelasan: "Mencatat pengeluaran membuat kamu sadar ke mana uangmu pergi.",
    },
    {
      soal: '"Bayar diri sendiri dulu" artinya?',
      pilihan: [
        "Beli kebutuhan sebelum bayar hutang",
        "Simpan tabungan sebelum membelanjakan sisa",
        "Belanja dulu, menabung dari sisa",
        "Beli barang termurah",
      ],
      jawaban: 1,
      penjelasan: "Sisihkan jatah tabungan begitu dapat uang saku, baru belanjakan sisanya.",
    },
  ],
  "2": [
    {
      soal: "Kapan waktu terbaik menyisihkan tabungan?",
      pilihan: ["Akhir bulan jika ada sisa", "Saat ada promo cashback", "Langsung saat menerima uang saku", "Saat harga turun"],
      jawaban: 2,
      penjelasan: "Prinsip pay yourself first: sisihkan tabungan pertama kali begitu dapat uang.",
    },
    {
      soal: "Dana darurat idealnya berapa bulan pengeluaran?",
      pilihan: ["1 bulan", "3-6 bulan", "10 bulan", "2 tahun"],
      jawaban: 1,
      penjelasan: "Dana darurat 3-6 bulan pengeluaran adalah standar untuk menghadapi kejadian tak terduga.",
    },
    {
      soal: "Kebiasaan paling membantu hemat makan?",
      pilihan: ["Makan di restoran mahal", "Skip makan siang", "Bawa bekal dari rumah", "Makan sekali sehari"],
      jawaban: 2,
      penjelasan: "Membawa bekal bisa menghemat 20-30% pengeluaran makan.",
    },
    {
      soal: 'Bahaya menabung dari "sisa belanja"?',
      pilihan: [
        "Tidak ada bahaya",
        "Tabungan tidak konsisten dan sering tidak ada sisa",
        "Uang menjadi banyak",
        "Lebih sulit dihitung",
      ],
      jawaban: 1,
      penjelasan: "Jika menabung dari sisa, pengeluaran cenderung menghabiskan semua uang.",
    },
    {
      soal: "Goal tabungan yang baik harus?",
      pilihan: ["Abstrak dan umum", "Spesifik, terukur, dan punya deadline", "Sebesar mungkin", "Rahasia"],
      jawaban: 1,
      penjelasan: "Goal baik mengikuti prinsip SMART: Specific, Measurable, Achievable, Relevant, Time-bound.",
    },
  ],
  "3": [
    {
      soal: "Inflasi adalah...",
      pilihan: [
        "Turunnya harga barang",
        "Naiknya harga barang secara umum dalam jangka tertentu",
        "Bertambahnya jumlah barang",
        "Kebijakan turunkan pajak",
      ],
      jawaban: 1,
      penjelasan: "Inflasi adalah kenaikan harga secara umum yang menyebabkan daya beli uang menurun.",
    },
    {
      soal: "Dampak inflasi terhadap tabungan?",
      pilihan: [
        "Tabungan bertambah otomatis",
        "Daya beli berkurang jika bunga lebih rendah dari inflasi",
        "Tidak terpengaruh",
        "Menjadi lebih berharga",
      ],
      jawaban: 1,
      penjelasan: "Jika inflasi 5% tapi bunga tabungan 3%, nilai riil tabunganmu berkurang 2%.",
    },
    {
      soal: "Bank Indonesia naikkan suku bunga untuk?",
      pilihan: [
        "Kredit lebih murah",
        "Kendalikan inflasi dengan kurangi peredaran uang",
        "Turunkan semua harga seketika",
        "Percepat pertumbuhan ekonomi",
      ],
      jawaban: 1,
      penjelasan: "Suku bunga tinggi membuat kredit mahal, mengurangi pengeluaran sehingga inflasi terkendali.",
    },
    {
      soal: "Mana yang BUKAN penyebab inflasi?",
      pilihan: [
        "Terlalu banyak uang beredar",
        "Permintaan melebihi pasokan",
        "Naiknya biaya produksi",
        "Meningkatnya tabungan masyarakat",
      ],
      jawaban: 3,
      penjelasan: "Meningkatnya tabungan justru mengurangi peredaran uang sehingga menekan inflasi.",
    },
    {
      soal: "Cara efektif melindungi uang dari inflasi?",
      pilihan: [
        "Simpan uang tunai di rumah",
        "Beli barang sebanyak mungkin sekarang",
        "Investasi pada instrumen dengan return di atas inflasi",
        "Tidak perlu dilakukan",
      ],
      jawaban: 2,
      penjelasan: "Investasi pada reksa dana, saham, atau emas bertujuan return di atas inflasi.",
    },
  ],
  "4": [
    {
      soal: "Investasi paling cocok untuk pelajar pemula?",
      pilihan: ["Saham gorengan", "Trading kripto harian", "Reksa dana pasar uang", "Forex trading"],
      jawaban: 2,
      penjelasan: "Reksa dana pasar uang punya risiko rendah, bisa mulai dari Rp 10.000.",
    },
    {
      soal: '"Jangan taruh semua telur dalam satu keranjang" disebut?',
      pilihan: ["Konsistensi", "Diversifikasi", "Spekulasi", "Akumulasi"],
      jawaban: 1,
      penjelasan: "Diversifikasi artinya menyebar investasi agar jika satu merugi yang lain bisa menutupi.",
    },
    {
      soal: "Tanda investasi bodong?",
      pilihan: [
        "Return 7-9% per tahun",
        "Terdaftar di OJK",
        "Menjanjikan untung pasti 50% per bulan",
        "Ada risiko kerugian",
      ],
      jawaban: 2,
      penjelasan: "Tidak ada investasi legal yang menjamin keuntungan besar tanpa risiko.",
    },
    {
      soal: "Keuntungan mulai investasi sejak pelajar?",
      pilihan: [
        "Tidak ada keuntungannya",
        "Bisa pamer ke teman",
        "Mendapat manfaat compounding lebih lama",
        "Bebas pajak otomatis",
      ],
      jawaban: 2,
      penjelasan: "Compounding bekerja seiring waktu. Semakin awal mulai, semakin besar manfaatnya.",
    },
    {
      soal: "Sebelum investasi, yang harus disiapkan?",
      pilihan: [
        "Modal minimal Rp 10 juta",
        "Hutang lunas dan dana darurat",
        "Akun di semua platform",
        "Rekomendasi influencer",
      ],
      jawaban: 1,
      penjelasan: "Lunasi hutang berbunga tinggi dan siapkan dana darurat sebelum investasi.",
    },
  ],
  "5": [
    {
      soal: '"Anchoring" dalam psikologi belanja adalah?',
      pilihan: [
        "Menambatkan kapal",
        "Terpengaruh harga pertama sebagai patokan",
        "Membeli barang berat",
        "Bayar dengan kredit",
      ],
      jawaban: 1,
      penjelasan: "Anchoring terjadi saat toko menampilkan harga coret agar harga jual terasa murah.",
    },
    {
      soal: "Strategi menghindari belanja impulsif?",
      pilihan: [
        "Belanja saat lapar",
        "Buka marketplace setiap hari",
        "Tunggu 24-48 jam sebelum beli",
        "Ikuti semua flash sale",
      ],
      jawaban: 2,
      penjelasan: "Menunggu 24-48 jam memberi waktu otak untuk mempertimbangkan kebutuhan nyata.",
    },
    {
      soal: '"Gratis ongkir min. Rp 100.000" membuat kamu...',
      pilihan: [
        "Selalu untung",
        "Cenderung tambah barang tidak perlu",
        "Hemat lebih banyak",
        "Cashback otomatis",
      ],
      jawaban: 1,
      penjelasan: "Ini trik toko untuk meningkatkan nilai transaksi.",
    },
    {
      soal: "Waktu belanja kebutuhan sekolah paling hemat?",
      pilihan: [
        "H-1 masuk sekolah",
        "Awal semester sekaligus saat promo",
        "Setiap hari sedikit-sedikit",
        "Flash sale tengah malam",
      ],
      jawaban: 1,
      penjelasan: "Awal semester memungkinkan belanja dengan tenang dan bandingkan harga.",
    },
    {
      soal: "Pertanda belanja cerdas?",
      pilihan: [
        "Selalu beli merek termahal",
        "Bandingkan harga, beli sesuai kebutuhan, tahu budget",
        "Beli semua barang saat diskon",
        "Tidak pernah beli apapun",
      ],
      jawaban: 1,
      penjelasan: "Belanja cerdas bukan berarti termurah, tapi nilai terbaik sesuai kemampuan.",
    },
  ],
};
