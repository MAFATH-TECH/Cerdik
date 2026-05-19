import AsyncStorage from "@react-native-async-storage/async-storage";

const SKOR_KEY = "cerdik_kuis_skor";
const STATUS_KEY = "cerdik_kuis_status";

export type KuisStatusMap = Record<string, boolean>;

export async function getKuisSkor(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(SKOR_KEY);
    if (!raw) return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export async function getKuisStatus(): Promise<KuisStatusMap> {
  try {
    const raw = await AsyncStorage.getItem(STATUS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as KuisStatusMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Simpan hasil kuis: tambah poin & tandai topik selesai */
export async function simpanHasilKuis(topikId: string, poinDidapat: number): Promise<number> {
  const [skorLama, status] = await Promise.all([getKuisSkor(), getKuisStatus()]);
  const skorBaru = skorLama + poinDidapat;
  const statusBaru = { ...status, [topikId]: true };

  await AsyncStorage.multiSet([
    [SKOR_KEY, String(skorBaru)],
    [STATUS_KEY, JSON.stringify(statusBaru)],
  ]);

  return skorBaru;
}

/** Hapus status selesai topik (untuk kerjakan ulang) */
export async function resetStatusTopikKuis(topikId: string): Promise<void> {
  const status = await getKuisStatus();
  const { [topikId]: _removed, ...rest } = status;
  await AsyncStorage.setItem(STATUS_KEY, JSON.stringify(rest));
}

/** @deprecated gunakan simpanHasilKuis */
export async function selesaikanTopikKuis(topikId: string, poinDidapat: number) {
  const skorBaru = await simpanHasilKuis(topikId, poinDidapat);
  return { skorBaru, baruSelesai: true };
}
