import AsyncStorage from "@react-native-async-storage/async-storage";

import { getActiveUserId, scopedKey } from "./accountStorage";

const SKOR_KEY = "cerdik_kuis_skor";
const STATUS_KEY = "cerdik_kuis_status";

export type KuisStatusMap = Record<string, boolean>;

/** Skor & status kuis disimpan per akun; null jika belum ada akun yang login. */
const getKeys = async () => {
  const userId = await getActiveUserId();
  if (!userId) return null;
  return { skor: scopedKey(SKOR_KEY, userId), status: scopedKey(STATUS_KEY, userId) };
};

export async function getKuisSkor(): Promise<number> {
  try {
    const keys = await getKeys();
    if (!keys) return 0;
    const raw = await AsyncStorage.getItem(keys.skor);
    if (!raw) return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export async function getKuisStatus(): Promise<KuisStatusMap> {
  try {
    const keys = await getKeys();
    if (!keys) return {};
    const raw = await AsyncStorage.getItem(keys.status);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as KuisStatusMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Simpan hasil kuis: tambah poin & tandai topik selesai */
export async function simpanHasilKuis(topikId: string, poinDidapat: number): Promise<number> {
  const [skorLama, status, keys] = await Promise.all([getKuisSkor(), getKuisStatus(), getKeys()]);
  const skorBaru = skorLama + poinDidapat;
  const statusBaru = { ...status, [topikId]: true };

  if (keys) {
    await AsyncStorage.multiSet([
      [keys.skor, String(skorBaru)],
      [keys.status, JSON.stringify(statusBaru)],
    ]);
  }

  return skorBaru;
}

/** Hapus status selesai topik (untuk kerjakan ulang) */
export async function resetStatusTopikKuis(topikId: string): Promise<void> {
  const [status, keys] = await Promise.all([getKuisStatus(), getKeys()]);
  if (!keys) return;
  const { [topikId]: _removed, ...rest } = status;
  await AsyncStorage.setItem(keys.status, JSON.stringify(rest));
}

/** @deprecated gunakan simpanHasilKuis */
export async function selesaikanTopikKuis(topikId: string, poinDidapat: number) {
  const skorBaru = await simpanHasilKuis(topikId, poinDidapat);
  return { skorBaru, baruSelesai: true };
}
