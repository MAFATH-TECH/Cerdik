import { EDUKASI_COLORS } from "./edukasiTheme";

export const TAG_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  Menabung: { bg: "#E8F5E9", text: "#1A5C2E" },
  Investasi: { bg: "#E3F2FD", text: "#1565C0" },
  Inflasi: { bg: "#FFF3E0", text: "#E65100" },
  Dasar: { bg: "#F5F5F5", text: "#616161" },
  "Belanja Cerdas": { bg: "#F3E5F5", text: "#6A1B9A" },
};

export type FilterChipItem = {
  key: string;
  label: string;
};

export const FILTER_CHIP_ITEMS: FilterChipItem[] = [
  { key: "Semua", label: "Semua" },
  { key: "Dasar", label: "Dasar" },
  { key: "Menabung", label: "Menabung" },
  { key: "Investasi", label: "Investasi" },
  { key: "Inflasi", label: "Inflasi" },
  { key: "Belanja Cerdas", label: "Belanja Cerdas" },
];

/** @deprecated gunakan FILTER_CHIP_ITEMS */
export const FILTER_CHIPS = FILTER_CHIP_ITEMS.map((item) => item.key) as readonly string[];

export type FilterChip = (typeof FILTER_CHIP_ITEMS)[number]["key"];

export function getTagBadgeStyle(tag: string) {
  return TAG_BADGE_COLORS[tag] ?? { bg: EDUKASI_COLORS.cardBg, text: EDUKASI_COLORS.primary };
}

export function getChipLabel(item: FilterChipItem | string | null | undefined, fallback = "Kategori"): string {
  if (item == null) return fallback;
  if (typeof item === "string") {
    const trimmed = item.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  const label = item.label?.trim();
  return label && label.length > 0 ? label : fallback;
}
