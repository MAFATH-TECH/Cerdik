import { EDUKASI_COLORS } from "./edukasiTheme";

export const TAG_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  Perbankan: { bg: "#E3F2FD", text: "#1565C0" },
  IKNB: { bg: "#E8F5E9", text: "#1A5C2E" },
  Literasi: { bg: "#FFF8E1", text: "#7A6000" },
  Inflasi: { bg: "#FFF3E0", text: "#E65100" },
  Investasi: { bg: "#E8EAF6", text: "#283593" },
  Risiko: { bg: "#FFEBEE", text: "#C62828" },
  OJK: { bg: "#E0F2F1", text: "#00695C" },
  Prioritas: { bg: "#F3E5F5", text: "#6A1B9A" },
};

export type FilterChipItem = {
  key: string;
  label: string;
};

export const FILTER_CHIP_ITEMS: FilterChipItem[] = [
  { key: "Semua", label: "Semua" },
  { key: "Perbankan", label: "Perbankan" },
  { key: "IKNB", label: "IKNB" },
  { key: "Literasi", label: "Literasi" },
  { key: "Inflasi", label: "Inflasi" },
  { key: "Investasi", label: "Investasi" },
  { key: "Risiko", label: "Risiko" },
  { key: "OJK", label: "OJK" },
  { key: "Prioritas", label: "Prioritas" },
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
