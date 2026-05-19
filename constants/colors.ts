/** Palet dari logo CERDIK (assets/cerdik.jpeg) — disampling dari warna dominan logo */
export const CERDIK_COLORS = {
  /** Hijau tua — huruf C, teks CERDIK, elemen utama */
  primary: "#0E5230",
  /** Hijau sedang — batang grafik tengah, aksen teks */
  secondary: "#5E8E4A",
  /** Hijau daun — aksen ringan */
  tertiary: "#669647",
  /** Emas/kuning — bintang, batang pendek, highlight */
  accent: "#F2BD23",
  /** Emas lebih gelap — peringatan */
  warning: "#D4A017",
  success: "#5E8E4A",
  /** Untuk error validasi & aksi destruktif (kontras terhadap hijau/emas) */
  danger: "#B45309",
  income: "#5E8E4A",
  expense: "#C99A12",
  background: "#F4F8F4",
  card: "#FFFFFF",
  /** Teks utama — hijau tua brand */
  textPrimary: "#0E5230",
  /** Abu-hijau dari tagline logo */
  textSecondary: "#525B59",
  /** Latar tipis untuk badge / kartu peringatan */
  surfaceDanger: "#F9EDE4",
  surfaceWarning: "#FBF5E6",
  surfaceSuccess: "#E8F3E4",
  border: "#DDE8DF",
  muted: "#E8EFE9",
  placeholder: "#94A3B8",
} as const;

/** Warna untuk grafik & kategori — variasi palet logo */
export const CERDIK_CHART_COLORS = [
  CERDIK_COLORS.primary,
  CERDIK_COLORS.secondary,
  CERDIK_COLORS.tertiary,
  CERDIK_COLORS.accent,
  CERDIK_COLORS.warning,
  "#7A9E6A",
  "#0A3D24",
  CERDIK_COLORS.expense,
] as const;
